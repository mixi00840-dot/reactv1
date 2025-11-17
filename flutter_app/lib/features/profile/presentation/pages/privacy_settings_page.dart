import 'package:flutter/material.dart';

class PrivacySettingsPage extends StatefulWidget {
  const PrivacySettingsPage({super.key});

  @override
  State<PrivacySettingsPage> createState() => _PrivacySettingsPageState();
}

class _PrivacySettingsPageState extends State<PrivacySettingsPage> {
  // Profile privacy
  String _accountPrivacy = 'public';
  bool _showActivityStatus = true;
  bool _showFollowersList = true;
  bool _showFollowingList = true;

  // Content privacy
  bool _allowComments = true;
  bool _allowDuet = true;
  bool _allowStitch = true;
  bool _allowDownload = false;

  // Interaction privacy
  bool _allowMessages = true;
  String _whoCanComment = 'everyone';
  String _whoCanDuet = 'everyone';
  String _whoCanTag = 'everyone';

  // Data privacy
  bool _personalized = true;
  bool _adPersonalization = true;
  bool _allowDataCollection = true;

  bool _isSaving = false;

  final Map<String, String> _privacyOptions = {
    'everyone': 'Everyone',
    'followers': 'Followers Only',
    'friends': 'Friends Only',
    'nobody': 'Nobody',
  };

