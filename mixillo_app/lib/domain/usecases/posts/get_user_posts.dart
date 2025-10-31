import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';

import '../../../core/error/failures.dart';
import '../../../core/usecase/usecase.dart';
import '../../entities/post.dart';
import '../../repositories/posts_repository.dart';

/// Get User Posts UseCase - Fetches posts for a specific user (for profile)
class GetUserPosts implements UseCase<List<Post>, GetUserPostsParams> {
  final PostsRepository repository;

  GetUserPosts(this.repository);

  @override
  Future<Either<Failure, List<Post>>> call(GetUserPostsParams params) async {
    return await repository.getUserPosts(
      userId: params.userId,
      page: params.page,
      limit: params.limit,
      contentType: params.contentType,
    );
  }
}

class GetUserPostsParams extends Equatable {
  final String userId;
  final int page;
  final int limit;
  final PostContentType? contentType;

  const GetUserPostsParams({
    required this.userId,
    required this.page,
    required this.limit,
    this.contentType,
  });

  @override
  List<Object?> get props => [userId, page, limit, contentType];
}
