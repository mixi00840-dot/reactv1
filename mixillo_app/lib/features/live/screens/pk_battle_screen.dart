import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/pk_battle_model.dart';
import '../providers/pk_battle_provider.dart';
import '../widgets/pk_battle_score_bar.dart';
import '../widgets/pk_battle_timer.dart';
import '../widgets/pk_battle_gift_panel.dart';
import '../widgets/pk_battle_video_view.dart';

class PKBattleScreen extends StatefulWidget {
  final String battleId;
  final bool isHost; // Is current user a host in this battle

  const PKBattleScreen({
    super.key,
    required this.battleId,
    this.isHost = false,
  });

  @override
  State<PKBattleScreen> createState() => _PKBattleScreenState();
}

class _PKBattleScreenState extends State<PKBattleScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<PKBattleProvider>();
      provider.joinBattle(widget.battleId);
    });
  }

  @override
  void dispose() {
    if (!widget.isHost) {
      context.read<PKBattleProvider>().leaveBattle();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Consumer<PKBattleProvider>(
        builder: (context, battleProvider, _) {
          final battle = battleProvider.currentBattle;
          
          if (battleProvider.isLoading && battle == null) {
            return const Center(
              child: CircularProgressIndicator(color: Colors.white),
            );
          }

          if (battle == null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.white),
                  const SizedBox(height: 16),
                  const Text(
                    'Battle not found',
                    style: TextStyle(color: Colors.white, fontSize: 18),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Go Back'),
                  ),
                ],
              ),
            );
          }

          return Stack(
            fit: StackFit.expand,
            children: [
              // Video views (TikTok-style split screen)
              _buildVideoViews(battle),
              
              // Top overlay - Score bars and timer
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: SafeArea(
                  child: Column(
                    children: [
                      PKBattleScoreBar(battle: battle),
                      const SizedBox(height: 8),
                      PKBattleTimer(
                        remainingSeconds: battleProvider.remainingSeconds ?? battle.remainingSeconds ?? 0,
                      ),
                    ],
                  ),
                ),
              ),
              
              // Bottom overlay - Gift panel and controls
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: SafeArea(
                  child: PKBattleGiftPanel(
                    battle: battle,
                    onGiftSent: (hostNumber, giftId, amount) {
                      battleProvider.sendGift(
                        battleId: battle.battleId,
                        hostNumber: hostNumber,
                        giftId: giftId,
                        amount: amount,
                      );
                    },
                  ),
                ),
              ),
              
              // Winner announcement (when battle ends)
              if (battle.isCompleted)
                _buildWinnerAnnouncement(battle),
            ],
          );
        },
      ),
    );
  }

  Widget _buildVideoViews(PKBattleModel battle) {
    if (battle.type == BattleType.twoVsTwo) {
      // 2v2: 4-way split screen
      return Column(
        children: [
          Expanded(
            child: Row(
              children: [
                Expanded(
                  child: PKBattleVideoView(
                    host: battle.host1,
                    position: 1,
                  ),
                ),
                Expanded(
                  child: PKBattleVideoView(
                    host: battle.host2,
                    position: 2,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: Row(
              children: [
                Expanded(
                  child: PKBattleVideoView(
                    host: battle.host3!,
                    position: 3,
                  ),
                ),
                Expanded(
                  child: PKBattleVideoView(
                    host: battle.host4!,
                    position: 4,
                  ),
                ),
              ],
            ),
          ),
        ],
      );
    } else {
      // 1v1: Split screen (left/right)
      return Row(
        children: [
          Expanded(
            child: PKBattleVideoView(
              host: battle.host1,
              position: 1,
            ),
          ),
          Container(
            width: 2,
            color: Colors.white.withOpacity(0.3),
          ),
          Expanded(
            child: PKBattleVideoView(
              host: battle.host2,
              position: 2,
            ),
          ),
        ],
      );
    }
  }

  Widget _buildWinnerAnnouncement(PKBattleModel battle) {
    final winner = battle.allHosts.firstWhere(
      (h) => h.userId == battle.winnerId,
      orElse: () => battle.host1,
    );

    return Container(
      color: Colors.black.withOpacity(0.8),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.emoji_events,
              color: Colors.amber,
              size: 80,
            ),
            const SizedBox(height: 16),
            const Text(
              'WINNER',
              style: TextStyle(
                color: Colors.white,
                fontSize: 32,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              winner.username,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Score: ${winner.score}',
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 18,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

