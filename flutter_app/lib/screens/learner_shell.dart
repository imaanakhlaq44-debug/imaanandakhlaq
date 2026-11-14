import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../app_theme.dart';
import '../data/app_repository.dart';
import '../data/catalog.dart';
import '../domain.dart';
import 'chapter_screen.dart';
import 'learning_experience.dart';
import 'welcome_screen.dart' show BrandWordmark;

class LearnerShell extends StatefulWidget {
  const LearnerShell({
    super.key,
    required this.repository,
    required this.account,
    required this.learner,
    this.onSwitchChild,
    this.onChooseSection,
  });
  final AppRepository repository;
  final Profile account, learner;
  final VoidCallback? onSwitchChild, onChooseSection;
  @override
  State<LearnerShell> createState() => _LearnerShellState();
}

class _LearnerShellState extends State<LearnerShell> {
  int _tab = 0;
  DateTime? _lastBack;
  bool _opening = false;
  late Future<List<Book>> _books = Catalog().books();
  String? get _hadithScope =>
      widget.learner.role == AccountRole.individual ? widget.learner.uid : null;
  void _select(int tab) => setState(() => _tab = tab);
  @override
  Widget build(BuildContext context) => PopScope(
    canPop: false,
    onPopInvokedWithResult: (didPop, _) {
      if (didPop) {
        return;
      }
      if (_tab != 0) {
        _select(0);
        return;
      }
      if (widget.onSwitchChild != null) {
        widget.onSwitchChild!();
        return;
      }
      final now = DateTime.now();
      if (_lastBack != null &&
          now.difference(_lastBack!) < const Duration(seconds: 2)) {
        SystemNavigator.pop();
        return;
      }
      _lastBack = now;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Press back again to exit'),
          duration: Duration(seconds: 2),
        ),
      );
    },
    child: Scaffold(
      appBar: _tab < 2
          ? null
          : AppBar(
              backgroundColor: Colors.white,
              title: const BrandWordmark(),
              actions: [
                if (widget.onSwitchChild != null)
                  IconButton(
                    onPressed: widget.onSwitchChild,
                    tooltip: 'Switch child',
                    icon: const Icon(Icons.switch_account_outlined),
                  ),
                PopupMenuButton<String>(
                  tooltip: 'Your account',
                  icon: CircleAvatar(
                    radius: 17,
                    backgroundColor: const Color(0xFFFCE2EE),
                    child: Text(
                      widget.learner.name.isEmpty
                          ? '?'
                          : widget.learner.name.characters.first,
                      style: const TextStyle(
                        color: brandPink,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  onSelected: (action) async {
                    if (action == 'progress') {
                      _select(4);
                      return;
                    }
                    try {
                      await widget.repository.signOut();
                    } catch (e) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(friendlyError(e))),
                        );
                      }
                    }
                  },
                  itemBuilder: (_) => const [
                    PopupMenuItem(
                      value: 'progress',
                      child: Text('My progress'),
                    ),
                    PopupMenuItem(value: 'logout', child: Text('Sign out')),
                  ],
                ),
              ],
            ),
      body: SafeArea(
        child: ConstrainedBody(
          maxWidth: _tab < 2 ? double.infinity : 900,
          child: switch (_tab) {
            0 => LearningDashboard(
              onMap: () => _select(1),
              learner: widget.learner,
              books: _books,
              onContinue: _continue,
              onCourse: (i) =>
                  showCourseDetails(context, i, hadithScope: _hadithScope),
            ),
            1 => AdventureMap(
              onCourse: (i) =>
                  showCourseDetails(context, i, hadithScope: _hadithScope),
              onBooks: () => _select(3),
              onLearn: () => _select(2),
            ),
            2 => CourseLibrary(hadithScope: _hadithScope),
            3 => BookLibrary(
              books: _books,
              onChapter: _openChapter,
              onRetry: () => setState(() => _books = Catalog().books()),
            ),
            _ => _progress(),
          },
        ),
      ),
      bottomNavigationBar: LearningNavigation(
        selectedIndex: _tab,
        onSelected: _select,
      ),
    ),
  );
  Future<void> _continue() async {
    if (_opening) {
      return;
    }
    _opening = true;
    try {
      final books = await _books;
      if (!mounted) {
        return;
      }
      final completed = widget.learner.completed.toSet();
      for (final book in books) {
        for (final chapter in book.chapters) {
          if (!completed.contains(chapter.id)) {
            _openChapter(book, chapter);
            return;
          }
        }
      }
      _select(3);
    } catch (_) {
      if (mounted) {
        _select(3);
      }
    } finally {
      _opening = false;
    }
  }

  void _openChapter(Book book, Chapter chapter) => Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => ChapterScreen(
        repository: widget.repository,
        account: widget.account,
        learner: widget.learner,
        book: book,
        chapter: chapter,
      ),
    ),
  );
  Widget _progress() => ListView(
    padding: const EdgeInsets.all(24),
    children: [
      Text(
        'Your learning journey',
        style: Theme.of(context).textTheme.headlineSmall,
      ),
      const SizedBox(height: 12),
      const Text(
        'Your existing profile progress is shown below. Newly saved activities appear in the chapter itself.',
      ),
      const SizedBox(height: 24),
      Card(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(
                Icons.auto_awesome_outlined,
                color: brandPink,
                size: 36,
              ),
              const SizedBox(height: 18),
              Text(
                '${widget.learner.completed.toSet().length}',
                style: Theme.of(context).textTheme.headlineLarge,
              ),
              const Text('Chapters recorded in your profile'),
              const SizedBox(height: 18),
              Text(
                '${widget.learner.approved.toSet().length} marked reviewed',
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ],
          ),
        ),
      ),
      const SizedBox(height: 20),
      if (widget.onChooseSection != null)
        TextButton(
          onPressed: widget.onChooseSection,
          child: const Text('Choose Individual or School'),
        ),
      const Text(
        'Keep exploring, practising and asking questions. Every small step matters.',
      ),
    ],
  );
}
