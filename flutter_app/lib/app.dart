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
    title: 'Imaan & Akhlaq',
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
                key: ValueKey(_section),
                repository: widget.repository,
                section: _section!,
                onChooseSection: _chooseSection,
              );
            }
            // A different auth UID creates a new navigation tree; no previous child's
            // screen or cached data survives account switching.
            return AccountNavigator(
              key: ValueKey(snapshot.data),
              uid: snapshot.data!,
              repository: widget.repository,
              section: _section!,
              onChooseSection: _chooseSection,
            );
          },
        );
}

class AccountGate extends StatefulWidget {
  const AccountGate({
    super.key,
    required this.uid,
    required this.repository,
    required this.section,
    required this.onChooseSection,
  });
  final String uid;
  final AppRepository repository;
  final AppSection section;
  final VoidCallback onChooseSection;
  @override
  State<AccountGate> createState() => _AccountGateState();
}

class _AccountGateState extends State<AccountGate> {
  late Stream<Profile?> _profile = widget.repository.profile(widget.uid);
  Profile? _selected;
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
  });
  final String uid;
  final AppRepository repository;
  final AppSection section;
  final VoidCallback onChooseSection;
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
        ),
      ),
    ),
  );
}
