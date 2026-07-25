const { getStructureForMeshName } = require("../anatomy/NasalCavity");
const { handleCollision } = require("./CollisionHandler");

class CollisionDetector {
  constructor({ onCollision } = {}) {
    this.onCollision = onCollision;
  }

  processHit(result) {
    if (!result) {
      return null;
    }

    const structure = getStructureForMeshName(result.meshName);
    const outcome = handleCollision({
      structure,
      distance: result.distance,
      normal: result.normal,
      force: result.force,
      metadata: { source: "collision-detector" },
    });

    if (typeof this.onCollision === "function") {
      this.onCollision(outcome);
    }

    return outcome;
  }
}

module.exports = CollisionDetector;
