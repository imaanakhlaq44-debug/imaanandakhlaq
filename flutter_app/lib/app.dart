import 'package:flutter/material.dart';
import 'app_theme.dart';
import 'data/app_repository.dart';
import 'domain.dart';
import 'screens/welcome_screen.dart';
import 'screens/entry_screens.dart';
import 'entry_kind.dart';
import 'screens/family_screen.dart';
import 'screens/learner_shell.dart';
import 'screens/teacher_shell.dart';
import 'screens/admin_web_screen.dart';
import 'screens/admin_dashboard.dart';

class ImaanApp extends StatelessWidget {
  const ImaanApp({super.key, required this.repository});
  final AppRepository repository;
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Imaan Akhlaq Learning Hub',
    debugShowCheckedModeBanner: false,
    theme: appTheme(),
    home: LaunchGate(child: SessionGate(repository: repository)),
  );
}

class SessionGate extends StatefulWidget {
  const SessionGate({super.key, required this.repository});
  final AppRepository repository;
  @override
  State<SessionGate> createState() => _SessionGateState();
}

class _SessionGateState extends State<SessionGate> {
  AppSection? _section;
  void _chooseSection() => setState(() {
    _section = null;
    _notice = null;
    _auth = widget.repository.authChanges();
  });
  late Stream<String?> _auth = widget.repository.authChanges();
  @override
  Widget build(BuildContext context) => _section == null
      ? SectionChoice(onChoose: (section) => setState(() => _section = section))
      : StreamBuilder<String?>(
          stream: _auth,
          builder: (context, snapshot) {
            if (snapshot.hasError) {
              return Scaffold(
                body: MessageView(
                  title: 'Connection interrupted',
                  message: friendlyError(snapshot.error!),
                  action: FilledButton(
                    onPressed: () =>
                        setState(() => _auth = widget.repository.authChanges()),
                    child: const Text('Try again'),
                  ),
                ),
              );
            }
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Scaffold(
                body: Center(child: CircularProgressIndicator()),
              );
            }
            if (snapshot.data == null) {
              return WelcomeFlow(
                key: ValueKey((_section, _notice)),
                repository: widget.repository,
                section: _section!,
                onChooseSection: _chooseSection,
                notice: _notice,
              );
            }
            // A successful sign-in retires the last wrong-section notice.
            if (!_leavingWrongSection) _notice = null;
            // A different auth UID creates a new navigation tree; no previous child's
            // screen or cached data survives account switching.
            return AccountNavigator(
              key: ValueKey(snapshot.data),
              uid: snapshot.data!,
              repository: widget.repository,
              section: _section!,
              onChooseSection: _chooseSection,
              onWrongSection: _wrongSection,
            );
          },
        );

  String? _notice;
  bool _leavingWrongSection = false;
  Future<void> _wrongSection(String message) async {
    _notice = message;
    _leavingWrongSection = true;
    try {
      await widget.repository.signOut();
    } catch (_) {
    } finally {
      _leavingWrongSection = false;
    }
  }
}

class AccountGate extends StatefulWidget {
  const AccountGate({
    super.key,
    required this.uid,
    required this.repository,
    required this.section,
    required this.onChooseSection,
    this.onWrongSection,
  });
  final String uid;
  final AppRepository repository;
  final AppSection section;
  final VoidCallback onChooseSection;

  /// Called when this account belongs to the other section.
  final ValueChanged<String>? onWrongSection;
  @override
  State<AccountGate> createState() => _AccountGateState();
}

/// Why [role] may not use [section], or null when it may. Individual
/// accounts live only in Individual; school accounts only in School.
/// Platform admins and unknown profiles are handled elsewhere.
String? wrongSectionMessage(AccountRole role, AppSection section) {
  if (role == AccountRole.unknown || role == AccountRole.superAdmin) {
    return null;
  }
  final individual = role == AccountRole.individual;
  if (section == AppSection.individual && !individual) {
    return 'This is a school account. Go back and choose School to sign in.';
  }
  if (section == AppSection.school && individual) {
    return 'No school account matches these details. Check your school '
        'username and password.';
  }
  return null;
}

