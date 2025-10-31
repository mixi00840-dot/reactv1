import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/app_providers.dart';
import '../../data/datasources/comments_local_datasource.dart';
import '../../data/datasources/comments_remote_datasource.dart';
import '../../data/repositories/comments_repository_impl.dart';
import '../../domain/repositories/comments_repository.dart';
import '../../domain/usecases/comments/create_comment.dart';
import '../../domain/usecases/comments/delete_comment.dart';
import '../../domain/usecases/comments/get_comments.dart';
import '../../domain/usecases/comments/like_comment.dart';
import '../../domain/usecases/comments/report_comment.dart';
import '../../domain/usecases/comments/unlike_comment.dart';
import '../../domain/usecases/comments/update_comment.dart';
import '../state/comments_state.dart';
import '../state/comments_notifier.dart';

// Data sources
final commentsRemoteDataSourceProvider = Provider<CommentsRemoteDataSource>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return CommentsRemoteDataSourceImpl(dioClient);
});

final commentsLocalDataSourceProvider = Provider<CommentsLocalDataSource>((ref) {
  return CommentsLocalDataSourceImpl();
});

// Repository
final commentsRepositoryProvider = Provider<CommentsRepository>((ref) {
  final remoteDataSource = ref.watch(commentsRemoteDataSourceProvider);
  final localDataSource = ref.watch(commentsLocalDataSourceProvider);
  return CommentsRepositoryImpl(
    remoteDataSource: remoteDataSource,
    localDataSource: localDataSource,
    connectivity: Connectivity(),
  );
});

// Use cases
final getCommentsUseCaseProvider = Provider<GetComments>((ref) {
  final repository = ref.watch(commentsRepositoryProvider);
  return GetComments(repository);
});

final createCommentUseCaseProvider = Provider<CreateComment>((ref) {
  final repository = ref.watch(commentsRepositoryProvider);
  return CreateComment(repository);
});

final updateCommentUseCaseProvider = Provider<UpdateComment>((ref) {
  final repository = ref.watch(commentsRepositoryProvider);
  return UpdateComment(repository);
});

final deleteCommentUseCaseProvider = Provider<DeleteComment>((ref) {
  final repository = ref.watch(commentsRepositoryProvider);
  return DeleteComment(repository);
});

final likeCommentUseCaseProvider = Provider<LikeComment>((ref) {
  final repository = ref.watch(commentsRepositoryProvider);
  return LikeComment(repository);
});

final unlikeCommentUseCaseProvider = Provider<UnlikeComment>((ref) {
  final repository = ref.watch(commentsRepositoryProvider);
  return UnlikeComment(repository);
});

final reportCommentUseCaseProvider = Provider<ReportComment>((ref) {
  final repository = ref.watch(commentsRepositoryProvider);
  return ReportComment(repository);
});

// Notifier provider
final commentsNotifierProvider =
    StateNotifierProvider.family<CommentsNotifier, CommentsState, String>(
  (ref, contentId) {
    return CommentsNotifier(
      getCommentsUseCase: ref.watch(getCommentsUseCaseProvider),
      createCommentUseCase: ref.watch(createCommentUseCaseProvider),
      updateCommentUseCase: ref.watch(updateCommentUseCaseProvider),
      deleteCommentUseCase: ref.watch(deleteCommentUseCaseProvider),
      likeCommentUseCase: ref.watch(likeCommentUseCaseProvider),
      unlikeCommentUseCase: ref.watch(unlikeCommentUseCaseProvider),
      reportCommentUseCase: ref.watch(reportCommentUseCaseProvider),
    );
  },
);
