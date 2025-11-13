import 'package:flutter/material.dart';
import 'package:iconsax/iconsax.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_gradients.dart';
import '../../../../core/widgets/glass_widgets.dart';
import '../../data/models/user_profile_model.dart';
import '../../data/mock_profile_data.dart';

/// Wallet page for managing coins and diamonds
class WalletPage extends StatefulWidget {
  const WalletPage({super.key});

  @override
  State<WalletPage> createState() => _WalletPageState();
}

class _WalletPageState extends State<WalletPage> {
  late WalletInfo _walletInfo;

  @override
  void initState() {
    super.initState();
    _loadWallet();
  }

  void _loadWallet() {
    final profile = MockProfileData.getCurrentUserProfile();
    setState(() {
      _walletInfo = profile.wallet ?? WalletInfo(
        id: profile.id,
        coinBalance: 0,
        diamondBalance: 0,
        recentTransactions: [],
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Wallet'),
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Balance cards
            _buildBalanceCard(),
            
            const SizedBox(height: AppSpacing.lg),
            
            // Quick actions
            Text(
              'Quick Actions',
              style: AppTypography.titleMedium.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            
            const SizedBox(height: AppSpacing.md),
            
            _buildQuickActions(),
            
            const SizedBox(height: AppSpacing.lg),
            
            // Coin packages
            Text(
              'Coin Packages',
              style: AppTypography.titleMedium.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            
            const SizedBox(height: AppSpacing.md),
            
            _buildCoinPackages(),
            
            const SizedBox(height: AppSpacing.lg),
            
            // Recent transactions
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Recent Transactions',
                  style: AppTypography.titleMedium.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextButton(
                  onPressed: () {
                    // TODO: Show all transactions
                  },
                  child: Text(
                    'See All',
                    style: AppTypography.labelMedium.copyWith(
                      color: AppColors.primary,
                    ),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: AppSpacing.sm),
            
            _buildTransactionsList(),
          ],
        ),
      ),
    );
  }

  Widget _buildBalanceCard() {
    return Container(
      decoration: BoxDecoration(
        gradient: AppGradients.accent,
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Iconsax.dollar_circle, color: AppColors.warningYellow, size: 24),
                        const SizedBox(width: AppSpacing.xs),
                        Text(
                          'Coins',
                          style: AppTypography.labelLarge.copyWith(
                            color: AppColors.textPrimary.withValues(alpha: 0.9),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      _walletInfo.coinBalance.toString(),
                      style: AppTypography.headlineMedium.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              
              Container(
                width: 1,
                height: 50,
                color: AppColors.textPrimary.withValues(alpha: 0.3),
              ),
              
              const SizedBox(width: AppSpacing.lg),
              
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Iconsax.diamonds, color: AppColors.softSkyBlue, size: 24),
                        const SizedBox(width: AppSpacing.xs),
                        Text(
                          'Diamonds',
                          style: AppTypography.labelLarge.copyWith(
                            color: AppColors.textPrimary.withValues(alpha: 0.9),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      _walletInfo.diamondBalance.toString(),
                      style: AppTypography.headlineMedium.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return Row(
      children: [
        Expanded(
          child: _buildActionButton(
            icon: Iconsax.add_circle,
            label: 'Top Up',
            onTap: () {
              // TODO: Show top up page
            },
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: _buildActionButton(
            icon: Iconsax.money_send,
            label: 'Send',
            onTap: () {
              // TODO: Show send page
            },
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: _buildActionButton(
            icon: Iconsax.convert_card,
            label: 'Convert',
            onTap: () {
              // TODO: Show convert page
            },
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: _buildActionButton(
            icon: Iconsax.money_recive,
            label: 'Withdraw',
            onTap: () {
              // TODO: Show withdraw page
            },
          ),
        ),
      ],
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: GlassContainer(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
          child: Column(
            children: [
              Icon(icon, color: AppColors.primary, size: 28),
              const SizedBox(height: AppSpacing.xs),
              Text(
                label,
                style: AppTypography.caption,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCoinPackages() {
    final packages = [
      {'coins': 100, 'price': '\$0.99', 'popular': false},
      {'coins': 500, 'price': '\$4.99', 'popular': false},
      {'coins': 1200, 'price': '\$9.99', 'popular': true},
      {'coins': 3000, 'price': '\$19.99', 'popular': false},
      {'coins': 6500, 'price': '\$49.99', 'popular': false},
      {'coins': 13000, 'price': '\$99.99', 'popular': false},
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: AppSpacing.sm,
        mainAxisSpacing: AppSpacing.sm,
        childAspectRatio: 1.5,
      ),
      itemCount: packages.length,
      itemBuilder: (context, index) {
        final package = packages[index];
        final isPopular = package['popular'] as bool;
        
        return GestureDetector(
          onTap: () {
            // TODO: Handle purchase
          },
          child: Stack(
            children: [
              GlassContainer(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Iconsax.dollar_circle,
                        color: AppColors.warningYellow,
                        size: 32,
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        '${package['coins']} Coins',
                        style: AppTypography.titleSmall.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        package['price'] as String,
                        style: AppTypography.bodyMedium.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              
              if (isPopular)
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.sm,
                      vertical: AppSpacing.xs,
                    ),
                    decoration: BoxDecoration(
                      gradient: AppGradients.accent,
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                    child: Text(
                      'Popular',
                      style: AppTypography.caption.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildTransactionsList() {
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _walletInfo.recentTransactions.length,
      itemBuilder: (context, index) {
        final transaction = _walletInfo.recentTransactions[index];
        return _buildTransactionItem(transaction);
      },
    );
  }

  Widget _buildTransactionItem(Transaction transaction) {
    IconData icon;
    Color iconColor;
    
    switch (transaction.type) {
      case TransactionType.earnings:
        icon = Iconsax.dollar_square;
        iconColor = AppColors.successGreen;
        break;
      case TransactionType.gift:
        icon = Iconsax.gift;
        iconColor = AppColors.primary;
        break;
      case TransactionType.purchase:
        icon = Iconsax.shopping_cart;
        iconColor = AppColors.softSkyBlue;
        break;
      case TransactionType.reward:
        icon = Iconsax.medal_star;
        iconColor = AppColors.warningYellow;
        break;
      case TransactionType.withdrawal:
        icon = Iconsax.money_send;
        iconColor = AppColors.warningYellow;
        break;
      case TransactionType.refund:
        icon = Iconsax.refresh;
        iconColor = AppColors.successGreen;
        break;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: GlassContainer(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(AppRadius.md),
                ),
                child: Icon(icon, color: iconColor, size: 24),
              ),
              
              const SizedBox(width: AppSpacing.md),
              
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      transaction.description,
                      style: AppTypography.bodyMedium.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      _getTimeAgo(transaction.createdAt),
                      style: AppTypography.caption.copyWith(
                        color: AppColors.textTertiary,
                      ),
                    ),
                  ],
                ),
              ),
              
              Text(
                '${transaction.isIncome ? '+' : '-'}${transaction.amount}',
                style: AppTypography.titleSmall.copyWith(
                  color: transaction.isIncome ? AppColors.successGreen : AppColors.error,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _getTimeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);
    
    if (difference.inSeconds < 60) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d ago';
    } else {
      return '${(difference.inDays / 7).floor()}w ago';
    }
  }
}
