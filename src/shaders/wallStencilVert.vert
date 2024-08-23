precision mediump float;
attribute vec2 aPosition;
attribute vec2 aNormal;
uniform vec2 uMapSize;
uniform vec2 uLightPoint;
varying vec2 normal;

void main() {
    vec2 dir = (uLightPoint+0.5*uMapSize) - aPosition;
    float dirTest = dot(dir, aNormal);
    vec2 position = aPosition + step(0.0, -dirTest) * -dir*100.;
    normal = aNormal;
    gl_Position = vec4(2.*position/uMapSize - 1.0, 1.0, 1.0);
    //gl_Position = vec4(2.*aPosition/uMapSize - 1.0, 1.0, 1.0);

}