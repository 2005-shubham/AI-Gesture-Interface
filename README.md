# Jujutsu Kaisen: Cursed Technique Visualizer

A web-based interactive experience using **MediaPipe Hand Tracking** and **Three.js** to visualize Cursed Techniques from Jujutsu Kaisen in real-time.

![Demo GIF](https://github.com/user-attachments/assets/8ad2b871-02c0-4b97-95f3-34682e745be0)

> **Status:** Active Development
> **Tech Stack:** HTML5, CSS3, JavaScript (ES6 Modules), Three.js, MediaPipe Hands

---

## 🎮 Single-Hand Gestures

| Gesture | Technique | Character | Visual Effect |
| :--- | :--- | :--- | :--- |
| ☝ **Index finger UP** | Reverse Cursed Technique: Red | Satoru Gojo | Repulsive red energy spiral |
| ✌ **Index + Middle UP** | Domain Expansion: Infinite Void | Satoru Gojo | Blue void sphere + white flash |
| 👌 **Index + Thumb Pinch** | Secret Technique: Hollow Purple | Satoru Gojo | Purple matter destruction orb |
| 🤘 **Index + Pinky UP** (Rock Sign) | Dismantle | Ryomen Sukuna | Flying red slashes + fire embers |
| 🖐 **All Fingers Open** | Domain Expansion: Malevolent Shrine | Ryomen Sukuna | Red chaotic particle storm |

## ⚡ Two-Hand Combo

| Left Hand | Right Hand | Result |
| :--- | :--- | :--- |
| ☝ Red (index up) | ✌ Void (peace sign) | ✦ **Hollow Purple** — mimics the anime: combine Red & Blue to form Purple |

---

## 🚀 Setup & Run Locally

Since this project uses ES6 Modules, you **cannot** open `index.html` directly. Serve it locally:

1. **Clone the repository**
   ```bash
   git clone https://github.com/2005-shubham/AI-Gesture-Interface.git
   cd AI-Gesture-Interface
   ```

2. **Serve it locally** (any method works)
   ```bash
   # Node.js
   npx serve

   # Python
   python -m http.server

   # VS Code: use the "Live Server" extension
   ```

3. **Open in browser** — navigate to `http://localhost:3000` (or the port shown in your terminal).

> ⚠️ **A webcam is required.** If no camera is detected, an error overlay will appear with instructions.

---

## 📁 Project Structure

```
AI-Gesture-Interface/
├── index.html              # Main HTML, gesture guide UI, controls
├── style.css               # All styles (responsive, mobile-friendly)
├── script.js               # Three.js, MediaPipe, state management
├── jujutsu_kaisen_op4.mp3  # Background music
├── void.mp3                # Infinite Void SFX
├── purple.mp3              # Hollow Purple SFX
├── shrine.mp3              # Malevolent Shrine SFX
├── dismantle.mp3           # Dismantle SFX
└── red.mp3                 # Red SFX
```

---

## ✨ Features

- **Real-time hand tracking** via MediaPipe (up to 2 hands simultaneously)
- **Two-hand combo system** — Red + Void = Hollow Purple
- **Gesture debounce** — 3-frame buffer prevents flickering on transitions
- **Smooth bloom transitions** — lerped bloom strength (no hard-cuts between techniques)
- **Void flash** — full-screen white blind on Infinite Void activation
- **Technique history strip** — fading log of last 5 activated techniques
- **Volume control** — adjustable music slider
- **Screenshot button** — saves current frame as PNG
- **Webcam error overlay** — clear message if camera is unavailable
- **Mobile responsive** — layout adapts for phones and tablets
- **In-app gesture guide** — collapsible reference panel (top-right corner)