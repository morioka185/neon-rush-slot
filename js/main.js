/**
 * NEON RUSH - メインエントリーポイント
 * Team E: モバイル・パフォーマンスチーム最適化版
 * - QA・統合チーム基本機能ベース
 * - モバイル最適化機能追加
 */

import { GameState } from './game/GameState.js';
import { SlotMachine } from './game/SlotMachine.js';
import { PaylineEngine } from './game/PaylineEngine.js';
import { AudioManager } from './audio/AudioManager.js';
import { SkillSystem } from './skills/SkillSystem.js';
import { EffectSystem } from './effects/EffectSystem.js';

class NeonRushGame {
    constructor() {
        this.gameState = new GameState();
        this.audioManager = new AudioManager();
        this.effectSystem = new EffectSystem(this.audioManager);
        this.slotMachine = new SlotMachine(this.gameState, this.audioManager, this.effectSystem);
        this.paylineEngine = new PaylineEngine();
        this.skillSystem = new SkillSystem(this.gameState, this.slotMachine, this.paylineEngine);

        this.isInitialized = false;
        this.isSpinning = false;
        this.isAutoSpinning = false;
        this.autoSpinTimer = null;
        this.lastSpinWon = false;

        // Team E: モバイル最適化プロパティ
        this.isMobile = this.detectMobile();
        this.performanceMode = this.detectPerformanceMode();
        this.touchStartTime = 0;
        this.longPressThreshold = 500;
        this.lastTouchTime = 0;
        this.userInteracted = false;
        this.doubleTapThreshold = 300;

        // パフォーマンス監視
        this.animationFrameId = null;
        this.isPageVisible = true;

        // タッチ状態
        this.touchState = {
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            isPressed: false
        };
    }

    async init() {
        try {
            this.setupEventListeners();
            this.setupMobileOptimizations();
            await this.audioManager.init();
            this.updateUI();
            this.isInitialized = true;

            // 初期化完了（本番環境では無効化可能）
            if (typeof process === 'undefined' || process?.env?.NODE_ENV !== 'production') {
                console.log('🎰 NEON RUSH ゲーム初期化完了 (Team E最適化版)');
                console.log(`📱 モバイル: ${this.isMobile}, パフォーマンス: ${this.performanceMode}`);

                // デバッグ情報
                const state = this.gameState.getState();
                console.log('初期ゲーム状態:', {
                    coins: state.coins,
                    bet: state.bet,
                    gameOver: state.gameOver,
                    canSpin: this.gameState.canSpin()
                });
            }

            // 音響システム起動のためのワンクリック初期化を追加
            this.setupAudioActivation();

        } catch (error) {
            console.error('❌ ゲーム初期化エラー:', error);
        }
    }

    // 🎵 音響システム起動設定
    setupAudioActivation() {
        // 最初のユーザーインタラクションで音響システムを確実に起動
        const activateAudio = async () => {
            try {
                await this.audioManager.ensureAudioContext();

                // 成功したら背景音楽開始
                console.log('🎵 音響システム起動完了！BGM開始中...');

                // まずシンプルBGMテストを実行
                this.audioManager.playSimpleBGM();

                // 3秒後に本格的なBGMに切り替え
                setTimeout(async () => {
                    await this.audioManager.playStageMusic(1);
                    const audioStatus = this.audioManager.getStatus();
                    console.log('Audio状態:', audioStatus);
                }, 3000);

                // 初期化音（テスト用）
                setTimeout(() => {
                    this.audioManager.playSFX('buttonClick');
                }, 100);

            } catch (error) {
                console.warn('音響システム起動失敗:', error);
            }
        };

        // 初回クリック/タップで起動
        const startAudio = () => {
            activateAudio();
            this.userInteracted = true;
            document.removeEventListener('click', startAudio);
            document.removeEventListener('touchstart', startAudio);
        };

        document.addEventListener('click', startAudio);
        document.addEventListener('touchstart', startAudio);
    }

