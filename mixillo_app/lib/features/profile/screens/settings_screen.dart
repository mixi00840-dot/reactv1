import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user_settings_model.dart';
import '../models/seller_application_model.dart';
import '../providers/profile_providers.dart';
import 'seller_application_screen.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settingsAsync = ref.watch(userSettingsProvider);
    final sellerStatusAsync = ref.watch(sellerApplicationProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        centerTitle: true,
      ),
      body: settingsAsync.when(
        data: (settings) => _buildSettingsContent(context, ref, settings, sellerStatusAsync),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text('Error: $error'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.refresh(userSettingsProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSettingsContent(
    BuildContext context,
    WidgetRef ref,
    UserSettings settings,
    AsyncValue<SellerApplication?> sellerStatusAsync,
  ) {
    return ListView(
      padding: const EdgeInsets.symmetric(vertical: 16),
      children: [
        // Appearance Section
        _buildSectionHeader('Appearance'),
        _buildThemeSelector(context, ref, settings),
        const Divider(height: 32),

        // Privacy Section
        _buildSectionHeader('Privacy & Safety'),
        _buildPrivacyToggles(context, ref, settings),
        const Divider(height: 32),

        // Notifications Section
        _buildSectionHeader('Notifications'),
        _buildNotificationToggles(context, ref, settings),
        const Divider(height: 32),

        // Seller Section
        _buildSectionHeader('Seller Options'),
        _buildSellerOptions(context, ref, sellerStatusAsync),
        const Divider(height: 32),

        // Account Section
        _buildSectionHeader('Account'),
        _buildAccountOptions(context),
      ],
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: Colors.grey,
        ),
      ),
    );
  }

  Widget _buildThemeSelector(BuildContext context, WidgetRef ref, UserSettings settings) {
    return Column(
      children: [
        _buildThemeOption(
          context,
          ref,
          'Light Mode',
          Icons.light_mode,
          ThemePreference.light,
          settings.theme,
        ),
        _buildThemeOption(
          context,
          ref,
          'Dark Mode',
          Icons.dark_mode,
          ThemePreference.dark,
          settings.theme,
        ),
        _buildThemeOption(
          context,
          ref,
          'System Default',
          Icons.brightness_auto,
          ThemePreference.system,
          settings.theme,
        ),
      ],
    );
  }

  Widget _buildThemeOption(
    BuildContext context,
    WidgetRef ref,
    String title,
    IconData icon,
    ThemePreference preference,
    ThemePreference currentPreference,
  ) {
    final isSelected = preference == currentPreference;
    return ListTile(
      leading: Icon(icon, color: isSelected ? Theme.of(context).primaryColor : null),
      title: Text(title),
      trailing: isSelected ? Icon(Icons.check, color: Theme.of(context).primaryColor) : null,
      onTap: () {
        ref.read(userSettingsProvider.notifier).updateTheme(preference);
      },
    );
  }

  Widget _buildPrivacyToggles(BuildContext context, WidgetRef ref, UserSettings settings) {
    return Column(
      children: [
        SwitchListTile(
          title: const Text('Show Likes'),
          subtitle: const Text('Others can see posts you liked'),
          value: settings.privacy.showLikes,
          onChanged: (value) {
            final updatedPrivacy = settings.privacy.copyWith(showLikes: value);
            ref.read(userSettingsProvider.notifier).updatePrivacy(updatedPrivacy);
          },
        ),
        SwitchListTile(
          title: const Text('Show Followers'),
          subtitle: const Text('Others can see your followers'),
          value: settings.privacy.showFollowers,
          onChanged: (value) {
            final updatedPrivacy = settings.privacy.copyWith(showFollowers: value);
            ref.read(userSettingsProvider.notifier).updatePrivacy(updatedPrivacy);
          },
        ),
        SwitchListTile(
          title: const Text('Show Following'),
          subtitle: const Text('Others can see who you follow'),
          value: settings.privacy.showFollowing,
          onChanged: (value) {
            final updatedPrivacy = settings.privacy.copyWith(showFollowing: value);
            ref.read(userSettingsProvider.notifier).updatePrivacy(updatedPrivacy);
          },
        ),
        SwitchListTile(
          title: const Text('Allow Comments'),
          subtitle: const Text('Users can comment on your posts'),
          value: settings.privacy.allowComments,
          onChanged: (value) {
            final updatedPrivacy = settings.privacy.copyWith(allowComments: value);
            ref.read(userSettingsProvider.notifier).updatePrivacy(updatedPrivacy);
          },
        ),
        SwitchListTile(
          title: const Text('Allow Duet'),
          subtitle: const Text('Others can create duets with your videos'),
          value: settings.privacy.allowDuet,
          onChanged: (value) {
            final updatedPrivacy = settings.privacy.copyWith(allowDuet: value);
            ref.read(userSettingsProvider.notifier).updatePrivacy(updatedPrivacy);
          },
        ),
        SwitchListTile(
          title: const Text('Allow Stitch'),
          subtitle: const Text('Others can stitch your videos'),
          value: settings.privacy.allowStitch,
          onChanged: (value) {
            final updatedPrivacy = settings.privacy.copyWith(allowStitch: value);
            ref.read(userSettingsProvider.notifier).updatePrivacy(updatedPrivacy);
          },
        ),
        ListTile(
          title: const Text('Profile Visibility'),
          subtitle: Text(_getVisibilityLabel(settings.privacy.profileVisibility)),
          trailing: const Icon(Icons.arrow_forward_ios, size: 16),
          onTap: () => _showVisibilityDialog(context, ref, settings),
        ),
      ],
    );
  }

  Widget _buildNotificationToggles(BuildContext context, WidgetRef ref, UserSettings settings) {
    return Column(
      children: [
        SwitchListTile(
          title: const Text('Likes'),
          subtitle: const Text('Notify when someone likes your content'),
          value: settings.notifications.likes,
          onChanged: (value) {
            final updatedSettings = settings.copyWith(
              notifications: settings.notifications.copyWith(likes: value),
            );
            ref.read(userSettingsProvider.notifier).updateSettings(updatedSettings);
          },
        ),
        SwitchListTile(
          title: const Text('Comments'),
          subtitle: const Text('Notify when someone comments'),
          value: settings.notifications.comments,
          onChanged: (value) {
            final updatedSettings = settings.copyWith(
              notifications: settings.notifications.copyWith(comments: value),
            );
            ref.read(userSettingsProvider.notifier).updateSettings(updatedSettings);
          },
        ),
        SwitchListTile(
          title: const Text('New Followers'),
          subtitle: const Text('Notify when someone follows you'),
          value: settings.notifications.newFollowers,
          onChanged: (value) {
            final updatedSettings = settings.copyWith(
              notifications: settings.notifications.copyWith(newFollowers: value),
            );
            ref.read(userSettingsProvider.notifier).updateSettings(updatedSettings);
          },
        ),
        SwitchListTile(
          title: const Text('Mentions'),
          subtitle: const Text('Notify when someone mentions you'),
          value: settings.notifications.mentions,
          onChanged: (value) {
            final updatedSettings = settings.copyWith(
              notifications: settings.notifications.copyWith(mentions: value),
            );
            ref.read(userSettingsProvider.notifier).updateSettings(updatedSettings);
          },
        ),
        SwitchListTile(
          title: const Text('Direct Messages'),
          subtitle: const Text('Notify for new messages'),
          value: settings.notifications.directMessages,
          onChanged: (value) {
            final updatedSettings = settings.copyWith(
              notifications: settings.notifications.copyWith(directMessages: value),
            );
            ref.read(userSettingsProvider.notifier).updateSettings(updatedSettings);
          },
        ),
        SwitchListTile(
          title: const Text('Video Updates'),
          subtitle: const Text('Notify when creators you follow post'),
          value: settings.notifications.videoUpdates,
          onChanged: (value) {
            final updatedSettings = settings.copyWith(
              notifications: settings.notifications.copyWith(videoUpdates: value),
            );
            ref.read(userSettingsProvider.notifier).updateSettings(updatedSettings);
          },
        ),
      ],
    );
  }

  Widget _buildSellerOptions(BuildContext context, WidgetRef ref, AsyncValue<SellerApplication?> sellerStatusAsync) {
    return sellerStatusAsync.when(
      data: (sellerApplication) {
        if (sellerApplication == null) {
          // No application yet
          return ListTile(
            leading: const Icon(Icons.store),
            title: const Text('Become a Seller'),
            subtitle: const Text('Start selling products on Mixillo'),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const SellerApplicationScreen()),
            ),
          );
        } else if (sellerApplication.isPending) {
          // Application pending
          return ListTile(
            leading: const Icon(Icons.pending, color: Colors.orange),
            title: const Text('Seller Application Pending'),
            subtitle: const Text('We\'re reviewing your application'),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => SellerApplicationScreen(application: sellerApplication),
              ),
            ),
          );
        } else if (sellerApplication.isApproved) {
          // Application approved
          return ListTile(
            leading: const Icon(Icons.verified, color: Colors.green),
            title: const Text('Seller Account Active'),
            subtitle: const Text('Manage your shop'),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () {
              // Navigate to shop management
            },
          );
        } else if (sellerApplication.isRejected) {
          // Application rejected
          return ListTile(
            leading: const Icon(Icons.cancel, color: Colors.red),
            title: const Text('Seller Application Rejected'),
            subtitle: Text(sellerApplication.rejectionReason ?? 'Tap to reapply'),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const SellerApplicationScreen()),
            ),
          );
        }
        return const SizedBox.shrink();
      },
      loading: () => const ListTile(
        leading: CircularProgressIndicator(),
        title: Text('Loading seller status...'),
      ),
      error: (_, __) => const ListTile(
        leading: Icon(Icons.error, color: Colors.red),
        title: Text('Error loading seller status'),
      ),
    );
  }

  Widget _buildAccountOptions(BuildContext context) {
    return Column(
      children: [
        ListTile(
          leading: const Icon(Icons.help_outline),
          title: const Text('Help & Support'),
          trailing: const Icon(Icons.arrow_forward_ios, size: 16),
          onTap: () {
            // Navigate to help
          },
        ),
        ListTile(
          leading: const Icon(Icons.info_outline),
          title: const Text('About'),
          trailing: const Icon(Icons.arrow_forward_ios, size: 16),
          onTap: () {
            // Navigate to about
          },
        ),
        ListTile(
          leading: const Icon(Icons.logout, color: Colors.red),
          title: const Text('Log Out', style: TextStyle(color: Colors.red)),
          onTap: () => _showLogoutDialog(context),
        ),
      ],
    );
  }

  String _getVisibilityLabel(ProfileVisibility visibility) {
    switch (visibility) {
      case ProfileVisibility.public:
        return 'Public';
      case ProfileVisibility.friendsOnly:
        return 'Friends Only';
      case ProfileVisibility.private:
        return 'Private';
    }
  }

  void _showVisibilityDialog(BuildContext context, WidgetRef ref, UserSettings settings) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Profile Visibility'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: ProfileVisibility.values.map((visibility) {
            return RadioListTile<ProfileVisibility>(
              title: Text(_getVisibilityLabel(visibility)),
              value: visibility,
              groupValue: settings.privacy.profileVisibility,
              onChanged: (value) {
                if (value != null) {
                  final updatedPrivacy = settings.privacy.copyWith(profileVisibility: value);
                  ref.read(userSettingsProvider.notifier).updatePrivacy(updatedPrivacy);
                  Navigator.pop(context);
                }
              },
            );
          }).toList(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Log Out'),
        content: const Text('Are you sure you want to log out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              // Handle logout
              Navigator.pop(context);
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Log Out'),
          ),
        ],
      ),
    );
  }
}
