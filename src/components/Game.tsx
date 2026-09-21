import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Tube as TubeType } from '../types';
import { createInitialGame, canPour, pourColors, checkWin, isTubeComplete, findNextMove } from '../gameLogic';
import { soundManager } from '../audio';
import Tube from './Tube';
import LiquidStream from './LiquidStream';
import './Game.css';

interface StreamState {
  fromRect: DOMRect;
  toRect: DOMRect;
  containerRect: DOMRect;
  color: string;
  direction: 'left' | 'right';
}

const Game: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Load saved preferences
  const getSavedColorblindMode = (): boolean => {
    try {
      const saved = localStorage.getItem('color-sort-colorblind');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  };

  const getSavedBestMoves = (diff: number): number | null => {
    try {
      const saved = localStorage.getItem(`color-sort-best-${diff}`);
      return saved !== null ? parseInt(saved, 10) : null;
    } catch {
      return null;
    }
  };

  const [difficulty, setDifficulty] = useState<number>(5);
  const [gameState, setGameState] = useState<GameState>(() => 
    createInitialGame(5, getSavedColorblindMode())
  );
  const [pouringFrom, setPouringFrom] = useState<number | null>(null);
  const [pouringTo, setPouringTo] = useState<number | null>(null);
  const [pourDirection, setPourDirection] = useState<'left' | 'right' | null>(null);
  const [pourStyle, setPourStyle] = useState<React.CSSProperties | undefined>(undefined);
  const [streamData, setStreamData] = useState<StreamState | null>(null);
  const [completedTubes, setCompletedTubes] = useState<Set<number>>(new Set());
  const [hintMove, setHintMove] = useState<{ from: number; to: number } | null>(null);
  const [announcement, setAnnouncement] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => soundManager.isSoundEnabled());
  const [bestMoves, setBestMoves] = useState<number | null>(() => getSavedBestMoves(5));
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Listen for PWA install prompt
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then(() => setInstallPrompt(null));
  };

  // Update best moves display when difficulty changes
  useEffect(() => {
    setBestMoves(getSavedBestMoves(difficulty));
  }, [difficulty]);

  // Check win condition
  useEffect(() => {
    if (checkWin(gameState.tubes) && gameState.moves > 0 && !gameState.isWon) {
      setGameState(prev => ({ ...prev, isWon: true }));
      soundManager.playWinSound();
      soundManager.triggerHaptic('success');
      setAnnouncement(`Victory! Solved in ${gameState.moves} moves!`);

      // Update best score
      const currentBest = getSavedBestMoves(difficulty);
      if (currentBest === null || gameState.moves < currentBest) {
        try {
          localStorage.setItem(`color-sort-best-${difficulty}`, gameState.moves.toString());
          setBestMoves(gameState.moves);
        } catch {
          // Ignore storage errors
        }
      }
    }
  }, [gameState.tubes, gameState.moves, gameState.isWon, difficulty]);

  // Handle pouring animation and state update
  const handleTubeClick = (tubeId: number) => {
    // Prevent interaction during pour animation or after winning
    if (gameState.isWon || pouringFrom !== null) return;

    // Clear active hint on any click
    if (hintMove) setHintMove(null);

    if (gameState.selectedTube === null) {
      // First click: select tube if non-empty
      if (gameState.tubes[tubeId].colors.length > 0) {
        setGameState(prev => ({ ...prev, selectedTube: tubeId }));
        soundManager.triggerHaptic('light');
        setAnnouncement(`Selected Tube ${tubeId + 1}`);
      }
    } else {
      // Second click: either deselect or pour
      if (gameState.selectedTube === tubeId) {
        // Deselect if same tube clicked
        setGameState(prev => ({ ...prev, selectedTube: null }));
        setAnnouncement(`Deselected Tube ${tubeId + 1}`);
      } else {
        const fromIndex = gameState.selectedTube;
        const fromTube = gameState.tubes[fromIndex];
        const toTube = gameState.tubes[tubeId];

        if (canPour(fromTube, toTube)) {
          const fromEl = document.getElementById(`tube-${fromIndex}`);
          const toEl = document.getElementById(`tube-${tubeId}`);
          const containerEl = containerRef.current;

          let dx = 0;
          let dy = 0;
          let fromRect: DOMRect | null = null;
          let toRect: DOMRect | null = null;
          let containerRect: DOMRect | null = null;

          if (fromEl && toEl && containerEl) {
            fromRect = fromEl.getBoundingClientRect();
            toRect = toEl.getBoundingClientRect();
            containerRect = containerEl.getBoundingClientRect();
            dx = toRect.left - fromRect.left;
            dy = toRect.top - fromRect.top;
          }

          const direction: 'left' | 'right' = dx >= 0 ? 'right' : 'left';
          const topColor = fromTube.colors[fromTube.colors.length - 1];

          setPouringFrom(fromIndex);
          setPouringTo(tubeId);
          setPourDirection(direction);
          setPourStyle({
            '--pour-dx': `${dx}px`,
            '--pour-dy': `${dy}px`
          } as React.CSSProperties);

          soundManager.playPourSound();
          soundManager.triggerHaptic('light');
          setAnnouncement(`Pouring from Tube ${fromIndex + 1} to Tube ${tubeId + 1}`);

          // Trigger dynamic liquid stream once the tube has tipped
          const streamTimer = setTimeout(() => {
            if (fromRect && toRect && containerRect) {
              setStreamData({
                fromRect,
                toRect,
                containerRect,
                color: topColor,
                direction
              });
            }
          }, 180);

          // Hide stream as the tube rights itself
          const streamEndTimer = setTimeout(() => {
            setStreamData(null);
          }, 600);

          // Finish pour sequence and commit game state
          setTimeout(() => {
            clearTimeout(streamTimer);
            clearTimeout(streamEndTimer);
            setStreamData(null);

            const { from, to } = pourColors(fromTube, toTube);
            const newTubes = [...gameState.tubes];
            newTubes[fromIndex] = from;
            newTubes[tubeId] = to;

            // Save previous tubes state into history for undo
            const historyCopy: TubeType[][] = [
              ...(gameState.history || []),
              gameState.tubes.map(t => ({ ...t, colors: [...t.colors] }))
            ];

            setGameState(prev => ({
              ...prev,
              tubes: newTubes,
              selectedTube: null,
              moves: prev.moves + 1,
              history: historyCopy,
              isWon: false
            }));

            setPouringFrom(null);
            setPouringTo(null);
            setPourDirection(null);
            setPourStyle(undefined);

            // Check if destination tube is now complete
            if (isTubeComplete(to) && !completedTubes.has(tubeId)) {
              setCompletedTubes(prev => {
                const nextSet = new Set(prev);
                nextSet.add(tubeId);
                return nextSet;
              });
              setTimeout(() => {
                soundManager.playCompleteSound();
                soundManager.triggerHaptic('medium');
              }, 250);
            }
          }, 750);
        } else {
          // Invalid destination
          soundManager.playInvalidSound();
          soundManager.triggerHaptic('medium');
          setAnnouncement(`Cannot pour Tube ${fromIndex + 1} into Tube ${tubeId + 1}`);
          setGameState(prev => ({ ...prev, selectedTube: null }));
        }
      }
    }
  };

  const handleUndo = useCallback(() => {
    if (pouringFrom !== null || !gameState.history || gameState.history.length === 0) return;

    const newHistory = [...gameState.history];
    const previousTubes = newHistory.pop();
    if (!previousTubes) return;

    // Recalculate completed tubes for the restored state
    const restoredCompleted = new Set<number>();
    previousTubes.forEach(t => {
      if (isTubeComplete(t)) restoredCompleted.add(t.id);
    });

    setCompletedTubes(restoredCompleted);
    setGameState(prev => ({
      ...prev,
      tubes: previousTubes,
      selectedTube: null,
      moves: Math.max(0, prev.moves - 1),
      history: newHistory,
      isWon: false
    }));

    setHintMove(null);
    setStreamData(null);
    soundManager.triggerHaptic('light');
    setAnnouncement('Move undone');
  }, [gameState.history, pouringFrom]);

  const handleRestart = useCallback(() => {
    if (pouringFrom !== null) return;

    const initial = gameState.initialTubes
      ? gameState.initialTubes.map(t => ({ ...t, colors: [...t.colors] }))
      : createInitialGame(difficulty, gameState.colorblindMode).tubes;

    setGameState(prev => ({
      ...prev,
      tubes: initial,
      selectedTube: null,
      moves: 0,
      history: [],
      isWon: false
    }));
    setCompletedTubes(new Set());
    setHintMove(null);
    setStreamData(null);
    setPouringFrom(null);
    setPouringTo(null);
    setPourStyle(undefined);
    soundManager.triggerHaptic('light');
    setAnnouncement('Level restarted');
  }, [gameState.initialTubes, gameState.colorblindMode, difficulty, pouringFrom]);

  const handleNewGame = useCallback((newDifficulty?: number) => {
    if (pouringFrom !== null) return;
    const diff = newDifficulty ?? difficulty;
    setDifficulty(diff);
    setGameState(createInitialGame(diff, gameState.colorblindMode));
    setCompletedTubes(new Set());
    setHintMove(null);
    setStreamData(null);
    setPouringFrom(null);
    setPouringTo(null);
    setPourStyle(undefined);
    soundManager.triggerHaptic('light');
    setAnnouncement(`Started new ${diff}-color game`);
  }, [difficulty, gameState.colorblindMode, pouringFrom]);

  const handleHint = useCallback(() => {
    if (gameState.isWon || pouringFrom !== null) return;

    const nextMove = findNextMove(gameState.tubes);
    if (nextMove) {
      setHintMove(nextMove);
      soundManager.triggerHaptic('light');
      setAnnouncement(`Hint: Pour Tube ${nextMove.from + 1} into Tube ${nextMove.to + 1}`);
    } else {
      soundManager.playInvalidSound();
      setAnnouncement('No solution path found from current state. Try Undo!');
    }
  }, [gameState.tubes, gameState.isWon, pouringFrom]);

  const toggleSound = () => {
    const next = soundManager.toggleSound();
    setSoundEnabled(next);
    setAnnouncement(next ? 'Sound enabled' : 'Sound muted');
  };

  const toggleColorblindMode = () => {
    const next = !gameState.colorblindMode;
    setGameState(prev => ({
      ...prev,
      colorblindMode: next
    }));
    try {
      localStorage.setItem('color-sort-colorblind', JSON.stringify(next));
    } catch {
      // Ignore storage errors
    }
    setAnnouncement(next ? 'Colorblind patterns turned on' : 'Colorblind patterns turned off');
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (e.key.toLowerCase() === 'u') {
        handleUndo();
      } else if (e.key.toLowerCase() === 'r') {
        handleRestart();
      } else if (e.key.toLowerCase() === 'h') {
        handleHint();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRestart, handleHint]);

  const canUndo = (gameState.history?.length ?? 0) > 0 && pouringFrom === null;

  return (
    <div className="game" ref={containerRef}>
      {/* Dynamic flowing liquid stream overlay */}
      {streamData && <LiquidStream {...streamData} />}

      <header className="game-header">
        <h1>🎨 Color Sort</h1>
        <div className="game-stats">
          <div className="stat-item">Moves: {gameState.moves}</div>
          {bestMoves !== null && (
            <div className="stat-item" title="Best score for this difficulty">
              Best: {bestMoves}
            </div>
          )}
        </div>
      </header>

      {/* Screen reader live announcements */}
      <div className="sr-only" aria-live="polite" role="status">
        {announcement}
      </div>

      {gameState.isWon && (
        <div className="win-message">
          🎉 You Won in {gameState.moves} moves! 🎉
        </div>
      )}

      {hintMove && !gameState.isWon && (
        <div className="hint-banner" role="alert">
          💡 Hint: Pour <strong>Tube {hintMove.from + 1}</strong> into <strong>Tube {hintMove.to + 1}</strong>
        </div>
      )}

      <div className="tubes-container" role="region" aria-label="Puzzle Tubes">
        {gameState.tubes.map(tube => (
          <Tube
            key={tube.id}
            tube={tube}
            isSelected={gameState.selectedTube === tube.id}
            isPouring={pouringFrom === tube.id}
            isReceiving={pouringTo === tube.id}
            isComplete={completedTubes.has(tube.id)}
            colorblindMode={gameState.colorblindMode}
            isHintSource={hintMove?.from === tube.id}
            isHintTarget={hintMove?.to === tube.id}
            pourDirection={pouringFrom === tube.id ? pourDirection : null}
            style={pouringFrom === tube.id ? pourStyle : undefined}
            onClick={() => handleTubeClick(tube.id)}
          />
        ))}
      </div>

      <div className="controls">
        {/* Core Gameplay Action Controls */}
        <div className="action-controls">
          <button 
            onClick={handleUndo} 
            disabled={!canUndo}
            title="Undo last move (Ctrl+Z or U)"
            aria-label="Undo move"
          >
            ↩️ Undo
          </button>
          <button 
            onClick={handleRestart}
            title="Restart current level (R)"
            aria-label="Restart level"
          >
            🔄 Restart
          </button>
          <button 
            onClick={handleHint}
            className="primary"
            title="Get a hint (H)"
            aria-label="Get hint"
          >
            💡 Hint
          </button>
          <button 
            onClick={() => handleNewGame()}
            title="Generate a new puzzle"
            aria-label="New Game"
          >
            ✨ New Game
          </button>
        </div>

        {/* Accessibility and Sound Settings */}
        <div className="settings-controls">
          <button 
            onClick={toggleSound}
            className={soundEnabled ? 'active' : ''}
            title="Toggle sound effects"
            aria-pressed={soundEnabled}
          >
            {soundEnabled ? '🔊 Sound ON' : '🔇 Sound OFF'}
          </button>
          <button 
            onClick={toggleColorblindMode}
            className={gameState.colorblindMode ? 'active' : ''}
            title="Toggle colorblind accessibility mode"
            aria-pressed={gameState.colorblindMode}
          >
            {gameState.colorblindMode ? '👁️ Patterns ON' : '👁️ Patterns OFF'}
          </button>
          {installPrompt && (
            <button 
              onClick={handleInstallClick}
              className="install-app-btn"
              title="Install app to your home screen or desktop"
              aria-label="Install App"
            >
              📥 Install App
            </button>
          )}
        </div>

        {/* Difficulty Controls */}
        <div className="difficulty-controls" role="group" aria-label="Difficulty selection">
          <span>Difficulty:</span>
          {[
            { level: 4, name: 'Easy' },
            { level: 5, name: 'Medium' },
            { level: 6, name: 'Hard' },
            { level: 7, name: 'Expert' }
          ].map(({ level, name }) => (
            <button 
              key={level}
              onClick={() => handleNewGame(level)}
              className={difficulty === level ? 'active' : ''}
              aria-pressed={difficulty === level}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Game;
