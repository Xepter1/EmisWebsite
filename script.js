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
    // VELO DYNAMICS: Classical 3D Page Flip Slider
    // ============================================
    const prevBtn = document.getElementById('velo-book-prev');
    const nextBtn = document.getElementById('velo-book-next');
    const dots = document.querySelectorAll('.velo-book-dot');
    
    const book = document.getElementById('velo-book');
    const staticLeft = document.getElementById('velo-static-left');
    const staticRight = document.getElementById('velo-static-right');
    const flippingSheet = document.getElementById('velo-flipping-sheet');
    const flippingFront = flippingSheet ? flippingSheet.querySelector('.velo-flipping-face--front') : null;
    const flippingBack = flippingSheet ? flippingSheet.querySelector('.velo-flipping-face--back') : null;
    const cover = document.getElementById('velo-book-cover');

    // Jede Seite bekommt ihr eigenes Bild: { left: '...', right: '...' }
    // Sobald Emis finale Seiten fertig sind, einfach die Pfade hier ersetzen.
    const spreads = [
        { left: 'images/brandbook-mock-1.jpg', right: 'images/brandbook-mock-2.jpg' },
        { left: 'images/brandbook-mock-3.jpg', right: 'images/brandbook-mock-4.jpg' },
        { left: 'images/brandbook-mock-2.jpg', right: 'images/brandbook-mock-3.jpg' },
        { left: 'images/brandbook-mock-4.jpg', right: 'images/brandbook-mock-1.jpg' },
    ];

    if (book && staticLeft && staticRight && flippingSheet && flippingFront && flippingBack) {
        let currentSpreadIndex = 0;
        let isTurning = false;
        let isOpen = false;
        const FLIP_DURATION = 1100;

        function applySpread(spread) {
            staticLeft.style.backgroundImage = `url('${spread.left}')`;
            staticRight.style.backgroundImage = `url('${spread.right}')`;
        }

        // Show initial spread behind the closed cover
        applySpread(spreads[0]);

        function openBook() {
            if (isOpen) return;
            isOpen = true;
            book.classList.add('is-open');
        }

        function closeBook() {
            if (!isOpen || isTurning) return;
            isOpen = false;
            book.classList.remove('is-open');
            currentSpreadIndex = 0;
            applySpread(spreads[0]);
            dots.forEach((dot, idx) => dot.classList.toggle('active', idx === 0));
        }

        function showSpread(newIndex) {
            if (newIndex < 0) newIndex = spreads.length - 1;
            else if (newIndex >= spreads.length) newIndex = 0;

            if (newIndex === currentSpreadIndex || isTurning) return;
            isTurning = true;

            const cur = spreads[currentSpreadIndex];
            const next = spreads[newIndex];

            const isForward = !(newIndex < currentSpreadIndex && !(currentSpreadIndex === spreads.length - 1 && newIndex === 0))
                && !(currentSpreadIndex === 0 && newIndex === spreads.length - 1);

            if (isForward) {
                // Static: left stays as current-left, right shows next-right
                staticLeft.style.backgroundImage = `url('${cur.left}')`;
                staticRight.style.backgroundImage = `url('${next.right}')`;
                // Flipping sheet covers the current right page and reveals next left page
                flippingFront.style.backgroundImage = `url('${cur.right}')`;
                flippingBack.style.backgroundImage = `url('${next.left}')`;
                book.classList.add('turning-forward');
            } else {
                // Static: right stays as current-right, left shows next-left
                staticLeft.style.backgroundImage = `url('${next.left}')`;
                staticRight.style.backgroundImage = `url('${cur.right}')`;
                // Flipping sheet covers the current left page and reveals next right page
                flippingFront.style.backgroundImage = `url('${cur.left}')`;
                flippingBack.style.backgroundImage = `url('${next.right}')`;
                book.classList.add('turning-backward');
            }

            setTimeout(() => {
                book.classList.remove('turning-forward', 'turning-backward');
                currentSpreadIndex = newIndex;
                isTurning = false;
                applySpread(spreads[currentSpreadIndex]);

                dots.forEach((dot, idx) => {
                    dot.classList.toggle('active', idx === currentSpreadIndex);
                });
            }, FLIP_DURATION);
        }

        // Open the book by clicking / tapping the cover
        if (cover) {
            cover.addEventListener('click', openBook);
            cover.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openBook();
                }
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (!isOpen) return;
                // On the first spread, "back" closes the book again
                if (currentSpreadIndex === 0) {
                    closeBook();
                } else {
                    showSpread(currentSpreadIndex - 1);
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (!isOpen) {
                    openBook();
                    return;
                }
                showSpread(currentSpreadIndex + 1);
            });
        }

        dots.forEach((dot, idx) => {
            dot.addEventListener('click', () => {
                if (!isOpen) {
                    openBook();
                    if (idx !== 0) showSpread(idx);
                    return;
                }
                showSpread(idx);
            });
        });

        // Touch swipe gestures for mobile (swipe left/right to change pages)
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
                // Swipe left -> open or next page
                if (!isOpen) {
                    openBook();
                } else {
                    showSpread(currentSpreadIndex + 1);
                }
            } else if (touchEndX > touchStartX + threshold) {
                // Swipe right -> previous page, or close on the first spread
                if (!isOpen) return;
                if (currentSpreadIndex === 0) {
                    closeBook();
                } else {
                    showSpread(currentSpreadIndex - 1);
                }
            }
        }
    }

})();
