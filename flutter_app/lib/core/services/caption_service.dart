import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Caption model with timing information
class Caption {
  final int id;
  final String text;
  final double startTime; // In seconds
  final double endTime; // In seconds
  final double duration; // In seconds
  final List<CaptionWord>? words; // Word-level timing (optional)

  Caption({
    required this.id,
    required this.text,
    required this.startTime,
    required this.endTime,
    required this.duration,
    this.words,
  });

  factory Caption.fromJson(Map<String, dynamic> json) {
    return Caption(
      id: json['id'] as int,
      text: json['text'] as String,
      startTime: double.parse(json['startTime'].toString()),
      endTime: double.parse(json['endTime'].toString()),
      duration: double.parse(json['duration'].toString()),
      words: json['words'] != null
          ? (json['words'] as List).map((w) => CaptionWord.fromJson(w)).toList()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'text': text,
      'startTime': startTime.toStringAsFixed(3),
      'endTime': endTime.toStringAsFixed(3),
      'duration': duration.toStringAsFixed(3),
      'words': words?.map((w) => w.toJson()).toList(),
    };
  }

  Caption copyWith({
    int? id,
    String? text,
    double? startTime,
    double? endTime,
    double? duration,
    List<CaptionWord>? words,
  }) {
    return Caption(
      id: id ?? this.id,
      text: text ?? this.text,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      duration: duration ?? this.duration,
      words: words ?? this.words,
    );
  }
}

/// Word-level caption timing
class CaptionWord {
  final String word;
  final double startTime;
  final double endTime;

  CaptionWord({
    required this.word,
    required this.startTime,
    required this.endTime,
  });

  factory CaptionWord.fromJson(Map<String, dynamic> json) {
    return CaptionWord(
      word: json['word'] as String,
      startTime: double.parse(json['startTime'].toString()),
      endTime: double.parse(json['endTime'].toString()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'word': word,
      'startTime': startTime.toStringAsFixed(3),
      'endTime': endTime.toStringAsFixed(3),
    };
  }
}

/// Supported languages for caption generation
class CaptionLanguage {
  final String code;
  final String name;
  final String flag;

  CaptionLanguage({
    required this.code,
    required this.name,
    required this.flag,
  });

  factory CaptionLanguage.fromJson(Map<String, dynamic> json) {
    return CaptionLanguage(
      code: json['code'] as String,
      name: json['name'] as String,
      flag: json['flag'] as String,
    );
  }
}

/// Service for generating and managing video captions using AI
class CaptionService {
  static final Dio _dio = Dio(BaseOptions(
    baseUrl: dotenv.env['API_BASE_URL'] ?? 'http://localhost:5000/api',
    connectTimeout:
        const Duration(minutes: 5), // Long timeout for AI processing
    receiveTimeout: const Duration(minutes: 5),
  ));

  /// Generate captions from video file
  static Future<Map<String, dynamic>> generateCaptions({
    required String videoPath,
    String languageCode = 'en-US',
    bool enableAutoPunctuation = true,
    Function(double)? onProgress,
  }) async {
    try {
      debugPrint('📝 Generating captions for: $videoPath');

      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          videoPath,
          filename: videoPath.split('/').last,
        ),
        'language': languageCode,
        'enableAutoPunctuation': enableAutoPunctuation,
      });

      // Simulate progress during upload
      onProgress?.call(0.3); // Upload started

      final response = await _dio.post(
        '/ai/captions/generate',
        data: formData,
        onSendProgress: (sent, total) {
          if (total != -1) {
            final uploadProgress = (sent / total) * 0.5; // 0-50% for upload
            onProgress?.call(uploadProgress);
          }
        },
      );

      onProgress?.call(0.8); // Processing complete

