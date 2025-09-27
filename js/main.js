/**
 * NEON RUSH - メインエントリーポイント
 * 基盤・インフラチーム作成
 */

// 基本的なDOMContentLoaded時の初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎰 NEON RUSH - ゲーム開始準備完了');

    // 基本的なUI要素の動作確認
    const spinButton = document.getElementById('spin-button');
    const slotGrid = document.getElementById('slot-grid');

    if (spinButton) {
        spinButton.addEventListener('click', () => {
            console.log('スピンボタンがクリックされました');
            // 一時的なテスト表示
            const symbols = ['🔷', '⚡', '🔥', '💎', '✨', '🌙', '7️⃣'];
            const symbolElements = document.querySelectorAll('.symbol');

            symbolElements.forEach(element => {
                const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
                element.textContent = randomSymbol;
            });
        });
    }

    // ベットボタンの基本動作
    const betButtons = document.querySelectorAll('.bet-btn');
    betButtons.forEach(button => {
        button.addEventListener('click', () => {
            // アクティブ状態の切り替え
            betButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const betValue = button.dataset.bet;
            const betDisplay = document.getElementById('bet-display');
            if (betDisplay && betValue !== 'max') {
                betDisplay.textContent = betValue;
            }
            console.log(`ベット額変更: ${betValue}`);
        });
    });

    // 初期表示の設定
    initializeDisplay();
});

/**
 * 初期表示の設定
 */
function initializeDisplay() {
    // デフォルトシンボルの表示
    const symbols = ['🔷', '⚡', '🔥', '💎', '✨', '🌙', '7️⃣', '🔷', '⚡'];
    const symbolElements = document.querySelectorAll('.symbol');

    symbolElements.forEach((element, index) => {
        element.textContent = symbols[index];
    });

    // デフォルトベットボタンの選択
    const defaultBetButton = document.querySelector('.bet-btn[data-bet="100"]');
    if (defaultBetButton) {
        defaultBetButton.classList.add('active');
    }

    console.log('✅ 初期表示設定完了');
}