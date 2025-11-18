// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'product_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$Product {
  String get id;
  String get title;
  String get description;
  double get price;
  double get originalPrice;
  List<String> get images;
  double get rating;
  int get reviewCount;
  int get stock;
  String get category;
  List<String> get sizes;
  List<String> get colors;
  List<String> get features;
  String? get sellerId;
  String? get sellerName;
  bool get isSellerVerified;
  double get sellerRating;
  bool get isFeatured;
  bool get isNew;
  DateTime? get createdAt;

  /// Create a copy of Product
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $ProductCopyWith<Product> get copyWith =>
      _$ProductCopyWithImpl<Product>(this as Product, _$identity);

  /// Serializes this Product to a JSON map.
  Map<String, dynamic> toJson();

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is Product &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.price, price) || other.price == price) &&
            (identical(other.originalPrice, originalPrice) ||
                other.originalPrice == originalPrice) &&
            const DeepCollectionEquality().equals(other.images, images) &&
            (identical(other.rating, rating) || other.rating == rating) &&
            (identical(other.reviewCount, reviewCount) ||
                other.reviewCount == reviewCount) &&
            (identical(other.stock, stock) || other.stock == stock) &&
            (identical(other.category, category) ||
                other.category == category) &&
            const DeepCollectionEquality().equals(other.sizes, sizes) &&
            const DeepCollectionEquality().equals(other.colors, colors) &&
            const DeepCollectionEquality().equals(other.features, features) &&
            (identical(other.sellerId, sellerId) ||
                other.sellerId == sellerId) &&
            (identical(other.sellerName, sellerName) ||
                other.sellerName == sellerName) &&
            (identical(other.isSellerVerified, isSellerVerified) ||
                other.isSellerVerified == isSellerVerified) &&
            (identical(other.sellerRating, sellerRating) ||
                other.sellerRating == sellerRating) &&
            (identical(other.isFeatured, isFeatured) ||
                other.isFeatured == isFeatured) &&
            (identical(other.isNew, isNew) || other.isNew == isNew) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hashAll([
        runtimeType,
        id,
        title,
        description,
        price,
        originalPrice,
        const DeepCollectionEquality().hash(images),
        rating,
        reviewCount,
        stock,
        category,
        const DeepCollectionEquality().hash(sizes),
        const DeepCollectionEquality().hash(colors),
        const DeepCollectionEquality().hash(features),
        sellerId,
        sellerName,
        isSellerVerified,
        sellerRating,
        isFeatured,
        isNew,
        createdAt
      ]);

  @override
  String toString() {
    return 'Product(id: $id, title: $title, description: $description, price: $price, originalPrice: $originalPrice, images: $images, rating: $rating, reviewCount: $reviewCount, stock: $stock, category: $category, sizes: $sizes, colors: $colors, features: $features, sellerId: $sellerId, sellerName: $sellerName, isSellerVerified: $isSellerVerified, sellerRating: $sellerRating, isFeatured: $isFeatured, isNew: $isNew, createdAt: $createdAt)';
  }
}

/// @nodoc
abstract mixin class $ProductCopyWith<$Res> {
  factory $ProductCopyWith(Product value, $Res Function(Product) _then) =
      _$ProductCopyWithImpl;
  @useResult
  $Res call(
      {String id,
      String title,
      String description,
      double price,
      double originalPrice,
      List<String> images,
      double rating,
      int reviewCount,
      int stock,
      String category,
      List<String> sizes,
      List<String> colors,
      List<String> features,
      String? sellerId,
      String? sellerName,
      bool isSellerVerified,
      double sellerRating,
      bool isFeatured,
      bool isNew,
      DateTime? createdAt});
}

/// @nodoc
class _$ProductCopyWithImpl<$Res> implements $ProductCopyWith<$Res> {
  _$ProductCopyWithImpl(this._self, this._then);

  final Product _self;
  final $Res Function(Product) _then;

  /// Create a copy of Product
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? description = null,
    Object? price = null,
    Object? originalPrice = null,
    Object? images = null,
    Object? rating = null,
    Object? reviewCount = null,
    Object? stock = null,
    Object? category = null,
    Object? sizes = null,
    Object? colors = null,
    Object? features = null,
    Object? sellerId = freezed,
    Object? sellerName = freezed,
    Object? isSellerVerified = null,
    Object? sellerRating = null,
    Object? isFeatured = null,
    Object? isNew = null,
    Object? createdAt = freezed,
  }) {
    return _then(_self.copyWith(
      id: null == id
          ? _self.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      title: null == title
          ? _self.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      description: null == description
          ? _self.description
          : description // ignore: cast_nullable_to_non_nullable
              as String,
      price: null == price
          ? _self.price
          : price // ignore: cast_nullable_to_non_nullable
              as double,
      originalPrice: null == originalPrice
          ? _self.originalPrice
          : originalPrice // ignore: cast_nullable_to_non_nullable
              as double,
      images: null == images
          ? _self.images
          : images // ignore: cast_nullable_to_non_nullable
              as List<String>,
      rating: null == rating
          ? _self.rating
          : rating // ignore: cast_nullable_to_non_nullable
              as double,
      reviewCount: null == reviewCount
          ? _self.reviewCount
          : reviewCount // ignore: cast_nullable_to_non_nullable
              as int,
      stock: null == stock
          ? _self.stock
          : stock // ignore: cast_nullable_to_non_nullable
              as int,
      category: null == category
          ? _self.category
          : category // ignore: cast_nullable_to_non_nullable
              as String,
      sizes: null == sizes
          ? _self.sizes
          : sizes // ignore: cast_nullable_to_non_nullable
              as List<String>,
      colors: null == colors
          ? _self.colors
          : colors // ignore: cast_nullable_to_non_nullable
              as List<String>,
      features: null == features
          ? _self.features
          : features // ignore: cast_nullable_to_non_nullable
              as List<String>,
      sellerId: freezed == sellerId
          ? _self.sellerId
          : sellerId // ignore: cast_nullable_to_non_nullable
              as String?,
      sellerName: freezed == sellerName
          ? _self.sellerName
          : sellerName // ignore: cast_nullable_to_non_nullable
              as String?,
      isSellerVerified: null == isSellerVerified
          ? _self.isSellerVerified
          : isSellerVerified // ignore: cast_nullable_to_non_nullable
              as bool,
      sellerRating: null == sellerRating
          ? _self.sellerRating
          : sellerRating // ignore: cast_nullable_to_non_nullable
              as double,
      isFeatured: null == isFeatured
          ? _self.isFeatured
          : isFeatured // ignore: cast_nullable_to_non_nullable
              as bool,
      isNew: null == isNew
          ? _self.isNew
          : isNew // ignore: cast_nullable_to_non_nullable
              as bool,
      createdAt: freezed == createdAt
          ? _self.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ));
  }
}

/// Adds pattern-matching-related methods to [Product].
extension ProductPatterns on Product {
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
    TResult Function(_Product value)? $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _Product() when $default != null:
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
    TResult Function(_Product value) $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Product():
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
    TResult? Function(_Product value)? $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Product() when $default != null:
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
            String id,
            String title,
            String description,
            double price,
            double originalPrice,
            List<String> images,
            double rating,
            int reviewCount,
            int stock,
            String category,
            List<String> sizes,
            List<String> colors,
            List<String> features,
            String? sellerId,
            String? sellerName,
            bool isSellerVerified,
            double sellerRating,
            bool isFeatured,
            bool isNew,
            DateTime? createdAt)?
        $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _Product() when $default != null:
        return $default(
            _that.id,
            _that.title,
            _that.description,
            _that.price,
            _that.originalPrice,
            _that.images,
            _that.rating,
            _that.reviewCount,
            _that.stock,
            _that.category,
            _that.sizes,
            _that.colors,
            _that.features,
            _that.sellerId,
            _that.sellerName,
            _that.isSellerVerified,
            _that.sellerRating,
            _that.isFeatured,
            _that.isNew,
            _that.createdAt);
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
            String id,
            String title,
            String description,
            double price,
            double originalPrice,
            List<String> images,
            double rating,
            int reviewCount,
            int stock,
            String category,
            List<String> sizes,
            List<String> colors,
            List<String> features,
            String? sellerId,
            String? sellerName,
            bool isSellerVerified,
            double sellerRating,
            bool isFeatured,
            bool isNew,
            DateTime? createdAt)
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Product():
        return $default(
            _that.id,
            _that.title,
            _that.description,
            _that.price,
            _that.originalPrice,
            _that.images,
            _that.rating,
            _that.reviewCount,
            _that.stock,
            _that.category,
            _that.sizes,
            _that.colors,
            _that.features,
            _that.sellerId,
            _that.sellerName,
            _that.isSellerVerified,
            _that.sellerRating,
            _that.isFeatured,
            _that.isNew,
            _that.createdAt);
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
            String id,
            String title,
            String description,
            double price,
            double originalPrice,
            List<String> images,
            double rating,
            int reviewCount,
            int stock,
            String category,
            List<String> sizes,
            List<String> colors,
            List<String> features,
            String? sellerId,
            String? sellerName,
            bool isSellerVerified,
            double sellerRating,
            bool isFeatured,
            bool isNew,
            DateTime? createdAt)?
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Product() when $default != null:
        return $default(
            _that.id,
            _that.title,
            _that.description,
            _that.price,
            _that.originalPrice,
            _that.images,
            _that.rating,
            _that.reviewCount,
            _that.stock,
            _that.category,
            _that.sizes,
            _that.colors,
            _that.features,
            _that.sellerId,
            _that.sellerName,
            _that.isSellerVerified,
            _that.sellerRating,
            _that.isFeatured,
            _that.isNew,
            _that.createdAt);
      case _:
        return null;
    }
  }
}

