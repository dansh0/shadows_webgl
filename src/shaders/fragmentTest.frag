precision mediump float;
uniform vec2 uResolution;
uniform float uTime;
uniform sampler2D uImage;

void main()
{
    vec2 uv = gl_FragCoord.xy / uResolution;
    vec4 textureColor = texture2D(uImage, uv);
    gl_FragColor = 0.75*textureColor;
}