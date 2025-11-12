import 'package:flutter/material.dart';
import 'package:iconsax/iconsax.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/glass_widgets.dart';

/// Settings page
class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  bool _notificationsEnabled = true;
  bool _privateAccount = false;
  bool _showOnlineStatus = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSectionTitle('Account'),
            _buildSettingsItem(
              icon: Iconsax.user_edit,
              title: 'Edit Profile',
              onTap: () {},
            ),
            _buildSettingsItem(
              icon: Iconsax.lock,
              title: 'Change Password',
              onTap: () {},
            ),
            _buildSettingsItem(
              icon: Iconsax.shield_tick,
              title: 'Privacy & Security',
              onTap: () {},
            ),
            
            const SizedBox(height: AppSpacing.lg),
            
            _buildSectionTitle('Preferences'),
            _buildSwitchItem(
              icon: Iconsax.notification,
              title: 'Push Notifications',
              value: _notificationsEnabled,
              onChanged: (value) {
                setState(() => _notificationsEnabled = value);
              },
            ),
            _buildSwitchItem(
              icon: Iconsax.lock_1,
              title: 'Private Account',
              value: _privateAccount,
              onChanged: (value) {
                setState(() => _privateAccount = value);
              },
            ),
            _buildSwitchItem(
              icon: Iconsax.eye,
              title: 'Show Online Status',
              value: _showOnlineStatus,
              onChanged: (value) {
                setState(() => _showOnlineStatus = value);
              },
            ),
            
            const SizedBox(height: AppSpacing.lg),
            
            _buildSectionTitle('Content'),
            _buildSettingsItem(
              icon: Iconsax.archive,
              title: 'Saved Posts',
              onTap: () {},
            ),
            _buildSettingsItem(
              icon: Iconsax.clock,
              title: 'Watch History',
              onTap: () {},
            ),
            _buildSettingsItem(
              icon: Iconsax.trash,
              title: 'Clear Cache',
              onTap: () {},
            ),
            
            const SizedBox(height: AppSpacing.lg),
            
            _buildSectionTitle('Support'),
            _buildSettingsItem(
              icon: Iconsax.message_question,
              title: 'Help & Support',
              onTap: () {},
            ),
            _buildSettingsItem(
              icon: Iconsax.document_text,
              title: 'Terms & Policies',
              onTap: () {},
            ),
            _buildSettingsItem(
              icon: Iconsax.info_circle,
              title: 'About',
              onTap: () {},
            ),
            
            const SizedBox(height: AppSpacing.xl),
            
            // Logout button
            SizedBox(
              width: double.infinity,
              child: GestureDetector(
                onTap: () {
                  // TODO: Handle logout
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.error, width: 2),
                    borderRadius: BorderRadius.circular(AppRadius.md),
                  ),
                  child: Text(
                    'Logout',
                    textAlign: TextAlign.center,
                    style: AppTypography.labelLarge.copyWith(
                      color: AppColors.error,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ),
            
            const SizedBox(height: AppSpacing.md),
            
            Center(
              child: Text(
                'Version 1.0.0',
                style: AppTypography.caption.copyWith(
                  color: AppColors.textTertiary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Text(
        title,
        style: AppTypography.titleMedium.copyWith(
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildSettingsItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.sm),
        child: GlassContainer(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Row(
              children: [
                Icon(icon, color: AppColors.primary, size: 24),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Text(
                    title,
                    style: AppTypography.bodyMedium.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                const Icon(
                  Icons.arrow_forward_ios,
                  color: AppColors.textTertiary,
                  size: 16,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSwitchItem({
    required IconData icon,
    required String title,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: GlassContainer(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Row(
            children: [
              Icon(icon, color: AppColors.primary, size: 24),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Text(
                  title,
                  style: AppTypography.bodyMedium.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              Switch(
                value: value,
                onChanged: onChanged,
                thumbColor: WidgetStateProperty.resolveWith((states) {
                  return states.contains(WidgetState.selected)
                      ? AppColors.primary
                      : Colors.white;
                }),
                trackColor: WidgetStateProperty.resolveWith((states) {
                  return states.contains(WidgetState.selected)
                      ? AppColors.primary.withValues(alpha: 0.5)
                      : Colors.white24;
                }),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
