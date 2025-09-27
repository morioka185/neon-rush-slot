/**
 * 特殊ベットシステム - 脳汁止まらないハイリスク・ハイリターン機能
 * プレイヤーが「もう一回！」と叫び続ける中毒性の塊
 */

import { DoubleOrNothingFeature } from './DoubleOrNothingFeature.js';
import { AllOrNothingFeature } from './AllOrNothingFeature.js';
import { RiskBetFeature } from './RiskBetFeature.js';

export class SpecialBetSystem {
    constructor(gameState) {
        this.gameState = gameState;

        // 各特殊ベット機能のインスタンス
        this.features = {
            doubleOrNothing: new DoubleOrNothingFeature(gameState),
            allOrNothing: new AllOrNothingFeature(gameState),
            riskBet: new RiskBetFeature(gameState)
        };

        this.isActive = false;
        this.currentFeature = null;
        this.history = [];
    }

    /**
     * 特殊ベット提案
     * 勝利時に適切な特殊ベットを提案
     */
    async offerSpecialBets(winAmount) {
        const state = this.gameState.getState();

        // 提案可能な特殊ベットを決定
        const availableBets = this.getAvailableBets(winAmount, state);

        if (availableBets.length === 0) {
            return null;
        }

        // プレイヤーに選択肢を提示
        return await this.showBetSelectionDialog(availableBets, winAmount);
    }

    /**
     * 利用可能な特殊ベット判定
     */
    getAvailableBets(winAmount, state) {
        const bets = [];

        // DOUBLE OR NOTHING（小〜中当たりで提案）
        if (winAmount >= 2 && winAmount <= 50) {
            bets.push({
                type: 'doubleOrNothing',
                name: 'DOUBLE OR NOTHING',
                description: '50%の確率で配当が2倍に！失敗すると没収',
                riskLevel: 'Medium',
                icon: '🎯',
                minWin: 2,
                maxWin: 50
            });
        }

        // RISK BET（中当たりで提案）
        if (winAmount >= 10 && winAmount <= 100) {
            bets.push({
                type: 'riskBet',
                name: 'RISK BET',
                description: '30%で3倍、70%で没収のハイリスクベット',
                riskLevel: 'High',
                icon: '⚡',
                minWin: 10,
                maxWin: 100
            });
        }

        // ALL OR NOTHING（大当たりまたは破産寸前で提案）
        if (winAmount >= 50 || state.coins <= state.bet * 3) {
            bets.push({
                type: 'allOrNothing',
                name: 'ALL OR NOTHING',
                description: '全財産を賭けて一発逆転！20%で5倍の奇跡',
                riskLevel: 'Extreme',
                icon: '💀',
                minWin: 1,
                maxWin: Infinity
            });
        }

        return bets;
    }

    /**
     * ベット選択ダイアログ表示
     */
    async showBetSelectionDialog(availableBets, winAmount) {
        return new Promise((resolve) => {
            const dialog = this.createBetDialog(availableBets, winAmount, resolve);
            document.body.appendChild(dialog);

            // 10秒後に自動キャンセル
            setTimeout(() => {
                if (dialog.parentNode) {
                    dialog.remove();
                    resolve(null);
                }
            }, 10000);
        });
    }

