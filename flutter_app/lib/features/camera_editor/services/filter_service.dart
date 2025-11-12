import 'package:flutter/material.dart';

/// Filter category enum
enum FilterCategory {
  all,
  portrait,
  food,
  landscape,
  retro,
  creative,
}

/// Filter preset model
class FilterPreset {
  final String name;
  final ColorFilter? colorFilter;
  final String? description;
  final FilterCategory category;

  const FilterPreset({
    required this.name,
    this.colorFilter,
    this.description,
    this.category = FilterCategory.all,
  });
}

/// Filter service for applying color filters
class FilterService {
  static final FilterService _instance = FilterService._internal();
  factory FilterService() => _instance;
  FilterService._internal();

  /// Available filter presets (20+ filters organized by category)
  static final List<FilterPreset> presets = [
    // BASIC (All category)
    const FilterPreset(
      name: 'Normal',
      colorFilter: null,
      description: 'No filter',
      category: FilterCategory.all,
    ),
    FilterPreset(
      name: 'Vivid',
      colorFilter: ColorFilter.matrix(_vividMatrix),
      description: 'Enhanced colors',
      category: FilterCategory.all,
    ),
    
    // PORTRAIT FILTERS
    FilterPreset(
      name: 'Soft Glow',
      colorFilter: ColorFilter.matrix(_softGlowMatrix),
      description: 'Gentle skin softening',
      category: FilterCategory.portrait,
    ),
    FilterPreset(
      name: 'Natural Beauty',
      colorFilter: ColorFilter.matrix(_naturalBeautyMatrix),
      description: 'Subtle enhancement',
      category: FilterCategory.portrait,
    ),
    FilterPreset(
      name: 'High Fashion',
      colorFilter: ColorFilter.matrix(_highFashionMatrix),
      description: 'Bold contrast',
      category: FilterCategory.portrait,
    ),
    FilterPreset(
      name: 'Studio Light',
      colorFilter: ColorFilter.matrix(_studioLightMatrix),
      description: 'Professional lighting',
      category: FilterCategory.portrait,
    ),
    
    // FOOD FILTERS
    FilterPreset(
      name: 'Appetizing',
      colorFilter: ColorFilter.matrix(_appetizingMatrix),
      description: 'Enhance food colors',
      category: FilterCategory.food,
    ),
    FilterPreset(
      name: 'Fresh',
      colorFilter: ColorFilter.matrix(_freshMatrix),
      description: 'Crisp and clean',
      category: FilterCategory.food,
    ),
    FilterPreset(
      name: 'Gourmet',
      colorFilter: ColorFilter.matrix(_gourmetMatrix),
      description: 'Restaurant quality',
      category: FilterCategory.food,
    ),
    
    // LANDSCAPE FILTERS
    FilterPreset(
      name: 'Vivid Nature',
      colorFilter: ColorFilter.matrix(_vividNatureMatrix),
      description: 'Boost greens and blues',
      category: FilterCategory.landscape,
    ),
    FilterPreset(
      name: 'Golden Hour',
      colorFilter: ColorFilter.matrix(_goldenHourMatrix),
      description: 'Sunset warmth',
      category: FilterCategory.landscape,
    ),
    FilterPreset(
      name: 'Ocean Blue',
      colorFilter: ColorFilter.matrix(_oceanBlueMatrix),
      description: 'Deep blue tones',
      category: FilterCategory.landscape,
    ),
    FilterPreset(
      name: 'Mountain Mist',
      colorFilter: ColorFilter.matrix(_mountainMistMatrix),
      description: 'Soft atmospheric',
      category: FilterCategory.landscape,
    ),
    
    // RETRO FILTERS
    FilterPreset(
      name: 'Vintage',
      colorFilter: ColorFilter.matrix(_vintageMatrix),
      description: 'Classic sepia',
      category: FilterCategory.retro,
    ),
    FilterPreset(
      name: '80s Vibe',
      colorFilter: ColorFilter.matrix(_eightiesVibeMatrix),
      description: 'Neon nostalgia',
      category: FilterCategory.retro,
    ),
    FilterPreset(
      name: 'Polaroid',
      colorFilter: ColorFilter.matrix(_polaroidMatrix),
      description: 'Instant camera look',
      category: FilterCategory.retro,
    ),
    FilterPreset(
      name: 'Film Grain',
      colorFilter: ColorFilter.matrix(_filmGrainMatrix),
      description: 'Analog texture',
      category: FilterCategory.retro,
    ),
    
    // CREATIVE FILTERS
    FilterPreset(
      name: 'Cyberpunk',
      colorFilter: ColorFilter.matrix(_cyberpunkMatrix),
      description: 'Futuristic neon',
      category: FilterCategory.creative,
    ),
    FilterPreset(
      name: 'Pastel Dream',
      colorFilter: ColorFilter.matrix(_pastelDreamMatrix),
      description: 'Soft pastels',
      category: FilterCategory.creative,
    ),
    FilterPreset(
      name: 'High Contrast',
      colorFilter: ColorFilter.matrix(_highContrastMatrix),
      description: 'Bold and dramatic',
      category: FilterCategory.creative,
    ),
    FilterPreset(
      name: 'B&W',
      colorFilter: ColorFilter.matrix(_bwMatrix),
      description: 'Monochrome',
      category: FilterCategory.creative,
    ),
    
    // TEMPERATURE FILTERS
    FilterPreset(
      name: 'Warm',
      colorFilter: ColorFilter.matrix(_warmMatrix),
      description: 'Cozy warmth',
      category: FilterCategory.all,
    ),
    FilterPreset(
      name: 'Cool',
      colorFilter: ColorFilter.matrix(_coolMatrix),
      description: 'Icy coolness',
      category: FilterCategory.all,
    ),
    
    // ADDITIONAL PORTRAIT FILTERS
    FilterPreset(
      name: 'Dreamy',
      colorFilter: ColorFilter.matrix(_dreamyMatrix),
      description: 'Soft romantic glow',
      category: FilterCategory.portrait,
    ),
    FilterPreset(
      name: 'Magazine',
      colorFilter: ColorFilter.matrix(_magazineMatrix),
      description: 'Editorial style',
      category: FilterCategory.portrait,
    ),
    
    // ADDITIONAL LANDSCAPE FILTERS
    FilterPreset(
      name: 'Sunset Glow',
      colorFilter: ColorFilter.matrix(_sunsetGlowMatrix),
      description: 'Warm evening light',
      category: FilterCategory.landscape,
    ),
    FilterPreset(
      name: 'Forest Green',
      colorFilter: ColorFilter.matrix(_forestGreenMatrix),
      description: 'Rich nature tones',
      category: FilterCategory.landscape,
    ),
    
    // ADDITIONAL CREATIVE FILTERS
    FilterPreset(
      name: 'Neon Nights',
      colorFilter: ColorFilter.matrix(_neonNightsMatrix),
      description: 'Electric city vibes',
      category: FilterCategory.creative,
    ),
    FilterPreset(
      name: 'Arctic Blue',
      colorFilter: ColorFilter.matrix(_arcticBlueMatrix),
      description: 'Icy winter tones',
      category: FilterCategory.creative,
    ),
    FilterPreset(
      name: 'Desert Sand',
      colorFilter: ColorFilter.matrix(_desertSandMatrix),
      description: 'Warm earth tones',
      category: FilterCategory.creative,
    ),
    FilterPreset(
      name: 'Midnight',
      colorFilter: ColorFilter.matrix(_midnightMatrix),
      description: 'Deep dark mood',
      category: FilterCategory.creative,
    ),
    
    // ADDITIONAL RETRO FILTERS
    FilterPreset(
      name: 'VHS',
      colorFilter: ColorFilter.matrix(_vhsMatrix),
      description: 'Old tape aesthetic',
      category: FilterCategory.retro,
    ),
    FilterPreset(
      name: 'Faded Film',
      colorFilter: ColorFilter.matrix(_fadedFilmMatrix),
      description: 'Washed out vintage',
      category: FilterCategory.retro,
    ),
  ];

