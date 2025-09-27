/**
 * SlotEffects - 高効果演出システム
 * Claude Code実装しやすい効果的演出に特化
 */
export class SlotEffects {
    constructor(gameContainer, audioManager = null) {
        this.gameContainer = gameContainer || document.body;
        this.audioManager = audioManager;
        this.isPlaying = false;
        this.effectLevel = 1.0; // 演出強度 (0.0-1.0)

        // 演出設定
        this.settings = {
            enableFlash: true,
            enableShake: true,
            enableParticles: true,
            enableSound: true,
            effectIntensity: 1.0
        };

        this.init();
    }

    init() {
        this.createOverlaySystem();
        this.addEffectStyles();
    }

    // 💡 画面フラッシュ系演出（最高効果＆簡単実装）

    // 基本フラッシュ
    async screenFlash(color = '#ffffff', duration = 300, intensity = 1.0) {
        if (!this.settings.enableFlash) return;

        const overlay = this.createFlashOverlay();
        overlay.style.backgroundColor = color;
        overlay.style.opacity = intensity * this.settings.effectIntensity;

        this.gameContainer.appendChild(overlay);

        // フラッシュイン
        overlay.style.transition = 'opacity 50ms ease-out';
        overlay.style.opacity = intensity * this.settings.effectIntensity;

        return new Promise(resolve => {
            setTimeout(() => {
                // フラッシュアウト
                overlay.style.transition = `opacity ${duration}ms ease-out`;
                overlay.style.opacity = '0';

                setTimeout(() => {
                    if (overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                    resolve();
                }, duration);
            }, 50);
        });
    }

    // 段階的カラーフラッシュ（白→黄→赤→虹）
    async progressiveColorFlash(expectationLevel = 50) {
        const stages = [
            { color: '#ffffff', duration: 200, threshold: 20 },
            { color: '#ffff00', duration: 300, threshold: 40 },
            { color: '#ff4444', duration: 400, threshold: 70 },
            { color: 'linear-gradient(45deg, #ff0000, #ff8800, #ffff00, #00ff00, #0088ff, #4400ff, #ff00ff)', duration: 600, threshold: 90 }
        ];

        for (const stage of stages) {
            if (expectationLevel >= stage.threshold) {
                if (stage.color.includes('gradient')) {
                    await this.rainbowFlash(stage.duration);
                } else {
                    await this.screenFlash(stage.color, stage.duration, 0.8);
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
    }

    // 虹色フラッシュ
    async rainbowFlash(duration = 600) {
        const overlay = this.createFlashOverlay();
        overlay.style.background = 'linear-gradient(45deg, #ff0000, #ff8800, #ffff00, #00ff00, #0088ff, #4400ff, #ff00ff)';
        overlay.style.backgroundSize = '400% 400%';
        overlay.style.animation = `rainbow-flash ${duration}ms ease-in-out`;

        this.gameContainer.appendChild(overlay);

        return new Promise(resolve => {
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
                resolve();
            }, duration);
        });
    }

    // コントラストフラッシュ（暗転→爆発光）
    async contrastFlash() {
        // 暗転
        await this.screenFlash('#000000', 500, 0.9);
        await new Promise(resolve => setTimeout(resolve, 200));

        // 爆発光
        await this.screenFlash('#ffffff', 800, 1.0);
        await this.screenFlash('#ffff00', 400, 0.7);
    }

    // パルスフラッシュ（鼓動的）
    async pulseFlash(count = 3, baseColor = '#ff4444') {
        for (let i = 0; i < count; i++) {
            const intensity = 0.3 + (i / count) * 0.5; // 徐々に強く
            await this.screenFlash(baseColor, 200, intensity);
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }

    // ⚡ 画面震動＆変形演出

    // 基本画面震動
    async screenShake(intensity = 'medium', duration = 500) {
        if (!this.settings.enableShake) return;

        const intensities = {
            light: 3,
            medium: 8,
            heavy: 15,
            extreme: 25
        };

        const shakeAmount = intensities[intensity] || intensities.medium;
        const originalTransform = this.gameContainer.style.transform;

        let startTime = Date.now();
        const shakeInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress >= 1) {
                clearInterval(shakeInterval);
                this.gameContainer.style.transform = originalTransform;
                return;
            }

            const currentIntensity = shakeAmount * (1 - progress); // 減衰
            const x = (Math.random() - 0.5) * currentIntensity;
            const y = (Math.random() - 0.5) * currentIntensity;
            const rotation = (Math.random() - 0.5) * currentIntensity * 0.1;

            this.gameContainer.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
        }, 16); // 60fps

        return new Promise(resolve => {
            setTimeout(() => {
                clearInterval(shakeInterval);
                this.gameContainer.style.transform = originalTransform;
                resolve();
            }, duration);
        });
    }

