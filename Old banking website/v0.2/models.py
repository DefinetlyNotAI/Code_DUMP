from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Settings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    bank_name = db.Column(db.String(100), nullable=False)
    currency_name = db.Column(db.String(100), nullable=False)
    rules = db.Column(db.JSON)
    max_currency = db.Column(db.Float, default=0)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    wallet_name = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    current_currency = db.Column(db.Float, default=0)
    frozen = db.Column(db.Boolean, default=False)


class Log(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    action = db.Column(db.String(100))
    detail = db.Column(db.Text)
    timestamp = db.Column(db.String(50))
    private_level = db.Column(db.String(10))  # Global, Private, Admin


class RequestBacklog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    request_type = db.Column(db.String(50))
    ticket_uuid = db.Column(db.String(128), unique=True)
    timestamp = db.Column(db.String(50))
    category = db.Column(db.String(50))
    status = db.Column(db.String(50))
    reason = db.Column(db.Text)
