# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview
This is a Progressive Web App (PWA) color sorting puzzle game built with React, TypeScript, and Create React App. The game features multiple difficulty levels, colorblind accessibility mode, animations, and Web Audio API-generated sound effects.

**Live deployment:** https://izep.github.io/z-color-sort

## Development Commands

### Start development server
```bash
pnpm start
```
Runs on http://localhost:3000 with hot reload enabled.

### Build for production
```bash
pnpm run build
```
Creates optimized production build in `build/` directory.

### Deploy to GitHub Pages
```bash
pnpm run deploy
```
Builds and deploys to GitHub Pages (gh-pages branch). Updates live site in ~1 minute.

### Run unit & component tests
```bash
pnpm test
```
Launches Jest test runner in interactive watch mode.

### Run Playwright E2E tests
```bash
pnpm run test:e2e
```
Runs end-to-end tests across desktop and mobile Chrome viewports against the production build.

### Test production build locally
```bash
pnpm run build
node scripts/serve-test.js
```


## Architecture

### Core Game Logic (src/gameLogic.ts)
The game logic is centralized and pure functional - all game state mutations return new objects. Key exports:

- **COLORS**: Array of 8 hex color codes (Red, Green, Blue, Yellow, Magenta, Cyan, Orange, Purple)
- **COLOR_PATTERNS**: 8 CSS pattern names for colorblind mode (solid, dots, stripes, grid, diagonal, waves, circles, crosshatch)
- **COLOR_LABELS**: Single letter labels (R, G, B, Y, M, C, O, P) for colorblind mode
- **createInitialGame(difficulty, colorblindMode)**: Generates initial game state with shuffled colors
- **canPour(fromTube, toTube)**: Validates if a pour is allowed (target empty OR top colors match)
- **pourColors(fromTube, toTube)**: Executes the pour, transferring all consecutive matching colors at once
- **checkWin(tubes)**: Returns true if all tubes are either empty or completely filled with one color
- **isTubeComplete(tube)**: Returns true if tube is full and contains only one color

### Type System (src/types.ts)
Two main interfaces:

- **Tube**: `{ id: number, colors: string[], maxCapacity: number }`
- **GameState**: `{ tubes: Tube[], selectedTube: number | null, moves: number, isWon: boolean, colorblindMode: boolean }`

### Component Architecture

**Game.tsx** - Main game controller (270 lines)
- Manages all game state using React hooks
- Handles tube selection and pouring with 600ms animation timing
- Generates Web Audio API sounds (pour, tube complete, victory)
- Controls difficulty levels and colorblind mode toggle
- Tracks completed tubes to trigger celebration animations

**Tube.tsx** - Individual tube rendering (60 lines)
- Displays color slots in reverse order (colors array bottom-up, UI top-down)
- Conditionally renders patterns and labels in colorblind mode
- Shows sparkle burst animation when tube completes
- Applies CSS classes for animations: `.selected`, `.pouring`, `.receiving`, `.complete`

### Difficulty Levels
The game scales complexity by adjusting colors and tubes:

- **Easy (4)**: 4 colors, 6 tubes, 4 slots/tube
- **Medium (5)**: 5 colors, 7 tubes, 4 slots/tube
- **Hard (6)**: 6 colors, 8 tubes, 4 slots/tube
- **Expert (7)**: 7 colors, 9 tubes, **5 slots/tube** (note the capacity increase)

All difficulties include 2 empty tubes for maneuvering.

### Web Audio API Sound Generation
Three distinct sounds are generated procedurally (no audio files):

1. **Pour sound**: 400Hz→200Hz exponential ramp over 300ms
2. **Tube complete**: C-E-G chord (523.25, 659.25, 783.99 Hz) with staggered start
3. **Victory melody**: C-E-G-C progression (523.25, 659.25, 783.99, 1046.5 Hz)

All sounds use OscillatorNode and GainNode with exponential ramps for smooth decay.

### Colorblind Accessibility
When enabled:
- Each color displays a single-letter label (R, G, B, Y, M, C, O, P)
- Unique CSS pattern overlays using ::before pseudo-elements with gradients
- Patterns: solid, dots (radial gradients), stripes (linear), grid, diagonal, waves, circles, crosshatch

