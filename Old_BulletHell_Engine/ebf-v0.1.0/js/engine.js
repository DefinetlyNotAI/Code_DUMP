
const canvas = document.getElementById('battleCanvas');
const ctx = canvas.getContext('2d');

let player = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    size: 10,
    color: 'white',
    alive: true,
};

let bullets = [];
let keys = {};
let phase = 1;
let bulletTimer = 0;
let lastAction = '';

function drawPlayer() {
    if (!player.alive) return;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fill();
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
            player.alive = false;
            document.getElementById('textbox').innerText = "You were consumed by the corruption.";
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

function playerAction(action) {
    const textbox = document.getElementById('textbox');
    lastAction = action;
    if (phase === 1) {
        switch(action) {
            case 'resist':
                textbox.innerText = "You brace against the corruption.";
                break;
            case 'purge':
                textbox.innerText = "You attempt to purge the entity.";
                break;
            case 'recall':
                textbox.innerText = "You try to remember who you were.";
                break;
            case 'speak':
                textbox.innerText = "You whisper into the void.";
                break;
        }
    }
}

function bulletPatternPhase1() {
    if (bulletTimer % 30 === 0) {
        let centerX = canvas.width / 2;
        let centerY = 100;
        for (let i = 0; i < 12; i++) {
            let angle = (i / 12) * Math.PI * 2;
            let dx = Math.cos(angle) * 2;
            let dy = Math.sin(angle) * 2;
            spawnBullet(centerX, centerY, dx, dy);
        }
    }
}

function bulletPatternPhase2() {
    if (bulletTimer % 15 === 0) {
        let x = Math.random() * canvas.width;
        spawnBullet(x, 0, 0, 3 + Math.random() * 2, 7, "red");
    }

    if (bulletTimer % 40 === 0) {
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
        checkCollision();
        handlePhases();
        bulletTimer++;
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
