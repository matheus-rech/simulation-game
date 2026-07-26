# NeuroSim - Comprehensive Test Plan

**Date**: January 22, 2026, 22:22
**Status**: Ready for Testing (Web Platform) + Unity Setup Complete

---

## ✅ What's Ready NOW (Before Unity)

### 1. Web Platform - Production Build ✅
- **Build Status**: SUCCESS (6.64s)
- **Bundle Size**: 3.54 MB (minified), 1.2 MB (gzipped)
- **TypeScript**: 0 errors
- **Tests**: 164/164 passing

### 2. Unity Setup Script ✅
- **Script**: `setup-unity-vr.sh` (executable, committed, pushed)
- **Usage**: Run after Unity Hub is installed
- **Functionality**: Automated project creation and asset import

---

## 📋 Testing Plan

### **Phase 1: Web Platform Testing** (NOW - 30 minutes)

#### Test A: Development Server
```bash
cd /Users/matheusrech/simulation-game
npm run dev
```

**What to Test**:
1. ✅ Application loads at http://localhost:5173
2. ✅ No console errors in browser DevTools
3. ✅ Three.js scene renders (black background with anatomy)
4. ✅ Level controls work (Level 1 → 2 → 3)
5. ✅ Progressive revelation shows structures at each level
6. ✅ Endoscope moves with arrow keys
7. ✅ Collision detection triggers score changes
8. ✅ Safety HUD displays (if at Level 2+)
9. ✅ Performance: 60 FPS maintained
10. ✅ Wireframe toggle works (press W key)

**Expected Results**:
- Level 1: Nasal cavity, sphenoid sinus visible
- Level 2: Sella turcica, pituitary tumor visible
- Level 3: ICA (pulsating), MWCS, critical structures visible

#### Test B: Production Build Preview
```bash
npm run preview
```

**What to Test**:
1. ✅ Production build serves at http://localhost:4173
2. ✅ Same functionality as dev server
3. ✅ Optimized performance (production mode)
4. ✅ No build warnings (chunk size warning is expected)

#### Test C: Automated Tests
```bash
npm test
```

**What to Test**:
1. ✅ All 164 tests pass
2. ✅ CSGOperations tests (38 tests)
3. ✅ ProceduralGeometry tests (29 tests)
4. ✅ CollisionManager tests (26 tests)
5. ✅ SafetyHUD tests
6. ✅ No test failures or errors

#### Test D: Type Checking
```bash
npm run type-check
```

**Expected**: ✅ 0 TypeScript errors

#### Test E: Build Verification
```bash
npm run build
```

**Expected**:
- ✅ Build completes successfully
- ✅ Output in `dist/` folder
- ✅ index.html + assets generated

---

### **Phase 2: Unity Setup** (After Unity Hub Download - 60-90 minutes)

#### Step 1: Download Unity Hub (10 minutes)
```bash
# 1. Visit: https://unity.com/download
# 2. Download "Unity Hub for macOS"
# 3. Install Unity Hub.app to /Applications/
# 4. Open Unity Hub
# 5. Sign in / Create account (free)
```

#### Step 2: Install Unity Editor (15-20 minutes)
```bash
# In Unity Hub:
# 1. Go to "Installs" tab
# 2. Click "Install Editor"
# 3. Select "Unity 2023.2.20f1 LTS" (or later 2023.2.x)
# 4. Add modules:
#    - ✅ Android Build Support
#    - ✅ Android SDK & NDK Tools
#    - ✅ OpenJDK
# 5. Click "Install" (downloads ~8 GB, takes 15-20 min)
```

#### Step 3: Run Unity Setup Script (5 minutes)
```bash
cd /Users/matheusrech/simulation-game
./setup-unity-vr.sh

# Or specify custom path:
./setup-unity-vr.sh ~/Desktop/NeuroSim-VR
```

**What the Script Does**:
- ✅ Checks Unity Hub and Editor installation
- ✅ Verifies source assets (12 textures, 4 scripts)
- ✅ Prompts to create Unity project in Unity Hub
- ✅ Copies all assets to Unity project
- ✅ Updates package manifest with XR dependencies
- ✅ Provides next steps

