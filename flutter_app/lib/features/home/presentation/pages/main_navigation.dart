import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/routing/app_routes.dart';

class MainNavigation extends ConsumerStatefulWidget {
  final Widget child;

  const MainNavigation({
    super.key,
    required this.child,
  });

  @override
  ConsumerState<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends ConsumerState<MainNavigation> {
  int _currentIndex = 0;

  final List<NavigationItem> _navigationItems = [
    NavigationItem(
      icon: Icons.home_outlined,
      selectedIcon: Icons.home,
      label: 'Home',
      route: AppRoutes.home,
    ),
    NavigationItem(
      icon: Icons.explore_outlined,
      selectedIcon: Icons.explore,
      label: 'Explore',
      route: AppRoutes.explore,
    ),
    NavigationItem(
      icon: Icons.add_circle_outline,
      selectedIcon: Icons.add_circle,
      label: 'Create',
      route: '', // Special handling for create
    ),
    NavigationItem(
      icon: Icons.message_outlined,
      selectedIcon: Icons.message,
      label: 'Messages',
      route: AppRoutes.messages,
    ),
    NavigationItem(
      icon: Icons.person_outline,
      selectedIcon: Icons.person,
      label: 'Profile',
      route: AppRoutes.profile,
    ),
  ];

  void _onItemTapped(int index) {
    // Special handling for create button
    if (index == 2) {
      _showCreateBottomSheet();
      return;
    }

    setState(() {
      _currentIndex = index;
    });

    context.go(_navigationItems[index].route);
  }

  void _showCreateBottomSheet() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.videocam, color: Colors.blue),
              title: const Text('Create Video'),
              subtitle: const Text('Record or upload a video'),
              onTap: () {
                Navigator.pop(context);
                // Navigate to video creation
              },
            ),
            ListTile(
              leading: const Icon(Icons.live_tv, color: Colors.red),
              title: const Text('Go Live'),
              subtitle: const Text('Start a live stream'),
              onTap: () {
                Navigator.pop(context);
                context.push(AppRoutes.startLive);
              },
            ),
            ListTile(
              leading: const Icon(Icons.post_add, color: Colors.green),
              title: const Text('Create Post'),
              subtitle: const Text('Share a photo or text'),
              onTap: () {
                Navigator.pop(context);
                // Navigate to post creation
              },
            ),
            ListTile(
              leading: const Icon(Icons.schedule, color: Colors.orange),
              title: const Text('Schedule Content'),
              subtitle: const Text('Schedule a post for later'),
              onTap: () {
                Navigator.pop(context);
                context.push(AppRoutes.schedulePost);
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Update current index based on current location
    final location = GoRouterState.of(context).uri.path;
    for (int i = 0; i < _navigationItems.length; i++) {
      if (_navigationItems[i].route == location) {
        _currentIndex = i;
        break;
      }
    }

    return Scaffold(
      body: widget.child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: _onItemTapped,
        type: BottomNavigationBarType.fixed,
        selectedItemColor: Theme.of(context).primaryColor,
        unselectedItemColor: Colors.grey,
        items: _navigationItems.map((item) {
          final isSelected = _navigationItems[_currentIndex] == item;
          return BottomNavigationBarItem(
            icon: Icon(item.icon),
            activeIcon: Icon(item.selectedIcon),
            label: item.label,
          );
        }).toList(),
      ),
    );
  }
}

class NavigationItem {
  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final String route;

  NavigationItem({
    required this.icon,
    required this.selectedIcon,
    required this.label,
    required this.route,
  });
}
