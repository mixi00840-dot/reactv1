import 'package:flutter/material.dart';
import '../../../../core/services/analytics_service.dart';
import '../../../../core/services/memory_monitor.dart';

/// Performance monitoring dashboard
class PerformanceDashboard extends StatefulWidget {
  const PerformanceDashboard({Key? key}) : super(key: key);

  @override
  State<PerformanceDashboard> createState() => _PerformanceDashboardState();
}

class _PerformanceDashboardState extends State<PerformanceDashboard> {
  Map<String, dynamic>? _performanceSummary;
  Map<String, dynamic>? _memoryStats;
  Map<String, dynamic>? _cacheStats;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  void _loadStats() {
    setState(() {
      _performanceSummary = AnalyticsService().getPerformanceSummary();
      _memoryStats = MemoryMonitor().getMemoryStats();
      _cacheStats = CacheManager().getStats();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.grey[900],
        title: const Text('Performance Dashboard'),
        actions: [
          IconButton(
            onPressed: _loadStats,
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh',
          ),
          IconButton(
            onPressed: _showActions,
            icon: const Icon(Icons.more_vert),
            tooltip: 'Actions',
          ),
        ],
      ),
      body: _performanceSummary == null
          ? const Center(child: CircularProgressIndicator(color: Colors.purple))
          : RefreshIndicator(
              onRefresh: () async => _loadStats(),
              color: Colors.purple,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Upload Stats
                  _StatCard(
                    title: '📤 Video Uploads',
                    icon: Icons.cloud_upload,
                    color: Colors.blue,
                    stats: [
                      _StatItem(
                        label: 'Attempts',
                        value: '${_performanceSummary!['upload']['attempts']}',
                      ),
                      _StatItem(
                        label: 'Successes',
                        value: '${_performanceSummary!['upload']['successes']}',
                      ),
                      _StatItem(
                        label: 'Success Rate',
                        value: '${(_performanceSummary!['upload']['successRate'] * 100).toStringAsFixed(1)}%',
                        highlighted: _performanceSummary!['upload']['successRate'] > 0.8,
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Compression Stats
                  _StatCard(
                    title: '🗜️ Video Compression',
                    icon: Icons.compress,
                    color: Colors.green,
                    stats: [
                      _StatItem(
                        label: 'Processed',
                        value: '${_performanceSummary!['compression']['count']}',
                      ),
                      _StatItem(
                        label: 'Avg Time',
                        value: '${_performanceSummary!['compression']['avgTimeSec']}s',
                        highlighted: double.parse(_performanceSummary!['compression']['avgTimeSec']) < 30,
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Effects Stats
                  _StatCard(
                    title: '✨ Video Effects',
                    icon: Icons.auto_awesome,
                    color: Colors.purple,
                    stats: [
                      _StatItem(
                        label: 'Applied',
                        value: '${_performanceSummary!['effects']['count']}',
                      ),
                      _StatItem(
                        label: 'Avg Time',
                        value: '${_performanceSummary!['effects']['avgTimeSec']}s',
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Audio Stats
                  _StatCard(
                    title: '🎵 Audio Mixing',
                    icon: Icons.audiotrack,
                    color: Colors.orange,
                    stats: [
                      _StatItem(
                        label: 'Mixed',
                        value: '${_performanceSummary!['audio']['count']}',
                      ),
                      _StatItem(
                        label: 'Avg Time',
                        value: '${_performanceSummary!['audio']['avgTimeSec']}s',
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Memory Stats
                  if (_memoryStats != null)
                    _StatCard(
                      title: '🧠 Memory Usage',
                      icon: Icons.memory,
                      color: Colors.red,
                      stats: [
                        _StatItem(
                          label: 'Current',
                          value: '${_memoryStats!['current']}MB',
                        ),
                        _StatItem(
                          label: 'Average',
                          value: '${_memoryStats!['average']}MB',
                        ),
                        _StatItem(
                          label: 'Peak',
                          value: '${_memoryStats!['peak']}MB',
                          highlighted: _memoryStats!['peak'] < 500,
                        ),
                      ],
                      action: TextButton.icon(
                        onPressed: _clearCaches,
                        icon: const Icon(Icons.delete_sweep, size: 16),
                        label: const Text('Clear Caches'),
                        style: TextButton.styleFrom(
                          foregroundColor: Colors.red,
                          textStyle: const TextStyle(fontSize: 12),
                        ),
                      ),
                    ),

                  const SizedBox(height: 16),

                  // Cache Stats
                  if (_cacheStats != null)
                    _StatCard(
                      title: '💾 Cache',
                      icon: Icons.storage,
                      color: Colors.teal,
                      stats: [
                        _StatItem(
                          label: 'Size',
                          value: '${_cacheStats!['size']}/${_cacheStats!['maxSize']}',
                        ),
                        _StatItem(
                          label: 'Utilization',
                          value: '${_cacheStats!['utilizationPercent']}%',
                        ),
                      ],
                    ),

                  const SizedBox(height: 16),

                  // System Info
                  _StatCard(
                    title: '⏱️ Session Info',
                    icon: Icons.info_outline,
                    color: Colors.grey,
                    stats: [
                      _StatItem(
                        label: 'Period',
                        value: _performanceSummary!['period'],
                      ),
                      _StatItem(
                        label: 'Total Events',
                        value: '${_performanceSummary!['totalEvents']}',
                      ),
                    ],
                  ),
                ],
              ),
            ),
    );
  }

  void _showActions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.grey[900],
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.print, color: Colors.white),
              title: const Text('Print to Console', style: TextStyle(color: Colors.white)),
              onTap: () {
                Navigator.pop(context);
                AnalyticsService().printSummary();
                MemoryMonitor().printStats();
                CacheManager().printStats();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Stats printed to console')),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete_sweep, color: Colors.red),
              title: const Text('Clear All Caches', style: TextStyle(color: Colors.white)),
              onTap: () {
                Navigator.pop(context);
                _clearCaches();
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete_forever, color: Colors.red),
              title: const Text('Clear Analytics', style: TextStyle(color: Colors.white)),
              onTap: () {
                Navigator.pop(context);
                _clearAnalytics();
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _clearCaches() async {
    await MemoryMonitor().clearCaches();
    CacheManager().clear();
    _loadStats();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('✅ Caches cleared')),
      );
    }
  }

  Future<void> _clearAnalytics() async {
    await AnalyticsService().clearMetrics();
    _loadStats();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('✅ Analytics cleared')),
      );
    }
  }
}

/// Stat card widget
class _StatCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color color;
  final List<_StatItem> stats;
  final Widget? action;

  const _StatCard({
    required this.title,
    required this.icon,
    required this.color,
    required this.stats,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[900],
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...stats.map((stat) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      stat.label,
                      style: TextStyle(
                        color: Colors.grey[400],
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      stat.value,
                      style: TextStyle(
                        color: stat.highlighted ? Colors.green : Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              )),
          if (action != null) ...[
            const SizedBox(height: 8),
            action!,
          ],
        ],
      ),
    );
  }
}

/// Stat item model
class _StatItem {
  final String label;
  final String value;
  final bool highlighted;

  _StatItem({
    required this.label,
    required this.value,
    this.highlighted = false,
  });
}
