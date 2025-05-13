import base64
import random
import string
from waitress import serve
from datetime import datetime

from flask import Flask, render_template, request, jsonify, redirect, url_for, session

app = Flask(__name__)
app.secret_key = ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(32))

# Visitor tracking and secret distribution
visitor_secrets = {}
all_secrets = {
    "group1": ["binary_message", "hidden_terminal", "reversed_audio"],
    "group2": ["glitch_image", "source_code_puzzle", "console_command"],
    "group3": ["url_parameter", "header_message", "morse_code"]
}

# Lore and puzzle content
lore_fragments = [
    "The system was compromised on 03/15/2025...",
    "Project SCRAPYARD was never meant to be found...",
    "They're watching the network traffic...",
    "The corruption spreads through the code...",
    "Find the others. Share what you discover...",
    "Some secrets are only visible when the moon is full...",
    "The glitches are not accidents. They're messages...",
    "Look for patterns in the static...",
]

# Puzzle solutions and progress tracking
puzzle_solutions = {
    "terminal": "OVERRIDE",
    "glitch": "BENEATH",
    "audio": "WHISPERS",
    "source": "HIDDEN",
    "parameter": "GATEWAY"
}


# Depreacting site
@app.before_request
def redirect_to_deprecated():
    # Skip redirect if the URL is already /deprecated
    if request.path == '/deprecated':
        return
    # Redirect all other requests to /deprecated
    return redirect(url_for('deprecated'))


@app.route('/deprecated')
def deprecated():
    return render_template('deprecate.html'), 200
    

# Middleware to add glitches and track visitors
@app.before_request
def before_request():
    # Assign unique visitor ID and secret group
    if 'visitor_id' not in session:
        session['visitor_id'] = ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(16))
        session['secret_group'] = random.choice(list(all_secrets.keys()))
        session['discovered_secrets'] = []
        session['puzzle_progress'] = 0

    # Random chance to redirect to glitch page
    if random.random() < 0.05 and request.path != '/glitch' and request.path != '/static':
        return redirect(url_for('glitch'))


# Custom 404 page that contains hidden clues
# noinspection PyUnusedLocal
@app.errorhandler(404)
def page_not_found(e):
    # Hidden message in the 404 page
    hidden_message = base64.b64encode("The path you seek is hidden in plain sight".encode()).decode()
    return render_template('404.html', hidden_message=hidden_message), 404


# Routes
@app.route('/')
def index():
    # Get time-based content variations
    current_hour = datetime.now().hour
    night_mode = current_hour >= 20 or current_hour <= 6

    # Select a random lore fragment
    lore = random.choice(lore_fragments)

    # Determine which secrets this user can see
    available_secrets = all_secrets[session['secret_group']]

    return render_template('index.html',
                           lore=lore,
                           night_mode=night_mode,
                           visitor_id=session['visitor_id'][:8],
                           available_secrets=available_secrets)

@app.route('/glitch')
def glitch():
    # Random glitch intensity
    intensity = random.randint(1, 5)
    return render_template('glitch.html', intensity=intensity)


@app.route('/archives')
def archives():
    # Archives page with historical data and hidden clues
    return render_template('archives.html')


@app.route('/transmission')
def transmission():
    # Page with audio puzzles and distorted messages
    return render_template('transmission.html')


# API endpoints for puzzle interactions
@app.route('/api/verify_solution', methods=['POST'])
def verify_solution():
    data = request.json
    puzzle_type = data.get('puzzle')
    solution = data.get('solution')

    if puzzle_type in puzzle_solutions and puzzle_solutions[puzzle_type].lower() == solution.lower():
        if puzzle_type not in session.get('solved_puzzles', []):
            if 'solved_puzzles' not in session:
                session['solved_puzzles'] = []
            session['solved_puzzles'].append(puzzle_type)
            session['puzzle_progress'] = len(session['solved_puzzles'])

        return jsonify({
            'success': True,
            'message': 'Correct solution!',
            'progress': session['puzzle_progress'],
            'next_clue': get_next_clue(puzzle_type)
        })

    return jsonify({
        'success': False,
        'message': 'Incorrect solution. Try again.'
    })


