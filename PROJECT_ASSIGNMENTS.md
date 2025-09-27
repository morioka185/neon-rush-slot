# 🎯 NEON RUSH プロジェクト指示書

**プロジェクトリーダー**: Claude
**プロジェクト期間**: 10日間
**最終目標**: 機能完備のスマホ対応スロットゲーム

---

## 👥 チーム編成と役割分担

### 🏗️ Team A: 基盤・インフラチーム
**リーダー**: [基盤チームリーダー]
**メンバー**: 2-3名
**担当フェーズ**: Phase 1-2

**主要責任**:
- プロジェクト基盤構築
- HTML/CSS基本構造
- 開発環境整備

### 🎨 Team B: UI/UXデザインチーム
**リーダー**: [デザインチームリーダー]
**メンバー**: 2-3名
**担当フェーズ**: Phase 2, 6

**主要責任**:
- ビジュアルデザイン
- ネオンテーマ実装
- アニメーション・エフェクト

### ⚙️ Team C: ゲームロジックチーム
**リーダー**: [ロジックチームリーダー]
**メンバー**: 3-4名
**担当フェーズ**: Phase 3-4

**主要責任**:
- コアゲーム機能
- スロット判定ロジック
- ゲーム状態管理

### 🎪 Team D: 特殊機能チーム
**リーダー**: [特殊機能チームリーダー]
**メンバー**: 2-3名
**担当フェーズ**: Phase 5, 8

**主要責任**:
- スキルシステム
- 高度ゲーム機能
- 特殊ベット機能

### 📱 Team E: モバイル・パフォーマンスチーム
**リーダー**: [モバイルチームリーダー]
**メンバー**: 2名
**担当フェーズ**: Phase 7

**主要責任**:
- モバイル最適化
- タッチ操作実装
- パフォーマンス調整

### 🔍 Team F: QA・統合チーム
**リーダー**: [QAチームリーダー]
**メンバー**: 2名
**担当フェーズ**: Phase 9

**主要責任**:
- 品質保証
- 統合テスト
- 最終調整

---

## 📋 各チームへの詳細指示

## 🏗️ Team A: 基盤・インフラチーム 指示書

### 🎯 ミッション
「全チームが効率的に開発できる強固な基盤を構築せよ」

### 📅 スケジュール
- **Day 1 前半**: プロジェクト初期設定完了
- **Day 1 後半**: HTML基盤構築完了
- **Day 2**: CSS基盤システム完了

### 🎫 担当チケット
```
✅ 最優先: T001-T003 (基盤構築)
⏰ 期限: Day 1 終了時
🔗 後続: 全チームの作業開始に必要
```

### 📝 具体的作業内容

#### T001: プロジェクト初期設定
```bash
# 作業手順
1. Git リポジトリ初期化
   git init
   git add .
   git commit -m "Initial project setup"

2. package.json 作成（開発用）
   npm init -y
   npm install --save-dev live-server

3. .gitignore 設定
   node_modules/
   .DS_Store
   *.log
```

#### T002: HTML基盤構築
```html
<!-- 必須要素 -->
- viewport メタタグ
- ネオンテーマ用CSS変数読み込み
- セマンティック構造 (header, main, footer)
- 3x3スロットグリッド基本構造
- コントロールパネル骨格
```

#### T003: CSS基盤システム
```css
/* 必須CSS変数定義 */
:root {
  --neon-pink: #ff00ff;
  --neon-cyan: #00ffff;
  --neon-green: #00ff88;
  --neon-yellow: #ffff00;
  --dark-bg: #0a0a0a;
  --glow: 0 0 20px;
}

/* 必須レイアウトシステム */
- CSS Grid (スロット用)
- Flexbox (コントロール用)
- レスポンシブブレークポイント
```

### ⚠️ 重要事項
1. **他チーム依存**: 完了通知は即座に全チームに連絡
2. **品質基準**: W3C Validation 必須
3. **命名規則**: BEM方式でCSS命名統一

### 📞 報告・相談
- **日次報告**: 18:00に進捗状況報告
- **ブロッカー**: 即座にプロジェクトリーダーに連絡
- **完了通知**: チケット完了時は Slack に投稿

