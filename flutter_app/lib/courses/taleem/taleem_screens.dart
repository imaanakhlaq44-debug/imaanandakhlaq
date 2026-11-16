import '../../screens/story_cards.dart';
import 'package:imaan_akhlaq/rewards/reward_widgets.dart';
import 'package:flutter/material.dart';
import '../../app_theme.dart';
import '../../screens/ui_kit.dart';
import 'taleem_data.dart';

/// One accent per age edition, warm to deep as the learner grows.
const taleemEditionAccents = [
  Color(0xFFD9822B), // 6–8, the course accent
  Color(0xFFD63678), // 9–10
  Color(0xFF2F7FD0), // 11–12
  Color(0xFF1E2D5A), // 13–14
];
const _tints = [
  Color(0xFFFFECD7),
  Color(0xFFFCE8F0),
  Color(0xFFDEEFFB),
  Color(0xFFE4E8F3),
];
const _muted = Color(0xFF66738E);
const _fallback = ['NotoNaskhArabic'];

/// The Latin fonts have no ﷺ glyph; let every Taleem text fall back to the
/// bundled Arabic font for it instead of showing an empty box.
class TaleemText extends StatelessWidget {
  const TaleemText({super.key, required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return Theme(
      data: t.copyWith(
        textTheme: t.textTheme.apply(fontFamilyFallback: _fallback),
        appBarTheme: t.appBarTheme.copyWith(
          titleTextStyle: (t.appBarTheme.titleTextStyle ?? const TextStyle())
              .copyWith(fontFamilyFallback: _fallback),
        ),
      ),
      child: DefaultTextStyle.merge(
        style: const TextStyle(fontFamilyFallback: _fallback),
        child: child,
      ),
    );
  }
}

/// Holds the loaded editions and this learner's saved progress, shared by
/// every Taleem screen so lists update as soon as a lesson is saved.
class TaleemSession {
  TaleemSession(this.store);
  final TaleemProgressStore store;
  final progress = ValueNotifier<Map<String, TaleemProgress>>({});
  Future<void> save(String lessonId, TaleemProgress value) async {
    final next = {...progress.value, lessonId: value};
    await store.save(next);
    progress.value = next;
  }

