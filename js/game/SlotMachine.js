import { symbols, getSymbolByWeight } from '../data/symbols.js';

class SlotMachine {
  constructor(gameState) {
    this.gameState = gameState;
    this.symbols = symbols;
    this.reels = [[], [], []]; // 3x3
    this.isAnimating = false;
    this.animationSpeed = 100; // ms
    this.spinDuration = 1500; // ms
  }

  async spin() {
    if (this.isAnimating) {
      throw new Error('スロットは既に回転中です');
    }

    if (!this.gameState.canSpin()) {
      throw new Error('スピンできません');
    }

    this.gameState.startSpin();
    this.isAnimating = true;

    try {
      // リール生成
      const reelResult = this.generateReelResult();

      // アニメーション実行
      await this.playSpinAnimation(reelResult);

      // 結果を表示
      this.displayResult(reelResult);

      this.isAnimating = false;

      return {
        reels: reelResult,
        isSuccess: true
      };
    } catch (error) {
      this.isAnimating = false;
      throw error;
    }
  }

  generateReelResult() {
    const result = [];

    for (let col = 0; col < 3; col++) {
      const reel = [];
      for (let row = 0; row < 3; row++) {
        const symbol = this.getRandomSymbol();
        reel.push(symbol);
      }
      result.push(reel);
    }

    return result;
  }

  getRandomSymbol() {
    // 暗号学的に安全な乱数を使用
    const randomArray = new Uint32Array(1);
    crypto.getRandomValues(randomArray);
    const randomValue = randomArray[0] / (0xffffffff + 1);

    return getSymbolByWeight(randomValue);
  }

  async playSpinAnimation(finalResult) {
    const reelElements = this.getReelElements();

    // 各リールでアニメーション開始
    const animationPromises = reelElements.map((reel, reelIndex) =>
      this.animateReel(reel, finalResult[reelIndex], reelIndex)
    );

    // 全リールのアニメーション完了を待機
    await Promise.all(animationPromises);
  }

  async animateReel(reelElements, finalSymbols, reelIndex) {
    const spinCount = 20 + reelIndex * 5; // リールごとに異なる回転数
    const symbols = this.symbols.filter(s => s.emoji !== ""); // 空シンボルを除外

    return new Promise((resolve) => {
      let currentSpin = 0;

      const spinInterval = setInterval(() => {
        reelElements.forEach((element, symbolIndex) => {
          if (currentSpin < spinCount) {
            // ランダムシンボル表示
            const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
            element.textContent = randomSymbol.emoji;
            element.className = 'symbol spinning';
          } else {
            // 最終結果表示
            const finalSymbol = finalSymbols[symbolIndex];
            element.textContent = finalSymbol.emoji;
            element.className = 'symbol';
            element.dataset.symbol = finalSymbol.name;
          }
        });

        currentSpin++;

        if (currentSpin > spinCount) {
          clearInterval(spinInterval);
          resolve();
        }
      }, this.animationSpeed);
    });
  }

  getReelElements() {
    const slotGrid = document.getElementById('slot-grid');
    const symbols = slotGrid.querySelectorAll('.symbol');

    // 3x3グリッドを列ごとにグループ化
    const reels = [[], [], []];

    symbols.forEach((symbol, index) => {
      const col = Math.floor(index / 3);
      reels[col].push(symbol);
    });

    return reels;
  }

  displayResult(reelResult) {
    const symbols = document.querySelectorAll('.symbol');

    reelResult.forEach((reel, reelIndex) => {
      reel.forEach((symbol, symbolIndex) => {
        const elementIndex = reelIndex * 3 + symbolIndex;
        const element = symbols[elementIndex];

        if (element) {
          element.textContent = symbol.emoji;
          element.dataset.symbol = symbol.name;
          element.className = 'symbol';

          // 勝利ラインの場合は特別なクラスを追加
          if (symbol.payout > 0) {
            element.classList.add('potential-win');
          }
        }
      });
    });
  }

  // タイムフリーズスキル用：個別リール停止
  stopReel(reelIndex) {
    if (reelIndex < 0 || reelIndex >= 3) {
      throw new Error('無効なリールインデックス');
    }

    // 指定されたリールの結果を生成
    const reel = [];
    for (let row = 0; row < 3; row++) {
      reel.push(this.getRandomSymbol());
    }

    return reel;
  }

  // ミラクルスピン用：確定勝利結果生成
  generateGuaranteedWin() {
    const topSymbol = this.symbols.find(s => s.payout === 200); // 7️⃣

    return [
      [topSymbol, topSymbol, topSymbol],
      [topSymbol, topSymbol, topSymbol],
      [topSymbol, topSymbol, topSymbol]
    ];
  }

  // フューチャービジョン用：シード値による予測可能な結果生成
  generatePredictableResult(seed) {
    // 簡易的な線形合同法による擬似乱数
    let currentSeed = seed;
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);

    const pseudoRandom = () => {
      currentSeed = (a * currentSeed + c) % m;
      return currentSeed / m;
    };

    const result = [];
    for (let col = 0; col < 3; col++) {
      const reel = [];
      for (let row = 0; row < 3; row++) {
        const randomValue = pseudoRandom();
        const symbol = getSymbolByWeight(randomValue);
        reel.push(symbol);
      }
      result.push(reel);
    }

    return result;
  }

  // デバッグ用：特定のシンボルで結果を生成
  generateTestResult(symbolName) {
    const targetSymbol = this.symbols.find(s => s.name === symbolName);
    if (!targetSymbol) {
      throw new Error(`不明なシンボル: ${symbolName}`);
    }

    return [
      [targetSymbol, targetSymbol, targetSymbol],
      [targetSymbol, targetSymbol, targetSymbol],
      [targetSymbol, targetSymbol, targetSymbol]
    ];
  }

  // 現在のリール状態を取得
  getCurrentState() {
    const symbols = document.querySelectorAll('.symbol');
    const result = [[], [], []];

    symbols.forEach((element, index) => {
      const col = Math.floor(index / 3);
      const row = index % 3;
      const symbolName = element.dataset.symbol || 'empty';
      const symbol = this.symbols.find(s => s.name === symbolName) || this.symbols[this.symbols.length - 1];

      if (!result[col]) result[col] = [];
      result[col][row] = symbol;
    });

    return result;
  }

  reset() {
    this.isAnimating = false;

    // リール表示をリセット
    const symbols = document.querySelectorAll('.symbol');
    symbols.forEach(element => {
      element.textContent = '';
      element.className = 'symbol';
      element.dataset.symbol = '';
    });
  }
}

export default SlotMachine;