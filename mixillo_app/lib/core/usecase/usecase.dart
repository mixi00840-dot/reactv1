import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import '../error/failures.dart';

/// Base UseCase class for Clean Architecture
/// 
/// Type: Return type of the use case
/// Params: Parameters required for the use case
abstract class UseCase<Type, Params> {
  Future<Either<Failure, Type>> call(Params params);
}

/// Use when no parameters are needed
class NoParams extends Equatable {
  @override
  List<Object?> get props => [];
}

/// Use for pagination parameters
class PaginationParams extends Equatable {
  final int page;
  final int limit;
  final String? cursor;

  const PaginationParams({
    this.page = 1,
    this.limit = 20,
    this.cursor,
  });

  @override
  List<Object?> get props => [page, limit, cursor];
}

/// Use for ID-based operations
class IdParams extends Equatable {
  final String id;

  const IdParams(this.id);

  @override
  List<Object?> get props => [id];
}
