import 'package:flutter/material.dart';
import '../home/presentation/pages/home_screen.dart';

/// Main navigation widget after login
class MainNavigator extends StatelessWidget {
  const MainNavigator({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return const HomeScreen();
  }
}
