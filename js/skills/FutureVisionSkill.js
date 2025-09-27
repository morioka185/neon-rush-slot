/**
 * フューチャービジョンスキル - 当選する未来へのタイムスリップ
 * 時空を操り、必ず勝利する運命の瞬間にタイムスリップする神の力
 */

export class FutureVisionSkill {
    constructor(gameState, slotMachine, paylineEngine) {
        this.gameState = gameState;
        this.slotMachine = slotMachine;
        this.paylineEngine = paylineEngine;

        this.isActive = false;
        this.futureCache = [];
        this.selectedFuture = null;
        this.visionModal = null;
    }

    /**
     * スキル実行メイン関数
     * 当選する未来にタイムスリップして確実に勝利を手にする
     */
    async execute() {
        this.isActive = true;

        try {
            // タイムスリップ演出開始
            await this.playTimeSlipIntro();

            // 勝利運命の検索
            const winningFuture = await this.findWinningFuture();

            // タイムスリップ実行演出
            await this.executeTimeSlip(winningFuture);

            // 勝利スピンを実行
            const result = await this.executeWinningSpinDirect(winningFuture);

            return {
                type: 'timeSlip',
                winningFuture: winningFuture,
                result: result,
                skillUsed: true
            };

        } finally {
            this.isActive = false;
            this.cleanup();
        }
    }

