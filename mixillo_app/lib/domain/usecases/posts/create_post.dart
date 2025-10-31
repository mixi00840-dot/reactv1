import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';

import '../../../core/error/failures.dart';
import '../../../core/usecase/usecase.dart';
import '../../entities/post.dart';
import '../../repositories/posts_repository.dart';

/// Create Post UseCase - Uploads a new post
class CreatePost implements UseCase<Post, CreatePostParams> {
  final PostsRepository repository;

  CreatePost(this.repository);

  @override
  Future<Either<Failure, Post>> call(CreatePostParams params) async {
    return await repository.createPost(
      mediaFiles: params.mediaFiles,
      caption: params.caption,
      hashtags: params.hashtags,
      location: params.location,
      soundId: params.soundId,
      productTags: params.productTags,
    );
  }
}

class CreatePostParams extends Equatable {
  final List<String> mediaFiles;
  final String caption;
  final List<String>? hashtags;
  final String? location;
  final String? soundId;
  final List<ProductTag>? productTags;

  const CreatePostParams({
    required this.mediaFiles,
    required this.caption,
    this.hashtags,
    this.location,
    this.soundId,
    this.productTags,
  });

  @override
  List<Object?> get props => [
        mediaFiles,
        caption,
        hashtags,
        location,
        soundId,
        productTags,
      ];
}
