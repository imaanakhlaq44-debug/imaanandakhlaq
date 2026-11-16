import '../../billing/lock_badge.dart';
import '../../billing/paywall.dart';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../app_theme.dart';
import '../../screens/ui_kit.dart';
import 'quran_data.dart';
import 'quran_lesson.dart';
import 'quran_progress.dart';

/// Course accent (courseAccents[0] in learning_experience.dart).
const quranAccent = brandPink;
const _tint = Color(0xFFFCE8F0);
const _pendingInk = Color(0xFF8A5A00);
const _pendingFill = Color(0xFFFFF4DC);

/// Holds the course data and the learner's device progress for every
/// screen of the course, so they all stay in step after a save.
class QuranController extends ChangeNotifier {
  QuranController({
    required this.store,
    DateTime Function()? clock,
    Random? random,
    this.loader = QuranCourseData.load,
  }) : clock = clock ?? DateTime.now,
       random = random ?? Random();
  final QuranProgressStore store;
  final DateTime Function() clock;
  final Random random;
  final Future<QuranCourseData> Function() loader;

  QuranCourseData? data;
  QuranProgress progress = const QuranProgress();
  String? error;
  bool saving = false;

  RevisionEngine get engine => RevisionEngine(data!.revision.intervalsDays);
  DateTime now() => clock();

  Future<void> load() async {
    error = null;
    data = null;
    notifyListeners();
    try {
      final d = await loader();
      progress = await store.load();
      data = d;
    } catch (_) {
      error =
          'We could not load the Qur’an Companion and your saved progress. Please try again.';
    }
    notifyListeners();
  }

  /// Saves first, then shows the change. Returns false if saving failed.
  Future<bool> update(QuranProgress next) async {
    if (saving) return false;
    saving = true;
    notifyListeners();
    try {
      await store.save(next);
      progress = next;
      return true;
    } catch (_) {
      return false;
    } finally {
      saving = false;
      notifyListeners();
    }
  }

  Future<bool> updatePassage(String id, PassageProgress p) =>
      update(progress.withPassage(id, p));

  /// Child-facing status in the source's words (§4.3, §13).
  String status(String id) {
    final p = progress.of(id);
    final names = data!.revision.mastery;
    final now = this.now();
    if (p.mastery == null) {
      return p.started
          ? 'Started • step ${p.step + 1} of 6'
          : 'Ready to practise';
    }
    final base = names[p.mastery!.index];
    if (p.approvedAt != null) return '$base • Checked by an adult';
    if (!progress.paused && p.isDue(now)) return '$base • Review today';
    return base;
  }
}

/// My Qur'an Companion home: one helpful next step, the two paths, the
/// 30 Juz browser, the Revision Garden and the parent/teacher review.
class QuranCompanionScreen extends StatefulWidget {
  const QuranCompanionScreen({
    super.key,
    required this.scope,
    this.store,
    this.clock,
    this.random,
  });
  final String scope;
  final QuranProgressStore? store;
  final DateTime Function()? clock;
  final Random? random;
  @override
  State<QuranCompanionScreen> createState() => _QuranCompanionScreenState();
}

class _QuranCompanionScreenState extends State<QuranCompanionScreen> {
  late final QuranController _c = QuranController(
    store: widget.store ?? DeviceQuranProgressStore.forLearner(widget.scope),
    clock: widget.clock,
    random: widget.random,
  )..load();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    key: const Key('quran-course'),
    appBar: AppBar(title: const Text('My Qur’an Companion')),
    body: SafeArea(
      child: ListenableBuilder(
        listenable: _c,
        builder: (context, _) => ConstrainedBody(
          maxWidth: 640,
          child: _c.error != null
              ? MessageView(
                  title: 'Let’s try again',
                  message: _c.error!,
                  action: FilledButton(
                    onPressed: _c.load,
                    child: const Text('Retry'),
                  ),
                )
              : _c.data == null
              ? const Center(child: CircularProgressIndicator())
              : _Home(c: _c, guest: widget.scope == 'guest'),
        ),
      ),
    ),
  );
}

Future<void> _push(BuildContext context, Widget screen) =>
    Navigator.of(context).push<void>(MaterialPageRoute(builder: (_) => screen));

