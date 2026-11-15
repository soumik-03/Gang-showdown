# 🥊 Friend Showdown — The Gang Brawler

An arcade-style fighting game inspired by **FightKaro / Sansad Showdown**, customized for your friend group! Playable in any web browser on desktop and mobile from a single link.

---

## 🎮 How to Play Right Now (Local)

1. Double-click [`index.html`](file:///c:/Users/Soumik/OneDrive/Desktop/new/index.html) to open the game directly in Chrome, Edge, or Firefox.
2. Or run a simple local server in this directory:
   ```bash
   npx serve .
   # or
   python -m http.server 8000
   ```
3. Open `http://localhost:8000` in your browser.

---

## 🕹️ Controls

### Desktop (Keyboard)
| Action | Player 1 (You) | Player 2 (Local 2P) |
|---|---|---|
| **Move Left / Right** | `A` / `D` (or `◀` / `▶`) | `Numpad 4` / `Numpad 6` |
| **Jump** | `W` (or `▲`) | `Numpad 8` |
| **Crouch** | `S` (or `▼`) | `Numpad 5` |
| **Punch** | `J` | `Numpad 1` |
| **Kick** | `K` | `Numpad 2` |
| **Block** | Hold away from opponent or `H` | Hold back |
| **⚡ SUPER MOVE** | `Space` or `L` *(when Super is 100%)* | `Numpad 0` |

### Mobile (Smartphones)
* Open the link in landscape mode on your phone.
* Virtual D-Pad on the left (`◀`, `▶`, `▲`, `▼`).
* Action buttons on the right (`PUNCH`, `KICK`, `BLOCK`, `SUPER`).

---

## 📸 How to Add Your Friends (Photos & Custom Moves)

All character data lives in [`js/characters.js`](file:///c:/Users/Soumik/OneDrive/Desktop/new/js/characters.js).

### Step 1: Add Friend's Face Cutout
1. Take a photo of your friend's face.
2. Remove the background using any free tool (like [remove.bg](https://www.remove.bg/)).
3. Save it as a PNG inside the [`assets/avatars/`](file:///c:/Users/Soumik/OneDrive/Desktop/new/assets/avatars/) folder (e.g. `assets/avatars/rahul.png`).

### Step 2: Add Friend to `js/characters.js`
Open [`js/characters.js`](file:///c:/Users/Soumik/OneDrive/Desktop/new/js/characters.js) and add your friend:

```javascript
{
  id: "rahul",
  name: "Rahul",
  nickname: "The Legend",
  tagline: "Always eating everyone's fries.",
  avatar: "assets/avatars/rahul.png", // <--- your friend's face photo
  themeColor: "#ff4757",
  body: {
    shirt: "#e84118",
    pants: "#2f3640",
    shoes: "#ffffff",
    skin: "#fbc531",
  },
  quotes: {
    intro: "Bhai treat kaun de raha hai?",
    super: "MCDONALD'S FRY SWARM!",
    win: "Another free meal secured!",
    roast: "You couldn't even defend your own wallet."
  },
  superMove: {
    id: "fry_swarm",
    name: "FREE FRY BARRAGE",
    shout: "BHAI MERI TREAT KIDHAR HAI?!",
    auraColor: "#ff4757",
    damage: 45,
    type: "projectile_swarm", // 'projectile_swarm', 'ground_slam', 'teleport_rush', 'energy_beam'
    projectileIcon: "🍟",     // Any emoji or weapon icon
    speed: 15
  }
}
```

---

## 🚀 How to Host on a Single Link (100% Free)

You can share this game with all your friends via a single web link using any of these free options:

### Option A: Vercel (Easiest - 1 minute)
1. Install Vercel CLI (or use [vercel.com](https://vercel.com)):
   ```bash
   npm i -g vercel
   vercel
   ```
2. Follow the 3 prompts. It will instantly give you a link like `https://our-gang-brawler.vercel.app`!

### Option B: Netlify Drop (Zero code - 30 seconds)
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag and drop this entire project folder (`new`).
3. You immediately get a live shareable URL!

### Option C: GitHub Pages
1. Push this folder to a GitHub repository.
2. Go to **Settings > Pages > Branch: `main` > Save**.
3. Your game is live at `https://<username>.github.io/<repo-name>/`.
