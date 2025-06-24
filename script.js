// --- CONFIGURATION ---
const API_BASE_URL = 'https://behalf-nec-idle-phone.trycloudflare.com'; // <-- CLOUDFLARE TUNNEL URL SET HERE
let currentTheme = 'purple';

// --- TELEGRAM USER ID DETECTION ---
let tgUser = null;

// Try multiple methods to get Telegram user ID
function getTelegramUserId() {
    // Method 1: Telegram WebApp API
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
        return window.Telegram.WebApp.initDataUnsafe.user.id;
    }
    
    // Method 2: URL parameters (if passed from bot)
    const urlParams = new URLSearchParams(window.location.search);
    const userIdFromUrl = urlParams.get('user_id');
    if (userIdFromUrl && !isNaN(userIdFromUrl)) {
        return userIdFromUrl;
    }
    
    // Method 3: Try parsing initData
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
        try {
            const params = new URLSearchParams(window.Telegram.WebApp.initData);
            const userStr = params.get('user');
            if (userStr) {
                const userObj = JSON.parse(userStr);
                if (userObj.id) return userObj.id;
            }
        } catch (e) {}
    }
    
    return null;
}

function showDebugPanel(userId, tgApiPresent, url) {
    let panel = document.getElementById('debug-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'debug-panel';
        panel.style = 'background: #1a0033; color: #fff; padding: 10px; font-size: 0.95em; border-radius: 8px; margin: 10px auto 20px auto; max-width: 95vw; word-break: break-all; position: fixed; top: 0; left: 0; right: 0; z-index: 99999; box-shadow: 0 2px 12px #0008;';
        document.body.appendChild(panel);
    }
    panel.innerHTML = `<b>Debug Panel</b><br>
        <b>URL:</b> ${url}<br>
        <b>Telegram WebApp API:</b> ${tgApiPresent ? '✅' : '❌'}<br>
        <b>Detected User ID:</b> ${userId ? userId : '<span style=\"color:#ff4a4a\">NOT FOUND</span>'}`;
}

function showManualIdInput() {
    let inputDiv = document.getElementById('manual-id-input');
    if (!inputDiv) {
        inputDiv = document.createElement('div');
        inputDiv.id = 'manual-id-input';
        inputDiv.style = 'margin: 60px auto 30px auto; text-align: center; max-width: 95vw; z-index: 99999; position: relative;';
        inputDiv.innerHTML = `
            <div id="slideshow" style="margin-bottom: 18px;">
                <div class="slide" style="display:block;">
                    <b>Step 1:</b> Open <a href='https://t.me/getmyid_bot' target='_blank' style='color:#fff;text-decoration:underline;'>@getmyid_bot</a> in Telegram.<br><img src='https://telegram.org/img/t_logo.png' alt='Telegram' style='height:32px;vertical-align:middle;margin:8px 0;'>
                </div>
                <div class="slide" style="display:none;">
                    <b>Step 2:</b> Tap <b>Start</b> and copy your numeric Telegram ID.<br><img src='https://i.imgur.com/1Q9Z1ZB.png' alt='Copy ID' style='height:32px;vertical-align:middle;margin:8px 0;'>
                </div>
                <div class="slide" style="display:none;">
                    <b>Step 3:</b> Paste your ID below and click <b>Fetch Wallet</b>.<br><img src='https://i.imgur.com/2y6Qw1A.png' alt='Paste ID' style='height:32px;vertical-align:middle;margin:8px 0;'>
                </div>
                <div style="margin-top:8px;">
                    <button id="prev-slide" style="padding:4px 10px;">&#8592;</button>
                    <button id="next-slide" style="padding:4px 10px;">&#8594;</button>
                </div>
            </div>
            <input type="text" id="user-id-input" placeholder="Enter your Telegram User ID" style="padding: 10px; font-size: 1.1em; border-radius: 8px; border: 1px solid #ccc; width: 80%; max-width: 350px;">
            <button id="fetch-wallet-btn" style="padding: 10px 20px; font-size: 1.1em; border-radius: 8px; background: #7c3aed; color: #fff; border: none; margin-left: 10px; cursor: pointer;">Fetch Wallet</button>
            <div style="color:#ff4a4a; margin-top:10px;">Could not detect your Telegram ID automatically.<br>Paste it here (get it from <a href='https://t.me/getmyid_bot' target='_blank' style='color:#fff;text-decoration:underline;'>@getmyid_bot</a>).</div>
        `;
        document.body.prepend(inputDiv);
        // Slideshow logic
        let slideIdx = 0;
        const slides = inputDiv.querySelectorAll('.slide');
        inputDiv.querySelector('#prev-slide').onclick = function() {
            slides[slideIdx].style.display = 'none';
            slideIdx = (slideIdx - 1 + slides.length) % slides.length;
            slides[slideIdx].style.display = 'block';
        };
        inputDiv.querySelector('#next-slide').onclick = function() {
            slides[slideIdx].style.display = 'none';
            slideIdx = (slideIdx + 1) % slides.length;
            slides[slideIdx].style.display = 'block';
        };
    }
    document.getElementById('fetch-wallet-btn').onclick = function() {
        const userId = document.getElementById('user-id-input').value.trim();
        if (!userId || isNaN(userId)) {
            alert('Please enter a valid numeric Telegram User ID.');
            return;
        }
        fetchWalletWithUserId(userId);
    };
}