      if (response.data['success'] == true) {
        debugPrint('✅ Generated ${response.data['captions'].length} captions');

        final captions = (response.data['captions'] as List)
            .map((json) => Caption.fromJson(json))
            .toList();

        onProgress?.call(1.0); // Done

        return {
          'success': true,
          'captions': captions,
          'language': response.data['language'],
          'totalDuration': response.data['totalDuration'],
          'confidence': response.data['confidence'] ?? 0.0,
        };
      } else {
        throw Exception(response.data['error'] ?? 'Caption generation failed');
      }
    } on DioException catch (e) {
      debugPrint('❌ Caption generation error: ${e.message}');
      if (e.response?.data != null) {
        throw Exception(e.response!.data['error'] ?? 'Server error');
      }
      throw Exception('Network error: ${e.message}');
    } catch (e) {
      debugPrint('❌ Caption generation error: $e');
      throw Exception(e.toString());
    }
  }

  /// Get list of supported languages
  static Future<List<CaptionLanguage>> getSupportedLanguages() async {
    try {
      final response = await _dio.get('/ai/captions/languages');

      if (response.data['success'] == true) {
        final languages = (response.data['languages'] as List)
            .map((json) => CaptionLanguage.fromJson(json))
            .toList();
        return languages;
      } else {
        throw Exception('Failed to fetch languages');
      }
    } on DioException catch (e) {
      debugPrint('❌ Fetch languages error: ${e.message}');
      // Return default languages as fallback
      return _getDefaultLanguages();
    } catch (e) {
      debugPrint('❌ Fetch languages error: $e');
      return _getDefaultLanguages();
    }
  }

  /// Get default languages (fallback)
  static List<CaptionLanguage> _getDefaultLanguages() {
    return [
      CaptionLanguage(code: 'en-US', name: 'English (US)', flag: '🇺🇸'),
      CaptionLanguage(code: 'es-ES', name: 'Spanish', flag: '🇪🇸'),
      CaptionLanguage(code: 'fr-FR', name: 'French', flag: '🇫🇷'),
      CaptionLanguage(code: 'de-DE', name: 'German', flag: '🇩🇪'),
      CaptionLanguage(code: 'it-IT', name: 'Italian', flag: '🇮🇹'),
      CaptionLanguage(code: 'pt-BR', name: 'Portuguese', flag: '🇧🇷'),
      CaptionLanguage(code: 'ja-JP', name: 'Japanese', flag: '🇯🇵'),
      CaptionLanguage(code: 'ko-KR', name: 'Korean', flag: '🇰🇷'),
      CaptionLanguage(code: 'zh-CN', name: 'Chinese', flag: '🇨🇳'),
    ];
  }

  /// Merge overlapping or close captions
  static List<Caption> mergeCaptions(List<Caption> captions,
      {double maxGap = 0.5}) {
    if (captions.isEmpty) return [];

    final merged = <Caption>[];
    Caption current = captions.first;

    for (int i = 1; i < captions.length; i++) {
      final next = captions[i];
      final gap = next.startTime - current.endTime;

      if (gap <= maxGap) {
        // Merge captions
        current = Caption(
          id: current.id,
          text: '${current.text} ${next.text}',
          startTime: current.startTime,
          endTime: next.endTime,
          duration: next.endTime - current.startTime,
        );
      } else {
        merged.add(current);
        current = next;
      }
    }
    merged.add(current);

    return merged;
  }

  /// Split long captions into multiple lines
  static List<Caption> splitLongCaptions(
    List<Caption> captions, {
    int maxWordsPerLine = 8,
  }) {
    final result = <Caption>[];
    int newId = 1;

    for (final caption in captions) {
      final words = caption.text.split(' ');

      if (words.length <= maxWordsPerLine) {
        result.add(caption.copyWith(id: newId++));
      } else {
        // Split into multiple captions
        final chunks = <List<String>>[];
        for (int i = 0; i < words.length; i += maxWordsPerLine) {
          chunks.add(words.sublist(
            i,
            i + maxWordsPerLine > words.length
                ? words.length
                : i + maxWordsPerLine,
          ));
        }

        final durationPerChunk = caption.duration / chunks.length;
        for (int i = 0; i < chunks.length; i++) {
          final chunkStartTime = caption.startTime + (i * durationPerChunk);
          final chunkEndTime = chunkStartTime + durationPerChunk;

          result.add(Caption(
            id: newId++,
            text: chunks[i].join(' '),
            startTime: chunkStartTime,
            endTime: chunkEndTime,
            duration: durationPerChunk,
          ));
        }
      }
    }

    return result;
  }

  /// Export captions to SRT format
  static String exportToSRT(List<Caption> captions) {
    final buffer = StringBuffer();

    for (int i = 0; i < captions.length; i++) {
      final caption = captions[i];
      buffer.writeln(i + 1);
      buffer.writeln(
        '${_formatSRTTime(caption.startTime)} --> ${_formatSRTTime(caption.endTime)}',
      );
      buffer.writeln(caption.text);
      buffer.writeln();
    }

    return buffer.toString();
  }

  /// Format time for SRT (HH:MM:SS,mmm)
  static String _formatSRTTime(double seconds) {
    final hours = (seconds / 3600).floor();
    final minutes = ((seconds % 3600) / 60).floor();
    final secs = (seconds % 60).floor();
    final millis = ((seconds % 1) * 1000).floor();

    return '${hours.toString().padLeft(2, '0')}:'
        '${minutes.toString().padLeft(2, '0')}:'
        '${secs.toString().padLeft(2, '0')},'
        '${millis.toString().padLeft(3, '0')}';
  }

  /// Export captions to VTT format (WebVTT)
  static String exportToVTT(List<Caption> captions) {
    final buffer = StringBuffer();
    buffer.writeln('WEBVTT');
    buffer.writeln();

    for (final caption in captions) {
      buffer.writeln(
        '${_formatVTTTime(caption.startTime)} --> ${_formatVTTTime(caption.endTime)}',
      );
      buffer.writeln(caption.text);
      buffer.writeln();
    }

    return buffer.toString();
  }

  /// Format time for VTT (HH:MM:SS.mmm)
  static String _formatVTTTime(double seconds) {
    final hours = (seconds / 3600).floor();
    final minutes = ((seconds % 3600) / 60).floor();
    final secs = (seconds % 60).floor();
    final millis = ((seconds % 1) * 1000).floor();

    return '${hours.toString().padLeft(2, '0')}:'
        '${minutes.toString().padLeft(2, '0')}:'
        '${secs.toString().padLeft(2, '0')}.'
        '${millis.toString().padLeft(3, '0')}';
  }
}
