import 'package:flutter/material.dart';
import 'backend_integration_service.dart';

/// Integration Test Widget
/// Tests Flutter-Backend connectivity and core features
class IntegrationTestScreen extends StatefulWidget {
  const IntegrationTestScreen({Key? key}) : super(key: key);

  @override
  State<IntegrationTestScreen> createState() => _IntegrationTestScreenState();
}

class _IntegrationTestScreenState extends State<IntegrationTestScreen> {
  final BackendIntegrationService _backend = BackendIntegrationService();
  final List<TestResult> _results = [];
  bool _isRunning = false;

  @override
  void initState() {
    super.initState();
    _backend.initialize();
  }

  Future<void> _runTests() async {
    setState(() {
      _results.clear();
      _isRunning = true;
    });

    // Test 1: Registration
    await _runTest(
      'User Registration',
      () async {
        final result = await _backend.register(
          username: 'flutter_test_${DateTime.now().millisecondsSinceEpoch}',
          email: 'flutter_test_${DateTime.now().millisecondsSinceEpoch}@test.com',
          password: 'Test@123456',
          fullName: 'Flutter Test User',
          dateOfBirth: '2000-01-01',
          bio: 'Testing Flutter integration',
        );
        return result['user'] != null;
      },
    );

    // Test 2: Get Profile
    await _runTest(
      'Get Profile',
      () async {
        final profile = await _backend.getProfile();
        return profile['username'] != null;
      },
    );

    // Test 3: Update Profile
    await _runTest(
      'Update Profile',
      () async {
        final updated = await _backend.updateProfile(
          bio: 'Updated bio from Flutter test',
        );
        return updated['bio'] == 'Updated bio from Flutter test';
      },
    );

    // Test 4: Create Post
    await _runTest(
      'Create Post',
      () async {
        final post = await _backend.createPost(
          title: 'Test Post from Flutter',
          description: 'This is a test post created from Flutter app',
          hashtags: ['flutter', 'test', 'integration'],
        );
        return post['contentId'] != null;
      },
    );

    // Test 5: Get Content Feed
    await _runTest(
      'Get Content Feed',
      () async {
        final feed = await _backend.getContentFeed(limit: 10);
        return feed.isNotEmpty;
      },
    );

    // Test 6: Search Users
    await _runTest(
      'Search Users',
      () async {
        final users = await _backend.searchUsers('test');
        return users is List;
      },
    );

    // Test 7: Get Notifications
    await _runTest(
      'Get Notifications',
      () async {
        final notifications = await _backend.getNotifications(limit: 10);
        return notifications['notifications'] is List;
      },
    );

    // Test 8: Get Wallet Balance
    await _runTest(
      'Get Wallet Balance',
      () async {
        final balance = await _backend.getWalletBalance();
        return balance['balance'] != null;
      },
    );

    // Test 9: Send Analytics
    await _runTest(
      'Send Analytics',
      () async {
        await _backend.sendInteractions([
          {
            'contentId': 'test_content_123',
            'action': 'view',
            'duration': 5000,
            'timestamp': DateTime.now().toIso8601String(),
          }
        ]);
        return true;
      },
    );

    setState(() => _isRunning = false);
  }

  Future<void> _runTest(String name, Future<bool> Function() test) async {
    final startTime = DateTime.now();
    try {
      final success = await test();
      final duration = DateTime.now().difference(startTime);
      setState(() {
        _results.add(TestResult(
          name: name,
          success: success,
          duration: duration,
        ));
      });
    } catch (e) {
      final duration = DateTime.now().difference(startTime);
      setState(() {
        _results.add(TestResult(
          name: name,
          success: false,
          error: e.toString(),
          duration: duration,
        ));
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final passed = _results.where((r) => r.success).length;
    final failed = _results.where((r) => !r.success).length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Backend Integration Test'),
        backgroundColor: Colors.black,
      ),
      body: Column(
        children: [
          // Summary Card
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.grey[900],
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStatItem('Total', _results.length.toString(), Colors.blue),
                _buildStatItem('Passed', passed.toString(), Colors.green),
                _buildStatItem('Failed', failed.toString(), Colors.red),
                _buildStatItem(
                  'Pass Rate',
                  _results.isEmpty
                      ? '0%'
                      : '${(passed / _results.length * 100).toStringAsFixed(0)}%',
                  Colors.orange,
                ),
              ],
            ),
          ),

          // Test Results List
          Expanded(
            child: _results.isEmpty
                ? Center(
                    child: Text(
                      'Tap "Run Tests" to start',
                      style: TextStyle(color: Colors.grey[600]),
                    ),
                  )
                : ListView.builder(
                    itemCount: _results.length,
                    itemBuilder: (context, index) {
                      final result = _results[index];
                      return _buildTestResultCard(result);
                    },
                  ),
          ),

          // Run Button
          Padding(
            padding: const EdgeInsets.all(16),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isRunning ? null : _runTests,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: _isRunning
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : const Text(
                        'Run Tests',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
              ),
            ),
          ),
        ],
      ),
      backgroundColor: Colors.black,
    );
  }

  Widget _buildStatItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[400],
          ),
        ),
      ],
    );
  }

  Widget _buildTestResultCard(TestResult result) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: Colors.grey[900],
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  result.success ? Icons.check_circle : Icons.cancel,
                  color: result.success ? Colors.green : Colors.red,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    result.name,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
                Text(
                  '${result.duration.inMilliseconds}ms',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[400],
                  ),
                ),
              ],
            ),
            if (result.error != null) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.red[900]?.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  result.error!,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.red[300],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class TestResult {
  final String name;
  final bool success;
  final String? error;
  final Duration duration;

  TestResult({
    required this.name,
    required this.success,
    this.error,
    required this.duration,
  });
}
