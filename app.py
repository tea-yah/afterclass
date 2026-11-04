"""Flask entry point. Serves the JSON API under /api and the static frontend from ./frontend."""
import os
from datetime import timedelta
from flask import Flask, jsonify, request
import academic, auth, database, events


def create_app():
    app = Flask(__name__, static_folder='frontend', static_url_path='')
    app.config.update(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev-only-change-me'),     # set a long random value in production
        SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE='Lax',
        SESSION_COOKIE_SECURE=os.environ.get('COOKIE_SECURE') == '1',      # set COOKIE_SECURE=1 behind HTTPS
        PERMANENT_SESSION_LIFETIME=timedelta(days=7))
    database.init_app(app)
    app.register_blueprint(auth.bp, url_prefix='/api')
    app.register_blueprint(events.bp, url_prefix='/api')
    app.register_blueprint(academic.bp, url_prefix='/api')

    @app.before_request
    def csrf_guard():   # state-changing API calls must carry a custom header, which cross-site forms cannot send
        if request.path.startswith('/api/') and request.method in ('POST', 'PUT', 'PATCH', 'DELETE') \
                and request.headers.get('X-Requested-With') != 'fetch':
            return jsonify(error='Bad request.'), 400

    @app.route('/')
    def index():
        return app.send_static_file('index.html')

    @app.errorhandler(404)
    def not_found(_e):
        return (jsonify(error='Not found.'), 404) if request.path.startswith('/api/') else ('Page not found', 404)

    @app.errorhandler(Exception)
    def server_error(e):
        if hasattr(e, 'code') and isinstance(e.code, int): return e   # HTTP errors pass through
        app.logger.exception(e)
        return jsonify(error='Server error. Is MySQL running and configured?'), 500
    return app


app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
