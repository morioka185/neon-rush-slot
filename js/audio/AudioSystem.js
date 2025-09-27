/**
 * NEON RUSH - 音響システム
 * Web Audio API を使用した効果音・BGM システム
 */

class AudioSystem {
    constructor() {
        this.isEnabled = true;
        this.volume = 0.7;
        this.bgmVolume = 0.3;
        this.sfxVolume = 0.8;

        // 音源データ（Base64エンコード）
        this.soundData = {
            spin: this.generateToneSequence([220, 330, 440], 0.1),
            stop1: this.generateTone(523, 0.1),  // C5
            stop2: this.generateTone(659, 0.1),  // E5
            stop3: this.generateTone(784, 0.15), // G5
            win: this.generateToneSequence([440, 554, 659, 831], 0.2),
            bigWin: this.generateToneSequence([440, 554, 659, 831, 1047], 0.3),
            coin: this.generateTone(1047, 0.1), // C6
            skill: this.generateToneSequence([880, 1047, 1319], 0.15),
            gameOver: this.generateToneSequence([330, 294, 262], 0.5),
            bgm: this.generateBGMLoop()
        };

        this.audioBuffers = new Map();
        this.bgmSource = null;
        this.isPlaying = false;

        this.initAudioContext();
    }

    async initAudioContext() {
        try {
            // Web Audio API の初期化
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // マスターゲインノード
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = this.volume;

            // BGM用ゲインノード
            this.bgmGain = this.audioContext.createGain();
            this.bgmGain.connect(this.masterGain);
            this.bgmGain.gain.value = this.bgmVolume;

            // SFX用ゲインノード
            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.connect(this.masterGain);
            this.sfxGain.gain.value = this.sfxVolume;

            // 音源データを AudioBuffer に変換
            await this.loadAllSounds();

            console.log('AudioSystem initialized successfully');
        } catch (error) {
            console.warn('AudioSystem initialization failed:', error);
            this.isEnabled = false;
        }
    }

    async loadAllSounds() {
        for (const [name, data] of Object.entries(this.soundData)) {
            try {
                const arrayBuffer = this.base64ToArrayBuffer(data);
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                this.audioBuffers.set(name, audioBuffer);
            } catch (error) {
                console.warn(`Failed to load sound: ${name}`, error);
            }
        }
    }

    // 音生成関数
    generateTone(frequency, duration, volume = 0.3) {
        const sampleRate = 44100;
        const samples = Math.floor(sampleRate * duration);
        const buffer = new ArrayBuffer(44 + samples * 2);
        const view = new DataView(buffer);

        // WAVヘッダー
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + samples * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, samples * 2, true);

        // 音声データ生成
        for (let i = 0; i < samples; i++) {
            const t = i / sampleRate;
            const envelope = Math.max(0, 1 - t / duration); // フェードアウト
            let sample = Math.sin(2 * Math.PI * frequency * t) * volume * envelope;

            // 波形の丸み付け（クリック音削減）
            if (i < 1000) sample *= i / 1000;
            if (i > samples - 1000) sample *= (samples - i) / 1000;

            view.setInt16(44 + i * 2, sample * 32767, true);
        }