---

## 🎨 Team B: UI/UXデザインチーム 指示書

### 🎯 ミッション
「プレイヤーが夢中になるネオンサイバーパンク体験を創造せよ」

### 📅 スケジュール
- **Day 1-2**: ネオンテーマ実装
- **Day 2**: スロット・UI実装
- **Day 5-6**: アニメーション実装

### 🎫 担当チケット
```
🎨 Phase 1: T004-T007 (UI実装)
🎬 Phase 2: T019-T021 (アニメーション)
⏰ 期限: Day 2, Day 6
🔗 依存: Team A 完了後開始
```

### 🎨 デザインガイドライン

#### ネオンテーマ実装 (T004)
```css
/* ネオングロー効果テンプレート */
.neon-glow {
  text-shadow:
    0 0 5px currentColor,
    0 0 10px currentColor,
    0 0 15px currentColor,
    0 0 20px var(--neon-color);
  box-shadow:
    0 0 5px var(--neon-color),
    inset 0 0 5px var(--neon-color);
}

/* ステージ別カラーシステム */
.stage-1 { --primary-neon: var(--neon-green); }
.stage-2 { --primary-neon: #ff9900; }
.stage-3 { --primary-neon: var(--neon-pink); }
.stage-4 { --primary-neon: #ff00ff; }
.stage-5 { --primary-neon: var(--neon-yellow); }
```

#### スロットUI実装 (T005-T007)
```css
/* 3x3グリッドレイアウト */
.slot-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 2px;
  aspect-ratio: 1;
}

/* シンボル表示 */
.symbol {
  font-size: clamp(2rem, 8vw, 4rem);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid var(--primary-neon);
}
```

### 🎬 アニメーション仕様

#### リール回転 (T019)
```css
@keyframes spin-reel {
  0% { transform: translateY(0); }
  100% { transform: translateY(-300%); }
}

.reel-spinning {
  animation: spin-reel 0.1s linear infinite;
}
```

#### 勝利演出 (T020)
```css
@keyframes winning-flash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@keyframes particle-burst {
  0% {
    transform: scale(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: scale(3) rotate(360deg);
    opacity: 0;
  }
}
```

### 📱 レスポンシブ要件
```css
/* モバイル最適化 */
@media (max-width: 768px) {
  .slot-container { padding: 1rem; }
  .control-panel { flex-direction: column; }
  .skill-buttons { gap: 0.5rem; }
}

@media (max-height: 600px) {
  .header { height: 40px; }
  .slot-grid { max-height: 40vh; }
}
```

### ⚠️ 重要事項
1. **60fps維持**: GPU加速(transform/opacity)のみ使用
2. **バッテリー配慮**: 不要なアニメーションは停止可能に
3. **アクセシビリティ**: カラーコントラスト比 4.5:1 以上

---

## ⚙️ Team C: ゲームロジックチーム 指示書

### 🎯 ミッション
「完璧な確率計算とバランスでプレイヤーを魅了せよ」

### 📅 スケジュール
- **Day 2**: ゲーム状態管理完了
- **Day 3**: スロット基本機能完了
- **Day 3-4**: ペイライン・ベット・ステージ完了

### 🎫 担当チケット
```
🎯 Phase 1: T008-T011 (コア機能)
📈 Phase 2: T012-T014 (拡張機能)
⏰ 期限: Day 4 終了時
🔗 依存: Team A 基盤完了後
```

### 🧮 実装仕様

#### GameState クラス (T008)
```javascript
class GameState {
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
      gameOver: false
    };
    this.listeners = new Map();
  }

  // 必須メソッド
  subscribe(event, callback) { /* 実装 */ }
  setState(newState) { /* 実装 + 通知 */ }
  getState() { return { ...this.state }; }
  save() { /* localStorage保存 */ }
  load() { /* localStorage読み込み */ }
}
```

