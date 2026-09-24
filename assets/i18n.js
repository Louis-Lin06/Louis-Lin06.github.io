/* Language switcher: English / 简体中文 / 繁體中文
   Translations live in i18n-data.js. The English text in the HTML is the source. */
(() => {
    const DATA = window.I18N_DATA || { text: {}, keyed: {}, titles: {} };
    const LANGS = [
        { code: 'en', short: 'EN', label: 'English', html: 'en' },
        { code: 'zh-Hans', short: '简', label: '简体中文', html: 'zh-Hans' },
        { code: 'zh-Hant', short: '繁', label: '繁體中文', html: 'zh-Hant' }
    ];
    const IDX = { 'zh-Hans': 0, 'zh-Hant': 1 };
    const STORE = 'site-lang';
    const norm = (s) => s.replace(/\s+/g, ' ').trim();

    const read = () => { try { return localStorage.getItem(STORE); } catch { return null; } };
    const write = (v) => { try { localStorage.setItem(STORE, v); } catch { /* private mode */ } };

    const detect = () => {
        const saved = read();
        if (LANGS.some(l => l.code === saved)) return saved;
        const prefs = navigator.languages || [navigator.language || 'en'];
        for (const p of prefs) {
            const l = (p || '').toLowerCase();
            if (/^zh-(tw|hk|mo|hant)/.test(l)) return 'zh-Hant';
            if (/^zh/.test(l)) return 'zh-Hans';
            if (/^en/.test(l)) return 'en';
        }
        return 'en';
    };

    /* ---------- Collect translatable content once (English originals) ---------- */
    const textNodes = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode(n) {
            const p = n.parentElement;
            if (!p || p.closest('script, style, [data-i18n], .lang-switch')) return NodeFilter.FILTER_REJECT;
            return DATA.text[norm(n.nodeValue)] ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
    });
    for (let n; (n = walker.nextNode());) {
        const v = n.nodeValue;
        textNodes.push({ node: n, en: v, key: norm(v), lead: v.match(/^\s*/)[0], trail: v.match(/\s*$/)[0] });
    }
    const keyed = Array.from(document.querySelectorAll('[data-i18n]')).map(el => ({ el, en: el.innerHTML, key: el.dataset.i18n }));
    const titleEn = document.title;

    let current = 'en';

    const t = (key, fallback) => {
        const row = DATA.text[key];
        return current === 'en' || !row ? (fallback !== undefined ? fallback : key) : row[IDX[current]];
    };

    const apply = (code, { save = false } = {}) => {
        if (!LANGS.some(l => l.code === code)) code = 'en';
        current = code;
        const i = IDX[code];
        textNodes.forEach(r => {
            r.node.nodeValue = code === 'en' ? r.en : r.lead + DATA.text[r.key][i] + r.trail;
        });
        keyed.forEach(r => {
            const row = DATA.keyed[r.key];
            r.el.innerHTML = code === 'en' || !row ? r.en : row[i];
        });
        const tRow = DATA.titles[titleEn];
        document.title = code === 'en' || !tRow ? titleEn : tRow[i];
        document.documentElement.lang = LANGS.find(l => l.code === code).html;
        updateSwitcher();
        if (save) write(code);
        document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: code } }));
    };

    /* ---------- Switcher UI ---------- */
    const globe = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/></svg>';
    const check = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
    let wrap, btn, menu;

    const buildSwitcher = () => {
        const host = document.querySelector('.gnav-inner');
        if (!host) return;
        wrap = document.createElement('div');
        wrap.className = 'lang-switch';
        wrap.innerHTML = `
            <button class="lang-btn" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Language · 语言 · 語言">${globe}<span class="lang-cur">EN</span></button>
            <div class="lang-menu" role="menu">
                ${LANGS.map(l => `<button type="button" role="menuitemradio" aria-checked="false" data-lang="${l.code}" lang="${l.html}"><span>${l.label}</span>${check}</button>`).join('')}
            </div>`;
        host.appendChild(wrap);
        btn = wrap.querySelector('.lang-btn');
        menu = wrap.querySelector('.lang-menu');

        const setOpen = (open) => {
            wrap.classList.toggle('open', open);
            btn.setAttribute('aria-expanded', open);
        };
        btn.addEventListener('click', (e) => { e.stopPropagation(); setOpen(!wrap.classList.contains('open')); });
        menu.addEventListener('click', (e) => {
            const b = e.target.closest('[data-lang]');
            if (!b) return;
            apply(b.dataset.lang, { save: true });
            setOpen(false);
            btn.focus();
        });
        document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) setOpen(false); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && wrap.classList.contains('open')) { setOpen(false); btn.focus(); } });
    };

    function updateSwitcher() {
        if (!wrap) return;
        const l = LANGS.find(x => x.code === current);
        wrap.querySelector('.lang-cur').textContent = l.short;
        wrap.querySelectorAll('[data-lang]').forEach(b => {
            const on = b.dataset.lang === current;
            b.classList.toggle('active', on);
            b.setAttribute('aria-checked', on);
        });
    }

    buildSwitcher();
    const initial = detect();
    if (initial !== 'en') apply(initial); else { current = 'en'; updateSwitcher(); }

    window.I18N = { t, apply, get lang() { return current; } };
    document.documentElement.classList.remove('lang-loading');
})();
