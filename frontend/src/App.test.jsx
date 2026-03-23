import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// Mock ethers
vi.mock('ethers', () => ({
  ethers: {
    BrowserProvider: vi.fn(),
    Contract: vi.fn(),
    encodeBytes32String: vi.fn((str) => str),
    ZeroHash: '0x0',
    isAddress: vi.fn(() => true),
    keccak256: vi.fn(),
    toUtf8Bytes: vi.fn(),
  }
}));

// Mock window.ethereum
global.window.ethereum = {
  request: vi.fn(),
  on: vi.fn(),
  removeAllListeners: vi.fn(),
};

describe('App Component', () => {
  it('renders the app title', () => {
    render(<App />);
    expect(screen.getByText(/MemoryVault Pro/i)).toBeInTheDocument();
  });

  it('shows connect wallet button when not connected', () => {
    render(<App />);
    expect(screen.getByText(/Connect MetaMask/i)).toBeInTheDocument();
  });

  it('displays description text', () => {
    render(<App />);
    expect(screen.getByText(/Decentralized Private Memory on Base Sepolia/i)).toBeInTheDocument();
  });
});

describe('Wallet Connection', () => {
  it('handles missing MetaMask gracefully', async () => {
    const originalEthereum = global.window.ethereum;
    global.window.ethereum = undefined;
    
    render(<App />);
    const connectButton = screen.getByText(/Connect MetaMask/i);
    
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Please install MetaMask/i)).toBeInTheDocument();
    });
    
    global.window.ethereum = originalEthereum;
  });
});

describe('Form Validation', () => {
  it('shows store memory form when connected', async () => {
    // Mock successful connection
    window.ethereum.request = vi.fn().mockResolvedValue(['0x1234567890abcdef']);
    
    render(<App />);
    const connectButton = screen.getByText(/Connect MetaMask/i);
    fireEvent.click(connectButton);
    
    // Forms should be visible after connection
    await waitFor(() => {
      expect(screen.getByText(/Store Memory/i)).toBeInTheDocument();
    });
  });
});

describe('UI Elements', () => {
  it('renders all section titles', () => {
    render(<App />);
    
    // These should be visible in the header
    expect(screen.getByText(/🔐 MemoryVault Pro/i)).toBeInTheDocument();
  });

  it('has proper accessibility labels', () => {
    render(<App />);
    
    // Main elements should have proper roles
    expect(document.querySelector('header')).toBeInTheDocument();
  });
});
