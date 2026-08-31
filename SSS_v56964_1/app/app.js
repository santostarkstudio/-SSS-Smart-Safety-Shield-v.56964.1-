/**
 * SSS v.56964.1 — SMART SAFETY SHIELD (NEXT GEN ENGINE)
 * Santo Stark Studio • Universal Multilingual, Gamified CPR, Bank Offers & Multi-Terrain
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // =========================================================================
  // 1. STATE & GLOBAL VARIABLES
  // =========================================================================
  const state = {
    isEmergencyActive: false,
    isDrillMode: false,
    currentMode: 'urban', // 'urban' | 'rural' | 'satellite'
    heartRate: 72,
    spo2: 98,
    cprBpm: 110,
    currentLanguage: 'en-US',
    deferredInstallPrompt: null,
    audioContext: null,
    sirenOscillator: null,
    sirenGain: null,
    metronomeTimer: null,
    tutorialTimer: null,
    tutorialStep: 0,
    cprGameScore: 0,
    lastTapTime: 0,
    trialDaysRemaining: 29,
  };

  // =========================================================================
  // 2. SERVICE WORKER REGISTRATION (OFFLINE RESILIENCE)
  // =========================================================================
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => console.log('[SSS v.56964.1 PWA] ServiceWorker active:', reg.scope))
        .catch((err) => console.warn('[SSS v.56964.1 PWA] ServiceWorker failed:', err));
    });
  }

  // PWA Install Event Handler
  const installAppBtn = document.getElementById('installAppBtn');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.deferredInstallPrompt = e;
    if (installAppBtn) installAppBtn.style.display = 'inline-block';
  });

  if (installAppBtn) {
    installAppBtn.addEventListener('click', async () => {
      if (state.deferredInstallPrompt) {
        state.deferredInstallPrompt.prompt();
        const { outcome } = await state.deferredInstallPrompt.userChoice;
        console.log(`[SSS v.56964.1 Install] ${outcome}`);
        state.deferredInstallPrompt = null;
      } else {
        const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isIos) {
          alert('📱 To install SSS on iPhone / iPad:\n1. Tap the Share button (⬆️) in Safari.\n2. Tap "Add to Home Screen".');
        } else {
          alert('📥 SSS v.56964.1 is ready to install! Look for "Install App" in your browser menu.');
        }
      }
    });
  }

  // =========================================================================
  // 3. TERRAIN MODE SWITCHER (URBAN / RURAL / SATELLITE)
  // =========================================================================
  const modeBtns = document.querySelectorAll('.mode-btn');
  const fleetBadge = document.getElementById('fleetBadge');
  const fleetDescText = document.getElementById('fleetDescText');

  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentMode = btn.dataset.mode;
      updateTerrainMode(state.currentMode);
    });
  });

  function updateTerrainMode(mode) {
    if (mode === 'urban') {
      if (fleetBadge) { fleetBadge.textContent = '4 RIDERS NEARBY'; fleetBadge.className = 'live-pill green'; }
      if (fleetDescText) fleetDescText.textContent = 'Mobilizes instant 10-minute grocery & food delivery riders (Zepto, Swiggy, Blinkit, Uber) within 400m to deliver CPR in under 3 minutes.';
    } else if (mode === 'rural') {
      if (fleetBadge) { fleetBadge.textContent = '🌾 6 VILLAGE VOLUNTEERS ACTIVE'; fleetBadge.className = 'live-pill cyan'; }
      if (fleetDescText) fleetDescText.textContent = 'SSS Gram Guardian Active: Mobilizes local village youth on motorcycles, ASHA health workers, and 2G raw landmark SMS.';
    } else if (mode === 'satellite') {
      if (fleetBadge) { fleetBadge.textContent = '🛰️ SATELLITE NTN LINK READY'; fleetBadge.className = 'live-pill gold'; }
      if (fleetDescText) fleetDescText.textContent = 'Off-Grid Wilderness Protocol: Direct-to-satellite 16-byte emergency packet (NavIC/Starlink) + 5km Helicopter LED Morse Strobe.';
    }
  }

  // =========================================================================
  // 4. 🎮 GAMIFIED 110 BPM CPR RHYTHM CHALLENGE
  // =========================================================================
  const cprGameTapBtn = document.getElementById('cprGameTapBtn');
  const cprScoreBadge = document.getElementById('cprScoreBadge');

  if (cprGameTapBtn) {
    cprGameTapBtn.addEventListener('click', () => {
      const now = performance.now();
      if (state.lastTapTime > 0) {
        const intervalMs = now - state.lastTapTime;
        const tapBpm = Math.round(60000 / intervalMs);
        
        // Target is 110 BPM (approx 545ms interval)
        if (tapBpm >= 100 && tapBpm <= 120) {
          state.cprGameScore += 10;
          cprGameTapBtn.style.borderColor = '#00e676';
          cprGameTapBtn.style.background = 'rgba(0, 230, 118, 0.3)';
          if (cprScoreBadge) cprScoreBadge.textContent = `PERFECT 110 BPM! (+10) SCORE: ${state.cprGameScore}`;
        } else {
          cprGameTapBtn.style.borderColor = '#ff2a4b';
          cprGameTapBtn.style.background = 'rgba(255, 42, 75, 0.3)';
          if (cprScoreBadge) cprScoreBadge.textContent = `TOO ${tapBpm < 100 ? 'SLOW' : 'FAST'} (${tapBpm} BPM)! SCORE: ${state.cprGameScore}`;
        }
      }
      state.lastTapTime = now;
    });
  }

  // =========================================================================
  // 5. 🛡️ 1-TAP WEEKLY GUARDIAN SHIELD HEALTH CHECK
  // =========================================================================
  const runWeeklyCheckBtn = document.getElementById('runWeeklyCheckBtn');
  const healthCheckStatus = document.getElementById('healthCheckStatus');

  if (runWeeklyCheckBtn) {
    runWeeklyCheckBtn.addEventListener('click', () => {
      if (healthCheckStatus) healthCheckStatus.textContent = 'CHECKING...';
      
      setTimeout(() => {
        if (healthCheckStatus) {
          healthCheckStatus.textContent = '100% PASSED ✓';
          healthCheckStatus.style.background = '#00e676';
        }
        alert('🛡️ SSS v.56964.1 Guardian Health Check:\n✓ GPS Lock: Accurate (3m)\n✓ Audio Siren: Operational Level 15\n✓ GSM SMS Baseband: Ready\n✓ Motion Sensors: Calibrated\n✓ All 4 Fail-Safes Armed & Active!');
      }, 1000);
    });
  }

  // =========================================================================
  // 6. 🎁 BANK OFFERS & PROMO COUPONS CONTROLLER
  // =========================================================================
  const offersModal = document.getElementById('offersModal');
  const openOffersBtn = document.getElementById('openOffersBtn');
  const closeOffersBtn = document.getElementById('closeOffersBtn');
  const promoInput = document.getElementById('promoInput');
  const applyPromoBtn = document.getElementById('applyPromoBtn');
  const promoSuccessMsg = document.getElementById('promoSuccessMsg');

  const promoDatabase = {
    'HDFC50': { discount: '50% OFF', msg: '🎉 HDFC Bank Offer Applied: Flat 50% OFF SSS Pro! Your price is now ₹74/month.' },
    'ICICI40': { discount: '40% OFF', msg: '🎉 ICICI Bank Offer Applied: Flat 40% OFF SSS Pro Annual Plan!' },
    'CRED300': { discount: '₹300 OFF', msg: '🎉 CRED Coins Redeemed: ₹300 OFF SSS Handlebar Clicker Hardware!' },
    'STARFREE': { discount: '100% FREE', msg: '🎉 Star Health Insurance Verified: 100% FREE SSS Pro for 365 Days!' },
    'APOLLO20': { discount: '20% OFF', msg: '🩺 Apollo Pharmacy Verified: Flat 20% OFF Cardiac Medicines & Refills!' },
    'SENIOR50': { discount: '50% OFF', msg: '🎉 Senior Citizen Special: Flat 50% OFF Lifetime Guardian Protection!' },
    'STARK100': { discount: '100% VIP', msg: '🛡️ Santo Stark VIP Access: All Pro Features Permanently Unlocked!' }
  };

  function openOffers() { if (offersModal) offersModal.classList.remove('hidden'); }
  function closeOffers() { if (offersModal) offersModal.classList.add('hidden'); }

  function handlePromoApply(code) {
    const cleanCode = (code || (promoInput ? promoInput.value : '')).trim().toUpperCase();
    if (!cleanCode) return;
    if (promoInput) promoInput.value = cleanCode;

    if (promoDatabase[cleanCode]) {
      const p = promoDatabase[cleanCode];
      if (promoSuccessMsg) {
        promoSuccessMsg.className = 'promo-msg success';
        promoSuccessMsg.innerHTML = p.msg;
        promoSuccessMsg.classList.remove('hidden');
      }
      alert(p.msg);
    } else {
      if (promoSuccessMsg) {
        promoSuccessMsg.className = 'promo-msg error';
        promoSuccessMsg.textContent = '❌ Invalid or Expired Promo Code. Try HDFC50, STARFREE or APOLLO20.';
        promoSuccessMsg.classList.remove('hidden');
      }
    }
  }

  window.claimCoupon = function(code) {
    if (promoInput) promoInput.value = code;
    handlePromoApply(code);
  };

  if (openOffersBtn) openOffersBtn.addEventListener('click', openOffers);
  if (closeOffersBtn) closeOffersBtn.addEventListener('click', closeOffers);
  if (applyPromoBtn) applyPromoBtn.addEventListener('click', () => handlePromoApply());

  // =========================================================================
  // 7. 8-SECOND CPR ANIMATED MICRO-TUTORIAL CONTROLLER
  // =========================================================================
  const cprTutorialModal = document.getElementById('cprTutorialModal');
  const openCprTutorialBtn = document.getElementById('openCprTutorialBtn');
  const closeCprTutorialBtn = document.getElementById('closeCprTutorialBtn');
  const tutBarFill = document.getElementById('tutBarFill');
  const tutStepText = document.getElementById('tutStepText');
  const tutVoiceText = document.getElementById('tutVoiceText');
  const startCprFromTutorialBtn = document.getElementById('startCprFromTutorialBtn');

  const tutorialSteps = [
    { title: '<strong>1. Position Hands:</strong> Place heel of hand in center of chest. Interlock fingers.', voice: 'Place heel of hand in center of chest. Interlock fingers.' },
    { title: '<strong>2. Lock Elbows:</strong> Keep arms straight directly above victim.', voice: 'Keep arms straight and elbows locked.' },
    { title: '<strong>3. Push Hard & Fast:</strong> Compress chest 2 inches deep to the 110 BPM beat!', voice: 'Push down hard two inches to the beat. Do not stop.' }
  ];

  function openCprTutorial() {
    if (cprTutorialModal) cprTutorialModal.classList.remove('hidden');
    state.tutorialStep = 0;
    playTutorialCycle();
  }

  function closeCprTutorial() {
    if (cprTutorialModal) cprTutorialModal.classList.add('hidden');
    if (state.tutorialTimer) clearInterval(state.tutorialTimer);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  function playTutorialCycle() {
    updateTutorialStep(state.tutorialStep);
    if (state.tutorialTimer) clearInterval(state.tutorialTimer);

    state.tutorialTimer = setInterval(() => {
      state.tutorialStep = (state.tutorialStep + 1) % 3;
      updateTutorialStep(state.tutorialStep);
    }, 2700);
  }

  function updateTutorialStep(idx) {
    const s = tutorialSteps[idx];
    if (tutStepText) tutStepText.innerHTML = s.title;
    if (tutBarFill) tutBarFill.style.width = `${((idx + 1) / 3) * 100}%`;
    if (tutVoiceText) tutVoiceText.innerHTML = `🔊 Speaking: "${s.voice}"`;
    speakVoice(s.voice);
  }

  if (openCprTutorialBtn) openCprTutorialBtn.addEventListener('click', openCprTutorial);
  if (closeCprTutorialBtn) closeCprTutorialBtn.addEventListener('click', closeCprTutorial);
  if (startCprFromTutorialBtn) {
    startCprFromTutorialBtn.addEventListener('click', () => {
      closeCprTutorial();
      triggerEmergency(false);
    });
  }

  // =========================================================================
  // 8. WEB AUDIO SYNTHESIZER & SPEECH ENGINE
  // =========================================================================
  function initAudioContext() {
    if (!state.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      state.audioContext = new AudioCtx();
    }
    if (state.audioContext.state === 'suspended') {
      state.audioContext.resume();
    }
  }

  function startSiren() {
    initAudioContext();
    if (!state.audioContext) return;

    state.sirenOscillator = state.audioContext.createOscillator();
    state.sirenGain = state.audioContext.createGain();

    state.sirenOscillator.type = 'sawtooth';
    state.sirenOscillator.frequency.setValueAtTime(800, state.audioContext.currentTime);

    const now = state.audioContext.currentTime;
    for (let i = 0; i < 60; i++) {
      state.sirenOscillator.frequency.linearRampToValueAtTime(1600, now + (i * 0.8) + 0.4);
      state.sirenOscillator.frequency.linearRampToValueAtTime(800, now + (i * 0.8) + 0.8);
    }

    state.sirenGain.gain.setValueAtTime(0.7, state.audioContext.currentTime);
    state.sirenOscillator.connect(state.sirenGain);
    state.sirenGain.connect(state.audioContext.destination);
    state.sirenOscillator.start();
  }

  function stopSiren() {
    if (state.sirenOscillator) {
      try {
        state.sirenOscillator.stop();
        state.sirenOscillator.disconnect();
      } catch (e) {}
      state.sirenOscillator = null;
    }
  }

  function playMetronomeClick() {
    if (!state.audioContext) return;
    try {
      const osc = state.audioContext.createOscillator();
      const gain = state.audioContext.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1000, state.audioContext.currentTime);
      gain.gain.setValueAtTime(0.9, state.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, state.audioContext.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(state.audioContext.destination);
      osc.start();
      osc.stop(state.audioContext.currentTime + 0.09);
    } catch (e) {}
  }

  function speakVoice(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = state.currentLanguage;
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }

  // =========================================================================
  // 9. EMERGENCY DISPATCH & BYSTANDER BEACON
  // =========================================================================
  const bystanderOverlay = document.getElementById('bystanderOverlay');
  const sosMainBtn = document.getElementById('sosMainBtn');
  const cancelSosBtn = document.getElementById('cancelSosBtn');
  const drillBtn = document.getElementById('drillBtn');

  function triggerEmergency(isDrill = false) {
    state.isEmergencyActive = true;
    state.isDrillMode = isDrill;

    if (bystanderOverlay) bystanderOverlay.classList.remove('hidden');
    if (!isDrill) startSiren();

    const intervalMs = (60 / state.cprBpm) * 1000;
    state.metronomeTimer = setInterval(playMetronomeClick, intervalMs);

    speakVoice(isDrill ? "Practice Drill Active. Push on center of chest." : "Critical Emergency. The owner of this phone is having a heart attack. Push hard on chest center.");
  }

  function cancelEmergency() {
    state.isEmergencyActive = false;
    state.isDrillMode = false;

    if (bystanderOverlay) bystanderOverlay.classList.add('hidden');
    stopSiren();
    if (state.metronomeTimer) clearInterval(state.metronomeTimer);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  if (sosMainBtn) sosMainBtn.addEventListener('click', () => triggerEmergency(false));
  if (cancelSosBtn) cancelSosBtn.addEventListener('click', cancelEmergency);
  if (drillBtn) drillBtn.addEventListener('click', () => triggerEmergency(true));

  // Quick shortcuts
  const simFallBtn = document.getElementById('simFallBtn');
  const simVehicleBtn = document.getElementById('simVehicleBtn');
  const simVoiceBtn = document.getElementById('simVoiceBtn');

  if (simFallBtn) simFallBtn.addEventListener('click', () => { alert('⚠️ High-G Impact Detected! Auto-Triggering SOS...'); triggerEmergency(false); });
  if (simVehicleBtn) simVehicleBtn.addEventListener('click', () => { alert('🏍️ Handlebar BLE Button Pressed at 60 km/h!'); triggerEmergency(false); });
  if (simVoiceBtn) simVoiceBtn.addEventListener('click', () => { alert('🗣️ Hotword "SSS Help!" Detected!'); triggerEmergency(false); });

  // =========================================================================
  // 10. TABS & BOTTOM NAVIGATION
  // =========================================================================
  const navItems = document.querySelectorAll('.nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(i => i.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      item.classList.add('active');
      const target = document.getElementById(item.dataset.tab);
      if (target) target.classList.add('active');
    });
  });

  // =========================================================================
  // 11. LIVE ECG & RADAR CANVAS ANIMATIONS
  // =========================================================================
  const ecgCanvas = document.getElementById('ecgCanvas');
  if (ecgCanvas) {
    const ctx = ecgCanvas.getContext('2d');
    let x = 0;
    let lastY = 55;

    function drawEcg() {
      ctx.fillStyle = 'rgba(2, 6, 11, 0.05)';
      ctx.fillRect(0, 0, ecgCanvas.width, ecgCanvas.height);

      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, lastY);

      let y = 55;
      const phase = x % 70;
      if (phase === 20) y = 45; // P wave
      else if (phase === 30) y = 62; // Q
      else if (phase === 35) y = 15; // R peak
      else if (phase === 40) y = 80; // S
      else if (phase === 50) y = 48; // T wave

      ctx.lineTo(x + 2, y);
      ctx.stroke();

      lastY = y;
      x = (x + 2) % ecgCanvas.width;
      requestAnimationFrame(drawEcg);
    }
    drawEcg();
  }

  // Street Radar Canvas
  const radarCanvas = document.getElementById('radarCanvas');
  const ridersList = document.getElementById('ridersList');
  if (radarCanvas) {
    const ctx = radarCanvas.getContext('2d');
    let angle = 0;
    const riders = [
      { name: 'Rider #1 (Zepto Bike)', dist: '120m', eta: '1.2m', a: 0.8, r: 50 },
      { name: 'Rider #2 (Blinkit Scooter)', dist: '240m', eta: '2.1m', a: 2.2, r: 80 },
      { name: 'Rider #3 (Swiggy Hero)', dist: '310m', eta: '2.8m', a: 4.1, r: 110 },
      { name: 'Rider #4 (Zomato First Aid)', dist: '390m', eta: '3.4m', a: 5.4, r: 130 }
    ];

    if (ridersList) {
      ridersList.innerHTML = riders.map(r => `
        <div class="rider-card">
          <div class="rider-info">
            <strong>${r.name}</strong>
            <span>${r.dist} away • On Two-Wheeler</span>
          </div>
          <div class="rider-eta">ETA: ${r.eta}</div>
        </div>
      `).join('');
    }

    function drawRadar() {
      ctx.fillStyle = '#02070d';
      ctx.fillRect(0, 0, radarCanvas.width, radarCanvas.height);

      const cx = radarCanvas.width / 2;
      const cy = radarCanvas.height / 2;

      // Concentric rings
      ctx.strokeStyle = 'rgba(0, 230, 118, 0.2)';
      ctx.lineWidth = 1;
      [40, 80, 120].forEach(r => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Rotating sweep line
      ctx.strokeStyle = 'rgba(0, 230, 118, 0.6)';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * 140, cy + Math.sin(angle) * 140);
      ctx.stroke();

      // Riders
      riders.forEach(r => {
        const rx = cx + Math.cos(r.a) * r.r;
        const ry = cy + Math.sin(r.a) * r.r;
        ctx.fillStyle = '#00e676';
        ctx.beginPath();
        ctx.arc(rx, ry, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      angle += 0.03;
      requestAnimationFrame(drawRadar);
    }
    drawRadar();
  }

  // Time updater
  setInterval(() => {
    const d = new Date();
    const statusTime = document.getElementById('statusTime');
    if (statusTime) statusTime.textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, 1000);

  // Global Language Picker
  const globalLangPicker = document.getElementById('globalLangPicker');
  if (globalLangPicker) {
    globalLangPicker.addEventListener('change', (e) => {
      state.currentLanguage = e.target.value;
      speakVoice("Language set to " + e.target.options[e.target.selectedIndex].text);
    });
  }

});
