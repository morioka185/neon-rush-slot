# 🎰 NEON RUSH - 10,000 RUSH 実装仕様書

## 📋 ゲーム概要
- **ゲーム名**: NEON RUSH - 10,000 RUSH
- **プラットフォーム**: Web（モバイル最適化）
- **技術**: HTML5 + CSS3 + JavaScript（フレームワークなし）
- **データ保存**: なし（リロードでリセット）
- **目的**: 初回10,000コインをどこまで増やせるか挑戦

## 🎮 ゲームフロー

### 1. 初期状態
```javascript
{
  coins: 10000,
  bet: 100,
  totalSpins: 0,
  maxWin: 0,
  consecutiveWins: 0,
  multiplier: 1.0,
  heatGauge: 0,
  stage: 1,
  skills: {
    timeFreeze: 1,
    futureVision: 1,
    miracleSpin: 1
  }
}
```

### 2. ステージシステム
```javascript
stages = {
  1: { name: "NORMAL", min: 10000, max: 30000, color: "#00ff88" },
  2: { name: "HEAT", min: 30000, max: 70000, color: "#ff9900" },
  3: { name: "DANGER", min: 70000, max: 150000, color: "#ff3366" },
  4: { name: "CHAOS", min: 150000, max: 500000, color: "#ff00ff" },
  5: { name: "LEGEND", min: 500000, max: null, color: "#ffff00" }
}
```

## 🎰 スロット仕様

### リール構成
```javascript
symbols = [
  { emoji: "🔷", name: "diamond", weight: 5, payout: 100 },
  { emoji: "⚡", name: "thunder", weight: 8, payout: 50 },
  { emoji: "🔥", name: "fire", weight: 10, payout: 30 },
  { emoji: "💎", name: "gem", weight: 12, payout: 20 },
  { emoji: "✨", name: "star", weight: 15, payout: 10 },
  { emoji: "🌙", name: "moon", weight: 20, payout: 5 },
  { emoji: "7️⃣", name: "seven", weight: 3, payout: 200 }
]

// 3x3グリッド
reels = [
  [symbol1, symbol2, symbol3],  // 左リール
  [symbol1, symbol2, symbol3],  // 中リール
  [symbol1, symbol2, symbol3]   // 右リール
]
```

### ペイライン（5ライン）
```javascript
paylines = [
  [[0,0], [1,0], [2,0]], // 横上
  [[0,1], [1,1], [2,1]], // 横中
  [[0,2], [1,2], [2,2]], // 横下
  [[0,0], [1,1], [2,2]], // 斜め＼
  [[0,2], [1,1], [2,0]]  // 斜め／
]
```

## 🎯 機能仕様

### 1. 基本機能
- **スピン**: リール回転→停止→判定→配当
- **ベット額変更**: 100/500/1000/5000/10000/ALL IN
- **オートプレイ**: 長押しで自動スピン
- **目押し**: タイミングでリール停止位置を調整

### 2. ステージ別解放機能

#### STAGE 2 (30,000+)
- **DOUBLE OR NOTHING**: 勝利後、50%確率で配当2倍
- **FEVER TIME**: 100スピンごとに5回転配当2倍

#### STAGE 3 (70,000+)
- **RISK BET**: 10倍賭けで配当5倍（勝率20%）
- **CHAIN BONUS**: 連勝数×0.5倍の追加倍率

#### STAGE 4 (150,000+)
- **ALL OR NOTHING**: 全額賭け（成功30%で3倍）
- **GOD MODE**: 777で10回転全勝利

#### STAGE 5 (500,000+)
- **MILLION CHANCE**: 最終チャレンジモード
- **TIME ATTACK**: 60秒で倍増チャレンジ

### 3. スキルシステム（各1回限定）
```javascript
skills = {
  timeFreeze: {
    count: 1,
    effect: "1スピン全リール任意停止"
  },
  futureVision: {
    count: 1,
    effect: "次の5スピン結果表示"
  },
  miracleSpin: {
    count: 1,
    effect: "確定大当たり(10-50倍)"
  }
}
```

