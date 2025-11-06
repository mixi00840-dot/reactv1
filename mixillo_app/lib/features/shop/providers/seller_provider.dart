import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'package:dio/dio.dart';
import '../../../core/services/api_service.dart';
import '../models/seller_application_model.dart';

class SellerProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  SellerApplicationModel? _application;
  bool _isLoading = false;
  String? _error;
  bool _isEligible = true;
  String? _eligibilityReason;
  
  SellerApplicationModel? get application => _application;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isEligible => _isEligible;
  String? get eligibilityReason => _eligibilityReason;
  bool get hasApplication => _application != null;
  bool get isApproved => _application?.isApproved ?? false;
  
  /// Check eligibility to apply as seller
  Future<void> checkEligibility() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final response = await _apiService.dio.get('/sellers/check-eligibility');
      
      if (response.data['success'] == true) {
        _isEligible = response.data['data']?['eligible'] ?? true;
        _eligibilityReason = response.data['data']?['reason'];
      } else {
        _isEligible = false;
        _eligibilityReason = response.data['message'] ?? 'Not eligible';
      }
    } catch (e) {
      _error = e.toString();
      _isEligible = false;
      print('Error checking eligibility: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  /// Load current user's application
  Future<void> loadApplication() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final response = await _apiService.dio.get('/sellers/application');
      
      if (response.data['success'] == true) {
        final appData = response.data['data']?['application'] ?? response.data['application'];
        if (appData != null) {
          _application = SellerApplicationModel.fromJson({
            'id': appData['id'] ?? '',
            ...appData,
          });
        }
      }
    } catch (e) {
      _error = e.toString();
      print('Error loading application: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  /// Submit seller application
  Future<bool> submitApplication({
    required String documentType,
    required String documentNumber,
    required List<File> documentImages,
    String? businessName,
    String businessType = 'individual',
    String? businessDescription,
    double? expectedMonthlyRevenue,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final formData = FormData.fromMap({
        'documentType': documentType,
        'documentNumber': documentNumber,
        if (businessName != null) 'businessName': businessName,
        'businessType': businessType,
        if (businessDescription != null) 'businessDescription': businessDescription,
        if (expectedMonthlyRevenue != null) 'expectedMonthlyRevenue': expectedMonthlyRevenue.toString(),
      });
      
      // Add document images
      for (var i = 0; i < documentImages.length; i++) {
        formData.files.add(
          MapEntry(
            'documents',
            await MultipartFile.fromFile(
              documentImages[i].path,
              filename: 'document_$i.jpg',
            ),
          ),
        );
      }
      
      final response = await _apiService.dio.post(
        '/sellers/apply',
        data: formData,
      );
      
      if (response.data['success'] == true) {
        final appData = response.data['data']?['application'] ?? response.data['application'];
        _application = SellerApplicationModel.fromJson({
          'id': appData['id'] ?? '',
          ...appData,
        });
        _error = null;
        notifyListeners();
        return true;
      }
      
      throw Exception(response.data['message'] ?? 'Failed to submit application');
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      print('Error submitting application: $e');
      return false;
    }
  }
  
  /// Withdraw application (only if pending)
  Future<bool> withdrawApplication() async {
    if (_application == null || !_application!.canWithdraw) {
      return false;
    }
    
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final response = await _apiService.dio.delete('/sellers/application');
      
      if (response.data['success'] == true) {
        _application = null;
        _error = null;
        notifyListeners();
        return true;
      }
      
      throw Exception(response.data['message'] ?? 'Failed to withdraw application');
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      print('Error withdrawing application: $e');
      return false;
    }
  }
  
  /// Initialize - check eligibility and load application
  Future<void> initialize() async {
    await Future.wait([
      checkEligibility(),
      loadApplication(),
    ]);
  }
}

