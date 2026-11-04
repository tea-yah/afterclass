(async function () {
  const events = (await Api.getEvents()).filter(e => ['upcoming', 'ongoing'].includes(eventStatus(e).key)).sort((a, b) => startOf(a) - startOf(b));
  $('#featured').innerHTML = events.slice(0, 2).map(e => `<a class="feature" href="event.html?id=${e.id}">
    <p>${esc(e.category)}, ${fmtDate(e)}</p><h3>${esc(e.title)}</h3>
    <p>${fmtTime(e.startTime)}, ${esc(e.venue)}, ${fmtFee(e.registrationFee)}</p></a>`).join('');
  $('#category-chips').innerHTML = chipsFor(events, '', true);
  $('#upcoming').innerHTML = events.slice(0, 8).map(eventCard).join('');
})();
