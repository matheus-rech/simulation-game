using UnityEngine;
using UnityEditor;
using System.IO;

/// <summary>
/// Unity Editor script to automate importing and configuring AI-generated anatomical textures.
/// Place this file in Assets/Editor/ folder.
///
/// Usage:
/// 1. Copy all PNG textures to Assets/Resources/AI_Generated_Textures/
/// 2. Select all textures in Project window
/// 3. Right-click → "Configure VR Anatomical Textures"
/// 4. Textures will be automatically configured for Quest 3 deployment
/// </summary>
public class TextureImportAutomation : AssetPostprocessor
{
    // Automatically configure texture settings when imported into this folder
    private const string TARGET_FOLDER = "Assets/Resources/AI_Generated_Textures";

    /// <summary>
    /// Unity callback - automatically runs when textures are imported.
    /// </summary>
    void OnPreprocessTexture()
    {
        // Only auto-configure textures in our target folder
        if (!assetPath.Contains(TARGET_FOLDER))
            return;

        Debug.Log($"[TextureImportAutomation] Auto-configuring: {Path.GetFileName(assetPath)}");

        TextureImporter importer = (TextureImporter)assetImporter;

        ConfigureTextureImporter(importer);
    }

    /// <summary>
    /// Menu item to manually configure selected textures.
    /// </summary>
    [MenuItem("Assets/Configure VR Anatomical Textures")]
    private static void ConfigureSelectedTextures()
    {
        Object[] selectedAssets = Selection.objects;

        if (selectedAssets.Length == 0)
        {
            EditorUtility.DisplayDialog(
                "No Textures Selected",
                "Please select texture assets in the Project window first.",
                "OK"
            );
            return;
        }

        int configuredCount = 0;

        foreach (Object asset in selectedAssets)
        {
            string assetPath = AssetDatabase.GetAssetPath(asset);

            if (string.IsNullOrEmpty(assetPath))
                continue;

            TextureImporter importer = AssetImporter.GetAtPath(assetPath) as TextureImporter;

            if (importer != null)
            {
                ConfigureTextureImporter(importer);
                AssetDatabase.ImportAsset(assetPath, ImportAssetOptions.ForceUpdate);
                configuredCount++;

                Debug.Log($"[TextureImportAutomation] Configured: {Path.GetFileName(assetPath)}");
            }
        }

        EditorUtility.DisplayDialog(
            "Texture Configuration Complete",
            $"Successfully configured {configuredCount} textures for Quest 3 VR deployment.",
            "OK"
        );
    }

    /// <summary>
    /// Configures TextureImporter with optimal settings for VR anatomical textures.
    /// </summary>
    private static void ConfigureTextureImporter(TextureImporter importer)
    {
        // Base texture settings
        importer.textureType = TextureImporterType.Default;
        importer.textureShape = TextureImporterShape.Texture2D;
        importer.sRGBTexture = true; // sRGB color space for accurate colors
        importer.alphaSource = TextureImporterAlphaSource.FromGrayScale;
        importer.alphaIsTransparency = false;

        // Wrap and filter settings
        importer.wrapMode = TextureWrapMode.Clamp; // Prevent texture edge artifacts
        importer.filterMode = FilterMode.Trilinear; // Smooth filtering in VR
        importer.anisoLevel = 16; // Maximum anisotropic filtering for VR close-ups

        // Mipmap settings
        importer.mipmapEnabled = true; // Essential for VR performance
        importer.mipmapFilter = TextureImporterMipFilter.KaiserFilter; // High-quality mipmaps

        // Size settings
        importer.maxTextureSize = 2048; // Match generated texture resolution

        // Platform-specific settings for Quest 3 (Android)
        TextureImporterPlatformSettings androidSettings = importer.GetPlatformTextureSettings("Android");
        androidSettings.overridden = true;
        androidSettings.maxTextureSize = 2048;
        androidSettings.format = TextureImporterFormat.ASTC_6x6; // VR-optimized compression
        androidSettings.compressionQuality = (int)TextureCompressionQuality.Normal;
        importer.SetPlatformTextureSettings(androidSettings);

        // Platform settings for Standalone (PC testing)
        TextureImporterPlatformSettings standaloneSettings = importer.GetPlatformTextureSettings("Standalone");
        standaloneSettings.overridden = true;
        standaloneSettings.maxTextureSize = 2048;
        standaloneSettings.format = TextureImporterFormat.DXT5; // PC compression
        standaloneSettings.compressionQuality = (int)TextureCompressionQuality.Best;
        importer.SetPlatformTextureSettings(standaloneSettings);

        // Save changes
        importer.SaveAndReimport();
    }

