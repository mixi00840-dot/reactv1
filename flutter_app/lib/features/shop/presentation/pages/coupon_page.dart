import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/models/models.dart';
import '../../services/coupon_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/loading_indicator.dart';
import '../../../../core/widgets/error_widget.dart';
import '../widgets/coupon_item.dart';
import 'package:timeago/timeago.dart' as timeago;

/// Coupon management page
class CouponPage extends ConsumerStatefulWidget {
  const CouponPage({super.key});

  @override
  ConsumerState<CouponPage> createState() => _CouponPageState();
}

class _CouponPageState extends ConsumerState<CouponPage>
    with SingleTickerProviderStateMixin {
  final CouponService _couponService = CouponService();
  List<CouponModel> _coupons = [];
  bool _isLoading = true;
  String? _error;
  int _currentPage = 1;
  bool _hasMore = true;

  late TabController _tabController;
  final List<String> _tabs = ['Available', 'My Coupons', 'Used'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _tabController.addListener(_onTabChanged);
    _loadCoupons();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (_tabController.indexIsChanging) return;
    setState(() {
      _coupons.clear();
      _currentPage = 1;
      _hasMore = true;
    });
    _loadCoupons();
  }

  Future<void> _loadCoupons() async {
    if (!_hasMore || _isLoading) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      List<CouponModel> coupons;
      
      switch (_tabController.index) {
        case 0: // Available
          coupons = await _couponService.getCoupons(
            page: _currentPage,
            limit: 20,
            isActive: true,
          );
          break;
        case 1: // My Coupons
          coupons = await _couponService.getMyCoupons(
            page: _currentPage,
            limit: 20,
          );
          break;
        case 2: // Used
          coupons = await _couponService.getUsedCoupons(
            page: _currentPage,
            limit: 20,
          );
          break;
        default:
          coupons = [];
      }

      setState(() {
        if (coupons.isEmpty) {
          _hasMore = false;
        } else {
          _coupons.addAll(coupons);
          _currentPage++;
        }
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _refreshCoupons() async {
    setState(() {
      _coupons.clear();
      _currentPage = 1;
      _hasMore = true;
    });
    await _loadCoupons();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Coupons'),
        backgroundColor: AppColors.surface,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          tabs: _tabs.map((tab) => Tab(text: tab)).toList(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner),
            onPressed: _scanCouponCode,
          ),
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: _enterCouponCode,
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading && _coupons.isEmpty) {
      return const Center(child: LoadingIndicator());
    }

    if (_error != null && _coupons.isEmpty) {
      return Center(
        child: ErrorDisplay(
          message: _error!,
          onRetry: _loadCoupons,
        ),
      );
    }

    if (_coupons.isEmpty) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      onRefresh: _refreshCoupons,
      child: NotificationListener<ScrollNotification>(
        onNotification: (scrollInfo) {
          if (scrollInfo.metrics.pixels >= scrollInfo.metrics.maxScrollExtent * 0.8) {
            _loadCoupons();
          }
          return false;
        },
        child: ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: _coupons.length + (_hasMore ? 1 : 0),
          itemBuilder: (context, index) {
            if (index == _coupons.length) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(16.0),
                  child: LoadingIndicator(),
                ),
              );
            }

            final coupon = _coupons[index];
            return CouponItem(
              coupon: coupon,
              onClaim: _tabController.index == 0 ? () => _claimCoupon(coupon) : null,
              onApply: _tabController.index == 1 ? () => _applyCoupon(coupon) : null,
              onTap: () => _viewCouponDetails(coupon),
            );
          },
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    String message;
    String description;
    IconData icon;

    switch (_tabController.index) {
      case 0:
        icon = Icons.discount;
        message = 'No coupons available';
        description = 'Check back later for new deals';
        break;
      case 1:
        icon = Icons.bookmark_border;
        message = 'No coupons claimed';
        description = 'Browse available coupons to get started';
        break;
      case 2:
        icon = Icons.check_circle_outline;
        message = 'No used coupons';
        description = 'Your used coupons will appear here';
        break;
      default:
        icon = Icons.discount;
        message = 'No coupons';
        description = '';
    }

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: 80,
            color: AppColors.textSecondary.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            message,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            description,
            style: TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  void _scanCouponCode() {
    // TODO: Implement QR code scanner
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('QR code scanner coming soon')),
    );
  }

  void _enterCouponCode() {
    showDialog(
      context: context,
      builder: (context) {
        final controller = TextEditingController();
        return AlertDialog(
          title: const Text('Enter Coupon Code'),
          content: TextField(
            controller: controller,
            decoration: const InputDecoration(
              hintText: 'COUPON-CODE',
              border: OutlineInputBorder(),
            ),
            textCapitalization: TextCapitalization.characters,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                _validateCoupon(controller.text);
              },
              child: const Text('Apply'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _validateCoupon(String code) async {
    if (code.trim().isEmpty) return;

    try {
      final result = await _couponService.validateCoupon(
        code: code,
        cartTotal: 0.0, // Default cart total for validation
      );
      if (!mounted) return;

      if (result['valid'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Coupon is valid!'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Invalid or expired coupon'),
            backgroundColor: Colors.red,
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

  Future<void> _claimCoupon(CouponModel coupon) async {
    try {
      await _couponService.claimCoupon(coupon.id);
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Coupon claimed successfully!'),
          backgroundColor: Colors.green,
        ),
      );

      // Refresh list
      _refreshCoupons();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _applyCoupon(CouponModel coupon) async {
    // Copy code to clipboard
    await Clipboard.setData(ClipboardData(text: coupon.code));
    
    if (!mounted) return;
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Coupon code "${coupon.code}" copied to clipboard'),
        action: SnackBarAction(
          label: 'Shop Now',
          onPressed: () {
            Navigator.pushNamed(context, '/shop');
          },
        ),
      ),
    );
  }

  void _viewCouponDetails(CouponModel coupon) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.9,
        expand: false,
        builder: (context, scrollController) {
          return SingleChildScrollView(
            controller: scrollController,
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    coupon.title,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppColors.primary,
                        style: BorderStyle.solid,
                        width: 2,
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          coupon.code,
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                            letterSpacing: 2,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.copy),
                          onPressed: () {
                            Clipboard.setData(ClipboardData(text: coupon.code));
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Code copied!')),
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Description',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    coupon.description,
                    style: TextStyle(
                      fontSize: 14,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 24),
                  _buildDetailRow('Discount', '${coupon.discountPercentage}%'),
                  _buildDetailRow('Min Purchase', '\$${coupon.minPurchase.toStringAsFixed(2)}'),
                  if (coupon.maxDiscount != null)
                    _buildDetailRow('Max Discount', '\$${coupon.maxDiscount!.toStringAsFixed(2)}'),
                  _buildDetailRow('Valid Until', timeago.format(coupon.expiresAt ?? DateTime.now())),
                  _buildDetailRow('Usage Limit', '${coupon.usageCount}/${coupon.usageLimit}'),
                  const SizedBox(height: 24),
                  if (coupon.terms != null) ...[
                    Text(
                      'Terms & Conditions',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      coupon.terms!,
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}
