import 'package:dartz/dartz.dart';

import '../../../core/error/failures.dart';
import '../../../core/usecase/usecase.dart';
import '../../entities/post.dart';
import '../../repositories/posts_repository.dart';

/// Get Saved Posts UseCase - Fetches user's saved posts
class GetSavedPosts implements UseCase<List<Post>, PaginationParams> {
  final PostsRepository repository;

  GetSavedPosts(this.repository);

  @override
  Future<Either<Failure, List<Post>>> call(PaginationParams params) async {
    return await repository.getSavedPosts(
      page: params.page,
      limit: params.limit,
    );
  }
}
