import 'package:flutter/material.dart';
import 'package:iconsax/iconsax.dart';
import '../../data/models/live_stream_model.dart';
import '../../data/mock_live_data.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/glass_widgets.dart';

class GiftPanel extends StatefulWidget {
  final Function(LiveGift) onGiftSelected;
  final VoidCallback onClose;

  const GiftPanel({
    super.key,
    required this.onGiftSelected,
    required this.onClose,
  });

  @override
  State<GiftPanel> createState() => _GiftPanelState();
}

class _GiftPanelState extends State<GiftPanel> {
  final List<LiveGift> _gifts = MockLiveData.getGiftsList();
  String _selectedRarity = 'all';

  List<LiveGift> get _filteredGifts {
    if (_selectedRarity == 'all') return _gifts;
    return _gifts.where((g) => g.rarity == _selectedRarity).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 400,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            AppTheme.background.withOpacity(0.95),
            AppTheme.background,
          ],
        ),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Text(
                  'Send a Gift',
                  style: AppTheme.headingStyle.copyWith(fontSize: 20),
                ),
                const Spacer(),
                IconButton(
                  onPressed: widget.onClose,
                  icon: const Icon(Iconsax.close_circle, color: Colors.white),
                ),
              ],
            ),
          ),
          // Rarity Filter
          SizedBox(
            height: 40,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                _buildRarityChip('all', 'All'),
                _buildRarityChip('common', 'Common'),
                _buildRarityChip('rare', 'Rare'),
                _buildRarityChip('epic', 'Epic'),
                _buildRarityChip('legendary', 'Legendary'),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Gifts Grid
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 4,
                childAspectRatio: 0.75,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
              ),
              itemCount: _filteredGifts.length,
              itemBuilder: (context, index) {
                final gift = _filteredGifts[index];
                return _buildGiftCard(gift);
              },
            ),
          ),
          // Balance Info
          Padding(
            padding: const EdgeInsets.all(16),
            child: GlassContainer(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  Row(
                    children: [
                      Icon(Iconsax.dollar_circle, color: AppTheme.accent),
                      const SizedBox(width: 8),
                      Text(
                        '12,500',
                        style: AppTheme.bodyStyle.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        ' Coins',
                        style: AppTheme.bodyStyle.copyWith(
                          color: Colors.white70,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    width: 1,
                    height: 20,
                    color: Colors.white.withOpacity(0.2),
                  ),
                  Row(
                    children: [
                      Icon(Iconsax.diamonds, color: AppTheme.primary),
                      const SizedBox(width: 8),
                      Text(
                        '450',
                        style: AppTheme.bodyStyle.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        ' Diamonds',
                        style: AppTheme.bodyStyle.copyWith(
                          color: Colors.white70,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRarityChip(String rarity, String label) {
    final isSelected = _selectedRarity == rarity;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: () {
          setState(() {
            _selectedRarity = rarity;
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            gradient: isSelected ? AppTheme.primaryGradient : null,
            color: isSelected ? null : Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isSelected
                  ? Colors.transparent
                  : Colors.white.withOpacity(0.1),
            ),
          ),
          child: Text(
            label,
            style: AppTheme.bodyStyle.copyWith(
              fontSize: 12,
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildGiftCard(LiveGift gift) {
    Color rarityColor;
    switch (gift.rarity) {
      case 'rare':
        rarityColor = const Color(0xFF4A9EFF);
        break;
      case 'epic':
        rarityColor = const Color(0xFFB24AFF);
        break;
      case 'legendary':
        rarityColor = const Color(0xFFFFD700);
        break;
      default:
        rarityColor = Colors.white.withOpacity(0.5);
    }

    return GestureDetector(
      onTap: () => widget.onGiftSelected(gift),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              rarityColor.withOpacity(0.2),
              rarityColor.withOpacity(0.05),
            ],
          ),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: rarityColor.withOpacity(0.3),
            width: 1,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              gift.icon,
              style: const TextStyle(fontSize: 32),
            ),
            const SizedBox(height: 8),
            Text(
              gift.name,
              style: AppTheme.bodyStyle.copyWith(
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Text(
              gift.costDisplay,
              style: AppTheme.bodyStyle.copyWith(
                fontSize: 10,
                color: rarityColor,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
