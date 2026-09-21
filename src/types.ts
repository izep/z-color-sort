export interface Tube {
  id: number;
  colors: string[];
  maxCapacity: number;
}

export interface GameState {
  tubes: Tube[];
  selectedTube: number | null;
  moves: number;
  isWon: boolean;
  colorblindMode: boolean;
  history?: Tube[][];
  initialTubes?: Tube[];
  level?: number;
  soundEnabled?: boolean;
}
