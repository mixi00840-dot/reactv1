import 'package:flutter/material.dart';
import 'app_colors.dart';

/// Shadow System - Premium elevation and depth
class AppShadows {
  // Light theme shadows
  static List<BoxShadow> get none => [];
  
  static List<BoxShadow> get sm => [
    BoxShadow(
      color: AppColors.shadowLight,
      blurRadius: 4,
      offset: const Offset(0, 1),
      spreadRadius: 0,
    ),
  ];
  
  static List<BoxShadow> get md => [
    BoxShadow(
      color: AppColors.shadowLight,
      blurRadius: 8,
      offset: const Offset(0, 2),
      spreadRadius: 0,
    ),
  ];
  
  static List<BoxShadow> get lg => [
    BoxShadow(
      color: AppColors.shadowMedium,
      blurRadius: 16,
      offset: const Offset(0, 4),
      spreadRadius: 0,
    ),
  ];
  
  static List<BoxShadow> get xl => [
    BoxShadow(
      color: AppColors.shadowMedium,
      blurRadius: 24,
      offset: const Offset(0, 8),
      spreadRadius: 0,
    ),
  ];
  
  static List<BoxShadow> get xxl => [
    BoxShadow(
      color: AppColors.shadowDark,
      blurRadius: 32,
      offset: const Offset(0, 12),
      spreadRadius: 0,
    ),
  ];
  
  // Card shadows
  static List<BoxShadow> get card => [
    BoxShadow(
      color: AppColors.shadowLight,
      blurRadius: 8,
      offset: const Offset(0, 2),
      spreadRadius: 0,
    ),
  ];
  
  static List<BoxShadow> get cardHover => [
    BoxShadow(
      color: AppColors.shadowMedium,
      blurRadius: 16,
      offset: const Offset(0, 4),
      spreadRadius: 0,
    ),
  ];
  
  // Button shadows
  static List<BoxShadow> get button => [
    BoxShadow(
      color: AppColors.shadowLight,
      blurRadius: 4,
      offset: const Offset(0, 2),
      spreadRadius: 0,
    ),
  ];
  
  static List<BoxShadow> get buttonPressed => [
    BoxShadow(
      color: AppColors.shadowLight,
      blurRadius: 2,
      offset: const Offset(0, 1),
      spreadRadius: 0,
    ),
  ];
  
  // App bar shadow
  static List<BoxShadow> get appBar => [
    BoxShadow(
      color: AppColors.shadowLight,
      blurRadius: 8,
      offset: const Offset(0, 2),
      spreadRadius: 0,
    ),
  ];
  
  // Bottom navigation shadow
  static List<BoxShadow> get bottomNav => [
    BoxShadow(
      color: AppColors.shadowMedium,
      blurRadius: 16,
      offset: const Offset(0, -4),
      spreadRadius: 0,
    ),
  ];
  
  // Modal shadow
  static List<BoxShadow> get modal => [
    BoxShadow(
      color: AppColors.shadowDark,
      blurRadius: 32,
      offset: const Offset(0, 16),
      spreadRadius: 0,
    ),
  ];
  
  // Floating action button shadow
  static List<BoxShadow> get fab => [
    BoxShadow(
      color: AppColors.shadowMedium,
      blurRadius: 12,
      offset: const Offset(0, 4),
      spreadRadius: 0,
    ),
  ];
  
  // Video player controls shadow
  static List<BoxShadow> get videoControls => [
    BoxShadow(
      color: AppColors.darkOverlay,
      blurRadius: 8,
      offset: const Offset(0, -2),
      spreadRadius: 0,
    ),
  ];
  
  // Custom shadow
  static List<BoxShadow> custom({
    required Color color,
    required double blurRadius,
    required Offset offset,
    double spreadRadius = 0,
  }) {
    return [
      BoxShadow(
        color: color,
        blurRadius: blurRadius,
        offset: offset,
        spreadRadius: spreadRadius,
      ),
    ];
  }
}

