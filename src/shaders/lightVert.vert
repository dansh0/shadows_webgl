precision mediump float;
attribute vec2 aPosition;
attribute vec2 aNormal;
uniform vec2 uTranslate;
uniform vec2 uMapSize;
varying vec2 position;

void main() {
    position = aPosition;
    vec2 translated = (aPosition + uTranslate)/(uMapSize);
    gl_Position = vec4(translated, 1.0, 1.0);
}