Future<void> openPassage(BuildContext context, QuranController c, String id) =>
    _push(
      context,
      PaidGate(
        free: id == c.data!.roadPassages.first.id,
        child: QuranPassageScreen(c: c, passageId: id),
      ),
    );

class _Home extends StatelessWidget {
  const _Home({required this.c, required this.guest});
  final QuranController c;
  final bool guest;

  @override
  Widget build(BuildContext context) {
    final d = c.data!;
    final p = c.progress;
    final now = c.now();
    final due = p.due(now);
    final road = d.roadPassages;
    final practising = p.passages.values.where((x) => x.mastery != null).length;
    final masnunDone = d.masnun
        .where(
          (m) =>
              (p.of(m.passageId).mastery?.index ?? -1) >=
              Mastery.independent.index,
        )
        .length;
    final roadDone = road
        .where(
          (x) => (p.of(x.id).mastery?.index ?? -1) >= Mastery.independent.index,
        )
        .length;
    final experience = d.experiences
        .where((e) => e.id == p.experience)
        .firstOrNull;
    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 12, 18, 28),
      children: [
        Reveal(
          index: 0,
          child: Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: brandNavy,
              borderRadius: BorderRadius.circular(24),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'HIFZ & RECITATION',
                  style: TextStyle(
                    color: Color(0xFFFFD6E7),
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Listen, learn\nand remember',
                  style: displayStyle(28, color: Colors.white, height: 1.1),
                ),
                const SizedBox(height: 14),
                Text(
                  practising == 0
                      ? 'Begin with one short passage today.'
                      : '$practising practised • ${due.length} to review today',
                  key: const Key('quran-summary'),
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 14),
        Reveal(
          index: 1,
          child: _NextStep(c: c, due: due),
        ),
        const SizedBox(height: 14),
        Reveal(
          index: 2,
          child: experience == null
              ? _Placement(c: c)
              : _Card(
                  key: const Key('quran-experience'),
                  icon: Icons.tune_rounded,
                  title: experience.name,
                  body: experience.pacing,
                  trailing: TextButton(
                    onPressed: () => _choosePlacement(context, c),
                    child: const Text('Change'),
                  ),
                ),
        ),
        const SectionTitle('Choose a path'),
        Reveal(
          index: 3,
          child: _PathCard(
            key: const Key('quran-path-hifz'),
            icon: Icons.route_rounded,
            title: 'Hifz & Recitation Skills',
            body:
                'My Learning Road: start with Al-Fātiḥah and short Juz 30 surahs.',
            progress: '$roadDone of ${road.length} recited on my own',
            value: roadDone / road.length,
            onTap: () => _push(context, QuranRoadScreen(c: c)),
          ),
        ),
        const SizedBox(height: 12),
        Reveal(
          index: 4,
          child: _PathCard(
            key: const Key('quran-path-masnun'),
            icon: Icons.nights_stay_outlined,
            title: 'Masnūn Recitations',
            body:
                'Passages with a cited Sunnah context, such as before sleep or in ṣalāh.',
            progress: '$masnunDone of ${d.masnun.length} recited on my own',
            value: masnunDone / d.masnun.length,
            onTap: () => _push(context, QuranMasnunScreen(c: c)),
          ),
        ),
        const SizedBox(height: 12),
        Reveal(
          index: 5,
          child: _Card(
            key: const Key('quran-open-juz'),
            icon: Icons.menu_book_outlined,
            title: 'Qur’an by Juz',
            body:
                'Browse all 30 Juz in Qur’anic order, with each Juz’s selected passages.',
            onTap: () => _push(context, QuranJuzListScreen(c: c)),
          ),
        ),
        const SizedBox(height: 12),
        Reveal(
          index: 6,
          child: _Card(
            key: const Key('quran-open-garden'),
            icon: Icons.local_florist_outlined,
            title: 'Revision Garden',
            body: p.paused
                ? 'Reviews are paused by a parent or teacher.'
                : due.isEmpty
                ? 'Nothing to review right now.'
                : '${due.length} ${due.length == 1 ? 'passage' : 'passages'} ready to review.',
            onTap: () => _push(context, QuranRevisionScreen(c: c)),
          ),
        ),
        const SizedBox(height: 12),
        Reveal(
          index: 7,
          child: _Card(
            key: const Key('quran-open-adult'),
            icon: Icons.verified_user_outlined,
            title: 'For parents & teachers',
            body: 'Listen, approve or reassign, and pause the review plan.',
            onTap: () => openAdultArea(context, c),
          ),
        ),
        const SizedBox(height: 18),
        PendingPanel(
          title: 'Arabic text and recitation audio pending review',
          body:
              'This version teaches the plan, references and practice steps. ${d.editorialNote} Recite with a parent or teacher from a printed muṣḥaf until verified text and licensed audio are added.',
        ),
        const SizedBox(height: 14),
        Text(
          guest
              ? 'Trying as a guest. Progress is saved on this device.'
              : 'Progress is saved on this device for this learner. No points and no rankings.',
          style: const TextStyle(fontSize: 12, color: mutedInk, height: 1.5),
        ),
        const SizedBox(height: 6),
        Text(
          'Source: ${d.source} (${d.sourceVersion}). ${d.reviewStatus}',
          style: const TextStyle(fontSize: 12, color: mutedInk, height: 1.5),
        ),
      ],
    );
  }
}

