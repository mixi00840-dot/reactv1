import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/live_stream.dart';
import '../data/services/live_service.dart';

// Live service provider
final liveServiceProvider = Provider<LiveService>((ref) {
  return LiveService();
});

// Active live streams provider
final liveStreamsProvider =
    StateNotifierProvider<LiveStreamsNotifier, AsyncValue<List<LiveStream>>>(
        (ref) {
  final service = ref.watch(liveServiceProvider);
  return LiveStreamsNotifier(service);
});

class LiveStreamsNotifier extends StateNotifier<AsyncValue<List<LiveStream>>> {
  final LiveService _service;

  LiveStreamsNotifier(this._service) : super(const AsyncValue.loading()) {
    loadLiveStreams();
  }

  Future<void> loadLiveStreams() async {
    state = const AsyncValue.loading();
    try {
      final streams = await _service.getLiveStreams();
      state = AsyncValue.data(streams);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> refresh() async {
    await loadLiveStreams();
  }
}

// Single live stream provider
final singleLiveStreamProvider = StateNotifierProvider.family<
    SingleLiveStreamNotifier, AsyncValue<LiveStream>, String>((ref, streamId) {
  final service = ref.watch(liveServiceProvider);
  return SingleLiveStreamNotifier(service, streamId);
});

class SingleLiveStreamNotifier extends StateNotifier<AsyncValue<LiveStream>> {
  final LiveService _service;
  final String _streamId;

  SingleLiveStreamNotifier(this._service, this._streamId)
      : super(const AsyncValue.loading()) {
    loadStream();
  }

  Future<void> loadStream() async {
    state = const AsyncValue.loading();
    try {
      final stream = await _service.getLiveStream(_streamId);
      state = AsyncValue.data(stream);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  void updateViewerCount(int count) {
    state.whenData((stream) {
      state = AsyncValue.data(stream.copyWith(viewerCount: count));
    });
  }

  Future<void> sendGift(String giftId, int quantity) async {
    try {
      await _service.sendGift(_streamId, giftId, quantity);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> refresh() async {
    await loadStream();
  }
}

// Scheduled live streams provider
final scheduledLiveStreamsProvider = StateNotifierProvider<
    ScheduledLiveStreamsNotifier, AsyncValue<List<LiveStream>>>((ref) {
  final service = ref.watch(liveServiceProvider);
  return ScheduledLiveStreamsNotifier(service);
});

class ScheduledLiveStreamsNotifier
    extends StateNotifier<AsyncValue<List<LiveStream>>> {
  final LiveService _service;

  ScheduledLiveStreamsNotifier(this._service)
      : super(const AsyncValue.loading()) {
    loadScheduledStreams();
  }

  Future<void> loadScheduledStreams() async {
    state = const AsyncValue.loading();
    try {
      final streams = await _service.getScheduledStreams();
      state = AsyncValue.data(streams);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> scheduleStream(LiveStream stream) async {
    try {
      final scheduledStream = await _service.scheduleStream(stream);
      state.whenData((streams) {
        state = AsyncValue.data([...streams, scheduledStream]);
      });
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> deleteScheduledStream(String streamId) async {
    try {
      await _service.deleteScheduledStream(streamId);
      state.whenData((streams) {
        final updatedList = streams.where((s) => s.id != streamId).toList();
        state = AsyncValue.data(updatedList);
      });
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> refresh() async {
    await loadScheduledStreams();
  }
}

// Live stream token provider (for Agora)
final liveStreamTokenProvider =
    FutureProvider.family<String, String>((ref, streamId) async {
  final service = ref.watch(liveServiceProvider);
  return await service.getStreamToken(streamId);
});

// Current stream state (for broadcaster)
final currentStreamProvider = StateProvider<LiveStream?>((ref) => null);

// Viewer count provider
final viewerCountProvider = Provider.family<int, String>((ref, streamId) {
  final streamState = ref.watch(singleLiveStreamProvider(streamId));
  return streamState.when(
    data: (stream) => stream.viewerCount,
    loading: () => 0,
    error: (_, __) => 0,
  );
});
