// The catalogue of everything the hub can link to. Cards are rendered from
// this list, filtered by what each account is allowed to see, so adding a
// module here is all it takes for it to appear in the admin screen.
const MODULES = [
    {
        id: "caisse",
        group: "general",
        name: "Matix Caisse",
        desc: "Gestion des ventes, stocks, réconciliation et commandes du centre de découpe.",
        url: "https://mata-lgzy.onrender.com",
        accent: "#ef4444",
        accent2: "#dc2626",
        shadow: "rgba(239, 68, 68, 0.4)",
        svg: "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"> <path d=\"M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z\"/> <path d=\"M3 6h18\"/> <path d=\"M16 10a4 4 0 0 1-8 0\"/> </svg>"
    },
    {
        id: "banq",
        group: "general",
        name: "Matabanq",
        desc: "Suivi des dépenses, comptes partenaires, créances et reporting financier.",
        url: "https://mata-depenses-management.onrender.com",
        accent: "#3b82f6",
        accent2: "#2563eb",
        shadow: "rgba(59, 130, 246, 0.4)",
        svg: "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"> <path d=\"M3 21h18\"/> <path d=\"M5 21V10l7-5 7 5v11\"/> <path d=\"M9 21v-7h6v7\"/> <path d=\"M9 7h.01M12 7h.01M15 7h.01\"/> </svg>"
    },
    {
        id: "livreur",
        group: "general",
        name: "Matix Livreur",
        desc: "Suivi des livraisons, assignation des livreurs et gestion des commandes en cours.",
        url: "https://matix-livreur-frontend.onrender.com",
        accent: "#22c55e",
        accent2: "#16a34a",
        shadow: "rgba(34, 197, 94, 0.4)",
        svg: "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"> <path d=\"M14 17h5V8h-2\"/> <path d=\"M14 17H5\"/> <path d=\"M5 17H3v-6l3-4h7v10\"/> <circle cx=\"7.5\" cy=\"17.5\" r=\"2.5\"/> <circle cx=\"16.5\" cy=\"17.5\" r=\"2.5\"/> </svg>"
    },
    {
        id: "analysis",
        group: "general",
        name: "Matix Analysis",
        desc: "Analyse de performance, tableaux de bord et indicateurs clés transverses.",
        url: "https://mata-perf-analysis.onrender.com/",
        accent: "#a855f7",
        accent2: "#9333ea",
        shadow: "rgba(168, 85, 247, 0.4)",
        svg: "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"> <path d=\"M3 3v18h18\"/> <path d=\"M7 16V9\"/> <path d=\"M12 16V5\"/> <path d=\"M17 16v-4\"/> </svg>"
    },
    {
        id: "tools",
        group: "general",
        name: "Matix Tools",
        desc: "Outils utilitaires et générateurs (BRs, exports, conversions).",
        url: "https://generateurbrs.onrender.com",
        accent: "#f59e0b",
        accent2: "#d97706",
        shadow: "rgba(245, 158, 11, 0.4)",
        svg: "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"> <path d=\"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z\"/> </svg>"
    },
    {
        id: "volaille",
        group: "general",
        name: "Mata Volaille",
        desc: "Gestion des dépenses et opérations de l'activité volaille.",
        url: "https://mata-volaille-depenses-management.onrender.com",
        accent: "#06b6d4",
        accent2: "#0891b2",
        shadow: "rgba(6, 182, 212, 0.4)",
        svg: "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"> <path d=\"M16 7h.01\"/> <path d=\"M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20\"/> <path d=\"m20 7 2 .5-2 .5\"/> <path d=\"M10 18v3\"/> <path d=\"M14 17.75V21\"/> <path d=\"M7 18a6 6 0 0 0 3.84-10.61\"/> </svg>"
    },
    {
        id: "ofoire",
        group: "maas",
        name: "MAAS O Foire",
        desc: "Gestion des ventes et opérations du point de vente O Foire.",
        url: "https://maas-o-foire.onrender.com/",
        accent: "#3b82f6",
        accent2: "#2563eb",
        shadow: "rgba(59, 130, 246, 0.4)",
        svg: "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"> <circle cx=\"9\" cy=\"20\" r=\"1.5\"/> <circle cx=\"18\" cy=\"20\" r=\"1.5\"/> <path d=\"M2 3h3l2.4 12.1a2 2 0 0 0 2 1.6h8.3a2 2 0 0 0 2-1.6L22 7H6\"/> </svg>"
    },
    {
        id: "keurmassar",
        group: "maas",
        name: "MAAS Keur Massar",
        desc: "Gestion des ventes et opérations du point de vente Keur Massar.",
        url: "https://maas-keur-massar.onrender.com/",
        accent: "#22c55e",
        accent2: "#16a34a",
        shadow: "rgba(34, 197, 94, 0.4)",
        svg: "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"> <path d=\"M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z\"/> <circle cx=\"12\" cy=\"10\" r=\"3\"/> </svg>"
    },
    {
        id: "mbao",
        group: "maas",
        name: "MAAS Mbao",
        desc: "Gestion des ventes et opérations du point de vente Mbao.",
        url: "https://maas-mbao.onrender.com/",
        accent: "#a855f7",
        accent2: "#9333ea",
        shadow: "rgba(168, 85, 247, 0.4)",
        svg: "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"> <path d=\"M3 9 4.5 4h15L21 9\"/> <path d=\"M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0\"/> <path d=\"M5 11v9h14v-9\"/> <path d=\"M10 20v-5h4v5\"/> </svg>"
    },
    {
        id: "sacrecoeur",
        group: "maas",
        name: "MAAS Sacré Coeur",
        desc: "Gestion des ventes et opérations du point de vente Sacré Coeur.",
        url: "https://maas-sacre-coeur.onrender.com/",
        accent: "#f43f5e",
        accent2: "#e11d48",
        shadow: "rgba(244, 63, 94, 0.4)",
        svg: "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"> <path d=\"M3 21h18\"/> <path d=\"M5 21V7l7-4 7 4v14\"/> <path d=\"M9 21v-6h6v6\"/> <path d=\"M9 10h.01M15 10h.01\"/> </svg>"
    },
    {
        id: "djolof",
        group: "maas",
        name: "MAAS Le Djolof",
        desc: "Gestion des ventes et opérations du point de vente Le Djolof.",
        url: "https://maas-le-djolof.onrender.com/",
        accent: "#f59e0b",
        accent2: "#d97706",
        shadow: "rgba(245, 158, 11, 0.4)",
        svg: "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"> <path d=\"M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z\"/> <path d=\"M3 6h18\"/> <path d=\"M16 10a4 4 0 0 1-8 0\"/> </svg>"
    },
    {
        id: "keurbally",
        group: "maas",
        name: "MAAS Keur Bally",
        desc: "Gestion des ventes et opérations du point de vente Keur Bally.",
        url: "https://maas-keur-bally.onrender.com/",
        accent: "#06b6d4",
        accent2: "#0891b2",
        shadow: "rgba(6, 182, 212, 0.4)",
        svg: "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"> <path d=\"M20.59 13.41 13.42 20.59a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z\"/> <circle cx=\"7\" cy=\"7\" r=\"1.5\"/> </svg>"
    }
];

const BY_ID = new Map(MODULES.map(m => [m.id, m]));

function moduleById(id) {
    return BY_ID.get(id);
}

function allIds() {
    return MODULES.map(m => m.id);
}

function idsInGroup(group) {
    return MODULES.filter(m => m.group === group).map(m => m.id);
}

module.exports = { MODULES, moduleById, allIds, idsInGroup };
