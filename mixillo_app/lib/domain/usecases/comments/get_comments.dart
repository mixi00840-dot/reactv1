import 'package:dartz/dartz.dart';
import '../../../core/error/failures.dart';
import '../../../core/usecase/usecase.dart';
import '../../entities/comment.dart';
import '../../repositories/comments_repository.dart';

/// Use case for getting comments
class GetComments implements UseCase<List<Comment>, GetCommentsParams> {
  final CommentsRepository repository;

  GetComments(this.repository);

  @override
  Future<Either<Failure, List<Comment>>> call(GetCommentsParams params) async {
    return await repository.getComments(
      contentId: params.contentId,
      page: params.page,
      limit: params.limit,
    );
  }
}

/// Parameters for GetComments use case
class GetCommentsParams {
  final String contentId;
  final int page;
  final int limit;

  GetCommentsParams({
    required this.contentId,
    required this.page,
    required this.limit,
  });
}
