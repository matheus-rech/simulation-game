// ============================================================================
// SurgicalTissue.shader - Realistic Surgical Tissue Rendering
// ============================================================================
// URP-compatible shader for AI-generated anatomical textures
// Features:
// - Subsurface scattering (light penetration through tissue)
// - Surface wetness with specular highlights
// - Blood vessel intensity modulation
// - Arterial pulsation glow
// - Optimized for Quest 3 VR
// ============================================================================

Shader "Medical/SurgicalTissue"
{
    Properties
    {
        [Header(Textures)]
        _MainTex ("AI-Generated Texture (Nano Banana Pro)", 2D) = "white" {}
        _NormalMap ("Normal Map (Optional)", 2D) = "bump" {}

        [Header(Surface Properties)]
        _Wetness ("Surface Wetness", Range(0, 1)) = 0.8
        _Roughness ("Roughness", Range(0, 1)) = 0.3
        _BloodVessels ("Blood Vessel Intensity", Range(0, 1)) = 0.3

        [Header(Arterial Effects ICA Only)]
        _Pulsation ("Arterial Pulsation", Range(0, 1)) = 0.0
        _PulsationColor ("Pulsation Glow Color", Color) = (1, 0.3, 0.3, 1)

        [Header(Subsurface Scattering)]
        _SubsurfaceScattering ("SSS Intensity", Range(0, 1)) = 0.5
        _SSSColor ("SSS Color (Reddish for tissue)", Color) = (1, 0.5, 0.5, 1)

        [Header(Advanced)]
        _Metallic ("Metallic", Range(0, 1)) = 0.0
    }

    SubShader
    {
        Tags
        {
            "RenderType" = "Opaque"
            "RenderPipeline" = "UniversalPipeline"
            "Queue" = "Geometry"
        }
        LOD 300

        Pass
        {
            Name "ForwardLit"
            Tags { "LightMode" = "UniversalForward" }

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag

            // URP multi-compile directives
            #pragma multi_compile _ _MAIN_LIGHT_SHADOWS
            #pragma multi_compile _ _MAIN_LIGHT_SHADOWS_CASCADE
            #pragma multi_compile _ _ADDITIONAL_LIGHTS
            #pragma multi_compile_fragment _ _SHADOWS_SOFT

            // URP includes
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

            // ================================================================
            // Shader Properties
            // ================================================================

            TEXTURE2D(_MainTex);
            SAMPLER(sampler_MainTex);

            TEXTURE2D(_NormalMap);
            SAMPLER(sampler_NormalMap);

            CBUFFER_START(UnityPerMaterial)
                float4 _MainTex_ST;
                float _Wetness;
                float _Roughness;
                float _BloodVessels;
                float _Pulsation;
                float4 _PulsationColor;
                float _SubsurfaceScattering;
                float4 _SSSColor;
                float _Metallic;
            CBUFFER_END

            // ================================================================
            // Vertex and Fragment Structures
            // ================================================================

            struct Attributes
            {
                float4 positionOS : POSITION;
                float3 normalOS : NORMAL;
                float4 tangentOS : TANGENT;
                float2 uv : TEXCOORD0;
            };

            struct Varyings
            {
                float4 positionCS : SV_POSITION;
                float2 uv : TEXCOORD0;
                float3 normalWS : TEXCOORD1;
                float3 positionWS : TEXCOORD2;
                float3 viewDirWS : TEXCOORD3;
            };

            // ================================================================
            // Vertex Shader
            // ================================================================

            Varyings vert(Attributes IN)
            {
                Varyings OUT;

                // Transform to world space
                VertexPositionInputs positionInputs = GetVertexPositionInputs(IN.positionOS.xyz);
                OUT.positionCS = positionInputs.positionCS;
                OUT.positionWS = positionInputs.positionWS;

                // Transform normals to world space
                VertexNormalInputs normalInputs = GetVertexNormalInputs(IN.normalOS, IN.tangentOS);
                OUT.normalWS = normalInputs.normalWS;

                // UV and view direction
                OUT.uv = TRANSFORM_TEX(IN.uv, _MainTex);
                OUT.viewDirWS = GetWorldSpaceViewDir(OUT.positionWS);

                return OUT;
            }

            // ================================================================
            // Fragment Shader
            // ================================================================

            half4 frag(Varyings IN) : SV_Target
            {
                // Sample AI-generated texture from Nano Banana Pro
                half4 baseColor = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, IN.uv);

                // Normalize vectors
                float3 normalWS = normalize(IN.normalWS);
                float3 viewDirWS = normalize(IN.viewDirWS);

                // Get main light
                Light mainLight = GetMainLight(TransformWorldToShadowCoord(IN.positionWS));
                float3 lightDir = normalize(mainLight.direction);
                float3 lightColor = mainLight.color;

                // ============================================================
                // Lighting Calculations
                // ============================================================

                // Diffuse (N · L)
                float NdotL = saturate(dot(normalWS, lightDir));
                float3 diffuse = baseColor.rgb * lightColor * NdotL;

                // ============================================================
                // Subsurface Scattering (Light penetration through tissue)
                // ============================================================

                float backLight = saturate(dot(viewDirWS, -lightDir));
                float subsurface = pow(backLight, 4.0) * _SubsurfaceScattering;
                float3 sssContribution = subsurface * _SSSColor.rgb * lightColor;

                // ============================================================
                // Wetness (Specular highlights from surgical fluids)
                // ============================================================

                float3 halfDir = normalize(lightDir + viewDirWS);
                float NdotH = saturate(dot(normalWS, halfDir));

                // Specular with controllable roughness
                float roughnessFactor = 1.0 - _Roughness;
                float specularPower = lerp(8.0, 128.0, roughnessFactor);
                float specular = pow(NdotH, specularPower) * _Wetness;
                float3 specularContribution = specular * lightColor;

                // ============================================================
                // Blood Vessels (Modulate red channel)
                // ============================================================

                // Procedural vessel pattern (simple sine wave)
                float vesselPattern = sin(IN.uv.x * 50.0 + _Time.y) * 0.5 + 0.5;
                baseColor.r += vesselPattern * _BloodVessels * 0.2;

                // ============================================================
                // Arterial Pulsation (For ICA only)
                // ============================================================

                // Pulsation glow (updated by ArterialPulsation.cs)
                float pulse = _Pulsation;
                float3 pulsationGlow = _PulsationColor.rgb * pulse;

                // ============================================================
                // Combine All Effects
                // ============================================================

                float3 finalColor = baseColor.rgb;
                finalColor += diffuse;
                finalColor += sssContribution;
                finalColor += specularContribution;
                finalColor += pulsationGlow;

                // Apply shadow attenuation
                finalColor *= mainLight.shadowAttenuation;

                // ============================================================
                // Additional Lights (if enabled)
                // ============================================================

                #ifdef _ADDITIONAL_LIGHTS
                uint pixelLightCount = GetAdditionalLightsCount();
                for (uint lightIndex = 0; lightIndex < pixelLightCount; ++lightIndex)
                {
                    Light light = GetAdditionalLight(lightIndex, IN.positionWS);
                    float NdotL_add = saturate(dot(normalWS, light.direction));
                    finalColor += baseColor.rgb * light.color * NdotL_add * light.distanceAttenuation;
                }
                #endif

                return half4(finalColor, 1.0);
            }
            ENDHLSL
        }

        // ================================================================
        // Shadow Caster Pass (for VR shadow rendering)
        // ================================================================

        Pass
        {
            Name "ShadowCaster"
            Tags { "LightMode" = "ShadowCaster" }

            ZWrite On
            ZTest LEqual
            ColorMask 0

            HLSLPROGRAM
            #pragma vertex ShadowPassVertex
            #pragma fragment ShadowPassFragment

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/ShadowCasterPass.hlsl"
            ENDHLSL
        }

        // ================================================================
        // Depth Only Pass (for depth pre-pass)
        // ================================================================

        Pass
        {
            Name "DepthOnly"
            Tags { "LightMode" = "DepthOnly" }

            ZWrite On
            ColorMask 0

            HLSLPROGRAM
            #pragma vertex DepthOnlyVertex
            #pragma fragment DepthOnlyFragment

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/Shaders/DepthOnlyPass.hlsl"
            ENDHLSL
        }
    }

    FallBack "Universal Render Pipeline/Lit"
}
