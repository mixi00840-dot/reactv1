import 'package:dartz/dartz.dart';

import '../../core/error/failures.dart';
import '../entities/comment.dart';

/// Repository interface for comments operations
abstract class CommentsRepository {
  /// Get comments for a specific post
  Future<Either<Failure, List<Comment>>> getComments({
    required String contentId,
    int page = 1,
    int limit = 20,
    String? parentId, // For fetching replies
  });

  /// Get a single comment by ID
  Future<Either<Failure, Comment>> getCommentById(String commentId);

  /// Post a new comment
  Future<Either<Failure, Comment>> createComment({
    required String contentId,
    required String text,
    String? parentId, // For replies
  });

  /// Update a comment
  Future<Either<Failure, Comment>> updateComment({
    required String commentId,
    required String text,
  });

  /// Delete a comment
  Future<Either<Failure, void>> deleteComment(String commentId);

  /// Like a comment
  Future<Either<Failure, void>> likeComment(String commentId);

  /// Unlike a comment
  Future<Either<Failure, void>> unlikeComment(String commentId);

  /// Report a comment
  Future<Either<Failure, void>> reportComment({
    required String commentId,
    required String reason,
    String? details,
  });
}
