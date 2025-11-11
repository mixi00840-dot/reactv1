import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_gradients.dart';
import '../../../../core/theme/app_shadows.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/glass_widgets.dart';
import 'login_page.dart';
import 'register_page.dart';

/// Premium welcome screen with TikTok-style design
class WelcomePage extends StatefulWidget {
  const WelcomePage({super.key});

  @override
  State<WelcomePage> createState() => _WelcomePageState();
}

class _WelcomePageState extends State<WelcomePage>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _logoAnimation;
  late Animation<double> _textAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    _logoAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.5, curve: Curves.elasticOut),
      ),
    );

    _textAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.3, 0.8, curve: Curves.easeOut),
      ),
    );

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      body: Container(
        width: size.width,
        height: size.height,
        decoration: BoxDecoration(
          gradient: AppGradients.backgroundDark,
        ),
        child: Stack(
          children: [
            // Animated background circles
            _buildAnimatedBackgroundCircle(
              size,
              top: -100,
              right: -100,
              color: AppColors.primary,
              delay: 0,
            ),
            _buildAnimatedBackgroundCircle(
              size,
              bottom: -150,
              left: -100,
              color: AppColors.electricBlue,
              delay: 200,
            ),
            _buildAnimatedBackgroundCircle(
              size,
              top: size.height * 0.3,
              right: -80,
              color: AppColors.softSkyBlue,
              delay: 400,
            ),
            
            // Content
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.xl,
                  vertical: AppSpacing.lg,
                ),
                child: Column(
                  children: [
                    const Spacer(),
                    
                    // Logo animation
                    ScaleTransition(
                      scale: _logoAnimation,
                      child: FadeIn(
                        duration: const Duration(milliseconds: 800),
                        child: _buildLogo(),
                      ),
                    ),
                    
                    const SizedBox(height: AppSpacing.xl),
                    
                    // Title with fade animation
                    FadeTransition(
                      opacity: _textAnimation,
                      child: SlideInUp(
                        duration: const Duration(milliseconds: 600),
                        child: ShaderMask(
                          shaderCallback: (bounds) =>
                              AppGradients.primary.createShader(bounds),
                          child: const Text(
                            'Welcome to Mixillo',
                            style: AppTypography.displaySmall,
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
                    ),
                    
                    const SizedBox(height: AppSpacing.md),
                    
                    // Subtitle
                    FadeInUp(
                      delay: const Duration(milliseconds: 400),
                      child: const Text(
                        'Create, Share, and Discover Amazing Content',
                        style: AppTypography.bodyLarge,
                        textAlign: TextAlign.center,
                      ),
                    ),
                    
                    const Spacer(),
                    
                    // Buttons
                    FadeInUp(
                      delay: const Duration(milliseconds: 600),
                      child: Column(
                        children: [
                          // Login Button
                          GradientButton(
                            text: 'Log In',
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => const LoginPage(),
                                ),
                              );
                            },
                            width: double.infinity,
                            gradient: AppGradients.primary,
                          ),
                          
                          const SizedBox(height: AppSpacing.md),
                          
                          // Register Button
                          GradientButton(
                            text: 'Create Account',
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => const RegisterPage(),
                                ),
                              );
                            },
                            width: double.infinity,
                            isOutlined: true,
                          ),
                          
                          const SizedBox(height: AppSpacing.lg),
                          
                          // Social Login Options
                          _buildSocialLoginSection(),
                        ],
                      ),
                    ),
                    
                    const SizedBox(height: AppSpacing.xl),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAnimatedBackgroundCircle(
    Size size, {
    double? top,
    double? bottom,
    double? left,
    double? right,
    required Color color,
    required int delay,
  }) {
    return Positioned(
      top: top,
      bottom: bottom,
      left: left,
      right: right,
      child: Pulse(
        duration: const Duration(milliseconds: 3000),
        infinite: true,
        delay: Duration(milliseconds: delay),
        child: Container(
          width: 300,
          height: 300,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(
              colors: [
                color.withOpacity(0.3),
                color.withOpacity(0.0),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLogo() {
    return Container(
      width: 120,
      height: 120,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: AppGradients.primary,
        boxShadow: AppShadows.neonRainbow,
      ),
      child: const Center(
        child: Icon(
          Icons.music_note_rounded,
          size: 60,
          color: AppColors.textPrimary,
        ),
      ),
    );
  }

  Widget _buildSocialLoginSection() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(child: _buildDivider()),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
              child: Text(
                'Or continue with',
                style: AppTypography.bodySmall.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
            ),
            Expanded(child: _buildDivider()),
          ],
        ),
        const SizedBox(height: AppSpacing.lg),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _buildSocialButton(Icons.g_mobiledata, 'Google'),
            const SizedBox(width: AppSpacing.md),
            _buildSocialButton(Icons.facebook, 'Facebook'),
            const SizedBox(width: AppSpacing.md),
            _buildSocialButton(Icons.apple, 'Apple'),
          ],
        ),
      ],
    );
  }

  Widget _buildDivider() {
    return Container(
      height: 1,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.transparent,
            AppColors.borderLight,
            Colors.transparent,
          ],
        ),
      ),
    );
  }

  Widget _buildSocialButton(IconData icon, String label) {
    return GlassContainer(
      padding: const EdgeInsets.all(AppSpacing.md),
      borderRadius: BorderRadius.circular(AppRadius.md),
      child: Icon(
        icon,
        size: 28,
        color: AppColors.textPrimary,
      ),
    );
  }
}
