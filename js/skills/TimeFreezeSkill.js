/**
 * タイムフリーズスキル - 時を止めてリールを操る究極の技
 * プレイヤーが各リールを個別にタップして停止できる神スキル
 */

export class TimeFreezeSkill {
    constructor(gameState, slotMachine) {
        this.gameState = gameState;
        this.slotMachine = slotMachine;

        this.isActive = false;
        this.stoppedReels = new Set();
        this.reelResults = [];
        this.manualStopPromise = null;
        this.eventHandlers = new Map(); // イベントハンドラーを保存
        this.isProcessingStop = false; // 重複実行防止フラグ
    }

    /**
     * スキル実行メイン関数
     * 時間を止めてプレイヤーにリール制御権を渡す
     */
    async execute() {
        this.isActive = true;
        this.stoppedReels.clear();
        this.reelResults = [null, null, null];

        try {
            // スピン開始演出
            await this.startSpinWithFreeze();

            // プレイヤーの手動停止を待機
            const manualResults = await this.waitForManualStops();

            // 結果をスロットに反映
            this.displayResults(manualResults);

            return {
                type: 'timeFreeze',
                manualStopResults: manualResults,
                controllable: true,
                skillUsed: true
            };

        } finally {
            this.isActive = false;
            this.isProcessingStop = false;
            this.cleanup();
        }
    }

    /**
     * フリーズ付きスピン開始
     */
    async startSpinWithFreeze() {
        return new Promise(resolve => {
            const symbols = this.slotMachine.getSymbols();
            const slotGrid = document.getElementById('slot-grid');

            // リール回転演出を開始
            this.startReelAnimations();

            // 2秒後にフリーズ状態へ移行
            setTimeout(() => {
                this.activateFreezeMode();
                resolve();
            }, 2000);
        });
    }

    /**
     * リール回転アニメーション開始
     */
    startReelAnimations() {
        const reels = document.querySelectorAll('.symbol');
        const symbols = ['🔷', '⚡', '🔥', '💎', '✨', '🌙', '7️⃣'];

        reels.forEach((reel, index) => {
            const reelIndex = Math.floor(index / 3);

            // リール別の回転速度設定
            const animationDuration = 100 + (reelIndex * 50); // 左から順に遅くなる

            reel.style.animation = `reel-spin ${animationDuration}ms linear infinite`;

            // 高速シンボル変更でスピン感演出
            const spinInterval = setInterval(() => {
                if (!this.isActive) {
                    clearInterval(spinInterval);
                    return;
                }

                const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
                reel.textContent = randomSymbol;
            }, animationDuration);

            reel.dataset.spinInterval = spinInterval;
        });
    }

    /**
     * フリーズモード有効化
     * プレイヤーがリールをタップして停止できる状態にする
     */
    activateFreezeMode() {
        // フリーズエフェクト表示
        this.showFreezeEffect();

        // リールにクリックイベント追加
        this.setupManualStopEvents();
    }

