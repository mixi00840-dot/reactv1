import 'package:flutter/material.dart';

/// Premium shadow system for depth and layering
class AppShadows {
  // Small Shadows
  static const List<BoxShadow> small = [
    BoxShadow(
      color: Color(0x1A000000),
      blurRadius: 4,
      offset: Offset(0, 2),
    ),
  ];
  
  static const List<BoxShadow> smallColored = [
    BoxShadow(
      color: Color(0x40FF006E),
      blurRadius: 8,
      offset: Offset(0, 2),
    ),
  ];
  
  // Medium Shadows
  static const List<BoxShadow> medium = [
    BoxShadow(
      color: Color(0x26000000),
      blurRadius: 8,
      offset: Offset(0, 4),
    ),
  ];
  
  static const List<BoxShadow> mediumColored = [
    BoxShadow(
      color: Color(0x4DFF006E),
      blurRadius: 12,
      offset: Offset(0, 4),
    ),
  ];
  
  // Large Shadows
  static const List<BoxShadow> large = [
    BoxShadow(
      color: Color(0x33000000),
      blurRadius: 16,
      offset: Offset(0, 8),
    ),
  ];
  
  static const List<BoxShadow> largeColored = [
    BoxShadow(
      color: Color(0x66FF006E),
      blurRadius: 20,
      offset: Offset(0, 8),
    ),
  ];
  
  // Extra Large Shadows
  static const List<BoxShadow> extraLarge = [
    BoxShadow(
      color: Color(0x40000000),
      blurRadius: 24,
      offset: Offset(0, 12),
    ),
  ];
  
  // Neon Glow Shadows
  static const List<BoxShadow> neonPink = [
    BoxShadow(
      color: Color(0x80FF006E),
      blurRadius: 20,
      offset: Offset(0, 0),
    ),
    BoxShadow(
      color: Color(0x40FF006E),
      blurRadius: 40,
      offset: Offset(0, 0),
    ),
  ];
  
  static const List<BoxShadow> neonBlue = [
    BoxShadow(
      color: Color(0x8000F5FF),
      blurRadius: 20,
      offset: Offset(0, 0),
    ),
    BoxShadow(
      color: Color(0x4000F5FF),
      blurRadius: 40,
      offset: Offset(0, 0),
    ),
  ];
  
  static const List<BoxShadow> neonPurple = [
    BoxShadow(
      color: Color(0x80BB00FF),
      blurRadius: 20,
      offset: Offset(0, 0),
    ),
    BoxShadow(
      color: Color(0x40BB00FF),
      blurRadius: 40,
      offset: Offset(0, 0),
    ),
  ];
  
  static const List<BoxShadow> neonGreen = [
    BoxShadow(
      color: Color(0x8000FF94),
      blurRadius: 20,
      offset: Offset(0, 0),
    ),
    BoxShadow(
      color: Color(0x4000FF94),
      blurRadius: 40,
      offset: Offset(0, 0),
    ),
  ];
  
  // Multi-color Neon Glow
  static const List<BoxShadow> neonRainbow = [
    BoxShadow(
      color: Color(0x66FF006E),
      blurRadius: 15,
      offset: Offset(-5, -5),
    ),
    BoxShadow(
      color: Color(0x6600F5FF),
      blurRadius: 15,
      offset: Offset(5, 5),
    ),
    BoxShadow(
      color: Color(0x66BB00FF),
      blurRadius: 20,
      offset: Offset(0, 0),
    ),
  ];
  
  // Inner Shadows (for text effects)
  static const List<Shadow> textShadowSmall = [
    Shadow(
      color: Color(0x80000000),
      blurRadius: 4,
      offset: Offset(0, 2),
    ),
  ];
  
  static const List<Shadow> textShadowMedium = [
    Shadow(
      color: Color(0x99000000),
      blurRadius: 8,
      offset: Offset(0, 4),
    ),
  ];
  
  static const List<Shadow> textShadowLarge = [
    Shadow(
      color: Color(0xB3000000),
      blurRadius: 12,
      offset: Offset(0, 6),
    ),
  ];
  
  static const List<Shadow> textNeonPink = [
    Shadow(
      color: Color(0xFFFF006E),
      blurRadius: 10,
      offset: Offset(0, 0),
    ),
    Shadow(
      color: Color(0x80FF006E),
      blurRadius: 20,
      offset: Offset(0, 0),
    ),
  ];
  
  static const List<Shadow> textNeonBlue = [
    Shadow(
      color: Color(0xFF00F5FF),
      blurRadius: 10,
      offset: Offset(0, 0),
    ),
    Shadow(
      color: Color(0x8000F5FF),
      blurRadius: 20,
      offset: Offset(0, 0),
    ),
  ];
  
  AppShadows._();
}
