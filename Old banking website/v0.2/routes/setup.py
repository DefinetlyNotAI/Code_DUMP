import os

from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash

from models import db, Settings, User

bp = Blueprint('setup', __name__, url_prefix='/api/setup')


@bp.route('', methods=['POST'])
def setup_bank():
    data = request.get_json()
    bank_name = data.get('bank_name')
    currency_name = data.get('currency_name')
    admin_password = data.get('admin_password')

    if os.getenv("ADMIN_PASSWORD"):
        return jsonify({"error": "Bank already setup"}), 400

    os.environ["ADMIN_PASSWORD"] = admin_password

    rules = {
        "leaderboard": False,
        "public_logs": False,
        "debts": False,
        "explicit_review": True
    }

    settings = Settings(bank_name=bank_name, currency_name=currency_name, rules=rules, max_currency=0)
    db.session.add(settings)
    db.session.commit()
    return jsonify({"status": "Bank initialized"})


@bp.route('/wallet', methods=['POST'])
def setup_wallet():
    from auth import verify_admin
    verify_admin()

    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    initial_currency = data.get('initial_currency')

    if User.query.filter_by(wallet_name=username).first():
        return jsonify({"error": "Wallet already exists"}), 400

    user = User(wallet_name=username, password_hash=generate_password_hash(password), current_currency=initial_currency)
    db.session.add(user)
    db.session.commit()
    return jsonify({"status": "Wallet created"})


@bp.route('/rules', methods=['POST'])
def setup_rules():
    from auth import verify_admin
    verify_admin()

    data = request.get_json()
    settings = Settings.query.first()

    settings.rules = {
        "leaderboard": data.get("leaderboard", False),
        "public_logs": data.get("public_logs", False),
        "debts": data.get("debts", False),
        "explicit_review": data.get("explicit_review", True)
    }
    db.session.commit()
    return jsonify({"status": "Rules updated"})
