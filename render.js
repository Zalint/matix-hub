const { MODULES, moduleById } = require('./modules');

const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';

const MAAS_GROUP = {
    accent: '#14b8a6',
    accent2: '#0d9488',
    shadow: 'rgba(20, 184, 166, 0.4)',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/></svg>'
};

// Attributes are always double-quoted below, so escaping & < > " is enough and
// apostrophes stay readable in French copy ("l'activité", not "l&#39;activité").
function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function card({ accent, accent2, shadow, svg, name, badge, desc, url, cta, external }, i) {
    const style = `--card-accent:${accent};--card-accent-2:${accent2};--card-shadow:${shadow};animation-delay:${(0.1 * (i + 1)).toFixed(1)}s`;
    const target = external ? ' target="_blank" rel="noopener noreferrer"' : '';
    const label = badge
        ? `${escapeHtml(name)} <span class="badge">${escapeHtml(badge)}</span>`
        : escapeHtml(name);
    return `                <a class="module-card" style="${style}" href="${escapeHtml(url)}"${target}>
                    <div class="icon-wrap">${svg}</div>
                    <div>
                        <div class="module-name">${label}</div>
                        <p class="module-desc">${escapeHtml(desc)}</p>
                    </div>
                    <span class="open-cta">${escapeHtml(cta)}${ARROW}</span>
                </a>`;
}

// Lay the cards out in balanced rows of at most four, so a grid never ends
// with a single stranded card.
function gridWidth(count) {
    if (count < 1) return 300;
    const rows = Math.ceil(count / 4);
    const cols = Math.ceil(count / rows);
    return cols * 300 + (cols - 1) * 24;
}

// Follow the order stored on the account rather than the catalogue order, so
// reordering somebody's modules in the admin screen reorders their cards, and
// so accounts that predate this file keep the card order they already had.
function modulesFor(user, group) {
    return user.modules.map(moduleById).filter(m => m && m.group === group);
}

function moduleCards(mods, startIndex = 0) {
    return mods.map((m, i) => card({ ...m, cta: 'Ouvrir le module', external: true }, startIndex + i));
}

// A user holding both general modules and MAAS points de vente gets the MAAS
// ones folded behind a single card. Someone who only has MAAS sees them
// directly, since a sub-menu holding their whole hub would be a pointless click.
function hubLayout(user) {
    const general = modulesFor(user, 'general');
    const maas = modulesFor(user, 'maas');
    const grouped = general.length > 0 && maas.length > 0;
    return { general, maas, grouped };
}

function renderHub(user) {
    const { general, maas, grouped } = hubLayout(user);
    const cards = moduleCards(general);

    if (grouped) {
        const names = maas.map(m => m.name.replace(/^MAAS\s+/, ''));
        const list = names.length > 1
            ? `${names.slice(0, -1).join(', ')} et ${names[names.length - 1]}`
            : names[0];
        cards.push(card({
            ...MAAS_GROUP,
            name: 'MAAS',
            badge: `${maas.length} point${maas.length > 1 ? 's' : ''} de vente`,
            desc: `${list} — regroupés dans un sous-menu.`,
            url: '/maas.html',
            cta: 'Voir les points de vente',
            external: false
        }, cards.length));
    } else {
        cards.push(...moduleCards(maas, cards.length));
    }

    if (cards.length === 0) {
        return {
            cards: `                <p class="empty-state">Aucun écran ne vous est attribué pour le moment.<br>Contactez votre administrateur.</p>`,
            width: 520,
            hint: 'Votre compte est actif, mais aucun module ne lui est encore associé.',
            empty: true
        };
    }

    const hint = grouped
        ? `Chaque module s'ouvre dans un nouvel onglet — cette page reste accessible à tout moment. MAAS regroupe les ${maas.length} points de vente.`
        : "Chaque module s'ouvre dans un nouvel onglet — cette page reste accessible à tout moment.";

    return {
        cards: cards.join('\n\n'),
        width: gridWidth(cards.length),
        hint,
        empty: false
    };
}

function renderMaas(user) {
    const maas = modulesFor(user, 'maas');
    return {
        cards: moduleCards(maas).join('\n\n'),
        width: gridWidth(maas.length),
        empty: maas.length === 0
    };
}

// Only a user whose MAAS modules are actually folded away has a sub-page to open.
function hasMaasPage(user) {
    return hubLayout(user).grouped;
}

function fill(template, values) {
    return template.replace(/\{\{(\w+)\}\}/g, (full, key) =>
        Object.prototype.hasOwnProperty.call(values, key) ? values[key] : full);
}

module.exports = { renderHub, renderMaas, hasMaasPage, fill, escapeHtml, moduleById };