/// @nodoc
@JsonSerializable()
class _Product implements Product {
  const _Product(
      {required this.id,
      required this.title,
      required this.description,
      required this.price,
      this.originalPrice = 0,
      final List<String> images = const [],
      this.rating = 0.0,
      this.reviewCount = 0,
      this.stock = 0,
      required this.category,
      final List<String> sizes = const [],
      final List<String> colors = const [],
      final List<String> features = const [],
      this.sellerId,
      this.sellerName,
      this.isSellerVerified = false,
      this.sellerRating = 0.0,
      this.isFeatured = false,
      this.isNew = false,
      this.createdAt})
      : _images = images,
        _sizes = sizes,
        _colors = colors,
        _features = features;
  factory _Product.fromJson(Map<String, dynamic> json) =>
      _$ProductFromJson(json);

  @override
  final String id;
  @override
  final String title;
  @override
  final String description;
  @override
  final double price;
  @override
  @JsonKey()
  final double originalPrice;
  final List<String> _images;
  @override
  @JsonKey()
  List<String> get images {
    if (_images is EqualUnmodifiableListView) return _images;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_images);
  }

  @override
  @JsonKey()
  final double rating;
  @override
  @JsonKey()
  final int reviewCount;
  @override
  @JsonKey()
  final int stock;
  @override
  final String category;
  final List<String> _sizes;
  @override
  @JsonKey()
  List<String> get sizes {
    if (_sizes is EqualUnmodifiableListView) return _sizes;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_sizes);
  }

  final List<String> _colors;
  @override
  @JsonKey()
  List<String> get colors {
    if (_colors is EqualUnmodifiableListView) return _colors;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_colors);
  }

  final List<String> _features;
  @override
  @JsonKey()
  List<String> get features {
    if (_features is EqualUnmodifiableListView) return _features;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_features);
  }

  @override
  final String? sellerId;
  @override
  final String? sellerName;
  @override
  @JsonKey()
  final bool isSellerVerified;
  @override
  @JsonKey()
  final double sellerRating;
  @override
  @JsonKey()
  final bool isFeatured;
  @override
  @JsonKey()
  final bool isNew;
  @override
  final DateTime? createdAt;

  /// Create a copy of Product
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$ProductCopyWith<_Product> get copyWith =>
      __$ProductCopyWithImpl<_Product>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$ProductToJson(
      this,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _Product &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.price, price) || other.price == price) &&
            (identical(other.originalPrice, originalPrice) ||
                other.originalPrice == originalPrice) &&
            const DeepCollectionEquality().equals(other._images, _images) &&
            (identical(other.rating, rating) || other.rating == rating) &&
            (identical(other.reviewCount, reviewCount) ||
                other.reviewCount == reviewCount) &&
            (identical(other.stock, stock) || other.stock == stock) &&
            (identical(other.category, category) ||
                other.category == category) &&
            const DeepCollectionEquality().equals(other._sizes, _sizes) &&
            const DeepCollectionEquality().equals(other._colors, _colors) &&
            const DeepCollectionEquality().equals(other._features, _features) &&
            (identical(other.sellerId, sellerId) ||
                other.sellerId == sellerId) &&
            (identical(other.sellerName, sellerName) ||
                other.sellerName == sellerName) &&
            (identical(other.isSellerVerified, isSellerVerified) ||
                other.isSellerVerified == isSellerVerified) &&
            (identical(other.sellerRating, sellerRating) ||
                other.sellerRating == sellerRating) &&
            (identical(other.isFeatured, isFeatured) ||
                other.isFeatured == isFeatured) &&
            (identical(other.isNew, isNew) || other.isNew == isNew) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hashAll([
        runtimeType,
        id,
        title,
        description,
        price,
        originalPrice,
        const DeepCollectionEquality().hash(_images),
        rating,
        reviewCount,
        stock,
        category,
        const DeepCollectionEquality().hash(_sizes),
        const DeepCollectionEquality().hash(_colors),
        const DeepCollectionEquality().hash(_features),
        sellerId,
        sellerName,
        isSellerVerified,
        sellerRating,
        isFeatured,
        isNew,
        createdAt
      ]);

  @override
  String toString() {
    return 'Product(id: $id, title: $title, description: $description, price: $price, originalPrice: $originalPrice, images: $images, rating: $rating, reviewCount: $reviewCount, stock: $stock, category: $category, sizes: $sizes, colors: $colors, features: $features, sellerId: $sellerId, sellerName: $sellerName, isSellerVerified: $isSellerVerified, sellerRating: $sellerRating, isFeatured: $isFeatured, isNew: $isNew, createdAt: $createdAt)';
  }
}

/// @nodoc
abstract mixin class _$ProductCopyWith<$Res> implements $ProductCopyWith<$Res> {
  factory _$ProductCopyWith(_Product value, $Res Function(_Product) _then) =
      __$ProductCopyWithImpl;
  @override
  @useResult
  $Res call(
      {String id,
      String title,
      String description,
      double price,
      double originalPrice,
      List<String> images,
      double rating,
      int reviewCount,
      int stock,
      String category,
      List<String> sizes,
      List<String> colors,
      List<String> features,
      String? sellerId,
      String? sellerName,
      bool isSellerVerified,
      double sellerRating,
      bool isFeatured,
      bool isNew,
      DateTime? createdAt});
}

/// @nodoc
class __$ProductCopyWithImpl<$Res> implements _$ProductCopyWith<$Res> {
  __$ProductCopyWithImpl(this._self, this._then);

  final _Product _self;
  final $Res Function(_Product) _then;

  /// Create a copy of Product
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? description = null,
    Object? price = null,
    Object? originalPrice = null,
    Object? images = null,
    Object? rating = null,
    Object? reviewCount = null,
    Object? stock = null,
    Object? category = null,
    Object? sizes = null,
    Object? colors = null,
    Object? features = null,
    Object? sellerId = freezed,
    Object? sellerName = freezed,
    Object? isSellerVerified = null,
    Object? sellerRating = null,
    Object? isFeatured = null,
    Object? isNew = null,
    Object? createdAt = freezed,
  }) {
    return _then(_Product(
      id: null == id
          ? _self.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      title: null == title
          ? _self.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      description: null == description
          ? _self.description
          : description // ignore: cast_nullable_to_non_nullable
              as String,
      price: null == price
          ? _self.price
          : price // ignore: cast_nullable_to_non_nullable
              as double,
      originalPrice: null == originalPrice
          ? _self.originalPrice
          : originalPrice // ignore: cast_nullable_to_non_nullable
              as double,
      images: null == images
          ? _self._images
          : images // ignore: cast_nullable_to_non_nullable
              as List<String>,
      rating: null == rating
          ? _self.rating
          : rating // ignore: cast_nullable_to_non_nullable
              as double,
      reviewCount: null == reviewCount
          ? _self.reviewCount
          : reviewCount // ignore: cast_nullable_to_non_nullable
              as int,
      stock: null == stock
          ? _self.stock
          : stock // ignore: cast_nullable_to_non_nullable
              as int,
      category: null == category
          ? _self.category
          : category // ignore: cast_nullable_to_non_nullable
              as String,
      sizes: null == sizes
          ? _self._sizes
          : sizes // ignore: cast_nullable_to_non_nullable
              as List<String>,
      colors: null == colors
          ? _self._colors
          : colors // ignore: cast_nullable_to_non_nullable
              as List<String>,
      features: null == features
          ? _self._features
          : features // ignore: cast_nullable_to_non_nullable
              as List<String>,
      sellerId: freezed == sellerId
          ? _self.sellerId
          : sellerId // ignore: cast_nullable_to_non_nullable
              as String?,
      sellerName: freezed == sellerName
          ? _self.sellerName
          : sellerName // ignore: cast_nullable_to_non_nullable
              as String?,
      isSellerVerified: null == isSellerVerified
          ? _self.isSellerVerified
          : isSellerVerified // ignore: cast_nullable_to_non_nullable
              as bool,
      sellerRating: null == sellerRating
          ? _self.sellerRating
          : sellerRating // ignore: cast_nullable_to_non_nullable
              as double,
      isFeatured: null == isFeatured
          ? _self.isFeatured
          : isFeatured // ignore: cast_nullable_to_non_nullable
              as bool,
      isNew: null == isNew
          ? _self.isNew
          : isNew // ignore: cast_nullable_to_non_nullable
              as bool,
      createdAt: freezed == createdAt
          ? _self.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ));
  }
}

