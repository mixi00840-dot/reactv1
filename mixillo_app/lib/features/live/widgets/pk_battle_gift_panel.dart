import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../gifts/providers/gifts_provider.dart';
import '../../gifts/widgets/gift_catalog_widget.dart';
import '../models/pk_battle_model.dart';

class PKBattleGiftPanel extends StatefulWidget {
  final PKBattleModel battle;
  final Function(int hostNumber, String giftId, int amount) onGiftSent;

  const PKBattleGiftPanel({
    super.key,
    required this.battle,
    required this.onGiftSent,
  });

  @override
  State<PKBattleGiftPanel> createState() => _PKBattleGiftPanelState();
}

class _PKBattleGiftPanelState extends State<PKBattleGiftPanel> {
  int _selectedHost = 1; // Which host to send gift to
  String? _selectedGiftId;
  int _giftAmount = 1;

  @override
  void initState() {
    super.initState();
    // Load gifts on init
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<GiftsProvider>().loadGifts();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.bottomCenter,
          end: Alignment.topCenter,
          colors: [
            Colors.black.withOpacity(0.9),
            Colors.black.withOpacity(0.7),
            Colors.transparent,
          ],
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Host selector (for 1v1, show both hosts)
          if (widget.battle.type == BattleType.oneVsOne)
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _buildHostButton(1, widget.battle.host1.username),
                const SizedBox(width: 16),
                _buildHostButton(2, widget.battle.host2.username),
              ],
            )
          else
            // For 2v2, show all 4 hosts
            Wrap(
              spacing: 8,
              runSpacing: 8,
              alignment: WrapAlignment.center,
              children: [
                _buildHostButton(1, widget.battle.host1.username),
                _buildHostButton(2, widget.battle.host2.username),
                _buildHostButton(3, widget.battle.host3?.username ?? 'Host 3'),
                _buildHostButton(4, widget.battle.host4?.username ?? 'Host 4'),
              ],
            ),
          
          const SizedBox(height: 16),
          
          // Gift catalog (compact horizontal)
          SizedBox(
            height: 100,
            child: GiftCatalogWidget(
              onGiftSelected: (gift, quantity) {
                setState(() {
                  _selectedGiftId = gift.id;
                  _giftAmount = quantity;
                });
              },
              showCategories: false,
              compact: true,
            ),
          ),
          
          const SizedBox(height: 12),
          
          // Send button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _selectedGiftId != null && widget.battle.isActive
                  ? () {
                      widget.onGiftSent(
                        _selectedHost,
                        _selectedGiftId!,
                        _giftAmount,
                      );
                      // Reset selection
                      setState(() {
                        _selectedGiftId = null;
                      });
                    }
                  : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text(
                'Send Gift',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHostButton(int hostNumber, String username) {
    final isSelected = _selectedHost == hostNumber;
    
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedHost = hostNumber;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected 
              ? AppColors.primary 
              : Colors.white.withOpacity(0.2),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primary : Colors.transparent,
            width: 2,
          ),
        ),
        child: Text(
          username,
          style: TextStyle(
            color: Colors.white,
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}