  Future<void> _saveSettings() async {
    setState(() {
      _isSaving = true;
    });

    try {
      await Future.delayed(const Duration(seconds: 1)); // Simulate API call

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Privacy settings saved'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to save settings: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Privacy & Security'),
        actions: [
          if (_isSaving)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(16.0),
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
            )
          else
            TextButton(
              onPressed: _saveSettings,
              child: const Text('Save'),
            ),
        ],
      ),
      body: ListView(
        children: [
          // Account Privacy
          _buildSectionHeader('Account Privacy'),
          ListTile(
            leading: const Icon(Icons.lock),
            title: const Text('Private Account'),
            subtitle:
                const Text('Only approved followers can see your content'),
            trailing: Switch(
              value: _accountPrivacy == 'private',
              onChanged: (value) {
                setState(() {
                  _accountPrivacy = value ? 'private' : 'public';
                });
              },
            ),
          ),
          SwitchListTile(
            secondary: const Icon(Icons.online_prediction),
            title: const Text('Activity Status'),
            subtitle: const Text('Show when you\'re online'),
            value: _showActivityStatus,
            onChanged: (value) {
              setState(() {
                _showActivityStatus = value;
              });
            },
          ),
          SwitchListTile(
            secondary: const Icon(Icons.people),
            title: const Text('Show Followers List'),
            subtitle: const Text('Let others see your followers'),
            value: _showFollowersList,
            onChanged: (value) {
              setState(() {
                _showFollowersList = value;
              });
            },
          ),
          SwitchListTile(
            secondary: const Icon(Icons.person_add),
            title: const Text('Show Following List'),
            subtitle: const Text('Let others see who you follow'),
            value: _showFollowingList,
            onChanged: (value) {
              setState(() {
                _showFollowingList = value;
              });
            },
          ),

          // Content Privacy
          _buildSectionHeader('Content Privacy'),
          SwitchListTile(
            secondary: const Icon(Icons.comment),
            title: const Text('Allow Comments'),
            subtitle: const Text('People can comment on your posts'),
            value: _allowComments,
            onChanged: (value) {
              setState(() {
                _allowComments = value;
              });
            },
          ),
          SwitchListTile(
            secondary: const Icon(Icons.video_library),
            title: const Text('Allow Duet'),
            subtitle: const Text('Others can create duets with your videos'),
            value: _allowDuet,
            onChanged: (value) {
              setState(() {
                _allowDuet = value;
              });
            },
          ),
          SwitchListTile(
            secondary: const Icon(Icons.content_cut),
            title: const Text('Allow Stitch'),
            subtitle: const Text('Others can stitch your videos'),
            value: _allowStitch,
            onChanged: (value) {
              setState(() {
                _allowStitch = value;
              });
            },
          ),
          SwitchListTile(
            secondary: const Icon(Icons.download),
            title: const Text('Allow Download'),
            subtitle: const Text('People can download your videos'),
            value: _allowDownload,
            onChanged: (value) {
              setState(() {
                _allowDownload = value;
              });
            },
          ),

          // Interaction Privacy
          _buildSectionHeader('Interactions'),
          SwitchListTile(
            secondary: const Icon(Icons.message),
            title: const Text('Allow Messages'),
            subtitle: const Text('Receive direct messages'),
            value: _allowMessages,
            onChanged: (value) {
              setState(() {
                _allowMessages = value;
              });
            },
          ),
          _buildPrivacyOption(
            icon: Icons.comment,
            title: 'Who Can Comment',
            value: _whoCanComment,
            onTap: () => _showPrivacyDialog(
              'Who Can Comment',
              _whoCanComment,
              (value) {
                setState(() {
                  _whoCanComment = value;
                });
              },
            ),
          ),
          _buildPrivacyOption(
            icon: Icons.video_library,
            title: 'Who Can Duet',
            value: _whoCanDuet,
            onTap: () => _showPrivacyDialog(
              'Who Can Duet',
              _whoCanDuet,
              (value) {
                setState(() {
                  _whoCanDuet = value;
                });
              },
            ),
          ),
          _buildPrivacyOption(
            icon: Icons.local_offer,
            title: 'Who Can Tag Me',
            value: _whoCanTag,
            onTap: () => _showPrivacyDialog(
              'Who Can Tag Me',
              _whoCanTag,
              (value) {
                setState(() {
                  _whoCanTag = value;
                });
              },
            ),
          ),

          // Data & Personalization
          _buildSectionHeader('Data & Personalization'),
          SwitchListTile(
            secondary: const Icon(Icons.auto_awesome),
            title: const Text('Personalized Content'),
            subtitle: const Text('See content based on your interests'),
            value: _personalized,
            onChanged: (value) {
              setState(() {
                _personalized = value;
              });
            },
          ),
          SwitchListTile(
            secondary: const Icon(Icons.ads_click),
            title: const Text('Ad Personalization'),
            subtitle: const Text('See ads relevant to you'),
            value: _adPersonalization,
            onChanged: (value) {
              setState(() {
                _adPersonalization = value;
              });
            },
          ),
          SwitchListTile(
            secondary: const Icon(Icons.analytics),
            title: const Text('Allow Analytics'),
            subtitle: const Text('Help us improve the app'),
            value: _allowDataCollection,
            onChanged: (value) {
              setState(() {
                _allowDataCollection = value;
              });
            },
          ),

          // Security
          _buildSectionHeader('Security'),
          _buildListTile(
            icon: Icons.block,
            title: 'Blocked Accounts',
            subtitle: 'Manage blocked users',
            onTap: () {
              // Navigate to blocked accounts
            },
          ),
          _buildListTile(
            icon: Icons.security,
            title: 'Two-Factor Authentication',
            subtitle: 'Add extra security to your account',
            onTap: () {
              // Navigate to 2FA setup
            },
          ),
          _buildListTile(
            icon: Icons.devices,
            title: 'Login Activity',
            subtitle: 'See where you\'re logged in',
            onTap: () {
              // Navigate to login activity
            },
          ),

          // Data Management
          _buildSectionHeader('Data Management'),
          _buildListTile(
            icon: Icons.download,
            title: 'Download Your Data',
            subtitle: 'Request a copy of your data',
            onTap: () {
              showDialog(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Download Your Data'),
                  content: const Text(
                    'We\'ll prepare a copy of your data and send you a download link via email within 48 hours.',
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Cancel'),
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.of(context).pop();
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Data download requested'),
                          ),
                        );
                      },
                      child: const Text('Request'),
                    ),
                  ],
                ),
              );
            },
          ),

          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      color: Colors.grey.shade100,
      child: Text(
        title,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: Colors.grey.shade700,
        ),
      ),
    );
  }

  Widget _buildListTile({
    required IconData icon,
    required String title,
    String? subtitle,
    VoidCallback? onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: Colors.blue),
      title: Text(title),
      subtitle: subtitle != null ? Text(subtitle) : null,
      trailing: const Icon(Icons.arrow_forward_ios, size: 16),
      onTap: onTap,
    );
  }

  Widget _buildPrivacyOption({
    required IconData icon,
    required String title,
    required String value,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: Colors.blue),
      title: Text(title),
      subtitle: Text(_privacyOptions[value]!),
      trailing: const Icon(Icons.arrow_forward_ios, size: 16),
      onTap: onTap,
    );
  }

  void _showPrivacyDialog(
    String title,
    String currentValue,
    Function(String) onChanged,
  ) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: _privacyOptions.entries.map((entry) {
            return RadioListTile<String>(
              title: Text(entry.value),
              value: entry.key,
              groupValue: currentValue,
              onChanged: (value) {
                if (value != null) {
                  onChanged(value);
                  Navigator.of(context).pop();
                }
              },
            );
          }).toList(),
        ),
      ),
    );
  }
}