/// @nodoc
mixin _$CartItem {
  String get id;
  Product get product;
  int get quantity;
  String? get selectedSize;
  String? get selectedColor;
  double get subtotal;

  /// Create a copy of CartItem
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $CartItemCopyWith<CartItem> get copyWith =>
      _$CartItemCopyWithImpl<CartItem>(this as CartItem, _$identity);

  /// Serializes this CartItem to a JSON map.
  Map<String, dynamic> toJson();

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is CartItem &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.product, product) || other.product == product) &&
            (identical(other.quantity, quantity) ||
                other.quantity == quantity) &&
            (identical(other.selectedSize, selectedSize) ||
                other.selectedSize == selectedSize) &&
            (identical(other.selectedColor, selectedColor) ||
                other.selectedColor == selectedColor) &&
            (identical(other.subtotal, subtotal) ||
                other.subtotal == subtotal));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, product, quantity,
      selectedSize, selectedColor, subtotal);

  @override
  String toString() {
    return 'CartItem(id: $id, product: $product, quantity: $quantity, selectedSize: $selectedSize, selectedColor: $selectedColor, subtotal: $subtotal)';
  }
}

/// @nodoc
abstract mixin class $CartItemCopyWith<$Res> {
  factory $CartItemCopyWith(CartItem value, $Res Function(CartItem) _then) =
      _$CartItemCopyWithImpl;
  @useResult
  $Res call(
      {String id,
      Product product,
      int quantity,
      String? selectedSize,
      String? selectedColor,
      double subtotal});

  $ProductCopyWith<$Res> get product;
}

/// @nodoc
class _$CartItemCopyWithImpl<$Res> implements $CartItemCopyWith<$Res> {
  _$CartItemCopyWithImpl(this._self, this._then);

  final CartItem _self;
  final $Res Function(CartItem) _then;

  /// Create a copy of CartItem
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? product = null,
    Object? quantity = null,
    Object? selectedSize = freezed,
    Object? selectedColor = freezed,
    Object? subtotal = null,
  }) {
    return _then(_self.copyWith(
      id: null == id
          ? _self.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      product: null == product
          ? _self.product
          : product // ignore: cast_nullable_to_non_nullable
              as Product,
      quantity: null == quantity
          ? _self.quantity
          : quantity // ignore: cast_nullable_to_non_nullable
              as int,
      selectedSize: freezed == selectedSize
          ? _self.selectedSize
          : selectedSize // ignore: cast_nullable_to_non_nullable
              as String?,
      selectedColor: freezed == selectedColor
          ? _self.selectedColor
          : selectedColor // ignore: cast_nullable_to_non_nullable
              as String?,
      subtotal: null == subtotal
          ? _self.subtotal
          : subtotal // ignore: cast_nullable_to_non_nullable
              as double,
    ));
  }

  /// Create a copy of CartItem
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $ProductCopyWith<$Res> get product {
    return $ProductCopyWith<$Res>(_self.product, (value) {
      return _then(_self.copyWith(product: value));
    });
  }
}

/// Adds pattern-matching-related methods to [CartItem].
extension CartItemPatterns on CartItem {
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
    TResult Function(_CartItem value)? $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _CartItem() when $default != null:
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
    TResult Function(_CartItem value) $default,
  ) {
    final _that = this;
    switch (_that) {
      case _CartItem():
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
    TResult? Function(_CartItem value)? $default,
  ) {
    final _that = this;
    switch (_that) {
      case _CartItem() when $default != null:
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
    TResult Function(String id, Product product, int quantity,
            String? selectedSize, String? selectedColor, double subtotal)?
        $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _CartItem() when $default != null:
        return $default(_that.id, _that.product, _that.quantity,
            _that.selectedSize, _that.selectedColor, _that.subtotal);
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
    TResult Function(String id, Product product, int quantity,
            String? selectedSize, String? selectedColor, double subtotal)
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _CartItem():
        return $default(_that.id, _that.product, _that.quantity,
            _that.selectedSize, _that.selectedColor, _that.subtotal);
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
    TResult? Function(String id, Product product, int quantity,
            String? selectedSize, String? selectedColor, double subtotal)?
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _CartItem() when $default != null:
        return $default(_that.id, _that.product, _that.quantity,
            _that.selectedSize, _that.selectedColor, _that.subtotal);
      case _:
        return null;
    }
  }
}

/// @nodoc
@JsonSerializable()
class _CartItem implements CartItem {
  const _CartItem(
      {required this.id,
      required this.product,
      required this.quantity,
      this.selectedSize,
      this.selectedColor,
      required this.subtotal});
  factory _CartItem.fromJson(Map<String, dynamic> json) =>
      _$CartItemFromJson(json);

  @override
  final String id;
  @override
  final Product product;
  @override
  final int quantity;
  @override
  final String? selectedSize;
  @override
  final String? selectedColor;
  @override
  final double subtotal;

  /// Create a copy of CartItem
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$CartItemCopyWith<_CartItem> get copyWith =>
      __$CartItemCopyWithImpl<_CartItem>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$CartItemToJson(
      this,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _CartItem &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.product, product) || other.product == product) &&
            (identical(other.quantity, quantity) ||
                other.quantity == quantity) &&
            (identical(other.selectedSize, selectedSize) ||
                other.selectedSize == selectedSize) &&
            (identical(other.selectedColor, selectedColor) ||
                other.selectedColor == selectedColor) &&
            (identical(other.subtotal, subtotal) ||
                other.subtotal == subtotal));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, product, quantity,
      selectedSize, selectedColor, subtotal);

  @override
  String toString() {
    return 'CartItem(id: $id, product: $product, quantity: $quantity, selectedSize: $selectedSize, selectedColor: $selectedColor, subtotal: $subtotal)';
  }
}

/// @nodoc
abstract mixin class _$CartItemCopyWith<$Res>
    implements $CartItemCopyWith<$Res> {
  factory _$CartItemCopyWith(_CartItem value, $Res Function(_CartItem) _then) =
      __$CartItemCopyWithImpl;
  @override
  @useResult
  $Res call(
      {String id,
      Product product,
      int quantity,
      String? selectedSize,
      String? selectedColor,
      double subtotal});

  @override
  $ProductCopyWith<$Res> get product;
}

/// @nodoc
class __$CartItemCopyWithImpl<$Res> implements _$CartItemCopyWith<$Res> {
  __$CartItemCopyWithImpl(this._self, this._then);

  final _CartItem _self;
  final $Res Function(_CartItem) _then;

  /// Create a copy of CartItem
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? id = null,
    Object? product = null,
    Object? quantity = null,
    Object? selectedSize = freezed,
    Object? selectedColor = freezed,
    Object? subtotal = null,
  }) {
    return _then(_CartItem(
      id: null == id
          ? _self.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      product: null == product
          ? _self.product
          : product // ignore: cast_nullable_to_non_nullable
              as Product,
      quantity: null == quantity
          ? _self.quantity
          : quantity // ignore: cast_nullable_to_non_nullable
              as int,
      selectedSize: freezed == selectedSize
          ? _self.selectedSize
          : selectedSize // ignore: cast_nullable_to_non_nullable
              as String?,
      selectedColor: freezed == selectedColor
          ? _self.selectedColor
          : selectedColor // ignore: cast_nullable_to_non_nullable
              as String?,
      subtotal: null == subtotal
          ? _self.subtotal
          : subtotal // ignore: cast_nullable_to_non_nullable
              as double,
    ));
  }

  /// Create a copy of CartItem
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $ProductCopyWith<$Res> get product {
    return $ProductCopyWith<$Res>(_self.product, (value) {
      return _then(_self.copyWith(product: value));
    });
  }
}

/// @nodoc
mixin _$Address {
  String get id;
  String get name;
  String get addressLine1;
  String? get addressLine2;
  String get city;
  String get state;
  String get zipCode;
  String get phone;
  bool get isDefault;

  /// Create a copy of Address
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $AddressCopyWith<Address> get copyWith =>
      _$AddressCopyWithImpl<Address>(this as Address, _$identity);

  /// Serializes this Address to a JSON map.
  Map<String, dynamic> toJson();

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is Address &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.addressLine1, addressLine1) ||
                other.addressLine1 == addressLine1) &&
            (identical(other.addressLine2, addressLine2) ||
                other.addressLine2 == addressLine2) &&
            (identical(other.city, city) || other.city == city) &&
            (identical(other.state, state) || other.state == state) &&
            (identical(other.zipCode, zipCode) || other.zipCode == zipCode) &&
            (identical(other.phone, phone) || other.phone == phone) &&
            (identical(other.isDefault, isDefault) ||
                other.isDefault == isDefault));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, name, addressLine1,
      addressLine2, city, state, zipCode, phone, isDefault);

  @override
  String toString() {
    return 'Address(id: $id, name: $name, addressLine1: $addressLine1, addressLine2: $addressLine2, city: $city, state: $state, zipCode: $zipCode, phone: $phone, isDefault: $isDefault)';
  }
}

