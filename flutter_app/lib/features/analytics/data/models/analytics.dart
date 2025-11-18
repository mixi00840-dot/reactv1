class Analytics {
  final int views;
  final int likes;
  final int comments;
  final int shares;
  final int followers;
  final int following;
  final Map<String, int>? viewsByDate;
  final Map<String, int>? likesByDate;
  final Map<String, int>? commentsByDate;
  final List<Map<String, dynamic>>? topContent;
  final String period;
  final DateTime? startDate;
  final DateTime? endDate;

  Analytics({
    required this.views,
    required this.likes,
    required this.comments,
    required this.shares,
    required this.followers,
    required this.following,
    this.viewsByDate,
    this.likesByDate,
    this.commentsByDate,
    this.topContent,
    this.period = 'last7days',
    this.startDate,
    this.endDate,
  });

  factory Analytics.fromJson(Map<String, dynamic> json) {
    return Analytics(
      views: json['views'] ?? 0,
      likes: json['likes'] ?? 0,
      comments: json['comments'] ?? 0,
      shares: json['shares'] ?? 0,
      followers: json['followers'] ?? 0,
      following: json['following'] ?? 0,
      viewsByDate: json['viewsByDate'] != null
          ? Map<String, int>.from(json['viewsByDate'])
          : null,
      likesByDate: json['likesByDate'] != null
          ? Map<String, int>.from(json['likesByDate'])
          : null,
      commentsByDate: json['commentsByDate'] != null
          ? Map<String, int>.from(json['commentsByDate'])
          : null,
      topContent: json['topContent'] != null
          ? List<Map<String, dynamic>>.from(json['topContent'])
          : null,
      period: json['period'] ?? 'last7days',
      startDate:
          json['startDate'] != null ? DateTime.parse(json['startDate']) : null,
      endDate:
          json['endDate'] != null ? DateTime.parse(json['endDate']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'views': views,
      'likes': likes,
      'comments': comments,
      'shares': shares,
      'followers': followers,
      'following': following,
      if (viewsByDate != null) 'viewsByDate': viewsByDate,
      if (likesByDate != null) 'likesByDate': likesByDate,
      if (commentsByDate != null) 'commentsByDate': commentsByDate,
      if (topContent != null) 'topContent': topContent,
      'period': period,
      if (startDate != null) 'startDate': startDate!.toIso8601String(),
      if (endDate != null) 'endDate': endDate!.toIso8601String(),
    };
  }

  Analytics copyWith({
    int? views,
    int? likes,
    int? comments,
    int? shares,
    int? followers,
    int? following,
    Map<String, int>? viewsByDate,
    Map<String, int>? likesByDate,
    Map<String, int>? commentsByDate,
    List<Map<String, dynamic>>? topContent,
    String? period,
    DateTime? startDate,
    DateTime? endDate,
  }) {
    return Analytics(
      views: views ?? this.views,
      likes: likes ?? this.likes,
      comments: comments ?? this.comments,
      shares: shares ?? this.shares,
      followers: followers ?? this.followers,
      following: following ?? this.following,
      viewsByDate: viewsByDate ?? this.viewsByDate,
      likesByDate: likesByDate ?? this.likesByDate,
      commentsByDate: commentsByDate ?? this.commentsByDate,
      topContent: topContent ?? this.topContent,
      period: period ?? this.period,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
    );
  }
}
