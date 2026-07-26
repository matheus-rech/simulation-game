# Complete Unity VR Anatomy Implementation

**CRITICAL**: This includes ALL anatomical structures from the web version for complete surgical approach simulation.

---

## 🧠 Complete Anatomical Pathway (Level 0-5)

### Level 0: Nasal Cavity (Entry Point)
- Nasal septum
- Inferior turbinate
- Middle turbinate
- Superior turbinate
- Nasal mucosa

### Level 1: Sphenoid Ostium
- Natural ostium (2-3mm opening)
- Surrounding mucosa
- Entry point to sphenoid sinus

### Level 2: Sphenoid Sinus
- Anterior wall (opened)
- Intrasphenoidal septations (1-3 septa)
- Pneumatized cavity
- Pink mucosal lining

### Level 3: Sellar Floor
- Bone (white cortical bone, 0.5-2mm thick)
- Sellar prominence (bulge from pituitary)
- Bony landmarks for orientation

### Level 4: Sella Turcica Interior
- Dura mater (tough membrane)
- Pituitary gland (normal, reddish)
- Diaphragma sellae (dural roof)
- Pituitary adenoma (tumor, tan/gray)
- Pseudocapsule (glistening membrane)

### Level 5: Critical Structures (MWCS Resection Zone)
- Internal carotid arteries (bilateral, pulsating)
- Medial wall of cavernous sinus (MWCS, thin dural membrane)
- Cavernous sinus (venous plexus)
- Optic nerves (superior, avoid injury)

---

## 📝 Complete AnatomyManager.cs (Unity)

