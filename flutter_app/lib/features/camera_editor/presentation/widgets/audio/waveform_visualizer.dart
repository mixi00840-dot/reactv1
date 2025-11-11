import 'package:flutter/material.dart';
import 'dart:math' as math;
import '../../../models/audio_editing_models.dart';

/// Waveform visualizer widget
class WaveformVisualizer extends StatelessWidget {
  final WaveformData? waveformData;
  final Duration? currentPosition;
  final Color waveColor;
  final Color progressColor;
  final Color backgroundColor;
  final double height;
  final double strokeWidth;
  final bool showProgress;

  const WaveformVisualizer({
    super.key,
    this.waveformData,
    this.currentPosition,
    this.waveColor = Colors.blue,
    this.progressColor = Colors.blueAccent,
    this.backgroundColor = Colors.black12,
    this.height = 80,
    this.strokeWidth = 2.0,
    this.showProgress = true,
  });

  @override
  Widget build(BuildContext context) {
    if (waveformData == null || waveformData!.samples.isEmpty) {
      return Container(
        height: height,
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Center(
          child: Text(
            'No waveform data',
            style: TextStyle(color: Colors.white54, fontSize: 12),
          ),
        ),
      );
    }

    return Container(
      height: height,
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: CustomPaint(
        size: Size.infinite,
        painter: _WaveformPainter(
          waveformData: waveformData!,
          currentPosition: currentPosition,
          waveColor: waveColor,
          progressColor: progressColor,
          strokeWidth: strokeWidth,
          showProgress: showProgress,
        ),
      ),
    );
  }
}

/// Waveform painter
class _WaveformPainter extends CustomPainter {
  final WaveformData waveformData;
  final Duration? currentPosition;
  final Color waveColor;
  final Color progressColor;
  final double strokeWidth;
  final bool showProgress;

