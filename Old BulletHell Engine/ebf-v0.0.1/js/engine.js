
const canvas = document.getElementById('battleCanvas');
const ctx = canvas.getContext('2d');

let player = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    size: 20,
    color: 'white',
};

let keys = {};

function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fill();
}

function clearCanvas() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function update() {
    if (keys['ArrowLeft']) player.x -= 4;
    if (keys['ArrowRight']) player.x += 4;
    if (keys['ArrowUp']) player.y -= 4;
    if (keys['ArrowDown']) player.y += 4;

    player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));
}

function loop() {
    clearCanvas();
    update();
    drawPlayer();
    requestAnimationFrame(loop);
}

function playerAction(action) {
    const textbox = document.getElementById('textbox');
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

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

loop();
