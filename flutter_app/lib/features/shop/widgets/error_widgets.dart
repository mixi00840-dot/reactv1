import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../constants/shop_constants.dart';

/// Reusable error widget with retry functionality
class ErrorRetryWidget extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  final IconData? icon;
  final String? title;
  final String? buttonText;

  const ErrorRetryWidget({
    Key? key,
    required this.message,
    required this.onRetry,
    this.icon,
    this.title,
    this.buttonText,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(ShopConstants.defaultPaddingLarge),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon ?? Icons.error_outline,
              size: 80,
              color: AppColors.error.withOpacity(0.6),
            ),
            const SizedBox(height: ShopConstants.defaultPadding),
            Text(
              title ?? 'Oops!',
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: ShopConstants.defaultPaddingSmall),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
                height: 1.5,
              ),
            ),
            const SizedBox(height: ShopConstants.defaultPaddingLarge),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: Text(buttonText ?? 'Try Again'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 16,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(
                    ShopConstants.defaultBorderRadius,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Loading widget with message
class LoadingWidget extends StatelessWidget {
  final String? message;

  const LoadingWidget({
    Key? key,
    this.message,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
          ),
          if (message != null) ...[
            const SizedBox(height: ShopConstants.defaultPadding),
            Text(
              message!,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 14,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Empty state widget
class EmptyStateWidget extends StatelessWidget {
  final String message;
  final IconData? icon;
  final String? title;
  final Widget? action;

  const EmptyStateWidget({
    Key? key,
    required this.message,
    this.icon,
    this.title,
    this.action,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(ShopConstants.defaultPaddingLarge),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon ?? Icons.inbox_outlined,
              size: 80,
              color: AppColors.textTertiary,
            ),
            const SizedBox(height: ShopConstants.defaultPadding),
            if (title != null)
              Text(
                title!,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
            const SizedBox(height: ShopConstants.defaultPaddingSmall),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
            ),
            if (action != null) ...[
              const SizedBox(height: ShopConstants.defaultPaddingLarge),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}

/// Network error indicator
class NetworkErrorIndicator extends StatelessWidget {
  final VoidCallback onRetry;

  const NetworkErrorIndicator({
    Key? key,
    required this.onRetry,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ErrorRetryWidget(
      icon: Icons.wifi_off,
      title: 'No Internet Connection',
      message: 'Please check your internet connection and try again.',
      onRetry: onRetry,
      buttonText: 'Retry',
    );
  }
}

/// Server error indicator
class ServerErrorIndicator extends StatelessWidget {
  final VoidCallback onRetry;
  final String? errorMessage;

  const ServerErrorIndicator({
    Key? key,
    required this.onRetry,
    this.errorMessage,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ErrorRetryWidget(
      icon: Icons.cloud_off,
      title: 'Server Error',
      message: errorMessage ?? 'Unable to connect to server. Please try again later.',
      onRetry: onRetry,
      buttonText: 'Retry',
    );
  }
}
