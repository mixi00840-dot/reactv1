import 'package:dartz/dartz.dart';

import '../../../core/error/failures.dart';
import '../../../core/usecase/usecase.dart';
import '../../entities/story.dart';
import '../../repositories/stories_repository.dart';

/// Use case for fetching viewers of a story
class GetStoryViewers implements UseCase<List<StoryViewer>, IdParams> {
  final StoriesRepository repository;

  GetStoryViewers(this.repository);

  @override
  Future<Either<Failure, List<StoryViewer>>> call(IdParams params) async {
    return await repository.getStoryViewers(params.id);
  }
}
