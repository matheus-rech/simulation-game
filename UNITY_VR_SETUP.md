# Unity VR Setup Guide - NeuroSim Quest 3

**Target Platform**: Meta Quest 3
**Unity Version**: 2023.2+ LTS
**Render Pipeline**: Universal Render Pipeline (URP)
**VR Framework**: XR Interaction Toolkit

---

## 🚀 Quick Start (Ready Tonight)

### Step 1: Generate AI Textures (5 minutes)

```bash
cd /Users/matheusrech/simulation-game/unity-tools

# Set your Gemini API key
echo "GEMINI_API_KEY=your_key_here" > .env

# Generate anatomical textures
npx tsx generate-anatomy-textures.ts
```

**Output**: `unity-textures/` directory with 5 PNG files:
- `pituitary-adenoma_knosp-2.png`
- `mwcs_standard.png`
- `ica_standard.png`
- `pseudocapsule_standard.png`
- `sphenoid-sinus_standard.png`

---

## 📦 Unity Project Setup

### 1. Create New Unity Project

```bash
# Using Unity Hub
Unity Hub > New Project > 3D (URP)
Project Name: NeuroSim-VR
Template: 3D (URP)
```

### 2. Install Required Packages

**Window → Package Manager**:
- ✅ Universal RP (com.unity.render-pipelines.universal)
- ✅ XR Plugin Management (com.unity.xr.management)
- ✅ XR Interaction Toolkit (com.unity.xr.interaction.toolkit)
- ✅ Oculus XR Plugin (com.unity.xr.oculus)

**Manual Installation** (if needed):
```json
// Packages/manifest.json
{
  "dependencies": {
    "com.unity.render-pipelines.universal": "14.0.9",
    "com.unity.xr.management": "4.4.0",
    "com.unity.xr.interaction.toolkit": "2.5.2",
    "com.unity.xr.oculus": "4.1.2"
  }
}
```

### 3. Configure XR Settings

**Edit → Project Settings → XR Plug-in Management**:
- ✅ Enable "Oculus" for Android
- ✅ Set "Stereo Rendering Mode" to "Multiview"

**Edit → Project Settings → Player → Android**:
- Minimum API Level: Android 10.0 (API level 29)
- Target API Level: Android 12.0 (API level 31)
- Scripting Backend: IL2CPP
- ARM64: ✅ Enabled

---

## 🗂️ Project Structure

```
Assets/
├── Scenes/
│   └── VRTraining.unity                 # Main VR scene
├── Materials/
│   ├── AI_Generated/                    # Gemini textures
│   │   ├── PituitaryAdenoma.mat
│   │   ├── MWCS.mat
│   │   ├── ICA.mat
│   │   ├── Pseudocapsule.mat
│   │   └── SphenoidSinus.mat
│   └── Shaders/
│       └── SurgicalTissue.shader         # Custom shader
├── Scripts/
│   ├── Anatomy/
│   │   ├── AnatomyManager.cs             # Main orchestrator
│   │   ├── PituitaryAdenoma.cs           # Tumor logic
│   │   ├── MWCS.cs                       # Cavernous sinus
│   │   ├── ICA.cs                        # Artery with pulsation
│   │   └── ArterialPulsation.cs          # Pulsation component
│   ├── VR/
│   │   ├── EndoscopeController.cs        # VR endoscope
│   │   ├── HandTrackingInput.cs          # Quest 3 hand tracking
│   │   └── HapticFeedback.cs             # Vibration feedback
│   ├── Safety/
│   │   └── SafetyCorridorVR.cs           # Port from web
│   └── Scoring/
│       └── TechniqueScoringVR.cs         # Port from web
├── Prefabs/
│   ├── AnatomicalStructures/
│   │   ├── CompleteSella.prefab
│   │   ├── Tumor_Knosp0.prefab
│   │   ├── Tumor_Knosp2.prefab
│   │   ├── Tumor_Knosp3.prefab
│   │   └── ICA_Bilateral.prefab
│   └── Tools/
│       └── VREndoscope.prefab
└── Resources/
    └── AI_Generated/                     # Import Gemini textures here
        ├── pituitary-adenoma.png
        ├── mwcs.png
        ├── ica.png
        ├── pseudocapsule.png
        └── sphenoid-sinus.png
```

---

## 🎨 Shader Implementation

### SurgicalTissue.shader

Already created in `UNITY_VR_PROTOCOL.md` (lines 266-372).

**Key Features**:
- Subsurface scattering for tissue translucency
- Wetness with specular highlights
- Blood vessel modulation
- Arterial pulsation for ICA
- URP-compatible HLSL

