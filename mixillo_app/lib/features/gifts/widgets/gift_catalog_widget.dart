import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/gift_model.dart';
import '../providers/gifts_provider.dart';

class GiftCatalogWidget extends StatelessWidget {
  final Function(GiftModel gift, int quantity) onGiftSelected;
  final bool showCategories;
  final bool compact;

  const GiftCatalogWidget({
    super.key,
    required this.onGiftSelected,
    this.showCategories = true,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer<GiftsProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading && provider.gifts.isEmpty) {
          return const Center(
            child: CircularProgressIndicator(),
          );
        }

        if (provider.error != null && provider.gifts.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48, color: Colors.red),
                const SizedBox(height: 16),
                Text(
                  'Error loading gifts',
                  style: TextStyle(color: Colors.grey[600]),
                ),
                const SizedBox(height: 8),
                ElevatedButton(
                  onPressed: () => provider.refresh(),
                  child: const Text('Retry'),
                ),
              ],
            ),
          );
        }

        final gifts = provider.getFilteredGifts();

        return Column(
          children: [
            // Categories (if enabled)
            if (showCategories && provider.categories.isNotEmpty)
              SizedBox(
                height: 50,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  itemCount: provider.categories.length + 1,
                  itemBuilder: (context, index) {
                    if (index == 0) {
                      // "All" category
                      final isSelected = provider.selectedCategory == null;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: FilterChip(
                          label: const Text('All'),
                          selected: isSelected,
                          onSelected: (selected) {
                            provider.filterByCategory(null);
                          },
                        ),
                      );
                    }

                    final category = provider.categories[index - 1];
                    final isSelected = provider.selectedCategory == category;

                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        label: Text(
                          category[0].toUpperCase() + category.substring(1),
                        ),
                        selected: isSelected,
                        onSelected: (selected) {
                          provider.filterByCategory(selected ? category : null);
                        },
                      ),
                    );
                  },
                ),
              ),

            // Gifts grid
            Expanded(
              child: compact
                  ? _buildCompactGrid(gifts, context)
                  : _buildGrid(gifts, context),
            ),
          ],
        );
      },
    );
  }

  Widget _buildGrid(List<GiftModel> gifts, BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 4,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.85,
      ),
      itemCount: gifts.length,
      itemBuilder: (context, index) {
        final gift = gifts[index];
        return _GiftItem(
          gift: gift,
          onTap: () => onGiftSelected(gift, 1),
          onLongPress: () => _showQuantityDialog(context, gift),
        );
      },
    );
  }

  Widget _buildCompactGrid(List<GiftModel> gifts, BuildContext context) {
    return ListView.builder(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 8),
      itemCount: gifts.length,
      itemBuilder: (context, index) {
        final gift = gifts[index];
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: _GiftItem(
            gift: gift,
            compact: true,
            onTap: () => onGiftSelected(gift, 1),
            onLongPress: () => _showQuantityDialog(context, gift),
          ),
        );
      },
    );
  }

  void _showQuantityDialog(BuildContext context, GiftModel gift) {
    int quantity = 1;
    showDialog(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: Text(gift.displayName),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Select quantity (${gift.price * quantity} coins)'),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton(
                    icon: const Icon(Icons.remove),
                    onPressed: quantity > 1
                        ? () => setState(() => quantity--)
                        : null,
                  ),
                  Text(
                    '$quantity',
                    style: const TextStyle(fontSize: 24),
                  ),
                  IconButton(
                    icon: const Icon(Icons.add),
                    onPressed: () => setState(() => quantity++),
                  ),
                ],
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(dialogContext);
                onGiftSelected(gift, quantity);
              },
              child: const Text('Send'),
            ),
          ],
        ),
      ),
    );
  }
}

class _GiftItem extends StatelessWidget {
  final GiftModel gift;
  final bool compact;
  final VoidCallback onTap;
  final VoidCallback? onLongPress;

  const _GiftItem({
    required this.gift,
    this.compact = false,
    required this.onTap,
    this.onLongPress,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      onLongPress: onLongPress,
      child: Container(
        width: compact ? 80 : null,
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: gift.rarity.color.withOpacity(0.5),
            width: 2,
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Gift icon
            Expanded(
              child: gift.media.icon.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: gift.media.icon,
                      fit: BoxFit.contain,
                      placeholder: (context, url) => const Center(
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                      errorWidget: (context, url, error) => const Icon(
                        Icons.card_giftcard,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(
                      Icons.card_giftcard,
                      color: Colors.white,
                      size: 40,
                    ),
            ),
            
            const SizedBox(height: 4),
            
            // Price
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: gift.rarity.color,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                '${gift.price}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

