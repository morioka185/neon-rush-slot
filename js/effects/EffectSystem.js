/**
 * EffectSystem - 画面振動・グリッチ・期待演出を管理
 */
export class EffectSystem {
    constructor(audioManager = null) {
        this.audioManager = audioManager;
        this.isShaking = false;
        this.isGlitching = false;
        this.anticipationLevel = 0; // 0-100の期待レベル
        this.activeEffects = new Set();

        // エフェクト設定
        this.config = {
            shake: {
                intensity: {
                    light: 2,
                    medium: 5,
                    heavy: 10
                },
                duration: {
                    short: 200,
                    medium: 500,
                    long: 1000
                }
            },
            glitch: {
                intensity: {
                    subtle: 0.3,
                    medium: 0.6,
                    strong: 1.0
                },
                frequency: {
                    low: 100,
                    medium: 50,
                    high: 20
                }
            },
            anticipation: {
                colors: {
                    low: '#ffff00',      // 黄色
                    medium: '#ff8c00',   // オレンジ
                    high: '#ff0000'      // 赤
                }
            }
        };

        this.init();
    }

    init() {
        this.createShakeContainer();
        this.addGlitchStyles();
        this.addAnticipationStyles();
    }

    createShakeContainer() {
        const gameContainer = document.getElementById('gameContainer');
        if (!gameContainer.classList.contains('shake-container')) {
            gameContainer.classList.add('shake-container');
        }
    }

