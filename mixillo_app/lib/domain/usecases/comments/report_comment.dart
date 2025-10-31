import 'package:dartz/dartz.dart';
import '../../../core/error/failures.dart';
import '../../../core/usecase/usecase.dart';
import '../../repositories/comments_repository.dart';

/// Use case for reporting a comment
class ReportComment implements UseCase<void, ReportCommentParams> {
  final CommentsRepository repository;

  ReportComment(this.repository);

  @override
  Future<Either<Failure, void>> call(ReportCommentParams params) async {
    return await repository.reportComment(
      commentId: params.commentId,
      reason: params.reason,
    );
  }
}

/// Parameters for ReportComment use case
class ReportCommentParams {
  final String commentId;
  final String reason;

  ReportCommentParams({
    required this.commentId,
    required this.reason,
  });
}
