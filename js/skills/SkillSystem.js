/**
 * スキルシステム - 脳汁止まらない特殊機能の中核
 * プレイヤーが「もう一回！」と叫ぶ中毒性のある機能群
 */

import { TimeFreezeSkill } from './TimeFreezeSkill.js';
import { FutureVisionSkill } from './FutureVisionSkill.js';
import { MiracleSpinSkill } from './MiracleSpinSkill.js';

export class SkillSystem {
    constructor(gameState, slotMachine, paylineEngine) {
        this.gameState = gameState;
        this.slotMachine = slotMachine;
        this.paylineEngine = paylineEngine;

        // 各スキルのインスタンス生成
        this.skills = {
            timeFreeze: new TimeFreezeSkill(gameState, slotMachine),
            futureVision: new FutureVisionSkill(gameState, slotMachine, paylineEngine),
            miracleSpin: new MiracleSpinSkill(gameState, slotMachine)
        };

        this.activeSkill = null;
        this.cooldowns = new Map();
    }

    /**
     * スキル使用メイン関数
     * 使用条件チェック → 実行 → 結果処理
     */
    async useSkill(skillName) {
        if (!this.skills[skillName]) {
            throw new Error(`未知のスキル: ${skillName}`);
        }

        // 使用条件チェック
        this.validateSkillUsage(skillName);

        // クールダウンチェック
        if (this.isOnCooldown(skillName)) {
            throw new Error(`${skillName}はクールダウン中です`);
        }

        try {
            // スキル使用回数減算
            this.gameState.useSkill(skillName);

            // アクティブスキル設定
            this.activeSkill = skillName;

            // 即座にスキル説明を表示
            await this.playSkillAnimation(skillName);

            // スキル実行
            const result = await this.skills[skillName].execute();

            // 使用後処理（アニメーションは既に実行済み）
            await this.processSkillResultOnly(skillName, result);

            // クールダウン設定
            this.setCooldown(skillName);

            return result;

        } catch (error) {
            // エラー時は使用回数を戻す
            const state = this.gameState.getState();
            this.gameState.setState({
                skills: {
                    ...state.skills,
                    [skillName]: state.skills[skillName] + 1
                }
            });
            throw error;
        } finally {
            this.activeSkill = null;
        }
    }

    /**
     * スキル使用条件チェック
     */
    validateSkillUsage(skillName) {
        const state = this.gameState.getState();

        // 基本チェック
        if (state.skills[skillName] <= 0) {
            throw new Error(`${skillName}の使用回数が不足しています`);
        }

        if (state.isSpinning) {
            throw new Error('スピン中はスキルを使用できません');
        }

        if (state.gameOver) {
            throw new Error('ゲーム終了後はスキルを使用できません');
        }

        // スキル固有条件
        const skill = this.skills[skillName];
        if (skill.validateUsage && !skill.validateUsage()) {
            throw new Error(`${skillName}の使用条件を満たしていません`);
        }
    }

    /**
     * スキル実行結果の処理
     */
    async processSkillResult(skillName, result) {
        // スキル別処理（アニメーションと並行実行）
        const resultProcessing = (async () => {
            switch (skillName) {
                case 'timeFreeze':
                    await this.handleTimeFreezeResult(result);
                    break;
                case 'futureVision':
                    await this.handleFutureVisionResult(result);
                    break;
                case 'miracleSpin':
                    await this.handleMiracleSpinResult(result);
                    break;
            }
        })();

        // 共通演出と並行実行
        const animationProcessing = this.playSkillAnimation(skillName);

        // 両方の完了を待つ
        await Promise.all([resultProcessing, animationProcessing]);

        // 統計更新
        this.updateSkillStats(skillName, result);
    }

