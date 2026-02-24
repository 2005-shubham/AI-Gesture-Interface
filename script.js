import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// --- Scene & Rendering ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 55;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
composer.addPass(bloomPass);

const COUNT = 20000;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(COUNT * 3);
const colors = new Float32Array(COUNT * 3);
const sizes = new Float32Array(COUNT);

const targetPositions = new Float32Array(COUNT * 3);
const targetColors = new Float32Array(COUNT * 3);
const targetSizes = new Float32Array(COUNT);

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

const particles = new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.3, vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
scene.add(particles);

// Technique Functions 
function getRed(i) {
    if (i < COUNT * 0.1) {
        const r = Math.random() * 9;
        const theta = Math.random() * 6.28; const phi = Math.acos(2 * Math.random() - 1);
        return { x: r * Math.sin(phi) * Math.cos(theta), y: r * Math.sin(phi) * Math.sin(theta), z: r * Math.cos(phi), r: 3, g: 0.1, b: 0.1, s: 2.5 };
    } else {
        const armCount = 3; const t = (i / COUNT);
        const angle = t * 15 + ((i % armCount) * (Math.PI * 2 / armCount));
        const radius = 2 + (t * 40);
        return { x: radius * Math.cos(angle), y: radius * Math.sin(angle), z: (Math.random() - 0.5) * (10 * t), r: 0.8, g: 0, b: 0, s: 1.0 };
    }
}

function getVoid(i) {
    if (i < COUNT * 0.15) {
        const angle = Math.random() * Math.PI * 2;
        return { x: 26 * Math.cos(angle), y: 26 * Math.sin(angle), z: (Math.random() - 0.5) * 1, r: 1, g: 1, b: 1, s: 2.5 };
    } else {
        const radius = 30 + Math.random() * 90;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        return { x: radius * Math.sin(phi) * Math.cos(theta), y: radius * Math.sin(phi) * Math.sin(theta), z: radius * Math.cos(phi), r: 0.1, g: 0.6, b: 1.0, s: 0.7 };
    }
}

function getPurple(i) {
    if (Math.random() > 0.8) return { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100, z: (Math.random() - 0.5) * 100, r: 0.5, g: 0.5, b: 0.7, s: 0.8 };
    const r = 20; const theta = Math.random() * Math.PI * 2; const phi = Math.acos(2 * Math.random() - 1);
    return { x: r * Math.sin(phi) * Math.cos(theta), y: r * Math.sin(phi) * Math.sin(theta), z: r * Math.cos(phi), r: 0.6, g: 0.5, b: 1.0, s: 2.5 };
}

function getShrine(i) {
    const total = COUNT;
    if (i < total * 0.3) return { x: (Math.random() - 0.5) * 80, y: -15, z: (Math.random() - 0.5) * 80, r: 0.4, g: 0, b: 0, s: 0.8 };
    else if (i < total * 0.4) {
        const px = ((i % 4) < 2 ? 1 : -1) * 12; const pz = ((i % 4) % 2 == 0 ? 1 : -1) * 8;
        return { x: px + (Math.random() - 0.5) * 2, y: -15 + Math.random() * 30, z: pz + (Math.random() - 0.5) * 2, r: 0.2, g: 0.2, b: 0.2, s: 0.6 };
    } else if (i < total * 0.6) {
        const t = Math.random() * Math.PI * 2; const rad = Math.random() * 30;
        const curve = Math.pow(rad / 30, 2) * 10;
        return { x: rad * Math.cos(t), y: 15 - curve + (Math.random() * 2), z: rad * Math.sin(t) * 0.6, r: 0.6, g: 0, b: 0, s: 0.6 };
    } else return { x: 0, y: 0, z: 0, r: 0, g: 0, b: 0, s: 0 };
}

