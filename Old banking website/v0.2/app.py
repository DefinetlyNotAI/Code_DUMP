from flask import Flask

from config import Config
from models import db
from routes import setup, get, transfer, request, admin


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)

    with app.app_context():
        db.create_all()

    app.register_blueprint(setup.bp)
    app.register_blueprint(get.bp)
    app.register_blueprint(transfer.bp)
    app.register_blueprint(request.bp)
    app.register_blueprint(admin.bp)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
