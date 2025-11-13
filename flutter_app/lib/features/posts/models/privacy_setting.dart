/// Privacy settings for posts
enum PrivacySetting {
  public,
  friends,
  private,
  followers;

  /// From API value
  static PrivacySetting fromApiValue(String value) {
    switch (value.toLowerCase()) {
      case 'friends':
        return PrivacySetting.friends;
      case 'private':
        return PrivacySetting.private;
      case 'followers':
        return PrivacySetting.followers;
      default:
        return PrivacySetting.public;
    }
  }
}

extension PrivacySettingExtension on PrivacySetting {
  /// Display name for UI
  String get displayName {
    switch (this) {
      case PrivacySetting.public:
        return 'Public';
      case PrivacySetting.friends:
        return 'Friends';
      case PrivacySetting.private:
        return 'Only Me';
      case PrivacySetting.followers:
        return 'Followers';
    }
  }

  /// Description for UI
  String get description {
    switch (this) {
      case PrivacySetting.public:
        return 'Everyone can see this video';
      case PrivacySetting.friends:
        return 'Only friends can see this video';
      case PrivacySetting.private:
        return 'Only you can see this video';
      case PrivacySetting.followers:
        return 'Your followers can see this video';
    }
  }

  /// Icon for UI
  String get icon {
    switch (this) {
      case PrivacySetting.public:
        return '🌎';
      case PrivacySetting.friends:
        return '👥';
      case PrivacySetting.private:
        return '🔒';
      case PrivacySetting.followers:
        return '👤';
    }
  }

  /// API value
  String get apiValue {
    switch (this) {
      case PrivacySetting.public:
        return 'public';
      case PrivacySetting.friends:
        return 'friends';
      case PrivacySetting.private:
        return 'private';
      case PrivacySetting.followers:
        return 'followers';
    }
  }
}