/// @nodoc
abstract mixin class $AddressCopyWith<$Res> {
  factory $AddressCopyWith(Address value, $Res Function(Address) _then) =
      _$AddressCopyWithImpl;
  @useResult
  $Res call(
      {String id,
      String name,
      String addressLine1,
      String? addressLine2,
      String city,
      String state,
      String zipCode,
      String phone,
      bool isDefault});
}

/// @nodoc
class _$AddressCopyWithImpl<$Res> implements $AddressCopyWith<$Res> {
  _$AddressCopyWithImpl(this._self, this._then);

  final Address _self;
  final $Res Function(Address) _then;

  /// Create a copy of Address
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? addressLine1 = null,
    Object? addressLine2 = freezed,
    Object? city = null,
    Object? state = null,
    Object? zipCode = null,
    Object? phone = null,
    Object? isDefault = null,
  }) {
    return _then(_self.copyWith(
      id: null == id
          ? _self.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _self.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      addressLine1: null == addressLine1
          ? _self.addressLine1
          : addressLine1 // ignore: cast_nullable_to_non_nullable
              as String,
      addressLine2: freezed == addressLine2
          ? _self.addressLine2
          : addressLine2 // ignore: cast_nullable_to_non_nullable
              as String?,
      city: null == city
          ? _self.city
          : city // ignore: cast_nullable_to_non_nullable
              as String,
      state: null == state
          ? _self.state
          : state // ignore: cast_nullable_to_non_nullable
              as String,
      zipCode: null == zipCode
          ? _self.zipCode
          : zipCode // ignore: cast_nullable_to_non_nullable
              as String,
      phone: null == phone
          ? _self.phone
          : phone // ignore: cast_nullable_to_non_nullable
              as String,
      isDefault: null == isDefault
          ? _self.isDefault
          : isDefault // ignore: cast_nullable_to_non_nullable
              as bool,
    ));
  }
}

/// Adds pattern-matching-related methods to [Address].
extension AddressPatterns on Address {
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
    TResult Function(_Address value)? $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _Address() when $default != null:
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
    TResult Function(_Address value) $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Address():
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
    TResult? Function(_Address value)? $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Address() when $default != null:
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
            String id,
            String name,
            String addressLine1,
            String? addressLine2,
            String city,
            String state,
            String zipCode,
            String phone,
            bool isDefault)?
        $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _Address() when $default != null:
        return $default(
            _that.id,
            _that.name,
            _that.addressLine1,
            _that.addressLine2,
            _that.city,
            _that.state,
            _that.zipCode,
            _that.phone,
            _that.isDefault);
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
            String id,
            String name,
            String addressLine1,
            String? addressLine2,
            String city,
            String state,
            String zipCode,
            String phone,
            bool isDefault)
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Address():
        return $default(
            _that.id,
            _that.name,
            _that.addressLine1,
            _that.addressLine2,
            _that.city,
            _that.state,
            _that.zipCode,
            _that.phone,
            _that.isDefault);
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
            String id,
            String name,
            String addressLine1,
            String? addressLine2,
            String city,
            String state,
            String zipCode,
            String phone,
            bool isDefault)?
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Address() when $default != null:
        return $default(
            _that.id,
            _that.name,
            _that.addressLine1,
            _that.addressLine2,
            _that.city,
            _that.state,
            _that.zipCode,
            _that.phone,
            _that.isDefault);
      case _:
        return null;
    }
  }
}

/// @nodoc
@JsonSerializable()
class _Address implements Address {
  const _Address(
      {required this.id,
      required this.name,
      required this.addressLine1,
      this.addressLine2,
      required this.city,
      required this.state,
      required this.zipCode,
      required this.phone,
      this.isDefault = false});
  factory _Address.fromJson(Map<String, dynamic> json) =>
      _$AddressFromJson(json);

  @override
  final String id;
  @override
  final String name;
  @override
  final String addressLine1;
  @override
  final String? addressLine2;
  @override
  final String city;
  @override
  final String state;
  @override
  final String zipCode;
  @override
  final String phone;
  @override
  @JsonKey()
  final bool isDefault;

  /// Create a copy of Address
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$AddressCopyWith<_Address> get copyWith =>
      __$AddressCopyWithImpl<_Address>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$AddressToJson(
      this,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _Address &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.addressLine1, addressLine1) ||
                other.addressLine1 == addressLine1) &&
            (identical(other.addressLine2, addressLine2) ||
                other.addressLine2 == addressLine2) &&
            (identical(other.city, city) || other.city == city) &&
            (identical(other.state, state) || other.state == state) &&
            (identical(other.zipCode, zipCode) || other.zipCode == zipCode) &&
            (identical(other.phone, phone) || other.phone == phone) &&
            (identical(other.isDefault, isDefault) ||
                other.isDefault == isDefault));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, name, addressLine1,
      addressLine2, city, state, zipCode, phone, isDefault);

  @override
  String toString() {
    return 'Address(id: $id, name: $name, addressLine1: $addressLine1, addressLine2: $addressLine2, city: $city, state: $state, zipCode: $zipCode, phone: $phone, isDefault: $isDefault)';
  }
}

/// @nodoc
abstract mixin class _$AddressCopyWith<$Res> implements $AddressCopyWith<$Res> {
  factory _$AddressCopyWith(_Address value, $Res Function(_Address) _then) =
      __$AddressCopyWithImpl;
  @override
  @useResult
  $Res call(
      {String id,
      String name,
      String addressLine1,
      String? addressLine2,
      String city,
      String state,
      String zipCode,
      String phone,
      bool isDefault});
}

/// @nodoc
class __$AddressCopyWithImpl<$Res> implements _$AddressCopyWith<$Res> {
  __$AddressCopyWithImpl(this._self, this._then);

  final _Address _self;
  final $Res Function(_Address) _then;

  /// Create a copy of Address
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? addressLine1 = null,
    Object? addressLine2 = freezed,
    Object? city = null,
    Object? state = null,
    Object? zipCode = null,
    Object? phone = null,
    Object? isDefault = null,
  }) {
    return _then(_Address(
      id: null == id
          ? _self.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _self.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      addressLine1: null == addressLine1
          ? _self.addressLine1
          : addressLine1 // ignore: cast_nullable_to_non_nullable
              as String,
      addressLine2: freezed == addressLine2
          ? _self.addressLine2
          : addressLine2 // ignore: cast_nullable_to_non_nullable
              as String?,
      city: null == city
          ? _self.city
          : city // ignore: cast_nullable_to_non_nullable
              as String,
      state: null == state
          ? _self.state
          : state // ignore: cast_nullable_to_non_nullable
              as String,
      zipCode: null == zipCode
          ? _self.zipCode
          : zipCode // ignore: cast_nullable_to_non_nullable
              as String,
      phone: null == phone
          ? _self.phone
          : phone // ignore: cast_nullable_to_non_nullable
              as String,
      isDefault: null == isDefault
          ? _self.isDefault
          : isDefault // ignore: cast_nullable_to_non_nullable
              as bool,
    ));
  }
}

/// @nodoc
mixin _$PaymentMethod {
  String get id;
  String get type; // 'card', 'paypal', 'cod'
  String get name;
  String? get description;
  String? get cardLast4;
  bool get isDefault;

  /// Create a copy of PaymentMethod
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $PaymentMethodCopyWith<PaymentMethod> get copyWith =>
      _$PaymentMethodCopyWithImpl<PaymentMethod>(
          this as PaymentMethod, _$identity);

  /// Serializes this PaymentMethod to a JSON map.
  Map<String, dynamic> toJson();

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is PaymentMethod &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.cardLast4, cardLast4) ||
                other.cardLast4 == cardLast4) &&
            (identical(other.isDefault, isDefault) ||
                other.isDefault == isDefault));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType, id, type, name, description, cardLast4, isDefault);

  @override
  String toString() {
    return 'PaymentMethod(id: $id, type: $type, name: $name, description: $description, cardLast4: $cardLast4, isDefault: $isDefault)';
  }
}

/// @nodoc
abstract mixin class $PaymentMethodCopyWith<$Res> {
  factory $PaymentMethodCopyWith(
          PaymentMethod value, $Res Function(PaymentMethod) _then) =
      _$PaymentMethodCopyWithImpl;
  @useResult
  $Res call(
      {String id,
      String type,
      String name,
      String? description,
      String? cardLast4,
      bool isDefault});
}

/// @nodoc
class _$PaymentMethodCopyWithImpl<$Res>
    implements $PaymentMethodCopyWith<$Res> {
  _$PaymentMethodCopyWithImpl(this._self, this._then);

  final PaymentMethod _self;
  final $Res Function(PaymentMethod) _then;

  /// Create a copy of PaymentMethod
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? type = null,
    Object? name = null,
    Object? description = freezed,
    Object? cardLast4 = freezed,
    Object? isDefault = null,
  }) {
    return _then(_self.copyWith(
      id: null == id
          ? _self.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _self.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _self.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      description: freezed == description
          ? _self.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      cardLast4: freezed == cardLast4
          ? _self.cardLast4
          : cardLast4 // ignore: cast_nullable_to_non_nullable
              as String?,
      isDefault: null == isDefault
          ? _self.isDefault
          : isDefault // ignore: cast_nullable_to_non_nullable
              as bool,
    ));
  }
}

