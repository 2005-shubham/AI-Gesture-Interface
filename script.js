import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

function createSlashTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64; // Lamba aur patla canvas
    const ctx = canvas.getContext('2d');

    // Background clear karo
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Gradient (Kaala - Laal - Kaala)
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, 'rgba(0,0,0,0)'); // Transparent ends
    gradient.addColorStop(0.2, '#4a0000'); // Dark Red
    gradient.addColorStop(0.5, '#ff0000'); // Bright Red center
    gradient.addColorStop(0.8, '#4a0000'); // Dark Red
    gradient.addColorStop(1, 'rgba(0,0,0,0)'); // Transparent ends

    ctx.fillStyle = gradient;

    // Ek sharp, lamba diamond shape draw karo
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2); // Left middle
    ctx.lineTo(canvas.width / 2, 0); // Top middle
    ctx.lineTo(canvas.width, canvas.height / 2); // Right middle
    ctx.lineTo(canvas.width / 2, canvas.height); // Bottom middle
    ctx.closePath();
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

const slashTexture = createSlashTexture(); // Texture generate ho gaya

// --- 1. Scene Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 55;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// Post-Processing (Bloom Effect)
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
composer.addPass(bloomPass);

// --- 2. Particle System Setup ---
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

const particles = new THREE.Points(
    geometry, 
    new THREE.PointsMaterial({ size: 0.3, vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })
);
scene.add(particles);

// --- Slash System Setup (Sukuna) ---
const SLASH_COUNT = 150; // 150 cuts kaafi rahenge
// Geometry: Lamba plane (Width 8, Height 0.5)
const slashGeometry = new THREE.PlaneGeometry(8, 0.5); 
const slashMaterial = new THREE.MeshBasicMaterial({
    map: slashTexture, // Upar banaya hua texture use kar rahe hain
    transparent: true,
    side: THREE.DoubleSide, // Dono taraf se dikhe
    blending: THREE.AdditiveBlending, // Glow ke liye zaroori hai
    depthWrite: false,
    opacity: 0.9
});

// InstancedMesh: Ek hi geometry ko 150 baar efficiently draw karega
const slashMesh = new THREE.InstancedMesh(slashGeometry, slashMaterial, SLASH_COUNT);
scene.add(slashMesh);
slashMesh.visible = false; // Shuru mein chhupa do

// Dummy object calculation ke liye
const dummy = new THREE.Object3D();

// --- 3. Mathematical Technique Functions ---
function getRed(i) {
    if(i < COUNT * 0.1) {
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
        return { x: 26 * Math.cos(angle), y: 26 * Math.sin(angle), z: (Math.random()-0.5) * 1, r: 1, g: 1, b: 1, s: 2.5 };
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
    if (i < total * 0.3) return { x: (Math.random()-0.5)*80, y: -15, z: (Math.random()-0.5)*80, r: 0.4, g: 0, b: 0, s: 0.8 };
    else if (i < total * 0.4) {
        const px = ((i%4)<2?1:-1)*12; const pz = ((i%4)%2==0?1:-1)*8;
        return { x: px+(Math.random()-0.5)*2, y: -15+Math.random()*30, z: pz+(Math.random()-0.5)*2, r: 0.2, g: 0.2, b: 0.2, s: 0.6 };
    } else if (i < total * 0.6) {
        const t = Math.random() * Math.PI * 2; const rad = Math.random() * 30;
        const curve = Math.pow(rad/30, 2) * 10; 
        return { x: rad*Math.cos(t), y: 15 - curve + (Math.random()*2), z: rad*Math.sin(t)*0.6, r: 0.6, g: 0, b: 0, s: 0.6 };
    } else return { x: 0, y: 0, z: 0, r: 0, g: 0, b: 0, s: 0 };
}

function setSlashes() {
    for (let i = 0; i < SLASH_COUNT; i++) {
        // 1. Random Position (Ek sphere ke andar)
        const r = 25 + Math.random() * 25; // Center se 25-50 units door
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        dummy.position.set(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
        );

        // 2. Random Rotation (Taaki sab alag disha mein katein)
        dummy.rotation.set(
            Math.random() * Math.PI * 2, // X rotation
            Math.random() * Math.PI * 2, // Y rotation
            Math.random() * Math.PI * 0.5 // Z rotation (thoda kam)
        );

        // 3. Random Scale (Kuch chote, kuch bade)
        const scaleVar = 0.5 + Math.random() * 1.2;
        // Z scale ko 1 hi rakho kyunki ye plane hai
        dummy.scale.set(scaleVar, scaleVar * (Math.random()*0.5 + 0.8), 1); 

        // Apply changes
        dummy.updateMatrix();
        slashMesh.setMatrixAt(i, dummy.matrix);
    }
    // Three.js ko batao ki positions update ho gayi hain
    slashMesh.instanceMatrix.needsUpdate = true;
}

// --- 4. Hand Tracking Logic ---
let currentTech = 'neutral';
let shakeIntensity = 0;
const videoElement = document.querySelector('.input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
let glowColor = '#00ffff';

// Initialize MediaPipe Hands
const hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.7 });

