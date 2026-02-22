
const canvas = document.getElementById('battleCanvas');
const ctx = canvas.getContext('2d');

let player = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    size: 10,
    color: 'white',
    alive: true,
    hp: 100,
    maxHp: 100,
};

let bullets = [];
let buttons = [];
let keys = {};
let phase = 1;
let bulletTimer = 0;
let buttonTimer = 0;
let buttonIdCounter = 0;

let audio = new Audio('assets/battle_music.mp3');
audio.loop = true;
audio.volume = 0.5;
audio.play();

function drawPlayer() {
    if (!player.alive) return;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fill();
}

function drawHealthBar() {
    let hpWidth = 200;
    let filled = (player.hp / player.maxHp) * hpWidth;
    ctx.fillStyle = "red";
    ctx.fillRect(20, 20, filled, 10);
    ctx.strokeStyle = "white";
    ctx.strokeRect(20, 20, hpWidth, 10);
}

function clearCanvas() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function spawnBullet(x, y, dx, dy, size = 5, color = "crimson") {
    bullets.push({ x, y, dx, dy, size, color });
}

function updateBullets() {
    bullets.forEach((b, i) => {
        b.x += b.dx;
        b.y += b.dy;
        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            bullets.splice(i, 1);
        }
    });
}

function drawBullets() {
    bullets.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

function checkCollision() {
    bullets.forEach(b => {
        let dx = b.x - player.x;
        let dy = b.y - player.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < player.size + b.size && player.alive) {
            player.hp -= 10;
            b.x = -999;
            if (player.hp <= 0) {
                player.alive = false;
                document.getElementById('textbox').innerText = "You were consumed by the corruption.";
            }
        }
    });
}

function updatePlayer() {
    if (keys['ArrowLeft']) player.x -= 4;
    if (keys['ArrowRight']) player.x += 4;
    if (keys['ArrowUp']) player.y -= 4;
    if (keys['ArrowDown']) player.y += 4;

    player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));
}

function spawnRandomButton() {
    const options = ["resist", "purge", "recall", "speak"];
    const action = options[Math.floor(Math.random() * options.length)];
    const x = Math.random() * (canvas.width - 60) + 30;
    const y = Math.random() * (canvas.height - 200) + 100;
    buttons.push({ id: buttonIdCounter++, x, y, action });
}

function drawButtons() {
    buttons.forEach(btn => {
        ctx.fillStyle = "#111";
        ctx.fillRect(btn.x - 30, btn.y - 15, 60, 30);
        ctx.strokeStyle = "red";
        ctx.strokeRect(btn.x - 30, btn.y - 15, 60, 30);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(btn.action.toUpperCase(), btn.x, btn.y + 5);
    });
}

function checkButtonPress() {
    if (keys['z'] || keys['Z']) {
        buttons.forEach((btn, i) => {
            let dx = btn.x - player.x;
            let dy = btn.y - player.y;
            if (Math.sqrt(dx*dx + dy*dy) < 40) {
                document.getElementById('textbox').innerText = `You chose to ${btn.action}.`;
                buttons.splice(i, 1);
            }
        });
    }
}

function bulletPatternPhase1() {
    if (bulletTimer % 50 === 0) {
        let centerX = canvas.width / 2;
        let centerY = 100;
        for (let i = 0; i < 12; i++) {
            let angle = (i / 12) * Math.PI * 2;
            let dx = Math.cos(angle) * 2;
            let dy = Math.sin(angle) * 2;
            spawnBullet(centerX, centerY, dx * 1.5, dy * 1.5);
        }
    }
}

function bulletPatternPhase2() {
    if (bulletTimer % 25 === 0) {
        let x = Math.random() * canvas.width;
        spawnBullet(x, 0, 0, 3 + Math.random() * 2, 7, "red");
    }

    if (bulletTimer % 60 === 0) {
        let centerX = canvas.width / 2;
        for (let i = 0; i < 8; i++) {
            let dx = Math.sin(bulletTimer / 10 + i) * 3;
            spawnBullet(centerX + dx * 10, 100, dx, 3);
        }
    }
}

function handlePhases() {
    if (phase === 1) {
        bulletPatternPhase1();
        if (bulletTimer > 600) {
            phase = 2;
            document.getElementById('textbox').innerText = "The Entity evolves. It screams with rage.";
            bullets = [];
            bulletTimer = 0;
        }
    } else if (phase === 2) {
        bulletPatternPhase2();
    }
}

function loop() {
    clearCanvas();
    if (player.alive) {
        updatePlayer();
        updateBullets();
        drawBullets();
        drawPlayer();
        drawButtons();
        checkCollision();
        checkButtonPress();
        drawHealthBar();
        handlePhases();

        bulletTimer++;
        buttonTimer++;

        if (buttonTimer % 1200 === 0 && buttons.length < 3) {
            spawnRandomButton();
        }
    }
    requestAnimationFrame(loop);
}

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

loop();
