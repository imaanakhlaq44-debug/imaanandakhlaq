import '../billing/paywall.dart';
import 'story_cards.dart';
import '../audio/voice.dart';
import 'package:imaan_akhlaq/rewards/reward_widgets.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../app_theme.dart';
import '../data/hadith_course.dart';
import 'ui_kit.dart';

class HadithCourseScreen extends StatefulWidget {
  const HadithCourseScreen({super.key, required this.scope, this.store});
  final String scope;
  final HadithProgressStore? store;
  @override
  State<HadithCourseScreen> createState() => _HadithCourseScreenState();
}

class _HadithCourseScreenState extends State<HadithCourseScreen> {
  late final HadithProgressStore _store =
      widget.store ?? DeviceHadithProgressStore.forLearner(widget.scope);
  List<HadithLesson>? _lessons;
  List<_WorldGroup> _groups = const [];
  Map<String, HadithProgress> _progress = {};
  final Set<int> _open = {};
  String? _error;
  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _error = null;
      _lessons = null;
    });
    try {
      final lessons = await HadithLesson.load();
      final worlds = await HadithLesson.loadWorlds();
      final saved = await _store.load();
      if (mounted) {
        setState(() {
          _lessons = lessons;
          _groups = _WorldGroup.build(worlds, lessons);
          _progress = saved;
          if (_open.isEmpty && _groups.isNotEmpty) {
            final next = _nextLesson;
            _open.add(
              next == null
                  ? _groups.first.number
                  : _groups.firstWhere((g) => g.lessons.contains(next)).number,
            );
          }
        });
      }
    } catch (_) {
      if (mounted) {
        setState(
          () => _error =
              'We could not load your lessons and saved progress. Please try again.',
        );
      }
    }
  }

  bool _explored(HadithLesson l) => _progress[l.id]?.explored ?? false;

  /// The first lesson not yet explored, in curriculum order.
  HadithLesson? get _nextLesson {
    for (final l in _lessons ?? const <HadithLesson>[]) {
      if (!_explored(l)) return l;
    }
    return null;
  }

  Future<void> _openLesson(HadithLesson lesson) async {
    await Navigator.of(context).push<void>(
      MaterialPageRoute(
        builder: (_) => PaidGate(
          free: lesson.number == 1,
          child: HadithLessonScreen(
            lesson: lesson,
            progress: _progress[lesson.id] ?? const HadithProgress(),
            onSave: (value) async {
              final next = {..._progress, lesson.id: value};
              await _store.save(next);
              if (mounted) setState(() => _progress = next);
            },
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final lessons = _lessons;
    return Scaffold(
      key: const Key('hadith-course'),
      appBar: AppBar(title: const Text('Hadith to Live By')),
      body: SafeArea(
        child: ConstrainedBody(
          maxWidth: 600,
          child: _error != null
              ? MessageView(
                  title: 'Let’s try again',
                  message: _error!,
                  action: FilledButton(
                    onPressed: _load,
                    child: const Text('Retry'),
                  ),
                )
              : lessons == null
              ? const Center(child: CircularProgressIndicator())
              : ListView.builder(
                  key: const Key('hadith-lesson-list'),
                  padding: const EdgeInsets.all(20),
                  itemCount: _groups.length + 2,
                  itemBuilder: (context, i) {
                    if (i == 0) return _hero(lessons);
                    if (i == _groups.length + 1) return _footer();
                    return _world(_groups[i - 1]);
                  },
                ),
        ),
      ),
    );
  }

  Widget _hero(List<HadithLesson> lessons) {
    final count = lessons.where(_explored).length;
    final next = _nextLesson;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            color: brandNavy,
            borderRadius: BorderRadius.circular(24),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${_groups.length} CHARACTER WORLDS',
                style: const TextStyle(
                  color: Color(0xFFFFD6E7),
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                'Small words.\nBeautiful choices.',
                style: displayStyle(
                  28,
                  color: Colors.white,
                  height: 1.12,
                  weight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                '$count of ${lessons.length} lessons explored',
                key: const Key('hadith-progress-count'),
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 10),
              LinearProgressIndicator(
                value: lessons.isEmpty ? 0 : count / lessons.length,
                minHeight: 6,
                borderRadius: BorderRadius.circular(8),
                backgroundColor: const Color(0xFF465682),
                color: brandPink,
              ),
              if (next != null) ...[
                const SizedBox(height: 18),
                FilledButton.icon(
                  key: const Key('hadith-continue'),
                  style: FilledButton.styleFrom(
                    backgroundColor: brandPink,
                    foregroundColor: Colors.white,
                  ),
                  onPressed: () => _openLesson(next),
                  icon: const Icon(Icons.play_arrow_rounded),
                  label: Text(
                    count == 0
                        ? 'Start with lesson 1'
                        : 'Next: lesson ${next.number}',
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 18),
        const Text(
          'Read a story, remember the words, make a choice and try one small action.',
          style: TextStyle(color: Color(0xFF66738E), height: 1.5),
        ),
        const SizedBox(height: 20),
      ],
    );
  }

  Widget _world(_WorldGroup g) {
    final open = _open.contains(g.number);
    final done = g.lessons.where(_explored).length;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Card(
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            InkWell(
              key: Key('hadith-world-${g.number}'),
              onTap: () => setState(
                () => open ? _open.remove(g.number) : _open.add(g.number),
              ),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 12, 14),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: done == g.lessons.length
                            ? brandPink
                            : const Color(0xFFFFF1E2),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Text(
                        '${g.number}',
                        style: displayStyle(
                          18,
                          color: done == g.lessons.length
                              ? Colors.white
                              : brandOrange,
                          weight: FontWeight.w700,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            g.title,
                            style: displayStyle(17, color: ink, height: 1.2),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            'Lessons ${g.first}–${g.last} • $done of ${g.lessons.length} explored',
                            style: const TextStyle(
                              fontSize: 13,
                              color: Color(0xFF66738E),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Semantics(
                      label: open ? 'Hide lessons' : 'Show lessons',
                      child: Icon(
                        open ? Icons.expand_less : Icons.expand_more,
                        color: brandNavy,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            if (open)
              for (final l in g.lessons) ...[
                const Divider(height: 1),
                ListTile(
                  key: Key('hadith-lesson-${l.number}'),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 15,
                    vertical: 6,
                  ),
                  leading: CircleAvatar(
                    backgroundColor: const Color(0xFFFCE8F0),
                    foregroundColor: brandPink,
                    child: Text(
                      '${l.number}',
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                      ),
                    ),
                  ),
                  title: Text(
                    l.title,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      color: ink,
                    ),
                  ),
                  subtitle: Text(_status(_progress[l.id])),
                  trailing: Icon(
                    _explored(l)
                        ? Icons.check_circle_outline
                        : Icons.chevron_right,
                    color: brandPink,
                  ),
                  onTap: () => _openLesson(l),
                ),
              ],
          ],
        ),
      ),
    );
  }

  Widget _footer() => Padding(
    padding: const EdgeInsets.only(top: 6),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.scope == 'guest'
              ? 'Trying as a guest. Progress is saved on this device.'
              : 'Progress is saved on this device for this learner.',
          style: const TextStyle(
            fontSize: 12,
            color: Color(0xFF66738E),
            height: 1.5,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          '${_lessons?.length ?? 0} lessons • Curriculum text includes source references and awaits scholarly review. Arabic audio will follow after review.',
          style: const TextStyle(
            fontSize: 12,
            color: Color(0xFF66738E),
            height: 1.5,
          ),
        ),
      ],
    ),
  );

  String _status(HadithProgress? p) {
    if (p == null) return 'Story • Learn • Choose • Act';
    if (!p.explored) return 'Continue from step ${p.step + 1} of 5';
    if (p.reflection == 'yes') return 'Explored • You tried your action';
    if (p.reflection == 'tried') return 'Explored • You gave it a try';
    return 'Explored • Action planned';
  }
}

/// A world and the lessons that belong to it. Falls back to one group when
/// the catalogue has no world list.
class _WorldGroup {
  const _WorldGroup(this.number, this.title, this.lessons);
  final int number;
  final String title;
  final List<HadithLesson> lessons;
  int get first => lessons.first.number;
  int get last => lessons.last.number;
  static List<_WorldGroup> build(
    List<HadithWorld> worlds,
    List<HadithLesson> lessons,
  ) {
    final groups = [
      for (final w in worlds)
        _WorldGroup(
          w.number,
          w.title,
          lessons.where(w.contains).toList(growable: false),
        ),
    ].where((g) => g.lessons.isNotEmpty).toList();
    if (groups.isEmpty && lessons.isNotEmpty) {
      return [_WorldGroup(1, 'Hadith to Live By', lessons)];
    }
    return groups;
  }
}

class HadithLessonScreen extends StatefulWidget {
  const HadithLessonScreen({
    super.key,
    required this.lesson,
    required this.progress,
    required this.onSave,
  });
  final HadithLesson lesson;
  final HadithProgress progress;
  final Future<void> Function(HadithProgress) onSave;
  @override
  State<HadithLessonScreen> createState() => _HadithLessonScreenState();
}

class _HadithLessonScreenState extends State<HadithLessonScreen> {
  /// Stars for this Hadith; the world's badge once its lessons are done.
  Future<void> _reward() async {
    final lesson = widget.lesson;
    HadithWorld? world;
    Iterable<String>? items;
    try {
      final worlds = await HadithLesson.loadWorlds();
      world = worlds.where((w) => w.contains(lesson)).firstOrNull;
      if (world != null) {
        final all = await HadithLesson.load();
        items = all.where(world.contains).map((l) => l.id);
      }
    } catch (_) {}
    if (!mounted) return;
    await celebrateFinish(
      context,
      course: 'hadith',
      item: lesson.id,
      group: world == null ? null : 'world-${world.number}',
      groupTitle: world?.title,
      groupItems: items,
    );
  }

  late HadithProgress _progress = widget.progress;
  late bool _summary = _progress.explored;
  late String? _reflection = _progress.reflection;
  bool _busy = false, _hidden = false;
  bool _reflectionSaved = false;
  String? _error;
  final _scroll = ScrollController();
  static const _steps = [
    'Story',
    'Understand',
    'Remember',
    'Choose',
    'Daily action',
  ];
  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  Future<bool> _persist(HadithProgress value) async {
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
      setState(() => _hidden = false);
      if (_scroll.hasClients) _scroll.jumpTo(0);
    }
  }

  bool get _correct =>
      _progress.choice != null &&
      widget.lesson.answers[_progress.choice!].correct;
  Future<void> _next() async {
    if (_progress.step < 4) {
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
    child: Scaffold(
      key: const Key('hadith-lesson-screen'),
      appBar: AppBar(
        leading: BackButton(onPressed: _busy ? null : _back),
        title: Text(widget.lesson.title),
      ),
      body: SafeArea(
        child: ConstrainedBody(
          maxWidth: 600,
          child: Column(
            children: [
              if (!_summary) ...[
                Padding(
                  padding: const EdgeInsets.fromLTRB(22, 8, 22, 10),
                  child: Row(
                    children: [
                      Text(
                        'Step ${_progress.step + 1} of 5',
                        style: const TextStyle(
                          color: brandPink,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _steps[_progress.step],
                          key: const Key('hadith-step-title'),
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
                  value: (_progress.step + 1) / 5,
                  minHeight: 3,
                  color: brandPink,
                  backgroundColor: const Color(0xFFE5E9F0),
                ),
              ],
              Expanded(
                child: ListView(
                  controller: _scroll,
                  padding: const EdgeInsets.all(22),
                  children: [...(_summary ? _finish() : _content())],
                ),
              ),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
                  child: Semantics(
                    liveRegion: true,
                    child: Text(
                      _error!,
                      key: const Key('hadith-save-error'),
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
                    key: const Key('hadith-next'),
                    onPressed:
                        _busy || (!_summary && _progress.step == 3 && !_correct)
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
                                : _progress.step == 4
                                ? 'Save my plan'
                                : 'Continue',
                          ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
  List<Widget> _content() {
    final l = widget.lesson;
    return switch (_progress.step) {
      0 => [
        Container(
          height: 180,
          decoration: BoxDecoration(
            color: brandNavy,
            borderRadius: BorderRadius.circular(22),
          ),
          clipBehavior: Clip.antiAlias,
          child: Image.asset(
            'assets/images/reading-hero-book1.png',
            fit: BoxFit.contain,
            cacheWidth: 640,
            excludeFromSemantics: true,
          ),
        ),
        const SizedBox(height: 20),
        _heading('A moment with Imaan & Akhlaq'),
        const SizedBox(height: 12),
        StoryCards(paragraphs: [l.story]),
        const SizedBox(height: 18),
        const Text(
          'An everyday teaching story',
          style: TextStyle(color: Color(0xFF66738E), fontSize: 12),
        ),
      ],
      1 => [
        _heading('Words to live by'),
        const SizedBox(height: 18),
        _arabic(l.arabic),
        if (l.excerpt)
          const Padding(
            padding: EdgeInsets.only(top: 8),
            child: Text(
              'Learning passage from a longer narration',
              style: TextStyle(color: Color(0xFF66738E), fontSize: 12),
            ),
          ),
        if (l.label.contains('NARRATOR'))
          const Padding(
            key: Key('hadith-narrator-note'),
            padding: EdgeInsets.only(top: 4),
            child: Text(
              'A narrator’s report, not words spoken by the Prophet ﷺ',
              style: TextStyle(color: Color(0xFF66738E), fontSize: 12),
            ),
          ),
        const SizedBox(height: 22),
        _heading('What it means'),
        const SizedBox(height: 10),
        Text(
          l.meaning,
          style: const TextStyle(
            fontSize: 21,
            height: 1.45,
            fontWeight: FontWeight.w700,
            color: ink,
          ),
        ),
        const SizedBox(height: 14),
        Text(l.explanation, style: const TextStyle(fontSize: 17, height: 1.6)),
        const SizedBox(height: 20),
        Text(
          l.source,
          style: const TextStyle(fontWeight: FontWeight.w700, color: brandNavy),
        ),
        if (l.label.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              'Curriculum note: ${l.label}',
              key: const Key('hadith-source-label'),
              style: const TextStyle(color: Color(0xFF66738E), fontSize: 12),
            ),
          ),
        TextButton.icon(
          key: const Key('hadith-source'),
          onPressed: _source,
          icon: const Icon(Icons.open_in_new, size: 16),
          label: const Text('Read the full narration'),
        ),
      ],
      2 => [
        _heading('A little at a time'),
        const SizedBox(height: 10),
        const Text(
          'Read each part slowly. When you feel ready, hide the words and try to remember them.',
          style: TextStyle(fontSize: 17, height: 1.5),
        ),
        const SizedBox(height: 22),
        if (!_hidden) ...[
          for (final chunk in l.chunks)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _arabic(chunk),
            ),
        ] else
          Container(
            key: const Key('hadith-memory-hidden'),
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Text(
              'Take your time. Say what you remember.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 20, height: 1.5, color: ink),
            ),
          ),
        const SizedBox(height: 12),
        OutlinedButton(
          key: const Key('hadith-hide-words'),
          onPressed: () => setState(() => _hidden = !_hidden),
          child: Text(_hidden ? 'Show words' : 'Hide words'),
        ),
        const SizedBox(height: 14),
        const Text(
          'You can revisit this lesson whenever you like.',
          style: TextStyle(color: Color(0xFF66738E)),
        ),
      ],
      3 => [
        _heading('What would you choose?'),
        const SizedBox(height: 12),
        Text(
          l.question,
          style: const TextStyle(fontSize: 19, height: 1.5, color: ink),
        ),
        const SizedBox(height: 22),
        for (var i = 0; i < l.answers.length; i++)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: OutlinedButton(
              key: Key('hadith-answer-$i'),
              onPressed: _busy
                  ? null
                  : () {
                      VoiceGuide.instance.play(
                        widget.lesson.answers[i].correct
                            ? VoiceLine.correct
                            : VoiceLine.tryAgain,
                      );
                      _persist(_progress.copyWith(choice: i));
                    },
              style: OutlinedButton.styleFrom(
                alignment: Alignment.centerLeft,
                padding: const EdgeInsets.all(16),
                minimumSize: const Size(48, 56),
                backgroundColor: _progress.choice == i
                    ? const Color(0xFFFCE8F0)
                    : Colors.white,
                side: BorderSide(
                  color: _progress.choice == i
                      ? brandPink
                      : const Color(0xFFCBD3E1),
                ),
              ),
              child: Text(
                l.answers[i].text,
                style: const TextStyle(fontSize: 16, height: 1.4, color: ink),
              ),
            ),
          ),
        if (_progress.choice != null)
          Semantics(
            liveRegion: true,
            child: Container(
              key: const Key('hadith-feedback'),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: _correct
                    ? const Color(0xFFE8F4ED)
                    : const Color(0xFFFFEFD9),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                l.answers[_progress.choice!].feedback,
                style: const TextStyle(fontSize: 16, height: 1.5, color: ink),
              ),
            ),
          ),
      ],
      _ => [
        _heading('One small action'),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            color: const Color(0xFFFCE8F0),
            borderRadius: BorderRadius.circular(22),
          ),
          child: Text(
            l.action,
            style: const TextStyle(
              fontSize: 21,
              fontWeight: FontWeight.w700,
              height: 1.5,
              color: ink,
            ),
          ),
        ),
        const SizedBox(height: 20),
        const Text(
          'Try it when a suitable moment comes. You can return later to reflect on how it went.',
          style: TextStyle(fontSize: 17, height: 1.6),
        ),
      ],
    };
  }

  List<Widget> _finish() => [
    const Icon(Icons.local_florist_outlined, size: 56, color: brandPink),
    const SizedBox(height: 18),
    _heading('A small step to try', centered: true),
    const SizedBox(height: 12),
    const Text(
      'You explored the lesson and saved your action plan.',
      textAlign: TextAlign.center,
      style: TextStyle(fontSize: 17, height: 1.5),
    ),
    const SizedBox(height: 24),
    Text(
      widget.lesson.action,
      style: const TextStyle(
        fontSize: 18,
        height: 1.5,
        fontWeight: FontWeight.w700,
        color: ink,
      ),
    ),
    const SizedBox(height: 24),
    _heading('When you have had a chance…'),
    const SizedBox(height: 10),
    const Text(
      'Did you get a chance to try your action? Every answer is okay.',
      style: TextStyle(fontSize: 16, height: 1.5),
    ),
    const SizedBox(height: 12),
    for (final entry in {
      'yes': 'Yes',
      'tried': 'I tried',
      'notYet': 'Not yet',
    }.entries)
      Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: OutlinedButton(
          key: Key('hadith-reflect-${entry.key}'),
          style: OutlinedButton.styleFrom(
            alignment: Alignment.centerLeft,
            minimumSize: const Size(double.infinity, 48),
            backgroundColor: _reflection == entry.key
                ? const Color(0xFFFCE8F0)
                : Colors.white,
          ),
          onPressed: _busy
              ? null
              : () => setState(() {
                  _reflection = entry.key;
                  _reflectionSaved = false;
                }),
          child: Text(entry.value),
        ),
      ),
    OutlinedButton(
      key: const Key('hadith-save-reflection'),
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
    const SizedBox(height: 18),
    const Text(
      'Come back tomorrow for a gentle revision.',
      style: TextStyle(color: Color(0xFF66738E), height: 1.5),
    ),
    TextButton(
      key: const Key('hadith-read-again'),
      onPressed: _busy
          ? null
          : () async {
              if (await _persist(_progress.copyWith(step: 0)) && mounted) {
                setState(() => _summary = false);
                if (_scroll.hasClients) _scroll.jumpTo(0);
              }
            },
      child: const Text('Read the lesson again'),
    ),
  ];
  Widget _heading(String text, {bool centered = false}) => Text(
    text,
    textAlign: centered ? TextAlign.center : TextAlign.start,
    style: const TextStyle(
      color: ink,
      fontSize: 24,
      height: 1.25,
      fontWeight: FontWeight.w800,
    ),
  );
  Widget _arabic(String text) => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(22),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: const Color(0xFFE0E5EF)),
    ),
    child: Text(
      text,
      key: const Key('hadith-arabic'),
      textDirection: TextDirection.rtl,
      textAlign: TextAlign.center,
      style: const TextStyle(
        fontFamily: 'NotoNaskhArabic',
        fontSize: 29,
        height: 1.9,
        color: brandNavy,
      ),
    ),
  );
  Future<void> _source() async {
    try {
      if (!await launchUrl(
        Uri.parse(widget.lesson.sourceUrl),
        mode: LaunchMode.externalApplication,
      )) {
        throw StateError('Unavailable');
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Could not open the source. ${widget.lesson.source}'),
          ),
        );
      }
    }
  }
}
