import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../../../core/services/api_service.dart';
import '../models/pk_battle_model.dart';

class PKBattleProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  PKBattleModel? _currentBattle;
  List<PKBattleModel> _activeBattles = [];
  bool _isLoading = false;
  bool _isInBattle = false;
  String? _error;
  IO.Socket? _socket;
  int? _remainingSeconds;
  
  PKBattleModel? get currentBattle => _currentBattle;
  List<PKBattleModel> get activeBattles => _activeBattles;
  bool get isLoading => _isLoading;
  bool get isInBattle => _isInBattle;
  String? get error => _error;
  int? get remainingSeconds => _remainingSeconds;
  
  PKBattleProvider() {
    _initializeSocket();
  }
  
  void _initializeSocket() {
    // Connect to socket for real-time updates
    _socket = IO.io(
      'https://mixillo-backend-52242135857.europe-west1.run.app',
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .enableAutoConnect()
          .build(),
    );

    _socket!.onConnect((_) {
      print('PK Battle: Socket connected');
    });

    _socket!.on('pk-battle:update', (data) {
      if (_currentBattle != null && data['battleId'] == _currentBattle!.battleId) {
        _updateBattleFromSocket(data);
      }
    });

    _socket!.on('pk-battle:gift-sent', (data) {
      if (_currentBattle != null && data['battleId'] == _currentBattle!.battleId) {
        _handleGiftUpdate(data);
      }
    });

    _socket!.on('pk-battle:ended', (data) {
      if (_currentBattle != null && data['battleId'] == _currentBattle!.battleId) {
        _handleBattleEnd(data);
      }
    });
  }
  
  /// Load active battles
  Future<void> loadActiveBattles() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final battlesData = await _apiService.getActivePKBattles();
      _activeBattles = battlesData
          .map((json) => PKBattleModel.fromJson(json))
          .toList();
      _error = null;
    } catch (e) {
      _error = e.toString();
      print('Error loading active battles: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  /// Create PK battle (1v1 or 2v2)
  Future<PKBattleModel?> createBattle({
    required String host1Id,
    required String host1StreamId,
    required String host2Id,
    required String host2StreamId,
    String? host3Id,
    String? host3StreamId,
    String? host4Id,
    String? host4StreamId,
    int duration = 300, // 5 minutes
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final battleData = await _apiService.createPKBattle(
        host2Id: host2Id,
        stream1Id: host1StreamId,
        stream2Id: host2StreamId,
        host3Id: host3Id,
        stream3Id: host3StreamId,
        host4Id: host4Id,
        stream4Id: host4StreamId,
        duration: duration,
      );
      
      _currentBattle = PKBattleModel.fromJson(battleData);
      _isInBattle = true;
      _error = null;
      notifyListeners();
      return _currentBattle;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      print('Error creating battle: $e');
      return null;
    }
  }
  
  /// Accept battle challenge
  Future<bool> acceptBattle(String battleId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final battleData = await _apiService.acceptPKBattle(battleId);
      _currentBattle = PKBattleModel.fromJson(battleData);
      _isInBattle = true;
      _startBattleTimer();
      _error = null;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      print('Error accepting battle: $e');
      return false;
    }
  }
  
  /// Join battle as viewer
  Future<void> joinBattle(String battleId) async {
    try {
      final battleData = await _apiService.getPKBattle(battleId);
      _currentBattle = PKBattleModel.fromJson(battleData);
      _isInBattle = true;
      _startBattleTimer();
      
      // Join socket room
      _socket?.emit('pk-battle:join', {'battleId': battleId});
      
      notifyListeners();
    } catch (e) {
      print('Error joining battle: $e');
    }
  }
  
  /// Send gift to a host in battle
  Future<bool> sendGift({
    required String battleId,
    required int hostNumber, // 1, 2, 3, or 4
    required String giftId,
    required int amount,
  }) async {
    try {
      await _apiService.sendPKBattleGift(
        battleId: battleId,
        hostNumber: hostNumber,
        giftId: giftId,
        amount: amount,
      );
      
      // Update will come via socket
      return true;
    } catch (e) {
      print('Error sending gift: $e');
      return false;
    }
  }
  
  /// Update battle from socket event
  void _updateBattleFromSocket(Map<String, dynamic> data) {
    if (_currentBattle == null) return;
    
    final updatedBattle = PKBattleModel.fromJson(data);
    _currentBattle = updatedBattle;
    _remainingSeconds = _currentBattle!.remainingSeconds;
    notifyListeners();
  }
  
  /// Handle gift update
  void _handleGiftUpdate(Map<String, dynamic> data) {
    if (_currentBattle == null) return;
    
    final hostNumber = data['hostNumber'] as int;
    final gift = PKBattleGift.fromJson(data['gift']);
    final newScore = data['newScore'] as int;
    
    // Update host score
    final hosts = _currentBattle!.allHosts;
    if (hostNumber > 0 && hostNumber <= hosts.length) {
      final host = hosts[hostNumber - 1];
      final updatedGifts = [...host.gifts, gift];
      
      if (hostNumber == 1) {
        _currentBattle = PKBattleModel(
          battleId: _currentBattle!.battleId,
          host1: host.copyWith(score: newScore, gifts: updatedGifts),
          host2: _currentBattle!.host2,
          host3: _currentBattle!.host3,
          host4: _currentBattle!.host4,
          duration: _currentBattle!.duration,
          status: _currentBattle!.status,
          startedAt: _currentBattle!.startedAt,
          endsAt: _currentBattle!.endsAt,
          completedAt: _currentBattle!.completedAt,
          winnerId: _currentBattle!.winnerId,
          stats: _currentBattle!.stats,
          type: _currentBattle!.type,
        );
      } else if (hostNumber == 2) {
        _currentBattle = PKBattleModel(
          battleId: _currentBattle!.battleId,
          host1: _currentBattle!.host1,
          host2: host.copyWith(score: newScore, gifts: updatedGifts),
          host3: _currentBattle!.host3,
          host4: _currentBattle!.host4,
          duration: _currentBattle!.duration,
          status: _currentBattle!.status,
          startedAt: _currentBattle!.startedAt,
          endsAt: _currentBattle!.endsAt,
          completedAt: _currentBattle!.completedAt,
          winnerId: _currentBattle!.winnerId,
          stats: _currentBattle!.stats,
          type: _currentBattle!.type,
        );
      }
      // TODO: Handle host3 and host4 for 2v2
    }
    
    notifyListeners();
  }
  
  /// Handle battle end
  void _handleBattleEnd(Map<String, dynamic> data) {
    if (_currentBattle == null) return;
    
    _currentBattle = PKBattleModel.fromJson(data);
    _isInBattle = false;
    _remainingSeconds = 0;
    notifyListeners();
  }
  
  /// Start battle timer
  void _startBattleTimer() {
    if (_currentBattle == null || _currentBattle!.endsAt == null) return;
    
    // Update timer every second
    _updateTimer();
  }
  
  void _updateTimer() {
    if (_currentBattle == null) return;
    
    _remainingSeconds = _currentBattle!.remainingSeconds;
    notifyListeners();
    
    if (_remainingSeconds == null || _remainingSeconds! <= 0) {
      _isInBattle = false;
      return;
    }
    
    if (_isInBattle) {
      Future.delayed(const Duration(seconds: 1), () {
        _updateTimer();
      });
    }
  }
  
  /// Leave battle
  void leaveBattle() {
    if (_currentBattle != null) {
      _socket?.emit('pk-battle:leave', {'battleId': _currentBattle!.battleId});
    }
    _currentBattle = null;
    _isInBattle = false;
    _remainingSeconds = null;
    notifyListeners();
  }
  
  @override
  void dispose() {
    _socket?.disconnect();
    _socket?.dispose();
    super.dispose();
  }
}

