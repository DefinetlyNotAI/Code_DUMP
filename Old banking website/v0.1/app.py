import os
import uuid
from datetime import datetime, timedelta, UTC
from functools import wraps

import click
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('POSTGRESQL_DB_URL',
                                                  'postgres://avnadmin:AVNS_ElrjFLH4xd4d0mw1sUM@hackathon-banking-service-scrapyard-bounty.h.aivencloud.com:18653/defaultdb?sslmode=require')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET', 'dev-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

db = SQLAlchemy(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)


# Models
class User(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='user')  # admin, user, guest
    created_at = db.Column(db.DateTime, default=datetime.now(UTC))
    updated_at = db.Column(db.DateTime, default=datetime.now(UTC), onupdate=datetime.now(UTC))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Bank(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    bank_name = db.Column(db.String(100), nullable=False)
    currency_name = db.Column(db.String(50), nullable=False)
    currency_symbol = db.Column(db.String(10), nullable=False)
    total_supply = db.Column(db.Float, nullable=False, default=0)
    in_circulation = db.Column(db.Float, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=datetime.now(UTC))
    updated_at = db.Column(db.DateTime, default=datetime.now(UTC), onupdate=datetime.now(UTC))


class BankRule(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    bank_id = db.Column(db.String(36), db.ForeignKey('bank.id'), nullable=False)
    transaction_limit = db.Column(db.Float, nullable=True)
    require_approval = db.Column(db.Boolean, default=False)
    allow_refunds = db.Column(db.Boolean, default=True)
    default_wallet_balance = db.Column(db.Float, default=0)
    created_at = db.Column(db.DateTime, default=datetime.now(UTC))
    updated_at = db.Column(db.DateTime, default=datetime.now(UTC), onupdate=datetime.now(UTC))


class Wallet(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    balance = db.Column(db.Float, nullable=False, default=0)
    name = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='active')  # active, frozen, burned
    created_at = db.Column(db.DateTime, default=datetime.now(UTC))
    updated_at = db.Column(db.DateTime, default=datetime.now(UTC), onupdate=datetime.now(UTC))


class Transaction(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    from_wallet_id = db.Column(db.String(36), db.ForeignKey('wallet.id'), nullable=False)
    to_wallet_id = db.Column(db.String(36), db.ForeignKey('wallet.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(20), nullable=False)  # reward, penalty, trade, other
    reason = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), nullable=False, default='pending')  # pending, complete, cancelled, refunded
    idempotency_key = db.Column(db.String(100), nullable=True, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.now(UTC))
    updated_at = db.Column(db.DateTime, default=datetime.now(UTC), onupdate=datetime.now(UTC))


class RefundRequest(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id = db.Column(db.String(36), db.ForeignKey('transaction.id'), nullable=False)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='pending')  # pending, approved, rejected
    created_at = db.Column(db.DateTime, default=datetime.now(UTC))
    updated_at = db.Column(db.DateTime, default=datetime.now(UTC), onupdate=datetime.now(UTC))


class PasswordResetRequest(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='pending')  # pending, approved, rejected
    created_at = db.Column(db.DateTime, default=datetime.now(UTC))
    updated_at = db.Column(db.DateTime, default=datetime.now(UTC), onupdate=datetime.now(UTC))


class AuditLog(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    action = db.Column(db.String(100), nullable=False)
    entity_type = db.Column(db.String(50), nullable=False)
    entity_id = db.Column(db.String(36), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    details = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now(UTC))


class CurrencyOperation(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    operation_type = db.Column(db.String(20), nullable=False)  # mint, burn
    amount = db.Column(db.Float, nullable=False)
    reason = db.Column(db.Text, nullable=True)
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now(UTC))


# Helper functions
def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user or user.role != 'admin':
            return jsonify({"msg": "Admin access required"}), 403
        return fn(*args, **kwargs)

    return wrapper


def user_or_admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user or user.role not in ['admin', 'user']:
            return jsonify({"msg": "User or admin access required"}), 403
        return fn(*args, **kwargs)

    return wrapper


def log_audit(action, entity_type, entity_id, user_id, details=None):
    audit_log = AuditLog(
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        user_id=user_id,
        details=details
    )
    db.session.add(audit_log)
    db.session.commit()


# Routes
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({"msg": "Invalid username or password"}), 401

    access_token = create_access_token(identity=user.id)
    return jsonify({
        "token": access_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role
        }
    }), 200


# Bank Management
@app.route('/api/bank/setup', methods=['POST'])
@jwt_required()
@admin_required
def setup_bank():
    data = request.get_json()
    current_user_id = get_jwt_identity()

    # Check if bank already exists
    existing_bank = Bank.query.first()
    if existing_bank:
        return jsonify({"msg": "Bank already exists"}), 400

    bank = Bank(
        bank_name=data.get('bank_name'),
        currency_name=data.get('currency_name'),
        currency_symbol=data.get('currency_symbol'),
        total_supply=data.get('initial_pool_amount', 0),
        in_circulation=0
    )

    db.session.add(bank)
    db.session.commit()

    # Create default bank rules
    bank_rule = BankRule(
        bank_id=bank.id,
        transaction_limit=None,
        require_approval=False,
        allow_refunds=True,
        default_wallet_balance=0
    )

    db.session.add(bank_rule)
    db.session.commit()

    log_audit("bank_setup", "bank", bank.id, current_user_id, {
        "bank_name": bank.bank_name,
        "currency_name": bank.currency_name
    })

    return jsonify({
        "id": bank.id,
        "bank_name": bank.bank_name,
        "currency_name": bank.currency_name,
        "currency_symbol": bank.currency_symbol,
        "pool_amount": bank.total_supply,
        "created_at": bank.created_at.isoformat()
    }), 201


@app.route('/api/bank/rules', methods=['POST'])
@jwt_required()
@admin_required
def setup_bank_rules():
    data = request.get_json()
    current_user_id = get_jwt_identity()

    bank = Bank.query.first()
    if not bank:
        return jsonify({"msg": "Bank not set up yet"}), 400

    bank_rule = BankRule.query.filter_by(bank_id=bank.id).first()
    if not bank_rule:
        bank_rule = BankRule(bank_id=bank.id)

    bank_rule.transaction_limit = data.get('transaction_limit')
    bank_rule.require_approval = data.get('require_approval', False)
    bank_rule.allow_refunds = data.get('allow_refunds', True)
    bank_rule.default_wallet_balance = data.get('default_wallet_balance', 0)

    db.session.add(bank_rule)
    db.session.commit()

    log_audit("bank_rules_update", "bank_rule", bank_rule.id, current_user_id, {
        "transaction_limit": bank_rule.transaction_limit,
        "require_approval": bank_rule.require_approval,
        "allow_refunds": bank_rule.allow_refunds
    })

    return jsonify({
        "id": bank_rule.id,
        "transaction_limit": bank_rule.transaction_limit,
        "require_approval": bank_rule.require_approval,
        "allow_refunds": bank_rule.allow_refunds,
        "default_wallet_balance": bank_rule.default_wallet_balance,
        "updated_at": bank_rule.updated_at.isoformat()
    }), 200


# Wallet Management
@app.route('/api/wallets', methods=['POST'])
@jwt_required()
@admin_required
def create_wallet():
    data = request.get_json()
    current_user_id = get_jwt_identity()

    user_id = data.get('user_id')
    user = User.query.get(user_id)
    if not user:
        # Create a new user if not exists
        user = User(
            id=user_id,
            username=f"user_{user_id}",
            role='user'
        )
        user.set_password(str(uuid.uuid4()))  # Generate random password
        db.session.add(user)

    wallet = Wallet(
        user_id=user_id,
        balance=data.get('initial_balance', 0),
        name=data.get('name', 'Default Wallet')
    )

    db.session.add(wallet)

    # Update bank circulation
    bank = Bank.query.first()
    if bank:
        bank.in_circulation += wallet.balance
        db.session.add(bank)

    db.session.commit()

    log_audit("wallet_created", "wallet", wallet.id, current_user_id, {
        "user_id": wallet.user_id,
        "initial_balance": wallet.balance
    })

    return jsonify({
        "id": wallet.id,
        "user_id": wallet.user_id,
        "balance": wallet.balance,
        "name": wallet.name,
        "status": wallet.status,
        "created_at": wallet.created_at.isoformat()
    }), 201


@app.route('/api/wallets/<wallet_id>', methods=['GET'])
@jwt_required()
def get_wallet(wallet_id):
    wallet = Wallet.query.get(wallet_id)
    if not wallet:
        return jsonify({"msg": "Wallet not found"}), 404

    return jsonify({
        "id": wallet.id,
        "user_id": wallet.user_id,
        "balance": wallet.balance,
        "name": wallet.name,
        "status": wallet.status,
        "created_at": wallet.created_at.isoformat(),
        "updated_at": wallet.updated_at.isoformat()
    }), 200


@app.route('/api/wallets/<wallet_id>/status', methods=['PATCH'])
@jwt_required()
@admin_required
def update_wallet_status(wallet_id):
    data = request.get_json()
    current_user_id = get_jwt_identity()

    wallet = Wallet.query.get(wallet_id)
    if not wallet:
        return jsonify({"msg": "Wallet not found"}), 404

    status = data.get('status')
    reason = data.get('reason', '')

    if status not in ['active', 'frozen', 'burned']:
        return jsonify({"msg": "Invalid status"}), 400

    old_status = wallet.status
    wallet.status = status

    # If burning wallet, update bank circulation
    if status == 'burned' and old_status != 'burned':
        bank = Bank.query.first()
        if bank:
            bank.in_circulation -= wallet.balance
            db.session.add(bank)

    db.session.add(wallet)
    db.session.commit()

    log_audit("wallet_status_updated", "wallet", wallet.id, current_user_id, {
        "old_status": old_status,
        "new_status": status,
        "reason": reason
    })

    return jsonify({
        "id": wallet.id,
        "status": wallet.status,
        "updated_at": wallet.updated_at.isoformat()
    }), 200


@app.route('/api/wallets/<wallet_id>/reset', methods=['PATCH'])
@jwt_required()
@admin_required
def reset_wallet_balance(wallet_id):
    data = request.get_json()
    current_user_id = get_jwt_identity()

    wallet = Wallet.query.get(wallet_id)
    if not wallet:
        return jsonify({"msg": "Wallet not found"}), 404

    new_balance = data.get('new_balance', 0)
    reason = data.get('reason', '')

    old_balance = wallet.balance
    wallet.balance = new_balance

    # Update bank circulation
    bank = Bank.query.first()
    if bank:
        bank.in_circulation = bank.in_circulation = bank.in_circulation - old_balance + new_balance
        db.session.add(bank)

    db.session.add(wallet)
    db.session.commit()

    log_audit("wallet_balance_reset", "wallet", wallet.id, current_user_id, {
        "old_balance": old_balance,
        "new_balance": new_balance,
        "reason": reason
    })

    return jsonify({
        "id": wallet.id,
        "balance": wallet.balance,
        "updated_at": wallet.updated_at.isoformat()
    }), 200


# Transactions
@app.route('/api/transactions', methods=['POST'])
@jwt_required()
@user_or_admin_required
def create_transaction():
    data = request.get_json()
    current_user_id = get_jwt_identity()

    from_wallet_id = data.get('from_wallet_id')
    to_wallet_id = data.get('to_wallet_id')
    amount = data.get('amount')
    category = data.get('category')
    reason = data.get('reason', '')
    idempotency_key = data.get('idempotency_key')

    # Validate inputs
    if not all([from_wallet_id, to_wallet_id, amount, category]):
        return jsonify({"msg": "Missing required fields"}), 400

    if amount <= 0:
        return jsonify({"msg": "Amount must be positive"}), 400

    if category not in ['reward', 'penalty', 'trade', 'other']:
        return jsonify({"msg": "Invalid category"}), 400

    # Check idempotency key
    if idempotency_key:
        existing_transaction = Transaction.query.filter_by(idempotency_key=idempotency_key).first()
        if existing_transaction:
            return jsonify({
                "id": existing_transaction.id,
                "status": existing_transaction.status,
                "msg": "Transaction with this idempotency key already exists"
            }), 200

    # Get wallets
    from_wallet = Wallet.query.get(from_wallet_id)
    to_wallet = Wallet.query.get(to_wallet_id)

    if not from_wallet or not to_wallet:
        return jsonify({"msg": "Wallet not found"}), 404

    # Check wallet status
    if from_wallet.status != 'active':
        return jsonify({"msg": "Source wallet is not active"}), 400

    if to_wallet.status != 'active':
        return jsonify({"msg": "Destination wallet is not active"}), 400

    # Check balance
    if from_wallet.balance < amount:
        return jsonify({"msg": "Insufficient balance"}), 400

    # Check transaction limit
    bank_rule = BankRule.query.join(Bank).first()
    if bank_rule and bank_rule.transaction_limit and amount > bank_rule.transaction_limit:
        return jsonify({"msg": f"Transaction exceeds limit of {bank_rule.transaction_limit}"}), 400

    # Create transaction
    transaction = Transaction(
        from_wallet_id=from_wallet_id,
        to_wallet_id=to_wallet_id,
        amount=amount,
        category=category,
        reason=reason,
        idempotency_key=idempotency_key,
        status='pending' if bank_rule and bank_rule.require_approval else 'complete'
    )

    db.session.add(transaction)

    # If no approval required, process transaction immediately
    if not bank_rule or not bank_rule.require_approval:
        from_wallet.balance -= amount
        to_wallet.balance += amount
        db.session.add(from_wallet)
        db.session.add(to_wallet)

    db.session.commit()

    log_audit("transaction_created", "transaction", transaction.id, current_user_id, {
        "from_wallet_id": from_wallet_id,
        "to_wallet_id": to_wallet_id,
        "amount": amount,
        "category": category
    })

    return jsonify({
        "id": transaction.id,
        "from_wallet_id": transaction.from_wallet_id,
        "to_wallet_id": transaction.to_wallet_id,
        "amount": transaction.amount,
        "category": transaction.category,
        "reason": transaction.reason,
        "status": transaction.status,
        "created_at": transaction.created_at.isoformat()
    }), 201


@app.route('/api/transactions/<transaction_id>/status', methods=['PATCH'])
@jwt_required()
@admin_required
def update_transaction_status(transaction_id):
    data = request.get_json()
    current_user_id = get_jwt_identity()

    transaction = Transaction.query.get(transaction_id)
    if not transaction:
        return jsonify({"msg": "Transaction not found"}), 404

    status = data.get('status')
    reason = data.get('reason', '')

    if status not in ['complete', 'cancelled', 'refunded']:
        return jsonify({"msg": "Invalid status"}), 400

    old_status = transaction.status

    # Can't change status if already completed or cancelled
    if old_status in ['complete', 'cancelled', 'refunded']:
        return jsonify({"msg": f"Transaction already {old_status}"}), 400

    transaction.status = status

    # Process transaction based on new status
    from_wallet = Wallet.query.get(transaction.from_wallet_id)
    to_wallet = Wallet.query.get(transaction.to_wallet_id)

    if status == 'complete':
        from_wallet.balance -= transaction.amount
        to_wallet.balance += transaction.amount
    elif status == 'refunded' and old_status == 'complete':
        from_wallet.balance += transaction.amount
        to_wallet.balance -= transaction.amount

    db.session.add(transaction)
    db.session.add(from_wallet)
    db.session.add(to_wallet)
    db.session.commit()

    log_audit("transaction_status_updated", "transaction", transaction.id, current_user_id, {
        "old_status": old_status,
        "new_status": status,
        "reason": reason
    })

    return jsonify({
        "id": transaction.id,
        "status": transaction.status,
        "updated_at": transaction.updated_at.isoformat()
    }), 200


@app.route('/api/transactions/<transaction_id>/refund-request', methods=['POST'])
@jwt_required()
@user_or_admin_required
def request_refund(transaction_id):
    data = request.get_json()
    current_user_id = get_jwt_identity()

    transaction = Transaction.query.get(transaction_id)
    if not transaction:
        return jsonify({"msg": "Transaction not found"}), 404

    # Check if transaction is completed
    if transaction.status != 'complete':
        return jsonify({"msg": "Only completed transactions can be refunded"}), 400

    # Check if refund is allowed
    bank_rule = BankRule.query.join(Bank).first()
    if bank_rule and not bank_rule.allow_refunds:
        return jsonify({"msg": "Refunds are not allowed"}), 400

    # Check if refund already requested
    existing_request = RefundRequest.query.filter_by(transaction_id=transaction_id).first()
    if existing_request:
        return jsonify({"msg": "Refund already requested"}), 400

    refund_request = RefundRequest(
        transaction_id=transaction_id,
        reason=data.get('reason', '')
    )

    db.session.add(refund_request)
    db.session.commit()

    log_audit("refund_requested", "refund_request", refund_request.id, current_user_id, {
        "transaction_id": transaction_id,
        "reason": refund_request.reason
    })

    return jsonify({
        "id": refund_request.id,
        "transaction_id": refund_request.transaction_id,
        "reason": refund_request.reason,
        "status": refund_request.status,
        "created_at": refund_request.created_at.isoformat()
    }), 201


@app.route('/api/transactions/public', methods=['GET'])
@jwt_required()
def get_public_transactions():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)

    transactions = Transaction.query.filter(Transaction.status.in_(['complete', 'cancelled', 'refunded'])) \
        .order_by(Transaction.created_at.desc()) \
        .paginate(page=page, per_page=limit, error_out=False)

    return jsonify({
        "transactions": [{
            "id": t.id,
            "from_wallet_id": t.from_wallet_id,
            "to_wallet_id": t.to_wallet_id,
            "amount": t.amount,
            "category": t.category,
            "status": t.status,
            "created_at": t.created_at.isoformat()
        } for t in transactions.items],
        "pagination": {
            "total": transactions.total,
            "page": page,
            "limit": limit
        }
    }), 200


@app.route('/api/transactions/user', methods=['GET'])
@jwt_required()
@user_or_admin_required
def get_user_transactions():
    current_user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)

    user = User.query.get(current_user_id)

    # Get all wallets for the user
    user_wallets = Wallet.query.filter_by(user_id=current_user_id).all()
    wallet_ids = [w.id for w in user_wallets]

    # Get transactions for these wallets
    query = Transaction.query.filter(
        (Transaction.from_wallet_id.in_(wallet_ids)) |
        (Transaction.to_wallet_id.in_(wallet_ids))
    )

    # Admin can see all transactions
    if user.role != 'admin':
        query = query.filter(Transaction.status.in_(['complete', 'cancelled', 'refunded']))

    transactions = query.order_by(Transaction.created_at.desc()) \
        .paginate(page=page, per_page=limit, error_out=False)

    return jsonify({
        "transactions": [{
            "id": t.id,
            "from_wallet_id": t.from_wallet_id,
            "to_wallet_id": t.to_wallet_id,
            "amount": t.amount,
            "category": t.category,
            "reason": t.reason,
            "status": t.status,
            "created_at": t.created_at.isoformat()
        } for t in transactions.items],
        "pagination": {
            "total": transactions.total,
            "page": page,
            "limit": limit
        }
    }), 200


# Currency Pool
@app.route('/api/currency/pool', methods=['GET'])
@jwt_required()
def get_currency_pool():
    bank = Bank.query.first()
    if not bank:
        return jsonify({"msg": "Bank not set up yet"}), 400

    return jsonify({
        "total_supply": bank.total_supply,
        "in_circulation": bank.in_circulation,
        "free_pool": bank.total_supply - bank.in_circulation,
        "currency_name": bank.currency_name,
        "currency_symbol": bank.currency_symbol
    }), 200


# noinspection DuplicatedCode
@app.route('/api/currency/mint', methods=['POST'])
@jwt_required()
@admin_required
def mint_currency():
    data = request.get_json()
    current_user_id = get_jwt_identity()

    amount = data.get('amount')
    reason = data.get('reason', '')

    if not amount or amount <= 0:
        return jsonify({"msg": "Invalid amount"}), 400

    bank = Bank.query.first()
    if not bank:
        return jsonify({"msg": "Bank not set up yet"}), 400

    bank.total_supply += amount

    currency_op = CurrencyOperation(
        operation_type='mint',
        amount=amount,
        reason=reason,
        user_id=current_user_id
    )

    db.session.add(bank)
    db.session.add(currency_op)
    db.session.commit()

    log_audit("currency_minted", "bank", bank.id, current_user_id, {
        "amount": amount,
        "reason": reason,
        "new_total_supply": bank.total_supply
    })

    return jsonify({
        "id": currency_op.id,
        "amount": amount,
        "new_total_supply": bank.total_supply,
        "created_at": currency_op.created_at.isoformat()
    }), 201


# noinspection DuplicatedCode
@app.route('/api/currency/burn', methods=['POST'])
@jwt_required()
@admin_required
def burn_currency():
    data = request.get_json()
    current_user_id = get_jwt_identity()

    amount = data.get('amount')
    reason = data.get('reason', '')

    if not amount or amount <= 0:
        return jsonify({"msg": "Invalid amount"}), 400

    bank = Bank.query.first()
    if not bank:
        return jsonify({"msg": "Bank not set up yet"}), 400

    free_pool = bank.total_supply - bank.in_circulation
    if amount > free_pool:
        return jsonify({"msg": f"Cannot burn more than free pool amount ({free_pool})"}), 400

    bank.total_supply -= amount

    currency_op = CurrencyOperation(
        operation_type='burn',
        amount=amount,
        reason=reason,
        user_id=current_user_id
    )

    db.session.add(bank)
    db.session.add(currency_op)
    db.session.commit()

    log_audit("currency_burned", "bank", bank.id, current_user_id, {
        "amount": amount,
        "reason": reason,
        "new_total_supply": bank.total_supply
    })

    return jsonify({
        "id": currency_op.id,
        "amount": amount,
        "new_total_supply": bank.total_supply,
        "created_at": currency_op.created_at.isoformat()
    }), 201


# Leaderboard
@app.route('/api/leaderboard', methods=['GET'])
@jwt_required()
def get_leaderboard():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)

    # Get active wallets sorted by balance
    wallets = Wallet.query.filter_by(status='active') \
        .order_by(Wallet.balance.desc()) \
        .paginate(page=page, per_page=limit, error_out=False)

    return jsonify({
        "leaderboard": [{
            "wallet_id": w.id,
            "name": w.name,
            "balance": w.balance,
            "rank": idx + 1 + ((page - 1) * limit)
        } for idx, w in enumerate(wallets.items)],
        "pagination": {
            "total": wallets.total,
            "page": page,
            "limit": limit
        }
    }), 200