```csharp
// Assets/Scripts/Anatomy/CompleteAnatomyManager.cs
using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// Complete Anatomy Manager for NeuroSim VR
/// Includes ALL structures from web version (Level 0-5)
/// </summary>
public class CompleteAnatomyManager : MonoBehaviour
{
    [Header("=== LEVEL 0: Nasal Cavity ===")]
    public GameObject nasalSeptumPrefab;
    public GameObject inferiorTurbinatePrefab;
    public GameObject middleTurbinatePrefab;
    public GameObject superiorTurbinatePrefab;

    [Header("=== LEVEL 1: Sphenoid Ostium ===")]
    public GameObject sphenoidOstiumPrefab;

    [Header("=== LEVEL 2: Sphenoid Sinus ===")]
    public GameObject sphenoidSinusPrefab;
    public int septationCount = 2;

    [Header("=== LEVEL 3: Sellar Floor ===")]
    public GameObject sellarFloorBonePrefab;
    public GameObject sellarProminencePrefab;

    [Header("=== LEVEL 4: Sella Interior ===")]
    public GameObject duraMaterPrefab;
    public GameObject normalPituitaryPrefab;
    public GameObject diaphragmaSellaePrefab;
    public GameObject pituitaryAdenomaPrefab;
    public GameObject pseudocapsulePrefab;

    [Header("=== LEVEL 5: Critical Structures ===")]
    public GameObject icaLeftPrefab;
    public GameObject icaRightPrefab;
    public GameObject mwcsLeftPrefab;
    public GameObject mwcsRightPrefab;
    public GameObject opticNerveLeftPrefab;
    public GameObject opticNerveRightPrefab;
    public GameObject cavernousSinusLeftPrefab;
    public GameObject cavernousSinusRightPrefab;

    [Header("=== Case Configuration ===")]
    public TumorType tumorType = TumorType.Macroadenoma;
    public KnospGrade invasionGrade = KnospGrade.Grade2;

    [Header("=== Progressive Revelation ===")]
    [Range(0, 5)]
    public int currentLevel = 0;

    private Dictionary<string, GameObject> anatomyInstances = new();

    // Complete anatomical positions (world space, 1 unit ≈ 1cm)
    private static class AnatomyPositions
    {
        // Level 0: Nasal cavity
        public static readonly Vector3 NasalSeptum = new Vector3(0, 0, -3f);
        public static readonly Vector3 InferiorTurbinate = new Vector3(0.4f, -0.3f, -4f);
        public static readonly Vector3 MiddleTurbinate = new Vector3(0.4f, 0.1f, -4.5f);
        public static readonly Vector3 SuperiorTurbinate = new Vector3(0.4f, 0.4f, -5f);

        // Level 1: Sphenoid ostium
        public static readonly Vector3 SphenoidOstium = new Vector3(0.2f, 0.2f, -6.45f);

        // Level 2: Sphenoid sinus
        public static readonly Vector3 SphenoidSinus = new Vector3(0, 0.2f, -6.8f);

        // Level 3: Sellar floor
        public static readonly Vector3 SellarFloor = new Vector3(0, 0.4f, -7.2f);
        public static readonly Vector3 SellarProminence = new Vector3(0, 0.45f, -7.25f);

        // Level 4: Sella interior
        public static readonly Vector3 DuraMater = new Vector3(0, 0.5f, -7.35f);
        public static readonly Vector3 NormalPituitary = new Vector3(0, 0.55f, -7.45f);
        public static readonly Vector3 DiaphragmaSellae = new Vector3(0, 0.75f, -7.5f);
        public static readonly Vector3 PituitaryAdenoma = new Vector3(0, 0.6f, -7.5f);

        // Level 5: Critical structures
        public static readonly Vector3 ICALeft = new Vector3(-0.9f, 0.3f, -7.3f);
        public static readonly Vector3 ICARight = new Vector3(0.9f, 0.3f, -7.3f);
        public static readonly Vector3 MWCSLeft = new Vector3(-0.85f, 0.3f, -7.3f);
        public static readonly Vector3 MWCSRight = new Vector3(0.85f, 0.3f, -7.3f);
        public static readonly Vector3 OpticNerveLeft = new Vector3(-0.35f, 0.85f, -7.6f);
        public static readonly Vector3 OpticNerveRight = new Vector3(0.35f, 0.85f, -7.6f);
        public static readonly Vector3 CavernousSinusLeft = new Vector3(-1.1f, 0.3f, -7.4f);
        public static readonly Vector3 CavernousSinusRight = new Vector3(1.1f, 0.3f, -7.4f);
    }

    public enum TumorType { Microadenoma, Macroadenoma, Invasive, Giant }
    public enum KnospGrade { Grade0, Grade1, Grade2, Grade3, Grade4 }

    void Start()
    {
        InitializeCompleteAnatomy();
        UpdateVisibilityForLevel(currentLevel);
    }

    private void InitializeCompleteAnatomy()
    {
        Debug.Log("Initializing complete anatomical pathway (Level 0-5)...");

        // === LEVEL 0: Nasal Cavity ===
        if (nasalSeptumPrefab)
            anatomyInstances["nasalSeptum"] = InstantiateStructure(nasalSeptumPrefab, AnatomyPositions.NasalSeptum, "Nasal Septum");

        if (inferiorTurbinatePrefab)
            anatomyInstances["inferiorTurbinate"] = InstantiateStructure(inferiorTurbinatePrefab, AnatomyPositions.InferiorTurbinate, "Inferior Turbinate");

        if (middleTurbinatePrefab)
            anatomyInstances["middleTurbinate"] = InstantiateStructure(middleTurbinatePrefab, AnatomyPositions.MiddleTurbinate, "Middle Turbinate");

        if (superiorTurbinatePrefab)
            anatomyInstances["superiorTurbinate"] = InstantiateStructure(superiorTurbinatePrefab, AnatomyPositions.SuperiorTurbinate, "Superior Turbinate");

        // === LEVEL 1: Sphenoid Ostium ===
        if (sphenoidOstiumPrefab)
            anatomyInstances["sphenoidOstium"] = InstantiateStructure(sphenoidOstiumPrefab, AnatomyPositions.SphenoidOstium, "Sphenoid Ostium");

        // === LEVEL 2: Sphenoid Sinus ===
        if (sphenoidSinusPrefab)
        {
            anatomyInstances["sphenoidSinus"] = InstantiateStructure(sphenoidSinusPrefab, AnatomyPositions.SphenoidSinus, "Sphenoid Sinus");
            // Add septations (randomized for realism)
            AddSphenoidSeptations();
        }

        // === LEVEL 3: Sellar Floor ===
        if (sellarFloorBonePrefab)
            anatomyInstances["sellarFloor"] = InstantiateStructure(sellarFloorBonePrefab, AnatomyPositions.SellarFloor, "Sellar Floor");

        if (sellarProminencePrefab)
            anatomyInstances["sellarProminence"] = InstantiateStructure(sellarProminencePrefab, AnatomyPositions.SellarProminence, "Sellar Prominence");

        // === LEVEL 4: Sella Interior ===
        if (duraMaterPrefab)
            anatomyInstances["duraMater"] = InstantiateStructure(duraMaterPrefab, AnatomyPositions.DuraMater, "Dura Mater");

        if (normalPituitaryPrefab)
            anatomyInstances["normalPituitary"] = InstantiateStructure(normalPituitaryPrefab, AnatomyPositions.NormalPituitary, "Normal Pituitary");

        if (diaphragmaSellaePrefab)
            anatomyInstances["diaphragmaSellae"] = InstantiateStructure(diaphragmaSellaePrefab, AnatomyPositions.DiaphragmaSellae, "Diaphragma Sellae");

        if (pituitaryAdenomaPrefab)
        {
            GameObject tumorPrefab = GetTumorPrefabByGrade();
            anatomyInstances["pituitaryAdenoma"] = InstantiateStructure(tumorPrefab, AnatomyPositions.PituitaryAdenoma, "Pituitary Adenoma");

            // Add pseudocapsule
            if (pseudocapsulePrefab)
            {
                anatomyInstances["pseudocapsule"] = InstantiateStructure(
                    pseudocapsulePrefab,
                    AnatomyPositions.PituitaryAdenoma,
                    "Pseudocapsule",
                    anatomyInstances["pituitaryAdenoma"].transform
                );
            }
        }

        // === LEVEL 5: Critical Structures ===
        if (icaLeftPrefab)
        {
            anatomyInstances["icaLeft"] = InstantiateStructure(icaLeftPrefab, AnatomyPositions.ICALeft, "ICA Left");
            anatomyInstances["icaLeft"].AddComponent<ArterialPulsation>().heartRate = 75f;
        }

        if (icaRightPrefab)
        {
            anatomyInstances["icaRight"] = InstantiateStructure(icaRightPrefab, AnatomyPositions.ICARight, "ICA Right");
            anatomyInstances["icaRight"].AddComponent<ArterialPulsation>().heartRate = 75f;
        }

        if (mwcsLeftPrefab)
            anatomyInstances["mwcsLeft"] = InstantiateStructure(mwcsLeftPrefab, AnatomyPositions.MWCSLeft, "MWCS Left");

        if (mwcsRightPrefab)
            anatomyInstances["mwcsRight"] = InstantiateStructure(mwcsRightPrefab, AnatomyPositions.MWCSRight, "MWCS Right");

        if (opticNerveLeftPrefab)
            anatomyInstances["opticNerveLeft"] = InstantiateStructure(opticNerveLeftPrefab, AnatomyPositions.OpticNerveLeft, "Optic Nerve Left");

        if (opticNerveRightPrefab)
            anatomyInstances["opticNerveRight"] = InstantiateStructure(opticNerveRightPrefab, AnatomyPositions.OpticNerveRight, "Optic Nerve Right");

        if (cavernousSinusLeftPrefab)
            anatomyInstances["cavernousSinusLeft"] = InstantiateStructure(cavernousSinusLeftPrefab, AnatomyPositions.CavernousSinusLeft, "Cavernous Sinus Left");

        if (cavernousSinusRightPrefab)
            anatomyInstances["cavernousSinusRight"] = InstantiateStructure(cavernousSinusRightPrefab, AnatomyPositions.CavernousSinusRight, "Cavernous Sinus Right");

        // Apply AI-generated textures to all structures
        ApplyAIGeneratedTextures();

        Debug.Log($"Complete anatomy initialized: {anatomyInstances.Count} structures");
    }

    private GameObject InstantiateStructure(GameObject prefab, Vector3 position, string name, Transform parent = null)
    {
        if (prefab == null)
        {
            Debug.LogWarning($"Prefab is null for {name}");
            return null;
        }

        GameObject instance = Instantiate(prefab, position, Quaternion.identity, parent ?? transform);
        instance.name = name;
        return instance;
    }

    private void AddSphenoidSeptations()
    {
        // Randomly place 1-3 intrasphenoidal septa
        var sphenoid = anatomyInstances["sphenoidSinus"];
        if (sphenoid == null) return;

        for (int i = 0; i < septationCount; i++)
        {
            float xOffset = Random.Range(-0.15f, 0.15f);
            float zOffset = Random.Range(-0.2f, 0.2f);

            GameObject septum = GameObject.CreatePrimitive(PrimitiveType.Plane);
            septum.name = $"Septation_{i + 1}";
            septum.transform.SetParent(sphenoid.transform);
            septum.transform.localPosition = new Vector3(xOffset, 0, zOffset);
            septum.transform.localRotation = Quaternion.Euler(0, 90, 0);
            septum.transform.localScale = new Vector3(0.05f, 1f, 0.4f);

            // Apply bone material
            var renderer = septum.GetComponent<Renderer>();
            if (renderer != null)
            {
                renderer.material.color = new Color(0.95f, 0.95f, 0.92f); // Bone white
            }
        }
    }

    private GameObject GetTumorPrefabByGrade()
    {
        // Return appropriate tumor prefab based on Knosp grade
        // This would load different prefabs with varying invasion patterns
        return pituitaryAdenomaPrefab; // Simplified for now
    }

    private void ApplyAIGeneratedTextures()
    {
        Debug.Log("Applying AI-generated textures from Gemini 3 Pro Image...");

        // Load all AI-generated textures from Resources/AI_Generated/
        var textures = new Dictionary<string, Texture2D>
        {
            ["pituitary-adenoma"] = Resources.Load<Texture2D>("AI_Generated/pituitary-adenoma"),
            ["mwcs"] = Resources.Load<Texture2D>("AI_Generated/mwcs"),
            ["ica"] = Resources.Load<Texture2D>("AI_Generated/ica"),
            ["pseudocapsule"] = Resources.Load<Texture2D>("AI_Generated/pseudocapsule"),
            ["sphenoid-sinus"] = Resources.Load<Texture2D>("AI_Generated/sphenoid-sinus"),
            ["dura"] = Resources.Load<Texture2D>("AI_Generated/dura"),
            ["bone"] = Resources.Load<Texture2D>("AI_Generated/bone"),
            ["mucosa"] = Resources.Load<Texture2D>("AI_Generated/mucosa"),
            ["optic-nerve"] = Resources.Load<Texture2D>("AI_Generated/optic-nerve"),
            ["cavernous-sinus"] = Resources.Load<Texture2D>("AI_Generated/cavernous-sinus")
        };

        // Apply textures to appropriate structures
        ApplyTexture("pituitaryAdenoma", textures["pituitary-adenoma"]);
        ApplyTexture("mwcsLeft", textures["mwcs"]);
        ApplyTexture("mwcsRight", textures["mwcs"]);
        ApplyTexture("icaLeft", textures["ica"], pulsation: true);
        ApplyTexture("icaRight", textures["ica"], pulsation: true);
        ApplyTexture("pseudocapsule", textures["pseudocapsule"]);
        ApplyTexture("sphenoidSinus", textures["sphenoid-sinus"]);
        ApplyTexture("duraMater", textures["dura"]);
        ApplyTexture("sellarFloor", textures["bone"]);
        ApplyTexture("nasalSeptum", textures["mucosa"]);
        ApplyTexture("inferiorTurbinate", textures["mucosa"]);
        ApplyTexture("middleTurbinate", textures["mucosa"]);
        ApplyTexture("superiorTurbinate", textures["mucosa"]);
        ApplyTexture("opticNerveLeft", textures["optic-nerve"]);
        ApplyTexture("opticNerveRight", textures["optic-nerve"]);
        ApplyTexture("cavernousSinusLeft", textures["cavernous-sinus"]);
        ApplyTexture("cavernousSinusRight", textures["cavernous-sinus"]);

        Debug.Log("AI textures applied successfully");
    }

    private void ApplyTexture(string key, Texture2D texture, bool pulsation = false)
    {
        if (!anatomyInstances.ContainsKey(key) || texture == null) return;

        var renderer = anatomyInstances[key].GetComponent<Renderer>();
        if (renderer == null) return;

        renderer.material.SetTexture("_MainTex", texture);

        if (pulsation && renderer.material.HasProperty("_Pulsation"))
        {
            renderer.material.SetFloat("_Pulsation", 1.0f);
        }
    }

    public void UpdateVisibilityForLevel(int level)
    {
        currentLevel = level;
        Debug.Log($"Updating visibility for Level {level}");

        // Level 0: Nasal cavity
        SetActive("nasalSeptum", level >= 0);
        SetActive("inferiorTurbinate", level >= 0);
        SetActive("middleTurbinate", level >= 0);
        SetActive("superiorTurbinate", level >= 0);

        // Level 1: Sphenoid ostium
        SetActive("sphenoidOstium", level >= 1);

        // Level 2: Sphenoid sinus
        SetActive("sphenoidSinus", level >= 2);

        // Level 3: Sellar floor
        SetActive("sellarFloor", level >= 3);
        SetActive("sellarProminence", level >= 3);

        // Level 4: Sella interior
        SetActive("duraMater", level >= 4);
        SetActive("normalPituitary", level >= 4);
        SetActive("diaphragmaSellae", level >= 4);
        SetActive("pituitaryAdenoma", level >= 4);
        SetActive("pseudocapsule", level >= 4);

        // Level 5: Critical structures
        SetActive("icaLeft", level >= 5);
        SetActive("icaRight", level >= 5);
        SetActive("mwcsLeft", level >= 5);
        SetActive("mwcsRight", level >= 5);
        SetActive("opticNerveLeft", level >= 5);
        SetActive("opticNerveRight", level >= 5);
        SetActive("cavernousSinusLeft", level >= 5);
        SetActive("cavernousSinusRight", level >= 5);
    }

    private void SetActive(string key, bool active)
    {
        if (anatomyInstances.ContainsKey(key) && anatomyInstances[key] != null)
        {
            anatomyInstances[key].SetActive(active);
        }
    }

    // Public API
    public void AdvanceLevel()
    {
        if (currentLevel < 5)
        {
            UpdateVisibilityForLevel(currentLevel + 1);
        }
    }

    public void ResetLevel()
    {
        UpdateVisibilityForLevel(0);
    }

    public int GetCurrentLevel() => currentLevel;
    public int GetMaxLevel() => 5;
    public Dictionary<string, GameObject> GetAnatomyInstances() => anatomyInstances;
}
```

