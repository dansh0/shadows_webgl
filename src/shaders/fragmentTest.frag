precision mediump float;
uniform vec2 uResolution;
uniform float uTime;
uniform sampler2D uImage;
uniform sampler2D uRenderTarget;

vec4 applyBlur(sampler2D tex, vec2 uv, float blurSize) {
    vec4 color = vec4(0.0);
    float count = 0.0;

    // Offsets to sample around the center point
    vec2 offsets[9];
    offsets[0] = vec2(-1.0, -1.0);
    offsets[1] = vec2( 0.0, -1.0);
    offsets[2] = vec2( 1.0, -1.0);
    offsets[3] = vec2(-1.0,  0.0);
    offsets[4] = vec2( 0.0,  0.0);
    offsets[5] = vec2( 1.0,  0.0);
    offsets[6] = vec2(-1.0,  1.0);
    offsets[7] = vec2( 0.0,  1.0);
    offsets[8] = vec2( 1.0,  1.0);

    // Apply blur by sampling neighboring texels
    for(int i = 0; i < 9; i++) {
        vec2 sampleUV = uv + offsets[i] * blurSize;
        color += texture2D(tex, sampleUV);
        count += 1.0;
    }

    // Average the color samples
    return color / count;
} 

void main()
{
    vec2 uv = gl_FragCoord.xy / uResolution;
    vec3 textureColor = texture2D(uImage, uv).rgb;
    vec3 lighting = clamp(applyBlur(uRenderTarget, uv, 0.003).rgb, 0.0, 1.0);
    gl_FragColor = vec4(textureColor*lighting, 1.);
}