class _NextStep extends StatelessWidget {
  const _NextStep({required this.c, required this.due});
  final QuranController c;
  final List<String> due;
  @override
  Widget build(BuildContext context) {
    final d = c.data!;
    final p = c.progress;
    final String title, body, button;
    final VoidCallback onTap;
    final resume = d.roadPassages
        .followedBy(d.passages.values)
        .where((x) => p.of(x.id).started && p.of(x.id).mastery == null)
        .firstOrNull;
    final fresh = d.roadPassages.where((x) => !p.of(x.id).started).firstOrNull;
    if (due.isNotEmpty) {
      title = 'Today’s review';
      body =
          '${d.passage(due.first).displayTitle} is ready to recite from memory.';
      button = 'Start review';
      onTap = () => _push(context, QuranRevisionScreen(c: c));
    } else if (resume != null) {
      title = 'Resume';
      body = '${resume.displayTitle} • step ${p.of(resume.id).step + 1} of 6';
      button = 'Continue';
      onTap = () => openPassage(context, c, resume.id);
    } else if (fresh != null) {
      title = 'New lesson';
      body = '${fresh.displayTitle} • ${fresh.range.label}';
      button = 'Begin';
      onTap = () => openPassage(context, c, fresh.id);
    } else {
      title = 'Well done';
      body = 'Every passage on your road is started. Keep reviewing gently.';
      button = 'Open Revision Garden';
      onTap = () => _push(context, QuranRevisionScreen(c: c));
    }
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'ONE HELPFUL NEXT STEP',
            style: TextStyle(
              color: quranAccent,
              fontSize: 12,
              fontWeight: FontWeight.w800,
              letterSpacing: .8,
            ),
          ),
          const SizedBox(height: 6),
          Text(title, style: displayStyle(22)),
          const SizedBox(height: 4),
          Text(body, style: const TextStyle(color: mutedInk, height: 1.4)),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              key: const Key('quran-next-step'),
              onPressed: onTap,
              child: Text(button),
            ),
          ),
        ],
      ),
    );
  }
}

Future<void> _choosePlacement(BuildContext context, QuranController c) =>
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (context) => SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
          child: _Placement(c: c, onDone: () => Navigator.pop(context)),
        ),
      ),
    );

