import 'package:flutter/material.dart';

class NotificationSettingsPage extends StatefulWidget {
  const NotificationSettingsPage({super.key});

  @override
  State<NotificationSettingsPage> createState() =>
      _NotificationSettingsPageState();
}

class _NotificationSettingsPageState extends State<NotificationSettingsPage> {
  bool pushEnabled = true;
  bool emailEnabled = true;
  bool likesEnabled = true;
  bool commentsEnabled = true;
  bool followsEnabled = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notification Settings'),
      ),
      body: ListView(
        children: [
          SwitchListTile(
            title: const Text('Push Notifications'),
            subtitle: const Text('Receive push notifications'),
            value: pushEnabled,
            onChanged: (value) => setState(() => pushEnabled = value),
          ),
          SwitchListTile(
            title: const Text('Email Notifications'),
            subtitle: const Text('Receive email notifications'),
            value: emailEnabled,
            onChanged: (value) => setState(() => emailEnabled = value),
          ),
          const Divider(),
          const ListTile(
            title: Text('Activity Notifications'),
            subtitle: Text('Choose which activities notify you'),
          ),
          SwitchListTile(
            title: const Text('Likes'),
            value: likesEnabled,
            onChanged: (value) => setState(() => likesEnabled = value),
          ),
          SwitchListTile(
            title: const Text('Comments'),
            value: commentsEnabled,
            onChanged: (value) => setState(() => commentsEnabled = value),
          ),
          SwitchListTile(
            title: const Text('New Followers'),
            value: followsEnabled,
            onChanged: (value) => setState(() => followsEnabled = value),
          ),
        ],
      ),
    );
  }
}
