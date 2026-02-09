# 🎮 L2W Game - Learn to Win [P-737]

A cross-platform puzzle game built with React Native and Expo, featuring a unique two-phase gameplay system with dynamic grid rotation mechanics, L-block pattern matching, and progressive difficulty levels.

## 📚 Table of Contents
- [About](#-about)
- [Features](#-features)
- [Gameplay](#-gameplay)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Usage](#-usage)
- [Configuration](#-configuration)
- [Building & Deployment](#-building--deployment)
- [Game Mechanics](#-game-mechanics)
- [Project Structure](#-project-structure)
- [Contact](#-contact)

## 🧩 About

L2W (Learn to Win) is an innovative puzzle game that combines falling block mechanics with strategic pattern matching. The game features two distinct phases (Part A and Part B) with unique gameplay mechanics. Part A is a falling block puzzle where players arrange pieces to form L-shaped blocks (RFB and LFB) for points, while Part B introduces a different challenge with drag-and-drop mechanics and W-block formation. The game progressively increases difficulty through 8+ levels, each with unique rotation mechanics that change how blocks fall and move.

## ✨ Features

- **Two-Phase Gameplay**: Unique Part A (falling blocks) and Part B (drag-and-drop) mechanics
- **Dynamic Grid Rotation**: 8 levels with different falling directions (top-to-bottom, right-to-left, left-to-right, bottom-to-top)
- **L-Block Pattern Matching**: Form Right-Facing Blocks (RFB) and Left-Facing Blocks (LFB) for scoring
- **W-Block Formation**: Advanced pattern matching in Part B
- **Progressive Difficulty**: 8+ levels with increasing complexity
- **Manual & Automatic Movement**: Levels 1-2 support manual movement, all levels have automatic falling
- **Gesture Controls**: Swipe and tap controls for mobile, keyboard support for web
- **Responsive Design**: Adapts to different screen sizes and orientations
- **Cross-Platform**: Runs on iOS, Android, and Web
- **Score Tracking**: Real-time score and block count tracking
- **Level Progression**: Automatic level advancement system

## 🎯 Gameplay

### Part A - Falling Blocks
- **Objective**: Arrange falling pieces to form L-shaped blocks
- **Controls**:
  - **Swipe Left/Right**: Move piece horizontally (or vertically for levels 3-6)
  - **Swipe Down**: Drop piece instantly (levels 5+) or move down one step (levels 1-2)
  - **Swipe Up**: Move piece up (levels 3-4)
  - **Tap**: Rotate piece 90° clockwise
- **Scoring**:
  - **LFB (Left-Facing Block)**: 150 points
  - **RFB (Right-Facing Block)**: 100 points
- **Game Over**: When blocks reach the spawn edge

### Part B - Drag & Drop
- **Objective**: Arrange RFB and LFB pieces to form W-blocks
- **Controls**: Drag and drop pieces onto the grid
- **Scoring**: W-blocks worth 600 points
- **Completion**: Form all available pieces into W-blocks

### Level System
- **Level 1-2**: Top to bottom falling, center/random spawn
- **Level 3-4**: Right to left falling, vertical movement controls
- **Level 5-6**: Left to right falling, vertical movement controls
- **Level 7-8**: Bottom to top falling, horizontal movement controls
- **Level 9+**: Random rotation from levels 1-8

## 🧠 Tech Stack

- **Framework**: Expo ~54.0.23, React Native ^0.81.5
- **Language**: TypeScript 5.9.2
- **UI Library**: React 19.1.0
- **Navigation**: Expo Router ~6.0.14
- **State Management**: React Context API, Custom Hooks
- **Gestures**: React Native Gesture Handler ~2.28.0
- **Animations**: React Native Reanimated ~4.1.1
- **Storage**: AsyncStorage @react-native-async-storage/async-storage
- **Platforms**: iOS, Android, Web

## ⚙️ Installation

```bash
# Clone the repository
https://github.com/lazybigcat0624/L2W.git

# Navigate to the project directory
cd L2W

# Install dependencies
npm install
```

## 🚀 Usage

### Development

```bash
# Start the Expo development server
npm start
# or
npx expo start
```

Then choose your platform:
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Press `w` for web browser
- Scan QR code with Expo Go app (mobile)

### Running on Specific Platforms

```bash
# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

## 🧾 Configuration

### Environment Variables

No environment variables are required for basic gameplay. The game uses local state management.

### Game Constants

Game constants can be modified in `constants/game.ts`:
- `GRID_SIZE`: Grid dimensions (default: 14x14)
- `FALL_INTERVAL_MS`: Falling speed (default: 1000ms)
- `SCORES`: Point values for different block types
- `PIECE_COLORS`: Available piece colors
- `PIECE_SHAPES`: Available piece shapes

## 🏗️ Building & Deployment

### Using EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for Android
eas build --profile production --platform android

# Build for iOS
eas build --profile production --platform ios

# Build for both platforms
eas build --profile production --platform all
```

### Local Android Builds

```bash
# Development build
npm run android

# Production APK
npm run build:android:release

# ARM64 only (smaller APK)
npm run build:android:release:arm64

# Universal APK bundle
npm run build:android:universal
```

### Web Deployment (Vercel)

The project is configured for deployment on Vercel:

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Deploy to Vercel"
   git push
   ```

2. **Import project on Vercel**
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "Add New Project"
   - Import your repository
   - Vercel will automatically detect the configuration from `vercel.json`
   - Click "Deploy"

3. **Deploy via Vercel CLI**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

### Build Configuration

- **Build Command**: `npm run build:web`
- **Output Directory**: `dist`
- **Framework**: Static export (Expo)

## 🎲 Game Mechanics

### Part A Mechanics

1. **Piece Spawning**:
   - Odd levels: Center spawn
   - Even levels: Random spawn
   - Spawn position depends on rotation (top/right/bottom/left edge)

2. **Falling System**:
   - Automatic falling every 1 second for all levels
   - Manual movement available (levels 1-2: down swipe moves one step)

3. **L-Block Detection**:
   - Detects 3x3 L-shaped patterns
   - LFB patterns checked first (higher priority)
   - Cascading removals possible
   - Patterns are consistent across all levels

4. **Rotation System**:
   - Level 1-2: 0° (top to bottom)
   - Level 3-4: 90° (right to left)
   - Level 5-6: 270° (left to right)
   - Level 7-8: 180° (bottom to top)

### Part B Mechanics

1. **Piece Placement**: Drag and drop RFB/LFB pieces onto grid
2. **W-Block Formation**: Combine RFB and LFB to form W-blocks
3. **Scoring**: 600 points per W-block
4. **Completion**: All pieces must be placed as W-blocks

## 📁 Project Structure

```
L2W/
├── app/                    # Expo Router pages
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Home screen
├── components/
│   ├── game/              # Game components
│   │   ├── partA/        # Part A game logic
│   │   ├── partB/        # Part B game logic
│   │   └── L2WGame.tsx   # Main game component
│   └── ui/                # UI components
├── constants/
│   ├── game.ts           # Game constants and types
│   └── theme.ts          # Theme configuration
├── contexts/
│   └── GameContext.tsx   # Game state context
├── hooks/                 # Custom React hooks
│   ├── useGameState.ts   # Game state management
│   └── usePartAGridSize.ts
├── utils/
│   └── gameLogic.ts      # Core game logic functions
├── styles/
│   └── styles.ts         # Style definitions
└── services/
    └── googleSheets.ts   # External service integration
```

## 🎨 Key Components

- **L2WGame**: Main game container component
- **PartAGrid**: Part A falling block game
- **PartBGrid**: Part B drag-and-drop game
- **GameContext**: Centralized game state management
- **usePartAGameLogic**: Part A game logic hook
- **usePartAGestures**: Gesture handling for Part A
- **gameLogic.ts**: Core game functions (piece generation, L-block detection, etc.)

## 📬 Contact

- **Author**: IMUR
- **Email**: harukimizuno0222@gmail.com
- **GitHub**: @lazybigcat0624
- **Website/Portfolio**: https://harukimizuno.vercel.app

## 🌟 Acknowledgements

- [Expo](https://expo.dev/) – React Native framework
- [React Native](https://reactnative.dev/) – Mobile app framework
- [Vercel](https://vercel.com/) – Web deployment platform
- [EAS Build](https://docs.expo.dev/build/introduction/) – Cloud build service

## 📝 License

This project is private and proprietary.

## 🔄 Version

Current version: 1.0.0

---

**Note**: This game is designed for educational and entertainment purposes. Enjoy playing L2W!