    /**
     * ベットダイアログ作成
     */
    createBetDialog(availableBets, winAmount, resolve) {
        const dialog = document.createElement('div');
        dialog.className = 'special-bet-dialog';
        dialog.id = 'special-bet-dialog';

        dialog.innerHTML = `
            <div class="bet-overlay">
                <div class="bet-container">
                    <div class="bet-header">
                        <h2 class="bet-title">🎲 SPECIAL BET OPPORTUNITY 🎲</h2>
                        <p class="bet-subtitle">現在の配当: <span class="win-amount">+${winAmount}</span></p>
                        <p class="bet-warning">⚠️ ハイリスク・ハイリターンの世界へようこそ ⚠️</p>
                    </div>

                    <div class="bet-options">
                        ${availableBets.map(bet => this.createBetOption(bet)).join('')}
                    </div>

                    <div class="bet-footer">
                        <button class="bet-cancel">配当を受け取る</button>
                        <div class="bet-timer">
                            <span class="timer-text">残り時間: </span>
                            <span class="timer-count" id="bet-timer">10</span>
                            <span>秒</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // スタイリング
        dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10000;
            animation: betDialogIn 0.5s ease-out;
        `;

        // イベントリスナー設定
        this.setupBetDialogEvents(dialog, availableBets, resolve);

        // カウントダウン開始
        this.startBetTimer(dialog);

        return dialog;
    }

    /**
     * ベットオプション作成
     */
    createBetOption(bet) {
        const riskColors = {
            'Medium': '#ffa500',
            'High': '#ff4500',
            'Extreme': '#dc143c'
        };

        return `
            <div class="bet-option" data-type="${bet.type}">
                <div class="bet-option-header">
                    <span class="bet-icon">${bet.icon}</span>
                    <span class="bet-name">${bet.name}</span>
                    <span class="bet-risk" style="color: ${riskColors[bet.riskLevel]}">${bet.riskLevel}</span>
                </div>
                <div class="bet-description">${bet.description}</div>
                <div class="bet-stats">
                    <div class="success-rate">${this.calculateSuccessRate(bet.type)}% 成功率</div>
                    <div class="potential-reward">最大 ${this.calculateMaxReward(bet.type)}倍</div>
                </div>
                <button class="bet-select-btn">このベットを選ぶ</button>
            </div>
        `;
    }

    /**
     * ベットダイアログイベント設定
     */
    setupBetDialogEvents(dialog, availableBets, resolve) {
        // ベット選択
        dialog.querySelectorAll('.bet-option').forEach(option => {
            option.addEventListener('click', () => {
                const betType = option.dataset.type;
                const selectedBet = availableBets.find(bet => bet.type === betType);

                this.selectBet(selectedBet, dialog, resolve);
            });
        });

        // キャンセルボタン
        dialog.querySelector('.bet-cancel').addEventListener('click', () => {
            dialog.remove();
            resolve(null);
        });
    }

    /**
     * ベット選択処理
     */
    selectBet(selectedBet, dialog, resolve) {
        // 選択演出
        const selectedOption = dialog.querySelector(`[data-type="${selectedBet.type}"]`);
        selectedOption.classList.add('selected');

        // 他のオプションをフェードアウト
        dialog.querySelectorAll('.bet-option').forEach(option => {
            if (option !== selectedOption) {
                option.style.opacity = '0.3';
                option.style.pointerEvents = 'none';
            }
        });

        // 確認メッセージ
        setTimeout(() => {
            this.showBetConfirmation(selectedBet, dialog, resolve);
        }, 1000);
    }