Patterns are applied via classes like `.pattern-dots`, `.pattern-stripes` in Tube.css.

### Animation System
Animations are CSS-based with timing coordinated in Game.tsx:

- **Pouring**: 600ms duration, source shakes, destination scales
- **Pour-in effect**: Colors appear with translateY transition
- **Tube complete**: 800ms celebration with scale + rotate, plus sparkle burst
- **Win state**: Confetti animation with falling emojis (2s loop)

The setTimeout in handleTubeClick waits 600ms before updating state to sync with animations.

### PWA Implementation
- **Service Worker** (public/service-worker.js): Cache-first strategy for offline support
- **Manifest** (public/manifest.json): Standalone display mode, portrait orientation
- **Registration** (src/serviceWorkerRegistration.ts): Registered in index.tsx
- Requires HTTPS in production (GitHub Pages provides this)

## Key Algorithms

### Fisher-Yates Shuffle
Used in createInitialGame to randomize color distribution:
```typescript
for (let i = allColors.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [allColors[i], allColors[j]] = [allColors[j], allColors[i]];
}
```

### Pour Algorithm
Transfers all consecutive matching colors in one operation:
```typescript
const topColor = fromColors[fromColors.length - 1];
while (fromColors.length > 0 && 
       fromColors[fromColors.length - 1] === topColor && 
       toColors.length < maxCapacity) {
  toColors.push(fromColors.pop()!);
}
```

## Important Patterns

### State Immutability
All game state updates create new objects. Never mutate existing state:
```typescript
// Correct
const newTubes = [...gameState.tubes];
newTubes[index] = { ...tube, colors: newColors };

// Wrong
gameState.tubes[index].colors = newColors;
```

### TypeScript Strict Mode
tsconfig.json has `"strict": true` enabled. All code must:
- Explicitly type function parameters and return values
- Handle null/undefined cases
- Avoid `any` types

### Component Props
Both components use explicit interfaces for props with optional flags for animation states.

## Deployment Architecture
The app is deployed via GitHub Pages using gh-pages package:
- Production builds go to `build/` directory
- `npm run deploy` runs `gh-pages -d build`
- Deploys to `gh-pages` branch automatically
- Lives at https://izep.github.io/color-sort
- Homepage in package.json must match deployment URL

## Testing Considerations
- Testing library packages are installed (@testing-library/react, @testing-library/jest-dom)
- Tests should use `npm test` command (react-scripts test)
- Game logic functions are pure and easily testable in isolation
- Component tests should mock Web Audio API (window.AudioContext)

## Browser Compatibility
- Target: ES5 (tsconfig.json target)
- Requires Web Audio API support
- PWA features work best in Chrome/Edge
- iOS Safari supports "Add to Home Screen" but limited PWA features

## CSS Architecture
- Global styles in App.css and index.css
- Component-specific styles in Game.css and Tube.css
- Uses flexbox for layout (tubes-container, color slots)
- Animations defined via @keyframes (shake, fill, celebrate, pourIn, confetti)
- Pattern overlays use ::before pseudo-elements with gradient backgrounds
- Responsive breakpoints at 768px for mobile/tablet

## Important Files
- **src/gameLogic.ts**: All game rules and state transformations
- **src/types.ts**: TypeScript interfaces (Tube, GameState)
- **src/components/Game.tsx**: Main game UI and state management
- **src/components/Tube.tsx**: Individual tube rendering
- **public/manifest.json**: PWA configuration
- **public/service-worker.js**: Offline caching logic
- **package.json**: Dependencies and deployment config (homepage field is critical)

## Color Values Reference
When modifying colors, maintain high contrast and brightness:
- Red: #FF0000, Green: #00FF00, Blue: #0000FF, Yellow: #FFFF00
- Magenta: #FF00FF, Cyan: #00FFFF, Orange: #FF6600, Purple: #9900FF

These are intentionally bright for visibility and should remain coordinated with COLOR_PATTERNS and COLOR_LABELS arrays (same index).
