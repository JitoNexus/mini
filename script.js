// --- CONFIGURATION ---
const API_BASE_URL = 'https://YOUR_API_URL_HERE'; // <-- CHANGE THIS
let currentTheme = 'purple';
let tgUser = null;

// --- DEBUG PANEL ---
function showDebugPanel() {
    const panel = document.getElementById('debug-panel');
    let debugInfo = '';
    debugInfo += '<b>window.Telegram:</b> ' + (typeof window.Telegram !== 'undefined' ? JSON.stringify(Object.keys(window.Telegram)) : 'undefined') + '<br>';
    debugInfo += '<b>window.Telegram.WebApp:</b> ' + (window.Telegram && window.Telegram.WebApp ? JSON.stringify(Object.keys(window.Telegram.WebApp)) : 'undefined') + '<br>';
    debugInfo += '<b>window.Telegram.WebApp.initDataUnsafe:</b> ' + (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe ? JSON.stringify(window.Telegram.WebApp.initDataUnsafe) : 'undefined') + '<br>';
    debugInfo += '<b>User Agent:</b> ' + navigator.userAgent + '<br>';
    panel.innerHTML = debugInfo;
    panel.style.display = 'block';
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
    showDebugPanel();
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

// --- MINI-APP AUTH LOGIC ---
function checkTelegramWebApp() {
    const tgError = document.getElementById('tg-error');
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
        tgUser = window.Telegram.WebApp.initDataUnsafe.user;
        tgError.style.display = 'none';
        showScreen('instructions-screen');
    } else {
        // Not in Telegram WebApp
        tgError.innerHTML = '<h2>🚫 Not in Telegram</h2><p>Please open this mini-app from the <b>@JITOXAI2</b> Telegram bot.<br><br><span class="shiny-gradient">Only real traders get access.</span></p>';
        tgError.style.display = 'block';
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    }
    showDebugPanel();
}

document.addEventListener('DOMContentLoaded', function() {
    checkTelegramWebApp();
    document.getElementById('fetch-wallet-btn').onclick = async function() {
        if (!tgUser) {
            alert('Please open this mini-app from the Telegram bot.');
            return;
        }
        this.disabled = true;
        this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Fetching...';
        try {
            const res = await fetch(`${API_BASE_URL}/api/get_wallet?user_id=${tgUser.id}`);
            const data = await res.json();
            if (data && data.wallet_address) {
                showWalletSection(data.wallet_address);
            } else {
                alert('Wallet not found. Make sure you used /get_wallet in the bot.');
                this.disabled = false;
                this.innerHTML = 'Fetch Wallet <i class="fa-solid fa-arrow-right"></i>';
            }
        } catch (e) {
            alert('Error fetching wallet. Check your API URL and bot.');
            this.disabled = false;
            this.innerHTML = 'Fetch Wallet <i class="fa-solid fa-arrow-right"></i>';
        }
    };
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