#!/usr/bin/env python3
import re

# Fix api_service.dart - remove first getUserProfile
with open('lib/core/services/api_service.dart', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the first getUserProfile method (lines ~349-363)
pattern = r'''  /// Get user profile
  Future<Map<String, dynamic>> getUserProfile\(String userId\) async \{
    try \{
      final response = await _dio\.get\('/users/\$userId'\);

      if \(response\.data\['success'\] == true\) \{
        return response\.data\['data'\];
      \}

      throw Exception\(response\.data\['message'\] \?\? 'Failed to load profile'\);
    \} on DioException catch \(e\) \{
      throw Exception\(_handleDioError\(e\)\);
    \}
  \}

'''

content = re.sub(pattern, '', content, count=1)

with open('lib/core/services/api_service.dart', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed api_service.dart - removed duplicate getUserProfile")
