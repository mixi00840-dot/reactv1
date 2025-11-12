import 'package:flutter/material.dart';
import 'package:iconsax/iconsax.dart';
import '../theme/app_colors.dart';
import '../theme/app_gradients.dart';
import '../theme/app_shadows.dart';
import '../theme/app_theme.dart';
import 'dart:ui';

/// Custom TikTok-style bottom navigation bar with center button
class CustomBottomNav extends StatelessWidget {
  final int currentIndex;
  final Function(int) onTap;

  const CustomBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 80,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: const [
            Colors.transparent,
          ]
              .followedBy([
            AppColors.background.withValues(alpha: 0.95),
          ]).toList(),
        ),
      ),
      child: ClipRRect(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.glassLight,
                  AppColors.glassDark,
                ],
              ),
              border: Border(
                top: BorderSide(
                  color: AppColors.borderLight.withValues(alpha: 0.3),
                  width: 1,
                ),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(
                  icon: Iconsax.home,
                  activeIcon: Iconsax.home_1,
                  label: 'Home',
                  index: 0,
                ),
                _buildNavItem(
                  icon: Iconsax.search_normal,
                  activeIcon: Iconsax.search_normal_1,
                  label: 'Discover',
                  index: 1,
                ),
                _buildCenterButton(),
                _buildNavItem(
                  icon: Iconsax.shopping_bag,
                  activeIcon: Iconsax.shopping_cart,
                  label: 'Shop',
                  index: 3,
                ),
                _buildNavItem(
                  icon: Iconsax.user,
                  activeIcon: Iconsax.user_octagon,
                  label: 'Profile',
                  index: 4,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required IconData icon,
    required IconData activeIcon,
    required String label,
    required int index,
    int? badge,
  }) {
    final isActive = currentIndex == index;

    return GestureDetector(
      onTap: () => onTap(index),
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm,
          vertical: AppSpacing.xs,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              children: [
                Icon(
                  isActive ? activeIcon : icon,
                  color: isActive ? AppColors.primary : AppColors.textSecondary,
                  size: 28,
                ),
                if (badge != null && badge > 0)
                  Positioned(
                    right: 0,
                    top: 0,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        gradient: AppGradients.primary,
                        shape: BoxShape.circle,
                        boxShadow: AppShadows.neonPink,
                      ),
                      constraints: const BoxConstraints(
                        minWidth: 16,
                        minHeight: 16,
                      ),
                      child: Center(
                        child: Text(
                          badge > 99 ? '99+' : badge.toString(),
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 4),
            if (isActive)
              Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(
                  gradient: AppGradients.primary,
                  shape: BoxShape.circle,
                  boxShadow: AppShadows.neonPink,
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildCenterButton() {
    return GestureDetector(
      onTap: () => onTap(2),
      child: Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          gradient: AppGradients.primary,
          borderRadius: BorderRadius.circular(AppRadius.md),
          boxShadow: AppShadows.neonRainbow,
        ),
        child: Stack(
          children: [
            // Background layers for depth
            Center(
              child: Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: AppColors.softSkyBlue,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),
            Center(
              child: Container(
                width: 20,
                height: 20,
                margin: const EdgeInsets.only(left: 8),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),
            // Plus icon
            const Center(
              child: Icon(
                Icons.add,
                color: AppColors.textPrimary,
                size: 32,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
