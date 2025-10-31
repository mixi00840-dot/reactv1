import 'package:dartz/dartz.dart';
import '../../../core/error/failures.dart';
import '../../../core/usecase/usecase.dart';
import '../../repositories/comments_repository.dart';

/// Use case for deleting a comment
class DeleteComment implements UseCase<void, DeleteCommentParams> {
  final CommentsRepository repository;

  DeleteComment(this.repository);

  @override
  Future<Either<Failure, void>> call(DeleteCommentParams params) async {
    return await repository.deleteComment(params.commentId);
  }
}

/// Parameters for DeleteComment use case
class DeleteCommentParams {
  final String commentId;

  DeleteCommentParams({required this.commentId});
}