  /// Vivid filter matrix (saturation +50%)
  static final List<double> _vividMatrix = [
    1.5, -0.25, -0.25, 0, 0,
    -0.25, 1.5, -0.25, 0, 0,
    -0.25, -0.25, 1.5, 0, 0,
    0, 0, 0, 1, 0,
  ];

  /// Warm filter matrix (add yellow/orange tint)
  static final List<double> _warmMatrix = [
    1.2, 0, 0, 0, 20,
    0, 1.1, 0, 0, 10,
    0, 0, 0.9, 0, 0,
    0, 0, 0, 1, 0,
  ];

  /// Cool filter matrix (add blue tint)
  static final List<double> _coolMatrix = [
    0.9, 0, 0, 0, 0,
    0, 1.0, 0, 0, 0,
    0, 0, 1.2, 0, 20,
    0, 0, 0, 1, 0,
  ];

  /// Black & White filter matrix
  static final List<double> _bwMatrix = [
    0.2126, 0.7152, 0.0722, 0, 0,
    0.2126, 0.7152, 0.0722, 0, 0,
    0.2126, 0.7152, 0.0722, 0, 0,
    0, 0, 0, 1, 0,
  ];

  /// Vintage filter matrix (sepia + faded)
  static final List<double> _vintageMatrix = [
    0.393, 0.769, 0.189, 0, 0,
    0.349, 0.686, 0.168, 0, 0,
    0.272, 0.534, 0.131, 0, 0,
    0, 0, 0, 0.9, 0,
  ];

