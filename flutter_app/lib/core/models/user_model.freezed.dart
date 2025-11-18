// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'user_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$User {
  @JsonKey(name: '_id')
  String get id;
  String get username;
  String get email;
  String? get fullName;
  String? get avatar;
  String? get coverPhoto;
  String? get bio;
  String? get phoneNumber;
  DateTime? get dateOfBirth;
  String? get gender;
  String? get location;
  String? get website;
  String get role; // 'user', 'seller', 'admin'
  String get status; // 'active', 'suspended', 'banned'
  bool get verified;
  bool get featured;
  int get followersCount;
  int get followingCount;
  int get likesCount;
  int get viewsCount;
  Map<String, dynamic>? get settings;
  Map<String, dynamic>? get preferences;
  List<String>? get interests;
  DateTime? get lastActive;
  DateTime? get createdAt;
  DateTime? get updatedAt;

  /// Create a copy of User
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $UserCopyWith<User> get copyWith =>
      _$UserCopyWithImpl<User>(this as User, _$identity);

  /// Serializes this User to a JSON map.
  Map<String, dynamic> toJson();

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is User &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.username, username) ||
                other.username == username) &&
            (identical(other.email, email) || other.email == email) &&
            (identical(other.fullName, fullName) ||
                other.fullName == fullName) &&
            (identical(other.avatar, avatar) || other.avatar == avatar) &&
            (identical(other.coverPhoto, coverPhoto) ||
                other.coverPhoto == coverPhoto) &&
            (identical(other.bio, bio) || other.bio == bio) &&
            (identical(other.phoneNumber, phoneNumber) ||
                other.phoneNumber == phoneNumber) &&
            (identical(other.dateOfBirth, dateOfBirth) ||
                other.dateOfBirth == dateOfBirth) &&
            (identical(other.gender, gender) || other.gender == gender) &&
            (identical(other.location, location) ||
                other.location == location) &&
            (identical(other.website, website) || other.website == website) &&
            (identical(other.role, role) || other.role == role) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.verified, verified) ||
                other.verified == verified) &&
            (identical(other.featured, featured) ||
                other.featured == featured) &&
            (identical(other.followersCount, followersCount) ||
                other.followersCount == followersCount) &&
            (identical(other.followingCount, followingCount) ||
                other.followingCount == followingCount) &&
            (identical(other.likesCount, likesCount) ||
                other.likesCount == likesCount) &&
            (identical(other.viewsCount, viewsCount) ||
                other.viewsCount == viewsCount) &&
            const DeepCollectionEquality().equals(other.settings, settings) &&
            const DeepCollectionEquality()
                .equals(other.preferences, preferences) &&
            const DeepCollectionEquality().equals(other.interests, interests) &&
            (identical(other.lastActive, lastActive) ||
                other.lastActive == lastActive) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hashAll([
        runtimeType,
        id,
        username,
        email,
        fullName,
        avatar,
        coverPhoto,
        bio,
        phoneNumber,
        dateOfBirth,
        gender,
        location,
        website,
        role,
        status,
        verified,
        featured,
        followersCount,
        followingCount,
        likesCount,
        viewsCount,
        const DeepCollectionEquality().hash(settings),
        const DeepCollectionEquality().hash(preferences),
        const DeepCollectionEquality().hash(interests),
        lastActive,
        createdAt,
        updatedAt
      ]);

  @override
  String toString() {
    return 'User(id: $id, username: $username, email: $email, fullName: $fullName, avatar: $avatar, coverPhoto: $coverPhoto, bio: $bio, phoneNumber: $phoneNumber, dateOfBirth: $dateOfBirth, gender: $gender, location: $location, website: $website, role: $role, status: $status, verified: $verified, featured: $featured, followersCount: $followersCount, followingCount: $followingCount, likesCount: $likesCount, viewsCount: $viewsCount, settings: $settings, preferences: $preferences, interests: $interests, lastActive: $lastActive, createdAt: $createdAt, updatedAt: $updatedAt)';
  }
}

