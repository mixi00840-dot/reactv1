import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

// Example: How to integrate Profile module into your existing Profile Screen

class EnhancedProfileScreen extends ConsumerWidget {
  const EnhancedProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Get current user ID from your auth provider
    // Example: final currentUserId = 'user123';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () => context.push('/profile/settings'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // User Header (your existing code)
          _buildUserHeader(),

          const SizedBox(height: 24),

          // NEW: Level & Badges Widget
          // import '../features/profile/widgets/level_badge_widget.dart';
          // LevelBadgeWidget(userId: currentUserId, showDetails: true),

          const SizedBox(height: 24),

          // Navigation Menu
          _buildMenuSection(
            context,
            'Account',
            [
              _buildMenuItem(
                context,
                icon: Icons.inbox,
                title: 'Messages',
                subtitle: 'View your conversations',
                onTap: () => context.push('/profile/inbox'),
                trailing: _buildUnreadBadge(5), // Example: 5 unread
              ),
              _buildMenuItem(
                context,
                icon: Icons.notifications,
                title: 'Activity',
                subtitle: 'Your notifications and events',
                onTap: () => context.push('/profile/activity'),
                trailing: _buildUnreadBadge(12), // Example: 12 unread
              ),
              _buildMenuItem(
                context,
                icon: Icons.account_balance_wallet,
                title: 'Wallet',
                subtitle: 'Manage your balance',
                onTap: () => context.push('/profile/wallet'),
              ),
            ],
          ),

          const SizedBox(height: 16),

          _buildMenuSection(
            context,
            'Content',
            [
              _buildMenuItem(
                context,
                icon: Icons.bookmark,
                title: 'Saved',
                subtitle: 'Your saved videos',
                onTap: () => context.push('/profile/saved'),
              ),
              _buildMenuItem(
                context,
                icon: Icons.favorite,
                title: 'Liked',
                subtitle: 'Videos you liked',
                onTap: () => context.push('/profile/liked'),
              ),
            ],
          ),

          const SizedBox(height: 16),

          _buildMenuSection(
            context,
            'Business',
            [
              // This will show different UI based on seller status
              _buildSellerMenuItem(context),
            ],
          ),

          const SizedBox(height: 16),

          _buildMenuSection(
            context,
            'Settings',
            [
              _buildMenuItem(
                context,
                icon: Icons.settings,
                title: 'Settings',
                subtitle: 'Privacy, theme, notifications',
                onTap: () => context.push('/profile/settings'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildUserHeader() {
    // Your existing profile header code
    return const Placeholder(fallbackHeight: 200);
  }

  Widget _buildMenuSection(BuildContext context, String title, List<Widget> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 16, bottom: 8),
          child: Text(
            title,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: Colors.grey,
                  fontWeight: FontWeight.w600,
                ),
          ),
        ),
        Card(
          child: Column(children: items),
        ),
      ],
    );
  }

  Widget _buildMenuItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    Widget? trailing,
  }) {
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: Theme.of(context).primaryColor.withOpacity(0.1),
        child: Icon(icon, color: Theme.of(context).primaryColor),
      ),
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: trailing ?? const Icon(Icons.arrow_forward_ios, size: 16),
      onTap: onTap,
    );
  }

  Widget _buildUnreadBadge(int count) {
    if (count == 0) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.red,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        count > 99 ? '99+' : '$count',
        style: const TextStyle(
          color: Colors.white,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildSellerMenuItem(BuildContext context) {
    // You can use SellerApplicationProvider to check status
    // For now, showing static example
    return _buildMenuItem(
      context,
      icon: Icons.store,
      title: 'Become a Seller',
      subtitle: 'Start selling on Mixillo',
      onTap: () => context.push('/profile/seller/apply'),
    );
  }
}

// Router Configuration Example
// Add these routes to your go_router configuration:
/*
GoRoute(
  path: '/profile/settings',
  builder: (context, state) => const SettingsScreen(),
),
GoRoute(
  path: '/profile/inbox',
  builder: (context, state) => const InboxScreen(),
),
GoRoute(
  path: '/profile/activity',
  builder: (context, state) => const ActivityScreen(),
),
GoRoute(
  path: '/profile/wallet',
  builder: (context, state) => const WalletScreen(),
),
GoRoute(
  path: '/profile/saved',
  builder: (context, state) => const SavedContentScreen(),
),
GoRoute(
  path: '/profile/liked',
  builder: (context, state) => const LikedContentScreen(),
),
GoRoute(
  path: '/profile/seller/apply',
  builder: (context, state) => const SellerApplicationScreen(),
),
*/

// Main.dart Socket Initialization Example
/*
void main() {
  runApp(const ProviderScope(child: MyApp()));
  
  // Initialize Socket.IO connection after app starts
  WidgetsBinding.instance.addPostFrameCallback((_) {
    SocketService().connect();
  });
}
*/
