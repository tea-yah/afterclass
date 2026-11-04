"""Academic calendar (admin-entered, independent of student events). Public read-only for now."""
from datetime import date, timedelta
from flask import Blueprint, jsonify, request
from database import query

bp = Blueprint('academic', __name__)


def parse_date(s):
    try: return date.fromisoformat(s)
    except (TypeError, ValueError): return None


@bp.get('/academic-events')
def academic_events():
    d1, d2 = parse_date(request.args.get('from')), parse_date(request.args.get('to'))
    where, args = [], []
    if d2: where.append('start_datetime < %s'); args.append(d2 + timedelta(days=1))   # overlaps the range
    if d1: where.append('end_datetime >= %s'); args.append(d1)
    rows = query('SELECT * FROM academic_events' + (' WHERE ' + ' AND '.join(where) if where else '') + ' ORDER BY start_datetime LIMIT 500', args)
    return jsonify([{'id': r['academic_event_id'], 'title': r['title'], 'description': r['description'] or '', 'category': r['category'],
                     'date': r['start_datetime'].strftime('%Y-%m-%d'), 'startTime': r['start_datetime'].strftime('%H:%M'),
                     'endDate': r['end_datetime'].strftime('%Y-%m-%d'), 'endTime': r['end_datetime'].strftime('%H:%M')} for r in rows])
