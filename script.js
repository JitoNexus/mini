// --- CONFIGURATION ---
const API_BASE_URL = 'https://YOUR_API_URL_HERE'; // <-- CHANGE THIS
let currentTheme = 'purple';
let telegramWidgetLoaded = false;

// --- THEME SWITCHER ---
function setTheme(theme) {
    document.body.classList.remove('theme-purple', 'theme-green');
    document.body.classList.add('theme-' + theme);
    currentTheme = theme;
    // Update particles color
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
    // Hide all screens
    document.querySelectorAll('.screen').forEach(s => {
        gsap.to(s, { opacity: 0, y: 30, duration: 0.4, onComplete: () => s.classList.remove('active') });
    });
    // Show target screen
    const screen = document.getElementById(screenId);
    setTimeout(() => {
        screen.classList.add('active');
        gsap.fromTo(screen, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
    }, 400);
}

// --- TELEGRAM LOGIN WIDGET ---
function renderTelegramLogin() {
    const loginDiv = document.getElementById('telegram-login-button');
    loginDiv.innerHTML = '';
    telegramWidgetLoaded = false;
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', 'jitoxai_bot'); // <-- CHANGE IF NEEDED
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;
    script.onload = function() { telegramWidgetLoaded = true; };
    loginDiv.appendChild(script);

    // Fallback: If widget doesn't load in 3 seconds, show fallback button
    setTimeout(() => {
        if (!telegramWidgetLoaded && !document.getElementById('tg-fallback-btn')) {
            const fallback = document.createElement('button');
            fallback.id = 'tg-fallback-btn';
            fallback.className = 'neon-btn';
            fallback.innerHTML = '<i class="fa-brands fa-telegram"></i> Open Telegram Bot';
            fallback.onclick = function() {
                window.open('https://t.me/jitoxai_bot', '_blank');
            };
            loginDiv.appendChild(fallback);
            // Show error message
            const msg = document.createElement('div');
            msg.className = 'glow-text';
            msg.style.marginTop = '10px';
            msg.innerHTML = 'If the Telegram login button does not appear, <br>click the button above to open the bot.';
            loginDiv.appendChild(msg);
        }
    }, 3000);
}

// --- HANDLE TELEGRAM LOGIN ---
window.onTelegramAuth = function(user) {
    window.tgUser = user;
    showScreen('instructions-screen');
};

// --- FETCH WALLET FROM API ---
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('fetch-wallet-btn').onclick = async function() {
        if (!window.tgUser) {
            alert('Please login with Telegram first.');
            return;
        }
        this.disabled = true;
        this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Fetching...';
        try {
            const res = await fetch(`${API_BASE_URL}/api/get_wallet?user_id=${window.tgUser.id}`);
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
                    // Show and animate progress bar
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
    // Animate fill to 100%
    setTimeout(() => {
        document.querySelector('.progress-fill').style.width = '100%';
    }, 200);
}

// --- ANIMATED BACKGROUND ---
function animateBackground() {
    // Animated gradient using GSAP
    const bg = document.getElementById('bg-anim');
    gsap.to(bg, {
        backgroundPosition: '200% 50%',
        duration: 10,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut'
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
    renderTelegramLogin();
    showScreen('login-screen');
    animateBackground();
    // Animate Telegram icon pulse
    gsap.to('.pulse', { scale: 1.08, repeat: -1, yoyo: true, duration: 0.7, ease: 'power1.inOut' });
    // Start particles
    window.particleSystem = new ParticleSystem(document.getElementById('bg-particles'));
    setTheme('purple');
}; 