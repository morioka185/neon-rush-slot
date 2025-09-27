/**
 * NEON RUSH - Audio Manager
 * 音響システム管理クラス
 * 🧠💊 脳汁MAX仕様
 */

import { SynthAudioGenerator } from './SynthAudioGenerator.js';

export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.synthGenerator = null;
        this.isInitialized = false;
        this.isMuted = false;
        this.masterVolume = 1.0;
        this.sfxVolume = 0.8;
        this.musicVolume = 0.6;

        // オーディオバッファとソース（ファイルベース）
        this.audioBuffers = new Map();
        this.activeSources = new Set();
        this.backgroundMusic = null;
        this.currentMusicName = null;

        // 設定
        this.enableMusic = true;
        this.enableSFX = true;
        this.useSynthetic = true; // 合成音優先

        // プリロード対象の音声ファイル
        this.soundFiles = {
            // スロット関連
            spin: { url: 'assets/audio/spin.mp3', volume: 0.7, loop: false },
            reelStop: { url: 'assets/audio/reel-stop.mp3', volume: 0.6, loop: false },

            // 勝利関連
            win: { url: 'assets/audio/win.mp3', volume: 0.8, loop: false },
            bigWin: { url: 'assets/audio/big-win.mp3', volume: 0.9, loop: false },
            jackpot: { url: 'assets/audio/jackpot.mp3', volume: 1.0, loop: false },

            // UI関連
            buttonClick: { url: 'assets/audio/button-click.mp3', volume: 0.5, loop: false },
            buttonHover: { url: 'assets/audio/button-hover.mp3', volume: 0.3, loop: false },
            betChange: { url: 'assets/audio/bet-change.mp3', volume: 0.4, loop: false },

            // スキル関連
            skillActivate: { url: 'assets/audio/skill-activate.mp3', volume: 0.7, loop: false },
            timeFreeze: { url: 'assets/audio/time-freeze.mp3', volume: 0.8, loop: false },
            futureVision: { url: 'assets/audio/future-vision.mp3', volume: 0.7, loop: false },
            miracleSpin: { url: 'assets/audio/miracle-spin.mp3', volume: 0.9, loop: false },

            // システム関連
            stageUp: { url: 'assets/audio/stage-up.mp3', volume: 0.8, loop: false },
            gameOver: { url: 'assets/audio/game-over.mp3', volume: 0.7, loop: false },
            coinDrop: { url: 'assets/audio/coin-drop.mp3', volume: 0.6, loop: false },

            // 背景音楽
            bgmStage1: { url: 'assets/audio/bgm-stage1.mp3', volume: 0.4, loop: true },
            bgmStage2: { url: 'assets/audio/bgm-stage2.mp3', volume: 0.4, loop: true },
            bgmStage3: { url: 'assets/audio/bgm-stage3.mp3', volume: 0.4, loop: true }
        };

        // Web Audio API未対応の場合のフォールバック
        this.fallbackAudio = new Map();
    }

    async init() {
        try {
            // Web Audio API初期化
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // ユーザーインタラクション後に再開
            if (this.audioContext.state === 'suspended') {
                await this.resumeContext();
            }

            // 合成音ジェネレーター初期化
            this.synthGenerator = new SynthAudioGenerator(this.audioContext);

            // 音声ファイルをプリロード（合成音がメインだが念のため）
            if (!this.useSynthetic) {
                await this.preloadAudioFiles();
            }

            this.isInitialized = true;
            console.log('🧠💊 AudioManager初期化完了 - 脳汁MAXモード');

        } catch (error) {
            console.warn('⚠️ Web Audio API初期化失敗、フォールバックモードで動作:', error);
            this.initFallbackAudio();
        }
    }

    async resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
            console.log('🎵 AudioContext resumed');
        }
    }

    // ユーザーインタラクションで確実に開始
    async ensureAudioContext() {
        if (!this.audioContext) {
            await this.init();
        }

        if (this.audioContext.state === 'suspended') {
            await this.resumeContext();
        }

        return this.audioContext.state === 'running';
    }

    async preloadAudioFiles() {
        const loadPromises = Object.entries(this.soundFiles).map(async ([name, config]) => {
            try {
                const buffer = await this.loadAudioBuffer(config.url);
                this.audioBuffers.set(name, { buffer, config });
            } catch (error) {
                console.warn(`音声ファイル読み込み失敗: ${name} (${config.url})`, error);
                // フォールバック用HTML5 Audioを作成
                this.createFallbackAudio(name, config);
            }
        });

        await Promise.allSettled(loadPromises);
    }

    async loadAudioBuffer(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load audio: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return await this.audioContext.decodeAudioData(arrayBuffer);
    }

    initFallbackAudio() {
        Object.entries(this.soundFiles).forEach(([name, config]) => {
            this.createFallbackAudio(name, config);
        });
        this.isInitialized = true;
    }

    createFallbackAudio(name, config) {
        const audio = new Audio(config.url);
        audio.preload = 'auto';
        audio.loop = config.loop;
        audio.volume = config.volume * this.sfxVolume * this.masterVolume;
        this.fallbackAudio.set(name, audio);
    }

    // 効果音再生 - 🧠💊 合成音優先
    async playSFX(soundName, options = {}) {
        if (!this.enableSFX || this.isMuted) return;

        // オーディオコンテキストを確実に開始
        const isReady = await this.ensureAudioContext();
        if (!isReady) {
            console.warn('AudioContext not ready');
            return;
        }

        const {
            volume = 1.0,
            pitch = 1.0,
            delay = 0,
            fadeIn = 0,
            fadeOut = 0
        } = options;

        // 合成音を優先使用
        if (this.useSynthetic && this.synthGenerator) {
            this.playSyntheticSFX(soundName, options);
        } else if (this.audioContext && this.audioBuffers.has(soundName)) {
            this.playWebAudioSFX(soundName, { volume, pitch, delay, fadeIn, fadeOut });
        } else if (this.fallbackAudio.has(soundName)) {
            this.playFallbackAudio(soundName, volume);
        } else {
            console.warn(`音声ファイルが見つかりません: ${soundName}`);
        }
    }

    // 🧠💊 合成効果音再生
    playSyntheticSFX(soundName, options = {}) {
        if (!this.synthGenerator) return;

        try {
            switch (soundName) {
                case 'spin':
                    this.synthGenerator.generateSpinSound(2.0);
                    break;
                case 'reelStop':
                    this.synthGenerator.generateReelStopSound();
                    break;
                case 'win':
                    this.synthGenerator.generateWinSound('small');
                    break;
                case 'bigWin':
                    this.synthGenerator.generateWinSound('big');
                    break;
                case 'jackpot':
                    this.synthGenerator.generateWinSound('jackpot');
                    break;
                case 'buttonClick':
                    this.generateButtonClickSound();
                    break;
                case 'betChange':
                    this.generateBetChangeSound();
                    break;
                case 'coinDrop':
                    this.generateCoinDropSound();
                    break;
                case 'skillActivate':
                    this.generateSkillSound();
                    break;
                case 'timeFreeze':
                    this.generateTimeFreezeSound();
                    break;
                case 'futureVision':
                    this.generateFutureVisionSound();
                    break;
                case 'miracleSpin':
                    this.generateMiracleSpinSound();
                    break;
                case 'stageUp':
                    this.generateStageUpSound();
                    break;
                case 'gameOver':
                    this.generateGameOverSound();
                    break;
                case 'impact':
                    this.generateImpactSound();
                    break;
                case 'anticipationLow':
                    this.generateAnticipationLowSound();
                    break;
                case 'anticipationMedium':
                    this.generateAnticipationMediumSound();
                    break;
                case 'anticipationHigh':
                    this.generateAnticipationHighSound();
                    break;
                case 'reach':
                    this.generateReachSound();
                    break;
                default:
                    console.warn(`合成音が定義されていません: ${soundName}`);
            }
        } catch (error) {
            console.warn(`合成音生成エラー: ${soundName}`, error);
        }
    }

    // 🔘 ボタンクリック音生成
    generateButtonClickSound() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);

        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.2 * this.sfxVolume, this.audioContext.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.1);
    }

    // 💰 ベット変更音生成
    generateBetChangeSound() {
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc1.type = 'sine';
        osc1.frequency.value = 523; // C5
        osc2.type = 'sine';
        osc2.frequency.value = 659; // E5

        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.3 * this.sfxVolume, this.audioContext.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.audioContext.destination);

        osc1.start();
        osc2.start();
        osc1.stop(this.audioContext.currentTime + 0.3);
        osc2.stop(this.audioContext.currentTime + 0.3);
    }

    // 🪙 コインドロップ音生成
    generateCoinDropSound() {
        for (let i = 0; i < 5; i++) {
            const delay = i * 0.05;
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(800 + Math.random() * 400, this.audioContext.currentTime + delay);
            osc.frequency.exponentialRampToValueAtTime(400 + Math.random() * 200, this.audioContext.currentTime + delay + 0.2);

            gain.gain.setValueAtTime(0, this.audioContext.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(0.3 * this.sfxVolume, this.audioContext.currentTime + delay + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + delay + 0.2);

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.start(this.audioContext.currentTime + delay);
            osc.stop(this.audioContext.currentTime + delay + 0.2);
        }
    }

    // ⚡ スキル発動音生成
    generateSkillSound() {
        const duration = 0.8;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, this.audioContext.currentTime + duration);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, this.audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(2000, this.audioContext.currentTime + duration);
        filter.Q.value = 5;

        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.5 * this.sfxVolume, this.audioContext.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start();
        osc.stop(this.audioContext.currentTime + duration);
    }

    // ⏱️ タイムフリーズ音生成
    generateTimeFreezeSound() {
        const duration = 1.5;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(2000, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + duration);

        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.4 * this.sfxVolume, this.audioContext.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start();
        osc.stop(this.audioContext.currentTime + duration);
    }

    // 👁️ フューチャービジョン音生成
    generateFutureVisionSound() {
        const duration = 1.0;

        // 神秘的な音
        for (let i = 0; i < 3; i++) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const delay = i * 0.2;

            osc.type = 'triangle';
            osc.frequency.value = 440 * Math.pow(2, i * 0.25); // ハーモニック

            gain.gain.setValueAtTime(0, this.audioContext.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(0.2 * this.sfxVolume, this.audioContext.currentTime + delay + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + delay + duration);

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.start(this.audioContext.currentTime + delay);
            osc.stop(this.audioContext.currentTime + delay + duration);
        }
    }

    // ✨ ミラクルスピン音生成
    generateMiracleSpinSound() {
        const duration = 2.0;

        // キラキラ効果
        for (let i = 0; i < 20; i++) {
            const delay = Math.random() * duration;
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.value = 1000 + Math.random() * 2000;

            gain.gain.setValueAtTime(0, this.audioContext.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(0.3 * this.sfxVolume, this.audioContext.currentTime + delay + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + delay + 0.15);

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.start(this.audioContext.currentTime + delay);
            osc.stop(this.audioContext.currentTime + delay + 0.2);
        }
    }

    // 🎊 ステージアップ音生成
    generateStageUpSound() {
        const notes = [523, 659, 784, 1047]; // C-E-G-C (オクターブ)

        notes.forEach((freq, index) => {
            const delay = index * 0.15;
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'triangle';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0, this.audioContext.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(0.6 * this.sfxVolume, this.audioContext.currentTime + delay + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + delay + 0.8);

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.start(this.audioContext.currentTime + delay);
            osc.stop(this.audioContext.currentTime + delay + 0.8);
        });
    }

    // 🔔 ゲームオーバー音生成（ブブ音）
    generateGameOverSound() {
        // 短い「ブブ」音
        const frequencies = [300, 250]; // 2つの低音
        const noteDuration = 0.15;

        frequencies.forEach((freq, index) => {
            const delay = index * 0.2; // 0.2秒間隔
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'square'; // ブザー音らしい音色
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0, this.audioContext.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(0.3 * this.sfxVolume, this.audioContext.currentTime + delay + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + delay + noteDuration);

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.start(this.audioContext.currentTime + delay);
            osc.stop(this.audioContext.currentTime + delay + noteDuration);
        });
    }

    // 💥 インパクト音生成
    generateImpactSound() {
        const duration = 0.3;
        const noise = this.audioContext.createBufferSource();
        const filter = this.audioContext.createBiquadFilter();
        const gain = this.audioContext.createGain();

        // ノイズバッファ生成
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        noise.buffer = buffer;

        // フィルター設定（低域強調）
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, this.audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + duration);
        filter.Q.value = 5;

        // ゲイン設定
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.8 * this.sfxVolume, this.audioContext.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);

        noise.start();
        noise.stop(this.audioContext.currentTime + duration);
    }

    // 🔔 期待感低音生成（軽いベル音）
    generateAnticipationLowSound() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'triangle';
        osc.frequency.value = 330; // 低めの固定音

        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.2 * this.sfxVolume, this.audioContext.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.3);
    }

    // 🔔 期待感中音生成（連続ベル音）
    generateAnticipationMediumSound() {
        // 中程度の期待感を演出する連続音
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();

        osc1.type = 'triangle';
        osc2.type = 'sine';
        lfo.type = 'sine';

        // メイン周波数設定
        osc1.frequency.value = 380;
        osc2.frequency.value = 390;

        // LFO（ビブラート効果）
        lfo.frequency.value = 6; // 6Hz のビブラート
        lfoGain.gain.value = 10; // 周波数変調の深さ

        lfo.connect(lfoGain);
        lfoGain.connect(osc1.frequency);
        lfoGain.connect(osc2.frequency);

        // 音量エンベロープ
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.22 * this.sfxVolume, this.audioContext.currentTime + 0.05);
        gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.audioContext.currentTime + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.6);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.audioContext.destination);

        lfo.start();
        osc1.start();
        osc2.start();
        lfo.stop(this.audioContext.currentTime + 0.6);
        osc1.stop(this.audioContext.currentTime + 0.6);
        osc2.stop(this.audioContext.currentTime + 0.6);
    }

    // 🔔 期待感高音生成（2回ベル音）
    generateAnticipationHighSound() {
        // 短い2回のベル音
        [0, 0.2].forEach((delay, index) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'triangle';
            osc.frequency.value = 440 + (index * 110); // 440Hz, 550Hz

            gain.gain.setValueAtTime(0, this.audioContext.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(0.25 * this.sfxVolume, this.audioContext.currentTime + delay + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + delay + 0.3);

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.start(this.audioContext.currentTime + delay);
            osc.stop(this.audioContext.currentTime + delay + 0.3);
        });
    }

    // 🎯 リーチ音生成（短いチャイム音）
    generateReachSound() {
        // 短いチャイム風の3音
        const frequencies = [523, 659, 784]; // C-E-G コード

        frequencies.forEach((freq, index) => {
            const delay = index * 0.1;
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'triangle';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0, this.audioContext.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(0.3 * this.sfxVolume, this.audioContext.currentTime + delay + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + delay + 0.5);

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.start(this.audioContext.currentTime + delay);
            osc.stop(this.audioContext.currentTime + delay + 0.5);
        });
    }

    playWebAudioSFX(soundName, options) {
        const { buffer, config } = this.audioBuffers.get(soundName);
        const { volume, pitch, delay, fadeIn, fadeOut } = options;

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();

        source.buffer = buffer;
        source.playbackRate.value = pitch;

        // ボリューム設定
        const finalVolume = config.volume * volume * this.sfxVolume * this.masterVolume;
        gainNode.gain.value = fadeIn > 0 ? 0 : finalVolume;

        // ノード接続
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // フェードイン
        if (fadeIn > 0) {
            gainNode.gain.exponentialRampToValueAtTime(
                finalVolume,
                this.audioContext.currentTime + delay + fadeIn
            );
        }

        // フェードアウト
        if (fadeOut > 0) {
            const fadeStartTime = this.audioContext.currentTime + delay + buffer.duration - fadeOut;
            gainNode.gain.exponentialRampToValueAtTime(
                0.01,
                fadeStartTime + fadeOut
            );
        }

        // 再生開始
        source.start(this.audioContext.currentTime + delay);

        // 再生終了時のクリーンアップ
        source.onended = () => {
            this.activeSources.delete(source);
        };

        this.activeSources.add(source);
        return source;
    }

    playFallbackAudio(soundName, volume = 1.0) {
        const audio = this.fallbackAudio.get(soundName);
        if (!audio) return;

        const config = this.soundFiles[soundName];
        audio.volume = config.volume * volume * this.sfxVolume * this.masterVolume;

        audio.currentTime = 0;
        audio.play().catch(error => {
            console.warn(`音声再生失敗: ${soundName}`, error);
        });
    }

    // 背景音楽関連 - 🧠💊 合成音優先
    async playBackgroundMusic(musicName) {
        if (!this.enableMusic || this.isMuted) return;

        // 同じ音楽が既に再生中の場合はスキップ
        if (this.currentMusicName === musicName) {
            return;
        }

        // オーディオコンテキストを確実に開始
        const isReady = await this.ensureAudioContext();
        if (!isReady) {
            console.warn('AudioContext not ready for music');
            return;
        }

        this.stopBackgroundMusic();
        this.currentMusicName = musicName;

        // 合成音楽を優先使用
        if (this.useSynthetic && this.synthGenerator) {
            this.playSyntheticMusic(musicName);
        } else if (this.audioContext && this.audioBuffers.has(musicName)) {
            this.playWebAudioMusic(musicName);
        } else if (this.fallbackAudio.has(musicName)) {
            this.playFallbackMusic(musicName);
        }
    }

    // 🧠💊 合成背景音楽再生
    playSyntheticMusic(musicName) {
        if (!this.synthGenerator) {
            console.warn('SynthGenerator未初期化');
            return;
        }

        try {
            const stageMap = {
                'bgmStage1': 1,
                'bgmStage2': 2,
                'bgmStage3': 3
            };

            const stage = stageMap[musicName] || 1;
            console.log(`🎵 合成BGM再生開始: ${musicName} (ステージ${stage})`);

            // まず簡単なテスト音を再生
            this.playTestBeep();

            // 少し遅れてBGMを開始
            setTimeout(() => {
                this.backgroundMusic = this.synthGenerator.generateBackgroundMusic(stage);
                if (this.backgroundMusic) {
                    console.log('合成BGM生成成功');
                } else {
                    console.warn('合成BGM生成失敗');
                }
            }, 500);

        } catch (error) {
            console.warn(`合成音楽生成エラー: ${musicName}`, error);
        }
    }

    // テスト用ビープ音
    playTestBeep() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.value = 440; // A4

        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.3 * this.musicVolume, this.audioContext.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.5);

        console.log('🔊 テストビープ音再生');
    }

    // シンプルBGMテスト（確実に聞こえるメロディー）
    playSimpleBGM() {
        console.log('🎵 シンプルBGMテスト開始');

        const melody = [440, 493.88, 523.25, 587.33, 659.25]; // A-B-C-D-E
        let noteIndex = 0;
        let isPlaying = true;

        const playNote = () => {
            if (!isPlaying) return; // 停止チェック

            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'triangle';
            osc.frequency.value = melody[noteIndex % melody.length];

            gain.gain.setValueAtTime(0, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.2, this.audioContext.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.05, this.audioContext.currentTime + 0.4);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.start();
            osc.stop(this.audioContext.currentTime + 0.5);

            noteIndex++;

            // 次の音符をスケジュール（3秒で停止）
            if (noteIndex < 6) {
                setTimeout(playNote, 500);
            } else {
                isPlaying = false;
                console.log('🎵 シンプルBGMテスト終了');
            }
        };

        playNote();
        this.currentMusicName = 'simpleBGM';
    }

    playWebAudioMusic(musicName) {
        const { buffer, config } = this.audioBuffers.get(musicName);

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();

        source.buffer = buffer;
        source.loop = config.loop;

        gainNode.gain.value = config.volume * this.musicVolume * this.masterVolume;

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        source.start();

        this.backgroundMusic = { source, gainNode, name: musicName };
    }

    playFallbackMusic(musicName) {
        const audio = this.fallbackAudio.get(musicName);
        if (!audio) return;

        const config = this.soundFiles[musicName];
        audio.volume = config.volume * this.musicVolume * this.masterVolume;
        audio.loop = config.loop;

        audio.play().catch(error => {
            console.warn(`背景音楽再生失敗: ${musicName}`, error);
        });

        this.backgroundMusic = { audio, name: musicName };
    }

    stopBackgroundMusic() {
        if (!this.backgroundMusic) return;

        // 合成音楽の停止
        if (this.useSynthetic && this.synthGenerator) {
            this.synthGenerator.stopBackgroundMusic();
        }

        // 従来の音楽停止
        if (this.backgroundMusic.source) {
            this.backgroundMusic.source.stop();
            this.activeSources.delete(this.backgroundMusic.source);
        } else if (this.backgroundMusic.audio) {
            this.backgroundMusic.audio.pause();
            this.backgroundMusic.audio.currentTime = 0;
        }

        this.backgroundMusic = null;
        this.currentMusicName = null;
    }

    fadeOutBackgroundMusic(duration = 1.0) {
        if (!this.backgroundMusic) return;

        if (this.backgroundMusic.gainNode) {
            const gainNode = this.backgroundMusic.gainNode;
            gainNode.gain.exponentialRampToValueAtTime(
                0.01,
                this.audioContext.currentTime + duration
            );

            setTimeout(() => {
                this.stopBackgroundMusic();
            }, duration * 1000);
        } else if (this.backgroundMusic.audio) {
            // HTML5 Audioのフェードアウト
            const audio = this.backgroundMusic.audio;
            const startVolume = audio.volume;
            const fadeStep = startVolume / (duration * 60); // 60fps想定

            const fadeInterval = setInterval(() => {
                audio.volume = Math.max(0, audio.volume - fadeStep);
                if (audio.volume <= 0) {
                    clearInterval(fadeInterval);
                    this.stopBackgroundMusic();
                }
            }, 1000 / 60);
        }
    }

    // ボリューム制御
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this.updateAllVolumes();
    }

    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.updateAllVolumes();
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.backgroundMusic) {
            const musicName = this.backgroundMusic.name;
            const config = this.soundFiles[musicName];
            const newVolume = config.volume * this.musicVolume * this.masterVolume;

            if (this.backgroundMusic.gainNode) {
                this.backgroundMusic.gainNode.gain.value = newVolume;
            } else if (this.backgroundMusic.audio) {
                this.backgroundMusic.audio.volume = newVolume;
            }
        }
    }

    updateAllVolumes() {
        // 背景音楽のボリューム更新
        if (this.backgroundMusic) {
            const musicName = this.backgroundMusic.name;
            this.setMusicVolume(this.musicVolume);
        }

        // フォールバックオーディオのボリューム更新
        this.fallbackAudio.forEach((audio, name) => {
            const config = this.soundFiles[name];
            if (config.loop) {
                audio.volume = config.volume * this.musicVolume * this.masterVolume;
            } else {
                audio.volume = config.volume * this.sfxVolume * this.masterVolume;
            }
        });
    }

    // ミュート制御
    toggleMute() {
        this.isMuted = !this.isMuted;

        if (this.isMuted) {
            this.stopAllSounds();
        }

        return this.isMuted;
    }

    setMute(muted) {
        this.isMuted = muted;

        if (this.isMuted) {
            this.stopAllSounds();
        }
    }

    // 全音声停止
    stopAllSounds() {
        // 合成音停止
        if (this.synthGenerator) {
            this.synthGenerator.stopAllSounds();
        }

        // アクティブなソースを停止
        this.activeSources.forEach(source => {
            try {
                source.stop();
            } catch (error) {
                // 既に停止している場合のエラーを無視
            }
        });
        this.activeSources.clear();

        // 背景音楽停止
        this.stopBackgroundMusic();

        // フォールバックオーディオ停止
        this.fallbackAudio.forEach(audio => {
            if (!audio.loop) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
    }

    // 設定変更
    enableSFXSounds(enabled) {
        this.enableSFX = enabled;
    }

    enableBackgroundMusic(enabled) {
        this.enableMusic = enabled;
        if (!enabled) {
            this.stopBackgroundMusic();
        }
    }

    // 便利メソッド
    playSpinSound() {
        this.playSFX('spin');
    }

    playReelStopSound() {
        this.playSFX('reelStop');
    }

    // 🧠💊 ドーパミン最大化勝利音再生
    playWinSound(payout) {
        if (payout >= 1000) {
            // ジャックポット: 多段階ドーパミン放出
            this.playSFX('jackpot');

            // 連鎖効果でドーパミン維持
            setTimeout(() => this.playSFX('coinDrop'), 800);
            setTimeout(() => this.playSFX('miracleSpin'), 1200);
            setTimeout(() => this.generateCelebrationChain(), 1500);

        } else if (payout >= 500) {
            // ビッグウィン: 段階的興奮
            this.playSFX('bigWin');
            setTimeout(() => this.playSFX('coinDrop'), 600);
            setTimeout(() => this.generateVictoryEcho(), 1000);

        } else if (payout >= 100) {
            // 中当たり: 満足感演出
            this.playSFX('win');
            setTimeout(() => this.playSFX('coinDrop'), 400);

        } else {
            // 小当たり: 基本快感
            this.playSFX('win');
        }
    }

    // 🎉 祝賀音の連鎖生成
    generateCelebrationChain() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.generateCoinDropSound();
                if (i === 4) {
                    // 最後にキラキラフィニッシュ
                    setTimeout(() => this.generateMiracleSpinSound(), 200);
                }
            }, i * 150);
        }
    }

    // 🔊 勝利エコー効果
    generateVictoryEcho() {
        const echoes = [523, 659, 784]; // C-E-G コード
        echoes.forEach((freq, index) => {
            setTimeout(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();

                osc.type = 'sine';
                osc.frequency.value = freq;

                gain.gain.setValueAtTime(0, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.3 * this.sfxVolume, this.audioContext.currentTime + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.8);

                osc.connect(gain);
                gain.connect(this.audioContext.destination);

                osc.start();
                osc.stop(this.audioContext.currentTime + 0.8);
            }, index * 100);
        });
    }

    playButtonSound() {
        this.playSFX('buttonClick');
    }

    playSkillSound(skillName) {
        switch (skillName) {
            case 'timeFreeze':
                this.playSFX('timeFreeze');
                break;
            case 'futureVision':
                this.playSFX('futureVision');
                break;
            case 'miracleSpin':
                this.playSFX('miracleSpin');
                break;
            default:
                this.playSFX('skillActivate');
        }
    }

    playStageMusic(stage) {
        const musicMap = {
            1: 'bgmStage1',
            2: 'bgmStage2',
            3: 'bgmStage3'
        };

        const musicName = musicMap[stage] || 'bgmStage1';
        this.playBackgroundMusic(musicName);
    }

    // デバッグ・テスト用
    testSound(soundName) {
        console.log(`🎵 テスト再生: ${soundName}`);
        this.playSFX(soundName);
    }

    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isMuted: this.isMuted,
            masterVolume: this.masterVolume,
            sfxVolume: this.sfxVolume,
            musicVolume: this.musicVolume,
            enableSFX: this.enableSFX,
            enableMusic: this.enableMusic,
            backgroundMusic: this.backgroundMusic ? this.backgroundMusic.name : null,
            activeSources: this.activeSources.size,
            loadedSounds: this.audioBuffers.size,
            fallbackSounds: this.fallbackAudio.size
        };
    }

    // リソースクリーンアップ
    dispose() {
        this.stopAllSounds();

        if (this.audioContext) {
            this.audioContext.close();
        }

        this.audioBuffers.clear();
        this.fallbackAudio.clear();
        this.activeSources.clear();

        this.isInitialized = false;
    }
}

export default AudioManager;