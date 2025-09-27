class PaylineEngine {
  constructor() {
    this.paylines = [
      [[0,0], [1,0], [2,0]], // 横上
      [[0,1], [1,1], [2,1]], // 横中
      [[0,2], [1,2], [2,2]], // 横下
      [[0,0], [1,1], [2,2]], // 斜め＼
      [[0,2], [1,1], [2,0]]  // 斜め／
    ];

    this.paylineNames = [
      'horizontal-top',
      'horizontal-middle',
      'horizontal-bottom',
      'diagonal-down',
      'diagonal-up'
    ];
  }

  checkWin(reelResult) {
    const wins = [];

    this.paylines.forEach((line, index) => {
      const symbols = line.map(([col, row]) => reelResult[col][row]);

      if (this.isWinningLine(symbols)) {
        const payout = this.calculatePayout(symbols[0], symbols);

        wins.push({
          lineIndex: index,
          lineName: this.paylineNames[index],
          line: line,
          symbols: symbols,
          symbol: symbols[0],
          payout: payout,
          multiplier: this.getSymbolMultiplier(symbols)
        });
      }
    });

    return wins;
  }

  isWinningLine(symbols) {
    // 空シンボルは勝利対象外
    if (symbols[0].name === 'empty') {
      return false;
    }

    // 全て同じシンボルかチェック
    return symbols[0].name === symbols[1].name &&
           symbols[1].name === symbols[2].name;
  }

  calculatePayout(symbol, matchedSymbols) {
    if (!symbol || symbol.name === 'empty') {
      return 0;
    }

    let basePayout = symbol.payout;

    // 連続勝利ボーナス
    const consecutiveMultiplier = this.getConsecutiveMultiplier();

    // 特殊シンボルボーナス
    const specialMultiplier = this.getSpecialSymbolMultiplier(symbol);

    return Math.floor(basePayout * consecutiveMultiplier * specialMultiplier);
  }

  getSymbolMultiplier(symbols) {
    const symbolName = symbols[0].name;

    switch (symbolName) {
      case 'seven':
        return 5.0; // 7️⃣は5倍
      case 'diamond':
        return 3.0; // 🔷は3倍
      case 'lightning':
        return 2.5; // ⚡は2.5倍
      case 'fire':
        return 2.0; // 🔥は2倍
      default:
        return 1.0;
    }
  }

  getConsecutiveMultiplier() {
    // GameStateから連続勝利数を取得して倍率計算
    // 実際の実装では gameState を参照
    return 1.0; // 基本実装
  }

  getSpecialSymbolMultiplier(symbol) {
    if (symbol.name === 'seven') {
      return 2.0; // セブンは追加で2倍
    }
    return 1.0;
  }

  // 勝利ラインの視覚的ハイライト
  highlightWinningLines(wins) {
    // 既存のハイライトをクリア
    this.clearHighlights();

    wins.forEach((win, index) => {
      setTimeout(() => {
        this.highlightLine(win.line, win.lineName);
        this.highlightSymbols(win.line);
      }, index * 200); // 順次ハイライト
    });
  }

  highlightLine(line, lineName) {
    const paylineContainer = document.getElementById('paylines');

    // ペイライン表示要素を作成
    const lineElement = document.createElement('div');
    lineElement.className = `payline active ${lineName}`;
    lineElement.dataset.line = lineName;

    // ライン描画（実際の実装では SVG や Canvas を使用）
    this.drawLine(lineElement, line);

    paylineContainer.appendChild(lineElement);
  }

  highlightSymbols(line) {
    line.forEach(([col, row]) => {
      const symbolIndex = col * 3 + row;
      const symbolElement = document.querySelectorAll('.symbol')[symbolIndex];

      if (symbolElement) {
        symbolElement.classList.add('winning', 'flash');

        // フラッシュ効果
        setTimeout(() => {
          symbolElement.classList.remove('flash');
        }, 1000);
      }
    });
  }

  drawLine(lineElement, line) {
    // 簡易的なライン描画実装
    // 実際のプロジェクトでは CSS や SVG でより詳細に実装

    const startPos = line[0];
    const endPos = line[2];

    lineElement.style.cssText = `
      position: absolute;
      pointer-events: none;
      z-index: 10;
    `;

    // ライン方向に応じたクラス追加
    if (startPos[0] === endPos[0]) {
      lineElement.classList.add('horizontal');
    } else {
      lineElement.classList.add('diagonal');
    }
  }

  clearHighlights() {
    // ペイラインハイライトをクリア
    const paylines = document.querySelectorAll('.payline.active');
    paylines.forEach(line => line.remove());

    // シンボルハイライトをクリア
    const symbols = document.querySelectorAll('.symbol.winning');
    symbols.forEach(symbol => {
      symbol.classList.remove('winning', 'flash');
    });
  }

  // 全勝利情報の計算
  calculateWinSummary(wins, bet) {
    const totalPayout = wins.reduce((sum, win) => sum + win.payout, 0);
    const totalMultiplier = wins.reduce((sum, win) => sum + win.multiplier, 0);
    const winAmount = Math.floor(totalPayout * bet);

    return {
      totalLines: wins.length,
      totalPayout: totalPayout,
      totalMultiplier: totalMultiplier,
      winAmount: winAmount,
      isJackpot: wins.some(win => win.symbol.name === 'seven'),
      isBigWin: winAmount >= bet * 10,
      payoutRatio: totalPayout / bet
    };
  }

  // ペイテーブル表示用データ生成
  getPaytable() {
    return [
      { symbol: "7️⃣", name: "SEVEN", payout: 200, description: "JACKPOT!" },
      { symbol: "🔷", name: "DIAMOND", payout: 100, description: "HIGH WIN" },
      { symbol: "⚡", name: "LIGHTNING", payout: 50, description: "BIG WIN" },
      { symbol: "🔥", name: "FIRE", payout: 30, description: "GOOD WIN" },
      { symbol: "💎", name: "GEM", payout: 20, description: "WIN" },
      { symbol: "✨", name: "SPARKLE", payout: 10, description: "SMALL WIN" },
      { symbol: "🌙", name: "MOON", payout: 5, description: "MINI WIN" }
    ];
  }

  // デバッグ用：特定パターンの勝利チェック
  debugCheckPattern(pattern) {
    console.log('Debug: Checking pattern', pattern);

    const wins = this.checkWin(pattern);
    const summary = this.calculateWinSummary(wins, 100);

    console.log('Wins found:', wins);
    console.log('Win summary:', summary);

    return { wins, summary };
  }

  // 統計用：勝利確率計算
  calculateWinProbability(symbolProbabilities) {
    let totalWinProbability = 0;

    symbolProbabilities.forEach(symbolProb => {
      if (symbolProb.payout > 0) {
        const lineWinProb = Math.pow(symbolProb.probability, 3);
        const allLinesWinProb = lineWinProb * this.paylines.length;
        totalWinProbability += allLinesWinProb;
      }
    });

    return Math.min(totalWinProbability, 1.0); // 100%を超えないように制限
  }

  // RTP計算補助
  calculateExpectedReturn(symbolProbabilities, averageBet) {
    let expectedReturn = 0;

    symbolProbabilities.forEach(symbolProb => {
      if (symbolProb.payout > 0) {
        const hitProbability = Math.pow(symbolProb.probability, 3);
        const lineReturn = hitProbability * symbolProb.payout * averageBet;
        expectedReturn += lineReturn * this.paylines.length;
      }
    });

    return expectedReturn;
  }
}

export default PaylineEngine;