import 'package:flutter/material.dart';
import '../../app_theme.dart';
import '../../screens/ui_kit.dart';
import 'quran_data.dart';
import 'quran_progress.dart';
import 'quran_screens.dart';

const _soft = Color(0xFFF7F8FB);

/// Verse Studio + the universal six-step lesson (source §3) for any passage.
///
/// The Arabic text and audio are NOT in the source, so Hear it / See it show
/// a pending state and the child practises with an adult and a printed
/// muṣḥaf. Nothing is recorded; review works without a microphone.
class QuranPassageScreen extends StatefulWidget {
  const QuranPassageScreen({super.key, required this.c, required this.passageId});
  final QuranController c;
  final String passageId;
  @override
  State<QuranPassageScreen> createState() => _QuranPassageScreenState();
}

class _QuranPassageScreenState extends State<QuranPassageScreen> {
  QuranController get c => widget.c;
  QuranPassage get passage => c.data!.passage(widget.passageId);
  late PassageProgress _p = c.progress.of(widget.passageId);
  late int _step = _p.step;
  int _loop = 3, _count = 0;
  RecallResult? _recall;
  String? _error;
  final _scroll = ScrollController();

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  Future<bool> _save(PassageProgress next) async {
    setState(() => _error = null);
    final ok = await c.updatePassage(passage.id, next);
    if (!mounted) return ok;
    setState(() {
      if (ok) {
        _p = next;
      } else {
        _error = 'Your progress was not saved. Please try again.';
      }
    });
    return ok;
  }

  Future<void> _go(int step) async {
    var next = _p.copyWith(step: step, repetitions: _p.repetitions + _count);
    // Leaving "Recall it" applies the recall result to the review plan.
    if (_step == 4 && step == 5 && _recall != null) {
      next = c.engine.recall(next, _recall!, c.now());
    }
    if (_p.mastery == null && step > 0) {
      next = next.copyWith(mastery: next.mastery ?? Mastery.practicing);
    }
    if (await _save(next) && mounted) {
      setState(() {
        _step = step;
        _count = 0;
      });
      if (_scroll.hasClients) _scroll.jumpTo(0);
    }
  }

