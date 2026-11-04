(async function () {
  await sessionReady;
  if (Session.isOrganiser) $('#list-slot').innerHTML = '<button class="btn btn--primary" type="button" data-soon>List event</button>';
  const params = new URLSearchParams(location.search);
  const el = id => document.getElementById(id);
  const state = { cat: params.get('category') || '' };
  el('f-q').value = params.get('q') || '';
  const categories = (await Api.getCategories()).map(category => ({ category }));

  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  function dateParams() {   // the quick presets become from/to dates; the server does the filtering
    const date = el('f-date').value, when = el('f-when').value, now = new Date(), week = new Date(now.getTime() + 7 * 864e5);
    if (date) return { from: date, to: date };
    if (when === 'today') return { from: iso(now), to: iso(now) };
    if (when === 'week') return { from: iso(now), to: iso(week) };
    if (when === 'weekend') return { from: iso(now), to: iso(week), weekend: 1 };
    if (when === 'month') return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: iso(new Date(now.getFullYear(), now.getMonth() + 1, 0)) };
    return {};
  }

  let seq = 0, timer;
  async function render() {
    const mine = ++seq;
    const p = { q: el('f-q').value.trim(), category: state.cat, mode: el('f-mode').value, free: el('f-free').checked ? 1 : '', past: el('f-past').checked ? 1 : '', sort: el('f-sort').value, ...dateParams() };
    let list;
    try { list = await Api.getEvents(p); }
    catch (err) { el('results').innerHTML = `<div class="empty"><h2>Couldn't load events</h2><p class="muted">${esc(err.message)}</p></div>`; return; }
    if (mine !== seq) return;   // ignore out-of-date responses
    el('category-chips').innerHTML = chipsFor(categories, state.cat, false);
    el('count').textContent = `${list.length} event${list.length === 1 ? '' : 's'} found`;
    el('results').innerHTML = list.length ? list.map(eventCard).join('') :
      `<div class="empty"><h2>Nothing matches yet</h2><p class="muted">Try a different keyword, widen the dates, or clear your filters.</p>
       <button class="btn btn--primary" type="button" id="empty-reset">Clear filters</button></div>`;
  }

  function reset() {
    state.cat = ''; el('f-q').value = ''; el('f-when').value = 'any'; el('f-date').value = ''; el('f-mode').value = '';
    el('f-free').checked = false; el('f-past').checked = false; el('f-sort').value = 'asc'; render();
  }

  document.querySelector('.filters').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(render, 250); });
  el('f-sort').addEventListener('change', render);
  el('f-reset').addEventListener('click', reset);
  el('results').addEventListener('click', e => { if (e.target.id === 'empty-reset') reset(); });
  el('category-chips').addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if (b) { state.cat = b.dataset.cat; render(); } });
  render();
})();
