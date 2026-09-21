import { Tube, GameState } from './types';

export const COLORS = [
  '#FF0000', // Bright Red
  '#00FF00', // Bright Green
  '#0000FF', // Bright Blue
  '#FFFF00', // Bright Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FF6600', // Orange
  '#9900FF'  // Purple
];

export const COLOR_PATTERNS = [
  'solid',      // Red
  'dots',       // Green
  'stripes',    // Blue
  'grid',       // Yellow
  'diagonal',   // Magenta
  'waves',      // Cyan
  'circles',    // Orange
  'crosshatch'  // Purple
];

export const COLOR_LABELS = [
  'R',  // Red
  'G',  // Green
  'B',  // Blue
  'Y',  // Yellow
  'M',  // Magenta
  'C',  // Cyan
  'O',  // Orange
  'P'   // Purple
];

export interface Move {
  from: number;
  to: number;
}

export const solvePuzzle = (initialTubes: Tube[], maxStates: number = 20000): Move[] | null => {
  if (checkWin(initialTubes)) return [];

  const encode = (tubes: Tube[]): string =>
    tubes.map(t => t.colors.join(',')).sort().join('|');

  const visited = new Set<string>();
  visited.add(encode(initialTubes));

  const queue: { tubes: Tube[]; path: Move[] }[] = [{ tubes: initialTubes, path: [] }];
  let statesExamined = 0;

  while (queue.length > 0 && statesExamined < maxStates) {
    const current = queue.shift()!;
    statesExamined++;

    for (let i = 0; i < current.tubes.length; i++) {
      const from = current.tubes[i];
      if (from.colors.length === 0) continue;
      if (isTubeComplete(from)) continue;

      for (let j = 0; j < current.tubes.length; j++) {
        if (i === j) continue;
        const to = current.tubes[j];
        if (!canPour(from, to)) continue;

        // Redundant move pruning: moving pure tube into empty tube
        if (to.colors.length === 0 && from.colors.every(c => c === from.colors[0])) continue;

        const { from: newFrom, to: newTo } = pourColors(from, to);
        const nextTubes = [...current.tubes];
        nextTubes[i] = newFrom;
        nextTubes[j] = newTo;

        const nextMove: Move = { from: from.id, to: to.id };
        if (checkWin(nextTubes)) {
          return [...current.path, nextMove];
        }

        const key = encode(nextTubes);
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({ tubes: nextTubes, path: [...current.path, nextMove] });
        }
      }
    }
  }

  return null;
};

export const findNextMove = (tubes: Tube[]): Move | null => {
  const solution = solvePuzzle(tubes, 15000);
  if (solution && solution.length > 0) {
    return solution[0];
  }
  return null;
};

export const createInitialGame = (
  difficulty: number = 4,
  colorblindMode: boolean = false,
  level: number = 1
): GameState => {
  const numColors = difficulty;
  const tubeCapacity = difficulty >= 7 ? 5 : 4; // Expert mode has 5 slots per tube
  const colors = COLORS.slice(0, numColors);
  
  let tubes: Tube[] = [];
  let isSolvable = false;
  let attempts = 0;

  while (!isSolvable && attempts < 15) {
    attempts++;
    const allColors: string[] = [];
    colors.forEach(color => {
      for (let i = 0; i < tubeCapacity; i++) {
        allColors.push(color);
      }
    });
    
    // Shuffle colors
    for (let i = allColors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allColors[i], allColors[j]] = [allColors[j], allColors[i]];
    }
    
    tubes = [];
    for (let i = 0; i < numColors; i++) {
      tubes.push({
        id: i,
        colors: allColors.slice(i * tubeCapacity, (i + 1) * tubeCapacity),
        maxCapacity: tubeCapacity
      });
    }
    
    // Add empty tubes
    tubes.push({ id: numColors, colors: [], maxCapacity: tubeCapacity });
    tubes.push({ id: numColors + 1, colors: [], maxCapacity: tubeCapacity });

    if (!checkWin(tubes)) {
      const solution = solvePuzzle(tubes, 8000);
      if (solution && solution.length >= 3) {
        isSolvable = true;
      }
    }
  }

  const initialTubes = tubes.map(t => ({ ...t, colors: [...t.colors] }));

  return {
    tubes,
    selectedTube: null,
    moves: 0,
    isWon: false,
    colorblindMode,
    history: [],
    initialTubes,
    level,
    soundEnabled: true
  };
};

export const canPour = (fromTube: Tube, toTube: Tube): boolean => {
  if (fromTube.colors.length === 0) return false;
  if (toTube.colors.length >= toTube.maxCapacity) return false;
  if (toTube.colors.length === 0) return true;
  
  const topColorFrom = fromTube.colors[fromTube.colors.length - 1];
  const topColorTo = toTube.colors[toTube.colors.length - 1];
  
  return topColorFrom === topColorTo;
};

export const pourColors = (fromTube: Tube, toTube: Tube): { from: Tube; to: Tube } => {
  const newFromColors = [...fromTube.colors];
  const newToColors = [...toTube.colors];
  
  const topColor = newFromColors[newFromColors.length - 1];
  
  // Pour all consecutive colors of the same type
  while (
    newFromColors.length > 0 &&
    newFromColors[newFromColors.length - 1] === topColor &&
    newToColors.length < toTube.maxCapacity
  ) {
    const color = newFromColors.pop()!;
    newToColors.push(color);
  }
  
  return {
    from: { ...fromTube, colors: newFromColors },
    to: { ...toTube, colors: newToColors }
  };
};

export const checkWin = (tubes: Tube[]): boolean => {
  return tubes.every(tube => {
    if (tube.colors.length === 0) return true;
    if (tube.colors.length !== tube.maxCapacity) return false;
    return tube.colors.every(color => color === tube.colors[0]);
  });
};

export const isTubeComplete = (tube: Tube): boolean => {
  if (tube.colors.length === 0) return false;
  if (tube.colors.length !== tube.maxCapacity) return false;
  return tube.colors.every(color => color === tube.colors[0]);
};
