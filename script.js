// --- CONFIGURATION ---
// Set your backend API base URL here (e.g., ngrok, Railway, Render, etc.)
const API_BASE_URL = 'https://YOUR_API_URL_HERE'; // <-- CHANGE THIS

// --- TELEGRAM LOGIN WIDGET ---
function renderTelegramLogin() {
    const loginDiv = document.getElementById('telegram-login-button');
    loginDiv.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', 'jitoxai_bot'); // <-- CHANGE IF NEEDED
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;
    loginDiv.appendChild(script);
}

// --- HANDLE TELEGRAM LOGIN ---
window.onTelegramAuth = function(user) {
    // Save user info (id, username, etc.)
    window.tgUser = user;
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('instructions-section').style.display = 'block';
};

// --- FETCH WALLET FROM API ---
document.getElementById('fetch-wallet-btn').onclick = async function() {
    if (!window.tgUser) {
        alert('Please login with Telegram first.');
        return;
    }
    // Show loading
    this.disabled = true;
    this.textContent = 'Fetching...';
    // --- API CALL: get_wallet ---
    // You must implement this endpoint in your backend!
    // Example: GET /api/get_wallet?user_id=123456
    try {
        const res = await fetch(`${API_BASE_URL}/api/get_wallet?user_id=${window.tgUser.id}`);
        const data = await res.json();
        if (data && data.wallet_address) {
            showWalletSection(data.wallet_address);
        } else {
            alert('Wallet not found. Make sure you used /get_wallet in the bot.');
            this.disabled = false;
            this.textContent = 'Fetch Wallet';
        }
    } catch (e) {
        alert('Error fetching wallet. Check your API URL and bot.');
        this.disabled = false;
        this.textContent = 'Fetch Wallet';
    }
};

// --- SHOW WALLET SECTION & START POLLING FOR DEPOSIT ---
function showWalletSection(walletAddress) {
    document.getElementById('instructions-section').style.display = 'none';
    document.getElementById('wallet-section').style.display = 'block';
    document.getElementById('wallet-address').textContent = walletAddress;
    // Start polling for deposit
    pollForDeposit(walletAddress);
}

// --- POLL FOR DEPOSIT (every 5s) ---
async function pollForDeposit(walletAddress) {
    const statusDiv = document.getElementById('deposit-status');
    const continueBtn = document.getElementById('continue-btn');
    let interval = setInterval(async () => {
        // --- API CALL: get_balance ---
        // You must implement this endpoint in your backend!
        // Example: GET /api/get_balance?wallet=... (returns {balance: 2.01})
        try {
            const res = await fetch(`${API_BASE_URL}/api/get_balance?wallet=${walletAddress}`);
            const data = await res.json();
            if (data && typeof data.balance === 'number') {
                statusDiv.textContent = `Current balance: ${data.balance.toFixed(4)} SOL`;
                if ([2, 5, 10].some(val => data.balance >= val)) {
                    continueBtn.disabled = false;
                    continueBtn.textContent = 'Continue';
                    statusDiv.textContent += ' ✅ Deposit detected!';
                    clearInterval(interval);
                }
            } else {
                statusDiv.textContent = 'Waiting for deposit...';
            }
        } catch (e) {
            statusDiv.textContent = 'Error checking balance. Retrying...';
        }
    }, 5000);
}

// --- INITIALIZE ---
window.onload = function() {
    renderTelegramLogin();
    // Optionally, check if already logged in (e.g., from localStorage)
}; 