    /// <summary>
    /// Menu item validator - only enable when textures are selected.
    /// </summary>
    [MenuItem("Assets/Configure VR Anatomical Textures", true)]
    private static bool ValidateConfigureSelectedTextures()
    {
        return Selection.objects.Length > 0;
    }

    /// <summary>
    /// Menu item to batch rename textures to Unity-friendly names.
    /// </summary>
    [MenuItem("Assets/Rename Textures for Unity")]
    private static void RenameTex turesForUnity()
    {
        Object[] selectedAssets = Selection.objects;

        if (selectedAssets.Length == 0)
        {
            EditorUtility.DisplayDialog(
                "No Assets Selected",
                "Please select texture assets to rename.",
                "OK"
            );
            return;
        }

        int renamedCount = 0;

        foreach (Object asset in selectedAssets)
        {
            string assetPath = AssetDatabase.GetAssetPath(asset);

            if (string.IsNullOrEmpty(assetPath))
                continue;

            string fileName = Path.GetFileName(assetPath);
            string directory = Path.GetDirectoryName(assetPath);

            // Convert naming: "pituitary-adenoma_knosp-2.png" → "PituitaryAdenoma_Knosp2.png"
            string newName = ConvertToUnityNaming(fileName);

            if (newName != fileName)
            {
                string newPath = Path.Combine(directory, newName);
                string error = AssetDatabase.MoveAsset(assetPath, newPath);

                if (string.IsNullOrEmpty(error))
                {
                    renamedCount++;
                    Debug.Log($"[TextureImportAutomation] Renamed: {fileName} → {newName}");
                }
                else
                {
                    Debug.LogError($"[TextureImportAutomation] Failed to rename {fileName}: {error}");
                }
            }
        }

        AssetDatabase.Refresh();

        EditorUtility.DisplayDialog(
            "Rename Complete",
            $"Renamed {renamedCount} textures to Unity naming convention.",
            "OK"
        );
    }

    /// <summary>
    /// Converts texture filename to Unity naming convention.
    /// Example: "pituitary-adenoma_knosp-2.png" → "PituitaryAdenoma_Knosp2.png"
    /// </summary>
    private static string ConvertToUnityNaming(string fileName)
    {
        // Remove extension
        string nameWithoutExt = Path.GetFileNameWithoutExtension(fileName);
        string extension = Path.GetExtension(fileName);

        // Remove "_standard" suffix if present
        nameWithoutExt = nameWithoutExt.Replace("_standard", "");

        // Split by hyphens and underscores
        string[] parts = nameWithoutExt.Split(new[] { '-', '_' }, System.StringSplitOptions.RemoveEmptyEntries);

        // Capitalize each part
        for (int i = 0; i < parts.Length; i++)
        {
            if (parts[i].Length > 0)
            {
                parts[i] = char.ToUpper(parts[i][0]) + parts[i].Substring(1);
            }
        }

        // Join with no separator (PascalCase)
        string newName = string.Join("", parts);

        return newName + extension;
    }