#### SlotMachine クラス (T010)
```javascript
class SlotMachine {
  constructor(gameState, symbols) {
    this.gameState = gameState;
    this.symbols = symbols;
    this.reels = [[], [], []]; // 3x3
  }

  // 必須メソッド
  async spin() {
    // 1. ベット減算
    // 2. リール生成（重み付き抽選）
    // 3. アニメーション制御
    // 4. 結果返却
  }

  generateReel(reelIndex) {
    // 重み付き確率での抽選実装
    return symbols.map(() => this.weightedRandom());
  }

  weightedRandom() {
    // symbols配列のweight値に基づく抽選
  }
}
```

#### PaylineEngine クラス (T011)
```javascript
class PaylineEngine {
  constructor() {
    this.paylines = [
      [[0,0], [1,0], [2,0]], // 横上
      [[0,1], [1,1], [2,1]], // 横中
      [[0,2], [1,2], [2,2]], // 横下
      [[0,0], [1,1], [2,2]], // 斜め＼
      [[0,2], [1,1], [2,0]]  // 斜め／
    ];
  }

  checkWin(reelResult) {
    const wins = [];
    this.paylines.forEach((line, index) => {
      const symbols = line.map(([x, y]) => reelResult[x][y]);
      if (this.isWinningLine(symbols)) {
        wins.push({
          lineIndex: index,
          symbol: symbols[0],
          payout: this.calculatePayout(symbols[0])
        });
      }
    });
    return wins;
  }

  isWinningLine(symbols) {
    return symbols[0] === symbols[1] && symbols[1] === symbols[2];
  }
}
```

### 📊 確率・バランス設計

#### シンボル重み付け
```javascript
const symbols = [
  { emoji: "🔷", weight: 5, payout: 100 },   // 5%
  { emoji: "⚡", weight: 8, payout: 50 },    // 8%
  { emoji: "🔥", weight: 10, payout: 30 },   // 10%
  { emoji: "💎", weight: 12, payout: 20 },   // 12%
  { emoji: "✨", weight: 15, payout: 10 },   // 15%
  { emoji: "🌙", weight: 20, payout: 5 },    // 20%
  { emoji: "7️⃣", weight: 3, payout: 200 }    // 3%
];
// 残り27% = ハズレ
```

#### ペイアウト率計算
```javascript
// 目標RTP: 95-98%
// 計算式: 各シンボル確率 × ペイアウト × ライン数(5)
const calculateRTP = () => {
  let totalReturn = 0;
  symbols.forEach(symbol => {
    const hitProbability = (symbol.weight / 100) ** 3; // 3連続確率
    totalReturn += hitProbability * symbol.payout * 5; // 5ライン
  });
  return totalReturn; // 目標: 0.95-0.98
};
```

### ⚠️ 重要事項
1. **公正性**: 真の乱数使用（crypto.getRandomValues）
2. **バランス**: RTP 95-98% 維持
3. **状態管理**: 状態変更は必ずGameState経由
4. **エラーハンドリング**: 不正ベット・状態異常の検出

---

## 🎪 Team D: 特殊機能チーム 指示書

### 🎯 ミッション
「プレイヤーが『もう一回！』と叫ぶ中毒性のある機能を実装せよ」

### 📅 スケジュール
- **Day 4-5**: スキルシステム実装
- **Day 7-8**: 高度ベット機能実装

### 🎫 担当チケット
```
🎪 Phase 1: T015-T018 (スキル)
🎲 Phase 2: T025-T027 (高度機能)
⏰ 期限: Day 5, Day 8
🔗 依存: Team C コア機能完了後
```

### 🎭 スキルシステム実装

#### SkillSystem クラス (T015)
```javascript
class SkillSystem {
  constructor(gameState, slotMachine) {
    this.gameState = gameState;
    this.slotMachine = slotMachine;
    this.skills = {
      timeFreeze: new TimeFreezeSkill(),
      futureVision: new FutureVisionSkill(),
      miracleSpin: new MiracleSpinSkill()
    };
  }

  async useSkill(skillName) {
    const skill = this.skills[skillName];
    const state = this.gameState.getState();

    if (state.skills[skillName] <= 0) {
      throw new Error('スキル使用回数不足');
    }

    const result = await skill.execute(this.slotMachine, state);

    // 使用回数減少
    this.gameState.setState({
      skills: {
        ...state.skills,
        [skillName]: state.skills[skillName] - 1
      }
    });

    return result;
  }
}
```