    /**
     * スキル実行結果のみの処理（アニメーション無し）
     */
    async processSkillResultOnly(skillName, result) {
        // スキル別処理のみ実行
        switch (skillName) {
            case 'timeFreeze':
                await this.handleTimeFreezeResult(result);
                break;
            case 'futureVision':
                await this.handleFutureVisionResult(result);
                break;
            case 'miracleSpin':
                await this.handleMiracleSpinResult(result);
                break;
        }

        // 統計更新
        this.updateSkillStats(skillName, result);
    }

    /**
     * タイムフリーズ結果処理
     */
    async handleTimeFreezeResult(result) {
        if (result.manualStopResults) {
            // プレイヤーが手動停止した結果を処理
            const wins = this.paylineEngine.checkWin(result.manualStopResults);

            if (wins.length > 0) {
                const totalPayout = this.paylineEngine.getTotalPayout(wins, this.gameState.getState().bet, this.gameState.getState().multiplier);
                this.gameState.endSpin(totalPayout);

                await this.showSpecialWinAnimation('TIME FREEZE WIN!', totalPayout);
            }
        }
    }

    /**
     * フューチャービジョン結果処理
     */
    async handleFutureVisionResult(result) {
        if (result.futureResults) {
            // 未来予測結果を表示
            await this.showFuturePreview(result.futureResults);

            // プレイヤーに選択肢を提示
            const choice = await this.offerFutureChoice(result.futureResults);

            if (choice) {
                // 選択されたスピンを実行
                await this.executePredeterminedSpin(choice);
            }
        }
    }

    /**
     * ミラクルスピン結果処理
     */
    async handleMiracleSpinResult(result) {
        if (result.isMiracleWin) {
            let finalWin = result.winAmount;

            // 特別な乗数適用
            if (result.specialMultiplier > 1) {
                finalWin *= result.specialMultiplier;
            }

            // ゲーム状態更新（アニメーションはMiracleSpinSkillで処理済み）
            this.gameState.endSpin(finalWin);
        }
    }

    /**
     * スキルアニメーション再生
     */
    async playSkillAnimation(skillName) {
        const animations = {
            timeFreeze: this.playTimeFreezeAnimation,
            futureVision: this.playFutureVisionAnimation,
            miracleSpin: this.playMiracleSpinAnimation
        };

        if (animations[skillName]) {
            await animations[skillName].call(this);
        }
    }

    /**
     * タイムフリーズアニメーション
     */
    async playTimeFreezeAnimation() {
        return new Promise(resolve => {
            // 画面全体に氷結エフェクト
            const overlay = document.createElement('div');
            overlay.className = 'skill-overlay time-freeze-effect';
            overlay.innerHTML = `
                <div class="skill-title">⏱️ TIME FREEZE ⏱️</div>
                <div class="skill-instruction">時を止めてリールを手動制御！</div>
                <div class="skill-detail">【左・中・右】の列をタップして停止</div>
                <div class="skill-timing">🎯 333ms, 666ms, 999ms でタップすると高配当！</div>
            `;
            document.body.appendChild(overlay);

            // CSS アニメーション
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: radial-gradient(circle, rgba(0, 255, 255, 0.3) 0%, rgba(0, 0, 0, 0.9) 100%);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                animation: freeze-in 1s ease-out;
                text-align: center;
                color: #00ffff;
                font-size: 1.2rem;
                padding: 2rem;
            `;

            // スタイルの個別調整
            overlay.querySelector('.skill-title').style.cssText = `
                font-size: 2.5rem;
                margin-bottom: 1rem;
                text-shadow: 0 0 20px #00ffff;
            `;
            overlay.querySelector('.skill-instruction').style.cssText = `
                font-size: 1.5rem;
                margin-bottom: 0.5rem;
            `;
            overlay.querySelector('.skill-detail').style.cssText = `
                font-size: 1.2rem;
                margin-bottom: 0.5rem;
                color: #ffff00;
            `;
            overlay.querySelector('.skill-timing').style.cssText = `
                font-size: 1rem;
                color: #00ff00;
                text-shadow: 0 0 10px #00ff00;
            `;

            setTimeout(() => {
                overlay.remove();
                resolve();
            }, 3000); // 3秒に延長して説明をしっかり読めるように
        });
    }

    /**
     * フューチャービジョンアニメーション
     */
    async playFutureVisionAnimation() {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.className = 'skill-overlay future-vision-effect';
            overlay.innerHTML = `
                <div class="skill-title">👁️ FUTURE VISION 👁️</div>
                <div class="skill-instruction">未来を覗き見る...</div>
            `;
            document.body.appendChild(overlay);

            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: radial-gradient(circle, rgba(138, 43, 226, 0.4) 0%, rgba(0, 0, 0, 0.9) 100%);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                animation: vision-pulse 1.5s ease-in-out;
            `;

            setTimeout(() => {
                overlay.remove();
                resolve();
            }, 2000);
        });
    }

