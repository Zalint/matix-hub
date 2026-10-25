const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { allIds, idsInGroup, moduleById } = require('./modules');

// Render wipes the filesystem on every deploy unless a disk is mounted, so the
// store lives wherever DATA_DIR points. Without a disk the accounts created from
// the admin screen are lost on redeploy and the .env seed below runs again.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
    if (typeof stored !== 'string') return false;
    const [scheme, salt, hash] = stored.split('$');
    if (scheme !== 'scrypt' || !salt || !hash) return false;
    const expected = Buffer.from(hash, 'hex');
    let actual;
    try {
        actual = crypto.scryptSync(password, salt, expected.length);
    } catch (err) {
        return false;
    }
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function read() {
    try {
        const parsed = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        return [];
    }
}

function write(users) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = USERS_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(users, null, 2), 'utf8');
    fs.renameSync(tmp, USERS_FILE); // never leave a half-written store behind
}

// Usernames are matched case-insensitively so an account cannot be shadowed by
// a differently-cased duplicate.
function findUser(username) {
    if (typeof username !== 'string') return undefined;
    const needle = username.trim().toLowerCase();
    return read().find(u => u.username.toLowerCase() === needle);
}

function listUsers() {
    return read()
        .map(({ passwordHash, ...rest }) => rest)
        .sort((a, b) => a.username.localeCompare(b.username));
}

// Keep only ids that still exist in the catalogue, so a module removed from
// modules.js cannot linger in somebody's permissions.
function cleanModules(ids) {
    if (!Array.isArray(ids)) return [];
    return [...new Set(ids.filter(id => moduleById(id)))];
}

function saveUser({ username, password, modules, role }, { creating }) {
    const users = read();
    const needle = String(username).trim();
    const i = users.findIndex(u => u.username.toLowerCase() === needle.toLowerCase());

    if (creating && i !== -1) throw new Error('username_taken');
    if (!creating && i === -1) throw new Error('unknown_user');

    const base = creating
        ? { username: needle, role: 'user', modules: [], passwordHash: '' }
        : users[i];

    const updated = {
        ...base,
        role: role === 'admin' ? 'admin' : base.role === 'admin' && role === undefined ? 'admin' : role === 'user' ? 'user' : base.role,
        modules: modules === undefined ? base.modules : cleanModules(modules)
    };
    if (password) updated.passwordHash = hashPassword(password);
    if (!updated.passwordHash) throw new Error('password_required');

    if (creating) users.push(updated);
    else users[i] = updated;
    write(users);
    return updated;
}

function deleteUser(username) {
    const users = read();
    const left = users.filter(u => u.username.toLowerCase() !== String(username).toLowerCase());
    if (left.length === users.length) throw new Error('unknown_user');
    write(left);
}

function countAdmins(users = read()) {
    return users.filter(u => u.role === 'admin').length;
}

// First boot: carry the .env accounts over so nobody is locked out, and so the
// hub behaves exactly as it did before the store existed.
function seedFromEnv() {
    if (read().length) return { seeded: false };

    const seeded = [];
    if (process.env.AUTH_USER && process.env.AUTH_PASS) {
        seeded.push({
            username: process.env.AUTH_USER,
            role: 'admin',
            modules: allIds(),
            passwordHash: hashPassword(process.env.AUTH_PASS)
        });
    }
    if (process.env.SALY_USER && process.env.SALY_PASS) {
        seeded.push({
            username: process.env.SALY_USER,
            role: 'user',
            modules: ['keurbally', 'ofoire'],
            passwordHash: hashPassword(process.env.SALY_PASS)
        });
    }
    if (!seeded.length) return { seeded: false };
    write(seeded);
    return { seeded: true, usernames: seeded.map(u => u.username) };
}

module.exports = {
    USERS_FILE,
    verifyPassword,
    findUser,
    listUsers,
    saveUser,
    deleteUser,
    countAdmins,
    cleanModules,
    seedFromEnv,
    idsInGroup
};