#### タイムフリーズスキル (T016)
```javascript
class TimeFreezeSkill {
  async execute(slotMachine, gameState) {
    // 1. リール個別停止モード開始
    const manualStopMode = true;

    // 2. プレイヤーのタップで各リール停止
    return new Promise((resolve) => {
      let stoppedReels = 0;
      const reelResults = [];

      document.querySelectorAll('.reel').forEach((reel, index) => {
        reel.addEventListener('click', () => {
          if (!reel.dataset.stopped) {
            reelResults[index] = slotMachine.stopReel(index);
            reel.dataset.stopped = 'true';
            stoppedReels++;

            if (stoppedReels === 3) {
              resolve(reelResults);
            }
          }
        });
      });
    });
  }
}
```

#### フューチャービジョンスキル (T017)
```javascript
class FutureVisionSkill {
  execute(slotMachine, gameState) {
    // 次5スピンの結果を事前計算
    const futureResults = [];
    const currentSeed = Math.random(); // 現在のシード保存

    for (let i = 0; i < 5; i++) {
      // シード値を使って予測可能な結果生成
      Math.seedrandom(currentSeed + i);
      futureResults.push(slotMachine.generateReelResult());
    }

    // オリジナルの乱数状態復元
    Math.seedrandom();

    // プレビューUI表示
    this.showFuturePreview(futureResults);

    return futureResults;
  }

  showFuturePreview(results) {
    // 小さなプレビューウィンドウで5つの結果表示
  }
}
```

#### ミラクルスピンスキル (T018)
```javascript
class MiracleSpinSkill {
  execute(slotMachine, gameState) {
    // 確定大当たりロジック
    const guaranteedWin = this.generateGuaranteedWin();
    const multiplier = this.calculateMiracleMultiplier(gameState);

    return {
      reelResult: guaranteedWin,
      specialMultiplier: multiplier, // 10-50倍
      isMiracleWin: true
    };
  }

  generateGuaranteedWin() {
    // 最高配当シンボルで揃える、または
    // 複数ライン同時当選を生成
    const topSymbol = symbols.find(s => s.payout === 200); // 7️⃣
    return [
      [topSymbol, topSymbol, topSymbol],
      [topSymbol, topSymbol, topSymbol],
      [topSymbol, topSymbol, topSymbol]
    ];
  }
}
```

### 🎲 高度ベット機能

#### DOUBLE OR NOTHING (T025)
```javascript
class DoubleOrNothingFeature {
  async execute(winAmount) {
    // 50%確率で配当2倍、50%で没収
    const isWin = Math.random() < 0.5;

    return new Promise((resolve) => {
      // コイントス演出
      this.showCoinFlipAnimation(() => {
        resolve({
          success: isWin,
          amount: isWin ? winAmount * 2 : 0
        });
      });
    });
  }
}
```

#### ALL OR NOTHING (T025)
```javascript
class AllOrNothingFeature {
  execute(totalCoins) {
    // 30%確率で3倍、70%で全額没収
    const isWin = Math.random() < 0.3;

    return {
      success: isWin,
      amount: isWin ? totalCoins * 3 : 0,
      message: isWin ? "🎉 JACKPOT! 3倍勝利!" : "💸 全額没収..."
    };
  }
}
```

### ⚠️ 重要事項
1. **フェアプレイ**: スキル使用時も確率は適正に
2. **ユーザビリティ**: スキル効果を明確に表示
3. **バランス**: 強すぎず弱すぎない効果調整
4. **演出**: 特別感のある視覚・音響効果

---

## 📱 Team E: モバイル・パフォーマンスチーム 指示書

### 🎯 ミッション
「あらゆるモバイルデバイスで滑らかな60fps体験を実現せよ」

### 📅 スケジュール
- **Day 6-7**: タッチ操作実装
- **Day 7**: レスポンシブ調整
- **Day 7**: パフォーマンス最適化

### 🎫 担当チケット
```
📱 担当: T022-T024 (モバイル最適化)
⏰ 期限: Day 7 終了時
🔗 依存: 主要機能実装完了後
```

