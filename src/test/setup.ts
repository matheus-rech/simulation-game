import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test to prevent memory leaks
afterEach(() => {
  cleanup()
})

// Mock WebGL context for Three.js tests
// happy-dom doesn't have full WebGL support, so we mock it
HTMLCanvasElement.prototype.getContext = function (contextId: string) {
  if (contextId === 'webgl' || contextId === 'webgl2') {
    return {
      canvas: this,
      drawingBufferWidth: 800,
      drawingBufferHeight: 600,
      getShaderPrecisionFormat: () => ({
        precision: 23,
        rangeMin: 127,
        rangeMax: 127,
      }),
      getExtension: () => null,
      getParameter: () => null,
      createShader: () => ({}),
      shaderSource: () => {},
      compileShader: () => {},
      getShaderParameter: () => true,
      createProgram: () => ({}),
      attachShader: () => {},
      linkProgram: () => {},
      getProgramParameter: () => true,
      useProgram: () => {},
      createBuffer: () => ({}),
      bindBuffer: () => {},
      bufferData: () => {},
      enable: () => {},
      disable: () => {},
      clear: () => {},
      clearColor: () => {},
      viewport: () => {},
      getUniformLocation: () => ({}),
      getAttribLocation: () => 0,
      uniform1f: () => {},
      uniform2f: () => {},
      uniform3f: () => {},
      uniform4f: () => {},
      uniformMatrix4fv: () => {},
      enableVertexAttribArray: () => {},
      vertexAttribPointer: () => {},
      drawArrays: () => {},
      drawElements: () => {},
    } as any
  }
  return null
}

// Extend expect with custom matchers if needed
expect.extend({
  // Example: toBeWithinRange(received, floor, ceiling)
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be within range ${floor} - ${ceiling}`
          : `expected ${received} to be within range ${floor} - ${ceiling}`,
    }
  },
})
