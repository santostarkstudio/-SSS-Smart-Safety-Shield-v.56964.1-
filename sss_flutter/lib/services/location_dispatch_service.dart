import 'package:geolocator/geolocator.dart';
import 'package:telephony/telephony.dart';

/// Pre-warmed GPS cache & Fail-safe Cellular SMS Dispatcher
class LocationDispatchService {
  static final LocationDispatchService instance = LocationDispatchService._();
  LocationDispatchService._();

  final Telephony _telephony = Telephony.instance;
  Position? _cachedPosition;

  Position? get lastKnownPosition => _cachedPosition;

  Future<void> preWarmGps() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) return;

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      // Pre-fetch into memory
      _cachedPosition = await Geolocator.getLastKnownPosition();
      Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      ).then((pos) => _cachedPosition = pos);
    } catch (_) {}
  }

  /// Sends raw cellular SMS with GPS link directly via SIM card (works with 0 internet)
  Future<void> dispatchDirectSms({
    required List<String> phoneNumbers,
    required String patientName,
  }) async {
    final pos = _cachedPosition;
    final lat = pos?.latitude ?? 0.0;
    final lng = pos?.longitude ?? 0.0;

    final mapsUrl = 'https://maps.google.com/?q=$lat,$lng';
    final message = '🚨 EMERGENCY SSS SOS: $patientName triggered Cardiac/Danger Alert! '
        'Immediate help needed at location: $mapsUrl';

    for (var number in phoneNumbers) {
      try {
        await _telephony.sendSms(
          to: number,
          message: message,
        );
      } catch (e) {
        // Log SMS retry
      }
    }
  }
}
