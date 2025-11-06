import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/live_streaming_provider.dart';

/// Widget that handles streaming provider refresh on app lifecycle changes
/// Listens for app resume/foreground events and refreshes provider if needed
class StreamingProviderRefreshHandler extends StatefulWidget {
  final Widget child;

  const StreamingProviderRefreshHandler({
    super.key,
    required this.child,
  });

  @override
  State<StreamingProviderRefreshHandler> createState() =>
      _StreamingProviderRefreshHandlerState();
}

class _StreamingProviderRefreshHandlerState
    extends State<StreamingProviderRefreshHandler>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    
    // Refresh provider when app comes to foreground
    if (state == AppLifecycleState.resumed) {
      final provider = context.read<LiveStreamingProvider>();
      // Check for provider updates (only if not streaming)
      provider.checkProviderUpdate();
    }
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}

