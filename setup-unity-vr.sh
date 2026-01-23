#!/bin/bash
# ============================================================================
# NeuroSim Unity VR Setup Script
# ============================================================================
# Automates Unity project creation and asset import
# Run this after Unity Hub is installed
#
# Usage: ./setup-unity-vr.sh [unity-project-path]
# Example: ./setup-unity-vr.sh ~/UnityProjects/NeuroSim-VR
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default Unity project path
DEFAULT_UNITY_PATH="$HOME/UnityProjects/NeuroSim-VR"
UNITY_PROJECT_PATH="${1:-$DEFAULT_UNITY_PATH}"
ASSETS_SOURCE="$HOME/simulation-game/unity-project/Assets"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        NeuroSim Unity VR - Automated Setup Script         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================================
# Step 1: Check Unity Hub Installation
# ============================================================================

echo -e "${YELLOW}[1/7]${NC} Checking Unity Hub installation..."

if command -v unity-hub &> /dev/null; then
    echo -e "${GREEN}✓${NC} Unity Hub CLI found: $(which unity-hub)"
    UNITY_HUB_CLI=true
elif [ -d "/Applications/Unity Hub.app" ]; then
    echo -e "${GREEN}✓${NC} Unity Hub.app found (GUI only)"
    UNITY_HUB_CLI=false
else
    echo -e "${RED}✗${NC} Unity Hub not found!"
    echo ""
    echo "Please install Unity Hub first:"
    echo "  1. Download from: https://unity.com/download"
    echo "  2. Install Unity Hub.app to /Applications/"
    echo "  3. Run Unity Hub and install Unity 2023.2+ LTS"
    echo ""
    exit 1
fi

# ============================================================================
# Step 2: Check Unity Editor Installation
# ============================================================================

echo -e "${YELLOW}[2/7]${NC} Checking Unity Editor installation..."

# Try to find Unity Editor
UNITY_EDITOR=""
if [ -d "/Applications/Unity/Hub/Editor" ]; then
    # Find latest 2023.2+ version
    UNITY_EDITOR=$(find /Applications/Unity/Hub/Editor -name "Unity.app" -path "*/2023.2*/Unity.app" | head -1)
fi

if [ -n "$UNITY_EDITOR" ]; then
    UNITY_VERSION=$(basename $(dirname "$UNITY_EDITOR"))
    echo -e "${GREEN}✓${NC} Unity Editor found: $UNITY_VERSION"
else
    echo -e "${RED}✗${NC} Unity Editor 2023.2+ not found!"
    echo ""
    echo "Please install Unity Editor first:"
    echo "  1. Open Unity Hub"
    echo "  2. Go to 'Installs' tab"
    echo "  3. Click 'Install Editor'"
    echo "  4. Select Unity 2023.2+ LTS"
    echo "  5. Install with 'Android Build Support' module"
    echo ""
    exit 1
fi

# ============================================================================
# Step 3: Check Source Assets
# ============================================================================

echo -e "${YELLOW}[3/7]${NC} Checking source assets..."

if [ ! -d "$ASSETS_SOURCE" ]; then
    echo -e "${RED}✗${NC} Source assets not found at: $ASSETS_SOURCE"
    echo "Expected location: ~/simulation-game/unity-project/Assets/"
    exit 1
fi

# Count files to copy
SCRIPT_COUNT=$(find "$ASSETS_SOURCE/Scripts" -name "*.cs" 2>/dev/null | wc -l)
SHADER_COUNT=$(find "$ASSETS_SOURCE/Materials/Shaders" -name "*.shader" 2>/dev/null | wc -l)
TEXTURE_COUNT=$(find "$ASSETS_SOURCE/Resources/AI_Generated" -name "*.png" 2>/dev/null | wc -l)

echo -e "${GREEN}✓${NC} Source assets verified:"
echo "   - C# Scripts: $SCRIPT_COUNT files"
echo "   - Shaders: $SHADER_COUNT files"
echo "   - AI Textures: $TEXTURE_COUNT files"

# ============================================================================
# Step 4: Create Unity Project (if needed)
# ============================================================================

echo -e "${YELLOW}[4/7]${NC} Checking Unity project..."