/// Adds pattern-matching-related methods to [PaymentMethod].
extension PaymentMethodPatterns on PaymentMethod {
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
    TResult Function(_PaymentMethod value)? $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _PaymentMethod() when $default != null:
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
    TResult Function(_PaymentMethod value) $default,
  ) {
    final _that = this;
    switch (_that) {
      case _PaymentMethod():
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
    TResult? Function(_PaymentMethod value)? $default,
  ) {
    final _that = this;
    switch (_that) {
      case _PaymentMethod() when $default != null:
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
    TResult Function(String id, String type, String name, String? description,
            String? cardLast4, bool isDefault)?
        $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _PaymentMethod() when $default != null:
        return $default(_that.id, _that.type, _that.name, _that.description,
            _that.cardLast4, _that.isDefault);
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
    TResult Function(String id, String type, String name, String? description,
            String? cardLast4, bool isDefault)
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _PaymentMethod():
        return $default(_that.id, _that.type, _that.name, _that.description,
            _that.cardLast4, _that.isDefault);
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
    TResult? Function(String id, String type, String name, String? description,
            String? cardLast4, bool isDefault)?
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _PaymentMethod() when $default != null:
        return $default(_that.id, _that.type, _that.name, _that.description,
            _that.cardLast4, _that.isDefault);
      case _:
        return null;
    }
  }
}

/// @nodoc
@JsonSerializable()
class _PaymentMethod implements PaymentMethod {
  const _PaymentMethod(
      {required this.id,
      required this.type,
      required this.name,
      this.description,
      this.cardLast4,
      this.isDefault = false});
  factory _PaymentMethod.fromJson(Map<String, dynamic> json) =>
      _$PaymentMethodFromJson(json);

  @override
  final String id;
  @override
  final String type;
// 'card', 'paypal', 'cod'
  @override
  final String name;
  @override
  final String? description;
  @override
  final String? cardLast4;
  @override
  @JsonKey()
  final bool isDefault;

  /// Create a copy of PaymentMethod
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$PaymentMethodCopyWith<_PaymentMethod> get copyWith =>
      __$PaymentMethodCopyWithImpl<_PaymentMethod>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$PaymentMethodToJson(
      this,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _PaymentMethod &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.cardLast4, cardLast4) ||
                other.cardLast4 == cardLast4) &&
            (identical(other.isDefault, isDefault) ||
                other.isDefault == isDefault));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType, id, type, name, description, cardLast4, isDefault);

  @override
  String toString() {
    return 'PaymentMethod(id: $id, type: $type, name: $name, description: $description, cardLast4: $cardLast4, isDefault: $isDefault)';
  }
}

/// @nodoc
abstract mixin class _$PaymentMethodCopyWith<$Res>
    implements $PaymentMethodCopyWith<$Res> {
  factory _$PaymentMethodCopyWith(
          _PaymentMethod value, $Res Function(_PaymentMethod) _then) =
      __$PaymentMethodCopyWithImpl;
  @override
  @useResult
  $Res call(
      {String id,
      String type,
      String name,
      String? description,
      String? cardLast4,
      bool isDefault});
}

/// @nodoc
class __$PaymentMethodCopyWithImpl<$Res>
    implements _$PaymentMethodCopyWith<$Res> {
  __$PaymentMethodCopyWithImpl(this._self, this._then);

  final _PaymentMethod _self;
  final $Res Function(_PaymentMethod) _then;

  /// Create a copy of PaymentMethod
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? id = null,
    Object? type = null,
    Object? name = null,
    Object? description = freezed,
    Object? cardLast4 = freezed,
    Object? isDefault = null,
  }) {
    return _then(_PaymentMethod(
      id: null == id
          ? _self.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _self.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _self.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      description: freezed == description
          ? _self.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      cardLast4: freezed == cardLast4
          ? _self.cardLast4
          : cardLast4 // ignore: cast_nullable_to_non_nullable
              as String?,
      isDefault: null == isDefault
          ? _self.isDefault
          : isDefault // ignore: cast_nullable_to_non_nullable
              as bool,
    ));
  }
}

/// @nodoc
mixin _$Order {
  String get id;
  String get orderNumber;
  DateTime get date;
  String get status; // 'pending', 'shipped', 'delivered', 'canceled'
  List<OrderItem> get items;
  double get subtotal;
  double get shipping;
  double get tax;
  double get total;
  Address get shippingAddress;
  PaymentMethod get paymentMethod;
  String? get trackingNumber;
  DateTime? get estimatedDelivery;

  /// Create a copy of Order
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $OrderCopyWith<Order> get copyWith =>
      _$OrderCopyWithImpl<Order>(this as Order, _$identity);

  /// Serializes this Order to a JSON map.
  Map<String, dynamic> toJson();

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is Order &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.orderNumber, orderNumber) ||
                other.orderNumber == orderNumber) &&
            (identical(other.date, date) || other.date == date) &&
            (identical(other.status, status) || other.status == status) &&
            const DeepCollectionEquality().equals(other.items, items) &&
            (identical(other.subtotal, subtotal) ||
                other.subtotal == subtotal) &&
            (identical(other.shipping, shipping) ||
                other.shipping == shipping) &&
            (identical(other.tax, tax) || other.tax == tax) &&
            (identical(other.total, total) || other.total == total) &&
            (identical(other.shippingAddress, shippingAddress) ||
                other.shippingAddress == shippingAddress) &&
            (identical(other.paymentMethod, paymentMethod) ||
                other.paymentMethod == paymentMethod) &&
            (identical(other.trackingNumber, trackingNumber) ||
                other.trackingNumber == trackingNumber) &&
            (identical(other.estimatedDelivery, estimatedDelivery) ||
                other.estimatedDelivery == estimatedDelivery));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      orderNumber,
      date,
      status,
      const DeepCollectionEquality().hash(items),
      subtotal,
      shipping,
      tax,
      total,
      shippingAddress,
      paymentMethod,
      trackingNumber,
      estimatedDelivery);

  @override
  String toString() {
    return 'Order(id: $id, orderNumber: $orderNumber, date: $date, status: $status, items: $items, subtotal: $subtotal, shipping: $shipping, tax: $tax, total: $total, shippingAddress: $shippingAddress, paymentMethod: $paymentMethod, trackingNumber: $trackingNumber, estimatedDelivery: $estimatedDelivery)';
  }
}

/// @nodoc
abstract mixin class $OrderCopyWith<$Res> {
  factory $OrderCopyWith(Order value, $Res Function(Order) _then) =
      _$OrderCopyWithImpl;
  @useResult
  $Res call(
      {String id,
      String orderNumber,
      DateTime date,
      String status,
      List<OrderItem> items,
      double subtotal,
      double shipping,
      double tax,
      double total,
      Address shippingAddress,
      PaymentMethod paymentMethod,
      String? trackingNumber,
      DateTime? estimatedDelivery});

  $AddressCopyWith<$Res> get shippingAddress;
  $PaymentMethodCopyWith<$Res> get paymentMethod;
}

/// @nodoc
class _$OrderCopyWithImpl<$Res> implements $OrderCopyWith<$Res> {
  _$OrderCopyWithImpl(this._self, this._then);

  final Order _self;
  final $Res Function(Order) _then;

