import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';

/// Social login buttons (Google, Apple, Facebook)
class SocialLoginButtons extends StatelessWidget {
  const SocialLoginButtons({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Column(
      children: [
        _SocialButton(
          onPressed: () {
            // TODO: Implement Google Sign In
          },
          icon: Icons.g_mobiledata_rounded,
          label: 'Continue with Google',
          backgroundColor: isDark ? AppColors.darkCard : Colors.white,
          textColor: isDark ? Colors.white : Colors.black,
          borderColor: isDark ? AppColors.darkBorder : AppColors.lightBorder,
        ),
        
        const SizedBox(height: AppSpacing.md),
        
        _SocialButton(
          onPressed: () {
            // TODO: Implement Apple Sign In
          },
          icon: Icons.apple,
          label: 'Continue with Apple',
          backgroundColor: Colors.black,
          textColor: Colors.white,
          borderColor: Colors.black,
        ),
        
        const SizedBox(height: AppSpacing.md),
        
        _SocialButton(
          onPressed: () {
            // TODO: Implement Facebook Sign In
          },
          icon: Icons.facebook,
          label: 'Continue with Facebook',
          backgroundColor: const Color(0xFF1877F2),
          textColor: Colors.white,
          borderColor: const Color(0xFF1877F2),
        ),
      ],
    );
  }
}

class _SocialButton extends StatelessWidget {
  final VoidCallback onPressed;
  final IconData icon;
  final String label;
  final Color backgroundColor;
  final Color textColor;
  final Color borderColor;

  const _SocialButton({
    Key? key,
    required this.onPressed,
    required this.icon,
    required this.label,
    required this.backgroundColor,
    required this.textColor,
    required this.borderColor,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      height: AppSpacing.buttonHeightMd,
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: Border.all(
          color: borderColor,
          width: 1.5,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                color: textColor,
                size: 24,
              ),
              const SizedBox(width: AppSpacing.md),
              Text(
                label,
                style: TextStyle(
                  color: textColor,
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.2,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
