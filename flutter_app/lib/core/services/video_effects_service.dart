import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:ffmpeg_kit_flutter_new/ffmpeg_kit.dart';
import 'package:ffmpeg_kit_flutter_new/return_code.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;

/// Video effect types
enum VideoEffect {
  // Glitch Effects
  glitchRGB,
  glitchStatic,
  glitchDistort,
  
  // VHS/Retro Effects
  vhsClassic,
  vhsScanlines,
  
  // Neon/Glow Effects
  neonGlow,
  neonEdges,
  
  // Vintage/Film Effects
  vintageSepia,
  vintageGrain,
  vintage8mm,
  
  // Cinematic Effects
  cinematicLetterbox,
  cinematicBlue,
  cinematicOrange,
  
  // Color Grading
  colorWarm,
  colorCool,
  colorVibrant,
  colorDesaturate,
  
  // Blur Effects
  blurGaussian,
  blurMotion,
  blurRadial,
  
  // Sharpen/Enhance
  sharpenSubtle,
  sharpenStrong,
  enhanceContrast,
  
  // Artistic Effects
  artisticOilPaint,
  artisticCartoon,
  artisticPencilSketch,
  
  // Fun Effects
  funMirror,
  funNegative,
  funPixelate,
  
  none,
}

/// Video effect metadata
class VideoEffectInfo {
  final VideoEffect effect;
  final String displayName;
  final String description;
  final String category;
  final String icon;
  
  const VideoEffectInfo({
    required this.effect,
    required this.displayName,
    required this.description,
    required this.category,
    required this.icon,
  });
}

/// Video effects service
class VideoEffectsService {
  /// Get all available effects with metadata
  static List<VideoEffectInfo> getAllEffects() {
    return [
      // Glitch Effects
      VideoEffectInfo(
        effect: VideoEffect.glitchRGB,
        displayName: 'RGB Glitch',
        description: 'RGB channel shift glitch',
        category: 'Glitch',
        icon: '⚡',
      ),
      VideoEffectInfo(
        effect: VideoEffect.glitchStatic,
        displayName: 'Static Glitch',
        description: 'TV static interference',
        category: 'Glitch',
        icon: '📺',
      ),
      VideoEffectInfo(
        effect: VideoEffect.glitchDistort,
        displayName: 'Distortion',
        description: 'Wave distortion glitch',
        category: 'Glitch',
        icon: '〰️',
      ),
      
      // VHS Effects
      VideoEffectInfo(
        effect: VideoEffect.vhsClassic,
        displayName: 'VHS Classic',
        description: 'Retro VHS tape look',
        category: 'VHS/Retro',
        icon: '📼',
      ),
      VideoEffectInfo(
        effect: VideoEffect.vhsScanlines,
        displayName: 'Scanlines',
        description: 'CRT scanline effect',
        category: 'VHS/Retro',
        icon: '📟',
      ),
      
      // Neon Effects
      VideoEffectInfo(
        effect: VideoEffect.neonGlow,
        displayName: 'Neon Glow',
        description: 'Vibrant neon glow',
        category: 'Neon',
        icon: '✨',
      ),
      VideoEffectInfo(
        effect: VideoEffect.neonEdges,
        displayName: 'Neon Edges',
        description: 'Edge detection neon',
        category: 'Neon',
        icon: '💫',
      ),
      
      // Vintage Effects
      VideoEffectInfo(
        effect: VideoEffect.vintageSepia,
        displayName: 'Sepia Tone',
        description: 'Classic sepia look',
        category: 'Vintage',
        icon: '🎞️',
      ),
      VideoEffectInfo(
        effect: VideoEffect.vintageGrain,
        displayName: 'Film Grain',
        description: 'Old film grain texture',
        category: 'Vintage',
        icon: '📷',
      ),
      VideoEffectInfo(
        effect: VideoEffect.vintage8mm,
        displayName: '8mm Film',
        description: 'Super 8mm film effect',
        category: 'Vintage',
        icon: '🎥',
      ),
      
      // Cinematic Effects
      VideoEffectInfo(
        effect: VideoEffect.cinematicLetterbox,
        displayName: 'Letterbox',
        description: 'Cinematic letterbox bars',
        category: 'Cinematic',
        icon: '🎬',
      ),
      VideoEffectInfo(
        effect: VideoEffect.cinematicBlue,
        displayName: 'Cinematic Blue',
        description: 'Cool blue color grade',
        category: 'Cinematic',
        icon: '🌊',
      ),
      VideoEffectInfo(
        effect: VideoEffect.cinematicOrange,
        displayName: 'Cinematic Orange',
        description: 'Warm orange/teal grade',
        category: 'Cinematic',
        icon: '🔥',
      ),
      
      // Color Grading
      VideoEffectInfo(
        effect: VideoEffect.colorWarm,
        displayName: 'Warm Tone',
        description: 'Warm color temperature',
        category: 'Color',
        icon: '☀️',
      ),
      VideoEffectInfo(
        effect: VideoEffect.colorCool,
        displayName: 'Cool Tone',
        description: 'Cool color temperature',
        category: 'Color',
        icon: '❄️',
      ),
      VideoEffectInfo(
        effect: VideoEffect.colorVibrant,
        displayName: 'Vibrant',
        description: 'Enhanced saturation',
        category: 'Color',
        icon: '🌈',
      ),
      VideoEffectInfo(
        effect: VideoEffect.colorDesaturate,
        displayName: 'Desaturate',
        description: 'Black and white',
        category: 'Color',
        icon: '⚫',
      ),
      
      // Blur Effects
      VideoEffectInfo(
        effect: VideoEffect.blurGaussian,
        displayName: 'Blur',
        description: 'Gaussian blur effect',
        category: 'Blur',
        icon: '🌫️',
      ),
      VideoEffectInfo(
        effect: VideoEffect.blurMotion,
        displayName: 'Motion Blur',
        description: 'Directional motion blur',
        category: 'Blur',
        icon: '💨',
      ),
      VideoEffectInfo(
        effect: VideoEffect.blurRadial,
        displayName: 'Radial Blur',
        description: 'Zoom blur from center',
        category: 'Blur',
        icon: '🎯',
      ),
      
      // Sharpen
      VideoEffectInfo(
        effect: VideoEffect.sharpenSubtle,
        displayName: 'Sharpen',
        description: 'Subtle sharpening',
        category: 'Enhance',
        icon: '🔪',
      ),
      VideoEffectInfo(
        effect: VideoEffect.sharpenStrong,
        displayName: 'Ultra Sharp',
        description: 'Strong sharpening',
        category: 'Enhance',
        icon: '⚔️',
      ),
      VideoEffectInfo(
        effect: VideoEffect.enhanceContrast,
        displayName: 'Contrast',
        description: 'Enhanced contrast',
        category: 'Enhance',
        icon: '◼️',
      ),
      
      // Artistic
      VideoEffectInfo(
        effect: VideoEffect.artisticOilPaint,
        displayName: 'Oil Paint',
        description: 'Oil painting look',
        category: 'Artistic',
        icon: '🖼️',
      ),
      VideoEffectInfo(
        effect: VideoEffect.artisticCartoon,
        displayName: 'Cartoon',
        description: 'Cartoon/comic style',
        category: 'Artistic',
        icon: '💭',
      ),
      VideoEffectInfo(
        effect: VideoEffect.artisticPencilSketch,
        displayName: 'Sketch',
        description: 'Pencil sketch drawing',
        category: 'Artistic',
        icon: '✏️',
      ),
      
      // Fun Effects
      VideoEffectInfo(
        effect: VideoEffect.funMirror,
        displayName: 'Mirror',
        description: 'Mirror reflection',
        category: 'Fun',
        icon: '🪞',
      ),
      VideoEffectInfo(
        effect: VideoEffect.funNegative,
        displayName: 'Negative',
        description: 'Color inversion',
        category: 'Fun',
        icon: '🔄',
      ),
      VideoEffectInfo(
        effect: VideoEffect.funPixelate,
        displayName: 'Pixelate',
        description: 'Pixel mosaic effect',
        category: 'Fun',
        icon: '🎮',
      ),
    ];
  }