/// @nodoc
abstract mixin class $UserCopyWith<$Res> {
  factory $UserCopyWith(User value, $Res Function(User) _then) =
      _$UserCopyWithImpl;
  @useResult
  $Res call(
      {@JsonKey(name: '_id') String id,
      String username,
      String email,
      String? fullName,
      String? avatar,
      String? coverPhoto,
      String? bio,
      String? phoneNumber,
      DateTime? dateOfBirth,
      String? gender,
      String? location,
      String? website,
      String role,
      String status,
      bool verified,
      bool featured,
      int followersCount,
      int followingCount,
      int likesCount,
      int viewsCount,
      Map<String, dynamic>? settings,
      Map<String, dynamic>? preferences,
      List<String>? interests,
      DateTime? lastActive,
      DateTime? createdAt,
      DateTime? updatedAt});
}

/// @nodoc
class _$UserCopyWithImpl<$Res> implements $UserCopyWith<$Res> {
  _$UserCopyWithImpl(this._self, this._then);

  final User _self;
  final $Res Function(User) _then;

  /// Create a copy of User
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? username = null,
    Object? email = null,
    Object? fullName = freezed,
    Object? avatar = freezed,
    Object? coverPhoto = freezed,
    Object? bio = freezed,
    Object? phoneNumber = freezed,
    Object? dateOfBirth = freezed,
    Object? gender = freezed,
    Object? location = freezed,
    Object? website = freezed,
    Object? role = null,
    Object? status = null,
    Object? verified = null,
    Object? featured = null,
    Object? followersCount = null,
    Object? followingCount = null,
    Object? likesCount = null,
    Object? viewsCount = null,
    Object? settings = freezed,
    Object? preferences = freezed,
    Object? interests = freezed,
    Object? lastActive = freezed,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
  }) {
    return _then(_self.copyWith(
      id: null == id
          ? _self.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      username: null == username
          ? _self.username
          : username // ignore: cast_nullable_to_non_nullable
              as String,
      email: null == email
          ? _self.email
          : email // ignore: cast_nullable_to_non_nullable
              as String,
      fullName: freezed == fullName
          ? _self.fullName
          : fullName // ignore: cast_nullable_to_non_nullable
              as String?,
      avatar: freezed == avatar
          ? _self.avatar
          : avatar // ignore: cast_nullable_to_non_nullable
              as String?,
      coverPhoto: freezed == coverPhoto
          ? _self.coverPhoto
          : coverPhoto // ignore: cast_nullable_to_non_nullable
              as String?,
      bio: freezed == bio
          ? _self.bio
          : bio // ignore: cast_nullable_to_non_nullable
              as String?,
      phoneNumber: freezed == phoneNumber
          ? _self.phoneNumber
          : phoneNumber // ignore: cast_nullable_to_non_nullable
              as String?,
      dateOfBirth: freezed == dateOfBirth
          ? _self.dateOfBirth
          : dateOfBirth // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      gender: freezed == gender
          ? _self.gender
          : gender // ignore: cast_nullable_to_non_nullable
              as String?,
      location: freezed == location
          ? _self.location
          : location // ignore: cast_nullable_to_non_nullable
              as String?,
      website: freezed == website
          ? _self.website
          : website // ignore: cast_nullable_to_non_nullable
              as String?,
      role: null == role
          ? _self.role
          : role // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _self.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      verified: null == verified
          ? _self.verified
          : verified // ignore: cast_nullable_to_non_nullable
              as bool,
      featured: null == featured
          ? _self.featured
          : featured // ignore: cast_nullable_to_non_nullable
              as bool,
      followersCount: null == followersCount
          ? _self.followersCount
          : followersCount // ignore: cast_nullable_to_non_nullable
              as int,
      followingCount: null == followingCount
          ? _self.followingCount
          : followingCount // ignore: cast_nullable_to_non_nullable
              as int,
      likesCount: null == likesCount
          ? _self.likesCount
          : likesCount // ignore: cast_nullable_to_non_nullable
              as int,
      viewsCount: null == viewsCount
          ? _self.viewsCount
          : viewsCount // ignore: cast_nullable_to_non_nullable
              as int,
      settings: freezed == settings
          ? _self.settings
          : settings // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
      preferences: freezed == preferences
          ? _self.preferences
          : preferences // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
      interests: freezed == interests
          ? _self.interests
          : interests // ignore: cast_nullable_to_non_nullable
              as List<String>?,
      lastActive: freezed == lastActive
          ? _self.lastActive
          : lastActive // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      createdAt: freezed == createdAt
          ? _self.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      updatedAt: freezed == updatedAt
          ? _self.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ));
  }
}