# User Management
@app.route('/api/users/password-reset-request', methods=['POST'])
@jwt_required()
@user_or_admin_required
def request_password_reset():
    data = request.get_json()
    current_user_id = get_jwt_identity()

    user_id = data.get('user_id')
    reason = data.get('reason', '')

    # Check if user exists
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    # Check if there's already a pending request
    existing_request = PasswordResetRequest.query.filter_by(
        user_id=user_id,
        status='pending'
    ).first()

    if existing_request:
        return jsonify({"msg": "Password reset already requested"}), 400

    reset_request = PasswordResetRequest(
        user_id=user_id,
        reason=reason
    )

    db.session.add(reset_request)
    db.session.commit()

    log_audit("password_reset_requested", "user", user_id, current_user_id, {
        "reason": reason
    })

    return jsonify({
        "id": reset_request.id,
        "status": reset_request.status,
        "created_at": reset_request.created_at.isoformat()
    }), 201


@app.route('/api/users/password-reset/<request_id>', methods=['PATCH'])
@jwt_required()
@admin_required
def process_password_reset(request_id):
    data = request.get_json()
    current_user_id = get_jwt_identity()

    reset_request = PasswordResetRequest.query.get(request_id)
    if not reset_request:
        return jsonify({"msg": "Reset request not found"}), 404

    status = data.get('status')
    reason = data.get('reason', '')

    if status not in ['approved', 'rejected']:
        return jsonify({"msg": "Invalid status"}), 400

    if reset_request.status != 'pending':
        return jsonify({"msg": f"Request already {reset_request.status}"}), 400

    reset_request.status = status

    # If approved, reset the password
    if status == 'approved':
        user = User.query.get(reset_request.user_id)
        if user:
            new_password = str(uuid.uuid4())
            user.set_password(new_password)
            db.session.add(user)
            # In a real app, you would send this password to the user securely
            reset_request.details = {"new_password": new_password}

    db.session.add(reset_request)
    db.session.commit()

    log_audit("password_reset_processed", "password_reset_request", reset_request.id, current_user_id, {
        "status": status,
        "reason": reason
    })

    return jsonify({
        "id": reset_request.id,
        "status": reset_request.status,
        "updated_at": reset_request.updated_at.isoformat()
    }), 200


# Audit Logs
@app.route('/api/logs/audit', methods=['GET'])
@jwt_required()
@admin_required
def get_audit_logs():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)

    logs = AuditLog.query.order_by(AuditLog.created_at.desc()) \
        .paginate(page=page, per_page=limit, error_out=False)

    return jsonify({
        "logs": [{
            "id": log.id,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "user_id": log.user_id,
            "details": log.details,
            "created_at": log.created_at.isoformat()
        } for log in logs.items],
        "pagination": {
            "total": logs.total,
            "page": page,
            "limit": limit
        }
    }), 200


# CLI Commands
@app.cli.command("create-admin")
def create_admin_command():
    """Create an admin user."""

    @click.option('--username', prompt=True, help='Admin username')
    @click.option('--password', prompt=True, hide_input=True, confirmation_prompt=True, help='Admin password')
    def create_admin(username, password):
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            click.echo(f"User {username} already exists.")
            return

        admin = User(
            username=username,
            role='admin'
        )
        admin.set_password(password)

        db.session.add(admin)
        db.session.commit()

        click.echo(f"Admin user {username} created successfully.")

    return create_admin


if __name__ == '__main__':
    app.run(debug=True)
