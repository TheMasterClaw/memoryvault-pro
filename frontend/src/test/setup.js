import '@testing-library/jest-dom'

// Mock window.ethereum
global.window.ethereum = {
  request: vi.fn(),
  on: vi.fn(),
  removeAllListeners: vi.fn(),
}