**Usage**:
```csharp
Material mat = new Material(Shader.Find("Medical/SurgicalTissue"));
mat.SetTexture("_MainTex", generatedTexture);
mat.SetFloat("_Wetness", 0.8f);
mat.SetFloat("_Pulsation", 1.0f); // For ICA only
```

---

## 🧠 Core Scripts

### 1. AnatomyManager.cs

```csharp
// Assets/Scripts/Anatomy/AnatomyManager.cs
using UnityEngine;
using System.Collections.Generic;

public class AnatomyManager : MonoBehaviour
{
    [Header("AI-Generated Anatomy Prefabs")]
    public GameObject pituitaryAdenomaPrefab;
    public GameObject mwcsLeftPrefab;
    public GameObject mwcsRightPrefab;
    public GameObject icaLeftPrefab;
    public GameObject icaRightPrefab;
    public GameObject sphenoidSinusPrefab;

    [Header("Case Configuration")]
    public TumorType tumorType = TumorType.Macroadenoma;
    public KnospGrade invasionGrade = KnospGrade.Grade2;

    [Header("Progressive Revelation")]
    public int currentLevel = 1;

    private Dictionary<string, GameObject> anatomyInstances = new();

    // Anatomical positions (world space, 1 unit ≈ 1cm)
    private static readonly Vector3[] ANATOMY_POSITIONS = new Vector3[]
    {
        new Vector3(0, 0.2f, -6.8f),     // Sphenoid sinus
        new Vector3(0, 0.4f, -7.2f),     // Sella floor
        new Vector3(0, 0.6f, -7.5f),     // Pituitary/tumor
        new Vector3(-0.9f, 0.3f, -7.3f), // ICA left
        new Vector3(0.9f, 0.3f, -7.3f),  // ICA right
        new Vector3(-0.85f, 0.3f, -7.3f),// MWCS left
        new Vector3(0.85f, 0.3f, -7.3f)  // MWCS right
    };

    public enum TumorType { Microadenoma, Macroadenoma, Invasive }
    public enum KnospGrade { Grade0, Grade1, Grade2, Grade3, Grade4 }

    void Start()
    {
        InitializeAnatomicalStructures();
        UpdateVisibilityForLevel(currentLevel);
    }

    private void InitializeAnatomicalStructures()
    {
        // Instantiate all structures
        anatomyInstances["sphenoidSinus"] = Instantiate(
            sphenoidSinusPrefab,
            ANATOMY_POSITIONS[0],
            Quaternion.identity,
            transform
        );

        anatomyInstances["tumor"] = Instantiate(
            GetTumorPrefab(),
            ANATOMY_POSITIONS[2],
            Quaternion.identity,
            transform
        );

        anatomyInstances["icaLeft"] = Instantiate(
            icaLeftPrefab,
            ANATOMY_POSITIONS[3],
            Quaternion.identity,
            transform
        );

        anatomyInstances["icaRight"] = Instantiate(
            icaRightPrefab,
            ANATOMY_POSITIONS[4],
            Quaternion.identity,
            transform
        );

        anatomyInstances["mwcsLeft"] = Instantiate(
            mwcsLeftPrefab,
            ANATOMY_POSITIONS[5],
            Quaternion.identity,
            transform
        );

        anatomyInstances["mwcsRight"] = Instantiate(
            mwcsRightPrefab,
            ANATOMY_POSITIONS[6],
            Quaternion.identity,
            transform
        );

        // Apply AI-generated textures from Resources
        ApplyAIGeneratedTextures();

        // Add pulsation to ICAs
        anatomyInstances["icaLeft"].AddComponent<ArterialPulsation>();
        anatomyInstances["icaRight"].AddComponent<ArterialPulsation>();
    }

    private GameObject GetTumorPrefab()
    {
        // Select tumor prefab based on Knosp grade
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

    private void ApplyAIGeneratedTextures()
    {
        // Load AI-generated textures from Resources/AI_Generated/
        Texture2D tumorTex = Resources.Load<Texture2D>("AI_Generated/pituitary-adenoma");
        Texture2D mwcsTex = Resources.Load<Texture2D>("AI_Generated/mwcs");
        Texture2D icaTex = Resources.Load<Texture2D>("AI_Generated/ica");
        Texture2D pseudocapsuleTex = Resources.Load<Texture2D>("AI_Generated/pseudocapsule");
        Texture2D sphenoidTex = Resources.Load<Texture2D>("AI_Generated/sphenoid-sinus");

        // Apply to materials
        ApplyTextureToGameObject("tumor", tumorTex);
        ApplyTextureToGameObject("mwcsLeft", mwcsTex);
        ApplyTextureToGameObject("mwcsRight", mwcsTex);
        ApplyTextureToGameObject("icaLeft", icaTex, pulsation: true);
        ApplyTextureToGameObject("icaRight", icaTex, pulsation: true);
        ApplyTextureToGameObject("sphenoidSinus", sphenoidTex);
    }

    private void ApplyTextureToGameObject(string key, Texture2D texture, bool pulsation = false)
    {
        if (!anatomyInstances.ContainsKey(key) || texture == null) return;

        var renderer = anatomyInstances[key].GetComponent<Renderer>();
        if (renderer == null) return;

        renderer.material.SetTexture("_MainTex", texture);

        if (pulsation)
        {
            renderer.material.SetFloat("_Pulsation", 1.0f);
        }
    }

    public void UpdateVisibilityForLevel(int level)
    {
        currentLevel = level;

        // Progressive revelation (same as web platform)
        SetActive("sphenoidSinus", level >= 1);
        SetActive("tumor", level >= 2);
        SetActive("icaLeft", level >= 3);
        SetActive("icaRight", level >= 3);
        SetActive("mwcsLeft", level >= 3);
        SetActive("mwcsRight", level >= 3);
    }

    private void SetActive(string key, bool active)
    {
        if (anatomyInstances.ContainsKey(key))
        {
            anatomyInstances[key].SetActive(active);
        }
    }

    // Public API for level control
    public void AdvanceLevel()
    {
        if (currentLevel < 3)
        {
            UpdateVisibilityForLevel(currentLevel + 1);
        }
    }

    public void ResetLevel()
    {
        UpdateVisibilityForLevel(1);
    }
}
```

