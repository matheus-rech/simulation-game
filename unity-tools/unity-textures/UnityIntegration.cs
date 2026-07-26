using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// Manages AI-generated anatomical textures for NeuroSim VR surgical simulator.
/// Applies textures to anatomical structures with proper material settings for VR.
///
/// Setup Instructions:
/// 1. Import all PNG textures into Unity: Assets/Resources/AI_Generated_Textures/
/// 2. Attach this script to your AnatomyManager GameObject
/// 3. Assign texture references in Inspector
/// 4. Ensure anatomical GameObjects have correct names (see ANATOMY_OBJECT_NAMES)
/// </summary>
public class UnityTextureIntegration : MonoBehaviour
{
    #region Texture References
    [Header("AI Generated Textures (2048x2048)")]
    [Tooltip("Nasal septum texture (84/100 validation score)")]
    public Texture2D nasalSeptumTexture;

    [Tooltip("Sphenoid ostium texture (84/100 validation score)")]
    public Texture2D sphenoidOstiumTexture;

    [Tooltip("Sphenoid sinus cavity texture (82/100 validation score)")]
    public Texture2D sphenoidSinusTexture;

    [Tooltip("Sella turcica floor texture (84/100 validation score)")]
    public Texture2D sellaFloorTexture;

    [Tooltip("Dura mater texture (84/100 validation score)")]
    public Texture2D duraTexture;

    [Tooltip("Pituitary adenoma Knosp-2 texture (84/100 validation score)")]
    public Texture2D pituitaryAdenomaTexture;

    [Tooltip("Tumor pseudocapsule texture (84/100 validation score)")]
    public Texture2D pseudocapsuleTexture;

    [Tooltip("Internal Carotid Artery texture - CRITICAL (84/100 validation score)")]
    public Texture2D icaTexture;

    [Tooltip("Medial Wall Cavernous Sinus texture - CRITICAL (84/100 validation score)")]
    public Texture2D mwcsTexture;

    [Tooltip("Optic nerve texture (84/100 validation score)")]
    public Texture2D opticNerveTexture;

    [Tooltip("Cavernous sinus texture (80/100 validation score)")]
    public Texture2D cavernousSinusTexture;

    [Tooltip("Nasal turbinate texture (FAILED - use placeholder)")]
    public Texture2D nasalTurbinateTexture; // Optional - 651KB failed texture
    #endregion

    #region Material Properties
    [Header("Material Settings for VR")]
    [Range(0f, 1f)]
    [Tooltip("Glossiness for wet tissue appearance (0.7-0.9 recommended)")]
    public float tissueGlossiness = 0.8f;

    [Range(0f, 1f)]
    [Tooltip("Metallic value (0 for biological tissue)")]
    public float tissueMetallic = 0f;

    [Range(0f, 2f)]
    [Tooltip("Normal map strength (if using bump mapping)")]
    public float normalMapStrength = 0.5f;

    [Tooltip("Enable emission for blood vessels (ICA, MWCS)")]
    public bool enableVascularEmission = false;

    [ColorUsage(false, true)]
    [Tooltip("Emission color for vascular structures")]
    public Color vascularEmissionColor = new Color(0.3f, 0.05f, 0.05f, 1f);
    #endregion

    #region GameObject Name Mappings
    /// <summary>
    /// Maps texture types to expected GameObject names in scene hierarchy.
    /// Modify these if your GameObjects have different names.
    /// </summary>
    private static readonly Dictionary<string, string> ANATOMY_OBJECT_NAMES = new Dictionary<string, string>
    {
        { "NasalSeptum", "NasalSeptum" },
        { "SphenoidOstium", "SphenoidOstium" },
        { "SphenoidSinus", "SphenoidSinus" },
        { "SellaFloor", "SellaFloor" },
        { "Dura", "Dura" },
        { "PituitaryAdenoma", "PituitaryAdenoma_Knosp2" },
        { "Pseudocapsule", "Pseudocapsule" },
        { "ICA_Left", "ICA_Left" },
        { "ICA_Right", "ICA_Right" },
        { "MWCS_Left", "MWCS_Left" },
        { "MWCS_Right", "MWCS_Right" },
        { "OpticNerve_Left", "OpticNerve_Left" },
        { "OpticNerve_Right", "OpticNerve_Right" },
        { "CavernousSinus_Left", "CavernousSinus_Left" },
        { "CavernousSinus_Right", "CavernousSinus_Right" }
    };
    #endregion