    setupEventListeners() {
        // スピンボタン
        const spinButton = document.getElementById('spin-button');
        if (spinButton) {
            // 通常のクリック
            spinButton.addEventListener('click', () => this.handleSpin());

            // Team E: タッチ最適化
            if (this.isMobile) {
                spinButton.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
                spinButton.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
                spinButton.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
            }
        }

        // オートスピンボタン
        const autoSpinButton = document.getElementById('auto-spin-button');
        if (autoSpinButton) {
            autoSpinButton.addEventListener('click', () => this.handleAutoSpin());

            // Team E: タッチ最適化
            if (this.isMobile) {
                autoSpinButton.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
                autoSpinButton.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
            }
        }

        // ベットボタン
        document.querySelectorAll('.bet-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.audioManager.playButtonSound();
                this.handleBetChange(e);
            });

            // Team E: タッチフィードバック
            if (this.isMobile) {
                btn.addEventListener('touchstart', (e) => this.addTouchFeedback(e.target));
                btn.addEventListener('touchend', (e) => this.removeTouchFeedback(e.target));
            }
        });

        // スキルボタン
        document.querySelectorAll('.skill-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.audioManager.playButtonSound();
                this.handleSkillUse(e);
            });

            // Team E: タッチフィードバック
            if (this.isMobile) {
                btn.addEventListener('touchstart', (e) => this.addTouchFeedback(e.target));
                btn.addEventListener('touchend', (e) => this.removeTouchFeedback(e.target));
            }
        });

        // ゲームステート監視
        this.gameState.subscribe('stateChange', (data) => {
            this.updateUI();
            this.checkGameConditions(data);
        });
        this.gameState.subscribe('stageUp', (data) => this.handleStageUp(data));

        // オーディオコントロール
        this.setupAudioControls();

        // リセットボタン
        this.setupResetButton();

        // Team E: システムイベント
        this.setupSystemEventListeners();
    }

    setupAudioControls() {
        // ミュートボタン
        const muteBtn = document.getElementById('mute-btn');
        const audioIcon = document.getElementById('audio-icon');

        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                const isMuted = this.audioManager.toggleMute();

                // アイコン更新
                audioIcon.textContent = isMuted ? '🔇' : '🔊';
                muteBtn.classList.toggle('muted', isMuted);

                // ボタン音再生（ミュート時は除く）
                if (!isMuted) {
                    this.audioManager.playButtonSound();
                }
            });
        }

        // 音声設定ボタン
        const settingsBtn = document.getElementById('audio-settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.audioManager.playButtonSound();
                this.showAudioSettings();
            });
        }

        // 音声設定モーダルのイベント
        this.setupAudioSettingsModal();
    }

    setupAudioSettingsModal() {
        const modalOverlay = document.getElementById('audio-modal-overlay');
        const closeBtn = document.getElementById('audio-modal-close');

        // モーダルを閉じる
        const closeModal = () => {
            modalOverlay.style.display = 'none';
        };

        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }

        // オーバーレイクリックで閉じる
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });

        // ボリュームスライダー
        this.setupVolumeControls();

        // チェックボックス
        this.setupAudioToggles();

        // テストボタン
        const testBtn = document.getElementById('test-sound-btn');
        if (testBtn) {
            testBtn.addEventListener('click', () => {
                this.audioManager.testSound('win');
            });
        }
    }

    setupVolumeControls() {
        // マスターボリューム
        const masterVolumeSlider = document.getElementById('master-volume');
        const masterVolumeValue = document.getElementById('master-volume-value');

        if (masterVolumeSlider) {
            masterVolumeSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                masterVolumeValue.textContent = `${value}%`;
                this.audioManager.setMasterVolume(value / 100);
            });
        }

        // 効果音ボリューム
        const sfxVolumeSlider = document.getElementById('sfx-volume');
        const sfxVolumeValue = document.getElementById('sfx-volume-value');

        if (sfxVolumeSlider) {
            sfxVolumeSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                sfxVolumeValue.textContent = `${value}%`;
                this.audioManager.setSFXVolume(value / 100);
            });
        }

        // 音楽ボリューム
        const musicVolumeSlider = document.getElementById('music-volume');
        const musicVolumeValue = document.getElementById('music-volume-value');

        if (musicVolumeSlider) {
            musicVolumeSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                musicVolumeValue.textContent = `${value}%`;
                this.audioManager.setMusicVolume(value / 100);
            });
        }
    }

    setupAudioToggles() {
        // 効果音有効/無効
        const enableSFXCheckbox = document.getElementById('enable-sfx');
        if (enableSFXCheckbox) {
            enableSFXCheckbox.addEventListener('change', (e) => {
                this.audioManager.enableSFXSounds(e.target.checked);
            });
        }

        // 音楽有効/無効
        const enableMusicCheckbox = document.getElementById('enable-music');
        if (enableMusicCheckbox) {
            enableMusicCheckbox.addEventListener('change', (e) => {
                this.audioManager.enableBackgroundMusic(e.target.checked);

                // 音楽が有効になった場合、現在のステージの音楽を再生
                if (e.target.checked) {
                    const currentStage = this.gameState.getState().stage;
                    this.audioManager.playStageMusic(currentStage);
                }
            });
        }
    }

    setupResetButton() {
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', async () => {
                this.audioManager.playButtonSound();

                const confirmReset = await this.showResetConfirmDialog();
                if (confirmReset) {
                    this.restartGame();
                }
            });
        }
    }

    async showResetConfirmDialog() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            `;

            modal.innerHTML = `
                <div style="
                    background: #1a1a2e;
                    border: 2px solid #dc143c;
                    border-radius: 10px;
                    padding: 2rem;
                    text-align: center;
                    color: white;
                    max-width: 400px;
                ">
                    <h2>🔄 ゲームリセット</h2>
                    <p>ゲームを初期状態にリセットしますか？</p>
                    <p><strong>すべての進行状況が失われます</strong></p>
                    <div style="margin-top: 1rem;">
                        <button id="reset-confirm-yes" style="margin-right: 1rem; padding: 0.5rem 1rem; background: #dc143c; color: white; border: none; border-radius: 5px; cursor: pointer;">リセット</button>
                        <button id="reset-confirm-no" style="padding: 0.5rem 1rem; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer;">キャンセル</button>
                    </div>
                </div>
            `;

            modal.querySelector('#reset-confirm-yes').addEventListener('click', () => {
                modal.remove();
                resolve(true);
            });

            modal.querySelector('#reset-confirm-no').addEventListener('click', () => {
                modal.remove();
                resolve(false);
            });

            document.body.appendChild(modal);
        });
    }

    showAudioSettings() {
        const modalOverlay = document.getElementById('audio-modal-overlay');
        if (modalOverlay) {
            modalOverlay.style.display = 'flex';

            // 現在の設定値でUIを更新
            this.updateAudioSettingsUI();
        }
    }

    updateAudioSettingsUI() {
        const status = this.audioManager.getStatus();

        // ボリューム値更新
        const masterSlider = document.getElementById('master-volume');
        const masterValue = document.getElementById('master-volume-value');
        if (masterSlider && masterValue) {
            const value = Math.round(status.masterVolume * 100);
            masterSlider.value = value;
            masterValue.textContent = `${value}%`;
        }

        const sfxSlider = document.getElementById('sfx-volume');
        const sfxValue = document.getElementById('sfx-volume-value');
        if (sfxSlider && sfxValue) {
            const value = Math.round(status.sfxVolume * 100);
            sfxSlider.value = value;
            sfxValue.textContent = `${value}%`;
        }

        const musicSlider = document.getElementById('music-volume');
        const musicValue = document.getElementById('music-volume-value');
        if (musicSlider && musicValue) {
            const value = Math.round(status.musicVolume * 100);
            musicSlider.value = value;
            musicValue.textContent = `${value}%`;
        }

        // チェックボックス更新
        const sfxCheckbox = document.getElementById('enable-sfx');
        if (sfxCheckbox) {
            sfxCheckbox.checked = status.enableSFX;
        }

        const musicCheckbox = document.getElementById('enable-music');
        if (musicCheckbox) {
            musicCheckbox.checked = status.enableMusic;
        }
    }

    handleAutoSpin() {
        if (this.isAutoSpinning) {
            this.stopAutoSpin();
        } else {
            this.startAutoSpin();
        }
    }

    startAutoSpin() {
        if (this.isSpinning || this.isAutoSpinning) {
            return;
        }

        // 残高チェック
        if (!this.gameState.canSpin()) {
            console.log('オートスピン開始できません: 残高不足');
            return;
        }

        this.isAutoSpinning = true;
        this.updateAutoSpinButton();

        // オートスピン音再生
        this.audioManager.playButtonSound();

        console.log('🔄 オートスピン開始');
        this.executeAutoSpin();
    }

    stopAutoSpin() {
        if (!this.isAutoSpinning) {
            return;
        }

        this.isAutoSpinning = false;

        if (this.autoSpinTimer) {
            clearTimeout(this.autoSpinTimer);
            this.autoSpinTimer = null;
        }

        this.updateAutoSpinButton();

        // オートスピン停止音再生
        this.audioManager.playButtonSound();

        console.log('⏹️ オートスピン停止');
    }

    async executeAutoSpin() {
        if (!this.isAutoSpinning) {
            return;
        }

        // 残高チェック
        if (!this.gameState.canSpin()) {
            console.log('オートスピン停止: 残高不足');
            this.stopAutoSpin();
            return;
        }

        try {
            // スピン実行
            await this.performSpin();

            // 次のスピンをスケジュール（勝利の場合は少し長めに待機）
            if (this.isAutoSpinning) {
                const delay = this.lastSpinWon ? 3000 : 1500; // 勝利時3秒、通常1.5秒
                this.autoSpinTimer = setTimeout(() => {
                    this.executeAutoSpin();
                }, delay);
            }
        } catch (error) {
            console.error('オートスピンエラー:', error);
            this.stopAutoSpin();
        }
    }

    async handleSpin() {
        if (this.isSpinning) {
            // オートスピン中にSPINボタンを押した場合はオートスピンを停止
            if (this.isAutoSpinning) {
                this.stopAutoSpin();
            }
            return;
        }

        await this.performSpin();
    }

    async performSpin() {
        if (this.isSpinning) {
            return;
        }

        // 残高不足の場合はコインを補充
        if (!this.gameState.canSpin()) {
            if (this.gameState.getState().coins < this.gameState.getState().bet) {
                // オートスピン中の場合は停止
                if (this.isAutoSpinning) {
                    this.stopAutoSpin();
                }
                this.replenishCoins();
                return;
            }
            // オートスピン中の場合は停止
            if (this.isAutoSpinning) {
                this.stopAutoSpin();
            }
            await this.handleInsufficientFunds();
            return;
        }

        try {
            this.isSpinning = true;
            this.updateSpinButton();
            this.updateAutoSpinButton();

            // スピン音再生
            this.audioManager.playSpinSound();

            // スピン実行
            const result = await this.slotMachine.spin();

            // リーチ判定（スピン後）
            const hasReach = this.effectSystem.checkAndShowReach(result.reels);

            // 勝利判定
            const wins = this.paylineEngine.checkWin(result.reels);

            if (wins.length > 0) {
                this.lastSpinWon = true;
                await this.handleWin(result, wins);

                // 当たりが出た場合はオートスピンを停止
                if (this.isAutoSpinning) {
                    setTimeout(() => {
                        this.stopAutoSpin();
                    }, 2000); // 勝利演出の後に停止
                }
            } else {
                this.lastSpinWon = false;
                await this.handleLoss();
            }

        } catch (error) {
            console.error('❌ スピンエラー:', error);
            // エラー時はオートスピンを停止
            if (this.isAutoSpinning) {
                this.stopAutoSpin();
            }
        } finally {
            this.isSpinning = false;
            this.updateSpinButton();
            this.updateAutoSpinButton();
        }
    }

    async handleWin(result, wins) {
        const state = this.gameState.getState();
        const totalPayout = this.paylineEngine.getTotalPayout(wins, state.bet, state.multiplier);

        console.log(`🎉 勝利! 配当: ${totalPayout}`);

        // 期待演出を停止
        this.effectSystem.hideAnticipation();

        // 勝利レベルに応じたエフェクト
        const winLevel = this.getWinLevel(totalPayout, state.bet);
        this.effectSystem.celebrateWin(winLevel);

        // 勝利音再生
        this.audioManager.playWinSound(totalPayout);

        // コイン獲得音再生
        setTimeout(() => {
            this.audioManager.playSFX('coinDrop');
        }, 500);

        // 勝利ライン表示
        this.paylineEngine.highlightWinLines(wins);

        // 配当追加
        this.gameState.endSpin(totalPayout);

        // 2秒後にハイライト削除
        setTimeout(() => {
            this.paylineEngine.clearHighlights();
        }, 2000);
    }

    async handleLoss() {
        console.log('💸 ハズレ');

        // 期待演出を停止
        this.effectSystem.hideAnticipation();

        this.gameState.endSpin(0);
    }

    // 勝利レベルを判定
    getWinLevel(totalPayout, bet) {
        const multiplier = totalPayout / bet;

        if (multiplier >= 100) return 'jackpot';  // 100倍以上
        if (multiplier >= 50) return 'big';       // 50倍以上
        return 'normal';                          // 通常
    }

    handleBetChange(event) {
        const betValue = event.currentTarget.dataset.bet;
        const state = this.gameState.getState();

        let newBet;
        if (betValue === 'max') {
            newBet = state.coins;
        } else {
            newBet = parseInt(betValue);
        }

        if (newBet <= state.coins && newBet > 0) {
            // ベット変更音再生
            this.audioManager.playSFX('betChange');

            const updateData = { bet: newBet };
            if (state.coins >= newBet) {
                updateData.gameOver = false;
            }

            this.gameState.setState(updateData);
            this.updateBetButtons();
        }
    }

    updateUI() {
        const state = this.gameState.getState();

        // 表示更新
        const coinsDisplay = document.getElementById('coins-display');
        const betDisplay = document.getElementById('bet-display');
        const multiplierDisplay = document.getElementById('multiplier-display');
        const stageDisplay = document.getElementById('stage-display');

        if (coinsDisplay) coinsDisplay.textContent = state.coins.toLocaleString();
        if (betDisplay) betDisplay.textContent = state.bet.toLocaleString();
        if (multiplierDisplay) multiplierDisplay.textContent = `×${state.multiplier.toFixed(1)}`;
        if (stageDisplay) stageDisplay.textContent = state.stage;

        // ヒートゲージ
        const heatFill = document.getElementById('heat-fill');
        if (heatFill) {
            heatFill.style.width = `${state.heatGauge}%`;
        }

        this.updateSpinButton();
        this.updateAutoSpinButton();
        this.updateBetButtons();
        this.updateSkillButtons();
    }

    updateSpinButton() {
        const spinButton = document.getElementById('spin-button');
        const spinText = spinButton?.querySelector('.spin-text');

        if (!spinButton) return;

        const state = this.gameState.getState();
        const canSpin = this.gameState.canSpin();

        if (this.isSpinning) {
            if (spinText) spinText.textContent = 'SPINNING...';
            else spinButton.textContent = 'SPINNING...';
            spinButton.disabled = true;
            spinButton.classList.add('spinning');
        } else if (!canSpin) {
            if (state.coins < state.bet) {
                if (spinText) spinText.textContent = '残高不足';
                else spinButton.textContent = '残高不足';
                spinButton.classList.add('insufficient-funds');
            } else if (state.gameOver) {
                if (spinText) spinText.textContent = 'GAME OVER';
                else spinButton.textContent = 'GAME OVER';
                spinButton.classList.add('game-over');
            }
            spinButton.disabled = true;
            spinButton.classList.remove('spinning');
        } else {
            if (spinText) spinText.textContent = 'SPIN';
            else spinButton.textContent = 'SPIN';
            spinButton.disabled = false;
            spinButton.classList.remove('spinning', 'insufficient-funds', 'game-over');
        }
    }

    updateAutoSpinButton() {
        const autoSpinButton = document.getElementById('auto-spin-button');
        const autoSpinText = autoSpinButton?.querySelector('.auto-spin-text');

        if (!autoSpinButton) return;

        const state = this.gameState.getState();
        const canSpin = this.gameState.canSpin();

        if (this.isAutoSpinning) {
            if (autoSpinText) autoSpinText.textContent = 'STOP';
            else autoSpinButton.textContent = 'STOP';
            autoSpinButton.classList.add('active');
            autoSpinButton.disabled = false;
        } else {
            if (autoSpinText) autoSpinText.textContent = 'AUTO';
            else autoSpinButton.textContent = 'AUTO';
            autoSpinButton.classList.remove('active');
            autoSpinButton.disabled = !canSpin || this.isSpinning;
        }
    }

    updateBetButtons() {
        const state = this.gameState.getState();

        document.querySelectorAll('.bet-btn').forEach(btn => {
            const betValue = btn.dataset.bet;
            const value = betValue === 'max' ? state.coins : parseInt(betValue);

            btn.classList.toggle('active', value === state.bet);
            btn.disabled = value > state.coins || value <= 0;
        });
    }

    async handleSkillUse(event) {
        const skillName = event.currentTarget.dataset.skill;
        const state = this.gameState.getState();

        if (state.skills[skillName] <= 0) {
            console.warn(`スキル使用回数が不足しています: ${skillName}`);
            return;
        }

        if (this.isSpinning) {
            console.warn('スピン中はスキルを使用できません');
            return;
        }

        try {
            console.log(`🌟 ${skillName}スキルを使用します`);
            const result = await this.skillSystem.useSkill(skillName);
            console.log('スキル実行結果:', result);

            // スキル実行後にUIを更新
            this.updateUI();
        } catch (error) {
            console.error('スキル実行エラー:', error);
            // エラー後もUIを更新
            this.updateUI();
        }
    }

    updateSkillButtons() {
        const state = this.gameState.getState();

        document.querySelectorAll('.skill-btn').forEach(btn => {
            const skillName = btn.dataset.skill;
            const countElement = btn.querySelector('.skill-count');

            if (countElement && state.skills[skillName] !== undefined) {
                countElement.textContent = state.skills[skillName];
            }

            // 使用可能回数が0の場合はボタンを無効化
            btn.disabled = state.skills[skillName] <= 0 || this.isSpinning;
            btn.classList.toggle('disabled', btn.disabled);
        });
    }

    async handleInsufficientFunds() {
        const state = this.gameState.getState();
        const info = this.gameState.getInsufficientFundsInfo();

        if (state.gameOver) {
            this.handleGameOver();
            return;
        }

        if (!info.canContinue) {
            this.handleCompletelyBroke();
            return;
        }

        await this.showInsufficientFundsDialog(info);
    }

    async handleCompletelyBroke() {
        console.log('💸 残高がゼロになりました');
        try {
            this.audioManager.playSFX('gameOver');
        } catch (error) {
            // 音声ファイルが見つからない場合は無視
        }

        setTimeout(async () => {
            const restart = await this.showRestartDialog();
            if (restart) {
                this.restartGame();
            }
        }, 2000);
    }

    async showInsufficientFundsDialog(info) {
        return new Promise((resolve) => {
            const dialog = this.createInsufficientFundsDialog(info, resolve);
            document.body.appendChild(dialog);
        });
    }

    createInsufficientFundsDialog(info, resolve) {
        const dialog = document.createElement('div');
        dialog.className = 'insufficient-funds-dialog';
        dialog.id = 'insufficient-funds-dialog';

        dialog.innerHTML = `
            <div class="funds-overlay">
                <div class="funds-container">
                    <div class="funds-header">
                        <h2 class="funds-title">💰 残高不足</h2>
                        <p class="funds-info">現在の残高: <span class="current-coins">${info.currentCoins}</span> コイン</p>
                        <p class="funds-info">必要なベット: <span class="required-bet">${info.requiredBet}</span> コイン</p>
                        <p class="funds-shortage">不足額: <span class="shortage-amount">${info.shortage}</span> コイン</p>
                    </div>

                    <div class="funds-options">
                        <div class="option-card">
                            <h3>💡 ベット額を調整</h3>
                            <p>現在の残高で遊び続ける</p>
                            <p>推奨ベット: <strong>${info.suggestedBet} コイン</strong></p>
                            <button class="option-btn adjust-bet" data-bet="${info.suggestedBet}">ベット額を調整</button>
                        </div>

                        ${info.currentCoins > 0 ? `
                            <div class="option-card">
                                <h3>🎰 ALL IN</h3>
                                <p>残り全額をベットして一発勝負</p>
                                <p>ベット額: <strong>${info.currentCoins} コイン</strong></p>
                                <button class="option-btn all-in" data-bet="${info.currentCoins}">ALL IN で挑戦</button>
                            </div>
                        ` : ''}

                        <div class="option-card">
                            <h3>🔄 リスタート</h3>
                            <p>ゲームを最初からやり直す</p>
                            <p>初期残高: <strong>10,000 コイン</strong></p>
                            <button class="option-btn restart-game">ゲームリスタート</button>
                        </div>
                    </div>

                    <div class="funds-footer">
                        <button class="funds-cancel">キャンセル</button>
                    </div>
                </div>
            </div>
        `;

        dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10000;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease-out;
        `;

        this.setupInsufficientFundsEvents(dialog, info, resolve);
        return dialog;
    }

    setupInsufficientFundsEvents(dialog, info, resolve) {
        dialog.querySelector('.adjust-bet')?.addEventListener('click', () => {
            this.gameState.setState({ bet: info.suggestedBet, gameOver: false });
            this.audioManager.playButtonSound();
            console.log(`ベットを ${info.suggestedBet} コインに調整しました`);
            dialog.remove();
            resolve();
        });

        dialog.querySelector('.all-in')?.addEventListener('click', () => {
            this.gameState.setState({ bet: info.currentCoins, gameOver: false });
            this.audioManager.playButtonSound();
            console.log(`ALL IN! ${info.currentCoins} コインをベット`);
            dialog.remove();
            resolve();
        });

        dialog.querySelector('.restart-game').addEventListener('click', () => {
            this.restartGame();
            dialog.remove();
            resolve();
        });

        dialog.querySelector('.funds-cancel').addEventListener('click', () => {
            dialog.remove();
            resolve();
        });
    }

    replenishCoins() {
        const replenishAmount = 5000;
        this.gameState.updateCoins(replenishAmount);

        // コイン補充音を再生
        this.audioManager.playSFX('coinDrop');

        console.log(`💰 コイン補充！${replenishAmount}コインが追加されました`);

        // 通知表示（簡易版）
        this.showReplenishNotification(replenishAmount);
    }

    showReplenishNotification(amount) {
        // 既存の通知があれば削除
        const existingNotification = document.querySelector('.replenish-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = 'replenish-notification';
        notification.textContent = `💰 +${amount.toLocaleString()} コイン補充！`;

        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(45deg, #ffdb4d, #ff8c00);
            color: #000;
            padding: 1rem 2rem;
            border-radius: 10px;
            font-size: 1.2rem;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(255, 140, 0, 0.5);
            z-index: 10000;
            animation: coinPop 2s ease-out forwards;
        `;

        // アニメーション定義を追加
        if (!document.querySelector('#coin-pop-animation')) {
            const style = document.createElement('style');
            style.id = 'coin-pop-animation';
            style.textContent = `
                @keyframes coinPop {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                    20% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                    80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -70%) scale(1); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // 2秒後に削除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 2000);
    }

    async showRestartDialog() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            `;

            modal.innerHTML = `
                <div style="
                    background: #1a1a2e;
                    border: 2px solid #dc143c;
                    border-radius: 10px;
                    padding: 2rem;
                    text-align: center;
                    color: white;
                    max-width: 400px;
                ">
                    <h2>🎰 ゲームオーバー</h2>
                    <p>残高がゼロになりました。</p>
                    <p>ゲームをリスタートしますか？</p>
                    <div style="margin-top: 1rem;">
                        <button id="restart-yes" style="margin-right: 1rem; padding: 0.5rem 1rem; background: #dc143c; color: white; border: none; border-radius: 5px; cursor: pointer;">リスタート</button>
                        <button id="restart-no" style="padding: 0.5rem 1rem; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer;">キャンセル</button>
                    </div>
                </div>
            `;

            modal.querySelector('#restart-yes').addEventListener('click', () => {
                modal.remove();
                resolve(true);
            });

            modal.querySelector('#restart-no').addEventListener('click', () => {
                modal.remove();
                resolve(false);
            });

            document.body.appendChild(modal);
        });
    }

    restartGame() {
        // リセット処理を正しい順序で実行
        this.gameState.reset();
        this.slotMachine.reset();
        this.effectSystem.reset();

        // UI更新を確実に実行
        this.updateUI();

        // 音効果を再生
        this.audioManager.playButtonSound();

        // 初期ステージの音楽を再生
        setTimeout(() => {
            this.audioManager.playStageMusic(1);
        }, 500);

        console.log('ゲームをリスタートしました');
    }

    checkGameConditions(data) {
        const state = data.newState;

        // ゲームオーバーチェック - コインが0で、ベットができない状態のみ
        if (state.coins <= 0 && state.bet > 0) {
            // 真のゲームオーバー状態のみhandleGameOverを呼び出す
            if (!state.gameOver) {
                // 初回のゲームオーバー判定のみ
                setTimeout(() => this.handleGameOver(), 100);
            }
        }
    }

    handleGameOver() {
        console.log('🎮 ゲームオーバー');

        // ゲームオーバー音再生
        try {
            this.audioManager.playSFX('gameOver');
        } catch (error) {
            // 音声ファイルが見つからない場合は無視
        }

        alert('ゲームオーバー！コインが不足しています。');
    }

    handleStageUp(data) {
        console.log(`🎉 ステージアップ! Stage ${data.newStage}`);

        // ステージアップ音再生
        this.audioManager.playSFX('stageUp');

        // 新しいステージの背景音楽に変更
        setTimeout(() => {
            this.audioManager.playStageMusic(data.newStage);
        }, 1000);
    }

    // デバッグ用メソッド
    debug() {
        return {
            gameState: this.gameState.getState(),
            currentReels: this.slotMachine.getCurrentState(),
            isSpinning: this.isSpinning,
            effectSystem: this.effectSystem.getStatus(),
            mobileOptimizations: {
                isMobile: this.isMobile,
                performanceMode: this.performanceMode,
                isPageVisible: this.isPageVisible
            }
        };
    }

    // ========================================
    // Team E: モバイル最適化関数群
    // ========================================

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768;
    }

    detectPerformanceMode() {
        const isLowSpec = this.isMobile && window.innerWidth <= 480 && window.innerHeight <= 640;
        const isSlowConnection = navigator.connection && navigator.connection.effectiveType === '2g';
        return (isLowSpec || isSlowConnection) ? 'low' : 'normal';
    }

    setupMobileOptimizations() {
        if (this.isMobile) {
            document.body.style.webkitTapHighlightColor = 'transparent';
            document.body.style.touchAction = 'manipulation';
            this.handleIOSSafari();
            document.body.classList.add(`performance-${this.performanceMode}`);
        }
    }

    handleIOSSafari() {
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            const updateViewport = () => {
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
            };
            updateViewport();
            window.addEventListener('resize', updateViewport);
        }
    }

    setupSystemEventListeners() {
        document.addEventListener('visibilitychange', () => {
            this.isPageVisible = !document.hidden;
            this.handleVisibilityChange();
        });

        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));
    }

    handleTouchStart(e) {
        this.touchStartTime = Date.now();
        e.target.classList.add('button-pressed');
        this.triggerHapticFeedback('light');
    }

    handleTouchMove(e) {
        // タッチ移動時の処理
    }

    handleTouchEnd(e) {
        e.target.classList.remove('button-pressed');
        const touchDuration = Date.now() - this.touchStartTime;
        if (touchDuration > this.longPressThreshold) {
            this.handleLongPress(e.target);
        }
    }

    handleLongPress(element) {
        if (element.id === 'spin-button') {
            // 将来の機能実装のためのログ（デバッグ用）
            if (process?.env?.NODE_ENV !== 'production') {
                console.log('🔄 ロングプレス - 連続スピン');
            }
            this.triggerHapticFeedback('heavy');
        }
    }

    addTouchFeedback(element) {
        element.style.transform = 'scale(0.95)';
        element.style.transition = 'transform 0.1s ease';
    }

    removeTouchFeedback(element) {
        element.style.transform = 'scale(1)';
        setTimeout(() => element.style.transition = '', 100);
    }

    triggerHapticFeedback(intensity = 'light') {
        if (!navigator.vibrate || !this.userInteracted) return;

        // ユーザーインタラクションなしでvibrateを呼び出すとエラーになるため、
        // try-catchで安全に処理
        try {
            const patterns = {
                light: [10],
                medium: [20],
                heavy: [50]
            };
            navigator.vibrate(patterns[intensity] || patterns.light);
        } catch (error) {
            // 無視 - ハプティックフィードバックは必須機能ではない
        }
    }

    handleVisibilityChange() {
        if (this.isPageVisible) {
            document.body.classList.remove('animations-paused');
        } else {
            document.body.classList.add('animations-paused');
        }
    }

    handleResize() {
        this.isMobile = this.detectMobile();
        this.performanceMode = this.detectPerformanceMode();
        document.body.className = document.body.className.replace(/performance-\w+/g, '');
        document.body.classList.add(`performance-${this.performanceMode}`);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// ゲーム初期化
document.addEventListener('DOMContentLoaded', async () => {
    const game = new NeonRushGame();
    await game.init();

    // グローバル参照（デバッグ用）
    window.neonRush = game;

    console.log('🎰 NEON RUSH - ゲーム準備完了！');
    console.log('デバッグ: window.neonRush でゲームオブジェクトにアクセス可能');
});