function getDismantle(i) {
    // Clean background — only subtle dark core glow, CSS slashes do the heavy lifting
    if (i < COUNT * 0.02) {
        const r = Math.random() * 3;
        const theta = Math.random() * 6.28;
        const phi = Math.acos(2 * Math.random() - 1);
        return { x: r * Math.sin(phi) * Math.cos(theta), y: r * Math.sin(phi) * Math.sin(theta), z: r * Math.cos(phi), r: 0.4, g: 0, b: 0, s: 0.6 };
    }
    return { x: 0, y: 0, z: 0, r: 0, g: 0, b: 0, s: 0 };
}

// Dismantle Slash Overlay
let slashInterval = null;
const slashContainer = document.getElementById('slash-container');

function spawnSlash() {
    const count = 3 + Math.floor(Math.random() * 2);
    for (let s = 0; s < count; s++) {
        const slash = document.createElement('div');
        slash.className = 'slash-line';
        if (Math.random() > 0.5) slash.classList.add('thick');
        const angle = -50 + Math.random() * 100;
        const top = Math.random() * 100;
        const width = 35 + Math.random() * 65;
        if (Math.random() > 0.5) {
            slash.classList.add('from-right');
            slash.style.right = `${Math.random() * 30}%`;
        } else {
            slash.style.left = `${Math.random() * 30}%`;
        }
        slash.style.top = `${top}%`;
        slash.style.width = `${width}%`;
        slash.style.transform = `rotate(${angle}deg)`;
        slashContainer.appendChild(slash);
        setTimeout(() => slash.remove(), 550);

        // Spawn a screen crack along each slash
        if (Math.random() > 0.4) {
            const crack = document.createElement('div');
            crack.className = 'screen-crack';
            crack.style.top = `${top}%`;
            crack.style.width = `${width * 0.7}%`;
            crack.style.left = `${Math.random() * 30}%`;
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
    // Red screen flash
    if (Math.random() > 0.3) {
        const flash = document.createElement('div');
        flash.className = 'slash-flash';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 280);
    }
}

// Fire Embers
let emberInterval = null;
function spawnEmbers() {
    const count = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
        const ember = document.createElement('div');
        ember.className = 'fire-ember';
        const size = 2 + Math.random() * 5;
        ember.style.width = `${size}px`;
        ember.style.height = `${size}px`;
        const startX = Math.random() * 100;
        const startY = 50 + Math.random() * 50;
        ember.style.left = `${startX}%`;
        ember.style.top = `${startY}%`;
        // Random warm color: orange to red to yellow
        const hue = Math.random() > 0.3 ? (10 + Math.random() * 30) : (40 + Math.random() * 15);
        const lightness = 50 + Math.random() * 20;
        ember.style.background = `hsl(${hue}, 100%, ${lightness}%)`;
        ember.style.boxShadow = `0 0 ${4 + size}px hsl(${hue}, 100%, 50%), 0 0 ${8 + size * 2}px rgba(255,80,0,0.5)`;
        const driftX = (Math.random() - 0.5) * 80;
        const riseY = -(100 + Math.random() * 200);
        const dur = 1000 + Math.random() * 1500;
        ember.animate([
            { transform: 'translate(0,0) scale(1)', opacity: 0.9 },
            { transform: `translate(${driftX * 0.3}px, ${riseY * 0.3}px) scale(0.9)`, opacity: 1, offset: 0.2 },
            { transform: `translate(${driftX * 0.7}px, ${riseY * 0.7}px) scale(0.5)`, opacity: 0.6, offset: 0.7 },
            { transform: `translate(${driftX}px, ${riseY}px) scale(0.1)`, opacity: 0 }
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

// Hand Tracking
let currentTech = 'neutral';
let shakeIntensity = 0;
const videoElement = document.querySelector('.input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
let glowColor = '#00ffff';

const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.7 });

hands.onResults((results) => {
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    let detected = 'neutral';

    if (results.multiHandLandmarks) {
        results.multiHandLandmarks.forEach((lm) => {
            drawConnectors(canvasCtx, lm, HAND_CONNECTIONS, { color: glowColor, lineWidth: 5 });
            drawLandmarks(canvasCtx, lm, { color: '#fff', lineWidth: 1, radius: 2 });

            const isUp = (t, p) => lm[t].y < lm[p].y;
            const pinch = Math.hypot(lm[8].x - lm[4].x, lm[8].y - lm[4].y);
            const tipsClose = Math.hypot(lm[8].x - lm[12].x, lm[8].y - lm[12].y);

            if (pinch < 0.04) detected = 'purple';
            else if (isUp(8, 6) && isUp(12, 10) && isUp(16, 14) && isUp(20, 18)) detected = 'shrine';
            else if (isUp(8, 6) && isUp(12, 10) && !isUp(16, 14) && !isUp(20, 18) && tipsClose < 0.025) detected = 'dismantle';
            else if (isUp(8, 6) && isUp(12, 10) && !isUp(16, 14)) detected = 'void';
            else if (isUp(8, 6) && !isUp(12, 10)) detected = 'red';
        });
    }
    updateState(detected);
});

// --- Helper Function for Sound ---
function playSound(id) {
    const sound = document.getElementById(id);
    if (sound) {
        sound.currentTime = 0; // Wapas zero se start karega agar dobara gesture kiya
        sound.play().catch(e => console.log("Audio play error:", e));
    }
}

function updateState(tech) {
    if (currentTech === tech) return;
    currentTech = tech;
    stopSlashes();
    const nameEl = document.getElementById('technique-name');
    shakeIntensity = tech === 'dismantle' ? 1.2 : (tech !== 'neutral' ? 0.4 : 0);

    // --- LOGIC WITH SOUND TRIGGERS ---
    if (tech === 'shrine') { 
        playSound('sfx-shrine'); 
        glowColor = '#ff0000'; nameEl.innerText = "Domain Expansion: Malevolent Shrine"; bloomPass.strength = 2.5; nameEl.style.textShadow = "0 0 20px #ff0000, 0 0 40px #ff0000"; nameEl.style.color = "#ffcccc"; 
    }
    else if (tech === 'purple') { 
        playSound('sfx-purple'); 
        glowColor = '#bb00ff'; nameEl.innerText = "Secret Technique: Hollow Purple"; bloomPass.strength = 4.0; nameEl.style.textShadow = "0 0 20px #bb00ff, 0 0 40px #bb00ff"; nameEl.style.color = "#eebbff"; 
    }
    else if (tech === 'void') { 
        playSound('sfx-void'); 
        glowColor = '#00ffff'; nameEl.innerText = "Domain Expansion: Infinite Void"; bloomPass.strength = 2.0; nameEl.style.textShadow = "0 0 20px #00ffff, 0 0 40px #00ffff"; nameEl.style.color = "#ccffff"; 
    }
    else if (tech === 'red') { 
        playSound('sfx-red'); 
        glowColor = '#ff3333'; nameEl.innerText = "Reverse Cursed Technique: Red"; bloomPass.strength = 2.5; nameEl.style.textShadow = "0 0 20px #ff3333, 0 0 40px #ff3333"; nameEl.style.color = "#ffcccc"; 
    }
    else if (tech === 'dismantle') { 
        playSound('sfx-dismantle'); 
        glowColor = '#ff2222'; nameEl.innerText = "Dismantle"; bloomPass.strength = 3.0; nameEl.style.textShadow = "0 0 20px #ff2222, 0 0 40px #ff0000, 0 0 60px #990000"; nameEl.style.color = "#ff8888"; startSlashes(); 
    }
    else { 
        glowColor = '#00ffff'; nameEl.innerText = "Neutral State"; bloomPass.strength = 1.0; nameEl.style.textShadow = "0 0 10px rgba(255, 255, 255, 0.8)"; nameEl.style.color = "#fff"; 
    }

    // --- Particle Logic ---
    for (let i = 0; i < COUNT; i++) {
        let p;
        if (tech === 'neutral') {
            if (i < COUNT * 0.05) {
                const r = 15 + Math.random() * 20; const t = Math.random() * 6.28; const ph = Math.random() * 3.14;
                p = { x: r * Math.sin(ph) * Math.cos(t), y: r * Math.sin(ph) * Math.sin(t), z: r * Math.cos(ph), r: 0.1, g: 0.1, b: 0.2, s: 0.4 };
            } else p = { x: 0, y: 0, z: 0, r: 0, g: 0, b: 0, s: 0 };
        }
        else if (tech === 'red') p = getRed(i);
        else if (tech === 'void') p = getVoid(i);
        else if (tech === 'purple') p = getPurple(i);
        else if (tech === 'shrine') p = getShrine(i);
        else if (tech === 'dismantle') p = getDismantle(i);

        targetPositions[i * 3] = p.x; targetPositions[i * 3 + 1] = p.y; targetPositions[i * 3 + 2] = p.z;
        targetColors[i * 3] = p.r; targetColors[i * 3 + 1] = p.g; targetColors[i * 3 + 2] = p.b;
        targetSizes[i] = p.s;
    }
}

const cameraUtils = new Camera(videoElement, {
    onFrame: async () => {
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        await hands.send({ image: videoElement });
    }, width: 640, height: 480
});
cameraUtils.start();

// Animation
function animate() {
    requestAnimationFrame(animate);

    if (shakeIntensity > 0) {
        renderer.domElement.style.transform = `translate(${(Math.random() - 0.5) * shakeIntensity * 40}px, ${(Math.random() - 0.5) * shakeIntensity * 40}px)`;
    } else {
        renderer.domElement.style.transform = 'translate(0,0)';
    }

    const pos = particles.geometry.attributes.position.array;
    const col = particles.geometry.attributes.color.array;
    const siz = particles.geometry.attributes.size.array;

    for (let i = 0; i < COUNT * 3; i++) {
        pos[i] += (targetPositions[i] - pos[i]) * 0.1;
        col[i] += (targetColors[i] - col[i]) * 0.1;
    }
    for (let i = 0; i < COUNT; i++) siz[i] += (targetSizes[i] - siz[i]) * 0.1;

    particles.geometry.attributes.position.needsUpdate = true;
    particles.geometry.attributes.color.needsUpdate = true;
    particles.geometry.attributes.size.needsUpdate = true;

    // UPDATED ROTATION LOGIC: Locking rotation for Shrine
    if (currentTech === 'red') {
        particles.rotation.z -= 0.1;
    } else if (currentTech === 'purple') {
        particles.rotation.z += 0.2;
        particles.rotation.y += 0.05;
    } else if (currentTech === 'shrine') {
        // FORCE UPRIGHT: Reset and freeze all rotations
        particles.rotation.set(0, 0, 0);
    } else if (currentTech === 'dismantle') {
        // Subtle jitter — reality being sliced
        particles.rotation.set((Math.random() - 0.5) * 0.015, (Math.random() - 0.5) * 0.015, 0);
    } else {
        // Default Neutral rotation
        particles.rotation.y += 0.005;
    }

    composer.render();
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

// Audio Autoplay Logic
const audio = document.getElementById('bg-music');
audio.volume = 0.5;
const overlay = document.getElementById('overlay');

overlay.addEventListener('click', () => {
    // Screen ko pehle hi hata do (Audio ka wait mat karo)
    overlay.style.opacity = '0';
    setTimeout(() => { overlay.style.display = 'none'; }, 1000);

    // Ab audio try karo, agar fail hua toh koi baat nahi
    if (audio) {
        audio.play().then(() => {
            console.log("Audio playing");
        }).catch(e => {
            console.warn("Audio file nahi mili, but game chalu rahega!", e);
        });
    }
});