# Unity VR Integration - Quick Start Guide for Tonight's Launch

**Estimated Time**: 30-45 minutes
**Target**: Quest 3 VR deployment
**Status**: All textures ready (12/12 validated at 84/100 with Nano Banana Pro)

---

## 🚀 Fast Track (5 Steps)

### Step 1: Copy Textures to Unity (5 minutes)

```bash
# Navigate to Unity project
cd /path/to/your/Unity/NeuroSim/Assets/

# Create directory structure
mkdir -p Resources/AI_Generated_Textures/{Level0_Nasal,Level1_Ostium,Level2_Sinus,Level3_Floor,Level4_Sella,Level5_Critical}

# Copy all textures
cp /Users/matheusrech/simulation-game/unity-tools/unity-textures/*.png Resources/AI_Generated_Textures/

# Organize by surgical level (optional but recommended)
mv Resources/AI_Generated_Textures/nasal*.png Resources/AI_Generated_Textures/Level0_Nasal/
mv Resources/AI_Generated_Textures/sphenoid-ostium*.png Resources/AI_Generated_Textures/Level1_Ostium/
mv Resources/AI_Generated_Textures/sphenoid-sinus*.png Resources/AI_Generated_Textures/Level2_Sinus/
mv Resources/AI_Generated_Textures/sella-floor*.png Resources/AI_Generated_Textures/Level3_Floor/
mv Resources/AI_Generated_Textures/{dura,pituitary,pseudocapsule}*.png Resources/AI_Generated_Textures/Level4_Sella/
mv Resources/AI_Generated_Textures/{ica,mwcs,optic,cavernous}*.png Resources/AI_Generated_Textures/Level5_Critical/
```

### Step 2: Configure Import Settings (5 minutes)

**Option A: Automatic (Recommended)**
1. Copy `Editor/TextureImportAutomation.cs` to `Assets/Editor/`
2. In Unity, select all textures in Project window
3. Right-click → "Configure VR Anatomical Textures"
4. Done! ✅

**Option B: Manual**
For each texture, set in Inspector:
- Max Size: 2048
- Format (Android): ASTC 6x6
- Filter Mode: Trilinear
- Aniso Level: 16
- sRGB: Checked

### Step 3: Integrate with Code (10 minutes)

**Option A: Use UnityIntegration.cs (Fastest)**
1. Copy `UnityIntegration.cs` to `Assets/Scripts/`
2. Attach to your `AnatomyManager` GameObject
3. Drag texture assets to script fields in Inspector
4. Press Play - textures auto-apply! ✅

**Option B: Manual Integration**
Add to your existing anatomy manager:

```csharp
public class YourAnatomyManager : MonoBehaviour
{
    [Header("AI Generated Textures")]
    public Texture2D nasalSeptum;
    public Texture2D sphenoidOstium;
    public Texture2D sphenoidSinus;
    public Texture2D sellaFloor;
    public Texture2D dura;
    public Texture2D pituitaryAdenoma;
    public Texture2D pseudocapsule;
    public Texture2D ica;
    public Texture2D mwcs;
    public Texture2D opticNerve;
    public Texture2D cavernousSinus;

    void Start()
    {
        ApplyTexture("NasalSeptum", nasalSeptum);
        ApplyTexture("SphenoidOstium", sphenoidOstium);
        ApplyTexture("SphenoidSinus", sphenoidSinus);
        ApplyTexture("SellaFloor", sellaFloor);
        ApplyTexture("Dura", dura);
        ApplyTexture("PituitaryAdenoma", pituitaryAdenoma);
        ApplyTexture("Pseudocapsule", pseudocapsule);
        ApplyTexture("ICA_Left", ica);
        ApplyTexture("ICA_Right", ica);
        ApplyTexture("MWCS_Left", mwcs);
        ApplyTexture("MWCS_Right", mwcs);
        ApplyTexture("OpticNerve_Left", opticNerve);
        ApplyTexture("OpticNerve_Right", opticNerve);
        ApplyTexture("CavernousSinus_Left", cavernousSinus);
        ApplyTexture("CavernousSinus_Right", cavernousSinus);
    }

    void ApplyTexture(string objectName, Texture2D texture)
    {
        GameObject obj = GameObject.Find(objectName);
        if (obj != null && texture != null)
        {
            Renderer renderer = obj.GetComponent<Renderer>();
            if (renderer != null)
            {
                renderer.material.mainTexture = texture;
                renderer.material.SetFloat("_Glossiness", 0.8f); // Wet tissue
            }
        }
    }
}
```