/// Placement by proficiency (source §1.3): three experiences, no labels
/// that would make an older beginner feel childish.
class _Placement extends StatelessWidget {
  const _Placement({required this.c, this.onDone});
  final QuranController c;
  final VoidCallback? onDone;
  @override
  Widget build(BuildContext context) {
    final d = c.data!;
    return Container(
      key: const Key('quran-placement'),
      padding: const EdgeInsets.all(18),
      decoration: cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('How would you like to start?', style: displayStyle(20)),
          const SizedBox(height: 6),
          Text(
            d.proficiencyNote,
            style: const TextStyle(color: mutedInk, height: 1.4, fontSize: 13),
          ),
          const SizedBox(height: 12),
          for (final e in d.experiences) ...[
            Pressable(
              child: Material(
                color: c.progress.experience == e.id
                    ? _tint
                    : const Color(0xFFF7F8FB),
                borderRadius: BorderRadius.circular(16),
                child: InkWell(
                  key: Key('quran-experience-${e.id}'),
                  borderRadius: BorderRadius.circular(16),
                  onTap: () async {
                    if (await c.update(c.progress.copyWith(experience: e.id))) {
                      onDone?.call();
                    }
                  },
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          e.name,
                          style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            color: ink,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${e.users} • ${e.pacing}',
                          style: const TextStyle(color: mutedInk, height: 1.35),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
          ],
        ],
      ),
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({
    super.key,
    required this.icon,
    required this.title,
    required this.body,
    this.onTap,
    this.trailing,
  });
  final IconData icon;
  final String title, body;
  final VoidCallback? onTap;
  final Widget? trailing;
  @override
  Widget build(BuildContext context) => Pressable(
    child: Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        boxShadow: cardDecoration().boxShadow,
      ),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                _IconBadge(icon),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: displayStyle(18)),
                      const SizedBox(height: 2),
                      Text(
                        body,
                        style: const TextStyle(color: mutedInk, height: 1.35),
                      ),
                    ],
                  ),
                ),
                trailing ??
                    (onTap == null
                        ? const SizedBox.shrink()
                        : const Icon(Icons.chevron_right, color: quranAccent)),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}

class _IconBadge extends StatelessWidget {
  const _IconBadge(this.icon);
  final IconData icon;
  @override
  Widget build(BuildContext context) => Container(
    width: 44,
    height: 44,
    decoration: BoxDecoration(
      color: _tint,
      borderRadius: BorderRadius.circular(14),
    ),
    child: Icon(icon, color: quranAccent),
  );
}

class _PathCard extends StatelessWidget {
  const _PathCard({
    super.key,
    required this.icon,
    required this.title,
    required this.body,
    required this.progress,
    required this.value,
    required this.onTap,
  });
  final IconData icon;
  final String title, body, progress;
  final double value;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Column(
    children: [
      _Card(icon: icon, title: title, body: body, onTap: onTap),
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            LinearProgressIndicator(
              value: value,
              minHeight: 5,
              borderRadius: BorderRadius.circular(8),
              color: quranAccent,
              backgroundColor: const Color(0xFFE5E9F0),
            ),
            const SizedBox(height: 4),
            Text(
              progress,
              style: const TextStyle(fontSize: 12, color: mutedInk),
            ),
          ],
        ),
      ),
    ],
  );
}

/// "Pending review" state for anything the source does not provide.
class PendingPanel extends StatelessWidget {
  const PendingPanel({super.key, required this.title, required this.body});
  final String title, body;
  @override
  Widget build(BuildContext context) => Semantics(
    container: true,
    child: Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _pendingFill,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFF1DDAE)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.hourglass_top_rounded, color: _pendingInk),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: _pendingInk,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  body,
                  style: const TextStyle(
                    color: Color(0xFF5E4A1E),
                    height: 1.45,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

/// M / H / C catalogue label chips.
class LabelChips extends StatelessWidget {
  const LabelChips({super.key, required this.c, required this.labels});
  final QuranController c;
  final List<String> labels;
  @override
  Widget build(BuildContext context) => Wrap(
    spacing: 6,
    runSpacing: 6,
    children: [
      for (final l in labels)
        TagChip(
          '$l • ${c.data!.label(l).name}',
          color: switch (l) {
            'M' => quranAccent,
            'H' => brandNavy,
            _ => const Color(0xFF1F8A5B),
          },
        ),
    ],
  );
}

class _PassageRow extends StatelessWidget {
  const _PassageRow({
    required this.c,
    required this.passage,
    this.lead,
    this.note,
    this.index = 0,
  });
  final QuranController c;
  final QuranPassage passage;
  final String? lead, note;
  final int index;
  @override
  Widget build(BuildContext context) {
    final p = c.progress.of(passage.id);
    final done = (p.mastery?.index ?? -1) >= Mastery.independent.index;
    return LockCorner(
      free: passage.id == c.data!.roadPassages.first.id,
      child: RowCard(
        index: index,
        outline: lessonOutline,
        onTap: () => openPassage(context, c, passage.id),
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: done ? quranAccent : _tint,
              foregroundColor: done ? Colors.white : quranAccent,
              child: done
                  ? const Icon(Icons.check_rounded)
                  : Text(
                      lead ?? '${passage.range.surah}',
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 13,
                      ),
                    ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                key: Key('quran-passage-${passage.id}'),
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    passage.displayTitle,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      color: ink,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${passage.range.label} • ${c.status(passage.id)}',
                    style: const TextStyle(color: mutedInk, fontSize: 13),
                  ),
                  if (note != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      note!,
                      style: const TextStyle(
                        color: quranAccent,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: quranAccent),
          ],
        ),
      ),
    );
  }
}