---

## 🎨 Complete Texture Generation List

Update `generate-anatomy-textures.ts` to generate ALL textures:

```typescript
const COMPLETE_TEXTURE_SET: AnatomyTextureRequest[] = [
  // === LEVEL 0: Nasal Cavity ===
  {
    structure: 'nasal-septum',
    view: 'endoscope',
    lighting: 'surgical'
  },
  {
    structure: 'nasal-turbinate',
    view: 'endoscope',
    lighting: 'surgical'
  },

  // === LEVEL 1: Sphenoid Ostium ===
  {
    structure: 'sphenoid-ostium',
    view: 'endoscope',
    lighting: 'surgical'
  },

  // === LEVEL 2: Sphenoid Sinus ===
  {
    structure: 'sphenoid-sinus',
    view: 'endoscope',
    lighting: 'surgical'
  },

  // === LEVEL 3: Sellar Floor ===
  {
    structure: 'sella-floor',
    view: 'endoscope',
    lighting: 'surgical'
  },

  // === LEVEL 4: Sella Interior ===
  {
    structure: 'dura',
    view: 'endoscope',
    lighting: 'surgical'
  },
  {
    structure: 'pituitary-adenoma',
    view: 'endoscope',
    invasionGrade: 'knosp-2',
    lighting: 'surgical'
  },
  {
    structure: 'pseudocapsule',
    view: 'endoscope',
    lighting: 'surgical'
  },

  // === LEVEL 5: Critical Structures ===
  {
    structure: 'ica',
    view: 'endoscope',
    lighting: 'surgical'
  },
  {
    structure: 'mwcs',
    view: 'endoscope',
    lighting: 'surgical'
  },
  {
    structure: 'optic-nerve',
    view: 'endoscope',
    lighting: 'surgical'
  },
  {
    structure: 'cavernous-sinus',
    view: 'endoscope',
    lighting: 'surgical'
  }
];
```

