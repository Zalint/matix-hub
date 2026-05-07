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

app.post('/login', (req, res) => {
    const { username, password } = req.body || {};
    if (username === USER && password === PASS) {
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

app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
    console.log(`Matix hub running on http://localhost:${PORT}`);
});