    addGlitchStyles() {
        if (document.getElementById('glitch-styles')) return;

        const style = document.createElement('style');
        style.id = 'glitch-styles';
        style.textContent = `
            .glitch-container {
                position: relative;
                overflow: hidden;
            }

            .glitch-active::before,
            .glitch-active::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: inherit;
                pointer-events: none;
                z-index: 1;
            }

            .glitch-active::before {
                animation: glitch-1 var(--glitch-duration, 0.3s) infinite;
                background: linear-gradient(90deg, transparent 0%, rgba(255, 0, 0, 0.1) 50%, transparent 100%);
            }

            .glitch-active::after {
                animation: glitch-2 var(--glitch-duration, 0.3s) infinite;
                background: linear-gradient(90deg, transparent 0%, rgba(0, 255, 255, 0.1) 50%, transparent 100%);
            }

            @keyframes glitch-1 {
                0%, 100% { transform: translateX(0); opacity: 0; }
                10% { transform: translateX(-2px); opacity: 1; }
                20% { transform: translateX(2px); opacity: 0.8; }
                30% { transform: translateX(-1px); opacity: 0.6; }
                40% { transform: translateX(1px); opacity: 0.4; }
                50% { transform: translateX(0); opacity: 0; }
            }

            @keyframes glitch-2 {
                0%, 100% { transform: translateY(0); opacity: 0; }
                15% { transform: translateY(-1px); opacity: 0.8; }
                25% { transform: translateY(1px); opacity: 1; }
                35% { transform: translateY(-2px); opacity: 0.6; }
                45% { transform: translateY(2px); opacity: 0.4; }
                55% { transform: translateY(0); opacity: 0; }
            }

            .glitch-text {
                position: relative;
            }

            .glitch-text.active::before {
                content: attr(data-text);
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: transparent;
                clip: rect(0, 900px, 0, 0);
                animation: glitch-text-1 0.2s infinite;
                color: #ff0000;
                text-shadow: -1px 0 #ff0000;
            }

            .glitch-text.active::after {
                content: attr(data-text);
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: transparent;
                clip: rect(0, 900px, 0, 0);
                animation: glitch-text-2 0.2s infinite;
                color: #00ffff;
                text-shadow: 1px 0 #00ffff;
            }

            @keyframes glitch-text-1 {
                0% { clip: rect(42px, 9999px, 44px, 0); }
                25% { clip: rect(12px, 9999px, 28px, 0); }
                50% { clip: rect(85px, 9999px, 90px, 0); }
                75% { clip: rect(65px, 9999px, 70px, 0); }
                100% { clip: rect(25px, 9999px, 30px, 0); }
            }

            @keyframes glitch-text-2 {
                0% { clip: rect(65px, 9999px, 70px, 0); }
                25% { clip: rect(85px, 9999px, 90px, 0); }
                50% { clip: rect(25px, 9999px, 30px, 0); }
                75% { clip: rect(42px, 9999px, 44px, 0); }
                100% { clip: rect(12px, 9999px, 28px, 0); }
            }

            .shake-container.shaking {
                animation: var(--shake-animation, shake-medium 0.5s ease-in-out);
            }

            @keyframes shake-light {
                0%, 100% { transform: translateX(0); }
                10% { transform: translateX(-2px) translateY(-1px); }
                20% { transform: translateX(2px) translateY(1px); }
                30% { transform: translateX(-1px) translateY(-2px); }
                40% { transform: translateX(1px) translateY(2px); }
                50% { transform: translateX(-2px) translateY(1px); }
                60% { transform: translateX(2px) translateY(-1px); }
                70% { transform: translateX(-1px) translateY(2px); }
                80% { transform: translateX(1px) translateY(-2px); }
                90% { transform: translateX(-2px) translateY(-1px); }
            }

            @keyframes shake-medium {
                0%, 100% { transform: translateX(0); }
                10% { transform: translateX(-5px) translateY(-3px); }
                20% { transform: translateX(5px) translateY(3px); }
                30% { transform: translateX(-3px) translateY(-5px); }
                40% { transform: translateX(3px) translateY(5px); }
                50% { transform: translateX(-5px) translateY(3px); }
                60% { transform: translateX(5px) translateY(-3px); }
                70% { transform: translateX(-3px) translateY(5px); }
                80% { transform: translateX(3px) translateY(-5px); }
                90% { transform: translateX(-5px) translateY(-3px); }
            }

            @keyframes shake-heavy {
                0%, 100% { transform: translateX(0); }
                10% { transform: translateX(-10px) translateY(-5px) rotate(1deg); }
                20% { transform: translateX(10px) translateY(5px) rotate(-1deg); }
                30% { transform: translateX(-5px) translateY(-10px) rotate(1deg); }
                40% { transform: translateX(5px) translateY(10px) rotate(-1deg); }
                50% { transform: translateX(-10px) translateY(5px) rotate(1deg); }
                60% { transform: translateX(10px) translateY(-5px) rotate(-1deg); }
                70% { transform: translateX(-5px) translateY(10px) rotate(1deg); }
                80% { transform: translateX(5px) translateY(-10px) rotate(-1deg); }
                90% { transform: translateX(-10px) translateY(-5px) rotate(1deg); }
            }

            .anticipation-glow {
                position: relative;
                transition: all 0.3s ease;
            }

            .anticipation-glow::before {
                content: '';
                position: absolute;
                top: -5px;
                left: -5px;
                right: -5px;
                bottom: -5px;
                background: var(--anticipation-color, #ffff00);
                border-radius: inherit;
                opacity: 0;
                filter: blur(10px);
                z-index: -1;
                transition: opacity 0.3s ease;
            }

            .anticipation-glow.active::before {
                opacity: var(--anticipation-intensity, 0.3);
                animation: anticipation-pulse 1s ease-in-out infinite alternate;
            }

            @keyframes anticipation-pulse {
                0% {
                    opacity: var(--anticipation-intensity, 0.3);
                    transform: scale(1);
                }
                100% {
                    opacity: calc(var(--anticipation-intensity, 0.3) * 1.5);
                    transform: scale(1.02);
                }
            }
        `;
        document.head.appendChild(style);
    }

    addAnticipationStyles() {
        // 既にaddGlitchStylesで追加済み
    }

    // 画面振動エフェクト
    shake(intensity = 'medium', duration = 'medium') {
        if (this.isShaking) return Promise.resolve();

        this.isShaking = true;
        this.activeEffects.add('shake');

        const gameContainer = document.getElementById('gameContainer');
        const intensityValue = this.config.shake.intensity[intensity] || this.config.shake.intensity.medium;
        const durationValue = this.config.shake.duration[duration] || this.config.shake.duration.medium;

        gameContainer.style.setProperty('--shake-animation', `shake-${intensity} ${durationValue}ms ease-in-out`);
        gameContainer.classList.add('shaking');

        // ハプティックフィードバック
        this.triggerHapticFeedback(intensity);

        // オーディオエフェクト
        if (this.audioManager) {
            this.audioManager.playSFX('impact');
        }

        return new Promise(resolve => {
            setTimeout(() => {
                gameContainer.classList.remove('shaking');
                this.isShaking = false;
                this.activeEffects.delete('shake');
                resolve();
            }, durationValue);
        });
    }

