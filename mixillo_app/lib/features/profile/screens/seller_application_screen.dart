import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../models/seller_application_model.dart';
import '../providers/profile_providers.dart';

class SellerApplicationScreen extends ConsumerStatefulWidget {
  final SellerApplication? application;

  const SellerApplicationScreen({super.key, this.application});

  @override
  ConsumerState<SellerApplicationScreen> createState() => _SellerApplicationScreenState();
}

class _SellerApplicationScreenState extends ConsumerState<SellerApplicationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _businessNameController = TextEditingController();
  final _businessTypeController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _addressController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _zipController = TextEditingController();

  List<File> _uploadedDocuments = [];
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    if (widget.application != null) {
      _populateFormFromApplication();
    }
  }

  void _populateFormFromApplication() {
    final app = widget.application!;
    _businessNameController.text = app.businessName;
    _businessTypeController.text = app.businessType;
    _descriptionController.text = app.businessDescription;
    _phoneController.text = app.phoneNumber;
    _emailController.text = app.email;
    // Populate address fields if needed
  }

  @override
  void dispose() {
    _businessNameController.dispose();
    _businessTypeController.dispose();
    _descriptionController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _zipController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.application != null && !widget.application!.canReapply) {
      return _buildApplicationStatusView();
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Seller Application'),
        centerTitle: true,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _buildHeader(),
            const SizedBox(height: 24),
            _buildBusinessInfoSection(),
            const SizedBox(height: 24),
            _buildContactSection(),
            const SizedBox(height: 24),
            _buildDocumentSection(),
            const SizedBox(height: 32),
            _buildSubmitButton(),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        Icon(
          Icons.store,
          size: 64,
          color: Theme.of(context).primaryColor,
        ),
        const SizedBox(height: 16),
        Text(
          'Become a Seller',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 8),
        Text(
          'Fill out the form below to start selling on Mixillo',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey,
              ),
        ),
      ],
    );
  }

  Widget _buildBusinessInfoSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Business Information',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _businessNameController,
          decoration: const InputDecoration(
            labelText: 'Business Name *',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.business),
          ),
          validator: (value) {
            if (value == null || value.isEmpty) {
              return 'Please enter your business name';
            }
            return null;
          },
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _businessTypeController,
          decoration: const InputDecoration(
            labelText: 'Business Type *',
            hintText: 'e.g., Retail, Wholesale, Service',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.category),
          ),
          validator: (value) {
            if (value == null || value.isEmpty) {
              return 'Please enter your business type';
            }
            return null;
          },
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _descriptionController,
          decoration: const InputDecoration(
            labelText: 'Business Description *',
            hintText: 'Describe what you sell',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.description),
          ),
          maxLines: 3,
          validator: (value) {
            if (value == null || value.isEmpty) {
              return 'Please describe your business';
            }
            return null;
          },
        ),
      ],
    );
  }

  Widget _buildContactSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Contact Information',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _phoneController,
          decoration: const InputDecoration(
            labelText: 'Phone Number *',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.phone),
          ),
          keyboardType: TextInputType.phone,
          validator: (value) {
            if (value == null || value.isEmpty) {
              return 'Please enter your phone number';
            }
            return null;
          },
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _emailController,
          decoration: const InputDecoration(
            labelText: 'Email *',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.email),
          ),
          keyboardType: TextInputType.emailAddress,
          validator: (value) {
            if (value == null || value.isEmpty) {
              return 'Please enter your email';
            }
            if (!value.contains('@')) {
              return 'Please enter a valid email';
            }
            return null;
          },
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _addressController,
          decoration: const InputDecoration(
            labelText: 'Street Address *',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.location_on),
          ),
          validator: (value) {
            if (value == null || value.isEmpty) {
              return 'Please enter your address';
            }
            return null;
          },
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              flex: 2,
              child: TextFormField(
                controller: _cityController,
                decoration: const InputDecoration(
                  labelText: 'City *',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Required';
                  }
                  return null;
                },
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: TextFormField(
                controller: _stateController,
                decoration: const InputDecoration(
                  labelText: 'State *',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Required';
                  }
                  return null;
                },
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: TextFormField(
                controller: _zipController,
                decoration: const InputDecoration(
                  labelText: 'ZIP *',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Required';
                  }
                  return null;
                },
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildDocumentSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Verification Documents',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 8),
        Text(
          'Upload ID/Passport and business documents',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey,
              ),
        ),
        const SizedBox(height: 16),
        if (_uploadedDocuments.isNotEmpty)
          ..._uploadedDocuments.asMap().entries.map((entry) {
            return _buildDocumentCard(entry.key, entry.value);
          }).toList(),
        const SizedBox(height: 16),
        OutlinedButton.icon(
          onPressed: _pickDocument,
          icon: const Icon(Icons.upload_file),
          label: const Text('Upload Document'),
          style: OutlinedButton.styleFrom(
            minimumSize: const Size(double.infinity, 48),
          ),
        ),
        if (_uploadedDocuments.isEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              'At least one document is required',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.red,
                  ),
            ),
          ),
      ],
    );
  }

  Widget _buildDocumentCard(int index, File file) {
    final fileName = file.path.split('/').last;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: const Icon(Icons.insert_drive_file),
        title: Text(fileName),
        subtitle: Text('${(file.lengthSync() / 1024).toStringAsFixed(1)} KB'),
        trailing: IconButton(
          icon: const Icon(Icons.delete, color: Colors.red),
          onPressed: () {
            setState(() {
              _uploadedDocuments.removeAt(index);
            });
          },
        ),
      ),
    );
  }

  Future<void> _pickDocument() async {
    final ImagePicker picker = ImagePicker();
    try {
      final XFile? image = await picker.pickImage(source: ImageSource.gallery);
      if (image != null) {
        setState(() {
          _uploadedDocuments.add(File(image.path));
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error picking document: $e')),
      );
    }
  }

  Widget _buildSubmitButton() {
    return ElevatedButton(
      onPressed: _isSubmitting ? null : _submitApplication,
      style: ElevatedButton.styleFrom(
        minimumSize: const Size(double.infinity, 56),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      child: _isSubmitting
          ? const SizedBox(
              height: 20,
              width: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : const Text(
              'Submit Application',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
    );
  }

  Future<void> _submitApplication() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_uploadedDocuments.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please upload at least one document')),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      await ref.read(sellerApplicationProvider.notifier).submitApplication(
            businessName: _businessNameController.text,
            businessType: _businessTypeController.text,
            businessDescription: _descriptionController.text,
            businessAddress: {
              'street': _addressController.text,
              'city': _cityController.text,
              'state': _stateController.text,
              'zip': _zipController.text,
            },
            phoneNumber: _phoneController.text,
            email: _emailController.text,
            documents: _uploadedDocuments,
          );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Application submitted successfully!')),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  Widget _buildApplicationStatusView() {
    final app = widget.application!;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Seller Application Status'),
        centerTitle: true,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildStatusIcon(app.status),
              const SizedBox(height: 24),
              Text(
                _getStatusTitle(app.status),
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              Text(
                _getStatusMessage(app.status, app.rejectionReason),
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              _buildStatusDetails(app),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusIcon(SellerApplicationStatus status) {
    IconData icon;
    Color color;

    switch (status) {
      case SellerApplicationStatus.pending:
        icon = Icons.pending;
        color = Colors.orange;
        break;
      case SellerApplicationStatus.approved:
        icon = Icons.check_circle;
        color = Colors.green;
        break;
      case SellerApplicationStatus.rejected:
        icon = Icons.cancel;
        color = Colors.red;
        break;
      default:
        icon = Icons.help;
        color = Colors.grey;
    }

    return Icon(icon, size: 80, color: color);
  }

  String _getStatusTitle(SellerApplicationStatus status) {
    switch (status) {
      case SellerApplicationStatus.pending:
        return 'Application Under Review';
      case SellerApplicationStatus.approved:
        return 'Application Approved!';
      case SellerApplicationStatus.rejected:
        return 'Application Rejected';
      default:
        return 'Application Status';
    }
  }

  String _getStatusMessage(SellerApplicationStatus status, String? rejectionReason) {
    switch (status) {
      case SellerApplicationStatus.pending:
        return 'We\'re reviewing your application. This usually takes 2-3 business days.';
      case SellerApplicationStatus.approved:
        return 'Congratulations! You can now start selling on Mixillo.';
      case SellerApplicationStatus.rejected:
        return rejectionReason ?? 'Your application was not approved. Please review and try again.';
      default:
        return 'Unknown status';
    }
  }

  Widget _buildStatusDetails(SellerApplication app) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildDetailRow('Business Name', app.businessName),
            const Divider(),
            _buildDetailRow('Business Type', app.businessType),
            const Divider(),
            _buildDetailRow('Submitted', _formatDate(app.createdAt)),
            if (app.approvedAt != null) ...[
              const Divider(),
              _buildDetailRow('Approved', _formatDate(app.approvedAt!)),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(fontWeight: FontWeight.w500),
          ),
          Text(value),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
