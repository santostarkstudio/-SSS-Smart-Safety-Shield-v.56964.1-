import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import 'screens/sos_screen.dart';
import 'screens/vitals_screen.dart';
import 'screens/fleet_radar_screen.dart';
import 'screens/vehicle_screen.dart';
import 'screens/failsafe_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Color(0xFF07090E),
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  runApp(const SSSApp());
}

class SSSApp extends StatelessWidget {
  const SSSApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SSS v.56964 — Smart Safety Shield',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF07090E),
        primaryColor: const Color(0xFFFF2A4B),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFFFF2A4B),
          secondary: Color(0xFF00E5FF),
          surface: Color(0xFF10141D),
        ),
        textTheme: GoogleFonts.plusJakartaSansTextTheme(
          ThemeData.dark().textTheme,
        ),
      ),
      home: const MainNavigationShell(),
    );
  }
}

class MainNavigationShell extends StatefulWidget {
  const MainNavigationShell({super.key});

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    GuardianSosScreen(),
    VitalsScreen(),
    FleetRadarScreen(),
    VehicleScreen(),
    FailsafeScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Top Status Bar & Brand Header
            _buildAppHeader(),
            // Active Tab Screen
            Expanded(child: _screens[_currentIndex]),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF0A0E16).withOpacity(0.95),
          border: Border(top: BorderSide(color: Colors.white.withOpacity(0.08))),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          backgroundColor: Colors.transparent,
          elevation: 0,
          type: BottomNavigationBarType.fixed,
          selectedItemColor: const Color(0xFFFF2A4B),
          unselectedItemColor: const Color(0xFF8A99AD),
          selectedLabelStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
          unselectedLabelStyle: const TextStyle(fontSize: 9, fontWeight: FontWeight.w600),
          items: const [
            BottomNavigationBarItem(icon: Text('🚨', style: TextStyle(fontSize: 20)), label: 'SOS Shield'),
            BottomNavigationBarItem(icon: Text('🫀', style: TextStyle(fontSize: 20)), label: 'Vitals'),
            BottomNavigationBarItem(icon: Text('🛵', style: TextStyle(fontSize: 20)), label: 'Fleet Radar'),
            BottomNavigationBarItem(icon: Text('🚲', style: TextStyle(fontSize: 20)), label: 'Vehicle'),
            BottomNavigationBarItem(icon: Text('🛡️', style: TextStyle(fontSize: 20)), label: 'Fail-Safes'),
          ],
        ),
      ),
    );
  }

  Widget _buildAppHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: Colors.white.withOpacity(0.08))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Color(0xFFFF2A4B), Color(0xFF8B0018)]),
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [
                    BoxShadow(color: const Color(0xFFFF2A4B).withOpacity(0.5), blurRadius: 10)
                  ],
                ),
                child: Center(
                  child: Text(
                    'SSS',
                    style: GoogleFonts.orbitron(fontWeight: FontWeight.w900, color: Colors.white, fontSize: 13),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'SMART SAFETY SHIELD',
                    style: GoogleFonts.orbitron(fontSize: 12, fontWeight: FontWeight.w800, color: Colors.white),
                  ),
                  const Text(
                    'SANTO STARK STUDIO • v.56964',
                    style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: Color(0xFF00E5FF), letterSpacing: 0.5),
                  ),
                ],
              ),
            ],
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              border: Border.all(color: Colors.white.withOpacity(0.12)),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Row(
              children: [
                Text('●', style: TextStyle(color: Color(0xFF00E676), fontSize: 10)),
                SizedBox(width: 4),
                Text('ARMED', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white)),
              ],
            ),
          )
        ],
      ),
    );
  }
}
