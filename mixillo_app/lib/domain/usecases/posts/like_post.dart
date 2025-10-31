import 'package:dartz/dartz.dart';

import '../../../core/error/failures.dart';
import '../../../core/usecase/usecase.dart';
import '../../repositories/posts_repository.dart';

/// Like Post UseCase - Likes a post
class LikePost implements UseCase<void, IdParams> {
  final PostsRepository repository;

  LikePost(this.repository);

  @override
  Future<Either<Failure, void>> call(IdParams params) async {
    return await repository.likePost(params.id);
  }
}

/// Unlike Post UseCase - Unlikes a post
class UnlikePost implements UseCase<void, IdParams> {
  final PostsRepository repository;

  UnlikePost(this.repository);

  @override
  Future<Either<Failure, void>> call(IdParams params) async {
    return await repository.unlikePost(params.id);
  }
}
