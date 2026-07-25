const STRUCTURES = {
  septum: {
    id: "septum",
    label: "Nasal Septum",
    meshNames: ["Septum", "NasalSeptum", "septum_mesh", "septum"],
  },
  turbinate: {
    id: "turbinate",
    label: "Nasal Turbinate",
    meshNames: ["Turbinate", "InferiorTurbinate", "MiddleTurbinate", "turbinate"],
  },
  carotid: {
    id: "carotid",
    label: "Internal Carotid Artery",
    meshNames: ["Carotid", "ICA", "InternalCarotid", "carotid"],
  },
};

const MESH_LOOKUP = Object.values(STRUCTURES).reduce((lookup, structure) => {
  structure.meshNames.forEach((meshName) => {
    lookup[meshName.toLowerCase()] = structure;
  });
  return lookup;
}, {});

function getStructureForMeshName(meshName) {
  if (typeof meshName !== "string" || meshName.length === 0) {
    return null;
  }

  return MESH_LOOKUP[meshName.toLowerCase()] || null;
}

function getStructureById(id) {
  return STRUCTURES[id] || null;
}

module.exports = {
  STRUCTURES,
  getStructureForMeshName,
  getStructureById,
};
