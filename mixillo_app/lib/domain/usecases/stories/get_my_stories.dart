import 'package:dartz/dartz.dart';

import '../../../core/error/failures.dart';
import '../../../core/usecase/usecase.dart';
import '../../entities/story.dart';
import '../../repositories/stories_repository.dart';

/// Use case for fetching current user's stories
class GetMyStories implements UseCase<List<Story>, NoParams> {
  final StoriesRepository repository;

  GetMyStories(this.repository);

  @override
  Future<Either<Failure, List<Story>>> call(NoParams params) async {
    return await repository.getMyStories();
  }
}
