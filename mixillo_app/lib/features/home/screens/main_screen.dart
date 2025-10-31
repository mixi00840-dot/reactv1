import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import 'video_feed_screen.dart';
import '../../search/screens/search_screen.dart';
import '../../upload/screens/upload_screen.dart';
import '../../shop/screens/shop_home_screen.dart';
import '../../messages/screens/messages_screen.dart';
import '../../profile/screens/profile_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  void _onUploadTap() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const UploadScreen(),
      ),
    );
  }

  void _onTabTap(int index) {
    if (index == 2) {
      // Upload - navigate to camera
      _onUploadTap();
    } else {
      setState(() {
        _currentIndex = index;
      });
    }
  }

  late final List<Widget> _screens = [
    const VideoFeedScreen(),
    const SearchScreen(),
    Container(), // Upload - handled by navigation
    const ShopHomeScreen(),
    const MessagesScreen(),
    const ProfileScreen(), // Current user profile
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: _onTabTap,
          type: BottomNavigationBarType.fixed,
          selectedItemColor: AppColors.primary,
          unselectedItemColor: Colors.grey,
          showSelectedLabels: true,
          showUnselectedLabels: true,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.search_outlined),
              activeIcon: Icon(Icons.search),
              label: 'Search',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.add_circle_outline),
              activeIcon: Icon(Icons.add_circle),
              label: 'Upload',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.shopping_bag_outlined),
              activeIcon: Icon(Icons.shopping_bag),
              label: 'Shop',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.chat_bubble_outline),
              activeIcon: Icon(Icons.chat_bubble),
              label: 'Messages',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}
