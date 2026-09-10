// Real browser + real backend. No intercepted responses, mocked sessions or fixture tokens.
const { chromium } = require('../.expo/auth-test-tools/node_modules/playwright');
const { randomUUID } = require('node:crypto');
const assert = require('node:assert/strict');
const axios = require('axios');
process.loadEnvFile('.env');
const base = process.env.AUTH_TEST_WEB_URL || 'http://localhost:8081';
const api = process.env.EXPO_PUBLIC_AUTH_API;
const account = { username: 'webcheck_' + randomUUID().replaceAll('-', '').slice(0, 16),
  password: 'Test9_' + randomUUID(), name: 'Teste', lastname: 'Web',
  email: 'webcheck_' + randomUUID() + '@example.invalid', birthday: '2000-01-15' };
let id, token, browser;
let stage = 'launch';
const events = [];
const record = label => console.log('PASS: ' + label);
(async () => {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(120000);
  page.on('response', response => {
    if (response.url().startsWith(api)) events.push({
      method: response.request().method(), url: response.url(), status: response.status()
    });
  });
  const waitPost = route => page.waitForResponse(r => r.url() === api.replace(/\/$/, '') + route && r.request().method() === 'POST');
  async function signupForm() {
    for (const [label, value] of Object.entries({ 'Nome': account.name, 'Sobrenome': account.lastname,
      'Nome de usuário': account.username, 'Email': account.email,
      'Data de nascimento (YYYY-MM-DD)': account.birthday, 'Senha': account.password,
      'Confirmar Senha': account.password })) {
      await page.getByLabel(label, { exact: true }).fill(value);
    }
  }
  async function login(remember, password = account.password) {
    await page.getByLabel('Nome de usuário', { exact: true }).fill(account.username);
    await page.getByLabel('Senha', { exact: true }).fill(password);
    const checkbox = page.getByRole('checkbox', { name: 'Manter conectado' });
    if ((await checkbox.getAttribute('aria-checked')) !== String(remember)) await checkbox.click();
    const response = waitPost('/user/login');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    const result = await response;
    if (result.status() === 200) token = (await result.json()).token;
    return result;
  }
  try {
    stage = '/home without session';
    await page.goto(base + '/home');
    await page.waitForURL('**/login');
    await page.getByRole('button', { name: 'Entrar', exact: true }).waitFor();
    record('/home sem sessão redireciona ao login');

    stage = 'signup';
    await page.goto(base + '/register');
    await signupForm();
    const signupResponse = waitPost('/user/signup');
    await page.getByRole('button', { name: 'Criar Conta', exact: true }).click();
    const created = await signupResponse;
    assert.equal(created.status(), 200);
    const body = await created.json(); id = body.id; assert(!body.token);
    await page.waitForURL('**/login?registered=1');
    await page.getByText('Conta criada com sucesso. Entre com seu usuário e senha.', { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('aprovia.session.user.v1')), null);
    record('cadastro real 200, sem sessão, mensagem de sucesso no login');

    stage = 'duplicate';
    await page.goto(base + '/register');
    await signupForm();
    const duplicateResponse = waitPost('/user/signup');
    await page.getByRole('button', { name: 'Criar Conta', exact: true }).click();
    assert.equal((await duplicateResponse).status(), 409);
    await page.getByRole('alert').filter({ hasText: 'Usuário ou email pode já existir' }).waitFor();
    record('cadastro duplicado 409 com erro visível');

    stage = 'wrong password';
    await page.goto(base + '/login');
    assert.equal((await login(false, randomUUID())).status(), 401);
    await page.getByRole('alert').filter({ hasText: 'Usuário ou senha inválidos' }).waitFor();
    record('senha inválida 401 com erro visível');

    stage = 'memory login';
    assert.equal((await login(false)).status(), 200);
    await page.waitForURL('**/home');
    await page.getByText('Olá, Teste!', { exact: true }).waitFor();
    const noPersistence = await page.evaluate(() => [
      localStorage.getItem('aprovia.session.user.v1'), localStorage.getItem('aprovia.session.token.v1')
    ]);
    assert.deepEqual(noPersistence, [null, null]);
    await page.goto(base + '/login');
    await page.waitForURL('**/login');
    // A full navigation restarts a memory-only session. Test authenticated route
    // exclusion below with a remembered session instead.
    record('login real desmarcado; nenhuma credencial persistida; reinício exige login');

    stage = 'persistent login';
    assert.equal((await login(true)).status(), 200);
    await page.waitForURL('**/home');
    const persisted = await page.evaluate(() => ({
      user: JSON.parse(localStorage.getItem('aprovia.session.user.v1')),
      token: localStorage.getItem('aprovia.session.token.v1'),
      legacyUser: localStorage.getItem('@aprovia_user'),
      legacyToken: localStorage.getItem('@aprovia_token')
    }));
    assert.deepEqual(Object.keys(persisted.user).sort(), ['id', 'name', 'picture', 'username']);
    assert(persisted.token && !persisted.token.startsWith('Bearer '));
    assert(!JSON.stringify(persisted.user).includes(account.password));
    assert.equal(persisted.legacyUser, null); assert.equal(persisted.legacyToken, null);
    await page.reload();
    await page.getByText('Olá, Teste!', { exact: true }).waitFor();
    assert(events.some(e => e.method === 'GET' && e.url.endsWith('/user/' + id) && e.status === 200));
    record('manter conectado restaura com GET autenticado real; perfil mínimo e token separado');

    await page.goto(base + '/login');
    await page.waitForURL('**/home');
    await page.goto(base + '/register');
    await page.waitForURL('**/home');
    record('sessão autenticada impede acesso a login e cadastro');

    await page.getByRole('button', { name: 'Sair', exact: true }).click();
    await page.waitForURL('**/login');
    assert.deepEqual(await page.evaluate(() => [
      localStorage.getItem('aprovia.session.user.v1'), localStorage.getItem('aprovia.session.token.v1')
    ]), [null, null]);
    await page.goto(base + '/home');
    await page.waitForURL('**/login');
    await page.screenshot({ path: '.expo/auth-login-verified.png', fullPage: true });
    record('logout limpa usuário/token; /home continua protegido após reinício');

    if (process.env.AUTH_TEST_WRONG_URL) {
      stage = 'wrong backend URL';
      await page.goto(process.env.AUTH_TEST_WRONG_URL + '/login');
      await page.getByLabel('Nome de usuário', { exact: true }).fill(account.username);
      await page.getByLabel('Senha', { exact: true }).fill(account.password);
      await page.getByRole('button', { name: 'Entrar', exact: true }).click();
      await page.getByRole('alert').filter({ hasText: 'Não foi possível acessar o servidor' }).waitFor();
      await page.screenshot({ path: '.expo/auth-network-error-verified.png', fullPage: true });
      record('URL errada: falha real de conexão exibida no formulário');
    }
    console.log(JSON.stringify({ realHTTP: events, bodies: 'password/token/hash/trace omitted' }));
  } catch (error) {
    await page.screenshot({ path: '.expo/auth-test-failure.png', fullPage: true }).catch(() => {});
    console.log(JSON.stringify({ stage, path: new URL(page.url()).pathname,
      visible: (await page.locator('body').innerText()).slice(0, 1500).replaceAll(account.password, '[REDACTED]') }));
    throw error;
  } finally {
    if (id) {
      if (!token) {
        const response = await axios.post(api + '/user/login', { username: account.username, password: account.password });
        token = response.data.token;
      }
      await axios.delete(api + '/user/' + id, { headers: { Authorization: token } });
      console.log('Temporary web test account removed; id=' + id);
    }
    await browser.close();
  }
})().catch(async error => {
  // Never print Playwright errors: they can contain input values.
  console.error(JSON.stringify({ result: 'FAIL', type: error.name, code: error.code || null }));
  if (browser) await browser.close().catch(() => {});
  process.exitCode = 1;
});
