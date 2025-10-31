import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:shimmer/shimmer.dart';

/// Custom Cache Manager for images
class CustomCacheManager {
  static const key = 'mixilloImageCache';
  
  static CacheManager get instance => CacheManager(
        Config(
          key,
          stalePeriod: const Duration(days: 7), // Cache for 7 days
          maxNrOfCacheObjects: 200, // Max 200 cached images
          repo: JsonCacheInfoRepository(databaseName: key),
          fileService: HttpFileService(),
        ),
      );
}

/// Optimized Image Widget with caching
class OptimizedImage extends StatelessWidget {
  final String imageUrl;
  final double? width;
  final double? height;
  final BoxFit fit;
  final BorderRadius? borderRadius;
  final Widget? errorWidget;
  final Widget? placeholder;

  const OptimizedImage({
    Key? key,
    required this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.borderRadius,
    this.errorWidget,
    this.placeholder,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    Widget imageWidget = CachedNetworkImage(
      imageUrl: imageUrl,
      cacheManager: CustomCacheManager.instance,
      width: width,
      height: height,
      fit: fit,
      placeholder: (context, url) =>
          placeholder ?? _buildShimmerPlaceholder(),
      errorWidget: (context, url, error) =>
          errorWidget ?? _buildErrorWidget(),
      memCacheWidth: width != null ? (width! * 2).toInt() : null,
      memCacheHeight: height != null ? (height! * 2).toInt() : null,
    );

    if (borderRadius != null) {
      imageWidget = ClipRRect(
        borderRadius: borderRadius!,
        child: imageWidget,
      );
    }

    return imageWidget;
  }

  Widget _buildShimmerPlaceholder() {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: Container(
        width: width,
        height: height,
        color: Colors.white,
      ),
    );
  }

  Widget _buildErrorWidget() {
    return Container(
      width: width,
      height: height,
      color: Colors.grey[300],
      child: const Center(
        child: Icon(Icons.broken_image, color: Colors.grey, size: 32),
      ),
    );
  }
}

/// Avatar Widget with optimized caching
class OptimizedAvatar extends StatelessWidget {
  final String? avatarUrl;
  final String fallbackText;
  final double radius;

  const OptimizedAvatar({
    Key? key,
    this.avatarUrl,
    required this.fallbackText,
    this.radius = 20,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (avatarUrl == null || avatarUrl!.isEmpty) {
      return CircleAvatar(
        radius: radius,
        backgroundColor: Colors.grey[300],
        child: Text(
          fallbackText.isNotEmpty ? fallbackText[0].toUpperCase() : '?',
          style: TextStyle(
            fontSize: radius * 0.8,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
      );
    }

    return CachedNetworkImage(
      imageUrl: avatarUrl!,
      cacheManager: CustomCacheManager.instance,
      imageBuilder: (context, imageProvider) => CircleAvatar(
        radius: radius,
        backgroundImage: imageProvider,
      ),
      placeholder: (context, url) => CircleAvatar(
        radius: radius,
        backgroundColor: Colors.grey[300],
        child: const CircularProgressIndicator(strokeWidth: 2),
      ),
      errorWidget: (context, url, error) => CircleAvatar(
        radius: radius,
        backgroundColor: Colors.grey[300],
        child: Text(
          fallbackText.isNotEmpty ? fallbackText[0].toUpperCase() : '?',
          style: TextStyle(
            fontSize: radius * 0.8,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
      ),
      memCacheWidth: (radius * 4).toInt(),
      memCacheHeight: (radius * 4).toInt(),
    );
  }
}

/// Thumbnail Grid Widget with lazy loading
class OptimizedThumbnailGrid extends StatelessWidget {
  final List<String> imageUrls;
  final int crossAxisCount;
  final double spacing;
  final double aspectRatio;
  final void Function(int index)? onTap;

  const OptimizedThumbnailGrid({
    Key? key,
    required this.imageUrls,
    this.crossAxisCount = 3,
    this.spacing = 2,
    this.aspectRatio = 1,
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: crossAxisCount,
        crossAxisSpacing: spacing,
        mainAxisSpacing: spacing,
        childAspectRatio: aspectRatio,
      ),
      itemCount: imageUrls.length,
      itemBuilder: (context, index) {
        return GestureDetector(
          onTap: () => onTap?.call(index),
          child: OptimizedImage(
            imageUrl: imageUrls[index],
            fit: BoxFit.cover,
          ),
        );
      },
    );
  }
}

/// Preload images for better performance
class ImagePreloader {
  static Future<void> preloadImages(
    BuildContext context,
    List<String> imageUrls,
  ) async {
    final futures = <Future>[];
    
    for (final url in imageUrls) {
      final future = CachedNetworkImage.evictFromCache(url).then((_) {
        return precacheImage(
          CachedNetworkImageProvider(
            url,
            cacheManager: CustomCacheManager.instance,
          ),
          context,
        );
      });
      futures.add(future);
    }

    await Future.wait(futures);
  }

  static Future<void> preloadSingleImage(
    BuildContext context,
    String imageUrl,
  ) async {
    await precacheImage(
      CachedNetworkImageProvider(
        imageUrl,
        cacheManager: CustomCacheManager.instance,
      ),
      context,
    );
  }
}

/// Clear cache utility
class CacheUtility {
  static Future<void> clearImageCache() async {
    await CustomCacheManager.instance.emptyCache();
  }

  static Future<void> removeFromCache(String url) async {
    await CustomCacheManager.instance.removeFile(url);
  }

  static Future<int> getCacheSize() async {
    // Note: CacheManager doesn't have direct method to get all files
    // This is a simplified implementation
    // In production, you might want to use a different approach
    return 0; // Placeholder
  }

  static String formatBytes(int bytes, {int decimals = 2}) {
    if (bytes <= 0) return "0 B";
    const suffixes = ["B", "KB", "MB", "GB", "TB"];
    var i = 0;
    double size = bytes.toDouble();
    
    while (size >= 1024 && i < suffixes.length - 1) {
      size /= 1024;
      i++;
    }
    
    return "${size.toStringAsFixed(decimals)} ${suffixes[i]}";
  }
}
