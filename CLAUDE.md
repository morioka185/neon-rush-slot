# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NEON RUSH is a mobile-optimized slot machine game built with vanilla HTML5, CSS3, and JavaScript. The game features a 3x3 slot grid with a stage progression system, special skills, and comprehensive audio support.

## Development Commands

```bash
# Start development server with live reload
npm run dev
# or
npm start

# Start basic Python server (alternative)
npm run serve
```

## Architecture Overview

The codebase follows a modular ES6 architecture with clear separation of concerns:

### Core Systems
- **GameState** (`js/core/GameState.js`): Centralized state management with event system
- **SlotMachine** (`js/game/SlotMachine.js`): Core slot mechanics and reel animation
- **PaylineEngine** (`js/game/PaylineEngine.js`): Win detection and payout calculation

### Feature Systems
- **SkillSystem** (`js/skills/`): Special abilities (TimeFreeze, FutureVision, MiracleSpin)
- **AudioManager** (`js/audio/`): Web Audio API with HTML5 fallback
- **EffectSystem** (`js/effects/`): Visual effects and animations
- **SpecialBetSystem** (`js/features/`): Advanced betting mechanics

### Entry Point
- **main.js**: Game initialization and mobile optimization layer (NeonRushGame class)

## Key Implementation Details

### State Management
- GameState uses event-driven architecture with subscribe/notify pattern
- All game state changes trigger events for UI updates
- State persistence is intentionally disabled (reloads reset game)

### Mobile Optimization
- Touch gesture support (tap, double-tap, long-press, swipe)
- Performance monitoring with visibility API
- Responsive design with viewport scaling

### Audio Architecture
- AudioManager handles both Web Audio API and HTML5 Audio
- Three-tier volume control (Master, SFX, Music)
- Graceful fallback for missing audio files
- User interaction requirement compliance

### Stage System
The game features 5 progressive stages with different features:
1. NORMAL (10K-30K): Basic gameplay
2. HEAT (30K-70K): Fever time, double-or-nothing
3. DANGER (70K-150K): Risk betting, chain bonuses
4. CHAOS (150K-500K): All-or-nothing, god mode
5. LEGEND (500K+): Million chance challenges

## File Structure Patterns

```
js/
├── core/           # Core game systems
├── game/           # Slot machine logic
├── audio/          # Audio management
├── skills/         # Special abilities
├── effects/        # Visual effects
├── features/       # Advanced game features
└── data/           # Game configuration
```

## Testing Files

- `audio-test.html`: Audio system testing
- `debug-test.html`: Debug functionality
- `performance-test.html`: Performance monitoring
- `quick-audio-test.html`: Quick audio verification

## Important Notes

- No external frameworks or libraries used (vanilla JS only)
- CSS animations use GPU acceleration (transform/opacity)
- Symbol system uses weighted probability (see `js/data/symbols.js`)
- All UI text is in Japanese
- Game designed for 60fps mobile performance