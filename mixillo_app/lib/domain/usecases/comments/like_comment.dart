import 'package:dartz/dartz.dart';
import '../../../core/error/failures.dart';
import '../../../core/usecase/usecase.dart';
import '../../repositories/comments_repository.dart';

/// Use case for liking a comment
class LikeComment implements UseCase<void, LikeCommentParams> {
  final CommentsRepository repository;

  LikeComment(this.repository);

  @override
  Future<Either<Failure, void>> call(LikeCommentParams params) async {
    return await repository.likeComment(params.commentId);
  }
}

/// Parameters for LikeComment use case
class LikeCommentParams {
  final String commentId;

  LikeCommentParams({required this.commentId});
}