### 2. ArterialPulsation.cs

```csharp
// Assets/Scripts/Anatomy/ArterialPulsation.cs
using UnityEngine;

[RequireComponent(typeof(Renderer))]
public class ArterialPulsation : MonoBehaviour
{
    [Header("Pulsation Settings")]
    [Range(60, 120)] public float heartRate = 75f; // BPM
    [Range(0.01f, 0.1f)] public float pulsationStrength = 0.05f;

    [Header("Audio")]
    public bool enableHeartbeatSound = true;
    public AudioClip heartbeatClip;
    [Range(0f, 1f)] public float audioVolume = 0.2f;
    [Range(0.1f, 0.5f)] public float audioMaxDistance = 0.5f; // Meters

    private Vector3 baseScale;
    private Material material;
    private AudioSource heartbeatSound;

    void Start()
    {
        baseScale = transform.localScale;
        material = GetComponent<Renderer>().material;

        // Setup spatial audio for immersion
        if (enableHeartbeatSound)
        {
            SetupHeartbeatAudio();
        }
    }

    void Update()
    {
        // Calculate pulsation (sine wave based on heart rate)
        float bpm = heartRate / 60f;
        float pulse = Mathf.Sin(Time.time * bpm * Mathf.PI * 2f) * 0.5f + 0.5f;

        // Apply scale pulsation (vessel expansion/contraction)
        transform.localScale = baseScale * (1f + pulse * pulsationStrength);

        // Apply material glow pulsation (shader parameter)
        if (material.HasProperty("_Pulsation"))
        {
            material.SetFloat("_Pulsation", pulse);
        }

        // Modulate heartbeat sound pitch
        if (heartbeatSound != null && heartbeatSound.isPlaying)
        {
            heartbeatSound.pitch = 0.9f + pulse * 0.2f;
        }
    }

    private void SetupHeartbeatAudio()
    {
        heartbeatSound = gameObject.AddComponent<AudioSource>();
        heartbeatSound.clip = heartbeatClip;
        heartbeatSound.loop = true;
        heartbeatSound.spatialBlend = 1.0f; // Full 3D sound
        heartbeatSound.maxDistance = audioMaxDistance;
        heartbeatSound.volume = audioVolume;
        heartbeatSound.rolloffMode = AudioRolloffMode.Linear;

        if (heartbeatClip != null)
        {
            heartbeatSound.Play();
        }
    }

    void OnDisable()
    {
        // Reset scale when disabled
        if (baseScale != Vector3.zero)
        {
            transform.localScale = baseScale;
        }
    }
}
```

---

## 🎮 VR Interaction Setup

### EndoscopeController.cs

