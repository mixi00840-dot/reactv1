/// Report Model - Content moderation
/// Matches backend/src/models/Report.js
enum ReportType {
  spam,
  inappropriate,
  harassment,
  copyright,
  violence,
  hateSpeech,
  misinformation,
  scam,
  other;

  static ReportType fromString(String value) {
    return ReportType.values.firstWhere(
      (e) => e.name == value,
      orElse: () => ReportType.other,
    );
  }
}

enum ReportStatus {
  pending,
  reviewing,
  resolved,
  dismissed,
  actionTaken;

  static ReportStatus fromString(String value) {
    return ReportStatus.values.firstWhere(
      (e) => e.name == value,
      orElse: () => ReportStatus.pending,
    );
  }
}

enum ReportTargetType {
  content,
  user,
  comment,
  message,
  liveStream;

  static ReportTargetType fromString(String value) {
    return ReportTargetType.values.firstWhere(
      (e) => e.name == value,
      orElse: () => ReportTargetType.content,
    );
  }
}

class ReportModel {
  final String id;
  final String reporterId;
  final ReportTargetType targetType;
  final String targetId;
  final ReportType type;
  final String description;
  final List<String>? evidence;
  final ReportStatus status;
  final String? reviewedBy;
  final DateTime? reviewedAt;
  final String? resolution;
  final Map<String, dynamic>? metadata;
  final DateTime createdAt;
  final DateTime updatedAt;

  ReportModel({
    required this.id,
    required this.reporterId,
    required this.targetType,
    required this.targetId,
    required this.type,
    required this.description,
    this.evidence,
    this.status = ReportStatus.pending,
    this.reviewedBy,
    this.reviewedAt,
    this.resolution,
    this.metadata,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ReportModel.fromJson(Map<String, dynamic> json) {
    return ReportModel(
      id: json['_id'] ?? json['id'],
      reporterId: json['reporter'] ?? json['reporterId'],
      targetType: ReportTargetType.fromString(json['targetType'] ?? 'content'),
      targetId: json['targetId'],
      type: ReportType.fromString(json['type'] ?? 'other'),
      description: json['description'] ?? '',
      evidence:
          json['evidence'] != null ? List<String>.from(json['evidence']) : null,
      status: ReportStatus.fromString(json['status'] ?? 'pending'),
      reviewedBy: json['reviewedBy'],
      reviewedAt: json['reviewedAt'] != null
          ? DateTime.parse(json['reviewedAt'])
          : null,
      resolution: json['resolution'],
      metadata: json['metadata'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'reporter': reporterId,
      'targetType': targetType.name,
      'targetId': targetId,
      'type': type.name,
      'description': description,
      if (evidence != null) 'evidence': evidence,
      'status': status.name,
      if (reviewedBy != null) 'reviewedBy': reviewedBy,
      if (reviewedAt != null) 'reviewedAt': reviewedAt!.toIso8601String(),
      if (resolution != null) 'resolution': resolution,
      if (metadata != null) 'metadata': metadata,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  bool get isPending => status == ReportStatus.pending;
  bool get isReviewing => status == ReportStatus.reviewing;
  bool get isResolved =>
      status == ReportStatus.resolved ||
      status == ReportStatus.dismissed ||
      status == ReportStatus.actionTaken;

  bool get hasEvidence => evidence != null && evidence!.isNotEmpty;

  String get typeDisplay {
    switch (type) {
      case ReportType.spam:
        return 'Spam';
      case ReportType.inappropriate:
        return 'Inappropriate Content';
      case ReportType.harassment:
        return 'Harassment';
      case ReportType.copyright:
        return 'Copyright Violation';
      case ReportType.violence:
        return 'Violence';
      case ReportType.hateSpeech:
        return 'Hate Speech';
      case ReportType.misinformation:
        return 'Misinformation';
      case ReportType.scam:
        return 'Scam';
      case ReportType.other:
        return 'Other';
    }
  }

  String get statusDisplay {
    switch (status) {
      case ReportStatus.pending:
        return 'Pending Review';
      case ReportStatus.reviewing:
        return 'Under Review';
      case ReportStatus.resolved:
        return 'Resolved';
      case ReportStatus.dismissed:
        return 'Dismissed';
      case ReportStatus.actionTaken:
        return 'Action Taken';
    }
  }
}
