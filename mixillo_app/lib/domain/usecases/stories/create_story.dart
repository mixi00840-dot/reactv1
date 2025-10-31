import 'package:dartz/dartz.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/error/failures.dart';
import '../../../core/usecase/usecase.dart';
import '../../entities/story.dart';
import '../../repositories/stories_repository.dart';

/// Use case for creating a new story
class CreateStory implements UseCase<Story, CreateStoryParams> {
  final StoriesRepository repository;

  CreateStory(this.repository);

  @override
  Future<Either<Failure, Story>> call(CreateStoryParams params) async {
    return await repository.createStory(
      mediaFile: params.mediaFile,
      caption: params.caption,
      backgroundColor: params.backgroundColor,
      duration: params.duration,
    );
  }
}

class CreateStoryParams {
  final XFile mediaFile;
  final String? caption;
  final String? backgroundColor;
  final int? duration;

  const CreateStoryParams({
    required this.mediaFile,
    this.caption,
    this.backgroundColor,
    this.duration,
  });
}
