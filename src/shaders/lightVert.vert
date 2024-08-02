precision mediump float;
attribute vec2 aPosition;
attribute vec2 aNormal;
uniform vec2 uTranslate;
uniform float uRadius;
uniform vec2 uMapSize;
varying vec2 position;

void main() {
    vec2 scaled = aPosition * uRadius; // scale to radius
    position = scaled;
    vec2 translated = scaled + uTranslate; // add light position
    vec2 clipped = translated / (0.5 * uMapSize); // scale between -1 and 1
    gl_Position = vec4(clipped, 1.0, 1.0);
}