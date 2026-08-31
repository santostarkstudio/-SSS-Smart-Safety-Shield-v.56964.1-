import 'dart:async';
import 'dart:math';
import 'package:sensors_plus/sensors_plus.dart';

/// Accelerometer & Gyroscope Fall & Impact Detection
class FallDetectionService {
  static final FallDetectionService instance = FallDetectionService._();
  FallDetectionService._();

  StreamSubscription? _accelSub;
  bool _fallDetected = false;
  Timer? _immobilityTimer;

  void startMonitoring({required Function onFallTrigger}) {
    // High-G threshold (~25 m/s^2 indicates freefall followed by hard ground impact)
    _accelSub = userAccelerometerEventStream().listen((UserAccelerometerEvent event) {
      double gForce = sqrt(event.x * event.x + event.y * event.y + event.z * event.z);

      if (gForce > 24.0 && !_fallDetected) {
        _fallDetected = true;

        // Start 10-second immobility check
        _immobilityTimer?.cancel();
        _immobilityTimer = Timer(const Duration(seconds: 10), () {
          onFallTrigger();
          _fallDetected = false;
        });
      }
    });
  }

  void cancelFall() {
    _fallDetected = false;
    _immobilityTimer?.cancel();
  }

  void stopMonitoring() {
    _accelSub?.cancel();
    _immobilityTimer?.cancel();
  }
}