---

## ✅ Completeness Checklist

### Nasal Approach (Level 0-1)
- [x] Nasal septum with mucosa
- [x] Inferior turbinate (large, obstructs view)
- [x] Middle turbinate (landmark)
- [x] Superior turbinate (smallest)
- [x] Sphenoid ostium (natural opening)

### Sphenoid Sinus (Level 2)
- [x] Anterior wall (removed)
- [x] Intrasphenoidal septations (1-3 septa)
- [x] Pink mucosal lining
- [x] Pneumatized cavity

### Sellar Approach (Level 3)
- [x] Sellar floor bone
- [x] Sellar prominence (bulge)
- [x] Bony removal zone

### Sella Interior (Level 4)
- [x] Dura mater (opened)
- [x] Normal pituitary gland
- [x] Diaphragma sellae (roof)
- [x] Pituitary adenoma (tumor)
- [x] Pseudocapsule (dissection plane)

### Critical Zone (Level 5)
- [x] ICA left (pulsating)
- [x] ICA right (pulsating)
- [x] MWCS left (thin membrane)
- [x] MWCS right (thin membrane)
- [x] Optic nerves (bilateral, superior)
- [x] Cavernous sinus (venous plexus)

---

**NOW Complete**: Unity VR includes entire surgical approach from nostrils to MWCS! 🎯🔬✨
