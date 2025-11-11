import 'package:flutter/material.dart';

/// Filter preset model
class FilterPreset {
  final String name;
  final ColorFilter? colorFilter;
  final String? description;

  const FilterPreset({
    required this.name,
    this.colorFilter,
    this.description,
  });
}

/// Filter service for applying color filters
class FilterService {
  static final FilterService _instance = FilterService._internal();
  factory FilterService() => _instance;
  FilterService._internal();

  /// Available filter presets
  static final List<FilterPreset> presets = [
    const FilterPreset(
      name: 'Normal',
      colorFilter: null,
      description: 'No filter',
    ),
    FilterPreset(
      name: 'Vivid',
      colorFilter: ColorFilter.matrix(_vividMatrix),
      description: 'Enhanced colors',
    ),
    FilterPreset(
      name: 'Warm',
      colorFilter: ColorFilter.matrix(_warmMatrix),
      description: 'Warm tones',
    ),
    FilterPreset(
      name: 'Cool',
      colorFilter: ColorFilter.matrix(_coolMatrix),
      description: 'Cool tones',
    ),
    FilterPreset(
      name: 'B&W',
      colorFilter: ColorFilter.matrix(_bwMatrix),
      description: 'Black and white',
    ),
    FilterPreset(
      name: 'Vintage',
      colorFilter: ColorFilter.matrix(_vintageMatrix),
      description: 'Vintage look',
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

  /// Get filter by name
  FilterPreset? getFilterByName(String name) {
    try {
      return presets.firstWhere((filter) => filter.name == name);
    } catch (e) {
      return null;
    }
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
