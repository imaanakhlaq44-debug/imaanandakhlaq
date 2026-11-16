import '../../audio/voice.dart';
import 'package:imaan_akhlaq/rewards/reward_widgets.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../app_theme.dart';
import '../../screens/ui_kit.dart';
import 'duas_data.dart';

/// Course accent (same as courseAccents[2]) and its soft tint.
const duasAccent = brandOrange;
const duasTint = Color(0xFFFFF1E0);
const _deepAccent = Color(0xFFB45F0C);

typedef DuaSave = Future<void> Function(String id, DuaProgress value);

const _arabicFont = 'NotoNaskhArabic';

/// Arabic text sized down gently as it gets longer, so long supplications
/// stay readable on a 375 px phone.
double _arabicSize(String text) => text.length > 300
    ? 22
    : text.length > 120
    ? 25
    : 30;

class DuasCourseScreen extends StatefulWidget {
  const DuasCourseScreen({
    super.key,
    required this.scope,
    this.store,
    this.loadVolumes,
  });
  final String scope;
  final DuaProgressStore? store;

  /// Defaults to the bundled volumes (DuaVolume.loadAll).
  final Future<List<DuaVolume>> Function()? loadVolumes;
  @override
  State<DuasCourseScreen> createState() => _DuasCourseScreenState();
}

class _DuasCourseScreenState extends State<DuasCourseScreen> {
  late final DuaProgressStore _store =
      widget.store ?? DeviceDuaProgressStore.forLearner(widget.scope);
  final _progress = ValueNotifier<Map<String, DuaProgress>>({});
  List<DuaVolume>? _volumes;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _progress.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _error = null;
      _volumes = null;
    });
    try {
      final volumes = await (widget.loadVolumes ?? DuaVolume.loadAll)();
      final saved = await _store.load();
      if (!mounted) return;
      _progress.value = saved;
      setState(() => _volumes = volumes);
    } catch (_) {
      if (mounted) {
        setState(
          () => _error =
              'We could not load the duas and your saved progress. Please try again.',
        );
      }
    }
  }

  Future<void> _save(String id, DuaProgress value) async {
    final next = {..._progress.value, id: value};
    await _store.save(next);
    _progress.value = next;
  }

  void _openVolume(DuaVolume volume) => Navigator.of(context).push<void>(
    MaterialPageRoute(
      builder: (_) =>
          DuasVolumeScreen(volume: volume, progress: _progress, onSave: _save),
    ),
  );

  @override
  Widget build(BuildContext context) => Scaffold(
    key: const Key('duas-course'),
    backgroundColor: canvas,
    appBar: AppBar(title: const Text('Zad al-Qulub Junior')),
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
            : _volumes == null
            ? const Center(child: CircularProgressIndicator())
            : ValueListenableBuilder<Map<String, DuaProgress>>(
                valueListenable: _progress,
                builder: (context, progress, _) => _list(_volumes!, progress),
              ),
      ),
    ),
  );

  Widget _list(List<DuaVolume> volumes, Map<String, DuaProgress> progress) {
    final total = volumes.fold<int>(0, (n, v) => n + v.lessons.length);
    final explored = volumes
        .expand((v) => v.lessons)
        .where((l) => progress[l.id]?.explored ?? false)
        .length;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
      children: [
        Reveal(
          index: 0,
          child: _Hero(
            eyebrow: '100 DU‘AS & ADHKĀR',
            title: 'Words that\nfeed the heart',
            detail: '$explored of $total duas explored',
            value: total == 0 ? 0 : explored / total,
            countKey: const Key('duas-progress-count'),
          ),
        ),
        const SizedBox(height: 14),
        const Text(
          'Read a story, learn the words and their meaning, remember them a little at a time, then try one small action.',
          style: TextStyle(color: mutedInk, height: 1.5, fontSize: 15),
        ),
        const SizedBox(height: 18),
        for (var i = 0; i < volumes.length; i++) ...[
          Reveal(
            index: i + 1,
            child: _VolumeCard(
              volume: volumes[i],
              explored: volumes[i].lessons
                  .where((l) => progress[l.id]?.explored ?? false)
                  .length,
              onTap: () => _openVolume(volumes[i]),
            ),
          ),
          const SizedBox(height: 12),
        ],
        const SizedBox(height: 6),
        Text(
          widget.scope == 'guest'
              ? 'Trying as a guest. Progress is saved on this device.'
              : 'Progress is saved on this device for this learner.',
          style: const TextStyle(fontSize: 12, color: mutedInk, height: 1.5),
        ),
        const SizedBox(height: 6),
        const _ReviewNote(),
      ],
    );
  }
}

