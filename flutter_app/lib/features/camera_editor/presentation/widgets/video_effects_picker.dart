import 'package:flutter/material.dart';
import '../../../../core/services/video_effects_service.dart';

/// Video effects picker modal
class VideoEffectsPicker extends StatefulWidget {
  final VideoEffect? currentEffect;
  final Function(VideoEffect) onEffectSelected;

  const VideoEffectsPicker({
    super.key,
    this.currentEffect,
    required this.onEffectSelected,
  });

  @override
  State<VideoEffectsPicker> createState() => _VideoEffectsPickerState();
}

class _VideoEffectsPickerState extends State<VideoEffectsPicker> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final List<String> _categories = VideoEffectsService.getCategories();
  VideoEffect? _selectedEffect;
  bool _isApplying = false;

  @override
  void initState() {
    super.initState();
    _selectedEffect = widget.currentEffect;
    _tabController = TabController(length: _categories.length, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.95),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Header
          _buildHeader(),
          
          // Category Tabs
          _buildCategoryTabs(),
          
          // Effects Grid
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: _categories.map((category) => _buildEffectsGrid(category)).toList(),
            ),
          ),
          
          // Apply Button
          _buildApplyButton(),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.close, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
          const Text(
            'Video Effects',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const Spacer(),
          if (_selectedEffect != null && _selectedEffect != VideoEffect.none)
            TextButton(
              onPressed: () {
                setState(() {
                  _selectedEffect = VideoEffect.none;
                });
              },
              child: const Text(
                'Clear',
                style: TextStyle(color: Colors.red),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildCategoryTabs() {
    return Container(
      color: Colors.black,
      child: TabBar(
        controller: _tabController,
        isScrollable: true,
        indicatorColor: Colors.pinkAccent,
        labelColor: Colors.white,
        unselectedLabelColor: Colors.grey,
        tabs: _categories.map((category) => Tab(text: category)).toList(),
      ),
    );
  }

  Widget _buildEffectsGrid(String category) {
    final effects = VideoEffectsService.getEffectsByCategory(category);
    
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.85,
      ),
      itemCount: effects.length,
      itemBuilder: (context, index) {
        final effectInfo = effects[index];
        final isSelected = _selectedEffect == effectInfo.effect;
        
        return GestureDetector(
          onTap: () {
            setState(() {
              _selectedEffect = effectInfo.effect;
            });
          },
          child: Container(
            decoration: BoxDecoration(
              color: isSelected ? Colors.pinkAccent : Colors.grey[900],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isSelected ? Colors.pinkAccent : Colors.transparent,
                width: 2,
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Icon
                Text(
                  effectInfo.icon,
                  style: const TextStyle(fontSize: 32),
                ),
                const SizedBox(height: 8),
                // Name
                Text(
                  effectInfo.displayName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                // Description
                Text(
                  effectInfo.description,
                  style: TextStyle(
                    color: Colors.grey[400],
                    fontSize: 9,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildApplyButton() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: SizedBox(
        width: double.infinity,
        height: 50,
        child: ElevatedButton(
          onPressed: _isApplying || _selectedEffect == null
              ? null
              : () {
                  if (_selectedEffect != null) {
                    widget.onEffectSelected(_selectedEffect!);
                    Navigator.pop(context);
                  }
                },
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.pinkAccent,
            disabledBackgroundColor: Colors.grey[800],
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(25),
            ),
          ),
          child: _isApplying
              ? const SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2,
                  ),
                )
              : Text(
                  _selectedEffect == VideoEffect.none ? 'Remove Effect' : 'Apply Effect',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
        ),
      ),
    );
  }
}

/// Quick effects bar for editor
class QuickEffectsBar extends StatelessWidget {
  final VideoEffect? currentEffect;
  final Function(VideoEffect) onEffectSelected;
  final Function() onMoreEffects;

  const QuickEffectsBar({
    super.key,
    this.currentEffect,
    required this.onEffectSelected,
    required this.onMoreEffects,
  });

  @override
  Widget build(BuildContext context) {
    final popularEffects = [
      VideoEffectsService.getAllEffects().firstWhere((e) => e.effect == VideoEffect.vintageSepia),
      VideoEffectsService.getAllEffects().firstWhere((e) => e.effect == VideoEffect.glitchRGB),
      VideoEffectsService.getAllEffects().firstWhere((e) => e.effect == VideoEffect.neonGlow),
      VideoEffectsService.getAllEffects().firstWhere((e) => e.effect == VideoEffect.cinematicLetterbox),
      VideoEffectsService.getAllEffects().firstWhere((e) => e.effect == VideoEffect.colorVibrant),
    ];

    return Container(
      height: 100,
      color: Colors.black.withOpacity(0.7),
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
        children: [
          // No Effect
          _buildQuickEffectItem(
            icon: '❌',
            label: 'None',
            isSelected: currentEffect == VideoEffect.none || currentEffect == null,
            onTap: () => onEffectSelected(VideoEffect.none),
          ),
          
          // Popular Effects
          ...popularEffects.map((effectInfo) => _buildQuickEffectItem(
            icon: effectInfo.icon,
            label: effectInfo.displayName,
            isSelected: currentEffect == effectInfo.effect,
            onTap: () => onEffectSelected(effectInfo.effect),
          )),
          
          // More Button
          _buildQuickEffectItem(
            icon: '➕',
            label: 'More',
            isSelected: false,
            onTap: onMoreEffects,
          ),
        ],
      ),
    );
  }

  Widget _buildQuickEffectItem({
    required String icon,
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 70,
        margin: const EdgeInsets.symmetric(horizontal: 4),
        decoration: BoxDecoration(
          color: isSelected ? Colors.pinkAccent : Colors.grey[900],
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? Colors.pinkAccent : Colors.transparent,
            width: 2,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              icon,
              style: const TextStyle(fontSize: 28),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 10,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