  void _back() {
    if (c.saving) return;
    if (_step > 0) {
      _go(_step - 1);
    } else {
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    final steps = c.data!.steps;
    return PopScope(
      canPop: !c.saving && _step == 0,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _back();
      },
      child: Scaffold(
        key: const Key('quran-lesson'),
        appBar: AppBar(
          leading: BackButton(onPressed: _back),
          title: Text(passage.displayTitle),
        ),
        body: SafeArea(
          child: ListenableBuilder(
            listenable: c,
            builder: (context, _) => ConstrainedBody(
              maxWidth: 640,
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 10),
                    child: Row(
                      children: [
                        Text(
                          'Step ${_step + 1} of 6',
                          style: const TextStyle(
                            color: quranAccent,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            steps[_step].name,
                            key: const Key('quran-step-title'),
                            style: const TextStyle(color: ink, fontWeight: FontWeight.w700),
                          ),
                        ),
                      ],
                    ),
                  ),
                  LinearProgressIndicator(
                    value: (_step + 1) / 6,
                    minHeight: 3,
                    color: quranAccent,
                    backgroundColor: const Color(0xFFE5E9F0),
                  ),
                  Expanded(
                    child: ListView(
                      controller: _scroll,
                      padding: const EdgeInsets.all(20),
                      children: [
                        _header(),
                        const SizedBox(height: 16),
                        Text(
                          steps[_step].text,
                          style: const TextStyle(color: mutedInk, height: 1.45),
                        ),
                        const SizedBox(height: 16),
                        ..._content(),
                      ],
                    ),
                  ),
                  if (_error != null)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                      child: Semantics(
                        liveRegion: true,
                        child: Text(
                          _error!,
                          key: const Key('quran-save-error'),
                          style: const TextStyle(color: dangerInk),
                        ),
                      ),
                    ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 10, 20, 16),
                    child: SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        key: const Key('quran-next'),
                        onPressed: c.saving || (_step == 4 && _recall == null)
                            ? null
                            : _step == 5
                            ? () => Navigator.pop(context)
                            : () => _go(_step + 1),
                        child: c.saving
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : Text(
                                _step == 5
                                    ? 'Done for today'
                                    : _step == 4
                                    ? 'Save and plan my review'
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
      ),
    );
  }

  Widget _header() {
    final juz = passage.juz.join(' & ');
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            passage.range.label,
            key: const Key('quran-lesson-range'),
            style: displayStyle(24, color: quranAccent),
          ),
          const SizedBox(height: 2),
          Text(
            '${passage.range.count} ${passage.range.count == 1 ? 'ayah' : 'ayahs'} • Juz $juz',
            style: const TextStyle(color: mutedInk),
          ),
          if (passage.juz.length > 1) ...[
            const SizedBox(height: 4),
            Text(
              'One surah lesson across Juz $juz; it continues without a gap.',
              style: const TextStyle(color: mutedInk, fontSize: 13),
            ),
          ],
          const SizedBox(height: 10),
          LabelChips(c: c, labels: passage.labels),
          const SizedBox(height: 8),
          Text(
            c.status(passage.id),
            key: const Key('quran-lesson-status'),
            style: const TextStyle(color: ink, fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }

  List<Widget> _content() => switch (_step) {
    0 => [
      PendingPanel(
        title: 'Recitation audio pending review',
        body:
            'A licensed, verified human recitation (Ḥafṣ ʿan ʿĀṣim) will be added after review; the app never uses a synthetic voice. For now, listen to a parent or teacher recite ${passage.range.label} from a printed muṣḥaf, as many times as you like.',
      ),
      const SizedBox(height: 14),
      _mode(c.data!.modes[0]),
    ],
    1 => [
      PendingPanel(
        title: 'Arabic text pending verified Uthmānī import',
        body:
            'The Qur’an text will come from a checksum-verified Uthmānī edition, never typed by hand. Until then, read it from a printed muṣḥaf. These are the ayahs of this lesson, in order:',
      ),
      const SizedBox(height: 12),
      Wrap(
        key: const Key('quran-ayah-slots'),
        spacing: 6,
        runSpacing: 6,
        children: [
          for (final a in passage.range.ayahs)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: _soft,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: lineColor),
              ),
              child: Text(
                '$a',
                style: const TextStyle(color: ink, fontWeight: FontWeight.w700),
              ),
            ),
        ],
      ),
      if (passage.chunks.isNotEmpty || passage.chunkNote != null) ...[
        const SizedBox(height: 16),
        _chunkPlan(),
      ],
    ],
    2 => _sayIt(),
    3 => _understand(),
    4 => _recallStep(),
    _ => _keep(),
  };

  Widget _chunkPlan() => _Box(
    title: 'Editor-approved chunk plan',
    children: [
      if (passage.chunks.isNotEmpty)
        Text(
          passage.chunks.map((r) => r.label).join(' • '),
          style: const TextStyle(color: ink, height: 1.5),
        ),
      if (passage.chunkNote != null)
        Text(passage.chunkNote!, style: const TextStyle(color: mutedInk, height: 1.45)),
      if (passage.range.surah == 2)
        const Text(
          'Phrase boundaries are pending editorial approval.',
          style: TextStyle(color: mutedInk, height: 1.45),
        ),
    ],
  );

  Widget _mode(PracticeMode m) => _Box(
    title: m.name,
    children: [
      Text(m.action, style: const TextStyle(color: ink, height: 1.4)),
      Text('Use: ${m.use}', style: const TextStyle(color: mutedInk, height: 1.4)),
    ],
  );

  List<Widget> _sayIt() {
    final modes = c.data!.modes;
    final total = _p.repetitions + _count;
    return [
      _mode(modes[1]),
      const SizedBox(height: 12),
      _Box(
        title: modes[2].name,
        children: [
          Text(modes[2].action, style: const TextStyle(color: mutedInk, height: 1.4)),
          const SizedBox(height: 4),
          SegmentedButton<int>(
            segments: const [
              ButtonSegment(value: 3, label: Text('× 3')),
              ButtonSegment(value: 5, label: Text('× 5')),
              ButtonSegment(value: 10, label: Text('× 10')),
            ],
            selected: {_loop},
            showSelectedIcon: false,
            onSelectionChanged: (s) => setState(() {
              _loop = s.first;
              _count = 0;
            }),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              for (var i = 0; i < _loop; i++)
                Icon(
                  i < _count ? Icons.circle : Icons.circle_outlined,
                  size: 18,
                  color: quranAccent,
                ),
            ],
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              key: const Key('quran-said-it'),
              onPressed: _count >= _loop ? null : () => setState(() => _count++),
              icon: const Icon(Icons.record_voice_over_outlined),
              label: Text(_count >= _loop ? 'Loop finished, well done' : 'I said it'),
            ),
          ),
          Text(
            'Repetitions so far: $total. You can stop anytime.',
            key: const Key('quran-repetitions'),
            style: const TextStyle(color: mutedInk, fontSize: 13),
          ),
        ],
      ),
      if (passage.chunks.isNotEmpty) ...[
        const SizedBox(height: 12),
        _Box(
          title: 'Echo and join',
          children: [
            const Text(
              'Repeat each approved chunk, then combine them into the full passage.',
              style: TextStyle(color: mutedInk, height: 1.4),
            ),
            for (final (i, r) in passage.chunks.indexed)
              CheckboxListTile(
                key: Key('quran-chunk-$i'),
                contentPadding: EdgeInsets.zero,
                value: _p.chunksDone.contains(i),
                title: Text(r.label),
                onChanged: c.saving
                    ? null
                    : (v) => _save(
                        _p.copyWith(
                          chunksDone: v == true
                              ? {..._p.chunksDone, i}
                              : ({..._p.chunksDone}..remove(i)),
                        ),
                      ),
              ),
          ],
        ),
      ],
      const SizedBox(height: 12),
      const Text(
        'Private recording is not part of this version. Nothing is recorded and no voice leaves this device.',
        style: TextStyle(color: mutedInk, fontSize: 12, height: 1.45),
      ),
    ];
  }

  List<Widget> _understand() {
    final d = c.data!;
    final m = d.masnunFor(passage);
    final focus = <String>{
      for (final z in d.juz)
        for (final s in z.selections)
          if (s.passageId == passage.id) 'Juz ${z.number}: ${z.focus}',
    };
    return [
      if (m != null) ...[
        _Box(
          key: const Key('quran-sunnah-context'),
          title: 'Sunnah context • ${m.id}',
          children: [
            Text(m.context, style: const TextStyle(color: ink, height: 1.45)),
            Text('Source: ${m.source}', style: const TextStyle(color: mutedInk)),
            Align(
              alignment: AlignmentDirectional.centerStart,
              child: TextButton.icon(
                onPressed: () => openSource(m.sourceUrl),
                icon: const Icon(Icons.open_in_new_rounded, size: 18),
                label: const Text('Open the reference'),
              ),
            ),
            const Text(
              'Wording of this context is pending Hadith review before release.',
              style: TextStyle(color: mutedInk, fontSize: 12),
            ),
          ],
        ),
        const SizedBox(height: 12),
      ],
      for (final l in passage.labels)
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: _Box(
            title: '$l • ${d.label(l).name}',
            children: [
              Text(d.label(l).meaning, style: const TextStyle(color: ink, height: 1.4)),
              Text(d.label(l).rule, style: const TextStyle(color: mutedInk, height: 1.4)),
            ],
          ),
        ),
      if (passage.publicationRule != null) ...[
        _Box(
          title: 'How we talk about this passage',
          children: [
            Text(passage.publicationRule!, style: const TextStyle(color: ink, height: 1.4)),
          ],
        ),
        const SizedBox(height: 12),
      ],
      if (focus.isNotEmpty || passage.storyboardTheme != null) ...[
        _Box(
          title: 'Learning focus',
          children: [
            for (final f in focus) Text(f, style: const TextStyle(color: ink, height: 1.4)),
            if (passage.storyboardTheme != null)
              Text(passage.storyboardTheme!, style: const TextStyle(color: ink, height: 1.4)),
          ],
        ),
        const SizedBox(height: 12),
      ],
      const PendingPanel(
        title: 'Child-friendly meaning pending review',
        body:
            'A short, accurate meaning in English and Urdu will be added after a Tafsir editor reviews it. The app does not invent meanings or Tafsir.',
      ),
    ];
  }

  List<Widget> _recallStep() {
    final modes = c.data!.modes;
    const options = [
      (RecallResult.onMyOwn, 'I recited it on my own', Icons.star_rounded),
      (RecallResult.withHelp, 'I needed some help', Icons.handshake_outlined),
      (RecallResult.stillPractising, 'I am still practising', Icons.spa_outlined),
    ];
    return [
      for (final m in modes.sublist(3, 6)) ...[_mode(m), const SizedBox(height: 10)],
      const SizedBox(height: 6),
      Text('With a parent or teacher listening', style: displayStyle(19)),
      const SizedBox(height: 4),
      const Text(
        'Close the muṣḥaf and recite from memory. How did it go?',
        style: TextStyle(color: mutedInk, height: 1.4),
      ),
      const SizedBox(height: 10),
      for (final (value, text, icon) in options) ...[
        Pressable(
          child: Material(
            color: _recall == value ? const Color(0xFFFCE8F0) : _soft,
            borderRadius: BorderRadius.circular(16),
            child: InkWell(
              key: Key('quran-recall-${value.name}'),
              borderRadius: BorderRadius.circular(16),
              onTap: () => setState(() => _recall = value),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Row(
                  children: [
                    Icon(icon, color: quranAccent),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        text,
                        style: const TextStyle(fontWeight: FontWeight.w700, color: ink),
                      ),
                    ),
                    if (_recall == value)
                      const Icon(Icons.check_circle, color: quranAccent),
                  ],
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
      ],
      const Text(
        'Pronunciation is not scored by the app. A qualified adult certifies correct recitation.',
        style: TextStyle(color: mutedInk, fontSize: 12, height: 1.45),
      ),
    ];
  }

  List<Widget> _keep() {
    final d = c.data!;
    final now = c.now();
    return [
      _Box(
        key: const Key('quran-keep-plan'),
        title: d.revision.mastery[(_p.mastery ?? Mastery.practicing).index],
        children: [
          Text(
            _p.nextReview == null
                ? 'Keep practising with Hear it and Say it. There is no rush.'
                : 'Next review: ${friendlyDate(_p.nextReview!, now)}.',
            key: const Key('quran-next-review'),
            style: const TextStyle(color: ink, fontWeight: FontWeight.w700, height: 1.4),
          ),
          Text(d.revision.note, style: const TextStyle(color: mutedInk, height: 1.4, fontSize: 13)),
        ],
      ),
      const SizedBox(height: 14),
      Text('Would you like to practise again?', style: displayStyle(19)),
      const SizedBox(height: 8),
      SizedBox(
        width: double.infinity,
        child: OutlinedButton(
          key: const Key('quran-practise-again'),
          onPressed: c.saving ? null : () => _go(2),
          child: const Text('Practise again'),
        ),
      ),
      const SizedBox(height: 12),
      const Text(
        'Missed days are fine. Pause, then come back when you are ready.',
        style: TextStyle(color: mutedInk, fontSize: 13),
      ),
    ];
  }
}

class _Box extends StatelessWidget {
  const _Box({super.key, required this.title, required this.children});
  final String title;
  final List<Widget> children;
  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(16),
    decoration: cardDecoration(),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: displayStyle(17)),
        const SizedBox(height: 6),
        for (final (i, child) in children.indexed) ...[
          if (i > 0) const SizedBox(height: 6),
          child,
        ],
      ],
    ),
  );
}