    // グリッチエフェクト
    glitch(element, intensity = 'medium', duration = 300) {
        if (!element) return Promise.resolve();

        const effectId = `glitch-${Date.now()}`;
        this.activeEffects.add(effectId);

        const glitchDuration = this.config.glitch.frequency[intensity] || this.config.glitch.frequency.medium;

        element.style.setProperty('--glitch-duration', `${glitchDuration}ms`);
        element.classList.add('glitch-container', 'glitch-active');

        // テキストグリッチの場合
        if (element.textContent) {
            element.classList.add('glitch-text', 'active');
            element.dataset.text = element.textContent;
        }

        return new Promise(resolve => {
            setTimeout(() => {
                element.classList.remove('glitch-active', 'glitch-text', 'active');
                this.activeEffects.delete(effectId);
                resolve();
            }, duration);
        });
    }

    // 期待演出（リーチ時など）
    showAnticipation(level = 50, elements = null) {
        this.anticipationLevel = Math.max(0, Math.min(100, level));

        const targetElements = elements || document.querySelectorAll('.slot-grid, .spin-btn');
        const color = this.getAnticipationColor(this.anticipationLevel);
        const intensity = this.anticipationLevel / 100;

        targetElements.forEach(element => {
            element.classList.add('anticipation-glow', 'active');
            element.style.setProperty('--anticipation-color', color);
            element.style.setProperty('--anticipation-intensity', intensity);
        });

        // レベルに応じたエフェクト
        if (this.anticipationLevel > 70) {
            // 高期待度：画面振動
            this.shake('light', 'short');
        }

        if (this.anticipationLevel > 85) {
            // 超高期待度：グリッチ追加
            const slotGrid = document.getElementById('slot-grid');
            if (slotGrid) {
                this.glitch(slotGrid, 'subtle', 200);
            }
        }

        // オーディオエフェクト
        if (this.audioManager) {
            if (this.anticipationLevel > 80) {
                this.audioManager.playSFX('anticipationHigh');
            } else if (this.anticipationLevel > 50) {
                this.audioManager.playSFX('anticipationMedium');
            } else {
                this.audioManager.playSFX('anticipationLow');
            }
        }
    }

    // 期待演出終了
    hideAnticipation() {
        this.anticipationLevel = 0;

        const elements = document.querySelectorAll('.anticipation-glow');
        elements.forEach(element => {
            element.classList.remove('anticipation-glow', 'active');
            element.style.removeProperty('--anticipation-color');
            element.style.removeProperty('--anticipation-intensity');
        });
    }

    // 勝利時の大演出
    celebrateWin(winLevel = 'normal') {
        const effects = {
            normal: () => {
                this.shake('medium', 'medium');
                const slotGrid = document.getElementById('slot-grid');
                if (slotGrid) this.glitch(slotGrid, 'medium', 500);
            },
            big: () => {
                this.shake('heavy', 'long');
                const gameContainer = document.getElementById('gameContainer');
                if (gameContainer) this.glitch(gameContainer, 'strong', 800);
                this.showAnticipation(100);
                setTimeout(() => this.hideAnticipation(), 2000);
            },
            jackpot: () => {
                // 連続エフェクト
                this.shake('heavy', 'long');
                setTimeout(() => this.shake('medium', 'medium'), 600);
                setTimeout(() => this.shake('light', 'short'), 1200);

                const gameContainer = document.getElementById('gameContainer');
                if (gameContainer) {
                    this.glitch(gameContainer, 'strong', 1000);
                    setTimeout(() => this.glitch(gameContainer, 'medium', 500), 1200);
                }

                this.showAnticipation(100);
                setTimeout(() => this.hideAnticipation(), 3000);
            }
        };

        const effect = effects[winLevel] || effects.normal;
        effect();
    }

