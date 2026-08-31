import 'package:audioplayers/audioplayers.dart';
import 'package:volume_controller/volume_controller.dart';

/// SSS Audio Siren Engine: Overrides system volume to 100% and loops
/// the high-decibel acoustic siren tone on STREAM_ALARM.
class AudioSirenService {
  static final AudioSirenService instance = AudioSirenService._();
  AudioSirenService._();

  final AudioPlayer _player = AudioPlayer();
  bool _isPlaying = false;

  bool get isPlaying => _isPlaying;

  Future<void> startSiren() async {
    if (_isPlaying) return;
    _isPlaying = true;

    try {
      // 1. Force hardware volume to maximum (1.0 = 100%)
      VolumeController().setVolume(1.0);
      VolumeController().showSystemUI = false;

      // 2. Set high priority alarm audio context (ignoring DND / Silent switches)
      await _player.setAudioContext(
        AudioContext(
          android: const AudioContextAndroid(
            isSpeakerphoneOn: true,
            stayAwake: true,
            contentType: AndroidContentType.sonification,
            usageType: AndroidUsageType.alarm, // Routes to STREAM_ALARM
            audioFocus: AndroidAudioFocus.gainTransientExclusive,
          ),
          iOS: AudioContextIOS(
            category: AVAudioSessionCategory.playback,
            options: {
              AVAudioSessionOptions.duckOthers,
              AVAudioSessionOptions.defaultToSpeaker,
            },
          ),
        ),
      );

      await _player.setReleaseMode(ReleaseMode.loop);
      // Play local asset siren
      await _player.play(AssetSource('audio/sss_siren.mp3'));
    } catch (e) {
      // Fallback
    }
  }

  Future<void> stopSiren() async {
    _isPlaying = false;
    try {
      await _player.stop();
    } catch (_) {}
  }
}
