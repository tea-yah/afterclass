/* Calendar: current month by default. Academic events (amber) come from /api/academic-events;
   student events (violet) are the signed-in user's "interested" events. Saved events are not shown here. */
(async function () {
  await sessionReady;
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = iso(new Date());
  let view = new Date(); view = new Date(view.getFullYear(), view.getMonth(), 1);
  let interested = [];
  if (Session.user) { try { interested = await Api.getInterested(); } catch {} }
  else { const n = $('#cal-note'); n.hidden = false; n.innerHTML = '<a href="signin.html?next=calendar.html">Sign in</a> to see events on your calendar.'; }

  const chip = it => it.href
    ? `<a class="cal__chip cal__chip--${it.kind}" href="${it.href}" title="${esc(it.tip)}">${esc(it.title)}</a>`
    : `<span class="cal__chip cal__chip--${it.kind}" title="${esc(it.tip)}">${esc(it.title)}</span>`;

  async function render() {
    const y = view.getFullYear(), m = view.getMonth(), last = new Date(y, m + 1, 0).getDate();
    const from = iso(view), to = iso(new Date(y, m, last));
    let academic = []; try { academic = await Api.getAcademicEvents({ from, to }); } catch {}
    const byDay = {};
    const add = (kind, e, href) => {   // multi-day events appear on every day they cover
      const tip = `${e.title}, ${fmtTime(e.startTime)} to ${fmtTime(e.endTime)}`;
      for (let d = new Date(e.date + 'T00:00:00'); iso(d) <= e.endDate; d.setDate(d.getDate() + 1)) {
        const k = iso(d); if (k >= from && k <= to) (byDay[k] = byDay[k] || []).push({ kind, title: e.title, tip, href, t: e.startTime });
      }
    };
    academic.forEach(e => add('academic', e));
    interested.forEach(e => add('student', e, `event.html?id=${e.id}`));
    Object.values(byDay).forEach(l => l.sort((a, b) => a.t.localeCompare(b.t)));

    const label = view.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    $('#month').textContent = label;
    const cells = Array.from({ length: view.getDay() }, () => '<td class="is-empty"></td>');  
    for (let d = 1; d <= last; d++) {
      const k = iso(new Date(y, m, d));
      cells.push(`<td class="${k === today ? 'is-today' : ''}"><span class="cal__num">${d}</span>${(byDay[k] || []).map(chip).join('')}</td>`);
    }
    while (cells.length % 7) cells.push('<td class="is-empty"></td>');
    const rows = []; for (let i = 0; i < cells.length; i += 7) rows.push(`<tr>${cells.slice(i, i + 7).join('')}</tr>`);
    const agenda = Object.keys(byDay).sort().map(k => `<li><strong>${new Date(k + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</strong>${byDay[k].map(chip).join('')}</li>`).join('');
    $('#cal').innerHTML = `<table class="cal__table"><caption class="visually-hidden">${label}</caption>
      <thead><tr>${['Sun' , 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `<th scope="col">${d}</th>`).join('')}</tr></thead>
      <tbody>${rows.join('')}</tbody></table>
      <ul class="agenda">${agenda || '<li class="muted">Nothing on the calendar this month.</li>'}</ul>`;
  }
  $('#prev').addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); render(); });
  $('#next').addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); render(); });
  render();
})();
