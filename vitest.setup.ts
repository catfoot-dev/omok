import '@testing-library/jest-dom/vitest';

function createCanvasContextStub(): CanvasRenderingContext2D {
  return {
    arc: () => undefined,
    beginPath: () => undefined,
    clearRect: () => undefined,
    closePath: () => undefined,
    createLinearGradient: () => ({ addColorStop: () => undefined }),
    createRadialGradient: () => ({ addColorStop: () => undefined }),
    fill: () => undefined,
    fillText: () => undefined,
    lineTo: () => undefined,
    moveTo: () => undefined,
    quadraticCurveTo: () => undefined,
    restore: () => undefined,
    save: () => undefined,
    setTransform: () => undefined,
    stroke: () => undefined,
  } as unknown as CanvasRenderingContext2D;
}

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  writable: true,
  value: () => createCanvasContextStub(),
});
