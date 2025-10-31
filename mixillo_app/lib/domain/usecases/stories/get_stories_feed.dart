import 'package:dartz/dartz.dart';

import '../../../core/error/failures.dart';
import '../../../core/usecase/usecase.dart';
import '../../entities/story.dart';
import '../../repositories/stories_repository.dart';

/// Use case for fetching stories feed
/// Returns grouped stories from followed users
class GetStoriesFeed implements UseCase<List<StoryGroup>, NoParams> {
  final StoriesRepository repository;

  GetStoriesFeed(this.repository);

  @override
  Future<Either<Failure, List<StoryGroup>>> call(NoParams params) async {
    return await repository.getStoriesFeed();
  }
}
