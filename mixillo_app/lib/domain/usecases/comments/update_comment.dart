import 'package:dartz/dartz.dart';
import '../../../core/error/failures.dart';
import '../../../core/usecase/usecase.dart';
import '../../entities/comment.dart';
import '../../repositories/comments_repository.dart';

/// Use case for updating a comment
class UpdateComment implements UseCase<Comment, UpdateCommentParams> {
  final CommentsRepository repository;

  UpdateComment(this.repository);

  @override
  Future<Either<Failure, Comment>> call(UpdateCommentParams params) async {
    return await repository.updateComment(
      commentId: params.commentId,
      text: params.text,
    );
  }
}

/// Parameters for UpdateComment use case
class UpdateCommentParams {
  final String commentId;
  final String text;

  UpdateCommentParams({
    required this.commentId,
    required this.text,
  });
}