Widget _intro(String text) => Padding(
  padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
  child: Text(text, style: const TextStyle(color: mutedInk, height: 1.45)),
);

Widget _note(String text) => Padding(
  padding: const EdgeInsets.fromLTRB(20, 10, 20, 24),
  child: Text(
    text,
    style: const TextStyle(color: mutedInk, fontSize: 12, height: 1.5),
  ),
);

/// Scaffold shared by the browse screens, rebuilt on every progress save.
class _CourseScaffold extends StatelessWidget {
  const _CourseScaffold({
    super.key,
    required this.c,
    required this.title,
    required this.children,
  });
  final QuranController c;
  final String title;
  final List<Widget> Function() children;
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text(title)),
    body: SafeArea(
      child: ListenableBuilder(
        listenable: c,
        builder: (context, _) => ConstrainedBody(
          maxWidth: 640,
          child: ListView(
            padding: const EdgeInsets.only(top: 8),
            children: children(),
          ),
        ),
      ),
    ),
  );
}

/// My Learning Road: pedagogical order (source §10), not Qur'anic order.
class QuranRoadScreen extends StatelessWidget {
  const QuranRoadScreen({super.key, required this.c});
  final QuranController c;
  @override
  Widget build(BuildContext context) => _CourseScaffold(
    key: const Key('quran-road'),
    c: c,
    title: 'My Learning Road',
    children: () {
      final d = c.data!;
      var i = 0;
      return [
        _intro(
          'Begin with Al-Fātiḥah and short surahs, then grow step by step. The Qur’an browser always stays in Juz 1–30 order.',
        ),
        for (final phase in d.road) ...[
          SectionTitle(phase.phase, trailing: '${phase.passageIds.length}'),
          _intro(phase.principle),
          if (phase.orderPending)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
              child: PendingPanel(
                title: 'Order pending editor approval',
                body:
                    'The source says: “${phase.order}”.'
                    '${phase.phase == 'Growing recall' ? ' Shown from the end of Juz 30 backwards, as the source allows.' : ''}',
              ),
            ),
          for (final id in phase.passageIds)
            _PassageRow(c: c, passage: d.passage(id), index: i++),
        ],
        _note('Source: ${d.source}, §10 Suggested learning order.'),
      ];
    },
  );
}

/// Masnūn Recitations: M01–M11 with their cited contexts (source §6).
class QuranMasnunScreen extends StatelessWidget {
  const QuranMasnunScreen({super.key, required this.c});
  final QuranController c;
  @override
  Widget build(BuildContext context) => _CourseScaffold(
    key: const Key('quran-masnun'),
    c: c,
    title: 'Masnūn Recitations',
    children: () {
      final d = c.data!;
      return [
        _intro(
          'These passages have a cited Sunnah context. Other passages are still valuable to learn, but the app does not claim a special time or reward for them.',
        ),
        for (final (i, m) in d.masnun.indexed)
          _PassageRow(
            c: c,
            passage: d.passage(m.passageId),
            lead: '${i + 1}',
            note: '${m.id} • Juz ${m.juz} • ${m.source}',
            index: i,
          ),
        _note(
          '${d.masnunNote}\nWording of each context is pending Hadith review before release.',
        ),
      ];
    },
  );
}

