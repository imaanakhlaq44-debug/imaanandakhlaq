import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../app_theme.dart';
import '../domain.dart';
import 'entry_screens.dart' show BrandBackdrop, BrandLogoRing, brandCream;

/// School management stays on the website. Admins get a direct way there.
Uri adminDashboardUrl(AccountRole role) => Uri.parse(
  role == AccountRole.superAdmin
      ? 'https://imaanakhlaq.org/super-admin-dashboard'
      : 'https://imaanakhlaq.org/admin-dashboard',
);

class AdminWebScreen extends StatelessWidget {
  const AdminWebScreen({
    super.key,
    required this.account,
    required this.onSignOut,
    this.onChooseSection,
  });
  final Profile account;
  final VoidCallback onSignOut;
  final VoidCallback? onChooseSection;

  Future<void> _open(BuildContext context) async {
    final ok = await launchUrl(
      adminDashboardUrl(account.role),
      mode: LaunchMode.externalApplication,
    );
    if (!ok && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Could not open the browser. Visit imaanakhlaq.org.'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final superAdmin = account.role == AccountRole.superAdmin;
    return Scaffold(
      backgroundColor: brandCream,
      body: BrandBackdrop(
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Center(child: BrandLogoRing(size: 104)),
                    const SizedBox(height: 18),
                    Text(
                      'Assalamu Alaikum, ${account.name}',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: brandPink,
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      superAdmin
                          ? 'Platform admin workspace'
                          : 'School admin workspace',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: brandNavy,
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 22),
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(
                          color: brandPink.withValues(alpha: .12),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: brandNavy.withValues(alpha: .07),
                            blurRadius: 26,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          for (final line in superAdmin
                              ? const [
                                  'Schools and organisations',
                                  'Platform-wide reports',
                                ]
                              : const [
                                  'Students, classes and bulk import',
                                  'Teacher and family logins',
                                  'Attendance and school settings',
                                ])
                            Padding(
                              padding: const EdgeInsets.only(bottom: 10),
                              child: Row(
                                children: [
                                  const Icon(
                                    Icons.check_circle_rounded,
                                    color: brandOrange,
                                    size: 20,
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Text(
                                      line,
                                      style: const TextStyle(
                                        color: brandNavy,
                                        fontSize: 15,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          const SizedBox(height: 4),
                          const Text(
                            'School management opens in your browser, where '
                            'you have the full dashboard and a larger screen.',
                            style: TextStyle(
                              color: Color(0xFF6B7488),
                              height: 1.4,
                            ),
                          ),
                          const SizedBox(height: 16),
                          FilledButton.icon(
                            key: const Key('open-admin-dashboard'),
                            onPressed: () => _open(context),
                            style: FilledButton.styleFrom(
                              minimumSize: const Size.fromHeight(54),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                            icon: const Icon(Icons.open_in_new_rounded),
                            label: const Text('Open school dashboard'),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    if (onChooseSection != null)
                      TextButton.icon(
                        onPressed: onChooseSection,
                        icon: const Icon(Icons.swap_horiz_rounded),
                        label: const Text('Choose section'),
                      ),
                    TextButton.icon(
                      onPressed: onSignOut,
                      style: TextButton.styleFrom(
                        foregroundColor: const Color(0xFFB4233C),
                      ),
                      icon: const Icon(Icons.logout_rounded),
                      label: const Text('Sign out'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
