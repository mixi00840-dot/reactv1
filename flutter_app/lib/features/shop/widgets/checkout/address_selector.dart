import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../constants/shop_constants.dart';

/// Address selector with list of saved addresses and add new option
class AddressSelector extends StatelessWidget {
  final String? selectedAddressId;
  final Function(String) onAddressSelected;

  const AddressSelector({
    Key? key,
    this.selectedAddressId,
    required this.onAddressSelected,
  }) : super(key: key);

  // Mock addresses - replace with API/state management
  static final List<Map<String, dynamic>> _addresses = [
    {
      'id': '1',
      'name': 'Home',
      'fullAddress': '123 Main Street, Apt 4B',
      'city': 'New York',
      'state': 'NY',
      'zipCode': '10001',
      'phone': '+1 (555) 123-4567',
      'isDefault': true,
    },
    {
      'id': '2',
      'name': 'Office',
      'fullAddress': '456 Business Ave, Suite 100',
      'city': 'New York',
      'state': 'NY',
      'zipCode': '10002',
      'phone': '+1 (555) 987-6543',
      'isDefault': false,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Saved Addresses
        ...List.generate(
          _addresses.length,
          (index) => _buildAddressCard(
            context,
            _addresses[index],
          ),
        ),
        
        // Add New Address Button
        const SizedBox(height: ShopConstants.defaultPadding),
        _buildAddNewAddressButton(context),
      ],
    );
  }

  Widget _buildAddressCard(BuildContext context, Map<String, dynamic> address) {
    final isSelected = selectedAddressId == address['id'];
    
    return Padding(
      padding: const EdgeInsets.only(bottom: ShopConstants.defaultPadding),
      child: GestureDetector(
        onTap: () => onAddressSelected(address['id']),
        child: AnimatedContainer(
          duration: ShopConstants.animationDurationShort,
          padding: const EdgeInsets.all(ShopConstants.defaultPadding),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(
              ShopConstants.defaultBorderRadius,
            ),
            border: Border.all(
              color: isSelected ? AppColors.primary : AppColors.border,
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Name and Default Badge
              Row(
                children: [
                  Text(
                    address['name'],
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  if (address['isDefault']) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        'Default',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ],
                  const Spacer(),
                  if (isSelected)
                    Icon(
                      Icons.check_circle,
                      color: AppColors.primary,
                      size: 24,
                    ),
                ],
              ),
              
              const SizedBox(height: ShopConstants.defaultPaddingSmall),
              
              // Full Address
              Text(
                address['fullAddress'],
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                  height: 1.5,
                ),
              ),
              
              // City, State, Zip
              Text(
                '${address['city']}, ${address['state']} ${address['zipCode']}',
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                ),
              ),
              
              const SizedBox(height: ShopConstants.defaultPaddingSmall),
              
              // Phone
              Row(
                children: [
                  Icon(
                    Icons.phone,
                    size: 16,
                    color: AppColors.textTertiary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    address['phone'],
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textTertiary,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAddNewAddressButton(BuildContext context) {
    return GestureDetector(
      onTap: () {
        // Navigate to add address page
        _showAddAddressDialog(context);
      },
      child: Container(
        padding: const EdgeInsets.all(ShopConstants.defaultPadding),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(
            ShopConstants.defaultBorderRadius,
          ),
          border: Border.all(
            color: AppColors.border,
            width: 1,
            style: BorderStyle.solid,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.add_circle_outline,
              color: AppColors.primary,
              size: 24,
            ),
            const SizedBox(width: 8),
            const Text(
              'Add New Address',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.primary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddAddressDialog(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Add new address feature coming soon!'),
        duration: Duration(seconds: 2),
      ),
    );
  }
}
