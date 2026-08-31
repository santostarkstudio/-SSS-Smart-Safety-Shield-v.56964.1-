import 'dart:async';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';

/// Bluetooth Low Energy 5.0 Service for Vehicle Handlebar & Steering Wheel Clickers
class BleVehicleService {
  static final BleVehicleService instance = BleVehicleService._();
  BleVehicleService._();

  StreamSubscription? _scanSub;
  BluetoothDevice? _connectedButton;
  bool _isPaired = false;

  bool get isPaired => _isPaired;

  void startListeningForHandlebarButton({required Function onEmergencyClick}) {
    // Listen for SSS Hardware Clicker Advertisement UUID
    _scanSub = FlutterBluePlus.scanResults.listen((results) async {
      for (ScanResult r in results) {
        if (r.device.platformName.contains('SSS-CLICKER') || r.device.platformName.contains('FLIC')) {
          await FlutterBluePlus.stopScan();
          _connectedButton = r.device;
          await _connectedButton!.connect(autoConnect: true);
          _isPaired = true;

          // Discover GATT Services
          List<BluetoothService> services = await _connectedButton!.discoverServices();
          for (var service in services) {
            for (var characteristic in service.characteristics) {
              if (characteristic.properties.notify) {
                await characteristic.setNotifyValue(true);
                characteristic.lastValueStream.listen((value) {
                  if (value.isNotEmpty && value[0] == 0x01) {
                    onEmergencyClick();
                  }
                });
              }
            }
          }
        }
      }
    });

    FlutterBluePlus.startScan(timeout: const Duration(seconds: 15));
  }

  void disconnect() {
    _scanSub?.cancel();
    _connectedButton?.disconnect();
    _isPaired = false;
  }
}
