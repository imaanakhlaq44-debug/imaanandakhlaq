import '../../screens/story_cards.dart';
import '../../audio/voice.dart';
import 'package:imaan_akhlaq/rewards/reward_widgets.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../app_theme.dart';
import '../../screens/learning_experience.dart' show courseAccents;
import '../../screens/ui_kit.dart';
import 'tafsir_data.dart';

/// Course accent for Tafsir Through Stories (course index 4).
final Color tafsirAccent = courseAccents[4];
const _tint = Color(0xFFE6F0FB);
const _review =
    'Working edition: Arabic, meanings and Tafsir still need scholarly review before release.';

String _missionStatus(TafsirProgress? p) {
  if (p == null) return 'Story • Ayah • Understand • Decide • Act';
  if (!p.explored) return 'Continue from step ${p.step + 1} of 5';
  return switch (p.reflection) {
    'yes' => 'Explored • You tried your action',
    'tried' => 'Explored • You gave it a try',
    _ => 'Explored • Action planned',
  };
}

/// Loaded progress shared by the world list, mission list and mission flow.
class TafsirCourseProgress {
  TafsirCourseProgress(this.store);
  final TafsirProgressStore store;
  Map<String, TafsirProgress> progress = {};
  int explored(Iterable<TafsirMission> missions) =>
      missions.where((m) => progress[m.id]?.explored ?? false).length;
  Future<void> save(String id, TafsirProgress value) async {
    final next = {...progress, id: value};
    await store.save(next);
    progress = next;
  }
}

class TafsirCourseScreen extends StatefulWidget {
  const TafsirCourseScreen({super.key, required this.scope, this.store});
  final String scope;
  final TafsirProgressStore? store;
  @override
  State<TafsirCourseScreen> createState() => _TafsirCourseScreenState();
}

