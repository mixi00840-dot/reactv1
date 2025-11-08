import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../theme/app_shadows.dart';

/// Premium Card Component - Modern, clean design
class PremiumCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets? padding;
  final EdgeInsets? margin;
  final Color? backgroundColor;
  final double? elevation;
  final BorderRadius? borderRadius;
  final VoidCallback? onTap;
  final bool showShadow;
  final Border? border;

  const PremiumCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.backgroundColor,
    this.elevation,
    this.borderRadius,
    this.onTap,
    this.showShadow = true,
    this.border,
  });

  @override
  Widget build(BuildContext context) {
    final card = Container(
      margin: margin ?? EdgeInsets.zero,
      padding: padding ?? AppSpacing.cardPadding as EdgeInsets,
      decoration: BoxDecoration(
        color: backgroundColor ?? AppColors.getCardColor(context),
        borderRadius: borderRadius ?? BorderRadius.circular(AppSpacing.radiusMd),
        border: border ?? Border.all(
          color: AppColors.getBorderColor(context),
          width: 0.5,
        ),
        boxShadow: showShadow ? AppShadows.card : [],
      ),
      child: child,
    );

    if (onTap != null) {
      return Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: borderRadius ?? BorderRadius.circular(AppSpacing.radiusMd),
          child: card,
        ),
      );
    }

    return card;
  }
}

/// Elevated Card with hover effect
class PremiumElevatedCard extends StatefulWidget {
  final Widget child;
  final EdgeInsets? padding;
  final EdgeInsets? margin;
  final Color? backgroundColor;
  final BorderRadius? borderRadius;
  final VoidCallback? onTap;

  const PremiumElevatedCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.backgroundColor,
    this.borderRadius,
    this.onTap,
  });

  @override
  State<PremiumElevatedCard> createState() => _PremiumElevatedCardState();
}

class _PremiumElevatedCardState extends State<PremiumElevatedCard> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeInOut,
        margin: widget.margin ?? EdgeInsets.zero,
        padding: widget.padding ?? AppSpacing.cardPadding as EdgeInsets,
        decoration: BoxDecoration(
          color: widget.backgroundColor ?? AppColors.getCardColor(context),
          borderRadius: widget.borderRadius ?? BorderRadius.circular(AppSpacing.radiusMd),
          border: Border.all(
            color: AppColors.getBorderColor(context),
            width: 0.5,
          ),
          boxShadow: _isHovered ? AppShadows.cardHover : AppShadows.card,
        ),
        child: widget.onTap != null
            ? Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: widget.onTap,
                  borderRadius: widget.borderRadius ?? BorderRadius.circular(AppSpacing.radiusMd),
                  child: widget.child,
                ),
              )
            : widget.child,
      ),
    );
  }
}