    // ブラー&フォーカス演出
    async blurFocusEffect(duration = 1000) {
        const originalFilter = this.gameContainer.style.filter;

        // ブラー適用
        this.gameContainer.style.transition = 'filter 200ms ease-out';
        this.gameContainer.style.filter = 'blur(5px) brightness(0.7)';

        return new Promise(resolve => {
            setTimeout(() => {
                // フォーカス復帰
                this.gameContainer.style.transition = `filter ${duration - 200}ms ease-out`;
                this.gameContainer.style.filter = 'blur(0px) brightness(1.2)';

                setTimeout(() => {
                    this.gameContainer.style.filter = originalFilter;
                    this.gameContainer.style.transition = '';
                    resolve();
                }, duration - 200);
            }, 200);
        });
    }

    // 🎊 パーティクル強化演出

    // 改良型爆発パーティクル
    async explosionParticles(x = '50%', y = '50%', count = 30, type = 'star') {
        if (!this.settings.enableParticles) return;

        const particles = [];
        const colors = ['#ffd700', '#ffeb3b', '#ff8f00', '#ff5722', '#e91e63'];
        const symbols = {
            star: '⭐',
            coin: '🪙',
            diamond: '💎',
            fire: '🔥',
            sparkle: '✨',
            // 🧠 脳汁専用パーティクル
            jackpot: ['💎', '🎰', '💰', '⭐', '🌟', '✨', '🎉', '🎊'],
            bigwin: ['🎉', '🎊', '💰', '⭐', '✨'],
            // 統合されたパーティクルタイプ
            spiral: '🌪️',
            colorful: ['🔴', '🟡', '🟢', '🔵', '🟣']
        };

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');

            // パーティクル選択ロジック
            let particleSymbol;
            if (Array.isArray(symbols[type])) {
                particleSymbol = symbols[type][Math.floor(Math.random() * symbols[type].length)];
            } else {
                particleSymbol = symbols[type] || symbols.star;
            }
            particle.innerHTML = particleSymbol;

            const angle = (i / count) * Math.PI * 2;
            const velocity = 3 + Math.random() * 4;
            let distance = 50 + Math.random() * 150;

            // タイプ別アニメーション選択
            let animationName = 'explosion-particle-enhanced';
            let animationDuration = 1 + Math.random() * 0.5;

            if (type === 'jackpot') {
                animationName = 'brain-juice-mega-explosion';
                animationDuration = 2 + Math.random();
                distance = 100 + Math.random() * 200;
            } else if (type === 'bigwin') {
                animationName = 'brain-juice-win-explosion';
                animationDuration = 1.5 + Math.random();
                distance = 80 + Math.random() * 120;
            } else if (type === 'spiral') {
                animationName = 'spiraling-motion';
                animationDuration = 1.5 + Math.random();
            } else if (type === 'colorful') {
                animationName = 'colorful-float';
                animationDuration = 1 + Math.random();
            }

            particle.style.cssText = `
                position: absolute;
                left: ${x};
                top: ${y};
                font-size: ${0.8 + Math.random() * 1.2}rem;
                color: ${colors[Math.floor(Math.random() * colors.length)]};
                z-index: 200;
                pointer-events: none;
                animation: ${animationName} ${animationDuration}s ease-out forwards;
                --angle: ${angle}rad;
                --distance: ${distance}px;
                --velocity: ${velocity};
            `;

            this.gameContainer.appendChild(particle);
            particles.push(particle);

            // パーティクル削除
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1500);
        }

        return new Promise(resolve => setTimeout(resolve, 1500));
    }

    // コイン雨演出
    async coinRain(duration = 2000, intensity = 'medium') {
        if (!this.settings.enableParticles) return;

        const intensities = { light: 5, medium: 10, heavy: 20 };
        const coinsPerSecond = intensities[intensity] || intensities.medium;

        const startTime = Date.now();
        const coinInterval = setInterval(() => {
            if (Date.now() - startTime > duration) {
                clearInterval(coinInterval);
                return;
            }

            const coin = document.createElement('div');
            coin.innerHTML = '🪙';
            coin.style.cssText = `
                position: absolute;
                left: ${Math.random() * 100}%;
                top: -50px;
                font-size: ${1 + Math.random() * 0.5}rem;
                z-index: 150;
                animation: coin-fall ${2 + Math.random()}s linear forwards;
                transform: rotate(${Math.random() * 360}deg);
            `;

            this.gameContainer.appendChild(coin);

            setTimeout(() => {
                if (coin.parentNode) {
                    coin.parentNode.removeChild(coin);
                }
            }, 3000);
        }, 1000 / coinsPerSecond);

        return new Promise(resolve => setTimeout(resolve, duration));
    }

    // ✨ 複合演出（最強コンボ）

    // 最強コンボ演出
    async ultimateCombo() {
        console.log('🎰 最強コンボ演出開始！');

        // 1. 無音期間（緊張感）
        if (this.audioManager) {
            this.audioManager.stopAllSounds();
        }
        await new Promise(resolve => setTimeout(resolve, 500));

        // 2. 鼓動音 + 暗転
        if (this.audioManager) {
            this.audioManager.playSFX('anticipationHigh');
        }
        await this.screenFlash('#000000', 800, 0.8);

        // 3. パルスフラッシュ（段階的）
        await this.pulseFlash(3, '#ff4444');

        // 4. 画面集中エフェクト
        await this.blurFocusEffect(1000);

        // 5. 爆発演出
        await Promise.all([
            this.contrastFlash(),
            this.screenShake('extreme', 1000),
            this.explosionParticles('50%', '50%', 40, 'star')
        ]);

        // 6. 虹フラッシュフィナーレ
        await this.rainbowFlash(1000);

        // 7. コイン雨
        this.coinRain(3000, 'heavy');

        console.log('🎉 最強コンボ演出完了！');
    }

    // ビッグウィンコンボ
    async bigWinCombo() {
        await Promise.all([
            this.progressiveColorFlash(80),
            this.screenShake('heavy', 800),
            this.explosionParticles('50%', '50%', 25, 'diamond')
        ]);
    }

    // スモールウィンコンボ
    async smallWinCombo() {
        await Promise.all([
            this.screenFlash('#ffff00', 400, 0.6),
            this.screenShake('light', 300),
            this.explosionParticles('50%', '50%', 12, 'sparkle')
        ]);
    }

    // 🛠️ ユーティリティ関数

    createFlashOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'flash-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            opacity: 0;
        `;
        return overlay;
    }

    createOverlaySystem() {
        if (document.getElementById('effect-overlay-system')) return;

        const overlaySystem = document.createElement('div');
        overlaySystem.id = 'effect-overlay-system';
        overlaySystem.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9000;
        `;
        document.body.appendChild(overlaySystem);
    }

    addEffectStyles() {
        if (document.getElementById('slot-effects-styles')) return;

        const style = document.createElement('style');
        style.id = 'slot-effects-styles';
        style.textContent = `
            @keyframes rainbow-flash {
                0% { background-position: 0% 50%; opacity: 0.8; }
                50% { background-position: 100% 50%; opacity: 1; }
                100% { background-position: 0% 50%; opacity: 0; }
            }

            @keyframes explosion-particle-enhanced {
                0% {
                    transform: translate(-50%, -50%) scale(1) rotate(0deg);
                    opacity: 1;
                }
                100% {
                    transform: translate(-50%, -50%)
                               translate(calc(cos(var(--angle)) * var(--distance) * var(--velocity)),
                                        calc(sin(var(--angle)) * var(--distance) * var(--velocity)))
                               scale(0.3) rotate(720deg);
                    opacity: 0;
                }
            }

            @keyframes coin-fall {
                0% {
                    transform: translateY(-50px) rotate(0deg);
                    opacity: 1;
                }
                100% {
                    transform: translateY(calc(100vh + 50px)) rotate(1080deg);
                    opacity: 0.8;
                }
            }

            .flash-overlay {
                mix-blend-mode: screen;
            }
        `;
        document.head.appendChild(style);
    }

    // 設定変更
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }

    // 演出強度設定
    setEffectIntensity(intensity) {
        this.settings.effectIntensity = Math.max(0, Math.min(1, intensity));
    }

    // 全演出停止
    stopAllEffects() {
        this.isPlaying = false;

        // オーバーレイ削除
        const overlays = document.querySelectorAll('.flash-overlay');
        overlays.forEach(overlay => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        });

        // 変形リセット
        this.gameContainer.style.transform = '';
        this.gameContainer.style.filter = '';
        this.gameContainer.style.transition = '';
    }
}

export default SlotEffects;