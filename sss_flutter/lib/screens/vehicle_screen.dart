import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class VehicleScreen extends StatelessWidget {
  const VehicleScreen({super.key});

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
              Text('🚲 In-Transit & Hardware', style: GoogleFonts.orbitron(fontSize: 14, fontWeight: FontWeight.bold)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: const Color(0xFF00E5FF).withOpacity(0.15), borderRadius: BorderRadius.circular(8)),
                child: const Text('BLE 5.0 READY', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF00E5FF))),
              )
            ],
          ),
          const SizedBox(height: 16),

          // Handlebar Clicker Card
          _buildHardwareCard(
            title: 'SSS Smart Bike/Moto Clicker',
            desc: 'Waterproof BLE button strapped to handlebar. Triggers SOS without looking at screen.',
            status: 'Paired (CR2032 Battery 98%)',
            statusColor: const Color(0xFF00E676),
            actionText: 'Test BLE Click',
            onAction: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('⚡ Handlebar BLE 5.0 Click Interrupt Received (<18ms)!')),
              );
            },
          ),

          const SizedBox(height: 12),

          // Car Crash Watchdog
          _buildHardwareCard(
            title: 'Vehicle Motion Guard',
            desc: 'Detects high-speed impacts (>40 km/h) and routes emergency audio to car stereo.',
            status: 'Cruising (48 km/h)',
            statusColor: const Color(0xFF00E5FF),
          ),

          const SizedBox(height: 12),

          // Smart Home Unlock
          _buildHardwareCard(
            title: 'Smart Home Front Door Auto-Unlock',
            desc: 'Auto-unlocks front door (Nuki / Yale / Tuya) and flashes porch lights when SOS triggers at home.',
            status: 'Armed & Linked',
            statusColor: const Color(0xFF00E5FF),
          ),
        ],
      ),
    );
  }

  Widget _buildHardwareCard({
    required String title,
    required String desc,
    required String status,
    required Color statusColor,
    String? actionText,
    VoidCallback? onAction,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF10141D),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white)),
          const SizedBox(height: 4),
          Text(desc, style: const TextStyle(fontSize: 11, color: Color(0xFF8A99AD))),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Status: $status', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: statusColor)),
              if (actionText != null)
                ElevatedButton(
                  onPressed: onAction,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFF2A4B),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  ),
                  child: Text(actionText, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                )
            ],
          )
        ],
      ),
    );
  }
}
