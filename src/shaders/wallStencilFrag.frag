precision mediump float;
varying vec2 normal;

void main()
{
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    //gl_FragColor = vec4(normal.y, -normal.y, 0.0, 1.0);
}