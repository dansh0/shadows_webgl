precision mediump float;
attribute vec2 aPosition;
attribute vec2 aNormal;
uniform vec2 uMapSize;

void main() {
    gl_Position = vec4(2.*aPosition/uMapSize - 1.0, 1.0, 1.0);
}