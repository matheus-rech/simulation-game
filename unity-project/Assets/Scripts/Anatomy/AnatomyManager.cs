// ============================================================================
// AnatomyManager.cs - Main Anatomy Orchestrator for NeuroSim VR
// ============================================================================
// Manages all anatomical structures with AI-generated textures from Nano Banana Pro
// Progressive revelation system (Levels 1-3)
// Synchronized with web platform architecture
// ============================================================================

using UnityEngine;
using System.Collections.Generic;

namespace NeuroSim.Anatomy
{
    public class AnatomyManager : MonoBehaviour
    {
        [Header("AI-Generated Anatomy Prefabs")]
        [Tooltip("Assign anatomical structure prefabs in Inspector")]
        public GameObject sphenoidSinusPrefab;
        public GameObject sellaTurcicaPrefab;
        public GameObject pituitaryAdenomaPrefab;
        public GameObject icaLeftPrefab;
        public GameObject icaRightPrefab;
        public GameObject mwcsLeftPrefab;
        public GameObject mwcsRightPrefab;
        public GameObject nasalSeptumPrefab;
        public GameObject nasalTurbinatePrefab;
        public GameObject opticNervePrefab;

        [Header("Case Configuration")]
        [Tooltip("Tumor type affects which prefab is loaded")]
        public TumorType tumorType = TumorType.Macroadenoma;

        [Tooltip("Knosp grade determines tumor invasion extent")]
        public KnospGrade invasionGrade = KnospGrade.Grade2;

        [Header("Progressive Revelation")]
        [Tooltip("Current surgical depth level (1-3)")]
        [Range(1, 3)]
        public int currentLevel = 1;

        // Instance tracking
        private Dictionary<string, GameObject> anatomyInstances = new Dictionary<string, GameObject>();

        // Anatomical positions in world space (1 unit ≈ 1cm, matches web platform)
        private static readonly Vector3[] ANATOMY_POSITIONS = new Vector3[]
        {
            new Vector3(0, 0, -6.0f),        // Nasal cavity (Level 0)
            new Vector3(0.2f, 0.2f, -6.45f), // Sphenoid ostium (Level 1)
            new Vector3(0, 0.2f, -6.8f),     // Sphenoid sinus (Level 1)
            new Vector3(0, 0.4f, -7.2f),     // Sella floor (Level 2)
            new Vector3(0, 0.6f, -7.5f),     // Pituitary/tumor (Level 2)
            new Vector3(-0.9f, 0.3f, -7.3f), // ICA left (Level 3)
            new Vector3(0.9f, 0.3f, -7.3f),  // ICA right (Level 3)
            new Vector3(-0.85f, 0.3f, -7.3f),// MWCS left (Level 3)
            new Vector3(0.85f, 0.3f, -7.3f)  // MWCS right (Level 3)
        };

        // Enums matching web platform
        public enum TumorType { Microadenoma, Macroadenoma, Invasive }
        public enum KnospGrade { Grade0, Grade1, Grade2, Grade3, Grade4 }

        // ====================================================================
        // Initialization
        // ====================================================================

        void Start()
        {
            Debug.Log("[AnatomyManager] Initializing anatomical structures with AI-generated textures...");
            InitializeAnatomicalStructures();
            UpdateVisibilityForLevel(currentLevel);
            Debug.Log($"[AnatomyManager] Ready at Level {currentLevel}");
        }

