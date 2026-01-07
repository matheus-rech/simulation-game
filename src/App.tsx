import React, { createContext, useEffect, useMemo, useState } from "react";

import { EndoscopeView } from "./components/EndoscopeView";

export type FidelitySetting = "balanced" | "high";

type FidelityContextValue = {
  fidelity: FidelitySetting;
  setFidelity: (setting: FidelitySetting) => void;
  prefersReducedMotion: boolean;
};

export const FidelityContext = createContext<FidelityContextValue>({
  fidelity: "balanced",
  setFidelity: () => undefined,
  prefersReducedMotion: false,
});

const getDefaultFidelity = (): FidelitySetting => {
  if (typeof window === "undefined") {
    return "balanced";
  }

  const reducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reducedMotion) {
    return "balanced";
  }

  const memory = navigator.deviceMemory ?? 0;
  const cores = navigator.hardwareConcurrency ?? 0;

  if (memory >= 8 || cores >= 8) {
    return "high";
  }

  return "balanced";
};

export const App = () => {
  const [fidelity, setFidelity] = useState<FidelitySetting>(() =>
    getDefaultFidelity()
  );
  const [prefersReducedMotion, setPrefersReducedMotion] =
    useState<boolean>(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    setPrefersReducedMotion(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  const contextValue = useMemo(
    () => ({ fidelity, setFidelity, prefersReducedMotion }),
    [fidelity, prefersReducedMotion]
  );

  return (
    <FidelityContext.Provider value={contextValue}>
      <main>
        <header>
          <h1>NeuroSim</h1>
          <label>
            <input
              type="checkbox"
              checked={fidelity === "high"}
              onChange={(event) =>
                setFidelity(event.target.checked ? "high" : "balanced")
              }
            />
            High Fidelity
          </label>
          <p>
            Mode: {fidelity}
            {prefersReducedMotion ? " (reduced motion detected)" : ""}
          </p>
        </header>
        <EndoscopeView />
      </main>
    </FidelityContext.Provider>
  );
};
