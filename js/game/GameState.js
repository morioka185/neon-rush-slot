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
      consecutiveLosses: 0,
      skills: {
        timeFreeze: 1,
        futureVision: 1,
        miracleSpin: 1
      },
      isSpinning: false,
      gameOver: false
    };
    this.listeners = new Map();
    this.load();
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  unsubscribe(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  notify(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        callback(data);
      });
    }
  }

  setState(newState) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...newState };

    if (this.state.coins > this.state.maxCoins) {
      this.state.maxCoins = this.state.coins;
    }

    if (this.state.coins <= 0 && this.state.bet > 0) {
      this.state.gameOver = true;
    } else if (this.state.coins >= this.state.bet && this.state.bet > 0) {
      this.state.gameOver = false;
    }

    this.notify('stateChange', {
      oldState,
      newState: this.state,
      changes: newState
    });

    this.save();
    return this.state;
  }

  getState() {
    return { ...this.state };
  }

  updateCoins(amount) {
    const newCoins = Math.max(0, this.state.coins + amount);
    const updateData = { coins: newCoins };

    if (newCoins >= this.state.bet && this.state.bet > 0) {
      updateData.gameOver = false;
    }

    this.setState(updateData);
    return newCoins;
  }

  setBet(amount) {
    if (amount === 'max') {
      amount = this.state.coins;
    }

    const bet = Math.min(amount, this.state.coins);
    this.setState({ bet });
    return bet;
  }

  canSpin() {
    return !this.state.isSpinning &&
           this.state.bet > 0 &&
           this.state.coins >= this.state.bet &&
           !this.state.gameOver;
  }

  canAffordBet(betAmount = null) {
    const bet = betAmount || this.state.bet;
    return this.state.coins >= bet;
  }

  getInsufficientFundsInfo() {
    return {
      currentCoins: this.state.coins,
      requiredBet: this.state.bet,
      shortage: this.state.bet - this.state.coins,
      suggestedBet: Math.max(1, this.state.coins),
      canContinue: this.state.coins > 0
    };
  }

  startSpin() {
    if (!this.canSpin()) {
      throw new Error('スピンできません');
    }

    this.setState({
      isSpinning: true,
      totalSpins: this.state.totalSpins + 1
    });

    this.updateCoins(-this.state.bet);
  }

  endSpin(winAmount = 0) {
    const isWin = winAmount > 0;
    const consecutiveWins = isWin ? this.state.consecutiveWins + 1 : 0;
    const consecutiveLosses = isWin ? 0 : this.state.consecutiveLosses + 1;

    let heatGauge = this.state.heatGauge;
    if (isWin) {
      heatGauge = Math.min(100, heatGauge + (winAmount / this.state.bet * 10));
    }
    // HEATゲージは外れても減少しない

    this.setState({
      isSpinning: false,
      consecutiveWins,
      consecutiveLosses,
      heatGauge
    });

    if (winAmount > 0) {
      this.updateCoins(winAmount);
    }

    // HEAT MAX時のステージアップチェック
    if (heatGauge >= 100 && this.state.stage < 5) {
      this.setState({
        stage: Math.min(5, this.state.stage + 1),
        heatGauge: 0
      });
      this.notify('stageUp', { newStage: this.state.stage, oldStage: this.state.stage - 1, reason: 'HEAT MAX' });
    }

    // 10連続外れでステージダウン（STAGE2以上の場合）
    if (consecutiveLosses >= 10 && this.state.stage > 1) {
      this.setState({
        stage: 1,
        consecutiveLosses: 0
      });
      this.notify('stageDown', { newStage: 1, oldStage: this.state.stage, reason: '10連続外れ' });
    }

    this.checkStageUp();
  }

  checkStageUp() {
    const coinsThresholds = [0, 15000, 30000, 50000, 100000];
    let newStage = 1;

    for (let i = coinsThresholds.length - 1; i >= 0; i--) {
      if (this.state.coins >= coinsThresholds[i]) {
        newStage = i + 1;
        break;
      }
    }

    if (newStage > this.state.stage) {
      this.setState({ stage: newStage });
      this.notify('stageUp', { newStage, oldStage: this.state.stage });
    }
  }

  useSkill(skillName) {
    if (this.state.skills[skillName] <= 0) {
      throw new Error(`${skillName}の使用回数が不足しています`);
    }

    this.setState({
      skills: {
        ...this.state.skills,
        [skillName]: this.state.skills[skillName] - 1
      }
    });
  }

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
      consecutiveLosses: 0,
      skills: {
        timeFreeze: 1,
        futureVision: 1,
        miracleSpin: 1
      },
      isSpinning: false,
      gameOver: false
    };
    this.save();
    this.notify('stateReset', this.state);
  }

  save() {
    try {
      localStorage.setItem('neonRushGameState', JSON.stringify(this.state));
    } catch (error) {
      console.warn('ゲーム状態の保存に失敗しました:', error);
    }
  }

  load() {
    try {
      const saved = localStorage.getItem('neonRushGameState');
      if (saved) {
        const loadedState = JSON.parse(saved);
        Object.assign(this.state, loadedState);

        // 常にスピン状態はリセット
        this.state.isSpinning = false;

        // ロード時にゲームオーバー状態を再評価
        if (this.state.coins >= this.state.bet && this.state.bet > 0) {
          this.state.gameOver = false;
        } else if (this.state.coins <= 0 && this.state.bet > 0) {
          this.state.gameOver = true;
        }
      }
    } catch (error) {
      console.warn('ゲーム状態の読み込みに失敗しました:', error);
    }
  }

  getStats() {
    return {
      totalSpins: this.state.totalSpins,
      maxCoins: this.state.maxCoins,
      currentStage: this.state.stage,
      consecutiveWins: this.state.consecutiveWins,
      heatGauge: this.state.heatGauge
    };
  }
}

export default GameState;