### 📱 タッチ操作実装

#### TouchHandler クラス (T022)
```javascript
class TouchHandler {
  constructor(gameState, slotMachine) {
    this.gameState = gameState;
    this.slotMachine = slotMachine;
    this.setupTouchEvents();
  }

  setupTouchEvents() {
    // スピンボタン
    this.setupSpinTouch();

    // ベット変更スワイプ
    this.setupBetSwipe();

    // オートプレイ長押し
    this.setupLongPress();

    // スキルボタン
    this.setupSkillTouch();
  }

  setupSpinTouch() {
    const spinButton = document.getElementById('spin-button');

    // タップ: 通常スピン
    spinButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleSpin();
    });

    // ダブルタップ: クイックスピン
    let tapCount = 0;
    spinButton.addEventListener('touchend', () => {
      tapCount++;
      setTimeout(() => {
        if (tapCount === 2) {
          this.handleQuickSpin();
        }
        tapCount = 0;
      }, 300);
    });
  }

  setupBetSwipe() {
    let startY;
    const betArea = document.getElementById('bet-area');

    betArea.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
    });

    betArea.addEventListener('touchend', (e) => {
      const endY = e.changedTouches[0].clientY;
      const deltaY = startY - endY;

      if (Math.abs(deltaY) > 50) { // 50px以上のスワイプ
        if (deltaY > 0) {
          this.increaseBet();
        } else {
          this.decreaseBet();
        }
      }
    });
  }

  setupLongPress() {
    const spinButton = document.getElementById('spin-button');
    let pressTimer;

    spinButton.addEventListener('touchstart', () => {
      pressTimer = setTimeout(() => {
        this.toggleAutoPlay();
      }, 1000); // 1秒長押し
    });

    spinButton.addEventListener('touchend', () => {
      clearTimeout(pressTimer);
    });
  }
}
```

### 📐 レスポンシブデザイン (T023)

#### 画面サイズ対応
```css
/* 超小型デバイス (320px以下) */
@media (max-width: 320px) {
  .slot-grid {
    max-width: 280px;
    gap: 1px;
  }

  .symbol {
    font-size: 1.5rem;
  }

  .control-panel {
    padding: 0.5rem;
  }
}

/* 小型デバイス (321px-480px) */
@media (min-width: 321px) and (max-width: 480px) {
  .slot-grid {
    max-width: 320px;
  }

  .symbol {
    font-size: 2rem;
  }
}

/* 中型デバイス (481px-768px) */
@media (min-width: 481px) and (max-width: 768px) {
  .slot-grid {
    max-width: 400px;
  }

  .symbol {
    font-size: 2.5rem;
  }
}

/* 横向き対応 */
@media (orientation: landscape) and (max-height: 500px) {
  .game-container {
    flex-direction: row;
  }

  .slot-area {
    flex: 2;
  }

  .control-panel {
    flex: 1;
    flex-direction: column;
  }
}
```

#### 動的フォントサイズ
```javascript
class ResponsiveManager {
  constructor() {
    this.setupViewportHandler();
    this.adjustFontSizes();
  }

  adjustFontSizes() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const minDimension = Math.min(vw, vh);

    // シンボルサイズ自動調整
    const symbolSize = Math.max(1.5, minDimension * 0.08);
    document.documentElement.style.setProperty(
      '--symbol-size',
      `${symbolSize}rem`
    );

    // UIフォントサイズ調整
    const uiSize = Math.max(0.8, minDimension * 0.025);
    document.documentElement.style.setProperty(
      '--ui-font-size',
      `${uiSize}rem`
    );
  }

  setupViewportHandler() {
    window.addEventListener('resize', () => {
      this.adjustFontSizes();
    });

    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.adjustFontSizes();
      }, 100);
    });
  }
}
```

### ⚡ パフォーマンス最適化 (T024)

#### GPU加速設定
```css
/* GPU加速対象要素 */
.slot-grid,
.symbol,
.reel,
.particle {
  transform: translateZ(0); /* GPU層作成 */
  will-change: transform;   /* 最適化ヒント */
}

/* 非GPU加速プロパティ回避 */
.no-layout-animation {
  /* ❌ 避ける: width, height, top, left */
  /* ✅ 使う: transform, opacity */
}
```

