/* SHARED HELPERS & COMPONENTS (used by every page) */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const BOOKMARK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg>';

/* ---- Dates & derived status ---- */
const startOf = e => new Date(`${e.date}T${e.startTime}:00`);
const endOf = e => { const d = new Date(`${e.date}T${e.endTime}:00`); return d <= startOf(e) ? new Date(d.getTime() + 864e5) : d; };
const fmtTime = t => { const [h, m] = t.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
const fmtDate = (e, long) => startOf(e).toLocaleDateString('en-IN', long ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' } : { weekday: 'short', day: 'numeric', month: 'short' });
const fmtFee = f => (f ? `₹${f}` : 'Free');
/* Lifecycle and registration status are computed by the backend from timestamps. */
const LIFECYCLE_LABELS = { upcoming: 'Upcoming', ongoing: 'Happening now', completed: 'Completed', cancelled: 'Cancelled' };
function eventStatus(e) { return { key: e.lifecycle === 'completed' ? 'ended' : e.lifecycle, label: LIFECYCLE_LABELS[e.lifecycle] }; }
function registrationStatus(e) {
  return e.registrationStatus === 'open' ? { open: true, label: 'Open' }
    : e.registrationStatus === 'not_required' ? { open: false, label: 'No registration needed' } : { open: false, label: 'Closed' };
}

/* ---- Toast ---- */
let toastTimer;
function toast(msg) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); }
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 2200);
}

/* ---- Share (Web Share API, with copy-link fallback) ---- */
async function shareEvent(e) {
  const url = new URL(`event.html?id=${e.id}`, location.href).href;
  if (navigator.share) { try { await navigator.share({ title: e.title, url }); return; } catch (err) { if (err.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(url); toast('Link copied'); }
  catch { prompt('Copy this link:', url); }
}

/* ---- Components ---- */
/* Session comes from the Flask backend (cookie-based). The frontend only hides buttons;
   Flask re-checks permissions on every request. */
const Session = {
  user: null,
  get isOrganiser() { return !!(this.user && this.user.organiserOf.length); },
  get isAdmin() { return !!this.user && this.user.role === 'admin'; }
};
const sessionReady = Api.getMe().then(u => { Session.user = u; }).catch(() => {});


function renderChrome() {
    const page = document.body.dataset.page;
    const user = Session.user;

    const link = (href, label, key) =>
        `<a href="${href}" ${page === key ? 'aria-current="page"' : ''} ${href === '#' ? 'data-soon' : ''}>${label}</a>`;

    const initials = user
        ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        : '';

    let avatar = '';

    if (user) {
        if (user.profilePicture) {
            avatar = `<img src="${esc(user.profilePicture)}" alt="${esc(user.name)}">`;
        } else {
            avatar = esc(initials);
        }
    }

    const actions = user
        ? `${Session.isOrganiser ? '<button class="btn btn--primary" type="button" data-soon>List event</button>' : ''}
           <a class="avatar" href="profile.html" title="${esc(user.name)}" aria-label="Your events">${avatar}</a>
           <button class="btn btn--ghost" type="button" id="signout">Sign out</button>`
        : '<a class="btn" href="signin.html">Sign in</a><a class="btn btn--primary" href="signup.html">Sign up</a>';

    // Render header
    $('#site-header').innerHTML = `
        <div class="site-header__inner">
            <a class="brand" href="index.html">after<span>class</span></a>
            <nav class="nav" aria-label="Main">
                ${user ? link('profile.html', 'Dashboard', 'saved') : link('index.html', 'Home', 'home')}
                ${link('events.html', 'Events', 'explore')}
                ${link('communities.html', 'Communities', 'communities')}
                ${link('calendar.html', 'Calendar', 'calendar')}
            </nav>
            <div class="site-header__actions">
                <label class="visually-hidden" for="campus">Campus</label>
                <select id="campus"><option>MIT Manipal</option></select>
                ${actions}
            </div>
        </div>`;

    const out = $('#signout');
    if (out) {
        out.addEventListener('click', () =>
            Api.logout().finally(() => {
                location.href = 'index.html';
            })
        );
    }

    // Render footer
    $('#site-footer').innerHTML = `
        <div class="site-footer__inner">
            <p>© 2026 afterclass. Prototype with placeholder data for MIT Manipal.</p>
            <p>Less FOMO. More real life.</p>
        </div>`;
}


function eventCard(e) {
  const st = eventStatus(e), d = startOf(e), saved = !!e.saved, dim = ['ended', 'cancelled'].includes(st.key);
  const badge = st.key === 'upcoming' ? '' : `<span class="pill ${st.key === 'ongoing' ? 'pill--ok' : 'pill--warn'}">${st.label}</span>`;
  return `<article class="card ${dim ? 'is-muted' : ''}">
    <div class="card__top">
      <div class="card__date"><span>${d.toLocaleDateString('en-IN', { month: 'short' })}</span><strong>${d.getDate()}</strong></div>
      <button class="icon-btn" type="button" data-save="${e.id}" aria-pressed="${saved}" aria-label="Save ${esc(e.title)}">${BOOKMARK}</button>
    </div>
    <p class="card__label"><span>${esc(e.category)}</span><b>${fmtFee(e.registrationFee)}</b></p>
    <h3 class="card__title"><a href="event.html?id=${e.id}">${esc(e.title)}</a></h3>
    <p class="card__meta">${fmtDate(e)}, ${fmtTime(e.startTime)}</p>
    <p class="card__meta">${esc(e.venue)}</p>
    ${badge}
  </article>`;
}

/* Save / Attending: persisted in MySQL via the API (signed-in users only) */
document.addEventListener('click', async ev => {
  const btn = ev.target.closest('[data-save], [data-interested], [data-soon]');
  if (!btn) return;
  if (btn.hasAttribute('data-soon')) { ev.preventDefault(); return toast('Coming in a later stage'); }
  if (!Session.user) { toast('Sign in to save events and mark interest'); setTimeout(() => { location.href = 'signin.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search); }, 900); return; }
  const isSave = btn.hasAttribute('data-save'), id = Number(btn.dataset.save || btn.dataset.interested);
  const turnOn = btn.getAttribute('aria-pressed') !== 'true';
  try { await (isSave ? Api.saveEvent(id, turnOn) : Api.interestEvent(id, turnOn)); } catch (err) { return toast(err.message); }
  document.querySelectorAll(isSave ? `[data-save="${id}"]` : `[data-interested="${id}"]`).forEach(b => b.setAttribute('aria-pressed', turnOn));
  toast(isSave ? (turnOn ? 'Event saved' : 'Removed from saved') : (turnOn ? 'Marked as attending' : 'No longer attending'));
});

function chipsFor(events, activeCat, asLinks) {
  const cats = [...new Set(events.map(e => e.category))].sort();
  return (asLinks ? cats : ['', ...cats]).map(c => asLinks
    ? `<a class="chip" href="events.html?category=${encodeURIComponent(c)}">${esc(c)}</a>`
    : `<button class="chip" type="button" data-cat="${esc(c)}" aria-pressed="${c === activeCat}">${c || 'All events'}</button>`).join('');
}

document.addEventListener('DOMContentLoaded', () => sessionReady.then(renderChrome));
