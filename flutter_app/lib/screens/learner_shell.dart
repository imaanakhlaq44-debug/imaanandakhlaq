import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../app_theme.dart';
import '../billing/entitlement.dart';
import '../data/app_repository.dart';
import '../data/catalog.dart';
import '../data/journey_account.dart';
import '../data/learning_journey.dart';
import '../domain.dart';
import 'chapter_screen.dart';
import '../l10n/language.dart';
import '../audio/voice.dart';
import 'learning_experience.dart';
import 'journey_screen.dart';
import 'learner_menu.dart';
import 'welcome_screen.dart' show BrandWordmark;
import 'ui_kit.dart';

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
  final _scaffold = GlobalKey<ScaffoldState>();
  DateTime? _lastBack;
  bool _opening = false;
  late Future<List<Book>> _books = Catalog().books();
  StreamSubscription<bool>? _subscription;
  String? get _hadithScope =>
      widget.learner.role == AccountRole.individual ? widget.learner.uid : null;

  JourneyStore _journeyStore() {
    final repository = widget.repository;
    if (repository is FirebaseRepository &&
        widget.learner.role == AccountRole.student) {
      return FirebaseJourneyStore(repository.db, widget.learner.learnerId);
    }
    return DeviceJourneyStore('learner:${widget.learner.learnerId}');
  }

  @override
  void initState() {
    super.initState();
    // An Individual subscription verified on the server counts everywhere
    // this account signs in, including the website.
    if (_hadithScope != null) {
      _subscription = widget.repository
          .accountSubscription(widget.learner.uid)
          .listen(Entitlement.instance.setAccountActive);
    }
  }

  @override
  void dispose() {
    _subscription?.cancel();
    if (_hadithScope != null) Entitlement.instance.setAccountActive(false);
    super.dispose();
  }

  void _select(int tab) => setState(() => _tab = tab);
  // Only Individual learners get the Urdu/English switch; school learners
  // keep the English layout their teachers see.
  @override
  Widget build(BuildContext context) => _hadithScope == null
      ? _build(context)
      : LanguageScope(child: _build(context));

  Widget _build(BuildContext context) => PopScope(
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
      VoiceGuide.instance.play(VoiceLine.goodbye);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            tr(
              'Press back again to exit',
              'باہر جانے کے لیے دوبارہ واپس دبائیں',
            ),
          ),
          duration: const Duration(seconds: 2),
        ),
      );
    },
    child: Scaffold(
      key: _scaffold,
      drawer: _hadithScope == null
          ? null
          : LearnerMenu(
              learner: widget.learner,
              onProgress: () => _select(4),
              onChooseSection: widget.onChooseSection,
              onSignOut: _signOut,
            ),
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
                  itemBuilder: (_) => [
                    PopupMenuItem(
                      value: 'progress',
                      child: Text(tr('My progress', 'میری پیش رفت')),
                    ),
                    PopupMenuItem(
                      value: 'logout',
                      child: Text(tr('Sign out', 'سائن آؤٹ')),
                    ),
                  ],
                ),
              ],
            ),
      body: SafeArea(
        child: ConstrainedBody(
          maxWidth: _tab < 2 ? double.infinity : 900,
          child: switch (_tab) {
            0 => LearningDashboard(
              rewardScope: _hadithScope,
              onMenu: _hadithScope == null
                  ? null
                  : () => _scaffold.currentState?.openDrawer(),
              onMap: () => _select(1),
              learner: widget.learner,
              books: _books,
              onContinue: _continue,
              onJourney: learningJourneyEnabled
                  ? () => openLearningJourney(
                      context,
                      'learner:${widget.learner.learnerId}',
                      store: _journeyStore(),
                    )
                  : null,
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
  Future<void> _signOut() async {
    try {
      await widget.repository.signOut();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(friendlyError(e))));
      }
    }
  }

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
  Widget _progress() {
    final done = widget.learner.completed.toSet().length;
    final reviewed = widget.learner.approved.toSet().length;
    return ListView(
      padding: const EdgeInsets.only(bottom: 28),
      children: [
        const PageHeader(
          title: 'Your learning journey',
          subtitle: 'Every small step matters.',
          icon: Icons.emoji_events_rounded,
          color: brandOrange,
        ),
        Reveal(
          index: 0,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: SizedBox(
              height:
                  112 *
                  MediaQuery.textScalerOf(context).scale(1).clamp(1.0, 1.6),
              child: StatStrip(
                children: [
                  StatItem(
                    value: done,
                    label: 'Chapters',
                    icon: Icons.menu_book_rounded,
                    color: brandPink,
                    onTap: () {},
                  ),
                  StatItem(
                    value: reviewed,
                    label: 'Reviewed',
                    icon: Icons.verified_rounded,
                    color: successInk,
                    onTap: () {},
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 18),
        Reveal(
          index: 1,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(22),
                gradient: const LinearGradient(
                  colors: [Color(0xFFFFF1DE), Color(0xFFFFE4EE)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                border: Border.all(color: brandOrange.withValues(alpha: .25)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 54,
                    height: 54,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: brandOrange.withValues(alpha: .25),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.auto_awesome_rounded,
                      color: brandOrange,
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          done == 0
                              ? 'Your first chapter awaits'
                              : 'Keep going!',
                          style: displayStyle(
                            18,
                            color: const Color(0xFFB45F0A),
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Your existing profile progress is shown above. '
                          'Newly saved activities appear in the chapter itself.',
                          style: TextStyle(color: brandNavy, height: 1.4),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        if (widget.onChooseSection != null) ...[
          const SizedBox(height: 12),
          Center(
            child: TextButton.icon(
              onPressed: widget.onChooseSection,
              icon: const Icon(Icons.swap_horiz_rounded),
              label: Text(
                tr('Choose Individual or School', 'انفرادی یا اسکول چنیں'),
              ),
            ),
          ),
        ],
      ],
    );
  }
}
