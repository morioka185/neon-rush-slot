/**
 * NEON RUSH - Synthesized Audio Generator
 * 脳汁が止まらないBGM・効果音生成システム
 */

export class SynthAudioGenerator {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.masterGain = null;
        this.activeSounds = new Set();
        this.backgroundMusicNodes = null;

        this.init();
    }

    init() {
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        this.masterGain.gain.value = 0.8; // 音量を大幅に上げる
        console.log('SynthAudioGenerator初期化完了 - masterGain:', this.masterGain.gain.value);
    }

    // ==========================================
    // 🎰 スロット効果音生成
    // ==========================================

    // スピン音 - カタカタ音（機械的で短い）
    generateSpinSound(duration = 2.0) {
        const gainNode = this.audioContext.createGain();

        // 短いカタカタ音の連続
        const clickCount = 16; // より多くの短い音
        const clickDuration = 0.05; // より短く
        const clickGap = duration / clickCount;

        for (let i = 0; i < clickCount; i++) {
            const delay = i * clickGap;

            // ノイズベースの短いクリック音
            const bufferSize = this.audioContext.sampleRate * clickDuration;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);

            // 短いホワイトノイズ
            for (let j = 0; j < bufferSize; j++) {
                data[j] = (Math.random() * 2 - 1) * 0.3;
            }

            const source = this.audioContext.createBufferSource();
            const filter = this.audioContext.createBiquadFilter();
            const oscGain = this.audioContext.createGain();

            source.buffer = buffer;

            // 高周波をカットして「カタ」音に
            filter.type = 'lowpass';
            filter.frequency.value = 800;

            oscGain.gain.setValueAtTime(0.1, this.audioContext.currentTime + delay);
            oscGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + delay + clickDuration);

            source.connect(filter);
            filter.connect(oscGain);
            oscGain.connect(gainNode);

            source.start(this.audioContext.currentTime + delay);
        }

        gainNode.connect(this.masterGain);
        return { gainNode };
    }

    // リール停止音 - ガチャン！という満足感のある音
    generateReelStopSound() {
        const duration = 0.3;
        const gainNode = this.audioContext.createGain();

        // 低音のパンチ
        const bassOsc = this.audioContext.createOscillator();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(80, this.audioContext.currentTime);
        bassOsc.frequency.exponentialRampToValueAtTime(40, this.audioContext.currentTime + duration);

        const bassGain = this.audioContext.createGain();
        bassGain.gain.setValueAtTime(0.8, this.audioContext.currentTime);
        bassGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        // 高音のクリック感
        const clickOsc = this.audioContext.createOscillator();
        clickOsc.type = 'square';
        clickOsc.frequency.setValueAtTime(2000, this.audioContext.currentTime);
        clickOsc.frequency.exponentialRampToValueAtTime(500, this.audioContext.currentTime + 0.1);

        const clickGain = this.audioContext.createGain();
        clickGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        clickGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        bassOsc.connect(bassGain);
        clickOsc.connect(clickGain);
        bassGain.connect(gainNode);
        clickGain.connect(gainNode);
        gainNode.connect(this.masterGain);

        bassOsc.start();
        clickOsc.start();
        bassOsc.stop(this.audioContext.currentTime + duration);
        clickOsc.stop(this.audioContext.currentTime + 0.1);

        return { gainNode, oscillators: [bassOsc, clickOsc] };
    }

    // 勝利音 - ドーパミン放出促進音
    generateWinSound(level = 'small') {
        const configs = {
            small: { duration: 1.0, baseFreq: 440, notes: [0, 4, 7], volume: 0.6 },
            big: { duration: 2.0, baseFreq: 523, notes: [0, 4, 7, 12], volume: 0.8 },
            jackpot: { duration: 3.0, baseFreq: 659, notes: [0, 2, 4, 5, 7, 9, 11, 12], volume: 1.0 }
        };

        const config = configs[level] || configs.small;
        const { duration, baseFreq, notes, volume } = config;

        const mainGain = this.audioContext.createGain();
        const reverb = this.createReverb(2.0, 0.3);

        // メロディック勝利音
        notes.forEach((semitone, index) => {
            const delay = index * 0.15;
            const freq = baseFreq * Math.pow(2, semitone / 12);

            // メイン音
            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;

            // ハーモニクス追加
            const harmOsc = this.audioContext.createOscillator();
            harmOsc.type = 'triangle';
            harmOsc.frequency.value = freq * 2;

            const oscGain = this.audioContext.createGain();
            const harmGain = this.audioContext.createGain();

            oscGain.gain.setValueAtTime(0, this.audioContext.currentTime + delay);
            oscGain.gain.exponentialRampToValueAtTime(volume * 0.8, this.audioContext.currentTime + delay + 0.05);
            oscGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + delay + 0.8);

            harmGain.gain.setValueAtTime(0, this.audioContext.currentTime + delay);
            harmGain.gain.exponentialRampToValueAtTime(volume * 0.3, this.audioContext.currentTime + delay + 0.05);
            harmGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + delay + 0.6);

            osc.connect(oscGain);
            harmOsc.connect(harmGain);
            oscGain.connect(reverb);
            harmGain.connect(reverb);

            osc.start(this.audioContext.currentTime + delay);
            harmOsc.start(this.audioContext.currentTime + delay);
            osc.stop(this.audioContext.currentTime + delay + 1.0);
            harmOsc.stop(this.audioContext.currentTime + delay + 0.8);
        });

        // グリッター効果（キラキラ音）
        if (level === 'big' || level === 'jackpot') {
            this.addGlitterEffect(reverb, duration);
        }

        reverb.connect(mainGain);
        mainGain.connect(this.masterGain);

        return { gainNode: mainGain, reverb };
    }

    // キラキラ効果
    addGlitterEffect(destination, duration) {
        const glitterCount = Math.floor(duration * 8);

        for (let i = 0; i < glitterCount; i++) {
            const delay = Math.random() * duration;
            const freq = 1000 + Math.random() * 2000;

            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;

            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0, this.audioContext.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(0.2, this.audioContext.currentTime + delay + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + delay + 0.1);

            osc.connect(gain);
            gain.connect(destination);

            osc.start(this.audioContext.currentTime + delay);
            osc.stop(this.audioContext.currentTime + delay + 0.2);
        }
    }

    // ==========================================
    // 🎵 背景音楽生成
    // ==========================================

    // ステージ別BGM生成
    generateBackgroundMusic(stage = 1) {
        console.log(`🎵 BGM生成開始 - ステージ ${stage}`);
        this.stopBackgroundMusic();

        const configs = {
            1: { bpm: 140, key: 'C', mood: 'upbeat', complexity: 'catchy' },
            2: { bpm: 160, key: 'F', mood: 'intense', complexity: 'driving' },
            3: { bpm: 180, key: 'G', mood: 'euphoric', complexity: 'explosive' }
        };

        const config = configs[stage] || configs[1];
        console.log('BGM設定:', config);
        const result = this.createDynamicBGM(config);
        console.log('BGM生成完了');
        return result;
    }

    // 動的BGM作成
    createDynamicBGM(config) {
        const { bpm, key, mood, complexity } = config;
        const beatDuration = 60 / bpm;

        // メインゲイン
        const mainGain = this.audioContext.createGain();
        mainGain.gain.value = 1.0; // 最大音量に設定
        console.log('BGMメインゲイン設定:', mainGain.gain.value);

        // コンプレッサー（音圧向上）
        const compressor = this.audioContext.createDynamicsCompressor();
        compressor.threshold.value = -20;
        compressor.knee.value = 25;
        compressor.ratio.value = 8;
        compressor.attack.value = 0.001;
        compressor.release.value = 0.1;

        // リバーブ（より大きく華やかに）
        const reverb = this.createReverb(4.0, 0.6);

        // ディストーション用のウェーブシェイパー
        const distortion = this.createDistortion(20);

        // ベースライン
        const bassNodes = this.createBassLine(config, beatDuration);

        // ドラムパターン
        const drumNodes = this.createDrumPattern(config, beatDuration);

        // アルペジオ（不快なので無効化）
        // const arpeggioNodes = this.createArpeggio(config, beatDuration);

        // リード（メロディ）
        const leadNodes = this.createLeadMelody(config, beatDuration);

        // エフェクトチェーン接続
        bassNodes.output.connect(distortion);
        drumNodes.output.connect(compressor);
        // arpeggioNodes.output.connect(reverb); // アルペジオ無効化
        leadNodes.output.connect(reverb);

        distortion.connect(compressor);
        reverb.connect(compressor);
        compressor.connect(mainGain);
        mainGain.connect(this.masterGain);

        this.backgroundMusicNodes = {
            main: mainGain,
            compressor,
            reverb,
            bass: bassNodes,
            drums: drumNodes,
            // arpeggio: arpeggioNodes, // アルペジオ無効化
            lead: leadNodes
        };

        return this.backgroundMusicNodes;
    }

    // ベースライン作成
    createBassLine(config, beatDuration) {
        const bassGain = this.audioContext.createGain();
        bassGain.gain.value = 1.0; // ベース音量を最大に

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200;
        filter.Q.value = 2;

        const baseFreq = this.getKeyFrequency(config.key, 2); // 2オクターブ目
        // よりエキサイティングなベースパターン
        const pattern = [0, 7, 0, 5, 3, 10, 0, 7]; // I-V-I-IV-III-VII-I-V

        let currentTime = this.audioContext.currentTime;
        const loopDuration = beatDuration * pattern.length;

        let isScheduling = true;

        const scheduleLoop = () => {
            if (!isScheduling) return;

            pattern.forEach((semitone, index) => {
                const freq = baseFreq * Math.pow(2, semitone / 12);
                const startTime = currentTime + index * beatDuration;

                const osc = this.audioContext.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.value = freq;

                const gain = this.audioContext.createGain();
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.exponentialRampToValueAtTime(0.8, startTime + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.1, startTime + beatDuration * 0.8);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + beatDuration);

                osc.connect(gain);
                gain.connect(filter);

                osc.start(startTime);
                osc.stop(startTime + beatDuration);
            });

            currentTime += loopDuration;
            setTimeout(scheduleLoop, loopDuration * 1000 - 100); // 少し早めにスケジュール
        };

        scheduleLoop();
        filter.connect(bassGain);

        return { output: bassGain, filter, scheduleLoop, stop: () => { isScheduling = false; } };
    }

    // ドラムパターン作成
    createDrumPattern(config, beatDuration) {
        const drumGain = this.audioContext.createGain();
        drumGain.gain.value = 0.8; // ドラム音量を上げる

        let currentTime = this.audioContext.currentTime;
        const loopDuration = beatDuration * 4; // 4拍子

        const scheduleLoop = () => {
            // キック (強化パターン: 1拍目と3拍目に強め、16分音符も追加)
            this.createKick(currentTime, drumGain, 1.0); // 1拍目
            this.createKick(currentTime + beatDuration * 0.75, drumGain, 0.3); // 16分音符
            this.createKick(currentTime + beatDuration * 2, drumGain, 0.8); // 3拍目

            // ハイハット (16分音符でより細かく)
            for (let beat = 0; beat < 16; beat++) {
                const startTime = currentTime + beat * (beatDuration / 4);
                const volume = beat % 4 === 0 ? 0.4 : (beat % 2 === 0 ? 0.2 : 0.1);
                this.createHiHat(startTime, drumGain, volume);
            }

            // スネア (2, 4拍目 + 装飾)
            this.createSnare(currentTime + beatDuration * 1, drumGain, 1.0);
            this.createSnare(currentTime + beatDuration * 1.75, drumGain, 0.3); // フィル
            this.createSnare(currentTime + beatDuration * 3, drumGain, 1.0);
            this.createSnare(currentTime + beatDuration * 3.5, drumGain, 0.4); // フィル

            currentTime += loopDuration;
            setTimeout(scheduleLoop, loopDuration * 1000 - 50);
        };

        scheduleLoop();

        return { output: drumGain, scheduleLoop };
    }

    // キックドラム
    createKick(startTime, destination, volume = 1.0) {
        const osc = this.audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(60, startTime);
        osc.frequency.exponentialRampToValueAtTime(30, startTime + 0.1);

        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

        osc.connect(gain);
        gain.connect(destination);

        osc.start(startTime);
        osc.stop(startTime + 0.2);
    }

    // スネアドラム
    createSnare(startTime, destination, volume = 1.0) {
        // ノイズベース
        const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.1, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.3;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 200;

        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.8 * volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(destination);

        noise.start(startTime);
    }

    // ハイハット
    createHiHat(startTime, destination, volume = 0.2) {
        const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.05, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * volume;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 8000;

        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.05);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(destination);

        noise.start(startTime);
    }

    // アルペジオ作成
    createArpeggio(config, beatDuration) {
        const arpGain = this.audioContext.createGain();
        arpGain.gain.value = 0.3;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2000;
        filter.Q.value = 1;

        const baseFreq = this.getKeyFrequency(config.key, 4);
        const chord = [0, 4, 7, 12]; // メジャーコード + オクターブ

        let currentTime = this.audioContext.currentTime;
        const noteDuration = beatDuration / 4; // 16分音符

        const scheduleLoop = () => {
            chord.forEach((semitone, index) => {
                const freq = baseFreq * Math.pow(2, semitone / 12);
                const startTime = currentTime + index * noteDuration;

                const osc = this.audioContext.createOscillator();
                osc.type = 'triangle';
                osc.frequency.value = freq;

                const gain = this.audioContext.createGain();
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.exponentialRampToValueAtTime(0.4, startTime + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration);

                osc.connect(gain);
                gain.connect(filter);

                osc.start(startTime);
                osc.stop(startTime + noteDuration);
            });

            currentTime += beatDuration;
            setTimeout(scheduleLoop, beatDuration * 1000 - 10);
        };

        scheduleLoop();
        filter.connect(arpGain);

        return { output: arpGain, filter, scheduleLoop };
    }

    // リードメロディ作成
    createLeadMelody(config, beatDuration) {
        const leadGain = this.audioContext.createGain();
        leadGain.gain.value = 0.4;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 3000;
        filter.Q.value = 3;

        const baseFreq = this.getKeyFrequency(config.key, 5);
        // スロットゲームに適したキャッチーなメロディー
        const melodyPattern = [0, 4, 7, 12, 9, 7, 4, 0, 2, 5, 9, 12, 7, 4, 2, 0]; // より複雑でエキサイティング

        let currentTime = this.audioContext.currentTime;
        let currentNote = 0;

        const scheduleLoop = () => {
            const semitone = melodyPattern[currentNote % melodyPattern.length];
            const freq = baseFreq * Math.pow(2, semitone / 12);
            const startTime = currentTime;
            const duration = beatDuration * (Math.random() < 0.3 ? 2 : 1); // たまに長い音符

            // デュアルオシレーターでより豊かな音色
            const osc1 = this.audioContext.createOscillator();
            const osc2 = this.audioContext.createOscillator();
            osc1.type = 'sawtooth';
            osc2.type = 'square';
            osc1.frequency.value = freq;
            osc2.frequency.value = freq * 1.005; // わずかにデチューンしてコーラス効果

            // ビブラート追加
            const vibrato = this.audioContext.createOscillator();
            vibrato.type = 'sine';
            vibrato.frequency.value = 6; // 6Hz振動

            const vibratoGain = this.audioContext.createGain();
            vibratoGain.gain.value = 5;

            vibrato.connect(vibratoGain);
            vibratoGain.connect(osc1.frequency);
            vibratoGain.connect(osc2.frequency);

            const gain1 = this.audioContext.createGain();
            const gain2 = this.audioContext.createGain();
            const mixGain = this.audioContext.createGain();

            gain1.gain.setValueAtTime(0, startTime);
            gain1.gain.exponentialRampToValueAtTime(0.4, startTime + 0.1);
            gain1.gain.exponentialRampToValueAtTime(0.3, startTime + duration * 0.7);
            gain1.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

            gain2.gain.setValueAtTime(0, startTime);
            gain2.gain.exponentialRampToValueAtTime(0.2, startTime + 0.1);
            gain2.gain.exponentialRampToValueAtTime(0.1, startTime + duration * 0.7);
            gain2.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

            osc1.connect(gain1);
            osc2.connect(gain2);
            gain1.connect(mixGain);
            gain2.connect(mixGain);
            mixGain.connect(filter);

            osc1.start(startTime);
            osc2.start(startTime);
            vibrato.start(startTime);
            osc1.stop(startTime + duration);
            osc2.stop(startTime + duration);
            vibrato.stop(startTime + duration);

            currentNote++;
            currentTime += beatDuration;
            setTimeout(scheduleLoop, beatDuration * 1000 - 20);
        };

        scheduleLoop();
        filter.connect(leadGain);

        return { output: leadGain, filter, scheduleLoop };
    }

    // ==========================================
    // ユーティリティ関数
    // ==========================================

    // リバーブ作成
    createReverb(duration = 2, decay = 0.2) {
        const convolver = this.audioContext.createConvolver();
        const length = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const data = buffer.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
            }
        }

        convolver.buffer = buffer;
        return convolver;
    }

    // ディストーション作成
    createDistortion(amount = 20) {
        const waveshaper = this.audioContext.createWaveShaper();
        const samples = 44100;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;

        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
        }

        waveshaper.curve = curve;
        waveshaper.oversample = '4x';
        return waveshaper;
    }

    // キー周波数取得
    getKeyFrequency(key, octave = 4) {
        const keyMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
            'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
        };

        const semitones = keyMap[key] || 0;
        const noteNumber = (octave * 12) + semitones;
        return 440 * Math.pow(2, (noteNumber - 69) / 12); // A4 = 440Hz
    }

    // 背景音楽停止
    stopBackgroundMusic() {
        if (this.backgroundMusicNodes) {
            try {
                // 全ノードを段階的にフェードアウト
                const fadeTime = 0.5;
                if (this.backgroundMusicNodes.main) {
                    this.backgroundMusicNodes.main.gain.exponentialRampToValueAtTime(
                        0.01,
                        this.audioContext.currentTime + fadeTime
                    );
                }

                setTimeout(() => {
                    if (this.backgroundMusicNodes && this.backgroundMusicNodes.main) {
                        this.backgroundMusicNodes.main.disconnect();
                        this.backgroundMusicNodes = null;
                    }
                }, fadeTime * 1000 + 100);

            } catch (error) {
                console.warn('Background music stop error:', error);
                this.backgroundMusicNodes = null;
            }
        }
    }

    // 音量設定
    setVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.exponentialRampToValueAtTime(
                Math.max(0.01, volume * 0.3),
                this.audioContext.currentTime + 0.1
            );
        }
    }

    // 全音停止
    stopAllSounds() {
        this.stopBackgroundMusic();
        this.activeSounds.forEach(sound => {
            try {
                if (sound.gainNode) {
                    sound.gainNode.gain.exponentialRampToValueAtTime(
                        0.01,
                        this.audioContext.currentTime + 0.1
                    );
                }
            } catch (error) {
                console.warn('Stop sound error:', error);
            }
        });
        this.activeSounds.clear();
    }
}

export default SynthAudioGenerator;