/// Adds pattern-matching-related methods to [User].
extension UserPatterns on User {
  /// A variant of `map` that fallback to returning `orElse`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>(
    TResult Function(_User value)? $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _User() when $default != null:
        return $default(_that);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// Callbacks receives the raw object, upcasted.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case final Subclass2 value:
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult map<TResult extends Object?>(
    TResult Function(_User value) $default,
  ) {
    final _that = this;
    switch (_that) {
      case _User():
        return $default(_that);
      case _:
        throw StateError('Unexpected subclass');
    }
  }

  /// A variant of `map` that fallback to returning `null`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>(
    TResult? Function(_User value)? $default,
  ) {
    final _that = this;
    switch (_that) {
      case _User() when $default != null:
        return $default(_that);
      case _:
        return null;
    }
  }

  /// A variant of `when` that fallback to an `orElse` callback.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>(
    TResult Function(
            @JsonKey(name: '_id') String id,
            String username,
            String email,
            String? fullName,
            String? avatar,
            String? coverPhoto,
            String? bio,
            String? phoneNumber,
            DateTime? dateOfBirth,
            String? gender,
            String? location,
            String? website,
            String role,
            String status,
            bool verified,
            bool featured,
            int followersCount,
            int followingCount,
            int likesCount,
            int viewsCount,
            Map<String, dynamic>? settings,
            Map<String, dynamic>? preferences,
            List<String>? interests,
            DateTime? lastActive,
            DateTime? createdAt,
            DateTime? updatedAt)?
        $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _User() when $default != null:
        return $default(
            _that.id,
            _that.username,
            _that.email,
            _that.fullName,
            _that.avatar,
            _that.coverPhoto,
            _that.bio,
            _that.phoneNumber,
            _that.dateOfBirth,
            _that.gender,
            _that.location,
            _that.website,
            _that.role,
            _that.status,
            _that.verified,
            _that.featured,
            _that.followersCount,
            _that.followingCount,
            _that.likesCount,
            _that.viewsCount,
            _that.settings,
            _that.preferences,
            _that.interests,
            _that.lastActive,
            _that.createdAt,
            _that.updatedAt);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// As opposed to `map`, this offers destructuring.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case Subclass2(:final field2):
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult when<TResult extends Object?>(
    TResult Function(
            @JsonKey(name: '_id') String id,
            String username,
            String email,
            String? fullName,
            String? avatar,
            String? coverPhoto,
            String? bio,
            String? phoneNumber,
            DateTime? dateOfBirth,
            String? gender,
            String? location,
            String? website,
            String role,
            String status,
            bool verified,
            bool featured,
            int followersCount,
            int followingCount,
            int likesCount,
            int viewsCount,
            Map<String, dynamic>? settings,
            Map<String, dynamic>? preferences,
            List<String>? interests,
            DateTime? lastActive,
            DateTime? createdAt,
            DateTime? updatedAt)
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _User():
        return $default(
            _that.id,
            _that.username,
            _that.email,
            _that.fullName,
            _that.avatar,
            _that.coverPhoto,
            _that.bio,
            _that.phoneNumber,
            _that.dateOfBirth,
            _that.gender,
            _that.location,
            _that.website,
            _that.role,
            _that.status,
            _that.verified,
            _that.featured,
            _that.followersCount,
            _that.followingCount,
            _that.likesCount,
            _that.viewsCount,
            _that.settings,
            _that.preferences,
            _that.interests,
            _that.lastActive,
            _that.createdAt,
            _that.updatedAt);
      case _:
        throw StateError('Unexpected subclass');
    }
  }

  /// A variant of `when` that fallback to returning `null`
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>(
    TResult? Function(
            @JsonKey(name: '_id') String id,
            String username,
            String email,
            String? fullName,
            String? avatar,
            String? coverPhoto,
            String? bio,
            String? phoneNumber,
            DateTime? dateOfBirth,
            String? gender,
            String? location,
            String? website,
            String role,
            String status,
            bool verified,
            bool featured,
            int followersCount,
            int followingCount,
            int likesCount,
            int viewsCount,
            Map<String, dynamic>? settings,
            Map<String, dynamic>? preferences,
            List<String>? interests,
            DateTime? lastActive,
            DateTime? createdAt,
            DateTime? updatedAt)?
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _User() when $default != null:
        return $default(
            _that.id,
            _that.username,
            _that.email,
            _that.fullName,
            _that.avatar,
            _that.coverPhoto,
            _that.bio,
            _that.phoneNumber,
            _that.dateOfBirth,
            _that.gender,
            _that.location,
            _that.website,
            _that.role,
            _that.status,
            _that.verified,
            _that.featured,
            _that.followersCount,
            _that.followingCount,
            _that.likesCount,
            _that.viewsCount,
            _that.settings,
            _that.preferences,
            _that.interests,
            _that.lastActive,
            _that.createdAt,
            _that.updatedAt);
      case _:
        return null;
    }
  }
}