  // PORTRAIT FILTER MATRICES
  static final List<double> _softGlowMatrix = [
    1.05, 0, 0, 0, 10,
    0, 1.05, 0, 0, 10,
    0, 0, 1.05, 0, 10,
    0, 0, 0, 1, 0,
  ];

  static final List<double> _naturalBeautyMatrix = [
    1.1, 0, 0, 0, 5,
    0, 1.1, 0, 0, 5,
    0, 0, 1.0, 0, 5,
    0, 0, 0, 1, 0,
  ];

  static final List<double> _highFashionMatrix = [
    1.3, 0, 0, 0, 0,
    0, 1.2, 0, 0, 0,
    0, 0, 1.2, 0, 0,
    0, 0, 0, 1, 0,
  ];

  static final List<double> _studioLightMatrix = [
    1.15, 0, 0, 0, 15,
    0, 1.15, 0, 0, 15,
    0, 0, 1.1, 0, 15,
    0, 0, 0, 1, 0,
  ];

  // FOOD FILTER MATRICES
  static final List<double> _appetizingMatrix = [
    1.3, 0, 0, 0, 15,
    0, 1.2, 0, 0, 10,
    0, 0, 1.0, 0, 5,
    0, 0, 0, 1, 0,
  ];

  static final List<double> _freshMatrix = [
    1.1, 0, 0, 0, 10,
    0, 1.3, 0, 0, 15,
    0, 0, 1.1, 0, 10,
    0, 0, 0, 1, 0,
  ];

  static final List<double> _gourmetMatrix = [
    1.2, 0, 0, 0, 20,
    0, 1.15, 0, 0, 15,
    0, 0, 0.95, 0, 10,
    0, 0, 0, 1, 0,
  ];

  // LANDSCAPE FILTER MATRICES
  static final List<double> _vividNatureMatrix = [
    1.2, 0, 0, 0, 0,
    0, 1.4, 0, 0, 10,
    0, 0, 1.3, 0, 10,
    0, 0, 0, 1, 0,
  ];

  static final List<double> _goldenHourMatrix = [
    1.25, 0, 0, 0, 25,
    0, 1.15, 0, 0, 15,
    0, 0, 0.85, 0, 0,
    0, 0, 0, 1, 0,
  ];

  static final List<double> _oceanBlueMatrix = [
    0.85, 0, 0, 0, 0,
    0, 1.0, 0, 0, 5,
    0, 0, 1.3, 0, 20,
    0, 0, 0, 1, 0,
  ];

  static final List<double> _mountainMistMatrix = [
    0.95, 0, 0, 0, 15,
    0, 0.95, 0, 0, 15,
    0, 0, 1.0, 0, 20,
    0, 0, 0, 0.95, 0,
  ];

  // RETRO FILTER MATRICES
  static final List<double> _eightiesVibeMatrix = [
    1.2, 0, 0, 0, 30,
    0, 0.9, 0, 0, 10,
    0, 0, 1.3, 0, 30,
    0, 0, 0, 1, 0,
  ];

  static final List<double> _polaroidMatrix = [
    1.1, 0, 0, 0, 20,
    0, 1.05, 0, 0, 15,
    0, 0, 0.95, 0, 10,
    0, 0, 0, 0.95, 0,
  ];