```csharp
// Assets/Scripts/VR/EndoscopeController.cs
using UnityEngine;
using UnityEngine.XR.Interaction.Toolkit;

public class EndoscopeController : MonoBehaviour
{
    [Header("Endoscope Settings")]
    public Transform endoscopeTip;
    public Camera endoscopeCamera;
    public float movementSpeed = 0.1f;
    public float rotationSpeed = 30f;

    [Header("Safety Corridor")]
    public SafetyCorridorVR safetySystem;

    private XRController leftController;
    private XRController rightController;

    void Start()
    {
        // Find XR controllers
        var controllers = FindObjectsOfType<XRController>();
        foreach (var controller in controllers)
        {
            if (controller.controllerNode == UnityEngine.XR.XRNode.LeftHand)
                leftController = controller;
            else if (controller.controllerNode == UnityEngine.XR.XRNode.RightHand)
                rightController = controller;
        }
    }

    void Update()
    {
        HandleMovement();
        HandleRotation();

        // Update safety system with current tip position
        if (safetySystem != null && endoscopeTip != null)
        {
            safetySystem.UpdateScopeTipPosition(endoscopeTip.position);
        }
    }

    private void HandleMovement()
    {
        // Right thumbstick controls forward/backward movement
        if (rightController != null)
        {
            Vector2 input = GetThumbstickInput(rightController);
            Vector3 movement = transform.forward * input.y * movementSpeed * Time.deltaTime;
            transform.position += movement;
        }
    }

    private void HandleRotation()
    {
        // Left thumbstick controls rotation
        if (leftController != null)
        {
            Vector2 input = GetThumbstickInput(leftController);
            float rotation = input.x * rotationSpeed * Time.deltaTime;
            transform.Rotate(0, rotation, 0);
        }
    }

    private Vector2 GetThumbstickInput(XRController controller)
    {
        controller.inputDevice.TryGetFeatureValue(
            UnityEngine.XR.CommonUsages.primary2DAxis,
            out Vector2 thumbstick
        );
        return thumbstick;
    }
}
```

---

## 📊 Building for Quest 3

### Build Settings

**File → Build Settings**:
- Platform: Android ✅
- Texture Compression: ASTC
- Run Device: Quest 3

**Player Settings → Android**:
- Company Name: [Your Institution]
- Product Name: NeuroSim VR
- Bundle Identifier: com.[institution].neurosim.vr
- Minimum API Level: 29 (Android 10)
- Target API Level: 31 (Android 12)
- Scripting Backend: IL2CPP ✅
- ARM64: ✅

### Build Process

```bash
# 1. Connect Quest 3 via USB-C
# 2. Enable Developer Mode on Quest 3
# 3. In Unity: File → Build And Run

# Or build APK:
# File → Build Settings → Build
# Output: NeuroSim-VR.apk
```

---

## ✅ Testing Checklist

### Unity Editor Testing
- [ ] Play mode: All anatomy loads correctly
- [ ] Textures: AI-generated textures visible
- [ ] Pulsation: ICA arteries pulsate
- [ ] Levels: Progressive revelation works (1 → 2 → 3)
- [ ] Materials: Surgical tissue shader renders correctly

### Quest 3 Testing
- [ ] Build deploys successfully
- [ ] 72 FPS maintained
- [ ] Hand tracking responsive
- [ ] Haptic feedback works
- [ ] Spatial audio audible (heartbeat near ICA)
- [ ] Safety corridors visible in VR
- [ ] No motion sickness (smooth framerate)

---

## 🚀 Tonight's Workflow

### Step 1: Generate Textures (5 min)
```bash
cd unity-tools
echo "GEMINI_API_KEY=your_key" > .env
npx tsx generate-anatomy-textures.ts
```

### Step 2: Create Unity Project (10 min)
- New 3D URP project
- Install XR packages
- Configure Quest 3 settings

### Step 3: Import Assets (5 min)
- Copy textures to Resources/AI_Generated/
- Create SurgicalTissue shader
- Setup materials

### Step 4: Add Scripts (10 min)
- Copy AnatomyManager.cs
- Copy ArterialPulsation.cs
- Copy EndoscopeController.cs

### Step 5: Build Scene (15 min)
- Create anatomy prefabs
- Apply materials with AI textures
- Setup VR camera rig
- Configure lighting

### Step 6: Deploy to Quest 3 (5 min)
- Build and run
- Test in VR
- Verify performance

**Total Time**: ~50 minutes to complete Unity VR prototype

---

## 📁 File Locations

**Textures**: `/Users/matheusrech/simulation-game/unity-textures/`
**Scripts**: This document + `UNITY_VR_PROTOCOL.md`
**Shader**: `UNITY_VR_PROTOCOL.md` lines 266-372

---

## 🎯 Success Criteria

- ✅ AI-generated textures applied to all anatomy
- ✅ Realistic pulsating ICA
- ✅ Surgical tissue shader with SSS
- ✅ VR controls responsive (Quest 3)
- ✅ 72 FPS maintained
- ✅ Safety corridors functional
- ✅ Hand tracking enabled

---

**Unity VR prototype ready to build tonight!** 🎮🥽✨