class _ReviewNote extends StatelessWidget {
  const _ReviewNote();
  @override
  Widget build(BuildContext context) => const Text(
    'Working curriculum text from Zad al-Qulub Junior, awaiting scholarly, Arabic, Urdu and pronunciation review. Arabic audio will follow after review.',
    key: Key('duas-review-note'),
    style: TextStyle(fontSize: 12, color: mutedInk, height: 1.5),
  );
}

class _Hero extends StatelessWidget {
  const _Hero({
    required this.eyebrow,
    required this.title,
    required this.detail,
    required this.value,
    this.countKey,
  });
  final String eyebrow, title, detail;
  final double value;
  final Key? countKey;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(22),
    decoration: BoxDecoration(
      color: brandNavy,
      borderRadius: BorderRadius.circular(24),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          eyebrow,
          style: const TextStyle(
            color: Color(0xFFFFD9A8),
            fontSize: 12,
            fontWeight: FontWeight.w800,
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: 10),
        Text(title, style: displayStyle(28, color: Colors.white, height: 1.12)),
        const SizedBox(height: 16),
        Text(
          detail,
          key: countKey,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 10),
        LinearProgressIndicator(
          value: value,
          minHeight: 6,
          borderRadius: BorderRadius.circular(8),
          backgroundColor: const Color(0xFF465682),
          color: duasAccent,
        ),
      ],
    ),
  );
}

