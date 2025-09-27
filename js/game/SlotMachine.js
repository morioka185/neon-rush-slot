import { symbols, getSymbolByWeight } from '../data/symbols.js';
import { SlotEffects } from '../effects/SlotEffects.js';
import { CountUpEffect } from '../effects/CountUpEffect.js';

export class SlotMachine {
  constructor(gameState, audioManager = null, effectSystem = null) {
    this.gameState = gameState;
    this.audioManager = audioManager;
    this.effectSystem = effectSystem;
    this.symbols = symbols;
    this.reels = [[], [], []]; // 3x3
    this.isAnimating = false;
    this.animationSpeed = 100; // ms
    this.spinDuration = 1500; // ms

    // 新演出システム初期化
    this.slotEffects = new SlotEffects(
      document.getElementById('gameContainer') || document.body,
      this.audioManager
    );
    this.countUpEffect = new CountUpEffect(this.audioManager);
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
      // リール生成と当選タイプ取得
      const winType = this.determineWinType();
      const reelResult = this.generateSymbolsByWinType(winType);

      // 当選タイプに応じた演出準備
      await this.prepareWinEffects(winType);

      // アニメーション実行
      await this.playSpinAnimation(reelResult, winType);

      // 結果を表示
      this.displayResult(reelResult);

      // 当選演出実行
      await this.executeWinEffects(winType, reelResult);

      this.isAnimating = false;

      return {
        reels: reelResult,
        winType: winType,
        isSuccess: true
      };
    } catch (error) {
      this.isAnimating = false;
      throw error;
    }
  }

  generateReelResult() {
    // まず当選判定を行う
    const winType = this.determineWinType();

    // 当選内容に基づいて図柄を決定
    return this.generateSymbolsByWinType(winType);
  }

  determineWinType() {
    // 0〜100の間でランダムに数値を算出
    const randomArray = new Uint32Array(1);
    crypto.getRandomValues(randomArray);
    let randomValue = Math.floor((randomArray[0] / (0xffffffff + 1)) * 101);

    // ステージ別当選確率調整（より緩やかな上昇）
    const stage = this.gameState.getState().stage;
    const stageMultipliers = [1.0, 1.1, 1.2, 1.35, 1.5]; // ステージ1-5の倍率（大幅に削減）
    const adjustedMultiplier = stageMultipliers[stage - 1] || 1;

    // 基本確率の設定（より厳しく）
    const jackpotChance = 1; // ジャックポット 1%（変更なし）
    const bigWinBase = 3; // ビッグウィン基本確率 3%（10→3に削減）
    const smallWinBase = 15; // スモールウィン基本確率 15%（39→15に削減）
    const reachBase = 25; // リーチ演出基本確率 25%（30→25に削減）

    // ステージ補正後の確率計算
    const bigWinThreshold = Math.min(8, bigWinBase * adjustedMultiplier); // 最大8%
    const smallWinThreshold = Math.min(25, smallWinBase * adjustedMultiplier); // 最大25%
    const reachThreshold = Math.min(35, reachBase + (stage - 1) * 2); // リーチは段階的増加

    if (randomValue === 0) {
      return 'jackpot'; // 1% ジャックポット
    } else if (randomValue >= 1 && randomValue <= bigWinThreshold) {
      return 'big_win'; // 3-8% ビッグウィン
    } else if (randomValue >= bigWinThreshold + 1 && randomValue <= bigWinThreshold + smallWinThreshold) {
      return 'small_win'; // 15-25% スモールウィン
    } else if (randomValue >= bigWinThreshold + smallWinThreshold + 1 && randomValue <= bigWinThreshold + smallWinThreshold + reachThreshold) {
      return 'fake_win'; // 25-35% リーチ演出
    } else {
      return 'miss'; // 約40-55% 完全ハズレ
    }
  }

  generateSymbolsByWinType(winType) {
    const result = [];

    switch (winType) {
      case 'jackpot':
        // 大当たり：7が揃う
        return this.generateWinningResult('seven');

      case 'big_win':
        // 中当たり：ダイヤモンドか雷が揃う
        const bigWinSymbols = ['diamond', 'lightning'];
        const selectedSymbol = bigWinSymbols[Math.floor(Math.random() * bigWinSymbols.length)];
        return this.generateWinningResult(selectedSymbol);

      case 'small_win':
        // 小当たり：火、宝石、スパークル、月のいずれかが揃う
        const smallWinSymbols = ['fire', 'gem', 'sparkle', 'moon'];
        const selectedSymbol2 = smallWinSymbols[Math.floor(Math.random() * smallWinSymbols.length)];
        return this.generateWinningResult(selectedSymbol2);

      case 'fake_win':
        // 偽装演出：2つまで同じ図柄を配置（リーチ状態）
        return this.generateFakeWinResult();

      default: // 'miss'
        // 完全な外れ：ランダム配置
        return this.generateRandomResult();
    }
  }

  generateWinningResult(symbolName) {
    const targetSymbol = this.symbols.find(s => s.name === symbolName);
    if (!targetSymbol) {
      return this.generateRandomResult();
    }

    // いずれかのペイライン上に当選図柄を配置
    const paylines = [
      [[0,0], [1,0], [2,0]], // 横上
      [[0,1], [1,1], [2,1]], // 横中
      [[0,2], [1,2], [2,2]], // 横下
      [[0,0], [1,1], [2,2]], // 斜め＼
      [[0,2], [1,1], [2,0]]  // 斜め／
    ];

    const selectedPayline = paylines[Math.floor(Math.random() * paylines.length)];

    // 3x3グリッドを初期化
    const result = [[], [], []];
    for (let col = 0; col < 3; col++) {
      for (let row = 0; row < 3; row++) {
        result[col][row] = this.getRandomSymbol();
      }
    }

    // 選択されたペイライン上に当選図柄を配置
    selectedPayline.forEach(([col, row]) => {
      result[col][row] = targetSymbol;
    });

    return result;
  }

  generateFakeWinResult() {
    // リーチ演出：2つまで同じ図柄を配置（高価値シンボルの確率を調整）
    const reachSymbols = [
      { name: 'seven', weight: 10 },     // 7のリーチは稀に
      { name: 'diamond', weight: 15 },   // ダイヤのリーチは時々
      { name: 'lightning', weight: 25 }, // 雷のリーチは普通
      { name: 'fire', weight: 30 },      // 炎のリーチは頻繁
      { name: 'gem', weight: 20 }        // 宝石のリーチは普通
    ];

    // 重み付き抽選でリーチシンボルを選択
    const totalWeight = reachSymbols.reduce((sum, symbol) => sum + symbol.weight, 0);
    const randomValue = Math.random() * totalWeight;
    let currentWeight = 0;

    let selectedSymbolName = 'fire'; // デフォルト
    for (const reachSymbol of reachSymbols) {
      currentWeight += reachSymbol.weight;
      if (randomValue <= currentWeight) {
        selectedSymbolName = reachSymbol.name;
        break;
      }
    }

    const selectedSymbol = this.symbols.find(s => s.name === selectedSymbolName);

    // selectedSymbolが見つからない場合のフォールバック
    if (!selectedSymbol) {
      console.warn(`リーチシンボルが見つかりません: ${selectedSymbolName}`);
      return this.generateRandomResult();
    }

    const result = [[], [], []];
    for (let col = 0; col < 3; col++) {
      for (let row = 0; row < 3; row++) {
        result[col][row] = this.getRandomSymbol();
      }
    }

    // 横中ラインに2つまで配置してリーチ状態にする
    result[0][1] = selectedSymbol;
    result[1][1] = selectedSymbol;
    // 3番目は異なる図柄にする
    const differentSymbol = this.symbols.find(s => s.name !== selectedSymbol.name && s.name !== 'empty');
    result[2][1] = differentSymbol || this.getRandomSymbol();

    return result;
  }

  generateRandomResult() {
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

  async playSpinAnimation(finalResult, winType = 'miss') {
    const reelElements = this.getReelElements();

    // 当選タイプに応じたアニメーション速度調整
    const animationConfig = this.getAnimationConfig(winType);

    // 各リールでアニメーション開始
    const animationPromises = reelElements.map((reel, reelIndex) =>
      this.animateReel(reel, finalResult[reelIndex], reelIndex, animationConfig)
    );

    // 全リールのアニメーション完了を待機
    await Promise.all(animationPromises);
  }

  getAnimationConfig(winType) {
    switch (winType) {
      case 'jackpot':
        return {
          spinCount: 30,        // 長時間回転
          speed: 80,            // やや遅く
          suspenseDelay: 1000,  // 最後のリールを遅らせる
          flashEffect: true     // フラッシュ演出
        };
      case 'big_win':
        return {
          spinCount: 25,
          speed: 90,
          suspenseDelay: 800,
          flashEffect: true
        };
      case 'small_win':
        return {
          spinCount: 20,
          speed: 100,
          suspenseDelay: 400,
          flashEffect: false
        };
      case 'fake_win':
        return {
          spinCount: 18,        // 22→18 回転数を削減
          speed: 85,            // 95→85 少し速く
          suspenseDelay: 300,   // 600→300 遅延を半減
          flashEffect: false,
          reachEffect: true     // リーチ演出
        };
      default:
        return {
          spinCount: 20,
          speed: 100,
          suspenseDelay: 0,
          flashEffect: false
        };
    }
  }

  async animateReel(reelElements, finalSymbols, reelIndex, animationConfig) {
    const baseSpinCount = animationConfig.spinCount + reelIndex * 5;
    let currentSpeed = animationConfig.speed;
    const symbols = this.symbols.filter(s => s.emoji !== "");

    // 最後のリール（インデックス2）に遅延を追加
    const delay = (reelIndex === 2) ? animationConfig.suspenseDelay : 0;
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    return new Promise((resolve) => {
      let currentSpin = 0;
      let spinCount = baseSpinCount;

      // リーチ演出の場合、最後のリールを少し長く回す
      if (animationConfig.reachEffect && reelIndex === 2) {
        spinCount += 8; // 15→8 追加回転数を削減
      }

      let spinInterval;

      const updateSpin = () => {
        reelElements.forEach((element, symbolIndex) => {
          if (currentSpin < spinCount) {
            // ランダムシンボル表示
            const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
            element.textContent = randomSymbol.emoji;
            element.className = 'symbol spinning';

            // 段階的エフェクト
            this.applySpinStageEffects(element, currentSpin, spinCount, animationConfig);

          } else {
            // 最終結果表示
            const finalSymbol = finalSymbols[symbolIndex];
            element.textContent = finalSymbol.emoji;
            element.className = 'symbol';
            element.dataset.symbol = finalSymbol.name;
            element.classList.remove('flash-effect', 'slow-spin', 'ultra-slow', 'freeze-moment');
          }
        });

        currentSpin++;

        // 動的速度制御
        const newSpeed = this.calculateDynamicSpeed(currentSpin, spinCount, animationConfig, reelIndex);
        if (newSpeed !== currentSpeed) {
          clearInterval(spinInterval);
          currentSpeed = newSpeed;
          if (currentSpin <= spinCount) {
            spinInterval = setInterval(updateSpin, currentSpeed);
          }
        }

        if (currentSpin > spinCount) {
          clearInterval(spinInterval);

          // リール停止時にSE再生
          if (this.audioManager) {
            this.audioManager.playReelStopSound();
          }

          // リール停止時のエフェクト
          if (this.effectSystem) {
            if (animationConfig.flashEffect) {
              this.effectSystem.shake('medium', 'short');
            } else if (reelIndex === 1) {
              this.effectSystem.shake('light', 'short');
            }
          }

          resolve();
        }
      };

      spinInterval = setInterval(updateSpin, currentSpeed);
    });
  }

  // 🎬 動的速度制御システム
  calculateDynamicSpeed(currentSpin, totalSpins, config, reelIndex) {
    const progress = currentSpin / totalSpins;
    const baseSpeed = config.speed;

    // 最後のリールで特別な速度制御
    if (reelIndex === 2 && config.suspenseDelay > 0) {
      if (progress < 0.6) {
        // 通常速度
        return baseSpeed;
      } else if (progress < 0.8) {
        // 徐々に減速
        return baseSpeed + (progress - 0.6) * baseSpeed * 2;
      } else if (progress < 0.95) {
        // 超スロー
        return baseSpeed * 5;
      } else {
        // 極スロー（焦らし効果MAX）
        return baseSpeed * 10;
      }
    }

    // 通常の速度制御
    if (progress < 0.7) {
      return baseSpeed;
    } else if (progress < 0.9) {
      // 減速フェーズ
      return baseSpeed + (progress - 0.7) * baseSpeed;
    } else {
      // 最終フェーズ：ゆっくり
      return baseSpeed * 2;
    }
  }

  // スピン段階的エフェクト
  applySpinStageEffects(element, currentSpin, totalSpins, config) {
    const progress = currentSpin / totalSpins;

    // フラッシュ演出
    if (config.flashEffect && progress > 0.8) {
      element.classList.add('flash-effect');
    }

    // 速度段階の視覚的表現
    if (progress > 0.9) {
      element.classList.add('ultra-slow');
      element.classList.remove('slow-spin');
    } else if (progress > 0.7) {
      element.classList.add('slow-spin');
      element.classList.remove('ultra-slow');
    }

    // 停止直前の一時停止演出
    if (config.reachEffect && progress > 0.95) {
      element.classList.add('freeze-moment');
    }
  }

  // 🎯 期待演出用スロー制御
  async slowMotionSpin(reelIndex, duration = 2000) {
    const reelElements = this.getReelElements()[reelIndex];
    if (!reelElements) return;

    const symbols = this.symbols.filter(s => s.emoji !== "");
    let currentSpin = 0;
    const maxSpins = Math.floor(duration / 200); // 200ms間隔

    return new Promise(resolve => {
      const slowInterval = setInterval(() => {
        reelElements.forEach(element => {
          const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
          element.textContent = randomSymbol.emoji;
          element.classList.add('ultra-slow-spin');
        });

        currentSpin++;
        if (currentSpin >= maxSpins) {
          clearInterval(slowInterval);
          reelElements.forEach(element => {
            element.classList.remove('ultra-slow-spin');
          });
          resolve();
        }
      }, 200);
    });
  }

  // 🔥 加速＆急停止演出
  async accelerationSpin(reelIndex, finalSymbols) {
    const reelElements = this.getReelElements()[reelIndex];
    if (!reelElements) return;

    const symbols = this.symbols.filter(s => s.emoji !== "");
    let speed = 200; // 開始速度（遅い）
    let currentSpin = 0;

    return new Promise(resolve => {
      const accelerate = () => {
        reelElements.forEach((element, symbolIndex) => {
          if (currentSpin < 20) {
            const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
            element.textContent = randomSymbol.emoji;
            element.classList.add('accelerating');
          } else {
            // 急停止して最終結果表示
            const finalSymbol = finalSymbols[symbolIndex];
            element.textContent = finalSymbol.emoji;
            element.classList.remove('accelerating');
            element.classList.add('sudden-stop');
          }
        });

        currentSpin++;

        if (currentSpin <= 20) {
          // 加速（速度を短くする）
          speed = Math.max(30, speed - 8);
          setTimeout(accelerate, speed);
        } else {
          resolve();
        }
      };

      accelerate();
    });
  }

  // 🌪️ 竜巻スピン演出
  async tornadoSpin(duration = 1500) {
    const allReels = this.getReelElements();
    const symbols = this.symbols.filter(s => s.emoji !== "");

    let spinCount = 0;
    const maxSpins = Math.floor(duration / 50);

    return new Promise(resolve => {
      const tornadoInterval = setInterval(() => {
        allReels.forEach((reel, reelIndex) => {
          reel.forEach((element, symbolIndex) => {
            const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
            element.textContent = randomSymbol.emoji;

            // 竜巻的な回転エフェクト
            const rotationDelay = (reelIndex * 100) + (symbolIndex * 50);
            element.style.transform = `rotate(${spinCount * 10 + rotationDelay}deg) scale(${0.8 + Math.sin(spinCount * 0.1) * 0.2})`;
          });
        });

        spinCount++;
        if (spinCount >= maxSpins) {
          clearInterval(tornadoInterval);

          // エフェクトリセット
          allReels.forEach(reel => {
            reel.forEach(element => {
              element.style.transform = '';
            });
          });

          resolve();
        }
      }, 50);
    });
  }

  getReelElements() {
    const slotGrid = document.getElementById('slot-grid');
    const symbols = slotGrid.querySelectorAll('.symbol');

    // 3x3グリッドを列ごとにグループ化
    const reels = [[], [], []];

    symbols.forEach((symbol, index) => {
      const col = index % 3;  // 修正：正しい列計算
      reels[col].push(symbol);
    });

    return reels;
  }

  displayResult(reelResult) {
    const symbols = document.querySelectorAll('.symbol');

    reelResult.forEach((reel, colIndex) => {
      reel.forEach((symbol, rowIndex) => {
        const elementIndex = rowIndex * 3 + colIndex;  // 修正：正しい行優先インデックス計算
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
      const row = Math.floor(index / 3);  // 修正：正しい行計算
      const col = index % 3;              // 修正：正しい列計算
      const symbolName = element.dataset.symbol || 'empty';
      const symbol = this.symbols.find(s => s.name === symbolName) || this.symbols[this.symbols.length - 1];

      if (!result[col]) result[col] = [];
      result[col][row] = symbol;
    });

    return result;
  }

  // TimeFreezeSkillで使用されるメソッド
  getSymbols() {
    return this.symbols;
  }

  weightedRandom(weightedSymbols) {
    const totalWeight = weightedSymbols.reduce((sum, symbol) => sum + (symbol.adjustedWeight || symbol.weight), 0);
    let random = Math.random() * totalWeight;

    for (const symbol of weightedSymbols) {
      random -= (symbol.adjustedWeight || symbol.weight);
      if (random <= 0) {
        return symbol;
      }
    }

    return weightedSymbols[weightedSymbols.length - 1];
  }

  // 当選演出の準備
  async prepareWinEffects(winType) {
    if (winType === 'miss') return;

    // 期待演出レベル設定
    const anticipationLevels = {
      jackpot: 95,
      big_win: 80,
      small_win: 50,
      fake_win: 70
    };

    const level = anticipationLevels[winType] || 0;

    if (this.effectSystem && level > 0) {
      this.effectSystem.showAnticipation(level);
    }

    // 音響効果
    if (this.audioManager && level > 60) {
      if (level > 85) {
        this.audioManager.playSFX('anticipationHigh');
      } else {
        this.audioManager.playSFX('anticipationMedium');
      }
    }
  }

  // 当選演出の実行
  async executeWinEffects(winType, reelResult) {
    if (winType === 'miss') return;

    // 期待演出終了
    if (this.effectSystem) {
      this.effectSystem.hideAnticipation();
    }

    // 勝利時は最初に金額表示を開始（fake_win以外）
    let countUpPromise = null;
    if (winType !== 'fake_win') {
      // カウントアップを非同期で開始（エフェクトと同時進行）
      switch (winType) {
        case 'jackpot':
          countUpPromise = this.executeJackpotCountUp();
          break;
        case 'big_win':
          countUpPromise = this.executeBigWinCountUp();
          break;
        case 'small_win':
          countUpPromise = this.executeSmallWinCountUp();
          break;
      }
    }

    // エフェクト演出を実行
    switch (winType) {
      case 'jackpot':
        await this.executeJackpotEffects(reelResult);
        break;
      case 'big_win':
        await this.executeBigWinEffects(reelResult);
        break;
      case 'small_win':
        await this.executeSmallWinEffects(reelResult);
        break;
      case 'fake_win':
        await this.executeFakeWinEffects(reelResult);
        break;
    }

    // カウントアップの完了を待つ
    if (countUpPromise) {
      await countUpPromise;
    }
  }

  // 🎆 最強複合演出システム
  async executeJackpotEffects(reelResult) {
    const patterns = ['royal', 'explosion', 'cascade', 'divine', 'ultimate'];
    const selectedPattern = this.selectRandomPattern(patterns);

    console.log(`🎰 ジャックポット演出パターン: ${selectedPattern}`);

    switch (selectedPattern) {
      case 'royal':
        await this.executeRoyalJackpotEffect(reelResult);
        break;
      case 'explosion':
        await this.executeExplosionJackpotEffect(reelResult);
        break;
      case 'cascade':
        await this.executeCascadeJackpotEffect(reelResult);
        break;
      case 'divine':
        await this.executeDivineJackpotEffect(reelResult);
        break;
      case 'ultimate':
        await this.executeUltimateJackpotEffect(reelResult);
        break;
    }

    // 共通ジャックポット後処理
    await this.postJackpotEffects();
  }

  // 🌟 究極の複合演出
  async executeUltimateJackpotEffect(reelResult) {
    console.log('🚀 究極ジャックポット演出開始！');

    // 1. 無音＋暗転でサスペンス
    if (this.audioManager) {
      this.audioManager.stopAllSounds();
    }
    await this.slotEffects.contrastFlash();

    // 2. 心拍音＋期待演出
    if (this.audioManager) {
      this.audioManager.playSFX('anticipationHigh');
    }
    await this.slotEffects.pulseFlash(3, '#ff0000');

    // 3. 竜巻＋ブラー演出
    await Promise.all([
      this.tornadoSpin(1000),
      this.slotEffects.blurFocusEffect(1000)
    ]);

    // 4. 爆発的フィナーレ
    await Promise.all([
      this.slotEffects.ultimateCombo(),
      this.addWinningSymbolEffects('ultimate-jackpot')
    ]);

    console.log('✨ 究極ジャックポット演出完了！');
  }

  // 👑 ロイヤルジャックポット演出
  async executeRoyalJackpotEffect(reelResult) {
    // 王冠が降ってくる演出
    if (this.audioManager) {
      this.audioManager.playSFX('stageUp'); // ファンファーレ
      setTimeout(() => this.audioManager.generateCelebrationChain(), 500);
    }

    if (this.effectSystem) {
      this.effectSystem.celebrateWin('jackpot');
      this.effectSystem.shake('heavy', 'long');
    }

    await this.addGoldenCrownEffect();
    await this.addWinningSymbolEffects('royal-jackpot');
    await this.addRoyalBackgroundEffect();
    await this.addGoldenParticles(25);
  }

  // 💥 エクスプロージョンジャックポット演出
  async executeExplosionJackpotEffect(reelResult) {
    // 爆発的な演出
    if (this.audioManager) {
      this.audioManager.playSFX('impact');
      setTimeout(() => this.audioManager.playSFX('miracleSpin'), 300);
      setTimeout(() => this.audioManager.generateVictoryEcho(), 600);
    }

    if (this.effectSystem) {
      this.effectSystem.shake('heavy', 'medium');
      setTimeout(() => this.effectSystem.shake('medium', 'short'), 400);
      setTimeout(() => this.effectSystem.shake('light', 'short'), 800);
    }

    await this.addExplosionWaves();
    await this.addWinningSymbolEffects('explosion-jackpot');
    await this.addExplosionParticles(30);
  }

  // 🌊 カスケードジャックポット演出
  async executeCascadeJackpotEffect(reelResult) {
    // 段階的に盛り上がる演出
    if (this.audioManager) {
      // 段階的音響
      this.audioManager.playSFX('futureVision');
      setTimeout(() => this.audioManager.playSFX('skillActivate'), 400);
      setTimeout(() => this.audioManager.playSFX('jackpot'), 800);
      setTimeout(() => this.audioManager.generateCelebrationChain(), 1200);
    }

    await this.addCascadeWaveEffect();
    await this.addWinningSymbolEffects('cascade-jackpot');
    await this.addCascadeParticles();
  }

  // ✨ ディバインジャックポット演出
  async executeDivineJackpotEffect(reelResult) {
    // 神々しい演出
    if (this.audioManager) {
      this.audioManager.generateMiracleSpinSound();
      setTimeout(() => this.audioManager.playSFX('miracleSpin'), 500);
      setTimeout(() => this.audioManager.generateCelebrationChain(), 1000);
    }

    if (this.effectSystem) {
      this.effectSystem.showAnticipation(100);
      setTimeout(() => this.effectSystem.hideAnticipation(), 3000);
    }

    await this.addDivineGlowEffect();
    await this.addWinningSymbolEffects('divine-jackpot');
    await this.addAngelicParticles(35);
  }

  // ビッグウィン演出（複合演出強化版）
  async executeBigWinEffects(reelResult) {
    const patterns = ['fire', 'lightning', 'rainbow', 'tornado'];
    const selectedPattern = this.selectRandomPattern(patterns);

    console.log(`🔥 ビッグウィン演出パターン: ${selectedPattern}`);

    // 複合演出実行
    await Promise.all([
      this.executeBigWinPattern(selectedPattern, reelResult),
      this.slotEffects.bigWinCombo()
    ]);

    // 後処理
    await this.postBigWinEffects();
  }

  async executeBigWinPattern(pattern, reelResult) {
    switch (pattern) {
      case 'fire':
        await this.executeFireBigWinEffect(reelResult);
        break;
      case 'lightning':
        await this.executeLightningBigWinEffect(reelResult);
        break;
      case 'rainbow':
        await this.executeRainbowBigWinEffect(reelResult);
        break;
      case 'tornado':
        await this.executeTornadoBigWinEffect(reelResult);
        break;
    }
  }

  // 🔥 ファイアビッグウィン演出
  async executeFireBigWinEffect(reelResult) {
    if (this.audioManager) {
      this.audioManager.playSFX('impact');
      setTimeout(() => this.audioManager.generateCoinDropSound(), 400);
    }

    if (this.effectSystem) {
      this.effectSystem.celebrateWin('big');
    }

    await this.addFlameWaveEffect();
    await this.addWinningSymbolEffects('fire-big-win');
    await this.addFireParticles(15);
  }

  // ⚡ ライトニングビッグウィン演出
  async executeLightningBigWinEffect(reelResult) {
    if (this.audioManager) {
      this.audioManager.playSFX('skillActivate');
      setTimeout(() => this.audioManager.generateVictoryEcho(), 300);
    }

    if (this.effectSystem) {
      this.effectSystem.shake('medium', 'medium');
    }

    await this.addLightningStrikeEffect();
    await this.addWinningSymbolEffects('lightning-big-win');
    await this.addElectricParticles(12);
  }

  // 🌈 レインボービッグウィン演出
  async executeRainbowBigWinEffect(reelResult) {
    if (this.audioManager) {
      this.audioManager.playSFX('miracleSpin');
      setTimeout(() => this.audioManager.generateCoinDropSound(), 500);
    }

    await this.addRainbowWaveEffect();
    await this.addWinningSymbolEffects('rainbow-big-win');
    await this.addColorfulParticles(18);
  }

  // 🌪️ トルネードビッグウィン演出
  async executeTornadoBigWinEffect(reelResult) {
    if (this.audioManager) {
      this.audioManager.playSFX('timeFreeze');
      setTimeout(() => this.audioManager.generateVictoryEcho(), 600);
    }

    if (this.effectSystem) {
      this.effectSystem.shake('light', 'long');
    }

    await this.addTornadoSpinEffect();
    await this.addWinningSymbolEffects('tornado-big-win');
    await this.addSpiralingParticles(20);
  }

  // スモールウィン演出（複数パターンからランダム選択）
  async executeSmallWinEffects(reelResult) {
    const patterns = ['sparkle', 'gentle', 'coins', 'glow'];
    const selectedPattern = this.selectRandomPattern(patterns);

    console.log(`✨ スモールウィン演出パターン: ${selectedPattern}`);

    // 複合演出実行
    await Promise.all([
      this.executeSmallWinPattern(selectedPattern, reelResult),
      this.slotEffects.smallWinCombo()
    ]);
  }

  async executeSmallWinPattern(pattern, reelResult) {
    switch (pattern) {
      case 'sparkle':
        await this.executeSparkleSmallWinEffect(reelResult);
        break;
      case 'gentle':
        await this.executeGentleSmallWinEffect(reelResult);
        break;
      case 'coins':
        await this.executeCoinsSmallWinEffect(reelResult);
        break;
      case 'glow':
        await this.executeGlowSmallWinEffect(reelResult);
        break;
    }
  }

  // ✨ スパークルスモールウィン演出
  async executeSparkleSmallWinEffect(reelResult) {
    if (this.audioManager) {
      this.audioManager.generateMiracleSpinSound();
    }

    await this.addWinningSymbolEffects('sparkle-small-win');
    await this.addTwinkleParticles(8);
  }

  // 🌟 ジェントルスモールウィン演出
  async executeGentleSmallWinEffect(reelResult) {
    if (this.audioManager) {
      this.audioManager.playSFX('win');
    }

    if (this.effectSystem) {
      this.effectSystem.celebrateWin('normal');
    }

    await this.addWinningSymbolEffects('gentle-small-win');
    await this.addGentleGlowEffect();
  }

  // 💰 コインスモールウィン演出
  async executeCoinsSmallWinEffect(reelResult) {
    if (this.audioManager) {
      this.audioManager.generateCoinDropSound();
      setTimeout(() => this.audioManager.generateCoinDropSound(), 200);
    }

    await this.addWinningSymbolEffects('coins-small-win');
    await this.addCoinParticles(6);
  }

  // 🔆 グロースモールウィン演出
  async executeGlowSmallWinEffect(reelResult) {
    if (this.audioManager) {
      this.audioManager.playSFX('buttonClick');
      setTimeout(() => this.audioManager.playSFX('win'), 300);
    }

    await this.addWinningSymbolEffects('glow-small-win');
    await this.addPulseGlowEffect();
  }

  // フェイクウィン演出（複数パターンからランダム選択）
  async executeFakeWinEffects(reelResult) {
    const patterns = ['suspense', 'tease', 'almostWin', 'dramatic'];
    const selectedPattern = this.selectRandomPattern(patterns);

    console.log(`🎭 フェイクウィン演出パターン: ${selectedPattern}`);

    switch (selectedPattern) {
      case 'suspense':
        await this.executeSuspenseFakeWinEffect(reelResult);
        break;
      case 'tease':
        await this.executeTeaseFakeWinEffect(reelResult);
        break;
      case 'almostWin':
        await this.executeAlmostWinFakeWinEffect(reelResult);
        break;
      case 'dramatic':
        await this.executeDramaticFakeWinEffect(reelResult);
        break;
    }
  }

  // 😰 サスペンスフェイクウィン演出
  async executeSuspenseFakeWinEffect(reelResult) {
    if (this.audioManager) {
      this.audioManager.playSFX('anticipationHigh');
      setTimeout(() => this.audioManager.generateGameOverSound(), 500); // 1000→500
    }

    if (this.effectSystem) {
      this.effectSystem.showAnticipation(85);
      setTimeout(() => this.effectSystem.hideAnticipation(), 800); // 1500→800
    }

    await this.highlightReachSymbols(reelResult);
    await this.addSuspenseFlickerEffect();
  }

  // 😏 ティーズフェイクウィン演出
  async executeTeaseFakeWinEffect(reelResult) {
    if (this.audioManager) {
      this.audioManager.playSFX('reach');
      setTimeout(() => this.audioManager.playSFX('buttonClick'), 400); // 800→400
    }

    await this.highlightReachSymbols(reelResult);
    await this.addTeaseWiggleEffect();
  }

  // 😢 ほぼ当選フェイクウィン演出
  async executeAlmostWinFakeWinEffect(reelResult) {
    if (this.audioManager) {
      this.audioManager.playSFX('anticipationMedium');
      setTimeout(() => this.audioManager.generateImpactSound(), 600); // 1200→600
    }

    if (this.effectSystem) {
      this.effectSystem.shake('light', 'short');
    }

    await this.highlightReachSymbols(reelResult);
    await this.addAlmostWinSlowMotionEffect();
  }

  // 🎭 ドラマチックフェイクウィン演出
  async executeDramaticFakeWinEffect(reelResult) {
    if (this.audioManager) {
      this.audioManager.playSFX('futureVision');
      setTimeout(() => this.audioManager.playSFX('reach'), 300); // 600→300
      setTimeout(() => this.audioManager.generateGameOverSound(), 700); // 1400→700
    }

    if (this.effectSystem) {
      this.effectSystem.showAnticipation(90);
      setTimeout(() => this.effectSystem.hideAnticipation(), 1000); // 2000→1000
    }

    await this.highlightReachSymbols(reelResult);
    await this.addDramaticBuildUpEffect();
  }

  // 勝利シンボルエフェクト追加
  async addWinningSymbolEffects(winType) {
    const symbols = document.querySelectorAll('.symbol');

    symbols.forEach((symbol, index) => {
      // 勝利ライン上のシンボルを判定して演出追加
      symbol.classList.add('winning');

      if (winType === 'jackpot') {
        symbol.classList.add('jackpot-glow');
        // 遅延してキラキラ効果
        setTimeout(() => {
          symbol.classList.add('sparkle-effect');
        }, index * 100);
      } else if (winType === 'big_win') {
        symbol.classList.add('big-win-pulse');
      }
    });

    // エフェクト持続時間
    const duration = winType === 'jackpot' ? 3000 : winType === 'big_win' ? 2000 : 1000;

    return new Promise(resolve => {
      setTimeout(() => {
        symbols.forEach(symbol => {
          symbol.classList.remove('winning', 'jackpot-glow', 'big-win-pulse', 'sparkle-effect');
        });
        resolve();
      }, duration);
    });
  }

  // 背景フラッシュ演出
  async addBackgroundFlash(winType) {
    const gameContainer = document.getElementById('gameContainer') || document.body;

    const flashClass = winType === 'jackpot' ? 'jackpot-flash' : 'win-flash';
    gameContainer.classList.add(flashClass);

    const duration = winType === 'jackpot' ? 2000 : 1000;

    return new Promise(resolve => {
      setTimeout(() => {
        gameContainer.classList.remove(flashClass);
        resolve();
      }, duration);
    });
  }

  // パーティクル演出
  async addParticleEffects(winType) {
    const particleCount = winType === 'jackpot' ? 20 : winType === 'big_win' ? 15 : 10;
    const slotGrid = document.getElementById('slot-grid');

    if (!slotGrid) return;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.cssText = `
        position: absolute;
        width: 10px;
        height: 10px;
        background: gold;
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: particle-burst 1s ease-out forwards;
        z-index: 100;
      `;

      slotGrid.appendChild(particle);

      // パーティクル削除
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 1000);
    }

    return new Promise(resolve => setTimeout(resolve, 1000));
  }

  // リーチシンボルハイライト
  async highlightReachSymbols(reelResult) {
    const symbols = document.querySelectorAll('.symbol');

    // 横中ライン（リーチ状態）の最初2つをハイライト
    if (symbols[3] && symbols[4]) { // 横中ラインの最初2つ
      symbols[3].classList.add('reach-highlight');
      symbols[4].classList.add('reach-highlight');

      setTimeout(() => {
        symbols[3].classList.remove('reach-highlight');
        symbols[4].classList.remove('reach-highlight');
      }, 1000); // 2000→1000 ハイライト時間を半減
    }
  }

  // ランダムパターン選択関数
  selectRandomPattern(patterns) {
    const randomArray = new Uint32Array(1);
    crypto.getRandomValues(randomArray);
    const randomIndex = Math.floor((randomArray[0] / (0xffffffff + 1)) * patterns.length);
    return patterns[randomIndex];
  }

  // 🏆 ジャックポット専用エフェクト関数群
  async addGoldenCrownEffect() {
    const slotGrid = document.getElementById('slot-grid');
    if (!slotGrid) return;

    const crown = document.createElement('div');
    crown.innerHTML = '👑';
    crown.style.cssText = `
      position: absolute;
      font-size: 4rem;
      top: -100px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 200;
      animation: crown-drop 2s ease-out forwards;
    `;
    slotGrid.appendChild(crown);

    return new Promise(resolve => {
      setTimeout(() => {
        if (crown.parentNode) crown.parentNode.removeChild(crown);
        resolve();
      }, 2000);
    });
  }

  async addRoyalBackgroundEffect() {
    const gameContainer = document.getElementById('gameContainer') || document.body;
    gameContainer.classList.add('royal-background');

    return new Promise(resolve => {
      setTimeout(() => {
        gameContainer.classList.remove('royal-background');
        resolve();
      }, 3000);
    });
  }

  async addGoldenParticles(count) {
    const slotGrid = document.getElementById('slot-grid');
    if (!slotGrid) return;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: absolute;
        width: 8px;
        height: 8px;
        background: linear-gradient(45deg, gold, #ffeb3b);
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: golden-float ${1 + Math.random()}s ease-out forwards;
        z-index: 150;
      `;
      slotGrid.appendChild(particle);

      setTimeout(() => {
        if (particle.parentNode) particle.parentNode.removeChild(particle);
      }, 1500);
    }

    return new Promise(resolve => setTimeout(resolve, 1500));
  }

  async addExplosionWaves() {
    const slotGrid = document.getElementById('slot-grid');
    if (!slotGrid) return;

    for (let i = 0; i < 3; i++) {
      const wave = document.createElement('div');
      wave.style.cssText = `
        position: absolute;
        width: 50px;
        height: 50px;
        border: 3px solid #ff4444;
        border-radius: 50%;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        animation: explosion-wave 1s ease-out forwards;
        animation-delay: ${i * 0.2}s;
        z-index: 140;
      `;
      slotGrid.appendChild(wave);

      setTimeout(() => {
        if (wave.parentNode) wave.parentNode.removeChild(wave);
      }, 1200);
    }

    return new Promise(resolve => setTimeout(resolve, 1200));
  }

  async addExplosionParticles(count) {
    const slotGrid = document.getElementById('slot-grid');
    if (!slotGrid) return;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      const colors = ['#ff4444', '#ff8800', '#ffaa00', '#ffdd00'];
      particle.style.cssText = `
        position: absolute;
        width: 6px;
        height: 6px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        left: 50%;
        top: 50%;
        animation: explosion-particle ${0.8 + Math.random() * 0.4}s ease-out forwards;
        z-index: 130;
      `;
      slotGrid.appendChild(particle);

      setTimeout(() => {
        if (particle.parentNode) particle.parentNode.removeChild(particle);
      }, 1200);
    }

    return new Promise(resolve => setTimeout(resolve, 1200));
  }

  async addCascadeWaveEffect() {
    const symbols = document.querySelectorAll('.symbol');

    symbols.forEach((symbol, index) => {
      setTimeout(() => {
        symbol.classList.add('cascade-wave');
        setTimeout(() => symbol.classList.remove('cascade-wave'), 500);
      }, index * 100);
    });

    return new Promise(resolve => setTimeout(resolve, symbols.length * 100 + 500));
  }

  async addCascadeParticles() {
    const slotGrid = document.getElementById('slot-grid');
    if (!slotGrid) return;

    for (let wave = 0; wave < 3; wave++) {
      setTimeout(() => {
        for (let i = 0; i < 8; i++) {
          const particle = document.createElement('div');
          particle.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: #00ffff;
            left: ${(i / 8) * 100}%;
            top: ${wave * 33}%;
            animation: cascade-flow 1s ease-out forwards;
            z-index: 120;
          `;
          slotGrid.appendChild(particle);

          setTimeout(() => {
            if (particle.parentNode) particle.parentNode.removeChild(particle);
          }, 1000);
        }
      }, wave * 400);
    }

    return new Promise(resolve => setTimeout(resolve, 2200));
  }

  async addDivineGlowEffect() {
    const slotGrid = document.getElementById('slot-grid');
    if (!slotGrid) return;

    slotGrid.classList.add('divine-glow');

    return new Promise(resolve => {
      setTimeout(() => {
        slotGrid.classList.remove('divine-glow');
        resolve();
      }, 3000);
    });
  }

  async addAngelicParticles(count) {
    const slotGrid = document.getElementById('slot-grid');
    if (!slotGrid) return;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.innerHTML = '✨';
      particle.style.cssText = `
        position: absolute;
        font-size: 1.5rem;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: angelic-float ${2 + Math.random()}s ease-out forwards;
        z-index: 160;
      `;
      slotGrid.appendChild(particle);

      setTimeout(() => {
        if (particle.parentNode) particle.parentNode.removeChild(particle);
      }, 2500);
    }

    return new Promise(resolve => setTimeout(resolve, 2500));
  }

  // 🔥 ビッグウィン専用エフェクト関数群
  async addFlameWaveEffect() {
    const slotGrid = document.getElementById('slot-grid');
    if (!slotGrid) return;

    slotGrid.classList.add('flame-wave');

    return new Promise(resolve => {
      setTimeout(() => {
        slotGrid.classList.remove('flame-wave');
        resolve();
      }, 1500);
    });
  }

  async addFireParticles(count) {
    const slotGrid = document.getElementById('slot-grid');
    if (!slotGrid) return;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.innerHTML = '🔥';
      particle.style.cssText = `
        position: absolute;
        font-size: 1.2rem;
        left: ${Math.random() * 100}%;
        top: 100%;
        animation: fire-rise ${1.5 + Math.random()}s ease-out forwards;
        z-index: 110;
      `;
      slotGrid.appendChild(particle);

      setTimeout(() => {
        if (particle.parentNode) particle.parentNode.removeChild(particle);
      }, 2000);
    }

    return new Promise(resolve => setTimeout(resolve, 2000));
  }

  async addLightningStrikeEffect() {
    const slotGrid = document.getElementById('slot-grid');
    if (!slotGrid) return;

    const lightning = document.createElement('div');
    lightning.style.cssText = `
      position: absolute;
      width: 2px;
      height: 100%;
      background: linear-gradient(to bottom, #ffffff, #ffff00, #ffffff);
      left: ${Math.random() * 100}%;
      top: 0;
      animation: lightning-strike 0.3s ease-out forwards;
      z-index: 170;
    `;
    slotGrid.appendChild(lightning);

    return new Promise(resolve => {
      setTimeout(() => {
        if (lightning.parentNode) lightning.parentNode.removeChild(lightning);
        resolve();
      }, 300);
    });
  }

  async addRainbowWaveEffect() {
    const slotGrid = document.getElementById('slot-grid');
    if (!slotGrid) return;

    slotGrid.classList.add('rainbow-wave');

    return new Promise(resolve => {
      setTimeout(() => {
        slotGrid.classList.remove('rainbow-wave');
        resolve();
      }, 1500);
    });
  }

  async addTornadoSpinEffect() {
    const slotGrid = document.getElementById('slot-grid');
    if (!slotGrid) return;

    slotGrid.classList.add('tornado-effect');

    return new Promise(resolve => {
      setTimeout(() => {
        slotGrid.classList.remove('tornado-effect');
        resolve();
      }, 1500);
    });
  }

  // 🌀 スパイラルパーティクル - SlotEffects統合版
  async addSpiralingParticles(count) {
    if (this.slotEffects) {
      await this.slotEffects.explosionParticles('50%', '50%', count, 'spiral');
    }
  }

  // 🌈 カラフルパーティクル - SlotEffects統合版
  async addColorfulParticles(count) {
    if (this.slotEffects) {
      await this.slotEffects.explosionParticles('50%', '50%', count, 'colorful');
    }
  }

  async addElectricParticles(count) {
    const slotGrid = document.getElementById('slot-grid');
    if (!slotGrid) return;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.innerHTML = '⚡';
      particle.style.cssText = `
        position: absolute;
        font-size: 1rem;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: electric-spark ${0.5 + Math.random() * 0.5}s ease-out forwards;
        z-index: 115;
      `;
      slotGrid.appendChild(particle);

      setTimeout(() => {
        if (particle.parentNode) particle.parentNode.removeChild(particle);
      }, 1000);
    }

    return new Promise(resolve => setTimeout(resolve, 1000));
  }

  // ✨ スモールウィン専用エフェクト関数群
  async addTwinkleParticles(count) {
    const slotGrid = document.getElementById('slot-grid');
    if (!slotGrid) return;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.innerHTML = '✨';
      particle.style.cssText = `
        position: absolute;
        font-size: 0.8rem;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: twinkle ${1 + Math.random()}s ease-out forwards;
        z-index: 105;
      `;
      slotGrid.appendChild(particle);

      setTimeout(() => {
        if (particle.parentNode) particle.parentNode.removeChild(particle);
      }, 1500);
    }

    return new Promise(resolve => setTimeout(resolve, 1500));
  }

  async addGentleGlowEffect() {
    const symbols = document.querySelectorAll('.symbol');

    symbols.forEach(symbol => {
      symbol.classList.add('gentle-glow');
      setTimeout(() => symbol.classList.remove('gentle-glow'), 1000);
    });

    return new Promise(resolve => setTimeout(resolve, 1000));
  }

  async addCoinParticles(count) {
    const slotGrid = document.getElementById('slot-grid');
    if (!slotGrid) return;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.innerHTML = '🪙';
      particle.style.cssText = `
        position: absolute;
        font-size: 1rem;
        left: ${Math.random() * 100}%;
        top: -20px;
        animation: coin-drop ${1 + Math.random() * 0.5}s ease-in forwards;
        z-index: 108;
      `;
      slotGrid.appendChild(particle);

      setTimeout(() => {
        if (particle.parentNode) particle.parentNode.removeChild(particle);
      }, 1500);
    }

    return new Promise(resolve => setTimeout(resolve, 1500));
  }

  // 🧠 脳汁爆発！メイン勝利金額表示システム
  createBrainJuiceWinDisplay(winType) {
    // 既存の表示があれば再利用
    const existingDisplay = document.getElementById('brain-juice-win-display');
    if (existingDisplay) {
      // 既存の要素構造を返す
      return {
        container: existingDisplay,
        titleElement: existingDisplay.querySelector('.win-title'),
        amountElement: existingDisplay.querySelector('.win-amount'),
        decorationElement: existingDisplay.querySelector('.win-decoration'),
        multiplierElement: existingDisplay.querySelector('.win-multiplier')
      };
    }

    const displayContainer = document.createElement('div');
    displayContainer.id = 'brain-juice-win-display';
    displayContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 10000;
      text-align: center;
      font-family: 'Arial Black', sans-serif;
      font-weight: 900;
      text-shadow: 3px 3px 6px rgba(0,0,0,0.8);
      pointer-events: none;
      opacity: 1;
      transition: all 0.3s ease-out;
    `;

    // 当選タイプ別のスタイル設定
    const winStyles = {
      jackpot: {
        fontSize: '4rem',
        color: '#FFD700',
        textShadow: '0 0 30px #FFD700, 0 0 60px #FF8C00',
        background: 'linear-gradient(45deg, #FFD700, #FF8C00, #FFD700)',
        border: '4px solid #FF8C00'
      },
      big_win: {
        fontSize: '3rem',
        color: '#FF6B6B',
        textShadow: '0 0 20px #FF6B6B, 0 0 40px #FF1744',
        background: 'linear-gradient(45deg, #FF6B6B, #FF1744)',
        border: '3px solid #FF1744'
      },
      small_win: {
        fontSize: '2.5rem',
        color: '#4ECDC4',
        textShadow: '0 0 15px #4ECDC4, 0 0 30px #00BCD4',
        background: 'linear-gradient(45deg, #4ECDC4, #00BCD4)',
        border: '2px solid #00BCD4'
      }
    };

    const style = winStyles[winType] || winStyles.small_win;

    // メインタイトル
    const titleElement = document.createElement('div');
    titleElement.className = 'win-title';
    titleElement.style.cssText = `
      font-size: ${style.fontSize};
      color: ${style.color};
      text-shadow: ${style.textShadow};
      margin-bottom: 20px;
      animation: brain-juice-title-intro 0.8s ease-out forwards;
    `;

    // 金額表示エリア
    const amountElement = document.createElement('div');
    amountElement.className = 'win-amount';
    amountElement.style.cssText = `
      font-size: calc(${style.fontSize} * 1.2);
      color: #FFFFFF;
      background: ${style.background};
      background-size: 200% 200%;
      border: ${style.border};
      border-radius: 20px;
      padding: 20px 40px;
      margin: 20px 0;
      animation: brain-juice-amount-glow 1s ease-in-out infinite alternate;
      box-shadow: 0 0 30px rgba(255,255,255,0.5);
    `;

    // 装飾エリア
    const decorationElement = document.createElement('div');
    decorationElement.className = 'win-decoration';
    decorationElement.style.cssText = `
      font-size: 1.5rem;
      margin-top: 15px;
      animation: brain-juice-sparkle 2s linear infinite;
    `;

    displayContainer.appendChild(titleElement);
    displayContainer.appendChild(amountElement);
    displayContainer.appendChild(decorationElement);
    document.body.appendChild(displayContainer);

    return {
      container: displayContainer,
      titleElement,
      amountElement,
      decorationElement
    };
  }

  // 🎰 ジャックポット表示準備
  prepareJackpotDisplay(element) {
    element.titleElement.textContent = '🎰 JACKPOT! 🎰';
    element.decorationElement.innerHTML = '💎✨🎉✨💎<br>🌟 MEGA WIN! 🌟<br>💎✨🎉✨💎';

    // アニメーションはすでに表示されているので追加しない
    // ただしスケールアニメーションは追加
    element.container.classList.add('jackpot-scale-pulse');

    // 背景エフェクト
    const bgEffect = document.createElement('div');
    bgEffect.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle, rgba(255,215,0,0.2) 0%, transparent 70%);
      z-index: 9999;
      animation: brain-juice-jackpot-bg 2s ease-in-out infinite;
      pointer-events: none;
    `;
    document.body.appendChild(bgEffect);

    setTimeout(() => {
      if (bgEffect.parentNode) bgEffect.parentNode.removeChild(bgEffect);
    }, 8000);
  }

  // 🏆 ビッグウィン表示準備
  prepareBigWinDisplay(element) {
    element.titleElement.textContent = '🏆 BIG WIN! 🏆';
    element.decorationElement.innerHTML = '🎊🎉🎊<br>💰 AMAZING! 💰<br>🎊🎉🎊';

    // アニメーションはすでに表示されているので追加しない
    element.container.classList.add('bigwin-scale-pulse');
  }

  // ⭐ スモールウィン表示準備
  prepareSmallWinDisplay(element) {
    element.titleElement.textContent = '⭐ WIN! ⭐';
    element.decorationElement.innerHTML = '✨🎈✨<br>🎉 NICE! 🎉<br>✨🎈✨';

    // アニメーションはすでに表示されているので追加しない
    element.container.classList.add('smallwin-scale-pulse');
  }

  // 🎆 ジャックポットフィナーレ
  async jackpotDisplayFinale(element, amount) {
    // 最終爆発演出
    element.container.style.animation = 'brain-juice-jackpot-finale 2s ease-out forwards';

    // 特殊パーティクル爆発
    await this.createMegaParticleExplosion();

    // フェードアウトは削除（表示は継続）
  }

  // 🎊 ビッグウィンフィナーレ
  async bigWinDisplayFinale(element, amount) {
    element.container.style.animation = 'brain-juice-big-win-finale 1.5s ease-out forwards';

    // パーティクル演出
    await this.createWinParticleExplosion();

    // フェードアウトは削除（表示は継続）
  }

  // 🌟 スモールウィンフィナーレ
  async smallWinDisplayFinale(element, amount) {
    element.container.style.animation = 'brain-juice-small-win-finale 1s ease-out forwards';

    // フェードアウトは削除（表示は継続）
  }

  // 💥 メガパーティクル爆発（ジャックポット用） - SlotEffects統合版
  async createMegaParticleExplosion() {
    if (this.slotEffects) {
      await this.slotEffects.explosionParticles('50%', '50%', 50, 'jackpot');
    }
  }

  // 🎁 ウィンパーティクル爆発（ビッグウィン用） - SlotEffects統合版
  async createWinParticleExplosion() {
    if (this.slotEffects) {
      await this.slotEffects.explosionParticles('50%', '50%', 30, 'bigwin');
    }
  }

  // 🎯 倍率表示追加
  addMultiplierDisplay(displayElements, multiplier, winType) {
    const multiplierElement = document.createElement('div');
    multiplierElement.className = 'win-multiplier';

    const styles = {
      jackpot: {
        fontSize: '3rem',
        color: '#FFD700',
        animation: 'multiplier-pulse-gold 1s ease-in-out infinite'
      },
      big_win: {
        fontSize: '2.5rem',
        color: '#FF6B6B',
        animation: 'multiplier-pulse-red 1s ease-in-out infinite'
      },
      small_win: {
        fontSize: '2rem',
        color: '#4ECDC4',
        animation: 'multiplier-pulse-blue 1s ease-in-out infinite'
      }
    };

    const style = styles[winType] || styles.small_win;

    multiplierElement.style.cssText = `
      font-size: ${style.fontSize};
      color: ${style.color};
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
      margin-top: 10px;
      animation: ${style.animation};
    `;

    multiplierElement.textContent = `✕${multiplier.toLocaleString()}`;

    // decorationElementの前に挿入
    displayElements.container.insertBefore(multiplierElement, displayElements.decorationElement);
    displayElements.multiplierElement = multiplierElement;
  }

  // 🎬 フェードアウト処理
  fadeOutWinDisplay(displayElements) {
    if (!displayElements || !displayElements.container) return;

    displayElements.container.style.animation = 'brain-juice-fadeout 1s ease-out forwards';

    setTimeout(() => {
      if (displayElements.container && displayElements.container.parentNode) {
        displayElements.container.parentNode.removeChild(displayElements.container);
      }
    }, 1000);
  }

  async addPulseGlowEffect() {
    const slotGrid = document.getElementById('slot-grid');
    if (!slotGrid) return;

    slotGrid.classList.add('pulse-glow');

    return new Promise(resolve => {
      setTimeout(() => {
        slotGrid.classList.remove('pulse-glow');
        resolve();
      }, 1200);
    });
  }

  // 🎭 フェイクウィン専用エフェクト関数群
  async addSuspenseFlickerEffect() {
    const symbols = document.querySelectorAll('.symbol');

    for (let i = 0; i < 3; i++) { // 5→3 点滅回数を減らす
      setTimeout(() => {
        symbols.forEach(symbol => symbol.classList.add('suspense-flicker'));
        setTimeout(() => {
          symbols.forEach(symbol => symbol.classList.remove('suspense-flicker'));
        }, 80); // 100→80 点滅時間を短縮
      }, i * 150); // 200→150 間隔を短縮
    }

    return new Promise(resolve => setTimeout(resolve, 600)); // 1500→600 全体時間を短縮
  }

  async addTeaseWiggleEffect() {
    const symbols = document.querySelectorAll('.symbol');

    symbols.forEach((symbol, index) => {
      if (index === 3 || index === 4) { // リーチシンボル
        symbol.classList.add('tease-wiggle');
        setTimeout(() => symbol.classList.remove('tease-wiggle'), 500); // 1000→500
      }
    });

    return new Promise(resolve => setTimeout(resolve, 500)); // 1000→500
  }

  async addAlmostWinSlowMotionEffect() {
    const slotGrid = document.getElementById('slot-grid');
    if (!slotGrid) return;

    slotGrid.classList.add('slow-motion');

    return new Promise(resolve => {
      setTimeout(() => {
        slotGrid.classList.remove('slow-motion');
        resolve();
      }, 800); // 1500→800
    });
  }

  async addDramaticBuildUpEffect() {
    const gameContainer = document.getElementById('gameContainer') || document.body;

    gameContainer.classList.add('dramatic-buildup');

    return new Promise(resolve => {
      setTimeout(() => {
        gameContainer.classList.remove('dramatic-buildup');
        resolve();
      }, 1000); // 2000→1000
    });
  }

  // 💰 カウントアップ演出統合

  // 🎰 脳汁MAX当選金額表示システム

  async executeJackpotCountUp() {
    console.log('🎰 ジャックポット金額表示開始！');

    const displayElements = this.createBrainJuiceWinDisplay('jackpot');
    const betAmount = this.currentBet || 100; // 現在のベット額
    const multiplier = 500 + Math.floor(Math.random() * 4500); // x500-x5000
    const jackpotAmount = betAmount * multiplier;

    // 倍率表示を追加
    this.addMultiplierDisplay(displayElements, multiplier, 'jackpot');

    // 演出前の準備
    await this.prepareJackpotDisplay(displayElements);

    // 超ドラマチックカウントアップ（amountElementに対して実行）
    await this.countUpEffect.jackpotCountUp(displayElements.amountElement, jackpotAmount, {
      prefix: '',
      suffix: ' COINS',
      glowColor: '#ffd700'
    });

    // フィナーレ演出（表示は継続）
    await this.jackpotDisplayFinale(displayElements, jackpotAmount);

    // 演出完了まで表示を保持（追加で3秒待機）
    await new Promise(resolve => setTimeout(resolve, 3000));

    // フェードアウト
    this.fadeOutWinDisplay(displayElements);
  }

  async executeBigWinCountUp() {
    console.log('🔥 ビッグウィン金額表示開始！');

    const displayElements = this.createBrainJuiceWinDisplay('big_win');
    const betAmount = this.currentBet || 100;
    const multiplier = 50 + Math.floor(Math.random() * 150); // x50-x200
    const bigWinAmount = betAmount * multiplier;

    // 倍率表示を追加
    this.addMultiplierDisplay(displayElements, multiplier, 'big_win');

    // 演出前の準備
    await this.prepareBigWinDisplay(displayElements);

    // ドラマチックカウントアップ（amountElementに対して実行）
    await this.countUpEffect.dramaticCountUp(displayElements.amountElement, bigWinAmount, {
      stages: [0.2, 0.4, 0.7, 0.9, 1.0],
      stageDurations: [300, 400, 500, 600, 300],
      pauseBetweenStages: 150,
      prefix: '',
      suffix: ' COINS'
    });

    // フィナーレ演出（表示は継続）
    await this.bigWinDisplayFinale(displayElements, bigWinAmount);

    // 演出完了まで表示を保持（追加で2秒待機）
    await new Promise(resolve => setTimeout(resolve, 2000));

    // フェードアウト
    this.fadeOutWinDisplay(displayElements);
  }

  async executeSmallWinCountUp() {
    console.log('✨ スモールウィン金額表示開始！');

    const displayElements = this.createBrainJuiceWinDisplay('small_win');
    const betAmount = this.currentBet || 100;
    const multiplier = 5 + Math.floor(Math.random() * 25); // x5-x30
    const smallWinAmount = betAmount * multiplier;

    // 倍率表示を追加
    this.addMultiplierDisplay(displayElements, multiplier, 'small_win');

    // 演出前の準備
    await this.prepareSmallWinDisplay(displayElements);

    // 基本カウントアップ（でも効果的）（amountElementに対して実行）
    await this.countUpEffect.animateCountUp(displayElements.amountElement, 0, smallWinAmount, 1200, {
      prefix: '',
      suffix: ' COINS',
      easing: 'bounce',
      playSound: true,
      flashOnComplete: true
    });

    // フィナーレ演出（表示は継続）
    await this.smallWinDisplayFinale(displayElements, smallWinAmount);

    // 演出完了まで表示を保持（追加で1.5秒待機）
    await new Promise(resolve => setTimeout(resolve, 1500));

    // フェードアウト
    this.fadeOutWinDisplay(displayElements);
  }

  createWinDisplay() {
    const winDisplay = document.createElement('div');
    winDisplay.id = 'win-amount';
    winDisplay.style.cssText = `
      position: fixed;
      top: 20%;
      left: 50%;
      transform: translateX(-50%);
      font-size: 2rem;
      font-weight: bold;
      color: #ffd700;
      text-align: center;
      z-index: 1000;
      text-shadow: 0 0 20px currentColor;
    `;
    document.body.appendChild(winDisplay);

    // 3秒後に自動削除
    setTimeout(() => {
      if (winDisplay.parentNode) {
        winDisplay.parentNode.removeChild(winDisplay);
      }
    }, 5000);

    return winDisplay;
  }

  // 🎊 複合演出後処理

  async postJackpotEffects() {
    // ジャックポット後の追加演出
    await Promise.all([
      this.slotEffects.coinRain(3000, 'heavy'),
      this.confettiCelebration()
    ]);
  }

  async postBigWinEffects() {
    // ビッグウィン後の追加演出
    await Promise.all([
      this.slotEffects.coinRain(2000, 'medium'),
      this.sparkleFinish()
    ]);
  }

  async confettiCelebration() {
    // 紙吹雪的演出
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.slotEffects.explosionParticles('50%', '20%', 15, 'sparkle');
      }, i * 200);
    }
  }

  async sparkleFinish() {
    // キラキラフィニッシュ
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.slotEffects.explosionParticles(
          `${30 + i * 20}%`,
          `${40 + i * 10}%`,
          8,
          'star'
        );
      }, i * 300);
    }
  }

  // 🎯 演出レベル調整

  setEffectIntensity(level) {
    this.slotEffects.setEffectIntensity(level);
  }

  updateEffectSettings(settings) {
    this.slotEffects.updateSettings(settings);
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

    // 全エフェクトリセット
    if (this.effectSystem) {
      this.effectSystem.reset();
    }
    if (this.slotEffects) {
      this.slotEffects.stopAllEffects();
    }
    if (this.countUpEffect) {
      this.countUpEffect.stopCurrentAnimation();
    }

    // 勝利表示削除
    const winDisplay = document.getElementById('win-amount');
    if (winDisplay && winDisplay.parentNode) {
      winDisplay.parentNode.removeChild(winDisplay);
    }
  }
}

export default SlotMachine;