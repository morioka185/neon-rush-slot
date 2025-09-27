/**
 * DOUBLE OR NOTHING 機能
 * 50%の確率で配当が2倍！失敗すると全額没収の究極ギャンブル
 */

export class DoubleOrNothingFeature {
    constructor(gameState) {
        this.gameState = gameState;
        this.isActive = false;
        this.attempts = 0;
        this.maxConsecutive = 5; // 最大連続5回まで
    }

    /**
     * DOUBLE OR NOTHING 実行
     */
    async execute(currentAmount) {
        this.isActive = true;

        try {
            // 連続実行制限チェック
            if (this.attempts >= this.maxConsecutive) {
                throw new Error('連続実行回数の上限に達しました');
            }

            // ドキドキ演出開始
            await this.startSuspenseAnimation();

            // コイントス実行
            const result = await this.performCoinToss(currentAmount);

            // 結果演出
            await this.showResult(result);

            this.attempts++;

            return result;

        } finally {
            this.isActive = false;
        }
    }

    /**
     * サスペンス演出開始
     */
    async startSuspenseAnimation() {
        return new Promise(resolve => {
            const suspenseOverlay = document.createElement('div');
            suspenseOverlay.id = 'double-or-nothing-overlay';

            suspenseOverlay.innerHTML = `
                <div class="don-container">
                    <div class="don-header">
                        <h2 class="don-title">🎯 DOUBLE OR NOTHING 🎯</h2>
                        <p class="don-subtitle">運命のコイントス...</p>
                    </div>

                    <div class="coin-area">
                        <div class="coin" id="don-coin">
                            <div class="coin-side heads">👑</div>
                            <div class="coin-side tails">💀</div>
                        </div>
                    </div>

                    <div class="don-info">
                        <div class="chance-info">
                            <span class="chance-label">成功確率</span>
                            <span class="chance-value">50%</span>
                        </div>
                        <div class="result-info">
                            <span class="result-label">成功時</span>
                            <span class="result-value">💰 2倍</span>
                        </div>
                        <div class="fail-info">
                            <span class="fail-label">失敗時</span>
                            <span class="fail-value">💸 没収</span>
                        </div>
                    </div>

                    <div class="heartbeat-monitor">
                        <div class="heartbeat-line"></div>
                        <span class="heartbeat-text">心拍数: <span id="heartbeat-bpm">72</span> BPM</span>
                    </div>
                </div>
            `;

            suspenseOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: radial-gradient(
                    circle at 50% 50%,
                    rgba(255, 0, 0, 0.2) 0%,
                    rgba(139, 0, 0, 0.4) 50%,
                    rgba(0, 0, 0, 0.9) 100%
                );
                z-index: 9000;
                display: flex;
                justify-content: center;
                align-items: center;
                animation: suspense-in 1s ease-out;
            `;

            document.body.appendChild(suspenseOverlay);

            // 心拍数シミュレーション
            this.simulateHeartbeat();

            // 2秒後にコイントス開始
            setTimeout(() => {
                resolve();
            }, 2000);
        });
    }

    /**
     * 心拍数シミュレーション
     */
    simulateHeartbeat() {
        const heartbeatElement = document.getElementById('heartbeat-bpm');
        let currentBPM = 72;

        const heartbeatInterval = setInterval(() => {
            // ドキドキ感を演出（72〜140 BPM）
            currentBPM += Math.random() * 20 - 10;
            currentBPM = Math.max(72, Math.min(140, currentBPM));

            if (heartbeatElement) {
                heartbeatElement.textContent = Math.floor(currentBPM);
            }

            // オーバーレイが削除されたらクリア
            if (!document.getElementById('double-or-nothing-overlay')) {
                clearInterval(heartbeatInterval);
            }
        }, 500);
    }

    /**
     * コイントス実行
     */
    async performCoinToss(amount) {
        return new Promise(resolve => {
            const coin = document.getElementById('don-coin');
            const overlay = document.getElementById('double-or-nothing-overlay');

            if (!coin || !overlay) {
                resolve({ success: false, amount: 0, reason: 'UI Error' });
                return;
            }

            // 結果を先に決定（50%の確率）
            const isSuccess = Math.random() < 0.5;

            // コイン回転アニメーション開始
            coin.style.animation = 'coin-spin 3s ease-out';

            // 回転音効果
            this.playCoinSound();

            // 3秒後に結果決定
            setTimeout(() => {
                // コイン停止
                coin.style.animation = '';

                // 結果に応じてコインの面を表示
                if (isSuccess) {
                    coin.style.transform = 'rotateY(0deg)'; // 表（👑）
                } else {
                    coin.style.transform = 'rotateY(180deg)'; // 裏（💀）
                }

                // 結果オブジェクト作成
                const result = {
                    success: isSuccess,
                    amount: isSuccess ? amount * 2 : 0,
                    originalAmount: amount,
                    coinResult: isSuccess ? 'heads' : 'tails',
                    message: isSuccess ?
                        '🎉 成功！配当が2倍になりました！' :
                        '💸 失敗...配当は没収されました...'
                };

                resolve(result);
            }, 3000);
        });
    }

    /**
     * コイン回転音
     */
    playCoinSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // コイン回転の金属音をシミュレート
            for (let i = 0; i < 10; i++) {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                // 高音と低音を混ぜて金属的な音に
                oscillator.frequency.setValueAtTime(
                    800 + Math.random() * 400,
                    audioContext.currentTime + i * 0.3
                );
                oscillator.type = 'sawtooth';

                gainNode.gain.setValueAtTime(0, audioContext.currentTime + i * 0.3);
                gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + i * 0.3 + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.3 + 0.2);

                oscillator.start(audioContext.currentTime + i * 0.3);
                oscillator.stop(audioContext.currentTime + i * 0.3 + 0.2);
            }
        } catch (error) {
            console.log('音声再生スキップ（AudioContext未対応）');
        }
    }

    /**
     * 結果表示
     */
    async showResult(result) {
        return new Promise(resolve => {
            const overlay = document.getElementById('double-or-nothing-overlay');
            if (!overlay) {
                resolve();
                return;
            }

            // 結果エフェクト作成
            const resultDiv = document.createElement('div');
            resultDiv.className = `don-result ${result.success ? 'success' : 'failure'}`;

            if (result.success) {
                resultDiv.innerHTML = `
                    <div class="result-icon">🎉</div>
                    <div class="result-title">SUCCESS!</div>
                    <div class="result-message">${result.message}</div>
                    <div class="result-amount">+${result.amount.toLocaleString()}</div>
                    <div class="success-particles"></div>
                `;

                // 成功パーティクル
                this.createSuccessParticles(resultDiv);

                // 成功音
                this.playSuccessSound();

            } else {
                resultDiv.innerHTML = `
                    <div class="result-icon">💀</div>
                    <div class="result-title">FAILED...</div>
                    <div class="result-message">${result.message}</div>
                    <div class="result-amount">-${result.originalAmount.toLocaleString()}</div>
                    <div class="failure-effects"></div>
                `;

                // 失敗エフェクト
                this.createFailureEffects(resultDiv);

                // 失敗音
                this.playFailureSound();
            }

            resultDiv.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: ${result.success ?
                    'radial-gradient(circle, rgba(0, 255, 0, 0.2) 0%, rgba(0, 128, 0, 0.8) 100%)' :
                    'radial-gradient(circle, rgba(255, 0, 0, 0.2) 0%, rgba(128, 0, 0, 0.8) 100%)'
                };
                border: 3px solid ${result.success ? '#00ff00' : '#ff0000'};
                border-radius: 15px;
                padding: 2rem;
                text-align: center;
                color: #fff;
                font-size: 1.5rem;
                z-index: 9001;
                animation: result-appear 1s ease-out;
            `;

            overlay.appendChild(resultDiv);

            // 連続チャレンジの提案（成功時のみ）
            if (result.success && this.attempts < this.maxConsecutive - 1) {
                setTimeout(() => {
                    this.offerContinuousChallenge(result, overlay, resolve);
                }, 3000);
            } else {
                // 5秒後に自動で閉じる
                setTimeout(() => {
                    overlay.remove();
                    resolve();
                }, 5000);
            }
        });
    }