#### DOM操作最適化
```javascript
class PerformanceOptimizer {
  constructor() {
    this.rafId = null;
    this.updateQueue = [];
  }

  // バッチ更新システム
  scheduleUpdate(updateFn) {
    this.updateQueue.push(updateFn);

    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => {
        this.flushUpdates();
      });
    }
  }

  flushUpdates() {
    // 読み取り操作をまとめて実行
    const reads = this.updateQueue.filter(fn => fn.type === 'read');
    reads.forEach(fn => fn.execute());

    // 書き込み操作をまとめて実行
    const writes = this.updateQueue.filter(fn => fn.type === 'write');
    writes.forEach(fn => fn.execute());

    this.updateQueue = [];
    this.rafId = null;
  }

  // メモリリーク対策
  cleanup() {
    // イベントリスナー削除
    // タイマー削除
    // 参照切断
  }
}
```

### ⚠️ 重要事項
1. **バッテリー効率**: 不要なアニメーションは停止
2. **メモリ管理**: 定期的なガベージコレクション促進
3. **タッチ精度**: 最小44px のタップターゲット
4. **パフォーマンス計測**: 60fps維持の監視

---

## 🔍 Team F: QA・統合チーム 指示書

### 🎯 ミッション
「完璧な品質でプレイヤーに最高の体験を届けよ」

### 📅 スケジュール
- **Day 8-9**: 機能テスト・統合テスト
- **Day 9**: 実機デバイステスト
- **Day 9-10**: バグ修正・最終調整

### 🎫 担当チケット
```
🔍 担当: T028-T032 (品質保証・完成)
⏰ 期限: Day 10 終了時
🔗 依存: 全機能実装完了後
```

### 🧪 テスト項目・手順

#### 機能テスト (T030-01)
```markdown
## ゲーム基本機能テスト

### スロット機能
- [ ] スピンボタン動作確認
- [ ] 3x3リール正常回転・停止
- [ ] シンボル表示正確性
- [ ] ペイライン判定精度（5ライン全て）
- [ ] 配当計算正確性

### ベット機能
- [ ] ベット額変更（100/500/1000/5000/10000/ALL IN）
- [ ] 残高不足時の制限
- [ ] ベット上限・下限チェック

### ステージシステム
- [ ] ステージ判定・アップグレード
- [ ] ステージ別機能解放
- [ ] ステージ別UI変化

### スキルシステム
- [ ] タイムフリーズ: リール個別停止
- [ ] フューチャービジョン: 5スピン予測表示
- [ ] ミラクルスピン: 確定大当たり
- [ ] 使用回数制限

### 特殊機能
- [ ] DOUBLE OR NOTHING
- [ ] RISK BET
- [ ] ALL OR NOTHING
- [ ] FEVER TIME / GOD MODE
```

#### デバイス互換性テスト (T030-02)
```markdown
## 対応デバイステスト

### iOS Safari
- [ ] iPhone SE (375x667)
- [ ] iPhone 12 (390x844)
- [ ] iPhone 14 Pro Max (430x932)
- [ ] iPad (768x1024)

### Android Chrome
- [ ] Galaxy S21 (360x800)
- [ ] Pixel 7 (412x915)
- [ ] OnePlus 9 (384x854)

### 動作確認項目
- [ ] タッチ操作精度
- [ ] スワイプジェスチャー
- [ ] 長押し操作
- [ ] 画面回転対応
- [ ] パフォーマンス（60fps維持）
```

#### パフォーマンステスト (T030-03)
```javascript
// パフォーマンス計測コード
class PerformanceMonitor {
  constructor() {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 60;
  }

  startMonitoring() {
    const measureFrame = () => {
      const now = performance.now();
      this.frameCount++;

      if (now - this.lastTime >= 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.lastTime = now;

        // FPS低下警告
        if (this.fps < 55) {
          console.warn(`Performance Warning: ${this.fps} FPS`);
        }
      }

      requestAnimationFrame(measureFrame);
    };

    measureFrame();
  }

  measureMemory() {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
  }
}
```

