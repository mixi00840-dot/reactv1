import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../constants/shop_constants.dart';

/// Expandable product description with features list and read more/less
class ProductDescription extends StatefulWidget {
  final String description;
  final List<String>? features;
  final int maxLines;

  const ProductDescription({
    Key? key,
    required this.description,
    this.features,
    this.maxLines = 3,
  }) : super(key: key);

  @override
  State<ProductDescription> createState() => _ProductDescriptionState();
}

class _ProductDescriptionState extends State<ProductDescription> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Title
        const Text(
          'Product Description',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        
        const SizedBox(height: ShopConstants.defaultPadding),
        
        // Description Text
        AnimatedCrossFade(
          firstChild: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.description,
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                  height: 1.6,
                ),
                maxLines: widget.maxLines,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
          secondChild: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.description,
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                  height: 1.6,
                ),
              ),
            ],
          ),
          crossFadeState: _isExpanded
              ? CrossFadeState.showSecond
              : CrossFadeState.showFirst,
          duration: ShopConstants.animationDurationDefault,
        ),
        
        // Read More/Less Button
        if (_shouldShowReadMore())
          Padding(
            padding: const EdgeInsets.only(
              top: ShopConstants.defaultPaddingSmall,
            ),
            child: GestureDetector(
              onTap: () {
                setState(() {
                  _isExpanded = !_isExpanded;
                });
              },
              child: Text(
                _isExpanded ? 'Read Less' : 'Read More',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.primary,
                ),
              ),
            ),
          ),
        
        // Features List
        if (widget.features != null && widget.features!.isNotEmpty) ...[
          const SizedBox(height: ShopConstants.defaultPaddingLarge),
          
          const Text(
            'Key Features',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          
          const SizedBox(height: ShopConstants.defaultPadding),
          
          ...widget.features!.map((feature) => _buildFeatureItem(feature)),
        ],
      ],
    );
  }

  Widget _buildFeatureItem(String feature) {
    return Padding(
      padding: const EdgeInsets.only(
        bottom: ShopConstants.defaultPaddingSmall,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Checkmark Icon
          Container(
            margin: const EdgeInsets.only(top: 2),
            child: Icon(
              Icons.check_circle,
              size: 18,
              color: AppColors.success,
            ),
          ),
          
          const SizedBox(width: ShopConstants.defaultPaddingSmall),
          
          // Feature Text
          Expanded(
            child: Text(
              feature,
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  bool _shouldShowReadMore() {
    // Check if text is longer than maxLines
    final textSpan = TextSpan(
      text: widget.description,
      style: const TextStyle(fontSize: 14, height: 1.6),
    );
    final textPainter = TextPainter(
      text: textSpan,
      maxLines: widget.maxLines,
      textDirection: TextDirection.ltr,
    );
    textPainter.layout(maxWidth: MediaQuery.of(context).size.width - 32);
    return textPainter.didExceedMaxLines;
  }
}
