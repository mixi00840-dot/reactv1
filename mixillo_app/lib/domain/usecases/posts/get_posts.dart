import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';

import '../../../core/error/failures.dart';
import '../../../core/usecase/usecase.dart';
import '../../entities/post.dart';
import '../../repositories/posts_repository.dart';

/// Get Posts UseCase - Fetches feed posts (For You / Following)
/// 
/// Example usage:
/// ```dart
/// final result = await getPostsUseCase(GetPostsParams(
///   page: 1,
///   limit: 20,
///   feedType: PostFeedType.forYou,
/// ));
/// 
/// result.fold(
///   (failure) => print('Error: ${failure.message}'),
///   (posts) => print('Loaded ${posts.length} posts'),
/// );
/// ```
class GetPosts implements UseCase<List<Post>, GetPostsParams> {
  final PostsRepository repository;

  GetPosts(this.repository);

  @override
  Future<Either<Failure, List<Post>>> call(GetPostsParams params) async {
    return await repository.getPosts(
      page: params.page,
      limit: params.limit,
      cursor: params.cursor,
      feedType: params.feedType,
    );
  }
}

class GetPostsParams extends Equatable {
  final int page;
  final int limit;
  final String? cursor;
  final PostFeedType feedType;

  const GetPostsParams({
    required this.page,
    required this.limit,
    this.cursor,
    this.feedType = PostFeedType.forYou,
  });

  @override
  List<Object?> get props => [page, limit, cursor, feedType];
}