Future<ReviewResult?> _askOutcome(BuildContext context, QuranController c, String title) =>
    showModalBottomSheet<ReviewResult>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (context) => SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(title, style: displayStyle(20)),
              const SizedBox(height: 4),
              const Text(
                'Recite from memory with an adult listening, then choose:',
                style: TextStyle(color: mutedInk),
              ),
              const SizedBox(height: 12),
              for (final o in c.data!.revision.outcomes) ...[
                Material(
                  color: _soft,
                  borderRadius: BorderRadius.circular(16),
                  child: InkWell(
                    key: Key('quran-outcome-${o.id}'),
                    borderRadius: BorderRadius.circular(16),
                    onTap: () => Navigator.pop(
                      context,
                      ReviewResult.values.byName(o.id),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(o.after, style: const TextStyle(fontWeight: FontWeight.w800, color: ink)),
                          const SizedBox(height: 2),
                          Text(o.next, style: const TextStyle(color: mutedInk, height: 1.35)),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
              ],
            ],
          ),
        ),
      ),
    );

/// Revision Garden: reviews due today, what is coming, and what is kept.
class QuranRevisionScreen extends StatelessWidget {
  const QuranRevisionScreen({super.key, required this.c});
  final QuranController c;

  Future<void> _review(BuildContext context, String id) async {
    final passage = c.data!.passage(id);
    final r = await _askOutcome(context, c, passage.displayTitle);
    if (r == null) return;
    final ok = await c.updatePassage(id, c.engine.review(c.progress.of(id), r, c.now()));
    if (!ok && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Your review was not saved. Please try again.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    key: const Key('quran-garden'),
    appBar: AppBar(title: const Text('Revision Garden')),
    body: SafeArea(
      child: ListenableBuilder(
        listenable: c,
        builder: (context, _) {
          final d = c.data!;
          final p = c.progress;
          final now = c.now();
          final due = p.due(now);
          final upcoming = [
            for (final e in p.passages.entries)
              if (e.value.nextReview != null && !e.value.isDue(now)) e.key,
          ]..sort((a, b) => p.of(a).nextReview!.compareTo(p.of(b).nextReview!));
          final kept = [
            for (final e in p.passages.entries)
              if (e.value.mastery == Mastery.retained) e.key,
          ];
          return ConstrainedBody(
            maxWidth: 640,
            child: ListView(
              padding: const EdgeInsets.all(18),
              children: [
                if (p.paused)
                  const PendingPanel(
                    title: 'Reviews are paused',
                    body: 'A parent or teacher paused the review plan. You can still open any lesson.',
                  )
                else if (due.isEmpty)
                  const Text(
                    'Nothing is due right now. Learn something new or come back later.',
                    key: Key('quran-garden-empty'),
                    style: TextStyle(color: mutedInk, height: 1.45),
                  ),
                for (final id in due) ...[
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: cardDecoration(),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(d.passage(id).displayTitle, style: displayStyle(18)),
                        Text(
                          '${d.passage(id).range.label} • ${d.revision.mastery[(p.of(id).mastery ?? Mastery.practicing).index]}',
                          style: const TextStyle(color: mutedInk),
                        ),
                        const SizedBox(height: 10),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton(
                            key: Key('quran-review-$id'),
                            onPressed: c.saving ? null : () => _review(context, id),
                            child: const Text('Review now'),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                ],
                if (upcoming.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Text('Coming up', style: displayStyle(19)),
                  const SizedBox(height: 6),
                  for (final id in upcoming)
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.event_outlined, color: quranAccent),
                      title: Text(d.passage(id).displayTitle),
                      subtitle: Text(
                        '${friendlyDate(p.of(id).nextReview!, now)} • ${d.revision.mastery[(p.of(id).mastery ?? Mastery.practicing).index]}',
                      ),
                    ),
                ],
                if (kept.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Text('Remembered after review', style: displayStyle(19)),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [
                      for (final id in kept) TagChip(d.passage(id).displayTitle, color: quranAccent),
                    ],
                  ),
                ],
                const SizedBox(height: 18),
                Text(
                  d.revision.note,
                  style: const TextStyle(color: mutedInk, fontSize: 12, height: 1.5),
                ),
              ],
            ),
          );
        },
      ),
    ),
  );
}