/// @nodoc
@JsonSerializable()
class _User implements User {
  const _User(
      {@JsonKey(name: '_id') required this.id,
      required this.username,
      required this.email,
      this.fullName,
      this.avatar,
      this.coverPhoto,
      this.bio,
      this.phoneNumber,
      this.dateOfBirth,
      this.gender,
      this.location,
      this.website,
      this.role = 'user',
      this.status = 'active',
      this.verified = false,
      this.featured = false,
      this.followersCount = 0,
      this.followingCount = 0,
      this.likesCount = 0,
      this.viewsCount = 0,
      final Map<String, dynamic>? settings,
      final Map<String, dynamic>? preferences,
      final List<String>? interests,
      this.lastActive,
      this.createdAt,
      this.updatedAt})
      : _settings = settings,
        _preferences = preferences,
        _interests = interests;
  factory _User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);

  @override
  @JsonKey(name: '_id')
  final String id;
  @override
  final String username;
  @override
  final String email;
  @override
  final String? fullName;
  @override
  final String? avatar;
  @override
  final String? coverPhoto;
  @override
  final String? bio;
  @override
  final String? phoneNumber;
  @override
  final DateTime? dateOfBirth;
  @override
  final String? gender;
  @override
  final String? location;
  @override
  final String? website;
  @override
  @JsonKey()
  final String role;
// 'user', 'seller', 'admin'
  @override
  @JsonKey()
  final String status;
