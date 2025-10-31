import 'package:dartz/dartz.dart';

import '../../../core/error/failures.dart';
import '../../../core/usecase/usecase.dart';
import '../../entities/story.dart';
import '../../repositories/stories_repository.dart';

/// Use case for fetching a specific story by ID
class GetStoryById implements UseCase<Story, IdParams> {
  final StoriesRepository repository;

  GetStoryById(this.repository);

  @override
  Future<Either<Failure, Story>> call(IdParams params) async {
    return await repository.getStoryById(params.id);
  }
}
