/* ============================================
   EMILI GAßNER — PORTFOLIO
   Interaktivität: Nav, Scroll, Form, Reveal
   ============================================ */

(function () {
    'use strict';

    // ============================================
    // FOOTER: Aktuelles Jahr einfügen
    // ============================================
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // ============================================
    // NAVIGATION: Mobile-Toggle
    // ============================================
    const navToggle = document.querySelector('.nav-toggle');
    const navList = document.querySelector('.nav-list');
    const nav = document.querySelector('.nav');

    if (navToggle && navList) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navList.classList.toggle('open');
        });

        // Menü schließen, wenn ein Link geklickt wird
        navList.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navList.classList.remove('open');
            });
        });
    }

    // ============================================
    // NAVIGATION: Auto-Hide beim Runterscrollen
    // ============================================
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;

        if (currentScroll <= 100) {
            nav.classList.remove('hidden');
            return;
        }

        if (currentScroll > lastScroll && !nav.classList.contains('hidden')) {
            nav.classList.add('hidden');
        } else if (currentScroll < lastScroll && nav.classList.contains('hidden')) {
            nav.classList.remove('hidden');
        }

        lastScroll = currentScroll;
    }, { passive: true });

    // ============================================
    // SMOOTH SCROLL (für ältere Browser)
    // ============================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (!target) return;

            e.preventDefault();
            const navHeight = nav ? nav.offsetHeight : 0;
            const targetPos = target.getBoundingClientRect().top + window.scrollY - navHeight + 1;

            window.scrollTo({
                top: targetPos,
                behavior: 'smooth'
            });
        });
    });

    // ============================================
    // REVEAL ON SCROLL — Sektionen einblenden
    // ============================================
    const revealTargets = document.querySelectorAll(
        '.project-header, .velo-item, .coffee-storefront, .coffee-palette-row, .coffee-menu, ' +
        '.zen-hero, .zen-covers figure, .zen-magazines, .schach-hero, .timeline-item, ' +
        '.project-description, .about-content'
    );

    revealTargets.forEach(el => el.classList.add('reveal'));

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -50px 0px'
        });

        revealTargets.forEach(el => observer.observe(el));
    } else {
        // Fallback: alles direkt sichtbar
        revealTargets.forEach(el => el.classList.add('visible'));
    }

    // ============================================
    // KONTAKTFORMULAR
    // ============================================
    /*
       ────────────────────────────────────────────
       FORMULAR-MODUS UMSTELLEN
       ────────────────────────────────────────────
       Aktuell: MAILTO (öffnet Mail-Programm beim Klick)
       → Funktioniert sofort ohne Backend.

       Alternativen ohne Backend (echte Form-Submissions):

       A) FORMSPREE  (https://formspree.io — kostenlos bis 50 Mails/Monat)
          1. Account anlegen, Form-ID kopieren (z. B. "xyzabcde")
          2. FORM_MODE unten auf 'formspree' setzen
          3. FORMSPREE_ID unten eintragen

       B) WEB3FORMS  (https://web3forms.com — kostenlos bis 250 Mails/Monat)
          1. E-Mail-Adresse eingeben, Access Key kopieren
          2. FORM_MODE unten auf 'web3forms' setzen
          3. WEB3FORMS_KEY unten eintragen
       ────────────────────────────────────────────
    */
    const FORM_MODE = 'mailto';            // 'mailto' | 'formspree' | 'web3forms'
    const RECIPIENT = 'emiligassner2@gmail.com';
    const FORMSPREE_ID = '';                // z. B. 'xyzabcde'
    const WEB3FORMS_KEY = '';               // z. B. 'a1b2c3d4-...'

    const form = document.getElementById('contactForm');
    const successEl = document.getElementById('formSuccess');

    if (form) {
        const fields = {
            name: form.querySelector('#name'),
            email: form.querySelector('#email'),
            subject: form.querySelector('#subject'),
            message: form.querySelector('#message')
        };

        const errors = {
            name: 'Bitte gib deinen Namen ein.',
            email: 'Bitte gib eine gültige E-Mail-Adresse ein.',
            subject: 'Bitte gib einen Betreff ein.',
            message: 'Bitte schreibe eine kurze Nachricht.'
        };

        const validateField = (key) => {
            const input = fields[key];
            const fieldEl = input.closest('.form-field');
            const errorEl = fieldEl.querySelector('.form-error');
            const value = input.value.trim();

            let valid = value.length > 0;
            if (key === 'email' && valid) {
                valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            }
            if (key === 'message' && valid) {
                valid = value.length >= 5;
            }

            if (valid) {
                fieldEl.classList.remove('invalid');
                errorEl.textContent = '';
            } else {
                fieldEl.classList.add('invalid');
                errorEl.textContent = errors[key];
            }

            return valid;
        };

        // Live-Validierung beim Verlassen eines Feldes
        Object.keys(fields).forEach(key => {
            fields[key].addEventListener('blur', () => validateField(key));
            fields[key].addEventListener('input', () => {
                const fieldEl = fields[key].closest('.form-field');
                if (fieldEl.classList.contains('invalid')) {
                    validateField(key);
                }
            });
        });

        const showSuccess = (text) => {
            if (!successEl) return;
            successEl.textContent = text;
            successEl.classList.add('visible');
            setTimeout(() => successEl.classList.remove('visible'), 8000);
        };

        const submitToBackend = async (data) => {
            try {
                const res = await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (res.ok) {
                    showSuccess('Vielen Dank! Deine Nachricht wurde erfolgreich gesendet.');
                    form.reset();
                } else {
                    showSuccess('Server-Fehler. Bitte versuche es später nochmal oder per E-Mail.');
                }
            } catch (err) {
                showSuccess('Verbindungsfehler. Bitte prüfe deine Internetverbindung oder schreibe mir direkt.');
            }
        };

        const submitFormspree = async (data) => {
            try {
                const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
                    method: 'POST',
                    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (res.ok) {
                    showSuccess('Vielen Dank! Deine Nachricht ist angekommen.');
                    form.reset();
                } else {
                    showSuccess('Beim Senden ist etwas schiefgegangen. Bitte versuche es per E-Mail direkt.');
                }
            } catch (err) {
                showSuccess('Beim Senden ist etwas schiefgegangen. Bitte versuche es per E-Mail direkt.');
            }
        };

        const submitWeb3forms = async (data) => {
            try {
                const res = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                    body: JSON.stringify({ access_key: WEB3FORMS_KEY, ...data })
                });
                if (res.ok) {
                    showSuccess('Vielen Dank! Deine Nachricht ist angekommen.');
                    form.reset();
                } else {
                    showSuccess('Beim Senden ist etwas schiefgegangen. Bitte versuche es per E-Mail direkt.');
                }
            } catch (err) {
                showSuccess('Beim Senden ist etwas schiefgegangen. Bitte versuche es per E-Mail direkt.');
            }
        };

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // Alle Felder validieren
            const allValid = Object.keys(fields)
                .map(validateField)
                .every(Boolean);

            if (!allValid) {
                // Zum ersten ungültigen Feld scrollen
                const firstInvalid = form.querySelector('.form-field.invalid input, .form-field.invalid textarea');
                if (firstInvalid) firstInvalid.focus();
                return;
            }

            const data = {
                name: fields.name.value.trim(),
                email: fields.email.value.trim(),
                subject: fields.subject.value.trim(),
                message: fields.message.value.trim()
            };

            if (FORM_MODE === 'formspree' && FORMSPREE_ID) {
                submitFormspree(data);
            } else if (FORM_MODE === 'web3forms' && WEB3FORMS_KEY) {
                submitWeb3forms(data);
            } else {
                submitToBackend(data);
            }
        });
    }

    // ============================================
    // IMPRESSUM / DATENSCHUTZ
    // ============================================
    // Die Links führen nun direkt zu den HTML-Dateien.
    // Eventuelle zusätzliche Logik kann hier ergänzt werden.

    // ============================================
    // VELO DYNAMICS: Brand Book Slider
    // ============================================
    const prevBtn = document.getElementById('velo-book-prev');
    const nextBtn = document.getElementById('velo-book-next');
    const spreads = document.querySelectorAll('.velo-spread');
    const dots = document.querySelectorAll('.velo-book-dot');

    if (spreads.length > 0) {
        let currentSpread = 0;

        function showSpread(index) {
            // Keep index within bounds (infinite wrapping)
            if (index < 0) {
                currentSpread = spreads.length - 1;
            } else if (index >= spreads.length) {
                currentSpread = 0;
            } else {
                currentSpread = index;
            }

            // Update spreads visibility
            spreads.forEach((spread, idx) => {
                if (idx === currentSpread) {
                    spread.classList.add('active');
                } else {
                    spread.classList.remove('active');
                }
            });

            // Update pagination dots
            dots.forEach((dot, idx) => {
                if (idx === currentSpread) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                showSpread(currentSpread - 1);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                showSpread(currentSpread + 1);
            });
        }

        dots.forEach((dot, idx) => {
            dot.addEventListener('click', () => {
                showSpread(idx);
            });
        });

        // Touch Gestures for mobile (swipe left/right to change spreads)
        let touchStartX = 0;
        let touchEndX = 0;
        const bookFrame = document.querySelector('.velo-book-frame');

        if (bookFrame) {
            bookFrame.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            bookFrame.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                handleSwipe();
            }, { passive: true });
        }

        function handleSwipe() {
            const threshold = 50; // minimum swipe distance in pixels
            if (touchEndX < touchStartX - threshold) {
                // Swipe left -> Next page
                showSpread(currentSpread + 1);
            } else if (touchEndX > touchStartX + threshold) {
                // Swipe right -> Previous page
                showSpread(currentSpread - 1);
            }
        }
    }

})();
