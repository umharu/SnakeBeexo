# 🐍 Bexxo Snake Game

A modern, blockchain-integrated Snake game built for the Bexxo ecosystem. Players connect their Bexxo wallet, compete for high scores, and their achievements are tied to their unique wallet identity.

## 🎮 Live Demo

**Deployment:** [Your Vercel URL here]

## ✨ Features

### 🔐 Wallet Integration
- **Bexxo Wallet Authentication** - Seamless connection via XOConnect
- **Unique Alias System** - Each player identified by their seed-phrase-derived alias
- **Wallet-Based High Scores** - Scores tied to wallet addresses for authenticity
- **Leaderboard System** - Top 10 players ranked by score

### 🎯 Gameplay
- **Classic Snake Mechanics** - Smooth, responsive gameplay
- **Progressive Difficulty** - Speed increases every 50 points
- **Real-time Scoring** - Instant score updates
- **Pause/Resume** - Full game state control
- **Game Over Screen** - Shows final score and new record celebrations

### 📱 Responsive Design
- **Desktop & Mobile Support** - Optimized for all screen sizes
- **Touch Controls** - On-screen directional buttons for mobile
- **Keyboard Controls** - Arrow keys, WASD, and spacebar support
- **Adaptive Canvas** - Game area scales to fit any device

### 🎨 Modern UI
- **Beexo Branding** - Official colors and design language
- **Smooth Animations** - Floating elements and transitions
- **Dark Theme** - Easy on the eyes with gradient backgrounds
- **Interactive Navigation** - Multi-page app with Home, Game, and About sections

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Bexxo Wallet extension installed (for testing)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/umharu/SnakeBeexo.git
cd SnakeBeexo
```

2. **Install dependencies**
```bash
npm install
```

3. **Run development server**
```bash
npm run dev
```

4. **Build for production**
```bash
npm run build
```

The game will be available at `http://localhost:5173` (or the port Vite assigns).

## 📦 Dependencies

```json
{
  "xo-connect": "latest",
  "ethers": "^6.x.x",
  "vite": "^5.x.x"
}
```

- **xo-connect** - Bexxo's Web3 wallet connection library
- **ethers** - Ethereum library for blockchain interactions
- **vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework (via CDN)


## 🔧 Technical Implementation

### Bexxo Wallet Integration

The game uses the official **xo-connect** package for wallet authentication:

```javascript
import { XOConnect } from "xo-connect";

// Initialize XOConnect
const xoConnect = new XOConnect();

// Connect to Bexxo wallet
await xoConnect.connect();

// Get wallet info
const provider = xoConnect.getProvider();
const signer = provider.getSigner();
const address = await signer.getAddress();
const alias = xoConnect.getAlias(); // Unique alias from seed phrase
```

### High Score Storage

Scores are stored locally with wallet address as the key:

```javascript
// Save high score
localStorage.setItem(`bexxo_highscore_${address}`, score);

// Leaderboard storage
localStorage.setItem('bexxo_snake_leaderboard', JSON.stringify(leaderboard));
```

### Game Flow

1. **Home Screen** - User enters their Bexxo alias
2. **Wallet Connection** - Click "JUGAR" → XOConnect authentication
3. **Game Screen** - Snake game with real-time scoring
4. **Score Submission** - High scores automatically saved to wallet
5. **Leaderboard Update** - Rankings updated with new scores

## 🎨 Color Scheme (Bexxo Official)

```css
/* Background Gradients */
background: linear-gradient(135deg, #0b1020 0%, #111827 50%, #020617 100%);

/* Snake Colors */
Snake Head: #22c55e → #16a34a (Green gradient)
Snake Body: #16a34a → #15803d

/* Food Color */
Food: #f97316 → #ea580c (Orange gradient)

/* Canvas Background */
Canvas: #020617 (Dark blue)

/* UI Elements */
Borders: rgba(255, 255, 255, 0.1)
Text: White with opacity variants
Accents: Emerald (#10b981) for highlights
```

## 🌐 Deployment on Vercel

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/umharu/SnakeBeexo)

### Manual Deployment

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy**
```bash
vercel --prod
```

### Vercel Configuration

The `vercel.json` file configures the deployment:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

## 📋 Bexxo Team Review Checklist

### ✅ Integration Requirements
- [x] Uses official `xo-connect` package
- [x] Proper wallet connection flow
- [x] Alias retrieval from seed phrase
- [x] Wallet address verification
- [x] Error handling for connection failures

### ✅ User Experience
- [x] Clear onboarding instructions
- [x] Responsive design (mobile + desktop)
- [x] Smooth animations and transitions
- [x] Loading states during wallet connection
- [x] Informative error messages

### ✅ Security & Privacy
- [x] No private key exposure
- [x] Client-side only (no backend)
- [x] localStorage for non-sensitive data only
- [x] Proper wallet disconnection handling

### ✅ Branding
- [x] Bexxo logo and colors
- [x] Consistent design language
- [x] Professional UI/UX
- [x] Clear attribution to Bexxo

## 🎯 Compatibility with Bexxo App

### Expected Behavior in Bexxo App:

✅ **Should Work:**
- Wallet connection via XOConnect
- Alias retrieval and display
- Game functionality
- Score storage per wallet
- Responsive layout in webview

⚠️ **May Need Adjustment:**
- localStorage access in webview (verify with Bexxo team)
- Canvas rendering in mobile webview
- Touch event handling in app context

### Testing Recommendations:

1. Test wallet connection in Bexxo app webview
2. Verify localStorage persistence
3. Check canvas rendering performance
4. Test touch controls in app environment
5. Verify alias retrieval from Bexxo's system

## 📱 Controls

### Desktop
- **Arrow Keys** or **WASD** - Move snake
- **Spacebar** - Pause/Resume

### Mobile
- **On-screen buttons** - Directional controls
- **Tap** - Pause button

## 🐛 Known Issues / Limitations

- High scores stored locally (not on blockchain)
- No score verification/signing yet
- Leaderboard is device-specific
- Requires Bexxo wallet extension for desktop

## 🔮 Future Enhancements

- [ ] On-chain score storage
- [ ] Cryptographic score signing
- [ ] Global leaderboard (backend)
- [ ] NFT rewards for high scores
- [ ] Tournament mode
- [ ] Social sharing features
- [ ] Power-ups and special items

## 👨‍💻 Developer

**Developed by:** umharu  
**For:** Bexxo Ecosystem  
**Repository:** [github.com/umharu/SnakeBeexo](https://github.com/umharu/SnakeBeexo)

## 📄 License

MIT License - feel free to use and modify!

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push and create a Pull Request

## 📞 Contact & Support

- **Issues:** [GitHub Issues](https://github.com/umharu/SnakeBeexo/issues)
- **Bexxo Documentation:** [Bexxo Docs](https://docs.bexxo.io) (if available)

---

## 🎉 Ready for Bexxo Team Review!

This project is ready for integration into the Bexxo ecosystem. All wallet authentication is handled via the official `xo-connect` package, and the game follows Bexxo's design guidelines.

**Next Steps:**
1. ✅ Deploy to Vercel
2. ✅ Submit for Bexxo team review
3. ⏳ Test in Bexxo app environment
4. ⏳ Make any requested adjustments
5. 🚀 Launch to Bexxo users!

---

**Built with ❤️ for the Beexo community** 🐝🎮