/**
 * ミラクルスピンスキル - 奇跡を呼ぶ究極のスピン
 * 確定大当たり！神の力で運命を変える最強スキル
 */

export class MiracleSpinSkill {
    constructor(gameState, slotMachine) {
        this.gameState = gameState;
        this.slotMachine = slotMachine;

        this.isActive = false;
        this.miracleTypes = [
            'JACKPOT_777',      // 7️⃣で全ライン当選
            'DIAMOND_RUSH',     // 💎の大量出現
            'LIGHTNING_STORM',  // ⚡の連鎖爆発
            'DIVINE_BLESSING',  // 最高配当の組み合わせ
            'COSMIC_ALIGNMENT'  // 全シンボル最適配置
        ];
    }

    /**
     * スキル実行メイン関数
     * 確定大当たりの奇跡を起こす
     */
    async execute() {
        this.isActive = true;

        try {
            // 奇跡のタイプを決定
            const miracleType = this.selectMiracleType();

            // 奇跡演出開始
            await this.startMiracleSequence(miracleType);

            // 確定大当たり結果生成
            const miracleResult = this.generateMiracleResult(miracleType);

            // 奇跡の実行
            const finalResult = await this.executeMiracle(miracleResult);

            return {
                type: 'miracleSpin',
                miracleType: miracleType,
                reelResult: finalResult.reels,
                winAmount: finalResult.totalWin,
                specialMultiplier: finalResult.multiplier,
                isMiracleWin: true,
                description: finalResult.description,
                skillUsed: true
            };

        } finally {
            this.isActive = false;
        }
    }

    /**
     * 奇跡タイプ選択
     * プレイヤーの状況に応じて最適な奇跡を決定
     */
    selectMiracleType() {
        const state = this.gameState.getState();
        const heatLevel = state.heatGauge;
        const coinsRatio = state.coins / state.maxCoins;

        // 熱量とコイン状況で奇跡の強さを決定
        if (heatLevel >= 80 || coinsRatio <= 0.1) {
            // 最強奇跡（絶体絶命時）
            return this.miracleTypes[Math.floor(Math.random() * 2)]; // JACKPOT or DIAMOND
        } else if (heatLevel >= 50) {
            // 強力奇跡
            return this.miracleTypes[Math.floor(Math.random() * 3)]; // 上位3種
        } else {
            // 通常奇跡
            return this.miracleTypes[Math.floor(Math.random() * this.miracleTypes.length)];
        }
    }

    /**
     * 奇跡シーケンス開始
     * 華麗な演出で期待値を最大まで高める
     */
    async startMiracleSequence(miracleType) {
        // 画面全体を神々しく
        await this.createDivineAtmosphere();

        // 奇跡予告演出
        await this.showMiracleAnnouncement(miracleType);

        // 宇宙規模のエフェクト
        await this.executeCosmicEffect();

        // 神の声（効果音）
        await this.playDivineSound();
    }

