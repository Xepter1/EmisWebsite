/* ==========================================================================
   EMS DESIGN — INTERACTIVE 3D CORPORATE BRAND BOOK JS (RESPONSIVE)
   ========================================================================== */

(function () {
    'use strict';

    // State Variables
    let isMobileMode = false;
    let activeSheetIndex = 0; // Desktop: 0 to 6 (for 6 sheets)
    let activePageIndex = 0;  // Mobile: 0 to 11 (for 12 individual pages)
    
    const sheets = document.querySelectorAll('.sheet');
    const totalSheets = sheets.length;
    const totalPages = totalSheets * 2;
    const bookContainer = document.getElementById('bookContainer');
    const pageIndicator = document.getElementById('pageIndicator');
    
    // Flatten all pages in exact order for mobile card sliding
    const allPages = [];
    sheets.forEach(sheet => {
        allPages.push(sheet.querySelector('.page-front'));
        allPages.push(sheet.querySelector('.page-back'));
    });

    // Control Buttons
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const btnPlay = document.getElementById('btnPlay');
    const btnMute = document.getElementById('btnMute');
    const btnZoom = document.getElementById('btnZoom');

    // Slideshow & Audio variables
    let autoPlayInterval = null;
    let isPlaying = false;
    let isMuted = false;
    let audioCtx = null;

    // Gesture detection variables
    let startX = 0;
    let isDragging = false;
    const swipeThreshold = 40;

    // ==========================================================================
    // AUDIO SYNTHESIS: WEB AUDIO API
    // ==========================================================================
    
    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playPaperSound() {
        if (isMuted) return;
        
        try {
            initAudio();
            if (!audioCtx) return;

            const duration = 0.50;
            const bufferSize = audioCtx.sampleRate * duration;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);

            // 1. Generate White Noise
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noiseSource = audioCtx.createBufferSource();
            noiseSource.buffer = buffer;

            // 2. Bandpass Filter (frequency sweep)
            const bandpass = audioCtx.createBiquadFilter();
            bandpass.type = 'bandpass';
            bandpass.Q.value = 4.0;
            bandpass.frequency.setValueAtTime(800, audioCtx.currentTime);
            bandpass.frequency.exponentialRampToValueAtTime(170, audioCtx.currentTime + duration);

            // 3. Lowpass Filter
            const lowpass = audioCtx.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.setValueAtTime(1800, audioCtx.currentTime);
            lowpass.frequency.exponentialRampToValueAtTime(650, audioCtx.currentTime + duration);

            // 4. Gain Node (Volume envelope)
            const gainNode = audioCtx.createGain();
            gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.045, audioCtx.currentTime + 0.07);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

            noiseSource.connect(bandpass);
            bandpass.connect(lowpass);
            lowpass.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            noiseSource.start();
            noiseSource.stop(audioCtx.currentTime + duration);
        } catch (e) {
            console.warn('Audio synthesis could not start:', e);
        }
    }

    // ==========================================================================
    // RESPONSIVE MODE HANDLERS & STATE SYNCHRONIZATION
    // ==========================================================================

    function checkResponsiveMode() {
        const wasMobile = isMobileMode;
        isMobileMode = window.innerWidth <= 768;

        if (isMobileMode !== wasMobile) {
            // State synchronization between desktop spreads and mobile pages
            if (isMobileMode) {
                // Convert sheet index to page index
                activePageIndex = Math.max(0, activeSheetIndex * 2 - 1);
                if (activeSheetIndex === 0) activePageIndex = 0;
            } else {
                // Convert page index to sheet index
                if (activePageIndex === 0) {
                    activeSheetIndex = 0;
                } else {
                    activeSheetIndex = Math.floor((activePageIndex + 1) / 2);
                }
            }
            
            // Cancel active zoom when changing viewport
            if (bookContainer.classList.contains('zoomed')) {
                toggleZoom();
            }
            
            // Clean up mobile-specific classes from sheets on return to desktop
            if (!isMobileMode) {
                allPages.forEach(page => {
                    page.classList.remove('active-mobile', 'flipped-mobile', 'next-mobile');
                });
            }
        }
        
        updateBookState();
    }

    // ==========================================================================
    // CORE VIEW UPDATERS
    // ==========================================================================

    function updateBookState() {
        if (isMobileMode) {
            updateMobileView();
        } else {
            updateDesktopView();
        }
    }

    /**
     * Renders 3D spread flips and spine displacements on Desktop
     */
    function updateDesktopView() {
        // 1. Spine Centering Alignment Class
        bookContainer.classList.remove('closed-front', 'closed-back', 'opened');
        if (activeSheetIndex === 0) {
            bookContainer.classList.add('closed-front');
        } else if (activeSheetIndex === totalSheets) {
            bookContainer.classList.add('closed-back');
        } else {
            bookContainer.classList.add('opened');
        }

        // 2. Sheet rotations and z-indexing
        sheets.forEach((sheet, idx) => {
            sheet.classList.remove('active-left', 'active-right', 'flipped');
            
            if (idx < activeSheetIndex) {
                sheet.classList.add('flipped');
                sheet.style.transform = `rotateY(-180deg) translateZ(${idx * 0.5}px)`;
                sheet.style.zIndex = idx;
            } else {
                sheet.style.transform = `rotateY(0deg) translateZ(${(totalSheets - idx) * 0.5}px)`;
                sheet.style.zIndex = totalSheets - idx;
            }
        });

        // 3. Mark top-most visible left and right pages interactive
        if (activeSheetIndex > 0) {
            sheets[activeSheetIndex - 1].classList.add('active-left');
        }
        if (activeSheetIndex < totalSheets) {
            sheets[activeSheetIndex].classList.add('active-right');
        }

        updateUI();
    }

    /**
     * Renders fluid single page card sliders on Mobile
     */
    function updateMobileView() {
        // Reset desktop alignment styles
        bookContainer.classList.remove('closed-front', 'closed-back', 'opened');
        sheets.forEach(sheet => {
            sheet.style.transform = '';
            sheet.style.zIndex = '';
        });

        // Toggle card slide stack positions
        allPages.forEach((page, idx) => {
            page.classList.remove('active-mobile', 'flipped-mobile', 'next-mobile');
            if (idx === activePageIndex) {
                page.classList.add('active-mobile');
            } else if (idx < activePageIndex) {
                page.classList.add('flipped-mobile');
            } else {
                page.classList.add('next-mobile');
            }
        });

        updateUI();
    }

    /**
     * Updates labels and navigation buttons
     */
    function updateUI() {
        let pageText = '';

        if (isMobileMode) {
            if (activePageIndex === 0) {
                pageText = 'Cover';
            } else if (activePageIndex === totalPages - 1) {
                pageText = 'Outro';
            } else {
                pageText = `Seite ${activePageIndex + 1}`;
            }
            
            // Mobile navigation button boundaries
            btnPrev.style.opacity = activePageIndex === 0 ? '0.4' : '1';
            btnPrev.style.pointerEvents = activePageIndex === 0 ? 'none' : 'auto';
            btnNext.style.opacity = activePageIndex === totalPages - 1 ? '0.4' : '1';
            btnNext.style.pointerEvents = activePageIndex === totalPages - 1 ? 'none' : 'auto';
        } else {
            if (activeSheetIndex === 0) {
                pageText = 'Cover';
            } else if (activeSheetIndex === totalSheets) {
                pageText = 'Outro';
            } else {
                const leftPage = activeSheetIndex * 2;
                const rightPage = leftPage + 1;
                pageText = `S. ${leftPage} — ${rightPage}`;
            }

            // Desktop navigation boundaries
            btnPrev.style.opacity = activeSheetIndex === 0 ? '0.4' : '1';
            btnPrev.style.pointerEvents = activeSheetIndex === 0 ? 'none' : 'auto';
            btnNext.style.opacity = activeSheetIndex === totalSheets ? '0.4' : '1';
            btnNext.style.pointerEvents = activeSheetIndex === totalSheets ? 'none' : 'auto';
        }

        pageIndicator.textContent = pageText;
    }

    // ==========================================================================
    // ACTION TRIGGERS
    // ==========================================================================

    function nextPage() {
        if (isMobileMode) {
            if (activePageIndex < totalPages - 1) {
                activePageIndex++;
                playPaperSound();
                updateBookState();
                if (activePageIndex === totalPages - 1 && isPlaying) {
                    togglePlay();
                }
            }
        } else {
            if (activeSheetIndex < totalSheets) {
                activeSheetIndex++;
                playPaperSound();
                updateBookState();
                if (activeSheetIndex === totalSheets && isPlaying) {
                    togglePlay();
                }
            }
        }
    }

    function prevPage() {
        if (isMobileMode) {
            if (activePageIndex > 0) {
                activePageIndex--;
                playPaperSound();
                updateBookState();
            }
        } else {
            if (activeSheetIndex > 0) {
                activeSheetIndex--;
                playPaperSound();
                updateBookState();
            }
        }
    }

    // ==========================================================================
    // GESTURES & INTERACTION LISTENERS
    // ==========================================================================

    function setupPageCornerClicks() {
        sheets.forEach((sheet, idx) => {
            const frontCorner = sheet.querySelector('.page-front .page-corner-indicator');
            const backCorner = sheet.querySelector('.page-back .page-corner-indicator');

            if (frontCorner) {
                frontCorner.addEventListener('click', (e) => {
                    e.stopPropagation();
                    nextPage();
                });
            }

            if (backCorner) {
                backCorner.addEventListener('click', (e) => {
                    e.stopPropagation();
                    prevPage();
                });
            }
        });
    }

    function setupDragAndDrop() {
        const stage = document.getElementById('bookStage');
        if (!stage) return;

        stage.addEventListener('mousedown', (e) => {
            if (e.target.closest('a') || e.target.closest('.ctrl-btn') || e.target.closest('.page-corner-indicator')) return;
            startX = e.clientX;
            isDragging = true;
            initAudio();
        });

        stage.addEventListener('touchstart', (e) => {
            if (e.target.closest('a') || e.target.closest('.ctrl-btn') || e.target.closest('.page-corner-indicator')) return;
            startX = e.touches[0].clientX;
            isDragging = true;
            initAudio();
        }, { passive: true });

        const handleMove = (clientX) => {
            if (!isDragging) return;
            const diffX = clientX - startX;

            if (diffX > swipeThreshold) {
                prevPage();
                isDragging = false;
            } else if (diffX < -swipeThreshold) {
                nextPage();
                isDragging = false;
            }
        };

        stage.addEventListener('mousemove', (e) => {
            if (isDragging) handleMove(e.clientX);
        });

        stage.addEventListener('touchmove', (e) => {
            if (isDragging) handleMove(e.touches[0].clientX);
        }, { passive: true });

        const endDrag = () => { isDragging = false; };
        window.addEventListener('mouseup', endDrag);
        window.addEventListener('touchend', endDrag);
    }

    // ==========================================================================
    // DECK CONTROL ACTIONS
    // ==========================================================================

    function togglePlay() {
        isPlaying = !isPlaying;
        
        if (isPlaying) {
            btnPlay.classList.add('active');
            btnPlay.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="14" y="4" width="4" height="16" rx="1"></rect>
                    <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                </svg>`;
            
            initAudio();

            autoPlayInterval = setInterval(() => {
                if (isMobileMode) {
                    if (activePageIndex < totalPages - 1) {
                        nextPage();
                    } else {
                        activePageIndex = 0;
                        playPaperSound();
                        updateBookState();
                    }
                } else {
                    if (activeSheetIndex < totalSheets) {
                        nextPage();
                    } else {
                        activeSheetIndex = 0;
                        playPaperSound();
                        updateBookState();
                    }
                }
            }, 3500);
        } else {
            btnPlay.classList.remove('active');
            btnPlay.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="6 3 20 12 6 21 6 3"></polygon>
                </svg>`;
            clearInterval(autoPlayInterval);
        }
    }

    function toggleMute() {
        isMuted = !isMuted;
        btnMute.classList.toggle('active', isMuted);
        
        if (isMuted) {
            btnMute.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                    <path d="M9 9v6a3 3 0 0 0 3 3h1.586l4.707 4.707A1 1 0 0 0 20 22V4a1 1 0 0 0-1.707-.707L13.586 8H12a3 3 0 0 0-3 1z"></path>
                </svg>`;
        } else {
            btnMute.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                </svg>`;
            initAudio();
            playPaperSound();
        }
    }

    function toggleZoom() {
        if (isMobileMode) return; // Disable zoom on mobile
        const isZoomed = bookContainer.classList.toggle('zoomed');
        btnZoom.classList.toggle('active', isZoomed);
    }

    function setupKeyboardControls() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === 'Right') {
                nextPage();
            } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
                prevPage();
            } else if (e.key === ' ') {
                e.preventDefault();
                togglePlay();
            }
        });
    }

    // ==========================================================================
    // INITIALIZATION RUN
    // ==========================================================================
    function init() {
        // Bind UI triggers
        btnPrev.addEventListener('click', prevPage);
        btnNext.addEventListener('click', nextPage);
        btnPlay.addEventListener('click', togglePlay);
        btnMute.addEventListener('click', toggleMute);
        btnZoom.addEventListener('click', toggleZoom);

        // Bind interactive mechanics
        setupPageCornerClicks();
        setupDragAndDrop();
        setupKeyboardControls();

        // Check responsive viewport on resize
        window.addEventListener('resize', checkResponsiveMode);

        // Load responsive view initially
        checkResponsiveMode();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
