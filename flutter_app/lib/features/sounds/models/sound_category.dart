/// Sound categories for organizing music library
enum SoundCategory {
  all,
  trending,
  favorites,
  pop,
  hiphop,
  dance,
  electronic,
  rock,
  rnb,
  country,
  jazz,
  classical,
  indie,
  latin,
  kpop,
}

/// Extension methods for SoundCategory
extension SoundCategoryExtension on SoundCategory {
  /// Display name for UI
  String get displayName {
    switch (this) {
      case SoundCategory.all:
        return 'All';
      case SoundCategory.trending:
        return 'Trending';
      case SoundCategory.favorites:
        return 'Favorites';
      case SoundCategory.pop:
        return 'Pop';
      case SoundCategory.hiphop:
        return 'Hip-Hop';
      case SoundCategory.dance:
        return 'Dance';
      case SoundCategory.electronic:
        return 'Electronic';
      case SoundCategory.rock:
        return 'Rock';
      case SoundCategory.rnb:
        return 'R&B';
      case SoundCategory.country:
        return 'Country';
      case SoundCategory.jazz:
        return 'Jazz';
      case SoundCategory.classical:
        return 'Classical';
      case SoundCategory.indie:
        return 'Indie';
      case SoundCategory.latin:
        return 'Latin';
      case SoundCategory.kpop:
        return 'K-Pop';
    }
  }

  /// API parameter value
  String get apiValue {
    switch (this) {
      case SoundCategory.all:
        return '';
      case SoundCategory.trending:
        return 'trending';
      case SoundCategory.favorites:
        return 'favorites';
      case SoundCategory.hiphop:
        return 'hip-hop';
      case SoundCategory.rnb:
        return 'r&b';
      case SoundCategory.kpop:
        return 'k-pop';
      default:
        return name;
    }
  }

  /// Icon for the category
  String get icon {
    switch (this) {
      case SoundCategory.all:
        return '🎵';
      case SoundCategory.trending:
        return '🔥';
      case SoundCategory.favorites:
        return '❤️';
      case SoundCategory.pop:
        return '🎤';
      case SoundCategory.hiphop:
        return '🎧';
      case SoundCategory.dance:
        return '💃';
      case SoundCategory.electronic:
        return '🎹';
      case SoundCategory.rock:
        return '🎸';
      case SoundCategory.rnb:
        return '🎶';
      case SoundCategory.country:
        return '🤠';
      case SoundCategory.jazz:
        return '🎺';
      case SoundCategory.classical:
        return '🎻';
      case SoundCategory.indie:
        return '🎼';
      case SoundCategory.latin:
        return '🌮';
      case SoundCategory.kpop:
        return '🇰🇷';
    }
  }
}

