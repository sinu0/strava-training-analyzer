// Test setup for Recharts in JSDOM
// Provide a minimum size for chart containers and a mock ResizeObserver so Recharts' ResponsiveContainer can compute sizes in tests.

// Inject CSS to ensure containers have a non-zero size
const style = document.createElement('style');
style.innerHTML = `
.recharts-wrapper, .recharts-responsive-container, .recharts-surface, .recharts { min-width: 600px !important; min-height: 300px !important; width: 600px !important; height: 300px !important; }
`;
document.head.appendChild(style);

// Provide a simple ResizeObserver mock that immediately notifies with reasonable size
class MockResizeObserver {
  cb: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) { this.cb = cb; }
  observe() { try { this.cb([{ contentRect: { width: 600, height: 300 } } as any], this); } catch (e) { /* ignore */ } }
  unobserve() {}
  disconnect() {}
}

// @ts-ignore
global.ResizeObserver = MockResizeObserver;

// Patch getBoundingClientRect on elements used by Recharts so ResponsiveContainer can compute sizes in JSDOM
const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
Element.prototype.getBoundingClientRect = function () {
  try {
    const el = this as HTMLElement;
    if (el && el.classList && (
      el.classList.contains('recharts-wrapper') ||
      el.classList.contains('recharts-responsive-container') ||
      el.classList.contains('recharts-surface') ||
      el.classList.contains('recharts')
    )) {
      return {
        width: 600,
        height: 300,
        top: 0,
        left: 0,
        bottom: 300,
        right: 600,
        x: 0,
        y: 0,
        toJSON: () => ({})
      } as DOMRect;
    }
  } catch (e) {
    // fallback
  }
  return originalGetBoundingClientRect.call(this as any);
};

// Ensure requestAnimationFrame exists in JSDOM environment for libraries that rely on it
if (typeof global.requestAnimationFrame === 'undefined') {
  // @ts-ignore
  global.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(cb, 0) as unknown as number;
  // @ts-ignore
  global.cancelAnimationFrame = (id: number) => clearTimeout(id);
}
