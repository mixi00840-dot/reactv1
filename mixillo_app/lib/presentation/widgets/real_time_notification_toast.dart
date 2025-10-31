import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/socket_providers.dart';
import '../../../core/services/socket_service.dart';
import '../../../core/theme/app_colors.dart';

/// Real-time Notification Toast Widget
/// Displays notifications received via Socket.io in real-time
class RealTimeNotificationToast extends ConsumerStatefulWidget {
  final Widget child;

  const RealTimeNotificationToast({
    Key? key,
    required this.child,
  }) : super(key: key);

  @override
  ConsumerState<RealTimeNotificationToast> createState() =>
      _RealTimeNotificationToastState();
}

class _RealTimeNotificationToastState
    extends ConsumerState<RealTimeNotificationToast> {
  OverlayEntry? _overlayEntry;

  @override
  Widget build(BuildContext context) {
    // Listen to notification stream
    ref.listen<AsyncValue<NotificationEvent>>(
      notificationStreamProvider,
      (previous, next) {
        next.whenData((notification) {
          _showNotificationToast(notification);
        });
      },
    );

    // Listen to connection status
    ref.listen<AsyncValue<bool>>(
      socketConnectionProvider,
      (previous, next) {
        next.whenData((isConnected) {
          if (isConnected) {
            _showConnectionToast('Connected', Colors.green);
          } else {
            _showConnectionToast('Disconnected', Colors.red);
          }
        });
      },
    );

    return widget.child;
  }

  void _showNotificationToast(NotificationEvent notification) {
    // Remove existing overlay if any
    _removeOverlay();

    _overlayEntry = OverlayEntry(
      builder: (context) => Positioned(
        top: MediaQuery.of(context).padding.top + 8,
        left: 16,
        right: 16,
        child: Material(
          color: Colors.transparent,
          child: _NotificationToastCard(
            notification: notification,
            onTap: () {
              _removeOverlay();
              // TODO: Navigate to content
            },
            onDismiss: _removeOverlay,
          ),
        ),
      ),
    );

    Overlay.of(context).insert(_overlayEntry!);

    // Auto-dismiss after 4 seconds
    Future.delayed(const Duration(seconds: 4), () {
      _removeOverlay();
    });
  }

  void _showConnectionToast(String message, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(
              message == 'Connected' ? Icons.check_circle : Icons.error,
              color: Colors.white,
              size: 20,
            ),
            const SizedBox(width: 8),
            Text(message),
          ],
        ),
        backgroundColor: color,
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }

  void _removeOverlay() {
    _overlayEntry?.remove();
    _overlayEntry = null;
  }

  @override
  void dispose() {
    _removeOverlay();
    super.dispose();
  }
}

/// Notification Toast Card
class _NotificationToastCard extends StatelessWidget {
  final NotificationEvent notification;
  final VoidCallback onTap;
  final VoidCallback onDismiss;

  const _NotificationToastCard({
    required this.notification,
    required this.onTap,
    required this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            // Avatar with type badge
            Stack(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundImage: notification.userAvatar != null
                      ? NetworkImage(notification.userAvatar!)
                      : null,
                  backgroundColor: Colors.grey[300],
                  child: notification.userAvatar == null
                      ? Text(
                          notification.username[0].toUpperCase(),
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        )
                      : null,
                ),
                Positioned(
                  right: 0,
                  bottom: 0,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: _getNotificationTypeColor(notification.type),
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                    child: Icon(
                      _getNotificationTypeIcon(notification.type),
                      size: 10,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(width: 12),

            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: RichText(
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          text: TextSpan(
                            style: const TextStyle(
                              fontSize: 13,
                              color: Colors.black,
                            ),
                            children: [
                              TextSpan(
                                text: notification.username,
                                style: const TextStyle(fontWeight: FontWeight.w600),
                              ),
                              if (notification.isVerified)
                                const WidgetSpan(
                                  alignment: PlaceholderAlignment.middle,
                                  child: Padding(
                                    padding: EdgeInsets.only(left: 4),
                                    child: Icon(
                                      Icons.verified,
                                      size: 12,
                                      color: AppColors.primary,
                                    ),
                                  ),
                                ),
                              TextSpan(
                                text: ' ${notification.message}',
                                style: const TextStyle(fontWeight: FontWeight.normal),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'Just now',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey,
                    ),
                  ),
                ],
              ),
            ),

            // Thumbnail or dismiss button
            if (notification.contentThumbnail != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: Image.network(
                  notification.contentThumbnail!,
                  width: 40,
                  height: 40,
                  fit: BoxFit.cover,
                ),
              )
            else
              IconButton(
                icon: const Icon(Icons.close, size: 18),
                onPressed: onDismiss,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
          ],
        ),
      ),
    );
  }

  Color _getNotificationTypeColor(String type) {
    switch (type.toLowerCase()) {
      case 'like':
        return Colors.red;
      case 'comment':
        return Colors.blue;
      case 'follow':
        return Colors.green;
      case 'mention':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  IconData _getNotificationTypeIcon(String type) {
    switch (type.toLowerCase()) {
      case 'like':
        return Icons.favorite;
      case 'comment':
        return Icons.comment;
      case 'follow':
        return Icons.person_add;
      case 'mention':
        return Icons.alternate_email;
      default:
        return Icons.notifications;
    }
  }
}
