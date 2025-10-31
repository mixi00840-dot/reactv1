class SellerApplication {
  final String id;
  final String userId;
  final SellerApplicationStatus status;
  final String businessName;
  final String businessType;
  final String businessDescription;
  final Map<String, dynamic> businessAddress;
  final String phoneNumber;
  final String email;
  final List<DocumentUpload> documents;
  final String? rejectionReason;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? approvedAt;

  SellerApplication({
    required this.id,
    required this.userId,
    required this.status,
    required this.businessName,
    required this.businessType,
    required this.businessDescription,
    required this.businessAddress,
    required this.phoneNumber,
    required this.email,
    required this.documents,
    this.rejectionReason,
    required this.createdAt,
    required this.updatedAt,
    this.approvedAt,
  });

  factory SellerApplication.fromJson(Map<String, dynamic> json) {
    return SellerApplication(
      id: json['_id'] ?? json['id'] ?? '',
      userId: json['userId'] ?? '',
      status: SellerApplicationStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => SellerApplicationStatus.unknown,
      ),
      businessName: json['businessName'] ?? '',
      businessType: json['businessType'] ?? '',
      businessDescription: json['businessDescription'] ?? '',
      businessAddress: Map<String, dynamic>.from(json['businessAddress'] ?? {}),
      phoneNumber: json['phoneNumber'] ?? '',
      email: json['email'] ?? '',
      documents: (json['documents'] as List<dynamic>?)
              ?.map((doc) => DocumentUpload.fromJson(doc))
              .toList() ??
          [],
      rejectionReason: json['rejectionReason'],
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
      approvedAt: json['approvedAt'] != null ? DateTime.parse(json['approvedAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'status': status.name,
      'businessName': businessName,
      'businessType': businessType,
      'businessDescription': businessDescription,
      'businessAddress': businessAddress,
      'phoneNumber': phoneNumber,
      'email': email,
      'documents': documents.map((doc) => doc.toJson()).toList(),
      if (rejectionReason != null) 'rejectionReason': rejectionReason,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      if (approvedAt != null) 'approvedAt': approvedAt!.toIso8601String(),
    };
  }

  bool get isPending => status == SellerApplicationStatus.pending;
  bool get isApproved => status == SellerApplicationStatus.approved;
  bool get isRejected => status == SellerApplicationStatus.rejected;
  bool get canReapply => status == SellerApplicationStatus.rejected;
}

enum SellerApplicationStatus {
  unknown,
  pending,
  approved,
  rejected,
}

class DocumentUpload {
  final String type; // 'id', 'passport', 'businessLicense', 'taxDocument'
  final String fileName;
  final String url;
  final DateTime uploadedAt;
  final bool isVerified;

  DocumentUpload({
    required this.type,
    required this.fileName,
    required this.url,
    required this.uploadedAt,
    this.isVerified = false,
  });

  factory DocumentUpload.fromJson(Map<String, dynamic> json) {
    return DocumentUpload(
      type: json['type'] ?? '',
      fileName: json['fileName'] ?? '',
      url: json['url'] ?? '',
      uploadedAt: DateTime.parse(json['uploadedAt'] ?? DateTime.now().toIso8601String()),
      isVerified: json['isVerified'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'fileName': fileName,
      'url': url,
      'uploadedAt': uploadedAt.toIso8601String(),
      'isVerified': isVerified,
    };
  }
}