class _TafsirCourseScreenState extends State<TafsirCourseScreen> {
  late final _state = TafsirCourseProgress(
    widget.store ?? DeviceTafsirProgressStore.forLearner(widget.scope),
  );
  List<TafsirWorld>? _worlds;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _error = null;
      _worlds = null;
    });
    try {
      final worlds = await TafsirWorld.load();
      final saved = await _state.store.load();
      if (mounted) {
        setState(() {
          _worlds = worlds;
          _state.progress = saved;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(
          () => _error =
              'We could not load the missions and your saved progress. Please try again.',
        );
      }
    }
  }

  Future<void> _open(TafsirWorld world) async {
    await Navigator.of(context).push<void>(
      MaterialPageRoute(
        builder: (_) => TafsirWorldScreen(world: world, state: _state),
      ),
    );
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final worlds = _worlds;
    final all = worlds?.expand((w) => w.missions).toList() ?? const [];
    final done = _state.explored(all);
    return Scaffold(
      key: const Key('tafsir-course'),
      appBar: AppBar(title: const Text('Tafsir Through Stories')),
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
              : worlds == null
              ? const Center(child: CircularProgressIndicator())
              : ListView(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                  children: [
                    Reveal(
                      index: 0,
                      child: _Hero(
                        eyebrow: 'QUR’ANIC TAFSIR THROUGH STORIES',
                        title: 'Stories that open\nthe Qur’an',
                        progress: '$done of ${all.length} missions explored',
                        value: all.isEmpty ? 0 : done / all.length,
                        progressKey: const Key('tafsir-progress-count'),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Meet Imaan & Akhlaq in a story, read the ayah, learn what it means, choose wisely and try one small action.',
                      style: TextStyle(color: mutedInk, height: 1.5),
                    ),
                    const SizedBox(height: 16),
                    for (var i = 0; i < worlds.length; i++)
                      Reveal(
                        index: i + 1,
                        child: _WorldCard(
                          key: Key('tafsir-world-${worlds[i].number}'),
                          number: worlds[i].number,
                          title: worlds[i].title,
                          subtitle:
                              '${_state.explored(worlds[i].missions)} of ${worlds[i].missions.length} missions explored',
                          onTap: () => _open(worlds[i]),
                        ),
                      ),
                    Reveal(
                      index: worlds.length + 1,
                      child: const _WorldCard(
                        key: Key('tafsir-world-8'),
                        number: 8,
                        title: TafsirWorld.comingSoonTitle,
                        subtitle: 'Coming soon',
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      widget.scope == 'guest'
                          ? 'Trying as a guest. Progress is saved on this device.'
                          : 'Progress is saved on this device for this learner.',
                      style: const TextStyle(
                        fontSize: 12,
                        color: mutedInk,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Stories with Imaan & Akhlaq are fictional examples, kept separate from the Qur’an and its Tafsir. $_review',
                      style: TextStyle(
                        fontSize: 12,
                        color: mutedInk,
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}

class _Hero extends StatelessWidget {
  const _Hero({
    required this.eyebrow,
    required this.title,
    required this.progress,
    required this.value,
    required this.progressKey,
  });
  final String eyebrow, title, progress;
  final double value;
  final Key progressKey;
  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(22),
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(24),
      gradient: LinearGradient(
        colors: [brandNavy, Color.lerp(brandNavy, tafsirAccent, .55)!],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          eyebrow,
          style: const TextStyle(
            color: Color(0xFFCFE3FA),
            fontSize: 12,
            fontWeight: FontWeight.w800,
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: 10),
        Text(title, style: displayStyle(28, color: Colors.white, height: 1.12)),
        const SizedBox(height: 16),
        Text(
          progress,
          key: progressKey,
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
          backgroundColor: Colors.white.withValues(alpha: .22),
          color: Colors.white,
        ),
      ],
    ),
  );
}

class _WorldCard extends StatelessWidget {
  const _WorldCard({
    super.key,
    required this.number,
    required this.title,
    required this.subtitle,
    this.onTap,
  });
  final int number;
  final String title, subtitle;
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) {
    final ready = onTap != null;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Pressable(
        scale: ready ? .97 : 1,
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            boxShadow: ready ? cardDecoration().boxShadow : null,
          ),
          child: Material(
            color: ready ? Colors.white : const Color(0xFFF0F2F6),
            borderRadius: BorderRadius.circular(20),
            clipBehavior: Clip.antiAlias,
            child: InkWell(
              onTap: onTap,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: ready ? _tint : const Color(0xFFE2E6EE),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Text(
                        '$number',
                        style: displayStyle(
                          22,
                          color: ready ? tafsirAccent : mutedInk,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'WORLD $number',
                            style: TextStyle(
                              fontSize: 11,
                              letterSpacing: .8,
                              fontWeight: FontWeight.w800,
                              color: ready ? tafsirAccent : mutedInk,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            title,
                            style: displayStyle(
                              18,
                              color: ready ? ink : mutedInk,
                              height: 1.2,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            subtitle,
                            style: const TextStyle(
                              color: mutedInk,
                              fontSize: 13,
                              height: 1.35,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Icon(
                      ready ? Icons.chevron_right : Icons.hourglass_empty,
                      color: ready ? tafsirAccent : mutedInk,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class TafsirWorldScreen extends StatefulWidget {
  const TafsirWorldScreen({
    super.key,
    required this.world,
    required this.state,
  });
  final TafsirWorld world;
  final TafsirCourseProgress state;
  @override
  State<TafsirWorldScreen> createState() => _TafsirWorldScreenState();
}

class _TafsirWorldScreenState extends State<TafsirWorldScreen> {
  Future<void> _open(TafsirMission mission) async {
    final state = widget.state;
    await Navigator.of(context).push<void>(
      MaterialPageRoute(
        builder: (_) => TafsirMissionScreen(
          world: widget.world,
          mission: mission,
          progress: state.progress[mission.id] ?? const TafsirProgress(),
          onSave: (value) async {
            await state.save(mission.id, value);
            if (mounted) setState(() {});
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final w = widget.world;
    final state = widget.state;
    final done = state.explored(w.missions);
    return Scaffold(
      key: const Key('tafsir-world-screen'),
      appBar: AppBar(title: Text('World ${w.number}')),
      body: SafeArea(
        child: ConstrainedBody(
          maxWidth: 600,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            children: [
              Reveal(
                index: 0,
                child: _Hero(
                  eyebrow: 'WORLD ${w.number}',
                  title: w.title,
                  progress: '$done of ${w.missions.length} missions explored',
                  value: done / w.missions.length,
                  progressKey: const Key('tafsir-world-progress'),
                ),
              ),
              const SizedBox(height: 16),
              for (var i = 0; i < w.missions.length; i++)
                Reveal(
                  index: i + 1,
                  child: _MissionTile(
                    mission: w.missions[i],
                    progress: state.progress[w.missions[i].id],
                    onTap: () => _open(w.missions[i]),
                  ),
                ),
              const SizedBox(height: 4),
              Text(
                'Source: ${w.document}. $_review',
                style: const TextStyle(
                  fontSize: 12,
                  color: mutedInk,
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MissionTile extends StatelessWidget {
  const _MissionTile({
    required this.mission,
    required this.progress,
    required this.onTap,
  });
  final TafsirMission mission;
  final TafsirProgress? progress;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    final explored = progress?.explored ?? false;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Pressable(
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
              key: Key('tafsir-mission-${mission.id}'),
              onTap: onTap,
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 20,
                      backgroundColor: explored ? tafsirAccent : _tint,
                      foregroundColor: explored ? Colors.white : tafsirAccent,
                      child: explored
                          ? const Icon(Icons.check, size: 20)
                          : Text(
                              '${mission.number}',
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            mission.title,
                            style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              color: ink,
                              fontSize: 16,
                              height: 1.3,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            'Qur’an ${mission.refs}',
                            style: TextStyle(
                              color: tafsirAccent,
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            _missionStatus(progress),
                            style: const TextStyle(
                              color: mutedInk,
                              fontSize: 13,
                              height: 1.35,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Icon(Icons.chevron_right, color: tafsirAccent),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class TafsirMissionScreen extends StatefulWidget {
  const TafsirMissionScreen({
    super.key,
    required this.mission,
    required this.progress,
    required this.onSave,
    this.world,
  });

  /// The world this mission belongs to, for its badge.
  final TafsirWorld? world;
  final TafsirMission mission;
  final TafsirProgress progress;
  final Future<void> Function(TafsirProgress) onSave;
  @override
  State<TafsirMissionScreen> createState() => _TafsirMissionScreenState();
}

class _TafsirMissionScreenState extends State<TafsirMissionScreen> {
  /// Stars for this mission; the world's badge once its missions are done.
  void _reward() {
    final w = widget.world;
    celebrateFinish(
      context,
      course: 'tafsir',
      item: widget.mission.id,
      group: w == null ? null : 'world-${w.number}',
      groupTitle: w?.title,
      groupItems: w?.missions.map((m) => m.id),
    );
  }

  late TafsirProgress _progress = widget.progress;
  late bool _summary = _progress.explored;
  late String? _reflection = _progress.reflection;
  bool _busy = false, _reflectionSaved = false;
  String? _error;
  final _scroll = ScrollController();
  static const _steps = [
    'Story',
    'Read the ayah',
    'Understand',
    'Decide',
    'Daily action',
  ];

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  TafsirMission get _m => widget.mission;
  bool get _correct => _progress.choice == _m.correct;

  Future<bool> _persist(TafsirProgress value) async {
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
    if (await _persist(_progress.copyWith(step: step)) && mounted) _top();
  }

  Future<void> _next() async {
    if (_progress.step < TafsirProgress.lastStep) {
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
      key: const Key('tafsir-mission-screen'),
      appBar: AppBar(
        leading: BackButton(onPressed: _busy ? null : _back),
        title: Text(_m.title),
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
                        style: TextStyle(
                          color: tafsirAccent,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _steps[_progress.step],
                          key: const Key('tafsir-step-title'),
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
                  color: tafsirAccent,
                  backgroundColor: const Color(0xFFE5E9F0),
                ),
              ],
              Expanded(
                child: ListView(
                  controller: _scroll,
                  padding: const EdgeInsets.all(20),
                  children: _summary ? _finish() : _content(),
                ),
              ),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
                  child: Semantics(
                    liveRegion: true,
                    child: Text(
                      _error!,
                      key: const Key('tafsir-save-error'),
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
                    key: const Key('tafsir-next'),
                    style: FilledButton.styleFrom(
                      backgroundColor: tafsirAccent,
                      minimumSize: const Size(48, 54),
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
                                ? 'Back to missions'
                                : _progress.step == TafsirProgress.lastStep
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
    0 => [
      _label('IMAAN & AKHLAQ • A FICTIONAL MODERN STORY'),
      const SizedBox(height: 8),
      _heading(_m.title),
      const SizedBox(height: 12),
      _panel(
        color: _tint,
        child: Text(
          _m.aim,
          style: const TextStyle(fontSize: 16, height: 1.5, color: ink),
        ),
      ),
      const SizedBox(height: 18),
      StoryCards(paragraphs: [_m.story], accent: tafsirAccent),
      const SizedBox(height: 16),
      const Text(
        'This story is a made-up example for today. It is not part of the Qur’an.',
        style: TextStyle(color: mutedInk, fontSize: 12, height: 1.4),
      ),
    ],
    1 => [
      _label(_m.anchor),
      const SizedBox(height: 10),
      _heading('Read the ayah'),
      const SizedBox(height: 16),
      for (final a in _m.ayahs) ...[
        _arabic(a.arabic),
        const SizedBox(height: 8),
        Text(
          'Qur’an ${a.ref}',
          style: TextStyle(color: tafsirAccent, fontWeight: FontWeight.w800),
        ),
        if (a.meaning != null) ...[
          const SizedBox(height: 4),
          _body(a.meaning!),
        ],
        const SizedBox(height: 18),
      ],
      if (_m.meaning != null) ...[
        _heading('What it means', size: 20),
        const SizedBox(height: 8),
        _body(_m.meaning!, size: 18, bold: true),
        const SizedBox(height: 14),
      ],
      if (_m.ayahNote != null) _note(_m.ayahNote!),
      if (_m.memorization != null) ...[
        const SizedBox(height: 14),
        _heading('Optional: a short phrase to remember', size: 18),
        const SizedBox(height: 10),
        for (final part in _m.memorization!.split('\n\n'))
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: RegExp(r'[؀-ۿ]').hasMatch(part)
                ? _arabic(part)
                : _note(part),
          ),
      ],
      const SizedBox(height: 4),
      const Text(
        'English lines are the volume’s own meaning guides, not a word-for-word translation. Audio will follow after review.',
        style: TextStyle(color: mutedInk, fontSize: 12, height: 1.4),
      ),
    ],
    2 => [
      _heading('Understand'),
      const SizedBox(height: 12),
      for (final para in _m.tafsir.split('\n\n')) ...[
        _body(para),
        const SizedBox(height: 12),
      ],
      if (_m.vocabulary != null) ...[
        const SizedBox(height: 6),
        _panel(
          color: _tint,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _label('WORDS TO REMEMBER'),
              const SizedBox(height: 8),
              _body(_m.vocabulary!),
            ],
          ),
        ),
      ],
    ],
    3 => [
      _heading('What would you choose?'),
      const SizedBox(height: 12),
      _body(_m.question, size: 19),
      const SizedBox(height: 20),
      for (var i = 0; i < _m.options.length; i++)
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: OutlinedButton(
            key: Key('tafsir-answer-$i'),
            onPressed: _busy
                ? null
                : () {
                    VoiceGuide.instance.play(
                      i == _m.correct ? VoiceLine.correct : VoiceLine.tryAgain,
                    );
                    _persist(_progress.copyWith(choice: i));
                  },
            style: OutlinedButton.styleFrom(
              alignment: Alignment.centerLeft,
              padding: const EdgeInsets.all(16),
              minimumSize: const Size(48, 56),
              backgroundColor: _progress.choice == i ? _tint : Colors.white,
              side: BorderSide(
                color: _progress.choice == i
                    ? tafsirAccent
                    : const Color(0xFFCBD3E1),
              ),
            ),
            child: Text(
              _m.options[i],
              style: const TextStyle(fontSize: 16, height: 1.4, color: ink),
            ),
          ),
        ),
      if (_progress.choice != null)
        Semantics(
          liveRegion: true,
          child: _panel(
            key: const Key('tafsir-feedback'),
            color: _correct ? const Color(0xFFE8F4ED) : const Color(0xFFFFEFD9),
            child: _body(
              _correct
                  ? _m.feedback
                  : 'Think about the ayah and the story again, then try another choice.',
            ),
          ),
        ),
    ],
    _ => [
      _heading('One small action'),
      const SizedBox(height: 16),
      _panel(color: _tint, child: _body(_m.action, size: 21, bold: true)),
      const SizedBox(height: 20),
      _body(
        'Try it when a suitable moment comes. Nobody needs to check. You can come back later to reflect on how it went.',
      ),
    ],
  };

  List<Widget> _finish() => [
    Icon(Icons.auto_stories_outlined, size: 56, color: tafsirAccent),
    const SizedBox(height: 16),
    _heading('Mission explored', centered: true),
    const SizedBox(height: 10),
    const Text(
      'You read the story and the ayah, and saved your action plan.',
      textAlign: TextAlign.center,
      style: TextStyle(fontSize: 17, height: 1.5),
    ),
    const SizedBox(height: 20),
    _panel(color: _tint, child: _body(_m.action, size: 18, bold: true)),
    const SizedBox(height: 22),
    _heading('A moment to reflect', size: 20),
    const SizedBox(height: 8),
    _body(_m.reflection, size: 17),
    const SizedBox(height: 18),
    _heading('When you have had a chance…', size: 20),
    const SizedBox(height: 8),
    _body('Did you get a chance to try your action? Every answer is okay.'),
    const SizedBox(height: 12),
    for (final e in const {
      'yes': 'Yes',
      'tried': 'I tried',
      'notYet': 'Not yet',
    }.entries)
      Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: OutlinedButton(
          key: Key('tafsir-reflect-${e.key}'),
          style: OutlinedButton.styleFrom(
            alignment: Alignment.centerLeft,
            minimumSize: const Size(double.infinity, 48),
            backgroundColor: _reflection == e.key ? _tint : Colors.white,
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
      key: const Key('tafsir-save-reflection'),
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
    if (_m.review != null) ...[
      const SizedBox(height: 22),
      _heading('Think it over', size: 20),
      const SizedBox(height: 8),
      _body(_m.review!),
    ],
    if (_m.careNote != null) ...[
      const SizedBox(height: 22),
      _panel(
        color: const Color(0xFFF3F4F8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _label('FOR PARENTS & TEACHERS'),
            const SizedBox(height: 6),
            _body(_m.careNote!, size: 15),
          ],
        ),
      ),
    ],
    const SizedBox(height: 16),
    Text(
      [
        _m.sourcePath ?? 'Qur’an ${_m.refs}',
        'From ${_m.sourceDocument}.',
        _review,
      ].join('\n'),
      style: const TextStyle(fontSize: 12, color: mutedInk, height: 1.5),
    ),
    if (_m.sourceUrl != null)
      Align(
        alignment: Alignment.centerLeft,
        child: TextButton.icon(
          key: const Key('tafsir-source'),
          onPressed: _source,
          icon: const Icon(Icons.open_in_new, size: 16),
          label: const Text('Read the ayah on Quran.com'),
        ),
      ),
    TextButton(
      key: const Key('tafsir-read-again'),
      onPressed: _busy
          ? null
          : () async {
              if (await _persist(_progress.copyWith(step: 0)) && mounted) {
                setState(() => _summary = false);
                _top();
              }
            },
      child: const Text('Go through the mission again'),
    ),
  ];

  Widget _label(String text) => Text(
    text,
    style: TextStyle(
      color: tafsirAccent,
      fontSize: 12,
      height: 1.4,
      letterSpacing: .6,
      fontWeight: FontWeight.w800,
    ),
  );

  Widget _heading(String text, {bool centered = false, double size = 24}) =>
      Text(
        text,
        textAlign: centered ? TextAlign.center : TextAlign.start,
        style: displayStyle(size, color: ink, height: 1.25),
      );

  Widget _body(String text, {double size = 17, bool bold = false}) => Text(
    text,
    style: TextStyle(
      fontSize: size,
      height: 1.55,
      color: ink,
      fontWeight: bold ? FontWeight.w700 : FontWeight.w400,
    ),
  );

  Widget _note(String text) => Text(
    text,
    style: const TextStyle(color: mutedInk, fontSize: 13, height: 1.45),
  );

  Widget _panel({Key? key, required Color color, required Widget child}) =>
      Container(
        key: key,
        width: double.infinity,
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(20),
        ),
        child: child,
      );

  Widget _arabic(String text) => Container(
    width: double.infinity,
    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: const Color(0xFFE0E5EF)),
    ),
    child: Text(
      text,
      key: const Key('tafsir-arabic'),
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

  Future<void> _source() async {
    try {
      if (!await launchUrl(
        Uri.parse(_m.sourceUrl!),
        mode: LaunchMode.externalApplication,
      )) {
        throw StateError('Unavailable');
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Could not open the source. ${_m.sourcePath}'),
          ),
        );
      }
    }
  }
}
