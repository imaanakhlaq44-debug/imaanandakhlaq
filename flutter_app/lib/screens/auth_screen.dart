import 'package:flutter/material.dart';
import '../app_theme.dart';
import '../data/app_repository.dart';
import '../domain.dart';
import 'entry_screens.dart' show BrandBackdrop, BrandLogoRing, brandCream;

class AuthScreen extends StatefulWidget {
  const AuthScreen({
    super.key,
    required this.repository,
    this.onBack,
    this.onCreateAccount,
    this.createAccountLabel = 'Create an account',
  });
  final AppRepository repository;
  final VoidCallback? onBack, onCreateAccount;
  final String createAccountLabel;
  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

const _muted = Color(0xFF6B7488);
const _fieldFill = Color(0xFFFBF8F6);
const _fieldLine = Color(0xFFEDE4DE);

class _AuthScreenState extends State<AuthScreen> {
  final _form = GlobalKey<FormState>();
  final _login = TextEditingController(), _password = TextEditingController();
  bool _busy = false, _obscure = true;
  String? _error;
  @override
  void dispose() {
    _login.dispose();
    _password.dispose();
    super.dispose();
  }

  String? _validateLogin(String? input) {
    final value = (input ?? '').trim();
    try {
      loginEmail(value);
      return null;
    } on FormatException catch (e) {
      return e.message;
    }
  }

  Future<void> _submit() async {
    if (_busy || !_form.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await widget.repository.signIn(_login.text, _password.text);
    } catch (e) {
      if (mounted) setState(() => _error = friendlyError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  InputDecoration _field({
    required String label,
    String? hint,
    required IconData icon,
    Widget? suffix,
  }) {
    OutlineInputBorder line(Color c, [double w = 1]) => OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: BorderSide(color: c, width: w),
    );
    return InputDecoration(
      labelText: label,
      hintText: hint,
      errorMaxLines: 3,
      filled: true,
      fillColor: _fieldFill,
      prefixIcon: Icon(icon, color: brandPink.withValues(alpha: .85)),
      suffixIcon: suffix,
      border: line(_fieldLine),
      enabledBorder: line(_fieldLine),
      focusedBorder: line(brandPink, 1.6),
    );
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: brandCream,
    extendBodyBehindAppBar: true,
    appBar: widget.onBack == null
        ? null
        : AppBar(
            backgroundColor: Colors.transparent,
            leading: Padding(
              padding: const EdgeInsets.only(left: 8),
              child: Center(
                child: Material(
                  color: Colors.white,
                  shape: const CircleBorder(),
                  elevation: 1,
                  shadowColor: brandPink.withValues(alpha: .25),
                  child: BackButton(
                    color: brandNavy,
                    onPressed: _busy ? null : widget.onBack,
                  ),
                ),
              ),
            ),
            title: const Text(''),
          ),
    body: BrandBackdrop(
      child: SafeArea(
        child: ConstrainedBody(
          maxWidth: 480,
          child: AutofillGroup(
            child: Form(
              key: _form,
              child: ListView(
                padding: EdgeInsets.fromLTRB(
                  20,
                  widget.onBack == null ? 28 : 56,
                  20,
                  24,
                ),
                children: [
                  const Center(child: BrandLogoRing(size: 104)),
                  const SizedBox(height: 18),
                  const Text(
                    'Welcome back!',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: brandPink,
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      letterSpacing: .4,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Sign in',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontFamily: 'Fredoka',
                      fontVariations: [FontVariation('wght', 600)],
                      color: brandNavy,
                      fontSize: 30,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Your learning, all in one place.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 15, height: 1.4, color: _muted),
                  ),
                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.fromLTRB(16, 20, 16, 18),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: brandPink.withValues(alpha: .12),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: brandNavy.withValues(alpha: .07),
                          blurRadius: 28,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        TextFormField(
                          key: const Key('login'),
                          controller: _login,
                          enabled: !_busy,
                          autofillHints: const [AutofillHints.username],
                          keyboardType: TextInputType.text,
                          textCapitalization: TextCapitalization.none,
                          textInputAction: TextInputAction.next,
                          autocorrect: false,
                          decoration: _field(
                            label: 'Email or school username',
                            hint: 'Email, TCH- or PAR- username',
                            icon: Icons.person_outline_rounded,
                          ),
                          validator: _validateLogin,
                        ),
                        const SizedBox(height: 14),
                        TextFormField(
                          key: const Key('password'),
                          controller: _password,
                          enabled: !_busy,
                          autofillHints: const [AutofillHints.password],
                          obscureText: _obscure,
                          textInputAction: TextInputAction.done,
                          onFieldSubmitted: (_) => _submit(),
                          decoration: _field(
                            label: 'Password',
                            icon: Icons.lock_outline_rounded,
                            suffix: IconButton(
                              onPressed: () =>
                                  setState(() => _obscure = !_obscure),
                              tooltip: _obscure
                                  ? 'Show password'
                                  : 'Hide password',
                              icon: Icon(
                                _obscure
                                    ? Icons.visibility_outlined
                                    : Icons.visibility_off_outlined,
                                color: _muted,
                              ),
                            ),
                          ),
                          validator: (v) => v == null || v.isEmpty
                              ? 'Enter your password.'
                              : null,
                        ),
                        if (_error != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 14),
                            child: Semantics(
                              liveRegion: true,
                              child: Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Theme.of(context)
                                      .colorScheme
                                      .error
                                      .withValues(alpha: .07),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Row(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Icon(
                                      Icons.error_outline_rounded,
                                      size: 20,
                                      color:
                                          Theme.of(context).colorScheme.error,
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        _error!,
                                        style: TextStyle(
                                          color: Theme.of(
                                            context,
                                          ).colorScheme.error,
                                          height: 1.35,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        const SizedBox(height: 20),
                        FilledButton(
                          onPressed: _busy ? null : _submit,
                          style: FilledButton.styleFrom(
                            minimumSize: const Size.fromHeight(54),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                            elevation: 2,
                            shadowColor: brandPink.withValues(alpha: .4),
                          ),
                          child: _busy
                              ? const SizedBox(
                                  width: 22,
                                  height: 22,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Text(
                                  'Continue',
                                  style: TextStyle(fontSize: 17),
                                ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (widget.onCreateAccount != null)
                    TextButton(
                      key: const Key('login-create-account'),
                      onPressed: _busy ? null : widget.onCreateAccount,
                      style: TextButton.styleFrom(
                        foregroundColor: brandPink,
                        textStyle: const TextStyle(
                          fontFamily: 'AppSans',
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      child: Text(widget.createAccountLabel),
                    ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: brandNavy.withValues(alpha: .05),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Row(
                      children: [
                        Icon(
                          Icons.info_outline_rounded,
                          size: 20,
                          color: brandNavy,
                        ),
                        SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'School account? Use your TCH- or PAR- username.',
                            style: TextStyle(
                              height: 1.4,
                              color: brandNavy,
                              fontSize: 13.5,
                            ),
                          ),
                        ),
                      ],
                    ),
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
