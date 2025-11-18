import 'package:flutter/material.dart';

class GiftCategoryTabs extends StatefulWidget {
  final Function(int) onCategoryChanged;

  const GiftCategoryTabs({
    Key? key,
    required this.onCategoryChanged,
  }) : super(key: key);

  @override
  State<GiftCategoryTabs> createState() => _GiftCategoryTabsState();
}

class _GiftCategoryTabsState extends State<GiftCategoryTabs>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final List<String> _categories = [
    'All',
    'Popular',
    'Cheap',
    'Premium',
    'Special',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _categories.length, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        widget.onCategoryChanged(_tabController.index);
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 50,
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        border: Border(
          bottom: BorderSide(
            color: Theme.of(context).dividerColor,
            width: 1,
          ),
        ),
      ),
      child: TabBar(
        controller: _tabController,
        isScrollable: true,
        indicatorColor: Theme.of(context).primaryColor,
        labelColor: Theme.of(context).primaryColor,
        unselectedLabelColor: Theme.of(context).textTheme.bodyMedium?.color,
        tabs: _categories.map((category) {
          return Tab(
            child: Text(
              category,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
