// Main JavaScript for Scrapyard Hackathon

document.addEventListener('DOMContentLoaded', function() {
    // Initialize corruption effects
    initCorruption();

    // Initialize secret triggers
    initSecretTriggers();

    // Initialize URL parameter detection
    checkUrlParameters();

    // Console message
    console.log("%cSCRAPYARD HACKATHON", "color: #ff0044; font-size: 20px; font-weight: bold;");
    console.log("%cThe system has been compromised.", "color: white; font-size: 14px;");
    console.log("%cLook deeper into the code to find secrets.", "color: #00ffff; font-size: 12px;");
});

// Initialize corruption visual effects
function initCorruption() {
    // Random glitch effects on text elements
    setInterval(() => {
        const elements = document.querySelectorAll('.glitch-text');
        if (elements.length > 0) {
            const randomElement = elements[Math.floor(Math.random() * elements.length)];
            randomElement.classList.add('active');
            setTimeout(() => {
                randomElement.classList.remove('active');
            }, 200);
        }
    }, 3000);

    // Random corruption flashes
    setInterval(() => {
        if (Math.random() < 0.05) {
            document.body.classList.add('corrupted');
            setTimeout(() => {
                document.body.classList.remove('corrupted');
            }, 500);
        }
    }, 10000);
}

// Initialize secret triggers
function initSecretTriggers() {
    // Find all secret triggers
    const secretTriggers = document.querySelectorAll('.secret-trigger');

    secretTriggers.forEach(trigger => {
        trigger.addEventListener('click', function() {
            const secretId = this.dataset.secret;

            // Send discovery to server
            fetch('/api/discover_secret', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    secret_id: secretId
                })
            })
                .then(response => response.json())
                .then(data => {
                    if(data.success) {
                        console.log('Secret discovered:', data.message);
                        console.log('Reward:', data.reward);

                        // Visual feedback
                        const glitchEffect = document.createElement('div');
                        glitchEffect.className = 'glitch-effect';
                        glitchEffect.style.position = 'fixed';
                        glitchEffect.style.top = '0';
                        glitchEffect.style.left = '0';
                        glitchEffect.style.width = '100%';
                        glitchEffect.style.height = '100%';
                        glitchEffect.style.background = 'rgba(255,0,68,0.2)';
                        glitchEffect.style.zIndex = '1000';
                        glitchEffect.style.animation = 'glitchFlash 0.5s';
                        document.body.appendChild(glitchEffect);

                        setTimeout(() => {
                            document.body.removeChild(glitchEffect);
                        }, 500);
                    }
                });
        });
    });

    // Hidden hover effects
    document.addEventListener('mousemove', function(e) {
        // Random chance to reveal hidden elements
        if (Math.random() < 0.001) {
            const hiddenElement = document.createElement('div');
            hiddenElement.textContent = 'Look deeper';
            hiddenElement.style.position = 'fixed';
            hiddenElement.style.top = e.clientY + 'px';
            hiddenElement.style.left = e.clientX + 'px';
            hiddenElement.style.color = '#ff0044';
            hiddenElement.style.fontSize = '0.8rem';
            hiddenElement.style.opacity = '0.5';
            hiddenElement.style.pointerEvents = 'none';
            hiddenElement.style.zIndex = '1000';
            hiddenElement.style.animation = 'fadeOut 2s forwards';
            document.body.appendChild(hiddenElement);

            setTimeout(() => {
                document.body.removeChild(hiddenElement);
            }, 2000);
        }
    });
}

// Check URL parameters for secrets
function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);

    // Check for decode parameter
    if (urlParams.has('decode') && urlParams.get('decode') === 'true') {
        fetch('/api/discover_secret', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                secret_id: 'url_parameter'
            })
        })
            .then(response => response.json())
            .then(data => {
                if(data.success) {
                    console.log('Secret discovered:', data.message);
                    console.log('Reward:', data.reward);

                    // Reveal hidden content
                    const hiddenElements = document.querySelectorAll('.hidden-content');
                    hiddenElements.forEach(el => {
                        el.style.display = 'block';
                    });
                }
            });
    }

    // Check for moonlight parameter
    if (urlParams.has('moonlight') && urlParams.get('moonlight') === 'true') {
        // Redirect to moonlight page
        window.location.href = '/moonlight?activate=true';
    }
}

// Hidden keypress detection
let keySequence = '';
document.addEventListener('keydown', function(e) {
    keySequence += e.key.toLowerCase();

    // Limit the sequence length
    if (keySequence.length > 20) {
        keySequence = keySequence.substring(keySequence.length - 20);
    }

    // Check for specific sequences
    if (keySequence.includes('scrapyard')) {
        console.log('Key sequence detected: scrapyard');

        // Visual feedback
        document.body.classList.add('corrupted');
        setTimeout(() => {
            document.body.classList.remove('corrupted');
        }, 500);
    }

    // Check for "source" sequence
    if (keySequence.includes('source')) {
        fetch('/api/verify_solution', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                puzzle: 'source',
                solution: 'hidden'
            })
        })
            .then(response => response.json())
            .then(data => {
                if(data.success) {
                    console.log('Puzzle solved:', data.message);
                    console.log('Next clue:', data.next_clue);
                }
            });
    }
});

// Add keyframe animation for fadeOut
const style = document.createElement('style');
style.textContent = `
@keyframes fadeOut {
    0% { opacity: 0.5; }
    100% { opacity: 0; }
}

@keyframes glitchFlash {
    0% { opacity: 0; }
    10% { opacity: 0.5; }
    20% { opacity: 0.2; }
    30% { opacity: 0.7; }
    40% { opacity: 0.3; }
    50% { opacity: 0.6; }
    60% { opacity: 0.4; }
    70% { opacity: 0.7; }
    80% { opacity: 0.2; }
    90% { opacity: 0.5; }
    100% { opacity: 0; }
}
`;
document.head.appendChild(style);