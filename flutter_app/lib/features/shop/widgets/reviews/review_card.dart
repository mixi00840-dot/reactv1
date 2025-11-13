import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../constants/shop_constants.dart';

/// Individual review card with user info, rating, review text, and helpful button
class ReviewCard extends StatefulWidget {
  final String userName;
  final String? userAvatar;
  final double rating;
  final String date;
  final String review;
  final int helpfulCount;
  final bool isVerifiedPurchase;

  const ReviewCard({
    Key? key,
    required this.userName,
    this.userAvatar,
    required this.rating,
    required this.date,
    required this.review,
    this.helpfulCount = 0,
    this.isVerifiedPurchase = false,
  }) : super(key: key);

  @override
  State<ReviewCard> createState() => _ReviewCardState();
}

class _ReviewCardState extends State<ReviewCard> {
  bool _isHelpful = false;
  late int _currentHelpfulCount;

  @override
  void initState() {
    super.initState();
    _currentHelpfulCount = widget.helpfulCount;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(ShopConstants.defaultPadding),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(ShopConstants.defaultBorderRadius),
        border: Border.all(
          color: AppColors.border,
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // User Info Row
          Row(
            children: [
              // User Avatar
              _buildUserAvatar(),
              
              const SizedBox(width: ShopConstants.defaultPadding),
              
              // User Name and Date
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          widget.userName,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        if (widget.isVerifiedPurchase) ...[
                          const SizedBox(width: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.success.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text(
                              'Verified',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: AppColors.success,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      widget.date,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textTertiary,
                      ),
                    ),
                  ],
                ),
              ),
              
              // Rating Stars
              Row(
                children: List.generate(5, (index) {
                  return Icon(
                    index < widget.rating.floor()
                        ? Icons.star
                        : index < widget.rating
                            ? Icons.star_half
                            : Icons.star_border,
                    size: 16,
                    color: AppColors.warning,
                  );
                }),
              ),
            ],
          ),
          
          const SizedBox(height: ShopConstants.defaultPadding),
          
          // Review Text
          Text(
            widget.review,
            style: const TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
              height: 1.5,
            ),
          ),
          
          const SizedBox(height: ShopConstants.defaultPadding),
          
          // Helpful Button
          Row(
            children: [
              GestureDetector(
                onTap: () {
                  setState(() {
                    if (_isHelpful) {
                      _currentHelpfulCount--;
                    } else {
                      _currentHelpfulCount++;
                    }
                    _isHelpful = !_isHelpful;
                  });
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: _isHelpful
                        ? AppColors.primary.withOpacity(0.1)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(
                      ShopConstants.defaultBorderRadiusCircular,
                    ),
                    border: Border.all(
                      color: _isHelpful ? AppColors.primary : AppColors.border,
                      width: 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        _isHelpful ? Icons.thumb_up : Icons.thumb_up_outlined,
                        size: 14,
                        color: _isHelpful
                            ? AppColors.primary
                            : AppColors.textSecondary,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Helpful ($_currentHelpfulCount)',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: _isHelpful
                              ? AppColors.primary
                              : AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildUserAvatar() {
    if (widget.userAvatar != null) {
      return CircleAvatar(
        radius: 20,
        backgroundImage: NetworkImage(widget.userAvatar!),
        onBackgroundImageError: (_, __) {},
        child: widget.userAvatar == null
            ? Text(
                widget.userName[0].toUpperCase(),
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              )
            : null,
      );
    }

    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.2),
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text(
          widget.userName[0].toUpperCase(),
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: AppColors.primary,
          ),
        ),
      ),
    );
  }
}