### 🐛 バグ修正プロセス (T031)

#### 優先度分類
```markdown
## バグ優先度

### 🔴 Critical (即時修正)
- ゲーム進行不可
- データ消失
- 重大な計算エラー

### 🟡 High (当日修正)
- 機能動作不良
- UI表示問題
- パフォーマンス低下

### 🟢 Medium (翌日修正)
- 軽微な表示崩れ
- 演出タイミング
- 使い勝手向上

### 🔵 Low (リリース後対応)
- 微細な調整
- 追加要望
```

#### バグレポート形式
```markdown
## バグレポート

**Bug ID**: BUG-001
**優先度**: High
**発見者**: QA Team
**発見日**: 2024-XX-XX

### 現象
[具体的な不具合内容]

### 再現手順
1. [手順1]
2. [手順2]
3. [手順3]

### 期待する動作
[正しい動作の説明]

### 環境情報
- デバイス: iPhone 12
- ブラウザ: Safari 16.0
- 画面サイズ: 390x844

### スクリーンショット
[必要に応じて添付]

### 修正担当
[担当チーム名]

### ステータス
- [ ] 調査中
- [ ] 修正中
- [ ] テスト中
- [ ] 完了
```

### 📋 最終チェックリスト (T032)

#### リリース前必須項目
```markdown
## 最終確認チェックリスト

### 📱 動作確認
- [ ] 全機能正常動作
- [ ] 全デバイス対応確認
- [ ] パフォーマンス基準クリア（60fps）
- [ ] メモリリーク無し

### 🎨 品質確認
- [ ] UI/UX統一性
- [ ] ネオンテーマ完成度
- [ ] アニメーション滑らかさ
- [ ] レスポンシブデザイン

### 🎰 ゲームバランス
- [ ] RTP 95-98% 確認
- [ ] 難易度適正
- [ ] スキル効果バランス
- [ ] ステージ進行妥当性

### 📝 ドキュメント
- [ ] README.md 完成
- [ ] コメント追加
- [ ] API仕様書更新
- [ ] 操作説明

### 🚀 デプロイ準備
- [ ] ファイル整理
- [ ] 最適化確認
- [ ] 本番環境テスト
- [ ] バックアップ作成
```

### ⚠️ 重要事項
1. **網羅的テスト**: 仕様書の全機能を確認
2. **実機優先**: エミュレータではなく実機でテスト
3. **客観的評価**: 数値目標に基づく品質判定
4. **迅速な報告**: 問題発見時は即座に関連チームに連絡

---

## 📞 プロジェクト全体の連絡・管理体制

### 🕐 日次スケジュール
```
09:00 - 朝会（15分）
  - 各チーム進捗報告
  - 当日作業確認
  - ブロッカー共有

12:00 - 中間確認（10分）
  - 午前進捗チェック
  - 午後作業調整

18:00 - 夕会（20分）
  - 当日成果報告
  - 翌日作業計画
  - 課題・リスク共有

20:00 - 進捗更新
  - チケット状況更新
  - ドキュメント同期
```

### 📱 緊急連絡体制
```
🚨 Level 1 (Critical): 即座に報告
  - プロジェクト進行停止レベル
  - 重大バグ・設計ミス
  → Slack @channel + 電話連絡

⚠️ Level 2 (High): 2時間以内報告
  - チーム作業に影響
  - 仕様確認が必要
  → Slack 専用チャンネル

📝 Level 3 (Normal): 当日報告
  - 進捗遅れ
  - 軽微な問題
  → 定例会議で報告
```

### 🎯 成功の定義
1. **機能完備**: 仕様書の全機能実装完了
2. **品質基準**: 60fps + バグゼロ
3. **スケジュール**: 10日以内完成
4. **チーム連携**: 効率的な並行開発実現

---

**プロジェクトの成功は全チームの協力にかかっています。**
**困った時は遠慮なく相談し、最高のゲームを作り上げましょう！**

**🎰 NEON RUSH で世界を魅了しよう！ 🚀**