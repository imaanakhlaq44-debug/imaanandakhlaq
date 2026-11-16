import '../../billing/paywall.dart';
import 'package:flutter/material.dart';
import '../../app_theme.dart';
import '../../screens/ui_kit.dart';
import 'hajj_data.dart';
import 'hajj_widgets.dart';
import '../../rewards/reward_widgets.dart';
import '../../audio/voice.dart';

/// One mission, following the Hadith lesson flow: steps are saved as the
/// learner moves on, and finishing marks "learning completed". A grown-up can
/// later mark the real-life action; nothing here certifies worship.
class HajjMissionScreen extends StatefulWidget {
  const HajjMissionScreen({
    super.key,
    required this.c,
    required this.missionId,
  });
  final HajjController c;
  final String missionId;
  @override
  State<HajjMissionScreen> createState() => _HajjMissionScreenState();
}

class _HajjMissionScreenState extends State<HajjMissionScreen> {
  HajjController get c => widget.c;
  HajjCourse get course => c.course;
  late final HajjMission m = course.missions[widget.missionId]!;
  late HajjMissionProgress _p = c.progress.mission(m.id);
  late bool _summary = _p.learned;
  late int _step = _p.step.clamp(0, m.steps.length - 1);
  bool _busy = false;
  String? _error;
  final _scroll = ScrollController();

  // "Try it" state lives only on screen: every attempt can start fresh.
  final _checksDone = <String>{};
  bool _interactionDone = false, _practised = false, _hideWords = false;

