import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive/hive.dart';

import '../../core/network/dio_client.dart';
import '../../core/providers/app_providers.dart';
import '../../data/datasources/posts_local_datasource.dart';
import '../../data/datasources/posts_remote_datasource.dart';
import '../../data/repositories/posts_repository_impl.dart';
import '../../domain/repositories/posts_repository.dart';
import '../../domain/usecases/posts/create_post.dart';
import '../../domain/usecases/posts/get_post_by_id.dart';
import '../../domain/usecases/posts/get_posts.dart';
import '../../domain/usecases/posts/get_saved_posts.dart';
import '../../domain/usecases/posts/get_user_posts.dart';
import '../../domain/usecases/posts/like_post.dart';
import '../../domain/usecases/posts/save_post.dart';

// ==================== DATA SOURCES ====================

/// Remote Data Source Provider
final postsRemoteDataSourceProvider = Provider<PostsRemoteDataSource>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return PostsRemoteDataSourceImpl(dioClient);
});

/// Local Data Source Provider
final postsLocalDataSourceProvider = Provider<PostsLocalDataSource>((ref) {
  final cacheBox = ref.watch(cacheProvider);
  return PostsLocalDataSourceImpl(cacheBox);
});

// ==================== REPOSITORY ====================

/// Posts Repository Provider
final postsRepositoryProvider = Provider<PostsRepository>((ref) {
  final remoteDataSource = ref.watch(postsRemoteDataSourceProvider);
  final localDataSource = ref.watch(postsLocalDataSourceProvider);
  final connectivity = ref.watch(connectivityProvider);
  
  return PostsRepositoryImpl(
    remoteDataSource: remoteDataSource,
    localDataSource: localDataSource,
    connectivity: connectivity,
  );
});

// ==================== USE CASES ====================

/// Get Posts UseCase Provider
final getPostsUseCaseProvider = Provider<GetPosts>((ref) {
  final repository = ref.watch(postsRepositoryProvider);
  return GetPosts(repository);
});

/// Get Post By ID UseCase Provider
final getPostByIdUseCaseProvider = Provider<GetPostById>((ref) {
  final repository = ref.watch(postsRepositoryProvider);
  return GetPostById(repository);
});

/// Get User Posts UseCase Provider
final getUserPostsUseCaseProvider = Provider<GetUserPosts>((ref) {
  final repository = ref.watch(postsRepositoryProvider);
  return GetUserPosts(repository);
});

/// Get Saved Posts UseCase Provider
final getSavedPostsUseCaseProvider = Provider<GetSavedPosts>((ref) {
  final repository = ref.watch(postsRepositoryProvider);
  return GetSavedPosts(repository);
});

/// Like Post UseCase Provider
final likePostUseCaseProvider = Provider<LikePost>((ref) {
  final repository = ref.watch(postsRepositoryProvider);
  return LikePost(repository);
});

/// Unlike Post UseCase Provider
final unlikePostUseCaseProvider = Provider<UnlikePost>((ref) {
  final repository = ref.watch(postsRepositoryProvider);
  return UnlikePost(repository);
});

/// Save Post UseCase Provider
final savePostUseCaseProvider = Provider<SavePost>((ref) {
  final repository = ref.watch(postsRepositoryProvider);
  return SavePost(repository);
});

/// Unsave Post UseCase Provider
final unsavePostUseCaseProvider = Provider<UnsavePost>((ref) {
  final repository = ref.watch(postsRepositoryProvider);
  return UnsavePost(repository);
});

/// Create Post UseCase Provider
final createPostUseCaseProvider = Provider<CreatePost>((ref) {
  final repository = ref.watch(postsRepositoryProvider);
  return CreatePost(repository);
});