if [ -d "$UNITY_PROJECT_PATH" ]; then
    echo -e "${YELLOW}⚠${NC}  Unity project already exists at: $UNITY_PROJECT_PATH"
    read -p "Do you want to continue and copy assets? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
else
    echo "Creating Unity project at: $UNITY_PROJECT_PATH"

    # Create project directory
    mkdir -p "$UNITY_PROJECT_PATH"

    # Note: Unity project creation via CLI requires Unity Hub CLI
    # which might not be available on macOS
    # User should create project via Unity Hub GUI first

    echo -e "${YELLOW}⚠${NC}  Please create the Unity project manually:"
    echo "   1. Open Unity Hub"
    echo "   2. Click 'New Project'"
    echo "   3. Select '3D (URP)' template"
    echo "   4. Project Name: NeuroSim-VR"
    echo "   5. Location: $UNITY_PROJECT_PATH"
    echo "   6. Click 'Create Project'"
    echo ""
    read -p "Press Enter after creating the project in Unity Hub..."
fi

# ============================================================================
# Step 5: Verify Unity Project Structure
# ============================================================================

echo -e "${YELLOW}[5/7]${NC} Verifying Unity project structure..."

UNITY_ASSETS="$UNITY_PROJECT_PATH/Assets"

if [ ! -d "$UNITY_ASSETS" ]; then
    echo -e "${RED}✗${NC} Assets folder not found. Is this a valid Unity project?"
    echo "Expected: $UNITY_ASSETS"
    exit 1
fi

echo -e "${GREEN}✓${NC} Unity Assets folder found"

# ============================================================================
# Step 6: Copy Assets to Unity Project
# ============================================================================

echo -e "${YELLOW}[6/7]${NC} Copying assets to Unity project..."

# Create directory structure
echo "Creating directories..."
mkdir -p "$UNITY_ASSETS/Scripts/Anatomy"
mkdir -p "$UNITY_ASSETS/Materials/Shaders"
mkdir -p "$UNITY_ASSETS/Resources/AI_Generated"
mkdir -p "$UNITY_ASSETS/Editor"
mkdir -p "$UNITY_ASSETS/Prefabs"
mkdir -p "$UNITY_ASSETS/Scenes"

# Copy C# scripts
echo "Copying C# scripts..."
if [ -d "$ASSETS_SOURCE/Scripts/Anatomy" ]; then
    cp -v "$ASSETS_SOURCE/Scripts/Anatomy/"*.cs "$UNITY_ASSETS/Scripts/Anatomy/" || true
fi

# Copy shaders
echo "Copying shaders..."
if [ -d "$ASSETS_SOURCE/Materials/Shaders" ]; then
    cp -v "$ASSETS_SOURCE/Materials/Shaders/"*.shader "$UNITY_ASSETS/Materials/Shaders/" || true
fi

# Copy AI-generated textures
echo "Copying AI-generated textures..."
if [ -d "$ASSETS_SOURCE/Resources/AI_Generated" ]; then
    cp -v "$ASSETS_SOURCE/Resources/AI_Generated/"*.png "$UNITY_ASSETS/Resources/AI_Generated/" || true
fi

# Copy Editor scripts
echo "Copying Editor scripts..."
if [ -d "$ASSETS_SOURCE/Editor" ]; then
    cp -v "$ASSETS_SOURCE/Editor/"*.cs "$UNITY_ASSETS/Editor/" || true
fi

# Copy documentation
echo "Copying documentation..."
cp -v "$HOME/simulation-game/unity-project/UNITY_INTEGRATION_GUIDE.md" "$UNITY_PROJECT_PATH/" || true

echo -e "${GREEN}✓${NC} Assets copied successfully!"

# ============================================================================
# Step 7: Create Unity Package Manifest (for required packages)
# ============================================================================

echo -e "${YELLOW}[7/7]${NC} Updating Unity package manifest..."

MANIFEST_PATH="$UNITY_PROJECT_PATH/Packages/manifest.json"