/// Qur'an by Juz: the canonical 30-Juz navigation (source §8).
class QuranJuzListScreen extends StatelessWidget {
  const QuranJuzListScreen({super.key, required this.c});
  final QuranController c;
  @override
  Widget build(BuildContext context) => _CourseScaffold(
    key: const Key('quran-juz-list'),
    c: c,
    title: 'Qur’an by Juz',
    children: () {
      final d = c.data!;
      return [
        _intro(d.coverageNote),
        for (final z in d.juz)
          RowCard(
            index: z.number,
            onTap: () => _push(context, QuranJuzScreen(c: c, juz: z)),
            child: Row(
              key: Key('quran-juz-${z.number}'),
              children: [
                Container(
                  width: 46,
                  height: 46,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: _tint,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Text(
                    '${z.number}',
                    style: displayStyle(20, color: quranAccent),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Juz ${z.number} • ${z.start} → ${z.end}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          color: ink,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        z.focus,
                        style: const TextStyle(color: mutedInk, fontSize: 13),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: quranAccent),
              ],
            ),
          ),
        _note('Source: ${d.source}, §8 Full Qur’anic-order placement map.'),
      ];
    },
  );
}

class QuranJuzScreen extends StatelessWidget {
  const QuranJuzScreen({super.key, required this.c, required this.juz});
  final QuranController c;
  final JuzInfo juz;
  @override
  Widget build(BuildContext context) => _CourseScaffold(
    key: Key('quran-juz-screen-${juz.number}'),
    c: c,
    title: 'Juz ${juz.number}',
    children: () {
      final d = c.data!;
      return [
        _intro(
          'Starts at ${juz.start} and ends at ${juz.end}.\nLearning focus: ${juz.focus}',
        ),
        const SectionTitle('Selected passages'),
        for (final (i, s) in juz.selections.indexed)
          _PassageRow(
            c: c,
            passage: d.passage(s.passageId),
            note: [
              '${s.label} • ${s.range.label}',
              ?s.continuation,
            ].join(' • '),
            index: i,
          ),
        if (juz.number == 30) ...[
          SectionTitle('All surahs of Juz 30', trailing: '${d.juz30.length}'),
          _intro(
            'Every surah in Juz 30, in Qur’anic order. The Learning Road may begin from the short surahs at the end.',
          ),
          for (final (i, s) in d.juz30.indexed)
            _PassageRow(
              c: c,
              passage: d.passage(s.id),
              note: '${s.ayahCount} ayahs',
              index: i,
            ),
        ],
        _note(d.coverageNote),
      ];
    },
  );
}

/// A simple grown-up check so a child does not open the adult tools by
/// accident. It is not a security boundary: progress stays on this device.
Future<void> openAdultArea(BuildContext context, QuranController c) async {
  final a = 3 + c.random.nextInt(7), b = 3 + c.random.nextInt(7);
  final ok = await showDialog<bool>(
    context: context,
    builder: (_) => _AdultGate(a: a, b: b),
  );
  if (!context.mounted || ok == null) return; // cancelled
  if (ok) {
    await _push(context, QuranAdultScreen(c: c));
  } else {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('That answer was not right. Please ask a grown-up.'),
      ),
    );
  }
}

/// Owns its text controller, so it is disposed only after the dialog's
/// closing animation, never while the TextField still uses it.
class _AdultGate extends StatefulWidget {
  const _AdultGate({required this.a, required this.b});
  final int a, b;
  @override
  State<_AdultGate> createState() => _AdultGateState();
}

class _AdultGateState extends State<_AdultGate> {
  final _answer = TextEditingController();
  @override
  void dispose() {
    _answer.dispose();
    super.dispose();
  }

  void _submit() =>
      Navigator.pop(context, _answer.text.trim() == '${widget.a * widget.b}');

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: const Text('For parents & teachers'),
    content: Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'What is ${widget.a} × ${widget.b}?',
          key: const Key('quran-adult-question'),
        ),
        const SizedBox(height: 8),
        TextField(
          key: const Key('quran-adult-answer'),
          controller: _answer,
          autofocus: true,
          keyboardType: TextInputType.number,
          onSubmitted: (_) => _submit(),
        ),
      ],
    ),
    actions: [
      TextButton(
        onPressed: () => Navigator.pop(context),
        child: const Text('Cancel'),
      ),
      FilledButton(
        key: const Key('quran-adult-enter'),
        onPressed: _submit,
        child: const Text('Open'),
      ),
    ],
  );
}

Future<void> openSource(String url) =>
    launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);

/// Friendly review date: Today, Tomorrow, In 3 days, or "15 Nov".
String friendlyDate(DateTime when, DateTime now) {
  final days = DateUtils.dateOnly(
    when.toLocal(),
  ).difference(DateUtils.dateOnly(now.toLocal())).inDays;
  if (days <= 0) return 'Today';
  if (days == 1) return 'Tomorrow';
  if (days < 14) return 'In $days days';
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  final l = when.toLocal();
  return '${l.day} ${months[l.month - 1]}';
}