    /**
     * ミラクルスピンアニメーション
     */
    async playMiracleSpinAnimation() {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.className = 'skill-overlay miracle-spin-effect';
            overlay.innerHTML = `
                <div class="skill-title">✨ MIRACLE SPIN ✨</div>
                <div class="skill-instruction">奇跡が起こる...</div>
            `;
            document.body.appendChild(overlay);

            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, rgba(255, 20, 147, 0.3) 50%, rgba(0, 0, 0, 0.9) 100%);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                animation: miracle-sparkle 2s ease-in-out;
            `;

            setTimeout(() => {
                overlay.remove();
                resolve();
            }, 2500);
        });
    }

    /**
     * 特別勝利アニメーション
     */
    async showSpecialWinAnimation(title, winAmount) {
        return new Promise(resolve => {
            const winOverlay = document.createElement('div');
            winOverlay.innerHTML = `
                <div class="special-win-title">${title}</div>
                <div class="special-win-amount">+${winAmount.toLocaleString()}</div>
                <div class="special-win-particles"></div>
            `;

            winOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                background: rgba(0, 0, 0, 0.8);
                color: #00ffff;
                font-size: 2rem;
                text-align: center;
                animation: special-win-burst 3s ease-out;
            `;

            document.body.appendChild(winOverlay);

