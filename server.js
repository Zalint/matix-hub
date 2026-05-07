require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const USER = process.env.AUTH_USER;
const PASS = process.env.AUTH_PASS;

if (!USER || !PASS) {
    console.error('Missing AUTH_USER or AUTH_PASS in .env');
    process.exit(1);
}

app.use((req, res, next) => {
    const header = req.headers.authorization || '';
    const [scheme, encoded] = header.split(' ');

    if (scheme === 'Basic' && encoded) {
        const decoded = Buffer.from(encoded, 'base64').toString('utf8');
        const idx = decoded.indexOf(':');
        const user = decoded.slice(0, idx);
        const pass = decoded.slice(idx + 1);
        if (user === USER && pass === PASS) return next();
    }

    res.set('WWW-Authenticate', 'Basic realm="Matix", charset="UTF-8"');
    res.status(401).send('Authentication required');
});

app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
    console.log(`Matix hub running on http://localhost:${PORT}`);
});
