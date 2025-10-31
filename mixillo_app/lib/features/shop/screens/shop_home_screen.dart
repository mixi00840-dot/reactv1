import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../models/product_model.dart';
import '../widgets/product_card.dart';
import '../widgets/category_chip.dart';
import 'product_details_screen.dart';
import 'cart_screen.dart';
import 'package:provider/provider.dart';
import '../services/cart_service.dart';

class ShopHomeScreen extends StatefulWidget {
  const ShopHomeScreen({super.key});

  @override
  State<ShopHomeScreen> createState() => _ShopHomeScreenState();
}

class _ShopHomeScreenState extends State<ShopHomeScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedCategory = 'All';

  final List<String> _categories = [
    'All',
    'Fashion',
    'Electronics',
    'Home',
    'Beauty',
    'Sports',
    'Books',
  ];

  // Sample products
  final List<ProductModel> _products = [
    ProductModel(
      id: '1',
      name: 'Wireless Headphones',
      description: 'Premium noise-canceling wireless headphones with 30-hour battery life',
      price: 89.99,
      originalPrice: 129.99,
      sellerId: 'seller1',
      sellerName: 'TechStore',
      sellerAvatar: 'https://i.pravatar.cc/150?img=11',
      images: [
        'https://picsum.photos/400/400?random=1',
        'https://picsum.photos/400/400?random=2',
      ],
      category: 'Electronics',
      rating: 4.5,
      reviewCount: 128,
      stock: 45,
      variants: [
        ProductVariant(id: 'v1', name: 'Black', type: 'color'),
        ProductVariant(id: 'v2', name: 'White', type: 'color'),
      ],
      isFeatured: true,
      isTrending: true,
    ),
    ProductModel(
      id: '2',
      name: 'Smart Watch Pro',
      description: 'Advanced fitness tracker with heart rate monitor and GPS',
      price: 199.99,
      sellerId: 'seller2',
      sellerName: 'WearablesTech',
      sellerAvatar: 'https://i.pravatar.cc/150?img=12',
      images: ['https://picsum.photos/400/400?random=3'],
      category: 'Electronics',
      rating: 4.8,
      reviewCount: 256,
      stock: 23,
      variants: [],
      isFeatured: true,
    ),
    ProductModel(
      id: '3',
      name: 'Designer Backpack',
      description: 'Stylish and durable backpack perfect for travel',
      price: 49.99,
      originalPrice: 79.99,
      sellerId: 'seller3',
      sellerName: 'FashionHub',
      sellerAvatar: 'https://i.pravatar.cc/150?img=13',
      images: ['https://picsum.photos/400/400?random=4'],
      category: 'Fashion',
      rating: 4.3,
      reviewCount: 89,
      stock: 67,
      variants: [],
      isTrending: true,
    ),
    ProductModel(
      id: '4',
      name: 'Organic Face Cream',
      description: 'Natural ingredients for smooth and glowing skin',
      price: 29.99,
      sellerId: 'seller4',
      sellerName: 'BeautyNaturals',
      sellerAvatar: 'https://i.pravatar.cc/150?img=14',
      images: ['https://picsum.photos/400/400?random=5'],
      category: 'Beauty',
      rating: 4.7,
      reviewCount: 342,
      stock: 156,
      variants: [],
    ),
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<ProductModel> get _filteredProducts {
    var products = _products;

    if (_selectedCategory != 'All') {
      products = products.where((p) => p.category == _selectedCategory).toList();
    }

    if (_searchController.text.isNotEmpty) {
      final query = _searchController.text.toLowerCase();
      products = products
          .where((p) =>
              p.name.toLowerCase().contains(query) ||
              p.description.toLowerCase().contains(query))
          .toList();
    }

    return products;
  }

  List<ProductModel> get _featuredProducts =>
      _products.where((p) => p.isFeatured).toList();

  List<ProductModel> get _trendingProducts =>
      _products.where((p) => p.isTrending).toList();

  void _openCart() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const CartScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cartService = Provider.of<CartService>(context);

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.darkCard : AppColors.lightCard,
        title: const Text('Shop'),
        actions: [
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.shopping_cart_outlined),
                onPressed: _openCart,
              ),
              if (cartService.itemCount > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: AppColors.secondary,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 18,
                      minHeight: 18,
                    ),
                    child: Text(
                      '${cartService.itemCount}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
      body: CustomScrollView(
        slivers: [
          // Search Bar
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: TextField(
                controller: _searchController,
                style: TextStyle(color: isDark ? Colors.white : Colors.black),
                decoration: InputDecoration(
                  hintText: 'Search products...',
                  hintStyle: TextStyle(
                    color: isDark ? Colors.white54 : Colors.black54,
                  ),
                  prefixIcon: Icon(
                    Icons.search,
                    color: isDark ? Colors.white70 : Colors.black54,
                  ),
                  filled: true,
                  fillColor: isDark ? AppColors.darkCard : AppColors.lightCard,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
                onChanged: (value) => setState(() {}),
              ),
            ),
          ),

          // Categories
          SliverToBoxAdapter(
            child: SizedBox(
              height: 50,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _categories.length,
                itemBuilder: (context, index) {
                  return CategoryChip(
                    label: _categories[index],
                    isSelected: _selectedCategory == _categories[index],
                    onTap: () {
                      setState(() {
                        _selectedCategory = _categories[index];
                      });
                    },
                  );
                },
              ),
            ),
          ),

          // Featured Products
          if (_featuredProducts.isNotEmpty && _selectedCategory == 'All') ...[
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  'Featured Products',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : Colors.black,
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 280,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: _featuredProducts.length,
                  itemBuilder: (context, index) {
                    return SizedBox(
                      width: 180,
                      child: ProductCard(
                        product: _featuredProducts[index],
                        onTap: () => _openProductDetails(_featuredProducts[index]),
                      ),
                    );
                  },
                ),
              ),
            ),
          ],

          // All Products
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.65,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
              ),
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  return ProductCard(
                    product: _filteredProducts[index],
                    onTap: () => _openProductDetails(_filteredProducts[index]),
                  );
                },
                childCount: _filteredProducts.length,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _openProductDetails(ProductModel product) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ProductDetailsScreen(product: product),
      ),
    );
  }
}