            setTimeout(() => {
                winOverlay.remove();
                resolve();
            }, 3000);
        });
    }

    /**
     * 未来予測結果表示
     */
    async showFuturePreview(futureResults) {
        return new Promise(resolve => {
            const previewModal = document.createElement('div');
            previewModal.className = 'future-preview-modal';

            let previewHTML = '<div class="future-title">🔮 未来のスピン結果 🔮</div><div class="future-grid">';

            futureResults.forEach((result, index) => {
                const winStatus = result.isWin ? 'win' : 'loss';
                previewHTML += `
                    <div class="future-spin ${winStatus}" data-spin="${index}">
                        <div class="spin-number">スピン ${index + 1}</div>
                        <div class="mini-grid">
                            ${result.symbols.flat().map(symbol =>
                                `<div class="mini-symbol">${symbol}</div>`
                            ).join('')}
                        </div>
                        <div class="win-indicator">${result.isWin ? '🎉 WIN!' : '💔'}</div>
                    </div>
                `;
            });

            previewHTML += '</div><button class="close-preview">選択完了</button>';
            previewModal.innerHTML = previewHTML;

            document.body.appendChild(previewModal);

            // 閉じるボタンのイベント
            previewModal.querySelector('.close-preview').addEventListener('click', () => {
                previewModal.remove();
                resolve();
            });
        });
    }

    /**
     * クールダウン管理
     */
    setCooldown(skillName, duration = 5000) {
        this.cooldowns.set(skillName, Date.now() + duration);
    }

    isOnCooldown(skillName) {
        const cooldownEnd = this.cooldowns.get(skillName);
        return cooldownEnd && Date.now() < cooldownEnd;
    }

    getCooldownRemaining(skillName) {
        const cooldownEnd = this.cooldowns.get(skillName);
        if (!cooldownEnd) return 0;
        return Math.max(0, cooldownEnd - Date.now());
    }

    /**
     * ミラクル大当たりアニメーション
     */
    async showMiracleAnimation() {
        return new Promise(resolve => {
            const miracleOverlay = document.createElement('div');
            miracleOverlay.innerHTML = `
                <div class="miracle-win-title">🎊 MIRACLE WIN! 🎊</div>
                <div class="miracle-win-subtitle">奇跡が起こりました！</div>
                <div class="miracle-particles"></div>
            `;

            miracleOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                background: radial-gradient(circle, rgba(255, 215, 0, 0.8) 0%, rgba(255, 20, 147, 0.6) 50%, rgba(0, 0, 0, 0.9) 100%);
                color: #ffd700;
                font-size: 3rem;
                text-align: center;
                animation: miracle-explosion 3s ease-out;
                text-shadow: 0 0 30px #ffd700;
            `;

            // タイトルスタイル
            miracleOverlay.querySelector('.miracle-win-title').style.cssText = `
                font-size: 4rem;
                margin-bottom: 1rem;
                animation: miracle-pulse 1s infinite alternate;
            `;

            // サブタイトルスタイル
            miracleOverlay.querySelector('.miracle-win-subtitle').style.cssText = `
                font-size: 2rem;
                color: #ff69b4;
                text-shadow: 0 0 20px #ff69b4;
            `;

            document.body.appendChild(miracleOverlay);

            setTimeout(() => {
                miracleOverlay.remove();
                resolve();
            }, 3000);
        });
    }

    /**
     * マルチプライヤーボーナス表示
     */
    async showMultiplierBonus(multiplier, bonusAmount) {
        return new Promise(resolve => {
            const bonusOverlay = document.createElement('div');
            bonusOverlay.innerHTML = `
                <div class="multiplier-bonus-title">🌟 ${multiplier}x MULTIPLIER! 🌟</div>
                <div class="multiplier-bonus-amount">+${bonusAmount.toLocaleString()} コイン</div>
            `;

            bonusOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                background: rgba(0, 0, 0, 0.8);
                color: #ffd700;
                font-size: 2.5rem;
                text-align: center;
                animation: multiplier-burst 2s ease-out;
            `;

            document.body.appendChild(bonusOverlay);

            setTimeout(() => {
                bonusOverlay.remove();
                resolve();
            }, 2000);
        });
    }

    /**
     * 統計更新
     */
    updateSkillStats(skillName, result) {
        // スキル使用統計を更新
        const state = this.gameState.getState();
        const stats = state.stats || {
            skillsUsed: 0,
            timeFreezeUsed: 0,
            futureVisionUsed: 0,
            miracleSpinUsed: 0
        };

        this.gameState.setState({
            stats: {
                ...stats,
                skillsUsed: stats.skillsUsed + 1,
                [`${skillName}Used`]: (stats[`${skillName}Used`] || 0) + 1
            }
        });
    }

    /**
     * 全スキルのクールダウン情報取得
     */
    getAllCooldowns() {
        const cooldowns = {};

        Object.keys(this.skills).forEach(skillName => {
            cooldowns[skillName] = {
                isOnCooldown: this.isOnCooldown(skillName),
                remaining: this.getCooldownRemaining(skillName)
            };
        });

        return cooldowns;
    }

    /**
     * 緊急時スキル回復（課金要素の代替）
     */
    emergencySkillRestore() {
        const state = this.gameState.getState();

        // コインを大量消費してスキル回復
        const cost = state.coins * 0.3; // 30%のコイン消費

        if (state.coins >= cost) {
            this.gameState.setState({
                coins: state.coins - cost,
                skills: {
                    timeFreeze: state.skills.timeFreeze + 1,
                    futureVision: state.skills.futureVision + 1,
                    miracleSpin: state.skills.miracleSpin + 1
                }
            });

            return true;
        }

        return false;
    }
}