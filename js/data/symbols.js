const symbols = [
  { emoji: "🔷", weight: 5, payout: 100, name: "diamond" },   // 5%
  { emoji: "⚡", weight: 8, payout: 50, name: "lightning" },  // 8%
  { emoji: "🔥", weight: 10, payout: 30, name: "fire" },      // 10%
  { emoji: "💎", weight: 12, payout: 20, name: "gem" },       // 12%
  { emoji: "✨", weight: 15, payout: 10, name: "sparkle" },   // 15%
  { emoji: "🌙", weight: 20, payout: 5, name: "moon" },       // 20%
  { emoji: "7️⃣", weight: 3, payout: 200, name: "seven" },     // 3%
  { emoji: "", weight: 27, payout: 0, name: "empty" }         // 27% ハズレ
];

const getTotalWeight = () => {
  return symbols.reduce((total, symbol) => total + symbol.weight, 0);
};

const calculateRTP = () => {
  let totalReturn = 0;
  const totalWeight = getTotalWeight();

  symbols.forEach(symbol => {
    const hitProbability = Math.pow(symbol.weight / totalWeight, 3); // 3連続確率
    totalReturn += hitProbability * symbol.payout * 5; // 5ライン
  });

  return totalReturn; // 目標: 0.95-0.98
};

const getSymbolByWeight = (randomValue) => {
  const totalWeight = getTotalWeight();
  const targetWeight = randomValue * totalWeight;
  let currentWeight = 0;

  for (const symbol of symbols) {
    currentWeight += symbol.weight;
    if (targetWeight <= currentWeight) {
      return symbol;
    }
  }

  return symbols[symbols.length - 1]; // フォールバック
};

const validateSymbolProbabilities = () => {
  const rtp = calculateRTP();
  console.log(`Current RTP: ${(rtp * 100).toFixed(2)}%`);

  if (rtp < 0.95 || rtp > 0.98) {
    console.warn('RTPが目標範囲外です:', rtp);
  }

  return {
    rtp,
    isValid: rtp >= 0.95 && rtp <= 0.98,
    totalWeight: getTotalWeight()
  };
};

export { symbols, getSymbolByWeight, calculateRTP, validateSymbolProbabilities };