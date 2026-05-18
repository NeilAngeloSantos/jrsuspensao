import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  throw new Error(
    "Missing DATABASE_URL environment variable. Configure it in .env or .env.local."
  );
}

const pool = globalThis.cashFlowDbPool || new Pool({ connectionString });
if (!globalThis.cashFlowDbPool) {
  globalThis.cashFlowDbPool = pool;
  pool.on("error", (error) => {
    console.error("PostgreSQL pool error:", error);
  });
}

let schemaEnsured = globalThis.cashFlowSchemaEnsured || false;

async function getPool() {
  if (!schemaEnsured) {
    await ensureSchema(pool);
    schemaEnsured = true;
    globalThis.cashFlowSchemaEnsured = true;
  }
  return pool;
}

async function ensureSchema(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS cash_days (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL UNIQUE,
      opening_cents INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      vehicle_plate TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS cash_movements (
      id SERIAL PRIMARY KEY,
      cash_day_id INTEGER NOT NULL REFERENCES cash_days(id) ON DELETE CASCADE,
      mode TEXT NOT NULL CHECK (mode IN ('in', 'out')),
      description TEXT NOT NULL,
      amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
      payment_type TEXT NOT NULL CHECK (payment_type IN ('dinheiro', 'credito', 'pix')),
      client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
      payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending')),
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.query(`ALTER TABLE cash_movements ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL`);
  await db.query(`ALTER TABLE cash_movements ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending'))`);
  await db.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS vehicle_plate TEXT`);
}

async function ensureCashDay(date) {
  const db = await getPool();
  await db.query(
    `INSERT INTO cash_days (date) VALUES ($1) ON CONFLICT (date) DO NOTHING`,
    [date]
  );

  const result = await db.query(`SELECT * FROM cash_days WHERE date = $1`, [date]);
  return plainRow(result.rows[0]);
}

export async function getCashDay(date) {
  const day = await ensureCashDay(date);
  const db = await getPool();
  const result = await db.query(
    `SELECT
       cm.id,
       cm.mode,
       cm.description,
       cm.amount_cents,
       cm.payment_type,
       cm.payment_status,
       cm.client_id,
       c.name as client_name,
       c.vehicle_plate as client_vehicle_plate,
       cm.occurred_at
     FROM cash_movements cm
     LEFT JOIN clients c ON c.id = cm.client_id
     WHERE cm.cash_day_id = $1
     ORDER BY cm.occurred_at DESC, cm.id DESC`,
    [day.id]
  );

  const movements = result.rows.map(plainRow);

  return {
    day,
    movements,
    summary: summarize(day.opening_cents, movements),
  };
}

export async function setOpeningAmount(date, openingCents) {
  const db = await getPool();
  await ensureCashDay(date);
  await db.query(
    `UPDATE cash_days SET opening_cents = $1, updated_at = CURRENT_TIMESTAMP WHERE date = $2`,
    [openingCents, date]
  );
  return getCashDay(date);
}

export async function createMovement({
  date,
  mode,
  description,
  amountCents,
  paymentType,
  clientId,
  paymentStatus = "paid",
}) {
  const db = await getPool();
  const day = await ensureCashDay(date);

  await db.query(
    `INSERT INTO cash_movements
      (cash_day_id, mode, description, amount_cents, payment_type, client_id, payment_status, occurred_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
    [
      day.id,
      mode,
      description,
      amountCents,
      paymentType,
      clientId || null,
      paymentStatus,
    ]
  );

  return getCashDay(date);
}

export async function updateMovement({
  id,
  mode,
  description,
  amountCents,
  paymentType,
  clientId,
  paymentStatus,
}) {
  const db = await getPool();
  const rowResult = await db.query(
    `SELECT cd.date
       FROM cash_movements cm
       JOIN cash_days cd ON cd.id = cm.cash_day_id
       WHERE cm.id = $1`,
    [id]
  );

  const row = rowResult.rows[0];
  if (!row) {
    return null;
  }

  await db.query(
    `UPDATE cash_movements
     SET mode = $1,
         description = $2,
         amount_cents = $3,
         payment_type = $4,
         client_id = $5,
         payment_status = $6
     WHERE id = $7`,
    [mode, description, amountCents, paymentType, clientId || null, paymentStatus, id]
  );

  return getCashDay(row.date);
}

export async function updateMovementPaymentStatus(id, paymentStatus) {
  const db = await getPool();
  const rowResult = await db.query(
    `SELECT cd.date
       FROM cash_movements cm
       JOIN cash_days cd ON cd.id = cm.cash_day_id
       WHERE cm.id = $1`,
    [id]
  );

  const row = rowResult.rows[0];
  if (!row) {
    return null;
  }

  await db.query(`UPDATE cash_movements SET payment_status = $1 WHERE id = $2`, [paymentStatus, id]);
  return getCashDay(row.date);
}

export async function deleteMovement(id) {
  const db = await getPool();
  const rowResult = await db.query(
    `SELECT cd.date
       FROM cash_movements cm
       JOIN cash_days cd ON cd.id = cm.cash_day_id
       WHERE cm.id = $1`,
    [id]
  );

  const row = rowResult.rows[0];
  if (!row) {
    return null;
  }

  await db.query(`DELETE FROM cash_movements WHERE id = $1`, [id]);
  return getCashDay(row.date);
}

export async function getDashboard(year) {
  const db = await getPool();
  const result = await db.query(
    `SELECT
       TO_CHAR(cd.date, 'MM') as month,
       SUM(CASE WHEN cm.mode = 'in' THEN cm.amount_cents ELSE 0 END) as incoming_cents,
       SUM(CASE WHEN cm.mode = 'out' THEN cm.amount_cents ELSE 0 END) as outgoing_cents,
       COUNT(cm.id) as movements
     FROM cash_days cd
     LEFT JOIN cash_movements cm
       ON cm.cash_day_id = cd.id
      AND cm.payment_status = 'paid'
     WHERE TO_CHAR(cd.date, 'YYYY') = $1
     GROUP BY month
     ORDER BY month`,
    [String(year)]
  );

  const rows = result.rows.map(plainRow);
  const months = Array.from({ length: 12 }, (_, index) => {
    const monthNumber = String(index + 1).padStart(2, "0");
    const found = rows.find((row) => row.month === monthNumber);
    const incoming = Number(found?.incoming_cents || 0);
    const outgoing = Number(found?.outgoing_cents || 0);

    return {
      month: monthNumber,
      incomingCents: incoming,
      outgoingCents: outgoing,
      balanceCents: incoming - outgoing,
      movements: Number(found?.movements || 0),
    };
  });

  const totals = months.reduce(
    (acc, month) => ({
      incomingCents: acc.incomingCents + month.incomingCents,
      outgoingCents: acc.outgoingCents + month.outgoingCents,
      balanceCents: acc.balanceCents + month.balanceCents,
      movements: acc.movements + month.movements,
    }),
    { incomingCents: 0, outgoingCents: 0, balanceCents: 0, movements: 0 }
  );

  return { year, months, totals };
}

export async function getAvailableDashboardYears() {
  const db = await getPool();
  const result = await db.query(
    `SELECT DISTINCT TO_CHAR(date, 'YYYY') as year
     FROM cash_days
     ORDER BY year DESC`
  );

  return result.rows.map((row) => Number(row.year)).filter(Boolean);
}

export async function getDashboardMonthDays(year, month) {
  const db = await getPool();
  const result = await db.query(
    `SELECT
       TO_CHAR(cd.date, 'YYYY-MM-DD') as date,
       COALESCE(SUM(CASE WHEN cm.payment_status = 'paid' AND cm.mode = 'in' THEN cm.amount_cents ELSE 0 END), 0) as incoming_cents,
       COALESCE(SUM(CASE WHEN cm.payment_status = 'paid' AND cm.mode = 'out' THEN cm.amount_cents ELSE 0 END), 0) as outgoing_cents,
       COUNT(cm.id) FILTER (WHERE cm.payment_status = 'paid') as movements,
       COUNT(cm.id) FILTER (WHERE cm.payment_status = 'pending') as pending_movements,
       COALESCE(SUM(CASE WHEN cm.payment_status = 'pending' THEN cm.amount_cents ELSE 0 END), 0) as pending_cents
     FROM cash_days cd
     LEFT JOIN cash_movements cm ON cm.cash_day_id = cd.id
     WHERE TO_CHAR(cd.date, 'YYYY') = $1
       AND TO_CHAR(cd.date, 'MM') = $2
     GROUP BY cd.date
     ORDER BY cd.date`,
    [String(year), String(month).padStart(2, "0")]
  );

  return result.rows.map((row) => {
    const incoming = Number(row.incoming_cents || 0);
    const outgoing = Number(row.outgoing_cents || 0);

    return {
      date: row.date,
      incomingCents: incoming,
      outgoingCents: outgoing,
      balanceCents: incoming - outgoing,
      movements: Number(row.movements || 0),
      pendingMovements: Number(row.pending_movements || 0),
      pendingCents: Number(row.pending_cents || 0),
    };
  });
}

export async function getPendingSummary() {
  const db = await getPool();
  const result = await db.query(
    `SELECT COUNT(*) as count, COALESCE(SUM(amount_cents), 0) as amount_cents
     FROM cash_movements
     WHERE payment_status = 'pending'`
  );

  const row = plainRow(result.rows[0]);
  return {
    count: Number(row?.count || 0),
    amountCents: Number(row?.amount_cents || 0),
  };
}

export async function listPendingMovements() {
  const db = await getPool();
  const result = await db.query(
    `SELECT
       cm.id,
       cd.date,
       cm.mode,
       cm.description,
       cm.amount_cents,
       cm.payment_type,
       cm.payment_status,
       cm.client_id,
       c.name as client_name,
       c.vehicle_plate as client_vehicle_plate,
       cm.occurred_at
     FROM cash_movements cm
     JOIN cash_days cd ON cd.id = cm.cash_day_id
     LEFT JOIN clients c ON c.id = cm.client_id
     WHERE cm.payment_status = 'pending'
     ORDER BY cm.occurred_at ASC, cm.id ASC`
  );

  return result.rows.map(plainRow);
}

export async function listClients() {
  const db = await getPool();
  const result = await db.query(
    "SELECT id, name, phone, email, vehicle_plate, created_at FROM clients ORDER BY name"
  );

  return result.rows.map(plainRow);
}

export async function createClient({ name, phone, email, vehiclePlate }) {
  const db = await getPool();
  await db.query(
    "INSERT INTO clients (name, phone, email, vehicle_plate) VALUES ($1, $2, $3, $4)",
    [name, phone || null, email || null, vehiclePlate || null]
  );

  return listClients();
}

export async function updateClient({ id, name, phone, email, vehiclePlate }) {
  const db = await getPool();
  const result = await db.query(
    `UPDATE clients
     SET name = $1,
         phone = $2,
         email = $3,
         vehicle_plate = $4
     WHERE id = $5`,
    [name, phone || null, email || null, vehiclePlate || null, id]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return listClients();
}

export async function deleteClient(id) {
  const db = await getPool();
  await db.query("DELETE FROM clients WHERE id = $1", [id]);
  return listClients();
}

function summarize(openingCents, movements) {
  const base = {
    openingCents: Number(openingCents || 0),
    incomingCents: 0,
    outgoingCents: 0,
    cashCents: Number(openingCents || 0),
    byPaymentType: {
      dinheiro: { count: 0, cents: 0 },
      credito: { count: 0, cents: 0 },
      pix: { count: 0, cents: 0 },
    },
  };

  for (const movement of movements) {
    if (movement.payment_status === "pending") {
      continue;
    }

    const cents = Number(movement.amount_cents || 0);
    const bucket = base.byPaymentType[movement.payment_type];
    bucket.count += 1;
    bucket.cents += movement.mode === "in" ? cents : -cents;

    if (movement.mode === "in") {
      base.incomingCents += cents;
      if (movement.payment_type === "dinheiro") {
        base.cashCents += cents;
      }
    } else {
      base.outgoingCents += cents;
      if (movement.payment_type === "dinheiro") {
        base.cashCents -= cents;
      }
    }
  }

  return {
    ...base,
    balanceCents: base.incomingCents - base.outgoingCents,
    totalCents: base.openingCents + base.incomingCents - base.outgoingCents,
  };
}

function plainRow(row) {
  return row ? { ...row } : row;
}