  /// Create a copy of Order
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? orderNumber = null,
    Object? date = null,
    Object? status = null,
    Object? items = null,
    Object? subtotal = null,
    Object? shipping = null,
    Object? tax = null,
    Object? total = null,
    Object? shippingAddress = null,
    Object? paymentMethod = null,
    Object? trackingNumber = freezed,
    Object? estimatedDelivery = freezed,
  }) {
    return _then(_self.copyWith(
      id: null == id
          ? _self.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      orderNumber: null == orderNumber
          ? _self.orderNumber
          : orderNumber // ignore: cast_nullable_to_non_nullable
              as String,
      date: null == date
          ? _self.date
          : date // ignore: cast_nullable_to_non_nullable
              as DateTime,
      status: null == status
          ? _self.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      items: null == items
          ? _self.items
          : items // ignore: cast_nullable_to_non_nullable
              as List<OrderItem>,
      subtotal: null == subtotal
          ? _self.subtotal
          : subtotal // ignore: cast_nullable_to_non_nullable
              as double,
      shipping: null == shipping
          ? _self.shipping
          : shipping // ignore: cast_nullable_to_non_nullable
              as double,
      tax: null == tax
          ? _self.tax
          : tax // ignore: cast_nullable_to_non_nullable
              as double,
      total: null == total
          ? _self.total
          : total // ignore: cast_nullable_to_non_nullable
              as double,
      shippingAddress: null == shippingAddress
          ? _self.shippingAddress
          : shippingAddress // ignore: cast_nullable_to_non_nullable
              as Address,
      paymentMethod: null == paymentMethod
          ? _self.paymentMethod
          : paymentMethod // ignore: cast_nullable_to_non_nullable
              as PaymentMethod,
      trackingNumber: freezed == trackingNumber
          ? _self.trackingNumber
          : trackingNumber // ignore: cast_nullable_to_non_nullable
              as String?,
      estimatedDelivery: freezed == estimatedDelivery
          ? _self.estimatedDelivery
          : estimatedDelivery // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ));
  }

  /// Create a copy of Order
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $AddressCopyWith<$Res> get shippingAddress {
    return $AddressCopyWith<$Res>(_self.shippingAddress, (value) {
      return _then(_self.copyWith(shippingAddress: value));
    });
  }

  /// Create a copy of Order
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $PaymentMethodCopyWith<$Res> get paymentMethod {
    return $PaymentMethodCopyWith<$Res>(_self.paymentMethod, (value) {
      return _then(_self.copyWith(paymentMethod: value));
    });
  }
}

/// Adds pattern-matching-related methods to [Order].
extension OrderPatterns on Order {
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
    TResult Function(_Order value)? $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _Order() when $default != null:
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
    TResult Function(_Order value) $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Order():
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
    TResult? Function(_Order value)? $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Order() when $default != null:
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
            String id,
            String orderNumber,
            DateTime date,
            String status,
            List<OrderItem> items,
            double subtotal,
            double shipping,
            double tax,
            double total,
            Address shippingAddress,
            PaymentMethod paymentMethod,
            String? trackingNumber,
            DateTime? estimatedDelivery)?
        $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _Order() when $default != null:
        return $default(
            _that.id,
            _that.orderNumber,
            _that.date,
            _that.status,
            _that.items,
            _that.subtotal,
            _that.shipping,
            _that.tax,
            _that.total,
            _that.shippingAddress,
            _that.paymentMethod,
            _that.trackingNumber,
            _that.estimatedDelivery);
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
            String id,
            String orderNumber,
            DateTime date,
            String status,
            List<OrderItem> items,
            double subtotal,
            double shipping,
            double tax,
            double total,
            Address shippingAddress,
            PaymentMethod paymentMethod,
            String? trackingNumber,
            DateTime? estimatedDelivery)
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Order():
        return $default(
            _that.id,
            _that.orderNumber,
            _that.date,
            _that.status,
            _that.items,
            _that.subtotal,
            _that.shipping,
            _that.tax,
            _that.total,
            _that.shippingAddress,
            _that.paymentMethod,
            _that.trackingNumber,
            _that.estimatedDelivery);
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
            String id,
            String orderNumber,
            DateTime date,
            String status,
            List<OrderItem> items,
            double subtotal,
            double shipping,
            double tax,
            double total,
            Address shippingAddress,
            PaymentMethod paymentMethod,
            String? trackingNumber,
            DateTime? estimatedDelivery)?
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Order() when $default != null:
        return $default(
            _that.id,
            _that.orderNumber,
            _that.date,
            _that.status,
            _that.items,
            _that.subtotal,
            _that.shipping,
            _that.tax,
            _that.total,
            _that.shippingAddress,
            _that.paymentMethod,
            _that.trackingNumber,
            _that.estimatedDelivery);
      case _:
        return null;
    }
  }
}

/// @nodoc
@JsonSerializable()
class _Order implements Order {
  const _Order(
      {required this.id,
      required this.orderNumber,
      required this.date,
      required this.status,
      required final List<OrderItem> items,
      required this.subtotal,
      required this.shipping,
      required this.tax,
      required this.total,
      required this.shippingAddress,
      required this.paymentMethod,
      this.trackingNumber,
      this.estimatedDelivery})
      : _items = items;
  factory _Order.fromJson(Map<String, dynamic> json) => _$OrderFromJson(json);

  @override
  final String id;
  @override
  final String orderNumber;
  @override
  final DateTime date;
  @override
  final String status;
// 'pending', 'shipped', 'delivered', 'canceled'
  final List<OrderItem> _items;
// 'pending', 'shipped', 'delivered', 'canceled'
  @override
  List<OrderItem> get items {
    if (_items is EqualUnmodifiableListView) return _items;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_items);
  }

  @override
  final double subtotal;
  @override
  final double shipping;
  @override
  final double tax;
  @override
  final double total;
  @override
  final Address shippingAddress;
  @override
  final PaymentMethod paymentMethod;
  @override
  final String? trackingNumber;
  @override
  final DateTime? estimatedDelivery;

  /// Create a copy of Order
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$OrderCopyWith<_Order> get copyWith =>
      __$OrderCopyWithImpl<_Order>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$OrderToJson(
      this,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _Order &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.orderNumber, orderNumber) ||
                other.orderNumber == orderNumber) &&
            (identical(other.date, date) || other.date == date) &&
            (identical(other.status, status) || other.status == status) &&
            const DeepCollectionEquality().equals(other._items, _items) &&
            (identical(other.subtotal, subtotal) ||
                other.subtotal == subtotal) &&
            (identical(other.shipping, shipping) ||
                other.shipping == shipping) &&
            (identical(other.tax, tax) || other.tax == tax) &&
            (identical(other.total, total) || other.total == total) &&
            (identical(other.shippingAddress, shippingAddress) ||
                other.shippingAddress == shippingAddress) &&
            (identical(other.paymentMethod, paymentMethod) ||
                other.paymentMethod == paymentMethod) &&
            (identical(other.trackingNumber, trackingNumber) ||
                other.trackingNumber == trackingNumber) &&
            (identical(other.estimatedDelivery, estimatedDelivery) ||
                other.estimatedDelivery == estimatedDelivery));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      orderNumber,
      date,
      status,
      const DeepCollectionEquality().hash(_items),
      subtotal,
      shipping,
      tax,
      total,
      shippingAddress,
      paymentMethod,
      trackingNumber,
      estimatedDelivery);

  @override
  String toString() {
    return 'Order(id: $id, orderNumber: $orderNumber, date: $date, status: $status, items: $items, subtotal: $subtotal, shipping: $shipping, tax: $tax, total: $total, shippingAddress: $shippingAddress, paymentMethod: $paymentMethod, trackingNumber: $trackingNumber, estimatedDelivery: $estimatedDelivery)';
  }
}

/// @nodoc
abstract mixin class _$OrderCopyWith<$Res> implements $OrderCopyWith<$Res> {
  factory _$OrderCopyWith(_Order value, $Res Function(_Order) _then) =
      __$OrderCopyWithImpl;
  @override
  @useResult
  $Res call(
      {String id,
      String orderNumber,
      DateTime date,
      String status,
      List<OrderItem> items,
      double subtotal,
      double shipping,
      double tax,
      double total,
      Address shippingAddress,
      PaymentMethod paymentMethod,
      String? trackingNumber,
      DateTime? estimatedDelivery});

  @override
  $AddressCopyWith<$Res> get shippingAddress;
  @override
  $PaymentMethodCopyWith<$Res> get paymentMethod;
}

/// @nodoc
class __$OrderCopyWithImpl<$Res> implements _$OrderCopyWith<$Res> {
  __$OrderCopyWithImpl(this._self, this._then);

  final _Order _self;
  final $Res Function(_Order) _then;