    /**
     * 連続チャレンジ提案
     */
    offerContinuousChallenge(result, overlay, resolve) {
        const challengeDiv = document.createElement('div');
        challengeDiv.className = 'continuous-challenge';

        challengeDiv.innerHTML = `
            <div class="challenge-title">🔥 連続チャレンジ 🔥</div>
            <div class="challenge-message">
                現在の配当: <span class="current-amount">${result.amount.toLocaleString()}</span><br>
                もう一度挑戦しますか？
            </div>
            <div class="challenge-buttons">
                <button class="challenge-yes">挑戦する！</button>
                <button class="challenge-no">やめておく</button>
            </div>
            <div class="challenge-warning">
                ⚠️ 失敗すると全額没収されます ⚠️
            </div>
        `;

        challengeDiv.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 165, 0, 0.9);
            border: 2px solid #ffa500;
            border-radius: 10px;
            padding: 1rem;
            text-align: center;
            color: #000;
            z-index: 9002;
            animation: challenge-slide-up 0.5s ease-out;
        `;

        // イベントリスナー
        challengeDiv.querySelector('.challenge-yes').addEventListener('click', async () => {
            overlay.remove();

            // 連続チャレンジ実行
            try {
                const nextResult = await this.execute(result.amount);
                resolve();
            } catch (error) {
                console.error('連続チャレンジエラー:', error);
                resolve();
            }
        });

        challengeDiv.querySelector('.challenge-no').addEventListener('click', () => {
            overlay.remove();
            resolve();
        });

        overlay.appendChild(challengeDiv);
    }

    /**
     * 成功パーティクル作成
     */
    createSuccessParticles(container) {
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.textContent = ['🎉', '✨', '💰', '🌟', '💎'][Math.floor(Math.random() * 5)];

            particle.style.cssText = `
                position: absolute;
                font-size: ${Math.random() * 20 + 15}px;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: success-burst ${Math.random() * 2 + 1}s ease-out;
                pointer-events: none;
            `;

            container.appendChild(particle);
        }
    }

    /**
     * 失敗エフェクト作成
     */
    createFailureEffects(container) {
        for (let i = 0; i < 15; i++) {
            const effect = document.createElement('div');
            effect.textContent = ['💸', '😢', '💔', '😭', '💀'][Math.floor(Math.random() * 5)];

            effect.style.cssText = `
                position: absolute;
                font-size: ${Math.random() * 15 + 10}px;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: failure-fall ${Math.random() * 3 + 2}s ease-in;
                pointer-events: none;
            `;

            container.appendChild(effect);
        }
    }

    /**
     * 成功音
     */
    playSuccessSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // 勝利のファンファーレ
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

            notes.forEach((frequency, index) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + index * 0.2);
                oscillator.type = 'square';

                gainNode.gain.setValueAtTime(0, audioContext.currentTime + index * 0.2);
                gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + index * 0.2 + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.2 + 0.5);

                oscillator.start(audioContext.currentTime + index * 0.2);
                oscillator.stop(audioContext.currentTime + index * 0.2 + 0.5);
            });
        } catch (error) {
            console.log('音声再生スキップ（AudioContext未対応）');
        }
    }

    /**
     * 失敗音
     */
    playFailureSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // 悲しい下降音
            const frequencies = [523.25, 493.88, 440.00, 392.00]; // C5→B4→A4→G4

            frequencies.forEach((frequency, index) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + index * 0.3);
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0, audioContext.currentTime + index * 0.3);
                gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + index * 0.3 + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.3 + 0.8);

                oscillator.start(audioContext.currentTime + index * 0.3);
                oscillator.stop(audioContext.currentTime + index * 0.3 + 0.8);
            });
        } catch (error) {
            console.log('音声再生スキップ（AudioContext未対応）');
        }
    }

    /**
     * 使用条件チェック
     */
    validateUsage(amount) {
        if (amount <= 0) {
            return false;
        }

        if (this.isActive) {
            return false;
        }

        return true;
    }

    /**
     * 連続実行回数リセット
     */
    resetAttempts() {
        this.attempts = 0;
    }

    /**
     * 統計情報取得
     */
    getStats() {
        return {
            maxConsecutive: this.maxConsecutive,
            currentAttempts: this.attempts,
            successRate: 50
        };
    }
}