// 'active', 'suspended', 'banned'
  @override
  @JsonKey()
  final bool verified;
  @override
  @JsonKey()
  final bool featured;
  @override
  @JsonKey()
  final int followersCount;
  @override
  @JsonKey()
  final int followingCount;
  @override
  @JsonKey()
  final int likesCount;
  @override
  @JsonKey()
  final int viewsCount;
  final Map<String, dynamic>? _settings;
  @override
  Map<String, dynamic>? get settings {
    final value = _settings;
    if (value == null) return null;
    if (_settings is EqualUnmodifiableMapView) return _settings;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(value);
  }

  final Map<String, dynamic>? _preferences;
  @override
  Map<String, dynamic>? get preferences {
    final value = _preferences;
    if (value == null) return null;
    if (_preferences is EqualUnmodifiableMapView) return _preferences;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(value);
  }

  final List<String>? _interests;
  @override
  List<String>? get interests {
    final value = _interests;
    if (value == null) return null;
    if (_interests is EqualUnmodifiableListView) return _interests;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

  @override
  final DateTime? lastActive;
  @override
  final DateTime? createdAt;
  @override
  final DateTime? updatedAt;

  /// Create a copy of User
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$UserCopyWith<_User> get copyWith =>
      __$UserCopyWithImpl<_User>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$UserToJson(
      this,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _User &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.username, username) ||
                other.username == username) &&
            (identical(other.email, email) || other.email == email) &&
            (identical(other.fullName, fullName) ||
                other.fullName == fullName) &&
            (identical(other.avatar, avatar) || other.avatar == avatar) &&
            (identical(other.coverPhoto, coverPhoto) ||
                other.coverPhoto == coverPhoto) &&
            (identical(other.bio, bio) || other.bio == bio) &&
            (identical(other.phoneNumber, phoneNumber) ||
                other.phoneNumber == phoneNumber) &&
            (identical(other.dateOfBirth, dateOfBirth) ||
                other.dateOfBirth == dateOfBirth) &&
            (identical(other.gender, gender) || other.gender == gender) &&
            (identical(other.location, location) ||
                other.location == location) &&
            (identical(other.website, website) || other.website == website) &&
            (identical(other.role, role) || other.role == role) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.verified, verified) ||
                other.verified == verified) &&
            (identical(other.featured, featured) ||
                other.featured == featured) &&
            (identical(other.followersCount, followersCount) ||
                other.followersCount == followersCount) &&
            (identical(other.followingCount, followingCount) ||
                other.followingCount == followingCount) &&
            (identical(other.likesCount, likesCount) ||
                other.likesCount == likesCount) &&
            (identical(other.viewsCount, viewsCount) ||
                other.viewsCount == viewsCount) &&
            const DeepCollectionEquality().equals(other._settings, _settings) &&
            const DeepCollectionEquality()
                .equals(other._preferences, _preferences) &&
            const DeepCollectionEquality()
                .equals(other._interests, _interests) &&
            (identical(other.lastActive, lastActive) ||
                other.lastActive == lastActive) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hashAll([
        runtimeType,
        id,
        username,
        email,
        fullName,
        avatar,
        coverPhoto,
        bio,
        phoneNumber,
        dateOfBirth,
        gender,
        location,
        website,
        role,
        status,
        verified,
        featured,
        followersCount,
        followingCount,
        likesCount,
        viewsCount,
        const DeepCollectionEquality().hash(_settings),
        const DeepCollectionEquality().hash(_preferences),
        const DeepCollectionEquality().hash(_interests),
        lastActive,
        createdAt,
        updatedAt
      ]);

  @override
  String toString() {
    return 'User(id: $id, username: $username, email: $email, fullName: $fullName, avatar: $avatar, coverPhoto: $coverPhoto, bio: $bio, phoneNumber: $phoneNumber, dateOfBirth: $dateOfBirth, gender: $gender, location: $location, website: $website, role: $role, status: $status, verified: $verified, featured: $featured, followersCount: $followersCount, followingCount: $followingCount, likesCount: $likesCount, viewsCount: $viewsCount, settings: $settings, preferences: $preferences, interests: $interests, lastActive: $lastActive, createdAt: $createdAt, updatedAt: $updatedAt)';
  }
}

/// @nodoc
abstract mixin class _$UserCopyWith<$Res> implements $UserCopyWith<$Res> {
  factory _$UserCopyWith(_User value, $Res Function(_User) _then) =
      __$UserCopyWithImpl;
  @override
  @useResult
  $Res call(
      {@JsonKey(name: '_id') String id,
      String username,
      String email,
      String? fullName,
      String? avatar,
      String? coverPhoto,
      String? bio,
      String? phoneNumber,
      DateTime? dateOfBirth,
      String? gender,
      String? location,
      String? website,
      String role,
      String status,
      bool verified,
      bool featured,
      int followersCount,
      int followingCount,
      int likesCount,
      int viewsCount,
      Map<String, dynamic>? settings,
      Map<String, dynamic>? preferences,
      List<String>? interests,
      DateTime? lastActive,
      DateTime? createdAt,
      DateTime? updatedAt});
}

