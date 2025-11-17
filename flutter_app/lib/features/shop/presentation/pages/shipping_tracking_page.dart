import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/models/models.dart';
import '../../services/shipping_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/loading_indicator.dart';
import '../../../../core/widgets/error_widget.dart';
import 'package:timeago/timeago.dart' as timeago;

/// Shipping tracking page
class ShippingTrackingPage extends ConsumerStatefulWidget {
  final String orderId;

  const ShippingTrackingPage({
    super.key,
    required this.orderId,
  });

  @override
  ConsumerState<ShippingTrackingPage> createState() =>
      _ShippingTrackingPageState();
}

class _ShippingTrackingPageState extends ConsumerState<ShippingTrackingPage> {
  final ShippingService _shippingService = ShippingService();
  ShippingModel? _shipping;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadShipping();
  }

  Future<void> _loadShipping() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final shipping = await _shippingService.getShipping(widget.orderId);
      if (mounted) {
        setState(() {
          _shipping = shipping;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Track Shipment'),
        backgroundColor: AppColors.surface,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadShipping,
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: LoadingIndicator());
    }

    if (_error != null) {
      return Center(
        child: AppErrorWidget(
          message: _error!,
          onRetry: _loadShipping,
        ),
      );
    }

    if (_shipping == null) {
      return _buildEmptyState();
    }

    return SingleChildScrollView(
      child: Column(
        children: [
          _buildShippingHeader(),
          const SizedBox(height: 16),
          _buildTrackingTimeline(),
          const SizedBox(height: 16),
          _buildShippingDetails(),
          const SizedBox(height: 16),
          _buildCarrierInfo(),
          const SizedBox(height: 16),
          _buildActionButtons(),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildShippingHeader() {
    final shipping = _shipping!;

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Icon(
            _getStatusIcon(shipping.status),
            size: 64,
            color: _getStatusColor(shipping.status),
          ),
          const SizedBox(height: 16),
          Text(
            _getStatusText(shipping.status),
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Tracking Number',
            style: TextStyle(
              fontSize: 12,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                shipping.trackingNumber,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                  letterSpacing: 1,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.copy, size: 16),
                onPressed: () {
                  // TODO: Copy to clipboard
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Tracking number copied')),
                  );
                },
              ),
            ],
          ),
          if (shipping.estimatedDelivery != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.local_shipping,
                    size: 16,
                    color: AppColors.primary,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Est. Delivery: ${_formatDate(shipping.estimatedDelivery!)}',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTrackingTimeline() {
    final shipping = _shipping!;
    final events = shipping.trackingHistory;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Tracking History',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 20),
          ...events
              .map((event) => _buildTimelineItem(
                    event.status,
                    event.description,
                    event.location ?? '',
                    event.timestamp,
                    isLast: event == events.last,
                  ))
              .toList(),
        ],
      ),
    );
  }

  Widget _buildTimelineItem(
      String status, String description, String location, DateTime timestamp,
      {bool isLast = false}) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check,
                  size: 14,
                  color: Colors.white,
                ),
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    color: AppColors.primary.withOpacity(0.3),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    description,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  if (location.isNotEmpty)
                    Text(
                      location,
                      style: TextStyle(
                        fontSize: 14,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  const SizedBox(height: 4),
                  Text(
                    timeago.format(timestamp),
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildShippingDetails() {
    final shipping = _shipping!;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Shipping Details',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 16),
          _buildDetailRow('From', shipping.origin),
          _buildDetailRow('To', shipping.destination),
          if (shipping.weight != null)
            _buildDetailRow('Weight', '${shipping.weight} kg'),
          if (shipping.dimensions != null)
            _buildDetailRow('Dimensions', shipping.dimensions!),
        ],
      ),
    );
  }

  Widget _buildCarrierInfo() {
    final shipping = _shipping!;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Carrier Information',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 16),
          _buildDetailRow('Carrier', shipping.carrier),
          _buildDetailRow('Service Type', shipping.serviceType),
          if (shipping.carrierContact != null)
            _buildDetailRow('Contact', shipping.carrierContact!),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _confirmDelivery,
              icon: const Icon(Icons.check_circle),
              label: const Text('Confirm Delivery'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: _reportIssue,
              icon: const Icon(Icons.report_problem),
              label: const Text('Report Issue'),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.red,
                side: const BorderSide(color: Colors.red),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.local_shipping,
            size: 80,
            color: AppColors.textSecondary.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'No tracking information',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Tracking details will appear here',
            style: TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  IconData _getStatusIcon(ShippingStatus status) {
    switch (status) {
      case ShippingStatus.pending:
        return Icons.schedule;
      case ShippingStatus.processing:
        return Icons.inventory_2;
      case ShippingStatus.shipped:
        return Icons.local_shipping;
      case ShippingStatus.inTransit:
        return Icons.route;
      case ShippingStatus.outForDelivery:
        return Icons.directions_walk;
      case ShippingStatus.delivered:
        return Icons.check_circle;
      case ShippingStatus.failed:
        return Icons.error;
      case ShippingStatus.returned:
        return Icons.assignment_return;
    }
  }

  Color _getStatusColor(ShippingStatus status) {
    switch (status) {
      case ShippingStatus.pending:
      case ShippingStatus.processing:
        return Colors.orange;
      case ShippingStatus.shipped:
      case ShippingStatus.inTransit:
      case ShippingStatus.outForDelivery:
        return Colors.blue;
      case ShippingStatus.delivered:
        return Colors.green;
      case ShippingStatus.failed:
      case ShippingStatus.returned:
        return Colors.red;
    }
  }

  String _getStatusText(ShippingStatus status) {
    switch (status) {
      case ShippingStatus.pending:
        return 'Order Pending';
      case ShippingStatus.processing:
        return 'Processing';
      case ShippingStatus.shipped:
        return 'Shipped';
      case ShippingStatus.inTransit:
        return 'In Transit';
      case ShippingStatus.outForDelivery:
        return 'Out for Delivery';
      case ShippingStatus.delivered:
        return 'Delivered';
      case ShippingStatus.failed:
        return 'Delivery Failed';
      case ShippingStatus.returned:
        return 'Returned';
    }
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  Future<void> _confirmDelivery() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirm Delivery'),
        content: const Text('Have you received your order?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('No'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Yes'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await _shippingService.confirmDelivery(widget.orderId);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Delivery confirmed!'),
              backgroundColor: Colors.green,
            ),
          );
          _loadShipping();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: ${e.toString()}')),
          );
        }
      }
    }
  }

  Future<void> _reportIssue() async {
    final controller = TextEditingController();

    final submitted = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Report Issue'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Please describe the issue:'),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              decoration: const InputDecoration(
                hintText: 'Describe the issue...',
                border: OutlineInputBorder(),
              ),
              maxLines: 4,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Submit'),
          ),
        ],
      ),
    );

    if (submitted == true && controller.text.trim().isNotEmpty) {
      try {
        await _shippingService.reportIssue(
          widget.orderId,
          controller.text.trim(),
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Issue reported successfully'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: ${e.toString()}')),
          );
        }
      }
    }
  }
}
