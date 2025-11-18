import 'package:freezed_annotation/freezed_annotation.dart';

part 'user_model.freezed.dart';
part 'user_model.g.dart';

@freezed
class User with _$User {
  const factory User({
    @JsonKey(name: '_id') required String id,
    required String username,
    required String email,
    String? fullName,
    String? avatar,
    String? coverPhoto,
    String? bio,
    String? phoneNumber,
    DateTime? dateOfBirth,
    String? gender,
    String? location,
    String? website,
    @Default('user') String role, // 'user', 'seller', 'admin'
    @Default('active') String status, // 'active', 'suspended', 'banned'
    @Default(false) bool verified,
    @Default(false) bool featured,
    @Default(0) int followersCount,
    @Default(0) int followingCount,
    @Default(0) int likesCount,
    @Default(0) int viewsCount,
    Map<String, dynamic>? settings,
    Map<String, dynamic>? preferences,
    List<String>? interests,
    DateTime? lastActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) = _User;

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
}
