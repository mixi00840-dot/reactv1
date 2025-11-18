import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/providers/auth_provider.dart';
import '../../../../core/routing/app_routes.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userState = ref.watch(currentUserProvider);

    return Scaffold(
      body: userState.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(child: Text('Error: $error')),
        data: (user) {
          if (user == null) {
            return const Center(child: Text('Not logged in'));
          }

          return CustomScrollView(
            slivers: [
              // App bar with cover photo
              SliverAppBar(
                expandedHeight: 200,
                pinned: true,
                flexibleSpace: FlexibleSpaceBar(
                  background: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.blue.shade400, Colors.purple.shade600],
                      ),
                    ),
                  ),
                ),
                actions: [
                  IconButton(
                    icon: const Icon(Icons.settings),
                    onPressed: () => context.push(AppRoutes.settings),
                  ),
                ],
              ),

              // Profile info
              SliverToBoxAdapter(
                child: Transform.translate(
                  offset: const Offset(0, -50),
                  child: Column(
                    children: [
                      // Avatar
                      CircleAvatar(
                        radius: 50,
                        backgroundColor: Colors.white,
                        child: CircleAvatar(
                          radius: 46,
                          backgroundColor: Colors.grey.shade300,
                          child: Text(
                            user.username[0].toUpperCase(),
                            style: const TextStyle(fontSize: 32),
                          ),
                        ),
                      ),

                      const SizedBox(height: 12),

                      // Name & username
                      Text(
                        user.fullName ?? user.username,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        '@${user.username}',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade600,
                        ),
                      ),

                      const SizedBox(height: 16),

                      // Stats
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          _buildStat('0', 'Posts'),
                          _buildStat('0', 'Followers'),
                          _buildStat('0', 'Following'),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // Edit profile button
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: ElevatedButton(
                          onPressed: () => context.push(AppRoutes.editProfile),
                          style: ElevatedButton.styleFrom(
                            minimumSize: const Size(double.infinity, 44),
                          ),
                          child: const Text('Edit Profile'),
                        ),
                      ),

                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),

              // Menu items
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    _buildMenuItem(
                      context,
                      Icons.video_library,
                      'My Videos',
                      'View your uploaded videos',
                      () {},
                    ),
                    _buildMenuItem(
                      context,
                      Icons.schedule,
                      'Scheduled Posts',
                      'Manage scheduled content',
                      () => context.push(AppRoutes.scheduledPosts),
                    ),
                    _buildMenuItem(
                      context,
                      Icons.analytics,
                      'Analytics',
                      'View your performance',
                      () => context.push(AppRoutes.analytics),
                    ),
                    _buildMenuItem(
                      context,
                      Icons.wallet,
                      'Wallet',
                      'Manage your wallet',
                      () => context.push(AppRoutes.wallet),
                    ),
                    _buildMenuItem(
                      context,
                      Icons.shopping_bag,
                      'Orders',
                      'Track your orders',
                      () => context.push(AppRoutes.orders),
                    ),
                    _buildMenuItem(
                      context,
                      Icons.favorite,
                      'Wishlist',
                      'Your saved products',
                      () => context.push(AppRoutes.wishlist),
                    ),
                    _buildMenuItem(
                      context,
                      Icons.location_on,
                      'Addresses',
                      'Manage shipping addresses',
                      () => context.push(AppRoutes.addresses),
                    ),
                    _buildMenuItem(
                      context,
                      Icons.payment,
                      'Payment Methods',
                      'Manage payment methods',
                      () => context.push(AppRoutes.paymentMethods),
                    ),
                    _buildMenuItem(
                      context,
                      Icons.badge,
                      'Badges',
                      'Your achievements',
                      () => context.push(AppRoutes.badges),
                    ),
                    _buildMenuItem(
                      context,
                      Icons.help_outline,
                      'Help & FAQ',
                      'Get help',
                      () => context.push(AppRoutes.faq),
                    ),
                    const SizedBox(height: 16),
                    _buildMenuItem(
                      context,
                      Icons.logout,
                      'Logout',
                      'Sign out of your account',
                      () async {
                        await ref.read(currentUserProvider.notifier).logout();
                      },
                      isDestructive: true,
                    ),
                  ]),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildStat(String value, String label) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey.shade600,
          ),
        ),
      ],
    );
  }

  Widget _buildMenuItem(
    BuildContext context,
    IconData icon,
    String title,
    String subtitle,
    VoidCallback onTap, {
    bool isDestructive = false,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Icon(
          icon,
          color: isDestructive ? Colors.red : Colors.blue,
        ),
        title: Text(
          title,
          style: TextStyle(
            color: isDestructive ? Colors.red : null,
            fontWeight: FontWeight.w500,
          ),
        ),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: onTap,
      ),
    );
  }
}