class _VolumeCard extends StatelessWidget {
  const _VolumeCard({
    required this.volume,
    required this.explored,
    required this.onTap,
  });
  final DuaVolume volume;
  final int explored;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    final n = volume.lessons.length;
    final first = volume.lessons.first.number,
        last = volume.lessons.last.number;
    return Pressable(
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          key: Key('duas-volume-${volume.number}'),
          borderRadius: BorderRadius.circular(20),
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: lineColor),
            ),
            child: Row(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: duasTint,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    volume.number.toString().padLeft(2, '0'),
                    style: displayStyle(20, color: _deepAccent),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        volume.title,
                        style: displayStyle(18, color: ink, height: 1.2),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Duas $first–$last • $explored of $n explored',
                        style: const TextStyle(
                          color: mutedInk,
                          fontSize: 13,
                          height: 1.3,
                        ),
                      ),
                      const SizedBox(height: 8),
                      LinearProgressIndicator(
                        value: n == 0 ? 0 : explored / n,
                        minHeight: 4,
                        borderRadius: BorderRadius.circular(4),
                        backgroundColor: const Color(0xFFF1EBE6),
                        color: duasAccent,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Icon(
                  explored == n
                      ? Icons.check_circle_outline
                      : Icons.chevron_right,
                  color: duasAccent,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class DuasVolumeScreen extends StatelessWidget {
  const DuasVolumeScreen({
    super.key,
    required this.volume,
    required this.progress,
    required this.onSave,
  });
  final DuaVolume volume;
  final ValueNotifier<Map<String, DuaProgress>> progress;
  final DuaSave onSave;

  void _open(BuildContext context, DuaLesson lesson) =>
      Navigator.of(context).push<void>(
        MaterialPageRoute(
          builder: (_) => DuaLessonScreen(
            lesson: lesson,
            volume: volume,
            progress: progress.value[lesson.id] ?? const DuaProgress(),
            onSave: (value) => onSave(lesson.id, value),
          ),
        ),
      );

  static String _status(DuaProgress? p) {
    if (p == null) return 'Story • Learn • Remember • Act';
    if (!p.explored) {
      return 'Continue from step ${p.step + 1} of ${duaSteps.length}';
    }
    if (p.reflection == 'yes') return 'Explored • You tried your action';
    if (p.reflection == 'tried') return 'Explored • You gave it a try';
    return 'Explored • Action planned';
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    key: const Key('duas-volume-screen'),
    backgroundColor: canvas,
    appBar: AppBar(title: Text('Volume ${volume.number}')),
    body: SafeArea(
      child: ConstrainedBody(
        maxWidth: 640,
        child: ValueListenableBuilder<Map<String, DuaProgress>>(
          valueListenable: progress,
          builder: (context, saved, _) {
            final explored = volume.lessons
                .where((l) => saved[l.id]?.explored ?? false)
                .length;
            return ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
              children: [
                Reveal(
                  index: 0,
                  child: _Hero(
                    eyebrow:
                        'VOLUME ${volume.number.toString().padLeft(2, '0')}',
                    title: volume.title,
                    detail:
                        '$explored of ${volume.lessons.length} duas explored',
                    value: explored / volume.lessons.length,
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  volume.intro,
                  style: const TextStyle(
                    color: mutedInk,
                    height: 1.5,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 18),
                for (var i = 0; i < volume.lessons.length; i++) ...[
                  Reveal(
                    index: i + 1,
                    child: _LessonCard(
                      lesson: volume.lessons[i],
                      status: _status(saved[volume.lessons[i].id]),
                      done: saved[volume.lessons[i].id]?.explored ?? false,
                      onTap: () => _open(context, volume.lessons[i]),
                    ),
                  ),
                  const SizedBox(height: 10),
                ],
              ],
            );
          },
        ),
      ),
    ),
  );
}

class _LessonCard extends StatelessWidget {
  const _LessonCard({
    required this.lesson,
    required this.status,
    required this.done,
    required this.onTap,
  });
  final DuaLesson lesson;
  final String status;
  final bool done;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Pressable(
    child: Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        key: Key('dua-lesson-${lesson.number}'),
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.fromLTRB(14, 14, 10, 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: lineColor),
          ),
          child: Row(
            children: [
              CircleAvatar(
                backgroundColor: done ? duasAccent : duasTint,
                foregroundColor: done ? Colors.white : _deepAccent,
                child: Text(
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
                    const SizedBox(height: 4),
                    Text(
                      lesson.arabic.split('\n').first,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      textDirection: TextDirection.rtl,
                      style: const TextStyle(
                        fontFamily: _arabicFont,
                        fontSize: 17,
                        color: brandNavy,
                        height: 1.6,
                      ),
                    ),
                    Text(
                      status,
                      style: const TextStyle(
                        color: mutedInk,
                        fontSize: 13,
                        height: 1.3,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                done ? Icons.check_circle_outline : Icons.chevron_right,
                color: duasAccent,
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

class DuaLessonScreen extends StatefulWidget {
  const DuaLessonScreen({
    super.key,
    required this.lesson,
    required this.volume,
    required this.progress,
    required this.onSave,
  });
  final DuaLesson lesson;
  final DuaVolume volume;
  final DuaProgress progress;
  final Future<void> Function(DuaProgress) onSave;
  @override
  State<DuaLessonScreen> createState() => _DuaLessonScreenState();
}

class _DuaLessonScreenState extends State<DuaLessonScreen> {
  /// Stars for this dua; the volume's badge once all ten are finished.
  void _reward() => celebrateFinish(
    context,
    course: 'duas',
    item: _l.id,
    group: 'volume-${widget.volume.number}',
    groupTitle: widget.volume.title,
    groupItems: widget.volume.lessons.map((l) => l.id),
  );

  late DuaProgress _progress = widget.progress;
  late bool _summary = _progress.explored;
  late String? _reflection = _progress.reflection;
  late final List<String> _choices = meaningChoices(
    widget.lesson,
    widget.volume.lessons,
  );
  late final List<int> _pool = _shuffledPool();
  final List<int> _built = [];
  bool _busy = false, _hidden = false, _reflectionSaved = false;
  bool _buildMiss = false;
  int? _choice;
  String? _error;
  final _scroll = ScrollController();

  static const _last = 4;

  DuaLesson get _l => widget.lesson;
  bool get _correct => _choice != null && _choices[_choice!] == _l.english;
  bool get _canBuild => _l.chunksRebuildArabic && _l.memoryChunks.length > 1;

  /// A fixed scramble of the chunk order (never the original order).
  List<int> _shuffledPool() {
    final n = _l.memoryChunks.length;
    final order = List.generate(n, (i) => i);
    if (n < 2) return order;
    final shift = 1 + _l.number % (n - 1);
    return [for (var i = 0; i < n; i++) order[(i + shift) % n]];
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  Future<bool> _persist(DuaProgress value) async {
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

  void _top() {
    if (_scroll.hasClients) _scroll.jumpTo(0);
  }

  Future<void> _step(int step) async {
    if (await _persist(_progress.copyWith(step: step)) && mounted) {
      setState(() => _hidden = false);
      _top();
    }
  }

  Future<void> _next() async {
    if (_progress.step < _last) return _step(_progress.step + 1);
    final first = _progress.completedAt == null;
    final saved = await _persist(
      _progress.copyWith(
        completedAt: _progress.completedAt ?? DateTime.now().toUtc(),
      ),
    );
    if (saved && mounted) {
      if (first) _reward();
      setState(() => _summary = true);
      _top();
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
      key: const Key('dua-lesson-screen'),
      backgroundColor: canvas,
      appBar: AppBar(
        leading: BackButton(onPressed: _busy ? null : _back),
        title: Text('Dua ${_l.number}'),
      ),
      body: SafeArea(
        child: ConstrainedBody(
          maxWidth: 640,
          child: Column(
            children: [
              if (!_summary) ...[
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 10),
                  child: Row(
                    children: [
                      Text(
                        'Step ${_progress.step + 1} of ${duaSteps.length}',
                        style: const TextStyle(
                          color: _deepAccent,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          duaSteps[_progress.step],
                          key: const Key('dua-step-title'),
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
                  value: (_progress.step + 1) / duaSteps.length,
                  minHeight: 3,
                  color: duasAccent,
                  backgroundColor: const Color(0xFFE5E9F0),
                ),
              ],
              Expanded(
                // Not lazy: a lesson page is short and should be built whole.
                child: SingleChildScrollView(
                  controller: _scroll,
                  padding: const EdgeInsets.fromLTRB(18, 20, 18, 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: _summary ? _finish() : _content(),
                  ),
                ),
              ),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                  child: Semantics(
                    liveRegion: true,
                    child: Text(
                      _error!,
                      key: const Key('dua-save-error'),
                      style: const TextStyle(color: dangerInk),
                    ),
                  ),
                ),
              Padding(
                padding: const EdgeInsets.fromLTRB(18, 10, 18, 16),
                child: SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    key: const Key('dua-next'),
                    style: FilledButton.styleFrom(
                      backgroundColor: brandNavy,
                      minimumSize: const Size(48, 52),
                    ),
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
                                ? 'Back to duas'
                                : _progress.step == _last
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

  List<Widget> _content() => switch (_progress.step) {
    0 => _storyStep(),
    1 => _learnStep(),
    2 => _rememberStep(),
    3 => _checkStep(),
    _ => _actionStep(),
  };

  List<Widget> _storyStep() => [
    Text(_l.title, style: displayStyle(26, color: ink, height: 1.2)),
    if (_l.tagline != null) ...[
      const SizedBox(height: 8),
      Text(
        _l.tagline!,
        style: const TextStyle(
          color: _deepAccent,
          fontSize: 12,
          fontWeight: FontWeight.w800,
          letterSpacing: .5,
          height: 1.4,
        ),
      ),
    ],
    const SizedBox(height: 20),
    _heading('A moment with Imaan & Akhlaq'),
    const SizedBox(height: 12),
    for (final p in _l.story)
      Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Text(
          p,
          style: const TextStyle(fontSize: 18, height: 1.6, color: ink),
        ),
      ),
    const SizedBox(height: 6),
    const Text(
      'A fictional teaching story, not a historical report.',
      style: TextStyle(color: mutedInk, fontSize: 12),
    ),
  ];

  List<Widget> _learnStep() => [
    _heading('Words to remember'),
    const SizedBox(height: 16),
    _arabicCard(_l.arabic, key: const Key('dua-arabic')),
    if (_l.transliteration != null) ...[
      const SizedBox(height: 12),
      Text(
        _l.transliteration!,
        textAlign: TextAlign.center,
        style: const TextStyle(
          fontSize: 17,
          height: 1.5,
          fontStyle: FontStyle.italic,
          color: brandNavy,
        ),
      ),
    ],
    const SizedBox(height: 22),
    _heading('What it means'),
    const SizedBox(height: 10),
    Text(
      _l.english,
      key: const Key('dua-english'),
      style: const TextStyle(
        fontSize: 20,
        height: 1.45,
        fontWeight: FontWeight.w700,
        color: ink,
      ),
    ),
    if (_l.urdu != null) ...[
      const SizedBox(height: 12),
      Text(
        _l.urdu!,
        textDirection: TextDirection.rtl,
        textAlign: TextAlign.right,
        style: const TextStyle(
          fontFamily: _arabicFont,
          fontSize: 19,
          height: 1.8,
          color: ink,
        ),
      ),
    ],
    if (_l.occasion != null) ...[
      const SizedBox(height: 18),
      _infoCard(Icons.schedule_outlined, 'When to say it', _l.occasion!),
    ],
    const SizedBox(height: 18),
    for (final p in _l.understand)
      Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Text(p, style: const TextStyle(fontSize: 17, height: 1.6)),
      ),
    const SizedBox(height: 6),
    Text(
      _l.source,
      style: const TextStyle(fontWeight: FontWeight.w700, color: brandNavy),
    ),
    Wrap(
      spacing: 4,
      children: [
        if (_l.sourceUrl != null)
          TextButton.icon(
            key: const Key('dua-source'),
            onPressed: _openSource,
            icon: const Icon(Icons.open_in_new, size: 16),
            label: const Text('Open the source'),
          ),
        TextButton.icon(
          key: const Key('dua-source-details'),
          onPressed: _details,
          icon: const Icon(Icons.menu_book_outlined, size: 16),
          label: const Text('Source details'),
        ),
      ],
    ),
  ];

  List<Widget> _rememberStep() {
    final chunks = _l.memoryChunks;
    return [
      _heading('A little at a time'),
      const SizedBox(height: 10),
      Text(
        _l.memorizeSteps,
        style: const TextStyle(fontSize: 16, height: 1.55),
      ),
      const SizedBox(height: 18),
      if (!_hidden)
        for (var i = 0; i < chunks.length; i++)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _chunkTile(i + 1, chunks[i]),
          )
      else
        Container(
          key: const Key('dua-memory-hidden'),
          padding: const EdgeInsets.all(26),
          decoration: cardDecoration(),
          child: const Text(
            'Take your time. Say what you remember.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 19, height: 1.5, color: ink),
          ),
        ),
      const SizedBox(height: 8),
      OutlinedButton(
        key: const Key('dua-hide-words'),
        onPressed: () => setState(() => _hidden = !_hidden),
        child: Text(_hidden ? 'Show words' : 'Hide words'),
      ),
      if (_canBuild) ...[const SizedBox(height: 26), ..._buildPuzzle()],
      const SizedBox(height: 14),
      const Text(
        'Practice counts here are for learning, not a religious count.',
        style: TextStyle(color: mutedInk, fontSize: 12, height: 1.5),
      ),
    ];
  }

  List<Widget> _buildPuzzle() {
    final chunks = _l.memoryChunks;
    final done = _built.length == chunks.length;
    return [
      _heading('Build the words'),
      const SizedBox(height: 6),
      const Text(
        'Tap the parts in the right order. Optional, just for practice.',
        style: TextStyle(color: mutedInk, height: 1.5),
      ),
      const SizedBox(height: 12),
      Container(
        key: const Key('dua-build-answer'),
        width: double.infinity,
        constraints: const BoxConstraints(minHeight: 64),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: done ? const Color(0xFFE8F4ED) : Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: done ? successInk : lineColor),
        ),
        child: Text(
          _built.isEmpty ? '…' : _built.map((i) => chunks[i]).join(' '),
          textDirection: TextDirection.rtl,
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontFamily: _arabicFont,
            fontSize: 22,
            height: 1.8,
            color: brandNavy,
          ),
        ),
      ),
      const SizedBox(height: 10),
      if (done)
        Semantics(
          liveRegion: true,
          child: const Text(
            'You put every part in order.',
            key: Key('dua-build-done'),
            style: TextStyle(color: successInk, fontWeight: FontWeight.w700),
          ),
        )
      else
        Wrap(
          spacing: 8,
          runSpacing: 8,
          alignment: WrapAlignment.center,
          textDirection: TextDirection.rtl,
          children: [
            for (final i in _pool)
              if (!_built.contains(i))
                OutlinedButton(
                  key: Key('dua-build-chunk-$i'),
                  onPressed: () => setState(() {
                    if (i == _built.length) {
                      _built.add(i);
                      _buildMiss = false;
                    } else {
                      _buildMiss = true;
                    }
                  }),
                  style: OutlinedButton.styleFrom(
                    backgroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 8,
                    ),
                  ),
                  child: Text(
                    chunks[i],
                    textDirection: TextDirection.rtl,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontFamily: _arabicFont,
                      fontSize: 19,
                      height: 1.7,
                      color: brandNavy,
                    ),
                  ),
                ),
          ],
        ),
      if (_buildMiss && !done)
        const Padding(
          padding: EdgeInsets.only(top: 8),
          child: Text(
            'Not that part yet. Look at the words above and try again.',
            key: Key('dua-build-miss'),
            style: TextStyle(color: _deepAccent),
          ),
        ),
      if (_built.isNotEmpty && !done)
        TextButton(
          onPressed: () => setState(() {
            _built.clear();
            _buildMiss = false;
          }),
          child: const Text('Start again'),
        ),
    ];
  }

  List<Widget> _checkStep() => [
    _heading('Which meaning matches?'),
    const SizedBox(height: 12),
    _arabicCard(_l.arabic, compact: true),
    const SizedBox(height: 18),
    for (var i = 0; i < _choices.length; i++)
      Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: OutlinedButton(
          key: Key('dua-answer-$i'),
          onPressed: _busy
              ? null
              : () {
                  VoiceGuide.instance.play(
                    _choices[i] == _l.english
                        ? VoiceLine.correct
                        : VoiceLine.tryAgain,
                  );
                  setState(() => _choice = i);
                },
          style: OutlinedButton.styleFrom(
            alignment: Alignment.centerLeft,
            padding: const EdgeInsets.all(16),
            minimumSize: const Size(48, 56),
            backgroundColor: _choice == i ? duasTint : Colors.white,
            side: BorderSide(
              color: _choice == i ? duasAccent : const Color(0xFFCBD3E1),
            ),
          ),
          child: Text(
            _choices[i],
            style: const TextStyle(fontSize: 16, height: 1.4, color: ink),
          ),
        ),
      ),
    if (_choice != null)
      Semantics(
        liveRegion: true,
        child: Container(
          key: const Key('dua-feedback'),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: _correct ? const Color(0xFFE8F4ED) : const Color(0xFFFFEFD9),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Text(
            _correct
                ? (_l.missionFeedback ?? 'Yes, that is what these words mean.')
                : 'Not quite. Read the words and their meaning again, then try another answer.',
            style: const TextStyle(fontSize: 16, height: 1.5, color: ink),
          ),
        ),
      ),
  ];

  List<Widget> _actionStep() => [
    _heading('Today’s one action'),
    const SizedBox(height: 14),
    Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: duasTint,
        borderRadius: BorderRadius.circular(22),
      ),
      child: Text(
        _l.action,
        key: const Key('dua-action'),
        style: const TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          height: 1.5,
          color: ink,
        ),
      ),
    ),
    const SizedBox(height: 18),
    const Text(
      'Try it when a suitable moment comes. You can come back later to reflect on how it went.',
      style: TextStyle(fontSize: 17, height: 1.6),
    ),
  ];

  List<Widget> _finish() => [
    const Icon(Icons.local_florist_outlined, size: 56, color: duasAccent),
    const SizedBox(height: 16),
    _heading('A small step to try', centered: true),
    const SizedBox(height: 10),
    const Text(
      'You explored this dua and saved your action plan.',
      textAlign: TextAlign.center,
      style: TextStyle(fontSize: 17, height: 1.5),
    ),
    const SizedBox(height: 20),
    _arabicCard(_l.arabic, compact: true),
    const SizedBox(height: 16),
    Text(
      _l.action,
      style: const TextStyle(
        fontSize: 18,
        height: 1.5,
        fontWeight: FontWeight.w700,
        color: ink,
      ),
    ),
    const SizedBox(height: 24),
    _heading('A moment to reflect'),
    const SizedBox(height: 8),
    if (_l.reflect != null)
      Text(
        _l.reflect!,
        key: const Key('dua-reflect-question'),
        style: const TextStyle(fontSize: 17, height: 1.5, color: ink),
      ),
    const SizedBox(height: 14),
    const Text(
      'Did you get a chance to try your action? Every answer is okay.',
      style: TextStyle(fontSize: 15, height: 1.5, color: mutedInk),
    ),
    const SizedBox(height: 10),
    for (final entry in const {
      'yes': 'Yes',
      'tried': 'I tried',
      'notYet': 'Not yet',
    }.entries)
      Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: OutlinedButton(
          key: Key('dua-reflect-${entry.key}'),
          style: OutlinedButton.styleFrom(
            alignment: Alignment.centerLeft,
            minimumSize: const Size(double.infinity, 48),
            backgroundColor: _reflection == entry.key ? duasTint : Colors.white,
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
      key: const Key('dua-save-reflection'),
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
    const SizedBox(height: 16),
    const Text(
      'Come back tomorrow for a gentle revision.',
      style: TextStyle(color: mutedInk, height: 1.5),
    ),
    TextButton(
      key: const Key('dua-read-again'),
      onPressed: _busy
          ? null
          : () async {
              if (await _persist(_progress.copyWith(step: 0)) && mounted) {
                setState(() {
                  _summary = false;
                  _choice = null;
                  _built.clear();
                });
                _top();
              }
            },
      child: const Text('Learn this dua again'),
    ),
  ];

  Widget _heading(String text, {bool centered = false}) => Text(
    text,
    textAlign: centered ? TextAlign.center : TextAlign.start,
    style: displayStyle(23, color: ink, height: 1.25),
  );

  Widget _infoCard(IconData icon, String label, String text) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: duasTint,
      borderRadius: BorderRadius.circular(16),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: _deepAccent, size: 22),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  color: _deepAccent,
                ),
              ),
              const SizedBox(height: 4),
              Text(text, style: const TextStyle(height: 1.5, color: ink)),
            ],
          ),
        ),
      ],
    ),
  );

  Widget _chunkTile(int n, String text) => Container(
    padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
    decoration: cardDecoration(),
    child: Row(
      children: [
        CircleAvatar(
          radius: 14,
          backgroundColor: duasTint,
          foregroundColor: _deepAccent,
          child: Text(
            '$n',
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            textDirection: TextDirection.rtl,
            textAlign: TextAlign.right,
            style: TextStyle(
              fontFamily: _arabicFont,
              fontSize: _arabicSize(text) - 3,
              height: 1.85,
              color: brandNavy,
            ),
          ),
        ),
      ],
    ),
  );

  Widget _arabicCard(String text, {Key? key, bool compact = false}) =>
      Container(
        width: double.infinity,
        padding: EdgeInsets.all(compact ? 16 : 22),
        decoration: cardDecoration(),
        child: Text(
          text,
          key: key,
          textDirection: TextDirection.rtl,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontFamily: _arabicFont,
            fontSize: _arabicSize(text) - (compact ? 4 : 0),
            height: 1.9,
            color: brandNavy,
          ),
        ),
      );

  void _details() => showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    backgroundColor: Colors.white,
    builder: (_) => DuaSourceSheet(lesson: _l, volume: widget.volume),
  );

  Future<void> _openSource() async {
    try {
      if (!await launchUrl(
        Uri.parse(_l.sourceUrl!),
        mode: LaunchMode.externalApplication,
      )) {
        throw StateError('Unavailable');
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not open the source. ${_l.source}')),
        );
      }
    }
  }
}

