import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../features/shop/providers/product_provider.dart';

class TestProductsWidget extends ConsumerWidget {
  const TestProductsWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productsAsync = ref.watch(featuredProductsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Test Products')),
      body: Center(
        child: productsAsync.when(
          data: (products) {
            return Column(
              children: [
                Text('✅ Loaded ${products.length} products'),
                Expanded(
                  child: ListView.builder(
                    itemCount: products.length,
                    itemBuilder: (context, index) {
                      final product = products[index];
                      return ListTile(
                        title: Text(product.title),
                        subtitle: Text('\$${product.price}'),
                        leading: product.images.isNotEmpty 
                          ? Image.network(
                              product.images.first,
                              width: 50,
                              errorBuilder: (context, error, stackTrace) => 
                                const Icon(Icons.image_not_supported),
                            )
                          : const Icon(Icons.shopping_bag),
                      );
                    },
                  ),
                ),
              ],
            );
          },
          loading: () => const CircularProgressIndicator(),
          error: (error, stack) => Column(
            children: [
              Text('❌ Error: $error'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.invalidate(featuredProductsProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}