/// @nodoc
class __$UserCopyWithImpl<$Res> implements _$UserCopyWith<$Res> {
  __$UserCopyWithImpl(this._self, this._then);

  final _User _self;
  final $Res Function(_User) _then;

  /// Create a copy of User
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? id = null,
    Object? username = null,
    Object? email = null,
    Object? fullName = freezed,
    Object? avatar = freezed,
    Object? coverPhoto = freezed,
    Object? bio = freezed,
    Object? phoneNumber = freezed,
    Object? dateOfBirth = freezed,
    Object? gender = freezed,
    Object? location = freezed,
    Object? website = freezed,
    Object? role = null,
    Object? status = null,
    Object? verified = null,
    Object? featured = null,
    Object? followersCount = null,
    Object? followingCount = null,
    Object? likesCount = null,
    Object? viewsCount = null,
    Object? settings = freezed,
    Object? preferences = freezed,
    Object? interests = freezed,
    Object? lastActive = freezed,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
  }) {
    return _then(_User(
      id: null == id
          ? _self.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      username: null == username
          ? _self.username
          : username // ignore: cast_nullable_to_non_nullable
              as String,
      email: null == email
          ? _self.email
          : email // ignore: cast_nullable_to_non_nullable
              as String,
      fullName: freezed == fullName
          ? _self.fullName
          : fullName // ignore: cast_nullable_to_non_nullable
              as String?,
      avatar: freezed == avatar
          ? _self.avatar
          : avatar // ignore: cast_nullable_to_non_nullable
              as String?,
      coverPhoto: freezed == coverPhoto
          ? _self.coverPhoto
          : coverPhoto // ignore: cast_nullable_to_non_nullable
              as String?,
      bio: freezed == bio
          ? _self.bio
          : bio // ignore: cast_nullable_to_non_nullable
              as String?,
      phoneNumber: freezed == phoneNumber
          ? _self.phoneNumber
          : phoneNumber // ignore: cast_nullable_to_non_nullable
              as String?,
      dateOfBirth: freezed == dateOfBirth
          ? _self.dateOfBirth
          : dateOfBirth // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      gender: freezed == gender
          ? _self.gender
          : gender // ignore: cast_nullable_to_non_nullable
              as String?,
      location: freezed == location
          ? _self.location
          : location // ignore: cast_nullable_to_non_nullable
              as String?,
      website: freezed == website
          ? _self.website
          : website // ignore: cast_nullable_to_non_nullable
              as String?,
      role: null == role
          ? _self.role
          : role // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _self.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      verified: null == verified
          ? _self.verified
          : verified // ignore: cast_nullable_to_non_nullable
              as bool,
      featured: null == featured
          ? _self.featured
          : featured // ignore: cast_nullable_to_non_nullable
              as bool,
      followersCount: null == followersCount
          ? _self.followersCount
          : followersCount // ignore: cast_nullable_to_non_nullable
              as int,
      followingCount: null == followingCount
          ? _self.followingCount
          : followingCount // ignore: cast_nullable_to_non_nullable
              as int,
      likesCount: null == likesCount
          ? _self.likesCount
          : likesCount // ignore: cast_nullable_to_non_nullable
              as int,
      viewsCount: null == viewsCount
          ? _self.viewsCount
          : viewsCount // ignore: cast_nullable_to_non_nullable
              as int,
      settings: freezed == settings
          ? _self._settings
          : settings // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
      preferences: freezed == preferences
          ? _self._preferences
          : preferences // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
      interests: freezed == interests
          ? _self._interests
          : interests // ignore: cast_nullable_to_non_nullable
              as List<String>?,
      lastActive: freezed == lastActive
          ? _self.lastActive
          : lastActive // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      createdAt: freezed == createdAt
          ? _self.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      updatedAt: freezed == updatedAt
          ? _self.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ));
  }
}

// dart format on
