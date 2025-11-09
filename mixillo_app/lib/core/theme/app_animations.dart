import 'package:flutter/material.dart';
import 'design_tokens.dart';

/// Animation System - Premium transitions matching TikTok/Instagram quality
/// Now powered by DesignTokens for consistency
class AppAnimations {
  // ========== DURATIONS (from DesignTokens) ==========
  static const Duration instant = DesignTokens.durationInstant;
  static const Duration fast = DesignTokens.durationFast;
  static const Duration normal = DesignTokens.durationNormal;
  static const Duration slow = DesignTokens.durationSlow;
  static const Duration slower = DesignTokens.durationSlower;
  
  // ========== CURVES (iOS-like, from DesignTokens) ==========
  static const Curve standard = DesignTokens.curveStandard;
  static const Curve decelerate = DesignTokens.curveDecelerate;
  static const Curve accelerate = DesignTokens.curveAccelerate;
  static const Curve spring = DesignTokens.curveSpring;
  static const Curve bounce = Curves.bounceOut;
  static const Curve elastic = Curves.elasticOut;
  
  // ========== PAGE TRANSITIONS ==========
  
  /// Slide transition (right to left)
  static Route<T> slideRoute<T extends Object?>(Widget page) {
    return PageRouteBuilder<T>(
      pageBuilder: (context, animation, secondaryAnimation) => page,
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        const begin = Offset(1.0, 0.0);
        const end = Offset.zero;
        const curve = Curves.ease;

        var tween = Tween(begin: begin, end: end).chain(
          CurveTween(curve: curve),
        );

        return SlideTransition(
          position: animation.drive(tween),
          child: child,
        );
      },
      transitionDuration: normal,
    );
  }
  
  /// Fade transition
  static Route<T> fadeRoute<T extends Object?>(Widget page) {
    return PageRouteBuilder<T>(
      pageBuilder: (context, animation, secondaryAnimation) => page,
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        return FadeTransition(
          opacity: animation,
          child: child,
        );
      },
      transitionDuration: normal,
    );
  }
  
  /// Scale transition
  static Route<T> scaleRoute<T extends Object?>(Widget page) {
    return PageRouteBuilder<T>(
      pageBuilder: (context, animation, secondaryAnimation) => page,
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        return ScaleTransition(
          scale: Tween<double>(begin: 0.0, end: 1.0).animate(
            CurvedAnimation(parent: animation, curve: Curves.easeOut),
          ),
          child: FadeTransition(
            opacity: animation,
            child: child,
          ),
        );
      },
      transitionDuration: normal,
    );
  }
  
  // ========== ANIMATION BUILDERS ==========
  
  /// Fade in animation
  static Widget fadeIn({
    required Widget child,
    Duration duration = normal,
    Curve curve = standard,
  }) {
    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: 0.0, end: 1.0),
      duration: duration,
      curve: curve,
      builder: (context, value, child) {
        return Opacity(
          opacity: value,
          child: child,
        );
      },
      child: child,
    );
  }
  
  /// Slide in animation
  static Widget slideIn({
    required Widget child,
    Offset begin = const Offset(0, 0.1),
    Offset end = Offset.zero,
    Duration duration = normal,
    Curve curve = standard,
  }) {
    return TweenAnimationBuilder<Offset>(
      tween: Tween<Offset>(begin: begin, end: end),
      duration: duration,
      curve: curve,
      builder: (context, value, child) {
        return Transform.translate(
          offset: value,
          child: child,
        );
      },
      child: child,
    );
  }
  
  /// Scale animation
  static Widget scaleIn({
    required Widget child,
    double begin = 0.8,
    double end = 1.0,
    Duration duration = normal,
    Curve curve = standard,
  }) {
    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: begin, end: end),
      duration: duration,
      curve: curve,
      builder: (context, value, child) {
        return Transform.scale(
          scale: value,
          child: child,
        );
      },
      child: child,
    );
  }
  
  /// Rotation animation
  static Widget rotate({
    required Widget child,
    double begin = 0.0,
    double end = 1.0,
    Duration duration = normal,
    Curve curve = standard,
  }) {
    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: begin, end: end),
      duration: duration,
      curve: curve,
      builder: (context, value, child) {
        return Transform.rotate(
          angle: value * 2 * 3.14159,
          child: child,
        );
      },
      child: child,
    );
  }
  
  // ========== STAGGERED ANIMATIONS ==========
  
  /// Staggered fade in for lists
  static Widget staggeredFadeIn({
    required List<Widget> children,
    Duration delay = const Duration(milliseconds: 50),
    Duration duration = normal,
  }) {
    return Column(
      children: children.asMap().entries.map((entry) {
        final index = entry.key;
        final child = entry.value;
        return TweenAnimationBuilder<double>(
          tween: Tween<double>(begin: 0.0, end: 1.0),
          duration: duration + (delay * index),
          curve: standard,
          builder: (context, value, child) {
            return Opacity(
              opacity: value,
              child: Transform.translate(
                offset: Offset(0, 20 * (1 - value)),
                child: child,
              ),
            );
          },
          child: child,
        );
      }).toList(),
    );
  }
  
  // ========== HERO ANIMATIONS ==========
  
  /// Hero widget with custom tag
  static Widget hero({
    required String tag,
    required Widget child,
  }) {
    return Hero(
      tag: tag,
      child: child,
      flightShuttleBuilder: (
        BuildContext flightContext,
        Animation<double> animation,
        HeroFlightDirection flightDirection,
        BuildContext fromHeroContext,
        BuildContext toHeroContext,
      ) {
        return FadeTransition(
          opacity: animation,
          child: child,
        );
      },
    );
  }
  
  // ========== LOADING ANIMATIONS ==========
  
  /// Shimmer loading effect
  static Widget shimmer({
    required Widget child,
    Color? baseColor,
    Color? highlightColor,
  }) {
    // This would typically use the shimmer package
    // For now, return the child
    return child;
  }
  
  // ========== INTERACTIVE ANIMATIONS ==========
  
  /// Bounce animation on tap
  static Widget bounceOnTap({
    required Widget child,
    required VoidCallback onTap,
    double scale = 0.95,
    Duration duration = fast,
  }) {
    return GestureDetector(
      onTapDown: (_) {
        // Animation handled by parent
      },
      onTap: onTap,
      child: child,
    );
  }
  
  /// Pulse animation
  static Widget pulse({
    required Widget child,
    Duration duration = const Duration(milliseconds: 1000),
    bool repeat = true,
  }) {
    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: 1.0, end: 1.1),
      duration: duration,
      curve: Curves.easeInOut,
      builder: (context, value, child) {
        return Transform.scale(
          scale: value,
          child: child,
        );
      },
      onEnd: repeat ? () {
        // Restart animation
      } : null,
      child: child,
    );
  }
}

/// Animation Controller Helper
class AnimationHelper {
  static AnimationController createController({
    required TickerProvider vsync,
    Duration duration = AppAnimations.normal,
    Duration? reverseDuration,
  }) {
    return AnimationController(
      vsync: vsync,
      duration: duration,
      reverseDuration: reverseDuration,
    );
  }
  
  static Animation<double> createTween({
    required AnimationController controller,
    double begin = 0.0,
    double end = 1.0,
    Curve curve = AppAnimations.standard,
  }) {
    return Tween<double>(begin: begin, end: end).animate(
      CurvedAnimation(parent: controller, curve: curve),
    );
  }
}

