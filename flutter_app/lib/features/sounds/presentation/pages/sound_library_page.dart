import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../models/sound_category.dart';
import '../../providers/sounds_provider.dart';
import '../../providers/sound_player_provider.dart';
import '../../providers/selected_sound_provider.dart';
import '../widgets/sound_card.dart';
import '../widgets/sound_search_bar.dart';
import '../widgets/sound_category_tabs.dart';

/// TikTok-style sound library page
/// Full-screen modal for browsing and selecting sounds
class SoundLibraryPage extends ConsumerStatefulWidget {
  const SoundLibraryPage({super.key});

  /// Show as full-screen modal
  static Future<void> show(BuildContext context) {
    return Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => const SoundLibraryPage(),
        fullscreenDialog: true,
      ),
    );
  }

  @override
  ConsumerState<SoundLibraryPage> createState() => _SoundLibraryPageState();
}

class _SoundLibraryPageState extends ConsumerState<SoundLibraryPage> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    
    // Load sounds on first build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        ref.read(soundsProvider.notifier).loadSounds(refresh: true);
      }
    });

    // Setup infinite scroll
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      // Load more when 200px from bottom
      ref.read(soundsProvider.notifier).loadMore();
    }
  }

  void _onSearch(String query) {
    ref.read(soundsProvider.notifier).search(query);
  }

  void _onClearSearch() {
    _searchController.clear();
    ref.read(soundsProvider.notifier).clearSearch();
  }

  void _onCategoryChanged(SoundCategory category) {
    HapticFeedback.selectionClick();
    ref.read(soundsProvider.notifier).setCategory(category);
  }

  void _onSoundSelected(sound) {
    HapticFeedback.mediumImpact();
    
    // Update selected sound
    ref.read(selectedSoundProvider.notifier).selectSound(sound);
    
    // Stop any playing audio
    ref.read(soundPlayerProvider.notifier).stop();
    
    // Close modal and return
    Navigator.of(context).pop();
    
    // Show confirmation
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Selected: ${sound.title}'),
        duration: const Duration(seconds: 2),
        backgroundColor: AppColors.primary,
      ),
    );
  }

  Future<void> _onRefresh() async {
    await ref.read(soundsProvider.notifier).refresh();
  }

  @override
  Widget build(BuildContext context) {
    final soundsState = ref.watch(soundsProvider);
    final selectedSoundState = ref.watch(selectedSoundProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'Sounds',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            height: 1,
            color: AppColors.border,
          ),
        ),
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: SoundSearchBar(
              controller: _searchController,
              onSearch: _onSearch,
              onClear: _onClearSearch,
            ),
          ),

          // Category Tabs
          SoundCategoryTabs(
            selectedCategory: soundsState.selectedCategory,
            onCategoryChanged: _onCategoryChanged,
          ),

          const SizedBox(height: 8),

          // Sounds List
          Expanded(
            child: _buildSoundsList(soundsState, selectedSoundState),
          ),
        ],
      ),
    );
  }

  Widget _buildSoundsList(SoundsState soundsState, SelectedSoundState selectedSoundState) {
    if (soundsState.isLoading && soundsState.sounds.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(
          color: AppColors.primary,
        ),
      );
    }

    if (soundsState.error != null && soundsState.sounds.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.white.withValues(alpha: 0.3),
            ),
            const SizedBox(height: 16),
            Text(
              'Failed to load sounds',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.6),
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              soundsState.error!,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.4),
                fontSize: 13,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => ref.read(soundsProvider.notifier).refresh(),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
              ),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (soundsState.sounds.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.music_note,
              size: 64,
              color: Colors.white.withValues(alpha: 0.3),
            ),
            const SizedBox(height: 16),
            Text(
              'No sounds found',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.6),
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              soundsState.searchQuery != null
                  ? 'Try a different search term'
                  : 'Check back later for new sounds',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.4),
                fontSize: 13,
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _onRefresh,
      color: AppColors.primary,
      backgroundColor: AppColors.surface,
      child: ListView.builder(
        controller: _scrollController,
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.only(bottom: 80),
        itemCount: soundsState.sounds.length + (soundsState.hasMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == soundsState.sounds.length) {
            // Loading indicator for pagination
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: CircularProgressIndicator(
                  color: AppColors.primary,
                ),
              ),
            );
          }

          final sound = soundsState.sounds[index];
          final isSelected = selectedSoundState.sound?.id == sound.id;

          return SoundCard(
            sound: sound,
            isSelected: isSelected,
            onTap: () => _onSoundSelected(sound),
          );
        },
      ),
    );
  }
}