  /// Get effects by category
  static List<VideoEffectInfo> getEffectsByCategory(String category) {
    return getAllEffects().where((e) => e.category == category).toList();
  }

  /// Get all categories
  static List<String> getCategories() {
    return getAllEffects()
        .map((e) => e.category)
        .toSet()
        .toList()
      ..sort();
  }

  /// Apply effect to video
  static Future<String?> applyEffect({
    required String inputPath,
    required VideoEffect effect,
    Function(double)? onProgress,
  }) async {
    if (effect == VideoEffect.none) {
      return inputPath;
    }

    try {
      final tempDir = await getTemporaryDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final outputPath = path.join(
        tempDir.path,
        'effect_${effect.name}_$timestamp.mp4',
      );

      final filterComplex = _getFilterComplexForEffect(effect);
      
      final command = '-i "$inputPath" $filterComplex -c:a copy -y "$outputPath"';
      
      debugPrint('🎨 Applying effect: ${effect.name}');
      debugPrint('Command: $command');

      final session = await FFmpegKit.execute(command);
      final returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        debugPrint('✅ Effect applied successfully');
        return outputPath;
      } else {
        final output = await session.getOutput();
        debugPrint('❌ Effect failed: $output');
        return null;
      }
    } catch (e) {
      debugPrint('❌ Apply effect error: $e');
      return null;
    }
  }

  /// Apply multiple effects sequentially
  static Future<String?> applyMultipleEffects({
    required String inputPath,
    required List<VideoEffect> effects,
    Function(double)? onProgress,
  }) async {
    String currentPath = inputPath;
    
    for (int i = 0; i < effects.length; i++) {
      final effect = effects[i];
      if (effect == VideoEffect.none) continue;
      
      final resultPath = await applyEffect(
        inputPath: currentPath,
        effect: effect,
        onProgress: (progress) {
          final totalProgress = (i + progress) / effects.length;
          onProgress?.call(totalProgress);
        },
      );

      if (resultPath == null) {
        debugPrint('❌ Failed to apply effect: ${effect.name}');
        return null;
      }

      // Delete intermediate file if not the original
      if (currentPath != inputPath) {
        try {
          await File(currentPath).delete();
        } catch (e) {
          debugPrint('⚠️ Failed to delete temp file: $e');
        }
      }

      currentPath = resultPath;
    }

    return currentPath;
  }

  /// Get FFmpeg filter complex string for effect
  static String _getFilterComplexForEffect(VideoEffect effect) {
    switch (effect) {
      // Glitch Effects
      case VideoEffect.glitchRGB:
        return '-vf "split[a][b];[a]rgbashift=rh=5:bh=-5[rgb];[b][rgb]overlay"';
      
      case VideoEffect.glitchStatic:
        return '-vf "noise=alls=20:allf=t+u"';
      
      case VideoEffect.glitchDistort:
        return '-vf "hqdn3d,waves"';
      
      // VHS Effects
      case VideoEffect.vhsClassic:
        return '-vf "noise=alls=10:allf=t,eq=saturation=0.7:brightness=-0.1,hue=s=0.8,curves=all=\'0/0 0.5/0.4 1/1\'"';
      
      case VideoEffect.vhsScanlines:
        return '-vf "split[a][b];[b]format=gray,geq=lum=\'p(X,Y)-10*sin(Y*0.5)\':cr=128:cb=128[scanlines];[a][scanlines]overlay"';
      
      // Neon Effects
      case VideoEffect.neonGlow:
        return '-vf "eq=saturation=2,gblur=sigma=3,eq=contrast=1.5"';
      
      case VideoEffect.neonEdges:
        return '-vf "edgedetect=mode=colormix:high=0.1,eq=saturation=3"';
      
      // Vintage Effects
      case VideoEffect.vintageSepia:
        return '-vf "colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131"';
      
      case VideoEffect.vintageGrain:
        return '-vf "noise=alls=15:allf=t,eq=saturation=0.8"';
      
      case VideoEffect.vintage8mm:
        return '-vf "noise=alls=20:allf=t,eq=saturation=0.7:contrast=1.2,vignette=angle=PI/4"';
      
      // Cinematic Effects
      case VideoEffect.cinematicLetterbox:
        return '-vf "crop=iw:ih*0.75:0:ih*0.125,pad=iw:iw/2.39:0:(oh-ih)/2:black"';
      
      case VideoEffect.cinematicBlue:
        return '-vf "curves=all=\'0/0.1 0.5/0.4 1/0.9\',colorbalance=bs=0.3:gs=0.1"';
      
      case VideoEffect.cinematicOrange:
        return '-vf "curves=r=\'0/0 0.5/0.6 1/1\':b=\'0/0 0.5/0.4 1/1\',colorbalance=rs=-0.2:gs=0.1:bs=0.3"';
      
      // Color Grading
      case VideoEffect.colorWarm:
        return '-vf "eq=saturation=1.1,colortemperature=5500"';
      
      case VideoEffect.colorCool:
        return '-vf "eq=saturation=1.1,colortemperature=7500"';
      
      case VideoEffect.colorVibrant:
        return '-vf "eq=saturation=1.8:contrast=1.2"';
      
      case VideoEffect.colorDesaturate:
        return '-vf "hue=s=0"';
      
      // Blur Effects
      case VideoEffect.blurGaussian:
        return '-vf "gblur=sigma=5"';
      
      case VideoEffect.blurMotion:
        return '-vf "dblur=angle=45:radius=5"';
      
      case VideoEffect.blurRadial:
        return '-vf "zoompan=z=\'zoom+0.002\':d=1:s=1920x1080,gblur=sigma=3"';
      
      // Sharpen/Enhance
      case VideoEffect.sharpenSubtle:
        return '-vf "unsharp=5:5:0.5:5:5:0.0"';
      
      case VideoEffect.sharpenStrong:
        return '-vf "unsharp=5:5:1.5:5:5:0.0"';
      
      case VideoEffect.enhanceContrast:
        return '-vf "eq=contrast=1.5:brightness=0.05"';
      
      // Artistic Effects
      case VideoEffect.artisticOilPaint:
        return '-vf "gblur=sigma=2,eq=saturation=1.3"';
      
      case VideoEffect.artisticCartoon:
        return '-vf "edgedetect=mode=colormix:high=0,negate,hue=s=0,eq=contrast=5,negate"';
      
      case VideoEffect.artisticPencilSketch:
        return '-vf "format=gray,edgedetect,negate"';
      
      // Fun Effects
      case VideoEffect.funMirror:
        return '-vf "crop=iw/2:ih:0:0,split[left][tmp];[tmp]hflip[right];[left][right]hstack"';
      
      case VideoEffect.funNegative:
        return '-vf "negate"';
      
      case VideoEffect.funPixelate:
        return '-vf "scale=iw/10:-1:flags=neighbor,scale=iw*10:-1:flags=neighbor"';
      
      case VideoEffect.none:
        return '';
    }
  }
}
