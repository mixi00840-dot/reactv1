import 'package:flutter/material.dart';

class SellerApplicationModel {
  final String id;
  final String userId;
  final String documentType; // 'passport', 'national_id', 'driving_license'
  final String documentNumber;
  final List<DocumentImage> documentImages;
  final String? businessName;
  final String businessType; // 'individual', 'company', 'partnership'
  final String? businessDescription;
  final double expectedMonthlyRevenue;
  final String status; // 'pending', 'approved', 'rejected', 'withdrawn'
  final DateTime submittedAt;
  final DateTime? reviewedAt;
  final String? reviewNotes;
  final String? reviewedBy;
  final DateTime createdAt;
  final DateTime updatedAt;

  SellerApplicationModel({
    required this.id,
    required this.userId,
    required this.documentType,
    required this.documentNumber,
    required this.documentImages,
    this.businessName,
    required this.businessType,
    this.businessDescription,
    this.expectedMonthlyRevenue = 0.0,
    required this.status,
    required this.submittedAt,
    this.reviewedAt,
    this.reviewNotes,
    this.reviewedBy,
    required this.createdAt,
    required this.updatedAt,
  });

  factory SellerApplicationModel.fromJson(Map<String, dynamic> json) {
    return SellerApplicationModel(
      id: json['id'] ?? json['_id'] ?? '',
      userId: json['userId'] ?? json['user_id'] ?? '',
      documentType: json['documentType'] ?? json['document_type'] ?? 'national_id',
      documentNumber: json['documentNumber'] ?? json['document_number'] ?? '',
      documentImages: (json['documentImages'] ?? json['document_images'] ?? [])
          .map((img) => DocumentImage.fromJson(img))
          .toList(),
      businessName: json['businessName'] ?? json['business_name'],
      businessType: json['businessType'] ?? json['business_type'] ?? 'individual',
      businessDescription: json['businessDescription'] ?? json['business_description'],
      expectedMonthlyRevenue: (json['expectedMonthlyRevenue'] ?? json['expected_monthly_revenue'] ?? 0).toDouble(),
      status: json['status'] ?? 'pending',
      submittedAt: json['submittedAt'] != null
          ? DateTime.parse(json['submittedAt'].toString())
          : json['submitted_at'] != null
              ? DateTime.parse(json['submitted_at'].toString())
              : DateTime.now(),
      reviewedAt: json['reviewedAt'] != null
          ? DateTime.parse(json['reviewedAt'].toString())
          : json['reviewed_at'] != null
              ? DateTime.parse(json['reviewed_at'].toString())
              : null,
      reviewNotes: json['reviewNotes'] ?? json['review_notes'],
      reviewedBy: json['reviewedBy'] ?? json['reviewed_by'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : json['created_at'] != null
              ? DateTime.parse(json['created_at'].toString())
              : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'].toString())
          : json['updated_at'] != null
              ? DateTime.parse(json['updated_at'].toString())
              : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'documentType': documentType,
      'documentNumber': documentNumber,
      'documentImages': documentImages.map((img) => img.toJson()).toList(),
      'businessName': businessName,
      'businessType': businessType,
      'businessDescription': businessDescription,
      'expectedMonthlyRevenue': expectedMonthlyRevenue,
      'status': status,
      'submittedAt': submittedAt.toIso8601String(),
      'reviewedAt': reviewedAt?.toIso8601String(),
      'reviewNotes': reviewNotes,
      'reviewedBy': reviewedBy,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  bool get isPending => status == 'pending';
  bool get isApproved => status == 'approved';
  bool get isRejected => status == 'rejected';
  bool get canWithdraw => isPending;

  Color get statusColor {
    switch (status) {
      case 'approved':
        return Colors.green;
      case 'rejected':
        return Colors.red;
      case 'withdrawn':
        return Colors.grey;
      default:
        return Colors.orange;
    }
  }
}

class DocumentImage {
  final String url;
  final DateTime uploadedAt;

  DocumentImage({
    required this.url,
    required this.uploadedAt,
  });

  factory DocumentImage.fromJson(Map<String, dynamic> json) {
    return DocumentImage(
      url: json['url'] ?? '',
      uploadedAt: json['uploadedAt'] != null
          ? DateTime.parse(json['uploadedAt'].toString())
          : json['uploaded_at'] != null
              ? DateTime.parse(json['uploaded_at'].toString())
              : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'url': url,
      'uploadedAt': uploadedAt.toIso8601String(),
    };
  }
}

