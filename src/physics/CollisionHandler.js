const DEFAULT_THRESHOLDS = {
  minor: 0.4,
  major: 0.75,
  fatal: 1.15,
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function computeForceProxy({ distance, normal, force } = {}) {
  if (Number.isFinite(force)) {
    return force;
  }

  const distanceValue = Number.isFinite(distance) ? distance : 1;
  const normalValue = Number.isFinite(normal) ? normal : 0.5;
  const distanceFactor = 1 / Math.max(distanceValue, 0.05);
  const normalFactor = clamp(normalValue, 0, 1);
  return distanceFactor * (0.5 + normalFactor);
}

function getSeverity(forceProxy, thresholds = DEFAULT_THRESHOLDS) {
  if (forceProxy >= thresholds.fatal) {
    return "fatal";
  }
  if (forceProxy >= thresholds.major) {
    return "major";
  }
  if (forceProxy >= thresholds.minor) {
    return "minor";
  }
  return "none";
}

function handleCollision({
  structure,
  distance,
  normal,
  force,
  thresholds,
  metadata = {},
}) {
  const forceProxy = computeForceProxy({ distance, normal, force });
  const severity = getSeverity(forceProxy, thresholds);

  return {
    structureId: structure?.id || "unknown",
    label: structure?.label || "Unknown Structure",
    severity,
    forceProxy,
    metadata,
  };
}

module.exports = {
  DEFAULT_THRESHOLDS,
  computeForceProxy,
  getSeverity,
  handleCollision,
};