    /**
     * 神々しい雰囲気作成
     */
    async createDivineAtmosphere() {
        return new Promise(resolve => {
            const divineOverlay = document.createElement('div');
            divineOverlay.id = 'divine-atmosphere';
            divineOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: radial-gradient(
                    circle at 50% 50%,
                    rgba(255, 215, 0, 0.3) 0%,
                    rgba(255, 20, 147, 0.2) 30%,
                    rgba(138, 43, 226, 0.2) 60%,
                    rgba(0, 0, 0, 0.8) 100%
                );
                z-index: 8000;
                animation: divine-pulse 3s ease-in-out infinite;
            `;

            document.body.appendChild(divineOverlay);

            // 神々しいパーティクル生成
            this.createDivineParticles(divineOverlay);

            setTimeout(() => {
                resolve();
            }, 2000);
        });
    }

    /**
     * 神々しいパーティクル
     */
    createDivineParticles(container) {
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.textContent = ['✨', '⭐', '💫', '🌟', '✊'][Math.floor(Math.random() * 5)];

            particle.style.cssText = `
                position: absolute;
                font-size: ${Math.random() * 30 + 20}px;
                color: rgba(255, 215, 0, ${Math.random() * 0.8 + 0.2});
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                pointer-events: none;
                animation: divine-float ${Math.random() * 4 + 3}s ease-in-out infinite;
                animation-delay: ${Math.random() * 2}s;
                text-shadow: 0 0 20px currentColor;
            `;

            container.appendChild(particle);
        }
    }

    /**
     * 奇跡予告演出
     */
    async showMiracleAnnouncement(miracleType) {
        return new Promise(resolve => {
            const announcement = document.createElement('div');
            announcement.className = 'miracle-announcement';

            const messages = {
                'JACKPOT_777': '🎰 LUCKY SEVEN JACKPOT 🎰',
                'DIAMOND_RUSH': '💎 DIAMOND RUSH INCOMING 💎',
                'LIGHTNING_STORM': '⚡ LIGHTNING STORM CHAOS ⚡',
                'DIVINE_BLESSING': '🙏 DIVINE BLESSING ACTIVATED 🙏',
                'COSMIC_ALIGNMENT': '🌌 COSMIC ALIGNMENT ACHIEVED 🌌'
            };

            announcement.innerHTML = `
                <div class="miracle-title">${messages[miracleType]}</div>
                <div class="miracle-subtitle">奇跡が今、起こる...</div>
            `;

            announcement.style.cssText = `
                position: fixed;
                top: 30%;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(45deg, #ffd700, #ff69b4, #9370db);
                background-size: 300% 300%;
                background-clip: text;
                -webkit-background-clip: text;
                color: transparent;
                font-size: 2.5rem;
                font-weight: 900;
                text-align: center;
                text-shadow: 0 0 30px #ffd700;
                z-index: 8001;
                animation: miracle-announce 3s ease-out, gradient-shift 2s ease-in-out infinite;
            `;

            document.body.appendChild(announcement);

            setTimeout(() => {
                announcement.remove();
                resolve();
            }, 3000);
        });
    }

    /**
     * 宇宙規模のエフェクト
     */
    async executeCosmicEffect() {
        return new Promise(resolve => {
            // 画面震動エフェクト
            document.body.style.animation = 'cosmic-shake 1s ease-in-out 3';

            // リール部分に特別エフェクト
            const slotArea = document.querySelector('.slot-area');
            if (slotArea) {
                slotArea.style.animation = 'miracle-charge 2s ease-in-out';
                slotArea.style.filter = 'brightness(1.5) contrast(1.2) saturate(1.8)';
            }

            setTimeout(() => {
                document.body.style.animation = '';
                if (slotArea) {
                    slotArea.style.animation = '';
                    slotArea.style.filter = '';
                }
                resolve();
            }, 2000);
        });
    }

    /**
     * 神の声（効果音）
     */
    async playDivineSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // 神々しいコード進行 (C-F-Am-G)
            const chordProgression = [
                [261.63, 329.63, 392.00], // C major
                [349.23, 440.00, 523.25], // F major
                [220.00, 261.63, 329.63], // A minor
                [196.00, 246.94, 293.66]  // G major
            ];

            chordProgression.forEach((chord, chordIndex) => {
                chord.forEach((frequency, noteIndex) => {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);

                    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + chordIndex * 0.5);
                    oscillator.type = 'sine';

                    const startTime = audioContext.currentTime + chordIndex * 0.5;
                    gainNode.gain.setValueAtTime(0, startTime);
                    gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.1);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.8);

                    oscillator.start(startTime);
                    oscillator.stop(startTime + 0.8);
                });
            });
        } catch (error) {
            console.log('音声再生スキップ（AudioContext未対応）');
        }
    }

    /**
     * 奇跡結果生成
     * 各奇跡タイプに応じた確定大当たりパターンを作成
     */
    generateMiracleResult(miracleType) {
        const symbols = this.slotMachine.getSymbols();

        switch (miracleType) {
            case 'JACKPOT_777':
                return this.generateJackpot777();

            case 'DIAMOND_RUSH':
                return this.generateDiamondRush();

            case 'LIGHTNING_STORM':
                return this.generateLightningStorm();

            case 'DIVINE_BLESSING':
                return this.generateDivineBlessing();

            case 'COSMIC_ALIGNMENT':
                return this.generateCosmicAlignment();

            default:
                return this.generateDivineBlessing();
        }
    }

    /**
     * ラッキーセブン大当たり
     * 7️⃣で全ライン制覇
     */
    generateJackpot777() {
        const seven = this.slotMachine.getSymbols().find(s => s.emoji === '7️⃣');

        return {
            reels: [
                [seven, seven, seven],
                [seven, seven, seven],
                [seven, seven, seven]
            ],
            totalWin: seven.payout * 5 * 3, // 5ライン × 3倍ボーナス
            multiplier: 7.77, // ラッキーセブン倍率
            description: '🎰 PERFECT SEVEN JACKPOT! 🎰\n全ライン777で究極の大当たり！'
        };
    }

    /**
     * ダイヤモンドラッシュ
     * 💎が大量出現する夢の組み合わせ
     */
    generateDiamondRush() {
        const diamond = this.slotMachine.getSymbols().find(s => s.emoji === '💎');
        const crystal = this.slotMachine.getSymbols().find(s => s.emoji === '🔷');

        return {
            reels: [
                [diamond, crystal, diamond],
                [crystal, diamond, crystal],
                [diamond, crystal, diamond]
            ],
            totalWin: (diamond.payout * 6 + crystal.payout * 3),
            multiplier: 5.55,
            description: '💎 DIAMOND RUSH ACTIVATED! 💎\nダイヤモンドとクリスタルの豪華絢爛！'
        };
    }

    /**
     * ライトニングストーム
     * ⚡の連鎖で電撃的勝利
     */
    generateLightningStorm() {
        const lightning = this.slotMachine.getSymbols().find(s => s.emoji === '⚡');
        const fire = this.slotMachine.getSymbols().find(s => s.emoji === '🔥');

        return {
            reels: [
                [lightning, fire, lightning],
                [fire, lightning, fire],
                [lightning, fire, lightning]
            ],
            totalWin: (lightning.payout * 5 + fire.payout * 4),
            multiplier: 4.44,
            description: '⚡ LIGHTNING STORM CHAOS! ⚡\n雷と炎の破壊的コンボレーション！'
        };
    }

    /**
     * 神の祝福
     * 最高配当シンボルの理想的配置
     */
    generateDivineBlessing() {
        const symbols = this.slotMachine.getSymbols();
        const topSymbols = symbols
            .filter(s => s.payout >= 50)
            .sort((a, b) => b.payout - a.payout)
            .slice(0, 3);

        return {
            reels: [
                [topSymbols[0], topSymbols[1], topSymbols[0]],
                [topSymbols[1], topSymbols[0], topSymbols[1]],
                [topSymbols[0], topSymbols[1], topSymbols[2]]
            ],
            totalWin: topSymbols.reduce((sum, symbol) => sum + symbol.payout, 0) * 2,
            multiplier: 6.66,
            description: '🙏 DIVINE BLESSING RECEIVED! 🙏\n神々の祝福で最高配当の大当たり！'
        };
    }

    /**
     * 宇宙の調和
     * 全シンボルが美しく調和した奇跡の配置
     */
    generateCosmicAlignment() {
        const symbols = this.slotMachine.getSymbols();
        const selectedSymbols = symbols.filter(s => s.payout >= 30).slice(0, 4);

        return {
            reels: [
                [selectedSymbols[0], selectedSymbols[1], selectedSymbols[2]],
                [selectedSymbols[1], selectedSymbols[2], selectedSymbols[3]],
                [selectedSymbols[2], selectedSymbols[3], selectedSymbols[0]]
            ],
            totalWin: selectedSymbols.reduce((sum, symbol) => sum + symbol.payout, 0) * 1.5,
            multiplier: 8.88,
            description: '🌌 COSMIC ALIGNMENT ACHIEVED! 🌌\n宇宙の調和による神秘的大当たり！'
        };
    }

    /**
     * 奇跡の実行
     * 生成された結果を実際のゲームに適用
     */
    async executeMiracle(miracleResult) {
        // 既存のオーバーレイをクリーンアップ
        this.cleanup();
        // 奇跡のスピン演出
        await this.performMiracleSpinAnimation();

        // 結果をスロットに表示
        this.displayMiracleResult(miracleResult);

        // 勝利演出
        await this.celebrateMiracle(miracleResult);

        // 最終的な配当計算
        const state = this.gameState.getState();
        const finalWin = Math.floor(
            miracleResult.totalWin *
            state.bet *
            state.multiplier *
            miracleResult.multiplier
        );

        return {
            reels: miracleResult.reels,
            totalWin: finalWin,
            multiplier: miracleResult.multiplier,
            description: miracleResult.description
        };
    }

    /**
     * 奇跡のスピン演出
     */
    async performMiracleSpinAnimation() {
        return new Promise(resolve => {
            const symbols = document.querySelectorAll('.symbol');

            // 全シンボルに特別エフェクト
            symbols.forEach((symbol, index) => {
                symbol.style.animation = `miracle-spin 0.1s linear infinite`;
                symbol.style.filter = 'brightness(2) hue-rotate(${index * 40}deg)';

                // 虹色に変化するシンボル
                const colors = ['🌈', '✨', '💫', '⭐', '🌟'];
                let colorIndex = 0;

                const colorInterval = setInterval(() => {
                    symbol.textContent = colors[colorIndex % colors.length];
                    colorIndex++;
                }, 50);

                // 1秒後に停止
                setTimeout(() => {
                    clearInterval(colorInterval);
                    symbol.style.animation = '';
                    symbol.style.filter = '';
                }, 1000);
            });

            setTimeout(() => {
                resolve();
            }, 1000);
        });
    }

    /**
     * 奇跡結果の表示
     */
    displayMiracleResult(miracleResult) {
        const symbols = document.querySelectorAll('.symbol');

        miracleResult.reels.forEach((reel, reelIndex) => {
            reel.forEach((symbol, symbolIndex) => {
                const symbolElement = symbols[reelIndex + (symbolIndex * 3)];
                symbolElement.textContent = symbol.emoji;

                // 特別な光るエフェクト
                symbolElement.style.animation = 'miracle-glow 1s ease-in-out infinite alternate';
                symbolElement.style.textShadow = `
                    0 0 10px ${symbol.emoji === '7️⃣' ? '#ffd700' : '#ff69b4'},
                    0 0 20px ${symbol.emoji === '7️⃣' ? '#ffd700' : '#ff69b4'},
                    0 0 30px ${symbol.emoji === '7️⃣' ? '#ffd700' : '#ff69b4'}
                `;
            });
        });
    }

    /**
     * 奇跡の祝福演出
     */
    async celebrateMiracle(miracleResult) {
        return new Promise(resolve => {
            // 大勝利アナウンス
            const celebrationDiv = document.createElement('div');
            celebrationDiv.className = 'miracle-celebration';

            celebrationDiv.innerHTML = `
                <div class="miracle-win-title">🎆 MIRACLE WIN! 🎆</div>
                <div class="miracle-win-amount">×${miracleResult.multiplier.toFixed(2)} MULTIPLIER!</div>
                <div class="miracle-win-description">${miracleResult.description}</div>
                <div class="miracle-particles-burst"></div>
            `;

            celebrationDiv.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                background: rgba(0, 0, 0, 0.9);
                color: #ffd700;
                text-align: center;
                z-index: 9000;
                animation: celebration-burst 4s ease-out;
            `;

            document.body.appendChild(celebrationDiv);

            // 花火エフェクト
            this.createFireworks(celebrationDiv);

            // お祝い音楽
            this.playCelebrationMusic();

            setTimeout(() => {
                celebrationDiv.remove();
                resolve();
            }, 2000);
        });
    }

    /**
     * 花火エフェクト
     */
    createFireworks(container) {
        for (let i = 0; i < 30; i++) {
            const firework = document.createElement('div');
            firework.textContent = ['🎆', '🎇', '✨', '💥', '🌟'][Math.floor(Math.random() * 5)];

            firework.style.cssText = `
                position: absolute;
                font-size: ${Math.random() * 40 + 30}px;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: firework-burst ${Math.random() * 2 + 1}s ease-out;
                animation-delay: ${Math.random() * 3}s;
                pointer-events: none;
            `;

            container.appendChild(firework);
        }
    }

    /**
     * お祝い音楽
     */
    playCelebrationMusic() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // 勝利のファンファーレ
            const fanfareNotes = [
                261.63, 329.63, 392.00, 523.25, // C-E-G-C
                349.23, 440.00, 523.25, 659.25, // F-A-C-E
                293.66, 369.99, 440.00, 587.33  // D-F#-A-D
            ];

            fanfareNotes.forEach((frequency, index) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + index * 0.2);
                oscillator.type = 'square';

                const startTime = audioContext.currentTime + index * 0.2;
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

                oscillator.start(startTime);
                oscillator.stop(startTime + 0.4);
            });
        } catch (error) {
            console.log('音声再生スキップ（AudioContext未対応）');
        }
    }

    /**
     * クリーンアップ
     */
    cleanup() {
        // 神々しいオーバーレイ削除
        const divineAtmosphere = document.getElementById('divine-atmosphere');
        if (divineAtmosphere) divineAtmosphere.remove();

        // シンボルエフェクト削除
        document.querySelectorAll('.symbol').forEach(symbol => {
            symbol.style.animation = '';
            symbol.style.filter = '';
            symbol.style.textShadow = '';
        });
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
            name: 'ミラクルスピン',
            description: '神の力で確定大当たり！奇跡の力で運命を変える究極スキル',
            icon: '✨',
            rarity: 'Mythical',
            tips: [
                '100%確定で大当たりします',
                '特別な倍率ボーナスが付きます',
                'ヒート値が高いほど強力な奇跡が発生',
                '絶体絶命の時ほど最強の奇跡が起こります'
            ]
        };
    }
}