    // リーチ判定とエフェクト
    checkAndShowReach(reels) {
        const reachPatterns = this.detectReachPatterns(reels);

        if (reachPatterns.length > 0) {
            const maxReachLevel = Math.max(...reachPatterns.map(p => p.level));
            this.showReachEffect(maxReachLevel);
            return true;
        }

        return false;
    }

    detectReachPatterns(reels) {
        const patterns = [];

        // 横ライン
        for (let row = 0; row < 3; row++) {
            const line = [reels[0][row], reels[1][row], reels[2][row]];
            const reach = this.checkLineForReach(line);
            if (reach) patterns.push({ type: 'horizontal', row, level: reach.level });
        }

        // 縦ライン
        for (let col = 0; col < 3; col++) {
            const line = [reels[col][0], reels[col][1], reels[col][2]];
            const reach = this.checkLineForReach(line);
            if (reach) patterns.push({ type: 'vertical', col, level: reach.level });
        }

        // 斜めライン
        const diagonal1 = [reels[0][0], reels[1][1], reels[2][2]];
        const diagonal2 = [reels[0][2], reels[1][1], reels[2][0]];

        const reach1 = this.checkLineForReach(diagonal1);
        const reach2 = this.checkLineForReach(diagonal2);

        if (reach1) patterns.push({ type: 'diagonal', dir: 'down', level: reach1.level });
        if (reach2) patterns.push({ type: 'diagonal', dir: 'up', level: reach2.level });

        return patterns;
    }

    checkLineForReach(line) {
        // 2つ同じシンボルがあるかチェック
        const symbolCounts = {};
        line.forEach(symbol => {
            if (symbol && symbol.name !== 'empty') {
                symbolCounts[symbol.name] = (symbolCounts[symbol.name] || 0) + 1;
            }
        });

        for (const [symbolName, count] of Object.entries(symbolCounts)) {
            if (count === 2) {
                // リーチ状態
                const symbol = line.find(s => s.name === symbolName);
                const level = this.getReachLevel(symbol);
                return { symbol: symbolName, level };
            }
        }

        return null;
    }

    getReachLevel(symbol) {
        if (!symbol || !symbol.payout) return 0;

        // 配当に応じてリーチレベルを決定
        if (symbol.payout >= 200) return 90; // 高配当
        if (symbol.payout >= 100) return 70; // 中配当
        if (symbol.payout >= 50) return 50;  // 低配当
        return 30; // その他
    }

    showReachEffect(level) {
        this.showAnticipation(level);

        // レベルに応じた特別エフェクト
        if (level > 80) {
            this.shake('medium', 'short');
        }

        // リーチ時のオーディオ
        if (this.audioManager) {
            this.audioManager.playSFX('reach');
        }
    }

    // ユーティリティメソッド
    getAnticipationColor(level) {
        if (level > 70) return this.config.anticipation.colors.high;
        if (level > 40) return this.config.anticipation.colors.medium;
        return this.config.anticipation.colors.low;
    }

    triggerHapticFeedback(intensity) {
        if (!navigator.vibrate) return;

        try {
            const patterns = {
                light: [50],
                medium: [100],
                heavy: [200]
            };
            navigator.vibrate(patterns[intensity] || patterns.medium);
        } catch (error) {
            // ハプティックフィードバックは必須ではないため、エラーは無視
        }
    }

    // エフェクトリセット
    reset() {
        this.isShaking = false;
        this.isGlitching = false;
        this.anticipationLevel = 0;
        this.activeEffects.clear();

        // すべてのエフェクトクラスを削除
        document.querySelectorAll('.shaking, .glitch-active, .anticipation-glow').forEach(element => {
            element.classList.remove('shaking', 'glitch-active', 'glitch-text', 'active', 'anticipation-glow');
        });
    }

    // 現在のエフェクト状態を取得
    getStatus() {
        return {
            isShaking: this.isShaking,
            isGlitching: this.isGlitching,
            anticipationLevel: this.anticipationLevel,
            activeEffects: Array.from(this.activeEffects)
        };
    }
}

export default EffectSystem;