@app.route('/api/discover_secret', methods=['POST'])
def discover_secret():
    data = request.json
    secret_id = data.get('secret_id')

    if secret_id in all_secrets.get(session['secret_group'], []):
        if secret_id not in session.get('discovered_secrets', []):
            if 'discovered_secrets' not in session:
                session['discovered_secrets'] = []
            session['discovered_secrets'].append(secret_id)

        return jsonify({
            'success': True,
            'message': f'You discovered: {secret_id}',
            'total_discovered': len(session['discovered_secrets']),
            'reward': get_secret_reward(secret_id)
        })

    return jsonify({
        'success': False,
        'message': 'This secret is not available to you. Find someone who can access it!'
    })


# Helper functions
def get_next_clue(puzzle_type):
    clues = {
        "terminal": "Look for patterns in the static on the transmission.html page",
        "glitch": "Check the page source for commented coordinates",
        "audio": "The archives hold timestamps that form a pattern",
        "source": "HTTP headers contain a message on the glitch page",
        "parameter": "Add ?moonlight=true to the archives URL"
    }
    return clues.get(puzzle_type, "The path continues elsewhere...")


def get_secret_reward(secret_id):
    rewards = {
        "binary_message": "01010100 01101000 01100101 00100000 01100110 01101001 01110010 01110011 01110100 00100000 01101011 01100101 01111001 00100000 01101001 01110011 00100000 01001111 01010110 01000101 01010010 01010010 01001001 01000100 01000101",
        "hidden_terminal": "Access to the terminal interface granted",
        "reversed_audio": "Play the transmission.html backwards to hear the message",
        "glitch_image": "The corruption reveals a pattern when viewed at 50% opacity",
        "source_code_puzzle": "<!-- The key is hidden in the HTML comments -->",
        "console_command": "Try running scrapyard.revealSecret() in the browser console",
        "url_parameter": "Add ?decode=true to any URL to see hidden content",
        "header_message": "Check the response headers for X-Secret-Message",
        "morse_code": "... -.-. .-. .- .--. -.-- .- .-. -.. / .... --- .-.. -.. ... / - .... . / -.- . -.--"
    }
    return rewards.get(secret_id, "This secret has been corrupted...")


# Special routes for puzzle mechanics
@app.route('/moonlight')
def moonlight():
    # Only accessible during certain hours or with the right parameter
    current_hour = datetime.now().hour
    is_moonlight_time = current_hour >= 22 or current_hour <= 4
    has_parameter = request.args.get('activate') == 'true'

    if is_moonlight_time or has_parameter:
        return render_template('moonlight.html')
    else:
        return redirect(url_for('index'))


@app.route('/api/get_header_secret')
def get_header_secret():
    response = jsonify({'status': 'check_headers'})
    response.headers['X-Secret-Message'] = base64.b64encode("The walls have ears".encode()).decode()
    return response


@app.route('/computer')
def computer():
    # Computer terminal for entering secret codes
    return render_template('computer.html')


# Add this API endpoint for unlocking secrets
@app.route('/api/unlock_secret', methods=['POST'])
def unlock_secret():
    data = request.json
    secret_id = data.get('secret_id')

    if secret_id:
        if 'unlocked_secrets' not in session:
            session['unlocked_secrets'] = []

        if secret_id not in session['unlocked_secrets']:
            session['unlocked_secrets'].append(secret_id)

        return jsonify({
            'success': True,
            'message': f'Secret unlocked: {secret_id}',
            'total_unlocked': len(session['unlocked_secrets'])
        })

    return jsonify({
        'success': False,
        'message': 'Invalid secret ID'
    })


if __name__ == '__main__':
    serve(app, host='0.0.0.0', port=8080)