  /// Create a copy of Order
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? id = null,
    Object? orderNumber = null,
    Object? date = null,
    Object? status = null,
    Object? items = null,
    Object? subtotal = null,
    Object? shipping = null,
    Object? tax = null,
    Object? total = null,
    Object? shippingAddress = null,
    Object? paymentMethod = null,
    Object? trackingNumber = freezed,
    Object? estimatedDelivery = freezed,
  }) {
    return _then(_Order(
      id: null == id
          ? _self.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      orderNumber: null == orderNumber
          ? _self.orderNumber
          : orderNumber // ignore: cast_nullable_to_non_nullable
              as String,
      date: null == date
          ? _self.date
          : date // ignore: cast_nullable_to_non_nullable
              as DateTime,
      status: null == status
          ? _self.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      items: null == items
          ? _self._items
          : items // ignore: cast_nullable_to_non_nullable
              as List<OrderItem>,
      subtotal: null == subtotal
          ? _self.subtotal
          : subtotal // ignore: cast_nullable_to_non_nullable
              as double,
      shipping: null == shipping
          ? _self.shipping
          : shipping // ignore: cast_nullable_to_non_nullable
              as double,
      tax: null == tax
          ? _self.tax
          : tax // ignore: cast_nullable_to_non_nullable
              as double,
      total: null == total
          ? _self.total
          : total // ignore: cast_nullable_to_non_nullable
              as double,
      shippingAddress: null == shippingAddress
          ? _self.shippingAddress
          : shippingAddress // ignore: cast_nullable_to_non_nullable
              as Address,
      paymentMethod: null == paymentMethod
          ? _self.paymentMethod
          : paymentMethod // ignore: cast_nullable_to_non_nullable
              as PaymentMethod,
      trackingNumber: freezed == trackingNumber
          ? _self.trackingNumber
          : trackingNumber // ignore: cast_nullable_to_non_nullable
              as String?,
      estimatedDelivery: freezed == estimatedDelivery
          ? _self.estimatedDelivery
          : estimatedDelivery // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ));
  }

  /// Create a copy of Order
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $AddressCopyWith<$Res> get shippingAddress {
    return $AddressCopyWith<$Res>(_self.shippingAddress, (value) {
      return _then(_self.copyWith(shippingAddress: value));
    });
  }

  /// Create a copy of Order
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $PaymentMethodCopyWith<$Res> get paymentMethod {
    return $PaymentMethodCopyWith<$Res>(_self.paymentMethod, (value) {
      return _then(_self.copyWith(paymentMethod: value));
    });
  }
}

/// @nodoc
mixin _$OrderItem {
  String get id;
  String get productId;
  String get title;
  String get image;
  int get quantity;
  double get price;
  String? get selectedSize;
  String? get selectedColor;

  /// Create a copy of OrderItem
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $OrderItemCopyWith<OrderItem> get copyWith =>
      _$OrderItemCopyWithImpl<OrderItem>(this as OrderItem, _$identity);

  /// Serializes this OrderItem to a JSON map.
  Map<String, dynamic> toJson();

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is OrderItem &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.productId, productId) ||
                other.productId == productId) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.image, image) || other.image == image) &&
            (identical(other.quantity, quantity) ||
                other.quantity == quantity) &&
            (identical(other.price, price) || other.price == price) &&
            (identical(other.selectedSize, selectedSize) ||
                other.selectedSize == selectedSize) &&
            (identical(other.selectedColor, selectedColor) ||
                other.selectedColor == selectedColor));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, productId, title, image,
      quantity, price, selectedSize, selectedColor);

  @override
  String toString() {
    return 'OrderItem(id: $id, productId: $productId, title: $title, image: $image, quantity: $quantity, price: $price, selectedSize: $selectedSize, selectedColor: $selectedColor)';
  }
}

/// @nodoc
abstract mixin class $OrderItemCopyWith<$Res> {
  factory $OrderItemCopyWith(OrderItem value, $Res Function(OrderItem) _then) =
      _$OrderItemCopyWithImpl;
  @useResult
  $Res call(
      {String id,
      String productId,
      String title,
      String image,
      int quantity,
      double price,
      String? selectedSize,
      String? selectedColor});
}

/// @nodoc
class _$OrderItemCopyWithImpl<$Res> implements $OrderItemCopyWith<$Res> {
  _$OrderItemCopyWithImpl(this._self, this._then);

  final OrderItem _self;
  final $Res Function(OrderItem) _then;

  /// Create a copy of OrderItem
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? productId = null,
    Object? title = null,
    Object? image = null,
    Object? quantity = null,
    Object? price = null,
    Object? selectedSize = freezed,
    Object? selectedColor = freezed,
  }) {
    return _then(_self.copyWith(
      id: null == id
          ? _self.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      productId: null == productId
          ? _self.productId
          : productId // ignore: cast_nullable_to_non_nullable
              as String,
      title: null == title
          ? _self.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      image: null == image
          ? _self.image
          : image // ignore: cast_nullable_to_non_nullable
              as String,
      quantity: null == quantity
          ? _self.quantity
          : quantity // ignore: cast_nullable_to_non_nullable
              as int,
      price: null == price
          ? _self.price
          : price // ignore: cast_nullable_to_non_nullable
              as double,
      selectedSize: freezed == selectedSize
          ? _self.selectedSize
          : selectedSize // ignore: cast_nullable_to_non_nullable
              as String?,
      selectedColor: freezed == selectedColor
          ? _self.selectedColor
          : selectedColor // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// Adds pattern-matching-related methods to [OrderItem].
extension OrderItemPatterns on OrderItem {
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
    TResult Function(_OrderItem value)? $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _OrderItem() when $default != null:
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
    TResult Function(_OrderItem value) $default,
  ) {
    final _that = this;
    switch (_that) {
      case _OrderItem():
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
    TResult? Function(_OrderItem value)? $default,
  ) {
    final _that = this;
    switch (_that) {
      case _OrderItem() when $default != null:
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
            String id,
            String productId,
            String title,
            String image,
            int quantity,
            double price,
            String? selectedSize,
            String? selectedColor)?
        $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _OrderItem() when $default != null:
        return $default(
            _that.id,
            _that.productId,
            _that.title,
            _that.image,
            _that.quantity,
            _that.price,
            _that.selectedSize,
            _that.selectedColor);
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
            String id,
            String productId,
            String title,
            String image,
            int quantity,
            double price,
            String? selectedSize,
            String? selectedColor)
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _OrderItem():
        return $default(
            _that.id,
            _that.productId,
            _that.title,
            _that.image,
            _that.quantity,
            _that.price,
            _that.selectedSize,
            _that.selectedColor);
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
            String id,
            String productId,
            String title,
            String image,
            int quantity,
            double price,
            String? selectedSize,
            String? selectedColor)?
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _OrderItem() when $default != null:
        return $default(
            _that.id,
            _that.productId,
            _that.title,
            _that.image,
            _that.quantity,
            _that.price,
            _that.selectedSize,
            _that.selectedColor);
      case _:
        return null;
    }
  }
}

/// @nodoc
@JsonSerializable()
class _OrderItem implements OrderItem {
  const _OrderItem(
      {required this.id,
      required this.productId,
      required this.title,
      required this.image,
      required this.quantity,
      required this.price,
      this.selectedSize,
      this.selectedColor});
  factory _OrderItem.fromJson(Map<String, dynamic> json) =>
      _$OrderItemFromJson(json);

  @override
  final String id;
  @override
  final String productId;
  @override
  final String title;
  @override
  final String image;
  @override
  final int quantity;
  @override
  final double price;
  @override
  final String? selectedSize;
  @override
  final String? selectedColor;

  /// Create a copy of OrderItem
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$OrderItemCopyWith<_OrderItem> get copyWith =>
      __$OrderItemCopyWithImpl<_OrderItem>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$OrderItemToJson(
      this,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _OrderItem &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.productId, productId) ||
                other.productId == productId) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.image, image) || other.image == image) &&
            (identical(other.quantity, quantity) ||
                other.quantity == quantity) &&
            (identical(other.price, price) || other.price == price) &&
            (identical(other.selectedSize, selectedSize) ||
                other.selectedSize == selectedSize) &&
            (identical(other.selectedColor, selectedColor) ||
                other.selectedColor == selectedColor));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, productId, title, image,
      quantity, price, selectedSize, selectedColor);

  @override
  String toString() {
    return 'OrderItem(id: $id, productId: $productId, title: $title, image: $image, quantity: $quantity, price: $price, selectedSize: $selectedSize, selectedColor: $selectedColor)';
  }
}

/// @nodoc
abstract mixin class _$OrderItemCopyWith<$Res>
    implements $OrderItemCopyWith<$Res> {
  factory _$OrderItemCopyWith(
          _OrderItem value, $Res Function(_OrderItem) _then) =
      __$OrderItemCopyWithImpl;
  @override
  @useResult
  $Res call(
      {String id,
      String productId,
      String title,
      String image,
      int quantity,
      double price,
      String? selectedSize,
      String? selectedColor});
}

/// @nodoc
class __$OrderItemCopyWithImpl<$Res> implements _$OrderItemCopyWith<$Res> {
  __$OrderItemCopyWithImpl(this._self, this._then);

  final _OrderItem _self;
  final $Res Function(_OrderItem) _then;

  /// Create a copy of OrderItem
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? id = null,
    Object? productId = null,
    Object? title = null,
    Object? image = null,
    Object? quantity = null,
    Object? price = null,
    Object? selectedSize = freezed,
    Object? selectedColor = freezed,
  }) {
    return _then(_OrderItem(
      id: null == id
          ? _self.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      productId: null == productId
          ? _self.productId
          : productId // ignore: cast_nullable_to_non_nullable
              as String,
      title: null == title
          ? _self.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      image: null == image
          ? _self.image
          : image // ignore: cast_nullable_to_non_nullable
              as String,
      quantity: null == quantity
          ? _self.quantity
          : quantity // ignore: cast_nullable_to_non_nullable
              as int,
      price: null == price
          ? _self.price
          : price // ignore: cast_nullable_to_non_nullable
              as double,
      selectedSize: freezed == selectedSize
          ? _self.selectedSize
          : selectedSize // ignore: cast_nullable_to_non_nullable
              as String?,
      selectedColor: freezed == selectedColor
          ? _self.selectedColor
          : selectedColor // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
mixin _$Review {
  String get id;
  String get userId;
  String get userName;
  String? get userAvatar;
  double get rating;
  String get comment;
  DateTime get date;
  bool get isVerifiedPurchase;
  int get helpfulCount;

  /// Create a copy of Review
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $ReviewCopyWith<Review> get copyWith =>
      _$ReviewCopyWithImpl<Review>(this as Review, _$identity);

  /// Serializes this Review to a JSON map.
  Map<String, dynamic> toJson();

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is Review &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.userId, userId) || other.userId == userId) &&
            (identical(other.userName, userName) ||
                other.userName == userName) &&
            (identical(other.userAvatar, userAvatar) ||
                other.userAvatar == userAvatar) &&
            (identical(other.rating, rating) || other.rating == rating) &&
            (identical(other.comment, comment) || other.comment == comment) &&
            (identical(other.date, date) || other.date == date) &&
            (identical(other.isVerifiedPurchase, isVerifiedPurchase) ||
                other.isVerifiedPurchase == isVerifiedPurchase) &&
            (identical(other.helpfulCount, helpfulCount) ||
                other.helpfulCount == helpfulCount));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, userId, userName, userAvatar,
      rating, comment, date, isVerifiedPurchase, helpfulCount);

  @override
  String toString() {
    return 'Review(id: $id, userId: $userId, userName: $userName, userAvatar: $userAvatar, rating: $rating, comment: $comment, date: $date, isVerifiedPurchase: $isVerifiedPurchase, helpfulCount: $helpfulCount)';
  }
}

