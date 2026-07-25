// ============================================================================
// TextureImportConfig.cs - Auto-Configure AI Textures for Quest 3
// ============================================================================
// Unity Editor script to automatically configure import settings for
// AI-generated anatomical textures optimized for Quest 3 VR
//
// Usage:
// 1. Place this script in Assets/Editor/
// 2. Select textures in Project window (Assets/Resources/AI_Generated/)
// 3. Right-click → "Configure Quest 3 VR Textures"
// 4. Script applies optimal settings for all selected textures
// ============================================================================

#if UNITY_EDITOR
using UnityEngine;
using UnityEditor;
using System.IO;

namespace NeuroSim.Editor
{
    public class TextureImportConfig : AssetPostprocessor
    {
        // ====================================================================
        // Auto-Configuration Menu Item
        // ====================================================================

        [MenuItem("Assets/Configure Quest 3 VR Textures", false, 2000)]
        static void ConfigureVRTextures()
        {
            Object[] selectedTextures = Selection.objects;
            int configuredCount = 0;

            foreach (Object obj in selectedTextures)
            {
                string assetPath = AssetDatabase.GetAssetPath(obj);

                if (IsTextureAsset(assetPath))
                {
                    ConfigureTextureImporter(assetPath);
                    configuredCount++;
                }
            }

            if (configuredCount > 0)
            {
                AssetDatabase.Refresh();
                Debug.Log($"[TextureImportConfig] ✅ Configured {configuredCount} textures for Quest 3 VR");
            }
            else
            {
                Debug.LogWarning("[TextureImportConfig] No valid textures selected. Select PNG/JPG textures and try again.");
            }
        }

        [MenuItem("Assets/Configure Quest 3 VR Textures", true)]
        static bool ValidateConfigureVRTextures()
        {
            // Enable menu item only if at least one texture is selected
            foreach (Object obj in Selection.objects)
            {
                if (IsTextureAsset(AssetDatabase.GetAssetPath(obj)))
                {
                    return true;
                }
            }
            return false;
        }

        // ====================================================================
        // Automatic Configuration on Import
        // ====================================================================

        void OnPreprocessTexture()
        {
            // Auto-configure AI-generated textures on first import
            if (assetPath.Contains("AI_Generated"))
            {
                TextureImporter importer = (TextureImporter)assetImporter;
                ApplyQuest3Settings(importer);

                Debug.Log($"[TextureImportConfig] Auto-configured on import: {Path.GetFileName(assetPath)}");
            }
        }

        // ====================================================================
        // Configuration Logic
        // ====================================================================

        static void ConfigureTextureImporter(string assetPath)
        {
            TextureImporter importer = AssetImporter.GetAtPath(assetPath) as TextureImporter;

            if (importer == null)
            {
                Debug.LogWarning($"[TextureImportConfig] Not a texture: {assetPath}");
                return;
            }

            ApplyQuest3Settings(importer);

            // Save changes
            EditorUtility.SetDirty(importer);
            importer.SaveAndReimport();

            Debug.Log($"[TextureImportConfig] ✅ Configured: {Path.GetFileName(assetPath)}");
        }

