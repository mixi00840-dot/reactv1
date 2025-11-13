import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../utils/network_utils.dart';

/// Network status indicator widget
class NetworkStatusIndicator extends ConsumerStatefulWidget {
  final Widget child;

  const NetworkStatusIndicator({
    Key? key,
    required this.child,
  }) : super(key: key);

  @override
  ConsumerState<NetworkStatusIndicator> createState() =>
      _NetworkStatusIndicatorState();
}

class _NetworkStatusIndicatorState
    extends ConsumerState<NetworkStatusIndicator> {
  bool _isOnline = true;
  bool _showBanner = false;

  @override
  void initState() {
    super.initState();
    _checkInitialConnection();
    _listenToConnectivityChanges();
  }

  Future<void> _checkInitialConnection() async {
    final isOnline = await NetworkUtils.hasInternetConnection();
    if (mounted) {
      setState(() {
        _isOnline = isOnline;
        _showBanner = !isOnline;
      });
    }
  }

  void _listenToConnectivityChanges() {
    NetworkUtils.onConnectivityChanged.listen((result) async {
      final isOnline = await NetworkUtils.hasInternetConnection();
      
      if (mounted && _isOnline != isOnline) {
        setState(() {
          _isOnline = isOnline;
          _showBanner = true;
        });

        // Hide banner after 3 seconds if connection is restored
        if (isOnline) {
          Future.delayed(const Duration(seconds: 3), () {
            if (mounted) {
              setState(() {
                _showBanner = false;
              });
            }
          });
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        widget.child,
        if (_showBanner)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              color: _isOnline ? AppColors.success : AppColors.error,
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
              child: SafeArea(
                bottom: false,
                child: Row(
                  children: [
                    Icon(
                      _isOnline ? Icons.wifi : Icons.wifi_off,
                      color: Colors.white,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _isOnline
                            ? 'Connection restored'
                            : 'No internet connection',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                    if (!_isOnline)
                      TextButton(
                        onPressed: _checkInitialConnection,
                        child: const Text(
                          'RETRY',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}

/// Provider for network status
final networkStatusProvider = StreamProvider<bool>((ref) async* {
  // Initial check
  yield await NetworkUtils.hasInternetConnection();

  // Listen to connectivity changes
  await for (final _ in NetworkUtils.onConnectivityChanged) {
    yield await NetworkUtils.hasInternetConnection();
  }
});