  static final List<double> _filmGrainMatrix = [
    0.9, 0, 0, 0, 0,
    0, 0.9, 0, 0, 0,
    0, 0, 0.9, 0, 0,
    0, 0, 0, 1, 0,
  ];

  // CREATIVE FILTER MATRICES
  static final List<double> _cyberpunkMatrix = [
    1.3, 0, 0, 0, 20,
    0, 0.8, 0, 0, 0,
    0, 0, 1.4, 0, 40,
    0, 0, 0, 1, 0,
  ];

  static final List<double> _pastelDreamMatrix = [
    1.0, 0, 0, 0, 30,
    0, 1.0, 0, 0, 30,
    0, 0, 1.0, 0, 30,
    0, 0, 0, 0.9, 0,
  ];

  static final List<double> _highContrastMatrix = [
    1.5, 0, 0, 0, -20,
    0, 1.5, 0, 0, -20,
    0, 0, 1.5, 0, -20,
    0, 0, 0, 1, 0,
  ];

  // ADDITIONAL PORTRAIT MATRICES
  static final List<double> _dreamyMatrix = [
    1.0, 0, 0, 0, 25,
    0, 1.0, 0, 0, 25,
    0, 0, 1.05, 0, 25,
    0, 0, 0, 0.92, 0,
  ];

  static final List<double> _magazineMatrix = [
    1.25, 0, 0, 0, 10,
    0, 1.2, 0, 0, 8,
    0, 0, 1.15, 0, 5,
    0, 0, 0, 1, 0,
  ];

  // ADDITIONAL LANDSCAPE MATRICES
  static final List<double> _sunsetGlowMatrix = [
    1.3, 0, 0, 0, 35,
    0, 1.2, 0, 0, 20,
    0, 0, 0.8, 0, -10,
    0, 0, 0, 1, 0,
  ];

  static final List<double> _forestGreenMatrix = [
    0.95, 0, 0, 0, 0,
    0, 1.35, 0, 0, 15,
    0, 0, 1.1, 0, 10,
    0, 0, 0, 1, 0,
  ];

  // ADDITIONAL CREATIVE MATRICES
  static final List<double> _neonNightsMatrix = [
    1.4, 0, 0, 0, 30,
    0, 0.9, 0, 0, 10,
    0, 0, 1.5, 0, 50,
    0, 0, 0, 1, 0,
  ];

  static final List<double> _arcticBlueMatrix = [
    0.7, 0, 0, 0, 10,
    0, 0.9, 0, 0, 15,
    0, 0, 1.4, 0, 30,
    0, 0, 0, 1, 0,
  ];

  static final List<double> _desertSandMatrix = [
    1.25, 0, 0, 0, 30,
    0, 1.15, 0, 0, 20,
    0, 0, 0.9, 0, 10,
    0, 0, 0, 0.98, 0,
  ];

  static final List<double> _midnightMatrix = [
    0.7, 0, 0, 0, -15,
    0, 0.7, 0, 0, -15,
    0, 0, 0.85, 0, 5,
    0, 0, 0, 1, 0,
  ];

  // ADDITIONAL RETRO MATRICES
  static final List<double> _vhsMatrix = [
    0.95, 0, 0, 0, 10,
    0, 0.85, 0, 0, 5,
    0, 0, 0.95, 0, 10,
    0, 0, 0, 0.95, 0,
  ];

  static final List<double> _fadedFilmMatrix = [
    0.9, 0, 0, 0, 25,
    0, 0.88, 0, 0, 20,
    0, 0, 0.85, 0, 15,
    0, 0, 0, 0.90, 0,
  ];

  /// Get filter by name
  FilterPreset? getFilterByName(String name) {
    try {
      return presets.firstWhere((filter) => filter.name == name);
    } catch (e) {
      return null;
    }
  }

  /// Get filters by category
  List<FilterPreset> getFiltersByCategory(FilterCategory category) {
    if (category == FilterCategory.all) {
      return presets;
    }
    return presets.where((filter) => filter.category == category).toList();
  }

  /// Apply filter to widget
  Widget applyFilter(Widget child, String? filterName) {
    if (filterName == null || filterName == 'Normal') {
      return child;
    }

    final filter = getFilterByName(filterName);
    if (filter?.colorFilter == null) {
      return child;
    }

    return ColorFiltered(
      colorFilter: filter!.colorFilter!,
      child: child,
    );
  }
}