### Step 4: Build for Quest 3 (15 minutes)

1. **Switch Platform**:
   - File → Build Settings
   - Platform: Android
   - Texture Compression: ASTC
   - Click "Switch Platform"

2. **Configure Player Settings**:
   - Edit → Project Settings → Player
   - Android tab:
     - Minimum API Level: Android 10.0 (API 29)
     - Target API Level: Automatic (highest installed)
     - Graphics APIs: OpenGLES3, Vulkan
   - XR Plug-in Management:
     - Enable "Oculus" (Quest 3)

3. **Build**:
   - File → Build Settings
   - Click "Build" or "Build and Run"
   - Save as `NeuroSim.apk`

### Step 5: Deploy to Quest 3 (5-10 minutes)

**Option A: Via SideQuest**
1. Connect Quest 3 via USB-C
2. Enable Developer Mode on Quest 3
3. Open SideQuest
4. Drag `NeuroSim.apk` to SideQuest window
5. Launch from "Unknown Sources" in Quest 3

**Option B: Via ADB**
```bash
# Install ADB if not already installed
# brew install android-platform-tools  # macOS

# Connect Quest 3 and verify
adb devices

# Install APK
adb install NeuroSim.apk

# Launch app (optional)
adb shell am start -n com.YourCompany.NeuroSim/.MainActivity
```

---

## ✅ Pre-Flight Checklist

### Before Building
- [ ] All 12 textures imported into Unity
- [ ] Texture import settings configured (ASTC 6x6 for Quest 3)
- [ ] UnityIntegration.cs attached to AnatomyManager
- [ ] All texture fields assigned in Inspector
- [ ] GameObject names match script expectations

### Before Deploying
- [ ] Quest 3 in Developer Mode
- [ ] USB debugging enabled
- [ ] ADB drivers installed (Windows) or platform tools (Mac/Linux)
- [ ] Build completed without errors
- [ ] APK size reasonable (<500 MB recommended)

### After Deploying
- [ ] App launches successfully in Quest 3
- [ ] All anatomical structures visible
- [ ] Textures display correctly (no pink/missing textures)
- [ ] Critical structures (ICA, MWCS) clearly visible
- [ ] Performance smooth (60 FPS minimum)

---

## 🐛 Common Issues & Quick Fixes

### Issue: Pink/Missing Textures in VR
**Cause**: Incorrect import settings or shader issues
**Fix**:
- Check texture format is ASTC 6x6 for Android
- Verify shader is Mobile/Diffuse or similar Quest-compatible shader
- Re-import textures with correct settings

### Issue: Textures Not Applying
**Cause**: GameObject names don't match script
**Fix**:
- Check GameObject names in Hierarchy match the script
- Add Debug.Log() to ApplyTexture() to see what's being found
- Verify Renderer component exists on GameObjects

### Issue: Low Performance in VR
**Cause**: Too many textures, no mipmaps, or wrong compression
**Fix**:
- Enable mipmaps on all textures
- Use ASTC 6x6 compression (smaller file size)
- Reduce Max Size if needed (try 1024 instead of 2048)
- Check with Unity Profiler

### Issue: APK Won't Install
**Cause**: API level mismatch or signing issues
**Fix**:
- Set Minimum API Level to Android 10.0 (API 29)
- Check Quest 3 storage space
- Try uninstalling old version first: `adb uninstall com.YourCompany.NeuroSim`

---

## 📊 Texture File Sizes (Quest 3 Optimized)

After ASTC 6x6 compression in Unity, expect these sizes:

