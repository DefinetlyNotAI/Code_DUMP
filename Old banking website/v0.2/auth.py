import os

from flask import request, abort
from werkzeug.security import check_password_hash

from models import User


def verify_admin():
    auth = request.authorization
    if not auth or auth.password != os.getenv("ADMIN_PASSWORD"):
        abort(403, description="Invalid admin credentials")


def verify_user(wallet_name):
    auth = request.authorization
    if not auth:
        abort(401, description="User auth required")
    user = User.query.filter_by(wallet_name=wallet_name).first()
    if not user or not check_password_hash(user.password_hash, auth.password):
        abort(403, description="Invalid user credentials")
    return user
