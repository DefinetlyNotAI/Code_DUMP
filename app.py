import random

import pandas as pd
from flask import Flask, render_template, jsonify

app = Flask(__name__)


# Load data from CSV
def load_data():
    df = pd.read_csv("data.csv")
    df = df[['Name', 'Weight']].dropna()  # Keep only required columns
    df['Weight'] = df['Weight'].astype(int)  # Convert to integers
    return df


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/get_data')
def get_data():
    df = load_data()
    names = df['Name'].tolist()
    weights = df['Weight'].tolist()
    return jsonify({"names": names, "weights": weights})


@app.route('/spin')
def spin_wheel():
    df = load_data()

    names = df['Name'].tolist()
    weights = df['Weight'].tolist()

    winner = random.choices(names, weights=weights, k=1)[0]  # Weighted random choice
    return jsonify({"winner": winner})


if __name__ == '__main__':
    app.run(debug=True)
