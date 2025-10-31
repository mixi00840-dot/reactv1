import 'package:dartz/dartz.dart';

import '../../../core/error/failures.dart';
import '../../../core/usecase/usecase.dart';
import '../../entities/story.dart';
import '../../repositories/stories_repository.dart';

/// Use case for fetching all stories from a specific user
class GetUserStories implements UseCase<List<Story>, GetUserStoriesParams> {
  final StoriesRepository repository;

  GetUserStories(this.repository);

  @override
  Future<Either<Failure, List<Story>>> call(GetUserStoriesParams params) async {
    return await repository.getUserStories(params.userId);
  }
}

class GetUserStoriesParams {
  final String userId;

  const GetUserStoriesParams({required this.userId});
}
