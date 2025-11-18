import 'package:flutter/material.dart';
import '../../../../core/models/supporter_badge_model.dart';
import '../../../../core/theme/app_colors.dart';

/// Single badge item widget
class BadgeItem extends StatelessWidget {
  final SupporterBadgeModel badge;
  final bool isEarned;
  final VoidCallback onTap;

  const BadgeItem({
    super.key,
    required this.badge,
    required this.isEarned,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = _getBadgeColor(badge.rarity);
    return Card(
      elevation: isEarned ? 4 : 1,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            gradient: isEarned
                ? LinearGradient(
                    colors: [
                      color.withOpacity(0.2),
                      color.withOpacity(0.05),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  )
                : null,
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Badge icon
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: isEarned ? color.withOpacity(0.2) : Colors.grey.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: Stack(
                  children: [
                    Center(
                      child: Icon(
                        Icons.military_tech,
                        size: 50,
                        color: isEarned ? color : Colors.grey,
                      ),
                    ),
                    if (isEarned)
                      Positioned(
                        top: 0,
                        right: 0,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Colors.green,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.check,
                            size: 12,
                            color: Colors.white,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              // Badge name
              Text(
                badge.name,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: isEarned ? AppColors.textPrimary : AppColors.textSecondary,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 4),
              // Badge rarity
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: isEarned ? color.withOpacity(0.1) : Colors.grey.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  badge.rarity.name.toUpperCase(),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: isEarned ? color : Colors.grey,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getBadgeColor(BadgeRarity rarity) {
    switch (rarity) {
      case BadgeRarity.common:
        return Colors.blueGrey;
      case BadgeRarity.uncommon:
        return Colors.teal;
      case BadgeRarity.rare:
        return Colors.deepPurple;
      case BadgeRarity.epic:
        return Colors.purpleAccent;
      case BadgeRarity.legendary:
        return Colors.amber;
    }
    return Colors.blueGrey; // Fallback
  }
}
