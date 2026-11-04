"""Registration, email OTP verification, login/logout, current user. Roles are always read from the DB."""
import os, re, secrets
from datetime import timedelta
from functools import wraps
from flask import Blueprint, g, jsonify, request, session
from mysql.connector import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash
from database import execute, now, query

bp = Blueprint('auth', __name__)

RULES = {  # keep in sync with frontend/js/auth.js (the backend is the one that counts)
    'name': (re.compile(r"^[A-Za-z][A-Za-z .'-]{1,59}$"), "Enter your full name (letters, spaces, . ' - only)."),
    'regNo': (re.compile(r'^\d{9,12}$'), 'Registration number invalid.'),
    'email': (re.compile(r'^[a-z0-9._%+-]{1,64}@(learner\.)?manipal\.edu$', re.I), 'Use your Manipal email (ending in manipal.edu).'),
    'password': (re.compile(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$'), 'Use 8+ characters with upper-case, lower-case and a number.'),
    'code': (re.compile(r'^\d{6}$'), 'Enter the 6-digit code.'),
}


def fail(msg, status=400, **extra):
    return jsonify(error=msg, **extra), status


def body():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def validate(data, names):
    return {n: RULES[n][1] for n in names if not isinstance(data.get(n), str) or not RULES[n][0].match(data[n].strip() if n != 'password' else data[n])}


def current_user():
    if 'user' not in g:
        g.user = None
        uid = session.get('user_id')
        if uid:
            u = query('SELECT user_id, registration_number, name, email, role, profile_picture, is_verified FROM users WHERE user_id=%s', (uid,), one=True)
            if u and u['is_verified']:
                g.user = u
            else:
                session.clear()
    return g.user


def login_required(fn):
    @wraps(fn)
    def wrapper(*a, **kw):
        return fn(*a, **kw) if current_user() else fail('Please sign in.', 401)
    return wrapper


def admin_required(fn):
    @wraps(fn)
    def wrapper(*a, **kw):
        u = current_user()
        if not u: return fail('Please sign in.', 401)
        return fn(*a, **kw) if u['role'] == 'admin' else fail('Admins only.', 403)
    return wrapper


def user_payload(u):
    teams = query("SELECT team_id FROM organisers WHERE user_id=%s AND verification_status='verified'", (u['user_id'],))
    return {'regNo': u['registration_number'], 'name': u['name'], 'email': u['email'], 'role': u['role'],
            'profilePicture': u['profile_picture'], 'organiserOf': [t['team_id'] for t in teams]}   # no password data, ever


def start_session(user_id):
    session.clear()
    session['user_id'] = user_id
    session.permanent = True


@bp.post('/register')
def register():
    d = body()
    errors = validate(d, ['name', 'regNo', 'email', 'password'])
    if errors: return fail('Please fix the highlighted fields.', fields=errors)
    reg, email = d['regNo'].strip(), d['email'].strip().lower()
    execute('DELETE FROM users WHERE is_verified=0 AND (registration_number=%s OR email=%s)', (reg, email))  # unverified accounts can be re-registered
    if query('SELECT 1 FROM users WHERE registration_number=%s', (reg,), one=True):
        return fail('This registration number is already registered.', 409, fields={'regNo': 'This registration number is already registered.'})
    if query('SELECT 1 FROM users WHERE email=%s', (email,), one=True):
        return fail('This email is already registered.', 409, fields={'email': 'This email is already registered.'})
    code = f'{secrets.randbelow(10**6):06d}'
    try:
        execute('INSERT INTO users (registration_number, name, email, password_hash, verification_code_hash, verification_expires) VALUES (%s,%s,%s,%s,%s,%s)',
                (reg, d['name'].strip(), email, generate_password_hash(d['password']), generate_password_hash(code), now() + timedelta(minutes=10)))
    except IntegrityError:
        return fail('That registration number or email is already registered.', 409)
    print(f'[DEV] Verification code for {email}: {code}')   # replace with real email delivery (SMTP) later
    out = {'status': 'verification_pending'}
    if os.environ.get('DEV_SHOW_OTP', '1') == '1':
        out['devCode'] = code                               # set DEV_SHOW_OTP=0 once email delivery exists
    return jsonify(out), 201


@bp.post('/verify-email')
def verify_email():
    d = body()
    errors = validate(d, ['regNo', 'code'])
    if errors: return fail('Invalid details.', fields=errors)
    u = query('SELECT * FROM users WHERE registration_number=%s AND is_verified=0', (d['regNo'].strip(),), one=True)
    if not u or not u['verification_code_hash']: return fail('No pending verification for this account.', 404)
    if u['verification_attempts'] >= 5 or u['verification_expires'] < now():
        return fail('This code has expired. Please sign up again.', 410)
    if not check_password_hash(u['verification_code_hash'], d['code'].strip()):
        execute('UPDATE users SET verification_attempts = verification_attempts + 1 WHERE user_id=%s', (u['user_id'],))
        return fail('That code is incorrect.', 400, fields={'code': 'That code is incorrect.'})
    execute('UPDATE users SET is_verified=1, verification_code_hash=NULL, verification_expires=NULL, verification_attempts=0 WHERE user_id=%s', (u['user_id'],))
    start_session(u['user_id'])
    u['is_verified'] = 1
    return jsonify(user=user_payload(u))


@bp.post('/login')
def login():
    d = body()
    reg, pw = d.get('regNo'), d.get('password')
    if not isinstance(reg, str) or not isinstance(pw, str): return fail('Enter your registration number and password.')
    u = query('SELECT * FROM users WHERE registration_number=%s', (reg.strip(),), one=True)
    if not u or not check_password_hash(u['password_hash'], pw):
        return fail('Invalid registration number or password.', 401)
    if not u['is_verified']:
        return fail('Your email is not verified yet. Sign up again to get a new code.', 403, code='not_verified')
    start_session(u['user_id'])
    return jsonify(user=user_payload(u))


@bp.post('/logout')
def logout():
    session.clear()
    return jsonify(ok=True)


@bp.get('/me')
def me():
    u = current_user()
    return jsonify(user=user_payload(u) if u else None)
