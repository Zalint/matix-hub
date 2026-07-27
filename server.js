require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const USER = process.env.AUTH_USER;
const PASS = process.env.AUTH_PASS;
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

if (!USER || !PASS) {
    console.error('Missing AUTH_USER or AUTH_PASS in .env');
    process.exit(1);
}

// Each account owns a set of static hub pages; the first one is where it lands.
const USERS = new Map();
USERS.set(USER, { pass: PASS, pages: ['index.html', 'maas.html'] });

if (process.env.SALY_USER && process.env.SALY_PASS) {
    USERS.set(process.env.SALY_USER, { pass: process.env.SALY_PASS, pages: ['saly.html'] });
} else {
    console.warn('SALY_USER / SALY_PASS not set — that account is disabled');
}

function accountFor(req) {
    return USERS.get(req.session.user);
}

// Windows resolves filenames case-insensitively and ignores trailing separators,
// dots and spaces, so /MAAS.html, /maas%2ehtml and /maas.html/ all name the same
// file. Compare on a decoded, normalized name or the ownership check is trivial
// to slip past.
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

const PUBLIC_PATHS = new Set(['/LogoMatix.jpeg', '/favicon.ico']);

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
    const account = USERS.get(username);
    if (account && password === account.pass) {
        req.session.authed = true;
        req.session.user = username;
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

// An account removed from .env must not keep a live session running.
app.use((req, res, next) => {
    if (req.session.authed && USERS.has(req.session.user)) return next();
    const next_ = encodeURIComponent(req.originalUrl);
    res.redirect(`/login?next=${next_}`);
});

// Serve the landing page that belongs to the logged-in account.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, accountFor(req).pages[0]));
});

// There is deliberately no express.static here. Serving the project directory
// let any path Windows resolves loosely (/MAAS.html, /maas.html/, /maas%2ehtml)
// reach a hub page around the ownership check, and exposed server.js and
// package.json besides. The only files that ever leave this process are the
// account's own pages, login.html and PUBLIC_PATHS — so a new asset has to be
// added to PUBLIC_PATHS to be reachable.
app.use((req, res) => {
    const page = requestedPage(req.path);
    if (page && accountFor(req).pages.includes(page)) {
        return res.sendFile(path.join(__dirname, page));
    }
    if (page && page.endsWith('.html')) return res.redirect('/');
    res.status(404).end();
});

app.listen(PORT, () => {
    console.log(`Matix hub running on http://localhost:${PORT}`);
});