  _WaveformPainter({
    required this.waveformData,
    this.currentPosition,
    required this.waveColor,
    required this.progressColor,
    required this.strokeWidth,
    required this.showProgress,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (waveformData.samples.isEmpty) return;

    final paint = Paint()
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    final centerY = size.height / 2;
    final samples = waveformData.samples;
    final sampleCount = samples.length;

    // Calculate progress position
    double progressX = 0.0;
    if (showProgress && currentPosition != null) {
      final progress = currentPosition!.inMilliseconds /
          waveformData.duration.inMilliseconds;
      progressX = size.width * progress.clamp(0.0, 1.0);
    }

    // Draw waveform bars
    final barWidth = size.width / sampleCount;
    final halfBarWidth = barWidth / 2;

    for (int i = 0; i < sampleCount; i++) {
      final x = i * barWidth + halfBarWidth;
      final amplitude = samples[i];
      final barHeight = amplitude * (size.height / 2) * 0.9; // 90% of max height

      // Use progress color for bars before current position
      if (showProgress && x <= progressX) {
        paint.color = progressColor;
      } else {
        paint.color = waveColor;
      }

      // Draw bar (from center to top and bottom)
      canvas.drawLine(
        Offset(x, centerY - barHeight),
        Offset(x, centerY + barHeight),
        paint,
      );
    }

    // Draw progress line
    if (showProgress && currentPosition != null && progressX > 0) {
      final progressPaint = Paint()
        ..color = Colors.white
        ..strokeWidth = 2.0;

      canvas.drawLine(
        Offset(progressX, 0),
        Offset(progressX, size.height),
        progressPaint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _WaveformPainter oldDelegate) {
    return oldDelegate.currentPosition != currentPosition ||
        oldDelegate.waveformData != waveformData;
  }
}

/// Animated waveform visualizer (for recording)
class AnimatedWaveformVisualizer extends StatefulWidget {
  final bool isRecording;
  final Color waveColor;
  final Color backgroundColor;
  final double height;
  final int barCount;

  const AnimatedWaveformVisualizer({
    super.key,
    required this.isRecording,
    this.waveColor = Colors.red,
    this.backgroundColor = Colors.black12,
    this.height = 60,
    this.barCount = 40,
  });

  @override
  State<AnimatedWaveformVisualizer> createState() =>
      _AnimatedWaveformVisualizerState();
}

class _AnimatedWaveformVisualizerState
    extends State<AnimatedWaveformVisualizer>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  final List<double> _amplitudes = [];

  @override
  void initState() {
    super.initState();
    _amplitudes.addAll(List.generate(widget.barCount, (_) => 0.1));

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
    )..addListener(_updateAmplitudes);

    if (widget.isRecording) {
      _controller.repeat();
    }
  }

  @override
  void didUpdateWidget(AnimatedWaveformVisualizer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isRecording && !oldWidget.isRecording) {
      _controller.repeat();
    } else if (!widget.isRecording && oldWidget.isRecording) {
      _controller.stop();
      _resetAmplitudes();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _updateAmplitudes() {
    if (!widget.isRecording) return;

    setState(() {
      // Simulate random amplitudes for visualization
      for (int i = 0; i < _amplitudes.length; i++) {
        _amplitudes[i] = 0.1 + (math.Random().nextDouble() * 0.9);
      }
    });
  }

  void _resetAmplitudes() {
    setState(() {
      for (int i = 0; i < _amplitudes.length; i++) {
        _amplitudes[i] = 0.1;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: widget.height,
      decoration: BoxDecoration(
        color: widget.backgroundColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: CustomPaint(
        size: Size.infinite,
        painter: _AnimatedWaveformPainter(
          amplitudes: _amplitudes,
          waveColor: widget.waveColor,
          strokeWidth: 3.0,
        ),
      ),
    );
  }
}

/// Animated waveform painter
class _AnimatedWaveformPainter extends CustomPainter {
  final List<double> amplitudes;
  final Color waveColor;
  final double strokeWidth;

  _AnimatedWaveformPainter({
    required this.amplitudes,
    required this.waveColor,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (amplitudes.isEmpty) return;

    final paint = Paint()
      ..color = waveColor
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    final centerY = size.height / 2;
    final barCount = amplitudes.length;
    final barWidth = size.width / barCount;
    final halfBarWidth = barWidth / 2;

    for (int i = 0; i < barCount; i++) {
      final x = i * barWidth + halfBarWidth;
      final amplitude = amplitudes[i];
      final barHeight = amplitude * (size.height / 2) * 0.8;

      canvas.drawLine(
        Offset(x, centerY - barHeight),
        Offset(x, centerY + barHeight),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _AnimatedWaveformPainter oldDelegate) {
    return true; // Always repaint for animation
  }
}

/// Compact waveform thumbnail
class WaveformThumbnail extends StatelessWidget {
  final WaveformData? waveformData;
  final Color waveColor;
  final double width;
  final double height;

  const WaveformThumbnail({
    super.key,
    this.waveformData,
    this.waveColor = Colors.blue,
    this.width = 100,
    this.height = 30,
  });

  @override
  Widget build(BuildContext context) {
    if (waveformData == null || waveformData!.samples.isEmpty) {
      return Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Colors.black12,
          borderRadius: BorderRadius.circular(4),
        ),
      );
    }

    return SizedBox(
      width: width,
      height: height,
      child: CustomPaint(
        painter: _WaveformThumbnailPainter(
          waveformData: waveformData!,
          waveColor: waveColor,
        ),
      ),
    );
  }
}

/// Waveform thumbnail painter
class _WaveformThumbnailPainter extends CustomPainter {
  final WaveformData waveformData;
  final Color waveColor;

  _WaveformThumbnailPainter({
    required this.waveformData,
    required this.waveColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (waveformData.samples.isEmpty) return;

    final paint = Paint()
      ..color = waveColor
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round;

    final centerY = size.height / 2;
    
    // Downsample for thumbnail
    final maxSamples = 50;
    final step = (waveformData.samples.length / maxSamples).ceil();
    final samples = <double>[];
    
    for (int i = 0; i < waveformData.samples.length; i += step) {
      samples.add(waveformData.samples[i]);
    }

    final sampleCount = samples.length;
    final barWidth = size.width / sampleCount;

    for (int i = 0; i < sampleCount; i++) {
      final x = i * barWidth + barWidth / 2;
      final amplitude = samples[i];
      final barHeight = amplitude * (size.height / 2) * 0.8;

      canvas.drawLine(
        Offset(x, centerY - barHeight),
        Offset(x, centerY + barHeight),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _WaveformThumbnailPainter oldDelegate) {
    return oldDelegate.waveformData != waveformData;
  }
}

/// Waveform with timeline markers
class WaveformWithTimeline extends StatelessWidget {
  final WaveformData? waveformData;
  final Duration? currentPosition;
  final Duration totalDuration;
  final Color waveColor;
  final Color progressColor;
  final double height;
  final Function(Duration)? onSeek;

  const WaveformWithTimeline({
    super.key,
    this.waveformData,
    this.currentPosition,
    required this.totalDuration,
    this.waveColor = Colors.blue,
    this.progressColor = Colors.blueAccent,
    this.height = 100,
    this.onSeek,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Waveform
        GestureDetector(
          onTapDown: (details) {
            if (onSeek != null) {
              final width = context.size?.width ?? 0;
              final position = details.localPosition.dx / width;
              final seekTime = Duration(
                milliseconds: (totalDuration.inMilliseconds * position).round(),
              );
              onSeek!(seekTime);
            }
          },
          child: WaveformVisualizer(
            waveformData: waveformData,
            currentPosition: currentPosition,
            waveColor: waveColor,
            progressColor: progressColor,
            height: height,
          ),
        ),

        const SizedBox(height: 4),

        // Timeline markers
        _TimelineMarkers(duration: totalDuration),
      ],
    );
  }
}

/// Timeline markers
class _TimelineMarkers extends StatelessWidget {
  final Duration duration;

  const _TimelineMarkers({required this.duration});

  @override
  Widget build(BuildContext context) {
    final markers = _generateMarkers(duration);

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: markers.map((marker) {
        return Text(
          _formatDuration(marker),
          style: const TextStyle(
            color: Colors.white70,
            fontSize: 10,
          ),
        );
      }).toList(),
    );
  }

  List<Duration> _generateMarkers(Duration duration) {
    final markers = <Duration>[];
    final totalSeconds = duration.inSeconds;

    if (totalSeconds <= 10) {
      // Show every 2 seconds
      for (int i = 0; i <= totalSeconds; i += 2) {
        markers.add(Duration(seconds: i));
      }
    } else if (totalSeconds <= 60) {
      // Show every 10 seconds
      for (int i = 0; i <= totalSeconds; i += 10) {
        markers.add(Duration(seconds: i));
      }
    } else {
      // Show every 30 seconds
      for (int i = 0; i <= totalSeconds; i += 30) {
        markers.add(Duration(seconds: i));
      }
    }

    // Always include the end
    if (markers.last != duration) {
      markers.add(duration);
    }

    return markers;
  }

  String _formatDuration(Duration duration) {
    final seconds = duration.inSeconds;
    final minutes = seconds ~/ 60;
    final remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return '$minutes:${remainingSeconds.toString().padLeft(2, '0')}';
    } else {
      return '${remainingSeconds}s';
    }
  }
}
