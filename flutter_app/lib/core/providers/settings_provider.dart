import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

// App settings provider
final appSettingsProvider =
    StateNotifierProvider<AppSettingsNotifier, AppSettings>((ref) {
  return AppSettingsNotifier();
});

class AppSettingsNotifier extends StateNotifier<AppSettings> {
  static const String _prefixKey = 'app_settings_';

  AppSettingsNotifier() : super(AppSettings.defaultSettings()) {
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    try {
      final prefs = await SharedPreferences.getInstance();

      state = AppSettings(
        pushNotifications:
            prefs.getBool('${_prefixKey}push_notifications') ?? true,
        emailNotifications:
            prefs.getBool('${_prefixKey}email_notifications') ?? true,
        autoPlayVideos: prefs.getBool('${_prefixKey}auto_play_videos') ?? true,
        dataUsageMode:
            prefs.getString('${_prefixKey}data_usage_mode') ?? 'automatic',
        videoQuality: prefs.getString('${_prefixKey}video_quality') ?? 'auto',
        downloadQuality:
            prefs.getString('${_prefixKey}download_quality') ?? 'high',
        soundEffects: prefs.getBool('${_prefixKey}sound_effects') ?? true,
        vibration: prefs.getBool('${_prefixKey}vibration') ?? true,
      );
    } catch (e) {
      // Use default settings
    }
  }

  Future<void> updateSetting(String key, dynamic value) async {
    try {
      final prefs = await SharedPreferences.getInstance();

      if (value is bool) {
        await prefs.setBool('$_prefixKey$key', value);
      } else if (value is String) {
        await prefs.setString('$_prefixKey$key', value);
      }

      state = state.copyWith({key: value});
    } catch (e) {
      // Handle error
    }
  }

  Future<void> setPushNotifications(bool enabled) async {
    await updateSetting('push_notifications', enabled);
  }

  Future<void> setEmailNotifications(bool enabled) async {
    await updateSetting('email_notifications', enabled);
  }

  Future<void> setAutoPlayVideos(bool enabled) async {
    await updateSetting('auto_play_videos', enabled);
  }

  Future<void> setDataUsageMode(String mode) async {
    await updateSetting('data_usage_mode', mode);
  }

  Future<void> setVideoQuality(String quality) async {
    await updateSetting('video_quality', quality);
  }

  Future<void> setDownloadQuality(String quality) async {
    await updateSetting('download_quality', quality);
  }

  Future<void> setSoundEffects(bool enabled) async {
    await updateSetting('sound_effects', enabled);
  }

  Future<void> setVibration(bool enabled) async {
    await updateSetting('vibration', enabled);
  }
}

class AppSettings {
  final bool pushNotifications;
  final bool emailNotifications;
  final bool autoPlayVideos;
  final String dataUsageMode; // automatic, wifi_only, unrestricted
  final String videoQuality; // auto, high, medium, low
  final String downloadQuality; // high, medium, low
  final bool soundEffects;
  final bool vibration;

  AppSettings({
    required this.pushNotifications,
    required this.emailNotifications,
    required this.autoPlayVideos,
    required this.dataUsageMode,
    required this.videoQuality,
    required this.downloadQuality,
    required this.soundEffects,
    required this.vibration,
  });

  factory AppSettings.defaultSettings() {
    return AppSettings(
      pushNotifications: true,
      emailNotifications: true,
      autoPlayVideos: true,
      dataUsageMode: 'automatic',
      videoQuality: 'auto',
      downloadQuality: 'high',
      soundEffects: true,
      vibration: true,
    );
  }

  AppSettings copyWith(Map<String, dynamic> updates) {
    return AppSettings(
      pushNotifications: updates['push_notifications'] ?? pushNotifications,
      emailNotifications: updates['email_notifications'] ?? emailNotifications,
      autoPlayVideos: updates['auto_play_videos'] ?? autoPlayVideos,
      dataUsageMode: updates['data_usage_mode'] ?? dataUsageMode,
      videoQuality: updates['video_quality'] ?? videoQuality,
      downloadQuality: updates['download_quality'] ?? downloadQuality,
      soundEffects: updates['sound_effects'] ?? soundEffects,
      vibration: updates['vibration'] ?? vibration,
    );
  }
}
