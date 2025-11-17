import 'package:flutter/material.dart';

class FAQPage extends StatefulWidget {
  const FAQPage({super.key});

  @override
  State<FAQPage> createState() => _FAQPageState();
}

class _FAQPageState extends State<FAQPage> {
  final _searchController = TextEditingController();
  String _searchQuery = '';
  String _selectedCategory = 'All';

  final List<String> _categories = [
    'All',
    'Account',
    'Payments',
    'Content',
    'Shopping',
    'Live Streaming',
    'Security',
    'Technical',
  ];

  final List<Map<String, dynamic>> _faqs = [
    {
      'category': 'Account',
      'question': 'How do I create an account?',
      'answer':
          'To create an account, tap the "Sign Up" button on the login screen. You can register using your email, phone number, or social media accounts (Google, Facebook, Apple).',
    },
    {
      'category': 'Account',
      'question': 'How do I reset my password?',
      'answer':
          'Tap "Forgot Password" on the login screen, enter your email or phone number, and follow the instructions sent to you. You\'ll receive a verification code to reset your password.',
    },
    {
      'category': 'Account',
      'question': 'Can I change my username?',
      'answer':
          'Yes, you can change your username once every 30 days. Go to Profile > Edit Profile > Username. Note that your username must be unique and follow our community guidelines.',
    },
    {
      'category': 'Payments',
      'question': 'What payment methods are accepted?',
      'answer':
          'We accept credit/debit cards (Visa, Mastercard, Amex), PayPal, and wallet balance. All transactions are secure and encrypted.',
    },
    {
      'category': 'Payments',
      'question': 'How do I add coins to my wallet?',
      'answer':
          'Go to Wallet > Buy Coins, select a package, and complete the payment. Coins are added instantly to your account.',
    },
    {
      'category': 'Payments',
      'question': 'How long does withdrawal take?',
      'answer':
          'Withdrawals typically take 3-5 business days to process. A 2.5% processing fee applies to all withdrawals.',
    },
    {
      'category': 'Content',
      'question': 'What video formats are supported?',
      'answer':
          'We support MP4, MOV, and AVI formats. Maximum file size is 100MB, and videos can be up to 3 minutes long.',
    },
    {
      'category': 'Content',
      'question': 'How do I delete a post?',
      'answer':
          'Go to your post, tap the three dots menu, and select "Delete". Note that this action cannot be undone.',
    },
    {
      'category': 'Content',
      'question': 'Can I schedule posts?',
      'answer':
          'Yes! Premium users can schedule posts up to 30 days in advance. Go to Create > Schedule and set your preferred date and time.',
    },
    {
      'category': 'Shopping',
      'question': 'How do I track my order?',
      'answer':
          'Go to Profile > Orders > Select your order > Track Shipment. You\'ll see real-time tracking information and estimated delivery date.',
    },
    {
      'category': 'Shopping',
      'question': 'What is the return policy?',
      'answer':
          'You can return items within 30 days of delivery. Items must be unused and in original packaging. Shipping fees are non-refundable.',
    },
    {
      'category': 'Shopping',
      'question': 'How do I use a coupon code?',
      'answer':
          'At checkout, tap "Apply Coupon", enter your code, and tap "Apply". The discount will be reflected in your total amount.',
    },
    {
      'category': 'Live Streaming',
      'question': 'How do I start a live stream?',
      'answer':
          'Tap the + button, select "Go Live", add a title and description, and tap "Start Live Stream". Make sure you have a stable internet connection.',
    },
    {
      'category': 'Live Streaming',
      'question': 'Can I schedule a live stream?',
      'answer':
          'Yes! Go to Live > Schedule, set your date, time, and details. Your followers will be notified 15 minutes before you go live.',
    },
    {
      'category': 'Live Streaming',
      'question': 'What are virtual gifts?',
      'answer':
          'Virtual gifts are digital items viewers can send during your live stream. You earn coins from gifts, which can be withdrawn as real money.',
    },
    {
      'category': 'Security',
      'question': 'How do I report inappropriate content?',
      'answer':
          'Tap the three dots on any content, select "Report", choose a reason, and submit. Our moderation team reviews all reports within 24 hours.',
    },
    {
      'category': 'Security',
      'question': 'How do I block someone?',
      'answer':
          'Go to their profile, tap the three dots menu, and select "Block". Blocked users cannot view your content or contact you.',
    },
    {
      'category': 'Security',
      'question': 'Is my payment information secure?',
      'answer':
          'Yes, all payment information is encrypted using industry-standard SSL technology. We never store your full card details.',
    },
    {
      'category': 'Technical',
      'question': 'Why is the app running slowly?',
      'answer':
          'Try clearing the app cache (Settings > Clear Cache), ensure you have the latest version, and check your internet connection. Restart the app if issues persist.',
    },
    {
      'category': 'Technical',
      'question': 'Videos won\'t upload. What should I do?',
      'answer':
          'Check your internet connection, ensure the video is under 100MB, and in a supported format (MP4, MOV, AVI). Try compressing the video if it\'s too large.',
    },
    {
      'category': 'Technical',
      'question': 'How do I enable notifications?',
      'answer':
          'Go to Settings > Notifications and enable the types of notifications you want to receive. Make sure notifications are enabled in your device settings too.',
    },
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<Map<String, dynamic>> get filteredFAQs {
    return _faqs.where((faq) {
      final matchesCategory =
          _selectedCategory == 'All' || faq['category'] == _selectedCategory;
      final matchesSearch = _searchQuery.isEmpty ||
          faq['question'].toLowerCase().contains(_searchQuery.toLowerCase()) ||
          faq['answer'].toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('FAQ & Help'),
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search for help...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          setState(() {
                            _searchQuery = '';
                          });
                        },
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              onChanged: (value) {
                setState(() {
                  _searchQuery = value;
                });
              },
            ),
          ),

          // Category chips
          SizedBox(
            height: 50,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _categories.length,
              itemBuilder: (context, index) {
                final category = _categories[index];
                final isSelected = category == _selectedCategory;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(category),
                    selected: isSelected,
                    onSelected: (selected) {
                      setState(() {
                        _selectedCategory = category;
                      });
                    },
                  ),
                );
              },
            ),
          ),

          const SizedBox(height: 8),

          // FAQ list
          Expanded(
            child: filteredFAQs.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.search_off,
                          size: 64,
                          color: Colors.grey.shade400,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No results found',
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Try different keywords or category',
                          style: TextStyle(
                            color: Colors.grey.shade500,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: filteredFAQs.length,
                    itemBuilder: (context, index) {
                      final faq = filteredFAQs[index];
                      return _FAQItem(
                        question: faq['question'],
                        answer: faq['answer'],
                        category: faq['category'],
                      );
                    },
                  ),
          ),

          // Contact support button
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.3),
                  spreadRadius: 1,
                  blurRadius: 4,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: Column(
              children: [
                const Text(
                  'Still need help?',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey,
                  ),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.of(context).pushNamed('/support-tickets');
                    },
                    icon: const Icon(Icons.support_agent),
                    label: const Text('Contact Support'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FAQItem extends StatefulWidget {
  final String question;
  final String answer;
  final String category;

  const _FAQItem({
    required this.question,
    required this.answer,
    required this.category,
  });

  @override
  State<_FAQItem> createState() => _FAQItemState();
}

class _FAQItemState extends State<_FAQItem> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Column(
        children: [
          InkWell(
            onTap: () {
              setState(() {
                _isExpanded = !_isExpanded;
              });
            },
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.blue.shade50,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            widget.category,
                            style: TextStyle(
                              fontSize: 10,
                              color: Colors.blue.shade700,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          widget.question,
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 15,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Icon(
                    _isExpanded
                        ? Icons.keyboard_arrow_up
                        : Icons.keyboard_arrow_down,
                    color: Colors.grey,
                  ),
                ],
              ),
            ),
          ),
          if (_isExpanded)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                border: Border(
                  top: BorderSide(color: Colors.grey.shade200),
                ),
              ),
              child: Text(
                widget.answer,
                style: TextStyle(
                  color: Colors.grey.shade700,
                  height: 1.5,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
