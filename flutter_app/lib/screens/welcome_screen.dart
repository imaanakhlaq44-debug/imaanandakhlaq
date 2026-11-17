import 'package:flutter/material.dart';
import '../app_theme.dart';
import '../data/app_repository.dart';
import '../data/registration.dart';
import '../entry_kind.dart';
import 'guest_shell.dart';
import 'auth_screen.dart';
import 'signup_screen.dart';

class WelcomeFlow extends StatefulWidget {
  const WelcomeFlow({
    super.key,
    required this.repository,
    required this.section,
    required this.onChooseSection,
    this.notice,
  });
  final AppRepository repository;
  final AppSection section;
  final VoidCallback onChooseSection;

  /// Shown on the login page, e.g. after a wrong-section sign-in.
  final String? notice;
  @override
  State<WelcomeFlow> createState() => _WelcomeFlowState();
}

class _WelcomeFlowState extends State<WelcomeFlow> {
  late String _page = widget.section == AppSection.school ||
          widget.notice != null
      ? 'login'
      : 'home';
  void _go(String page) => setState(() => _page = page);
  void _back() {
    if (widget.section == AppSection.school) {
      if (_page == 'signup') {
        _go('login');
      } else {
        widget.onChooseSection();
      }
    } else {
      _go('home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final school = widget.section == AppSection.school;
    final kind = school ? RegistrationKind.school : RegistrationKind.individual;
    final child = switch (_page) {
      'login' => AuthScreen(
        repository: widget.repository,
        onBack: _back,
        onCreateAccount: () => _go('signup'),
        createAccountLabel: school
            ? 'Register your school'
            : 'Create an account',
        showGoogle: !school,
        initialError: widget.notice,
      ),
      'signup' => SignupScreen(
        repository: widget.repository,
        kind: kind,
        onBack: _back,
        onSignIn: () => _go('login'),
      ),
      _ => GuestShell(
        onSignIn: () => _go('login'),
        onCreateAccount: () => _go('signup'),
        onChooseSection: widget.onChooseSection,
      ),
    };
    if (_page == 'home' && !school) return child;
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) {
          _back();
        }
      },
      child: child,
    );
  }
}

class BrandWordmark extends StatelessWidget {
  const BrandWordmark({super.key});
  @override
  Widget build(BuildContext context) => const Text.rich(
    TextSpan(
      children: [
        TextSpan(
          text: 'Imaan',
          style: TextStyle(color: brandPink),
        ),
        TextSpan(
          text: ' & ',
          style: TextStyle(color: brandOrange),
        ),
        TextSpan(
          text: 'Akhlaq',
          style: TextStyle(color: brandNavy),
        ),
      ],
    ),
    style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
    maxLines: 1,
    overflow: TextOverflow.ellipsis,
  );
}
