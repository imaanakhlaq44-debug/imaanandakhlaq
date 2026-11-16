import 'package:flutter/material.dart';
import '../app_theme.dart';
import '../data/catalog.dart';
import '../domain.dart';
import 'learning_experience.dart';
import 'ui_kit.dart';
import '../l10n/language.dart';
import 'entry_screens.dart' show BrandLogoRing;

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
      appBar: _tab < 2
          ? null
          : AppBar(
              title: Text(switch (_tab) {
                2 => tr('Learn', 'سیکھیں'),
                3 => tr('Books', 'کتابیں'),
                _ => tr('Profile', 'پروفائل'),
              }),
            ),
      body: SafeArea(
        child: ConstrainedBody(
          maxWidth: _tab < 2 ? double.infinity : 900,
          child: switch (_tab) {
            0 => LearningDashboard(
              rewardScope: 'guest',
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
    padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
    children: [
      Reveal(
        index: 0,
        child: Container(
          padding: const EdgeInsets.fromLTRB(20, 22, 20, 22),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(26),
            gradient: const LinearGradient(
              colors: [Color(0xFF2C4A7C), brandNavy],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            boxShadow: [
              BoxShadow(
                color: brandNavy.withValues(alpha: .25),
                blurRadius: 24,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            children: [
              const BrandLogoRing(size: 84),
              const SizedBox(height: 14),
              Text(
                tr('Your learning profile', 'آپ کا تعلیمی پروفائل'),
                textAlign: TextAlign.center,
                style: displayStyle(23, color: Colors.white),
              ),
              const SizedBox(height: 6),
              Text(
                tr(
                  'Sign in to keep your reading and activities together, or '
                      'create an account to start learning.',
                  'سائن اِن کریں تاکہ آپ کی پڑھائی اور سرگرمیاں محفوظ رہیں، '
                      'یا نیا اکاؤنٹ بنا کر سیکھنا شروع کریں۔',
                ),
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: .85),
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 20),
              FilledButton.icon(
                key: const Key('home-sign-in'),
                onPressed: widget.onSignIn,
                style: FilledButton.styleFrom(
                  minimumSize: const Size.fromHeight(52),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                icon: const Icon(Icons.login_rounded),
                label: Text(tr('Sign in', 'سائن اِن')),
              ),
              const SizedBox(height: 10),
              OutlinedButton.icon(
                key: const Key('home-create-account'),
                onPressed: widget.onCreateAccount,
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(52),
                  foregroundColor: Colors.white,
                  side: BorderSide(color: Colors.white.withValues(alpha: .6)),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                icon: const Icon(Icons.person_add_alt_1_rounded),
                label: Text(tr('Create account', 'اکاؤنٹ بنائیں')),
              ),
            ],
          ),
        ),
      ),
      const SizedBox(height: 18),
      Reveal(
        index: 1,
        child: Row(
          children: [
            for (final (icon, color, text) in [
              (
                Icons.bookmark_rounded,
                brandPink,
                tr('Save your\nreading', 'اپنی پڑھائی\nمحفوظ کریں'),
              ),
              (
                Icons.emoji_events_rounded,
                brandOrange,
                tr('Track your\nprogress', 'اپنی ترقی\nدیکھیں'),
              ),
              (
                Icons.family_restroom_rounded,
                successInk,
                tr('Learn with\nfamily', 'گھر والوں کے\nساتھ سیکھیں'),
              ),
            ]) ...[
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    vertical: 14,
                    horizontal: 6,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: color.withValues(alpha: .2)),
                    boxShadow: [
                      BoxShadow(
                        color: color.withValues(alpha: .12),
                        blurRadius: 14,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: .12),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(icon, color: color, size: 21),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        text,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: brandNavy,
                          fontSize: 12.5,
                          fontWeight: FontWeight.w700,
                          height: 1.2,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              if (color != successInk) const SizedBox(width: 10),
            ],
          ],
        ),
      ),
      const SizedBox(height: 18),
      Reveal(
        index: 2,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: brandNavy.withValues(alpha: .05),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              const Icon(Icons.school_rounded, color: brandNavy),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  tr(
                    'School families and teachers can use the PAR- or TCH- '
                        'username provided by their school.',
                    'اسکول کے والدین اور اساتذہ اسکول کی طرف سے دیا گیا '
                        'PAR- یا TCH- یوزرنیم استعمال کریں۔',
                  ),
                  style: const TextStyle(height: 1.45, color: brandNavy),
                ),
              ),
            ],
          ),
        ),
      ),
      if (widget.onChooseSection != null) ...[
        const SizedBox(height: 10),
        TextButton.icon(
          onPressed: widget.onChooseSection,
          icon: const Icon(Icons.swap_horiz_rounded),
          label: Text(
            tr('Choose Individual or School', 'انفرادی یا اسکول چنیں'),
          ),
        ),
      ],
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
