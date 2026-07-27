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

// Each user gets its own static hub page.
const USERS = new Map();
USERS.set(USER, { pass: PASS, home: 'index.html' });

if (process.env.SALY_USER && process.env.SALY_PASS) {
    USERS.set(process.env.SALY_USER, { pass: process.env.SALY_PASS, home: 'saly.html' });
} else {
    console.warn('SALY_USER / SALY_PASS not set — that account is disabled');
}

const HUB_PAGES = new Set([...USERS.values()].map(u => '/' + u.home));

function homeFor(req) {
    const account = USERS.get(req.session.user);
    return account ? account.home : 'index.html';
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
        return res.sendFile(path.join(__dirname, req.path));
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

app.use((req, res, next) => {
    if (req.session.authed) return next();
    const next_ = encodeURIComponent(req.originalUrl);
    res.redirect(`/login?next=${next_}`);
});

// Serve the hub page that belongs to the logged-in user, and keep users
// from opening someone else's hub page directly.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, homeFor(req)));
});

app.use((req, res, next) => {
    if (HUB_PAGES.has(req.path) && req.path !== '/' + homeFor(req)) {
        return res.redirect('/');
    }
    next();
});

app.use(express.static(path.join(__dirname), { index: false }));

app.listen(PORT, () => {
    console.log(`Matix hub running on http://localhost:${PORT}`);
});
