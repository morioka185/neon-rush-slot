/**
 * ALL OR NOTHING 機能
 * 全財産を賭けた究極の一発逆転！20%で5倍の奇跡、80%で破産の地獄
 */

export class AllOrNothingFeature {
    constructor(gameState) {
        this.gameState = gameState;
        this.isActive = false;
        this.warningShown = false;
    }

    /**
     * ALL OR NOTHING 実行
     */
    async execute(currentAmount = null) {
        this.isActive = true;

        try {
            const state = this.gameState.getState();
            const totalCoins = state.coins;

            // 最終警告表示
            const confirmed = await this.showFinalWarning(totalCoins);
            if (!confirmed) {
                return { success: false, amount: 0, cancelled: true };
            }

            // 地獄の演出開始
            await this.startApocalypseAnimation();

            // 運命の審判実行
            const result = await this.performJudgment(totalCoins);

            // 結果演出
            await this.showJudgmentResult(result);

            return result;

        } finally {
            this.isActive = false;
        }
    }

    /**
     * 最終警告表示
     */
    async showFinalWarning(totalCoins) {
        return new Promise(resolve => {
            const warningOverlay = document.createElement('div');
            warningOverlay.id = 'all-or-nothing-warning';

            warningOverlay.innerHTML = `
                <div class="warning-container">
                    <div class="warning-skull">💀</div>
                    <div class="warning-title">⚠️ 最終警告 ⚠️</div>

                    <div class="warning-content">
                        <p class="warning-text">
                            <strong>ALL OR NOTHING</strong> を実行しようとしています
                        </p>
                        <p class="warning-amount">
                            賭け金: <span class="total-amount">${totalCoins.toLocaleString()}</span> コイン
                        </p>
                        <p class="warning-odds">
                            成功率: <span class="success-rate">20%</span><br>
                            成功時: <span class="success-reward">5倍 (${(totalCoins * 5).toLocaleString()})</span><br>
                            失敗時: <span class="failure-result">全額没収 (破産)</span>
                        </p>
                    </div>

                    <div class="warning-disclaimer">
                        <p>⚠️ この操作は取り消しできません ⚠️</p>
                        <p>💀 80%の確率で全てを失います 💀</p>
                        <p>🔥 あなたは本当に地獄を見る覚悟がありますか？ 🔥</p>
                    </div>

                    <div class="warning-buttons">
                        <button class="warning-cancel">やめる（賢明な判断）</button>
                        <button class="warning-confirm" disabled>
                            <span class="confirm-text">地獄へ行く</span>
                            <span class="confirm-timer" id="confirm-timer">5</span>
                        </button>
                    </div>
                </div>
            `;

            warningOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: radial-gradient(
                    circle at 50% 50%,
                    rgba(255, 0, 0, 0.1) 0%,
                    rgba(139, 0, 0, 0.5) 30%,
                    rgba(0, 0, 0, 0.95) 80%
                );
                z-index: 10000;
                display: flex;
                justify-content: center;
                align-items: center;
                animation: warning-appear 1s ease-out;
            `;

            document.body.appendChild(warningOverlay);

            // 5秒のクールダウン
            this.startConfirmationCooldown(warningOverlay, resolve);

            // イベントリスナー
            warningOverlay.querySelector('.warning-cancel').addEventListener('click', () => {
                warningOverlay.remove();
                resolve(false);
            });
        });
    }

    /**
     * 確認ボタンのクールダウン
     */
    startConfirmationCooldown(overlay, resolve) {
        let timeLeft = 5;
        const confirmButton = overlay.querySelector('.warning-confirm');
        const timerElement = overlay.querySelector('#confirm-timer');

        const countdown = setInterval(() => {
            timeLeft--;
            timerElement.textContent = timeLeft;

            if (timeLeft <= 0) {
                clearInterval(countdown);
                confirmButton.disabled = false;
                confirmButton.innerHTML = '<span class="confirm-text">💀 地獄へ行く 💀</span>';

                // 確認ボタンが有効になったらイベント追加
                confirmButton.addEventListener('click', () => {
                    overlay.remove();
                    resolve(true);
                });
            }
        }, 1000);
    }

    /**
     * 地獄の演出開始
     */
    async startApocalypseAnimation() {
        return new Promise(resolve => {
            const apocalypseOverlay = document.createElement('div');
            apocalypseOverlay.id = 'apocalypse-overlay';

            apocalypseOverlay.innerHTML = `
                <div class="apocalypse-container">
                    <div class="apocalypse-title">💀 ALL OR NOTHING 💀</div>
                    <div class="apocalypse-subtitle">運命の審判の時...</div>

                    <div class="judgment-area">
                        <div class="scales-of-fate">
                            <div class="scale-left">😇</div>
                            <div class="scale-center">⚖️</div>
                            <div class="scale-right">😈</div>
                        </div>

                        <div class="fate-meter">
                            <div class="fate-bar">
                                <div class="fate-fill" id="fate-fill"></div>
                            </div>
                            <div class="fate-labels">
                                <span class="label-heaven">天国 (20%)</span>
                                <span class="label-hell">地獄 (80%)</span>
                            </div>
                        </div>
                    </div>

                    <div class="apocalypse-effects">
                        <div class="lightning-storm"></div>
                        <div class="hellfire-particles"></div>
                    </div>

                    <div class="countdown-display">
                        <span class="countdown-text">審判まで: </span>
                        <span class="countdown-number" id="judgment-countdown">3</span>
                    </div>
                </div>
            `;

            apocalypseOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(
                    45deg,
                    rgba(255, 0, 0, 0.3) 0%,
                    rgba(0, 0, 0, 0.9) 50%,
                    rgba(139, 0, 0, 0.3) 100%
                );
                z-index: 9500;
                display: flex;
                justify-content: center;
                align-items: center;
                animation: apocalypse-rise 2s ease-out;
            `;

            document.body.appendChild(apocalypseOverlay);

            // 地獄のエフェクト開始
            this.createHellfireEffects(apocalypseOverlay);
            this.playApocalypseSound();

            // 3秒カウントダウン
            this.startJudgmentCountdown(apocalypseOverlay, resolve);
        });
    }

