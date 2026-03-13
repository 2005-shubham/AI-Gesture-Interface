import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// =============================================
// SCENE & RENDERER
// =============================================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 55;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
// preserveDrawingBuffer: true is required for screenshot capture via toDataURL()
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5, 0.4, 0.85
);
composer.addPass(bloomPass);

// Bloom lerp target — avoids hard-cut between technique transitions
let targetBloom = 1.5;

// =============================================
// PARTICLE SYSTEM
// =============================================
const COUNT = 15000; // Reduced from 20000 for better mid-range device perf

const geometry        = new THREE.BufferGeometry();
const positions       = new Float32Array(COUNT * 3);
const colors          = new Float32Array(COUNT * 3);
const sizes           = new Float32Array(COUNT);
const targetPositions = new Float32Array(COUNT * 3);
const targetColors    = new Float32Array(COUNT * 3);
const targetSizes     = new Float32Array(COUNT);

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
geometry.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

const particles = new THREE.Points(geometry, new THREE.PointsMaterial({
    size: 0.3,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
}));
scene.add(particles);

// =============================================
// TECHNIQUE CONFIG — data-driven
// =============================================
const TECHNIQUES = {
    neutral:  { sound: null,           glow: '#00ffff', label: 'CURSED ENERGY',                       bloom: 1.5, color: '#ffffff', shake: 0   },
    red:      { sound: 'sfx-red',      glow: '#ff3333', label: 'Reverse Cursed Technique: Red',       bloom: 2.5, color: '#ffcccc', shake: 0.4 },
    void:     { sound: 'sfx-void',     glow: '#00ffff', label: 'Domain Expansion: Infinite Void',     bloom: 2.0, color: '#ccffff', shake: 0.4 },
    purple:   { sound: 'sfx-purple',   glow: '#bb00ff', label: 'Secret Technique: Hollow Purple',     bloom: 4.0, color: '#eebbff', shake: 0.4 },
    shrine:   { sound: 'sfx-shrine',   glow: '#ff0000', label: 'Domain Expansion: Malevolent Shrine', bloom: 2.5, color: '#ffcccc', shake: 0.4 },
    dismantle:{ sound: 'sfx-dismantle',glow: '#ff2222', label: 'Dismantle',                           bloom: 3.0, color: '#ff8888', shake: 1.2 }
};

const TECH_SHADOWS = {
    neutral:   '0 0 10px rgba(255,255,255,0.8)',
    red:       '0 0 20px #ff3333, 0 0 40px #ff3333',
    void:      '0 0 20px #00ffff, 0 0 40px #00ffff',
    purple:    '0 0 20px #bb00ff, 0 0 40px #bb00ff',
    shrine:    '0 0 20px #ff0000, 0 0 40px #ff0000',
    dismantle: '0 0 20px #ff2222, 0 0 40px #ff0000, 0 0 60px #990000'
};

// =============================================
// PARTICLE SHAPE FUNCTIONS
// =============================================
function getRed(i) {
    if (i < COUNT * 0.1) {
        const r = Math.random() * 9;
        const theta = Math.random() * 6.28;
        const phi = Math.acos(2 * Math.random() - 1);
        return { x: r * Math.sin(phi) * Math.cos(theta), y: r * Math.sin(phi) * Math.sin(theta), z: r * Math.cos(phi), r: 3, g: 0.1, b: 0.1, s: 2.5 };
    }
    const armCount = 3;
    const t = i / COUNT;
    const angle = t * 15 + ((i % armCount) * (Math.PI * 2 / armCount));
    const radius = 2 + t * 40;
    return { x: radius * Math.cos(angle), y: radius * Math.sin(angle), z: (Math.random() - 0.5) * (10 * t), r: 0.8, g: 0, b: 0, s: 1.0 };
}
 
function getVoid(i) {
    if (i < COUNT * 0.15) {
        const angle = Math.random() * Math.PI * 2;
        return { x: 26 * Math.cos(angle), y: 26 * Math.sin(angle), z: (Math.random() - 0.5) * 1, r: 1, g: 1, b: 1, s: 2.5 };
    }
    const radius = 30 + Math.random() * 90;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    return {
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.sin(phi) * Math.sin(theta),
        z: radius * Math.cos(phi),
        r: 0.1, g: 0.6, b: 1.0, s: 0.7
    };
}