function fetchWalletWithUserId(userId) {
    showScreen('loading');
    fetch(`${API_BASE_URL}/api/get_wallet?user_id=${encodeURIComponent(userId)}`)
        .then(res => res.json())
        .then(data => {
            if (data.wallet_address) {
                showWalletSection(data.wallet_address);
                fetch(`${API_BASE_URL}/api/get_balance?wallet=${encodeURIComponent(data.wallet_address)}`)
                    .then(res => res.json())
                    .then(balData => {
                        if (balData.balance !== undefined) {
                            showDepositProgress(balData.balance);
                        } else {
                            showDepositProgress(0);
                        }
                    })
                    .catch(() => showDepositProgress(0));
            } else {
                showScreen('error');
                document.getElementById('error-message').textContent = data.error || 'Wallet not found.';
            }
        })
        .catch(() => {
            showScreen('error');
            document.getElementById('error-message').textContent = 'API connection failed.';
        });
}

// --- THEME SWITCHER ---
function setTheme(theme) {
    document.body.classList.remove('theme-purple', 'theme-green');
    document.body.classList.add('theme-' + theme);
    currentTheme = theme;
    if (window.particleSystem) window.particleSystem.setTheme(theme);
}
document.addEventListener('DOMContentLoaded', function() {
    setTheme('purple');
    document.getElementById('theme-switcher').onclick = function() {
        setTheme(currentTheme === 'purple' ? 'green' : 'purple');
    };
});

// --- SCREEN TRANSITIONS ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => {
        gsap.to(s, { opacity: 0, y: 30, duration: 0.4, onComplete: () => s.classList.remove('active') });
    });
    const screen = document.getElementById(screenId);
    setTimeout(() => {
        screen.classList.add('active');
        gsap.fromTo(screen, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
        if (screenId === 'instructions-screen') {
            animateShine();
            animateSparkles();
        }
    }, 400);
}

// --- MINI-APP LOGIC ---
window.addEventListener('DOMContentLoaded', function() {
    const tgApiPresent = !!(window.Telegram && window.Telegram.WebApp);
    const url = window.location.href;
    const userId = getTelegramUserId();
    showDebugPanel(userId, tgApiPresent, url);
    if (!userId) {
        // Hide instructions screen and show only manual input/slideshow
        const instructionsScreen = document.getElementById('instructions-screen');
        if (instructionsScreen) instructionsScreen.style.display = 'none';
        showManualIdInput();
    } else {
        fetchWalletWithUserId(userId);
    }
});

function showWalletSection(walletAddress) {
    document.getElementById('wallet-address').textContent = walletAddress;
    showScreen('wallet-screen');
    pollForDeposit(walletAddress);
}

