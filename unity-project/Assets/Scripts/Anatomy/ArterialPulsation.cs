// ============================================================================
// ArterialPulsation.cs - Realistic ICA Arterial Pulsation Component
// ============================================================================
// Simulates realistic arterial pulsation for Internal Carotid Artery (ICA)
// Features:
// - Scale-based vessel expansion/contraction
// - Material glow pulsation (shader parameter)
// - Spatial audio (heartbeat sound near ICA)
// - Configurable heart rate (60-120 BPM)
// ============================================================================

using UnityEngine;

namespace NeuroSim.Anatomy
{
    [RequireComponent(typeof(Renderer))]
    public class ArterialPulsation : MonoBehaviour
    {
        [Header("Pulsation Settings")]
        [Tooltip("Heart rate in beats per minute")]
        [Range(60, 120)]
        public float heartRate = 75f;

        [Tooltip("Strength of arterial pulsation (vessel expansion)")]
        [Range(0.01f, 0.1f)]
        public float pulsationStrength = 0.05f;

        [Header("Audio Settings")]
        [Tooltip("Enable spatial heartbeat sound")]
        public bool enableHeartbeatSound = true;

        [Tooltip("Heartbeat audio clip (assign in Inspector)")]
        public AudioClip heartbeatClip;

        [Tooltip("Audio volume (0-1)")]
        [Range(0f, 1f)]
        public float audioVolume = 0.2f;

        [Tooltip("Maximum distance for 3D spatial audio (meters)")]
        [Range(0.1f, 1.0f)]
        public float audioMaxDistance = 0.5f;

        // Internal state
        private Vector3 baseScale;
        private Material material;
        private AudioSource heartbeatSound;
        private bool isInitialized = false;

        // ====================================================================
        // Initialization
        // ====================================================================

        void Start()
        {
            Initialize();
        }

        private void Initialize()
        {
            if (isInitialized) return;

            // Store original scale
            baseScale = transform.localScale;

            // Get material reference
            Renderer renderer = GetComponent<Renderer>();
            if (renderer != null)
            {
                material = renderer.material;
            }
            else
            {
                Debug.LogWarning($"[ArterialPulsation] No Renderer found on {gameObject.name}");
            }

            // Setup spatial audio for immersion
            if (enableHeartbeatSound)
            {
                SetupHeartbeatAudio();
            }

            isInitialized = true;
            Debug.Log($"[ArterialPulsation] Initialized on {gameObject.name} at {heartRate} BPM");
        }

        // ====================================================================
        // Pulsation Update
        // ====================================================================

        void Update()
        {
            if (!isInitialized) Initialize();

            // Calculate pulsation using sine wave based on heart rate
            float beatsPerSecond = heartRate / 60f;
            float pulse = Mathf.Sin(Time.time * beatsPerSecond * Mathf.PI * 2f) * 0.5f + 0.5f;

            // Apply scale pulsation (realistic vessel expansion/contraction)
            ApplyScalePulsation(pulse);

            // Apply material glow pulsation (shader parameter)
            ApplyMaterialPulsation(pulse);

            // Modulate heartbeat sound pitch
            ModulateHeartbeatPitch(pulse);
        }

        private void ApplyScalePulsation(float pulse)
        {
            // Expand and contract the arterial mesh
            float scaleFactor = 1f + (pulse * pulsationStrength);
            transform.localScale = baseScale * scaleFactor;
        }

        private void ApplyMaterialPulsation(float pulse)
        {
            // Update shader pulsation parameter (if using SurgicalTissue shader)
            if (material != null && material.HasProperty("_Pulsation"))
            {
                material.SetFloat("_Pulsation", pulse);
            }
        }

        private void ModulateHeartbeatPitch(float pulse)
        {
            // Vary pitch slightly with pulsation for realism
            if (heartbeatSound != null && heartbeatSound.isPlaying)
            {
                heartbeatSound.pitch = 0.9f + (pulse * 0.2f); // Pitch range: 0.9-1.1
            }
        }

        // ====================================================================
        // Spatial Audio Setup
        // ====================================================================

        private void SetupHeartbeatAudio()
        {
            // Create AudioSource component for 3D spatial sound
            heartbeatSound = gameObject.AddComponent<AudioSource>();

            // Configure audio clip
            heartbeatSound.clip = heartbeatClip;
            heartbeatSound.loop = true;

            // Configure 3D spatial audio
            heartbeatSound.spatialBlend = 1.0f; // Full 3D sound
            heartbeatSound.maxDistance = audioMaxDistance;
            heartbeatSound.volume = audioVolume;
            heartbeatSound.rolloffMode = AudioRolloffMode.Linear;
            heartbeatSound.playOnAwake = false;

            // Play heartbeat sound if clip is assigned
            if (heartbeatClip != null)
            {
                heartbeatSound.Play();
                Debug.Log($"[ArterialPulsation] Heartbeat audio playing on {gameObject.name}");
            }
            else
            {
                Debug.LogWarning($"[ArterialPulsation] No heartbeat audio clip assigned to {gameObject.name}");
            }
        }

        // ====================================================================
        // Lifecycle Management
        // ====================================================================

        void OnEnable()
        {
            // Resume pulsation when enabled
            if (isInitialized && heartbeatSound != null && !heartbeatSound.isPlaying && heartbeatClip != null)
            {
                heartbeatSound.Play();
            }
        }

        void OnDisable()
        {
            // Reset scale when disabled
            if (isInitialized && baseScale != Vector3.zero)
            {
                transform.localScale = baseScale;
            }

            // Stop heartbeat sound
            if (heartbeatSound != null && heartbeatSound.isPlaying)
            {
                heartbeatSound.Stop();
            }
        }

        void OnDestroy()
        {
            // Clean up audio resources
            if (heartbeatSound != null)
            {
                heartbeatSound.Stop();
                Destroy(heartbeatSound);
            }
        }

        // ====================================================================
        // Public API
        // ====================================================================

        /// <summary>
        /// Set heart rate dynamically (e.g., for crisis scenarios)
        /// </summary>
        public void SetHeartRate(float bpm)
        {
            heartRate = Mathf.Clamp(bpm, 60f, 180f);
            Debug.Log($"[ArterialPulsation] Heart rate changed to {heartRate} BPM");
        }

        /// <summary>
        /// Stop pulsation (e.g., for ICA injury crisis)
        /// </summary>
        public void StopPulsation()
        {
            enabled = false;
            if (heartbeatSound != null && heartbeatSound.isPlaying)
            {
                heartbeatSound.Stop();
            }
            Debug.LogWarning($"[ArterialPulsation] Pulsation stopped on {gameObject.name}");
        }

        /// <summary>
        /// Resume pulsation
        /// </summary>
        public void ResumePulsation()
        {
            enabled = true;
            if (heartbeatSound != null && heartbeatClip != null && !heartbeatSound.isPlaying)
            {
                heartbeatSound.Play();
            }
            Debug.Log($"[ArterialPulsation] Pulsation resumed on {gameObject.name}");
        }
    }
}
