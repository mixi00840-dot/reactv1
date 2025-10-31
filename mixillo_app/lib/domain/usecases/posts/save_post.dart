import 'package:dartz/dartz.dart';

import '../../../core/error/failures.dart';
import '../../../core/usecase/usecase.dart';
import '../../repositories/posts_repository.dart';

/// Save Post UseCase - Saves a post to user's saved collection
class SavePost implements UseCase<void, IdParams> {
  final PostsRepository repository;

  SavePost(this.repository);

  @override
  Future<Either<Failure, void>> call(IdParams params) async {
    return await repository.savePost(params.id);
  }
}

/// Unsave Post UseCase - Removes a post from saved collection
class UnsavePost implements UseCase<void, IdParams> {
  final PostsRepository repository;

  UnsavePost(this.repository);

  @override
  Future<Either<Failure, void>> call(IdParams params) async {
    return await repository.unsavePost(params.id);
  }
}
