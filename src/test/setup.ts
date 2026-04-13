import '@testing-library/jest-dom';
import { vi } from 'vitest';

HTMLCanvasElement.prototype.getContext = () => null;

// Mock matchMedia to support event listeners and manual triggers
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => {
    const listeners = new Set<(e: any) => void>();
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: (handler: (e: any) => void) => listeners.add(handler),
      removeListener: (handler: (e: any) => void) => listeners.delete(handler),
      addEventListener: (type: string, handler: (e: any) => void) => {
        if (type === 'change') listeners.add(handler);
      },
      removeEventListener: (type: string, handler: (e: any) => void) => {
        if (type === 'change') listeners.delete(handler);
      },
      dispatchEvent: (event: any) => {
        listeners.forEach((handler) => handler(event));
        return true;
      },
    };
  }),
});

window.URL.createObjectURL = () => 'blob:test';
window.URL.revokeObjectURL = () => {};