        return this.arrayBufferToBase64(buffer);
    }

    generateToneSequence(frequencies, totalDuration) {
        const sampleRate = 44100;
        const totalSamples = Math.floor(sampleRate * totalDuration);
        const buffer = new ArrayBuffer(44 + totalSamples * 2);
        const view = new DataView(buffer);

        // WAVヘッダー（同様の処理）
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + totalSamples * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, totalSamples * 2, true);

        // シーケンス音声データ生成
        const samplesPerTone = Math.floor(totalSamples / frequencies.length);

        for (let i = 0; i < totalSamples; i++) {
            const toneIndex = Math.floor(i / samplesPerTone);
            const frequency = frequencies[Math.min(toneIndex, frequencies.length - 1)];
            const t = i / sampleRate;
            const envelope = Math.sin(Math.PI * (i % samplesPerTone) / samplesPerTone); // エンベロープ

            let sample = Math.sin(2 * Math.PI * frequency * t) * 0.3 * envelope;

            view.setInt16(44 + i * 2, sample * 32767, true);
        }

        return this.arrayBufferToBase64(buffer);
    }

    generateBGMLoop() {
        // ネオンサイバーパンク風のBGMループ
        const sampleRate = 44100;
        const duration = 4; // 4秒ループ
        const samples = Math.floor(sampleRate * duration);
        const buffer = new ArrayBuffer(44 + samples * 2);
        const view = new DataView(buffer);

        // WAVヘッダー
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + samples * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, samples * 2, true);

        // サイバーパンク風BGM生成
        for (let i = 0; i < samples; i++) {
            const t = i / sampleRate;
            const beat = Math.floor(t * 2) % 4; // 4拍子

            // ベース音
            const bassFreq = beat < 2 ? 80 : 60;
            const bass = Math.sin(2 * Math.PI * bassFreq * t) * 0.2;

            // アルペジオ
            const arpeggio = Math.sin(2 * Math.PI * (220 + beat * 55) * t) * 0.1 *
                           Math.max(0, Math.sin(Math.PI * t * 8));

            // パッド
            const pad = (Math.sin(2 * Math.PI * 440 * t) +
                        Math.sin(2 * Math.PI * 554 * t) +
                        Math.sin(2 * Math.PI * 659 * t)) * 0.05;

            let sample = bass + arpeggio + pad;

            // マスターボリューム
            sample *= 0.5;

            view.setInt16(44 + i * 2, sample * 32767, true);
        }

        return this.arrayBufferToBase64(buffer);
    }

    // ユーティリティ関数
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return 'data:audio/wav;base64,' + btoa(binary);
    }

    base64ToArrayBuffer(base64) {
        const binaryString = atob(base64.split(',')[1]);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    // 音響再生メソッド
    playSound(soundName, volume = 1.0) {
        if (!this.isEnabled || !this.audioContext || !this.audioBuffers.has(soundName)) {
            return;
        }

        try {
            // AudioContextの再開（ユーザーインタラクション後）
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const buffer = this.audioBuffers.get(soundName);
            const source = this.audioContext.createBufferSource();
            const gain = this.audioContext.createGain();

            source.buffer = buffer;
            gain.gain.value = volume;

            source.connect(gain);
            gain.connect(this.sfxGain);
            source.start();

            // リソースクリーンアップ
            source.addEventListener('ended', () => {
                source.disconnect();
                gain.disconnect();
            });

        } catch (error) {
            console.warn(`Failed to play sound: ${soundName}`, error);
        }
    }

    startBGM() {
        if (!this.isEnabled || !this.audioContext || this.isPlaying) {
            return;
        }

        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const buffer = this.audioBuffers.get('bgm');
            if (!buffer) return;

            this.bgmSource = this.audioContext.createBufferSource();
            this.bgmSource.buffer = buffer;
            this.bgmSource.loop = true;
            this.bgmSource.connect(this.bgmGain);
            this.bgmSource.start();
            this.isPlaying = true;

            this.bgmSource.addEventListener('ended', () => {
                this.isPlaying = false;
            });

        } catch (error) {
            console.warn('Failed to start BGM:', error);
        }
    }

    stopBGM() {
        if (this.bgmSource && this.isPlaying) {
            try {
                this.bgmSource.stop();
                this.bgmSource.disconnect();
                this.bgmSource = null;
                this.isPlaying = false;
            } catch (error) {
                console.warn('Failed to stop BGM:', error);
            }
        }
    }

    // 音量調整
    setMasterVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    }

    setBGMVolume(volume) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
        if (this.bgmGain) {
            this.bgmGain.gain.value = this.bgmVolume;
        }
    }

    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        if (this.sfxGain) {
            this.sfxGain.gain.value = this.sfxVolume;
        }
    }

    // ON/OFF切り替え
    toggleAudio() {
        this.isEnabled = !this.isEnabled;
        if (!this.isEnabled) {
            this.stopBGM();
        } else if (!this.isPlaying) {
            this.startBGM();
        }
        return this.isEnabled;
    }

    // ゲームイベント用のサウンドメソッド
    onSpinStart() {
        this.playSound('spin');
    }

    onReelStop(reelIndex) {
        const sounds = ['stop1', 'stop2', 'stop3'];
        this.playSound(sounds[reelIndex] || 'stop3');
    }

    onWin(winAmount = 0) {
        if (winAmount > 1000) {
            this.playSound('bigWin');
        } else {
            this.playSound('win');
        }
        this.playSound('coin', 0.5);
    }

    onSkillUsed() {
        this.playSound('skill');
    }

    onGameOver() {
        this.stopBGM();
        this.playSound('gameOver');
    }

    onGameStart() {
        this.startBGM();
    }
}

export { AudioSystem };