function getPurple(i) {
    if (Math.random() > 0.8) {
        return { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100, z: (Math.random() - 0.5) * 100, r: 0.5, g: 0.5, b: 0.7, s: 0.8 };
    }
    const r = 20;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    return { x: r * Math.sin(phi) * Math.cos(theta), y: r * Math.sin(phi) * Math.sin(theta), z: r * Math.cos(phi), r: 0.6, g: 0.5, b: 1.0, s: 2.5 };
}

function getShrine(i) {
    if (i < COUNT * 0.3) {
        return { x: (Math.random() - 0.5) * 80, y: -15, z: (Math.random() - 0.5) * 80, r: 0.4, g: 0, b: 0, s: 0.8 };
    } else if (i < COUNT * 0.4) {
        const px = ((i % 4) < 2 ? 1 : -1) * 12;
        const pz = ((i % 4) % 2 === 0 ? 1 : -1) * 8;
        return { x: px + (Math.random() - 0.5) * 2, y: -15 + Math.random() * 30, z: pz + (Math.random() - 0.5) * 2, r: 0.2, g: 0.2, b: 0.2, s: 0.6 };
    } else if (i < COUNT * 0.6) {
        const t = Math.random() * Math.PI * 2;
        const rad = Math.random() * 30;
        const curve = Math.pow(rad / 30, 2) * 10;
        return { x: rad * Math.cos(t), y: 15 - curve + Math.random() * 2, z: rad * Math.sin(t) * 0.6, r: 0.6, g: 0, b: 0, s: 0.6 };
    }
    return { x: 0, y: 0, z: 0, r: 0, g: 0, b: 0, s: 0 };
}

function getDismantle(i) {
    if (i < COUNT * 0.02) {
        const r = Math.random() * 3;
        const theta = Math.random() * 6.28;
        const phi = Math.acos(2 * Math.random() - 1);
        return { x: r * Math.sin(phi) * Math.cos(theta), y: r * Math.sin(phi) * Math.sin(theta), z: r * Math.cos(phi), r: 0.4, g: 0, b: 0, s: 0.6 };
    }
    return { x: 0, y: 0, z: 0, r: 0, g: 0, b: 0, s: 0 };
}

const PARTICLE_FN = {
    red: getRed,
    void: getVoid,
    purple: getPurple,
    shrine: getShrine,
    dismantle: getDismantle
};

// =============================================
// DISMANTLE: SLASH & EMBER EFFECTS
// =============================================
let slashInterval = null;
let emberInterval = null;
const slashContainer = document.getElementById('slash-container');

function spawnSlash() {
    const count = 3 + Math.floor(Math.random() * 2);
    for (let s = 0; s < count; s++) {
        const slash = document.createElement('div');
        slash.className = 'slash-line';
        if (Math.random() > 0.5) slash.classList.add('thick');
        const angle = -50 + Math.random() * 100;
        const top   = Math.random() * 100;
        const width = 35 + Math.random() * 65;
        if (Math.random() > 0.5) {
            slash.classList.add('from-right');
            slash.style.right = `${Math.random() * 30}%`;
        } else {
            slash.style.left = `${Math.random() * 30}%`;
        }
        slash.style.top       = `${top}%`;
        slash.style.width     = `${width}%`;
        slash.style.transform = `rotate(${angle}deg)`;
        slashContainer.appendChild(slash);
        setTimeout(() => slash.remove(), 550);

        if (Math.random() > 0.4) {
            const crack = document.createElement('div');
            crack.className = 'screen-crack';
            crack.style.top       = `${top}%`;
            crack.style.width     = `${width * 0.7}%`;
            crack.style.left      = `${Math.random() * 30}%`;
            crack.style.transform = `rotate(${angle + (Math.random() - 0.5) * 20}deg)`;
            crack.animate([
                { opacity: 0 },
                { opacity: 1, offset: 0.1 },
                { opacity: 0.8, offset: 0.6 },
                { opacity: 0 }
            ], { duration: 1200 + Math.random() * 800, fill: 'forwards' });
            document.body.appendChild(crack);
            setTimeout(() => crack.remove(), 2100);
        }
    }
    if (Math.random() > 0.3) {
        const flash = document.createElement('div');
        flash.className = 'slash-flash';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 280);
    }
}

