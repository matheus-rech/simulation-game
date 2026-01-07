import React, { useContext, useMemo } from "react";

import { FidelityContext } from "../App";

export const EndoscopeView = () => {
  const { fidelity, prefersReducedMotion } = useContext(FidelityContext);

  const postProcessingEnabled =
    fidelity === "high" && prefersReducedMotion === false;

  const particleCount = useMemo(() => {
    if (postProcessingEnabled) {
      return 3200;
    }

    return 1200;
  }, [postProcessingEnabled]);

  return (
    <section>
      <h2>Endoscope View</h2>
      <p>
        Post-processing (Bloom/DOF/Noise):{" "}
        {postProcessingEnabled ? "enabled" : "disabled"}
      </p>
      <p>Particle count: {particleCount}</p>
    </section>
  );
};
