import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mixillo/features/shop/widgets/error_widgets.dart';

void main() {
  group('ErrorRetryWidget', () {
    testWidgets('displays error message and retry button', (tester) async {
      bool retryPressed = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ErrorRetryWidget(
              message: 'Something went wrong',
              onRetry: () {
                retryPressed = true;
              },
            ),
          ),
        ),
      );

      // Verify error message is displayed
      expect(find.text('Something went wrong'), findsOneWidget);

      // Verify retry button exists
      expect(find.text('Retry'), findsOneWidget);

      // Tap retry button
      await tester.tap(find.text('Retry'));
      await tester.pump();

      // Verify callback was called
      expect(retryPressed, true);
    });

    testWidgets('displays custom title when provided', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ErrorRetryWidget(
              title: 'Custom Error Title',
              message: 'Error message',
              onRetry: () {},
            ),
          ),
        ),
      );

      expect(find.text('Custom Error Title'), findsOneWidget);
      expect(find.text('Error message'), findsOneWidget);
    });

    testWidgets('displays custom icon when provided', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ErrorRetryWidget(
              icon: Icons.warning,
              message: 'Warning message',
              onRetry: () {},
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.warning), findsOneWidget);
    });

    testWidgets('displays custom button text when provided', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ErrorRetryWidget(
              message: 'Error',
              buttonText: 'Try Again',
              onRetry: () {},
            ),
          ),
        ),
      );

      expect(find.text('Try Again'), findsOneWidget);
      expect(find.text('Retry'), findsNothing);
    });
  });

  group('LoadingWidget', () {
    testWidgets('displays loading indicator', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: LoadingWidget(),
          ),
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('displays loading message when provided', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: LoadingWidget(message: 'Loading products...'),
          ),
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.text('Loading products...'), findsOneWidget);
    });
  });

  group('EmptyStateWidget', () {
    testWidgets('displays empty state message', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: EmptyStateWidget(
              message: 'No items found',
            ),
          ),
        ),
      );

      expect(find.text('No items found'), findsOneWidget);
    });

    testWidgets('displays custom title when provided', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: EmptyStateWidget(
              title: 'Nothing Here',
              message: 'No items to display',
            ),
          ),
        ),
      );

      expect(find.text('Nothing Here'), findsOneWidget);
      expect(find.text('No items to display'), findsOneWidget);
    });

    testWidgets('displays action widget when provided', (tester) async {
      bool actionPressed = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EmptyStateWidget(
              message: 'No items',
              action: TextButton(
                onPressed: () {
                  actionPressed = true;
                },
                child: const Text('Add Items'),
              ),
            ),
          ),
        ),
      );

      expect(find.text('Add Items'), findsOneWidget);

      await tester.tap(find.text('Add Items'));
      await tester.pump();

      expect(actionPressed, true);
    });
  });

  group('NetworkErrorIndicator', () {
    testWidgets('displays network error message and retry button', (tester) async {
      bool retryPressed = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: NetworkErrorIndicator(
              onRetry: () {
                retryPressed = true;
              },
            ),
          ),
        ),
      );

      expect(find.text('No Internet Connection'), findsOneWidget);
      expect(find.text('Please check your internet connection and try again.'), findsOneWidget);
      expect(find.byIcon(Icons.wifi_off), findsOneWidget);

      await tester.tap(find.text('Retry'));
      await tester.pump();

      expect(retryPressed, true);
    });
  });

  group('ServerErrorIndicator', () {
    testWidgets('displays server error message and retry button', (tester) async {
      bool retryPressed = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ServerErrorIndicator(
              onRetry: () {
                retryPressed = true;
              },
            ),
          ),
        ),
      );

      expect(find.text('Server Error'), findsOneWidget);
      expect(find.byIcon(Icons.cloud_off), findsOneWidget);

      await tester.tap(find.text('Retry'));
      await tester.pump();

      expect(retryPressed, true);
    });

    testWidgets('displays custom error message when provided', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ServerErrorIndicator(
              errorMessage: 'Database connection failed',
              onRetry: () {},
            ),
          ),
        ),
      );

      expect(find.text('Database connection failed'), findsOneWidget);
    });
  });
}
