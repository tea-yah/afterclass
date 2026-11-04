(async function () {
  const root = $('#event');
  const e = await Api.getEvent(new URLSearchParams(location.search).get('id'));
  if (!e) { root.innerHTML = '<div class="empty"><h2>Event not found</h2><p class="muted">It may have been removed, or the link is incomplete.</p><a class="btn btn--primary" href="events.html">Browse events</a></div>'; return; }

  document.title = `${e.title} · afterclass`;
  const st = eventStatus(e), reg = registrationStatus(e);
  const saved = !!e.saved, interested = !!e.interested;

  const start = new Date(`${e.date}T${e.startTime}:00`);
  const end = new Date(`${e.endDate}T${e.endTime}:00`);

  const startDate = Date.UTC(
      start.getFullYear(), start.getMonth(), start.getDate()
  );
  const endDate = Date.UTC(
      end.getFullYear(), end.getMonth(), end.getDate()
  );

  const daysLater = Math.round((endDate - startDate) / 86400000);

  const endNote = daysLater > 0
      ? ` (${daysLater === 1 ? 'next day' : `${daysLater} days later`})`
      : '';

  const linkLabel = reg.open ? 'Register' : (!e.registrationRequired && st.key !== 'cancelled' && st.key !== 'ended') ? 'More info' : '';

  root.innerHTML = `<div class="detail">
    <article>
      <p class="eyebrow">${esc(e.category)}</p>
      <h1 class="detail__title">${esc(e.title)}</h1>
      <p class="muted">Organised by ${esc(e.team)}</p>
      <p class="detail__desc">${esc(e.description)}</p>
      <ul class="tags" aria-label="Tags">${e.tags.map(t => `<li>#${esc(t)}</li>`).join('')}</ul>
    </article>
    <aside class="panel" aria-label="Event info">
      <span class="pill ${st.key === 'upcoming' ? '' : st.key === 'ongoing' ? 'pill--ok' : 'pill--warn'}">${st.label}</span>
      <dl class="facts">
        <div><dt>Date</dt><dd>${fmtDate(e, true)}</dd></div>
        <div><dt>Time</dt><dd>${fmtTime(e.startTime)} to ${fmtTime(e.endTime)}${endNote}</dd></div>
        <div><dt>Venue</dt><dd>${esc(e.venue)} (${esc(e.eventMode)})</dd></div>
        <div><dt>Fee</dt><dd>${fmtFee(e.registrationFee)}</dd></div>
        <div><dt>Registration</dt><dd>${reg.label}</dd></div>
        <div><dt>Attending</dt><dd>${e.interestedCount}</dd></div>
      </dl>
      <div class="panel__actions">
        ${linkLabel ? `<a class="btn btn--primary" href="${esc(e.externalLink)}" target="_blank" rel="noopener">${linkLabel}</a>` : ''}
        <button class="btn" type="button" data-save="${e.id}" aria-pressed="${saved}">Save</button>
        <button class="btn" type="button" data-interested="${e.id}" aria-pressed="${interested}">Attend</button>
        <button class="btn" type="button" id="share">Share event</button>
      </div>
    </aside></div>`;
  $('#share').addEventListener('click', () => shareEvent(e));
})();
