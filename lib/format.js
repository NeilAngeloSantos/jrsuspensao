export const paymentLabels = {
  dinheiro: "Dinheiro",
  credito: "Crédito",
  pix: "Pix",
};

export const modeLabels = {
  in: "Entrada",
  out: "Saída",
};

export function formatCurrency(cents = 0) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((Number(cents) || 0) / 100);
}

export function parseCurrencyToCents(value) {
  if (typeof value === "number") {
    return Math.round(value * 100);
  }

  const onlyDigits = String(value || "").replace(/\D/g, "");
  if (!onlyDigits) {
    return 0;
  }

  return Number(onlyDigits);
}

export function formatInputCurrency(value) {
  const cents = parseCurrencyToCents(value);
  if (!cents) {
    return "";
  }

  return formatCurrency(cents);
}

export function isoDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}