    /**
     * 地獄の炎エフェクト
     */
    createHellfireEffects(container) {
        const hellfireContainer = container.querySelector('.hellfire-particles');

        for (let i = 0; i < 30; i++) {
            const flame = document.createElement('div');
            flame.textContent = ['🔥', '💥', '⚡', '🌪️', '💀'][Math.floor(Math.random() * 5)];

            flame.style.cssText = `
                position: absolute;
                font-size: ${Math.random() * 30 + 20}px;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                color: ${['#ff0000', '#ff4500', '#ff6600', '#dc143c'][Math.floor(Math.random() * 4)]};
                animation: hellfire-dance ${Math.random() * 3 + 2}s ease-in-out infinite;
                pointer-events: none;
                text-shadow: 0 0 10px currentColor;
            `;

            hellfireContainer.appendChild(flame);
        }

        // 稲妻エフェクト
        const lightningContainer = container.querySelector('.lightning-storm');
        setInterval(() => {
            if (lightningContainer && document.body.contains(container)) {
                lightningContainer.style.background = 'rgba(255, 255, 255, 0.8)';
                setTimeout(() => {
                    lightningContainer.style.background = 'transparent';
                }, 100);
            }
        }, 1500);
    }

    /**
     * 審判カウントダウン
     */
    startJudgmentCountdown(overlay, resolve) {
        let timeLeft = 3;
        const countdownElement = overlay.querySelector('#judgment-countdown');
        const fateBar = overlay.querySelector('#fate-fill');

        const countdown = setInterval(() => {
            // 運命ゲージの演出
            const randomFill = Math.random() * 100;
            fateBar.style.width = `${randomFill}%`;

            timeLeft--;
            countdownElement.textContent = timeLeft;

            if (timeLeft <= 0) {
                clearInterval(countdown);
                countdownElement.textContent = '審判！';

                setTimeout(() => {
                    resolve();
                }, 1000);
            }
        }, 1000);
    }

