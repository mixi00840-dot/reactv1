import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';

class AboutPage extends StatefulWidget {
  const AboutPage({super.key});

  @override
  State<AboutPage> createState() => _AboutPageState();
}

class _AboutPageState extends State<AboutPage> {
  String _version = '1.0.0';
  String _buildNumber = '1';

  @override
  void initState() {
    super.initState();
    _loadPackageInfo();
  }

  Future<void> _loadPackageInfo() async {
    try {
      final packageInfo = await PackageInfo.fromPlatform();
      setState(() {
        _version = packageInfo.version;
        _buildNumber = packageInfo.buildNumber;
      });
    } catch (e) {
      // Use default values if package_info_plus fails
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('About'),
      ),
      body: ListView(
        children: [
          const SizedBox(height: 40),

          // App logo and name
          Column(
            children: [
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.blue.shade400, Colors.purple.shade600],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(
                  Icons.videocam,
                  size: 50,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Mixillo',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Version $_version (Build $_buildNumber)',
                style: TextStyle(
                  color: Colors.grey.shade600,
                  fontSize: 14,
                ),
              ),
            ],
          ),

          const SizedBox(height: 40),

          // Description
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Text(
              'Mixillo is a social commerce platform that combines TikTok-style content with integrated e-commerce, live streaming, and digital wallet features.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.grey.shade700,
                height: 1.5,
              ),
            ),
          ),

          const SizedBox(height: 32),

          // Links
          _buildListTile(
            icon: Icons.web,
            title: 'Website',
            subtitle: 'www.mixillo.com',
            onTap: () {
              // Open website
            },
          ),
          _buildListTile(
            icon: Icons.mail,
            title: 'Contact Us',
            subtitle: 'support@mixillo.com',
            onTap: () {
              // Open email
            },
          ),
          _buildListTile(
            icon: Icons.description,
            title: 'Terms of Service',
            onTap: () {
              // Show terms
            },
          ),
          _buildListTile(
            icon: Icons.privacy_tip,
            title: 'Privacy Policy',
            onTap: () {
              // Show privacy policy
            },
          ),
          _buildListTile(
            icon: Icons.gavel,
            title: 'Community Guidelines',
            onTap: () {
              // Show community guidelines
            },
          ),
          _buildListTile(
            icon: Icons.policy,
            title: 'Cookie Policy',
            onTap: () {
              // Show cookie policy
            },
          ),

          const Divider(height: 32),

          // Social media
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              children: [
                const Text(
                  'Follow Us',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _buildSocialButton(
                      icon: Icons.facebook,
                      color: const Color(0xFF1877F2),
                      onTap: () {
                        // Open Facebook
                      },
                    ),
                    const SizedBox(width: 16),
                    _buildSocialButton(
                      icon: Icons.alternate_email,
                      color: const Color(0xFF1DA1F2),
                      onTap: () {
                        // Open Twitter
                      },
                    ),
                    const SizedBox(width: 16),
                    _buildSocialButton(
                      icon: Icons.camera_alt,
                      color: const Color(0xFFE4405F),
                      onTap: () {
                        // Open Instagram
                      },
                    ),
                    const SizedBox(width: 16),
                    _buildSocialButton(
                      icon: Icons.video_library,
                      color: const Color(0xFFFF0000),
                      onTap: () {
                        // Open YouTube
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 32),

          // Credits
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              children: [
                const Text(
                  'Made with ❤️ by the Mixillo Team',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  '© ${DateTime.now().year} Mixillo. All rights reserved.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade600,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 32),

          // Check for updates button
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: OutlinedButton.icon(
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (context) => AlertDialog(
                    title: const Text('Check for Updates'),
                    content: const Text(
                        'You\'re using the latest version of Mixillo!'),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.of(context).pop(),
                        child: const Text('OK'),
                      ),
                    ],
                  ),
                );
              },
              icon: const Icon(Icons.system_update),
              label: const Text('Check for Updates'),
            ),
          ),

          const SizedBox(height: 16),

          // Rate app button
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: ElevatedButton.icon(
              onPressed: () {
                // Open app store rating
              },
              icon: const Icon(Icons.star),
              label: const Text('Rate the App'),
            ),
          ),

          const SizedBox(height: 32),

          // Open source licenses
          ListTile(
            leading: const Icon(Icons.code, color: Colors.blue),
            title: const Text('Open Source Licenses'),
            subtitle: const Text('View third-party licenses'),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () {
              showLicensePage(
                context: context,
                applicationName: 'Mixillo',
                applicationVersion: _version,
                applicationIcon: Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.blue.shade400, Colors.purple.shade600],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.videocam,
                    size: 30,
                    color: Colors.white,
                  ),
                ),
              );
            },
          ),

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildListTile({
    required IconData icon,
    required String title,
    String? subtitle,
    VoidCallback? onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: Colors.blue),
      title: Text(title),
      subtitle: subtitle != null ? Text(subtitle) : null,
      trailing: const Icon(Icons.arrow_forward_ios, size: 16),
      onTap: onTap,
    );
  }

  Widget _buildSocialButton({
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Container(
        width: 50,
        height: 50,
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
        ),
        child: Icon(
          icon,
          color: Colors.white,
        ),
      ),
    );
  }
}
