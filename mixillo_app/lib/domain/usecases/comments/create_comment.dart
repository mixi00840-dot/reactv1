import 'package:dartz/dartz.dart';
import '../../../core/error/failures.dart';
import '../../../core/usecase/usecase.dart';
import '../../entities/comment.dart';
import '../../repositories/comments_repository.dart';

/// Use case for creating a comment
class CreateComment implements UseCase<Comment, CreateCommentParams> {
  final CommentsRepository repository;

  CreateComment(this.repository);

  @override
  Future<Either<Failure, Comment>> call(CreateCommentParams params) async {
    return await repository.createComment(
      contentId: params.contentId,
      text: params.text,
      parentId: params.parentId,
    );
  }
}

/// Parameters for CreateComment use case
class CreateCommentParams {
  final String contentId;
  final String text;
  final String? parentId;

  CreateCommentParams({
    required this.contentId,
    required this.text,
    this.parentId,
  });
}
