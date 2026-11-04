(async function () {
    await sessionReady;

    if (!Session.user) {
        location.replace('signin.html?next=profile.html');
        return;
    }

    const user = Session.user;

    // Profile picture or initials fallback
    const avatar = $('#profile-avatar');
    const initials = user.name
        .split(' ')
        .map(word => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    if (user.profilePicture) {
        avatar.innerHTML = `<img src="${esc(user.profilePicture)}" alt="${esc(user.name)}">`;
    } else {
        avatar.textContent = initials;
    }

    // Basic profile information
    $('#profile-name').textContent = user.name;
    $('#profile-regno').textContent = user.regNo;
    $('#profile-email').textContent = user.email;
    $('#profile-role').textContent =
        user.role === 'admin' ? 'Administrator' :
        user.organiserOf.length ? 'Student · Organiser' :
        'Student';

    // Teams the user is an organiser for
    if (user.organiserOf && user.organiserOf.length) {
      const teams = await Api.getClubs();

      const teamNames = user.organiserOf.map(teamId => {
          const team = teams.find(t => t.id === teamId);
          return team ? team.name : null;
      }).filter(Boolean);

      if (teamNames.length) {
          $('#profile-teams-row').hidden = false;
          $('#profile-teams').textContent = teamNames.join(', ');
      }
  }

    // Load saved and interested events
    const fill = async (sel, load, msg) => {
        const list = await load();
        $(sel).innerHTML = list.length
            ? list.map(eventCard).join('')
            : `<p class="muted">${msg}</p>`;
    };

    await Promise.all([
        fill('#saved', Api.getSaved, 'Nothing saved yet. Tap the bookmark on any event.'),
        fill('#interested', Api.getInterested, 'No events marked as interested yet.')
    ]);
})();
