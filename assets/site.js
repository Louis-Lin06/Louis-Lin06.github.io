/* Louis Lin | Engineering Portfolio: shared interactions */
(() => {
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tr = (key, en) => (window.I18N ? window.I18N.t(key, en) : en);
    document.documentElement.classList.remove('no-js');

    const icon = {
        prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
        next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
        close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
        zoom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>'
    };

    /* ---------- Body scroll lock (iOS-safe, from the original site) ---------- */
    let lockY = 0, locks = 0;
    const lockScroll = () => {
        if (locks++ > 0) return;
        lockY = window.scrollY;
        Object.assign(document.body.style, { position: 'fixed', top: `-${lockY}px`, width: '100%' });
    };
    const unlockScroll = () => {
        if (locks === 0 || --locks > 0) return;
        const html = document.documentElement;
        const prev = html.style.scrollBehavior;
        html.style.scrollBehavior = 'auto';
        Object.assign(document.body.style, { position: '', top: '', width: '' });
        window.scrollTo(0, lockY);
        html.style.scrollBehavior = prev;
    };

    /* ---------- Global nav ---------- */
    const gnav = $('.gnav');
    if (gnav) {
        const onScroll = () => gnav.classList.toggle('is-scrolled', window.scrollY > 8);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        const toggle = $('.menu-toggle', gnav);
        $$('.gnav-links a', gnav).forEach((a, i) => a.style.setProperty('--i', i));
        const setMenu = (open) => {
            if (open === gnav.classList.contains('menu-open')) return;
            gnav.classList.toggle('menu-open', open);
            toggle.setAttribute('aria-expanded', open);
            toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            open ? lockScroll() : unlockScroll();
        };
        toggle && toggle.addEventListener('click', () => setMenu(!gnav.classList.contains('menu-open')));
        $$('.gnav-links a', gnav).forEach(a => a.addEventListener('click', () => setMenu(false)));
        document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
        window.matchMedia('(min-width: 834px)').addEventListener('change', e => { if (e.matches) setMenu(false); });
    }

    /* ---------- Hero headline: word-by-word entrance ---------- */
    $$('.split').forEach(el => {
        if (reduceMotion) return;
        let i = 0;
        const walk = (node) => {
            Array.from(node.childNodes).forEach(child => {
                if (child.nodeType === 3) {
                    const frag = document.createDocumentFragment();
                    child.textContent.split(/(\s+)/).forEach(part => {
                        if (!part) return;
                        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
                        const w = document.createElement('span');
                        w.className = 'w'; w.textContent = part; w.style.setProperty('--i', i++);
                        frag.appendChild(w);
                    });
                    child.replaceWith(frag);
                } else if (child.nodeType === 1 && child.classList.contains('grad-text')) {
                    // Gradient text must animate as one unit, or the background clip breaks
                    child.classList.add('w');
                    child.style.setProperty('--i', i++);
                } else if (child.nodeType === 1 && child.tagName !== 'BR') {
                    walk(child);
                }
            });
        };
        walk(el);
    });

    /* ---------- Reveal on scroll ---------- */
    const revealIO = new IntersectionObserver((entries) => {
        entries.forEach(en => {
            if (en.isIntersecting) { en.target.classList.add('in'); revealIO.unobserve(en.target); }
        });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$('.reveal, .gantt-grid.animate').forEach(el => revealIO.observe(el));

    /* ---------- Count-up numbers ---------- */
    const countIO = new IntersectionObserver((entries) => {
        entries.forEach(en => {
            if (!en.isIntersecting) return;
            countIO.unobserve(en.target);
            const el = en.target, end = parseInt(el.dataset.count, 10);
            if (reduceMotion) { el.textContent = end; return; }
            const t0 = performance.now(), dur = 1400;
            const step = (t) => {
                const p = Math.min(1, (t - t0) / dur);
                el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
                if (p < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach(el => countIO.observe(el));

    /* ---------- Parallax on the profile photo ---------- */
    const para = $('[data-parallax]');
    if (para && !reduceMotion) {
        const img = $('img', para);
        let ticking = false;
        const update = () => {
            const r = para.getBoundingClientRect();
            const progress = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
            img.style.setProperty('--py', `${Math.max(-1, Math.min(1, progress)) * -40 - 20}px`);
            ticking = false;
        };
        window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
        update();
    }

    /* ---------- Pause autoplay videos when off-screen ---------- */
    const vidIO = new IntersectionObserver((entries) => {
        entries.forEach(en => {
            const v = en.target;
            if (en.isIntersecting) {
                const p = v.play();
                p && p.catch(() => { const w = v.parentElement; if (w) w.classList.add('needs-play'); });
            } else v.pause();
        });
    }, { threshold: 0.15 });
    $$('video[autoplay]').forEach(v => {
        v.muted = true; // required for autoplay on iOS
        vidIO.observe(v);
        const wrap = v.parentElement;
        if (wrap && wrap.classList.contains('is-video')) {
            const btn = document.createElement('button');
            btn.type = 'button'; btn.className = 'video-play'; btn.setAttribute('aria-label', 'Play video');
            btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>';
            btn.addEventListener('click', () => { v.play().then(() => wrap.classList.remove('needs-play')).catch(() => {}); });
            wrap.appendChild(btn);
            v.addEventListener('playing', () => wrap.classList.remove('needs-play'));
        }
    });

    /* ---------- Lightbox ---------- */
    let lb, lbImg, lbCap, lbCount, lbItems = [], lbIndex = 0, lbReturn = null;
    const buildLightbox = () => {
        lb = document.createElement('div');
        lb.className = 'lightbox';
        lb.setAttribute('role', 'dialog');
        lb.setAttribute('aria-modal', 'true');
        lb.setAttribute('aria-label', 'Image viewer');
        lb.innerHTML = `
            <button class="lb-btn lb-close" aria-label="Close">${icon.close}</button>
            <button class="lb-btn lb-prev" aria-label="Previous image">${icon.prev}</button>
            <button class="lb-btn lb-next" aria-label="Next image">${icon.next}</button>
            <figure class="lightbox-figure"><img alt=""><figcaption class="lightbox-caption"></figcaption></figure>`;
        document.body.appendChild(lb);
        lbImg = $('img', lb); lbCap = $('figcaption', lb);
        $('.lb-close', lb).addEventListener('click', closeLB);
        $('.lb-prev', lb).addEventListener('click', () => showLB(lbIndex - 1));
        $('.lb-next', lb).addEventListener('click', () => showLB(lbIndex + 1));
        lb.addEventListener('click', e => { if (e.target === lb) closeLB(); });
        let sx = null;
        lb.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
        lb.addEventListener('touchend', e => {
            if (sx === null) return;
            const dx = e.changedTouches[0].clientX - sx;
            if (Math.abs(dx) > 50) showLB(lbIndex + (dx < 0 ? 1 : -1));
            sx = null;
        });
        document.addEventListener('keydown', e => {
            if (!lb.classList.contains('active')) return;
            if (e.key === 'Escape') closeLB();
            if (e.key === 'ArrowRight') showLB(lbIndex + 1);
            if (e.key === 'ArrowLeft') showLB(lbIndex - 1);
        });
    };
    const showLB = (i) => {
        lbIndex = (i + lbItems.length) % lbItems.length;
        const it = lbItems[lbIndex];
        lbImg.src = it.src; lbImg.alt = it.alt;
        lbCap.innerHTML = '';
        lbCap.append(document.createTextNode(it.caption));
        if (lbItems.length > 1) {
            const c = document.createElement('span');
            c.className = 'lightbox-count';
            c.textContent = `${lbIndex + 1} / ${lbItems.length}`;
            lbCap.append(c);
        }
        const multi = lbItems.length > 1;
        $('.lb-prev', lb).style.display = multi ? '' : 'none';
        $('.lb-next', lb).style.display = multi ? '' : 'none';
    };
    const openLB = (items, i, from) => {
        if (!lb) buildLightbox();
        lbItems = items; lbReturn = from;
        showLB(i);
        lb.classList.add('active');
        lockScroll();
        $('.lb-close', lb).focus({ preventScroll: true });
    };
    function closeLB() {
        if (!lb || !lb.classList.contains('active')) return;
        lb.classList.remove('active');
        unlockScroll();
        lbReturn && lbReturn.focus({ preventScroll: true });
    }

    /* ---------- Galleries ---------- */
    $$('[data-gallery]').forEach(gal => {
        const track = $('.gallery-track', gal);
        const slides = $$('.gallery-slide', gal);
        const prevBtn = $('.carousel-btn.prev', gal);
        const nextBtn = $('.carousel-btn.next', gal);
        const dotsWrap = $('.gallery-dots', gal);
        const controls = $('.gallery-controls', gal);
        if (!track || !slides.length) return;

        if (slides.length < 2 && controls) controls.style.display = 'none';

        const dots = slides.map((_, i) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.setAttribute('aria-label', `Show image ${i + 1} of ${slides.length}`);
            b.addEventListener('click', () => go(i));
            dotsWrap && dotsWrap.appendChild(b);
            return b;
        });

        const current = () => Math.round(track.scrollLeft / (slides[0].offsetWidth + 12));
        const go = (i) => {
            i = Math.max(0, Math.min(slides.length - 1, i));
            track.scrollTo({ left: slides[i].offsetLeft - slides[0].offsetLeft, behavior: reduceMotion ? 'auto' : 'smooth' });
        };
        const update = () => {
            const c = current();
            dots.forEach((d, i) => { d.classList.toggle('active', i === c); d.setAttribute('aria-current', i === c); });
            prevBtn && prevBtn.classList.toggle('hidden', c <= 0);
            nextBtn && nextBtn.classList.toggle('hidden', c >= slides.length - 1);
        };
        prevBtn && prevBtn.addEventListener('click', e => { e.preventDefault(); go(current() - 1); });
        nextBtn && nextBtn.addEventListener('click', e => { e.preventDefault(); go(current() + 1); });
        let raf;
        track.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); }, { passive: true });
        window.addEventListener('resize', update);
        gal.addEventListener('keydown', e => {
            if (e.target.closest('.gallery-track') || e.target.closest('.gallery-controls')) {
                if (e.key === 'ArrowRight') { e.preventDefault(); go(current() + 1); }
                if (e.key === 'ArrowLeft') { e.preventDefault(); go(current() - 1); }
            }
        });
        update();

        // Lightbox for image slides
        const items = [];
        slides.forEach(s => {
            const img = $('img', s);
            if (!img) return;
            const btn = $('.gallery-media', s);
            const idx = items.length;
            const capEl = $('figcaption', s);
            items.push({ src: img.dataset.full || img.currentSrc || img.src, alt: img.alt, get caption() { return capEl ? capEl.textContent : ''; } });
            if (btn && btn.tagName === 'BUTTON') {
                btn.insertAdjacentHTML('beforeend', `<span class="zoom-hint" aria-hidden="true">${icon.zoom}</span>`);
                btn.addEventListener('click', () => openLB(items, idx, btn));
            }
        });
    });

    /* ---------- Scrollspy + contents sheet (Experiences / Projects) ---------- */
    const spyTargets = $$('[data-spy-section]');
    if (spyTargets.length) {
        const spyLinks = $$('.lnav-links a[href^="#"], .toc-link');
        const setActive = (id) => {
            spyLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${id}`));
            $$('.year-group').forEach(g => g.classList.toggle('current', !!(id && $(`#${CSS.escape(id)}`, g))));
            const act = $(`.lnav-links a.active`);
            if (act) {
                const bar = act.parentElement;
                const target = act.offsetLeft - bar.clientWidth / 2 + act.offsetWidth / 2;
                if (bar.scrollWidth > bar.clientWidth) bar.scrollTo({ left: target, behavior: 'smooth' });
            }
        };
        let ticking = false;
        const spy = () => {
            const offset = (parseInt(getComputedStyle(document.documentElement).scrollPaddingTop, 10) || 0) + 60;
            let current = '';
            spyTargets.forEach(s => { if (s.getBoundingClientRect().top - offset <= 0) current = s.id; });
            if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) current = spyTargets[spyTargets.length - 1].id;
            setActive(current);
            ticking = false;
        };
        window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
        spy();
    }

    const tocBtn = $('.mobile-toc-btn');
    const tocSheet = $('.toc-sheet');
    const tocBackdrop = $('.toc-backdrop');
    if (tocBtn && tocSheet && tocBackdrop) {
        const setTOC = (open) => {
            if (open === tocSheet.classList.contains('active')) return;
            tocSheet.classList.toggle('active', open);
            tocBackdrop.classList.toggle('active', open);
            tocBtn.setAttribute('aria-expanded', open);
            open ? lockScroll() : unlockScroll();
        };
        tocBtn.addEventListener('click', () => setTOC(true));
        tocBackdrop.addEventListener('click', () => setTOC(false));
        $('.toc-close-btn', tocSheet).addEventListener('click', () => setTOC(false));
        $$('.toc-link', tocSheet).forEach(l => l.addEventListener('click', (e) => {
            e.preventDefault();
            const target = $(l.getAttribute('href'));
            setTOC(false);
            if (target) requestAnimationFrame(() => target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }));
            history.replaceState(null, '', l.getAttribute('href'));
        }));
        document.addEventListener('keydown', e => { if (e.key === 'Escape') setTOC(false); });
    }

    /* ---------- Resume modal ---------- */
    const modal = $('#resumeModal');
    if (modal) {
        const open = () => { modal.classList.add('active'); lockScroll(); $('#closeResumeModal').focus({ preventScroll: true }); };
        const close = () => { if (!modal.classList.contains('active')) return; modal.classList.remove('active'); unlockScroll(); };
        $$('[data-open-resume]').forEach(b => b.addEventListener('click', open));
        $('#closeResumeModal').addEventListener('click', close);
        modal.addEventListener('click', e => { if (e.target === modal) close(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
        if (location.hash === '#resume') open();
    }

    /* ---------- Home timeline ---------- */
    const wrapper = $('#timelineScroll');
    if (wrapper) {
        const grid = $('.gantt-grid', wrapper);

        // Stagger the bar "draw-in" by start column
        $$('.gantt-bar', grid).forEach(bar => {
            const start = parseInt((bar.style.gridColumn || '1').split('/')[0], 10) || 1;
            bar.style.setProperty('--d', `${0.15 + start * 0.025}s`);
            const t = $('.bar-title', bar), s = $('.bar-subtitle', bar);
            if (t && !bar.title) bar.title = `${t.textContent}${s ? ' · ' + s.textContent : ''}`;
        });

        // "Now" marker at today's month (only if it falls within 2024 to 2026)
        const d = new Date();
        const idx = (d.getFullYear() - 2024) * 12 + d.getMonth() + (d.getDate() - 1) / 31;
        if (idx >= 0 && idx < 36) {
            const m = document.createElement('div');
            m.className = 'now-marker';
            m.style.left = `${(idx / 36) * 100}%`;
            m.innerHTML = `<span>${tr('__now', 'Now')}</span>`;
            grid.appendChild(m);
            document.addEventListener('langchange', () => { m.firstChild.textContent = tr('__now', 'Now'); });
        }

        // Start scrolled to the present
        const toPresent = () => { wrapper.scrollLeft = wrapper.scrollWidth; };
        window.addEventListener('load', () => setTimeout(toPresent, 100));
        toPresent();

        // Drag to scroll with a mouse
        let down = false, moved = false, sx = 0, sl = 0;
        wrapper.addEventListener('pointerdown', e => {
            if (e.pointerType !== 'mouse' || e.button !== 0) return;
            down = true; moved = false; sx = e.clientX; sl = wrapper.scrollLeft;
        });
        window.addEventListener('pointermove', e => {
            if (!down) return;
            const dx = e.clientX - sx;
            if (!moved && Math.abs(dx) > 5) { moved = true; wrapper.classList.add('dragging'); }
            if (moved) wrapper.scrollLeft = sl - dx;
        });
        window.addEventListener('pointerup', () => {
            if (!down) return;
            down = false;
            setTimeout(() => wrapper.classList.remove('dragging'), 0);
        });
        wrapper.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    }

    /* ---------- Copy to clipboard ---------- */
    let toast;
    const showToast = (msg) => {
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            toast.setAttribute('role', 'status');
            toast.setAttribute('aria-live', 'polite');
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(toast._t);
        toast._t = setTimeout(() => toast.classList.remove('show'), 1800);
    };
    $$('[data-copy]').forEach(btn => btn.addEventListener('click', async (e) => {
        e.preventDefault(); e.stopPropagation();
        const text = btn.dataset.copy;
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta); ta.select();
            try { document.execCommand('copy'); } catch { /* ignore */ }
            ta.remove();
        }
        const old = btn.textContent;
        btn.textContent = tr('__copied', 'Copied');
        showToast(window.I18N && window.I18N.lang !== 'en' ? `${tr('__copied_toast', 'Copied')} ${text}` : `${text} copied`);
        setTimeout(() => { btn.textContent = old; }, 1600);
    }));
})();
