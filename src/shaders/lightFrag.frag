precision mediump float;
varying vec2 position;
uniform float uRadius;
uniform vec2 uMapSize;

void main()
{
    float dist = length(position);
    float att = 1.0 - smoothstep(0.0, uRadius, dist);
    gl_FragColor = vec4(vec3(att), att);
}