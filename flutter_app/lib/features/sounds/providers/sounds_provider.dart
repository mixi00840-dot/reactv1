import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/core_providers.dart';
import '../models/sound_model.dart';
import '../models/sound_category.dart';
import '../services/sound_service.dart';

/// Provider for SoundService instance
final soundServiceProvider = Provider<SoundService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return SoundService(apiService);
});

/// State for sounds list
class SoundsState {
  final List<Sound> sounds;
  final bool isLoading;
  final bool hasMore;
  final int currentPage;
  final String? error;
  final SoundCategory selectedCategory;
  final String? searchQuery;

  const SoundsState({
    this.sounds = const [],
    this.isLoading = false,
    this.hasMore = true,
    this.currentPage = 1,
    this.error,
    this.selectedCategory = SoundCategory.all,
    this.searchQuery,
  });

  SoundsState copyWith({
    List<Sound>? sounds,
    bool? isLoading,
    bool? hasMore,
    int? currentPage,
    String? error,
    SoundCategory? selectedCategory,
    String? searchQuery,
  }) {
    return SoundsState(
      sounds: sounds ?? this.sounds,
      isLoading: isLoading ?? this.isLoading,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
      error: error,
      selectedCategory: selectedCategory ?? this.selectedCategory,
      searchQuery: searchQuery ?? this.searchQuery,
    );
  }
}

/// Sounds list provider
final soundsProvider =
    StateNotifierProvider<SoundsNotifier, SoundsState>((ref) {
  return SoundsNotifier(ref);
});

class SoundsNotifier extends StateNotifier<SoundsState> {
  final Ref _ref;

  SoundsNotifier(this._ref) : super(const SoundsState());

  SoundService get _soundService => _ref.read(soundServiceProvider);

  /// Load sounds (initial or refresh)
  Future<void> loadSounds({bool refresh = false}) async {
    if (state.isLoading) return;

    if (refresh) {
      state = state.copyWith(
        sounds: [],
        currentPage: 1,
        hasMore: true,
        isLoading: true,
        error: null,
      );
    } else {
      state = state.copyWith(isLoading: true, error: null);
    }

    try {
      final response = await _soundService.getSounds(
        page: state.currentPage,
        limit: 50,
        genre: state.selectedCategory != SoundCategory.all &&
                state.selectedCategory != SoundCategory.trending &&
                state.selectedCategory != SoundCategory.favorites
            ? state.selectedCategory.apiValue
            : null,
        search: state.searchQuery,
      );

      state = state.copyWith(
        sounds: refresh ? response.sounds : [...state.sounds, ...response.sounds],
        hasMore: response.hasMore,
        currentPage: state.currentPage,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Load more sounds (pagination)
  Future<void> loadMore() async {
    if (!state.hasMore || state.isLoading) return;

    state = state.copyWith(currentPage: state.currentPage + 1);
    await loadSounds();
  }

  /// Set category filter
  Future<void> setCategory(SoundCategory category) async {
    if (category == state.selectedCategory) return;

    if (category == SoundCategory.trending) {
      // Load trending sounds
      await loadTrending();
    } else {
      state = state.copyWith(
        selectedCategory: category,
        sounds: [],
        currentPage: 1,
        hasMore: true,
      );
      await loadSounds(refresh: true);
    }
  }

  /// Search sounds
  Future<void> search(String query) async {
    state = state.copyWith(
      searchQuery: query.isNotEmpty ? query : null,
      sounds: [],
      currentPage: 1,
      hasMore: true,
    );
    await loadSounds(refresh: true);
  }

  /// Clear search
  Future<void> clearSearch() async {
    if (state.searchQuery == null) return;
    state = state.copyWith(
      searchQuery: null,
      sounds: [],
      currentPage: 1,
      hasMore: true,
    );
    await loadSounds(refresh: true);
  }

  /// Load trending sounds
  Future<void> loadTrending() async {
    state = state.copyWith(
      isLoading: true,
      error: null,
      selectedCategory: SoundCategory.trending,
    );

    try {
      final sounds = await _soundService.getTrendingSounds(limit: 50);
      state = state.copyWith(
        sounds: sounds,
        hasMore: false,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Refresh current view
  Future<void> refresh() async {
    await loadSounds(refresh: true);
  }
}

