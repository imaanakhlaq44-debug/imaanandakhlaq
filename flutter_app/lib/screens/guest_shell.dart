import 'package:flutter/material.dart';
import '../app_theme.dart';
import '../data/catalog.dart';
import '../data/learning_journey.dart';
import '../domain.dart';
import 'learning_experience.dart';
import 'journey_screen.dart';
import 'journey_home_preview.dart';
import '../l10n/language.dart';
import 'learner_menu.dart';

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
  final _scaffold = GlobalKey<ScaffoldState>();
  late Future<List<Book>> _books = Catalog().books();
  void _select(int tab) => setState(() => _tab = tab);
  @override
  Widget build(BuildContext context) => LanguageScope(child: _build(context));

  Widget _build(BuildContext context) => PopScope(
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
      key: _scaffold,
      drawer: LearnerMenu(
        onSignIn: widget.onSignIn,
        onCreateAccount: widget.onCreateAccount,
        onChooseSection: widget.onChooseSection,
      ),
      appBar: _tab < 2
          ? null
          : AppBar(
              title: Text(
                _tab == 2 ? tr('Learn', 'سیکھیں') : tr('Books', 'کتابیں'),
              ),
            ),
      body: SafeArea(
        child: ConstrainedBody(
          maxWidth: _tab < 2 ? double.infinity : 900,
          child: switch (_tab) {
            0 => LearningDashboard(
              rewardScope: 'guest',
              onMenu: () => _scaffold.currentState?.openDrawer(),
              onMap: () => _select(1),
              books: _books,
              onContinue: () => _select(3),
              onJourney: learningJourneyEnabled
                  ? () => openLearningJourney(context, 'guest')
                  : () => openJourneyHomePreview(context),
              onCourse: (i) =>
                  showCourseDetails(context, i, hadithScope: 'guest'),
            ),
            1 => AdventureMap(
              onCourse: (i) =>
                  showCourseDetails(context, i, hadithScope: 'guest'),
              onBooks: () => _select(3),
              onLearn: () => _select(2),
              scope: 'guest',
            ),
            2 => const CourseLibrary(hadithScope: 'guest'),
            _ => BookLibrary(
              books: _books,
              onChapter: (_, _) => _accountPrompt(),
              onRetry: () => setState(() => _books = Catalog().books()),
            ),
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
              tr('Keep your learning together', 'اپنی پڑھائی ایک جگہ رکھیں'),
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 12),
            Text(
              tr(
                'Sign in to open the story and save your reflection and weekly practice.',
                'کہانی کھولنے اور اپنی سوچ اور ہفتہ وار مشق محفوظ کرنے کے لیے سائن اِن کریں۔',
              ),
            ),
            const SizedBox(height: 22),
            FilledButton(
              onPressed: () {
                Navigator.pop(sheetContext);
                widget.onSignIn();
              },
              child: Text(tr('Sign in', 'سائن اِن')),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(sheetContext);
                widget.onCreateAccount();
              },
              child: Text(tr('Create account', 'اکاؤنٹ بنائیں')),
            ),
          ],
        ),
      ),
    ),
  );
}