#### Step 4: Configure Unity Project (20 minutes)
```bash
# Manual steps in Unity Editor:
# 1. Open Unity Hub
# 2. Click "Add" → Select project folder
# 3. Double-click to open project
# 4. Wait for asset import (~2-3 minutes)
# 5. Check Console for errors (should be none)
# 6. Install XR packages (if not auto-installed):
#    - Window → Package Manager
#    - Install: XR Plugin Management
#    - Install: XR Interaction Toolkit
#    - Install: Oculus XR Plugin
```

#### Step 5: Create Anatomical Prefabs (20-30 minutes)
Follow `unity-project/UNITY_INTEGRATION_GUIDE.md` section "Step 5"

**For Each Structure**:
1. Create 3D mesh (GameObject → 3D Object → appropriate shape)
2. Create Material (Right-click → Create → Material)
3. Set Shader: Medical/SurgicalTissue
4. Assign AI texture from Resources/AI_Generated/
5. Configure material properties
6. Save as Prefab

**Required Prefabs**:
- Nasal Septum
- Nasal Turbinate
- Sphenoid Sinus
- Sella Turcica
- Pituitary Adenoma
- ICA (Left & Right)
- MWCS (Left & Right)

#### Step 6: Setup VR Scene (15 minutes)
```bash
# In Unity:
# 1. Create new scene: Assets/Scenes/VRTraining.unity
# 2. Delete default Main Camera
# 3. Add XR Origin (GameObject → XR → XR Origin)
# 4. Create empty GameObject → Add AnatomyManager script
# 5. Assign prefabs in Inspector
# 6. Configure lighting
```

#### Step 7: Build for Quest 3 (10 minutes + 5-10 min first build)
```bash
# In Unity:
# 1. File → Build Settings
# 2. Switch to Android platform
# 3. Connect Quest 3 via USB-C
# 4. Enable Developer Mode on Quest 3
# 5. Click "Build And Run"
# 6. Wait for build (~5-10 min first time)
# 7. APK auto-deploys to Quest 3
```

---

### **Phase 3: Unity VR Testing** (After Deployment - 15 minutes)

#### Test in Unity Editor
1. ✅ Press Play in Unity Editor
2. ✅ All anatomy loads at correct positions
3. ✅ Materials render correctly
4. ✅ ICA arteries pulsate at 75 BPM
5. ✅ Level system works (1 → 2 → 3)
6. ✅ No console errors

#### Test on Quest 3
1. ✅ Application launches on Quest 3
2. ✅ All 12 AI textures render correctly
3. ✅ 72 FPS maintained
4. ✅ ICA pulsation visible in VR
5. ✅ No visual artifacts
6. ✅ VR controls responsive
7. ✅ No motion sickness (smooth performance)

---

## 🎯 Recommended Testing Order

### **Tonight** (30 minutes - Web Platform Only)
```bash
# Terminal 1: Run dev server
cd /Users/matheusrech/simulation-game
npm run dev

# Open browser: http://localhost:5173
# Test all features (see Phase 1 checklist above)

# Terminal 2: Run tests
npm test

# Terminal 3: Verify build
npm run build
npm run preview
```

**Goal**: Verify web platform is production-ready ✅

### **Tomorrow** (or when ready - Unity Setup)
```bash
# 1. Download Unity Hub (10 min)
# 2. Install Unity Editor 2023.2+ (20 min)
# 3. Run setup script (5 min):
./setup-unity-vr.sh

# 4. Follow UNITY_INTEGRATION_GUIDE.md (60 min)
# 5. Build for Quest 3 (15 min)
# 6. Test in VR (15 min)
```

**Goal**: Deployable Quest 3 VR app ✅

---

## 📊 Success Criteria

