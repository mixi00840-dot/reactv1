import '../models/product_model_simple.dart' as product_model;

/// Mock Address Service for managing user addresses
class AddressService {
  // Mock method to get user addresses
  Future<List<product_model.Address>> getAddresses() async {
    // Simulate API delay
    await Future.delayed(const Duration(milliseconds: 500));
    
    // Return mock addresses
    return [
      const product_model.Address(
        id: '1',
        name: 'Home',
        addressLine1: '123 Main St',
        addressLine2: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        phone: '+1 555-0123',
        isDefault: true,
      ),
      const product_model.Address(
        id: '2',
        name: 'Work',
        addressLine1: '456 Broadway',
        city: 'New York',
        state: 'NY',
        zipCode: '10013',
        phone: '+1 555-0456',
        isDefault: false,
      ),
    ];
  }

  // Mock method to add address
  Future<product_model.Address> addAddress(product_model.Address address) async {
    await Future.delayed(const Duration(milliseconds: 300));
    return address;
  }

  // Mock method to update address
  Future<product_model.Address> updateAddress(product_model.Address address) async {
    await Future.delayed(const Duration(milliseconds: 300));
    return address;
  }

  // Mock method to delete address
  Future<void> deleteAddress(String addressId) async {
    await Future.delayed(const Duration(milliseconds: 300));
  }

  // Mock method to set default address
  Future<void> setDefaultAddress(String addressId) async {
    await Future.delayed(const Duration(milliseconds: 300));
  }
}