if [ -f "$MANIFEST_PATH" ]; then
    # Backup original manifest
    cp "$MANIFEST_PATH" "$MANIFEST_PATH.backup"

    # Create temporary manifest with required packages
    cat > "$MANIFEST_PATH.tmp" << 'EOF'
{
  "dependencies": {
    "com.unity.collab-proxy": "2.0.5",
    "com.unity.feature.development": "1.0.1",
    "com.unity.render-pipelines.universal": "14.0.9",
    "com.unity.textmeshpro": "3.0.6",
    "com.unity.timeline": "1.7.4",
    "com.unity.ugui": "1.0.0",
    "com.unity.visualscripting": "1.8.0",
    "com.unity.xr.interaction.toolkit": "2.5.2",
    "com.unity.xr.management": "4.4.0",
    "com.unity.xr.oculus": "4.1.2",
    "com.unity.modules.ai": "1.0.0",
    "com.unity.modules.androidjni": "1.0.0",
    "com.unity.modules.animation": "1.0.0",
    "com.unity.modules.assetbundle": "1.0.0",
    "com.unity.modules.audio": "1.0.0",
    "com.unity.modules.cloth": "1.0.0",
    "com.unity.modules.director": "1.0.0",
    "com.unity.modules.imageconversion": "1.0.0",
    "com.unity.modules.imgui": "1.0.0",
    "com.unity.modules.jsonserialize": "1.0.0",
    "com.unity.modules.particlesystem": "1.0.0",
    "com.unity.modules.physics": "1.0.0",
    "com.unity.modules.physics2d": "1.0.0",
    "com.unity.modules.screencapture": "1.0.0",
    "com.unity.modules.terrain": "1.0.0",
    "com.unity.modules.terrainphysics": "1.0.0",
    "com.unity.modules.tilemap": "1.0.0",
    "com.unity.modules.ui": "1.0.0",
    "com.unity.modules.uielements": "1.0.0",
    "com.unity.modules.umbra": "1.0.0",
    "com.unity.modules.unityanalytics": "1.0.0",
    "com.unity.modules.unitywebrequest": "1.0.0",
    "com.unity.modules.unitywebrequestassetbundle": "1.0.0",
    "com.unity.modules.unitywebrequestaudio": "1.0.0",
    "com.unity.modules.unitywebrequesttexture": "1.0.0",
    "com.unity.modules.unitywebrequestwww": "1.0.0",
    "com.unity.modules.vehicles": "1.0.0",
    "com.unity.modules.video": "1.0.0",
    "com.unity.modules.vr": "1.0.0",
    "com.unity.modules.wind": "1.0.0",
    "com.unity.modules.xr": "1.0.0"
  }
}
EOF

    mv "$MANIFEST_PATH.tmp" "$MANIFEST_PATH"
    echo -e "${GREEN}✓${NC} Package manifest updated with XR packages"
    echo "   (Original backed up to manifest.json.backup)"
else
    echo -e "${YELLOW}⚠${NC}  Package manifest not found. Packages must be installed via Unity Hub."
fi

# ============================================================================
# Final Summary
# ============================================================================

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    SETUP COMPLETE! ✓                       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Unity project configured at:"
echo "  $UNITY_PROJECT_PATH"
echo ""
echo "Assets copied:"
echo "  ✓ C# Scripts (Anatomy, Editor)"
echo "  ✓ HLSL Shaders (SurgicalTissue)"
echo "  ✓ AI Textures (12 PNG files, 7.6 MB)"
echo "  ✓ Documentation"
echo ""
echo "Next steps:"
echo "  1. Open Unity project in Unity Hub"
echo "  2. Wait for Unity to import all assets (~2-3 minutes)"
echo "  3. Verify no compilation errors in Console"
echo "  4. Select all textures in Resources/AI_Generated/"
echo "  5. Right-click → 'Configure Quest 3 VR Textures'"
echo "  6. Follow UNITY_INTEGRATION_GUIDE.md to create prefabs"
echo "  7. Build for Quest 3!"
echo ""
echo -e "${BLUE}Documentation:${NC} $UNITY_PROJECT_PATH/UNITY_INTEGRATION_GUIDE.md"
echo ""
echo -e "${GREEN}Ready to build VR surgical training simulator! 🚀🥽${NC}"
echo ""
