"use client";

import { createContext, useContext, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const ValueVisibilityContext = createContext(null);
const hiddenValue = "R$ ****";

export function ValueVisibilityProvider({ children }) {
  const [valuesVisible, setValuesVisible] = useState(false);

  return (
    <ValueVisibilityContext.Provider value={{ valuesVisible, setValuesVisible }}>
      {children}
    </ValueVisibilityContext.Provider>
  );
}

export function useValueVisibility() {
  const context = useContext(ValueVisibilityContext);

  if (!context) {
    throw new Error("useValueVisibility must be used within ValueVisibilityProvider");
  }

  return context;
}

export function ValueVisibilityButton() {
  const { valuesVisible, setValuesVisible } = useValueVisibility();

  return (
    <button
      aria-label={valuesVisible ? "Ocultar valores" : "Exibir valores"}
      aria-pressed={valuesVisible}
      className="inline-grid size-11 place-items-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-emerald-700"
      onClick={() => setValuesVisible((current) => !current)}
      title={valuesVisible ? "Ocultar valores" : "Exibir valores"}
      type="button"
    >
      {valuesVisible ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );
}

export function HiddenValue({ children }) {
  const { valuesVisible } = useValueVisibility();

  return valuesVisible ? children : hiddenValue;
}

export function getHiddenValue() {
  return hiddenValue;
}