| Texture | Original | Compressed | Memory |
|---------|----------|------------|--------|
| nasal-septum | 630 KB | ~150 KB | 16 MB |
| nasal-turbinate | 653 KB | ~155 KB | 16 MB |
| sphenoid-ostium | 680 KB | ~160 KB | 16 MB |
| sphenoid-sinus | 630 KB | ~150 KB | 16 MB |
| sella-floor | 648 KB | ~155 KB | 16 MB |
| dura | 635 KB | ~150 KB | 16 MB |
| pituitary-adenoma | 670 KB | ~160 KB | 16 MB |
| pseudocapsule | 596 KB | ~145 KB | 16 MB |
| ica | 607 KB | ~145 KB | 16 MB |
| mwcs | 662 KB | ~160 KB | 16 MB |
| optic-nerve | 788 KB | ~185 KB | 16 MB |
| cavernous-sinus | 651 KB | ~155 KB | 16 MB |
| **Total** | **7.6 MB** | **~1.9 MB (APK)** | **192 MB (Runtime)** |

Quest 3 has 8 GB RAM, so 192 MB for textures is <3% of total memory ✅

---

## 🎯 GameObject Naming Convention

The `UnityIntegration.cs` script expects these exact names:

```
Scene Hierarchy:
├── AnatomyManager (attach script here)
├── NasalSeptum
├── SphenoidOstium
├── SphenoidSinus
├── SellaFloor
├── Dura
├── PituitaryAdenoma_Knosp2
├── Pseudocapsule
├── ICA_Left
├── ICA_Right
├── MWCS_Left
├── MWCS_Right
├── OpticNerve_Left
├── OpticNerve_Right
├── CavernousSinus_Left
└── CavernousSinus_Right
```

**Note**: If your GameObject names are different, either:
1. Rename them to match the script
2. OR modify the `ANATOMY_OBJECT_NAMES` dictionary in UnityIntegration.cs

---

## 💡 Pro Tips for Tonight's Launch

1. **Test in Editor First**:
   - Press Play in Unity Editor before building
   - Verify textures apply correctly
   - Check material properties look good
   - Fix any issues before building for Quest 3

2. **Iterative Build**:
   - Do a test build with just 2-3 textures first
   - Verify they work in Quest 3
   - Then do full build with all 12 textures

3. **Keep Source Files**:
   - Don't delete the original PNG files from unity-textures/
   - Keep validation_report.json for reference
   - Save NANO_BANANA_PRO_COMPLETE.md for future reference

4. **Material Presets** (Optional but recommended):
   - Create a "Wet Tissue" material preset:
     - Glossiness: 0.8
     - Metallic: 0.0
     - Smoothness: 0.6
   - Apply this preset to all anatomical structures
   - Then just swap the texture on each

5. **VR-Specific Settings**:
   - Enable Multiview rendering (Quest 3 optimization)
   - Use Forward rendering (not Deferred)
   - Enable Dynamic Batching
   - Set Quality to "Medium" for Quest 3 balance

---

## 📞 Need Help?

### Documentation References
- Full details: `NANO_BANANA_PRO_COMPLETE.md`
- Unity scripts: `UnityIntegration.cs`, `Editor/TextureImportAutomation.cs`
- Medical validation: `validation_report.json`
- Source references: `medical_sources.json`

### Key Files Location
```
/Users/matheusrech/simulation-game/unity-tools/unity-textures/
├── *.png (12 texture files)
├── validation_report.json
├── medical_sources.json
├── UnityIntegration.cs
├── Editor/
│   └── TextureImportAutomation.cs
├── NANO_BANANA_PRO_COMPLETE.md
└── UNITY_QUICK_START.md (this file)
```

---

## ✅ Success Criteria for Tonight

- [ ] All 12 textures visible in Quest 3 VR
- [ ] Critical structures (ICA, MWCS) clearly identifiable
- [ ] Pituitary adenoma texture displays correctly
- [ ] Performance smooth (60 FPS minimum)
- [ ] No pink/missing textures
- [ ] Materials look wet and realistic
- [ ] User can navigate through surgical levels

**If all checked: 🎉 LAUNCH SUCCESS!**

---

**⏱️ Total Estimated Time: 30-45 minutes**

**Good luck with tonight's launch! All textures are production-ready and validated with Nano Banana Pro.** 🚀
