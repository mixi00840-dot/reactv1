import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../constants/shop_constants.dart';
import 'review_card.dart';

/// Reviews section with rating breakdown, summary, and recent reviews
class ReviewsSection extends StatelessWidget {
  final double averageRating;
  final int totalReviews;
  final Map<int, int> ratingBreakdown; // {5: 850, 4: 250, ...}
  final VoidCallback? onSeeAllReviews;

  const ReviewsSection({
    Key? key,
    required this.averageRating,
    required this.totalReviews,
    required this.ratingBreakdown,
    this.onSeeAllReviews,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: ShopConstants.defaultPadding,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Reviews & Ratings',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              if (onSeeAllReviews != null)
                TextButton(
                  onPressed: onSeeAllReviews,
                  child: const Text(
                    'See All',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
            ],
          ),
          
          const SizedBox(height: ShopConstants.defaultPadding),
          
          // Rating Overview
          Container(
            padding: const EdgeInsets.all(ShopConstants.defaultPadding),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(
                ShopConstants.defaultBorderRadius,
              ),
              border: Border.all(
                color: AppColors.border,
                width: 1,
              ),
            ),
            child: Row(
              children: [
                // Average Rating (Left Side)
                Expanded(
                  flex: 2,
                  child: Column(
                    children: [
                      Text(
                        averageRating.toStringAsFixed(1),
                        style: const TextStyle(
                          fontSize: 48,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(5, (index) {
                          return Icon(
                            index < averageRating.floor()
                                ? Icons.star
                                : index < averageRating
                                    ? Icons.star_half
                                    : Icons.star_border,
                            size: 20,
                            color: AppColors.warning,
                          );
                        }),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '$totalReviews reviews',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(width: ShopConstants.defaultPaddingLarge),
                
                // Rating Breakdown (Right Side)
                Expanded(
                  flex: 3,
                  child: Column(
                    children: [
                      _buildRatingBar(5, ratingBreakdown[5] ?? 0, totalReviews),
                      const SizedBox(height: 8),
                      _buildRatingBar(4, ratingBreakdown[4] ?? 0, totalReviews),
                      const SizedBox(height: 8),
                      _buildRatingBar(3, ratingBreakdown[3] ?? 0, totalReviews),
                      const SizedBox(height: 8),
                      _buildRatingBar(2, ratingBreakdown[2] ?? 0, totalReviews),
                      const SizedBox(height: 8),
                      _buildRatingBar(1, ratingBreakdown[1] ?? 0, totalReviews),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: ShopConstants.defaultPaddingLarge),
          
          // Recent Reviews
          const Text(
            'Recent Reviews',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          
          const SizedBox(height: ShopConstants.defaultPadding),
          
          // Sample Reviews (Mock Data - replace with API)
          ..._buildSampleReviews(),
        ],
      ),
    );
  }

  Widget _buildRatingBar(int stars, int count, int total) {
    final percentage = total > 0 ? (count / total) : 0.0;
    
    return Row(
      children: [
        // Star Number
        Text(
          '$stars',
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(width: 4),
        Icon(
          Icons.star,
          size: 12,
          color: AppColors.warning,
        ),
        
        const SizedBox(width: 8),
        
        // Progress Bar
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: percentage,
              backgroundColor: AppColors.backgroundLight,
              valueColor: const AlwaysStoppedAnimation<Color>(
                AppColors.warning,
              ),
              minHeight: 6,
            ),
          ),
        ),
        
        const SizedBox(width: 8),
        
        // Count
        SizedBox(
          width: 30,
          child: Text(
            count.toString(),
            style: const TextStyle(
              fontSize: 11,
              color: AppColors.textTertiary,
            ),
            textAlign: TextAlign.right,
          ),
        ),
      ],
    );
  }

  List<Widget> _buildSampleReviews() {
    // Mock data - replace with actual API call
    final sampleReviews = [
      {
        'userName': 'John Doe',
        'rating': 5.0,
        'date': '2 days ago',
        'review': 'Excellent product! Quality exceeded my expectations. Fast shipping and great customer service.',
        'helpful': 24,
      },
      {
        'userName': 'Jane Smith',
        'rating': 4.0,
        'date': '1 week ago',
        'review': 'Good value for money. Works as described. Minor issue with packaging but product itself is great.',
        'helpful': 12,
      },
      {
        'userName': 'Mike Johnson',
        'rating': 5.0,
        'date': '2 weeks ago',
        'review': 'Absolutely love it! Highly recommend to anyone looking for quality.',
        'helpful': 8,
      },
    ];

    return sampleReviews.map((review) {
      return Padding(
        padding: const EdgeInsets.only(
          bottom: ShopConstants.defaultPadding,
        ),
        child: ReviewCard(
          userName: review['userName'] as String,
          rating: review['rating'] as double,
          date: review['date'] as String,
          review: review['review'] as String,
          helpfulCount: review['helpful'] as int,
        ),
      );
    }).toList();
  }
}