hands.onResults((results) => {
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    let detected = 'neutral';

    if (results.multiHandLandmarks) {
        results.multiHandLandmarks.forEach((lm) => {
            drawConnectors(canvasCtx, lm, HAND_CONNECTIONS, {color: glowColor, lineWidth: 5});
            drawLandmarks(canvasCtx, lm, {color: '#fff', lineWidth: 1, radius: 2});

            const isUp = (t, p) => lm[t].y < lm[p].y;
            const pinch = Math.hypot(lm[8].x - lm[4].x, lm[8].y - lm[4].y);
            
            if (pinch < 0.04) detected = 'purple';
            else if (isUp(8,6) && isUp(12,10) && isUp(16,14) && isUp(20,18)) detected = 'shrine';
            else if (isUp(8,6) && isUp(20,18) && !isUp(12,10) && !isUp(16,14)) detected = 'slash'; 
            else if (isUp(8,6) && isUp(12,10) && !isUp(16,14)) detected = 'void';
            else if (isUp(8,6) && !isUp(12,10)) detected = 'red';
        });
    }
    updateState(detected);
});

// --- UPDATE STATE FUNCTION ---

function updateState(tech) {
    if(currentTech === tech) return;
    currentTech = tech;
    const nameEl = document.getElementById('technique-name');
    shakeIntensity = tech !== 'neutral' ? 0.4 : 0;

    // === TOGGLE SYSTEM (NEW) ===
    // Agar 'slash' hai, toh purane particles chupao aur naye slashes dikhao
    if (tech === 'slash') {
        particles.visible = false; // Hide Gojo's dots
        slashMesh.visible = true;  // Show Sukuna's slashes
        setSlashes(); // Slashes ki position reset karo
        
        // Slash specific settings
        glowColor = '#ff0000'; 
        nameEl.innerText = "Cursed Technique: Dismantle"; 
        bloomPass.strength = 3.5; // Zyada glow
    } 
    // Agar 'slash' NAHI hai, toh wapas normal mode
    else {
        particles.visible = true;  // Show dots
        slashMesh.visible = false; // Hide slashes
        
        // Baaki techniques ke settings
        if(tech === 'shrine') { glowColor = '#ff0000'; nameEl.innerText = "Domain Expansion: Malevolent Shrine"; bloomPass.strength = 2.5; }
        else if(tech === 'purple') { glowColor = '#bb00ff'; nameEl.innerText = "Secret Technique: Hollow Purple"; bloomPass.strength = 4.0; }
        else if(tech === 'void') { glowColor = '#00ffff'; nameEl.innerText = "Domain Expansion: Infinite Void"; bloomPass.strength = 2.0; }
        else if(tech === 'red') { glowColor = '#ff3333'; nameEl.innerText = "Reverse Cursed Technique: Red"; bloomPass.strength = 2.5; }
        else { glowColor = '#00ffff'; nameEl.innerText = "Neutral State"; bloomPass.strength = 1.0; }
    }

    // === PARTICLE LOOP UPDATE ===
    // Ye loop SIRF tab chalna chahiye jab hum Slash mode mein NAHI hain
    if (tech !== 'slash') {
        for(let i=0; i<COUNT; i++) {
            let p;
            if(tech === 'neutral') {
                if(i < COUNT * 0.05) {
                    const r = 15 + Math.random()*20; const t = Math.random()*6.28; const ph = Math.random()*3.14;
                    p = { x: r*Math.sin(ph)*Math.cos(t), y: r*Math.sin(ph)*Math.sin(t), z: r*Math.cos(ph), r: 0.1, g: 0.1, b: 0.2, s: 0.4 };
                } else p = { x:0, y:0, z:0, r:0, g:0, b:0, s:0 };
            }
            else if(tech === 'red') p = getRed(i);
            else if(tech === 'void') p = getVoid(i);
            else if(tech === 'purple') p = getPurple(i);
            else if(tech === 'shrine') p = getShrine(i);
            // Note: Yahan 'slash' ka if-else hata diya hai maine
            
            targetPositions[i*3] = p.x; targetPositions[i*3+1] = p.y; targetPositions[i*3+2] = p.z;
            targetColors[i*3] = p.r; targetColors[i*3+1] = p.g; targetColors[i*3+2] = p.b;
            targetSizes[i] = p.s;
        }
    }
}

// Start Camera
const cameraUtils = new Camera(videoElement, {
    onFrame: async () => {
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        await hands.send({image: videoElement});
    }, width: 640, height: 480
});
cameraUtils.start();

// --- 5. Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    
    // Screen Shake
    if (shakeIntensity > 0) {
        renderer.domElement.style.transform = `translate(${(Math.random()-0.5)*shakeIntensity*40}px, ${(Math.random()-0.5)*shakeIntensity*40}px)`;
    } else {
        renderer.domElement.style.transform = 'translate(0,0)';
    }

    const pos = particles.geometry.attributes.position.array;
    const col = particles.geometry.attributes.color.array;
    const siz = particles.geometry.attributes.size.array;

    // Interpolation (Smooth Transition)
    for(let i=0; i<COUNT*3; i++) {
        pos[i] += (targetPositions[i] - pos[i]) * 0.1;
        col[i] += (targetColors[i] - col[i]) * 0.1;
    }
    for(let i=0; i<COUNT; i++) siz[i] += (targetSizes[i] - siz[i]) * 0.1;

    particles.geometry.attributes.position.needsUpdate = true;
    particles.geometry.attributes.color.needsUpdate = true;
    particles.geometry.attributes.size.needsUpdate = true;
    
    // Rotation Logic
    if(currentTech === 'red') {
        particles.rotation.z -= 0.1;
    } else if (currentTech === 'purple') {
        particles.rotation.z += 0.2; 
        particles.rotation.y += 0.05;
    } else if (currentTech === 'shrine') {
        particles.rotation.set(0, 0, 0); 
    } else if (currentTech === 'slash') 
    {   slashMesh.rotation.y += 0.001; 
        slashMesh.rotation.x += 0.0005;
    } else {
        particles.rotation.y += 0.005;
    }

    composer.render();
}
animate();

// Handle Window Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});