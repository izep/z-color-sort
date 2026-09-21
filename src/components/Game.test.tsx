import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Game from './Game';

// Mock Web Audio API
beforeAll(() => {
  window.AudioContext = jest.fn().mockImplementation(() => ({
    state: 'running',
    currentTime: 0,
    resume: jest.fn(),
    createOscillator: jest.fn().mockReturnValue({
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      frequency: {
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn()
      }
    }),
    createGain: jest.fn().mockReturnValue({
      connect: jest.fn(),
      gain: {
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn()
      }
    }),
    destination: {}
  }));
});

describe('Game Component', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('renders title, stats, and action buttons', () => {
    render(<Game />);
    expect(screen.getByText(/Color Sort/i)).toBeInTheDocument();
    expect(screen.getByText(/Moves: 0/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Undo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Restart/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hint/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New Game/i })).toBeInTheDocument();
  });

  it('undo button is initially disabled', () => {
    render(<Game />);
    const undoBtn = screen.getByRole('button', { name: /Undo/i });
    expect(undoBtn).toBeDisabled();
  });

  it('toggles sound button state', () => {
    render(<Game />);
    const soundBtn = screen.getByTitle(/Toggle sound effects/i);
    expect(soundBtn).toHaveTextContent(/Sound ON/i);

    fireEvent.click(soundBtn);
    expect(soundBtn).toHaveTextContent(/Sound OFF/i);
  });

  it('toggles colorblind patterns mode', () => {
    render(<Game />);
    const colorblindBtn = screen.getByTitle(/Toggle colorblind accessibility mode/i);
    expect(colorblindBtn).toHaveTextContent(/Patterns OFF/i);

    fireEvent.click(colorblindBtn);
    expect(colorblindBtn).toHaveTextContent(/Patterns ON/i);
  });

  it('displays hint banner when Hint button is clicked', () => {
    render(<Game />);
    const hintBtn = screen.getByRole('button', { name: /Get hint/i });
    fireEvent.click(hintBtn);

    const hintBanner = screen.getByRole('alert');
    expect(hintBanner).toBeInTheDocument();
    expect(hintBanner).toHaveTextContent(/Hint: Pour Tube/i);
  });

  it('allows restarting the current level', () => {
    render(<Game />);
    const restartBtn = screen.getByRole('button', { name: /Restart/i });
    fireEvent.click(restartBtn);
    expect(screen.getByText(/Moves: 0/i)).toBeInTheDocument();
  });
});
