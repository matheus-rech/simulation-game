const { getStructureForMeshName } = require("../anatomy/NasalCavity");
const { handleCollision } = require("../physics/CollisionHandler");

class EndoscopeRig {
  constructor({ onCollision } = {}) {
    this.onCollision = onCollision;
  }

  onCollision(hit) {
    if (!hit) {
      return null;
    }

    const structure = getStructureForMeshName(hit.objectName);
    const outcome = handleCollision({
      structure,
      distance: hit.distance,
      normal: hit.normal,
      force: hit.force,
      metadata: { source: "endoscope-rig" },
    });

    if (this.onCollision) {
      this.onCollision(outcome);
    }

    return outcome;
  }
}

module.exports = EndoscopeRig;
