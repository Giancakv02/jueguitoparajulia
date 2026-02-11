const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
let gameState = 'START'; // START, PLAYING, GAMEOVER
let frames = 0;
let score = 0;
let items = []; // For eggs
let speed = 5;

// Sound Effects (Web Audio API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'jump') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(500, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'collect') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'gameover') {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
    }
}

// Responsive Canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Input Handling
let jumps = 0;
const MAX_JUMPS = 2;

function handleInput() {
    if (gameState === 'START') {
        // Do nothing here, let the button start the game
    } else if (gameState === 'PLAYING') {
        if (jumps < MAX_JUMPS) {
            yoshi.dy = -yoshi.jumpPower;
            yoshi.grounded = false;
            jumps++;
            playSound('jump');
        }
    } else if (gameState === 'GAMEOVER') {
        // handled by button
    }
}

// Global Touch & Click support for jumping
window.addEventListener('touchstart', (e) => {
    // Check if target is a button to avoid double firing
    if (e.target.tagName !== 'BUTTON') {
        handleInput();
    }
}, { passive: false });

window.addEventListener('mousedown', (e) => {
    if (e.target.tagName !== 'BUTTON') {
        handleInput();
    }
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        handleInput();
    }
});

// Explicit Button Listeners
const startBtn = document.getElementById('start-btn');
startBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    console.log('Start Click');
    startGame();
});
startBtn.addEventListener('touchstart', (e) => {
    e.stopPropagation();
    console.log('Start Touch');
    startGame();
}, { passive: false });

const restartBtn = document.getElementById('restart-btn');
restartBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    resetGame();
});
restartBtn.addEventListener('touchstart', (e) => {
    e.stopPropagation();
    resetGame();
}, { passive: false });


// Game Objects
const yoshi = {
    x: 50,
    y: 0,
    width: 50,
    height: 60,
    dy: 0,
    jumpPower: 15,
    gravity: 0.8,
    grounded: false,
    draw: function () {
        ctx.save();
        // Body
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.ellipse(this.x + 25, this.y + 35, 20, 25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.arc(this.x + 35, this.y + 15, 20, 0, Math.PI * 2);
        ctx.fill();

        // Nose
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(this.x + 45, this.y + 15, 12, 0, Math.PI * 2);
        ctx.fill();

        // Eye (White)
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(this.x + 35, this.y + 5, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pupil
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x + 38, this.y + 5, 3, 0, Math.PI * 2);
        ctx.fill();

        // Boots (Orange)
        ctx.fillStyle = '#FF5722';
        ctx.beginPath();
        ctx.ellipse(this.x + 15, this.y + 55, 10, 8, 0, 0, Math.PI * 2);
        ctx.ellipse(this.x + 35, this.y + 55, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Saddle (Red)
        ctx.fillStyle = '#F44336';
        ctx.beginPath();
        ctx.arc(this.x + 5, this.y + 30, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    },
    update: function () {
        // Gravity
        this.dy += this.gravity;
        this.y += this.dy;

        // Ground Collision
        const groundLevel = canvas.height - 100;
        if (this.y + this.height > groundLevel) {
            this.y = groundLevel - this.height;
            this.dy = 0;
            this.grounded = true;
        } else {
            this.grounded = false;
        }
    }
};

class Egg {
    constructor() {
        this.width = 30;
        this.height = 40;
        this.x = canvas.width + Math.random() * 200;
        this.y = (canvas.height - 100) - 50 - Math.random() * 100;
        this.markedForDeletion = false;
        this.type = 'egg';
    }

    update() {
        this.x -= speed;
        if (this.x + this.width < 0) this.markedForDeletion = true;
    }

    draw() {
        ctx.save();
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(this.x + 15, this.y + 20, 15, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 15, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 20, this.y + 30, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Obstacle {
    constructor() {
        this.width = 40;
        this.height = 40;
        this.x = canvas.width + Math.random() * 500 + 300; // Farther away
        this.y = canvas.height - 100 - this.height;
        this.markedForDeletion = false;
        this.type = 'obstacle';
    }

    update() {
        this.x -= speed;
        if (this.x + this.width < 0) this.markedForDeletion = true;
    }

    draw() {
        ctx.save();
        // Shy Guy Red
        ctx.fillStyle = '#F44336';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(this.x + 20, this.y + 15, 15, 15, 0, 0, Math.PI * 2); // Mask
        ctx.fill();

        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x + 15, this.y + 15, 3, 0, Math.PI * 2); // Eye
        ctx.arc(this.x + 25, this.y + 15, 3, 0, Math.PI * 2); // Eye
        ctx.beginPath();
        ctx.ellipse(this.x + 20, this.y + 25, 4, 6, 0, 0, Math.PI * 2); // Mouth
        ctx.fill();
        ctx.restore();
    }
}

// Background Scrolling
let bgX = 0;
function drawBackground() {
    ctx.fillStyle = '#87CEEB'; // Sky
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sun
    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath();
    ctx.arc(canvas.width - 100, 100, 50, 0, Math.PI * 2);
    ctx.fill();

    // Ground
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);

    // Grass top
    ctx.fillStyle = '#32CD32';
    ctx.fillRect(0, canvas.height - 110, canvas.width, 20);

    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 3; i++) {
        let x = ((frames * 1) + (i * 400)) % (canvas.width + 400) - 200;
        ctx.beginPath();
        ctx.arc(x, 150 + (i * 30), 40, 0, Math.PI * 2);
        ctx.arc(x + 50, 150 + (i * 30), 50, 0, Math.PI * 2);
        ctx.arc(x + 100, 150 + (i * 30), 40, 0, Math.PI * 2);
        ctx.fill();
    }
}


function startGame() {
    gameState = 'PLAYING';
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    score = 0;
    document.getElementById('score').innerText = 'Huevos: 0';
    frames = 0;
    items = [];
    yoshi.y = 0;
    yoshi.dy = 0;
    speed = 5;

    loopRunning = true; // Set loopRunning first
    gameLoop();
}

function resetGame() {
    gameState = 'START';
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');
}

function gameOver() {
    gameState = 'GAMEOVER';
    loopRunning = false;
    document.getElementById('final-score').innerText = score;
    document.getElementById('game-over-screen').classList.remove('hidden');
}

let loopRunning = false;
let animationId;

function gameLoop() {
    if (!loopRunning && gameState !== 'PLAYING') return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();

    if (gameState === 'PLAYING') {
        yoshi.update();
        yoshi.draw();

        // Spawn items
        if (frames % 100 === 0) {
            if (Math.random() < 0.6) {
                items.push(new Egg());
            } else {
                items.push(new Obstacle());
            }
        }

        // Manage Items
        for (let i = items.length - 1; i >= 0; i--) {
            items[i].update();
            items[i].draw();

            // Collision Detection
            if (
                yoshi.x < items[i].x + items[i].width &&
                yoshi.x + yoshi.width > items[i].x &&
                yoshi.y < items[i].y + items[i].height &&
                yoshi.y + yoshi.height > items[i].y
            ) {
                if (items[i].type === 'egg') {
                    score++;
                    playSound('collect');
                    // speed += 0.1;
                    document.getElementById('score').innerText = 'Huevos: ' + score;
                    items.splice(i, 1);
                } else if (items[i].type === 'obstacle') {
                    gameOver();
                    return; // Stop current loop
                }
            } else if (items[i].markedForDeletion) {
                items.splice(i, 1);
            }
        }

        frames++;
    }

    if (gameState === 'PLAYING') {
        animationId = requestAnimationFrame(gameLoop);
    }
}

// Initial draw for start screen background
drawBackground();
