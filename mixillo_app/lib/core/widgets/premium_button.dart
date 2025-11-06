import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';
import '../theme/app_shadows.dart';

/// Premium Button Component - TikTok/Instagram Level
/// Supports multiple variants and states
class PremiumButton extends StatefulWidget {
  final String text;
  final VoidCallback? onPressed;
  final ButtonVariant variant;
  final ButtonSize size;
  final IconData? icon;
  final bool isLoading;
  final bool isFullWidth;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final double? width;
  final Widget? child;

  const PremiumButton({
    super.key,
    required this.text,
    this.onPressed,
    this.variant = ButtonVariant.primary,
    this.size = ButtonSize.medium,
    this.icon,
    this.isLoading = false,
    this.isFullWidth = false,
    this.backgroundColor,
    this.foregroundColor,
    this.width,
    this.child,
  });

  @override
  State<PremiumButton> createState() => _PremiumButtonState();
}

class _PremiumButtonState extends State<PremiumButton> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails details) {
    _controller.forward();
  }

  void _handleTapUp(TapUpDetails details) {
    _controller.reverse();
  }

  void _handleTapCancel() {
    _controller.reverse();
  }

  @override
  Widget build(BuildContext context) {
    final isDisabled = widget.onPressed == null || widget.isLoading;
    
    return GestureDetector(
      onTapDown: isDisabled ? null : _handleTapDown,
      onTapUp: isDisabled ? null : _handleTapUp,
      onTapCancel: isDisabled ? null : _handleTapCancel,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: _buildButton(context, isDisabled),
      ),
    );
  }

  Widget _buildButton(BuildContext context, bool isDisabled) {
    final height = _getHeight();
    final padding = _getPadding();
    final textStyle = _getTextStyle(context);
    final colors = _getColors(context, isDisabled);

    Widget content = widget.child ?? Row(
      mainAxisSize: widget.isFullWidth ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (widget.isLoading)
          SizedBox(
            width: _getIconSize(),
            height: _getIconSize(),
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(colors.foreground),
            ),
          )
        else if (widget.icon != null)
          Icon(widget.icon, size: _getIconSize(), color: colors.foreground),
        if ((widget.icon != null || widget.isLoading) && widget.text.isNotEmpty)
          SizedBox(width: AppSpacing.sm),
        if (widget.text.isNotEmpty)
          Flexible(
            child: Text(
              widget.text,
              style: textStyle.copyWith(color: colors.foreground),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
      ],
    );

    final button = Container(
      width: widget.isFullWidth ? double.infinity : widget.width,
      height: height,
      padding: padding,
      decoration: BoxDecoration(
        color: colors.background,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: widget.variant == ButtonVariant.outlined
            ? Border.all(color: colors.border, width: 1.5)
            : null,
        gradient: widget.variant == ButtonVariant.gradient
            ? AppColors.primaryGradient
            : null,
        boxShadow: isDisabled ? [] : AppShadows.button,
      ),
      child: content,
    );

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: isDisabled ? null : widget.onPressed,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        child: button,
      ),
    );
  }

  double _getHeight() {
    switch (widget.size) {
      case ButtonSize.small:
        return AppSpacing.buttonHeightSm;
      case ButtonSize.medium:
        return AppSpacing.buttonHeightMd;
      case ButtonSize.large:
        return AppSpacing.buttonHeightLg;
    }
  }

  EdgeInsets _getPadding() {
    switch (widget.size) {
      case ButtonSize.small:
        return AppSpacing.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm);
      case ButtonSize.medium:
        return AppSpacing.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.md);
      case ButtonSize.large:
        return AppSpacing.symmetric(horizontal: AppSpacing.xl, vertical: AppSpacing.lg);
    }
  }

  double _getIconSize() {
    switch (widget.size) {
      case ButtonSize.small:
        return AppSpacing.iconSm;
      case ButtonSize.medium:
        return AppSpacing.iconMd;
      case ButtonSize.large:
        return AppSpacing.iconLg;
    }
  }

  TextStyle _getTextStyle(BuildContext context) {
    switch (widget.size) {
      case ButtonSize.small:
        return AppTypography.buttonSmall(context);
      case ButtonSize.medium:
        return AppTypography.button(context);
      case ButtonSize.large:
        return AppTypography.button(context).copyWith(fontSize: 18);
    }
  }

  _ButtonColors _getColors(BuildContext context, bool isDisabled) {
    if (isDisabled) {
      return _ButtonColors(
        background: AppColors.interactiveDisabled,
        foreground: AppColors.lightTextDisabled,
        border: AppColors.lightBorder,
      );
    }

    switch (widget.variant) {
      case ButtonVariant.primary:
        return _ButtonColors(
          background: widget.backgroundColor ?? AppColors.primary,
          foreground: widget.foregroundColor ?? Colors.white,
          border: widget.backgroundColor ?? AppColors.primary,
        );
      case ButtonVariant.secondary:
        return _ButtonColors(
          background: widget.backgroundColor ?? AppColors.secondary,
          foreground: widget.foregroundColor ?? Colors.white,
          border: widget.backgroundColor ?? AppColors.secondary,
        );
      case ButtonVariant.outlined:
        return _ButtonColors(
          background: Colors.transparent,
          foreground: widget.foregroundColor ?? AppColors.primary,
          border: widget.backgroundColor ?? AppColors.primary,
        );
      case ButtonVariant.text:
        return _ButtonColors(
          background: Colors.transparent,
          foreground: widget.foregroundColor ?? AppColors.primary,
          border: Colors.transparent,
        );
      case ButtonVariant.gradient:
        return _ButtonColors(
          background: AppColors.primary,
          foreground: Colors.white,
          border: AppColors.primary,
        );
      case ButtonVariant.danger:
        return _ButtonColors(
          background: AppColors.error,
          foreground: Colors.white,
          border: AppColors.error,
        );
      case ButtonVariant.success:
        return _ButtonColors(
          background: AppColors.success,
          foreground: Colors.white,
          border: AppColors.success,
        );
    }
  }
}

class _ButtonColors {
  final Color background;
  final Color foreground;
  final Color border;

  _ButtonColors({
    required this.background,
    required this.foreground,
    required this.border,
  });
}

enum ButtonVariant {
  primary,
  secondary,
  outlined,
  text,
  gradient,
  danger,
  success,
}

enum ButtonSize {
  small,
  medium,
  large,
}

/// Icon Button Variant
class PremiumIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onPressed;
  final Color? backgroundColor;
  final Color? iconColor;
  final double size;
  final String? tooltip;

  const PremiumIconButton({
    super.key,
    required this.icon,
    this.onPressed,
    this.backgroundColor,
    this.iconColor,
    this.size = AppSpacing.buttonHeightSm,
    this.tooltip,
  });

  @override
  Widget build(BuildContext context) {
    final button = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: backgroundColor ?? AppColors.getSurfaceColor(context),
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        boxShadow: AppShadows.sm,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
          child: Icon(
            icon,
            size: AppSpacing.iconMd,
            color: iconColor ?? AppColors.getTextColor(context),
          ),
        ),
      ),
    );

    if (tooltip != null) {
      return Tooltip(
        message: tooltip!,
        child: button,
      );
    }

    return button;
  }
}

