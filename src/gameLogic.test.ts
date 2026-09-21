import { Tube, GameState } from './types';
import { 
  createInitialGame, 
  canPour, 
  pourColors, 
  checkWin, 
  isTubeComplete,
  solvePuzzle,
  findNextMove,
  COLORS
} from './gameLogic';

describe('gameLogic', () => {
  describe('createInitialGame', () => {
    it('should create a game with default difficulty (4)', () => {
      const state = createInitialGame();
      expect(state.tubes.length).toBe(6); // 4 colors + 2 empty tubes
      expect(state.moves).toBe(0);
      expect(state.isWon).toBe(false);
      
      const filledTubes = state.tubes.filter(t => t.colors.length > 0);
      expect(filledTubes.length).toBe(4);
      
      const emptyTubes = state.tubes.filter(t => t.colors.length === 0);
      expect(emptyTubes.length).toBe(2);
      
      filledTubes.forEach(t => {
        expect(t.colors.length).toBe(4);
        expect(t.maxCapacity).toBe(4);
      });
    });

    it('should respect expert difficulty (7)', () => {
      const state = createInitialGame(7);
      expect(state.tubes.length).toBe(9); // 7 colors + 2 empty tubes
      state.tubes.forEach(t => {
        expect(t.maxCapacity).toBe(5);
      });
    });

    it('should initialize with correct colorblind mode', () => {
      const state = createInitialGame(4, true);
      expect(state.colorblindMode).toBe(true);
    });
  });

  describe('canPour', () => {
    const red = COLORS[0];
    const green = COLORS[1];

    it('should return false if source tube is empty', () => {
      const from: Tube = { id: 0, colors: [], maxCapacity: 4 };
      const to: Tube = { id: 1, colors: [red], maxCapacity: 4 };
      expect(canPour(from, to)).toBe(false);
    });

    it('should return false if target tube is full', () => {
      const from: Tube = { id: 0, colors: [red], maxCapacity: 4 };
      const to: Tube = { id: 1, colors: [red, red, red, red], maxCapacity: 4 };
      expect(canPour(from, to)).toBe(false);
    });

    it('should return true if target tube is empty', () => {
      const from: Tube = { id: 0, colors: [red], maxCapacity: 4 };
      const to: Tube = { id: 1, colors: [], maxCapacity: 4 };
      expect(canPour(from, to)).toBe(true);
    });

    it('should return true if top colors match', () => {
      const from: Tube = { id: 0, colors: [green, red], maxCapacity: 4 };
      const to: Tube = { id: 1, colors: [red], maxCapacity: 4 };
      expect(canPour(from, to)).toBe(true);
    });

    it('should return false if top colors mismatch', () => {
      const from: Tube = { id: 0, colors: [red, green], maxCapacity: 4 };
      const to: Tube = { id: 1, colors: [red], maxCapacity: 4 };
      expect(canPour(from, to)).toBe(false);
    });
  });

  describe('pourColors', () => {
    const red = COLORS[0];
    const green = COLORS[1];

    it('should pour consecutive colors of the same type', () => {
      const from: Tube = { id: 0, colors: [green, red, red], maxCapacity: 4 };
      const to: Tube = { id: 1, colors: [red], maxCapacity: 4 };
      
      const result = pourColors(from, to);
      
      expect(result.from.colors).toEqual([green]);
      expect(result.to.colors).toEqual([red, red, red]);
    });

    it('should only pour up to max capacity', () => {
      const from: Tube = { id: 0, colors: [green, red, red, red], maxCapacity: 4 };
      const to: Tube = { id: 1, colors: [red, red], maxCapacity: 4 };
      
      const result = pourColors(from, to);
      
      // Only 2 reds should move because target only has 2 slots left
      expect(result.from.colors).toEqual([green, red]);
      expect(result.to.colors).toEqual([red, red, red, red]);
    });

    it('should pour multiple colors into an empty tube', () => {
      const from: Tube = { id: 0, colors: [green, red, red], maxCapacity: 4 };
      const to: Tube = { id: 1, colors: [], maxCapacity: 4 };
      
      const result = pourColors(from, to);
      
      expect(result.from.colors).toEqual([green]);
      expect(result.to.colors).toEqual([red, red]);
    });
  });

  describe('checkWin', () => {
    const red = COLORS[0];
    const green = COLORS[1];

    it('should return true if all tubes are empty or complete', () => {
      const tubes: Tube[] = [
        { id: 0, colors: [red, red, red, red], maxCapacity: 4 },
        { id: 1, colors: [green, green, green, green], maxCapacity: 4 },
        { id: 2, colors: [], maxCapacity: 4 }
      ];
      expect(checkWin(tubes)).toBe(true);
    });

    it('should return false if any tube is partially filled with one color', () => {
      const tubes: Tube[] = [
        { id: 0, colors: [red, red, red], maxCapacity: 4 }, // incomplete
        { id: 1, colors: [green, green, green, green], maxCapacity: 4 },
        { id: 2, colors: [], maxCapacity: 4 }
      ];
      expect(checkWin(tubes)).toBe(false);
    });

    it('should return false if any tube has mixed colors', () => {
      const tubes: Tube[] = [
        { id: 0, colors: [red, red, red, green], maxCapacity: 4 },
        { id: 1, colors: [green, green, green], maxCapacity: 4 },
        { id: 2, colors: [], maxCapacity: 4 }
      ];
      expect(checkWin(tubes)).toBe(false);
    });
  });

  describe('isTubeComplete', () => {
    const red = COLORS[0];
    const green = COLORS[1];

    it('should return true for a full tube of same color', () => {
      const tube: Tube = { id: 0, colors: [red, red, red, red], maxCapacity: 4 };
      expect(isTubeComplete(tube)).toBe(true);
    });

    it('should return false for an empty tube', () => {
      const tube: Tube = { id: 0, colors: [], maxCapacity: 4 };
      expect(isTubeComplete(tube)).toBe(false);
    });

    it('should return false for a partially filled tube', () => {
      const tube: Tube = { id: 0, colors: [red, red, red], maxCapacity: 4 };
      expect(isTubeComplete(tube)).toBe(false);
    });

    it('should return false for a mixed tube', () => {
      const tube: Tube = { id: 0, colors: [red, red, red, green], maxCapacity: 4 };
      expect(isTubeComplete(tube)).toBe(false);
    });
  });

  describe('solvePuzzle and findNextMove', () => {
    const red = COLORS[0];
    const green = COLORS[1];

    it('should return empty array if puzzle is already won', () => {
      const tubes: Tube[] = [
        { id: 0, colors: [red, red, red, red], maxCapacity: 4 },
        { id: 1, colors: [green, green, green, green], maxCapacity: 4 },
        { id: 2, colors: [], maxCapacity: 4 }
      ];
      expect(solvePuzzle(tubes)).toEqual([]);
      expect(findNextMove(tubes)).toBeNull();
    });

    it('should solve a 1-move puzzle and find next move', () => {
      const tubes: Tube[] = [
        { id: 0, colors: [red, red, red], maxCapacity: 4 },
        { id: 1, colors: [green, green, green, green], maxCapacity: 4 },
        { id: 2, colors: [red], maxCapacity: 4 }
      ];
      const solution = solvePuzzle(tubes);
      expect(solution).not.toBeNull();
      expect(solution?.length).toBe(1);
      // Either pouring 0 into 2 or 2 into 0 completes the red tube
      const move = solution![0];
      expect([0, 2]).toContain(move.from);
      expect([0, 2]).toContain(move.to);

      const hint = findNextMove(tubes);
      expect(hint).toEqual(move);
    });

    it('should create initial game with history and initialTubes', () => {
      const state = createInitialGame(4);
      expect(state.history).toEqual([]);
      expect(state.initialTubes).toBeDefined();
      expect(state.initialTubes?.length).toBe(state.tubes.length);
    });
  });
});

