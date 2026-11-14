import 'package:flutter/material.dart';
import '../app_theme.dart';
import '../data/catalog.dart';
import '../domain.dart';
import 'learning_experience.dart';

class GuestShell extends StatefulWidget {
  const GuestShell({
    super.key,
    required this.onSignIn,
    required this.onCreateAccount,
    this.onChooseSection,
  });
  final VoidCallback onSignIn, onCreateAccount;
  final VoidCallback? onChooseSection;
  @override
  State<GuestShell> createState() => _GuestShellState();
}

class _GuestShellState extends State<GuestShell> {
  int _tab = 0;
  late Future<List<Book>> _books = Catalog().books();
  void _select(int tab) => setState(() => _tab = tab);
  @override
  Widget build(BuildContext context) => PopScope(
    canPop: false,
    onPopInvokedWithResult: (didPop, _) {
      if (!didPop) {
        if (_tab != 0) {
          _select(0);
        } else {
          widget.onChooseSection?.call();
        }
      }
    },
    child: Scaffold(
      appBar: _tab < 2
          ? null
          : AppBar(
              title: Text(switch (_tab) {
                2 => 'Learn',
                3 => 'Books',
                _ => 'Profile',
              }),
            ),
      body: SafeArea(
        child: ConstrainedBody(
          maxWidth: _tab < 2 ? double.infinity : 900,
          child: switch (_tab) {
            0 => LearningDashboard(
              onMap: () => _select(1),
              books: _books,
              onContinue: () => _select(3),
              onCourse: (i) =>
                  showCourseDetails(context, i, hadithScope: 'guest'),
            ),
            1 => AdventureMap(
              onCourse: (i) =>
                  showCourseDetails(context, i, hadithScope: 'guest'),
              onBooks: () => _select(3),
              onLearn: () => _select(2),
            ),
            2 => const CourseLibrary(hadithScope: 'guest'),
            3 => BookLibrary(
              books: _books,
              onChapter: (_, _) => _accountPrompt(),
              onRetry: () => setState(() => _books = Catalog().books()),
            ),
            _ => _profile(),
          },
        ),
      ),
      bottomNavigationBar: LearningNavigation(
        selectedIndex: _tab,
        onSelected: _select,
        guest: true,
      ),
    ),
  );
  Widget _profile() => ListView(
    padding: const EdgeInsets.all(24),
    children: [
      Text(
        'Your learning profile',
        style: Theme.of(context).textTheme.headlineSmall,
      ),
      const SizedBox(height: 12),
      const Text(
        'Sign in to keep your reading and activities together, or create an account to start learning.',
      ),
      const SizedBox(height: 26),
      FilledButton(
        key: const Key('home-sign-in'),
        onPressed: widget.onSignIn,
        child: const Text('Sign in'),
      ),
      const SizedBox(height: 12),
      OutlinedButton(
        key: const Key('home-create-account'),
        onPressed: widget.onCreateAccount,
        child: const Text('Create account'),
      ),
      const SizedBox(height: 16),
      if (widget.onChooseSection != null)
        TextButton(
          onPressed: widget.onChooseSection,
          child: const Text('Choose Individual or School'),
        ),
      const SizedBox(height: 22),
      const Text(
        'School families and teachers can use the PAR- or TCH- username provided by their school.',
        style: TextStyle(height: 1.5),
      ),
    ],
  );
  Future<void> _accountPrompt() => showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    builder: (sheetContext) => SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Keep your learning together',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 12),
            const Text(
              'Sign in to open the story and save your reflection and weekly practice.',
            ),
            const SizedBox(height: 22),
            FilledButton(
              onPressed: () {
                Navigator.pop(sheetContext);
                widget.onSignIn();
              },
              child: const Text('Sign in'),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(sheetContext);
                widget.onCreateAccount();
              },
              child: const Text('Create account'),
            ),
          ],
        ),
      ),
    ),
  );
}
