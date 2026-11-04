# afterclass: MIT Manipal events (Flask + MySQL + vanilla JS)

## Layout
app.py (entry) · database.py (MySQL helpers) · auth.py (register/verify/login/me) · events.py (events, teams, saved, interested)
academic.py (calendar API) · schema.sql · seed.sql · seed_academic.sql · requirements.txt · frontend/ (HTML, css/, js/, served by Flask)

## Run locally
1. Install Python 3.10+ and MySQL 8 (or MariaDB 10.6+). Start the MySQL server.
2. `mysql -u root -p < schema.sql` then `mysql -u root -p afterclass < seed.sql`
3. `python -m venv venv`, then `source venv/bin/activate` (Windows: `venv\Scripts\activate`)
4. `pip install -r requirements.txt`
5. Set the DB password (and optionally others), then run:
   `export DB_PASSWORD=yourpass` (Windows PowerShell: `$env:DB_PASSWORD="yourpass"`)
   `python app.py`  → open http://127.0.0.1:5000
   Optional env vars: DB_HOST, DB_PORT, DB_USER, DB_NAME, SECRET_KEY, COOKIE_SECURE=1, DEV_SHOW_OTP=0, TZ_OFFSET_MIN (default 330 = IST)

## Try it
Open the site, sign up (9-digit reg number, @learner.manipal.edu email). Without email delivery, the 6-digit code is shown on screen and printed in the Flask console.
Then save/mark events. Check the DB: `SELECT * FROM saved_events;`. The pending "Robotics Open House" must NOT appear publicly.

## Endpoints (prefix /api)
POST register · POST verify-email · POST login · POST logout · GET me
GET events (q, category, tag, team, from, to, mode, free, past, weekend, sort) · GET events/<id> · GET categories · GET teams · GET academic-events (from, to)
POST|DELETE events/<id>/save · POST|DELETE events/<id>/interest · GET saved-events · GET interested-events

## Not implemented yet
Organiser verification + event submission/editing, admin moderation/team/statistics, admin form to add academic events (add them with SQL for now; optional `seed_academic.sql` adds 4 placeholder rows), event reports.
(Their tables exist in schema.sql.) Email delivery is simulated: the OTP is logged / returned in dev mode.

```sh
$ flask --app app routes
Endpoint                  Methods       Rule
------------------------  ------------  -----------------------------------
academic.academic_events  GET           /api/academic-events
auth.login                POST          /api/login
auth.logout               POST          /api/logout
auth.me                   GET           /api/me
auth.register             POST          /api/register
auth.verify_email         POST          /api/verify-email
events.categories         GET           /api/categories
events.get_event          GET           /api/events/<int:event_id>
events.interest           DELETE, POST  /api/events/<int:event_id>/interest
events.interested_events  GET           /api/interested-events
events.list_events        GET           /api/events
events.save               DELETE, POST  /api/events/<int:event_id>/save
events.saved_events       GET           /api/saved-events
events.teams              GET           /api/teams
index                     GET           /
static                    GET           /<path:filename>
```