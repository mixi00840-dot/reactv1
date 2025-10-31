import 'package:dartz/dartz.dart';
import '../../../core/error/failures.dart';
import '../../../core/usecase/usecase.dart';
import '../../repositories/comments_repository.dart';

/// Use case for unliking a comment
class UnlikeComment implements UseCase<void, UnlikeCommentParams> {
  final CommentsRepository repository;

  UnlikeComment(this.repository);

  @override
  Future<Either<Failure, void>> call(UnlikeCommentParams params) async {
    return await repository.unlikeComment(params.commentId);
  }
}

/// Parameters for UnlikeComment use case
class UnlikeCommentParams {
  final String commentId;

  UnlikeCommentParams({required this.commentId});
}
