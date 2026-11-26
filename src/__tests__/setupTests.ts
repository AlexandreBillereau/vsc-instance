import '@testing-library/jest-dom';

// Browser-only stubs; main-process tests run in the node environment.
if (typeof window !== 'undefined') {
  // jsdom does not implement matchMedia (used for the light/dark theme).
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }),
  });

  // The preload bridge does not exist outside Electron: every IPC call resolves empty.
  Object.defineProperty(window, 'electron', {
    writable: true,
    value: {
      ipcRenderer: {
        invoke: jest.fn().mockResolvedValue([]),
        sendMessage: jest.fn(),
        on: jest.fn(() => () => {}),
        once: jest.fn(),
      },
    },
  });
}