function spawnEmbers() {
    const count = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
        const ember = document.createElement('div');
        ember.className = 'fire-ember';
        const size  = 2 + Math.random() * 5;
        ember.style.width  = `${size}px`;
        ember.style.height = `${size}px`;
        ember.style.left   = `${Math.random() * 100}%`;
        ember.style.top    = `${50 + Math.random() * 50}%`;
        const hue       = Math.random() > 0.3 ? (10 + Math.random() * 30) : (40 + Math.random() * 15);
        const lightness = 50 + Math.random() * 20;
        ember.style.background = `hsl(${hue}, 100%, ${lightness}%)`;
        ember.style.boxShadow  = `0 0 ${4 + size}px hsl(${hue}, 100%, 50%), 0 0 ${8 + size * 2}px rgba(255,80,0,0.5)`;
        const driftX = (Math.random() - 0.5) * 80;
        const riseY  = -(100 + Math.random() * 200);
        const dur    = 1000 + Math.random() * 1500;
        ember.animate([
            { transform: 'translate(0,0) scale(1)', opacity: 0.9 },
            { transform: `translate(${driftX * 0.3}px,${riseY * 0.3}px) scale(0.9)`, opacity: 1, offset: 0.2 },
            { transform: `translate(${driftX * 0.7}px,${riseY * 0.7}px) scale(0.5)`, opacity: 0.6, offset: 0.7 },
            { transform: `translate(${driftX}px,${riseY}px) scale(0.1)`, opacity: 0 }
        ], { duration: dur, fill: 'forwards' });
        document.body.appendChild(ember);
        setTimeout(() => ember.remove(), dur + 50);
    }
}

function startSlashes() {
    if (slashInterval) return;
    slashInterval = setInterval(spawnSlash, 45);
    emberInterval = setInterval(spawnEmbers, 150);
}

function stopSlashes() {
    if (slashInterval) { clearInterval(slashInterval); slashInterval = null; }
    if (emberInterval) { clearInterval(emberInterval); emberInterval = null; }
    document.querySelectorAll('.screen-crack, .fire-ember').forEach(e => e.remove());
}

// =============================================
// VOID FLASH EFFECT
// Triggers a white screen blind on Infinite Void activation
// =============================================
const voidFlash = document.getElementById('void-flash');

function triggerVoidFlash() {
    voidFlash.classList.remove('active');
    // Force reflow to allow re-triggering
    void voidFlash.offsetWidth;
    voidFlash.classList.add('active');
    voidFlash.addEventListener('animationend', () => {
        voidFlash.classList.remove('active');
    }, { once: true });
}

// =============================================
// TECHNIQUE HISTORY STRIP
// Shows last 5 techniques as fading badges
// =============================================
const HISTORY_MAX  = 5;
const historyItems = document.getElementById('history-items');
const historyLog   = [];

const BADGE_CLASS = {
    red: 'badge-red', void: 'badge-void', purple: 'badge-purple',
    shrine: 'badge-shrine', dismantle: 'badge-dismantle', neutral: 'badge-neutral'
};

const BADGE_LABEL = {
    red: 'RED', void: 'VOID', purple: 'PURPLE',
    shrine: 'SHRINE', dismantle: 'DISMANTLE', neutral: '—'
};

function addToHistory(tech) {
    if (tech === 'neutral') return;

    historyLog.unshift(tech);
    if (historyLog.length > HISTORY_MAX) historyLog.pop();

    // Rebuild badge list
    historyItems.innerHTML = '';
    historyLog.forEach((t, idx) => {
        const badge = document.createElement('span');
        badge.className = `history-badge ${BADGE_CLASS[t] || ''}`;
        if (idx > 0) badge.classList.add('fading');
        badge.textContent = BADGE_LABEL[t] || t.toUpperCase();
        historyItems.appendChild(badge);
    });
}

// =============================================
// STATE MANAGEMENT
// =============================================
let currentTech    = 'neutral';
let shakeIntensity = 0;
let glowColor      = '#00ffff';

function playSound(id) {
    if (!id) return;
    const sound = document.getElementById(id);
    if (!sound) return;
    sound.currentTime = 0;
    sound.play().catch(e => console.warn('Audio play error:', e));
}