    void Start()
    {
        Debug.Log("[UnityTextureIntegration] Starting AI texture application...");

        ValidateTextures();
        ApplyAllTextures();

        Debug.Log("[UnityTextureIntegration] Texture application complete!");
    }

    /// <summary>
    /// Validates that all critical textures are assigned.
    /// </summary>
    private void ValidateTextures()
    {
        List<string> missingTextures = new List<string>();

        if (nasalSeptumTexture == null) missingTextures.Add("Nasal Septum");
        if (sphenoidOstiumTexture == null) missingTextures.Add("Sphenoid Ostium");
        if (sphenoidSinusTexture == null) missingTextures.Add("Sphenoid Sinus");
        if (sellaFloorTexture == null) missingTextures.Add("Sella Floor");
        if (duraTexture == null) missingTextures.Add("Dura");
        if (pituitaryAdenomaTexture == null) missingTextures.Add("Pituitary Adenoma");
        if (pseudocapsuleTexture == null) missingTextures.Add("Pseudocapsule");

        // CRITICAL textures
        if (icaTexture == null) missingTextures.Add("ICA (CRITICAL)");
        if (mwcsTexture == null) missingTextures.Add("MWCS (CRITICAL)");

        if (opticNerveTexture == null) missingTextures.Add("Optic Nerve");
        if (cavernousSinusTexture == null) missingTextures.Add("Cavernous Sinus");

        if (missingTextures.Count > 0)
        {
            Debug.LogWarning($"[UnityTextureIntegration] Missing textures: {string.Join(", ", missingTextures)}");
        }

        if (nasalTurbinateTexture == null)
        {
            Debug.LogWarning("[UnityTextureIntegration] Nasal turbinate texture not assigned (failed generation - use placeholder)");
        }
    }

    /// <summary>
    /// Applies all textures to their corresponding anatomical structures.
    /// </summary>
    private void ApplyAllTextures()
    {
        // Level 0: Nasal approach
        ApplyTextureToAnatomy("NasalSeptum", nasalSeptumTexture, TissueType.Mucosa);
        // Skip nasal turbinate - failed texture

        // Level 1: Sphenoid ostium
        ApplyTextureToAnatomy("SphenoidOstium", sphenoidOstiumTexture, TissueType.Bone);

        // Level 2: Sphenoid sinus
        ApplyTextureToAnatomy("SphenoidSinus", sphenoidSinusTexture, TissueType.Mucosa);

        // Level 3: Sella floor
        ApplyTextureToAnatomy("SellaFloor", sellaFloorTexture, TissueType.Bone);

        // Level 4: Sella contents
        ApplyTextureToAnatomy("Dura", duraTexture, TissueType.Dura);
        ApplyTextureToAnatomy("PituitaryAdenoma", pituitaryAdenomaTexture, TissueType.Tumor);
        ApplyTextureToAnatomy("Pseudocapsule", pseudocapsuleTexture, TissueType.Dura);

        // Level 5: Critical structures (bilateral)
        ApplyTextureToAnatomy("ICA_Left", icaTexture, TissueType.Artery, isCritical: true);
        ApplyTextureToAnatomy("ICA_Right", icaTexture, TissueType.Artery, isCritical: true);

        ApplyTextureToAnatomy("MWCS_Left", mwcsTexture, TissueType.Dura, isCritical: true);
        ApplyTextureToAnatomy("MWCS_Right", mwcsTexture, TissueType.Dura, isCritical: true);

        ApplyTextureToAnatomy("OpticNerve_Left", opticNerveTexture, TissueType.Nerve);
        ApplyTextureToAnatomy("OpticNerve_Right", opticNerveTexture, TissueType.Nerve);

        ApplyTextureToAnatomy("CavernousSinus_Left", cavernousSinusTexture, TissueType.Vein);
        ApplyTextureToAnatomy("CavernousSinus_Right", cavernousSinusTexture, TissueType.Vein);
    }

