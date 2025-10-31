import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';

class InterestSelectionScreen extends StatefulWidget {
  const InterestSelectionScreen({super.key});

  @override
  State<InterestSelectionScreen> createState() => _InterestSelectionScreenState();
}

class _InterestSelectionScreenState extends State<InterestSelectionScreen> {
  final List<InterestCategory> _interests = [
    InterestCategory(name: 'Music', icon: Icons.music_note, color: AppColors.primary),
    InterestCategory(name: 'Dance', icon: Icons.sports_gymnastics, color: AppColors.secondary),
    InterestCategory(name: 'Comedy', icon: Icons.emoji_emotions, color: AppColors.accent),
    InterestCategory(name: 'Fashion', icon: Icons.checkroom, color: AppColors.warning),
    InterestCategory(name: 'Food', icon: Icons.restaurant, color: AppColors.success),
    InterestCategory(name: 'Travel', icon: Icons.flight, color: AppColors.info),
    InterestCategory(name: 'Sports', icon: Icons.sports_soccer, color: AppColors.primary),
    InterestCategory(name: 'Gaming', icon: Icons.sports_esports, color: AppColors.secondary),
    InterestCategory(name: 'Beauty', icon: Icons.face, color: AppColors.accent),
    InterestCategory(name: 'Art', icon: Icons.palette, color: AppColors.warning),
    InterestCategory(name: 'Technology', icon: Icons.computer, color: AppColors.success),
    InterestCategory(name: 'Fitness', icon: Icons.fitness_center, color: AppColors.info),
    InterestCategory(name: 'Photography', icon: Icons.camera_alt, color: AppColors.primary),
    InterestCategory(name: 'Pets', icon: Icons.pets, color: AppColors.secondary),
    InterestCategory(name: 'Education', icon: Icons.school, color: AppColors.accent),
    InterestCategory(name: 'DIY', icon: Icons.build, color: AppColors.warning),
  ];

  final Set<String> _selectedInterests = {};

  void _toggleInterest(String interest) {
    setState(() {
      if (_selectedInterests.contains(interest)) {
        _selectedInterests.remove(interest);
      } else {
        _selectedInterests.add(interest);
      }
    });
  }

  void _continue() {
    if (_selectedInterests.length < 3) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select at least 3 interests'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }
    
    // Navigate to next onboarding screen
    context.push('/onboarding/profile-setup');
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: const Text('Choose Your Interests'),
      ),
      body: Column(
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              children: [
                Text(
                  'What are you interested in?',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Select at least 3 interests to personalize your feed',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                // Selected count
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '${_selectedInterests.length} selected',
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          // Interest Grid
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 0.85,
              ),
              itemCount: _interests.length,
              itemBuilder: (context, index) {
                final interest = _interests[index];
                final isSelected = _selectedInterests.contains(interest.name);
                
                return GestureDetector(
                  onTap: () => _toggleInterest(interest.name),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? interest.color
                          : (isDark ? AppColors.darkCard : AppColors.lightCard),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isSelected
                            ? interest.color
                            : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
                        width: 2,
                      ),
                      boxShadow: isSelected
                          ? [
                              BoxShadow(
                                color: interest.color.withOpacity(0.3),
                                blurRadius: 8,
                                offset: const Offset(0, 4),
                              ),
                            ]
                          : null,
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          interest.icon,
                          size: 40,
                          color: isSelected
                              ? Colors.white
                              : interest.color,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          interest.name,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: isSelected
                                ? Colors.white
                                : (isDark ? AppColors.darkText : AppColors.lightText),
                          ),
                          textAlign: TextAlign.center,
                        ),
                        if (isSelected) ...[
                          const SizedBox(height: 4),
                          const Icon(
                            Icons.check_circle,
                            size: 16,
                            color: Colors.white,
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          
          // Continue Button
          Padding(
            padding: const EdgeInsets.all(24.0),
            child: SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _selectedInterests.length >= 3 ? _continue : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  disabledBackgroundColor: (isDark ? AppColors.darkBorder : AppColors.lightBorder),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: const Text(
                  'Continue',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class InterestCategory {
  final String name;
  final IconData icon;
  final Color color;

  InterestCategory({
    required this.name,
    required this.icon,
    required this.color,
  });
}
