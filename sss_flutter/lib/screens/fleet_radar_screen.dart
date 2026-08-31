import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class FleetRadarScreen extends StatelessWidget {
  const FleetRadarScreen({super.key});

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
              Text('🛵 SSS Street Fleet Radar', style: GoogleFonts.orbitron(fontSize: 14, fontWeight: FontWeight.bold)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: const Color(0xFF00E676).withOpacity(0.15), borderRadius: BorderRadius.circular(8)),
                child: const Text('4 RIDERS NEARBY', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF00E676))),
              )
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            'Mobilizes instant delivery riders (Zepto, Swiggy, Blinkit, Uber) within 400m to deliver CPR in under 3 minutes.',
            style: TextStyle(fontSize: 11, color: Color(0xFF8A99AD)),
          ),
          const SizedBox(height: 16),

          // Radar Representation
          Container(
            height: 200,
            decoration: BoxDecoration(
              color: const Color(0xFF02070D),
              border: Border.all(color: const Color(0xFF00E676).withOpacity(0.3)),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('📡', style: TextStyle(fontSize: 36)),
                  SizedBox(height: 8),
                  Text('Active Geofence: 400m Radius', style: TextStyle(color: Color(0xFF00E676), fontWeight: FontWeight.bold, fontSize: 12)),
                  Text('4 Certified First-Aid Responders Moving', style: TextStyle(color: Colors.white54, fontSize: 10)),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          // Riders List
          _buildRiderItem('Zepto Rider (Karan M.)', '180m away • Equipped with First-Aid', 'ETA: 1m 20s'),
          _buildRiderItem('Blinkit Rider (Rahul S.)', '290m away • Moving on Bike', 'ETA: 2m 10s'),
          _buildRiderItem('Swiggy Partner (Amit D.)', '340m away • Active Standby', 'ETA: 2m 45s'),
          _buildRiderItem('Uber Moto (Vikram T.)', '410m away • Navigation Linked', 'ETA: 3m 15s'),
        ],
      ),
    );
  }

  Widget _buildRiderItem(String name, String sub, String eta) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF10141D),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.white)),
              Text(sub, style: const TextStyle(fontSize: 10, color: Color(0xFF8A99AD))),
            ],
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF00E676).withOpacity(0.12),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(eta, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF00E676))),
          )
        ],
      ),
    );
  }
}
