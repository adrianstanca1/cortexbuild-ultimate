import '@testing-library/jest-dom';

HTMLCanvasElement.prototype.getContext = () => null;

window.matchMedia = (query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
});

window.URL.createObjectURL = () => 'blob:test';
window.URL.revokeObjectURL = () => {};
