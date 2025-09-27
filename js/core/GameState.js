/**
 * ゲーム状態管理クラス
 * 全てのゲームデータを一元管理し、状態変更を監視
 */

export class GameState {
    constructor() {
        this.state = {
            coins: 10000,
            bet: 100,
            stage: 1,
            multiplier: 1.0,
            heatGauge: 0,
            totalSpins: 0,
            maxCoins: 10000,
            consecutiveWins: 0,

            skills: {
                timeFreeze: 1,
                futureVision: 1,
                miracleSpin: 1
            },

            isSpinning: false,
            gameOver: false,
            feverMode: false,
            godMode: false,

            // 統計情報
            stats: {
                totalWins: 0,
                totalLosses: 0,
                biggestWin: 0,
                skillsUsed: 0,
                specialBetsWon: 0
            }
        };

        this.listeners = new Map();
        this.history = [];
    }

    // イベント購読
    subscribe(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    // イベント発火
    emit(event, data = null) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`イベント実行エラー (${event}):`, error);
                }
            });
        }
    }

    // 状態更新
    setState(newState) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...newState };

        // 履歴記録
        this.history.push({
            timestamp: Date.now(),
            oldState: oldState,
            newState: { ...this.state },
            changes: Object.keys(newState)
        });

        // 履歴上限管理
        if (this.history.length > 100) {
            this.history.shift();
        }

        // 特別なイベント検出
        this.checkSpecialEvents(oldState, this.state);

        // 汎用状態変更イベント
        this.emit('stateChange', {
            oldState,
            newState: this.state,
            changes: newState
        });

        // 自動保存
        this.save();
    }

    // 特別なイベント検出
    checkSpecialEvents(oldState, newState) {
        // ゲームオーバー
        if (!oldState.gameOver && newState.gameOver) {
            this.emit('gameOver', newState);
        }

        // ステージアップ
        if (oldState.stage < newState.stage) {
            this.emit('stageUp', { from: oldState.stage, to: newState.stage });
        }

        // 最高コイン更新
        if (newState.coins > oldState.maxCoins) {
            this.setState({ maxCoins: newState.coins });
            this.emit('newRecord', { coins: newState.coins });
        }

        // FEVER MODE開始
        if (!oldState.feverMode && newState.feverMode) {
            this.emit('feverStart', newState);
        }

        // GOD MODE開始（コイン数が初期値の10倍）
        if (newState.coins >= 100000 && !newState.godMode) {
            this.setState({ godMode: true });
            this.emit('godModeStart', newState);
        }

        // ヒートゲージ満タン
        if (oldState.heatGauge < 100 && newState.heatGauge >= 100) {
            this.emit('heatMaxed', newState);
        }

        // 破産チェック
        if (newState.coins < newState.bet && !newState.gameOver) {
            this.setState({ gameOver: true });
        }
    }

    // 状態取得
    getState() {
        return { ...this.state };
    }

    // スピン処理
    processSpin(betAmount) {
        if (this.state.coins < betAmount) {
            throw new Error('コイン不足です');
        }

        if (this.state.isSpinning) {
            throw new Error('既にスピン中です');
        }

        this.setState({
            coins: this.state.coins - betAmount,
            totalSpins: this.state.totalSpins + 1,
            isSpinning: true
        });
    }

    // 勝利処理
    processWin(winAmount) {
        const totalWin = winAmount * this.state.multiplier;

        this.setState({
            coins: this.state.coins + totalWin,
            consecutiveWins: this.state.consecutiveWins + 1,
            heatGauge: Math.min(100, this.state.heatGauge + 10),
            stats: {
                ...this.state.stats,
                totalWins: this.state.stats.totalWins + 1,
                biggestWin: Math.max(this.state.stats.biggestWin, totalWin)
            }
        });

        return totalWin;
    }

    // 敗北処理
    processLoss() {
        this.setState({
            consecutiveWins: 0,
            heatGauge: Math.max(0, this.state.heatGauge - 5),
            stats: {
                ...this.state.stats,
                totalLosses: this.state.stats.totalLosses + 1
            }
        });
    }

    // スキル使用
    useSkill(skillName) {
        if (this.state.skills[skillName] <= 0) {
            throw new Error(`${skillName}の使用回数が不足しています`);
        }

        this.setState({
            skills: {
                ...this.state.skills,
                [skillName]: this.state.skills[skillName] - 1
            },
            stats: {
                ...this.state.stats,
                skillsUsed: this.state.stats.skillsUsed + 1
            }
        });
    }

    // ステージアップチェック
    checkStageUp() {
        const coinsThreshold = [
            0,      // Stage 1
            25000,  // Stage 2
            75000,  // Stage 3
            200000, // Stage 4
            500000  // Stage 5
        ];

        for (let i = coinsThreshold.length - 1; i >= 0; i--) {
            if (this.state.coins >= coinsThreshold[i] && this.state.stage < i + 1) {
                this.setState({ stage: i + 1 });

                // ステージアップ報酬
                this.giveStageRewards(i + 1);
                break;
            }
        }
    }

    // ステージ報酬
    giveStageRewards(stage) {
        const rewards = {
            2: { timeFreeze: 1, futureVision: 1 },
            3: { miracleSpin: 1, timeFreeze: 1 },
            4: { futureVision: 2, miracleSpin: 1 },
            5: { timeFreeze: 3, futureVision: 3, miracleSpin: 2 }
        };

        if (rewards[stage]) {
            const newSkills = { ...this.state.skills };
            Object.keys(rewards[stage]).forEach(skill => {
                newSkills[skill] += rewards[stage][skill];
            });

            this.setState({ skills: newSkills });
        }
    }

    // データ保存
    save() {
        try {
            const saveData = {
                ...this.state,
                timestamp: Date.now(),
                version: '1.0'
            };
            localStorage.setItem('neonRush_gameState', JSON.stringify(saveData));
        } catch (error) {
            console.error('セーブエラー:', error);
        }
    }

    // データ読み込み
    async load() {
        try {
            const savedData = localStorage.getItem('neonRush_gameState');
            if (savedData) {
                const parsed = JSON.parse(savedData);

                // バージョンチェック・マイグレーション
                if (parsed.version === '1.0') {
                    this.state = { ...this.state, ...parsed };
                    delete this.state.timestamp;
                    delete this.state.version;
                }
            }
        } catch (error) {
            console.error('ロードエラー:', error);
            // デフォルト状態を維持
        }
    }

    // データリセット
    reset() {
        this.state = {
            coins: 10000,
            bet: 100,
            stage: 1,
            multiplier: 1.0,
            heatGauge: 0,
            totalSpins: 0,
            maxCoins: 10000,
            consecutiveWins: 0,

            skills: {
                timeFreeze: 1,
                futureVision: 1,
                miracleSpin: 1
            },

            isSpinning: false,
            gameOver: false,
            feverMode: false,
            godMode: false,

            stats: {
                totalWins: 0,
                totalLosses: 0,
                biggestWin: 0,
                skillsUsed: 0,
                specialBetsWon: 0
            }
        };

        this.history = [];
        localStorage.removeItem('neonRush_gameState');
        this.emit('gameReset', this.state);
    }

    // デバッグ用：状態履歴表示
    getHistory() {
        return this.history;
    }

    // デバッグ用：チート機能
    cheat(cheatCode) {
        if (process.env.NODE_ENV === 'development') {
            switch (cheatCode) {
                case 'RICH':
                    this.setState({ coins: 1000000 });
                    break;
                case 'SKILLS':
                    this.setState({
                        skills: {
                            timeFreeze: 10,
                            futureVision: 10,
                            miracleSpin: 10
                        }
                    });
                    break;
                case 'FEVER':
                    this.setState({
                        feverMode: true,
                        multiplier: 5.0,
                        heatGauge: 100
                    });
                    break;
            }
        }
    }
}