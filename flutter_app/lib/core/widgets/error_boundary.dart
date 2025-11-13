import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';

/// Enhanced error boundary that catches and displays errors gracefully
class ErrorBoundary extends StatefulWidget {
  final Widget child;
  final String title;
  final Function(FlutterErrorDetails)? onError;
  final bool showStackTrace;

  const ErrorBoundary({
    Key? key,
    required this.child,
    this.title = 'Something went wrong',
    this.onError,
    this.showStackTrace = kDebugMode,
  }) : super(key: key);

  @override
  State<ErrorBoundary> createState() => _ErrorBoundaryState();

  /// Wrap app with global error boundary
  static Widget wrapApp(Widget app) {
    return ErrorBoundary(
      title: 'App Error',
      onError: (details) {
        debugPrint('🔴 Global Error: ${details.exception}');
        debugPrint('🔴 Stack: ${details.stack}');
      },
      child: app,
    );
  }
}

class _ErrorBoundaryState extends State<ErrorBoundary> {
  FlutterErrorDetails? _error;

  @override
  void initState() {
    super.initState();
    
    // Capture Flutter framework errors
    FlutterError.onError = (details) {
      if (mounted) {
        setState(() => _error = details);
      }
      widget.onError?.call(details);
      
      // Log to console
      FlutterError.presentError(details);
    };
  }

  void _retry() {
    setState(() => _error = null);
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Scaffold(
          backgroundColor: Colors.black,
          body: _ErrorDisplay(
            title: widget.title,
            error: _error!,
            onRetry: _retry,
            showStackTrace: widget.showStackTrace,
          ),
        ),
      );
    }

    return widget.child;
  }
}

/// Error display UI
class _ErrorDisplay extends StatelessWidget {
  final String title;
  final FlutterErrorDetails error;
  final VoidCallback onRetry;
  final bool showStackTrace;

  const _ErrorDisplay({
    required this.title,
    required this.error,
    required this.onRetry,
    required this.showStackTrace,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Error icon
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.2),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.error_outline,
                size: 60,
                color: Colors.red,
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Title
            Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            
            const SizedBox(height: 12),
            
            // Error message
            Text(
              error.exception.toString(),
              style: TextStyle(
                color: Colors.grey[400],
                fontSize: 16,
              ),
              textAlign: TextAlign.center,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
            
            const SizedBox(height: 32),
            
            // Retry button
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Try Again'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.purple,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 16,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            
            // Stack trace (debug only)
            if (showStackTrace) ...[
              const SizedBox(height: 32),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.grey[900],
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: SingleChildScrollView(
                    child: SelectableText(
                      error.stack.toString(),
                      style: TextStyle(
                        color: Colors.grey[400],
                        fontFamily: 'monospace',
                        fontSize: 12,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Async error boundary for handling async operations
class AsyncErrorBoundary extends StatelessWidget {
  final Future<Widget> Function() builder;
  final Widget? loadingWidget;
  final Widget Function(Object error)? errorBuilder;

  const AsyncErrorBoundary({
    Key? key,
    required this.builder,
    this.loadingWidget,
    this.errorBuilder,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Widget>(
      future: builder(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return loadingWidget ??
              const Center(
                child: CircularProgressIndicator(color: Colors.purple),
              );
        }

        if (snapshot.hasError) {
          debugPrint('🔴 Async Error: ${snapshot.error}');
          
          if (errorBuilder != null) {
            return errorBuilder!(snapshot.error!);
          }

          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.error_outline,
                  size: 64,
                  color: Colors.red,
                ),
                const SizedBox(height: 16),
                Text(
                  'Error loading content',
                  style: TextStyle(
                    color: Colors.grey[400],
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  snapshot.error.toString(),
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 12,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          );
        }

        return snapshot.data ?? const SizedBox.shrink();
      },
    );
  }
}