        static void ApplyQuest3Settings(TextureImporter importer)
        {
            // ================================================================
            // General Settings
            // ================================================================

            importer.textureType = TextureImporterType.Default;
            importer.textureShape = TextureImporterShape.Texture2D;
            importer.sRGBTexture = true; // Treat as color texture (not normal/data)
            importer.alphaSource = TextureImporterAlphaSource.FromInput;
            importer.alphaIsTransparency = false; // Anatomical textures are opaque

            // ================================================================
            // Wrap and Filter Settings
            // ================================================================

            importer.wrapMode = TextureWrapMode.Clamp; // Prevent texture tiling artifacts
            importer.filterMode = FilterMode.Trilinear; // Smooth filtering for VR
            importer.anisoLevel = 16; // Maximum anisotropic filtering (critical for VR)

            // ================================================================
            // Mipmap Settings
            // ================================================================

            importer.mipmapEnabled = true; // Essential for VR performance
            importer.streamingMipmaps = true; // Memory optimization

            // ================================================================
            // Platform-Specific Settings (Android/Quest 3)
            // ================================================================

            // Get Android platform settings
            TextureImporterPlatformSettings androidSettings = importer.GetPlatformTextureSettings("Android");
            androidSettings.overridden = true;
            androidSettings.maxTextureSize = 2048; // Match source resolution (2048x2048)
            androidSettings.format = TextureImporterFormat.ASTC_6x6; // Quest 3 optimized compression
            androidSettings.compressionQuality = (int)TextureCompressionQuality.Normal;
            androidSettings.androidETC2FallbackOverride = AndroidETC2FallbackOverride.Quality32Bit;

            importer.SetPlatformTextureSettings(androidSettings);

            // ================================================================
            // Standalone Platform (for Unity Editor testing)
            // ================================================================

            TextureImporterPlatformSettings standaloneSettings = importer.GetPlatformTextureSettings("Standalone");
            standaloneSettings.overridden = true;
            standaloneSettings.maxTextureSize = 2048;
            standaloneSettings.format = TextureImporterFormat.DXT5; // Uncompressed for editor
            standaloneSettings.compressionQuality = (int)TextureCompressionQuality.Best;

            importer.SetPlatformTextureSettings(standaloneSettings);
        }

        // ====================================================================
        // Utility Functions
        // ====================================================================

        static bool IsTextureAsset(string assetPath)
        {
            string extension = Path.GetExtension(assetPath).ToLower();
            return extension == ".png" || extension == ".jpg" || extension == ".jpeg";
        }
    }

    // ========================================================================
    // Batch Import Configuration Window (Optional Advanced Tool)
    // ========================================================================

    public class TextureImportWindow : EditorWindow
    {
        private string sourceFolderPath = "Assets/Resources/AI_Generated";

        [MenuItem("Tools/NeuroSim/Configure All AI Textures")]
        static void ShowWindow()
        {
            GetWindow<TextureImportWindow>("AI Texture Config");
        }

        void OnGUI()
        {
            GUILayout.Label("AI Texture Import Configuration", EditorStyles.boldLabel);
            GUILayout.Space(10);

            EditorGUILayout.HelpBox(
                "This tool will configure ALL textures in the specified folder with Quest 3 VR-optimized settings.",
                MessageType.Info
            );

            GUILayout.Space(10);
            sourceFolderPath = EditorGUILayout.TextField("Texture Folder:", sourceFolderPath);

            GUILayout.Space(20);

            if (GUILayout.Button("Configure All Textures", GUILayout.Height(40)))
            {
                ConfigureAllTextures();
            }
        }

        void ConfigureAllTextures()
        {
            if (!Directory.Exists(sourceFolderPath))
            {
                EditorUtility.DisplayDialog("Error", $"Folder not found: {sourceFolderPath}", "OK");
                return;
            }

            string[] texturePaths = Directory.GetFiles(sourceFolderPath, "*.png", SearchOption.AllDirectories);
            int configuredCount = 0;

            foreach (string path in texturePaths)
            {
                string assetPath = path.Replace("\\", "/");
                TextureImportConfig.ConfigureTextureImporter(assetPath);
                configuredCount++;
            }

            AssetDatabase.Refresh();

            EditorUtility.DisplayDialog(
                "Success",
                $"Configured {configuredCount} textures for Quest 3 VR!\n\nSettings applied:\n• ASTC 6x6 compression\n• 2048x2048 max size\n• Trilinear filtering\n• Aniso level 16\n• Mipmaps enabled",
                "OK"
            );

            Debug.Log($"[TextureImportConfig] ✅ Batch configuration complete: {configuredCount} textures");
        }
    }
}
#endif
