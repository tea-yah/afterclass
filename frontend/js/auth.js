/* Sign in / sign up. Validation here is for user feedback only;
   the Flask backend must re-validate everything and send the real verification email. */
(function () {
  const form = $('#auth-form'), mode = document.body.dataset.page; // 'signin' | 'signup'
  const RULES = {
    name: [/^[A-Za-z][A-Za-z .'-]{1,59}$/, "Enter your full name (letters, spaces, . ' - only)."],
    regNo: [/^\d{9}$/, 'Registration number must be exactly 9 digits.'],
    email: [/^[a-z0-9._%+-]+@(learner\.)?manipal\.edu$/i, 'Use your Manipal email (ending in manipal.edu).'],
    password: [/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$/, 'Use 8+ characters with upper-case, lower-case and a number.'],
    code: [/^\d{6}$/, 'Enter the 6-digit code.']
  };
  const FIELDS = {
    signup: [['name', 'Full name', 'text', 'name'], ['regNo', 'Registration number', 'text', 'username'], ['email', 'Manipal email', 'email', 'email'], ['password', 'Password', 'password', 'new-password']],
    signin: [['regNo', 'Registration number', 'text', 'username'], ['password', 'Password', 'password', 'current-password']]
  };
  const params = new URLSearchParams(location.search);
  const next = /^[\w-]+\.html(\?[\w=&%.-]*)?$/.test(params.get('next') || '') ? params.get('next') : 'index.html';
  const banner = $('#auth-banner');
  if (banner && params.get('next')) { banner.hidden = false; banner.textContent = 'Sign in to continue.'; }

  const val = id => (id === 'password' ? $('#password').value : $('#' + id).value.trim());
  const setErr = (id, msg) => { $('#err-' + id).textContent = msg; $('#' + id).setAttribute('aria-invalid', !!msg); };
  const check = ids => ids.map(id => { const ok = RULES[id][0].test(val(id)); setErr(id, ok ? '' : RULES[id][1]); return ok; }).every(Boolean);
  const render = (fields, label) => {
    form.innerHTML = fields.map(([id, text, type, ac]) => `<div class="field"><label for="${id}">${text}</label>
      <input id="${id}" name="${id}" type="${type}" autocomplete="${ac}" aria-describedby="err-${id}" required><p class="error" id="err-${id}" role="alert"></p></div>`).join('')
      + `<button class="btn btn--primary" type="submit">${label}</button>`;
  };

  const showErrors = err => {
    if (err.fields) Object.entries(err.fields).forEach(([id, msg]) => $('#err-' + id) && setErr(id, msg));
    else { const b = $('#form-error'); b.hidden = false; b.textContent = err.message; }
  };
  let pending = null;
  render(FIELDS[mode], mode === 'signup' ? 'Create account' : 'Sign in');
  form.insertAdjacentHTML('afterbegin', '<p id="form-error" class="error" role="alert" hidden></p>');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    $('#form-error').hidden = true;
    const ids = pending ? ['code'] : FIELDS[mode].map(f => f[0]);
    if (!check(ids)) return;   // quick feedback only; the server validates everything again
    try {
      if (pending) { await Api.verifyEmail({ regNo: pending.regNo, code: val('code') }); location.href = next; return; }
      if (mode === 'signin') { await Api.login({ regNo: val('regNo'), password: val('password') }); location.href = next; return; }
      const res = await Api.register({ name: val('name'), regNo: val('regNo'), email: val('email'), password: val('password') });
      pending = { regNo: val('regNo') };
      render([['code', '6-digit verification code', 'text', 'one-time-code']], 'Verify email');
      form.insertAdjacentHTML('afterbegin', `<p class="banner">${res.devCode ? `Dev mode: no email is sent yet. Your code is ${esc(res.devCode)}.` : 'We sent a 6-digit code to your Manipal email.'}</p><p id="form-error" class="error" role="alert" hidden></p>`);
    } catch (err) { showErrors(err); }
  });
})();