### Web Platform (Phase 1)
- [x] TypeScript: 0 errors
- [x] Build: Successful
- [x] Tests: 164/164 passing
- [ ] Dev server: Runs without errors
- [ ] Progressive revelation: Works correctly
- [ ] Collision detection: Triggers properly
- [ ] Performance: 60 FPS maintained
- [ ] Visual quality: AI textures render correctly

### Unity VR (Phase 2 & 3)
- [ ] Unity Hub: Installed
- [ ] Unity Editor: 2023.2+ installed
- [ ] Project: Created successfully
- [ ] Assets: All imported without errors
- [ ] Prefabs: Created for all 12 structures
- [ ] Scene: VR scene configured
- [ ] Build: Deploys to Quest 3
- [ ] VR Testing: All features work, 72 FPS

---

## 🐛 Troubleshooting Guide

### Web Platform Issues

**Problem**: Dev server won't start
```bash
# Solution: Check if port 5173 is in use
lsof -ti:5173 && kill $(lsof -ti:5173)
npm run dev
```

**Problem**: Console errors about missing textures
```bash
# Solution: Verify AI textures exist
ls -lh public/textures/anatomy/
# Should show 12 PNG files
```

**Problem**: Low FPS in browser
```bash
# Solution: Check browser GPU acceleration
# Chrome: chrome://gpu
# Enable "Hardware acceleration" in Settings
```

### Unity Issues

**Problem**: Unity Hub won't open
```bash
# Solution: Check installation
ls -la "/Applications/Unity Hub.app"
# Reinstall if missing
```

**Problem**: Script compilation errors
```bash
# Solution: Check C# syntax
# 1. Open Console window in Unity
# 2. Double-click error to open script
# 3. Fix syntax error
# 4. Save and wait for recompilation
```

**Problem**: Textures not importing
```bash
# Solution: Verify texture format
# 1. Select texture in Project window
# 2. Check Inspector: should be "Default" texture type
# 3. Click "Apply"
```

**Problem**: Quest 3 not detected
```bash
# Solution: Enable Developer Mode
# 1. Install Meta Quest mobile app
# 2. Go to Settings → Developer Mode → Enable
# 3. Connect Quest 3 to computer via USB-C
# 4. Allow USB debugging on Quest 3
# 5. Run: adb devices (should show device)
```

---

## 📈 Performance Benchmarks

### Web Platform (Expected)
- **FPS**: 60 FPS (desktop), 30-60 FPS (mobile)
- **Load Time**: <3 seconds
- **Memory**: <200 MB
- **Bundle Size**: 1.2 MB gzipped

### Unity VR (Expected)
- **FPS**: 72 FPS (Quest 3 native)
- **Load Time**: <5 seconds
- **Memory**: <300 MB
- **APK Size**: ~150 MB (with textures)

---

## ✅ Quick Test Commands

```bash
# Web Platform
npm run dev          # Start dev server
npm test             # Run all tests
npm run build        # Production build
npm run type-check   # TypeScript check

# Unity Setup (after Unity Hub installed)
./setup-unity-vr.sh  # Automated setup

# Verify Assets
ls -R unity-project/Assets/  # Check all assets exist
```

---

## 📚 Documentation Reference

1. **TEST_PLAN.md** - This document
2. **UNITY_INTEGRATION_GUIDE.md** - Complete Unity setup guide
3. **DEPLOYMENT_COMPLETE.md** - Overall deployment status
4. **CLAUDE.md** - Architecture and codebase overview

---

## 🚀 Next Action

### **Right Now** (Recommended):
```bash
cd /Users/matheusrech/simulation-game
npm run dev
```

**Then**:
1. Open http://localhost:5173 in browser
2. Test all features (30 minutes)
3. Verify everything works as expected
4. Report any issues

### **Later** (When ready for Unity):
1. Download Unity Hub
2. Install Unity Editor 2023.2+
3. Run `./setup-unity-vr.sh`
4. Follow UNITY_INTEGRATION_GUIDE.md
5. Build and deploy to Quest 3

---

**Generated**: January 22, 2026, 22:22
**Status**: ✅ Web Platform Ready for Testing | Unity Setup Script Ready
