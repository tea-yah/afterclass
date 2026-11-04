"""MySQL access. Configure with environment variables (see README). All SQL uses %s placeholders."""
import os
from datetime import datetime, timedelta, timezone
import mysql.connector
from flask import g


def get_db():
    if 'db' not in g:   # one connection per request; swap for a pool later if needed
        g.db = mysql.connector.connect(
            host=os.environ.get('DB_HOST', 'localhost'), port=int(os.environ.get('DB_PORT', '3306')),
            user=os.environ.get('DB_USER', 'afterclass'), password=os.environ.get('DB_PASSWORD', 'AFTERCLASS'),
            database=os.environ.get('DB_NAME', 'afterclass'), charset='utf8mb4')
    return g.db


def query(sql, args=(), one=False):
    cur = get_db().cursor(dictionary=True)
    cur.execute(sql, args)
    rows = cur.fetchall()
    cur.close()
    return (rows[0] if rows else None) if one else rows


def execute(sql, args=()):
    """Run INSERT/UPDATE/DELETE, commit, return (lastrowid, rowcount)."""
    db = get_db()
    cur = db.cursor()
    try:
        cur.execute(sql, args)
        db.commit()
        return cur.lastrowid, cur.rowcount
    except Exception:
        db.rollback()
        raise
    finally:
        cur.close()


def now():
    """Current campus-local time as a naive datetime (stored datetimes are campus-local, IST by default)."""
    offset = int(os.environ.get('TZ_OFFSET_MIN', '330'))
    return datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=offset)


def init_app(app):
    @app.teardown_appcontext
    def close_db(_exc):
        db = g.pop('db', None)
        if db is not None:
            db.close()
