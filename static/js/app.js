/**
 * AuraFarming Auto-Editor — Frontend JavaScript Controller
 * Author: santostark
 * Real-time telemetry sync, 4-cycle in-browser audio engine, and user interaction handlers.
 */

document.addEventListener('DOMContentLoaded', () => {
    // State Tracking
    let lastState = null;
    let audioMuted = false;
    let masterVolume = 0.8;
    let audioUnlocked = false;

    // DOM Elements
    const faceLockStatus = document.getElementById('face-lock-status');
    const cycleStatus = document.getElementById('cycle-status');
    const currentPhaseText = document.getElementById('current-phase-text');
    const activeStyleText = document.getElementById('active-style-text');
    const hudLiveBadge = document.getElementById('hud-live-badge');
    const hudCountdownBox = document.getElementById('hud-countdown-box');
    const countdownText = document.getElementById('countdown-text');
    const countdownProgressBar = document.getElementById('countdown-progress-bar');
    const globalProgressFill = document.getElementById('global-progress-fill');
    const progressStatusDesc = document.getElementById('progress-status-desc');
    const progressPctDesc = document.getElementById('progress-pct-desc');
    const pipStatusBadge = document.getElementById('pip-status-badge');
    const btnDownloadReel = document.getElementById('btn-download-reel');
    const loopCycleCounter = document.getElementById('loop-cycle-counter');

    // Control Buttons
    const btnPunchZoom = document.getElementById('btn-punch-zoom');
    const btnForceRecord = document.getElementById('btn-force-record');
    const styleButtons = document.querySelectorAll('.btn-style');
    const btnAudioToggle = document.getElementById('btn-audio-toggle');
    const audioVolumeSlider = document.getElementById('audio-volume');
    const iconSoundOn = document.getElementById('icon-sound-on');
    const iconSoundOff = document.getElementById('icon-sound-off');

    // Audio Elements (4 Dynamic Cycles)
    const audios = {
        waiting: document.getElementById('audio-waiting'),
        confirm: document.getElementById('audio-confirm'),
        aura: document.getElementById('audio-aura'),
        sigma: document.getElementById('audio-sigma'),
        second: document.getElementById('audio-second'),
        third: document.getElementById('audio-third')
    };

    // Unlock browser audio on first user gesture
    function unlockAudio() {
        if (!audioUnlocked) {
            audioUnlocked = true;
            Object.values(audios).forEach(a => {
                if (a) {
                    a.volume = masterVolume;
                    a.load();
                }
            });
        }
    }
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    // Audio Volume Handling
    audioVolumeSlider.addEventListener('input', (e) => {
        masterVolume = parseFloat(e.target.value);
        audioMuted = masterVolume === 0;
        updateAudioVolumes();
        updateAudioIcons();
    });

    btnAudioToggle.addEventListener('click', () => {
        unlockAudio();
        audioMuted = !audioMuted;
        updateAudioVolumes();
        updateAudioIcons();
    });

    function updateAudioVolumes() {
        const vol = audioMuted ? 0 : masterVolume;
        Object.values(audios).forEach(a => {
            if (a) a.volume = vol;
        });
    }

    function updateAudioIcons() {
        if (audioMuted) {
            iconSoundOn.classList.add('hidden');
            iconSoundOff.classList.remove('hidden');
        } else {
            iconSoundOn.classList.remove('hidden');
            iconSoundOff.classList.add('hidden');
        }
    }

    function stopAllAudio() {
        Object.values(audios).forEach(a => {
            if (a) {
                a.pause();
                a.currentTime = 0;
            }
        });
    }

    function playAudioTrack(name, loop = false) {
        if (audioMuted || !audios[name]) return;
        stopAllAudio();
        audios[name].loop = loop;
        audios[name].currentTime = 0;
        audios[name].play().catch(e => console.log('Audio autoplay note:', e));
    }

    // ================= TELEMETRY POLLING =================

    async function pollStatus() {
        try {
            const res = await fetch('/api/status');
            if (!res.ok) return;
            const data = await res.json();
            updateUI(data);
        } catch (err) {
            console.error('Status poll error:', err);
        }
    }

    function updateUI(data) {
        const state = data.state;
        const style = data.style.toUpperCase();

        // 1. Telemetry Top Bar
        faceLockStatus.textContent = data.face_locked ? 'TARGET: LOCKED' : 'TARGET: SEARCHING';
        faceLockStatus.parentElement.querySelector('.status-dot').className = `status-dot ${data.face_locked ? 'cyan pulse' : 'red'}`;
        cycleStatus.textContent = `CYCLE: ${style}`;

        // 2. Active Style & Phase Display
        activeStyleText.textContent = style;
        currentPhaseText.textContent = state;
        loopCycleCounter.textContent = `Cycle ${data.playback_cycle} Completed`;

        // 3. Style Buttons Active State
        styleButtons.forEach(btn => {
            if (btn.dataset.style === data.style) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // 4. Phase-Specific Layout & Audio Synchronization
        if (state === 'WAITING') {
            hudLiveBadge.textContent = 'STANDBY';
            hudLiveBadge.style.borderColor = 'var(--neon-cyan)';
            hudLiveBadge.style.color = 'var(--neon-cyan)';
            hudCountdownBox.classList.remove('visible');
            pipStatusBadge.textContent = 'STANDBY';
            progressStatusDesc.textContent = 'Standby Initialization...';
            progressPctDesc.textContent = '100%';
            globalProgressFill.style.width = '100%';

            if (lastState !== 'WAITING') {
                stopAllAudio();
            }

        } else if (state === 'RECORDING') {
            hudLiveBadge.textContent = `● REC [${style}]`;
            hudLiveBadge.style.borderColor = 'var(--neon-red)';
            hudLiveBadge.style.color = 'var(--neon-red)';
            hudCountdownBox.classList.add('visible');
            countdownText.innerHTML = `<span>RECORDING CLIP ${data.clip_index}/${data.total_clips}</span> <span>${data.recording_remaining_sec}s REMAINING</span>`;
            countdownProgressBar.style.width = `${data.recording_progress_pct}%`;

            pipStatusBadge.textContent = 'MONITOR';
            progressStatusDesc.textContent = `Auto-recording 5 micro-clips (${data.recording_remaining_sec}s left)...`;
            progressPctDesc.textContent = `${data.recording_progress_pct}%`;
            globalProgressFill.style.width = `${data.recording_progress_pct}%`;

            if (lastState !== 'RECORDING') {
                stopAllAudio();
            }

        } else if (state === 'GENERATING') {
            hudLiveBadge.textContent = `GENERATING [${style}]`;
            hudLiveBadge.style.borderColor = 'var(--neon-gold)';
            hudLiveBadge.style.color = 'var(--neon-gold)';
            hudCountdownBox.classList.remove('visible');

            pipStatusBadge.textContent = 'COMPILING';
            progressStatusDesc.textContent = data.generating_status || 'Compiling OpenCV matrix effects...';
            progressPctDesc.textContent = `${data.generating_progress_pct}%`;
            globalProgressFill.style.width = `${data.generating_progress_pct}%`;

            if (lastState !== 'GENERATING') {
                playAudioTrack('waiting', true);
            }

        } else if (state === 'PLAYBACK') {
            hudLiveBadge.textContent = `PLAYBACK [${style}]`;
            hudLiveBadge.style.borderColor = 'var(--neon-green)';
            hudLiveBadge.style.color = 'var(--neon-green)';
            hudCountdownBox.classList.remove('visible');

            pipStatusBadge.textContent = 'PLAYING';
            progressStatusDesc.textContent = `Playing ${style} edit in floating PiP...`;
            progressPctDesc.textContent = '100%';
            globalProgressFill.style.width = '100%';

            if (lastState !== 'PLAYBACK') {
                // Play completion chime then active soundtrack
                if (audios.confirm) {
                    audios.confirm.volume = audioMuted ? 0 : masterVolume;
                    audios.confirm.play().catch(() => {});
                }
                const trackName = data.style;
                playAudioTrack(trackName, true);
            }
        }

        // 5. Download Button
        if (data.edit_ready) {
            btnDownloadReel.classList.remove('disabled');
        } else {
            btnDownloadReel.classList.add('disabled');
        }

        lastState = state;
    }

    // ================= USER ACTIONS & KEYBOARD SHORTCUTS =================

    async function triggerPunchZoom() {
        try {
            await fetch('/api/trigger_punch', { method: 'POST' });
        } catch (e) {
            console.error('Punch zoom error:', e);
        }
    }

    async function setEditStyle(style) {
        try {
            await fetch('/api/set_cycle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ style })
            });
        } catch (e) {
            console.error('Set style error:', e);
        }
    }

    async function forceRecord() {
        try {
            await fetch('/api/force_record', { method: 'POST' });
        } catch (e) {
            console.error('Force record error:', e);
        }
    }

    // Button event listeners
    btnPunchZoom.addEventListener('click', triggerPunchZoom);
    btnForceRecord.addEventListener('click', forceRecord);

    styleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const style = btn.dataset.style;
            setEditStyle(style);
        });
    });

    // Keyboard bindings for all 4 cycles
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            triggerPunchZoom();
        } else if (e.key === '1') {
            setEditStyle('aura');
        } else if (e.key === '2') {
            setEditStyle('sigma');
        } else if (e.key === '3') {
            setEditStyle('second');
        } else if (e.key === '4') {
            setEditStyle('third');
        }
    });

    // Start Real-Time Polling Loop (5 times per second)
    setInterval(pollStatus, 200);
    pollStatus();
});
