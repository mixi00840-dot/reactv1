import 'package:flutter/material.dart';
import '../../../core/services/api_service.dart';
import '../models/sound_model.dart';

/// Sound Provider - Manages sound/music selection for camera
class SoundProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  // Sound state
  List<SoundModel> _sounds = [];
  List<SoundModel> _trendingSounds = [];
  List<SoundModel> _featuredSounds = [];
  List<SoundModel> _searchResults = [];
  SoundSelection _selectedSound = SoundSelection();
  bool _isLoadingSounds = false;
  bool _isSearching = false;
  String _searchQuery = '';
  
  // Voiceover state
  bool _isRecordingVoiceover = false;
  String? _voiceoverPath;
  
  // Getters
  List<SoundModel> get sounds => _sounds;
  List<SoundModel> get trendingSounds => _trendingSounds;
  List<SoundModel> get featuredSounds => _featuredSounds;
  List<SoundModel> get searchResults => _searchResults;
  SoundSelection get selectedSound => _selectedSound;
  bool get isLoadingSounds => _isLoadingSounds;
  bool get isSearching => _isSearching;
  String get searchQuery => _searchQuery;
  bool get isRecordingVoiceover => _isRecordingVoiceover;
  String? get voiceoverPath => _voiceoverPath;
  
  /// Load sounds from backend
  Future<void> loadSounds({int limit = 50}) async {
    _isLoadingSounds = true;
    notifyListeners();
    
    try {
      final soundsData = await _apiService.getSounds(limit: limit);
      
      _sounds = soundsData
          .map((json) => SoundModel.fromJson(json))
          .toList();
      
      _isLoadingSounds = false;
      notifyListeners();
    } catch (e) {
      _isLoadingSounds = false;
      notifyListeners();
      debugPrint('Error loading sounds: $e');
    }
  }
  
  /// Load trending sounds
  Future<void> loadTrendingSounds({int limit = 20}) async {
    try {
      final soundsData = await _apiService.getTrendingSounds(limit: limit);
      
      _trendingSounds = soundsData
          .map((json) => SoundModel.fromJson(json))
          .toList();
      
      notifyListeners();
    } catch (e) {
      debugPrint('Error loading trending sounds: $e');
    }
  }
  
  /// Load featured sounds
  Future<void> loadFeaturedSounds({int limit = 20}) async {
    try {
      final soundsData = await _apiService.getFeaturedSounds(limit: limit);
      
      _featuredSounds = soundsData
          .map((json) => SoundModel.fromJson(json))
          .toList();
      
      notifyListeners();
    } catch (e) {
      debugPrint('Error loading featured sounds: $e');
    }
  }
  
  /// Search sounds
  Future<void> searchSounds(String query, {int limit = 50}) async {
    if (query.isEmpty) {
      _searchResults = [];
      _searchQuery = '';
      notifyListeners();
      return;
    }
    
    _isSearching = true;
    _searchQuery = query;
    notifyListeners();
    
    try {
      final soundsData = await _apiService.searchSounds(query, limit: limit);
      
      _searchResults = soundsData
          .map((json) => SoundModel.fromJson(json))
          .toList();
      
      _isSearching = false;
      notifyListeners();
    } catch (e) {
      _isSearching = false;
      notifyListeners();
      debugPrint('Error searching sounds: $e');
    }
  }
  
  /// Select sound
  void selectSound(SoundModel? sound, {double startTime = 0.0}) {
    _selectedSound = SoundSelection(
      sound: sound,
      startTime: startTime,
      originalVolume: _selectedSound.originalVolume,
      musicVolume: _selectedSound.musicVolume,
      useOriginalSound: _selectedSound.useOriginalSound,
      voiceoverPath: _selectedSound.voiceoverPath,
    );
    notifyListeners();
  }
  
  /// Set sound start time
  void setSoundStartTime(double startTime) {
    _selectedSound = _selectedSound.copyWith(startTime: startTime);
    notifyListeners();
  }
  
  /// Set original sound volume
  void setOriginalVolume(double volume) {
    _selectedSound = _selectedSound.copyWith(
      originalVolume: volume.clamp(0.0, 1.0),
    );
    notifyListeners();
  }
  
  /// Set music volume
  void setMusicVolume(double volume) {
    _selectedSound = _selectedSound.copyWith(
      musicVolume: volume.clamp(0.0, 1.0),
    );
    notifyListeners();
  }
  
  /// Toggle use original sound
  void toggleUseOriginalSound() {
    _selectedSound = _selectedSound.copyWith(
      useOriginalSound: !_selectedSound.useOriginalSound,
    );
    notifyListeners();
  }
  
  /// Start voiceover recording
  void startVoiceoverRecording() {
    _isRecordingVoiceover = true;
    notifyListeners();
  }
  
  /// Stop voiceover recording
  void stopVoiceoverRecording(String? path) {
    _isRecordingVoiceover = false;
    _voiceoverPath = path;
    _selectedSound = _selectedSound.copyWith(voiceoverPath: path);
    notifyListeners();
  }
  
  /// Clear voiceover
  void clearVoiceover() {
    _voiceoverPath = null;
    _selectedSound = _selectedSound.copyWith(voiceoverPath: null);
    notifyListeners();
  }
  
  /// Clear sound selection
  void clearSound() {
    _selectedSound = SoundSelection();
    notifyListeners();
  }
  
  /// Record sound usage
  Future<bool> recordSoundUsage(String soundId, {String? contentId}) async {
    try {
      return await _apiService.recordSoundUsage(soundId, contentId: contentId);
    } catch (e) {
      debugPrint('Error recording sound usage: $e');
      return false;
    }
  }
}