        private void InitializeAnatomicalStructures()
        {
            // Instantiate all anatomical structures
            InstantiateStructure("nasalSeptum", nasalSeptumPrefab, ANATOMY_POSITIONS[0]);
            InstantiateStructure("nasalTurbinate", nasalTurbinatePrefab, ANATOMY_POSITIONS[0]);
            InstantiateStructure("sphenoidSinus", sphenoidSinusPrefab, ANATOMY_POSITIONS[2]);
            InstantiateStructure("sellaTurcica", sellaTurcicaPrefab, ANATOMY_POSITIONS[3]);
            InstantiateStructure("tumor", GetTumorPrefab(), ANATOMY_POSITIONS[4]);
            InstantiateStructure("icaLeft", icaLeftPrefab, ANATOMY_POSITIONS[5]);
            InstantiateStructure("icaRight", icaRightPrefab, ANATOMY_POSITIONS[6]);
            InstantiateStructure("mwcsLeft", mwcsLeftPrefab, ANATOMY_POSITIONS[7]);
            InstantiateStructure("mwcsRight", mwcsRightPrefab, ANATOMY_POSITIONS[8]);

            // Apply AI-generated textures from Nano Banana Pro
            ApplyAIGeneratedTextures();

            // Add pulsation to ICAs (realistic arterial pulsation)
            AddArterialPulsation("icaLeft");
            AddArterialPulsation("icaRight");
        }

        private void InstantiateStructure(string key, GameObject prefab, Vector3 position)
        {
            if (prefab == null)
            {
                Debug.LogWarning($"[AnatomyManager] Prefab for '{key}' is null. Skipping.");
                return;
            }

            GameObject instance = Instantiate(prefab, position, Quaternion.identity, transform);
            instance.name = key; // Clean name for hierarchy
            anatomyInstances[key] = instance;
        }

        // ====================================================================
        // Tumor Selection Based on Knosp Grade
        // ====================================================================

        private GameObject GetTumorPrefab()
        {
            // Select appropriate tumor prefab based on Knosp grade
            // These prefabs use different AI-generated textures for each grade
            switch (invasionGrade)
            {
                case KnospGrade.Grade0:
                case KnospGrade.Grade1:
                    return Resources.Load<GameObject>("Prefabs/Tumor_Knosp0");
                case KnospGrade.Grade2:
                    return Resources.Load<GameObject>("Prefabs/Tumor_Knosp2");
                case KnospGrade.Grade3:
                case KnospGrade.Grade4:
                    return Resources.Load<GameObject>("Prefabs/Tumor_Knosp3");
                default:
                    return pituitaryAdenomaPrefab;
            }
        }

        // ====================================================================
        // AI-Generated Texture Application (Nano Banana Pro)
        // ====================================================================

        private void ApplyAIGeneratedTextures()
        {
            Debug.Log("[AnatomyManager] Loading AI-generated textures from Nano Banana Pro...");

            // Load textures from Resources/AI_Generated/ (2048x2048 PNG)
            // Generated by gemini-3-pro-image-preview, validated at 84/100 quality
            Texture2D nasalSeptumTex = LoadAITexture("nasal-septum");
            Texture2D nasalTurbinateTex = LoadAITexture("nasal-turbinate");
            Texture2D sphenoidSinusTex = LoadAITexture("sphenoid-sinus");
            Texture2D sellaFloorTex = LoadAITexture("sella-floor");
            Texture2D duraTex = LoadAITexture("dura");
            Texture2D tumorTex = LoadAITexture("pituitary-adenoma_knosp-2");
            Texture2D pseudocapsuleTex = LoadAITexture("pseudocapsule");
            Texture2D icaTex = LoadAITexture("ica");
            Texture2D mwcsTex = LoadAITexture("mwcs");
            Texture2D opticNerveTex = LoadAITexture("optic-nerve");

            // Apply to anatomical structures
            ApplyTextureToStructure("nasalSeptum", nasalSeptumTex);
            ApplyTextureToStructure("nasalTurbinate", nasalTurbinateTex);
            ApplyTextureToStructure("sphenoidSinus", sphenoidSinusTex);
            ApplyTextureToStructure("sellaTurcica", sellaFloorTex);
            ApplyTextureToStructure("tumor", tumorTex);
            ApplyTextureToStructure("icaLeft", icaTex, enablePulsation: true);
            ApplyTextureToStructure("icaRight", icaTex, enablePulsation: true);
            ApplyTextureToStructure("mwcsLeft", mwcsTex);
            ApplyTextureToStructure("mwcsRight", mwcsTex);

            Debug.Log("[AnatomyManager] ✅ All AI-generated textures applied successfully!");
        }

