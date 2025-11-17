/// CustomerService Model - Support tickets
/// Matches backend/src/models/CustomerService.js
enum TicketStatus {
  open,
  inProgress,
  waitingForCustomer,
  resolved,
  closed;

  static TicketStatus fromString(String value) {
    return TicketStatus.values.firstWhere(
      (e) => e.name == value,
      orElse: () => TicketStatus.open,
    );
  }
}

enum TicketPriority {
  low,
  medium,
  high,
  urgent;

  static TicketPriority fromString(String value) {
    return TicketPriority.values.firstWhere(
      (e) => e.name == value,
      orElse: () => TicketPriority.medium,
    );
  }
}

enum TicketCategory {
  technical,
  billing,
  account,
  content,
  payment,
  shipping,
  general;

  static TicketCategory fromString(String value) {
    return TicketCategory.values.firstWhere(
      (e) => e.name == value,
      orElse: () => TicketCategory.general,
    );
  }
}

class TicketMessage {
  final String senderId;
  final String senderName;
  final bool isAgent;
  final String message;
  final List<String>? attachments;
  final DateTime timestamp;

  TicketMessage({
    required this.senderId,
    required this.senderName,
    required this.isAgent,
    required this.message,
    this.attachments,
    required this.timestamp,
  });

  factory TicketMessage.fromJson(Map<String, dynamic> json) {
    return TicketMessage(
      senderId: json['senderId'],
      senderName: json['senderName'],
      isAgent: json['isAgent'] ?? false,
      message: json['message'],
      attachments: json['attachments'] != null
          ? List<String>.from(json['attachments'])
          : null,
      timestamp: DateTime.parse(json['timestamp']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'senderId': senderId,
      'senderName': senderName,
      'isAgent': isAgent,
      'message': message,
      if (attachments != null) 'attachments': attachments,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}

class CustomerServiceModel {
  final String id;
  final String userId;
  final String ticketNumber;
  final TicketCategory category;
  final TicketPriority priority;
  final TicketStatus status;
  final String subject;
  final String description;
  final List<TicketMessage> messages;
  final String? assignedTo;
  final List<String>? attachments;
  final DateTime? resolvedAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  CustomerServiceModel({
    required this.id,
    required this.userId,
    required this.ticketNumber,
    required this.category,
    this.priority = TicketPriority.medium,
    this.status = TicketStatus.open,
    required this.subject,
    required this.description,
    this.messages = const [],
    this.assignedTo,
    this.attachments,
    this.resolvedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory CustomerServiceModel.fromJson(Map<String, dynamic> json) {
    return CustomerServiceModel(
      id: json['_id'] ?? json['id'],
      userId: json['user'] ?? json['userId'],
      ticketNumber: json['ticketNumber'],
      category: TicketCategory.fromString(json['category'] ?? 'general'),
      priority: TicketPriority.fromString(json['priority'] ?? 'medium'),
      status: TicketStatus.fromString(json['status'] ?? 'open'),
      subject: json['subject'],
      description: json['description'],
      messages: json['messages'] != null
          ? (json['messages'] as List)
              .map((e) => TicketMessage.fromJson(e))
              .toList()
          : [],
      assignedTo: json['assignedTo'],
      attachments: json['attachments'] != null
          ? List<String>.from(json['attachments'])
          : null,
      resolvedAt: json['resolvedAt'] != null
          ? DateTime.parse(json['resolvedAt'])
          : null,
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'user': userId,
      'ticketNumber': ticketNumber,
      'category': category.name,
      'priority': priority.name,
      'status': status.name,
      'subject': subject,
      'description': description,
      'messages': messages.map((e) => e.toJson()).toList(),
      if (assignedTo != null) 'assignedTo': assignedTo,
      if (attachments != null) 'attachments': attachments,
      if (resolvedAt != null) 'resolvedAt': resolvedAt!.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  bool get isOpen =>
      status == TicketStatus.open ||
      status == TicketStatus.inProgress ||
      status == TicketStatus.waitingForCustomer;
  bool get isClosed =>
      status == TicketStatus.closed || status == TicketStatus.resolved;
  bool get hasMessages => messages.isNotEmpty;
  bool get isAssigned => assignedTo != null;

  String get statusDisplay {
    switch (status) {
      case TicketStatus.open:
        return 'Open';
      case TicketStatus.inProgress:
        return 'In Progress';
      case TicketStatus.waitingForCustomer:
        return 'Waiting for Customer';
      case TicketStatus.resolved:
        return 'Resolved';
      case TicketStatus.closed:
        return 'Closed';
    }
  }

  String get priorityDisplay {
    switch (priority) {
      case TicketPriority.low:
        return 'Low';
      case TicketPriority.medium:
        return 'Medium';
      case TicketPriority.high:
        return 'High';
      case TicketPriority.urgent:
        return 'Urgent';
    }
  }

  String get categoryDisplay {
    switch (category) {
      case TicketCategory.technical:
        return 'Technical';
      case TicketCategory.billing:
        return 'Billing';
      case TicketCategory.account:
        return 'Account';
      case TicketCategory.content:
        return 'Content';
      case TicketCategory.payment:
        return 'Payment';
      case TicketCategory.shipping:
        return 'Shipping';
      case TicketCategory.general:
        return 'General';
    }
  }
}
