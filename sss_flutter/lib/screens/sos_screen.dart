import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/audio_siren_service.dart';
import '../services/voice_cpr_coach.dart';
import '../services/location_dispatch_service.dart';

class GuardianSosScreen extends StatefulWidget {
  const GuardianSosScreen({super.key});

  @override
  State<GuardianSosScreen> createState() => _GuardianSosScreenState();
}

class _GuardianSosScreenState extends State<GuardianSosScreen> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  bool _isEmergencyActive = false;
  int _cprBeat = 0;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
    LocationDispatchService.instance.preWarmGps();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  void _triggerEmergency() {
    setState(() => _isEmergencyActive = true);
    AudioSirenService.instance.startSiren();
    VoiceCprCoachService.instance.startCoach(
      onBeat: (beat) => setState(() => _cprBeat = beat),
    );
    LocationDispatchService.instance.dispatchDirectSms(
      phoneNumbers: ['+15550199'],
      patientName: 'Santos Stark',
    );
  }

  void _cancelEmergency() {
    setState(() {
      _isEmergencyActive = false;
      _cprBeat = 0;
    });
    AudioSirenService.instance.stopSiren();
    VoiceCprCoachService.instance.stopCoach();
  }

  @override
  Widget build(BuildContext context) {
    if (_isEmergencyActive) {
      return _buildBystanderRescueOverlay();
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          // Vitals Quickbar
          Row(
            children: [
              _buildQuickPill('🫀', '72 BPM', 'Resting Normal'),
              const SizedBox(width: 8),
              _buildQuickPill('🫁', '98 %', 'Optimal SpO2'),
              const SizedBox(width: 8),
              _buildQuickPill('📍', 'LIVE GPS', 'Locked & Ready'),
            ],
          ),
          const SizedBox(height: 24),

          // Big Red SOS Button
          Center(
            child: SizedBox(
              width: 220,
              height: 220,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  AnimatedBuilder(
                    animation: _pulseController,
                    builder: (context, child) {
                      return Container(
                        width: 190 + (_pulseController.value * 30),
                        height: 190 + (_pulseController.value * 30),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: const Color(0xFFFF2A4B).withOpacity(1.0 - _pulseController.value),
                            width: 2,
                          ),
                        ),
                      );
                    },
                  ),
                  GestureDetector(
                    onTap: _triggerEmergency,
                    child: Container(
                      width: 180,
                      height: 180,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: const RadialGradient(
                          center: Alignment(-0.3, -0.3),
                          colors: [Color(0xFFFF4B68), Color(0xFFB7001F), Color(0xFF6A0011)],
                        ),
                        border: Border.all(color: Colors.white.withOpacity(0.35), width: 3),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFFFF2A4B).withOpacity(0.6),
                            blurRadius: 30,
                            spreadRadius: 4,
                          )
                        ],
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text('🛡️', style: TextStyle(fontSize: 28)),
                          const SizedBox(height: 4),
                          Text(
                            'SSS SOS',
                            style: GoogleFonts.orbitron(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white),
                          ),
                          const Text(
                            '1-TAP EMERGENCY',
                            style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: Colors.white70, letterSpacing: 0.8),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 14),
          const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('●', style: TextStyle(color: Color(0xFFFF2A4B), fontSize: 8)),
              SizedBox(width: 6),
              Text(
                'Blasts Acoustic Siren + Alerts Fleet & Family',
                style: TextStyle(fontSize: 11, color: Color(0xFF8A99AD), fontWeight: FontWeight.w600),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // Medical ID Card
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFF10141D),
              border: Border.all(color: Colors.white.withOpacity(0.08)),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('🩺 EMERGENCY MEDICAL ID', style: GoogleFonts.orbitron(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF00E5FF))),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFF00E5FF).withOpacity(0.12),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text('LOCK-SCREEN ACTIVE', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Color(0xFF00E5FF))),
                    )
                  ],
                ),
                const SizedBox(height: 10),
                const Text('Patient: Santos Stark (Age 58)', style: TextStyle(fontSize: 12, color: Colors.white70)),
                const Text('Condition: Coronary Artery Disease / High Risk', style: TextStyle(fontSize: 12, color: Colors.white70)),
                const Text('Blood Group: O+ Positive • Allergies: Penicillin', style: TextStyle(fontSize: 12, color: Colors.white70)),
                const Text('Emergency Meds: Aspirin 75mg in right pocket', style: TextStyle(fontSize: 12, color: Colors.white70)),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildQuickPill(String icon, String val, String lbl) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.03),
          border: Border.all(color: Colors.white.withOpacity(0.08)),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Text(icon, style: const TextStyle(fontSize: 18)),
            const SizedBox(width: 6),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(val, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white)),
                Text(lbl, style: const TextStyle(fontSize: 8, color: Color(0xFF8A99AD))),
              ],
            )
          ],
        ),
      ),
    );
  }

  Widget _buildBystanderRescueOverlay() {
    return Container(
      color: Colors.black,
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFFF2A4B),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [BoxShadow(color: const Color(0xFFFF2A4B).withOpacity(0.8), blurRadius: 15)],
                ),
                child: Text('🚨 CRITICAL MEDICAL EMERGENCY', style: GoogleFonts.orbitron(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.white)),
              ),
              const SizedBox(height: 10),
              Text(
                'OWNER IS HAVING A HEART ATTACK!',
                textAlign: TextAlign.center,
                style: GoogleFonts.orbitron(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.white),
              ),
              const SizedBox(height: 4),
              const Text('Ambulance & Family have been dispatched with GPS.', style: TextStyle(fontSize: 12, color: Colors.white70)),
            ],
          ),

          // 110 BPM Metronome Target
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFF150005),
              border: Border.all(color: const Color(0xFFFF2A4B), width: 2),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [BoxShadow(color: const Color(0xFFFF2A4B).withOpacity(0.4), blurRadius: 20)],
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('🫀 CPR CHEST COMPRESSION METRONOME', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFFFF99AA))),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(color: const Color(0xFFFF2A4B), borderRadius: BorderRadius.circular(8)),
                      child: const Text('110 BPM', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white)),
                    )
                  ],
                ),
                const SizedBox(height: 14),
                Container(
                  width: 140,
                  height: 140,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0xFFFF2A4B),
                    border: Border.all(color: Colors.white, width: 4),
                    boxShadow: [BoxShadow(color: const Color(0xFFFF2A4B).withOpacity(0.8), blurRadius: 25)],
                  ),
                  child: const Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('👐', style: TextStyle(fontSize: 32)),
                      Text('PRESS HERE', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Colors.white)),
                      Text('Push hard & fast!', style: TextStyle(fontSize: 9, color: Colors.white)),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Text('Beat #$_cprBeat • Voice Coach Active', style: const TextStyle(fontSize: 12, color: Colors.white70)),
              ],
            ),
          ),

          ElevatedButton(
            onPressed: _cancelEmergency,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white.withOpacity(0.2),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
            ),
            child: const Text('✕ CANCEL EMERGENCY / SILENCE SIREN', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          )
        ],
      ),
    );
  }
}