/// @nodoc
abstract mixin class $ReviewCopyWith<$Res> {
  factory $ReviewCopyWith(Review value, $Res Function(Review) _then) =
      _$ReviewCopyWithImpl;
  @useResult
  $Res call(
      {String id,
      String userId,
      String userName,
      String? userAvatar,
      double rating,
      String comment,
      DateTime date,
      bool isVerifiedPurchase,
      int helpfulCount});
}

/// @nodoc
class _$ReviewCopyWithImpl<$Res> implements $ReviewCopyWith<$Res> {
  _$ReviewCopyWithImpl(this._self, this._then);

  final Review _self;
  final $Res Function(Review) _then;

  /// Create a copy of Review
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? userId = null,
    Object? userName = null,
    Object? userAvatar = freezed,
    Object? rating = null,
    Object? comment = null,
    Object? date = null,
    Object? isVerifiedPurchase = null,
    Object? helpfulCount = null,
  }) {
    return _then(_self.copyWith(
      id: null == id
          ? _self.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      userId: null == userId
          ? _self.userId
          : userId // ignore: cast_nullable_to_non_nullable
              as String,
      userName: null == userName
          ? _self.userName
          : userName // ignore: cast_nullable_to_non_nullable
              as String,
      userAvatar: freezed == userAvatar
          ? _self.userAvatar
          : userAvatar // ignore: cast_nullable_to_non_nullable
              as String?,
      rating: null == rating
          ? _self.rating
          : rating // ignore: cast_nullable_to_non_nullable
              as double,
      comment: null == comment
          ? _self.comment
          : comment // ignore: cast_nullable_to_non_nullable
              as String,
      date: null == date
          ? _self.date
          : date // ignore: cast_nullable_to_non_nullable
              as DateTime,
      isVerifiedPurchase: null == isVerifiedPurchase
          ? _self.isVerifiedPurchase
          : isVerifiedPurchase // ignore: cast_nullable_to_non_nullable
              as bool,
      helpfulCount: null == helpfulCount
          ? _self.helpfulCount
          : helpfulCount // ignore: cast_nullable_to_non_nullable
              as int,
    ));
  }
}

/// Adds pattern-matching-related methods to [Review].
extension ReviewPatterns on Review {
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
    TResult Function(_Review value)? $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _Review() when $default != null:
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
    TResult Function(_Review value) $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Review():
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
    TResult? Function(_Review value)? $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Review() when $default != null:
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
            String id,
            String userId,
            String userName,
            String? userAvatar,
            double rating,
            String comment,
            DateTime date,
            bool isVerifiedPurchase,
            int helpfulCount)?
        $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _Review() when $default != null:
        return $default(
            _that.id,
            _that.userId,
            _that.userName,
            _that.userAvatar,
            _that.rating,
            _that.comment,
            _that.date,
            _that.isVerifiedPurchase,
            _that.helpfulCount);
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
            String id,
            String userId,
            String userName,
            String? userAvatar,
            double rating,
            String comment,
            DateTime date,
            bool isVerifiedPurchase,
            int helpfulCount)
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Review():
        return $default(
            _that.id,
            _that.userId,
            _that.userName,
            _that.userAvatar,
            _that.rating,
            _that.comment,
            _that.date,
            _that.isVerifiedPurchase,
            _that.helpfulCount);
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
            String id,
            String userId,
            String userName,
            String? userAvatar,
            double rating,
            String comment,
            DateTime date,
            bool isVerifiedPurchase,
            int helpfulCount)?
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Review() when $default != null:
        return $default(
            _that.id,
            _that.userId,
            _that.userName,
            _that.userAvatar,
            _that.rating,
            _that.comment,
            _that.date,
            _that.isVerifiedPurchase,
            _that.helpfulCount);
      case _:
        return null;
    }
  }
}

/// @nodoc
@JsonSerializable()
class _Review implements Review {
  const _Review(
      {required this.id,
      required this.userId,
      required this.userName,
      this.userAvatar,
      required this.rating,
      required this.comment,
      required this.date,
      this.isVerifiedPurchase = false,
      this.helpfulCount = 0});
  factory _Review.fromJson(Map<String, dynamic> json) => _$ReviewFromJson(json);

  @override
  final String id;
  @override
  final String userId;
  @override
  final String userName;
  @override
  final String? userAvatar;
  @override
  final double rating;
  @override
  final String comment;
  @override
  final DateTime date;
  @override
  @JsonKey()
  final bool isVerifiedPurchase;
  @override
  @JsonKey()
  final int helpfulCount;

  /// Create a copy of Review
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$ReviewCopyWith<_Review> get copyWith =>
      __$ReviewCopyWithImpl<_Review>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$ReviewToJson(
      this,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _Review &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.userId, userId) || other.userId == userId) &&
            (identical(other.userName, userName) ||
                other.userName == userName) &&
            (identical(other.userAvatar, userAvatar) ||
                other.userAvatar == userAvatar) &&
            (identical(other.rating, rating) || other.rating == rating) &&
            (identical(other.comment, comment) || other.comment == comment) &&
            (identical(other.date, date) || other.date == date) &&
            (identical(other.isVerifiedPurchase, isVerifiedPurchase) ||
                other.isVerifiedPurchase == isVerifiedPurchase) &&
            (identical(other.helpfulCount, helpfulCount) ||
                other.helpfulCount == helpfulCount));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, userId, userName, userAvatar,
      rating, comment, date, isVerifiedPurchase, helpfulCount);

  @override
  String toString() {
    return 'Review(id: $id, userId: $userId, userName: $userName, userAvatar: $userAvatar, rating: $rating, comment: $comment, date: $date, isVerifiedPurchase: $isVerifiedPurchase, helpfulCount: $helpfulCount)';
  }
}

/// @nodoc
abstract mixin class _$ReviewCopyWith<$Res> implements $ReviewCopyWith<$Res> {
  factory _$ReviewCopyWith(_Review value, $Res Function(_Review) _then) =
      __$ReviewCopyWithImpl;
  @override
  @useResult
  $Res call(
      {String id,
      String userId,
      String userName,
      String? userAvatar,
      double rating,
      String comment,
      DateTime date,
      bool isVerifiedPurchase,
      int helpfulCount});
}

/// @nodoc
class __$ReviewCopyWithImpl<$Res> implements _$ReviewCopyWith<$Res> {
  __$ReviewCopyWithImpl(this._self, this._then);

  final _Review _self;
  final $Res Function(_Review) _then;

  /// Create a copy of Review
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? id = null,
    Object? userId = null,
    Object? userName = null,
    Object? userAvatar = freezed,
    Object? rating = null,
    Object? comment = null,
    Object? date = null,
    Object? isVerifiedPurchase = null,
    Object? helpfulCount = null,
  }) {
    return _then(_Review(
      id: null == id
          ? _self.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      userId: null == userId
          ? _self.userId
          : userId // ignore: cast_nullable_to_non_nullable
              as String,
      userName: null == userName
          ? _self.userName
          : userName // ignore: cast_nullable_to_non_nullable
              as String,
      userAvatar: freezed == userAvatar
          ? _self.userAvatar
          : userAvatar // ignore: cast_nullable_to_non_nullable
              as String?,
      rating: null == rating
          ? _self.rating
          : rating // ignore: cast_nullable_to_non_nullable
              as double,
      comment: null == comment
          ? _self.comment
          : comment // ignore: cast_nullable_to_non_nullable
              as String,
      date: null == date
          ? _self.date
          : date // ignore: cast_nullable_to_non_nullable
              as DateTime,
      isVerifiedPurchase: null == isVerifiedPurchase
          ? _self.isVerifiedPurchase
          : isVerifiedPurchase // ignore: cast_nullable_to_non_nullable
              as bool,
      helpfulCount: null == helpfulCount
          ? _self.helpfulCount
          : helpfulCount // ignore: cast_nullable_to_non_nullable
              as int,
    ));
  }
}

// dart format on
