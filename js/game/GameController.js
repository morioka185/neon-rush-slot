import { GameState } from './GameState.js';
import { SlotMachine } from './SlotMachine.js';
import { PaylineEngine } from './PaylineEngine.js';
import { validateSymbolProbabilities } from '../data/symbols.js';

export class GameController {
  constructor() {
    this.gameState = new GameState();
    this.slotMachine = new SlotMachine(this.gameState);
    this.paylineEngine = new PaylineEngine();

    this.isInitialized = false;
    this.autoPlay = false;
    this.autoPlayInterval = null;

    this.initialize();
  }

  initialize() {
    this.setupEventListeners();
    this.updateUI();
    this.validateGameBalance();

    // GameStateの変更を監視
    this.gameState.subscribe('stateChange', (data) => {
      this.updateUI();
      this.checkGameConditions(data);
    });

    this.gameState.subscribe('stageUp', (data) => {
      this.handleStageUp(data);
    });

    this.gameState.subscribe('stageDown', (data) => {
      this.handleStageDown(data);
    });

    this.isInitialized = true;
    console.log('ゲームコントローラーが初期化されました');
  }

  setupEventListeners() {
    // スピンボタン
    const spinButton = document.getElementById('spin-button');
    if (spinButton) {
      spinButton.addEventListener('click', () => this.handleSpin());
    }

    // ベットボタン
    document.querySelectorAll('.bet-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const betAmount = e.target.dataset.bet;
        this.handleBetChange(betAmount);
      });
    });

    // スキルボタン
    document.querySelectorAll('.skill-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const skillName = e.target.dataset.skill;
        this.handleSkillUse(skillName);
      });
    });

    // オートプレイ（スピンボタン長押し）
    let pressTimer;
    if (spinButton) {
      spinButton.addEventListener('mousedown', () => {
        pressTimer = setTimeout(() => {
          this.toggleAutoPlay();
        }, 1000);
      });

      spinButton.addEventListener('mouseup', () => {
        clearTimeout(pressTimer);
      });

      spinButton.addEventListener('mouseleave', () => {
        clearTimeout(pressTimer);
      });
    }
  }

  async handleSpin() {
    if (!this.gameState.canSpin()) {
      await this.handleInsufficientFunds();
      return;
    }

    try {
      // スピン実行
      const result = await this.slotMachine.spin();

      // 勝利チェック
      const wins = this.paylineEngine.checkWin(result.reels);

      // 結果処理
      await this.processSpinResult(wins);

    } catch (error) {
      console.error('スピンエラー:', error);
      this.showMessage('スピンに失敗しました', 'error');
    }
  }

  async processSpinResult(wins) {
    if (wins.length > 0) {
      // 勝利演出
      await this.playWinAnimation(wins);

      // 配当計算
      const winSummary = this.paylineEngine.calculateWinSummary(wins, this.gameState.getState().bet);

      // 配当を追加
      this.gameState.endSpin(winSummary.winAmount);

      // 勝利メッセージ表示
      this.showWinMessage(winSummary);

    } else {
      // ハズレ処理
      this.gameState.endSpin(0);
    }

    // ゲーム終了チェック
    this.checkGameOver();
  }

  async playWinAnimation(wins) {
    // ペイライン強調表示
    this.paylineEngine.highlightWinningLines(wins);

    // 勝利音効果やエフェクトを追加する場合はここで実装

    // アニメーション完了まで待機
    await new Promise(resolve => setTimeout(resolve, 2000));

    // ハイライトクリア
    this.paylineEngine.clearHighlights();
  }

  showWinMessage(winSummary) {
    let messageType = 'success';
    let message = `${winSummary.winAmount} コイン獲得！`;

    if (winSummary.isJackpot) {
      messageType = 'jackpot';
      message = `🎰 JACKPOT! ${winSummary.winAmount} コイン！`;
    } else if (winSummary.isBigWin) {
      messageType = 'bigwin';
      message = `💰 BIG WIN! ${winSummary.winAmount} コイン！`;
    }

    this.showMessage(message, messageType);
  }

  handleBetChange(betAmount) {
    try {
      const state = this.gameState.getState();

      if (betAmount === 'max') {
        betAmount = state.coins;
      }

      if (!this.gameState.canAffordBet(betAmount)) {
        const info = this.gameState.getInsufficientFundsInfo();
        this.showInsufficientFundsMessage(info, betAmount);
        return;
      }

      const newBet = this.gameState.setBet(betAmount);
      if (state.coins >= newBet) {
        this.gameState.setState({ gameOver: false });
      }
      this.showMessage(`ベット: ${newBet} コイン`, 'info');
    } catch (error) {
      this.showMessage('ベット変更に失敗しました', 'warning');
    }
  }

  async handleSkillUse(skillName) {
    const state = this.gameState.getState();

    if (state.skills[skillName] <= 0) {
      this.showMessage('スキル使用回数が不足しています', 'warning');
      return;
    }

    if (state.isSpinning) {
      this.showMessage('スピン中はスキルを使用できません', 'warning');
      return;
    }

    try {
      this.gameState.useSkill(skillName);

      switch (skillName) {
        case 'timeFreeze':
          await this.executeTimeFreezeSkill();
          break;
        case 'futureVision':
          await this.executeFutureVisionSkill();
          break;
        case 'miracleSpin':
          await this.executeMiracleSpinSkill();
          break;
      }

    } catch (error) {
      console.error('スキル実行エラー:', error);
      this.showMessage('スキルの実行に失敗しました', 'error');
    }
  }

  async executeTimeFreezeSkill() {
    this.showMessage('⏱️ タイムフリーズ発動！リールをタップして停止させてください', 'skill');

    // タイムフリーズモード開始
    const reelElements = this.slotMachine.getReelElements();
    let stoppedReels = 0;
    const reelResults = [];

    return new Promise((resolve) => {
      reelElements.forEach((reel, reelIndex) => {
        reel.forEach(symbol => {
          symbol.addEventListener('click', () => {
            if (!symbol.dataset.stopped) {
              // リール停止
              const result = this.slotMachine.stopReel(reelIndex);
              reelResults[reelIndex] = result;

              // 視覚的フィードバック
              reel.forEach((el, idx) => {
                el.textContent = result[idx].emoji;
                el.dataset.stopped = 'true';
                el.classList.add('frozen');
              });

              stoppedReels++;

              if (stoppedReels === 3) {
                // 全リール停止完了
                setTimeout(() => {
                  this.processTimeFreezeResult(reelResults);
                  resolve();
                }, 500);
              }
            }
          });
        });
      });
    });
  }

  async processTimeFreezeResult(reelResults) {
    const wins = this.paylineEngine.checkWin(reelResults);
    await this.processSpinResult(wins);

    // フリーズ状態をクリア
    document.querySelectorAll('.symbol').forEach(el => {
      el.classList.remove('frozen');
      el.dataset.stopped = '';
    });
  }

  async executeFutureVisionSkill() {
    this.showMessage('👁️ フューチャービジョン発動！', 'skill');

    // 次5スピンの結果を予測表示
    const futureResults = [];
    const currentSeed = Date.now(); // 現在時刻をシードとして使用

    for (let i = 0; i < 5; i++) {
      const result = this.slotMachine.generatePredictableResult(currentSeed + i);
      futureResults.push(result);
    }

    // プレビューUI表示
    this.showFuturePreview(futureResults);
  }

  showFuturePreview(results) {
    // モーダルでプレビュー表示
    const modal = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');

    modalContent.innerHTML = `
      <h3>🔮 FUTURE VISION</h3>
      <p>次の5スピンの結果予測：</p>
      <div class="future-previews">
        ${results.map((result, index) => `
          <div class="future-preview">
            <h4>スピン ${index + 1}</h4>
            <div class="mini-grid">
              ${result.flat().map(symbol => `<span>${symbol.emoji}</span>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>
      <button onclick="document.getElementById('modal-overlay').style.display='none'">閉じる</button>
    `;

    modal.style.display = 'block';
  }

  async executeMiracleSpinSkill() {
    this.showMessage('✨ ミラクルスピン発動！', 'skill');

    // 確定大当たり結果生成
    const guaranteedWin = this.slotMachine.generateGuaranteedWin();

    // 特別演出付きでスピン
    await this.slotMachine.playSpinAnimation(guaranteedWin);
    this.slotMachine.displayResult(guaranteedWin);

    // 勝利処理（特別倍率適用）
    const wins = this.paylineEngine.checkWin(guaranteedWin);
    const winSummary = this.paylineEngine.calculateWinSummary(wins, this.gameState.getState().bet);

    // ミラクルボーナス適用
    const miracleAmount = winSummary.winAmount * 10; // 10倍ボーナス
    this.gameState.endSpin(miracleAmount);

    this.showMessage(`🌟 MIRACLE! ${miracleAmount} コイン獲得！`, 'miracle');
  }

  toggleAutoPlay() {
    this.autoPlay = !this.autoPlay;

    if (this.autoPlay) {
      this.startAutoPlay();
      this.showMessage('🔄 オートプレイ開始', 'info');
    } else {
      this.stopAutoPlay();
      this.showMessage('⏹️ オートプレイ停止', 'info');
    }
  }

  startAutoPlay() {
    this.autoPlayInterval = setInterval(async () => {
      if (this.gameState.canSpin() && !this.gameState.getState().isSpinning) {
        await this.handleSpin();
      } else {
        this.stopAutoPlay();
      }
    }, 3000); // 3秒間隔
  }

  stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
    this.autoPlay = false;
  }

  updateUI() {
    const state = this.gameState.getState();

    // コイン表示更新
    const coinsDisplay = document.getElementById('coins-display');
    if (coinsDisplay) {
      coinsDisplay.textContent = state.coins.toLocaleString();
    }

    // ベット表示更新
    const betDisplay = document.getElementById('bet-display');
    if (betDisplay) {
      betDisplay.textContent = state.bet.toLocaleString();
    }

    // マルチプライヤー表示更新
    const multiplierDisplay = document.getElementById('multiplier-display');
    if (multiplierDisplay) {
      multiplierDisplay.textContent = `×${state.multiplier.toFixed(1)}`;
    }

    // ステージ表示更新
    const stageDisplay = document.getElementById('stage-display');
    if (stageDisplay) {
      stageDisplay.textContent = state.stage;
    }

    // ヒートゲージ更新
    const heatFill = document.getElementById('heat-fill');
    if (heatFill) {
      heatFill.style.width = `${state.heatGauge}%`;
    }

    // スキル使用回数更新
    Object.keys(state.skills).forEach(skillName => {
      const countElement = document.getElementById(`${skillName.toLowerCase().replace(/([A-Z])/g, '-$1')}-count`);
      if (countElement) {
        countElement.textContent = state.skills[skillName];
      }
    });

    // 連続外れ回数表示更新
    const lossCountDisplay = document.getElementById('consecutive-losses-display');
    if (lossCountDisplay) {
      if (state.stage > 1 && state.consecutiveLosses > 0) {
        lossCountDisplay.textContent = `連続外れ: ${state.consecutiveLosses}/10`;
        lossCountDisplay.style.display = 'block';

        // 警告色設定
        if (state.consecutiveLosses >= 8) {
          lossCountDisplay.style.color = '#ff4444';
          lossCountDisplay.style.animation = 'pulse 1s infinite';
        } else if (state.consecutiveLosses >= 5) {
          lossCountDisplay.style.color = '#ffa500';
          lossCountDisplay.style.animation = 'none';
        } else {
          lossCountDisplay.style.color = '#ffffff';
          lossCountDisplay.style.animation = 'none';
        }
      } else {
        lossCountDisplay.style.display = 'none';
      }
    }

    // スピンボタン状態更新
    const spinButton = document.getElementById('spin-button');
    if (spinButton) {
      const canSpin = this.gameState.canSpin();
      spinButton.disabled = !canSpin || state.isSpinning;
      spinButton.classList.toggle('spinning', state.isSpinning);

      if (!canSpin && !state.isSpinning) {
        if (state.coins < state.bet) {
          spinButton.textContent = '残高不足';
          spinButton.classList.add('insufficient-funds');
        } else if (state.gameOver) {
          spinButton.textContent = 'ゲーム終了';
          spinButton.classList.add('game-over');
        }
      } else {
        spinButton.textContent = 'SPIN';
        spinButton.classList.remove('insufficient-funds', 'game-over');
      }
    }

    // 残高警告表示
    this.updateBalanceWarnings(state);
  }

  updateBalanceWarnings(state) {
    const warningElements = document.querySelectorAll('.balance-warning');
    warningElements.forEach(el => el.remove());

    const coinsDisplay = document.getElementById('coins-display');
    if (!coinsDisplay) return;

    if (state.coins < state.bet) {
      const warning = document.createElement('div');
      warning.className = 'balance-warning insufficient';
      warning.innerHTML = '⚠️ 残高不足';
      warning.style.cssText = `
        color: #ff4444;
        font-size: 0.8em;
        margin-top: 0.25rem;
        animation: pulse 1s infinite;
      `;
      coinsDisplay.parentElement.appendChild(warning);
    } else if (state.coins <= state.bet * 3) {
      const warning = document.createElement('div');
      warning.className = 'balance-warning low';
      warning.innerHTML = '💰 残高が少なくなっています';
      warning.style.cssText = `
        color: #ffa500;
        font-size: 0.8em;
        margin-top: 0.25rem;
      `;
      coinsDisplay.parentElement.appendChild(warning);
    }
  }

  checkGameConditions(data) {
    const state = data.newState;

    // ゲームオーバーチェック
    if (state.gameOver) {
      this.handleGameOver();
    }

    // フィーバーモードチェック
    if (state.heatGauge >= 100) {
      this.activateFeverMode();
    }

    // 残高警告チェック
    if (state.coins <= state.bet * 2 && state.coins > 0) {
      this.showLowBalanceWarning(state);
    }
  }

  showLowBalanceWarning(state) {
    const spinsLeft = Math.floor(state.coins / state.bet);
    this.showMessage(`💰 残高警告: あと${spinsLeft}回でゲーム終了です`, 'warning');
  }

  handleStageUp(data) {
    // ステージアップボーナス
    const bonus = 1000 * data.newStage;
    this.gameState.updateCoins(bonus);

    // スキル回復
    const currentSkills = this.gameState.getState().skills;
    this.gameState.setState({
      skills: {
        timeFreeze: currentSkills.timeFreeze + 1,
        futureVision: currentSkills.futureVision + 1,
        miracleSpin: currentSkills.miracleSpin + 1
      }
    });

    // 画面上にステージアップ表示
    if (data.reason === 'HEAT MAX') {
      this.showStageUpDisplay(data.newStage, 'HEAT MAX');
    } else {
      this.showStageUpDisplay(data.newStage, 'COINS');
    }
  }

  handleStageDown(data) {
    // 画面上にステージダウン表示
    this.showStageDownDisplay(data.newStage, data.reason);
  }

  showStageUpDisplay(newStage, reason) {
    const display = document.createElement('div');
    display.className = 'stage-notification stage-up';
    display.innerHTML = `
      <div class="stage-notification-content">
        <div class="stage-icon">🎉</div>
        <div class="stage-title">STAGE UP!</div>
        <div class="stage-number">STAGE ${newStage}</div>
        <div class="stage-reason">${reason === 'HEAT MAX' ? '🔥 HEAT MAX!' : '💰 COIN MILESTONE!'}</div>
        <div class="stage-bonus">+${1000 * newStage} COINS</div>
        <div class="stage-skills">+1 ALL SKILLS</div>
      </div>
    `;

    document.body.appendChild(display);

    // アニメーション開始
    setTimeout(() => display.classList.add('show'), 100);

    // 5秒後に削除
    setTimeout(() => {
      display.classList.add('fade-out');
      setTimeout(() => {
        if (display.parentNode) {
          display.parentNode.removeChild(display);
        }
      }, 500);
    }, 5000);
  }

  showStageDownDisplay(newStage, reason) {
    const display = document.createElement('div');
    display.className = 'stage-notification stage-down';
    display.innerHTML = `
      <div class="stage-notification-content">
        <div class="stage-icon">💥</div>
        <div class="stage-title">STAGE DOWN</div>
        <div class="stage-number">STAGE ${newStage}</div>
        <div class="stage-reason">${reason}</div>
        <div class="stage-warning">連続外れによる降格</div>
      </div>
    `;

    document.body.appendChild(display);

    // アニメーション開始
    setTimeout(() => display.classList.add('show'), 100);

    // 4秒後に削除
    setTimeout(() => {
      display.classList.add('fade-out');
      setTimeout(() => {
        if (display.parentNode) {
          display.parentNode.removeChild(display);
        }
      }, 500);
    }, 4000);
  }

  activateFeverMode() {
    this.showMessage('🔥 FEVER MODE 突入！', 'fever');

    // フィーバーモード効果
    this.gameState.setState({
      multiplier: 2.0,
      heatGauge: 0
    });

    // 10秒後に通常モードに戻る
    setTimeout(() => {
      this.gameState.setState({ multiplier: 1.0 });
      this.showMessage('フィーバーモード終了', 'info');
    }, 10000);
  }

  checkGameOver() {
    const state = this.gameState.getState();

    if (state.coins <= 0 && state.bet > 0) {
      this.handleGameOver();
    }
  }

  handleGameOver() {
    this.stopAutoPlay();
    this.showMessage('🎰 GAME OVER', 'game-over');

    // リスタートオプション表示
    setTimeout(() => {
      if (confirm('ゲームをリスタートしますか？')) {
        this.restartGame();
      }
    }, 2000);
  }

  restartGame() {
    this.gameState.reset();
    this.slotMachine.reset();
    this.paylineEngine.clearHighlights();
    this.showMessage('ゲームをリスタートしました', 'info');
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
    this.showMessage('💸 残高がゼロになりました', 'error');

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
      this.gameState.setBet(info.suggestedBet);
      this.gameState.setState({ gameOver: false });
      this.showMessage(`ベットを ${info.suggestedBet} コインに調整しました`, 'success');
      dialog.remove();
      resolve();
    });

    dialog.querySelector('.all-in')?.addEventListener('click', () => {
      this.gameState.setBet(info.currentCoins);
      this.gameState.setState({ gameOver: false });
      this.showMessage(`ALL IN! ${info.currentCoins} コインをベット`, 'warning');
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

  showInsufficientFundsMessage(info, attemptedBet) {
    const message = `残高不足: ${attemptedBet} コイン必要、現在 ${info.currentCoins} コイン`;
    this.showMessage(message, 'warning');
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

  showMessage(message, type = 'info', duration = 3000) {
    // メッセージ表示システム
    console.log(`[${type.toUpperCase()}] ${message}`);

    // 既存の通知をクリア（重複を避ける）
    const existingNotifications = document.querySelectorAll('.game-notification');
    existingNotifications.forEach(notification => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    });

    // 通知要素を作成
    const notification = document.createElement('div');
    notification.className = `game-notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">${this.getNotificationIcon(type)}</div>
        <div class="notification-message">${message}</div>
      </div>
    `;

    document.body.appendChild(notification);

    // アニメーション開始
    setTimeout(() => notification.classList.add('show'), 100);

    // 指定時間後に削除
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);
  }

  getNotificationIcon(type) {
    const icons = {
      'info': 'ℹ️',
      'success': '✅',
      'warning': '⚠️',
      'error': '❌',
      'skill': '✨',
      'fever': '🔥',
      'stage-up': '🎉',
      'stage-down': '💥',
      'game-over': '🎰',
      'miracle': '🌟'
    };
    return icons[type] || 'ℹ️';
  }

  validateGameBalance() {
    const validation = validateSymbolProbabilities();
    console.log('ゲームバランス検証:', validation);

    if (!validation.isValid) {
      console.warn('⚠️ RTPが目標範囲外です。バランス調整が必要です。');
    }
  }

  // デバッグ用メソッド
  debug() {
    return {
      state: this.gameState.getState(),
      stats: this.gameState.getStats(),
      isInitialized: this.isInitialized,
      autoPlay: this.autoPlay
    };
  }

  // 強制勝利（開発・テスト用）
  async forceWin(symbolName = 'seven') {
    const testResult = this.slotMachine.generateTestResult(symbolName);
    this.slotMachine.displayResult(testResult);

    const wins = this.paylineEngine.checkWin(testResult);
    await this.processSpinResult(wins);
  }
}

