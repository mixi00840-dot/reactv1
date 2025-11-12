import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:iconsax/iconsax.dart';
import '../../data/models/live_stream_model.dart';
import '../../data/mock_live_data.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/glass_widgets.dart';
import '../widgets/gift_panel.dart';
import '../widgets/pk_battle_widget.dart';

class LiveRoomPage extends StatefulWidget {
  final LiveStream liveStream;

  const LiveRoomPage({super.key, required this.liveStream});

  @override
  State<LiveRoomPage> createState() => _LiveRoomPageState();
}

class _LiveRoomPageState extends State<LiveRoomPage> {
  final TextEditingController _messageController = TextEditingController();
  final List<LiveMessage> _messages = [];
  final List<LiveViewer> _viewers = [];
  bool _isFollowing = false;
  bool _showGiftPanel = false;
  Timer? _messageTimer;
  int _likeCount = 0;

  @override
  void initState() {
    super.initState();
    _messages.addAll(MockLiveData.getMockMessages());
    _viewers.addAll(MockLiveData.getMockViewers());
    _likeCount = widget.liveStream.likeCount;
    _startMockMessages();
  }

  @override
  void dispose() {
    _messageTimer?.cancel();
    _messageController.dispose();
    super.dispose();
  }

  void _startMockMessages() {
    _messageTimer = Timer.periodic(const Duration(seconds: 8), (timer) {
      if (mounted) {
        setState(() {
          _messages.insert(
            0,
            LiveMessage(
              id: 'm${_messages.length}',
              userId: 'u${_messages.length}',
              username: 'User${_messages.length}',
              message: 'Great show! 🎉',
              timestamp: DateTime.now(),
            ),
          );
          if (_messages.length > 20) {
            _messages.removeLast();
          }
        });
      }
    });
  }

  void _sendMessage() {
    if (_messageController.text.trim().isEmpty) return;

    setState(() {
      _messages.insert(
        0,
        LiveMessage(
          id: 'm${_messages.length}',
          userId: 'current_user',
          username: 'You',
          message: _messageController.text,
          timestamp: DateTime.now(),
        ),
      );
    });

    _messageController.clear();
  }

  void _sendGift(LiveGift gift) {
    setState(() {
      _messages.insert(
        0,
        LiveMessage(
          id: 'm${_messages.length}',
          userId: 'current_user',
          username: 'You',
          message: 'sent ${gift.name}',
          timestamp: DateTime.now(),
          type: LiveMessageType.gift,
          gift: gift,
          giftCount: 1,
        ),
      );
      _showGiftPanel = false;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Sent ${gift.name} to ${widget.liveStream.hostName}'),
        backgroundColor: AppTheme.primary,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _like() {
    setState(() {
      _likeCount++;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: Stack(
        children: [
          // Video Background (Simulated with image)
          CachedNetworkImage(
            imageUrl: widget.liveStream.coverImage,
            width: double.infinity,
            height: double.infinity,
            fit: BoxFit.cover,
          ),
          // Dark Overlay
          Container(
            color: Colors.black.withValues(alpha: 0.3),
          ),
          // Content
          SafeArea(
            child: Column(
              children: [
                // Top Bar
                _buildTopBar(),
                const Spacer(),
                // Messages
                _buildMessagesSection(),
                const SizedBox(height: 16),
                // Bottom Controls
                _buildBottomControls(),
              ],
            ),
          ),
          // PK Battle Widget
          if (widget.liveStream.isPkBattle)
            Positioned(
              top: MediaQuery.of(context).padding.top + 60,
              left: 0,
              right: 0,
              child: PkBattleWidget(
                pkBattle: MockLiveData.getMockPkBattle(),
              ),
            ),
          // Gift Panel
          if (_showGiftPanel)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: GiftPanel(
                onGiftSelected: _sendGift,
                onClose: () {
                  setState(() {
                    _showGiftPanel = false;
                  });
                },
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTopBar() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          // Host Info
          Expanded(
            child: GlassContainer(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 18,
                    backgroundImage: CachedNetworkImageProvider(
                      widget.liveStream.hostAvatar,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          widget.liveStream.hostName,
                          style: AppTheme.bodyStyle.copyWith(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Row(
                          children: [
                            const Icon(
                              Iconsax.eye,
                              size: 12,
                              color: Colors.white70,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              _formatCount(widget.liveStream.viewerCount),
                              style: AppTheme.bodyStyle.copyWith(
                                fontSize: 11,
                                color: Colors.white70,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  GestureDetector(
                    onTap: () {
                      setState(() {
                        _isFollowing = !_isFollowing;
                      });
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        gradient: _isFollowing ? null : AppTheme.primaryGradient,
                        color: _isFollowing ? Colors.white.withValues(alpha: 0.2) : null,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        _isFollowing ? 'Following' : 'Follow',
                        style: AppTheme.bodyStyle.copyWith(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Close Button
          GlassContainer(
            padding: const EdgeInsets.all(10),
            child: GestureDetector(
              onTap: () => Navigator.pop(context),
              child: const Icon(
                Iconsax.close_circle,
                color: Colors.white,
                size: 24,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessagesSection() {
    return Container(
      height: 300,
      alignment: Alignment.bottomLeft,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: ListView.builder(
        reverse: true,
        itemCount: _messages.length,
        itemBuilder: (context, index) {
          final message = _messages[index];
          return _buildMessageBubble(message);
        },
      ),
    );
  }

  Widget _buildMessageBubble(LiveMessage message) {
    if (message.type == LiveMessageType.gift) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: GlassContainer(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                message.username,
                style: AppTheme.bodyStyle.copyWith(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.accent,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'sent',
                style: AppTheme.bodyStyle.copyWith(
                  fontSize: 13,
                  color: Colors.white70,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                message.gift!.icon,
                style: const TextStyle(fontSize: 16),
              ),
              const SizedBox(width: 4),
              Text(
                message.gift!.name,
                style: AppTheme.bodyStyle.copyWith(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GlassContainer(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: RichText(
          text: TextSpan(
            children: [
              TextSpan(
                text: '${message.username}: ',
                style: AppTheme.bodyStyle.copyWith(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.accent,
                ),
              ),
              TextSpan(
                text: message.message,
                style: AppTheme.bodyStyle.copyWith(
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBottomControls() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          // Message Input
          Expanded(
            child: GlassContainer(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: TextField(
                controller: _messageController,
                style: AppTheme.bodyStyle,
                decoration: InputDecoration(
                  hintText: 'Say something...',
                  hintStyle: AppTheme.bodyStyle.copyWith(
                    color: Colors.white38,
                  ),
                  border: InputBorder.none,
                  suffixIcon: IconButton(
                    onPressed: _sendMessage,
                    icon: const Icon(
                      Iconsax.send_1,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Gift Button
          GlassContainer(
            padding: const EdgeInsets.all(12),
            child: GestureDetector(
              onTap: () {
                setState(() {
                  _showGiftPanel = !_showGiftPanel;
                });
              },
              child: Container(
                decoration: BoxDecoration(
                  gradient: AppTheme.primaryGradient,
                  shape: BoxShape.circle,
                ),
                padding: const EdgeInsets.all(8),
                child: const Icon(
                  Iconsax.gift,
                  color: Colors.white,
                  size: 24,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Like Button
          GlassContainer(
            padding: const EdgeInsets.all(12),
            child: GestureDetector(
              onTap: _like,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Iconsax.heart5,
                    color: Colors.red,
                    size: 24,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _formatCount(_likeCount),
                    style: AppTheme.bodyStyle.copyWith(
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatCount(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }
}
