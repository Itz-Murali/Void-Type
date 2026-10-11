<div align="center">

<img src="https://files.catbox.moe/po4yde.png" alt="VOIDTYPE" width="520">

<br>

### Type. Aim. Survive.

A fast, cinematic **3D space-combat typing game**. Every asteroid, enemy ship and supply crate carries a word.
Type it and your ship fires. Faster, cleaner typing clears more of the sky.

<br>

[![Play now](https://img.shields.io/badge/▶_PLAY_NOW-void--type.vercel.app-4fd8ff?style=for-the-badge&logo=vercel&logoColor=black)](https://void-type.vercel.app/)

![Nuxt](https://img.shields.io/badge/Nuxt_4-00DC82?style=flat-square&logo=nuxtdotjs&logoColor=white)
![Vue](https://img.shields.io/badge/Vue_3-42B883?style=flat-square&logo=vuedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=flat-square&logo=threedotjs&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8?style=flat-square&logo=pwa&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

</div>

---

## ✨ Highlights

- **Typing is shooting.** No input box. Type the first letter to lock on, finish the word to destroy the target. Each correct key fires a visible beam that travels to the target.
- **A real 3D game**, not a typing form with decoration. Everything is live Three.js: ship, asteroids, enemy fleets, lasers, particles, explosions, shields.
- **A living universe.** Procedural planets with moons, stars, spiral galaxies, nebulae, black holes, stations, asteroid fields, comets and live space events. The backdrop never stops moving.
- **Adaptive difficulty** driven by both time and your actual WPM. It rises steadily and never spikes.
- **Plays anywhere.** Responsive from phones to ultrawide, installable as a PWA, works offline.
- **Zero assets to download.** All models, textures, shaders and sound effects are generated procedurally.

## 🎯 What you will meet

| Target | Behaviour | Threat |
|---|---|---|
| **Asteroid** | Drifts toward you | 12 HP if it lands |
| **Fast** | 1.8x speed, worth more | 12 HP |
| **Armored** | Big, slow, long word | 20 HP |
| **Bonus** (violet) | Harmless. Destroy it for 8 s of x2 score | none |
| **Danger** (red) | Heavy hitter | 35 HP |
| **Fighters** | **Razor**, **Viper**, **Wraith**: hover, strafe and fire from the moment they appear | 7 HP per bolt |
| **Gunships** | **Reaper** (twin cannons), **Marauder** (triple shot) | 10 HP per bolt |
| **Guardian** (green) | Friendly shield. Destroy it to heal | **+25 HP** |
| **Supply crate** (gold) | Random power-up when destroyed | see below |

Enemy ships flash red just before they fire. Kill them first.

### ⚡ Power-ups (from supply crates)

| Power-up | Effect |
|---|---|
| **Slow-Time** | 6 s. The world runs at 40% speed, your beams do not |
| **Overdrive** | 8 s. Double score and a second beam from your other cannon |
| **Nova Bomb** | Destroys every target on screen and clears enemy bolts |

### 🔫 Combo beams

Your beam upgrades as your combo grows: **cyan** → **gold** at x10 → **violet** at x25. A wrong key breaks the combo, so accuracy beats raw speed.

## 🌌 Space events

Meteor showers, solar flares, supernovae, ion storms and singularities roll through the sky during play. They are cinematic only and never change difficulty.

## 🎮 Controls

| Input | Action |
|---|---|
| Letters | Lock on and fire |
| `Esc` | Pause / resume |
| Keyboard button (touch) | Open the on-screen keyboard |

Backspace is intentionally inert: every key counts.

## 📊 Career and settings

Everything is stored locally on your device: runs played, total and best score, best WPM, best and lifetime accuracy, best combo, highest sector, targets destroyed, time played and your last 20 runs. Settings cover **Sound**, **Music**, **Reduced motion** and **Graphics quality** (High by default; software renderers are detected and switched to Low automatically).

## 🚀 Getting started

```bash
git clone https://github.com/Itz-Murali/Void-Type.git
cd Void-Type
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build      # production build
npm run preview    # serve the production build locally
```

> **Node 18+** is required. `npm run dev` and `npm run build` first run `scripts/prepare-icons.mjs`, which downloads the logo for the PWA icons and falls back to a generated mark when offline.

### Deploy to Vercel

Push to GitHub and import the repo in Vercel. Nuxt is detected automatically, and no configuration is needed. `vercel.json` only adds cache headers for the service worker and manifest.

## 📱 Install as an app

VOIDTYPE is a PWA. Use the **Install app** button in the menu (Chrome, Edge), or your browser's *Install* / *Add to Home Screen* option. Static assets are cached for offline play; the music stream is never cached.

## 🗂 Project structure

```
app/
├─ app.vue                  # screen routing by game phase
├─ components/
│  ├─ game/GameCanvas.vue   # canvas, resize, mobile keyboard, WebGL fallback
│  └─ ui/                   # MainMenu, GameHUD, LaunchSequence, About, Stats, Settings...
├─ composables/             # useGame, useProfile, useSettings, useAudio, usePwa
├─ game/                    # the Three.js game
│  ├─ GameEngine.ts         # loop, typing, scoring, difficulty, power-ups, events
│  ├─ Spaceship.ts          # player ship (procedural camo shader, plasma engines)
│  ├─ EnemyShips.ts         # five hostile designs
│  ├─ AsteroidManager.ts    # asteroids, guardians, crates, word labels
│  ├─ Environment.ts        # planets, stars, galaxies, black holes, events
│  ├─ LaserManager.ts       # player beams and hostile fire
│  ├─ ImpactFX.ts           # explosions, shield ripple, hit flares
│  ├─ ParticleSystem.ts · Flame.ts · textures.ts · WordManager.ts
├─ data/words.ts            # everyday English word tiers
├─ plugins/pwa.client.ts    # service worker registration
├─ types/ · utils/
public/                     # manifest, service worker, icons
scripts/prepare-icons.mjs   # PWA icon preparation
```

**Design notes:** Three.js is used directly (no wrapper). Lasers, particles and explosions are pooled. Word labels render in a separate pass after post-processing so bloom never blurs them. WPM is `(correct characters / 5) / minutes`.

<details>
<summary><b>🛠 Troubleshooting: "WebGL unavailable"</b></summary>

<br>

The game tries several WebGL configurations before giving up, and the error screen shows the underlying message.

- **Chrome / Chromium (Linux):** Settings → System → enable *Use graphics acceleration when available*. If still blocked, open `chrome://flags`, enable *Override software rendering list* and relaunch. `chrome://gpu` shows why.
- **Firefox:** Settings → General → Performance → untick *Use recommended performance settings* and tick *Use hardware acceleration when available*. If needed, set `webgl.force-enabled` to `true` in `about:config`. `about:support` shows why.
- Update your graphics drivers (Mesa on Linux) or try another browser.

</details>

## 🗺 Roadmap

- Boss encounters with phased words
- Local leaderboard and daily seed
- Custom word packs and more languages
- Ship skins unlocked by best WPM

## 👩‍💻 Creators

<table width="100%">
  <tr>
    <td align="center" width="50%">
      <img src="https://itz-murali-images.vercel.app/api" width="260"><br><br>
      <b>𝐌 𝐔 𝐑 𝚨 𝐋 𝐈 𓂃ִֶָ⋆.˚</b><br><br>
      <a href="https://github.com/Itz-Murali">
        <img src="https://img.shields.io/badge/GitHub-Itz--Murali-black?style=for-the-badge&logo=github">
      </a>
    </td>
    <td align="center" width="50%">
      <img src="https://random-images-anya.vercel.app/anya" width="260"><br><br>
      <b>𝜜ɴყꫝㅤ𓆩💗𓆪</b><br><br>
      <a href="https://github.com/itz-Anya">
        <img src="https://img.shields.io/badge/GitHub-Anya-black?style=for-the-badge&logo=github">
      </a>
    </td>
  </tr>
</table>

## 🤝 Contributing

VOIDTYPE is open source. Issues and pull requests are welcome at [github.com/Itz-Murali/Void-Type](https://github.com/Itz-Murali/Void-Type).

<div align="center">

<br>

**Type. Aim. Survive.**

</div>
