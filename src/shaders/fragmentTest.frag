precision mediump float;
uniform vec2 uResolution;
uniform float uTime;

void main()
{
    vec2 uv = gl_FragCoord.xy / uResolution;
    //gl_FragColor = vec4(uv+uTime/10., 0.0, 1.0);
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
}