function updateState(tech) {
    if (currentTech === tech) return;

    const prev = currentTech;
    currentTech = tech;
    stopSlashes();

    const cfg    = TECHNIQUES[tech];
    const nameEl = document.getElementById('technique-name');

    playSound(cfg.sound);
    glowColor          = cfg.glow;
    shakeIntensity     = cfg.shake;
    nameEl.innerText   = cfg.label;
    nameEl.style.color = cfg.color;
    nameEl.style.textShadow = TECH_SHADOWS[tech];
    targetBloom = cfg.bloom; // Lerped in animate() for smooth transition

    // Special per-technique side effects
    if (tech === 'dismantle') startSlashes();
    if (tech === 'void' && prev !== 'void') triggerVoidFlash();

    // Log to history strip
    addToHistory(tech);

    // Update particle targets
    for (let i = 0; i < COUNT; i++) {
        let p;
        if (tech === 'neutral') {
            if (i < COUNT * 0.05) {
                const r  = 15 + Math.random() * 20;
                const t  = Math.random() * 6.28;
                const ph = Math.random() * 3.14;
                p = { x: r * Math.sin(ph) * Math.cos(t), y: r * Math.sin(ph) * Math.sin(t), z: r * Math.cos(ph), r: 0.1, g: 0.1, b: 0.2, s: 0.4 };
            } else {
                p = { x: 0, y: 0, z: 0, r: 0, g: 0, b: 0, s: 0 };
            }
        } else {
            p = PARTICLE_FN[tech](i);
        }
        targetPositions[i * 3]     = p.x;
        targetPositions[i * 3 + 1] = p.y;
        targetPositions[i * 3 + 2] = p.z;
        targetColors[i * 3]        = p.r;
        targetColors[i * 3 + 1]    = p.g;
        targetColors[i * 3 + 2]    = p.b;
        targetSizes[i]             = p.s;
    }
}

// =============================================
// HAND TRACKING — MediaPipe
// =============================================
const videoElement  = document.querySelector('.input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx     = canvasElement.getContext('2d');

// Set canvas dimensions once on video load — avoids layout reflow every frame
videoElement.addEventListener('loadedmetadata', () => {
    canvasElement.width  = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
});

// Gesture debounce buffer — fires only after N consecutive identical frames
const DEBOUNCE_FRAMES = 3;
const gestureBuffer   = [];

// Per-hand gesture tracking for two-hand combo detection
// MediaPipe reports hand label as 'Left' or 'Right' (from camera's perspective)
let leftHandGesture  = 'neutral';
let rightHandGesture = 'neutral';

function classifyGesture(lm) {
    const isUp  = (tip, pip) => lm[tip].y < lm[pip].y;
    const pinch = Math.hypot(lm[8].x - lm[4].x, lm[8].y - lm[4].y);

    // Priority: pinch → shrine → dismantle (rock) → void (peace) → red (index only)
    if (pinch < 0.04)                                                                  return 'purple';
    if (isUp(8, 6) && isUp(12, 10) && isUp(16, 14) && isUp(20, 18))                    return 'shrine';
    if (isUp(8, 6) && !isUp(12, 10) && !isUp(16, 14) && isUp(20, 18))                  return 'dismantle'; // Rock sign
    if (isUp(8, 6) && isUp(12, 10) && !isUp(16, 14) && !isUp(20, 18))                  return 'void';      // Peace sign
    if (isUp(8, 6) && !isUp(12, 10) && !isUp(20, 18))                                  return 'red';       // Index only
    return 'neutral';
}

function resolveCombo() {
    // Two-hand combo: Left Red + Right Void = Hollow Purple
    if (leftHandGesture === 'red' && rightHandGesture === 'void') return 'purple';
    // Single hand: use whichever isn't neutral (left takes priority if both active)
    if (leftHandGesture !== 'neutral') return leftHandGesture;
    if (rightHandGesture !== 'neutral') return rightHandGesture;
    return 'neutral';
}

const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.7 });

hands.onResults((results) => {
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Reset per-hand states each frame
    leftHandGesture  = 'neutral';
    rightHandGesture = 'neutral';

    if (results.multiHandLandmarks && results.multiHandedness) {
        results.multiHandLandmarks.forEach((lm, idx) => {
            drawConnectors(canvasCtx, lm, HAND_CONNECTIONS, { color: glowColor, lineWidth: 5 });
            drawLandmarks(canvasCtx, lm, { color: '#fff', lineWidth: 1, radius: 2 });

            const gesture = classifyGesture(lm);

            // MediaPipe labels are mirrored (camera flips Left/Right)
            const label = results.multiHandedness[idx]?.label;
            if (label === 'Left')  rightHandGesture = gesture; // camera mirrors, so swap
            if (label === 'Right') leftHandGesture  = gesture;
        });
    }

    const detected = resolveCombo();

    // Debounce: only fire if gesture is stable across N consecutive frames
    gestureBuffer.push(detected);
    if (gestureBuffer.length > DEBOUNCE_FRAMES) gestureBuffer.shift();
    if (gestureBuffer.length === DEBOUNCE_FRAMES && gestureBuffer.every(g => g === detected)) {
        updateState(detected);
    }
});

