import 'package:flutter/material.dart';

/// Caption processor for extracting hashtags and mentions
class CaptionProcessor {
  /// Extract hashtags from caption
  /// Returns list of hashtags without # symbol
  static List<String> extractHashtags(String caption) {
    final hashtagPattern = RegExp(r'#(\w+)');
    final matches = hashtagPattern.allMatches(caption);
    return matches.map((match) => match.group(1)!).toList();
  }

  /// Extract mentions from caption
  /// Returns list of usernames without @ symbol
  static List<String> extractMentions(String caption) {
    final mentionPattern = RegExp(r'@(\w+)');
    final matches = mentionPattern.allMatches(caption);
    return matches.map((match) => match.group(1)!).toList();
  }

  /// Get caption without hashtags and mentions for preview
  static String getCleanCaption(String caption) {
    return caption
        .replaceAll(RegExp(r'#\w+'), '')
        .replaceAll(RegExp(r'@\w+'), '')
        .trim();
  }

  /// Format caption with styled hashtags and mentions
  /// Returns spans for RichText
  static List<TextSpan> formatCaptionSpans(
    String caption, {
    required TextStyle normalStyle,
    required TextStyle hashtagStyle,
    required TextStyle mentionStyle,
  }) {
    final spans = <TextSpan>[];
    final pattern = RegExp(r'(#\w+|@\w+)');
    int lastEnd = 0;

    for (final match in pattern.allMatches(caption)) {
      // Add normal text before match
      if (match.start > lastEnd) {
        spans.add(
          TextSpan(
            text: caption.substring(lastEnd, match.start),
            style: normalStyle,
          ),
        );
      }

      // Add styled match
      final matchText = match.group(0)!;
      spans.add(
        TextSpan(
          text: matchText,
          style: matchText.startsWith('#') ? hashtagStyle : mentionStyle,
        ),
      );

      lastEnd = match.end;
    }

    // Add remaining text
    if (lastEnd < caption.length) {
      spans.add(
        TextSpan(
          text: caption.substring(lastEnd),
          style: normalStyle,
        ),
      );
    }

    return spans;
  }

  /// Validate caption length
  static bool isValidLength(String caption, {int maxLength = 150}) {
    return caption.length <= maxLength;
  }

  /// Get hashtag suggestions based on partial input
  static List<String> getHashtagSuggestions(
    String currentWord,
    List<String> trendingHashtags,
  ) {
    if (!currentWord.startsWith('#') || currentWord.length < 2) {
      return [];
    }

    final query = currentWord.substring(1).toLowerCase();
    return trendingHashtags
        .where((tag) => tag.toLowerCase().startsWith(query))
        .take(5)
        .toList();
  }

  /// Get mention suggestions based on partial input
  static List<String> getMentionSuggestions(
    String currentWord,
    List<String> recentUsers,
  ) {
    if (!currentWord.startsWith('@') || currentWord.length < 2) {
      return [];
    }

    final query = currentWord.substring(1).toLowerCase();
    return recentUsers
        .where((username) => username.toLowerCase().startsWith(query))
        .take(5)
        .toList();
  }

  /// Check if cursor is at the end of a hashtag or mention
  static bool isInTag(String caption, int cursorPosition) {
    if (cursorPosition == 0) return false;

    // Get word at cursor
    final beforeCursor = caption.substring(0, cursorPosition);
    final words = beforeCursor.split(RegExp(r'\s+'));
    final currentWord = words.isNotEmpty ? words.last : '';

    return currentWord.startsWith('#') || currentWord.startsWith('@');
  }
}