### 4. システム変数
```javascript
gameState = {
  // メインステータス
  coins: 10000,
  bet: 100,
  stage: 1,
  
  // 倍率システム
  multiplier: 1.0,        // 勝利で+0.1、敗北で1.0
  maxMultiplier: 5.0,
  
  // ヒートゲージ
  heatGauge: 0,          // 0-100
  heatMode: false,
  
  // 統計
  totalSpins: 0,
  maxCoins: 10000,
  consecutiveWins: 0,
  maxConsecutiveWins: 0,
  totalWon: 0,
  
  // ゲーム状態
  isSpinning: false,
  isAutoPlay: false,
  gameOver: false,
  
  // イベント
  lastDevilOffer: false,  // 悪魔の提案使用済み
  bonusAvailable: true    // 50000毎のボーナス
}
```

## 🎨 UI/UXデザイン

### レイアウト構成
```
┌─────────────────────────┐
│  [STAGE] [MULTIPLIER]   │ ← ヘッダー
├─────────────────────────┤
│  💰 COINS: XXX,XXX      │ ← コイン表示
├─────────────────────────┤
│  ┌─────┬─────┬─────┐   │
│  │ 🔷 │ ⚡ │ 🔥 │   │ ← 3x3スロット
│  ├─────┼─────┼─────┤   │
│  │ 💎 │ ✨ │ 🌙 │   │
│  ├─────┼─────┼─────┤   │
│  │ 7️⃣ │ 🔷 │ ⚡ │   │
│  └─────┴─────┴─────┘   │
├─────────────────────────┤
│  [BET: 100] [SPIN]      │ ← 操作パネル
├─────────────────────────┤
│  [SKILL1][SKILL2][SKILL3]│ ← スキルボタン
└─────────────────────────┘
```

### CSSアニメーション
- **リール回転**: `transform: translateY()` + `transition`
- **当たり演出**: `@keyframes flash` + パーティクル
- **ネオン効果**: `box-shadow` + `text-shadow`
- **ステージ変化**: 背景グラデーション変更

### カラーテーマ
```css
:root {
  --neon-pink: #ff00ff;
  --neon-cyan: #00ffff;
  --neon-green: #00ff88;
  --neon-yellow: #ffff00;
  --dark-bg: #0a0a0a;
  --glow: 0 0 20px;
}
```

## 📱 操作仕様

### タッチ操作
- **タップ**: スピン実行
- **ダブルタップ**: クイックスピン（演出省略）
- **長押し**: オートプレイON/OFF
- **スワイプ上下**: ベット額変更
- **スワイプ左右**: リスクレベル変更（実装時）

### キーボード操作（デバッグ用）
- **Space**: スピン
- **↑↓**: ベット額変更
- **1,2,3**: スキル使用

## 🔊 サウンド仕様
```javascript
sounds = {
  spin: "リール回転音",
  stop: "リール停止音（3段階）",
  win: "勝利ファンファーレ",
  bigWin: "大勝利BGM",
  coin: "コイン獲得音",
  skill: "スキル発動音",
  gameOver: "ゲームオーバー音"
}
```

## 🎮 ゲームオーバー処理

### 破産条件
- コイン0以下
- ALL OR NOTHING失敗

### リザルト表示
```javascript
result = {
  startCoins: 10000,
  finalCoins: 0,
  multiplier: 0,
  maxCoins: 0,
  totalSpins: 0,
  maxWins: 0,
  playTime: 0,
  rank: "BUSTED",
  title: "破産者"
}
```

## 📊 パフォーマンス要件
- **FPS**: 60fps維持
- **レスポンス**: タップから100ms以内に反応
- **アニメーション**: GPU加速使用（transform/opacity）

## 🚀 実装優先順位
1. **コア機能**: スロット基本動作
2. **ステージシステム**: 段階的解放
3. **スキル機能**: 3つの必殺技
4. **演出**: アニメーション/エフェクト
5. **サウンド**: Web Audio API実装
6. **最適化**: パフォーマンス調整

---

この仕様書に基づいてClaudeCodeで実装を進めてください。不明な点があれば質問してください！