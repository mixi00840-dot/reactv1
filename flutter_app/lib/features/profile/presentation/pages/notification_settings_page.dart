import 'package:flutter/material.dart';

class NotificationSettingsPage extends StatefulWidget {
  const NotificationSettingsPage({super.key});

  @override
  State<NotificationSettingsPage> createState() =>
      _NotificationSettingsPageState();
}

class _NotificationSettingsPageState extends State<NotificationSettingsPage> {
  // General notifications
  bool _allNotifications = true;

  // Engagement notifications
  bool _likes = true;
  bool _comments = true;
  bool _shares = true;
  bool _newFollowers = true;

  // Content notifications
  bool _contentUploaded = true;
  bool _contentApproved = true;
  bool _contentRejected = true;

  // Social notifications
  bool _messages = true;
  bool _mentions = true;
  bool _tags = true;

  // Live notifications
  bool _liveStreamStarted = true;
  bool _liveStreamReminders = true;

  // Commerce notifications
  bool _orderUpdates = true;
  bool _paymentConfirmation = true;
  bool _deliveryUpdates = true;
  bool _promotions = true;

  // System notifications
  bool _systemUpdates = false;
  bool _securityAlerts = true;
  bool _accountActivity = true;

  // Notification channels
  bool _pushNotifications = true;
  bool _emailNotifications = true;
  bool _smsNotifications = false;

  // Quiet hours
  bool _enableQuietHours = false;
  TimeOfDay _quietHoursStart = const TimeOfDay(hour: 22, minute: 0);
  TimeOfDay _quietHoursEnd = const TimeOfDay(hour: 8, minute: 0);

  bool _isSaving = false;

