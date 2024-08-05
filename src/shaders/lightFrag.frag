precision mediump float;
varying vec2 position;
uniform float uRadius;
uniform float uAngle;
uniform float uRotation;
uniform vec3 uColor;
uniform float uIntensity;
uniform vec2 uMapSize;

#define PI 3.14159265359
#define TWO_PI 6.28318530718
#define ANGLE_FALLOFF 0.1

void main()
{
    // Handle zero values
    float angle = ((abs(uAngle) < 0.0001 || uAngle >PI - ANGLE_FALLOFF) ? TWO_PI : uAngle);

    // Light direction
    vec2 lightDir = vec2(cos(uRotation), sin(uRotation));

    // Normalize position vector
    float dist = length(position);
    vec2 normalizedPos = position / dist;

    // Angle between light dir and position, cannot be below 0
    float lightEffect = max(dot(lightDir, normalizedPos), 0.0);

    // Check fragment position within light cone
    float checkAngle = cos(angle * 0.5);
    float coneEffect = smoothstep(checkAngle - ANGLE_FALLOFF, checkAngle + ANGLE_FALLOFF, lightEffect);

    // Get attenuation
    float att = 1.0 - smoothstep(0.0, uRadius, dist);

    // Combine light values
    float strength = att * coneEffect * uIntensity;

    gl_FragColor = vec4(uColor * strength, strength);
}