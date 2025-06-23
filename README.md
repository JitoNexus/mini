# JitoX AI Mini-App

A futuristic, animated, mobile-first Telegram mini-app for onboarding users to JitoX AI. Features:

- **Theme switcher**: Instantly toggle between Purple/Blue Neon and Green/Yellow Neon themes
- **Animated backgrounds**: Gradient, particles, and glassmorphism
- **Animated transitions**: GSAP-powered screen and button animations
- **Animated progress bar**: After deposit is detected
- **Mobile-first, responsive, and accessible**

## Usage

1. **Clone this repo** and open `index.html` in your browser, or deploy to GitHub Pages.
2. **Theme Switcher**: Use the top-right button to toggle themes.
3. **Connect Telegram**: Use the login button to authenticate.
4. **Follow instructions**: Use `/get_wallet` in the bot, then fetch your wallet.
5. **Deposit**: After deposit, an animated progress bar will appear.

## Deployment

- Push to your GitHub repo.
- In GitHub, go to **Settings > Pages** and set the source to the root of the `main` branch.
- Your app will be live at `https://<your-username>.github.io/<repo-name>/`

## Backend API (ngrok)

- Run your Python backend (Flask) locally.
- Expose it with ngrok: `ngrok http 5000`
- Set the `API_BASE_URL` in `script.js` to your ngrok URL.

## Customization

- All theme colors and animation settings are in `styles.css` and `script.js`.
- Add more screens, charts, or features as needed! 