    /// <summary>
    /// Applies texture to a specific anatomical structure with appropriate material settings.
    /// </summary>
    private void ApplyTextureToAnatomy(string objectKey, Texture2D texture, TissueType tissueType, bool isCritical = false)
    {
        if (texture == null)
        {
            Debug.LogWarning($"[UnityTextureIntegration] Texture for {objectKey} is null, skipping...");
            return;
        }

        if (!ANATOMY_OBJECT_NAMES.TryGetValue(objectKey, out string objectName))
        {
            Debug.LogError($"[UnityTextureIntegration] Unknown object key: {objectKey}");
            return;
        }

        GameObject anatomyObject = GameObject.Find(objectName);

        if (anatomyObject == null)
        {
            Debug.LogWarning($"[UnityTextureIntegration] GameObject '{objectName}' not found in scene");
            return;
        }

        Renderer renderer = anatomyObject.GetComponent<Renderer>();

        if (renderer == null)
        {
            Debug.LogError($"[UnityTextureIntegration] No Renderer component on '{objectName}'");
            return;
        }

        // Create new material instance to avoid modifying shared materials
        Material material = new Material(renderer.material);

        // Apply base texture
        material.mainTexture = texture;

        // Configure material properties for VR rendering
        ConfigureMaterialProperties(material, tissueType, isCritical);

        // Assign material to renderer
        renderer.material = material;

        string criticalTag = isCritical ? " [CRITICAL]" : "";
        Debug.Log($"[UnityTextureIntegration] Applied texture to {objectName}{criticalTag} (Type: {tissueType})");
    }

    /// <summary>
    /// Configures material properties based on tissue type for anatomical realism.
    /// </summary>
    private void ConfigureMaterialProperties(Material material, TissueType tissueType, bool isCritical)
    {
        // Base properties for wet tissue appearance
        material.SetFloat("_Glossiness", tissueGlossiness);
        material.SetFloat("_Metallic", tissueMetallic);

        // Enable normal mapping for depth perception in VR
        if (material.HasProperty("_BumpScale"))
        {
            material.EnableKeyword("_NORMALMAP");
            material.SetFloat("_BumpScale", normalMapStrength);
        }

        // Tissue-specific properties
        switch (tissueType)
        {
            case TissueType.Artery:
                // Arterial blood - higher glossiness for pulsatile flow
                material.SetFloat("_Glossiness", 0.9f);

                if (enableVascularEmission)
                {
                    material.EnableKeyword("_EMISSION");
                    material.SetColor("_EmissionColor", vascularEmissionColor);
                }
                break;

            case TissueType.Vein:
                // Venous blood - slightly less glossy
                material.SetFloat("_Glossiness", 0.85f);
                break;

            case TissueType.Bone:
                // Bone - less glossy, more rough
                material.SetFloat("_Glossiness", 0.3f);
                break;

            case TissueType.Dura:
                // Dura mater - smooth but not wet
                material.SetFloat("_Glossiness", 0.6f);
                break;

            case TissueType.Tumor:
                // Tumor - variable surface texture
                material.SetFloat("_Glossiness", 0.7f);
                break;

            case TissueType.Nerve:
                // Nerve - smooth myelin coating
                material.SetFloat("_Glossiness", 0.75f);
                break;

            case TissueType.Mucosa:
            default:
                // Default wet tissue properties
                break;
        }

        // Critical structures get enhanced properties for visibility
        if (isCritical)
        {
            // Increase glossiness for better VR visibility
            float currentGloss = material.GetFloat("_Glossiness");
            material.SetFloat("_Glossiness", Mathf.Min(currentGloss + 0.1f, 1f));
        }
    }

    #region Texture Import Settings Helper
    /// <summary>
    /// Recommended texture import settings for Unity.
    /// Apply these in Unity Inspector for each imported texture:
    ///
    /// - Texture Type: Default
    /// - Texture Shape: 2D
    /// - sRGB (Color Texture): ✓ Checked
    /// - Alpha Source: From Gray Scale
    /// - Alpha Is Transparency: ✗ Unchecked
    /// - Wrap Mode: Clamp
    /// - Filter Mode: Trilinear
    /// - Aniso Level: 16 (for VR close-up viewing)
    /// - Max Size: 2048
    /// - Compression: High Quality
    /// - Format: RGBA Compressed ASTC 6x6 block (VR-optimized for Quest 3)
    ///
    /// For Quest 3 deployment:
    /// - Use ASTC compression for mobile VR
    /// - Keep max size at 2048 for close-up detail
    /// - Enable mipmaps for distant viewing
    /// </summary>
    #endregion

    #region Enums
    /// <summary>
    /// Anatomical tissue types for material property customization.
    /// </summary>
    private enum TissueType
    {
        Mucosa,
        Bone,
        Dura,
        Tumor,
        Artery,
        Vein,
        Nerve
    }
    #endregion
}