    /**
     * 地獄の音響効果
     */
    playApocalypseSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // 地獄の雷鳴と炎の音
            for (let i = 0; i < 5; i++) {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                // 低周波のゴロゴロ音
                oscillator.frequency.setValueAtTime(
                    50 + Math.random() * 100,
                    audioContext.currentTime + i * 0.5
                );
                oscillator.type = 'sawtooth';

                gainNode.gain.setValueAtTime(0, audioContext.currentTime + i * 0.5);
                gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + i * 0.5 + 0.2);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.5 + 1);

                oscillator.start(audioContext.currentTime + i * 0.5);
                oscillator.stop(audioContext.currentTime + i * 0.5 + 1);
            }
        } catch (error) {
            console.log('音声再生スキップ（AudioContext未対応）');
        }
    }

    /**
     * 運命の審判実行
     */
    async performJudgment(totalCoins) {
        return new Promise(resolve => {
            // 20%の確率で成功
            const isSuccess = Math.random() < 0.2;

            // 審判の演出
            const overlay = document.getElementById('apocalypse-overlay');
            if (overlay) {
                const fateBar = overlay.querySelector('#fate-fill');
                const finalPosition = isSuccess ? 15 : 85; // 成功なら左側、失敗なら右側

                // ゲージが最終位置に移動
                fateBar.style.transition = 'width 2s ease-out';
                fateBar.style.width = `${finalPosition}%`;
                fateBar.style.background = isSuccess ?
                    'linear-gradient(90deg, #00ff00, #ffff00)' :
                    'linear-gradient(90deg, #ff0000, #800000)';
            }

            // 2秒後に結果決定
            setTimeout(() => {
                const result = {
                    success: isSuccess,
                    amount: isSuccess ? totalCoins * 5 : 0,
                    originalAmount: totalCoins,
                    judgment: isSuccess ? 'heaven' : 'hell',
                    message: isSuccess ?
                        '😇 奇跡！神の祝福により5倍の富を手に入れました！' :
                        '💀 地獄へ落ちました...全財産を失いました...'
                };

                if (isSuccess) {
                    // 成功時は神の状態に変更
                    this.gameState.setState({
                        coins: result.amount,
                        godMode: true,
                        multiplier: 2.0
                    });
                } else {
                    // 失敗時は破産状態
                    this.gameState.setState({
                        coins: 0,
                        gameOver: true
                    });
                }

                resolve(result);
            }, 2000);
        });
    }

    /**
     * 審判結果表示
     */
    async showJudgmentResult(result) {
        return new Promise(resolve => {
            const overlay = document.getElementById('apocalypse-overlay');
            if (!overlay) {
                resolve();
                return;
            }

            // 結果エフェクト作成
            const resultDiv = document.createElement('div');
            resultDiv.className = `judgment-result ${result.judgment}`;

            if (result.success) {
                resultDiv.innerHTML = `
                    <div class="result-icon">😇</div>
                    <div class="result-title">MIRACLE!</div>
                    <div class="result-subtitle">神の奇跡が起こりました！</div>
                    <div class="result-message">${result.message}</div>
                    <div class="result-amount">+${result.amount.toLocaleString()}</div>
                    <div class="heaven-effects"></div>
                    <div class="god-mode-notification">🌟 GOD MODE ACTIVATED 🌟</div>
                `;

                // 天国エフェクト
                this.createHeavenEffects(resultDiv);
                this.playHeavenSound();

            } else {
                resultDiv.innerHTML = `
                    <div class="result-icon">💀</div>
                    <div class="result-title">JUDGMENT DAY</div>
                    <div class="result-subtitle">地獄の業火に焼かれました...</div>
                    <div class="result-message">${result.message}</div>
                    <div class="result-amount">-${result.originalAmount.toLocaleString()}</div>
                    <div class="hell-effects"></div>
                    <div class="game-over-notification">💸 GAME OVER 💸</div>
                `;

                // 地獄エフェクト
                this.createHellEffects(resultDiv);
                this.playHellSound();
            }

            resultDiv.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: ${result.success ?
                    'radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, rgba(255, 255, 255, 0.8) 100%)' :
                    'radial-gradient(circle, rgba(255, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.9) 100%)'
                };
                border: 5px solid ${result.success ? '#ffd700' : '#8b0000'};
                border-radius: 20px;
                padding: 3rem;
                text-align: center;
                color: ${result.success ? '#000' : '#fff'};
                font-size: 1.8rem;
                z-index: 9501;
                animation: judgment-appear 1.5s ease-out;
                min-width: 400px;
            `;

            overlay.appendChild(resultDiv);

            // 8秒後に自動で閉じる
            setTimeout(() => {
                overlay.remove();
                resolve();
            }, 8000);
        });
    }

    /**
     * 天国エフェクト
     */
    createHeavenEffects(container) {
        const heavenContainer = container.querySelector('.heaven-effects');

        for (let i = 0; i < 25; i++) {
            const angel = document.createElement('div');
            angel.textContent = ['😇', '✨', '🌟', '💫', '⭐'][Math.floor(Math.random() * 5)];

            angel.style.cssText = `
                position: absolute;
                font-size: ${Math.random() * 25 + 20}px;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                color: #ffd700;
                animation: heaven-ascend ${Math.random() * 3 + 2}s ease-out infinite;
                pointer-events: none;
                text-shadow: 0 0 15px currentColor;
            `;

            heavenContainer.appendChild(angel);
        }
    }

    /**
     * 地獄エフェクト
     */
    createHellEffects(container) {
        const hellContainer = container.querySelector('.hell-effects');

        for (let i = 0; i < 25; i++) {
            const demon = document.createElement('div');
            demon.textContent = ['💀', '👹', '🔥', '💥', '⚡'][Math.floor(Math.random() * 5)];

            demon.style.cssText = `
                position: absolute;
                font-size: ${Math.random() * 25 + 20}px;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                color: #ff0000;
                animation: hell-descend ${Math.random() * 3 + 2}s ease-in infinite;
                pointer-events: none;
                text-shadow: 0 0 15px currentColor;
            `;

            hellContainer.appendChild(demon);
        }
    }

    /**
     * 天国の音楽
     */
    playHeavenSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // 天使のハープの音色
            const frequencies = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5-E6

            frequencies.forEach((frequency, index) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + index * 0.3);
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0, audioContext.currentTime + index * 0.3);
                gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + index * 0.3 + 0.2);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.3 + 2);

                oscillator.start(audioContext.currentTime + index * 0.3);
                oscillator.stop(audioContext.currentTime + index * 0.3 + 2);
            });
        } catch (error) {
            console.log('音声再生スキップ（AudioContext未対応）');
        }
    }

    /**
     * 地獄の悲鳴
     */
    playHellSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // 地獄の低音
            const frequencies = [65.41, 73.42, 82.41, 87.31]; // C2-F2

            frequencies.forEach((frequency, index) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + index * 0.5);
                oscillator.type = 'sawtooth';

                gainNode.gain.setValueAtTime(0, audioContext.currentTime + index * 0.5);
                gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + index * 0.5 + 0.3);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.5 + 3);

                oscillator.start(audioContext.currentTime + index * 0.5);
                oscillator.stop(audioContext.currentTime + index * 0.5 + 3);
            });
        } catch (error) {
            console.log('音声再生スキップ（AudioContext未対応）');
        }
    }

    /**
     * 使用条件チェック
     */
    validateUsage() {
        const state = this.gameState.getState();

        if (state.coins <= 0) {
            return false;
        }

        if (this.isActive) {
            return false;
        }

        return true;
    }

    /**
     * 統計情報取得
     */
    getStats() {
        return {
            successRate: 20,
            multiplier: 5,
            destructionRate: 80
        };
    }

    /**
     * 緊急時の説得メッセージ
     */
    getPersuasionMessage(coins) {
        const messages = [
            '本当にいいんですか？あなたには家族がいるんでしょう？',
            '今ならまだ間に合います。冷静になってください。',
            'ギャンブルは99%が負けるんです。やめておきましょう。',
            '一度失ったお金は二度と戻ってきません。',
            'あなたの人生はそんなに安いものじゃないはずです。'
        ];

        return messages[Math.floor(Math.random() * messages.length)];
    }
}