  String get age => c.progress.age;
  bool get young => age == hajjAges.first;
  bool get older => age == hajjAges.last;
  String get stepName => m.steps[_step];

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  Future<bool> _persist(HajjMissionProgress next) async {
    if (_busy) return false;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await c.save(c.progress.withMission(m.id, next));
      if (mounted) setState(() => _p = next);
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

  /// Stars for learning this mission; the world's badge once all of its
  /// missions are learned. Nothing here rewards the real-life worship.
  void _reward() {
    final world = course.worlds
        .where((w) => w.missionIds.contains(m.id))
        .firstOrNull;
    celebrateFinish(
      context,
      course: 'hajj',
      item: m.id,
      group: world?.id,
      groupTitle: world?.title,
      groupItems: world?.missionIds,
    );
  }

  void _top() {
    if (_scroll.hasClients) _scroll.jumpTo(0);
  }

  Future<void> _go(int step) async {
    if (await _persist(_p.copyWith(step: step)) && mounted) {
      setState(() {
        _step = step;
        _hideWords = false;
      });
      _top();
    }
  }

  Future<void> _next() async {
    if (_summary) return Navigator.pop(context);
    if (_step < m.steps.length - 1) return _go(_step + 1);
    final first = _p.learnedAt == null;
    final saved = await _persist(
      _p.copyWith(learnedAt: _p.learnedAt ?? DateTime.now().toUtc()),
    );
    if (saved && mounted) {
      if (first) _reward();
      setState(() => _summary = true);
      _top();
    }
  }

  void _back() {
    if (_busy) return;
    if (!_summary && _step > 0) {
      _go(_step - 1);
    } else {
      Navigator.of(context).pop();
    }
  }

  bool get _tryReady {
    final needInteraction = m.interaction != null;
    final needPractice = m.interaction == null && m.checks.isEmpty;
    return (!needInteraction || _interactionDone) &&
        _checksDone.length == m.checks.length &&
        (!needPractice || _practised);
  }

  bool get _canContinue => _summary || stepName != 'Try it' || _tryReady;

  @override
  Widget build(BuildContext context) => PopScope(
    canPop: !_busy && (_summary || _step == 0),
    onPopInvokedWithResult: (didPop, _) {
      if (!didPop && !_busy) _back();
    },
    child: Scaffold(
      key: const Key('hajj-mission-screen'),
      backgroundColor: canvas,
      appBar: AppBar(
        leading: BackButton(onPressed: _busy ? null : _back),
        title: Text(m.title),
        actions: [AskAdultButton(course: course)],
      ),
      body: SafeArea(
        child: ConstrainedBody(
          maxWidth: 620,
          child: Column(
            children: [
              if (!_summary) ...[
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 10),
                  child: Row(
                    children: [
                      Text(
                        'Step ${_step + 1} of ${m.steps.length}',
                        style: const TextStyle(
                          color: hajjGreen,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          stepName,
                          key: const Key('hajj-step-title'),
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
                  value: (_step + 1) / m.steps.length,
                  minHeight: 3,
                  color: hajjGreen,
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
                  padding: const EdgeInsets.fromLTRB(20, 4, 20, 4),
                  child: Semantics(
                    liveRegion: true,
                    child: Text(
                      _error!,
                      key: const Key('hajj-mission-error'),
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.error,
                      ),
                    ),
                  ),
                ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 14),
                child: SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    key: const Key('hajj-next'),
                    style: FilledButton.styleFrom(backgroundColor: hajjGreen),
                    onPressed: _busy || !_canContinue ? null : _next,
                    child: _busy
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Text(
                            _summary
                                ? 'Back to the map'
                                : _step == m.steps.length - 1
                                ? 'Save to my notebook'
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

  List<Widget> _content() => switch (stepName) {
    'Story' => _story(),
    'Learn' => _learn(),
    'Dua echo' => _duaEcho(),
    'Try it' => _tryIt(),
    _ => _action(),
  };

  List<Widget> _story() {
    final world = course.world(m.worldId);
    final scene = world.missionIds.first == m.id
        ? course.scene(m.worldId)
        : null;
    return [
      HajjEyebrow('World ${world.id} • ${world.title}'),
      const SizedBox(height: 10),
      const HajjHeading('From the journey notebook', size: 24),
      const SizedBox(height: 12),
      if (young) ...[
        const HajjCard(
          color: hajjSand,
          padding: EdgeInsets.all(14),
          child: Row(
            children: [
              Icon(Icons.record_voice_over_outlined, color: Color(0xFFB45F0A)),
              SizedBox(width: 10),
              Expanded(
                child: Text('Read this aloud together with a grown-up.'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
      ],
      BodyText(world.storyBeat, size: 19),
      if (scene != null) ...[
        const SizedBox(height: 20),
        HajjCard(
          key: const Key('hajj-scene'),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                scene['title'] as String,
                style: displayStyle(17, color: ink),
              ),
              const SizedBox(height: 10),
              for (final d in course.maps('dialogue', scene))
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Text.rich(
                    TextSpan(
                      children: [
                        TextSpan(
                          text: '${d['speaker']}: ',
                          style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            color: hajjGreen,
                          ),
                        ),
                        TextSpan(text: d['line'] as String),
                      ],
                    ),
                    style: const TextStyle(
                      fontSize: 16,
                      height: 1.5,
                      color: ink,
                    ),
                  ),
                ),
              const SmallNote(
                'A fictional teaching conversation between our story characters. It is not Qur’an or Hadith.',
              ),
            ],
          ),
        ),
      ],
    ];
  }

  List<Widget> _learn() => [
    HajjEyebrow('Mission ${m.id}'),
    const SizedBox(height: 8),
    HajjHeading(m.title, size: 26),
    const SizedBox(height: 14),
    HajjCard(color: hajjTint, child: BodyText(m.teach, size: 19)),
    if (older) ...[
      const SizedBox(height: 18),
      const HajjEyebrow('Go deeper • 10–14'),
      const SizedBox(height: 6),
      BodyText(m.extend),
    ],
    const SizedBox(height: 18),
    const HajjEyebrow('Where this comes from'),
    const SizedBox(height: 8),
    EvidenceChips(course: course, ids: m.evidence),
    const SizedBox(height: 14),
    const SmallNote(
      'On-screen rites are practice and illustration only. Real rulings come from your guardian and qualified scholars.',
    ),
  ];

  List<Widget> _duaEcho() => [
    const HajjHeading('Dua echo', size: 26),
    const SizedBox(height: 8),
    BodyText(
      young
          ? 'Listen to a grown-up say it, then repeat a short phrase together.'
          : 'Learn the meaning first. Then hide the words and try to remember.',
      size: 16,
    ),
    for (final id in m.duaIds) ..._duaCard(course.dua(id)),
    const SizedBox(height: 4),
    OutlinedButton(
      key: const Key('hajj-hide-words'),
      onPressed: () => setState(() => _hideWords = !_hideWords),
      child: Text(_hideWords ? 'Show words' : 'Hide words'),
    ),
    const SizedBox(height: 10),
    const SmallNote(
      'Arabic audio will follow after review. Memorising is gradual — listening and understanding count too.',
    ),
  ];

  List<Widget> _duaCard(HajjDua d) => [
    const SizedBox(height: 18),
    Text(d.title, style: displayStyle(18, color: ink)),
    const SizedBox(height: 10),
    if (_hideWords)
      const HajjCard(
        key: Key('hajj-words-hidden'),
        child: Text(
          'Take your time. Say what you remember.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 19, height: 1.5, color: ink),
        ),
      )
    else ...[
      if (young && d.shortEcho != null) ...[
        ArabicText(d.shortEcho!, size: 30),
        const SizedBox(height: 6),
        const SmallNote('Short echo for younger ages. Full text:'),
        const SizedBox(height: 6),
        ArabicText(d.arabic, size: 22),
      ] else
        ArabicText(d.arabic),
    ],
    const SizedBox(height: 12),
    BodyText(d.meaning, size: 18),
    const SizedBox(height: 8),
    Text(
      d.source,
      style: const TextStyle(fontWeight: FontWeight.w700, color: brandNavy),
    ),
    const SizedBox(height: 4),
    SmallNote(d.note),
  ];

  List<Widget> _tryIt() {
    final it = m.interaction;
    return [
      const HajjHeading('Try it', size: 26),
      const SizedBox(height: 8),
      BodyText(older && it == null ? m.extend : m.play, size: 18),
      const SizedBox(height: 16),
      if (it != null)
        switch (it.type) {
          'sequence' => SequencePlay(
            key: Key('hajj-play-${m.id}'),
            items: it.items,
            onDone: () => setState(() => _interactionDone = true),
          ),
          'count' => CountPlay(
            key: Key('hajj-play-${m.id}'),
            count: it.count,
            labels: it.labels,
            onDone: () => setState(() => _interactionDone = true),
          ),
          _ => ChoicePlay(
            key: Key('hajj-play-${m.id}'),
            good: it.good!,
            other: it.other!,
            otherFirst: int.parse(m.id[m.id.length - 1]).isEven,
            onDone: () => setState(() => _interactionDone = true),
          ),
        },
      for (var n = 0; n < m.checks.length; n++) ...[
        const SizedBox(height: 18),
        CheckCard(
          key: Key('hajj-check-$n'),
          check: m.checks[n],
          onDone: () => setState(() => _checksDone.add(m.checks[n].id)),
        ),
      ],
      if (it == null && m.checks.isEmpty) ...[
        CheckboxListTile(
          key: const Key('hajj-practised'),
          value: _practised,
          contentPadding: EdgeInsets.zero,
          controlAffinity: ListTileControlAffinity.leading,
          title: Text(
            young ? 'We tried it together' : 'I tried it',
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
          onChanged: (v) => setState(() => _practised = v ?? false),
        ),
        const SmallNote('Practice only — there is no score here.'),
      ],
    ];
  }

  List<Widget> _action() => [
    const HajjHeading('One small action', size: 26),
    const SizedBox(height: 14),
    HajjCard(
      color: hajjTint,
      child: Text(
        m.action,
        key: const Key('hajj-daily-action'),
        style: displayStyle(21, color: ink, height: 1.35),
      ),
    ),
    const SizedBox(height: 16),
    const BodyText(
      'Try it when a suitable moment comes. Your grown-up can mark it later in your notebook.',
      size: 16,
    ),
  ];

  List<Widget> _finish() {
    final next = _nextMission();
    return [
      const Icon(Icons.auto_stories_outlined, size: 54, color: hajjGreen),
      const SizedBox(height: 12),
      Text(
        'A new page in your notebook',
        textAlign: TextAlign.center,
        style: displayStyle(24, color: ink),
      ),
      const SizedBox(height: 16),
      _state('Heard the story', true),
      _state('Understood the idea', _p.learned),
      _state(
        _p.parentMarked
            ? 'Practised the value • marked by a grown-up'
            : 'Practised the value • a grown-up can mark this',
        _p.parentMarked,
      ),
      const SizedBox(height: 8),
      HajjCard(color: hajjTint, child: BodyText(m.action, size: 17)),
      const SizedBox(height: 10),
      OutlinedButton.icon(
        key: const Key('hajj-parent-mark'),
        icon: Icon(_p.parentMarked ? Icons.undo : Icons.volunteer_activism),
        label: Text(
          _p.parentMarked
              ? 'Grown-up: undo the mark'
              : 'Grown-up: mark the real action',
        ),
        onPressed: _busy
            ? null
            : () async {
                if (await confirmGrownUp(context)) {
                  await _persist(
                    HajjMissionProgress(
                      step: _p.step,
                      learnedAt: _p.learnedAt,
                      parentMarked: !_p.parentMarked,
                      reflection: _p.reflection,
                    ),
                  );
                }
              },
      ),
      const SizedBox(height: 22),
      const HajjHeading('Muhasabah • just for me', size: 19),
      const SizedBox(height: 6),
      BodyText(
        course.strings('muhasabah')[(int.parse(m.id[m.id.length - 1]) - 1) % 3],
        size: 16,
      ),
      const SizedBox(height: 10),
      Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          for (final e in const {
            'yes': 'Yes',
            'again': 'I need another try',
          }.entries)
            ChoiceChip(
              key: Key('hajj-reflect-${e.key}'),
              label: Text(e.value),
              selectedColor: hajjTint,
              selected: _p.reflection == e.key,
              onSelected: _busy
                  ? null
                  : (_) => _persist(_p.copyWith(reflection: e.key)),
            ),
        ],
      ),
      const SizedBox(height: 6),
      const SmallNote('Private and optional. Every answer is okay.'),
      const SizedBox(height: 18),
      if (next != null)
        OutlinedButton(
          key: const Key('hajj-next-mission'),
          onPressed: _busy
              ? null
              : () => Navigator.of(context).pushReplacement(
                  MaterialPageRoute<void>(
                    builder: (_) => PaidGate(
                      free: next == c.course.worlds.first.missionIds.first,
                      child: HajjMissionScreen(c: c, missionId: next),
                    ),
                  ),
                ),
          child: Text('Next mission: ${course.missions[next]!.title}'),
        ),
      TextButton(
        key: const Key('hajj-repeat'),
        onPressed: _busy
            ? null
            : () async {
                if (await _persist(_p.copyWith(step: 0)) && mounted) {
                  setState(() {
                    _summary = false;
                    _step = 0;
                    _checksDone.clear();
                    _interactionDone = false;
                    _practised = false;
                  });
                  _top();
                }
              },
        child: const Text('Play this mission again'),
      ),
      const SizedBox(height: 6),
      const ReviewNotice(),
    ];
  }

  String? _nextMission() {
    final w = course.world(m.worldId).missionIds;
    final i = w.indexOf(m.id);
    return i < w.length - 1 ? w[i + 1] : null;
  }

  Widget _state(String label, bool done) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Row(
      children: [
        Icon(
          done ? Icons.check_circle : Icons.radio_button_unchecked,
          color: done ? hajjGreen : mutedInk,
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            label,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              color: done ? ink : mutedInk,
            ),
          ),
        ),
      ],
    ),
  );
}

/// Put cards in order. A wrong tap only asks to try another card.
class SequencePlay extends StatefulWidget {
  const SequencePlay({super.key, required this.items, required this.onDone});
  final List<String> items;
  final VoidCallback onDone;
  @override
  State<SequencePlay> createState() => _SequencePlayState();
}

class _SequencePlayState extends State<SequencePlay> {
  int _placed = 0;
  bool _nudge = false;
  late final List<int> _order = List.generate(
    widget.items.length,
    (i) => i,
  ).reversed.toList();

  void _tap(int i) {
    if (i == _placed) {
      setState(() {
        _placed++;
        _nudge = false;
      });
      if (_placed == widget.items.length) widget.onDone();
    } else {
      setState(() => _nudge = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final done = _placed == widget.items.length;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Tap the cards in the right order.',
          style: TextStyle(fontWeight: FontWeight.w700, color: ink),
        ),
        const SizedBox(height: 10),
        for (var n = 0; n < _placed; n++)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: HajjCard(
              color: hajjTint,
              padding: const EdgeInsets.all(12),
              child: Text(
                '${n + 1}. ${widget.items[n]}',
                style: const TextStyle(fontWeight: FontWeight.w800, color: ink),
              ),
            ),
          ),
        if (!done)
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final i in _order)
                if (i >= _placed)
                  OutlinedButton(
                    key: Key('hajj-seq-$i'),
                    onPressed: () => _tap(i),
                    child: Text(widget.items[i]),
                  ),
            ],
          ),
        if (_nudge)
          const Padding(
            padding: EdgeInsets.only(top: 8),
            child: Text('Not yet — which one comes next? Try another card.'),
          ),
        if (done)
          const Text(
            'Well done — that is the order.',
            key: Key('hajj-play-done'),
            style: TextStyle(color: hajjGreen, fontWeight: FontWeight.w800),
          ),
      ],
    );
  }
}

/// Count calmly, one bead (or one labelled length) at a time.
class CountPlay extends StatefulWidget {
  const CountPlay({
    super.key,
    required this.count,
    required this.labels,
    required this.onDone,
  });
  final int count;
  final List<String> labels;
  final VoidCallback onDone;
  @override
  State<CountPlay> createState() => _CountPlayState();
}

class _CountPlayState extends State<CountPlay> {
  int _n = 0;
  @override
  Widget build(BuildContext context) {
    final done = _n == widget.count;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          done
              ? 'Seven — all done.'
              : 'Tap the next one: ${_n + 1} of ${widget.count}',
          key: done ? const Key('hajj-play-done') : null,
          style: TextStyle(
            fontWeight: FontWeight.w800,
            color: done ? hajjGreen : ink,
          ),
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: [
            for (var i = 0; i < widget.count; i++)
              Semantics(
                button: true,
                label: 'Count ${i + 1}',
                child: InkWell(
                  key: Key('hajj-count-$i'),
                  borderRadius: BorderRadius.circular(16),
                  onTap: i == _n
                      ? () {
                          setState(() => _n++);
                          if (_n == widget.count) widget.onDone();
                        }
                      : null,
                  child: Container(
                    constraints: BoxConstraints(
                      minWidth: widget.labels.isEmpty ? 52 : 120,
                      minHeight: 52,
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: i < _n ? hajjGreen : Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: i == _n ? hajjGreen : const Color(0xFFCBD3E1),
                        width: i == _n ? 2 : 1,
                      ),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '${i + 1}',
                          style: displayStyle(
                            20,
                            color: i < _n ? Colors.white : ink,
                          ),
                        ),
                        if (widget.labels.isNotEmpty)
                          Text(
                            widget.labels[i],
                            style: TextStyle(
                              fontSize: 12.5,
                              color: i < _n ? Colors.white : mutedInk,
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        ),
      ],
    );
  }
}

/// Two options from the guide's own Play brief.
class ChoicePlay extends StatefulWidget {
  const ChoicePlay({
    super.key,
    required this.good,
    required this.other,
    required this.otherFirst,
    required this.onDone,
  });
  final String good, other;
  final bool otherFirst;
  final VoidCallback onDone;
  @override
  State<ChoicePlay> createState() => _ChoicePlayState();
}

class _ChoicePlayState extends State<ChoicePlay> {
  bool? _pickedGood;
  @override
  Widget build(BuildContext context) {
    Widget option(String text, bool good) => Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: OutlinedButton(
        key: Key(good ? 'hajj-choice-good' : 'hajj-choice-other'),
        style: OutlinedButton.styleFrom(
          alignment: Alignment.centerLeft,
          minimumSize: const Size(double.infinity, 56),
          padding: const EdgeInsets.all(14),
          backgroundColor: _pickedGood == good ? hajjTint : Colors.white,
        ),
        onPressed: () {
          VoiceGuide.instance.play(
            good ? VoiceLine.correct : VoiceLine.tryAgain,
          );
          setState(() => _pickedGood = good);
          if (good) widget.onDone();
        },
        child: Text(
          text[0].toUpperCase() + text.substring(1),
          style: const TextStyle(fontSize: 16, color: ink),
        ),
      ),
    );
    final opts = [option(widget.good, true), option(widget.other, false)];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ...(widget.otherFirst ? opts.reversed : opts),
        if (_pickedGood != null)
          Semantics(
            liveRegion: true,
            child: Text(
              _pickedGood!
                  ? 'That is the kind, safe choice.'
                  : 'Let’s think again together — which choice is kind and safe?',
              key: const Key('hajj-choice-feedback'),
              style: TextStyle(
                fontWeight: FontWeight.w700,
                color: _pickedGood! ? hajjGreen : const Color(0xFFB45F0A),
              ),
            ),
          ),
      ],
    );
  }
}

