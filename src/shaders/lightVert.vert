precision mediump float;
attribute vec2 aPosition;
attribute vec2 aNormal;
uniform vec2 uTranslate;
uniform vec2 uMapSize;
varying vec2 position;

void main() {
    position = aPosition;
    vec2 translated = aPosition + uTranslate; // add light position
    vec2 scaled = translated / (0.5 * uMapSize); // scale between -1 and 1
    gl_Position = vec4(scaled, 1.0, 1.0);
}