class _AccountGateState extends State<AccountGate> {
  late Stream<Profile?> _profile = widget.repository.profile(widget.uid);
  Profile? _selected;
  bool _leaving = false;
  @override
  Widget build(BuildContext context) => StreamBuilder<Profile?>(
    stream: _profile,
    builder: (context, snapshot) {
      if (snapshot.hasError) {
        return Scaffold(
          body: MessageView(
            title: 'Could not load your profile',
            message: friendlyError(snapshot.error!),
            action: Wrap(
              spacing: 12,
              children: [
                FilledButton(
                  onPressed: () => setState(
                    () => _profile = widget.repository.profile(widget.uid),
                  ),
                  child: const Text('Retry'),
                ),
                TextButton(
                  onPressed: () => _logout(context),
                  child: const Text('Sign out'),
                ),
              ],
            ),
          ),
        );
      }
      if (snapshot.connectionState == ConnectionState.waiting) {
        return const Scaffold(body: Center(child: CircularProgressIndicator()));
      }
      final account = snapshot.data;
      final wrong = account == null
          ? null
          : wrongSectionMessage(account.role, widget.section);
      if (wrong != null) {
        // Each section only opens its own accounts: sign out and say why.
        if (!_leaving) {
          _leaving = true;
          WidgetsBinding.instance.addPostFrameCallback((_) {
            widget.onWrongSection?.call(wrong);
          });
        }
        return const Scaffold(body: Center(child: CircularProgressIndicator()));
      }
      if (account == null || account.role == AccountRole.unknown) {
        return Scaffold(
          body: MessageView(
            title: 'Account needs attention',
            message:
                'Your profile is missing or is not supported. Please contact your school.',
            action: TextButton(
              onPressed: () => _logout(context),
              child: const Text('Sign out'),
            ),
          ),
        );
      }
      if (account.isLearner) {
        return LearnerShell(
          repository: widget.repository,
          account: account,
          learner: account,
          onChooseSection: widget.onChooseSection,
        );
      }
      if (account.role == AccountRole.family) {
        // Keep the ownership stream alive even after selection. Removal/relinking
        // immediately takes a family out of the child's workspace.
        return FamilyScreen(
          repository: widget.repository,
          account: account,
          onChooseSection: widget.onChooseSection,
          selectedUid: _selected?.uid,
          onSelect: (p) => setState(() => _selected = p),
          learnerBuilder: (child) => LearnerShell(
            key: ValueKey(child.uid),
            repository: widget.repository,
            account: account,
            learner: child,
            onChooseSection: widget.onChooseSection,
            onSwitchChild: () => setState(() => _selected = null),
          ),
        );
      }
      if (account.role == AccountRole.teacher) {
        return TeacherShell(
          repository: widget.repository,
          account: account,
          onChooseSection: widget.onChooseSection,
        );
      }
      if (account.role == AccountRole.schoolAdmin) {
        return AdminDashboard(
          repository: widget.repository,
          account: account,
          onChooseSection: widget.onChooseSection,
          onSignOut: () => _logout(context),
        );
      }
      // Platform (super) admins manage schools on the website.
      return AdminWebScreen(
        account: account,
        onChooseSection: widget.onChooseSection,
        onSignOut: () => _logout(context),
      );
    },
  );
  Future<void> _logout(BuildContext context) async {
    try {
      await widget.repository.signOut();
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(friendlyError(e))));
      }
    }
  }
}

class AccountNavigator extends StatefulWidget {
  const AccountNavigator({
    super.key,
    required this.uid,
    required this.repository,
    required this.section,
    required this.onChooseSection,
    this.onWrongSection,
  });
  final String uid;
  final AppRepository repository;
  final AppSection section;
  final VoidCallback onChooseSection;
  final ValueChanged<String>? onWrongSection;
  @override
  State<AccountNavigator> createState() => _AccountNavigatorState();
}

class _AccountNavigatorState extends State<AccountNavigator> {
  final _navigator = GlobalKey<NavigatorState>();
  @override
  Widget build(BuildContext context) => NavigatorPopHandler<Object?>(
    onPopWithResult: (_) => _navigator.currentState!.maybePop(),
    child: Navigator(
      key: _navigator,
      onGenerateRoute: (_) => MaterialPageRoute<void>(
        builder: (_) => AccountGate(
          uid: widget.uid,
          repository: widget.repository,
          section: widget.section,
          onChooseSection: widget.onChooseSection,
          onWrongSection: widget.onWrongSection,
        ),
      ),
    ),
  );
}