// =============================================
// WEBCAM INIT WITH ERROR HANDLING
// =============================================
const cameraUtils = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480
});

cameraUtils.start().catch((err) => {
    console.error('Webcam initialization failed:', err);
    const errorOverlay = document.getElementById('webcam-error');
    if (errorOverlay) errorOverlay.style.display = 'flex';
});

// =============================================
// ANIMATION LOOP
// =============================================
function animate() {
    requestAnimationFrame(animate);

    // Screen shake
    if (shakeIntensity > 0) {
        renderer.domElement.style.transform =
            `translate(${(Math.random() - 0.5) * shakeIntensity * 40}px, ${(Math.random() - 0.5) * shakeIntensity * 40}px)`;
    } else {
        renderer.domElement.style.transform = 'translate(0,0)';
    }

    // Smooth bloom transition — no more hard-cuts
    bloomPass.strength += (targetBloom - bloomPass.strength) * 0.06;

    // Lerp particles toward targets
    const pos = particles.geometry.attributes.position.array;
    const col = particles.geometry.attributes.color.array;
    const siz = particles.geometry.attributes.size.array;

    for (let i = 0; i < COUNT * 3; i++) {
        pos[i] += (targetPositions[i] - pos[i]) * 0.1;
        col[i] += (targetColors[i]    - col[i]) * 0.1;
    }
    for (let i = 0; i < COUNT; i++) {
        siz[i] += (targetSizes[i] - siz[i]) * 0.1;
    }

    particles.geometry.attributes.position.needsUpdate = true;
    particles.geometry.attributes.color.needsUpdate    = true;
    particles.geometry.attributes.size.needsUpdate     = true;

    // Per-technique rotation
    if (currentTech === 'red') {
        particles.rotation.z -= 0.1;
    } else if (currentTech === 'purple') {
        particles.rotation.z += 0.2;
        particles.rotation.y += 0.05;
    } else if (currentTech === 'shrine') {
        particles.rotation.set(0, 0, 0);
    } else if (currentTech === 'dismantle') {
        particles.rotation.set(
            (Math.random() - 0.5) * 0.015,
            (Math.random() - 0.5) * 0.015,
            0
        );
    } else {
        particles.rotation.y += 0.005;
    }

    composer.render();
}
animate();

// =============================================
// RESIZE
// =============================================
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

// =============================================
// AUDIO AUTOPLAY
// =============================================
const audio   = document.getElementById('bg-music');
const overlay = document.getElementById('overlay');
audio.volume  = 0.5;

overlay.addEventListener('click', () => {
    overlay.style.opacity = '0';
    setTimeout(() => { overlay.style.display = 'none'; }, 1000);
    audio.play()
        .then(() => console.log('Background music playing.'))
        .catch(e => console.warn('Audio could not be played:', e));
});

// =============================================
// VOLUME CONTROL
// =============================================
const volumeSlider = document.getElementById('volume-slider');
volumeSlider.addEventListener('input', () => {
    audio.volume = parseFloat(volumeSlider.value);
});

// =============================================
// SCREENSHOT
// =============================================
const screenshotBtn = document.getElementById('screenshot-btn');
screenshotBtn.addEventListener('click', () => {
    // Render one frame first to ensure the buffer is fresh
    composer.render();

    const dataURL = renderer.domElement.toDataURL('image/png');
    const link    = document.createElement('a');
    link.href     = dataURL;
    link.download = `jjk-cursed-technique-${currentTech}-${Date.now()}.png`;
    link.click();

    // Brief flash feedback on the button
    screenshotBtn.classList.add('flash');
    setTimeout(() => screenshotBtn.classList.remove('flash'), 200);
});

// =============================================
// GESTURE GUIDE TOGGLE
// =============================================
const guideToggle = document.getElementById('guide-toggle');
const guideTable  = document.getElementById('guide-table');

guideToggle.addEventListener('click', () => {
    const isOpen = guideTable.classList.toggle('open');
    document.getElementById('guide-icon').textContent = isOpen ? '✕' : '☰';
});