/// Parent / Teacher: independent verification on this device (source §2,
/// §4.3, §13). Adults review, approve, reassign and pause the plan.
class QuranAdultScreen extends StatelessWidget {
  const QuranAdultScreen({super.key, required this.c});
  final QuranController c;

  Future<void> _apply(BuildContext context, String id, PassageProgress next) async {
    if (!await c.updatePassage(id, next) && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('That change was not saved. Please try again.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    key: const Key('quran-adult'),
    appBar: AppBar(title: const Text('Parents & teachers')),
    body: SafeArea(
      child: ListenableBuilder(
        listenable: c,
        builder: (context, _) {
          final d = c.data!;
          final p = c.progress;
          final now = c.now();
          final started = d.passages.values.where((x) => p.of(x.id).started).toList();
          return ConstrainedBody(
            maxWidth: 640,
            child: ListView(
              padding: const EdgeInsets.all(18),
              children: [
                Text(
                  d.revision.masteryNote,
                  style: const TextStyle(color: mutedInk, height: 1.45),
                ),
                const SizedBox(height: 8),
                SwitchListTile(
                  key: const Key('quran-pause'),
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Pause the review plan'),
                  subtitle: const Text('Nothing shows as due while paused. No streaks are lost.'),
                  value: p.paused,
                  onChanged: c.saving ? null : (v) => c.update(p.copyWith(paused: v)),
                ),
                const SizedBox(height: 8),
                if (started.isEmpty)
                  const Text(
                    'No passages practised yet on this device.',
                    key: Key('quran-adult-empty'),
                    style: TextStyle(color: mutedInk),
                  ),
                for (final x in started) ...[
                  _AdultCard(c: c, passage: x, now: now, apply: (n) => _apply(context, x.id, n)),
                  const SizedBox(height: 10),
                ],
                const SizedBox(height: 8),
                const Text(
                  'Privacy: this version records no voice. Progress stays on this device only, with no points, rankings or cloud upload.',
                  style: TextStyle(color: mutedInk, fontSize: 12, height: 1.5),
                ),
              ],
            ),
          );
        },
      ),
    ),
  );
}

class _AdultCard extends StatelessWidget {
  const _AdultCard({required this.c, required this.passage, required this.now, required this.apply});
  final QuranController c;
  final QuranPassage passage;
  final DateTime now;
  final Future<void> Function(PassageProgress) apply;
  @override
  Widget build(BuildContext context) {
    final p = c.progress.of(passage.id);
    final d = c.data!;
    final canApprove = (p.mastery?.index ?? -1) >= Mastery.independent.index;
    final last = p.reviews.isEmpty ? null : p.reviews.last;
    return Container(
      key: Key('quran-adult-${passage.id}'),
      padding: const EdgeInsets.all(16),
      decoration: cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(passage.displayTitle, style: displayStyle(18)),
          Text(passage.range.label, style: const TextStyle(color: mutedInk)),
          const SizedBox(height: 8),
          Text(
            [
              c.status(passage.id),
              'Repetitions: ${p.repetitions}',
              'Reviews: ${p.reviews.length}${last == null ? '' : ' (last: ${d.revision.outcomes.firstWhere((o) => o.id == last.result.name).after})'}',
              if (p.nextReview != null) 'Next review: ${friendlyDate(p.nextReview!, now)}',
              if (p.reassigned) 'Reassigned to learn again',
            ].join('\n'),
            style: const TextStyle(color: ink, height: 1.5),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              OutlinedButton(
                key: Key('quran-adult-listen-${passage.id}'),
                onPressed: c.saving
                    ? null
                    : () async {
                        final r = await _askOutcome(context, c, 'I listened to ${passage.displayTitle}');
                        if (r != null) {
                          await apply(c.engine.review(p, r, c.now(), byAdult: true));
                        }
                      },
                child: const Text('I listened'),
              ),
              if (p.approvedAt == null)
                FilledButton(
                  key: Key('quran-adult-approve-${passage.id}'),
                  onPressed: c.saving || !canApprove
                      ? null
                      : () => apply(p.copyWith(approvedAt: c.now())),
                  child: const Text('Approve recitation'),
                )
              else
                OutlinedButton(
                  key: Key('quran-adult-unapprove-${passage.id}'),
                  onPressed: c.saving ? null : () => apply(p.copyWith(clearApproval: true)),
                  child: const Text('Remove approval'),
                ),
              TextButton(
                key: Key('quran-adult-reassign-${passage.id}'),
                onPressed: c.saving ? null : () => apply(c.engine.reassign(p, c.now())),
                child: const Text('Reassign'),
              ),
            ],
          ),
          if (!canApprove && p.approvedAt == null)
            const Padding(
              padding: EdgeInsets.only(top: 6),
              child: Text(
                'Approval opens once the child can recite independently.',
                style: TextStyle(color: mutedInk, fontSize: 12),
              ),
            ),
        ],
      ),
    );
  }
}
