# Color Sort Game 🎨

A Progressive Web App (PWA) color sorting puzzle game built with React and TypeScript.

## 🎮 Play Now

**Live Demo:** https://izep.github.io/z-color-sort

## 📋 Table of Contents

- [Features](#-features)
- [How to Play](#-how-to-play)
- [Quick Start](#-quick-start)
- [Complete Setup Guide](#-complete-setup-guide)
- [Game Specifications](#-game-specifications)
- [Technical Requirements](#-technical-requirements)
- [Implementation Details](#-implementation-details)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Technologies Used](#-technologies-used)

## ✨ Features

- 🎮 Engaging puzzle gameplay - sort colors into tubes
- 📱 Responsive design - works on all devices (mobile, tablet, desktop)
- 🚀 Progressive Web App - installable and works offline
- 🎯 Four difficulty levels (Easy, Medium, Hard, Expert)
- 🎨 Bright, distinct colors for better visibility
- ♿ **Colorblind accessibility mode** with patterns and labels
- ⚡ Fast and responsive
- 💾 Offline support with service worker
- 📦 Installable on mobile and desktop
- 🎬 **Sand pouring animations** when moving colors
- 🎵 **Sound effects** for pouring and celebrations
- ✨ **Celebration animations** when completing a tube
- 🎉 **Big celebration** when winning the game

## 🎯 How to Play

1. **Click on a tube** to select it (it will lift up)
2. **Click on another tube** to pour the colors
3. **Rules:**
   - You can only pour if the target tube is empty, OR
   - The top color matches the target tube's top color
   - All consecutive colors of the same type pour at once
4. **Goal:** Sort all colors so each tube contains only one color
5. **Strategy:** Use the two empty tubes wisely!

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Git

### Install dependencies
```bash
npm install
```

### Run development server
```bash
npm start
```
Opens at http://localhost:3000

### Build for production
```bash
npm run build
```

### Deploy to GitHub Pages
```bash
npm run deploy
```

---

## 📖 Complete Setup Guide

### Step 1: Create React App with TypeScript

```bash
npx create-react-app color-sort --template typescript
cd color-sort
```

### Step 2: Install Additional Dependencies

```bash
npm install --save-dev gh-pages
```

### Step 3: Configure package.json

Add the following to `package.json`:

```json
{
  "homepage": "https://YOUR_USERNAME.github.io/color-sort",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  },
  "devDependencies": {
    "gh-pages": "^6.3.0"
  }
}
```

### Step 4: Create Type Definitions

Create `src/types.ts`:

```typescript
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
}
```

### Step 5: Implement Game Logic

Create `src/gameLogic.ts` with:
- Color definitions (8 colors: Red, Green, Blue, Yellow, Magenta, Cyan, Orange, Purple)
- Pattern definitions for colorblind mode
- Label definitions (R, G, B, Y, M, C, O, P)
- `createInitialGame()` - Initialize game state
- `canPour()` - Validate if pour is allowed
- `pourColors()` - Execute color transfer
- `checkWin()` - Detect win condition
- `isTubeComplete()` - Check if tube is complete

**Key Game Logic:**
```typescript
export const COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FF6600', '#9900FF'];
export const COLOR_PATTERNS = ['solid', 'dots', 'stripes', 'grid', 'diagonal', 'waves', 'circles', 'crosshatch'];
export const COLOR_LABELS = ['R', 'G', 'B', 'Y', 'M', 'C', 'O', 'P'];

export const createInitialGame = (difficulty: number = 4, colorblindMode: boolean = false): GameState => {
  const numColors = difficulty;
  const tubeCapacity = difficulty >= 7 ? 5 : 4; // Expert mode has 5 slots
  // Shuffle colors and distribute across tubes
  // Add 2 empty tubes
  return { tubes, selectedTube: null, moves: 0, isWon: false, colorblindMode };
};
```

### Step 6: Create Tube Component

Create `src/components/Tube.tsx`:
- Display individual tube with colors
- Show patterns and labels in colorblind mode
- Handle animations (pouring, receiving, complete)
- Render sparkle effects when complete

Create `src/components/Tube.css`:
- Tube styling (60px × 240px, rounded bottom)
- Color slot layout (flex column)
- Animation keyframes (shake, fill, celebrate, pourIn)
- Pattern overlays (8 different CSS patterns using gradients)
- Label styling (bold, centered, with outline)

**Pattern Implementation:**
```css
.color-slot.pattern-dots::before {
  background-image: radial-gradient(circle, rgba(255,255,255,0.5) 2px, transparent 2px);
  background-size: 8px 8px;
}
```

### Step 7: Create Game Component

Create `src/components/Game.tsx`:
- Game state management
- Tube click handling
- Pour logic with animation timing
- Sound generation using Web Audio API
- Colorblind mode toggle
- Difficulty controls
- Win detection

**Sound Generation:**
```typescript
const playPourSound = () => {
  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
  // Configure and play
};
```

Create `src/components/Game.css`:
- Game layout (flexbox centered)
- Header styling
- Win message with confetti animation
- Controls and button styling
- Responsive design (mobile breakpoints)

### Step 8: Configure PWA

**Update `public/index.html`:**
```html
<meta name="theme-color" content="#667eea" />
<meta name="description" content="Color Sort - A fun puzzle game where you sort colors into tubes" />
<title>Color Sort Game</title>
```

**Update `public/manifest.json`:**
```json
{
  "short_name": "Color Sort",
  "name": "Color Sort Puzzle Game",
  "theme_color": "#667eea",
  "background_color": "#667eea",
  "display": "standalone",
  "orientation": "portrait"
}
```

**Create `public/service-worker.js`:**
```javascript
const CACHE_NAME = 'color-sort-v1';
const urlsToCache = ['/', '/index.html', '/static/js/bundle.js', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
});
```

**Create `src/serviceWorkerRegistration.ts`:**
- Service worker registration logic
- Update detection
- Offline mode handling

**Update `src/index.tsx`:**
```typescript
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
// After render:
serviceWorkerRegistration.register();
```

### Step 9: Update App Component

Update `src/App.tsx`:
```typescript
import Game from './components/Game';
function App() {
  return <div className="App"><Game /></div>;
}
```

Update `src/App.css`:
```css
* { margin: 0; padding: 0; box-sizing: border-box; }
.App { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; }
```

### Step 10: Deploy

```bash
# Create GitHub repository
gh repo create YOUR_USERNAME/color-sort --public --source=. --push

# Build and deploy
npm run build
npm run deploy
```

---

## 🎨 Game Specifications

### Difficulty Levels

| Level  | Colors | Tubes | Slots/Tube | Total Units |
|--------|--------|-------|------------|-------------|
| Easy   | 4      | 6     | 4          | 16          |
| Medium | 5      | 7     | 4          | 20          |
| Hard   | 6      | 8     | 4          | 24          |
| Expert | 7      | 9     | 5          | 35          |

### Color Specifications

| Color   | Hex Code | Label | Pattern     |
|---------|----------|-------|-------------|
| Red     | #FF0000  | R     | Solid       |
| Green   | #00FF00  | G     | Dots        |
| Blue    | #0000FF  | B     | Stripes     |
| Yellow  | #FFFF00  | Y     | Grid        |
| Magenta | #FF00FF  | M     | Diagonal    |
| Cyan    | #00FFFF  | C     | Waves       |
| Orange  | #FF6600  | O     | Circles     |
| Purple  | #9900FF  | P     | Crosshatch  |

### Game Rules

1. **Selection**: Click any non-empty tube to select
2. **Pouring**: Click another tube to pour
3. **Valid Pour Conditions**:
   - Target tube is empty, OR
   - Top colors match
   - Target has space available
4. **Pour Behavior**: All consecutive matching colors pour at once
5. **Win Condition**: All tubes either empty or filled with single color

### Accessibility Features

**Colorblind Mode** - Toggle with "👁️ Patterns" button:
- Letter labels on each color block
- Unique visual patterns using CSS gradients
- High contrast patterns (rgba(255,255,255,0.3-0.5))
- Supports: Deuteranopia, Protanopia, Tritanopia, Achromatopsia

### Animation Specifications

**Pouring (600ms)**:
- Source tube: Shake animation (rotate ±5deg)
- Destination tube: Fill animation (scale 1.0 → 1.05)
- Colors: Pour-in effect (translateY -100% → 0, opacity 0 → 1)

**Tube Complete (800ms)**:
- Tube celebrates (scale 1.1, rotate ±5deg)
- 4 golden sparkles burst radially
- Completion sound (C-E-G chord)

**Game Win (1000ms)**:
- Banner scales from 0 with rotation
- Confetti emojis fall continuously (2s loop)
- Victory melody (C-E-G-C progression)

### Audio Specifications

Generated using Web Audio API:

1. **Pour Sound** (300ms)
   - Oscillator: 400Hz → 200Hz exponential ramp
   - Gain: 0.3 → 0.01

2. **Tube Complete** (500ms)
   - Three oscillators: 523.25Hz (C), 659.25Hz (E), 783.99Hz (G)
   - Staggered start: 0ms, 50ms, 100ms
   - Gain: 0.2 → 0.01

3. **Victory Melody** (750ms)
   - Four notes: C (523.25), E (659.25), G (783.99), C (1046.5)
   - Timing: 0ms, 150ms, 300ms, 450ms
   - Gain: 0.3 → 0.01

---

## 🔧 Technical Requirements

### Dependencies

```json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-scripts": "5.0.1",
    "typescript": "^4.9.5",
    "web-vitals": "^2.1.4"
  },
  "devDependencies": {
    "@testing-library/dom": "^10.4.1",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^13.5.0",
    "@types/jest": "^27.5.2",
    "@types/node": "^16.18.126",
    "@types/react": "^19.2.6",
    "@types/react-dom": "^19.2.3",
    "gh-pages": "^6.3.0"
  }
}
```

### TypeScript Configuration

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

### Build Configuration

- **Production Build**: `npm run build`
- **Output**: `build/` directory
- **Bundle Size**: ~63.58 kB (gzipped)
- **CSS Size**: ~1.8 kB (gzipped)

### Browser Support

- Chrome/Edge 90+ (full PWA support)
- Firefox 88+
- Safari 14+ (iOS Add to Home Screen)
- Web Audio API support required

---

## 💻 Implementation Details

### Core Files Breakdown

**1. src/types.ts** (13 lines)
- Tube interface
- GameState interface

**2. src/gameLogic.ts** (~100 lines)
- Color, pattern, and label arrays
- Game initialization logic
- Pour validation
- Win detection
- Helper functions

**3. src/components/Tube.tsx** (~60 lines)
- Tube rendering
- Pattern and label display
- Props: tube, isSelected, isPouring, isReceiving, isComplete, colorblindMode

**4. src/components/Tube.css** (~170 lines)
- Tube container styling
- 8 pattern definitions
- Animation keyframes
- Label styling
- Responsive adjustments

**5. src/components/Game.tsx** (~270 lines)
- State management
- Event handlers
- Sound generation functions
- Difficulty controls
- Colorblind mode toggle

**6. src/components/Game.css** (~130 lines)
- Layout and header
- Win message with confetti
- Controls styling
- Responsive design

### Key Algorithms

**Shuffle Algorithm (Fisher-Yates)**:
```typescript
for (let i = allColors.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [allColors[i], allColors[j]] = [allColors[j], allColors[i]];
}
```

**Pour Algorithm**:
```typescript
const topColor = fromColors[fromColors.length - 1];
while (fromColors.length > 0 && 
       fromColors[fromColors.length - 1] === topColor && 
       toColors.length < maxCapacity) {
  toColors.push(fromColors.pop()!);
}
```

**Win Detection**:
```typescript
tubes.every(tube => 
  tube.colors.length === 0 || 
  (tube.colors.length === tube.maxCapacity && 
   tube.colors.every(c => c === tube.colors[0]))
);
```

---

## 📂 Project Structure

```
color-sort/
├── public/
│   ├── index.html                 # HTML template with PWA meta tags
│   ├── manifest.json              # PWA manifest configuration
│   ├── service-worker.js          # Service worker for offline support
│   ├── favicon.ico                # App icon (16x16, 32x32)
│   ├── logo192.png                # PWA icon (192x192)
│   └── logo512.png                # PWA icon (512x512)
├── src/
│   ├── components/
│   │   ├── Game.tsx               # Main game component with state
│   │   ├── Game.css               # Game layout and styling
│   │   ├── Tube.tsx               # Individual tube component
│   │   └── Tube.css               # Tube styling and patterns
│   ├── types.ts                   # TypeScript type definitions
│   ├── gameLogic.ts               # Game rules and logic
│   ├── serviceWorkerRegistration.ts # SW registration utilities
│   ├── App.tsx                    # Root component
│   ├── App.css                    # Global styles
│   ├── index.tsx                  # Entry point
│   ├── index.css                  # Base CSS
│   ├── reportWebVitals.ts         # Performance monitoring
│   └── react-app-env.d.ts         # React types
├── .gitignore                     # Git ignore rules
├── package.json                   # Dependencies and scripts
├── package-lock.json              # Locked dependency versions
├── tsconfig.json                  # TypeScript configuration
├── README.md                      # This file
├── IMPLEMENTATION.md              # Technical details
└── DEPLOYMENT.md                  # Deployment guide
```

---

## 🚢 Deployment

### GitHub Pages (Current)

1. **Configure package.json**:
```json
{
  "homepage": "https://YOUR_USERNAME.github.io/color-sort"
}
```

2. **Deploy**:
```bash
npm run deploy
```

3. **Live URL**: https://izep.github.io/z-color-sort

### Alternative: Netlify

```bash
npm run build
# Drag 'build' folder to netlify.com/drop
```

### Alternative: Vercel

```bash
npm run build
vercel --prod
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment options.

---

## 📱 PWA Installation

### On Mobile (iOS/Android)
1. Open https://izep.github.io/z-color-sort in your browser
2. Tap the "Share" or "Menu" button
3. Select "Add to Home Screen"
4. The app will appear as a standalone app icon

### On Desktop (Chrome/Edge)
1. Open https://izep.github.io/z-color-sort in your browser
2. Look for the install icon in the address bar
3. Click "Install"
4. The app will open in its own window

---

## 🛠️ PWA Features

- ✅ Installable on mobile devices and desktop
- ✅ Works offline after first visit
- ✅ Fast loading with service worker caching
- ✅ Standalone app experience (no browser UI)
- ✅ App manifest with theme colors
- ✅ Responsive and mobile-optimized

---

## 📦 Technologies Used

- **React 19** - UI library
- **TypeScript 4.9** - Type safety
- **CSS3** - Styling with animations and gradients
- **Service Workers** - PWA offline functionality
- **Web App Manifest** - PWA metadata
- **Web Audio API** - Sound effects generation
- **GitHub Pages** - Hosting
- **Accessibility patterns** - Colorblind support
- **Create React App** - Build tooling

---

## 🎓 Learning Resources

This project demonstrates:
- React hooks (useState, useEffect)
- TypeScript with React
- Component composition
- Game state management
- CSS animations and transitions
- Progressive Web App implementation
- Service Worker registration
- Responsive design
- GitHub Pages deployment
- **Accessibility patterns for colorblind users**
- **Web Audio API for sound generation**
- Fisher-Yates shuffle algorithm
- Game loop and win detection
- Event handling and state updates

---

## 📝 License

MIT

---

## 🤝 Contributing

To recreate this project from scratch:

1. Follow the [Complete Setup Guide](#-complete-setup-guide) above
2. Implement each component according to specifications
3. Use the provided code snippets and patterns
4. Test thoroughly on multiple devices
5. Deploy to your preferred hosting platform

All requirements, specifications, and implementation details are documented in this README.

---

**Play now at: https://izep.github.io/z-color-sort 🎨**
