import 'package:dartz/dartz.dart';

import '../../../core/error/failures.dart';
import '../../../core/usecase/usecase.dart';
import '../../repositories/stories_repository.dart';

/// Use case for deleting a story
class DeleteStory implements UseCase<void, IdParams> {
  final StoriesRepository repository;

  DeleteStory(this.repository);

  @override
  Future<Either<Failure, void>> call(IdParams params) async {
    return await repository.deleteStory(params.id);
  }
}
