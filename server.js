require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const { MODULES } = require('./modules');
const store = require('./store');
const { renderHub, renderMaas, hasMaasPage, fill } = require('./render');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

// Accounts live in the store now. AUTH_USER / SALY_USER are only used to create
// them the first time the store is empty, so an existing deployment keeps working.
const seed = store.seedFromEnv();
if (seed.seeded) {
    console.log(`Seeded accounts from .env: ${seed.usernames.join(', ')} -> ${store.USERS_FILE}`);
} else if (!store.listUsers().length) {
    console.error('No accounts, and no AUTH_USER / AUTH_PASS in .env to create one');
    process.exit(1);
}

const TEMPLATES = {
    hub: fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8'),
    maas: fs.readFileSync(path.join(__dirname, 'maas.html'), 'utf8')
};

const PUBLIC_PATHS = new Set(['/LogoMatix.jpeg', '/favicon.ico']);

function accountFor(req) {
    return store.findUser(req.session.user);
}

// Windows resolves filenames case-insensitively and ignores trailing separators,
// dots and spaces, so /MAAS.html, /maas%2ehtml and /maas.html/ all name the same
// page. Normalise before deciding what a request is asking for.
function requestedPage(reqPath) {
    let decoded;
    try {
        decoded = decodeURIComponent(reqPath);
    } catch (err) {
        return null; // malformed escape
    }
    return decoded
        .replace(/\\/g, '/')
        .replace(/^\/+/, '')
        .replace(/[/.\s]+$/, '')
        .toLowerCase();
}

app.use((req, res, next) => {
    if (req.method === 'GET' && !PUBLIC_PATHS.has(req.path)) {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
    }
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
    name: 'matix.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 8
    }
}));

app.get('/login', (req, res) => {
    if (req.session.authed) return res.redirect('/');
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.use((req, res, next) => {
    if (PUBLIC_PATHS.has(req.path)) {
        // favicon.ico is listed but not shipped; answer 404 quietly instead of
        // letting sendFile throw ENOENT into the logs on every request.
        return res.sendFile(path.join(__dirname, req.path), err => {
            if (err && !res.headersSent) res.status(404).end();
        });
    }
    next();
});

app.post('/login', (req, res) => {
    const { username, password } = req.body || {};
    const account = store.findUser(username);
    if (account && store.verifyPassword(String(password || ''), account.passwordHash)) {
        req.session.authed = true;
        req.session.user = account.username;
        return res.json({ ok: true });
    }
    res.status(401).json({ ok: false, error: 'invalid_credentials' });
});

app.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('matix.sid');
        res.json({ ok: true });
    });
});

// An account deleted from the store must not keep a live session running.
app.use((req, res, next) => {
    if (req.session.authed && accountFor(req)) return next();
    const next_ = encodeURIComponent(req.originalUrl);
    res.redirect(`/login?next=${next_}`);
});

function requireAdmin(req, res, next) {
    if (accountFor(req).role === 'admin') return next();
    if (req.path.startsWith('/api/')) return res.status(403).json({ ok: false, error: 'forbidden' });
    res.redirect('/');
}

app.get('/api/me', (req, res) => {
    const me = accountFor(req);
    res.json({ username: me.username, role: me.role, modules: me.modules });
});

app.get('/api/modules', requireAdmin, (req, res) => {
    res.json(MODULES.map(({ id, group, name, url }) => ({ id, group, name, url })));
});

app.get('/api/users', requireAdmin, (req, res) => {
    res.json(store.listUsers());
});

const USERNAME_RE = /^[A-Za-z0-9._@-]{2,40}$/;

app.post('/api/users', requireAdmin, (req, res) => {
    const { username, password, role, modules } = req.body || {};
    if (!USERNAME_RE.test(String(username || '').trim())) {
        return res.status(400).json({ ok: false, error: 'invalid_username' });
    }
    if (!password || String(password).length < 8) {
        return res.status(400).json({ ok: false, error: 'weak_password' });
    }
    try {
        const saved = store.saveUser({ username, password, role, modules }, { creating: true });
        res.json({ ok: true, user: { username: saved.username, role: saved.role, modules: saved.modules } });
    } catch (err) {
        res.status(400).json({ ok: false, error: err.message });
    }
});

app.put('/api/users/:username', requireAdmin, (req, res) => {
    const target = store.findUser(req.params.username);
    if (!target) return res.status(404).json({ ok: false, error: 'unknown_user' });

    const { password, role, modules } = req.body || {};
    if (password !== undefined && String(password).length < 8) {
        return res.status(400).json({ ok: false, error: 'weak_password' });
    }
    // Never let the last admin drop their own access to this screen.
    const demoting = role === 'user' && target.role === 'admin';
    if (demoting && store.countAdmins() <= 1) {
        return res.status(400).json({ ok: false, error: 'last_admin' });
    }
    try {
        const saved = store.saveUser({ username: target.username, password, role, modules }, { creating: false });
        res.json({ ok: true, user: { username: saved.username, role: saved.role, modules: saved.modules } });
    } catch (err) {
        res.status(400).json({ ok: false, error: err.message });
    }
});

app.delete('/api/users/:username', requireAdmin, (req, res) => {
    const target = store.findUser(req.params.username);
    if (!target) return res.status(404).json({ ok: false, error: 'unknown_user' });
    if (target.username.toLowerCase() === accountFor(req).username.toLowerCase()) {
        return res.status(400).json({ ok: false, error: 'cannot_delete_self' });
    }
    if (target.role === 'admin' && store.countAdmins() <= 1) {
        return res.status(400).json({ ok: false, error: 'last_admin' });
    }
    try {
        store.deleteUser(target.username);
        res.json({ ok: true });
    } catch (err) {
        res.status(400).json({ ok: false, error: err.message });
    }
});

app.get(['/admin', '/admin.html'], requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Cards are rendered from the account's own module list, so a page can never
// show a module the account was not granted.
const ADMIN_LINK = `            <a class="admin-link" href="/admin">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Utilisateurs
            </a>
`;

app.get(['/', '/index.html'], (req, res) => {
    const user = accountFor(req);
    const view = renderHub(user);
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(fill(TEMPLATES.hub, {
        CARDS: view.cards,
        WIDTH: view.width,
        HINT: view.hint,
        ADMINLINK: user.role === 'admin' ? ADMIN_LINK : ''
    }));
});

app.get('/maas.html', (req, res) => {
    const user = accountFor(req);
    if (!hasMaasPage(user)) return res.redirect('/');
    const view = renderMaas(user);
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(fill(TEMPLATES.maas, { CARDS: view.cards, WIDTH: view.width }));
});

// Nothing else is served. Any other page request lands the account back on its
// own hub; anything that is not a page is simply not there.
app.use((req, res) => {
    const page = requestedPage(req.path);
    if (page === 'maas.html') return res.redirect('/');
    if (page && page.endsWith('.html')) return res.redirect('/');
    res.status(404).end();
});

app.listen(PORT, () => {
    console.log(`Matix hub running on http://localhost:${PORT}`);
});
