(async function () {
    await sessionReady;

    const [clubs, events] = await Promise.all([
        Api.getClubs(),
        Api.getEvents()
    ]);

    const user = Session.user;
    const organiserOf = (user?.organiserOf || []).map(Number);

    // Find the communities this user organises
    const yourClubs = clubs.filter(c => organiserOf.includes(Number(c.id)));

    // Generate community cards
    function renderClubs(list, container) {
        container.innerHTML = list.length
            ? list.map(c => {
                const n = events.filter(e =>
                    e.team === c.name &&
                    !['ended', 'cancelled'].includes(eventStatus(e).key)
                ).length;

                return `
                    <article class="card">
                        <p class="card__label">
                            <span>${esc(c.category)}</span>
                        </p>
                        <h3 class="card__title">${esc(c.name)}</h3>
                        <p class="card__meta">${esc(c.description)}</p>
                        <p class="card__meta">
                            ${n} upcoming event${n === 1 ? '' : 's'}
                        </p>
                        <a class="btn" href="events.html?q=${encodeURIComponent(c.name)}">
                            View events
                        </a>
                    </article>
                `;
            }).join('')
            : '<p class="muted">No communities to display.</p>';
    }

    const allContainer = $('#clubs');
    const yourContainer = $('#your-clubs');
    const tabs = $('#community-tabs');
    const yourSection = $('#your-communities');
    const allSection = $('#all-communities');

    renderClubs(clubs, allContainer);

    // Organisers get the additional tab
    if (yourClubs.length) {
        renderClubs(yourClubs, yourContainer);

        tabs.hidden = false;
        yourSection.hidden = false;
        allSection.hidden = true;

        const tabButtons = document.querySelectorAll('[data-tab]');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const selected = button.dataset.tab;

                // Toggle sections
                yourSection.hidden = selected !== 'yours';
                allSection.hidden = selected !== 'all';

                // Update active tab styling
                tabButtons.forEach(tab => {
                    tab.classList.toggle(
                        'active',
                        tab.dataset.tab === selected
                    );
                });
            });
        });
    }
})();