    /**
     * フリーズエフェクト表示
     */
    showFreezeEffect() {
        // 氷結オーバーレイ
        const freezeOverlay = document.createElement('div');
        freezeOverlay.id = 'freeze-overlay';
        freezeOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle, rgba(0, 255, 255, 0.1) 0%, transparent 70%);
            pointer-events: none;
            z-index: 1000;
            animation: freeze-pulse 2s ease-in-out infinite;
        `;
        document.body.appendChild(freezeOverlay);

        // スロットエリアの氷結エフェクト
        const slotArea = document.querySelector('.slot-area');
        slotArea.classList.add('time-frozen');
    }

    /**
     * 手動停止イベント設定
     */
    setupManualStopEvents() {
        const symbols = document.querySelectorAll('.symbol');

        symbols.forEach((symbol, index) => {
            const reelIndex = index % 3; // 列（リール）のインデックス

            // まだ停止していないリールのみクリック可能
            if (!this.stoppedReels.has(reelIndex)) {
                symbol.style.cursor = 'pointer';
                symbol.style.filter = 'brightness(1.5) drop-shadow(0 0 15px #00ffff)';
                symbol.style.border = '3px solid #00ffff';
                symbol.style.borderRadius = '8px';
                symbol.style.animation = 'clickable-pulse 1s ease-in-out infinite';

                // クリック可能マーカーを追加
                const clickMarker = document.createElement('div');
                clickMarker.className = 'click-marker';
                clickMarker.innerHTML = '👆 TAP';
                clickMarker.style.cssText = `
                    position: absolute;
                    top: -25px;
                    left: 50%;
                    transform: translateX(-50%);
                    color: #00ffff;
                    font-size: 12px;
                    font-weight: bold;
                    text-shadow: 0 0 5px #00ffff;
                    animation: tap-bounce 0.8s ease-in-out infinite;
                    pointer-events: none;
                    z-index: 10;
                `;
                symbol.style.position = 'relative';
                symbol.appendChild(clickMarker);

                const clickHandler = (e) => {
                    this.stopReel(reelIndex);
                };

                const touchHandler = (e) => {
                    // タッチイベントの場合、可能な場合のみpreventDefaultを試行
                    if (e.cancelable) {
                        e.preventDefault();
                    }
                    this.stopReel(reelIndex);
                };

                symbol.addEventListener('click', clickHandler);
                symbol.addEventListener('touchstart', touchHandler, { passive: false });

                // クリーンアップ用にMapに保存
                this.eventHandlers.set(symbol, {
                    click: clickHandler,
                    touchstart: touchHandler
                });
            }
        });
    }


    /**
     * タイミングフィードバック表示
     */
    showTimingFeedback(timing) {
        const perfectTimings = [333, 666, 999];
        const minDistance = Math.min(...perfectTimings.map(perfect =>
            Math.abs(timing - perfect)
        ));

        let feedbackText = '';
        let feedbackColor = '';

        if (minDistance <= 15) {
            feedbackText = `🎯 PERFECT! (${timing}ms)`;
            feedbackColor = '#00ff00';
        } else if (minDistance <= 50) {
            feedbackText = `✅ GOOD! (${timing}ms)`;
            feedbackColor = '#ffff00';
        } else {
            feedbackText = `⭕ OK (${timing}ms)`;
            feedbackColor = '#ff8800';
        }

        // フィードバック表示
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'timing-feedback';
        feedbackDiv.textContent = feedbackText;
        feedbackDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: ${feedbackColor};
            padding: 1rem 2rem;
            border: 2px solid ${feedbackColor};
            border-radius: 10px;
            font-size: 1.5rem;
            font-weight: bold;
            text-shadow: 0 0 10px ${feedbackColor};
            z-index: 2000;
            animation: feedback-popup 1.5s ease-out forwards;
        `;

        document.body.appendChild(feedbackDiv);

