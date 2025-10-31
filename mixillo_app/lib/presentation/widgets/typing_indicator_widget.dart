import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/socket_providers.dart';
import '../../../core/theme/app_colors.dart';

/// Typing Indicator Widget
/// Shows when other users are typing in a conversation
class TypingIndicatorWidget extends ConsumerWidget {
  final String conversationId;

  const TypingIndicatorWidget({
    Key? key,
    required this.conversationId,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final typingStream = ref.watch(typingStreamProvider);

    return typingStream.when(
      data: (typingEvent) {
        // Only show if typing event is for this conversation and user is typing
        if (typingEvent.conversationId == conversationId && typingEvent.isTyping) {
          return _buildTypingIndicator(typingEvent.username);
        }
        return const SizedBox.shrink();
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }

  Widget _buildTypingIndicator(String username) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          Text(
            '$username is typing',
            style: const TextStyle(
              fontSize: 12,
              color: Colors.grey,
              fontStyle: FontStyle.italic,
            ),
          ),
          const SizedBox(width: 8),
          const _TypingDots(),
        ],
      ),
    );
  }
}

/// Animated typing dots
class _TypingDots extends StatefulWidget {
  const _TypingDots();

  @override
  State<_TypingDots> createState() => _TypingDotsState();
}

class _TypingDotsState extends State<_TypingDots>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(3, (index) {
        return AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            final delay = index * 0.2;
            final value = (_controller.value - delay).clamp(0.0, 1.0);
            final opacity = (value * 2).clamp(0.0, 1.0);

            return Container(
              margin: const EdgeInsets.symmetric(horizontal: 2),
              width: 6,
              height: 6,
              decoration: BoxDecoration(
                color: Colors.grey.withOpacity(opacity),
                shape: BoxShape.circle,
              ),
            );
          },
        );
      }),
    );
  }
}

/// Online Status Badge
/// Shows if a user is online or offline
class OnlineStatusBadge extends ConsumerWidget {
  final String userId;
  final double size;

  const OnlineStatusBadge({
    Key? key,
    required this.userId,
    this.size = 12,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final onlineStatusStream = ref.watch(onlineStatusStreamProvider);

    return onlineStatusStream.when(
      data: (statusEvent) {
        // Check if this is the user we're watching
        if (statusEvent.userId == userId) {
          return _buildBadge(statusEvent.isOnline);
        }
        return const SizedBox.shrink();
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }

  Widget _buildBadge(bool isOnline) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: isOnline ? Colors.green : Colors.grey,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 2),
      ),
    );
  }
}

/// Connection Status Indicator
/// Shows socket connection status
class ConnectionStatusIndicator extends ConsumerWidget {
  const ConnectionStatusIndicator({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final connectionStatus = ref.watch(socketConnectionProvider);

    return connectionStatus.when(
      data: (isConnected) {
        if (!isConnected) {
          return Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            color: Colors.red,
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.warning, color: Colors.white, size: 16),
                SizedBox(width: 8),
                Text(
                  'Reconnecting...',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          );
        }
        return const SizedBox.shrink();
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        color: Colors.red,
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error, color: Colors.white, size: 16),
            SizedBox(width: 8),
            Text(
              'Connection error',
              style: TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Message Status Indicator
/// Shows if message is sent, delivered, or read
class MessageStatusIndicator extends StatelessWidget {
  final String status; // 'sent', 'delivered', 'read'

  const MessageStatusIndicator({
    Key? key,
    required this.status,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    IconData icon;
    Color color;

    switch (status.toLowerCase()) {
      case 'sent':
        icon = Icons.check;
        color = Colors.grey;
        break;
      case 'delivered':
        icon = Icons.done_all;
        color = Colors.grey;
        break;
      case 'read':
        icon = Icons.done_all;
        color = AppColors.primary;
        break;
      default:
        icon = Icons.schedule;
        color = Colors.grey;
    }

    return Icon(
      icon,
      size: 14,
      color: color,
    );
  }
}
