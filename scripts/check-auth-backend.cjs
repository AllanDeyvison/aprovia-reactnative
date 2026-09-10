// Real backend integration check. Creates and deletes only its own temporary user.
const axios = require('axios');
const { randomUUID } = require('node:crypto');
const assert = require('node:assert/strict');
process.loadEnvFile('.env');
const baseURL = process.env.EXPO_PUBLIC_AUTH_API;
const parsed = new URL(baseURL);
assert(!parsed.username && !parsed.password && !parsed.search);
const client = axios.create({ baseURL, timeout: 10000, validateStatus: () => true });
const suffix = randomUUID().replaceAll('-', '');
const account = { username: `authcheck_${suffix}`, password: `Test9_${randomUUID()}`,
  name: 'Teste', lastname: 'Autenticacao', email: `authcheck_${suffix}@example.invalid`, birthday: '2000-01-15' };
let id;
let token;
function record(label, method, route, response) {
  const body = response.data;
  console.log(JSON.stringify({ label, method, url: new URL(route, baseURL).href,
    status: response.status, body: body === '' ? '' : {
      fields: body && typeof body === 'object' ? Object.keys(body) : [],
      id: Number.isInteger(body?.id) ? body.id : undefined,
      token: typeof body?.token === 'string' ? '[REDACTED]' : undefined,
      password: typeof body?.password === 'string' ? '[REDACTED]' : undefined,
      otherValues: '[REDACTED]' } }));
}
(async () => {
  try {
    const signup = await client.post('/user/signup', account);
    record('signup', 'POST', '/user/signup', signup);
    assert.equal(signup.status, 200); id = signup.data.id;
    assert(Number.isInteger(id)); assert(!signup.data.token);
    const login = await client.post('/user/login', { username: account.username, password: account.password });
    record('login', 'POST', '/user/login', login);
    assert.equal(login.status, 200); token = login.data.token;
    assert(/^Bearer \S+$/.test(token)); assert.equal(login.data.id, id);
    const invalid = await client.post('/user/login', { username: account.username, password: randomUUID() });
    record('invalid password', 'POST', '/user/login', invalid);
    assert([401, 403].includes(invalid.status));
    const duplicate = await client.post('/user/signup', account);
    record('duplicate', 'POST', '/user/signup', duplicate); assert.equal(duplicate.status, 409);
    const profile = await client.get(`/user/${id}`, { headers: { Authorization: token } });
    record('Bearer accepted', 'GET', `/user/${id}`, profile); assert.equal(profile.status, 200);
    const cors = await client.options('/user/login', { headers: { Origin: 'http://localhost:8081',
      'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type,authorization' } });
    record('CORS preflight', 'OPTIONS', '/user/login', cors);
    assert.equal(cors.status, 200); assert(['*', 'http://localhost:8081'].includes(cors.headers['access-control-allow-origin']));
    console.log('PASS: real signup, login, wrong password, duplicate, Bearer and CORS preflight.');
  } finally {
    if (id && token) {
      const cleanup = await client.delete(`/user/${id}`, { headers: { Authorization: token } });
      record('temporary account cleanup', 'DELETE', `/user/${id}`, cleanup);
      assert(cleanup.status >= 200 && cleanup.status < 300);
    } else if (id) console.log('Temporary account needs cleanup; id=' + id);
  }
})().catch(error => { console.error(JSON.stringify({ result: 'FAIL', code: error.code || 'ASSERTION',
  status: error.response?.status || null })); process.exitCode = 1; });