/// A question from the guide's decision bank or scene learning checks. Only
/// the source's own answer is shown; there are no invented wrong options.
class CheckCard extends StatefulWidget {
  const CheckCard({super.key, required this.check, required this.onDone});
  final HajjCheck check;
  final VoidCallback onDone;
  @override
  State<CheckCard> createState() => _CheckCardState();
}

class _CheckCardState extends State<CheckCard> {
  bool? _said;
  bool _shown = false;

  void _reveal([bool? said]) {
    setState(() {
      _said = said;
      _shown = true;
    });
    widget.onDone();
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.check;
    final yn = c.yesNo;
    return HajjCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const HajjEyebrow('Check my understanding'),
          const SizedBox(height: 6),
          Text(c.question, style: displayStyle(18, color: ink, height: 1.3)),
          const SizedBox(height: 12),
          if (yn != null)
            Row(
              children: [
                for (final v in [true, false]) ...[
                  Expanded(
                    child: OutlinedButton(
                      key: Key('hajj-check-${v ? 'yes' : 'no'}'),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(48, 52),
                        backgroundColor: _said == v ? hajjTint : Colors.white,
                      ),
                      onPressed: () => _reveal(v),
                      child: Text(v ? 'Yes' : 'No'),
                    ),
                  ),
                  if (v) const SizedBox(width: 10),
                ],
              ],
            )
          else if (!_shown)
            OutlinedButton(
              key: const Key('hajj-check-show'),
              onPressed: _reveal,
              child: const Text('Think first, then show the answer'),
            ),
          if (_shown) ...[
            const SizedBox(height: 12),
            Semantics(
              liveRegion: true,
              child: Container(
                key: const Key('hajj-check-answer'),
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: _said == null || _said == yn ? hajjTint : hajjSand,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_said != null)
                      Text(
                        _said == yn
                            ? 'Yes, that’s right.'
                            : 'Good try — here is the answer:',
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          color: ink,
                        ),
                      ),
                    BodyText(c.answer, size: 16),
                    if (c.feedback != null) BodyText(c.feedback!, size: 15),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 6),
            SmallNote(c.source),
          ],
        ],
      ),
    );
  }
}
