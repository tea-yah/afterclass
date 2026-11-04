/* DATA ACCESS LAYER: the only file that talks to the Flask backend (/api/...). */
async function request(path, { method = 'GET', body, params } = {}) {
  const qs = params ? new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString() : '';
  const res = await fetch('/api' + path + (qs ? '?' + qs : ''), {
    method, credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
    body: body ? JSON.stringify(body) : undefined
  });
  let data = null; try { data = await res.json(); } catch {}
  if (!res.ok) { const err = new Error((data && data.error) || 'Something went wrong'); Object.assign(err, { status: res.status, code: data && data.code, fields: data && data.fields }); throw err; }
  return data;
}
const Api = {
  getMe: async () => (await request('/me')).user,
  register: body => request('/register', { method: 'POST', body }),
  verifyEmail: body => request('/verify-email', { method: 'POST', body }),
  login: body => request('/login', { method: 'POST', body }),
  logout: () => request('/logout', { method: 'POST' }),
  getEvents: params => request('/events', { params }),
  getEvent: async id => { try { return await request('/events/' + encodeURIComponent(id)); } catch (e) { if (e.status === 404) return null; throw e; } },
  getCategories: () => request('/categories'),
  getClubs: () => request('/teams'),
  saveEvent: (id, on) => request(`/events/${id}/save`, { method: on ? 'POST' : 'DELETE' }),
  interestEvent: (id, on) => request(`/events/${id}/interest`, { method: on ? 'POST' : 'DELETE' }),
  getAcademicEvents: params => request('/academic-events', { params }),
  getSaved: () => request('/saved-events'),
  getInterested: () => request('/interested-events')
};