    /**
     * ベット確認画面
     */
    showBetConfirmation(selectedBet, dialog, resolve) {
        const confirmationDiv = document.createElement('div');
        confirmationDiv.className = 'bet-confirmation';
        confirmationDiv.innerHTML = `
            <div class="confirmation-content">
                <h3>⚠️ 最終確認 ⚠️</h3>
                <p><strong>${selectedBet.name}</strong> を実行しますか？</p>
                <div class="confirmation-buttons">
                    <button class="confirm-yes">実行する</button>
                    <button class="confirm-no">やめる</button>
                </div>
            </div>
        `;

        confirmationDiv.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid #dc143c;
            border-radius: 10px;
            padding: 2rem;
            text-align: center;
            color: #fff;
            z-index: 10001;
        `;

        // 確認イベント
        confirmationDiv.querySelector('.confirm-yes').addEventListener('click', () => {
            dialog.remove();
            resolve(selectedBet);
        });

        confirmationDiv.querySelector('.confirm-no').addEventListener('click', () => {
            dialog.remove();
            resolve(null);
        });

        dialog.appendChild(confirmationDiv);
    }

    /**
     * ベットタイマー開始
     */
    startBetTimer(dialog) {
        let timeLeft = 10;
        const timerElement = dialog.querySelector('#bet-timer');

        const timer = setInterval(() => {
            timeLeft--;
            if (timerElement) {
                timerElement.textContent = timeLeft;
            }

            if (timeLeft <= 0) {
                clearInterval(timer);
                if (dialog.parentNode) {
                    dialog.remove();
                }
            }
        }, 1000);
    }

    /**
     * 特殊ベット実行
     */
    async execute(betType, amount) {
        if (this.isActive) {
            throw new Error('既に特殊ベットが実行中です');
        }

        const feature = this.features[betType];
        if (!feature) {
            throw new Error(`未知のベットタイプ: ${betType}`);
        }

        try {
            this.isActive = true;
            this.currentFeature = betType;

            // ベット実行
            const result = await feature.execute(amount);

            // 履歴記録
            this.recordBetHistory(betType, amount, result);

            // 統計更新
            this.updateStats(result);

            return result;

        } finally {
            this.isActive = false;
            this.currentFeature = null;
        }
    }

    /**
     * 成功率計算
     */
    calculateSuccessRate(betType) {
        switch (betType) {
            case 'doubleOrNothing': return 50;
            case 'riskBet': return 30;
            case 'allOrNothing': return 20;
            default: return 0;
        }
    }

    /**
     * 最大報酬計算
     */
    calculateMaxReward(betType) {
        switch (betType) {
            case 'doubleOrNothing': return 2;
            case 'riskBet': return 3;
            case 'allOrNothing': return 5;
            default: return 1;
        }
    }

    /**
     * ベット履歴記録
     */
    recordBetHistory(betType, amount, result) {
        this.history.push({
            timestamp: Date.now(),
            betType: betType,
            amount: amount,
            success: result.success,
            finalAmount: result.amount,
            profit: result.amount - amount
        });

        // 履歴は最新100件まで
        if (this.history.length > 100) {
            this.history.shift();
        }
    }

    /**
     * 統計更新
     */
    updateStats(result) {
        const state = this.gameState.getState();

        if (result.success) {
            this.gameState.setState({
                stats: {
                    ...state.stats,
                    specialBetsWon: state.stats.specialBetsWon + 1
                }
            });
        }
    }

    /**
     * 統計情報取得
     */
    getStats() {
        const totalBets = this.history.length;
        const wonBets = this.history.filter(bet => bet.success).length;
        const totalProfit = this.history.reduce((sum, bet) => sum + bet.profit, 0);

        return {
            totalBets: totalBets,
            wonBets: wonBets,
            winRate: totalBets > 0 ? (wonBets / totalBets * 100).toFixed(1) : 0,
            totalProfit: totalProfit,
            biggestWin: Math.max(...this.history.map(bet => bet.profit), 0),
            biggestLoss: Math.min(...this.history.map(bet => bet.profit), 0)
        };
    }

    /**
     * 緊急時特殊ベット（破産寸前の救済措置）
     */
    async offerEmergencyBet() {
        const state = this.gameState.getState();

        if (state.coins <= state.bet) {
            const emergencyBet = {
                type: 'allOrNothing',
                name: 'EMERGENCY ALL OR NOTHING',
                description: '最後のチャンス！20%で全復活の奇跡',
                riskLevel: 'Extreme',
                icon: '🆘'
            };

            return emergencyBet;
        }

        return null;
    }

    /**
     * リセット
     */
    reset() {
        this.history = [];
        this.isActive = false;
        this.currentFeature = null;

        // アクティブなダイアログを閉じる
        const dialog = document.getElementById('special-bet-dialog');
        if (dialog) {
            dialog.remove();
        }
    }
}