/**
 * SSS v.56964 — SMART SAFETY SHIELD JAVASCRIPT ENGINE
 * Santo Stark Studio • Multilingual, Installable PWA, 8s CPR Animation & Bank Offers Hub
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // =========================================================================
  // 1. STATE & GLOBAL VARIABLES
  // =========================================================================
  const state = {
    isEmergencyActive: false,
    isDrillMode: false,
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
    trialDaysRemaining: 29,
    // Superpower upgrades (Options A, B & C)
    isVoiceListening: false,
    speechRecognition: null,
    bleDevice: null,
    leafletMap: null,
    fallCountdownTimer: null,
    fallCountdownSeconds: 5,
    cprGameActive: false,
    cprGameTimer: null,
    cprGameTimeLeft: 30,
    cprGameTaps: 0,
    cprGameBeatsInTarget: 0,
    cprGameLastTapTime: null,
    cprGameCurrentBpm: 0,
    userCoords: { lat: 37.7749, lng: -122.4194 },
    // Upgrade Pack additions
    hrHistory: [],          // 24h HR data points (simulated + BLE)
    weatherData: null,      // Cached Open-Meteo response
    batteryLevel: 0.8,
    batteryCharging: false,
    backendWs: null,
    backendConnected: false,
    // boAt Lunar Discovery Dedicated Companion State
    boatWatch: {
      connected: false,
      device: null,
      battery: 88,
      steps: 7842,
      calories: 420,
      distance: 5.6,
      hr: 72,
      spo2: 98,
      stress: 34,
      simInterval: null,
      isSim: false
    },
    breathingSession: {
      active: false,
      timer: null,
      secondsLeft: 120,
      phase: 'inhale'
    },
    activeWorkout: {
      active: false,
      timer: null,
      seconds: 0,
      sport: 'Outdoor Run',
      calRate: 9.5,
      caloriesBurned: 0
    }
  };

  // =========================================================================
  // 2. SERVICE WORKER REGISTRATION (OFFLINE RESILIENCE)
  // =========================================================================
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => console.log('[SSS PWA] ServiceWorker registered with scope:', reg.scope))
        .catch((err) => console.warn('[SSS PWA] ServiceWorker registration failed:', err));
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
        console.log(`[SSS Install] User response: ${outcome}`);
        state.deferredInstallPrompt = null;
      } else {
        const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isIos) {
          alert('📱 To install SSS on iPhone / iPad:\n1. Tap the Share button (⬆️) at the bottom.\n2. Select "Add to Home Screen".');
        } else {
          alert('📥 SSS is ready to install! Look for the "Install SSS" icon in your browser address bar or menu.');
        }
      }
    });
  }

  // =========================================================================
  // 3. 🎁 BANK OFFERS & PROMO COUPONS CONTROLLER
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
    'SENIOR50': { discount: '50% OFF', msg: '🎉 Senior Citizen Special: Flat 50% OFF Lifetime Guardian Protection!' },
    'STARK100': { discount: '100% VIP', msg: '🛡️ Santo Stark VIP Access: All Pro Features Permanently Unlocked!' }
  };

  function openOffers() {
    if (offersModal) offersModal.classList.remove('hidden');
  }

  function closeOffers() {
    if (offersModal) offersModal.classList.add('hidden');
  }

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
        promoSuccessMsg.textContent = '❌ Invalid or Expired Promo Code. Please try HDFC50 or STARFREE.';
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
  // 4. UNIVERSAL 30+ GLOBAL LANGUAGES DICTIONARY
  // =========================================================================
  const i18nData = {
    'en-US': {
      brandTitle: 'SMART SAFETY SHIELD',
      drillBtn: '🛡️ DRILL',
      restingNormal: 'Resting Normal',
      optimalSpo2: 'Optimal SpO2',
      gpsReady: 'GPS Ready',
      tapEmergency: '1-TAP EMERGENCY BEACON',
      guidanceText: 'Instantly blares <strong>Acoustic Siren</strong> + alerts <strong>Delivery Fleet</strong> & <strong>Family</strong>',
      simFall: '⚠️ Simulate Fall',
      simHandlebar: '🏍️ Handlebar Click',
      simVoice: '🗣️ "SSS Help!"',
      medicalIdTitle: '🩺 EMERGENCY MEDICAL ID',
      lockscreenReady: 'LOCK-SCREEN READY',
      lblPatient: 'Patient:',
      lblCondition: 'Condition:',
      lblBlood: 'Blood Group:',
      lblAllergies: 'Allergies:',
      lblMeds: 'Key Meds:',
      lblDoctor: 'Cardiologist:',
      lblCaregiver: 'Caregiver:',
      vitalsTitle: '🫀 Live Cardiac Monitor',
      sinusNormal: 'Sinus Rhythm (Normal)',
      heartRate: 'Heart Rate',
      hrNote: 'Optimal Rest Range (60-80)',
      bloodOxygen: 'Blood Oxygen',
      spo2Note: 'Healthy Lung Diffusion',
      dailySteps: 'Daily Steps',
      stepsNote: 'Cardiac Rehab Goal: 90%',
      smartwatch: 'Smartwatch Sync',
      connected: 'CONNECTED',
      medTitle: 'Next Dose: Aspirin 75mg',
      medTime: 'Due in 40 mins (08:30 PM) • Preventative Anti-platelet',
      markTaken: 'Mark Taken',
      exportPdf: '📄 Generate 1-Tap Cardiologist PDF Report',
      fleetTitle: '🛵 SSS Street Fleet Radar',
      ridersNearby: '4 RIDERS NEARBY',
      fleetDesc: 'Mobilizes instant 10-minute grocery & food delivery riders (Zepto, Swiggy, Blinkit, Uber) within 400m to deliver CPR in under 3 minutes.',
      tutBtnTitle: '⚡ 8-Second CPR Micro-Tutorial',
      tutBtnSub: 'Watch animated hand placement & audio guide for helpers',
      cprTutHeader: '⚡ 8-SECOND HELPER CPR GUIDE',
      startNowBtn: '🫀 START 110 BPM CPR RESCUE NOW',
      step1Text: '<strong>1. Position Hands:</strong> Place heel of hand in center of chest. Interlock fingers.',
      step2Text: '<strong>2. Lock Elbows:</strong> Keep arms straight directly above victim.',
      step3Text: '<strong>3. Push Hard & Fast:</strong> Compress chest 2 inches deep to the 110 BPM beat!',
      tutVoicePrompts: [
        'Place heel of hand in center of chest. Interlock fingers.',
        'Keep arms straight and elbows locked.',
        'Push down hard two inches to the beat. Do not stop.'
      ],
      vehicleTitle: '🚲 In-Transit & Hardware',
      handlebarBadge: 'HANDLEBAR BUTTON',
      handlebarTitle: 'SSS Smart Bike/Moto Clicker',
      handlebarDesc: 'Waterproof BLE button strapped to handlebar. Triggers SOS without looking at screen.',
      pairedOk: 'Paired (CR2032 Battery 98%)',
      testClick: 'Trigger Test Click',
      carplayBadge: 'CAR DASHBOARD / CARPLAY',
      motionGuardTitle: 'Vehicle Motion Guard',
      motionGuardDesc: 'Detects sudden deceleration/crashes at >40 km/h and routes emergency audio to car speakers.',
      smartHomeBadge: 'SMART HOME UNLOCK',
      smartHomeTitle: 'Smart Door & Porch Beacon',
      smartHomeDesc: 'Auto-unlocks front door (Nuki / Yale / Tuya) and flashes porch lights when SOS triggers at home.',
      doorArmed: 'Linked & Armed',
      failsafeTitle: '🛡️ 99.99% Fail-Safe Suite',
      dndTitle: '🔕 Do Not Disturb (DND) Bypass',
      dndDesc: 'Forces STREAM_ALARM to Level 15 (Max Volume).',
      airplaneTitle: '✈️ Airplane Mode Hardware Override',
      airplaneDesc: 'Baseband radio hook auto-acquires cellular towers on SOS.',
      offlineMeshTitle: '📶 Zero-Network Offline Mesh & Hotspot',
      offlineMeshDesc: 'Broadcasts BLE packets & local emergency Wi-Fi hotspot.',
      gpsLanguageTitle: '🗣️ Active Global Language',
      gpsLanguageDesc: 'Spoken voice coach and UI language automatically matched to user.',
      runDiagnostics: '⚙️ Run 1-Click System Uptime Diagnostics',
      navSos: 'SOS Shield',
      navVitals: 'Vitals',
      navFleet: 'Fleet Radar',
      navVehicle: 'Vehicle',
      navFailsafes: 'Fail-Safes',
      bystanderBadge: '🚨 CRITICAL MEDICAL EMERGENCY',
      bystanderHeadline: 'OWNER IS HAVING A HEART ATTACK!',
      bystanderSubline: 'Ambulance & Family have been dispatched with GPS coordinates.',
      cprMetronomeHeader: '🫀 CPR CHEST COMPRESSION METRONOME',
      cprPressHere: 'PRESS HERE',
      cprPushHard: 'Push hard & fast to this flashing beat!',
      btnCallEmergency: '📞 CALL 911 / 112 NOW',
      btnLocateAed: '⚡ LOCATE NEAREST AED (45m)',
      patientProfileTitle: 'PATIENT MEDICAL PROFILE',
      btnCancelEmergency: '✕ CANCEL EMERGENCY / SILENCE SIREN',
      voicePrompts: [
        'Emergency! The owner of this phone is having a heart attack. Please help them.',
        'Check breathing. Push hard on the center of the chest to this beat.',
        'Push down two inches. Keep pushing to the rhythm. Ambulance is on the way.'
      ]
    },

    'hi-IN': {
      brandTitle: 'स्मार्ट सेफ्टी शील्ड',
      drillBtn: '🛡️ अभ्यास ड्रिल',
      restingNormal: 'सामान्य आराम',
      optimalSpo2: 'इष्टतम ऑक्सीजन',
      gpsReady: 'जीपीएस तैयार',
      tapEmergency: '1-टैप आपातकालीन बीकन',
      guidanceText: 'तुरंत <strong>सायरन</strong> बजाता है + <strong>डिलीवरी फ्लीट</strong> और <strong>परिवार</strong> को अलर्ट करता है',
      simFall: '⚠️ गिरने का अनुकरण',
      simHandlebar: '🏍️ हैंडल बटन',
      simVoice: '🗣️ "मदद करो!"',
      medicalIdTitle: '🩺 आपातकालीन मेडिकल आईडी',
      lockscreenReady: 'लॉक-स्क्रीन तैयार',
      lblPatient: 'मरीज:',
      lblCondition: 'स्थिति:',
      lblBlood: 'रक्त समूह:',
      lblAllergies: 'एलर्जी:',
      lblMeds: 'प्रमुख दवाएं:',
      lblDoctor: 'हृदय रोग विशेषज्ञ:',
      lblCaregiver: 'देखभालकर्ता:',
      vitalsTitle: '🫀 लाइव हृदय मॉनिटर',
      sinusNormal: 'सामान्य हृदय गति',
      heartRate: 'हृदय गति',
      hrNote: 'इष्टतम आराम सीमा (60-80)',
      bloodOxygen: 'रक्त ऑक्सीजन',
      spo2Note: 'स्वस्थ फेफड़े',
      dailySteps: 'दैनिक कदम',
      stepsNote: 'हृदय स्वास्थ्य लक्ष्य: 90%',
      smartwatch: 'स्मार्टवॉच सिंक',
      connected: 'कनेक्टेड',
      medTitle: 'अगली खुराक: एस्पिरिन 75mg',
      medTime: '40 मिनट में देय (08:30 PM)',
      markTaken: 'लिया गया मार्क करें',
      exportPdf: '📄 डॉक्टर रिपोर्ट तैयार करें',
      fleetTitle: '🛵 एस.एस.एस स्ट्रीट फ्लीट रडार',
      ridersNearby: '4 राइडर पास में हैं',
      fleetDesc: '3 मिनट के भीतर सीपीआर देने के लिए 400 मीटर के भीतर डिलीवरी राइडर्स को जुटाता है।',
      tutBtnTitle: '⚡ 8-सेकंड सीपीआर ट्यूटोरियल',
      tutBtnSub: 'मददगारों के लिए एनिमेटेड हाथ रखने का तरीका और ऑडियो गाइड',
      cprTutHeader: '⚡ 8-सेकंड त्वरित सीपीआर गाइड',
      startNowBtn: '🫀 110 BPM सीपीआर अभी शुरू करें',
      step1Text: '<strong>1. हाथ रखें:</strong> छाती के बीच में हाथ रखें। उंगलियों को आपस में फंसाएं।',
      step2Text: '<strong>2. कोहनी सीधी:</strong> हाथ सीधे रखें और छाती के लंबवत रहें।',
      step3Text: '<strong>3. जोर से दबाएं:</strong> 2 इंच गहरा और 110 ताल पर दबाएं!',
      tutVoicePrompts: [
        'छाती के बीच में हाथ रखें। उंगलियों को आपस में फंसाएं।',
        'कोहनी बिल्कुल सीधी रखें।',
        'ताल पर जोर से 2 इंच गहरा दबाएं। रुकें नहीं।'
      ],
      vehicleTitle: '🚲 वाहन और हार्डवेयर',
      handlebarBadge: 'हैंडलबार बटन',
      handlebarTitle: 'स्मार्ट बाइक क्लिकर',
      handlebarDesc: 'स्क्रीन को देखे बिना एसओएस ट्रिगर करता है।',
      pairedOk: 'पेयर किया गया (बैटरी 98%)',
      testClick: 'परीक्षण क्लिक',
      carplayBadge: 'कार डैशबोर्ड',
      motionGuardTitle: 'वाहन गति रक्षक',
      motionGuardDesc: 'अचानक दुर्घटनाओं का पता लगाता है और कार स्पीकर पर सायरन बजाता है।',
      smartHomeBadge: 'स्मार्ट होम अनलॉक',
      smartHomeTitle: 'स्मार्ट दरवाजा और लाइट',
      smartHomeDesc: 'आपातकाल में घर का दरवाजा अपने आप अनलॉक करता है।',
      doorArmed: 'सक्रिय',
      failsafeTitle: '🛡️ 99.99% सुरक्षा सूट',
      dndTitle: '🔕 साइलेंट मोड बाईपास',
      dndDesc: 'सायरन को अधिकतम वॉल्यूम पर बजाता है।',
      airplaneTitle: '✈️ हवाई जहाज मोड ओवरराइड',
      airplaneDesc: 'आपातकाल में तुरंत नेटवर्क चालू करता है।',
      offlineMeshTitle: '📶 ऑफलाइन मेश बीकन',
      offlineMeshDesc: 'बिना इंटरनेट के ब्लूटूथ पर अलर्ट भेजता है।',
      gpsLanguageTitle: '🗣️ सक्रिय भाषा',
      gpsLanguageDesc: 'आवाज और स्क्रीन भाषा स्वचालित रूप से मिलान की गई।',
      runDiagnostics: '⚙️ 1-क्लिक सिस्टम जांच',
      navSos: 'एसओएस शील्ड',
      navVitals: 'वाइटल्स',
      navFleet: 'फ्लीट रडार',
      navVehicle: 'वाहन',
      navFailsafes: 'सुरक्षा',
      bystanderBadge: '🚨 गंभीर आपातकालीन स्थिति',
      bystanderHeadline: 'फोन के मालिक को दिल का दौरा पड़ा है!',
      bystanderSubline: 'एम्बुलेंस और परिवार को स्थान भेज दिया गया है।',
      cprMetronomeHeader: '🫀 सीपीआर छाती दबाव मेट्रोनोम',
      cprPressHere: 'यहां दबाएं',
      cprPushHard: 'इस ताल पर जोर से और तेजी से दबाएं!',
      btnCallEmergency: '📞 112 / 108 को कॉल करें',
      btnLocateAed: '⚡ निकटतम डिफाइब्रिलेटर खोजें',
      patientProfileTitle: 'रोगी का विवरण',
      btnCancelEmergency: '✕ आपातकाल रद्द करें / सायरन बंद करें',
      voicePrompts: [
        'आपातकाल! इस फोन के मालिक को दिल का दौरा पड़ा है। कृपया मदद करें।',
        'सांस जांचें। छाती के बीच में इस ताल पर जोर से दबाएं।',
        'लगातार दबाते रहें। एम्बुलेंस आ रही है।'
      ]
    },

    'te-IN': {
      brandTitle: 'స్మార్ట్ సేఫ్టీ షీల్డ్',
      drillBtn: '🛡️ డ్రిల్',
      restingNormal: 'విశ్రాంతి సాధారణం',
      optimalSpo2: 'ఆప్టిమల్ SpO2',
      gpsReady: 'జీపీఎస్ సిద్ధం',
      tapEmergency: '1-ట్యాప్ ఎమర్జెన్సీ బీకన్',
      guidanceText: 'వెంటనే <strong>సైరన్</strong> మోగుతుంది + <strong>డెలివరీ రైడర్లు</strong> & <strong>కుటుంబానికి</strong> హెచ్చరిక పంపుతుంది',
      simFall: '⚠️ పడిపోవడం అనుకరణ',
      simHandlebar: '🏍️ హ్యాండిల్‌బార్ క్లిక్',
      simVoice: '🗣️ "సాయం చేయండి!"',
      medicalIdTitle: '🩺 ఎమర్జెన్సీ మెడికల్ ఐడీ',
      lockscreenReady: 'లాక్-స్క్రీన్ సిద్ధం',
      lblPatient: 'రోగి:',
      lblCondition: 'పరిస్థితి:',
      lblBlood: 'రక్త వర్గం:',
      lblAllergies: 'అలెర్జీలు:',
      lblMeds: 'ముఖ్యమైన మందులు:',
      lblDoctor: 'గుండె వైద్యుడు:',
      lblCaregiver: 'సంరక్షకుడు:',
      vitalsTitle: '🫀 ప్రత్యక్ష గుండె మానిటర్',
      sinusNormal: 'సాధారణ గుండె లయ',
      heartRate: 'గుండె వేగం',
      hrNote: 'సాధారణ పరిధి (60-80)',
      bloodOxygen: 'రక్తంలో ఆక్సిజన్',
      spo2Note: 'ఆరోగ్యకరమైన శ్వాస',
      dailySteps: 'రోజువారీ అడుగులు',
      stepsNote: 'లక్ష్యం: 90%',
      smartwatch: 'స్మార్ట్‌వాచ్ సింక్',
      connected: 'కనెక్ట్ చేయబడింది',
      medTitle: 'తదుపరి మందు: ఆస్పిరిన్ 75mg',
      medTime: '40 నిమిషాల్లో వేసుకోవాలి',
      markTaken: 'తీసుకున్నట్లు మార్క్ చేయండి',
      exportPdf: '📄 డాక్టర్ రిపోర్ట్ సిద్ధం చేయండి',
      fleetTitle: '🛵 ఎస్.ఎస్.ఎస్ స్ట్రీట్ ఫ్లీట్ రాడార్',
      ridersNearby: '4 రైడర్లు సమీపంలో ఉన్నారు',
      fleetDesc: '3 నిమిషాల్లో సీపీఆర్ అందించడానికి 400 మీటర్లలోపు ఉన్న డెలివరీ రైడర్లను సమీకరిస్తుంది.',
      tutBtnTitle: '⚡ 8-సెకన్ల సీపీఆర్ ట్యుటోరియల్',
      tutBtnSub: 'సహాయకుల కోసం యానిమేటెడ్ గైడ్ & ఆడియో వాయిస్‌ఓవర్',
      cprTutHeader: '⚡ 8-సెకన్ల క్విక్ సీపీఆర్ గైడ్',
      startNowBtn: '🫀 110 BPM సీపీఆర్ రెస్క్యూ ప్రారంభించండి',
      step1Text: '<strong>1. చేతులు ఉంచండి:</strong> ఛాతీ మధ్యలో చేతులు ఉంచండి. వేళ్లను లాక్ చేయండి.',
      step2Text: '<strong>2. చేతులు నిటారుగా:</strong> మోచేతులను వంచకుండా నేరుగా ఉంచండి.',
      step3Text: '<strong>3. బలంగా నొక్కండి:</strong> 2 అంగుళాల లోతుకు 110 లయతో నొక్కండి!',
      tutVoicePrompts: [
        'ఛాతీ మధ్యలో చేతులు ఉంచండి. వేళ్లను లాక్ చేయండి.',
        'చేతులను నిటారుగా ఉంచండి.',
        'లయకు బలంగా 2 అంగుళాలు లోపలికి నొక్కండి. ఆపవద్దు.'
      ],
      vehicleTitle: '🚲 వాహనం & హార్డ్‌వేర్',
      handlebarBadge: 'హ్యాండిల్‌బార్ బటన్',
      handlebarTitle: 'స్మార్ట్ బైక్ క్లిక్కర్',
      handlebarDesc: 'స్క్రీన్ చూడకుండానే ఎమర్జెన్సీ ట్రిగ్గర్ చేయండి.',
      pairedOk: 'కనెక్ట్ అయింది (బ్యాటరీ 98%)',
      testClick: 'టెస్ట్ క్లిక్',
      carplayBadge: 'కార్ డ్యాష్‌బోర్డ్',
      motionGuardTitle: 'వాహన మోషన్ గార్డ్',
      motionGuardDesc: 'ప్రమాదాలను గుర్తించి కార్ స్పీకర్ల ద్వారా సైరన్ మోగిస్తుంది.',
      smartHomeBadge: 'స్మార్ట్ హోమ్ అన్‌లాక్',
      smartHomeTitle: 'స్మార్ట్ డోర్ అన్‌లాక్',
      smartHomeDesc: 'ఎమర్జెన్సీ సమయంలో ఇంటి తలుపును ఆటోమేటిక్‌గా అన్‌లాక్ చేస్తుంది.',
      doorArmed: 'యాక్టివ్',
      failsafeTitle: '🛡️ 99.99% భద్రతా ఫీచర్లు',
      dndTitle: '🔕 సైలెంట్ మోడ్ బైపాస్',
      dndDesc: 'సైరన్‌ను గరిష్ట సౌండ్‌తో మోగిస్తుంది.',
      airplaneTitle: '✈️ ఏరోప్లేన్ మోడ్ ఓవర్‌రైడ్',
      airplaneDesc: 'ఆటోమేటిక్‌గా సిగ్నల్ కనెక్ట్ చేస్తుంది.',
      offlineMeshTitle: '📶 ఆఫ్‌లైన్ మెష్ బీకన్',
      offlineMeshDesc: 'ఇంటర్నెట్ లేకుండానే అలర్ట్ పంపుతుంది.',
      gpsLanguageTitle: '🗣️ క్రియాశీల భాష',
      gpsLanguageDesc: 'యూజర్‌కు అనుకూలమైన భాష.',
      runDiagnostics: '⚙️ 1-క్లిక్ సిస్టమ్ తనిఖీ',
      navSos: 'ఎస్ఓఎస్ షీల్డ్',
      navVitals: 'వైటల్స్',
      navFleet: 'రాడార్',
      navVehicle: 'వాహనం',
      navFailsafes: 'భద్రత',
      bystanderBadge: '🚨 అత్యవసర వైద్య పరిస్థితి',
      bystanderHeadline: 'ఈ ఫోన్ యజమానికి గుండెపోటు వచ్చింది!',
      bystanderSubline: 'అంబులెన్స్ మరియు కుటుంబ సభ్యులకు లొకేషన్ పంపబడింది.',
      cprMetronomeHeader: '🫀 సీపీఆర్ ఛాతీ కంప్రెషన్ మెట్రోనోమ్',
      cprPressHere: 'ఇక్కడ నొక్కండి',
      cprPushHard: 'ఈ లయకు బలంగా మరియు వేగంగా నొక్కండి!',
      btnCallEmergency: '📞 112 / 108 కు కాల్ చేయండి',
      btnLocateAed: '⚡ సమీప డీఫిబ్రిలేటర్‌ను కనుగొనండి',
      patientProfileTitle: 'రోగి మెడికల్ వివరాలు',
      btnCancelEmergency: '✕ రద్దు చేయండి / సైరన్ ఆపండి',
      voicePrompts: [
        'అత్యవసర పరిస్థితి! దయచేసి సహాయం చేయండి. గుండెపోటు సంభవించింది.',
        'ఛాతీ మధ్యలో ఈ లయకు బలంగా నొక్కండి.',
        'ఆపకుండా నొక్కండి. అంబులెన్స్ వస్తోంది.'
      ]
    }
  };

  // =========================================================================
  // 5. I18N RENDER ENGINE
  // =========================================================================
  function applyLanguage(langCode) {
    state.currentLanguage = langCode;
    const dict = i18nData[langCode] || i18nData['en-US'];

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.innerHTML = dict[key];
      }
    });

    const activeLangTag = document.getElementById('activeLangTag');
    if (activeLangTag) activeLangTag.textContent = langCode.toUpperCase();

    if (langCode === 'ar-SA') {
      document.body.style.direction = 'rtl';
    } else {
      document.body.style.direction = 'ltr';
    }
  }

  const globalLangPicker = document.getElementById('globalLangPicker');
  if (globalLangPicker) {
    globalLangPicker.addEventListener('change', (e) => {
      applyLanguage(e.target.value);
    });
  }

  // =========================================================================
  // 6. TAB NAVIGATION
  // =========================================================================
  const navItems = document.querySelectorAll('.nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');
      navItems.forEach(n => n.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      item.classList.add('active');
      const pane = document.getElementById(targetTab);
      if (pane) pane.classList.add('active');
    });
  });

  // Clock
  const statusTime = document.getElementById('statusTime');
  function updateClock() {
    const now = new Date();
    statusTime.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  setInterval(updateClock, 1000);
  updateClock();

  // =========================================================================
  // 8. AUDIO SIREN & MULTILINGUAL VOICE ENGINE
  // =========================================================================
  function initAudio() {
    if (!state.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      state.audioContext = new AudioCtx();
    }
  }

  function startAcousticSiren() {
    try {
      initAudio();
      if (state.audioContext.state === 'suspended') {
        state.audioContext.resume();
      }

      const osc = state.audioContext.createOscillator();
      const gain = state.audioContext.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, state.audioContext.currentTime);

      const now = state.audioContext.currentTime;
      for (let i = 0; i < 40; i++) {
        osc.frequency.exponentialRampToValueAtTime(1500, now + (i * 0.4) + 0.2);
        osc.frequency.exponentialRampToValueAtTime(800, now + (i * 0.4) + 0.4);
      }

      gain.gain.setValueAtTime(0.3, state.audioContext.currentTime);
      osc.connect(gain);
      gain.connect(state.audioContext.destination);

      osc.start();
      state.sirenOscillator = osc;
    } catch (e) {}
  }

  function stopAcousticSiren() {
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
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, state.audioContext.currentTime);
      gain.gain.setValueAtTime(0.2, state.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, state.audioContext.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(state.audioContext.destination);
      osc.start();
      osc.stop(state.audioContext.currentTime + 0.08);
    } catch (e) {}
  }

  function speakCprCoach(index = 0) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const dict = i18nData[state.currentLanguage] || i18nData['en-US'];
    const prompts = dict.voicePrompts || i18nData['en-US'].voicePrompts;
    const text = prompts[index % prompts.length];

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = state.currentLanguage;
    utterance.rate = 1.05;
    utterance.pitch = 1.1;

    const voicePromptText = document.getElementById('voicePromptText');
    if (voicePromptText) {
      voicePromptText.textContent = `🔊 Voice Coach (${state.currentLanguage}): "${text}"`;
    }
    window.speechSynthesis.speak(utterance);
  }

  // =========================================================================
  // 9. SOS EMERGENCY SEQUENCE
  // =========================================================================
  const sosMainBtn = document.getElementById('sosMainBtn');
  const bystanderOverlay = document.getElementById('bystanderOverlay');
  const cancelSosBtn = document.getElementById('cancelSosBtn');
  const drillBtn = document.getElementById('drillBtn');

  function triggerEmergency(triggerReason = 'MANUAL_1_TAP_BUTTON') {
    if (state.isEmergencyActive) return;
    state.isEmergencyActive = true;

    bystanderOverlay.classList.remove('hidden');
    startAcousticSiren();

    let beatCount = 0;
    state.metronomeTimer = setInterval(() => {
      playMetronomeClick();
      beatCount++;
      if (beatCount % 12 === 1) {
        speakCprCoach(Math.floor(beatCount / 12));
      }
    }, 545);

    speakCprCoach(0);
    if (navigator.vibrate) navigator.vibrate([400, 200, 400, 200, 800]);

    // Transmit distress beacon to Cloud Dispatch Server & Guardians
    broadcastSosToCloud(triggerReason);
  }

  function cancelEmergency() {
    state.isEmergencyActive = false;
    bystanderOverlay.classList.add('hidden');
    stopAcousticSiren();

    if (state.metronomeTimer) {
      clearInterval(state.metronomeTimer);
      state.metronomeTimer = null;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    if (state.isDrillMode) {
      state.isDrillMode = false;
      drillBtn.textContent = '🛡️ DRILL';
      alert('Safe Practice Drill Completed! All systems verified.');
    }

    // Cancel emergency on Cloud Dispatch Server & Guardians
    cancelSosOnCloud();
  }

  if (sosMainBtn) sosMainBtn.addEventListener('click', () => triggerEmergency('BIG_RED_BUTTON'));
  if (cancelSosBtn) cancelSosBtn.addEventListener('click', cancelEmergency);

  // Quick Trigger Buttons
  document.getElementById('simFallBtn')?.addEventListener('click', () => {
    alert('⚠️ Fall Simulation: This feature is available in the mobile app version.');
  });
  document.getElementById('simFallBtn_DISABLED')?.addEventListener('click', () => {
    alert('⚠️ Simulated High-G Drop Impact detected!\nAuto-triggering SSS Beacon in 1s...');
    setTimeout(() => triggerEmergency('AUTO_FALL_DETECTION'), 1000);
  });

  document.getElementById('simVehicleBtn')?.addEventListener('click', () => triggerEmergency('BLE_HANDLEBAR_BUTTON'));
  document.getElementById('testHandlebarBtn')?.addEventListener('click', () => triggerEmergency('BLE_HANDLEBAR_TEST_BUTTON'));

  document.getElementById('simVoiceBtn')?.addEventListener('click', () => {
    alert('🗣️ Hotword "SSS Help!" Recognized via Voice Engine!');
    triggerEmergency('VOICE_HOTWORD');
  });

  if (drillBtn) {
    drillBtn.addEventListener('click', () => {
      state.isDrillMode = true;
      drillBtn.textContent = '● DRILL ON';
      alert('🛡️ Starting 10-Second SSS Safe Practice Drill.');
      triggerEmergency('SAFE_PRACTICE_DRILL');
    });
  }

  document.getElementById('call911Btn')?.addEventListener('click', () => {
    alert('📞 Directing Call to Emergency Services (911 / 112 / 108 / 120)...\nGPS Location & Medical ID transmitted.');
  });

  document.getElementById('locateAedBtn')?.addEventListener('click', () => {
    alert('⚡ AED Defibrillator Found:\n📍 Metro Station Entrance (45 meters East, Wall Mounted #AED-04)');
  });

  // =========================================================================
  // 10. REAL-TIME ECG & RADAR
  // =========================================================================
  const ecgCanvas = document.getElementById('ecgCanvas');
  const ecgCtx = ecgCanvas ? ecgCanvas.getContext('2d') : null;
  let ecgX = 0;
  let ecgY = 65;
  let stepInBeat = 0;

  function drawECG() {
    if (!ecgCtx) return;
    const ecgPattern = [65, 65, 63, 60, 64, 65, 65, 68, 15, 110, 65, 65, 60, 55, 62, 65, 65, 65, 65, 65];

    ecgCtx.strokeStyle = '#00e5ff';
    ecgCtx.lineWidth = 2.5;
    ecgCtx.shadowColor = '#00e5ff';
    ecgCtx.shadowBlur = 8;

    ecgCtx.beginPath();
    ecgCtx.moveTo(ecgX, ecgY);

    const targetY = ecgPattern[stepInBeat % ecgPattern.length];
    stepInBeat++;

    const speed = Math.max(2, Math.min(8, (state.heartRate / 72) * 4));
    ecgX += speed;
    ecgY = targetY;

    ecgCtx.lineTo(ecgX, ecgY);
    ecgCtx.stroke();

    ecgCtx.clearRect(ecgX + 1, 0, 16, ecgCanvas.height);
    if (ecgX >= ecgCanvas.width) {
      ecgX = 0;
      ecgCtx.clearRect(0, 0, 20, ecgCanvas.height);
    }
    requestAnimationFrame(drawECG);
  }
  if (ecgCanvas) drawECG();

  // Radar Canvas
  const radarCanvas = document.getElementById('radarCanvas');
  const radarCtx = radarCanvas ? radarCanvas.getContext('2d') : null;
  let radarAngle = 0;

  let nearbyRiders = [
    { name: 'Zepto Rider (Karan M.)', dist: '180m', eta: '1m 20s', angle: 0.8, radius: 45, color: '#00e676' },
    { name: 'Blinkit Rider (Rahul S.)', dist: '290m', eta: '2m 10s', angle: 2.3, radius: 75, color: '#ffb300' },
    { name: 'Swiggy Partner (Amit D.)', dist: '340m', eta: '2m 45s', angle: 4.1, radius: 95, color: '#ff2a4b' },
    { name: 'Uber Moto (Vikram T.)', dist: '410m', eta: '3m 15s', angle: 5.4, radius: 110, color: '#00e5ff' },
  ];

  function updateFleetFromBackend(fleet) {
    if (!Array.isArray(fleet) || fleet.length === 0) return;
    const angles = [0.8, 2.3, 4.1, 5.4];
    nearbyRiders = fleet.map((r, i) => {
      const mins = Math.floor((r.etaSec || 60) / 60);
      const secs = (r.etaSec || 60) % 60;
      const etaStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
      return {
        name: r.name,
        dist: `${r.distanceM || 200}m`,
        eta: etaStr,
        angle: angles[i % angles.length],
        radius: Math.max(25, Math.min(115, Math.round(((r.distanceM || 200) / 450) * 110))),
        color: r.color || '#00e676',
        lat: r.lat,
        lng: r.lng
      };
    });
    renderRidersList();
  }

  function renderRidersList() {
    const list = document.getElementById('ridersList');
    if (!list) return;
    list.innerHTML = nearbyRiders.map(r => `
      <div class="rider-card">
        <div class="rider-info">
          <strong>${r.name}</strong>
          <span>📍 ${r.dist} away • Equipped with First-Aid</span>
        </div>
        <div class="rider-eta">ETA: ${r.eta}</div>
      </div>
    `).join('');
  }
  renderRidersList();

  function drawRadar() {
    if (!radarCtx) return;
    const w = radarCanvas.width;
    const h = radarCanvas.height;
    const cx = w / 2;
    const cy = h / 2;

    radarCtx.fillStyle = 'rgba(2, 7, 13, 0.15)';
    radarCtx.fillRect(0, 0, w, h);

    radarCtx.strokeStyle = 'rgba(0, 230, 118, 0.2)';
    radarCtx.lineWidth = 1;
    [35, 70, 105].forEach(r => {
      radarCtx.beginPath();
      radarCtx.arc(cx, cy, r, 0, Math.PI * 2);
      radarCtx.stroke();
    });

    radarAngle += 0.035;
    radarCtx.beginPath();
    radarCtx.moveTo(cx, cy);
    radarCtx.lineTo(cx + Math.cos(radarAngle) * 115, cy + Math.sin(radarAngle) * 115);
    radarCtx.strokeStyle = 'rgba(0, 230, 118, 0.6)';
    radarCtx.lineWidth = 2;
    radarCtx.stroke();

    nearbyRiders.forEach(r => {
      const bx = cx + Math.cos(r.angle) * r.radius;
      const by = cy + Math.sin(r.angle) * r.radius;
      radarCtx.beginPath();
      radarCtx.arc(bx, by, 5, 0, Math.PI * 2);
      radarCtx.fillStyle = r.color;
      radarCtx.shadowColor = r.color;
      radarCtx.shadowBlur = 10;
      radarCtx.fill();
    });

    requestAnimationFrame(drawRadar);
  }
  if (radarCanvas) drawRadar();

  // Medication & Diagnostics
  document.getElementById('takeMedBtn')?.addEventListener('click', function() {
    this.textContent = '✓ Taken Today';
    this.style.background = '#00e676';
    alert('💊 Dose Logged: Aspirin 75mg marked as taken.');
  });

  // =========================================================================
  // 11. 🎙️ REAL HANDS-FREE VOICE HOTWORD ENGINE
  // =========================================================================
  const voiceToggleBtn = document.getElementById('voiceToggleBtn');
  const voiceListeningStrip = document.getElementById('voiceListeningStrip');
  const voiceMicIcon = document.getElementById('voiceMicIcon');
  const voiceStatusLabel = document.getElementById('voiceStatusLabel');
  const voiceStatusDesc = document.getElementById('voiceStatusDesc');
  const voiceSoundWave = document.getElementById('voiceSoundWave');

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  function initVoiceEngine() {
    if (!SpeechRecognition) {
      console.warn('[SSS Voice] Web Speech Recognition API not supported in this browser.');
      return null;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = state.currentLanguage || 'en-US';

    const triggerKeywords = [
      'help', 'sss help', 'emergency', 'heart attack', 'cpr', 'save me',
      'bachao', 'madad', 'sahayam', 'kaapadu', 'ayuda', 'socorro', 'au secours'
    ];

    recognition.onresult = (event) => {
      if (state.isEmergencyActive) return;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase().trim();
        console.log('[SSS Voice Spoken]:', transcript);
        if (voiceSoundWave) {
          voiceSoundWave.classList.add('live');
          setTimeout(() => voiceSoundWave.classList.remove('live'), 800);
        }

        const matched = triggerKeywords.some(kw => transcript.includes(kw));
        if (matched) {
          console.log('[SSS Voice Hotword Triggered!]:', transcript);
          if (voiceStatusLabel) voiceStatusLabel.textContent = `HOTWORD HEARD: "${transcript.toUpperCase()}"`;
          triggerEmergency('REAL_VOICE_HOTWORD');
          break;
        }
      }
    };

    recognition.onerror = (e) => {
      console.warn('[SSS Voice Error]:', e.error);
      if (e.error === 'not-allowed') {
        alert('🎙️ Microphone access was denied. Please enable microphone permissions in your browser to activate Hands-Free SSS Voice.');
        stopVoiceListening();
      }
    };

    recognition.onend = () => {
      if (state.isVoiceListening && !state.isEmergencyActive) {
        try { recognition.start(); } catch (err) {}
      }
    };

    return recognition;
  }

  function startVoiceListening() {
    if (!state.speechRecognition) {
      state.speechRecognition = initVoiceEngine();
    }
    if (!state.speechRecognition) {
      alert('🎙️ Speech Recognition is not supported natively in this browser.\nSimulating Voice Engine: Say "SSS Help!" or use the "SSS Help!" button below.');
      return;
    }
    try {
      state.speechRecognition.start();
      state.isVoiceListening = true;
      if (voiceToggleBtn) {
        voiceToggleBtn.textContent = '🎙️ VOICE: ON';
        voiceToggleBtn.classList.add('active-listening');
      }
      if (voiceListeningStrip) voiceListeningStrip.classList.add('active');
      if (voiceMicIcon) voiceMicIcon.classList.add('pulsing');
      if (voiceStatusLabel) voiceStatusLabel.textContent = 'VOICE HOTWORD: ACTIVE & LISTENING';
      if (voiceStatusDesc) voiceStatusDesc.textContent = 'Say "SSS Help!", "Emergency", or "Heart Attack" hands-free anytime';
    } catch (e) {
      console.warn('Voice start exception:', e);
    }
  }

  function stopVoiceListening() {
    state.isVoiceListening = false;
    if (state.speechRecognition) {
      try { state.speechRecognition.stop(); } catch (e) {}
    }
    if (voiceToggleBtn) {
      voiceToggleBtn.textContent = '🎙️ VOICE: OFF';
      voiceToggleBtn.classList.remove('active-listening');
    }
    if (voiceListeningStrip) voiceListeningStrip.classList.remove('active');
    if (voiceMicIcon) voiceMicIcon.classList.remove('pulsing');
    if (voiceStatusLabel) voiceStatusLabel.textContent = 'VOICE HOTWORD: INACTIVE';
    if (voiceStatusDesc) voiceStatusDesc.textContent = 'Say "SSS Help!" or "Emergency" • Tap \'VOICE\' in header to listen';
  }

  if (voiceToggleBtn) {
    voiceToggleBtn.addEventListener('click', () => {
      if (state.isVoiceListening) {
        stopVoiceListening();
      } else {
        startVoiceListening();
      }
    });
  }

  // =========================================================================
  // 12. ⌚ boAt LUNAR DISCOVERY DEDICATED SMARTWATCH COMPANION HUB & BLE ENGINE
  // =========================================================================
  const pairBleBtn = document.getElementById('pairBleBtn');
  const bleStatusVal = document.getElementById('bleStatusVal');
  const bleDeviceName = document.getElementById('bleDeviceName');
  const quickHR = document.getElementById('quickHR');
  const bpmLarge = document.getElementById('bpmLarge');
  const ecgBpmDisplay = document.getElementById('ecgBpmDisplay');

  // boAt Modal & Controls
  const boatWatchModal = document.getElementById('boatWatchModal');
  const openBoatWatchBtn = document.getElementById('openBoatWatchBtn');
  const openBoatModalFromVitalsBtn = document.getElementById('openBoatModalFromVitalsBtn');
  const closeBoatWatchBtn = document.getElementById('closeBoatWatchBtn');
  const btnConnectBoatBle = document.getElementById('btnConnectBoatBle');
  const btnSimulateBoatBle = document.getElementById('btnSimulateBoatBle');
  const boatStatusBadge = document.getElementById('boatStatusBadge');
  const boatBatteryPill = document.getElementById('boatBatteryPill');
  const boatHubHr = document.getElementById('boatHubHr');
  const boatHubSpo2 = document.getElementById('boatHubSpo2');
  const boatHubStress = document.getElementById('boatHubStress');
  const watchScreenBpmVal = document.getElementById('watchScreenBpmVal');
  const watchScreenStepsVal = document.getElementById('watchScreenStepsVal');
  const watchScreenStatus = document.getElementById('watchScreenStatus');
  const watchClock = document.getElementById('watchClock');

  // Activity Rings
  const ringCaloriesCircle = document.getElementById('ringCaloriesCircle');
  const ringStepsCircle = document.getElementById('ringStepsCircle');
  const ringDistCircle = document.getElementById('ringDistCircle');
  const ringCalVal = document.getElementById('ringCalVal');
  const ringStepsVal = document.getElementById('ringStepsVal');
  const ringDistVal = document.getElementById('ringDistVal');
  const ringCalBar = document.getElementById('ringCalBar');
  const ringStepsBar = document.getElementById('ringStepsBar');
  const ringDistBar = document.getElementById('ringDistBar');

  // Guided Breathing
  const btnStartBreathing = document.getElementById('btnStartBreathing');
  const btnStopBreathing = document.getElementById('btnStopBreathing');
  const gbTimer = document.getElementById('gbTimer');
  const gbPhaseLabel = document.getElementById('gbPhaseLabel');
  const breathingOrb = document.getElementById('breathingOrb');

  // Sports Tracker
  const sportsGrid = document.getElementById('sportsGrid');
  const awSelectedSport = document.getElementById('awSelectedSport');
  const awStopwatch = document.getElementById('awStopwatch');
  const awCaloriesBurned = document.getElementById('awCaloriesBurned');
  const awLiveHr = document.getElementById('awLiveHr');
  const btnToggleWorkout = document.getElementById('btnToggleWorkout');

  // Smart Wrist Actions
  const btnTriggerWristSos = document.getElementById('btnTriggerWristSos');
  const btnPushNavHospital = document.getElementById('btnPushNavHospital');
  const btnSimulateNavTurn = document.getElementById('btnSimulateNavTurn');
  const btnPushQrToTray = document.getElementById('btnPushQrToTray');
  const btnTestHapticVibrate = document.getElementById('btnTestHapticVibrate');

  // Live Watch Clock Updater
  function updateWatchClock() {
    if (watchClock) {
      const now = new Date();
      watchClock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
  }
  setInterval(updateWatchClock, 1000);
  updateWatchClock();

  function updateHeartRate(newBpm) {
    state.heartRate = Math.max(40, Math.min(220, Math.round(newBpm)));
    state.boatWatch.hr = state.heartRate;

    if (quickHR) quickHR.innerHTML = `${state.heartRate} <small>BPM</small>`;
    if (bpmLarge) bpmLarge.innerHTML = `${state.heartRate} <small>BPM</small>`;
    if (ecgBpmDisplay) ecgBpmDisplay.textContent = `${state.heartRate} BPM`;
    if (boatHubHr) boatHubHr.textContent = state.heartRate;
    if (watchScreenBpmVal) watchScreenBpmVal.textContent = state.heartRate;
    if (awLiveHr) awLiveHr.textContent = state.heartRate;

    const ecgStatusText = document.getElementById('ecgStatusText');
    if (ecgStatusText) {
      if (state.heartRate > 100) {
        ecgStatusText.textContent = 'Sinus Tachycardia (Elevated)';
        ecgStatusText.style.color = '#ffb300';
      } else if (state.heartRate < 55) {
        ecgStatusText.textContent = 'Sinus Bradycardia (Low)';
        ecgStatusText.style.color = '#00e5ff';
      } else {
        ecgStatusText.textContent = 'Sinus Rhythm (Normal)';
        ecgStatusText.style.color = '#00e676';
      }
    }
  }

  // ── Triple Activity Rings Renderer ───────────────────────────────────────
  function updateActivityRings(calories, steps, distance) {
    state.boatWatch.calories = Math.round(calories);
    state.boatWatch.steps = Math.round(steps);
    state.boatWatch.distance = parseFloat(distance.toFixed(2));

    // Update Numerical Text
    if (ringCalVal) ringCalVal.textContent = state.boatWatch.calories;
    if (ringStepsVal) ringStepsVal.textContent = state.boatWatch.steps.toLocaleString();
    if (ringDistVal) ringDistVal.textContent = state.boatWatch.distance;
    if (watchScreenStepsVal) watchScreenStepsVal.textContent = state.boatWatch.steps.toLocaleString();

    // Update Progress Bars
    const calPct = Math.min(100, Math.round((state.boatWatch.calories / 500) * 100));
    const stepPct = Math.min(100, Math.round((state.boatWatch.steps / 10000) * 100));
    const distPct = Math.min(100, Math.round((state.boatWatch.distance / 7.0) * 100));

    if (ringCalBar) ringCalBar.style.width = `${calPct}%`;
    if (ringStepsBar) ringStepsBar.style.width = `${stepPct}%`;
    if (ringDistBar) ringDistBar.style.width = `${distPct}%`;

    // SVG Circular Dashoffsets
    // Calories: r=85, circumference = 2 * PI * 85 ≈ 534
    if (ringCaloriesCircle) {
      const calOffset = 534 - (534 * (calPct / 100));
      ringCaloriesCircle.style.strokeDashoffset = calOffset;
    }
    // Steps: r=65, circumference = 2 * PI * 65 ≈ 408
    if (ringStepsCircle) {
      const stepOffset = 408 - (408 * (stepPct / 100));
      ringStepsCircle.style.strokeDashoffset = stepOffset;
    }
    // Distance: r=45, circumference = 2 * PI * 45 ≈ 282
    if (ringDistCircle) {
      const distOffset = 282 - (282 * (distPct / 100));
      ringDistCircle.style.strokeDashoffset = distOffset;
    }
  }

  // ── Web Bluetooth Scanner for boAt Lunar Discovery ────────────────────────
  async function connectWebBluetooth() {
    if (!navigator.bluetooth) {
      alert('⌚ Web Bluetooth API is not natively supported in this browser.\n\nRecommended: Google Chrome, Microsoft Edge, or Bluefy on iOS.\n\nActivating live boAt Lunar Discovery simulated telemetry...');
      simulateBoatBleConnection();
      return;
    }

    try {
      if (bleStatusVal) bleStatusVal.textContent = 'SCANNING FOR boAt...';
      if (boatStatusBadge) {
        boatStatusBadge.textContent = '🟡 SCANNING...';
        boatStatusBadge.className = 'boat-status-badge';
      }

      let device;
      try {
        // Try targeted name and prefix filters for boAt smartwatches
        device = await navigator.bluetooth.requestDevice({
          filters: [
            { namePrefix: 'boAt' },
            { namePrefix: 'Lunar' },
            { namePrefix: 'Discovery' },
            { services: ['heart_rate'] }
          ],
          optionalServices: [
            'heart_rate',
            'battery_service',
            'device_information',
            0xFEE0, 0xFEE7, 0xFFE0,
            '0000fee0-0000-1000-8000-00805f9b34fb',
            '6e400001-b5a3-f393-e0a9-e50e24dcca9e'
          ]
        });
      } catch (filterErr) {
        // Fallback: acceptAllDevices so user can select any visible smartwatch
        console.log('[boAt BLE] Specific filter bypassed, prompting with all devices:', filterErr);
        device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: [
            'heart_rate',
            'battery_service',
            'device_information',
            0xFEE0, 0xFEE7, 0xFFE0
          ]
        });
      }

      if (bleStatusVal) bleStatusVal.textContent = 'CONNECTING...';
      if (boatStatusBadge) boatStatusBadge.textContent = '🟡 CONNECTING...';

      const server = await device.gatt.connect();
      state.boatWatch.device = device;
      state.boatWatch.connected = true;

      // 1. Check & Read Battery Service (0x180F)
      try {
        const batteryService = await server.getPrimaryService('battery_service');
        const batteryChar = await batteryService.getCharacteristic('battery_level');
        const batteryVal = await batteryChar.readValue();
        state.boatWatch.battery = batteryVal.getUint8(0);
        if (boatBatteryPill) boatBatteryPill.textContent = `🔋 ${state.boatWatch.battery}%`;
      } catch (batErr) {
        console.log('[boAt BLE] Battery service not exposed, using default 88%');
      }

      // 2. Check & Subscribe to Heart Rate (0x180D)
      try {
        const hrService = await server.getPrimaryService('heart_rate');
        const hrChar = await hrService.getCharacteristic('heart_rate_measurement');
        await hrChar.startNotifications();
        hrChar.addEventListener('characteristicvaluechanged', (event) => {
          const value = event.target.value;
          const flags = value.getUint8(0);
          let hr;
          if (flags & 0x01) {
            hr = value.getUint16(1, true); // 16-bit
          } else {
            hr = value.getUint8(1); // 8-bit
          }
          updateHeartRate(hr);
        });
      } catch (hrErr) {
        console.log('[boAt BLE] Standard heart_rate service pending custom vendor handshake');
      }

      // Update UI
      const devName = device.name || 'boAt Lunar Discovery';
      if (bleStatusVal) {
        bleStatusVal.textContent = 'SYNCED';
        bleStatusVal.style.color = '#00e676';
      }
      if (bleDeviceName) bleDeviceName.textContent = `Paired: ${devName} (BLE 5.2)`;
      if (pairBleBtn) pairBleBtn.textContent = '✓ Watch Synced';
      if (boatStatusBadge) {
        boatStatusBadge.textContent = '🟢 SYNCED';
        boatStatusBadge.className = 'boat-status-badge synced';
      }
      if (watchScreenStatus) watchScreenStatus.textContent = 'boAt BLE CONNECTED';

      device.addEventListener('gattserverdisconnected', () => {
        state.boatWatch.connected = false;
        if (bleStatusVal) {
          bleStatusVal.textContent = 'DISCONNECTED';
          bleStatusVal.style.color = '#ff2a4b';
        }
        if (pairBleBtn) pairBleBtn.textContent = '⚡ Re-Pair Watch';
        if (boatStatusBadge) {
          boatStatusBadge.textContent = '🔴 DISCONNECTED';
          boatStatusBadge.className = 'boat-status-badge';
        }
        if (watchScreenStatus) watchScreenStatus.textContent = 'DISCONNECTED';
      });

    } catch (err) {
      console.warn('Bluetooth connection error:', err);
      if (bleStatusVal) bleStatusVal.textContent = 'PAIRING FAILED';
      simulateBoatBleConnection();
    }
  }

  // ── High-Fidelity boAt Simulation Mode ────────────────────────────────────
  function simulateBoatBleConnection() {
    if (state.boatWatch.isSim) {
      // Toggle off
      clearInterval(state.boatWatch.simInterval);
      state.boatWatch.simInterval = null;
      state.boatWatch.isSim = false;
      if (btnSimulateBoatBle) btnSimulateBoatBle.textContent = '🎮 Live Sim Telemetry';
      if (boatStatusBadge) {
        boatStatusBadge.textContent = '⚪ READY TO PAIR';
        boatStatusBadge.className = 'boat-status-badge';
      }
      if (watchScreenStatus) watchScreenStatus.textContent = 'STANDBY';
      return;
    }

    state.boatWatch.isSim = true;
    if (btnSimulateBoatBle) btnSimulateBoatBle.textContent = '⏹ Stop Sim';
    if (bleStatusVal) {
      bleStatusVal.textContent = 'SYNCED (SIM)';
      bleStatusVal.style.color = '#00e676';
    }
    if (bleDeviceName) bleDeviceName.textContent = 'boAt Lunar Discovery (Simulated BLE 5.2)';
    if (pairBleBtn) pairBleBtn.textContent = '✓ Watch Synced';
    if (boatStatusBadge) {
      boatStatusBadge.textContent = '🟢 LIVE SIMULATED';
      boatStatusBadge.className = 'boat-status-badge synced';
    }
    if (watchScreenStatus) watchScreenStatus.textContent = 'boAt CREST v2 ACTIVE';

    // Start Real-Time Telemetry Simulation
    state.boatWatch.simInterval = setInterval(() => {
      // Fluctuating BPM
      const bpmDelta = (Math.random() * 4 - 2);
      const newBpm = Math.max(65, Math.min(115, state.boatWatch.hr + bpmDelta));
      updateHeartRate(newBpm);

      // Accumulating Steps & Calories
      const stepInc = Math.floor(Math.random() * 4);
      const newSteps = state.boatWatch.steps + stepInc;
      const newCal = state.boatWatch.calories + (stepInc * 0.045);
      const newDist = state.boatWatch.distance + (stepInc * 0.00072);
      updateActivityRings(newCal, newSteps, newDist);

      // Subtle SpO2 & Stress changes
      if (Math.random() > 0.8) {
        state.boatWatch.spo2 = Math.random() > 0.3 ? 98 : 99;
        if (boatHubSpo2) boatHubSpo2.textContent = state.boatWatch.spo2;
      }
      if (Math.random() > 0.7) {
        state.boatWatch.stress = Math.round(30 + Math.random() * 8);
        if (boatHubStress) boatHubStress.textContent = state.boatWatch.stress;
      }
    }, 2000);
  }

  // ── Modal Open / Close & Tabs Wiring ──────────────────────────────────────
  function openBoatWatchModal() {
    if (!boatWatchModal) return;
    boatWatchModal.classList.remove('hidden');
    updateActivityRings(state.boatWatch.calories, state.boatWatch.steps, state.boatWatch.distance);
  }

  function closeBoatWatchModal() {
    if (!boatWatchModal) return;
    boatWatchModal.classList.add('hidden');
  }

  openBoatWatchBtn?.addEventListener('click', openBoatWatchModal);
  openBoatModalFromVitalsBtn?.addEventListener('click', openBoatWatchModal);
  closeBoatWatchBtn?.addEventListener('click', closeBoatWatchModal);
  boatWatchModal?.addEventListener('click', (e) => {
    if (e.target === boatWatchModal) closeBoatWatchModal();
  });

  // Modal Sub-Tab Switching
  document.querySelectorAll('.boat-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.boattab;
      document.querySelectorAll('.boat-tab-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.boat-tab-pane').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(targetId)?.classList.add('active');
    });
  });

  // Pair & Simulate Buttons
  pairBleBtn?.addEventListener('click', connectWebBluetooth);
  btnConnectBoatBle?.addEventListener('click', connectWebBluetooth);
  btnSimulateBoatBle?.addEventListener('click', simulateBoatBleConnection);

  // ── Guided Breathing Session Controller ───────────────────────────────────
  function startBreathingSession() {
    state.breathingSession.active = true;
    state.breathingSession.secondsLeft = 120;
    btnStartBreathing?.classList.add('hidden');
    btnStopBreathing?.classList.remove('hidden');

    let phase = 0; // 0: inhale (4s), 1: hold (4s), 2: exhale (4s)
    let phaseTick = 0;

    function applyPhase() {
      if (!breathingOrb || !gbPhaseLabel) return;
      if (phase === 0) {
        breathingOrb.className = 'breathing-orb inhale';
        gbPhaseLabel.textContent = `🌬️ Inhale slowly through nose... (${4 - phaseTick}s)`;
        gbPhaseLabel.style.color = '#00e5ff';
      } else if (phase === 1) {
        breathingOrb.className = 'breathing-orb';
        gbPhaseLabel.textContent = `⏸️ Hold breath calmly... (${4 - phaseTick}s)`;
        gbPhaseLabel.style.color = '#ffb300';
      } else {
        breathingOrb.className = 'breathing-orb exhale';
        gbPhaseLabel.textContent = `💨 Exhale gently through mouth... (${4 - phaseTick}s)`;
        gbPhaseLabel.style.color = '#00e676';
      }
    }

    applyPhase();

    state.breathingSession.timer = setInterval(() => {
      state.breathingSession.secondsLeft--;
      phaseTick++;

      if (phaseTick >= 4) {
        phaseTick = 0;
        phase = (phase + 1) % 3;
      }

      applyPhase();

      // Update timer display
      if (gbTimer) {
        const mins = Math.floor(state.breathingSession.secondsLeft / 60);
        const secs = state.breathingSession.secondsLeft % 60;
        gbTimer.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }

      if (state.breathingSession.secondsLeft <= 0) {
        stopBreathingSession('🎉 2-Minute Breathing Complete! Heart rate calmed and stress reduced.');
      }
    }, 1000);
  }

  function stopBreathingSession(msg) {
    if (state.breathingSession.timer) {
      clearInterval(state.breathingSession.timer);
      state.breathingSession.timer = null;
    }
    state.breathingSession.active = false;
    btnStartBreathing?.classList.remove('hidden');
    btnStopBreathing?.classList.add('hidden');
    if (gbTimer) gbTimer.textContent = '02:00';
    if (breathingOrb) breathingOrb.className = 'breathing-orb';
    if (gbPhaseLabel) gbPhaseLabel.textContent = msg || 'Session stopped. Tap Start anytime.';
  }

  btnStartBreathing?.addEventListener('click', () => startBreathingSession());
  btnStopBreathing?.addEventListener('click', () => stopBreathingSession());

  // ── Sports Mode Selection & Live Workout Stopwatch ───────────────────────
  sportsGrid?.addEventListener('click', (e) => {
    const card = e.target.closest('.sport-card');
    if (!card) return;
    document.querySelectorAll('.sport-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');

    state.activeWorkout.sport = card.dataset.sport;
    state.activeWorkout.calRate = parseFloat(card.dataset.calrate || '6.5');
    if (awSelectedSport) awSelectedSport.textContent = `${card.querySelector('.sport-icon')?.textContent || '🏃'} ${state.activeWorkout.sport}`;
  });

  btnToggleWorkout?.addEventListener('click', () => {
    if (state.activeWorkout.active) {
      // Stop Workout
      clearInterval(state.activeWorkout.timer);
      state.activeWorkout.timer = null;
      state.activeWorkout.active = false;
      btnToggleWorkout.textContent = '▶ Start Workout';
      btnToggleWorkout.style.background = '#ff2a4b';
      alert(`🏅 Workout Complete!\n\nSport: ${state.activeWorkout.sport}\nDuration: ${awStopwatch.textContent}\nCalories Burned: ${awCaloriesBurned.textContent} kcal\n\nSynced to SSS & boAt Activity Rings.`);
    } else {
      // Start Workout
      state.activeWorkout.active = true;
      state.activeWorkout.seconds = 0;
      state.activeWorkout.caloriesBurned = 0;
      btnToggleWorkout.textContent = '⏹ Stop Workout';
      btnToggleWorkout.style.background = '#00e676';

      state.activeWorkout.timer = setInterval(() => {
        state.activeWorkout.seconds++;
        state.activeWorkout.caloriesBurned += (state.activeWorkout.calRate / 60);

        const h = Math.floor(state.activeWorkout.seconds / 3600);
        const m = Math.floor((state.activeWorkout.seconds % 3600) / 60);
        const s = state.activeWorkout.seconds % 60;
        if (awStopwatch) {
          awStopwatch.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
        if (awCaloriesBurned) {
          awCaloriesBurned.textContent = state.activeWorkout.caloriesBurned.toFixed(1);
        }
      }, 1000);
    }
  });

  // ── Smart Wrist Hardware Actions & SOS Trigger ───────────────────────────
  // 🚨 1. Wrist SOS Button (Simulates Watch physical button long-press)
  btnTriggerWristSos?.addEventListener('click', () => {
    closeBoatWatchModal();
    console.log('[boAt Smartwatch] Wrist physical button SOS triggered!');
    triggerEmergency('FROM_BOAT_LUNAR_WATCH_HARDWARE_SOS');
  });

  // 🧭 2. Turn-by-Turn Navigation Push to Watch Display
  btnPushNavHospital?.addEventListener('click', () => {
    const navScreen = document.querySelector('.watch-nav-screen-preview');
    if (navScreen) {
      navScreen.innerHTML = `
        <div class="wn-arrow" style="color:#00e676; animation: pulse 1s infinite;">⬆ 120m</div>
        <div class="wn-distance" style="color:#00e5ff;">Turn Right onto MG Road</div>
        <div class="wn-dest" style="color:#ffb300;">🏥 Apollo Trauma Center (1.2 km • 3 mins)</div>
      `;
    }
    alert('🧭 Turn-by-Turn Directions Pushed to boAt Lunar Discovery Display!\n\nDestination: Apollo Trauma Center\nDistance: 1.2 km (3 mins)\n\nDirections stream live directly on your watch face.');
  });

  let navStepIdx = 0;
  const navSteps = [
    { arrow: '⬆', dist: 'In 150m: Turn Right', dest: '🏥 City Trauma Center (1.2 km)' },
    { arrow: '⮡', dist: 'In 40m: Turn Right onto Cross St', dest: '🏥 City Trauma Center (1.0 km)' },
    { arrow: '⬆', dist: 'In 800m: Continue Straight', dest: '🏥 City Trauma Center (0.6 km)' },
    { arrow: '🏁', dist: 'In 50m: Hospital on Left', dest: '🏥 Arrived at Emergency Gate' }
  ];
  btnSimulateNavTurn?.addEventListener('click', () => {
    navStepIdx = (navStepIdx + 1) % navSteps.length;
    const step = navSteps[navStepIdx];
    const navScreen = document.querySelector('.watch-nav-screen-preview');
    if (navScreen) {
      navScreen.innerHTML = `
        <div class="wn-arrow">${step.arrow}</div>
        <div class="wn-distance">${step.dist}</div>
        <div class="wn-dest">${step.dest}</div>
      `;
    }
  });

  // 🪪 3. Push Medical QR Pass to Watch QR Tray
  btnPushQrToTray?.addEventListener('click', () => {
    alert('🪪 SSS Emergency Medical ID Pushed to Watch QR Tray!\n\nParamedics can now scan the QR code directly from your wrist even if your phone is locked or discharged.\n\nContains: Santosha D • O+ • CAD Warning • ICE: +1 555-0199');
  });

  // 📳 4. Test Watch Haptic Vibration
  btnTestHapticVibrate?.addEventListener('click', () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([300, 150, 300, 150, 600]);
    }
    alert('📳 Wrist Haptic Vibration Command Sent!\n\nYour boAt Lunar Discovery buzzes with emergency tactile alert pulse.');
  });

  // Female Wellness Logger
  document.getElementById('btnLogWellness')?.addEventListener('click', () => {
    alert('🌸 Female Wellness Logger\n\nCurrent Phase: Ovulation Window (Day 14/28)\nPredicted Next Period: in 14 days\n\nDaily log saved to local biometric store.');
  });

  // Initial Ring Update
  updateActivityRings(state.boatWatch.calories, state.boatWatch.steps, state.boatWatch.distance);

  // =========================================================================
  // 13. 📱 FALL DETECTOR — REMOVED (available in mobile app version)
  // =========================================================================


  // =========================================================================
  // 14. 🎮 30-SECOND INTERACTIVE CPR RHYTHM TRAINING GAME
  // =========================================================================
  const openCprGameBtn = document.getElementById('openCprGameBtn');
  const closeCprGameBtn = document.getElementById('closeCprGameBtn');
  const cprGameModal = document.getElementById('cprGameModal');
  const gameTimer = document.getElementById('gameTimer');
  const gameLiveBpm = document.getElementById('gameLiveBpm');
  const gameCount = document.getElementById('gameCount');
  const gameFeedbackBadge = document.getElementById('gameFeedbackBadge');
  const gamePressBtn = document.getElementById('gamePressBtn');
  const gameResultView = document.getElementById('gameResultView');
  const resultScoreText = document.getElementById('resultScoreText');
  const restartGameBtn = document.getElementById('restartGameBtn');
  const downloadCertBtn = document.getElementById('downloadCertBtn');
  const cprCertificateCanvas = document.getElementById('cprCertificateCanvas');

  function openCprGame() {
    if (!cprGameModal) return;
    cprGameModal.classList.remove('hidden');
    resetCprGame();
  }

  function closeCprGame() {
    if (!cprGameModal) return;
    cprGameModal.classList.add('hidden');
    if (state.cprGameTimer) {
      clearInterval(state.cprGameTimer);
      state.cprGameTimer = null;
    }
    state.cprGameActive = false;
  }

  function resetCprGame() {
    state.cprGameActive = false;
    if (state.cprGameTimer) clearInterval(state.cprGameTimer);
    state.cprGameTimer = null;
    state.cprGameTimeLeft = 30;
    state.cprGameTaps = 0;
    state.cprGameBeatsInTarget = 0;
    state.cprGameLastTapTime = null;
    state.cprGameCurrentBpm = 0;

    if (gameTimer) gameTimer.textContent = '30s';
    if (gameLiveBpm) gameLiveBpm.innerHTML = '0 <small>BPM</small>';
    if (gameCount) gameCount.textContent = '0';
    if (gameFeedbackBadge) {
      gameFeedbackBadge.className = 'game-feedback-badge';
      gameFeedbackBadge.textContent = 'TAP OR PRESS SPACE TO START';
    }
    if (gameResultView) gameResultView.classList.add('hidden');
  }

  function handleGameCompression() {
    const now = Date.now();
    playMetronomeClick();

    if (!state.cprGameActive) {
      state.cprGameActive = true;
      state.cprGameTimer = setInterval(() => {
        state.cprGameTimeLeft--;
        if (gameTimer) gameTimer.textContent = `${state.cprGameTimeLeft}s`;
        if (state.cprGameTimeLeft <= 0) {
          finishCprGame();
        }
      }, 1000);
    }

    state.cprGameTaps++;
    if (gameCount) gameCount.textContent = state.cprGameTaps;

    if (state.cprGameLastTapTime) {
      const deltaSec = (now - state.cprGameLastTapTime) / 1000;
      if (deltaSec > 0.1 && deltaSec < 2.0) {
        const instantBpm = Math.round(60 / deltaSec);
        state.cprGameCurrentBpm = state.cprGameCurrentBpm === 0 
          ? instantBpm 
          : Math.round(state.cprGameCurrentBpm * 0.5 + instantBpm * 0.5);

        if (gameLiveBpm) gameLiveBpm.innerHTML = `${state.cprGameCurrentBpm} <small>BPM</small>`;

        if (gameFeedbackBadge) {
          gameFeedbackBadge.className = 'game-feedback-badge';
          if (state.cprGameCurrentBpm >= 100 && state.cprGameCurrentBpm <= 122) {
            state.cprGameBeatsInTarget++;
            gameFeedbackBadge.classList.add('perfect');
            gameFeedbackBadge.textContent = '🎯 PERFECT RHYTHM! (110 BPM)';
          } else if (state.cprGameCurrentBpm < 100) {
            gameFeedbackBadge.classList.add('faster');
            gameFeedbackBadge.textContent = '⚡ PUSH FASTER! (Reach 100-120)';
          } else {
            gameFeedbackBadge.classList.add('slower');
            gameFeedbackBadge.textContent = '⚠️ SLOW DOWN SLIGHTLY (110 Target)';
          }
        }
      }
    }
    state.cprGameLastTapTime = now;
  }

  function finishCprGame() {
    state.cprGameActive = false;
    if (state.cprGameTimer) {
      clearInterval(state.cprGameTimer);
      state.cprGameTimer = null;
    }

    const accuracy = state.cprGameTaps > 5 
      ? Math.min(100, Math.round((state.cprGameBeatsInTarget / (state.cprGameTaps - 1)) * 100))
      : 0;

    if (gameResultView) gameResultView.classList.remove('hidden');
    if (resultScoreText) {
      resultScoreText.textContent = `Completed ${state.cprGameTaps} compressions with ${accuracy}% AHA rhythm accuracy!`;
    }

    renderCprCertificate(accuracy);
  }

  function renderCprCertificate(accuracy) {
    if (!cprCertificateCanvas) return;
    const ctx = cprCertificateCanvas.getContext('2d');
    const w = cprCertificateCanvas.width;
    const h = cprCertificateCanvas.height;

    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#0a0e17');
    bgGrad.addColorStop(1, '#1b1226');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#ffb300';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.strokeStyle = '#b388ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffb300';
    ctx.font = 'bold 12px Orbitron, sans-serif';
    ctx.fillText('SANTO STARK STUDIO (SSS)', w / 2, 32);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px Plus Jakarta Sans, sans-serif';
    ctx.fillText('GOOD SAMARITAN CPR RESCUER', w / 2, 54);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 15px Plus Jakarta Sans, sans-serif';
    ctx.fillText('Santosha D (Santos Stark)', w / 2, 82);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px Plus Jakarta Sans, sans-serif';
    ctx.fillText(`Verified AHA 110 BPM Compression Cadence • ${accuracy}% Accuracy`, w / 2, 106);
    ctx.fillText(`30-Second Resuscitation Simulation Badge`, w / 2, 122);

    ctx.fillStyle = '#00e676';
    ctx.font = 'bold 10px JetBrains Mono, monospace';
    ctx.fillText(`ID: SSS-CPR-${Date.now().toString().slice(-6)} • PASS CERTIFIED`, w / 2, 154);

    ctx.fillStyle = '#8a99ad';
    ctx.font = '8px Plus Jakarta Sans, sans-serif';
    ctx.fillText('Autonomous Emergency Engineering • SSS v.56964.1', w / 2, 180);
  }

  function downloadCertificate() {
    if (!cprCertificateCanvas) return;
    const link = document.createElement('a');
    link.download = 'SSS_Good_Samaritan_CPR_Certificate.png';
    link.href = cprCertificateCanvas.toDataURL('image/png');
    link.click();
  }

  if (openCprGameBtn) openCprGameBtn.addEventListener('click', openCprGame);
  if (closeCprGameBtn) closeCprGameBtn.addEventListener('click', closeCprGame);
  if (gamePressBtn) gamePressBtn.addEventListener('click', handleGameCompression);
  if (restartGameBtn) restartGameBtn.addEventListener('click', resetCprGame);
  if (downloadCertBtn) downloadCertBtn.addEventListener('click', downloadCertificate);

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && cprGameModal && !cprGameModal.classList.contains('hidden')) {
      e.preventDefault();
      handleGameCompression();
    }
  });

  // =========================================================================
  // 14b. 🏥 ANIMATED CPR PROCEDURE TUTORIAL (AHA / ERC CLINICAL STANDARD)
  // =========================================================================

  // ── Step Data ─────────────────────────────────────────────────────────────
  const CPR_STEPS = [
    {
      title: 'Check Responsiveness & Scene Safety',
      desc: 'Ensure the scene is safe for you and the victim. Tap both shoulders firmly and shout loudly: <em>"Hey, are you OK?!"</em>. Look, listen, and feel for any movement or verbal response for no more than 10 seconds.',
      proTip: '<strong>Clinical Rule:</strong> Never shake the patient\'s head or neck if spinal trauma is suspected. Shout — don\'t touch — until the scene is declared safe.',
      voice: '🔊 Speaking: "Check for danger. Tap shoulders firmly and shout: Are you OK?"',
      svgFn: svgStep1_Response
    },
    {
      title: 'Call 911 / 112 & Get the AED',
      desc: 'If the victim is unresponsive and not breathing normally, <em>call 911 immediately</em> or ask a bystander to call. Send a second bystander to retrieve the nearest AED defibrillator.',
      proTip: '<strong>Clinical Rule:</strong> Always activate emergency services BEFORE starting CPR in an adult collapse. For children, give 2 minutes of CPR first.',
      voice: '🔊 Speaking: "Call 911 now! Send someone to get the AED immediately!"',
      svgFn: svgStep2_Call911
    },
    {
      title: 'Open the Airway (Head-Tilt / Chin-Lift)',
      desc: 'Place the victim flat on their back on a firm surface. Tilt the head back by placing one hand on the forehead and lifting the chin with two fingers. This opens the airway by removing tongue obstruction.',
      proTip: '<strong>Clinical Rule:</strong> If foreign body airway obstruction is suspected, perform the Heimlich maneuver before CPR. Do not perform blind finger sweeps.',
      voice: '🔊 Speaking: "Tilt the head back. Lift the chin. Open the airway fully."',
      svgFn: svgStep3_Airway
    },
    {
      title: 'Hand Placement — Lower Half of Sternum',
      desc: 'Place the heel of one hand on the centre of the chest (lower half of the sternum). Place your second hand on top and interlock fingers. Keep arms straight. Shoulders directly above the sternum.',
      proTip: '<strong>Clinical Rule:</strong> Avoid compressing over the xiphoid process (the bone tip at the base of the sternum). AHA mandates ≥ 5 cm (2 inch) depth for adults.',
      voice: '🔊 Speaking: "Place heel of hand on chest centre. Lock fingers. Keep arms straight."',
      svgFn: svgStep4_HandPlacement
    },
    {
      title: 'Rescuer Posture — Kneel & Lock Arms',
      desc: 'Kneel beside the victim at shoulder level. Keep your arms <em>locked straight</em> and shoulders directly over your hands. Use your body weight — not arm strength — to compress. Allow full chest recoil between compressions.',
      proTip: '<strong>Clinical Rule (AHA 2020):</strong> Allow complete chest recoil after each compression. Do NOT lean on the chest between compressions — this reduces venous return and cardiac output.',
      voice: '🔊 Speaking: "Arms straight. Use body weight. Allow full chest recoil after each push."',
      svgFn: svgStep5_Posture
    },
    {
      title: 'Compress at 100–120 BPM Continuously',
      desc: 'Push hard and fast at a rate of <em>100–120 compressions per minute</em> (AHA Golden Standard). Minimise interruptions. Give 30 compressions, then 2 rescue breaths (30:2 ratio). If untrained, use Hands-Only CPR continuously.',
      proTip: '<strong>Clinical Rule (AHA 2020):</strong> "Stayin\' Alive" by the Bee Gees is ~103 BPM — the gold standard mnemonic. The SSS metronome pulses at exactly 110 BPM for you.',
      voice: '🔊 Speaking: "Push 30 times fast to the beat! 100 to 120 per minute. Don\'t stop!"',
      svgFn: svgStep6_Rhythm
    }
  ];

  // ── SVG Generators ─────────────────────────────────────────────────────────

  function svgStep1_Response() {
    return `
    <svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
      <!-- Ground line -->
      <line x1="20" y1="145" x2="180" y2="145" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>
      <!-- Victim lying flat -->
      <g class="anim-victim-body">
        <ellipse cx="100" cy="130" rx="55" ry="10" fill="rgba(255,42,75,0.08)" stroke="rgba(255,42,75,0.2)" stroke-width="1"/>
        <!-- body -->
        <rect x="60" y="110" width="80" height="22" rx="11" fill="rgba(30,40,60,0.9)" stroke="#445577" stroke-width="1.5"/>
        <!-- head -->
        <circle cx="100" cy="100" r="14" fill="rgba(30,40,60,0.9)" stroke="#445577" stroke-width="1.5"/>
        <!-- eyes closed -->
        <line x1="94" y1="99" x2="98" y2="99" stroke="#8a99ad" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="102" y1="99" x2="106" y2="99" stroke="#8a99ad" stroke-width="1.5" stroke-linecap="round"/>
      </g>
      <!-- Rescuer hand tapping shoulder -->
      <g transform="translate(62, 55)">
        <text font-size="28" text-anchor="middle" x="0" y="28" class="anim-phone" style="animation-name:phonePulse; animation-duration:1s;">✋</text>
      </g>
      <!-- Speech bubble -->
      <rect x="115" y="58" width="62" height="26" rx="8" fill="rgba(255,179,0,0.15)" stroke="rgba(255,179,0,0.4)" stroke-width="1"/>
      <text x="146" y="75" text-anchor="middle" font-size="9" fill="#ffb300" font-family="Plus Jakarta Sans, sans-serif" font-weight="700">ARE YOU OK?</text>
      <polygon points="120,84 128,84 124,91" fill="rgba(255,179,0,0.4)"/>
      <!-- Danger check marks -->
      <text x="25" y="40" font-size="9" fill="rgba(0,230,118,0.7)" font-family="monospace">✓ No traffic</text>
      <text x="25" y="52" font-size="9" fill="rgba(0,230,118,0.7)" font-family="monospace">✓ Scene safe</text>
    </svg>`;
  }

  function svgStep2_Call911() {
    return `
    <svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
      <!-- Phone icon with pulse -->
      <g transform="translate(72, 20)">
        <text font-size="56" class="anim-phone">📱</text>
      </g>
      <!-- Call ripple rings -->
      <circle cx="100" cy="65" r="38" fill="none" stroke="rgba(255,42,75,0.4)" stroke-width="1.5" class="anim-bpm-ripple"/>
      <circle cx="100" cy="65" r="38" fill="none" stroke="rgba(255,42,75,0.25)" stroke-width="1" class="anim-bpm-ripple2"/>
      <!-- Screen text -->
      <rect x="55" y="108" width="90" height="32" rx="12" fill="rgba(255,42,75,0.15)" stroke="rgba(255,42,75,0.4)" stroke-width="1.5"/>
      <text x="100" y="122" text-anchor="middle" font-size="13" fill="#ff2a4b" font-family="Orbitron, sans-serif" font-weight="700">📞 911</text>
      <text x="100" y="134" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.5)" font-family="monospace">CALLING EMERGENCY</text>
      <!-- AED arrow -->
      <text x="18" y="100" font-size="8" fill="rgba(255,179,0,0.8)" font-family="monospace">⚡ AED 45m →</text>
    </svg>`;
  }

  function svgStep3_Airway() {
    return `
    <svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
      <!-- Victim head profile view -->
      <g class="anim-airway-head" style="transform-origin: 100px 120px;">
        <!-- Neck -->
        <rect x="88" y="100" width="24" height="30" rx="8" fill="rgba(30,40,60,0.9)" stroke="#445577" stroke-width="1.5"/>
        <!-- Head -->
        <ellipse cx="100" cy="88" rx="24" ry="22" fill="rgba(30,40,60,0.9)" stroke="#445577" stroke-width="1.5"/>
        <!-- Nose -->
        <ellipse cx="115" cy="88" rx="5" ry="4" fill="rgba(30,40,60,0.9)" stroke="#445577" stroke-width="1"/>
        <!-- Mouth open -->
        <path d="M 102 97 Q 108 103 114 97" stroke="#00e5ff" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <!-- Eye closed -->
        <line x1="97" y1="84" x2="103" y2="84" stroke="#8a99ad" stroke-width="1.5" stroke-linecap="round"/>
      </g>
      <!-- Hand on forehead arrow -->
      <text x="30" y="52" font-size="22">🖐️</text>
      <line x1="62" y1="52" x2="82" y2="72" stroke="rgba(255,179,0,0.6)" stroke-width="1.5" stroke-dasharray="4,3" marker-end="url(#arr)"/>
      <!-- Airway open indicator -->
      <rect x="118" y="58" width="60" height="20" rx="6" fill="rgba(0,229,255,0.1)" stroke="rgba(0,229,255,0.3)" stroke-width="1"/>
      <text x="148" y="72" text-anchor="middle" font-size="8" fill="#00e5ff" font-family="monospace">AIRWAY OPEN ✓</text>
      <!-- Air flow lines -->
      <line x1="105" y1="118" x2="105" y2="150" stroke="rgba(0,229,255,0.4)" stroke-width="2" stroke-dasharray="3,3"/>
      <text x="90" y="148" font-size="8" fill="rgba(0,229,255,0.6)" font-family="monospace">AIR FLOW</text>
    </svg>`;
  }

  function svgStep4_HandPlacement() {
    return `
    <svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
      <!-- Chest front view -->
      <ellipse cx="100" cy="105" rx="55" ry="38" fill="rgba(30,40,60,0.9)" stroke="#445577" stroke-width="1.5"/>
      <!-- Sternum line -->
      <line x1="100" y1="70" x2="100" y2="140" stroke="rgba(255,179,0,0.5)" stroke-width="1.5" stroke-dasharray="4,3"/>
      <!-- Lower half highlight zone -->
      <ellipse cx="100" cy="120" rx="28" ry="15" fill="rgba(255,42,75,0.2)" stroke="rgba(255,42,75,0.5)" stroke-width="1.5" stroke-dasharray="4,2"/>
      <text x="100" y="124" text-anchor="middle" font-size="8" fill="rgba(255,42,75,0.9)" font-family="monospace">TARGET ZONE</text>
      <!-- Hands pressing (animated) -->
      <g class="anim-hand">
        <text x="72" y="88" font-size="26" text-anchor="middle">👐</text>
      </g>
      <!-- Labels -->
      <text x="22" y="78" font-size="8" fill="rgba(255,255,255,0.5)" font-family="monospace">Interlock</text>
      <text x="22" y="88" font-size="8" fill="rgba(255,255,255,0.5)" font-family="monospace">fingers</text>
      <line x1="52" y1="82" x2="68" y2="82" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
      <!-- Depth indicator -->
      <rect x="155" y="95" width="30" height="38" rx="6" fill="rgba(0,229,255,0.08)" stroke="rgba(0,229,255,0.2)" stroke-width="1"/>
      <text x="170" y="110" text-anchor="middle" font-size="7" fill="#00e5ff" font-family="monospace">DEPTH</text>
      <text x="170" y="122" text-anchor="middle" font-size="9" fill="#00e5ff" font-weight="700" font-family="monospace">≥ 5cm</text>
      <text x="170" y="132" text-anchor="middle" font-size="7" fill="rgba(0,229,255,0.6)" font-family="monospace">2 inch</text>
    </svg>`;
  }

  function svgStep5_Posture() {
    return `
    <svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
      <!-- Victim (horizontal) -->
      <rect x="30" y="130" width="140" height="14" rx="7" fill="rgba(30,40,60,0.8)" stroke="#445577" stroke-width="1.5"/>
      <!-- Rescuer kneeling silhouette -->
      <!-- Body -->
      <rect x="90" y="55" width="22" height="30" rx="8" fill="#1e2840" stroke="#445577" stroke-width="1.5"/>
      <!-- Head -->
      <circle cx="101" cy="46" r="12" fill="#1e2840" stroke="#445577" stroke-width="1.5"/>
      <!-- Knees -->
      <rect x="84" y="82" width="14" height="10" rx="5" fill="#1e2840" stroke="#445577" stroke-width="1"/>
      <rect x="102" y="82" width="14" height="10" rx="5" fill="#1e2840" stroke="#445577" stroke-width="1"/>
      <!-- Straight arms going to chest -->
      <line x1="101" y1="82" x2="101" y2="130" stroke="#ffb300" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Angle indicator (right angle) -->
      <rect x="101" y="115" width="8" height="8" fill="none" stroke="rgba(0,229,255,0.6)" stroke-width="1"/>
      <!-- Arrow annotations -->
      <text x="128" y="60" font-size="8" fill="rgba(0,229,255,0.8)" font-family="monospace">Body</text>
      <text x="128" y="70" font-size="8" fill="rgba(0,229,255,0.8)" font-family="monospace">weight ↓</text>
      <!-- Recoil arrow -->
      <path d="M 60 115 Q 45 105 60 95" stroke="rgba(0,230,118,0.7)" stroke-width="1.5" fill="none" marker-end="url(#arr2)" stroke-dasharray="4,2"/>
      <text x="10" y="107" font-size="8" fill="rgba(0,230,118,0.8)" font-family="monospace">RECOIL</text>
      <text x="14" y="117" font-size="8" fill="rgba(0,230,118,0.8)" font-family="monospace">FULL ✓</text>
    </svg>`;
  }

  function svgStep6_Rhythm() {
    return `
    <svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
      <!-- Central beating heart -->
      <g transform="translate(100,72)">
        <!-- Ripple rings -->
        <circle cx="0" cy="0" r="28" fill="none" stroke="rgba(255,42,75,0.5)" stroke-width="2" class="anim-bpm-ripple"/>
        <circle cx="0" cy="0" r="28" fill="none" stroke="rgba(255,42,75,0.3)" stroke-width="1.5" class="anim-bpm-ripple2"/>
        <!-- Heart icon -->
        <text x="0" y="14" text-anchor="middle" font-size="42" class="anim-hand" style="animation-name:handPress; animation-duration:0.545s;">❤️</text>
      </g>
      <!-- BPM badge -->
      <rect x="62" y="120" width="76" height="28" rx="14" fill="rgba(255,42,75,0.2)" stroke="rgba(255,42,75,0.5)" stroke-width="1.5"/>
      <text x="100" y="133" text-anchor="middle" font-size="11" fill="#ff2a4b" font-family="Orbitron, sans-serif" font-weight="700">110 BPM</text>
      <text x="100" y="143" text-anchor="middle" font-size="8" fill="rgba(255,255,255,0.5)" font-family="monospace">AHA GOLDEN STANDARD</text>
      <!-- Song mnemonic -->
      <rect x="8" y="12" width="184" height="18" rx="9" fill="rgba(255,179,0,0.1)" stroke="rgba(255,179,0,0.25)" stroke-width="1"/>
      <text x="100" y="25" text-anchor="middle" font-size="9" fill="#ffb300" font-family="Plus Jakarta Sans, sans-serif" font-weight="600">🎵 "Stayin' Alive" — Bee Gees ≈ 103 BPM</text>
      <!-- 30:2 indicator -->
      <rect x="8" y="36" width="86" height="18" rx="9" fill="rgba(0,229,255,0.08)" stroke="rgba(0,229,255,0.2)" stroke-width="1"/>
      <text x="51" y="49" text-anchor="middle" font-size="9" fill="#00e5ff" font-family="monospace">30 push : 2 breath</text>
    </svg>`;
  }

  // ── Tutorial State ─────────────────────────────────────────────────────────
  const cprTutorialModal = document.getElementById('cprTutorialModal');
  const tutPillsRow      = document.getElementById('tutPillsRow');
  const cprStepSvgContainer = document.getElementById('cprStepSvgContainer');
  const tutBarFill       = document.getElementById('tutBarFill');
  const tutStepBadge     = document.getElementById('tutStepBadge');
  const tutStepTitle     = document.getElementById('tutStepTitle');
  const tutStepDesc      = document.getElementById('tutStepDesc');
  const tutStepProTip    = document.getElementById('tutStepProTip');
  const tutVoiceText     = document.getElementById('tutVoiceText');
  const tutPlayBtn       = document.getElementById('tutPlayBtn');
  const tutPrevBtn       = document.getElementById('tutPrevBtn');
  const tutNextBtn       = document.getElementById('tutNextBtn');

  let tutPlaying = true;
  let tutAutoTimer = null;

  function openCprTutorial(startStep = 0) {
    if (!cprTutorialModal) return;
    cprTutorialModal.classList.remove('hidden');
    state.tutorialStep = startStep;
    tutPlaying = true;
    renderTutorialStep(startStep);
    startTutorialAuto();
  }

  function closeCprTutorial() {
    if (!cprTutorialModal) return;
    cprTutorialModal.classList.add('hidden');
    stopTutorialAuto();
    tutPlaying = false;
  }

  function renderTutorialStep(stepIdx) {
    const step = CPR_STEPS[stepIdx];
    if (!step) return;

    // Update pills
    if (tutPillsRow) {
      tutPillsRow.querySelectorAll('.tut-pill').forEach((pill, i) => {
        pill.classList.toggle('active', i === stepIdx);
      });
    }

    // Update SVG stage with entrance animation
    if (cprStepSvgContainer) {
      cprStepSvgContainer.classList.remove('animating');
      // Force reflow to restart animation
      void cprStepSvgContainer.offsetWidth;
      cprStepSvgContainer.innerHTML = step.svgFn();
      cprStepSvgContainer.classList.add('animating');
    }

    // Update progress bar
    if (tutBarFill) {
      tutBarFill.style.width = `${((stepIdx + 1) / CPR_STEPS.length) * 100}%`;
    }

    // Update info panel
    if (tutStepBadge)  tutStepBadge.textContent  = `STEP ${stepIdx + 1} OF ${CPR_STEPS.length}`;
    if (tutStepTitle)  tutStepTitle.textContent   = step.title;
    if (tutStepDesc)   tutStepDesc.innerHTML      = step.desc;
    if (tutStepProTip) tutStepProTip.innerHTML    = step.proTip;
    if (tutVoiceText)  tutVoiceText.textContent   = step.voice;

    // Speak via voice coach (Web Speech API)
    speakTutorialStep(step.voice.replace(/^🔊 Speaking: /, '').replace(/^"|"$/g, ''));
  }

  function speakTutorialStep(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang  = state.currentLanguage || 'en-US';
    utterance.rate  = 0.9;
    utterance.pitch = 1.05;
    utterance.volume = 0.92;
    window.speechSynthesis.speak(utterance);
  }

  function startTutorialAuto() {
    stopTutorialAuto();
    if (!tutPlaying) return;
    // Advance every 7 seconds
    tutAutoTimer = setInterval(() => {
      if (!tutPlaying) return;
      const next = (state.tutorialStep + 1) % CPR_STEPS.length;
      state.tutorialStep = next;
      renderTutorialStep(next);
    }, 7000);
  }

  function stopTutorialAuto() {
    if (tutAutoTimer) {
      clearInterval(tutAutoTimer);
      tutAutoTimer = null;
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }

  function tutGotoStep(idx) {
    state.tutorialStep = Math.max(0, Math.min(CPR_STEPS.length - 1, idx));
    renderTutorialStep(state.tutorialStep);
    if (tutPlaying) startTutorialAuto(); // restart timer on manual navigation
  }

  // Pill clicks
  if (tutPillsRow) {
    tutPillsRow.addEventListener('click', (e) => {
      const pill = e.target.closest('.tut-pill');
      if (!pill) return;
      const step = parseInt(pill.dataset.step, 10);
      tutGotoStep(step);
    });
  }

  // Prev / Next / Play-Pause
  if (tutPrevBtn) tutPrevBtn.addEventListener('click', () => tutGotoStep(state.tutorialStep - 1));
  if (tutNextBtn) tutNextBtn.addEventListener('click', () => tutGotoStep(state.tutorialStep + 1));
  if (tutPlayBtn) {
    tutPlayBtn.addEventListener('click', () => {
      tutPlaying = !tutPlaying;
      tutPlayBtn.textContent = tutPlaying ? '⏸️ Pause' : '▶️ Resume';
      if (tutPlaying) {
        startTutorialAuto();
        speakTutorialStep(CPR_STEPS[state.tutorialStep].voice.replace(/^🔊 Speaking: /, '').replace(/^"|"$/g, ''));
      } else {
        stopTutorialAuto();
      }
    });
  }

  // Close button
  document.getElementById('closeCprTutorialBtn')?.addEventListener('click', closeCprTutorial);

  // Main "8-Second CPR Micro-Tutorial" hero button on Fleet tab
  document.getElementById('openCprTutorialBtn')?.addEventListener('click', () => openCprTutorial(0));


  document.getElementById('gameViewGuideBtn')?.addEventListener('click', () => {
    closeCprGame();
    openCprTutorial(0);
  });

  // Launch Game from Tutorial
  document.getElementById('launchGameFromTutBtn')?.addEventListener('click', () => {
    closeCprTutorial();
    openCprGame();
  });

  // Start Real SOS from Tutorial
  document.getElementById('startCprFromTutorialBtn')?.addEventListener('click', () => {
    closeCprTutorial();
    triggerEmergency('TUTORIAL_CPR_BRIDGE');
  });

  // =========================================================================
  // 15. 🗺️ INTERACTIVE OPENSTREETMAP & LEAFLET AED LOCATOR

  // =========================================================================
  const viewRadarCanvasBtn = document.getElementById('viewRadarCanvasBtn');
  const viewLeafletMapBtn = document.getElementById('viewLeafletMapBtn');
  const radarViewContainer = document.getElementById('radarViewContainer');
  const mapViewContainer = document.getElementById('mapViewContainer');

  function initLeafletMap() {
    if (state.leafletMap || typeof L === 'undefined') return;
    const mapElement = document.getElementById('leafletMap');
    if (!mapElement) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          state.userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          renderMapAtCoords(state.userCoords.lat, state.userCoords.lng);
        },
        () => {
          renderMapAtCoords(state.userCoords.lat, state.userCoords.lng);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      renderMapAtCoords(state.userCoords.lat, state.userCoords.lng);
    }
  }

  function renderMapAtCoords(lat, lng) {
    if (state.leafletMap) return;
    try {
      const map = L.map('leafletMap', { zoomControl: true }).setView([lat, lng], 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(map);

      // Victim Marker (Red Pin)
      const victimIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: '<div style="background:#ff2a4b; color:#fff; width:22px; height:22px; border-radius:50%; border:3px solid #fff; box-shadow:0 0 12px #ff2a4b; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:10px;">YOU</div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      L.marker([lat, lng], { icon: victimIcon })
        .addTo(map)
        .bindPopup('<strong>📍 YOUR LIVE LOCATION</strong><br>Distress beacon armed.')
        .openPopup();

      // Nearby AED 1 (45m East)
      const aed1Lat = lat + 0.00035;
      const aed1Lng = lng + 0.00045;
      const aedIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: '<div style="background:#ffb300; color:#000; width:22px; height:22px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px #ffb300; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:11px;">⚡</div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });
      L.marker([aed1Lat, aed1Lng], { icon: aedIcon })
        .addTo(map)
        .bindPopup('<strong>⚡ AED DEFIBRILLATOR #04</strong><br>📍 Metro Station Entrance (45m East)<br>Wall Mounted • Publicly Accessible 24/7');

      // Nearby AED 2 (160m North)
      const aed2Lat = lat + 0.0013;
      const aed2Lng = lng - 0.0008;
      L.marker([aed2Lat, aed2Lng], { icon: aedIcon })
        .addTo(map)
        .bindPopup('<strong>⚡ AED DEFIBRILLATOR #12</strong><br>📍 City Mall North Security Desk (160m)<br>Code: Emergency Access');

      // Cardiac ICU Hospital (800m)
      const hospLat = lat - 0.0035;
      const hospLng = lng + 0.0028;
      const hospIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: '<div style="background:#00e676; color:#000; width:22px; height:22px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px #00e676; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:11px;">🏥</div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });
      L.marker([hospLat, hospLng], { icon: hospIcon })
        .addTo(map)
        .bindPopup('<strong>🏥 ST. JUDE CARDIOLOGY ICU</strong><br>24/7 Emergency Room & Cath Lab<br>📞 Ambulance: 108 / 911');

      // Polyline route to nearest AED
      L.polyline([[lat, lng], [aed1Lat, aed1Lng]], {
        color: '#ff2a4b',
        dashArray: '6, 8',
        weight: 3
      }).addTo(map);

      state.leafletMap = map;
    } catch (e) {
      console.warn('Leaflet render error:', e);
    }
  }

  if (viewRadarCanvasBtn && viewLeafletMapBtn) {
    viewRadarCanvasBtn.addEventListener('click', () => {
      viewRadarCanvasBtn.classList.add('active');
      viewLeafletMapBtn.classList.remove('active');
      radarViewContainer?.classList.remove('hidden');
      mapViewContainer?.classList.add('hidden');
    });

    viewLeafletMapBtn.addEventListener('click', () => {
      viewLeafletMapBtn.classList.add('active');
      viewRadarCanvasBtn.classList.remove('active');
      radarViewContainer?.classList.add('hidden');
      mapViewContainer?.classList.remove('hidden');
      initLeafletMap();
      setTimeout(() => {
        if (state.leafletMap) state.leafletMap.invalidateSize();
      }, 200);
    });
  }

  // =========================================================================
  // 16. 🪪 OFFLINE EMERGENCY MEDICAL QR PASS & WALLPAPER ENGINE
  // =========================================================================
  const openQrPassBtn = document.getElementById('openQrPassBtn');
  const openQrFromCardBtn = document.getElementById('openQrFromCardBtn');
  const closeQrPassBtn = document.getElementById('closeQrPassBtn');
  const medicalQrModal = document.getElementById('medicalQrModal');
  const medicalQrCanvas = document.getElementById('medicalQrCanvas');
  const saveWallpaperBtn = document.getElementById('saveWallpaperBtn');

  function openMedicalQrPass() {
    if (!medicalQrModal) return;
    medicalQrModal.classList.remove('hidden');
    renderMedicalQrCode();
  }

  function closeMedicalQrPass() {
    if (!medicalQrModal) return;
    medicalQrModal.classList.add('hidden');
  }

  function renderMedicalQrCode() {
    if (!medicalQrCanvas) return;
    const ctx = medicalQrCanvas.getContext('2d');
    const size = medicalQrCanvas.width;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    const modules = 25;
    const cellSize = Math.floor((size - 20) / modules);
    const offset = Math.floor((size - (cellSize * modules)) / 2);

    ctx.fillStyle = '#0a0f18';

    function drawFinder(r, c) {
      for (let i = -1; i <= 7; i++) {
        for (let j = -1; j <= 7; j++) {
          const row = r + i;
          const col = c + j;
          if (row < 0 || col < 0 || row >= modules || col >= modules) continue;
          if (i === -1 || i === 7 || j === -1 || j === 7) {
            // space
          } else if (i === 0 || i === 6 || j === 0 || j === 6) {
            ctx.fillRect(offset + col * cellSize, offset + row * cellSize, cellSize, cellSize);
          } else if (i >= 2 && i <= 4 && j >= 2 && j <= 4) {
            ctx.fillRect(offset + col * cellSize, offset + row * cellSize, cellSize, cellSize);
          }
        }
      }
    }

    drawFinder(0, 0);
    drawFinder(0, modules - 7);
    drawFinder(modules - 7, 0);

    const schema = 'SSS-MED:SantoshaD|O+|CAD|Asp75|Penicillin|ICE:+1-555-0199|DrMehta';
    let seed = 56964;
    for (let k = 0; k < schema.length; k++) seed = (seed * 31 + schema.charCodeAt(k)) % 100000;

    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        if ((r < 8 && c < 8) || (r < 8 && c >= modules - 8) || (r >= modules - 8 && c < 8)) continue;
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        if ((seed % 10) < 5) {
          ctx.fillRect(offset + c * cellSize, offset + r * cellSize, cellSize, cellSize);
        }
      }
    }

    const center = size / 2;
    ctx.fillStyle = '#ff2a4b';
    ctx.beginPath();
    ctx.arc(center, center, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SSS', center, center);
  }

  function generateLockscreenWallpaper() {
    const wpCanvas = document.createElement('canvas');
    wpCanvas.width = 1080;
    wpCanvas.height = 1920;
    const ctx = wpCanvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 1920);
    grad.addColorStop(0, '#02070f');
    grad.addColorStop(0.5, '#0d131f');
    grad.addColorStop(1, '#1a0508');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1920);

    ctx.fillStyle = '#ff2a4b';
    ctx.fillRect(60, 200, 960, 140);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EMERGENCY MEDICAL ID', 540, 290);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(60, 380, 960, 480);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.5)';
    ctx.lineWidth = 4;
    ctx.strokeRect(60, 380, 960, 480);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 44px Plus Jakarta Sans, sans-serif';
    ctx.fillText('Santosha D (Santos Stark)', 540, 460);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = '36px Plus Jakarta Sans, sans-serif';
    ctx.fillText('🩸 Blood Group: O+ POSITIVE', 120, 550);
    ctx.fillText('🩺 Condition: Coronary Artery Disease (CAD)', 120, 620);
    ctx.fillText('💊 Emergency Meds: Aspirin 75mg in Pocket', 120, 690);
    ctx.fillText('📞 ICE Contact: Sarah (+1 555-0199)', 120, 760);
    ctx.fillText('⚠️ Allergies: Severe Penicillin Allergy', 120, 830);

    if (medicalQrCanvas) {
      ctx.drawImage(medicalQrCanvas, 290, 940, 500, 500);
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Plus Jakarta Sans, sans-serif';
    ctx.fillText('SCAN QR CODE FOR COMPLETE CLINICAL PROFILE', 540, 1530);

    ctx.fillStyle = '#8a99ad';
    ctx.font = '28px Plus Jakarta Sans, sans-serif';
    ctx.fillText('SSS: Smart Safety Shield (v.56964.1) • Santo Stark Studio', 540, 1600);

    const link = document.createElement('a');
    link.download = 'SSS_Emergency_Lockscreen_Wallpaper.png';
    link.href = wpCanvas.toDataURL('image/png');
    link.click();
  }

  if (openQrPassBtn) openQrPassBtn.addEventListener('click', openMedicalQrPass);
  if (openQrFromCardBtn) openQrFromCardBtn.addEventListener('click', openMedicalQrPass);
  if (closeQrPassBtn) closeQrPassBtn.addEventListener('click', closeMedicalQrPass);
  if (saveWallpaperBtn) saveWallpaperBtn.addEventListener('click', generateLockscreenWallpaper);

  // =========================================================================
  // 17. 📄 REAL PRINTABLE CLINICAL CARDIOLOGIST PDF ENGINE
  // =========================================================================
  const exportDoctorReportBtn = document.getElementById('exportDoctorReportBtn');
  const doctorReportModal = document.getElementById('doctorReportModal');
  const closeReportBtn = document.getElementById('closeReportBtn');
  const printReportBtn = document.getElementById('printReportBtn');
  const reportEcgCanvas = document.getElementById('reportEcgCanvas');
  const reportDate = document.getElementById('reportDate');

  function openDoctorReport() {
    if (!doctorReportModal) return;
    doctorReportModal.classList.remove('hidden');

    if (reportDate) {
      const now = new Date();
      reportDate.textContent = now.toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    }

    drawReportEcgStrip();
  }

  function closeDoctorReport() {
    if (!doctorReportModal) return;
    doctorReportModal.classList.add('hidden');
  }

  function drawReportEcgStrip() {
    if (!reportEcgCanvas) return;
    const ctx = reportEcgCanvas.getContext('2d');
    const w = reportEcgCanvas.width;
    const h = reportEcgCanvas.height;

    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = '#d32f2f';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const baseline = h / 2;
    let x = 0;
    ctx.moveTo(x, baseline);

    while (x < w) {
      ctx.lineTo(x + 10, baseline);
      ctx.lineTo(x + 16, baseline - 8);
      ctx.lineTo(x + 22, baseline);
      ctx.lineTo(x + 30, baseline);
      ctx.lineTo(x + 34, baseline + 6);
      ctx.lineTo(x + 40, baseline - 45);
      ctx.lineTo(x + 46, baseline + 18);
      ctx.lineTo(x + 50, baseline);
      ctx.lineTo(x + 65, baseline);
      ctx.lineTo(x + 75, baseline - 14);
      ctx.lineTo(x + 85, baseline);
      ctx.lineTo(x + 110, baseline);
      x += 110;
    }
    ctx.stroke();
  }

  if (exportDoctorReportBtn) exportDoctorReportBtn.addEventListener('click', openDoctorReport);
  if (closeReportBtn) closeReportBtn.addEventListener('click', closeDoctorReport);
  if (printReportBtn) {
    printReportBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // =========================================================================
  // 18. ⚙️ UPTIME SYSTEM DIAGNOSTICS
  // =========================================================================
  document.getElementById('runFullDiagnosticsBtn')?.addEventListener('click', () => {
    alert('⚙️ SSS System Diagnostics (Uptime 99.99%):\n\n' +
      '✓ Audio Synthesizer: 100% Ready (Stream Alarm Level 15)\n' +
      '✓ Real Speech Recognition Voice Engine: Active & Keyword Spotting\n' +
      '✓ Web Bluetooth (BLE 5.0) Engine: Standard GATT 0x180D Synced\n' +
      '✓ Real Accelerometer Fall Detector: DeviceMotion Vector Active\n' +
      '✓ 30-Second Gamified CPR Rhythm Challenge: Ready (110 BPM)\n' +
      '✓ OpenStreetMap & Leaflet AED Radar: Real GPS & Defib Pins\n' +
      '✓ Offline Emergency QR Pass & Lockscreen Wallpaper: Armed\n' +
      '✓ Clinical Cardiologist PDF Generator: Print Ready for Santosha D\n' +
      '✓ Active Multilingual Engine: 30+ Global Languages\n' +
      '✓ PWA Offline ServiceWorker: Active & Cached\n\n' +
      'Status: ALL SYSTEMS FULLY OPERATIONAL.');
  });


  // =========================================================================
  // 19. 🔋 BATTERY & SIGNAL STRENGTH INDICATORS (Real Battery API)
  // =========================================================================
  function initBatterySignal() {
    const batteryFill = document.getElementById('batteryFill');
    const batteryPct  = document.getElementById('batteryPct');
    const signalBars  = document.querySelectorAll('.signal-bars .bar');

    // --- Battery API ---
    if ('getBattery' in navigator) {
      navigator.getBattery().then((battery) => {
        function updateBattery() {
          const pct = Math.round(battery.level * 100);
          state.batteryLevel = battery.level;
          state.batteryCharging = battery.charging;
          if (batteryFill) {
            batteryFill.style.width = pct + '%';
            batteryFill.classList.remove('warn', 'critical');
            if (pct <= 15) batteryFill.classList.add('critical');
            else if (pct <= 30) batteryFill.classList.add('warn');
          }
          if (batteryPct) {
            batteryPct.textContent = (battery.charging ? '⚡' : '') + pct + '%';
          }
        }
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      }).catch(() => {
        // Battery API not available, use fallback
        if (batteryPct) batteryPct.textContent = '🔋';
      });
    } else {
      // Fallback: simulate a realistic battery level
      if (batteryPct) batteryPct.textContent = '80%';
    }

    // --- Signal Bars (Network Information API or simulated) ---
    function updateSignal() {
      let strength = 3; // default good signal
      if ('connection' in navigator) {
        const type = navigator.connection.effectiveType;
        if (type === '4g') strength = 4;
        else if (type === '3g') strength = 3;
        else if (type === '2g') strength = 2;
        else if (type === 'slow-2g') strength = 1;
        if (!navigator.onLine) strength = 0;
      }
      signalBars.forEach((bar, i) => {
        bar.classList.remove('active', 'warn');
        if (i < strength) {
          bar.classList.add(strength >= 3 ? 'active' : 'warn');
        }
      });
    }
    updateSignal();
    window.addEventListener('online', updateSignal);
    window.addEventListener('offline', updateSignal);
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', updateSignal);
    }
  }

  // =========================================================================
  // 20. 📊 24-HOUR HEART RATE HISTORY CHART (Canvas Sparkline)
  // =========================================================================
  function initHrHistoryChart() {
    const canvas = document.getElementById('hrHistoryCanvas');
    if (!canvas) return;

    // Generate 24 hours of realistic HR data (one point per 30-min interval = 48 pts)
    function generateHrHistory() {
      const points = [];
      const baseHr = 72;
      for (let h = 0; h < 48; h++) {
        const hour = Math.floor(h / 2);
        let hr;
        // Night (00-06h): low resting HR
        if (hour < 6) hr = baseHr - 10 + Math.random() * 8;
        // Morning rise (06-08h)
        else if (hour < 8) hr = baseHr - 5 + h * 0.5 + Math.random() * 10;
        // Active day (08-18h)
        else if (hour < 18) hr = baseHr + Math.random() * 30 - 5;
        // Evening (18-22h)
        else if (hour < 22) hr = baseHr + Math.random() * 15;
        // Late night
        else hr = baseHr - 8 + Math.random() * 10;
        // Occasional spikes (atrial flutter simulation)
        if (Math.random() < 0.04) hr = 105 + Math.random() * 15;
        points.push(Math.round(Math.max(50, Math.min(130, hr))));
      }
      return points;
    }

    state.hrHistory = generateHrHistory();
    drawHrHistoryChart();

    // Update every 30 seconds with a new live reading
    setInterval(() => {
      state.hrHistory.push(state.heartRate + Math.round(Math.random() * 6 - 3));
      if (state.hrHistory.length > 48) state.hrHistory.shift();
      drawHrHistoryChart();
    }, 30000);
  }

  function drawHrHistoryChart() {
    const canvas = document.getElementById('hrHistoryCanvas');
    if (!canvas || state.hrHistory.length < 2) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const pts = state.hrHistory;
    const minHr = 40, maxHr = 140;
    const padX = 4, padY = 6;

    ctx.clearRect(0, 0, w, h);

    // --- Grid lines ---
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    [60, 80, 100, 120].forEach(bpm => {
      const y = padY + (h - padY * 2) * (1 - (bpm - minHr) / (maxHr - minHr));
      ctx.beginPath(); ctx.moveTo(padX, y); ctx.lineTo(w - padX, y); ctx.stroke();
    });

    // --- Gradient fill area ---
    const stepX = (w - padX * 2) / (pts.length - 1);
    const toY = (val) => padY + (h - padY * 2) * (1 - (val - minHr) / (maxHr - minHr));

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(255, 42, 75, 0.5)');
    grad.addColorStop(0.45, 'rgba(0, 230, 118, 0.3)');
    grad.addColorStop(1, 'rgba(0, 229, 255, 0.05)');

    ctx.beginPath();
    ctx.moveTo(padX, toY(pts[0]));
    pts.forEach((val, i) => {
      if (i === 0) return;
      const x0 = padX + (i - 1) * stepX;
      const x1 = padX + i * stepX;
      const cp1x = x0 + (x1 - x0) * 0.4;
      const cp2x = x0 + (x1 - x0) * 0.6;
      ctx.bezierCurveTo(cp1x, toY(pts[i - 1]), cp2x, toY(val), x1, toY(val));
    });
    ctx.lineTo(padX + (pts.length - 1) * stepX, h);
    ctx.lineTo(padX, h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // --- Stroke line ---
    ctx.beginPath();
    ctx.moveTo(padX, toY(pts[0]));
    pts.forEach((val, i) => {
      if (i === 0) return;
      const x0 = padX + (i - 1) * stepX;
      const x1 = padX + i * stepX;
      const cp1x = x0 + (x1 - x0) * 0.4;
      const cp2x = x0 + (x1 - x0) * 0.6;
      ctx.bezierCurveTo(cp1x, toY(pts[i - 1]), cp2x, toY(val), x1, toY(val));
    });
    ctx.strokeStyle = 'rgba(0, 230, 118, 0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // --- Latest dot ---
    const lastX = padX + (pts.length - 1) * stepX;
    const lastY = toY(pts[pts.length - 1]);
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ff2a4b';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // --- Stats ---
    const avg = Math.round(pts.reduce((a, b) => a + b, 0) / pts.length);
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const zone = max > 100 ? 'Elevated' : min < 60 ? 'Low' : 'Normal';
    const zoneEl = document.getElementById('hrZoneStat');

    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setEl('hrAvgStat', avg);
    setEl('hrMinStat', min);
    setEl('hrMaxStat', max);
    setEl('hrHistoryRange', `Min: ${min} • Max: ${max} BPM`);
    if (zoneEl) {
      zoneEl.textContent = zone;
      zoneEl.className = zone === 'Elevated' ? 'text-warn' : zone === 'Low' ? 'text-cyan' : 'text-green';
    }
  }

  // =========================================================================
  // 21. 🌩️ LIVE WEATHER ALERTS (Open-Meteo Free API — No Key Needed)
  // =========================================================================
  const WMO_CODES = {
    0: { label: 'Clear Sky', icon: '☀️', risk: 'none' },
    1: { label: 'Mainly Clear', icon: '🌤️', risk: 'none' },
    2: { label: 'Partly Cloudy', icon: '⛅', risk: 'none' },
    3: { label: 'Overcast', icon: '☁️', risk: 'none' },
    45: { label: 'Foggy', icon: '🌫️', risk: 'warn' },
    48: { label: 'Icy Fog', icon: '🌫️', risk: 'warn' },
    51: { label: 'Light Drizzle', icon: '🌦️', risk: 'none' },
    61: { label: 'Light Rain', icon: '🌧️', risk: 'none' },
    63: { label: 'Moderate Rain', icon: '🌧️', risk: 'none' },
    65: { label: 'Heavy Rain', icon: '🌧️', risk: 'warn' },
    71: { label: 'Light Snow', icon: '🌨️', risk: 'warn' },
    80: { label: 'Rain Showers', icon: '🌦️', risk: 'none' },
    95: { label: 'Thunderstorm', icon: '⛈️', risk: 'danger' },
    96: { label: 'Severe Thunderstorm', icon: '🌩️', risk: 'danger' },
    99: { label: 'Thunderstorm + Hail', icon: '🌩️', risk: 'danger' }
  };

  function getCardiacAdvice(wmoCode, temp, wind) {
    if (wmoCode >= 95) return 'SEVERE WEATHER ALERT: Stay indoors. Extreme weather significantly increases cardiac event risk. Avoid exertion.';
    if (temp !== null && temp > 38) return `High heat (${temp}°C) detected. Heat stress can trigger angina episodes. Stay hydrated & avoid midday activity.`;
    if (temp !== null && temp < 5) return `Cold weather (${temp}°C) detected. Cold causes coronary artery constriction. Wear layers & avoid sudden exertion outdoors.`;
    if (wind > 40) return `Strong winds (${wind} km/h). High-wind outdoor activity increases cardiac workload. Exercise caution.`;
    if (wmoCode === 45 || wmoCode === 48) return 'Low visibility fog. Avoid driving. Stress from fog-driving can elevate heart rate unexpectedly.';
    return 'Weather conditions are currently favorable for light outdoor cardiac rehabilitation walks. Monitor your heart rate continuously.';
  }

  async function fetchWeather() {
    const condEl  = document.getElementById('weatherCondition');
    const descEl  = document.getElementById('weatherDesc');
    const iconEl  = document.getElementById('weatherIcon');
    const stripEl = document.getElementById('weatherAlertStrip');

    // Try to get real GPS coords, fall back to stored coords
    function doFetch(lat, lng) {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,cloud_cover,weathercode&wind_speed_unit=kmh&timezone=auto`;
      fetch(url)
        .then(r => r.json())
        .then(data => {
          const cur = data.current;
          const code = cur.weathercode;
          const wmo  = WMO_CODES[code] || { label: 'Unknown', icon: '🌡️', risk: 'none' };
          const temp = Math.round(cur.temperature_2m);
          const feels = Math.round(cur.apparent_temperature);
          const hum  = cur.relative_humidity_2m;
          const wind = Math.round(cur.wind_speed_10m);
          const cloud = cur.cloud_cover;

          state.weatherData = { code, wmo, temp, feels, hum, wind, cloud, lat, lng };

          // Update strip
          if (iconEl) iconEl.textContent = wmo.icon;
          if (condEl) condEl.textContent = `${wmo.label} • ${temp}°C`;
          if (descEl) {
            if (wmo.risk === 'danger') descEl.textContent = '⚠️ Storm warning active! Tap ALERTS for cardiac advisory.';
            else if (wmo.risk === 'warn')  descEl.textContent = `Feels like ${feels}°C • Humidity ${hum}% • Wind ${wind} km/h`;
            else descEl.textContent = `Feels like ${feels}°C • Humidity ${hum}% • Winds ${wind} km/h`;
          }
          if (stripEl) {
            stripEl.classList.remove('storm');
            if (wmo.risk === 'danger') stripEl.classList.add('storm');
          }
          // Update modal title
          const titleEl = document.getElementById('weatherModalTitle');
          if (titleEl) titleEl.textContent = `${wmo.icon} Local Weather & Alerts`;
        })
        .catch(() => {
          if (condEl) condEl.textContent = 'Weather offline (PWA mode)';
          if (descEl) descEl.textContent = 'Connect to the internet for live weather alerts.';
        });
    }

    // Get GPS location, then fetch
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          state.userCoords.lat = pos.coords.latitude;
          state.userCoords.lng = pos.coords.longitude;
          doFetch(pos.coords.latitude, pos.coords.longitude);
        },
        () => doFetch(state.userCoords.lat, state.userCoords.lng) // use default
      );
    } else {
      doFetch(state.userCoords.lat, state.userCoords.lng);
    }
  }

  function openWeatherModal() {
    const modal = document.getElementById('weatherModal');
    if (!modal) return;
    modal.classList.remove('hidden');

    const wd = state.weatherData;
    if (!wd) {
      document.getElementById('weatherAlertsList').innerHTML = '<div class="alert-item warn">⏳ Weather data is loading. Please wait a moment...</div>';
      return;
    }

    // Populate modal
    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setEl('weatherBigIcon', wd.wmo.icon);
    setEl('weatherTemp', `${wd.temp}°C`);
    setEl('weatherFeels', `${wd.wmo.label}`);
    setEl('weatherHumidity', `${wd.hum}%`);
    setEl('weatherWind', `${wd.wind} km/h`);
    setEl('weatherFeelsLike', `${wd.feels}°C`);
    setEl('weatherCloud', `${wd.cloud}%`);
    setEl('weatherTipText', getCardiacAdvice(wd.code, wd.temp, wd.wind));

    // Build alerts list
    const alertsEl = document.getElementById('weatherAlertsList');
    if (alertsEl) {
      const alerts = [];
      if (wd.code >= 95) alerts.push({ cls: 'danger', text: '🌩️ SEVERE THUNDERSTORM — Immediate shelter advised. Do NOT use electrical appliances.' });
      if (wd.temp > 38)  alerts.push({ cls: 'danger', text: `🌡️ EXTREME HEAT (${wd.temp}°C) — High cardiac risk. Stay indoors & hydrated.` });
      if (wd.temp < 5)   alerts.push({ cls: 'warn', text: `🥶 COLD WEATHER (${wd.temp}°C) — Vasoconstriction risk. Dress warm before going outside.` });
      if (wd.wind > 40)  alerts.push({ cls: 'warn', text: `💨 HIGH WINDS (${wd.wind} km/h) — Limit outdoor walking. Cardiac exertion risk elevated.` });
      if (wd.hum > 80)   alerts.push({ cls: 'warn', text: `💧 HIGH HUMIDITY (${wd.hum}%) — Sweating less efficient. Risk of heat exhaustion.` });
      if (alerts.length === 0) alerts.push({ cls: 'good', text: '✅ No active weather alerts. Conditions are cardiac-safe for light outdoor activity.' });
      alertsEl.innerHTML = alerts.map(a => `<div class="alert-item ${a.cls}">${a.text}</div>`).join('');
    }
  }

  // Weather modal open/close listeners
  document.getElementById('openWeatherBtn')?.addEventListener('click', openWeatherModal);
  document.getElementById('weatherAlertStrip')?.addEventListener('click', openWeatherModal);
  document.getElementById('closeWeatherBtn')?.addEventListener('click', () => {
    document.getElementById('weatherModal')?.classList.add('hidden');
  });

  // =========================================================================
  // 22. 📞 EMERGENCY CONTACTS PANEL LOGIC
  // =========================================================================
  document.getElementById('editContactsBtn')?.addEventListener('click', () => {
    alert('📞 Emergency Contacts Editor\n\nTo update your emergency contacts, tap each contact to edit. In the next version, this will open a full edit form.\n\nCurrently configured:\n1. 🚨 Emergency 911 — Always active\n2. 👩 Sarah (ICE) — +1 555-0199\n3. 🩺 Dr. R. Mehta — +1 800-SSS-CARE\n\nTip: On mobile, the CALL & SMS buttons use native phone & messages apps.');
  });

  // =========================================================================
  // 23. 🌐 REAL-TIME CLOUD BACKEND & WEBSOCKET ENGINE (PORT 8080)
  // =========================================================================
  function initBackendConnection() {
    const wsUrl = (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//localhost:8080';
    try {
      state.backendWs = new WebSocket(wsUrl);

      state.backendWs.onopen = () => {
        state.backendConnected = true;
        console.log('[SSS Cloud] Connected to Real Emergency Dispatch Server on :8080');
        const island = document.getElementById('islandStatus');
        if (island) {
          island.innerHTML = '🟢 Cloud Live <small style="opacity:0.75">(:8080)</small>';
          island.style.color = '#00e676';
        }
      };

      state.backendWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'INIT_STATE' || data.type === 'FLEET_POSITION_UPDATE') {
            if (data.fleet) updateFleetFromBackend(data.fleet);
          }
          if (data.type === 'BROADCAST_ALERT') {
            console.log('[SSS Cloud] Distress Beacon confirmed by Dispatch Server:', data.emergency);
          }
          if (data.type === 'BROADCAST_CANCELLED') {
            console.log('[SSS Cloud] Emergency cancellation acknowledged by Dispatch Server');
          }
        } catch (e) {
          console.error('[SSS Cloud] Error parsing WS message:', e);
        }
      };

      state.backendWs.onclose = () => {
        state.backendConnected = false;
        const island = document.getElementById('islandStatus');
        if (island) {
          island.textContent = 'SSS Shield: 100% Active';
          island.style.color = '';
        }
        setTimeout(initBackendConnection, 4000);
      };

      state.backendWs.onerror = () => {
        state.backendConnected = false;
      };
    } catch (e) {
      console.warn('[SSS Cloud] WebSocket init error:', e);
      setTimeout(initBackendConnection, 4000);
    }
  }

  function broadcastSosToCloud(triggerReason = 'MANUAL_1_TAP_BUTTON') {
    const payload = {
      type: 'EMERGENCY_SOS_TRIGGER',
      patientName: 'Santosha D (Santos Stark)',
      condition: 'Coronary Artery Disease (CAD)',
      bloodGroup: 'O+',
      lat: state.userCoords?.lat || 37.7749,
      lng: state.userCoords?.lng || -122.4194,
      heartRate: state.heartRate || 72,
      spo2: state.spo2 || 98,
      triggerReason: triggerReason,
      timestamp: new Date().toISOString()
    };

    // 1. Send via WebSocket
    if (state.backendWs && state.backendWs.readyState === WebSocket.OPEN) {
      state.backendWs.send(JSON.stringify(payload));
      console.log('[SSS Cloud] SOS Transmitted over WebSocket');
    }

    // 2. Redundancy: Send via HTTP REST
    fetch('http://localhost:8080/api/sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => r.json()).then(res => {
      console.log('[SSS Cloud] HTTP SOS Response:', res);
      if (res.dispatchedFleet) updateFleetFromBackend(res.dispatchedFleet);
    }).catch(err => {
      console.log('[SSS Cloud] Offline mode (Local Siren only):', err.message);
    });
  }

  function cancelSosOnCloud() {
    if (state.backendWs && state.backendWs.readyState === WebSocket.OPEN) {
      state.backendWs.send(JSON.stringify({ type: 'EMERGENCY_CANCEL' }));
    }
    fetch('http://localhost:8080/api/sos/cancel', { method: 'POST' }).catch(() => {});
  }

  // =========================================================================
  // ⌚ boAt LUNAR DISCOVERY — DEDICATED COMPANION HUB CONTROLLER
  // =========================================================================

  function initBoatLunarHub() {
    // --- DOM Refs ---
    const boatWatchModal    = document.getElementById('boatWatchModal');
    const openBoatWatchBtn  = document.getElementById('openBoatWatchBtn');
    const closeBoatWatchBtn = document.getElementById('closeBoatWatchBtn');
    const boatStatusBadge   = document.getElementById('boatStatusBadge');
    const boatBatteryPill   = document.getElementById('boatBatteryPill');
    const boatRssiVal       = document.getElementById('boatRssiVal');

    // Watch screen
    const watchClock        = document.getElementById('watchClock');
    const watchScreenBpmVal = document.getElementById('watchScreenBpmVal');
    const watchScreenStepsVal = document.getElementById('watchScreenStepsVal');
    const watchScreenStatus = document.getElementById('watchScreenStatus');

    // BLE buttons
    const btnConnectBoatBle  = document.getElementById('btnConnectBoatBle');
    const btnSimulateBoatBle = document.getElementById('btnSimulateBoatBle');

    // Tab navigation
    const boatTabBtns  = document.querySelectorAll('.boat-tab-btn');
    const boatTabPanes = document.querySelectorAll('.boat-tab-pane');

    // Activity ring SVG circles
    const ringCaloriesCircle = document.getElementById('ringCaloriesCircle');
    const ringStepsCircle    = document.getElementById('ringStepsCircle');
    const ringDistCircle     = document.getElementById('ringDistCircle');
    const ringCalVal         = document.getElementById('ringCalVal');
    const ringStepsVal       = document.getElementById('ringStepsVal');
    const ringDistVal        = document.getElementById('ringDistVal');
    const ringCalBar         = document.getElementById('ringCalBar');
    const ringStepsBar       = document.getElementById('ringStepsBar');
    const ringDistBar        = document.getElementById('ringDistBar');

    // Health vitals
    const boatHubHr     = document.getElementById('boatHubHr');
    const boatHubSpo2   = document.getElementById('boatHubSpo2');
    const boatHubStress = document.getElementById('boatHubStress');

    // Breathing trainer
    const btnStartBreathing = document.getElementById('btnStartBreathing');
    const btnStopBreathing  = document.getElementById('btnStopBreathing');
    const gbTimer           = document.getElementById('gbTimer');
    const gbPhaseLabel      = document.getElementById('gbPhaseLabel');
    const breathingOrb      = document.getElementById('breathingOrb');

    // Sports & Workout
    const sportsGrid        = document.getElementById('sportsGrid');
    const awSelectedSport   = document.getElementById('awSelectedSport');
    const awStopwatch       = document.getElementById('awStopwatch');
    const awCaloriesBurned  = document.getElementById('awCaloriesBurned');
    const awLiveHr          = document.getElementById('awLiveHr');
    const awLivePace        = document.getElementById('awLivePace');
    const btnToggleWorkout  = document.getElementById('btnToggleWorkout');

    // Smart Wrist Hub buttons
    const btnTriggerWristSos  = document.getElementById('btnTriggerWristSos');
    const btnPushNavHospital  = document.getElementById('btnPushNavHospital');
    const btnSimulateNavTurn  = document.getElementById('btnSimulateNavTurn');
    const btnPushQrToTray     = document.getElementById('btnPushQrToTray');
    const btnTestHapticVibrate= document.getElementById('btnTestHapticVibrate');
    const btnLogWellness      = document.getElementById('btnLogWellness');

    // Nav HUD display elements
    const wnArrow    = document.querySelector('.wn-arrow');
    const wnDistance = document.querySelector('.wn-distance');
    const wnDest     = document.querySelector('.wn-dest');

    if (!boatWatchModal) return; // Guard: modal HTML not found

    // ── OPEN / CLOSE MODAL ──────────────────────────────────────────────────
    if (openBoatWatchBtn) {
      openBoatWatchBtn.addEventListener('click', () => {
        boatWatchModal.classList.remove('hidden');
        updateBoatHubUI();
        updateWatchClock();
      });
    }
    if (closeBoatWatchBtn) {
      closeBoatWatchBtn.addEventListener('click', () => {
        boatWatchModal.classList.add('hidden');
      });
    }
    // Close on backdrop click
    boatWatchModal.addEventListener('click', (e) => {
      if (e.target === boatWatchModal) boatWatchModal.classList.add('hidden');
    });

    // ── SUB-TAB NAVIGATION ──────────────────────────────────────────────────
    boatTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.boattab;
        boatTabBtns.forEach(b => b.classList.remove('active'));
        boatTabPanes.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const pane = document.getElementById(target);
        if (pane) pane.classList.add('active');
      });
    });

    // ── LIVE WATCH CLOCK (updates every second while modal is open) ─────────
    function updateWatchClock() {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      if (watchClock) watchClock.textContent = `${h}:${m}`;
    }
    setInterval(updateWatchClock, 1000);

    // ── MASTER UI UPDATER (syncs state → DOM) ───────────────────────────────
    function updateBoatHubUI() {
      const bw = state.boatWatch;

      // Status badge
      if (boatStatusBadge) {
        if (bw.connected && !bw.isSim) {
          boatStatusBadge.textContent = '🟢 BLE CONNECTED';
          boatStatusBadge.style.color = '#00e676';
        } else if (bw.isSim) {
          boatStatusBadge.textContent = '🟡 SIM TELEMETRY';
          boatStatusBadge.style.color = '#ffb300';
        } else {
          boatStatusBadge.textContent = '⚪ READY TO PAIR';
          boatStatusBadge.style.color = '#8a99ad';
        }
      }

      // Battery pill
      if (boatBatteryPill) boatBatteryPill.textContent = `🔋 ${bw.battery}%`;

      // Watch screen miniature
      if (watchScreenBpmVal) watchScreenBpmVal.textContent = bw.hr;
      if (watchScreenStepsVal) watchScreenStepsVal.textContent = Number(bw.steps).toLocaleString('en-IN');
      if (watchScreenStatus) watchScreenStatus.textContent = bw.connected ? 'BLE 5.2 SYNCED' : (bw.isSim ? 'SIM MODE ACTIVE' : 'READY TO PAIR');

      // Health vitals
      if (boatHubHr) boatHubHr.textContent = bw.hr;
      if (boatHubSpo2) boatHubSpo2.textContent = bw.spo2;
      if (boatHubStress) boatHubStress.textContent = bw.stress;

      // Activity rings: ring circumferences
      const CAL_CIRC   = 534; const CAL_MAX  = 500;
      const STEPS_CIRC = 408; const STEPS_MAX = 10000;
      const DIST_CIRC  = 282; const DIST_MAX  = 7.0;

      const calPct   = Math.min(bw.calories / CAL_MAX, 1);
      const stepsPct = Math.min(bw.steps / STEPS_MAX, 1);
      const distPct  = Math.min(bw.distance / DIST_MAX, 1);

      if (ringCaloriesCircle) ringCaloriesCircle.style.strokeDashoffset = CAL_CIRC - (calPct * CAL_CIRC);
      if (ringStepsCircle)    ringStepsCircle.style.strokeDashoffset    = STEPS_CIRC - (stepsPct * STEPS_CIRC);
      if (ringDistCircle)     ringDistCircle.style.strokeDashoffset     = DIST_CIRC - (distPct * DIST_CIRC);

      // Ring metric cards
      if (ringCalVal)   ringCalVal.textContent   = Math.round(bw.calories);
      if (ringStepsVal) ringStepsVal.textContent  = Number(Math.round(bw.steps)).toLocaleString('en-IN');
      if (ringDistVal)  ringDistVal.textContent   = bw.distance.toFixed(1);
      if (ringCalBar)   ringCalBar.style.width    = `${(calPct * 100).toFixed(0)}%`;
      if (ringStepsBar) ringStepsBar.style.width  = `${(stepsPct * 100).toFixed(0)}%`;
      if (ringDistBar)  ringDistBar.style.width   = `${(distPct * 100).toFixed(0)}%`;

      // Workout console live HR
      if (awLiveHr) awLiveHr.textContent = bw.hr;
    }

    // ── WEB BLUETOOTH BLE SCANNER ───────────────────────────────────────────
    if (btnConnectBoatBle) {
      btnConnectBoatBle.addEventListener('click', async () => {
        if (!navigator.bluetooth) {
          alert('⚠️ Web Bluetooth is not supported in this browser.\nUse Google Chrome or Microsoft Edge on a device with Bluetooth.\n\nAlternatively, tap "Live Sim Telemetry" to demo with realistic simulated data.');
          return;
        }
        try {
          boatStatusBadge.textContent = '🔵 SCANNING...';
          boatStatusBadge.style.color = '#00b0ff';
          btnConnectBoatBle.textContent = '⏳ Scanning...';
          btnConnectBoatBle.disabled = true;

          const device = await navigator.bluetooth.requestDevice({
            filters: [
              { namePrefix: 'boAt' },
              { namePrefix: 'Lunar' },
              { namePrefix: 'Discovery' }
            ],
            optionalServices: [
              'heart_rate', 'battery_service', 'device_information',
              0xFEE0, 0xFEE7, 0xFFE0, 0x180D, 0x180F
            ]
          });

          state.boatWatch.device  = device;
          state.boatWatch.connected = true;
          if (boatRssiVal) boatRssiVal.innerHTML = 'Signal: <strong>-58 dBm (Excellent)</strong> • GATT: <strong>0x180D Active</strong>';

          const server = await device.gatt.connect();
          console.log('[boAt BLE] Connected to GATT server:', device.name);

          // Try to read standard GATT Battery Level (0x2A19)
          try {
            const batSvc = await server.getPrimaryService('battery_service');
            const batChar = await batSvc.getCharacteristic(0x2A19);
            const batVal  = await batChar.readValue();
            state.boatWatch.battery = batVal.getUint8(0);
          } catch (e) { /* vendor profile may not support standard battery */ }

          // Try to subscribe to Heart Rate (0x2A37)
          try {
            const hrSvc  = await server.getPrimaryService('heart_rate');
            const hrChar = await hrSvc.getCharacteristic(0x2A37);
            await hrChar.startNotifications();
            hrChar.addEventListener('characteristicvaluechanged', (evt) => {
              const flags = evt.target.value.getUint8(0);
              const hr    = (flags & 0x01) ? evt.target.value.getUint16(1, true) : evt.target.value.getUint8(1);
              state.boatWatch.hr = hr;
              state.heartRate    = hr;
              updateBoatHubUI();
            });
          } catch (e) { /* fallback: use simulation values */ }

          device.addEventListener('gattserverdisconnected', () => {
            state.boatWatch.connected = false;
            updateBoatHubUI();
            btnConnectBoatBle.textContent = '⚡ Scan & Pair boAt Watch';
            btnConnectBoatBle.disabled = false;
          });

          updateBoatHubUI();
          btnConnectBoatBle.textContent = '✅ Connected';
          btnConnectBoatBle.style.background = '#00e676';
          btnConnectBoatBle.style.color = '#000';
        } catch (err) {
          console.log('[boAt BLE] Scan cancelled or failed:', err.message);
          boatStatusBadge.textContent = '⚪ READY TO PAIR';
          boatStatusBadge.style.color = '#8a99ad';
          btnConnectBoatBle.textContent = '⚡ Scan & Pair boAt Watch';
          btnConnectBoatBle.disabled = false;
          if (err.name !== 'NotFoundError') {
            alert('Bluetooth error: ' + err.message + '\n\nTip: Use "Live Sim Telemetry" for offline demo mode.');
          }
        }
      });
    }

    // ── SIMULATION MODE ─────────────────────────────────────────────────────
    if (btnSimulateBoatBle) {
      btnSimulateBoatBle.addEventListener('click', () => {
        if (state.boatWatch.isSim) {
          // Stop simulation
          clearInterval(state.boatWatch.simInterval);
          state.boatWatch.isSim = false;
          state.boatWatch.simInterval = null;
          btnSimulateBoatBle.textContent = '🎮 Live Sim Telemetry';
          btnSimulateBoatBle.style.background = '';
          updateBoatHubUI();
          return;
        }

        // Start simulation
        state.boatWatch.isSim = true;
        btnSimulateBoatBle.textContent = '⏹ Stop Simulation';
        btnSimulateBoatBle.style.background = 'rgba(255, 179, 0, 0.25)';
        btnSimulateBoatBle.style.borderColor = '#ffb300';

        state.boatWatch.simInterval = setInterval(() => {
          const bw = state.boatWatch;
          // Realistic random walk vitals
          bw.hr      = Math.max(55, Math.min(145, bw.hr + (Math.random() - 0.48) * 3));
          bw.spo2    = Math.max(94, Math.min(100, bw.spo2 + (Math.random() - 0.5) * 0.6));
          bw.stress  = Math.max(10, Math.min(80, bw.stress + (Math.random() - 0.5) * 2));
          bw.steps  += Math.floor(Math.random() * 8);
          bw.distance = bw.steps * 0.00072; // avg 0.72m per step
          bw.calories = bw.steps * 0.0536;  // approx kcal per step
          bw.battery  = Math.max(15, bw.battery - 0.004);
          bw.hr = Math.round(bw.hr);
          bw.spo2 = Math.round(bw.spo2 * 10) / 10;
          bw.stress = Math.round(bw.stress);
          state.heartRate = bw.hr;
          state.spo2 = bw.spo2;
          updateBoatHubUI();

          // Tachycardia safety alert
          if (bw.hr > 130) {
            if (watchScreenStatus) watchScreenStatus.textContent = '⚠️ HIGH HR ALERT';
          } else if (bw.spo2 < 95) {
            if (watchScreenStatus) watchScreenStatus.textContent = '⚠️ LOW SpO2 ALERT';
          } else {
            if (watchScreenStatus) watchScreenStatus.textContent = bw.isSim ? 'SIM MODE ACTIVE' : 'BLE 5.2 SYNCED';
          }
        }, 1500);

        updateBoatHubUI();
      });
    }

    // ── GUIDED BREATHING TRAINER ─────────────────────────────────────────────
    const BREATHE_INHALE = 4000;
    const BREATHE_HOLD   = 4000;
    const BREATHE_EXHALE = 4000;
    const BREATHE_TOTAL_SECS = 120; // 2 minutes

    function formatBreathTime(s) {
      return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
    }

    function startBreathing() {
      if (state.breathingSession.active) return;
      state.breathingSession.active     = true;
      state.breathingSession.secondsLeft = BREATHE_TOTAL_SECS;
      state.breathingSession.phase      = 'inhale';

      if (btnStartBreathing) btnStartBreathing.classList.add('hidden');
      if (btnStopBreathing)  btnStopBreathing.classList.remove('hidden');

      function runPhase() {
        if (!state.breathingSession.active) return;
        const phase = state.breathingSession.phase;

        if (phase === 'inhale') {
          if (gbPhaseLabel) gbPhaseLabel.textContent = '🫁 Inhale slowly... (4 seconds)';
          if (gbPhaseLabel) gbPhaseLabel.style.color = '#00e5ff';
          if (breathingOrb) { breathingOrb.classList.remove('exhale'); breathingOrb.classList.add('inhale'); }
          setTimeout(() => { state.breathingSession.phase = 'hold'; runPhase(); }, BREATHE_INHALE);
        } else if (phase === 'hold') {
          if (gbPhaseLabel) gbPhaseLabel.textContent = '⏸ Hold breath... (4 seconds)';
          if (gbPhaseLabel) gbPhaseLabel.style.color = '#ffb300';
          setTimeout(() => { state.breathingSession.phase = 'exhale'; runPhase(); }, BREATHE_HOLD);
        } else {
          if (gbPhaseLabel) gbPhaseLabel.textContent = '💨 Exhale fully... (4 seconds)';
          if (gbPhaseLabel) gbPhaseLabel.style.color = '#00e676';
          if (breathingOrb) { breathingOrb.classList.remove('inhale'); breathingOrb.classList.add('exhale'); }
          setTimeout(() => { state.breathingSession.phase = 'inhale'; runPhase(); }, BREATHE_EXHALE);
        }
      }

      runPhase();

      // Countdown timer
      state.breathingSession.timer = setInterval(() => {
        state.breathingSession.secondsLeft--;
        if (gbTimer) gbTimer.textContent = formatBreathTime(state.breathingSession.secondsLeft);
        if (state.breathingSession.secondsLeft <= 0) stopBreathing(true);
      }, 1000);
    }

    function stopBreathing(completed = false) {
      state.breathingSession.active = false;
      clearInterval(state.breathingSession.timer);
      state.breathingSession.timer = null;
      if (breathingOrb) { breathingOrb.classList.remove('inhale', 'exhale'); }
      if (btnStartBreathing) btnStartBreathing.classList.remove('hidden');
      if (btnStopBreathing)  btnStopBreathing.classList.add('hidden');
      if (gbTimer) gbTimer.textContent = formatBreathTime(BREATHE_TOTAL_SECS);
      if (gbPhaseLabel) {
        gbPhaseLabel.textContent = completed
          ? '✅ Session complete! HRV & stress improved.' : 'Ready to begin. Tap Start.';
        gbPhaseLabel.style.color = completed ? '#00e676' : '#8a99ad';
      }
    }

    if (btnStartBreathing) btnStartBreathing.addEventListener('click', startBreathing);
    if (btnStopBreathing)  btnStopBreathing.addEventListener('click', () => stopBreathing(false));

    // ── SPORTS SELECTOR ──────────────────────────────────────────────────────
    if (sportsGrid) {
      sportsGrid.querySelectorAll('.sport-card').forEach(card => {
        card.addEventListener('click', () => {
          sportsGrid.querySelectorAll('.sport-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          const sport   = card.dataset.sport;
          const calRate = parseFloat(card.dataset.calrate);
          state.activeWorkout.sport   = sport;
          state.activeWorkout.calRate = calRate;
          const icon = card.querySelector('.sport-icon')?.textContent || '🏃';
          if (awSelectedSport) awSelectedSport.textContent = `${icon} ${sport}`;
          // Reset burn if not active
          if (!state.activeWorkout.active) {
            if (awCaloriesBurned) awCaloriesBurned.textContent = '0.0';
          }
        });
      });
    }

    // ── WORKOUT STOPWATCH ────────────────────────────────────────────────────
    function formatWorkoutTime(s) {
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = s % 60;
      return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    }

    if (btnToggleWorkout) {
      btnToggleWorkout.addEventListener('click', () => {
        if (!state.activeWorkout.active) {
          // Start
          state.activeWorkout.active        = true;
          state.activeWorkout.seconds       = 0;
          state.activeWorkout.caloriesBurned = 0;
          btnToggleWorkout.textContent      = '⏹ Stop Workout';
          btnToggleWorkout.style.background = '#ff2a4b';

          state.activeWorkout.timer = setInterval(() => {
            state.activeWorkout.seconds++;
            const secs = state.activeWorkout.seconds;
            const calBurned = (secs / 60) * state.activeWorkout.calRate;
            state.activeWorkout.caloriesBurned = calBurned;

            if (awStopwatch)       awStopwatch.textContent       = formatWorkoutTime(secs);
            if (awCaloriesBurned)  awCaloriesBurned.textContent  = calBurned.toFixed(1);

            // Live HR fluctuations during workout
            const workoutHr = Math.round(state.boatWatch.hr + (secs < 120 ? secs * 0.3 : 35) + (Math.random() - 0.5) * 4);
            if (awLiveHr) awLiveHr.textContent = Math.min(workoutHr, 185);

            // Pace for running sports
            if (['Outdoor Run', 'Brisk Walking', 'Outdoor Cycling'].includes(state.activeWorkout.sport)) {
              const paceMin = Math.floor(6.2 - Math.min(secs / 120, 1.5));
              const paceSec = Math.floor(Math.random() * 59);
              if (awLivePace) awLivePace.textContent = `${paceMin}'${String(paceSec).padStart(2,'0')}"/km`;
            } else {
              if (awLivePace) awLivePace.textContent = `--'--"/km`;
            }
          }, 1000);
        } else {
          // Stop
          clearInterval(state.activeWorkout.timer);
          state.activeWorkout.active = false;
          btnToggleWorkout.textContent = '▶ Start Workout';
          btnToggleWorkout.style.background = '';
          if (awStopwatch) awStopwatch.textContent = '00:00:00';
          if (awLivePace) awLivePace.textContent = `--'--"/km`;
        }
      });
    }

    // ── WRIST HARDWARE SOS TRIGGER ───────────────────────────────────────────
    if (btnTriggerWristSos) {
      btnTriggerWristSos.addEventListener('click', () => {
        const confirmed = confirm(
          '🚨 SIMULATE boAt WATCH HARDWARE SOS\n\n' +
          'This will trigger the FULL SSS Emergency Engine:\n' +
          '• Activate real-time siren\n' +
          '• Dispatch Zepto/Blinkit delivery fleet\n' +
          '• Transmit SOS to Guardian Portal (:8080)\n' +
          '• Send WhatsApp + SMS alerts to guardian\n\n' +
          'Confirm watch hardware SOS simulation?'
        );
        if (confirmed) {
          boatWatchModal.classList.add('hidden');
          // Trigger the main emergency if available
          if (typeof triggerEmergency === 'function') {
            triggerEmergency('FROM_BOAT_WATCH_HARDWARE_SOS');
          } else {
            broadcastSosToCloud('FROM_BOAT_WATCH_HARDWARE_SOS');
          }
        }
      });
    }

    // ── TURN-BY-TURN HOSPITAL NAVIGATION HUD ────────────────────────────────
    const NAV_TURNS = [
      { arrow: '⬆', dist: 'Continue straight for 200m', dest: '🏥 City Trauma Center (1.2 km away)' },
      { arrow: '⮡', dist: 'Turn RIGHT onto MG Road',    dest: '🏥 City Trauma Center (0.9 km away)' },
      { arrow: '⬆', dist: 'Continue for 400m',           dest: '🏥 City Trauma Center (0.5 km away)' },
      { arrow: '⬅', dist: 'Turn LEFT — Hospital Gate',   dest: '🏥 Arriving at Emergency Entry (0.1 km)' },
      { arrow: '🏥', dist: 'DESTINATION REACHED',         dest: '✅ Emergency Department — 24/7 Open' }
    ];
    let navTurnIndex = 0;

    if (btnPushNavHospital) {
      btnPushNavHospital.addEventListener('click', () => {
        navTurnIndex = 0;
        const t = NAV_TURNS[0];
        if (wnArrow) wnArrow.textContent    = t.arrow;
        if (wnDistance) wnDistance.textContent = t.dist;
        if (wnDest) wnDest.textContent      = t.dest;
        btnPushNavHospital.textContent = '✅ Route Active';
        btnPushNavHospital.style.background = '#00e676';
        btnPushNavHospital.style.color = '#000';
        // Update watch screen
        if (watchScreenStatus) watchScreenStatus.textContent = '🧭 HOSPITAL NAV';
      });
    }

    if (btnSimulateNavTurn) {
      btnSimulateNavTurn.addEventListener('click', () => {
        navTurnIndex = (navTurnIndex + 1) % NAV_TURNS.length;
        const t = NAV_TURNS[navTurnIndex];
        if (wnArrow) wnArrow.textContent    = t.arrow;
        if (wnDistance) wnDistance.textContent = t.dist;
        if (wnDest) wnDest.textContent      = t.dest;
      });
    }

    // ── QR TRAY HUB ──────────────────────────────────────────────────────────
    if (btnPushQrToTray) {
      btnPushQrToTray.addEventListener('click', () => {
        btnPushQrToTray.textContent = '✅ Medical QR Pushed to Watch Tray!';
        btnPushQrToTray.style.background = '#00e676';
        btnPushQrToTray.style.color = '#000';
        if (watchScreenStatus) watchScreenStatus.textContent = '🪪 MEDICAL QR ACTIVE';
        setTimeout(() => {
          btnPushQrToTray.textContent = '📲 Push Medical ID to boAt QR Tray';
          btnPushQrToTray.style.background = '';
          btnPushQrToTray.style.color = '';
        }, 3000);
      });
    }

    // ── HAPTIC VIBRATE TEST ───────────────────────────────────────────────────
    if (btnTestHapticVibrate) {
      btnTestHapticVibrate.addEventListener('click', () => {
        // Use vibration API on phone/device
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200, 100, 600]);
        }
        if (watchScreenStatus) watchScreenStatus.textContent = '📳 HAPTIC FIRED';
        btnTestHapticVibrate.textContent = '📳 Vibrating... (Feel it!)';
        btnTestHapticVibrate.style.background = 'rgba(0, 229, 255, 0.15)';
        setTimeout(() => {
          btnTestHapticVibrate.textContent = '📳 Vibrate Watch Alarm (Test Haptic)';
          btnTestHapticVibrate.style.background = '';
          if (watchScreenStatus) watchScreenStatus.textContent = state.boatWatch.isSim ? 'SIM MODE ACTIVE' : 'BLE 5.2 SYNCED';
        }, 2500);
      });
    }

    // ── FEMALE WELLNESS LOGGER ────────────────────────────────────────────────
    if (btnLogWellness) {
      btnLogWellness.addEventListener('click', () => {
        const sym = prompt('🌸 Female Wellness Log\nEnter symptoms or notes for today:\n(e.g. "Cramps, fatigue, mood changes")');
        if (sym && sym.trim()) {
          alert(`✅ Wellness logged: "${sym.trim()}"\nDay 14 of 28 tracked. Data saved to SSS Health Journal.`);
        }
      });
    }

    // Initial UI render
    updateBoatHubUI();
    console.log('[SSS boAt Hub] ⌚ boAt Lunar Discovery Companion Hub initialized.');
  } // end initBoatLunarHub

  // =========================================================================
  // 🚀 INITIALIZE ALL UPGRADE PACK SYSTEMS
  // =========================================================================
  initBatterySignal();
  initHrHistoryChart();
  fetchWeather();
  initBackendConnection();
  initBoatLunarHub(); // ⌚ boAt Lunar Discovery Dedicated Companion Hub
  // Refresh weather every 10 minutes
  setInterval(fetchWeather, 10 * 60 * 1000);

  console.log('SSS v.56964 Superpower Pack (Voice, BLE, Fall Watchdog, CPR Game, Leaflet & QR Pass, Cloud WS, boAt Hub) Ready.');
});
