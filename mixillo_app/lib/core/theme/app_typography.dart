import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

/// Typography System - Premium font system
/// Uses Poppins as primary font (modern, clean, readable)
class AppTypography {
  // Font families
  static String get primaryFont => 'Poppins';
  static String get secondaryFont => 'Inter';
  static String get monoFont => 'RobotoMono';
  
  // Font weights
  static const FontWeight light = FontWeight.w300;
  static const FontWeight regular = FontWeight.w400;
  static const FontWeight medium = FontWeight.w500;
  static const FontWeight semiBold = FontWeight.w600;
  static const FontWeight bold = FontWeight.w700;
  static const FontWeight extraBold = FontWeight.w800;
  
  // ========== DISPLAY TEXT ==========
  static TextStyle displayLarge(BuildContext context) {
    return GoogleFonts.poppins(
      fontSize: 32,
      fontWeight: bold,
      letterSpacing: -0.5,
      height: 1.2,
      color: AppColors.getTextColor(context),
    );
  }
  
  static TextStyle displayMedium(BuildContext context) {
    return GoogleFonts.poppins(
      fontSize: 28,
      fontWeight: bold,
      letterSpacing: -0.5,
      height: 1.2,
      color: AppColors.getTextColor(context),
    );
  }
  
  static TextStyle displaySmall(BuildContext context) {
    return GoogleFonts.poppins(
      fontSize: 24,
      fontWeight: bold,
      letterSpacing: -0.25,
      height: 1.3,
      color: AppColors.getTextColor(context),
    );
  }
  
  // ========== HEADLINE TEXT ==========
  static TextStyle headlineLarge(BuildContext context) {
    return GoogleFonts.poppins(
      fontSize: 22,
      fontWeight: semiBold,
      letterSpacing: -0.25,
      height: 1.3,
      color: AppColors.getTextColor(context),
    );
  }
  
  static TextStyle headlineMedium(BuildContext context) {
    return GoogleFonts.poppins(
      fontSize: 20,
      fontWeight: semiBold,
      letterSpacing: -0.25,
      height: 1.3,
      color: AppColors.getTextColor(context),
    );
  }
  
  static TextStyle headlineSmall(BuildContext context) {
    return GoogleFonts.poppins(
      fontSize: 18,
      fontWeight: semiBold,
      letterSpacing: 0,
      height: 1.4,
      color: AppColors.getTextColor(context),
    );
  }
  
  // ========== TITLE TEXT ==========
  static TextStyle titleLarge(BuildContext context) {
    return GoogleFonts.poppins(
      fontSize: 16,
      fontWeight: semiBold,
      letterSpacing: 0,
      height: 1.4,
      color: AppColors.getTextColor(context),
    );
  }
  
  static TextStyle titleMedium(BuildContext context) {
    return GoogleFonts.poppins(
      fontSize: 14,
      fontWeight: medium,
      letterSpacing: 0.1,
      height: 1.4,
      color: AppColors.getTextColor(context),
    );
  }
  
  static TextStyle titleSmall(BuildContext context) {
    return GoogleFonts.poppins(
      fontSize: 12,
      fontWeight: medium,
      letterSpacing: 0.1,
      height: 1.4,
      color: AppColors.getTextColor(context),
    );
  }
  
  // ========== BODY TEXT ==========
  static TextStyle bodyLarge(BuildContext context) {
    return GoogleFonts.poppins(
      fontSize: 16,
      fontWeight: regular,
      letterSpacing: 0.15,
      height: 1.5,
      color: AppColors.getTextColor(context),
    );
  }
  
  static TextStyle bodyMedium(BuildContext context) {
    return GoogleFonts.poppins(
      fontSize: 14,
      fontWeight: regular,
      letterSpacing: 0.15,
      height: 1.5,
      color: AppColors.getTextColor(context),
    );
  }
  
  static TextStyle bodySmall(BuildContext context) {
    return GoogleFonts.poppins(
      fontSize: 12,
      fontWeight: regular,
      letterSpacing: 0.15,
      height: 1.5,
      color: AppColors.getSecondaryTextColor(context),
    );
  }
  