/// Everything the source says about one dua, verbatim: the full "words"
/// panel, context sections, the adult guidance and the editorial note.
class DuaSourceSheet extends StatelessWidget {
  const DuaSourceSheet({super.key, required this.lesson, required this.volume});
  final DuaLesson lesson;
  final DuaVolume volume;

  @override
  Widget build(BuildContext context) => DraggableScrollableSheet(
    expand: false,
    initialChildSize: .85,
    maxChildSize: .95,
    builder: (context, controller) => ListView(
      key: const Key('dua-source-sheet'),
      controller: controller,
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
      children: [
        Text('Source details', style: displayStyle(22, color: ink)),
        const SizedBox(height: 6),
        Text(
          'Volume ${volume.number} • ${volume.sourceDocument}',
          style: const TextStyle(color: mutedInk, fontSize: 12, height: 1.4),
        ),
        const SizedBox(height: 16),
        ...lesson.words.map(_block),
        for (final s in lesson.extras) ...[
          const SizedBox(height: 14),
          _label(s.heading),
          ...s.blocks.map(_block),
        ],
        if (lesson.guidance != null) ...[
          const SizedBox(height: 14),
          _label(lesson.guidanceLabel ?? 'Parent / teacher'),
          _plain(lesson.guidance!),
        ],
        if (lesson.editorialNote != null) ...[
          const SizedBox(height: 14),
          _label('Editorial / source note'),
          _plain(lesson.editorialNote!),
        ],
        const SizedBox(height: 18),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: duasTint,
            borderRadius: BorderRadius.circular(14),
          ),
          child: Text(
            volume.reviewStatus,
            style: const TextStyle(fontSize: 13, height: 1.5, color: ink),
          ),
        ),
      ],
    ),
  );

  static bool _rtl(String s) =>
      RegExp(r'[؀-ۿ]').hasMatch(s) && !RegExp(r'[A-Za-z]').hasMatch(s);

  Widget _label(String text) => Padding(
    padding: const EdgeInsets.only(bottom: 6),
    child: Text(
      text,
      style: const TextStyle(
        color: _deepAccent,
        fontWeight: FontWeight.w800,
        fontSize: 12,
        letterSpacing: .5,
      ),
    ),
  );

  Widget _plain(String text) => Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: Text(text, style: const TextStyle(height: 1.55, color: ink)),
  );

  Widget _rtlText(String text, {double size = 20}) => Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: Text(
      text,
      textDirection: TextDirection.rtl,
      textAlign: TextAlign.right,
      style: TextStyle(
        fontFamily: _arabicFont,
        fontSize: size,
        height: 1.85,
        color: brandNavy,
      ),
    ),
  );

  Widget _block(DuaBlock b) => switch (b.type) {
    'arabic' => _rtlText(b.text, size: 22),
    'urdu' => _rtlText(b.text, size: 18),
    'link' => _plain(b.text),
    'translit' => Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Text(
        b.text,
        style: const TextStyle(fontStyle: FontStyle.italic, height: 1.5),
      ),
    ),
    'field' => Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            b.label ?? '',
            style: const TextStyle(fontWeight: FontWeight.w800, color: ink),
          ),
          const SizedBox(height: 2),
          if (_rtl(b.text))
            _rtlText(b.text)
          else
            Text(b.text, style: const TextStyle(height: 1.5, color: ink)),
        ],
      ),
    ),
    _ => _plain(b.text),
  };
}
