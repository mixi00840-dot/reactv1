import 'package:dartz/dartz.dart';

import '../../../core/error/failures.dart';
import '../../../core/usecase/usecase.dart';
import '../../entities/post.dart';
import '../../repositories/posts_repository.dart';

/// Get Post By ID UseCase - Fetches a single post by its ID
class GetPostById implements UseCase<Post, IdParams> {
  final PostsRepository repository;

  GetPostById(this.repository);

  @override
  Future<Either<Failure, Post>> call(IdParams params) async {
    return await repository.getPostById(params.id);
  }
}