    /**
     * タイムスリップ導入演出
     */
    async playTimeSlipIntro() {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.className = 'timeslip-intro-overlay';
            overlay.innerHTML = `
                <div class="timeslip-intro-container">
                    <div class="timeslip-title">⏰ TIME SLIP ⏰</div>
                    <div class="timeslip-subtitle">時空を超越して...</div>
                    <div class="timeslip-message">勝利の運命を探索中...</div>
                    <div class="timeslip-particles"></div>
                </div>
            `;

            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: radial-gradient(circle, rgba(0, 255, 255, 0.3) 0%, rgba(0, 0, 100, 0.8) 50%, rgba(0, 0, 0, 0.95) 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                color: #00ffff;
                text-align: center;
                animation: timeWave 2s ease-in-out;
            `;

            overlay.querySelector('.timeslip-title').style.cssText = `
                font-size: 3rem;
                margin-bottom: 1rem;
                text-shadow: 0 0 30px #00ffff;
                animation: timeGlow 1s infinite alternate;
            `;

            overlay.querySelector('.timeslip-subtitle').style.cssText = `
                font-size: 1.5rem;
                margin-bottom: 0.5rem;
                color: #66ffff;
            `;

            overlay.querySelector('.timeslip-message').style.cssText = `
                font-size: 1.2rem;
                color: #ffffff;
                animation: timePulse 1.5s infinite;
            `;

            document.body.appendChild(overlay);

            setTimeout(() => {
                overlay.remove();
                resolve();
            }, 3000);
        });
    }

    /**
     * 勝利運命を検索
     */
    async findWinningFuture() {
        // 複数回の未来検索を行い、最良の勝利を見つける
        let bestWinningFuture = null;
        let maxPayout = 0;

        for (let attempt = 0; attempt < 10; attempt++) {
            const futureResults = await this.calculateFutureSpins();
            const winningFutures = futureResults.filter(future => future.isWin);

            for (const future of winningFutures) {
                if (future.totalPayout > maxPayout) {
                    maxPayout = future.totalPayout;
                    bestWinningFuture = future;
                }
            }
        }

        // 勝利が見つからない場合は確定勝利を生成
        if (!bestWinningFuture) {
            bestWinningFuture = this.generateGuaranteedWin();
        }

        return bestWinningFuture;
    }

    /**
     * タイムスリップ実行演出
     */
    async executeTimeSlip(winningFuture) {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.className = 'timeslip-execution-overlay';
            overlay.innerHTML = `
                <div class="timeslip-execution-container">
                    <div class="timeslip-found">🎯 勝利の運命発見！</div>
                    <div class="future-preview">
                        <div class="preview-title">タイムスリップ先：</div>
                        <div class="preview-grid">
                            ${winningFuture.reels.map(reel =>
                                `<div class="preview-reel">
                                    ${reel.map(symbol =>
                                        `<div class="preview-symbol">${symbol.emoji}</div>`
                                    ).join('')}
                                </div>`
                            ).join('')}
                        </div>
                        <div class="preview-payout">💰 獲得予定：${winningFuture.totalPayout}コイン</div>
                    </div>
                    <div class="timeslip-action">⚡ タイムスリップ実行中... ⚡</div>
                    <div class="time-distortion"></div>
                </div>
            `;

            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(45deg, rgba(255, 0, 255, 0.4), rgba(0, 255, 255, 0.4), rgba(255, 215, 0, 0.4));
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                color: white;
                text-align: center;
                animation: timeDistortion 3s ease-in-out;
                backdrop-filter: blur(2px);
            `;

            // 各要素のスタイル設定
            overlay.querySelector('.timeslip-found').style.cssText = `
                font-size: 2.5rem;
                margin-bottom: 1rem;
                color: #ffff00;
                text-shadow: 0 0 20px #ffff00;
                animation: successGlow 1s infinite alternate;
            `;

            overlay.querySelector('.preview-grid').style.cssText = `
                display: flex;
                gap: 10px;
                justify-content: center;
                margin: 15px 0;
            `;

            overlay.querySelector('.preview-payout').style.cssText = `
                font-size: 1.5rem;
                color: #00ff00;
                font-weight: bold;
                text-shadow: 0 0 15px #00ff00;
                margin-top: 10px;
            `;

            overlay.querySelector('.timeslip-action').style.cssText = `
                font-size: 1.8rem;
                margin-top: 1.5rem;
                color: #ff69b4;
                text-shadow: 0 0 20px #ff69b4;
                animation: timeSlipPulse 0.5s infinite alternate;
            `;

            document.body.appendChild(overlay);

            setTimeout(() => {
                overlay.remove();
                resolve();
            }, 4000);
        });
    }

    /**
     * 勝利スピンを直接実行
     */
    async executeWinningSpinDirect(winningFuture) {
        // ゲーム状態をスピン開始状態に
        this.gameState.startSpin();

        // スピン演出（短縮版）
        await this.playTimeSlipSpinAnimation(winningFuture);

        // 勝利結果を適用
        const wins = this.paylineEngine.checkWin(winningFuture.reels);
        const state = this.gameState.getState();
        const totalPayout = this.paylineEngine.getTotalPayout(wins, state.bet, state.multiplier);

        // ゲーム状態を更新
        this.gameState.endSpin(totalPayout);

        // 勝利演出
        setTimeout(() => {
            this.paylineEngine.highlightWinLines(wins);
        }, 500);

        return {
            reels: winningFuture.reels,
            wins: wins,
            totalPayout: totalPayout
        };
    }

    /**
     * タイムスリップスピンアニメーション
     */
    async playTimeSlipSpinAnimation(winningFuture) {
        const reelElements = this.slotMachine.getReelElements();

        return new Promise(resolve => {
            let currentFrame = 0;
            const totalFrames = 30; // 短縮版

            const animateFrame = () => {
                reelElements.forEach((reel, reelIndex) => {
                    reel.forEach((element, symbolIndex) => {
                        if (currentFrame < totalFrames - 5) {
                            // タイムスリップエフェクト（歪んだアニメーション）
                            const randomSymbol = this.slotMachine.getRandomSymbol();
                            element.textContent = randomSymbol.emoji;
                            element.style.filter = `hue-rotate(${currentFrame * 12}deg) blur(${Math.sin(currentFrame * 0.3)}px)`;
                            element.style.transform = `scale(${1 + Math.sin(currentFrame * 0.5) * 0.1})`;
                        } else {
                            // 最終結果を表示
                            const finalSymbol = winningFuture.reels[reelIndex][symbolIndex];
                            element.textContent = finalSymbol.emoji;
                            element.style.filter = 'none';
                            element.style.transform = 'scale(1)';
                            element.dataset.symbol = finalSymbol.name;
                        }
                    });
                });

                currentFrame++;

                if (currentFrame <= totalFrames) {
                    setTimeout(animateFrame, 50);
                } else {
                    resolve();
                }
            };

            animateFrame();
        });
    }

    /**
     * 確定勝利生成
     */
    generateGuaranteedWin() {
        const symbols = this.slotMachine.getSymbols();
        const highPayoutSymbols = symbols.filter(s => s.payout >= 50);
        const winSymbol = highPayoutSymbols[Math.floor(Math.random() * highPayoutSymbols.length)];

        const reels = [
            [winSymbol, winSymbol, winSymbol],
            [winSymbol, winSymbol, winSymbol],
            [winSymbol, winSymbol, winSymbol]
        ];

        const wins = this.paylineEngine.checkWin(reels);
        const totalPayout = wins.reduce((sum, win) => sum + win.payout, 0);

        return {
            reels: reels,
            symbols: reels.flat(),
            wins: wins,
            totalPayout: totalPayout,
            isWin: true,
            winType: 'jackpot',
            quality: 100,
            rarity: 'Legendary',
            description: '🎆 タイムスリップ大成功！確定勝利！'
        };
    }

    /**
     * 未来の5スピンを計算
     * 現在の乱数シードを基に決定論的に未来を生成
     */
    async calculateFutureSpins() {
        const symbols = this.slotMachine.getSymbols();
        const currentTime = Date.now();
        const futures = [];

        // 各未来スピンを計算
        for (let i = 0; i < 5; i++) {
            const futureSeed = currentTime + (i * 1000) + Math.random() * 500;
            const futureResult = this.generateDeterministicSpin(futureSeed, symbols);

            // 勝利判定 - PaylineEngineを使用
            const wins = this.paylineEngine.checkWin(futureResult.reels);
            const totalPayout = wins.reduce((sum, win) => sum + win.payout, 0);

            futures.push({
                index: i,
                reels: futureResult.reels,
                symbols: futureResult.symbols,
                wins: wins,
                totalPayout: totalPayout,
                isWin: wins.length > 0,
                timestamp: futureSeed,
                winType: this.classifyWin(totalPayout),
                description: this.generateDescription(futureResult, wins)
            });
        }

        // 未来の品質評価
        futures.forEach(future => {
            future.quality = this.evaluateFutureQuality(future);
            future.rarity = this.determineFutureRarity(future);
        });

        return futures;
    }

    /**
     * 決定論的スピン生成
     * シード値から再現可能な結果を作成
     */
    generateDeterministicSpin(seed, symbols) {
        // シード基準の疑似乱数生成器
        const seededRandom = this.createSeededRandom(seed);

        const reels = [];
        const symbolsFlat = [];

        // 3x3グリッドを生成
        for (let reel = 0; reel < 3; reel++) {
            const reelSymbols = [];

            for (let row = 0; row < 3; row++) {
                const randomValue = seededRandom();
                const selectedSymbol = this.selectSymbolByWeight(symbols, randomValue);

                reelSymbols.push(selectedSymbol);
                symbolsFlat.push(selectedSymbol);
            }

            reels.push(reelSymbols);
        }

        return {
            reels: reels,
            symbols: symbolsFlat,
            seed: seed
        };
    }

    /**
     * シード付き乱数生成器
     */
    createSeededRandom(seed) {
        let currentSeed = seed;

        return function() {
            currentSeed = (currentSeed * 9301 + 49297) % 233280;
            return currentSeed / 233280;
        };
    }

    /**
     * 重み付きシンボル選択
     */
    selectSymbolByWeight(symbols, randomValue) {
        const totalWeight = symbols.reduce((sum, symbol) => sum + symbol.weight, 0);
        let currentWeight = 0;
        const targetWeight = randomValue * totalWeight;

        for (const symbol of symbols) {
            currentWeight += symbol.weight;
            if (currentWeight >= targetWeight) {
                return symbol;
            }
        }

        return symbols[symbols.length - 1]; // フォールバック
    }

    /**
     * 勝利タイプ分類
     */
    classifyWin(totalPayout) {
        if (totalPayout === 0) return 'loss';
        if (totalPayout < 5) return 'small';
        if (totalPayout < 20) return 'medium';
        if (totalPayout < 50) return 'big';
        if (totalPayout < 100) return 'huge';
        return 'jackpot';
    }

    /**
     * 未来の品質評価（0-100）
     */
    evaluateFutureQuality(future) {
        let quality = 0;

        // 基本配当
        quality += Math.min(future.totalPayout * 2, 60);

        // 勝利ライン数ボーナス
        quality += future.wins.length * 8;

        // 高配当シンボル数
        const highValueSymbols = future.symbols.filter(s => s.payout > 30).length;
        quality += highValueSymbols * 3;

        // 連続性ボーナス（同じシンボルの連続）
        const consecutiveBonus = this.calculateConsecutiveBonus(future.symbols);
        quality += consecutiveBonus;

        return Math.min(100, quality);
    }

    /**
     * 未来のレアリティ決定
     */
    determineFutureRarity(future) {
        const quality = future.quality;

        if (quality >= 90) return 'Legendary';
        if (quality >= 75) return 'Epic';
        if (quality >= 50) return 'Rare';
        if (quality >= 25) return 'Uncommon';
        return 'Common';
    }

    /**
     * 未来説明生成
     */
    generateDescription(futureResult, wins) {
        if (wins.length === 0) {
            return '惜しい... 次の機会を待とう';
        }

        const totalPayout = wins.reduce((sum, win) => sum + win.payout, 0);

        if (totalPayout >= 100) {
            return '🎆 超大当たり！人生が変わる！';
        } else if (totalPayout >= 50) {
            return '🎉 大当たり！今夜は祝杯だ！';
        } else if (totalPayout >= 20) {
            return '✨ 中当たり！なかなかいい感じ';
        } else if (totalPayout >= 5) {
            return '💰 小当たり！コツコツ積み上げ';
        } else {
            return '😊 当たり！まずまずの結果';
        }
    }

    /**
     * 予知インターフェース表示
     */
    async showVisionInterface(futureResults) {
        return new Promise((resolve) => {
            this.createVisionModal(futureResults, resolve);
        });
    }

    /**
     * 予知モーダル作成
     */
    createVisionModal(futureResults, resolve) {
        // ハズレ未来を除外して当たり未来のみを表示
        const winningFutures = futureResults.filter(future => future.isWin);

        // 当たり未来が0個の場合は最低配当の未来を追加
        if (winningFutures.length === 0) {
            const bestFuture = futureResults.reduce((best, current) =>
                current.totalPayout > best.totalPayout ? current : best, futureResults[0]);
            winningFutures.push(bestFuture);
        }

        const modal = document.createElement('div');
        modal.className = 'future-vision-modal';
        modal.id = 'future-vision-modal';

        modal.innerHTML = `
            <div class="vision-overlay">
                <div class="vision-container">
                    <div class="vision-header">
                        <h2 class="vision-title">👁️ FUTURE VISION 👁️</h2>
                        <p class="vision-subtitle">未来の勝利を覗き見る...</p>
                        <p class="vision-info">🎯 勝利確定の${winningFutures.length}つの未来から選択</p>
                    </div>

                    <div class="vision-grid">
                        ${winningFutures.map((future, index) => this.createFutureCard(future, index)).join('')}
                    </div>

                    <div class="vision-footer">
                        <p class="vision-instruction">💰 どの勝利を選びますか？</p>
                        <button class="vision-cancel">ランダム選択</button>
                    </div>
                </div>
            </div>
        `;

        // レスポンシブスタイリング
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10000;
            overflow-y: auto;
            padding: 10px;
            box-sizing: border-box;
            animation: visionFadeIn 1s ease-out;
        `;

        document.body.appendChild(modal);
        this.visionModal = modal;

        // イベントリスナー設定（勝利未来のみ）
        this.setupVisionEvents(modal, winningFutures, resolve);

        // 予知エフェクト開始
        this.startVisionEffect();
    }

    /**
     * 未来カード作成
     */
    createFutureCard(future, index) {
        const rarityClass = future.rarity.toLowerCase();
        const winTypeClass = future.winType;

        return `
            <div class="future-card ${rarityClass} ${winTypeClass}" data-index="${index}">
                <div class="future-header">
                    <span class="future-label">勝利 ${index + 1}</span>
                    <span class="future-rarity ${rarityClass}">${future.rarity}</span>
                </div>

                <div class="future-grid">
                    ${future.reels.map(reel =>
                        `<div class="future-reel">
                            ${reel.map(symbol =>
                                `<div class="future-symbol">${symbol.emoji}</div>`
                            ).join('')}
                        </div>`
                    ).join('')}
                </div>

                <div class="future-info">
                    <div class="future-payout win">
                        💰 +${future.totalPayout}
                    </div>
                    <div class="future-description">${future.description}</div>
                    <div class="future-quality">
                        <div class="quality-bar">
                            <div class="quality-fill" style="width: ${future.quality}%"></div>
                        </div>
                        <span class="quality-text">品質 ${future.quality}%</span>
                    </div>
                </div>

                <div class="future-select-overlay">
                    <button class="future-select-btn">✨ この勝利を選ぶ</button>
                </div>
            </div>
        `;
    }

    /**
     * 予知イベント設定
     */
    setupVisionEvents(modal, futureResults, resolve) {
        // 未来カード選択
        modal.querySelectorAll('.future-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                this.selectFuture(index, card, resolve);
            });

            // ホバーエフェクト
            card.addEventListener('mouseenter', () => {
                this.highlightFuture(card);
            });

            card.addEventListener('mouseleave', () => {
                this.unhighlightFuture(card);
            });
        });

        // キャンセルボタン（ランダム選択）
        const cancelBtn = modal.querySelector('.vision-cancel');
        cancelBtn.addEventListener('click', () => {
            // 勝利未来からランダムに選択
            const randomIndex = Math.floor(Math.random() * futureResults.length);
            this.selectFuture(randomIndex, null, resolve);
        });
    }

    /**
     * 未来選択処理
     */
    selectFuture(index, cardElement, resolve) {
        this.selectedFuture = index;

        // 選択演出
        if (cardElement) {
            cardElement.classList.add('selected');
            this.playSelectionEffect(cardElement);
        }

        // 他のカードをフェードアウト
        this.visionModal.querySelectorAll('.future-card').forEach((card, i) => {
            if (i !== index) {
                card.style.opacity = '0.3';
                card.style.filter = 'grayscale(100%)';
            }
        });

        // 選択確定演出後に解決
        setTimeout(() => {
            resolve(index);
        }, 2000);
    }

    /**
     * 選択エフェクト再生
     */
    playSelectionEffect(cardElement) {
        const effect = document.createElement('div');
        effect.className = 'selection-effect';
        effect.innerHTML = '⚡ 運命決定 ⚡';

        effect.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #ffd700;
            font-size: 1.5rem;
            font-weight: bold;
            z-index: 100;
            animation: selectionBurst 2s ease-out;
        `;

        cardElement.style.position = 'relative';
        cardElement.appendChild(effect);

        // エフェクト音
        this.playSelectionSound();
    }

    /**
     * 予知エフェクト開始
     */
    startVisionEffect() {
        // 背景の神秘的なエフェクト
        const background = this.visionModal.querySelector('.vision-overlay');

        background.style.cssText = `
            background: radial-gradient(
                circle at 50% 50%,
                rgba(138, 43, 226, 0.4) 0%,
                rgba(75, 0, 130, 0.6) 30%,
                rgba(25, 25, 112, 0.8) 60%,
                rgba(0, 0, 0, 0.95) 100%
            );
            backdrop-filter: blur(5px);
            animation: visionPulse 3s ease-in-out infinite;
            padding: 10px;
            box-sizing: border-box;
            overflow-y: auto;
        `;

        // レスポンシブスタイル追加
        this.addResponsiveStyles();

        // パーティクルエフェクト
        this.createVisionParticles();
    }

    /**
     * レスポンシブスタイル追加
     */
    addResponsiveStyles() {
        if (!document.querySelector('#future-vision-responsive-styles')) {
            const style = document.createElement('style');
            style.id = 'future-vision-responsive-styles';
            style.textContent = `
                .vision-container {
                    max-width: 95vw;
                    max-height: 95vh;
                    margin: auto;
                    padding: 15px;
                    background: rgba(0, 0, 0, 0.9);
                    border: 2px solid #8a2be2;
                    border-radius: 15px;
                    color: white;
                    text-align: center;
                    overflow-y: auto;
                    box-sizing: border-box;
                }

                .vision-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 15px;
                    margin: 20px 0;
                    max-height: 60vh;
                    overflow-y: auto;
                    padding: 10px;
                }

                .future-card {
                    background: rgba(30, 30, 60, 0.8);
                    border: 2px solid #444;
                    border-radius: 10px;
                    padding: 15px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    min-height: 200px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }

                .future-card:hover {
                    transform: scale(1.02);
                    border-color: #8a2be2;
                    box-shadow: 0 5px 20px rgba(138, 43, 226, 0.3);
                }

                .future-grid .future-symbol {
                    font-size: 1.2rem;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .future-reel {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .future-card .future-grid {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                    margin: 10px 0;
                    grid-template-columns: none;
                    max-height: none;
                    overflow: visible;
                    padding: 0;
                }

                .vision-title {
                    font-size: 2rem;
                    margin-bottom: 10px;
                    text-shadow: 0 0 20px #8a2be2;
                }

                .vision-subtitle, .vision-info {
                    font-size: 1rem;
                    margin-bottom: 5px;
                    color: #ccc;
                }

                .future-payout.win {
                    color: #00ff00;
                    font-size: 1.2rem;
                    font-weight: bold;
                    text-shadow: 0 0 10px #00ff00;
                }

                @media (max-width: 768px) {
                    .vision-container {
                        padding: 10px;
                        max-width: 98vw;
                    }

                    .vision-grid {
                        grid-template-columns: 1fr;
                        gap: 10px;
                        max-height: 50vh;
                    }

                    .vision-title {
                        font-size: 1.5rem;
                    }

                    .future-card {
                        min-height: 150px;
                        padding: 10px;
                    }

                    .future-grid .future-symbol {
                        font-size: 1rem;
                        width: 25px;
                        height: 25px;
                    }
                }

                @media (max-width: 480px) {
                    .vision-container {
                        padding: 8px;
                    }

                    .vision-title {
                        font-size: 1.2rem;
                    }

                    .future-card {
                        min-height: 120px;
                        padding: 8px;
                    }

                    .future-grid .future-symbol {
                        font-size: 0.9rem;
                        width: 20px;
                        height: 20px;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * 予知パーティクル作成
     */
    createVisionParticles() {
        const particleContainer = document.createElement('div');
        particleContainer.className = 'vision-particles';
        particleContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            overflow: hidden;
        `;

        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'vision-particle';
            particle.textContent = ['✨', '🔮', '👁️', '⭐', '💫'][Math.floor(Math.random() * 5)];

            particle.style.cssText = `
                position: absolute;
                font-size: ${Math.random() * 20 + 10}px;
                color: rgba(255, 255, 255, ${Math.random() * 0.5 + 0.3});
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: particleFloat ${Math.random() * 3 + 2}s ease-in-out infinite;
                animation-delay: ${Math.random() * 2}s;
            `;

            particleContainer.appendChild(particle);
        }

        this.visionModal.querySelector('.vision-overlay').appendChild(particleContainer);
    }

    /**
     * 未来ハイライト
     */
    highlightFuture(cardElement) {
        cardElement.style.transform = 'scale(1.05)';
        cardElement.style.boxShadow = '0 0 30px rgba(138, 43, 226, 0.6)';
        cardElement.style.zIndex = '10';
    }

    /**
     * 未来ハイライト解除
     */
    unhighlightFuture(cardElement) {
        if (!cardElement.classList.contains('selected')) {
            cardElement.style.transform = 'scale(1)';
            cardElement.style.boxShadow = '';
            cardElement.style.zIndex = '';
        }
    }

    /**
     * 選択音再生
     */
    playSelectionSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // 神秘的な選択音
            const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
            frequencies.forEach((freq, index) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.1);
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0, audioContext.currentTime + index * 0.1);
                gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + index * 0.1 + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.1 + 0.5);

                oscillator.start(audioContext.currentTime + index * 0.1);
                oscillator.stop(audioContext.currentTime + index * 0.1 + 0.5);
            });
        } catch (error) {
            console.log('音声再生スキップ（AudioContext未対応）');
        }
    }

    /**
     * 連続性ボーナス計算
     */
    calculateConsecutiveBonus(symbols) {
        let bonus = 0;
        const symbolMap = new Map();

        // シンボル出現回数カウント
        symbols.forEach(symbol => {
            symbolMap.set(symbol.emoji, (symbolMap.get(symbol.emoji) || 0) + 1);
        });

        // 連続出現ボーナス
        symbolMap.forEach(count => {
            if (count >= 3) bonus += count * 2;
            if (count >= 6) bonus += count * 3; // 6個以上で大ボーナス
        });

        return bonus;
    }

    /**
     * クリーンアップ
     */
    cleanup() {
        if (this.visionModal) {
            this.visionModal.remove();
            this.visionModal = null;
        }

        this.futureCache = [];
        this.selectedFuture = null;
    }

    /**
     * 使用条件チェック
     */
    validateUsage() {
        const state = this.gameState.getState();

        if (state.coins < state.bet) {
            return false;
        }

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
            name: 'フューチャービジョン',
            description: '時空を操り、必ず勝利する運命の瞬間にタイムスリップ！',
            icon: '⏰',
            rarity: 'Legendary',
            tips: [
                '自動で最良の勝利運命を検索します',
                '100%確実に勝利が保証されます',
                'タイムスリップ演出で時空を超越',
                '運命を変える究極の神スキル'
            ]
        };
    }
}