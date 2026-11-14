import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../app_theme.dart';
import '../data/app_repository.dart';
import '../data/registration.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({
    super.key,
    required this.repository,
    required this.onBack,
    required this.onSignIn,
    this.kind = RegistrationKind.individual,
  });
  final AppRepository repository;
  final RegistrationKind kind;
  final VoidCallback onBack, onSignIn;
  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController(),
      _email = TextEditingController(),
      _phone = TextEditingController(),
      _password = TextEditingController(),
      _confirm = TextEditingController(),
      _school = TextEditingController(),
      _location = TextEditingController();
  RegistrationKind get _kind => widget.kind;
  bool _busy = false, _accepted = false;
  String? _error;
  bool? _verified;
  @override
  void dispose() {
    for (final c in [
      _name,
      _email,
      _phone,
      _password,
      _confirm,
      _school,
      _location,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    if (_busy || !_form.currentState!.validate()) {
      return;
    }
    if (!_accepted) {
      setState(
        () => _error = 'Please read and accept the terms and privacy policy.',
      );
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final sent = await widget.repository.register(
        RegistrationRequest(
          name: _name.text,
          email: _email.text,
          phone: _phone.text,
          password: _password.text,
          kind: _kind,
          schoolName: _school.text,
          location: _location.text,
        ),
      );
      if (mounted) {
        setState(() => _verified = sent);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _error = friendlyError(e));
      }
    } finally {
      if (mounted) {
        setState(() => _busy = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) => PopScope(
    canPop: !_busy,
    child: Scaffold(
      appBar: AppBar(
        leading: BackButton(onPressed: _busy ? null : widget.onBack),
        title: Text(
          _kind == RegistrationKind.school
              ? 'School registration'
              : 'Individual registration',
        ),
      ),
      body: SafeArea(
        child: ConstrainedBody(
          maxWidth: 520,
          child: _verified != null
              ? MessageView(
                  title: 'Your account is ready',
                  message: _verified!
                      ? 'We sent a verification link to your email. Check your inbox, then sign in to start your journey.'
                      : 'Your account was created, but the verification email could not be sent. You can sign in with your email and password.',
                  action: FilledButton(
                    onPressed: widget.onSignIn,
                    child: const Text('Go to sign in'),
                  ),
                )
              : Form(
                  key: _form,
                  child: ListView(
                    padding: const EdgeInsets.all(22),
                    children: [
                      Text(
                        _kind == RegistrationKind.school
                            ? 'Register your school'
                            : 'Start your 3-day trial',
                        style: Theme.of(context).textTheme.headlineSmall,
                      ),
                      const SizedBox(height: 10),
                      Text(
                        _kind == RegistrationKind.school
                            ? 'Create your administrator account. Your school manages teacher, family and student records.'
                            : 'Stories, reflection and daily practice at your own pace. ',
                      ),
                      const SizedBox(height: 20),
                      if (_kind == RegistrationKind.school) ...[
                        _field(_school, 'School name', 'signup-school'),
                        const SizedBox(height: 16),
                        _field(
                          _location,
                          'School location (optional)',
                          'signup-location',
                          required: false,
                        ),
                        const SizedBox(height: 16),
                      ],
                      _field(
                        _name,
                        _kind == RegistrationKind.school
                            ? 'Administrator name'
                            : 'Your name',
                        'signup-name',
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        key: const Key('signup-email'),
                        controller: _email,
                        enabled: !_busy,
                        keyboardType: TextInputType.emailAddress,
                        autofillHints: const [AutofillHints.email],
                        autocorrect: false,
                        decoration: const InputDecoration(labelText: 'Email'),
                        validator: (v) =>
                            RegExp(
                              r'^[^\s@]+@[^\s@]+\.[^\s@]+$',
                            ).hasMatch(v?.trim() ?? '')
                            ? null
                            : 'Enter a valid email.',
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        key: const Key('signup-phone'),
                        controller: _phone,
                        enabled: !_busy,
                        keyboardType: TextInputType.phone,
                        decoration: const InputDecoration(
                          labelText: 'Contact number',
                        ),
                        validator: (v) =>
                            RegExp(
                              r'^\+?[\d\s\-()]{7,20}$',
                            ).hasMatch(v?.trim() ?? '')
                            ? null
                            : 'Enter a valid contact number.',
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        key: const Key('signup-password'),
                        controller: _password,
                        enabled: !_busy,
                        obscureText: true,
                        autofillHints: const [AutofillHints.newPassword],
                        decoration: const InputDecoration(
                          labelText: 'Password',
                          helperText: 'At least 8 characters',
                        ),
                        validator: (v) => (v?.length ?? 0) >= 8
                            ? null
                            : 'Use at least 8 characters.',
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        key: const Key('signup-confirm'),
                        controller: _confirm,
                        enabled: !_busy,
                        obscureText: true,
                        decoration: const InputDecoration(
                          labelText: 'Confirm password',
                        ),
                        validator: (v) => v == _password.text
                            ? null
                            : 'Passwords do not match.',
                      ),
                      const SizedBox(height: 18),
                      CheckboxListTile(
                        key: const Key('signup-consent'),
                        contentPadding: EdgeInsets.zero,
                        value: _accepted,
                        onChanged: _busy
                            ? null
                            : (v) => setState(() => _accepted = v ?? false),
                        title: const Text(
                          'I agree to the terms and privacy policy.',
                        ),
                      ),
                      Wrap(
                        spacing: 12,
                        children: [
                          TextButton(
                            onPressed: () => _legal(
                              'Terms of use',
                              'https://www.imaanakhlaq.org/terms',
                            ),
                            child: const Text('Read terms'),
                          ),
                          TextButton(
                            onPressed: () => _legal(
                              'Privacy policy',
                              'https://www.imaanakhlaq.org/privacy',
                            ),
                            child: const Text('Privacy policy'),
                          ),
                        ],
                      ),
                      if (_error != null)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          child: Semantics(
                            liveRegion: true,
                            child: Text(
                              _error!,
                              style: TextStyle(
                                color: Theme.of(context).colorScheme.error,
                              ),
                            ),
                          ),
                        ),
                      const SizedBox(height: 16),
                      FilledButton(
                        key: const Key('signup-submit'),
                        onPressed: _busy ? null : _submit,
                        child: _busy
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : Text(
                                _kind == RegistrationKind.school
                                    ? 'Create school account'
                                    : 'Start 3-day trial',
                              ),
                      ),
                      const SizedBox(height: 12),
                      TextButton(
                        onPressed: _busy ? null : widget.onSignIn,
                        child: const Text('Already have an account? Sign in'),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        _kind == RegistrationKind.school
                            ? 'Teachers and families do not register here. The school provides their TCH- or PAR- account.'
                            : 'Individual accounts are for home learning. Already have a school username? Use Sign in.',
                        style: TextStyle(height: 1.6),
                      ),
                    ],
                  ),
                ),
        ),
      ),
    ),
  );
  Widget _field(
    TextEditingController controller,
    String label,
    String key, {
    bool required = true,
  }) => TextFormField(
    key: Key(key),
    controller: controller,
    enabled: !_busy,
    textCapitalization: TextCapitalization.words,
    decoration: InputDecoration(labelText: label),
    validator: (v) =>
        required && (v?.trim().length ?? 0) < 2 ? 'Enter $label.' : null,
  );
  Future<void> _legal(String title, String url) async {
    try {
      await openLegalPage(url);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not open $title. Please try again.')),
        );
      }
    }
  }
}

Future<void> openLegalPage(String url) async {
  if (!await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication)) {
    throw StateError('Could not open policy page.');
  }
}