  Future<void> _saveSettings() async {
    setState(() {
      _isSaving = true;
    });

    try {
      // Simulate API call
      await Future.delayed(const Duration(seconds: 1));

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Notification settings saved'),
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

  Future<void> _selectTime(BuildContext context, bool isStart) async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: isStart ? _quietHoursStart : _quietHoursEnd,
    );

    if (picked != null) {
      setState(() {
        if (isStart) {
          _quietHoursStart = picked;
        } else {
          _quietHoursEnd = picked;
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notification Settings'),
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
          // Master switch
          Container(
            color: Colors.blue.shade50,
            child: SwitchListTile(
              title: const Text(
                'All Notifications',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              subtitle: const Text('Enable or disable all notifications'),
              value: _allNotifications,
              onChanged: (value) {
                setState(() {
                  _allNotifications = value;
                  if (!value) {
                    // Disable all notifications
                    _likes = false;
                    _comments = false;
                    _shares = false;
                    _newFollowers = false;
                    _contentUploaded = false;
                    _contentApproved = false;
                    _contentRejected = false;
                    _messages = false;
                    _mentions = false;
                    _tags = false;
                    _liveStreamStarted = false;
                    _liveStreamReminders = false;
                    _orderUpdates = false;
                    _paymentConfirmation = false;
                    _deliveryUpdates = false;
                    _promotions = false;
                    _systemUpdates = false;
                    _securityAlerts = false;
                    _accountActivity = false;
                  }
                });
              },
            ),
          ),
          const Divider(height: 1),

          // Engagement
          _buildSectionHeader('Engagement'),
          _buildSwitchTile(
            'Likes',
            'When someone likes your content',
            Icons.favorite,
            _likes,
            (value) => setState(() => _likes = value),
          ),
          _buildSwitchTile(
            'Comments',
            'When someone comments on your content',
            Icons.comment,
            _comments,
            (value) => setState(() => _comments = value),
          ),
          _buildSwitchTile(
            'Shares',
            'When someone shares your content',
            Icons.share,
            _shares,
            (value) => setState(() => _shares = value),
          ),
          _buildSwitchTile(
            'New Followers',
            'When someone follows you',
            Icons.person_add,
            _newFollowers,
            (value) => setState(() => _newFollowers = value),
          ),

          // Content
          _buildSectionHeader('Content'),
          _buildSwitchTile(
            'Content Uploaded',
            'When your content is successfully uploaded',
            Icons.cloud_upload,
            _contentUploaded,
            (value) => setState(() => _contentUploaded = value),
          ),
          _buildSwitchTile(
            'Content Approved',
            'When your content is approved by moderation',
            Icons.check_circle,
            _contentApproved,
            (value) => setState(() => _contentApproved = value),
          ),
          _buildSwitchTile(
            'Content Rejected',
            'When your content is rejected',
            Icons.cancel,
            _contentRejected,
            (value) => setState(() => _contentRejected = value),
          ),

          // Social
          _buildSectionHeader('Social'),
          _buildSwitchTile(
            'Messages',
            'When you receive a new message',
            Icons.message,
            _messages,
            (value) => setState(() => _messages = value),
          ),
          _buildSwitchTile(
            'Mentions',
            'When someone mentions you',
            Icons.alternate_email,
            _mentions,
            (value) => setState(() => _mentions = value),
          ),
          _buildSwitchTile(
            'Tags',
            'When someone tags you in content',
            Icons.local_offer,
            _tags,
            (value) => setState(() => _tags = value),
          ),

          // Live
          _buildSectionHeader('Live Streaming'),
          _buildSwitchTile(
            'Live Stream Started',
            'When someone you follow goes live',
            Icons.videocam,
            _liveStreamStarted,
            (value) => setState(() => _liveStreamStarted = value),
          ),
          _buildSwitchTile(
            'Live Stream Reminders',
            'Reminders for scheduled live streams',
            Icons.notifications_active,
            _liveStreamReminders,
            (value) => setState(() => _liveStreamReminders = value),
          ),

          // Commerce
          _buildSectionHeader('Shopping & Orders'),
          _buildSwitchTile(
            'Order Updates',
            'Updates about your orders',
            Icons.shopping_bag,
            _orderUpdates,
            (value) => setState(() => _orderUpdates = value),
          ),
          _buildSwitchTile(
            'Payment Confirmation',
            'When payment is confirmed',
            Icons.payment,
            _paymentConfirmation,
            (value) => setState(() => _paymentConfirmation = value),
          ),
          _buildSwitchTile(
            'Delivery Updates',
            'Tracking and delivery notifications',
            Icons.local_shipping,
            _deliveryUpdates,
            (value) => setState(() => _deliveryUpdates = value),
          ),
          _buildSwitchTile(
            'Promotions & Offers',
            'Discounts and special offers',
            Icons.local_offer,
            _promotions,
            (value) => setState(() => _promotions = value),
          ),

          // System
          _buildSectionHeader('System & Security'),
          _buildSwitchTile(
            'System Updates',
            'App updates and new features',
            Icons.system_update,
            _systemUpdates,
            (value) => setState(() => _systemUpdates = value),
          ),
          _buildSwitchTile(
            'Security Alerts',
            'Login attempts and security issues',
            Icons.security,
            _securityAlerts,
            (value) => setState(() => _securityAlerts = value),
          ),
          _buildSwitchTile(
            'Account Activity',
            'Changes to your account',
            Icons.account_circle,
            _accountActivity,
            (value) => setState(() => _accountActivity = value),
          ),

          // Notification Channels
          _buildSectionHeader('Notification Channels'),
          _buildSwitchTile(
            'Push Notifications',
            'Receive notifications on this device',
            Icons.notifications,
            _pushNotifications,
            (value) => setState(() => _pushNotifications = value),
          ),
          _buildSwitchTile(
            'Email Notifications',
            'Receive notifications via email',
            Icons.email,
            _emailNotifications,
            (value) => setState(() => _emailNotifications = value),
          ),
          _buildSwitchTile(
            'SMS Notifications',
            'Receive notifications via text message',
            Icons.sms,
            _smsNotifications,
            (value) => setState(() => _smsNotifications = value),
          ),

          // Quiet Hours
          _buildSectionHeader('Quiet Hours'),
          _buildSwitchTile(
            'Enable Quiet Hours',
            'Mute notifications during specific hours',
            Icons.bedtime,
            _enableQuietHours,
            (value) => setState(() => _enableQuietHours = value),
          ),
          if (_enableQuietHours) ...[
            ListTile(
              leading: const Icon(Icons.schedule),
              title: const Text('Start Time'),
              subtitle: Text(_quietHoursStart.format(context)),
              trailing: const Icon(Icons.arrow_forward_ios, size: 16),
              onTap: () => _selectTime(context, true),
            ),
            ListTile(
              leading: const Icon(Icons.schedule),
              title: const Text('End Time'),
              subtitle: Text(_quietHoursEnd.format(context)),
              trailing: const Icon(Icons.arrow_forward_ios, size: 16),
              onTap: () => _selectTime(context, false),
            ),
          ],

          const SizedBox(height: 24),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              'Note: Some notifications are required for security and account management purposes and cannot be disabled.',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade600,
              ),
              textAlign: TextAlign.center,
            ),
          ),
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

  Widget _buildSwitchTile(
    String title,
    String subtitle,
    IconData icon,
    bool value,
    ValueChanged<bool> onChanged,
  ) {
    return SwitchListTile(
      secondary: Icon(icon, color: Colors.blue),
      title: Text(title),
      subtitle: Text(
        subtitle,
        style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
      ),
      value: value && _allNotifications,
      onChanged: _allNotifications ? onChanged : null,
    );
  }
}
