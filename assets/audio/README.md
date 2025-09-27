# Audio Assets for NEON RUSH

This directory contains the audio files for the slot machine game.

## Required Audio Files

### Sound Effects (SFX)
- `spin.mp3` - Slot reel spinning sound
- `reel-stop.mp3` - Reel stopping sound
- `win.mp3` - Small win celebration
- `big-win.mp3` - Big win celebration
- `jackpot.mp3` - Jackpot celebration
- `button-click.mp3` - UI button click
- `button-hover.mp3` - UI button hover
- `bet-change.mp3` - Bet amount change
- `coin-drop.mp3` - Coin drop/payout sound
- `game-over.mp3` - Game over sound
- `stage-up.mp3` - Stage progression sound

### Skill Effects
- `skill-activate.mp3` - General skill activation
- `time-freeze.mp3` - Time freeze skill
- `future-vision.mp3` - Future vision skill
- `miracle-spin.mp3` - Miracle spin skill

### Background Music (BGM)
- `bgm-stage1.mp3` - Stage 1 background music
- `bgm-stage2.mp3` - Stage 2 background music
- `bgm-stage3.mp3` - Stage 3 background music

## Audio Specifications

- **Format**: MP3 (recommended for web compatibility)
- **Bit Rate**: 128-320 kbps
- **Sample Rate**: 44.1 kHz
- **Duration**:
  - SFX: 0.5-3 seconds
  - BGM: 2-5 minutes (loopable)
- **Volume**: Normalized to prevent clipping

## Audio System Features

The AudioManager class provides:

- Web Audio API with HTML5 Audio fallback
- Individual volume controls (Master, SFX, Music)
- Mute functionality
- Real-time audio settings
- Performance optimization for mobile devices
- Automatic context resumption for user interaction requirements

## Testing

Use `audio-test.html` to test all audio functionality without the full game.

## Notes

- Audio files are loaded asynchronously on game initialization
- Fallback audio elements are created for unsupported formats
- The system gracefully handles missing audio files
- User interaction is required before audio can play (browser security)