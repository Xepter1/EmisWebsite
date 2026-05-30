/* ==========================================================================
   EMS DESIGN — INTERACTIVE 3D CORPORATE BRAND BOOK JS
   ========================================================================== */

(function () {
    'use strict';

    // State Variables
    let activeSheetIndex = 0; // 0 = closed front, 1 to 4 = open pages, 5 = closed back
    const sheets = document.querySelectorAll('.sheet');
    const totalSheets = sheets.length;
    const bookContainer = document.getElementById('bookContainer');
    const pageIndicator = document.getElementById('pageIndicator');
    
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
    const swipeThreshold = 50;

    // ==========================================================================
    // AUDIO SYNTHESIS: WEB AUDIO API
    // ==========================================================================
    
    /**
     * Initializes the Audio Context (must be triggered by a user gesture)
     */
    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    /**
     * Synthesizes a highly realistic organic paper-flipping / rustling sound.
     * Uses a filtered white noise sweep with volume envelopes.
     */
    function playPaperSound() {
        if (isMuted) return;
        
        try {
            initAudio();
            if (!audioCtx) return;

            const duration = 0.55;
            const bufferSize = audioCtx.sampleRate * duration;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);

            // 1. Generate White Noise
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noiseSource = audioCtx.createBufferSource();
            noiseSource.buffer = buffer;

            // 2. Bandpass Filter (sweeps frequency down to simulate page rotation pitch change)
            const bandpass = audioCtx.createBiquadFilter();
            bandpass.type = 'bandpass';
            bandpass.Q.value = 3.5;
            bandpass.frequency.setValueAtTime(850, audioCtx.currentTime);
            bandpass.frequency.exponentialRampToValueAtTime(160, audioCtx.currentTime + duration);

            // 3. Lowpass Filter (warms the sound, removes harsh digital highs)
            const lowpass = audioCtx.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.setValueAtTime(2000, audioCtx.currentTime);
            lowpass.frequency.exponentialRampToValueAtTime(700, audioCtx.currentTime + duration);

            // 4. Gain Node (Volume envelope to simulate initial acceleration and smooth exit decay)
            const gainNode = audioCtx.createGain();
            gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
            // Linear ramp up for the quick acceleration snap of flipping paper
            gainNode.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.08);
            // Exponential decay down to silence as page settles
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

            // Connect graph
            noiseSource.connect(bandpass);
            bandpass.connect(lowpass);
            lowpass.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            // Play the synthetic sound
            noiseSource.start();
            noiseSource.stop(audioCtx.currentTime + duration);
        } catch (e) {
            console.warn('Audio synthesis could not start:', e);
        }
    }

    // ==========================================================================
    // CORE 3D PAGE-FLIPPING LOGIC
    // ==========================================================================

    /**
     * Updates the 3D book layers, active sheets, translation classes, and text UI indicators.
     */
    function updateBookState() {
        // 1. Spine Centering Alignment Class
        bookContainer.classList.remove('closed-front', 'closed-back', 'opened');
        if (activeSheetIndex === 0) {
            bookContainer.classList.add('closed-front');
        } else if (activeSheetIndex === totalSheets) {
            bookContainer.classList.add('closed-back');
        } else {
            bookContainer.classList.add('opened');
        }

        // 2. Sheet rotations and active clickable classes
        sheets.forEach((sheet, idx) => {
            // Reset active classes
            sheet.classList.remove('active-left', 'active-right', 'flipped');
            
            if (idx < activeSheetIndex) {
                // Sheet is flipped to the left
                sheet.classList.add('flipped');
                sheet.style.transform = `rotateY(-180deg) translateZ(${idx * 0.5}px)`; // slight translateZ stack
                sheet.style.zIndex = idx;
            } else {
                // Sheet is sitting on the right
                sheet.style.transform = `rotateY(0deg) translateZ(${(totalSheets - idx) * 0.5}px)`; // slight translateZ stack
                sheet.style.zIndex = totalSheets - idx;
            }
        });

        // 3. Mark only the top-most visible left and right pages as interactive
        if (activeSheetIndex > 0) {
            sheets[activeSheetIndex - 1].classList.add('active-left');
        }
        if (activeSheetIndex < totalSheets) {
            sheets[activeSheetIndex].classList.add('active-right');
        }

        // 4. Update the Page Indicators text
        updateUI();
    }

    /**
     * Updates the text labels in the control deck and button states.
     */
    function updateUI() {
        // Human-friendly page indicators
        let pageText = '';
        if (activeSheetIndex === 0) {
            pageText = 'Cover';
        } else if (activeSheetIndex === totalSheets) {
            pageText = 'Outro';
        } else {
            const leftPage = activeSheetIndex * 2;
            const rightPage = leftPage + 1;
            pageText = `S. ${leftPage} — ${rightPage}`;
        }
        pageIndicator.textContent = pageText;

        // Button disabled states
        btnPrev.style.opacity = activeSheetIndex === 0 ? '0.4' : '1';
        btnPrev.style.pointerEvents = activeSheetIndex === 0 ? 'none' : 'auto';
        
        btnNext.style.opacity = activeSheetIndex === totalSheets ? '0.4' : '1';
        btnNext.style.pointerEvents = activeSheetIndex === totalSheets ? 'none' : 'auto';
    }

    /**
     * Flips one page forward
     */
    function nextPage() {
        if (activeSheetIndex < totalSheets) {
            activeSheetIndex++;
            playPaperSound();
            updateBookState();
            
            // If we reached the end during autoplay, stop slideshow
            if (activeSheetIndex === totalSheets && isPlaying) {
                togglePlay();
            }
        }
    }

    /**
     * Flips one page backward
     */
    function prevPage() {
        if (activeSheetIndex > 0) {
            activeSheetIndex--;
            playPaperSound();
            updateBookState();
        }
    }

    // ==========================================================================
    // INTERACTIVE GESTURE & CLICK HANDLERS
    // ==========================================================================

    /**
     * Assigns event listeners to sheet clicking zones (the corner indicators)
     */
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

    /**
     * Assigns touch/swipe and dragging events for smooth page flipping
     */
    function setupDragAndDrop() {
        const stage = document.getElementById('bookStage');
        if (!stage) return;

        // Mouse Drag down
        stage.addEventListener('mousedown', (e) => {
            // Avoid conflict with interactive links inside the book
            if (e.target.closest('a') || e.target.closest('.ctrl-btn') || e.target.closest('.page-corner-indicator')) return;
            
            startX = e.clientX;
            isDragging = true;
            initAudio(); // Warm audio context
        });

        // Touch start
        stage.addEventListener('touchstart', (e) => {
            if (e.target.closest('a') || e.target.closest('.ctrl-btn') || e.target.closest('.page-corner-indicator')) return;
            
            startX = e.touches[0].clientX;
            isDragging = true;
            initAudio(); // Warm audio context
        }, { passive: true });

        // Mouse/Touch Move
        const handleMove = (clientX) => {
            if (!isDragging) return;
            const diffX = clientX - startX;

            if (diffX > swipeThreshold) {
                prevPage();
                isDragging = false; // block multiple fast registers
            } else if (diffX < -swipeThreshold) {
                nextPage();
                isDragging = false; // block multiple fast registers
            }
        };

        stage.addEventListener('mousemove', (e) => {
            if (isDragging) handleMove(e.clientX);
        });

        stage.addEventListener('touchmove', (e) => {
            if (isDragging) handleMove(e.touches[0].clientX);
        }, { passive: true });

        // Reset Drag
        const endDrag = () => { isDragging = false; };
        window.addEventListener('mouseup', endDrag);
        window.addEventListener('touchend', endDrag);
    }

    // ==========================================================================
    // DECK CONTROL ACTIONS
    // ==========================================================================

    /**
     * Toggles the automated slideshow mode
     */
    function togglePlay() {
        isPlaying = !isPlaying;
        
        if (isPlaying) {
            btnPlay.classList.add('active');
            btnPlay.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="14" y="4" width="4" height="16" rx="1"></rect>
                    <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                </svg>`;
            
            initAudio(); // user-gesture triggers audio prep

            autoPlayInterval = setInterval(() => {
                if (activeSheetIndex < totalSheets) {
                    nextPage();
                } else {
                    // Loop back to cover on complete
                    activeSheetIndex = 0;
                    playPaperSound();
                    updateBookState();
                }
            }, 3200);
        } else {
            btnPlay.classList.remove('active');
            btnPlay.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="6 3 20 12 6 21 6 3"></polygon>
                </svg>`;
            clearInterval(autoPlayInterval);
        }
    }

    /**
     * Toggles sound synthesizer mute state
     */
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
            initAudio(); // wake audio up
            playPaperSound(); // sound preview
        }
    }

    /**
     * Toggles a premium focus scale mode
     */
    function toggleZoom() {
        const isZoomed = bookContainer.classList.toggle('zoomed');
        btnZoom.classList.toggle('active', isZoomed);
    }

    /**
     * Keyboard controls setup (Pfeiltasten Links/Rechts & Spacebar)
     */
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
        // Bind core triggers
        btnPrev.addEventListener('click', prevPage);
        btnNext.addEventListener('click', nextPage);
        btnPlay.addEventListener('click', togglePlay);
        btnMute.addEventListener('click', toggleMute);
        btnZoom.addEventListener('click', toggleZoom);

        // Advanced Mechanics
        setupPageCornerClicks();
        setupDragAndDrop();
        setupKeyboardControls();

        // Load correct layout sizes
        updateBookState();
    }

    // Run when Document is fully ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
