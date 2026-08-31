import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class VitalsScreen extends StatefulWidget {
  const VitalsScreen({super.key});

  @override
  State<VitalsScreen> createState() => _VitalsScreenState();
}

class _VitalsScreenState extends State<VitalsScreen> with SingleTickerProviderStateMixin {
  late AnimationController _ecgController;

  @override
  void initState() {
    super.initState();
    _ecgController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
  }

  @override
  void dispose() {
    _ecgController.dispose();
    super.dispose();
  }

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
              Text('🫀 Live Cardiac Monitor', style: GoogleFonts.orbitron(fontSize: 14, fontWeight: FontWeight.bold)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: const Color(0xFFFF2A4B).withOpacity(0.15), borderRadius: BorderRadius.circular(8)),
                child: const Text('● REALTIME ECG', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFFFF2A4B))),
              )
            ],
          ),
          const SizedBox(height: 12),

          // ECG Graph Canvas
          Container(
            height: 110,
            width: double.infinity,
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFF02060B),
              border: Border.all(color: const Color(0xFF00E5FF).withOpacity(0.3)),
              borderRadius: BorderRadius.circular(16),
            ),
            child: AnimatedBuilder(
              animation: _ecgController,
              builder: (context, child) {
                return CustomPaint(
                  painter: EcgPainter(progress: _ecgController.value),
                );
              },
            ),
          ),

          const SizedBox(height: 16),

          // Vitals Grid
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 1.35,
            children: [
              _buildMetricCard('Heart Rate', '72 BPM', 'Optimal Rest Range', Colors.redAccent),
              _buildMetricCard('Blood Oxygen', '98 %', 'Optimal Lung Diffusion', Colors.cyanAccent),
              _buildMetricCard('Daily Steps', '5,420 / 6k', 'Cardiac Rehab Goal', Colors.greenAccent),
              _buildMetricCard('Smartwatch', 'SYNCED', 'GATT 0x180D Active', Colors.blueAccent),
            ],
          ),

          const SizedBox(height: 16),

          // Medication Reminder
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFFFB300).withOpacity(0.08),
              border: Border.all(color: const Color(0xFFFFB300).withOpacity(0.2)),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                const Text('💊', style: TextStyle(fontSize: 26)),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Next Dose: Aspirin 75mg', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFFFB300), fontSize: 12)),
                      Text('Due in 40 mins • Preventative', style: TextStyle(fontSize: 10, color: Colors.white60)),
                    ],
                  ),
                ),
                ElevatedButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('💊 Dose Logged: Aspirin 75mg marked as taken!')),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFFB300),
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  ),
                  child: const Text('Taken', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                )
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildMetricCard(String title, String val, String note, Color accent) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF10141D),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: const TextStyle(fontSize: 11, color: Color(0xFF8A99AD))),
          Text(val, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: accent)),
          Text(note, style: const TextStyle(fontSize: 8, color: Colors.white54)),
        ],
      ),
    );
  }
}

class EcgPainter extends CustomPainter {
  final double progress;
  EcgPainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF00E5FF)
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke;

    final path = Path();
    final h = size.height;
    final w = size.width;

    path.moveTo(0, h / 2);
    for (double x = 0; x < w * progress; x += 10) {
      double y = h / 2;
      int step = (x ~/ 10) % 8;
      if (step == 3) y -= 35;
      if (step == 4) y += 25;
      path.lineTo(x, y);
    }

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant EcgPainter oldDelegate) => true;
}
