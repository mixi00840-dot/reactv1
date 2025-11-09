import 'package:flutter/material.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/theme/app_typography.dart';
import 'feed_screen.dart';
import '../../search/screens/search_screen.dart';
import '../../upload/screens/upload_screen.dart';
import '../../shop/screens/shop_home_screen_new.dart';
import '../../messages/screens/messages_screen.dart';
import '../../profile/screens/profile_screen.dart' show ProfileScreenNew;

/// Main App Screen - TikTok/Instagram style bottom navigation
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
        fullscreenDialog: true,
      ),
    );
  }

  void _onTabTap(int index) {
    if (index == 2) {
      // Upload - navigate to camera in full screen
      _onUploadTap();
    } else {
      setState(() {
        _currentIndex = index;
      });
    }
  }

  late final List<Widget> _screens = [
    const FeedScreen(), // New TikTok-style feed
    const SearchScreen(),
    Container(), // Upload - handled by navigation
    const ShopHomeScreenNew(),
    const MessagesScreen(),
    const ProfileScreenNew(), // Current user profile
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: _buildBottomNav(isDark), // Always show bottom nav
    );
  }

  Widget _buildBottomNav(bool isDark) {
    return Container(
      height: DesignTokens.bottomNavHeight,
      decoration: BoxDecoration(
        color: (isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface).withOpacity(0.95),
        border: Border(
          top: BorderSide(
            color: isDark ? DesignTokens.darkBorder : DesignTokens.lightBorder,
            width: 0.5,
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildNavItem(
              icon: Icons.home_outlined,
              activeIcon: Icons.home,
              label: 'Home',
              index: 0,
              isDark: isDark,
            ),
            _buildNavItem(
              icon: Icons.search_outlined,
              activeIcon: Icons.search,
              label: 'Search',
              index: 1,
              isDark: isDark,
            ),
            _buildUploadButton(isDark),
            _buildNavItem(
              icon: Icons.shopping_bag_outlined,
              activeIcon: Icons.shopping_bag,
              label: 'Shop',
              index: 3,
              isDark: isDark,
            ),
            _buildNavItem(
              icon: Icons.chat_bubble_outline,
              activeIcon: Icons.chat_bubble,
              label: 'Messages',
              index: 4,
              isDark: isDark,
            ),
            _buildNavItem(
              icon: Icons.person_outline,
              activeIcon: Icons.person,
              label: 'Profile',
              index: 5,
              isDark: isDark,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required IconData icon,
    required IconData activeIcon,
    required String label,
    required int index,
    required bool isDark,
  }) {
    final isActive = _currentIndex == index;
    final color = isActive
        ? DesignTokens.brandPrimary
        : (isDark ? DesignTokens.darkTextSecondary : DesignTokens.lightTextSecondary);

    return GestureDetector(
      onTap: () => _onTabTap(index),
      behavior: HitTestBehavior.opaque,
      child: Container(
        width: 60,
        padding: const EdgeInsets.symmetric(vertical: DesignTokens.space2),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isActive ? activeIcon : icon,
              color: color,
              size: DesignTokens.iconLg,
            ),
            const SizedBox(height: DesignTokens.space1),
            Text(
              label,
              style: AppTypography.labelSmall(context).copyWith(
                color: color,
                fontWeight: isActive
                    ? DesignTokens.fontWeightSemiBold
                    : DesignTokens.fontWeightRegular,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUploadButton(bool isDark) {
    return GestureDetector(
      onTap: _onUploadTap,
      child: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: DesignTokens.brandGradient,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(DesignTokens.radiusLg),
          boxShadow: [
            BoxShadow(
              color: DesignTokens.brandPrimary.withOpacity(0.3),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: const Icon(
          Icons.add,
          color: DesignTokens.darkTextPrimary,
          size: 28,
        ),
      ),
    );
  }
}
