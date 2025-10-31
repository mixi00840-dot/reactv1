import 'package:dartz/dartz.dart';

import '../../../core/error/failures.dart';
import '../../../core/usecase/usecase.dart';
import '../../repositories/stories_repository.dart';

/// Use case for marking a story as viewed
class ViewStory implements UseCase<void, IdParams> {
  final StoriesRepository repository;

  ViewStory(this.repository);

  @override
  Future<Either<Failure, void>> call(IdParams params) async {
    return await repository.viewStory(params.id);
  }
}
