import base64
import io
import random

import numpy as np
from PIL import Image
from flask import Flask, render_template, request, jsonify
from threading import Thread
import time
from waitress import serve

app = Flask(__name__)

# Initial default values
grid_size = 500  # Default grid size
theta = 0.8  # Threshold variation
delta = 0.1  # Noise factor
lambda_ = 0.7  # Cluster bias
custom_rule_order = ["Red", "Orange", "Yellow", "Green", "Blue", "Purple", "Pink", "Magenta"]
custom_rule_order.sort()
available_rules = custom_rule_order
seed = 42
current_grid = None
MAX_TIME = 60  # 1 minutes due to it being resource intensive
MAX_GRID_SIZE = 500  # Anything larger and it impedes the system

# Colors definition
COLORS = {
    "Red": (255, 0, 0), "Orange": (255, 165, 0), "Yellow": (255, 255, 0),
    "Green": (0, 255, 0), "Blue": (0, 0, 255), "Purple": (128, 0, 128),
    "Pink": (255, 192, 203), "Magenta": (255, 0, 255), "White": (255, 255, 255), "Black": (0, 0, 0)
}
COLOR_KEYS = list(COLORS.keys())

# Set random seed for reproducibility
random.seed(seed)
np.random.seed(seed)


@app.route('/')
def index():
    # noinspection PyUnresolvedReferences
    return render_template('index.html', grid_size=grid_size, theta=theta, delta=delta, lambda_=lambda_)


@app.route('/generate', methods=['POST'])
def generate():
    try:
        # Get form data
        global theta, delta, lambda_, custom_rule_order, seed, grid_size, current_grid
        grid_size = int(request.form.get('grid_size', grid_size))
        theta = float(request.form.get('theta', theta))
        delta = float(request.form.get('delta', delta))
        lambda_ = float(request.form.get('lambda_', lambda_))
        seed = request.form.get('seed', seed)  # Update seed dynamically from form
        custom_rule_order = request.form.get('custom_rule_order', ','.join(custom_rule_order)).replace(" ", "").split(
            ',')
        if not seed or seed == '':
            seed = 42
        if not custom_rule_order or custom_rule_order == ['']:
            custom_rule_order = available_rules
        custom_rule_order.sort()
        seed = int(seed)

        # Validate inputs
        if grid_size < 0 or grid_size > MAX_GRID_SIZE:
            return jsonify({"error": "Grid Size must be between 0.1 and 500."}), 400
        if theta < 0 or theta > 1:
            return jsonify({"error": "Theta must be between 0.1 and 1."}), 400
        if delta < 0 or delta > 1:
            return jsonify({"error": "Delta must be between 0.1 and 1."}), 400
        if lambda_ < 0 or lambda_ > 1:
            return jsonify({"error": "Lambda must be between 0 and 1."}), 400
        if seed < 0:
            return jsonify({"error": "Seed must be above 0"}), 400
        if custom_rule_order != available_rules:
            return jsonify(
                {"error": f"Custom Rule Order must be non repeating, and can only contain {available_rules}"}), 400

        # Set random seed for reproducibility
        random.seed(seed)
        np.random.seed(seed)

        # Initialize grid and apply rules
        current_grid = apply_rules(full_grid=initialize_grid(size=grid_size), rule_order=custom_rule_order)

        # Generate the initial image
        image_base64 = generate_image(grid_image=current_grid, grid_size_img=grid_size)

        return jsonify({"image_base64": image_base64})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def evolve_grid():
    global current_grid
    time_started = time.time()  # Track when the evolution starts

    while True:
        if current_grid is not None:
            # Apply rules and update grid
            current_grid = apply_rules(current_grid, custom_rule_order)

        # Check if X minutes have passed
        elapsed_time = time.time() - time_started
        if elapsed_time >= MAX_TIME:
            print("Grid evolution time has expired.")
            break


@app.route('/evolve', methods=['POST'])
def evolve():
    # Start the evolution process if not already running
    if current_grid is None:
        return jsonify({"error": "No initial grid generated. Please generate a grid first."}), 400

    # Start a background thread for evolving the grid
    thread = Thread(target=evolve_grid)
    thread.daemon = True  # Daemonize the thread so it stops when the app stops
    thread.start()

    return jsonify({"message": "Grid evolution started."})