  // ========== LABEL TEXT ==========
  static TextStyle labelLarge(BuildContext context) {
    return GoogleFonts.poppins(
      fontSize: 14,
      fontWeight: medium,
      letterSpacing: 0.1,
      height: 1.4,
      color: AppColors.getTextColor(context),
    );
  }
  
  static TextStyle labelMedium(BuildContext context) {
    return GoogleFonts.poppins(
      fontSize: 12,
      fontWeight: medium,
      letterSpacing: 0.1,
      height: 1.4,
      color: AppColors.getSecondaryTextColor(context),
    );
  }
  
  static TextStyle labelSmall(BuildContext context) {
    return GoogleFonts.poppins(
      fontSize: 10,
      fontWeight: medium,
      letterSpacing: 0.1,
      height: 1.4,
      color: AppColors.getSecondaryTextColor(context),
    );
  }
  
  // ========== SPECIAL TEXT STYLES ==========
  
  /// Button text style
  static TextStyle button(BuildContext context, {Color? color}) {
    return GoogleFonts.poppins(
      fontSize: 16,
      fontWeight: semiBold,
      letterSpacing: 0.5,
      height: 1.2,
      color: color ?? Colors.white,
    );
  }
  
  /// Button text style (small)
  static TextStyle buttonSmall(BuildContext context, {Color? color}) {
    return GoogleFonts.poppins(
      fontSize: 14,
      fontWeight: semiBold,
      letterSpacing: 0.5,
      height: 1.2,
      color: color ?? Colors.white,
    );
  }
  
  /// Caption text style
  static TextStyle caption(BuildContext context) {
    return GoogleFonts.poppins(
      fontSize: 12,
      fontWeight: regular,
      letterSpacing: 0.2,
      height: 1.4,
      color: AppColors.getSecondaryTextColor(context),
    );
  }
  
  /// Overline text style
  static TextStyle overline(BuildContext context) {
    return GoogleFonts.poppins(
      fontSize: 10,
      fontWeight: medium,
      letterSpacing: 1.5,
      height: 1.4,
      color: AppColors.getSecondaryTextColor(context),
    );
  }
  
  /// Username text style (bold, prominent)
  static TextStyle username(BuildContext context) {
    return GoogleFonts.poppins(
      fontSize: 14,
      fontWeight: semiBold,
      letterSpacing: 0,
      height: 1.4,
      color: AppColors.getTextColor(context),
    );
  }
  
  /// Bio/description text style
  static TextStyle bio(BuildContext context) {
    return GoogleFonts.poppins(
      fontSize: 14,
      fontWeight: regular,
      letterSpacing: 0.15,
      height: 1.5,
      color: AppColors.getTextColor(context),
    );
  }
  
  /// Stat number text style (large, bold)
  static TextStyle statNumber(BuildContext context) {
    return GoogleFonts.poppins(
      fontSize: 18,
      fontWeight: bold,
      letterSpacing: 0,
      height: 1.2,
      color: AppColors.getTextColor(context),
    );
  }
  
  /// Stat label text style
  static TextStyle statLabel(BuildContext context) {
    return GoogleFonts.poppins(
      fontSize: 12,
      fontWeight: regular,
      letterSpacing: 0.2,
      height: 1.4,
      color: AppColors.getSecondaryTextColor(context),
    );
  }
  
  /// Hashtag text style
  static TextStyle hashtag(BuildContext context) {
    return GoogleFonts.poppins(
      fontSize: 14,
      fontWeight: medium,
      letterSpacing: 0,
      height: 1.4,
      color: AppColors.primary,
    );
  }
  
  /// Mention text style
  static TextStyle mention(BuildContext context) {
    return GoogleFonts.poppins(
      fontSize: 14,
      fontWeight: medium,
      letterSpacing: 0,
      height: 1.4,
      color: AppColors.primary,
    );
  }
  
  /// Error text style
  static TextStyle error(BuildContext context) {
    return GoogleFonts.poppins(
      fontSize: 12,
      fontWeight: regular,
      letterSpacing: 0.15,
      height: 1.4,
      color: AppColors.error,
    );
  }
  
  /// Success text style
  static TextStyle success(BuildContext context) {
    return GoogleFonts.poppins(
      fontSize: 12,
      fontWeight: regular,
      letterSpacing: 0.15,
      height: 1.4,
      color: AppColors.success,
    );
  }
}

