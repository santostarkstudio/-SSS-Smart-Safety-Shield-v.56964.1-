import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class FailsafeScreen extends StatelessWidget {
  const FailsafeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('🛡️ 99.99% Fail-Safe Suite', style: GoogleFonts.orbitron(fontSize: 14, fontWeight: FontWeight.bold)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: const Color(0xFF00E5FF).withOpacity(0.15), borderRadius: BorderRadius.circular(8)),
                child: const Text('ZERO-FAIL ACTIVE', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF00E5FF))),
              )
            ],
          ),
          const SizedBox(height: 16),

          _buildFailsafeItem('🔕 Do Not Disturb (DND) Bypass', 'Forces STREAM_ALARM to Level 15 (Max Volume).'),
          _buildFailsafeItem('✈️ Airplane Mode Baseband Hook', 'Emergency dialer auto-acquires cellular towers.'),
          _buildFailsafeItem('📶 Zero-Network BLE Mesh Beacon', 'Broadcasts distress packets without Wi-Fi or 4G.'),
          _buildFailsafeItem('🗣️ Multilingual Voice Coach', 'Spoken CPR coaching in English, Hindi, Spanish, Telugu.'),

          const SizedBox(height: 20),

          // Safe Practice Drill Button
          ElevatedButton(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('🛡️ Safe Practice Drill Started! (10s Siren & CPR Test)')),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFFB300),
              foregroundColor: Colors.black,
              minimumSize: const Size(double.infinity, 48),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: const Text('🛡️ Run 10-Second Safe Practice Drill', style: TextStyle(fontWeight: FontWeight.w900)),
          ),
        ],
      ),
    );
  }

  Widget _buildFailsafeItem(String title, String desc) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF10141D),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.white)),
                const SizedBox(height: 2),
                Text(desc, style: const TextStyle(fontSize: 10, color: Color(0xFF8A99AD))),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: const Color(0xFF00E676).withOpacity(0.12),
              borderRadius: BorderRadius.circular(6),
            ),
            child: const Text('ACTIVE', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF00E676))),
          )
        ],
      ),
    );
  }
}
