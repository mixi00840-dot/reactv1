import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

/// SVG Icon Widget - Loads SVG from UI folder
class SvgIcon extends StatelessWidget {
  final String assetPath;
  final double? width;
  final double? height;
  final Color? color;
  final BoxFit fit;

  const SvgIcon({
    super.key,
    required this.assetPath,
    this.width,
    this.height,
    this.color,
    this.fit = BoxFit.contain,
  });

  @override
  Widget build(BuildContext context) {
    // Try to load from assets first, then from UI folder
    final path = assetPath.startsWith('assets/')
        ? assetPath
        : 'assets/ui/$assetPath';
    
    return SvgPicture.asset(
      path,
      width: width,
      height: height,
      colorFilter: color != null
          ? ColorFilter.mode(color!, BlendMode.srcIn)
          : null,
      fit: fit,
      placeholderBuilder: (context) => SizedBox(
        width: width ?? 24,
        height: height ?? 24,
        child: const CircularProgressIndicator(strokeWidth: 2),
      ),
    );
  }
}

/// SVG Icon Button
class SvgIconButton extends StatelessWidget {
  final String assetPath;
  final VoidCallback? onPressed;
  final double size;
  final Color? iconColor;
  final Color? backgroundColor;
  final String? tooltip;

  const SvgIconButton({
    super.key,
    required this.assetPath,
    this.onPressed,
    this.size = 24,
    this.iconColor,
    this.backgroundColor,
    this.tooltip,
  });

  @override
  Widget build(BuildContext context) {
    final button = Container(
      width: size + 16,
      height: size + 16,
      decoration: BoxDecoration(
        color: backgroundColor ?? Colors.transparent,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(8),
          child: Center(
            child: SvgIcon(
              assetPath: assetPath,
              width: size,
              height: size,
              color: iconColor,
            ),
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