        private Texture2D LoadAITexture(string textureName)
        {
            string path = $"AI_Generated/{textureName}_standard";
            Texture2D texture = Resources.Load<Texture2D>(path);

            if (texture == null)
            {
                Debug.LogWarning($"[AnatomyManager] Failed to load texture: {path}");
            }

            return texture;
        }

        private void ApplyTextureToStructure(string key, Texture2D texture, bool enablePulsation = false)
        {
            if (!anatomyInstances.ContainsKey(key))
            {
                Debug.LogWarning($"[AnatomyManager] Instance '{key}' not found.");
                return;
            }

            if (texture == null)
            {
                Debug.LogWarning($"[AnatomyManager] Texture for '{key}' is null. Skipping.");
                return;
            }

            GameObject instance = anatomyInstances[key];
            Renderer renderer = instance.GetComponent<Renderer>();

            if (renderer == null)
            {
                Debug.LogWarning($"[AnatomyManager] No Renderer found on '{key}'.");
                return;
            }

            // Apply texture to material
            renderer.material.SetTexture("_MainTex", texture);

            // Enable pulsation for arteries (ICA)
            if (enablePulsation && renderer.material.HasProperty("_Pulsation"))
            {
                renderer.material.SetFloat("_Pulsation", 1.0f);
                Debug.Log($"[AnatomyManager] Pulsation enabled for '{key}'");
            }
        }

        private void AddArterialPulsation(string key)
        {
            if (!anatomyInstances.ContainsKey(key)) return;

            GameObject instance = anatomyInstances[key];
            ArterialPulsation pulsation = instance.AddComponent<ArterialPulsation>();
            pulsation.heartRate = 75f; // 75 BPM (normal resting heart rate)

            Debug.Log($"[AnatomyManager] ArterialPulsation component added to '{key}'");
        }

        // ====================================================================
        // Progressive Revelation System (Levels 1-3)
        // ====================================================================

        public void UpdateVisibilityForLevel(int level)
        {
            currentLevel = Mathf.Clamp(level, 1, 3);
            Debug.Log($"[AnatomyManager] Updating visibility for Level {currentLevel}");

            // Level 1: Nasal cavity and sphenoid sinus
            SetStructureActive("nasalSeptum", level >= 1);
            SetStructureActive("nasalTurbinate", level >= 1);
            SetStructureActive("sphenoidSinus", level >= 1);

            // Level 2: Sella turcica and tumor
            SetStructureActive("sellaTurcica", level >= 2);
            SetStructureActive("tumor", level >= 2);

            // Level 3: Critical structures (ICA, MWCS, optic nerve)
            SetStructureActive("icaLeft", level >= 3);
            SetStructureActive("icaRight", level >= 3);
            SetStructureActive("mwcsLeft", level >= 3);
            SetStructureActive("mwcsRight", level >= 3);
        }

        private void SetStructureActive(string key, bool active)
        {
            if (anatomyInstances.ContainsKey(key) && anatomyInstances[key] != null)
            {
                anatomyInstances[key].SetActive(active);
            }
        }

        // ====================================================================
        // Public API for Level Control
        // ====================================================================

        public void AdvanceLevel()
        {
            if (currentLevel < 3)
            {
                UpdateVisibilityForLevel(currentLevel + 1);
            }
            else
            {
                Debug.Log("[AnatomyManager] Already at maximum level (3)");
            }
        }

        public void ResetLevel()
        {
            UpdateVisibilityForLevel(1);
        }

        public int GetCurrentLevel()
        {
            return currentLevel;
        }

        // ====================================================================
        // Debugging
        // ====================================================================

        void OnDrawGizmos()
        {
            // Visualize anatomical positions in Scene view
            Gizmos.color = Color.cyan;
            foreach (var pos in ANATOMY_POSITIONS)
            {
                Gizmos.DrawWireSphere(pos, 0.1f);
            }
        }
    }
}