// --- POLL FOR DEPOSIT (every 5s) ---
function pollForDeposit(walletAddress) {
    const statusDiv = document.getElementById('deposit-status');
    const continueBtn = document.getElementById('continue-btn');
    const progressDiv = document.getElementById('deposit-progress');
    let interval = setInterval(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/get_balance?wallet=${walletAddress}`);
            const data = await res.json();
            if (data && typeof data.balance === 'number') {
                statusDiv.innerHTML = `<i class='fa-solid fa-coins'></i> Current balance: <b>${data.balance.toFixed(4)} SOL</b>`;
                if ([2, 5, 10].some(val => data.balance >= val)) {
                    continueBtn.disabled = false;
                    continueBtn.innerHTML = "Continue <i class='fa-solid fa-arrow-right'></i>";
                    statusDiv.innerHTML += " <span style='color:#00c3ff;'>✅ Deposit detected!</span>";
                    clearInterval(interval);
                    showDepositProgress(data.balance);
                    gsap.fromTo(continueBtn, { scale: 0.9 }, { scale: 1.05, yoyo: true, repeat: 5, duration: 0.2, ease: 'power1.inOut' });
                }
            } else {
                statusDiv.innerHTML = "<i class='fa-solid fa-spinner fa-spin'></i> Waiting for deposit...";
            }
        } catch (e) {
            statusDiv.innerHTML = "<i class='fa-solid fa-triangle-exclamation'></i> Error checking balance. Retrying...";
        }
    }, 5000);
}

// --- ANIMATED PROGRESS BAR ---
function showDepositProgress(balance) {
    const progressDiv = document.getElementById('deposit-progress');
    progressDiv.style.display = 'block';
    progressDiv.innerHTML = '<div class="progress-fill"></div>';
    setTimeout(() => {
        document.querySelector('.progress-fill').style.width = '100%';
    }, 200);
}

// --- ANIMATED BACKGROUND ---
function animateBackground() {
    const bg = document.getElementById('bg-anim');
    gsap.to(bg, {
        backgroundPosition: '200% 50%',
        duration: 10,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut'
    });
}

// --- SHINE EFFECT ANIMATION ---
function animateShine() {
    const shine = document.getElementById('shine-effect');
    if (shine) {
        shine.style.animation = 'none';
        void shine.offsetWidth;
        shine.style.animation = 'shineEffectMove 2.5s linear infinite';
    }
}
function animateSparkles() {
    document.querySelectorAll('.sparkle').forEach(sparkle => {
        gsap.fromTo(sparkle, { scale: 1, opacity: 0.7 }, { scale: 1.3, opacity: 1, yoyo: true, repeat: -1, duration: 0.7, ease: 'power1.inOut' });
    });
}

// --- PARTICLE SYSTEM ---
class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.theme = 'purple';
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.initParticles();
        this.animate();
    }
    setTheme(theme) {
        this.theme = theme;
    }
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    initParticles() {
        this.particles = [];
        for (let i = 0; i < 40; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                r: 2 + Math.random() * 3,
                dx: -0.5 + Math.random(),
                dy: -0.5 + Math.random(),
                alpha: 0.5 + Math.random() * 0.5
            });
        }
    }
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let p of this.particles) {
            let color = this.theme === 'purple' ? 'rgba(111,0,255,0.3)' : 'rgba(0,255,136,0.3)';
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.r, 0, 2 * Math.PI);
            this.ctx.fillStyle = color;
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
            p.x += p.dx;
            p.y += p.dy;
            if (p.x < 0 || p.x > this.canvas.width) p.dx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.dy *= -1;
        }
        requestAnimationFrame(() => this.animate());
    }
}

// --- INITIALIZE ---
window.onload = function() {
    animateBackground();
    gsap.to('.pulse', { scale: 1.08, repeat: -1, yoyo: true, duration: 0.7, ease: 'power1.inOut' });
    window.particleSystem = new ParticleSystem(document.getElementById('bg-particles'));
    setTheme('purple');
}; 