def initialize_grid(size):
    grid_init = np.random.choice(COLOR_KEYS[:-1], (size, size), p=generate_cluster_bias())
    return grid_init


def generate_cluster_bias():
    base_prob = np.ones(len(COLOR_KEYS) - 1) / (len(COLOR_KEYS) - 1)
    base_prob *= lambda_
    base_prob /= base_prob.sum()
    return base_prob


def get_neighbors(full_grid, x, y):
    neighbors = []
    for dx in [-1, 0, 1]:
        for dy in [-1, 0, 1]:
            if dx == 0 and dy == 0:
                continue
            nx, ny = x + dx, y + dy
            if 0 <= nx < grid_size and 0 <= ny < grid_size:
                neighbors.append(full_grid[nx, ny])
    return neighbors


def apply_rules(full_grid, rule_order):
    new_grid = np.copy(full_grid)
    for x in range(grid_size):
        for y in range(grid_size):
            neighbors = get_neighbors(full_grid=full_grid, x=x, y=y)
            unique_neighbors = set(neighbors)
            color_counts = {color: neighbors.count(color) for color in COLOR_KEYS}

            # Apply rules in specified order
            for rule in rule_order:
                if apply_rule(rule, color_counts):
                    new_grid[x, y] = rule
                    break

            # Apply White check
            if len(unique_neighbors) == 8:
                new_grid[x, y] = "White"
                continue

            # Black Rule (Always Last)
            if new_grid[x, y] not in COLOR_KEYS:
                new_grid[x, y] = "Black"

    return new_grid


def apply_rule(rule, color_counts):
    """ Simplified rule application for each color. """
    if rule == "Red" and (color_counts.get("Red", 0) >= (5 - random.uniform(0, theta)) or
                          (color_counts.get("Red", 0) >= 3 and color_counts.get("Orange", 0) + color_counts.get(
                              "Yellow", 0) >= 2)):
        return True
    elif rule == "Orange" and color_counts.get("Red", 0) >= 2 and color_counts.get("Yellow", 0) >= 2:
        return True
    elif rule == "Yellow" and (color_counts.get("Orange", 0) >= 4 or (
            color_counts.get("Yellow", 0) >= 3 and color_counts.get("Green", 0) >= 2)):
        return True
    elif rule == "Green" and (color_counts.get("Blue", 0) >= 3 or color_counts.get("Yellow", 0) >= 3):
        return True
    elif rule == "Blue" and (color_counts.get("Blue", 0) >= 5 or (
            color_counts.get("Blue", 0) >= 3 and color_counts.get("Purple", 0) >= 2)):
        return True
    elif rule == "Purple" and (
            color_counts.get("Blue", 0) >= 3 >= color_counts.get("Black", 0) and color_counts.get("Pink", 0) >= 3):
        return True
    elif rule == "Pink" and (color_counts.get("Pink", 0) >= 4 or (
            color_counts.get("Red", 0) > 0 and color_counts.get("Magenta", 0) > 0 and color_counts.get("Black",
                                                                                                       0) <= 3)):
        return True
    elif rule == "Magenta" and color_counts.get("Purple", 0) >= 3 and color_counts.get("Pink", 0) >= 2:
        return True
    return False


def generate_image(grid_image, grid_size_img):
    img = Image.new("RGB", (grid_size_img, grid_size_img))
    pixels = img.load()

    for x in range(grid_size_img):
        for y in range(grid_size_img):
            pixels[x, y] = COLORS[grid_image[x, y]]

    # Convert image to base64 string (to avoid saving to a file)
    img_io = io.BytesIO()
    img.save(img_io, 'PNG')
    img_io.seek(0)
    image_base64 = base64.b64encode(img_io.read()).decode('utf-8')
    return f"data:image/png;base64,{image_base64}"


if __name__ == '__main__':
    serve(app, host='0.0.0.0', port=5000)