    /// <summary>
    /// Creates recommended folder structure for textures.
    /// </summary>
    [MenuItem("Assets/Create AI Texture Folder Structure")]
    private static void CreateFolderStructure()
    {
        string[] folders = new[]
        {
            "Assets/Resources/AI_Generated_Textures",
            "Assets/Resources/AI_Generated_Textures/Level0_Nasal",
            "Assets/Resources/AI_Generated_Textures/Level1_Ostium",
            "Assets/Resources/AI_Generated_Textures/Level2_Sinus",
            "Assets/Resources/AI_Generated_Textures/Level3_Floor",
            "Assets/Resources/AI_Generated_Textures/Level4_Sella",
            "Assets/Resources/AI_Generated_Textures/Level5_Critical"
        };

        foreach (string folder in folders)
        {
            if (!AssetDatabase.IsValidFolder(folder))
            {
                string parentFolder = Path.GetDirectoryName(folder).Replace("\\", "/");
                string newFolderName = Path.GetFileName(folder);

                AssetDatabase.CreateFolder(parentFolder, newFolderName);
                Debug.Log($"[TextureImportAutomation] Created folder: {folder}");
            }
        }

        AssetDatabase.Refresh();

        EditorUtility.DisplayDialog(
            "Folder Structure Created",
            "AI texture folder structure created successfully.\n\n" +
            "Organize your textures by surgical level:\n" +
            "- Level0: Nasal approach\n" +
            "- Level1: Sphenoid ostium\n" +
            "- Level2: Sphenoid sinus\n" +
            "- Level3: Sella floor\n" +
            "- Level4: Sella contents\n" +
            "- Level5: Critical structures",
            "OK"
        );
    }

    /// <summary>
    /// Generates a texture quality report.
    /// </summary>
    [MenuItem("Assets/Generate Texture Quality Report")]
    private static void GenerateQualityReport()
    {
        Object[] selectedAssets = Selection.objects;

        if (selectedAssets.Length == 0)
        {
            EditorUtility.DisplayDialog(
                "No Textures Selected",
                "Please select texture assets to analyze.",
                "OK"
            );
            return;
        }

        System.Text.StringBuilder report = new System.Text.StringBuilder();
        report.AppendLine("=== AI Anatomical Texture Quality Report ===\n");
        report.AppendLine($"Generated: {System.DateTime.Now}\n");
        report.AppendLine($"Analyzed Textures: {selectedAssets.Length}\n");
        report.AppendLine("Texture Details:");
        report.AppendLine("─────────────────────────────────────────────\n");

        long totalMemory = 0;

        foreach (Object asset in selectedAssets)
        {
            Texture2D texture = asset as Texture2D;

            if (texture == null)
                continue;

            string assetPath = AssetDatabase.GetAssetPath(texture);
            TextureImporter importer = AssetImporter.GetAtPath(assetPath) as TextureImporter;

            if (importer == null)
                continue;

            long memorySize = UnityEngine.Profiling.Profiler.GetRuntimeMemorySizeLong(texture);
            totalMemory += memorySize;

            report.AppendLine($"Name: {texture.name}");
            report.AppendLine($"Resolution: {texture.width}x{texture.height}");
            report.AppendLine($"Format: {texture.format}");
            report.AppendLine($"Memory: {FormatBytes(memorySize)}");
            report.AppendLine($"Mipmaps: {texture.mipmapCount}");
            report.AppendLine($"Compression: {importer.textureCompression}");
            report.AppendLine($"Max Size: {importer.maxTextureSize}");
            report.AppendLine($"Aniso Level: {importer.anisoLevel}");
            report.AppendLine();
        }

        report.AppendLine("─────────────────────────────────────────────");
        report.AppendLine($"Total Memory Usage: {FormatBytes(totalMemory)}");

        Debug.Log(report.ToString());

        EditorUtility.DisplayDialog(
            "Quality Report Generated",
            $"Analyzed {selectedAssets.Length} textures.\n\n" +
            $"Total memory: {FormatBytes(totalMemory)}\n\n" +
            "See Console for full report.",
            "OK"
        );
    }

    /// <summary>
    /// Helper to format byte sizes.
    /// </summary>
    private static string FormatBytes(long bytes)
    {
        string[] sizes = { "B", "KB", "MB", "GB" };
        double len = bytes;
        int order = 0;

        while (len >= 1024 && order < sizes.Length - 1)
        {
            order++;
            len = len / 1024;
        }

        return $"{len:0.##} {sizes[order]}";
    }
}
