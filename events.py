"""Public event browsing, teams, and per-user saved / interested events."""
from datetime import date
from flask import Blueprint, jsonify, request
from auth import current_user, fail, login_required
from database import execute, now, query

bp = Blueprint('events', __name__)
VISIBLE = "e.approval_status='approved' AND e.event_status<>'cancelled'"   # what visitors may see
SELECT = f"""
SELECT e.*, t.name AS team_name,
  (SELECT GROUP_CONCAT(tg.tag_name ORDER BY tg.tag_name SEPARATOR ',') FROM event_tags et JOIN tags tg ON tg.tag_id=et.tag_id WHERE et.event_id=e.event_id) AS tag_list,
  (SELECT COUNT(*) FROM interested_events i WHERE i.event_id=e.event_id) AS interested_count,
  EXISTS(SELECT 1 FROM saved_events s WHERE s.event_id=e.event_id AND s.user_id=%s) AS is_saved,
  EXISTS(SELECT 1 FROM interested_events i2 WHERE i2.event_id=e.event_id AND i2.user_id=%s) AS is_interested
FROM events e JOIN teams t ON t.team_id=e.team_id
"""


def lifecycle(r, n):   # derived from timestamps; cancellation is the only manual state
    if r['event_status'] == 'cancelled': return 'cancelled'
    if n < r['start_datetime']: return 'upcoming'
    return 'ongoing' if n <= r['end_datetime'] else 'completed'


def registration(r, n):   # closes automatically when the event starts
    if r['event_status'] == 'cancelled' or n >= r['start_datetime']: return 'closed'
    return 'open' if r['registration_required'] else 'not_required'


def serialize(r):
    n, fee = now(), float(r['registration_fee'])
    return {'id': r['event_id'], 'title': r['title'], 'description': r['description'], 'team': r['team_name'], 'teamId': r['team_id'],
            'category': r['category'], 'tags': r['tag_list'].split(',') if r['tag_list'] else [],
            'date': r['start_datetime'].strftime('%Y-%m-%d'), 'startTime': r['start_datetime'].strftime('%H:%M'), 'endTime': r['end_datetime'].strftime('%H:%M'), 'endDate': r['end_datetime'].strftime('%Y-%m-%d'),
            'venue': r['venue'] or ('Online' if r['event_mode'] == 'online' else 'Venue to be announced'),
            'eventMode': r['event_mode'], 'registrationFee': int(fee) if fee.is_integer() else fee,
            'registrationRequired': bool(r['registration_required']), 'externalLink': r['external_link'] or '',
            'status': r['event_status'], 'approvalStatus': r['approval_status'],
            'lifecycle': lifecycle(r, n), 'registrationStatus': registration(r, n),
            'interestedCount': r['interested_count'], 'saved': bool(r['is_saved']), 'interested': bool(r['is_interested'])}


def uid():
    u = current_user()
    return u['user_id'] if u else None


def parse_date(s):
    try: return date.fromisoformat(s)
    except (TypeError, ValueError): return None


@bp.get('/events')
def list_events():
    a = request.args
    where, args = [VISIBLE], []
    if a.get('past') != '1': where.append('e.end_datetime >= %s'); args.append(now())
    if a.get('q', '').strip():
        like = '%' + a['q'].strip()[:80].replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_') + '%'
        where.append('(e.title LIKE %s OR e.description LIKE %s OR t.name LIKE %s OR EXISTS(SELECT 1 FROM event_tags x JOIN tags g ON g.tag_id=x.tag_id WHERE x.event_id=e.event_id AND g.tag_name LIKE %s))')
        args += [like] * 4
    if a.get('category'): where.append('e.category=%s'); args.append(a['category'])
    if a.get('tag'): where.append('EXISTS(SELECT 1 FROM event_tags x JOIN tags g ON g.tag_id=x.tag_id WHERE x.event_id=e.event_id AND g.tag_name=%s)'); args.append(a['tag'])
    if a.get('team', '').isdigit(): where.append('e.team_id=%s'); args.append(int(a['team']))
    if a.get('mode') in ('online', 'offline', 'hybrid'): where.append('e.event_mode=%s'); args.append(a['mode'])
    if a.get('free') == '1': where.append('e.registration_fee=0')
    if a.get('weekend') == '1': where.append('DAYOFWEEK(e.start_datetime) IN (1,7)')
    for key, op in (('from', '>='), ('to', '<=')):
        d = parse_date(a.get(key))
        if d: where.append(f'DATE(e.start_datetime) {op} %s'); args.append(d)
    order = 'DESC' if a.get('sort') == 'desc' else 'ASC'   # whitelisted, never interpolated from input
    rows = query(f"{SELECT} WHERE {' AND '.join(where)} ORDER BY e.start_datetime {order} LIMIT 200", [uid(), uid(), *args])
    return jsonify([serialize(r) for r in rows])


@bp.get('/events/<int:event_id>')
def get_event(event_id):
    r = query(f'{SELECT} WHERE e.event_id=%s', (uid(), uid(), event_id), one=True)
    u = current_user()
    visible = r and r['approval_status'] == 'approved' and r['event_status'] != 'cancelled'
    if not r or not (visible or (u and (u['role'] == 'admin' or r['created_by'] == u['user_id']))):
        return fail('Event not found.', 404)
    return jsonify(serialize(r))


@bp.get('/categories')
def categories():
    rows = query(f'SELECT DISTINCT e.category FROM events e WHERE {VISIBLE} ORDER BY e.category')
    return jsonify([r['category'] for r in rows])


@bp.get('/teams')
def teams():
    return jsonify([{'id': t['team_id'], 'name': t['name'], 'category': t['type'], 'description': t['description']}
                    for t in query('SELECT team_id, name, type, description FROM teams ORDER BY name')])


# ---- saved / interested (always scoped to the signed-in user from the session) ----
TABLES = {'save': 'saved_events', 'interest': 'interested_events'}


def toggle(kind, event_id):
    table = TABLES[kind]   # whitelist: table name never comes from the request
    if not query(f'SELECT 1 FROM events e WHERE e.event_id=%s AND {VISIBLE}', (event_id,), one=True):
        return fail('Event not found.', 404)
    if request.method == 'POST': execute(f'INSERT IGNORE INTO {table} (user_id, event_id) VALUES (%s,%s)', (uid(), event_id))
    else: execute(f'DELETE FROM {table} WHERE user_id=%s AND event_id=%s', (uid(), event_id))
    count = query('SELECT COUNT(*) AS c FROM interested_events WHERE event_id=%s', (event_id,), one=True)['c']
    return jsonify(on=request.method == 'POST', interestedCount=count)


@bp.route('/events/<int:event_id>/save', methods=['POST', 'DELETE'])
@login_required
def save(event_id): return toggle('save', event_id)


@bp.route('/events/<int:event_id>/interest', methods=['POST', 'DELETE'])
@login_required
def interest(event_id): return toggle('interest', event_id)


def user_events(table):
    rows = query(f'{SELECT} JOIN {table} u ON u.event_id=e.event_id AND u.user_id=%s WHERE {VISIBLE} ORDER BY e.start_datetime', (uid(), uid(), uid()))
    return jsonify([serialize(r) for r in rows])


@bp.get('/saved-events')
@login_required
def saved_events(): return user_events('saved_events')


@bp.get('/interested-events')
@login_required
def interested_events(): return user_events('interested_events')
