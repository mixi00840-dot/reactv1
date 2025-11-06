import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SearchHistoryWidget extends StatefulWidget {
  final Function(String) onHistoryTap;

  const SearchHistoryWidget({
    super.key,
    required this.onHistoryTap,
  });

  @override
  State<SearchHistoryWidget> createState() => _SearchHistoryWidgetState();
}

class _SearchHistoryWidgetState extends State<SearchHistoryWidget> {
  List<String> _searchHistory = [];
  static const String _historyKey = 'search_history';
  static const int _maxHistoryItems = 10;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _searchHistory = prefs.getStringList(_historyKey) ?? [
        'Dance videos',
        '#fyp',
        'Comedy',
        'Cooking recipes',
        '@user123',
      ];
    });
  }

  Future<void> _saveHistory() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_historyKey, _searchHistory);
  }

  Future<void> _addToHistory(String query) async {
    setState(() {
      _searchHistory.remove(query); // Remove if exists
      _searchHistory.insert(0, query); // Add to top
      if (_searchHistory.length > _maxHistoryItems) {
        _searchHistory = _searchHistory.sublist(0, _maxHistoryItems);
      }
    });
    await _saveHistory();
  }

  Future<void> _removeFromHistory(String query) async {
    setState(() {
      _searchHistory.remove(query);
    });
    await _saveHistory();
  }

  Future<void> _clearHistory() async {
    setState(() {
      _searchHistory.clear();
    });
    await _saveHistory();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_searchHistory.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Recent Searches',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              TextButton(
                onPressed: _clearHistory,
                child: Text(
                  'Clear All',
                  style: TextStyle(
                    color: isDark ? Colors.white70 : Colors.black54,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _searchHistory.length,
          itemBuilder: (context, index) {
            final query = _searchHistory[index];
            return ListTile(
              leading: Icon(
                _getIconForQuery(query),
                color: isDark ? Colors.white70 : Colors.black54,
              ),
              title: Text(
                query,
                style: TextStyle(
                  color: isDark ? Colors.white : Colors.black,
                  fontSize: 15,
                ),
              ),
              trailing: IconButton(
                icon: Icon(
                  Icons.close,
                  color: isDark ? Colors.white54 : Colors.black45,
                  size: 20,
                ),
                onPressed: () => _removeFromHistory(query),
              ),
              onTap: () {
                _addToHistory(query);
                widget.onHistoryTap(query);
              },
            );
          },
        ),
      ],
    );
  }

  IconData _getIconForQuery(String query) {
    if (query.startsWith('#')) {
      return Icons.tag;
    } else if (query.startsWith('@')) {
      return Icons.person;
    } else {
      return Icons.history;
    }
  }
}