        // 1.5秒後に削除
        setTimeout(() => {
            if (feedbackDiv.parentNode) {
                feedbackDiv.remove();
            }
        }, 1500);
    }

    /**
     * リール停止処理
     */
    stopReel(reelIndex) {
        if (this.stoppedReels.has(reelIndex)) return;

        // 重複実行防止
        if (this.isProcessingStop) return;
        this.isProcessingStop = true;

        // 停止タイミングを記録
        const stopTiming = Date.now() % 1000;

        // 停止音効果（簡易版）
        this.playStopSound();

        // タイミング評価を表示
        this.showTimingFeedback(stopTiming);

        // リール停止
        this.stoppedReels.add(reelIndex);

        // 該当リールのシンボルを停止
        const reelSymbols = this.getReelSymbols(reelIndex);
        const stoppedSymbols = this.generateStoppedSymbols(stopTiming);

        reelSymbols.forEach((symbol, symbolIndex) => {
            // アニメーション停止
            clearInterval(symbol.dataset.spinInterval);
            symbol.style.animation = 'none';

            // 最終シンボル設定
            const symbolObj = stoppedSymbols[symbolIndex];
            const symbolText = typeof symbolObj === 'string' ? symbolObj : (symbolObj.emoji || '🔷');
            symbol.textContent = symbolText;
            symbol.style.cursor = 'default';
            symbol.style.filter = 'brightness(1.5) drop-shadow(0 0 15px #00ff00)';
            symbol.style.border = '3px solid #00ff00';
            symbol.style.animation = 'none';

            // 停止エフェクト
            symbol.classList.add('manually-stopped');

            // クリックマーカーを削除
            const clickMarker = symbol.querySelector('.click-marker');
            if (clickMarker) {
                clickMarker.remove();
            }

            // クリックイベント削除
            const handlers = this.eventHandlers.get(symbol);
            if (handlers) {
                symbol.removeEventListener('click', handlers.click);
                symbol.removeEventListener('touchstart', handlers.touchstart);
                this.eventHandlers.delete(symbol);
            }
        });

        // 結果を保存
        this.reelResults[reelIndex] = stoppedSymbols;

        // 同じリールの他のシンボルも停止状態の視覚効果を適用
        this.updateOtherReelSymbols(reelIndex);

        // 処理完了フラグをリセット
        setTimeout(() => {
            this.isProcessingStop = false;
        }, 100);

        // 全リール停止チェック
        if (this.stoppedReels.size === 3) {
            setTimeout(() => {
                this.completeManualStop();
            }, 500);
        }
    }

    /**
     * 指定リールのシンボル要素取得
     */
    getReelSymbols(reelIndex) {
        const symbols = document.querySelectorAll('.symbol');
        return [
            symbols[reelIndex],          // 上段
            symbols[reelIndex + 3],      // 中段
            symbols[reelIndex + 6]       // 下段
        ];
    }

    /**
     * 同じリールの他のシンボルを停止状態に更新
     */
    updateOtherReelSymbols(reelIndex) {
        const allSymbols = document.querySelectorAll('.symbol');

        allSymbols.forEach((symbol, index) => {
            const symbolReelIndex = index % 3;

            if (symbolReelIndex === reelIndex) {
                // 同じリールのシンボルは全て停止状態の見た目に
                symbol.style.cursor = 'default';
                symbol.style.filter = 'brightness(1.2) drop-shadow(0 0 10px #00ff00)';
                symbol.style.border = '2px solid #00ff00';
                symbol.style.animation = 'none';

                // クリックマーカーを削除
                const clickMarker = symbol.querySelector('.click-marker');
                if (clickMarker) {
                    clickMarker.remove();
                }

                // イベントハンドラー削除
                const handlers = this.eventHandlers.get(symbol);
                if (handlers) {
                    symbol.removeEventListener('click', handlers.click);
                    symbol.removeEventListener('touchstart', handlers.touchstart);
                    this.eventHandlers.delete(symbol);
                }
            }
        });
    }

    /**
     * 停止時のシンボル生成
     * プレイヤーが停止したタイミングに基づいて結果を決定
     */
    generateStoppedSymbols(stopTiming = Date.now() % 1000) {
        const symbols = this.slotMachine.getSymbols();

        // 停止タイミングが良いほど高配当シンボルが出やすい
        const luckFactor = this.calculateLuckFactor(stopTiming);

        return [
            this.selectSymbolByLuck(symbols, luckFactor),
            this.selectSymbolByLuck(symbols, luckFactor),
            this.selectSymbolByLuck(symbols, luckFactor)
        ];
    }

    /**
     * 停止タイミングの運要素計算
     */
    calculateLuckFactor(stopTiming) {
        // 333ms, 666ms, 999ms付近で停止すると運が良い
        const perfectTimings = [333, 666, 999];
        let minDistance = Math.min(...perfectTimings.map(timing =>
            Math.abs(stopTiming - timing)
        ));

        // 距離が近いほど運が良い（0-1の値）
        return Math.max(0, 1 - (minDistance / 167)); // 167ms以内なら運が良い
    }

    /**
     * 運に基づくシンボル選択
     */
    selectSymbolByLuck(symbols, luckFactor) {
        // 運が良いほど高配当シンボルが選ばれやすい
        const weightedSymbols = symbols.map(symbol => ({
            ...symbol,
            adjustedWeight: symbol.weight * (luckFactor > 0.7 ?
                (symbol.payout > 50 ? 3 : 1) :  // 高配当が3倍出やすい
                (symbol.payout > 50 ? 0.5 : 2)  // 高配当が半分、低配当が2倍
            )
        }));

        const selectedSymbol = this.slotMachine.weightedRandom(weightedSymbols);
        return selectedSymbol;
    }


    /**
     * 手動停止完了処理
     */
    completeManualStop() {
        // 手動停止プロミス解決
        if (this.manualStopPromise) {
            this.manualStopPromise.resolve(this.reelResults);
        }
    }


    /**
     * 手動停止待機
     */
    async waitForManualStops() {
        return new Promise((resolve) => {
            this.manualStopPromise = { resolve };
        });
    }

    /**
     * 結果をスロットに表示
     */
    displayResults(results) {
        const symbols = document.querySelectorAll('.symbol');

        results.forEach((reelResult, reelIndex) => {
            reelResult.forEach((symbolObj, symbolIndex) => {
                const symbolElement = symbols[reelIndex + (symbolIndex * 3)];
                const symbolText = typeof symbolObj === 'string' ? symbolObj : (symbolObj.emoji || '🔷');
                symbolElement.textContent = symbolText;
            });
        });
    }

    /**
     * 停止音再生
     */
    playStopSound() {
        // Web Audio API を使った簡易停止音
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (error) {
            console.log('音声再生スキップ（AudioContext未対応）');
        }
    }

    /**
     * クリーンアップ
     */
    cleanup() {
        // フリーズエフェクト削除
        const freezeOverlay = document.getElementById('freeze-overlay');
        if (freezeOverlay) freezeOverlay.remove();

        // スロットエリアのクラス削除
        const slotArea = document.querySelector('.slot-area');
        if (slotArea) slotArea.classList.remove('time-frozen');

        // シンボルの状態リセット
        document.querySelectorAll('.symbol').forEach(symbol => {
            symbol.style.cursor = 'default';
            symbol.style.filter = '';
            symbol.style.border = '';
            symbol.style.animation = '';
            symbol.style.position = '';
            symbol.classList.remove('manually-stopped');

            // クリックマーカーを削除
            const clickMarker = symbol.querySelector('.click-marker');
            if (clickMarker) {
                clickMarker.remove();
            }

            // イベントハンドラー削除
            const handlers = this.eventHandlers.get(symbol);
            if (handlers) {
                symbol.removeEventListener('click', handlers.click);
                symbol.removeEventListener('touchstart', handlers.touchstart);
                this.eventHandlers.delete(symbol);
            }

            if (symbol.dataset.spinInterval) {
                clearInterval(symbol.dataset.spinInterval);
                delete symbol.dataset.spinInterval;
            }
        });

        // すべてのイベントハンドラーをクリア
        this.eventHandlers.clear();
    }

    /**
     * 使用条件チェック
     */
    validateUsage() {
        const state = this.gameState.getState();

        // 基本的な使用条件
        if (state.coins < state.bet) {
            return false;
        }

        // 他のスキル使用中は不可
        if (this.isActive) {
            return false;
        }

        return true;
    }

    /**
     * スキル効果の説明
     */
    getDescription() {
        return {
            name: 'タイムフリーズ',
            description: '時を止めて各リールを手動で停止！完璧なタイミングで大当たりを狙え！',
            icon: '⏱️',
            rarity: 'Epic',
            tips: [
                '各リールをタップして個別に停止できます',
                '停止タイミングが良いほど高配当シンボルが出やすくなります',
                '333ms、666ms、999ms付近で停止すると運が上がります',
                '左のリールから順番に停止することをお勧めします'
            ]
        };
    }
}