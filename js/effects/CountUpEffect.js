/**
 * CountUpEffect - カウントアップ演出システム
 * 獲得感を最大化する数値アニメーション
 */
export class CountUpEffect {
    constructor(audioManager = null) {
        this.audioManager = audioManager;
        this.isAnimating = false;
        this.currentAnimation = null;
    }

    // 💰 基本カウントアップ演出
    async animateCountUp(element, startValue, endValue, duration = 1000, options = {}) {
        if (this.isAnimating) {
            this.stopCurrentAnimation();
        }

        const {
            prefix = '',
            suffix = '',
            delimiter = ',',
            easing = 'easeOut',
            playSound = true,
            flashOnComplete = true,
            celebrateThreshold = 1000
        } = options;

        this.isAnimating = true;
        const startTime = Date.now();

        return new Promise((resolve) => {
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // イージング適用
                const easedProgress = this.applyEasing(progress, easing);

                // 現在値計算
                const currentValue = Math.floor(startValue + (endValue - startValue) * easedProgress);

                // 表示更新
                this.updateDisplay(element, currentValue, prefix, suffix, delimiter);

                // 音響効果（値に応じて）
                if (playSound && this.audioManager) {
                    this.playCountSound(currentValue, endValue);
                }

                if (progress < 1) {
                    this.currentAnimation = requestAnimationFrame(animate);
                } else {
                    // 完了時の演出
                    this.isAnimating = false;
                    this.onCountComplete(element, endValue, flashOnComplete, celebrateThreshold);
                    resolve(endValue);
                }
            };

            this.currentAnimation = requestAnimationFrame(animate);
        });
    }

    // 🚀 加速度付きカウントアップ
    async acceleratedCountUp(element, endValue, options = {}) {
        const {
            initialSpeed = 10,
            acceleration = 1.1,
            maxSpeed = 100,
            prefix = '',
            suffix = ''
        } = options;

        this.isAnimating = true;
        let currentValue = 0;
        let currentSpeed = initialSpeed;

        return new Promise((resolve) => {
            const animate = () => {
                currentValue += currentSpeed;
                currentSpeed = Math.min(currentSpeed * acceleration, maxSpeed);

                if (currentValue >= endValue) {
                    currentValue = endValue;
                    this.updateDisplay(element, currentValue, prefix, suffix);
                    this.isAnimating = false;
                    this.onCountComplete(element, endValue, true, 500);
                    resolve(endValue);
                    return;
                }

                this.updateDisplay(element, currentValue, prefix, suffix);

                // 高速時の音響効果
                if (this.audioManager && currentValue % Math.floor(maxSpeed / 5) === 0) {
                    this.audioManager.playSFX('betChange');
                }

                this.currentAnimation = requestAnimationFrame(animate);
            };

            this.currentAnimation = requestAnimationFrame(animate);
        });
    }

    // 📊 段階的カウントアップ（ドラマチック）
    async dramaticCountUp(element, endValue, options = {}) {
        const {
            stages = [0.3, 0.6, 0.8, 0.95, 1.0],
            stageDurations = [500, 300, 400, 800, 200],
            pauseBetweenStages = 100,
            prefix = '',
            suffix = ''
        } = options;

        this.isAnimating = true;
        let currentStage = 0;

        for (let i = 0; i < stages.length; i++) {
            const targetValue = Math.floor(endValue * stages[i]);
            const duration = stageDurations[i] || 300;

            // この段階のカウントアップ
            await this.animateCountUp(element,
                i === 0 ? 0 : Math.floor(endValue * stages[i-1]),
                targetValue,
                duration,
                {
                    prefix,
                    suffix,
                    playSound: true,
                    flashOnComplete: false
                }
            );

            // ステージ間の一時停止
            if (i < stages.length - 1) {
                await new Promise(resolve => setTimeout(resolve, pauseBetweenStages));

                // ステージアップ音
                if (this.audioManager) {
                    this.audioManager.playSFX('stageUp');
                }

                // 段階的フラッシュ
                this.flashElement(element, this.getStageColor(i));
            }
        }

        this.isAnimating = false;
        this.onCountComplete(element, endValue, true, 100);
        return endValue;
    }

    // 🎰 ジャックポット専用カウントアップ
    async jackpotCountUp(element, endValue, options = {}) {
        const {
            prefix = '💰 ',
            suffix = ' COINS!',
            glowColor = '#ffd700'
        } = options;

        // 演出準備
        element.style.fontSize = '2.5rem';
        element.style.color = glowColor;
        element.style.textShadow = `0 0 20px ${glowColor}`;

        // 特別な音響
        if (this.audioManager) {
            this.audioManager.playSFX('jackpot');
        }

        // 超ドラマチックカウント
        await this.dramaticCountUp(element, endValue, {
            stages: [0.1, 0.3, 0.5, 0.7, 0.85, 0.95, 1.0],
            stageDurations: [200, 300, 400, 500, 800, 1000, 300],
            pauseBetweenStages: 200,
            prefix,
            suffix
        });

        // 最終爆発演出
        await this.finalExplosion(element);
    }

    // 🏆 コンボカウンター演出
    async comboCountUp(element, comboCount, multiplier = 1) {
        const prefix = `${comboCount}x COMBO! `;
        const suffix = ` (×${multiplier})`;

        element.classList.add('combo-counter');

        await this.animateCountUp(element, 0, comboCount * 100 * multiplier, 800, {
            prefix,
            suffix,
            playSound: true,
            flashOnComplete: true
        });

        // コンボ特殊演出
        await this.comboFlashSequence(element, comboCount);

        element.classList.remove('combo-counter');
    }

    // 🛠️ ユーティリティ関数

    updateDisplay(element, value, prefix = '', suffix = '', delimiter = ',') {
        const formattedValue = this.formatNumber(value, delimiter);
        element.textContent = `${prefix}${formattedValue}${suffix}`;
    }

    formatNumber(value, delimiter = ',') {
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, delimiter);
    }

    applyEasing(progress, easingType) {
        switch (easingType) {
            case 'linear':
                return progress;
            case 'easeIn':
                return progress * progress;
            case 'easeOut':
                return 1 - Math.pow(1 - progress, 2);
            case 'easeInOut':
                return progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            case 'bounce':
                if (progress < 1/2.75) {
                    return 7.5625 * progress * progress;
                } else if (progress < 2/2.75) {
                    return 7.5625 * (progress -= 1.5/2.75) * progress + 0.75;
                } else if (progress < 2.5/2.75) {
                    return 7.5625 * (progress -= 2.25/2.75) * progress + 0.9375;
                } else {
                    return 7.5625 * (progress -= 2.625/2.75) * progress + 0.984375;
                }
            default:
                return 1 - Math.pow(1 - progress, 3); // easeOut cubic
        }
    }

    playCountSound(currentValue, endValue) {
        const progress = currentValue / endValue;

        if (progress > 0.8 && Math.random() < 0.3) {
            this.audioManager.playSFX('coinDrop');
        } else if (progress > 0.5 && Math.random() < 0.1) {
            this.audioManager.playSFX('buttonClick');
        }
    }

    onCountComplete(element, finalValue, shouldFlash, celebrateThreshold) {
        if (shouldFlash) {
            this.flashElement(element, '#00ff00');
        }

        if (finalValue >= celebrateThreshold) {
            this.celebrateCompletion(element);
        }

        // 完了音
        if (this.audioManager) {
            if (finalValue >= 1000) {
                this.audioManager.playSFX('bigWin');
            } else {
                this.audioManager.playSFX('win');
            }
        }
    }

    flashElement(element, color = '#ffffff') {
        if (!element || !element.style) {
            console.warn('flashElement: 無効な要素が渡されました');
            return;
        }

        const originalColor = element.style.color || '';
        const originalTextShadow = element.style.textShadow || '';

        element.style.color = color;
        element.style.textShadow = `0 0 15px ${color}`;

        setTimeout(() => {
            if (element && element.style) {
                element.style.color = originalColor;
                element.style.textShadow = originalTextShadow;
            }
        }, 200);
    }

    getStageColor(stage) {
        const colors = ['#ffff00', '#ffa500', '#ff4444', '#ff00ff', '#00ffff'];
        return colors[stage % colors.length];
    }

    async celebrateCompletion(element) {
        if (!element || !element.style) {
            console.warn('celebrateCompletion: 無効な要素が渡されました');
            return;
        }

        // 拡大演出
        const originalTransform = element.style.transform || '';
        element.style.transition = 'transform 0.3s ease-out';
        element.style.transform = 'scale(1.2)';

        setTimeout(() => {
            if (element && element.style) {
                element.style.transform = originalTransform;
            }
        }, 300);

        // パーティクル風演出（文字で）
        this.createTextParticles(element);
    }

    createTextParticles(element) {
        if (!element) {
            console.warn('createTextParticles: 無効な要素が渡されました');
            return;
        }

        const particles = ['🎉', '🎊', '💰', '⭐', '✨'];
        const rect = element.getBoundingClientRect();

        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.textContent = particles[Math.floor(Math.random() * particles.length)];
            particle.style.cssText = `
                position: fixed;
                left: ${rect.left + rect.width / 2}px;
                top: ${rect.top + rect.height / 2}px;
                font-size: 1.5rem;
                z-index: 1000;
                pointer-events: none;
                animation: count-particle-burst 1s ease-out forwards;
                --angle: ${(i / 8) * 360}deg;
            `;

            document.body.appendChild(particle);

            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1000);
        }
    }

    async finalExplosion(element) {
        // 最終爆発演出
        for (let i = 0; i < 3; i++) {
            element.style.transform = `scale(${1.5 + i * 0.2})`;
            this.flashElement(element, i % 2 ? '#ffd700' : '#ffffff');
            await new Promise(resolve => setTimeout(resolve, 150));
        }

        element.style.transform = 'scale(1)';
    }

    async comboFlashSequence(element, comboCount) {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];

        for (let i = 0; i < comboCount && i < 5; i++) {
            this.flashElement(element, colors[i]);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    stopCurrentAnimation() {
        if (this.currentAnimation) {
            cancelAnimationFrame(this.currentAnimation);
            this.currentAnimation = null;
        }
        this.isAnimating = false;
    }

    // CSS スタイル追加
    static addStyles() {
        if (document.getElementById('countup-effect-styles')) return;

        const style = document.createElement('style');
        style.id = 'countup-effect-styles';
        style.textContent = `
            @keyframes count-particle-burst {
                0% {
                    transform: translate(-50%, -50%) scale(1) rotate(0deg);
                    opacity: 1;
                }
                100% {
                    transform: translate(-50%, -50%)
                               translate(calc(cos(var(--angle)) * 100px), calc(sin(var(--angle)) * 100px))
                               scale(0.3) rotate(720deg);
                    opacity: 0;
                }
            }

            .combo-counter {
                font-weight: bold;
                text-shadow: 0 0 10px currentColor;
                animation: combo-pulse 0.5s ease-in-out infinite alternate;
            }

            @keyframes combo-pulse {
                0% {
                    transform: scale(1);
                    filter: brightness(1);
                }
                100% {
                    transform: scale(1.05);
                    filter: brightness(1.3);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// スタイルを自動追加
CountUpEffect.addStyles();

export default CountUpEffect;