  int explored(TaleemEdition e) =>
      e.lessons.where((l) => progress.value[l.id]?.explored ?? false).length;
}

/// Course home: pick an age edition.
class TaleemHomeScreen extends StatefulWidget {
  const TaleemHomeScreen({super.key, required this.scope, this.store});
  final String scope;
  final TaleemProgressStore? store;
  @override
  State<TaleemHomeScreen> createState() => _TaleemHomeScreenState();
}

class _TaleemHomeScreenState extends State<TaleemHomeScreen> {
  late final _session = TaleemSession(
    widget.store ?? DeviceTaleemProgressStore.forLearner(widget.scope),
  );
  List<TaleemEdition>? _editions;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _session.progress.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _error = null;
      _editions = null;
    });
    try {
      final editions = await TaleemEdition.load();
      final saved = await _session.store.load();
      if (!mounted) return;
      _session.progress.value = saved;
      setState(() => _editions = editions);
    } catch (_) {
      if (mounted) {
        setState(
          () => _error =
              'We could not load the lessons and saved progress. Please try again.',
        );
      }
    }
  }

  void _open(TaleemEdition e) => Navigator.of(context).push<void>(
    MaterialPageRoute(
      builder: (_) => TaleemEditionScreen(edition: e, session: _session),
    ),
  );

  @override
  Widget build(BuildContext context) => TaleemText(
    child: Scaffold(
      key: const Key('taleem-home'),
      appBar: AppBar(title: const Text('Rihlat al-Huda Junior')),
      body: SafeArea(
        child: ConstrainedBody(
          maxWidth: 640,
          child: _error != null
              ? MessageView(
                  title: 'Let’s try again',
                  message: _error!,
                  action: FilledButton(
                    onPressed: _load,
                    child: const Text('Retry'),
                  ),
                )
              : _editions == null
              ? const Center(child: CircularProgressIndicator())
              : ValueListenableBuilder(
                  valueListenable: _session.progress,
                  builder: (context, _, _) => ListView(
                    padding: const EdgeInsets.fromLTRB(18, 12, 18, 28),
                    children: [
                      Reveal(index: 0, child: _hero()),
                      const SizedBox(height: 22),
                      Text('Choose your age edition', style: displayStyle(21)),
                      const SizedBox(height: 4),
                      const Text(
                        'Each edition has nine learning journeys. Start where you are; you can visit any edition.',
                        style: TextStyle(color: _muted, height: 1.45),
                      ),
                      const SizedBox(height: 14),
                      for (final (i, e) in _editions!.indexed) ...[
                        Reveal(
                          index: i + 1,
                          child: _EditionCard(
                            edition: e,
                            explored: _session.explored(e),
                            onTap: () => _open(e),
                          ),
                        ),
                        const SizedBox(height: 14),
                      ],
                      const SizedBox(height: 4),
                      Text(
                        widget.scope == 'guest'
                            ? 'Trying as a guest. Progress is saved on this device.'
                            : 'Progress is saved on this device for this learner.',
                        style: const TextStyle(
                          fontSize: 12,
                          color: _muted,
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Editorial working edition • Adapted from Riḥlat al-Hudā (Taʿleem-ul-Islam). Arabic, references and rulings are awaiting qualified scholarly review.',
                        key: Key('taleem-review-note'),
                        style: TextStyle(
                          fontSize: 12,
                          color: _muted,
                          height: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),
        ),
      ),
    ),
  );

  Widget _hero() {
    final total = _editions!.fold(0, (n, e) => n + e.lessons.length);
    final done = _editions!.fold(0, (n, e) => n + _session.explored(e));
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: brandNavy,
        borderRadius: BorderRadius.circular(26),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'TALEEM-UL-ISLAM',
            style: TextStyle(
              color: Color(0xFFFFD9B0),
              fontSize: 12,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 6),
          const Align(
            alignment: Alignment.centerRight,
            child: Text(
              'رِحْلَةُ الْهُدَى',
              textDirection: TextDirection.rtl,
              style: TextStyle(
                fontFamily: 'NotoNaskhArabic',
                fontSize: 26,
                height: 1.6,
                color: Colors.white,
              ),
            ),
          ),
          Text(
            'The Journey of Guidance',
            style: displayStyle(28, color: Colors.white, height: 1.15),
          ),
          const SizedBox(height: 8),
          const Text(
            'Story, teaching, questions, practice and review, one lesson at a time.',
            style: TextStyle(color: Color(0xFFD9DEEA), height: 1.45),
          ),
          const SizedBox(height: 16),
          Text(
            '$done of $total lessons explored',
            key: const Key('taleem-total-count'),
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          LinearProgressIndicator(
            value: total == 0 ? 0 : done / total,
            minHeight: 6,
            borderRadius: BorderRadius.circular(8),
            backgroundColor: const Color(0xFF465682),
            color: taleemEditionAccents[0],
          ),
        ],
      ),
    );
  }
}

class _EditionCard extends StatelessWidget {
  const _EditionCard({
    required this.edition,
    required this.explored,
    required this.onTap,
  });
  final TaleemEdition edition;
  final int explored;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    final i = edition.volume - 1;
    final accent = taleemEditionAccents[i];
    final total = edition.lessons.length;
    return Pressable(
      scale: .97,
      child: Material(
        color: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(22),
          side: BorderSide(color: accent.withValues(alpha: .3), width: 1.4),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          key: Key('taleem-edition-${edition.volume}'),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: _tints[i],
                        borderRadius: BorderRadius.circular(30),
                      ),
                      child: Text(
                        'Ages ${edition.ages}',
                        style: TextStyle(
                          color: Color.lerp(accent, brandNavy, .25),
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        edition.arabicTitle,
                        textAlign: TextAlign.end,
                        textDirection: TextDirection.rtl,
                        style: TextStyle(
                          fontFamily: 'NotoNaskhArabic',
                          fontSize: 20,
                          height: 1.5,
                          color: accent,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  edition.title,
                  style: displayStyle(21, color: ink, height: 1.2),
                ),
                const SizedBox(height: 4),
                Text(
                  'Volume 0${edition.volume} • ${edition.journeys.length} journeys • $total lessons',
                  style: const TextStyle(color: _muted),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: LinearProgressIndicator(
                        value: total == 0 ? 0 : explored / total,
                        minHeight: 6,
                        borderRadius: BorderRadius.circular(8),
                        backgroundColor: _tints[i],
                        color: accent,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      '$explored/$total',
                      style: TextStyle(
                        color: accent,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// One age edition: its nine journeys and their lessons.
class TaleemEditionScreen extends StatelessWidget {
  const TaleemEditionScreen({
    super.key,
    required this.edition,
    required this.session,
  });
  final TaleemEdition edition;
  final TaleemSession session;

  void _open(BuildContext context, TaleemLesson lesson) =>
      Navigator.of(context).push<void>(
        MaterialPageRoute(
          builder: (_) => TaleemLessonScreen(
            edition: edition,
            lesson: lesson,
            progress:
                session.progress.value[lesson.id] ?? const TaleemProgress(),
            onSave: (p) => session.save(lesson.id, p),
          ),
        ),
      );

  @override
  Widget build(BuildContext context) {
    final i = edition.volume - 1;
    final accent = taleemEditionAccents[i];
    return TaleemText(
      child: Scaffold(
        key: Key('taleem-edition-screen-${edition.volume}'),
        appBar: AppBar(title: Text(edition.title)),
        body: SafeArea(
          child: ConstrainedBody(
            maxWidth: 640,
            child: ValueListenableBuilder(
              valueListenable: session.progress,
              builder: (context, progress, _) {
                var row = 0;
                return ListView(
                  padding: const EdgeInsets.fromLTRB(18, 12, 18, 28),
                  children: [
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: _tints[i],
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'VOLUME 0${edition.volume} • AGES ${edition.ages}',
                            style: TextStyle(
                              color: Color.lerp(accent, brandNavy, .25),
                              fontWeight: FontWeight.w800,
                              fontSize: 12,
                              letterSpacing: 1,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            edition.welcome,
                            style: const TextStyle(
                              color: ink,
                              fontSize: 15,
                              height: 1.55,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            '${session.explored(edition)} of ${edition.lessons.length} lessons explored',
                            key: const Key('taleem-edition-count'),
                            style: TextStyle(
                              color: Color.lerp(accent, brandNavy, .3),
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                    ),
                    for (final j in edition.journeys) ...[
                      const SizedBox(height: 24),
                      Text(
                        'JOURNEY ${j.number.toString().padLeft(2, '0')}',
                        style: TextStyle(
                          color: accent,
                          fontWeight: FontWeight.w800,
                          fontSize: 12,
                          letterSpacing: 1,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(j.title, style: displayStyle(20, height: 1.2)),
                      const SizedBox(height: 4),
                      Text(
                        j.aim,
                        style: const TextStyle(color: _muted, height: 1.45),
                      ),
                      const SizedBox(height: 10),
                      for (final l in j.lessons)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: Reveal(
                            index: row++,
                            child: _LessonRow(
                              lesson: l,
                              progress: progress[l.id],
                              accent: accent,
                              tint: _tints[i],
                              onTap: () => _open(context, l),
                            ),
                          ),
                        ),
                    ],
                    const SizedBox(height: 18),
                    Text(
                      '${edition.status}\nSource: ${edition.sourceDocument}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: _muted,
                        height: 1.5,
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}

class _LessonRow extends StatelessWidget {
  const _LessonRow({
    required this.lesson,
    required this.progress,
    required this.accent,
    required this.tint,
    required this.onTap,
  });
  final TaleemLesson lesson;
  final TaleemProgress? progress;
  final Color accent, tint;
  final VoidCallback onTap;

  String get _status {
    final p = progress;
    if (p == null) return 'Story • Teaching • Q&A • Practice';
    if (!p.explored) {
      return 'Continue from step ${p.step + 1} of ${taleemSteps.length}';
    }
    return switch (p.reflection) {
      'yes' => 'Explored • You tried your action',
      'tried' => 'Explored • You gave it a try',
      _ => 'Explored • Action planned',
    };
  }

  @override
  Widget build(BuildContext context) {
    final done = progress?.explored ?? false;
    return Pressable(
      child: Material(
        color: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: const BorderSide(color: lineColor),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          key: Key('taleem-lesson-${lesson.id}'),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 12, 12),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: done ? accent : tint,
                  foregroundColor: done ? Colors.white : accent,
                  child: done
                      ? const Icon(Icons.check, size: 20)
                      : Text(
                          '${lesson.number}',
                          style: const TextStyle(fontWeight: FontWeight.w800),
                        ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        lesson.title,
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          color: ink,
                          fontSize: 16,
                          height: 1.3,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _status,
                        style: const TextStyle(color: _muted, fontSize: 13),
                      ),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right, color: accent),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// One lesson, step by step: Discover, Understand, Questions & Answers,
/// Reflect & decide, Practise, Remember; then a summary with a reflection.
class TaleemLessonScreen extends StatefulWidget {
  const TaleemLessonScreen({
    super.key,
    required this.edition,
    required this.lesson,
    required this.progress,
    required this.onSave,
  });
  final TaleemEdition edition;
  final TaleemLesson lesson;
  final TaleemProgress progress;
  final Future<void> Function(TaleemProgress) onSave;
  @override
  State<TaleemLessonScreen> createState() => _TaleemLessonScreenState();
}

class _TaleemLessonScreenState extends State<TaleemLessonScreen> {
  /// Stars for this lesson; the journey's badge once its lessons are done.
  void _reward() {
    final e = widget.edition;
    final journey = e.journeys
        .where((j) => j.lessons.any((l) => l.id == _l.id))
        .firstOrNull;
    celebrateFinish(
      context,
      course: 'taleem',
      item: '${e.id}/${_l.id}',
      group: journey == null ? null : '${e.id}/journey-${journey.number}',
      groupTitle: journey?.title,
      groupItems: journey?.lessons.map((l) => '${e.id}/${l.id}'),
    );
  }

  late TaleemProgress _progress = widget.progress;
  late bool _summary = _progress.explored;
  late String? _reflection = _progress.reflection;
  final _revealed = <int>{};
  bool _decided = false, _busy = false, _reflectionSaved = false;
  String? _error;
  final _scroll = ScrollController();

  TaleemLesson get _l => widget.lesson;
  Color get _accent => taleemEditionAccents[widget.edition.volume - 1];
  Color get _tint => _tints[widget.edition.volume - 1];
  int get _last => taleemSteps.length - 1;

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  Future<bool> _persist(TaleemProgress value) async {
    if (_busy) return false;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await widget.onSave(value);
      if (mounted) setState(() => _progress = value);
      return true;
    } catch (_) {
      if (mounted) {
        setState(
          () => _error = 'Your progress was not saved. Please try again.',
        );
      }
      return false;
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _step(int step) async {
    if (await _persist(_progress.copyWith(step: step)) && mounted) {
      if (_scroll.hasClients) _scroll.jumpTo(0);
    }
  }

  /// A learner thinks before seeing the answers the first time through.
  bool get _canContinue {
    if (_progress.explored) return true;
    return switch (_progress.step) {
      2 => _revealed.length == _l.questions.length,
      3 => _l.decide == null || _decided,
      _ => true,
    };
  }

  Future<void> _next() async {
    if (_progress.step < _last) {
      await _step(_progress.step + 1);
      return;
    }
    final first = _progress.completedAt == null;
    final saved = await _persist(
      _progress.copyWith(
        completedAt: _progress.completedAt ?? DateTime.now().toUtc(),
      ),
    );
    if (saved && mounted) {
      if (first) _reward();
      setState(() => _summary = true);
      if (_scroll.hasClients) _scroll.jumpTo(0);
    }
  }

  void _back() {
    if (_busy) return;
    if (!_summary && _progress.step > 0) {
      _step(_progress.step - 1);
    } else {
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) => PopScope(
    canPop: !_busy && (_summary || _progress.step == 0),
    onPopInvokedWithResult: (didPop, _) {
      if (!didPop && !_busy) _back();
    },
    child: TaleemText(
      child: Scaffold(
        key: const Key('taleem-lesson-screen'),
        appBar: AppBar(
          leading: BackButton(onPressed: _busy ? null : _back),
          title: Text('Lesson ${_l.number}'),
        ),
        body: SafeArea(
          child: ConstrainedBody(
            maxWidth: 640,
            child: Column(
              children: [
                if (!_summary) ...[
                  Padding(
                    padding: const EdgeInsets.fromLTRB(22, 6, 22, 10),
                    child: Row(
                      children: [
                        Text(
                          'Step ${_progress.step + 1} of ${taleemSteps.length}',
                          style: TextStyle(
                            color: _accent,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            taleemSteps[_progress.step],
                            key: const Key('taleem-step-title'),
                            style: const TextStyle(
                              color: ink,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  LinearProgressIndicator(
                    value: (_progress.step + 1) / taleemSteps.length,
                    minHeight: 3,
                    color: _accent,
                    backgroundColor: const Color(0xFFE5E9F0),
                  ),
                ],
                Expanded(
                  child: ListView(
                    controller: _scroll,
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
                    children: _summary ? _finish() : _content(),
                  ),
                ),
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                    child: Semantics(
                      liveRegion: true,
                      child: Text(
                        _error!,
                        key: const Key('taleem-save-error'),
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.error,
                        ),
                      ),
                    ),
                  ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 10, 20, 16),
                  child: SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      key: const Key('taleem-next'),
                      style: FilledButton.styleFrom(backgroundColor: _accent),
                      onPressed: _busy || (!_summary && !_canContinue)
                          ? null
                          : _summary
                          ? () => Navigator.pop(context)
                          : _next,
                      child: _busy
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Text(
                              _summary
                                  ? 'Back to lessons'
                                  : _progress.step == _last
                                  ? 'Finish lesson'
                                  : _canContinue
                                  ? 'Continue'
                                  : _progress.step == 2
                                  ? 'Show every answer to continue'
                                  : 'See the answer to continue',
                            ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );

  List<Widget> _content() => switch (_progress.step) {
    0 => [
      Text(_l.title, style: displayStyle(26, color: ink, height: 1.2)),
      const SizedBox(height: 12),
      _box(
        color: _tint,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _label('What I will learn'),
            const SizedBox(height: 6),
            Text(_l.objective, style: _body.copyWith(fontSize: 16)),
          ],
        ),
      ),
      const SizedBox(height: 22),
      _heading('Discover — An Imaan & Akhlaq Story'),
      const SizedBox(height: 12),
      StoryCards(paragraphs: _l.story, accent: _accent),
      const Text(
        'An everyday teaching story with fictional characters, not a scriptural event.',
        style: TextStyle(color: _muted, fontSize: 12, height: 1.5),
      ),
    ],
    1 => [
      _heading('Understand — Our Teaching'),
      const SizedBox(height: 12),
      for (final t in _l.teaching)
        if (t.arabic != null) ...[
          _arabic(t.arabic!),
          if (t.meaning != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(4, 8, 4, 18),
              child: Text(
                t.meaning!,
                style: _body.copyWith(fontWeight: FontWeight.w700),
              ),
            ),
        ] else
          _para(t.text!),
      const SizedBox(height: 6),
      _box(
        key: const Key('taleem-evidence'),
        color: Colors.white,
        border: true,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _label(_l.evidenceLabel),
            const SizedBox(height: 6),
            Text(
              _l.evidence,
              style: const TextStyle(
                color: brandNavy,
                fontWeight: FontWeight.w700,
                fontSize: 16,
                height: 1.45,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Master chapter(s): ${_l.masterChapters}. Read the verse or narration from a verified edition with an adult.',
              style: const TextStyle(color: _muted, fontSize: 13, height: 1.45),
            ),
          ],
        ),
      ),
    ],
    2 => [
      _heading('Questions & Answers'),
      const SizedBox(height: 6),
      const Text(
        'Think of your answer first, then tap to check.',
        style: TextStyle(color: _muted, fontSize: 15, height: 1.45),
      ),
      const SizedBox(height: 14),
      for (final (i, q) in _l.questions.indexed) _question(i, q),
    ],
    3 => [
      _heading('A Moment to Reflect'),
      const SizedBox(height: 12),
      _box(
        color: _tint,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            for (final r in _l.reflect)
              Text(
                r,
                style: _body.copyWith(
                  fontSize: 19,
                  fontWeight: FontWeight.w700,
                ),
              ),
            const SizedBox(height: 8),
            const Text(
              'Think about it quietly or talk with a trusted adult. You do not need to share your answer.',
              style: TextStyle(color: _muted, fontSize: 13, height: 1.45),
            ),
          ],
        ),
      ),
      if (_l.decide case final d?) ...[
        const SizedBox(height: 26),
        _heading('Decide — What Would You Do?'),
        const SizedBox(height: 12),
        for (final s in d.scenario) _para(s),
        if (!_decided && !_progress.explored)
          OutlinedButton.icon(
            key: const Key('taleem-decide-reveal'),
            onPressed: () => setState(() => _decided = true),
            icon: const Icon(Icons.lightbulb_outline),
            label: const Text('I have decided. Show the teacher’s answer'),
          )
        else
          Semantics(
            liveRegion: true,
            child: _box(
              key: const Key('taleem-decide-feedback'),
              color: const Color(0xFFE8F4ED),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _label('Teacher answer and feedback', color: successInk),
                  const SizedBox(height: 6),
                  Text(d.feedback, style: _body),
                ],
              ),
            ),
          ),
      ],
    ],
    4 => [
      _heading('My First Step — A Daily Action'),
      const SizedBox(height: 12),
      _box(
        key: const Key('taleem-daily-action'),
        color: _tint,
        child: Text(
          _l.dailyAction,
          style: _body.copyWith(fontSize: 20, fontWeight: FontWeight.w700),
        ),
      ),
      const SizedBox(height: 22),
      _heading('Try It Together'),
      const SizedBox(height: 10),
      _para(_l.tryTogether),
      const SizedBox(height: 8),
      _heading('Key Words'),
      const SizedBox(height: 10),
      for (final k in _l.keyWords.split(RegExp(r';\s*')))
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: _box(
            color: Colors.white,
            border: true,
            padding: 14,
            child: Text(k, style: _body.copyWith(fontSize: 16)),
          ),
        ),
    ],
    _ => [
      _heading('Remember'),
      const SizedBox(height: 6),
      const Text(
        'Tick what feels true today. A blank box means “I am still learning.”',
        style: TextStyle(color: _muted, fontSize: 15, height: 1.45),
      ),
      const SizedBox(height: 12),
      for (final (i, r) in _l.remember.indexed)
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Material(
            color: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(
                color: _progress.checks.contains(i) ? _accent : lineColor,
              ),
            ),
            clipBehavior: Clip.antiAlias,
            child: CheckboxListTile(
              key: Key('taleem-check-$i'),
              value: _progress.checks.contains(i),
              activeColor: _accent,
              controlAffinity: ListTileControlAffinity.leading,
              title: Text(r, style: _body.copyWith(fontSize: 16)),
              onChanged: _busy
                  ? null
                  : (v) {
                      final next = {..._progress.checks};
                      v == true ? next.add(i) : next.remove(i);
                      _persist(_progress.copyWith(checks: next));
                    },
            ),
          ),
        ),
      const SizedBox(height: 14),
      Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          key: const Key('taleem-parent-note'),
          tilePadding: const EdgeInsets.symmetric(horizontal: 4),
          leading: const Icon(Icons.family_restroom, color: brandNavy),
          title: const Text(
            'For parents and teachers',
            style: TextStyle(fontWeight: FontWeight.w800, color: brandNavy),
          ),
          childrenPadding: const EdgeInsets.fromLTRB(4, 0, 4, 12),
          children: [_para(_l.parentNote)],
        ),
      ),
    ],
  };

  Widget _question(int i, TaleemQuestion q) {
    final open = _revealed.contains(i) || _progress.explored;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: open ? _tint : Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: BorderSide(color: open ? _accent : lineColor),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          key: Key('taleem-reveal-$i'),
          onTap: open ? null : () => setState(() => _revealed.add(i)),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  q.question,
                  style: _body.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 8),
                if (open)
                  Semantics(
                    liveRegion: true,
                    child: Text(q.answer, style: _body),
                  )
                else
                  Row(
                    children: [
                      Icon(Icons.touch_app_outlined, size: 18, color: _accent),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          'Tap to see the answer',
                          style: TextStyle(
                            color: _accent,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  List<Widget> _finish() => [
    Icon(Icons.auto_awesome, size: 54, color: _accent),
    const SizedBox(height: 14),
    Text(
      'You explored “${_l.title}”',
      textAlign: TextAlign.center,
      style: displayStyle(23, color: ink, height: 1.25),
    ),
    const SizedBox(height: 18),
    _box(
      color: _tint,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _label('My first step'),
          const SizedBox(height: 6),
          Text(
            _l.dailyAction,
            style: _body.copyWith(fontWeight: FontWeight.w700),
          ),
        ],
      ),
    ),
    const SizedBox(height: 22),
    _heading('When you have had a chance…'),
    const SizedBox(height: 8),
    Text(
      'Did you get a chance to try your action? Every answer is okay.',
      style: _body.copyWith(fontSize: 16),
    ),
    const SizedBox(height: 12),
    for (final e in const {
      'yes': 'Yes',
      'tried': 'I tried',
      'notYet': 'Not yet',
    }.entries)
      Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: OutlinedButton(
          key: Key('taleem-reflect-${e.key}'),
          style: OutlinedButton.styleFrom(
            alignment: Alignment.centerLeft,
            minimumSize: const Size(double.infinity, 48),
            backgroundColor: _reflection == e.key ? _tint : Colors.white,
            side: BorderSide(
              color: _reflection == e.key ? _accent : const Color(0xFFCBD3E1),
            ),
          ),
          onPressed: _busy
              ? null
              : () => setState(() {
                  _reflection = e.key;
                  _reflectionSaved = false;
                }),
          child: Text(e.value),
        ),
      ),
    OutlinedButton(
      key: const Key('taleem-save-reflection'),
      onPressed: _busy || _reflection == null
          ? null
          : () async {
              if (await _persist(_progress.copyWith(reflection: _reflection)) &&
                  mounted) {
                setState(() => _reflectionSaved = true);
              }
            },
      child: const Text('Save reflection'),
    ),
    if (_reflectionSaved)
      Semantics(
        liveRegion: true,
        child: const Padding(
          padding: EdgeInsets.only(top: 10),
          child: Text(
            'Reflection saved on this device.',
            style: TextStyle(color: brandNavy),
          ),
        ),
      ),
    const SizedBox(height: 12),
    TextButton(
      key: const Key('taleem-read-again'),
      onPressed: _busy
          ? null
          : () async {
              if (await _persist(_progress.copyWith(step: 0)) && mounted) {
                setState(() => _summary = false);
                if (_scroll.hasClients) _scroll.jumpTo(0);
              }
            },
      child: const Text('Review the lesson again'),
    ),
  ];

  static const _body = TextStyle(fontSize: 17, height: 1.6, color: ink);
  Widget _para(String text, {double size = 17}) => Padding(
    padding: const EdgeInsets.only(bottom: 14),
    child: Text(text, style: _body.copyWith(fontSize: size)),
  );
  Widget _heading(String text) =>
      Text(text, style: displayStyle(22, color: ink, height: 1.25));
  Widget _label(String text, {Color? color}) => Text(
    text.toUpperCase(),
    style: TextStyle(
      color: color ?? Color.lerp(_accent, brandNavy, .25),
      fontWeight: FontWeight.w800,
      fontSize: 12,
      letterSpacing: .8,
    ),
  );
  Widget _box({
    Key? key,
    required Color color,
    required Widget child,
    bool border = false,
    double padding = 18,
  }) => Container(
    key: key,
    width: double.infinity,
    padding: EdgeInsets.all(padding),
    decoration: BoxDecoration(
      color: color,
      borderRadius: BorderRadius.circular(20),
      border: border ? Border.all(color: lineColor) : null,
    ),
    child: child,
  );
  Widget _arabic(String text) => _box(
    color: Colors.white,
    border: true,
    child: Text(
      text,
      key: const Key('taleem-arabic'),
      textDirection: TextDirection.rtl,
      textAlign: TextAlign.center,
      style: const TextStyle(
        fontFamily: 'NotoNaskhArabic',
        fontSize: 27,
        height: 1.9,
        color: brandNavy,
      ),
    ),
  );
}
