import '../../billing/paywall.dart';
import '../../screens/story_cards.dart';
import '../../audio/voice.dart';
import 'package:imaan_akhlaq/rewards/reward_widgets.dart';
import 'package:flutter/material.dart';
import '../../app_theme.dart';
import '../../screens/ui_kit.dart';
import 'salah_data.dart';
import 'salah_widgets.dart';

/// Mission map for My Salah Journey: seven worlds plus Getting Ready,
/// 30 missions, the recitation library and the respectful-differences notes.
class SalahCourseScreen extends StatefulWidget {
  const SalahCourseScreen({
    super.key,
    required this.scope,
    this.store,
    this.loadData,
  });
  final String scope;
  final SalahProgressStore? store;
  final Future<SalahCourseData> Function()? loadData;
  @override
  State<SalahCourseScreen> createState() => _SalahCourseScreenState();
}

class _SalahCourseScreenState extends State<SalahCourseScreen> {
  late final SalahProgressStore _store =
      widget.store ?? DeviceSalahProgressStore.forLearner(widget.scope);
  SalahCourseData? _data;
  Map<String, SalahProgress> _progress = {};
  String? _error;

  /// Worlds whose gentle notice was accepted while this screen is open.
  final _acknowledged = <String>{};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _error = null;
      _data = null;
    });
    try {
      final data = await (widget.loadData ?? SalahCourseData.load)();
      final saved = await _store.load();
      if (mounted) {
        setState(() {
          _data = data;
          _progress = saved;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(
          () => _error =
              'We could not load your missions and saved progress. Please try again.',
        );
      }
    }
  }

  Future<bool> _notice(SalahWorld world) async {
    final text = switch (world.id) {
      'tasbih' => _data!.tasbihNotice,
      'janazah' =>
        'This world talks gently about Janazah, the prayer for a Muslim who has died. It is best explored with a parent or teacher.',
      _ => null,
    };
    if (text == null || _acknowledged.contains(world.id)) return true;
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        key: const Key('salah-world-notice'),
        title: Text(
          world.optional ? 'An optional lesson' : 'Learn with a grown-up',
        ),
        content: SingleChildScrollView(
          child: Text(text, style: const TextStyle(height: 1.5)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Not now'),
          ),
          FilledButton(
            key: const Key('salah-notice-continue'),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Continue with a grown-up'),
          ),
        ],
      ),
    );
    if (ok == true) _acknowledged.add(world.id);
    return ok == true;
  }

  Future<void> _open(SalahMission mission) async {
    if (!await _notice(_data!.world(mission.world)) || !mounted) return;
    await Navigator.of(context).push<void>(
      MaterialPageRoute(
        builder: (_) => PaidGate(
          free: mission.id == _data!.missions.first.id,
          child: SalahMissionScreen(
            data: _data!,
            mission: mission,
            progress: _progress[mission.id] ?? const SalahProgress(),
            onSave: (value) async {
              final next = {..._progress, mission.id: value};
              await _store.save(next);
              if (mounted) setState(() => _progress = next);
            },
          ),
        ),
      ),
    );
  }

  void _push(Widget screen) => Navigator.of(
    context,
  ).push<void>(MaterialPageRoute(builder: (_) => screen));

  void _aboutWorld(SalahWorld w) => showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    backgroundColor: Colors.white,
    builder: (context) => DraggableScrollableSheet(
      expand: false,
      initialChildSize: .75,
      maxChildSize: .95,
      builder: (context, scroll) => ListView(
        key: const Key('salah-world-about'),
        controller: scroll,
        padding: const EdgeInsets.fromLTRB(22, 0, 22, 28),
        children: [
          eyebrow('World ${w.code}'),
          const SizedBox(height: 4),
          salahHeading(w.title),
          const SizedBox(height: 14),
          if (w.discover != null) ...[
            Text(w.discover!, style: bodyText()),
            const SizedBox(height: 14),
          ],
          if (w.outcome != null) ...[
            eyebrow('What you will learn'),
            const SizedBox(height: 6),
            Text(w.outcome!, style: bodyText(16)),
            const SizedBox(height: 14),
          ],
          eyebrow(w.guidance.isNotEmpty ? 'Getting ready' : 'Step by step'),
          const SizedBox(height: 8),
          for (final (i, s) in [...w.guidance, ...w.teachingFlow].indexed)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                    radius: 13,
                    backgroundColor: salahTint,
                    child: Text(
                      '${i + 1}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: salahAccent,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(child: Text(s, style: bodyText(15.5))),
                ],
              ),
            ),
          if (w.evidence != null) ...[
            const SizedBox(height: 6),
            eyebrow('Evidence'),
            const SizedBox(height: 6),
            Text(w.evidence!, style: bodyText(15)),
          ],
          if (w.recitationsNote != null) ...[
            const SizedBox(height: 14),
            eyebrow('Words to connect'),
            const SizedBox(height: 6),
            Text(w.recitationsNote!, style: bodyText(15)),
          ],
          if (w.adultNote != null) ...[
            const SizedBox(height: 16),
            GrownUpNote(text: w.adultNote!, title: 'Scholarly note'),
          ],
        ],
      ),
    ),
  );

  String _status(SalahMission m) {
    final p = _progress[m.id];
    if (p == null) return m.steps.join(' • ');
    if (!p.explored) {
      return 'Continue from step ${p.step + 1} of ${m.steps.length}';
    }
    return switch (p.reflection) {
      'yes' => 'Explored • You tried your action',
      'tried' => 'Explored • You gave it a try',
      _ => 'Explored • Action planned',
    };
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    key: const Key('salah-course'),
    appBar: AppBar(title: const Text('My Salah Journey')),
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
            : _data == null
            ? const Center(child: CircularProgressIndicator())
            : _list(_data!),
      ),
    ),
  );

  Widget _list(SalahCourseData data) {
    final core = data.coreMissions;
    final done = core.where((m) => _progress[m.id]?.explored ?? false).length;
    final next = core.firstWhere(
      (m) => !(_progress[m.id]?.explored ?? false),
      orElse: () => core.first,
    );
    var reveal = 0;
    return ListView(
      key: const Key('salah-mission-list'),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
      children: [
        Reveal(index: reveal++, child: _hero(done, core.length, next)),
        const SizedBox(height: 14),
        Reveal(
          index: reveal++,
          child: Row(
            children: [
              Expanded(
                child: _tool(
                  key: const Key('salah-library'),
                  icon: Icons.menu_book_rounded,
                  title: 'Recitation library',
                  subtitle: '${data.recitations.length} texts',
                  onTap: () => _push(SalahLibraryScreen(data: data)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _tool(
                  key: const Key('salah-differences'),
                  icon: Icons.diversity_3_rounded,
                  title: 'Respecting differences',
                  subtitle: 'Notes on Fiqh',
                  onTap: () => _push(SalahDifferencesScreen(data: data)),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Reveal(
          index: reveal++,
          child: SoftCard(
            color: salahTint,
            border: salahTint,
            padding: const EdgeInsets.all(14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(
                  Icons.fact_check_outlined,
                  color: salahAccent,
                  size: 20,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    data.reviewNote,
                    key: const Key('salah-review-note'),
                    style: const TextStyle(fontSize: 13.5, height: 1.45),
                  ),
                ),
              ],
            ),
          ),
        ),
        for (final w in data.worlds) ...[
          const SizedBox(height: 22),
          _worldHeader(w),
          const SizedBox(height: 10),
          for (final m in data.missionsIn(w.id))
            Reveal(index: reveal++, child: _missionTile(m)),
        ],
        const SizedBox(height: 10),
        Text(
          widget.scope == 'guest'
              ? 'Trying as a guest. Progress is saved on this device.'
              : 'Progress is saved on this device for this learner.',
          style: const TextStyle(fontSize: 12, color: softInk, height: 1.5),
        ),
        const SizedBox(height: 6),
        Text(
          'Practise real Salah with your family or teacher. This app teaches; '
          'it never says whether a prayer is accepted.',
          style: const TextStyle(fontSize: 12, color: softInk, height: 1.5),
        ),
      ],
    );
  }

  Widget _hero(int done, int total, SalahMission next) => Container(
    padding: const EdgeInsets.all(22),
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(26),
      gradient: const LinearGradient(
        colors: [brandNavy, Color(0xFF4B3A93), salahAccent],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'MY SALAH JOURNEY',
          style: TextStyle(
            color: Color(0xFFE3D9FF),
            fontSize: 12,
            fontWeight: FontWeight.w800,
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Learn with care\nand confidence',
          style: displayStyle(29, color: Colors.white, height: 1.12),
        ),
        const SizedBox(height: 14),
        Text(
          '$done of $total missions explored',
          key: const Key('salah-progress-count'),
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 8),
        LinearProgressIndicator(
          value: done / total,
          minHeight: 6,
          borderRadius: BorderRadius.circular(8),
          backgroundColor: Colors.white.withValues(alpha: .2),
          color: const Color(0xFFFFC9DE),
        ),
        const SizedBox(height: 6),
        Text(
          'Plus 2 optional advanced missions',
          style: TextStyle(
            color: Colors.white.withValues(alpha: .8),
            fontSize: 12.5,
          ),
        ),
        const SizedBox(height: 16),
        Pressable(
          child: FilledButton.icon(
            key: const Key('salah-next-mission'),
            style: FilledButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: brandNavy,
              minimumSize: const Size(48, 48),
            ),
            onPressed: () => _open(next),
            icon: const Icon(Icons.play_arrow_rounded),
            label: Text(
              '${next.id} • ${next.title}',
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ),
      ],
    ),
  );

  Widget _tool({
    required Key key,
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) => Pressable(
    child: Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        key: key,
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: Ink(
          decoration: cardDecoration(),
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: salahAccent),
              const SizedBox(height: 8),
              Text(title, style: displayStyle(16, color: ink, height: 1.2)),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(color: softInk, fontSize: 13),
              ),
            ],
          ),
        ),
      ),
    ),
  );

  Widget _worldHeader(SalahWorld w) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Wrap(
        spacing: 8,
        runSpacing: 4,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          TagChip('World ${w.code}', color: salahAccent),
          if (w.optional)
            const TagChip('Optional • with a grown-up', color: brandOrange),
        ],
      ),
      const SizedBox(height: 6),
      Text(w.title, style: displayStyle(22, color: ink, height: 1.15)),
      if (w.discover != null) ...[
        const SizedBox(height: 4),
        Text(w.discover!, style: const TextStyle(color: softInk, height: 1.45)),
      ],
      TextButton(
        key: Key('salah-about-${w.id}'),
        style: TextButton.styleFrom(padding: EdgeInsets.zero),
        onPressed: () => _aboutWorld(w),
        child: const Text('About this world'),
      ),
    ],
  );

  Widget _missionTile(SalahMission m) {
    final explored = _progress[m.id]?.explored ?? false;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Pressable(
        scale: .97,
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
              key: Key('salah-mission-${m.id}'),
              onTap: () => _open(m),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Row(
                  children: [
                    Container(
                      width: 46,
                      height: 46,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: explored ? salahAccent : salahTint,
                        borderRadius: BorderRadius.circular(15),
                      ),
                      child: Text(
                        m.id,
                        style: displayStyle(
                          16,
                          color: explored ? Colors.white : salahAccent,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            m.title,
                            style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              color: ink,
                              fontSize: 16,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            _status(m),
                            style: const TextStyle(
                              color: softInk,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Icon(
                      explored
                          ? Icons.check_circle_rounded
                          : Icons.chevron_right_rounded,
                      color: salahAccent,
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

// ───────────────────────────── Mission ─────────────────────────────

class SalahMissionScreen extends StatefulWidget {
  const SalahMissionScreen({
    super.key,
    required this.data,
    required this.mission,
    required this.progress,
    required this.onSave,
  });
  final SalahCourseData data;
  final SalahMission mission;
  final SalahProgress progress;
  final Future<void> Function(SalahProgress) onSave;
  @override
  State<SalahMissionScreen> createState() => _SalahMissionScreenState();
}

class _SalahMissionScreenState extends State<SalahMissionScreen> {
  /// Stars for this mission; the world's badge once its missions are done.
  void _reward() {
    final m = widget.mission;
    final world = widget.data.worlds.where((w) => w.id == m.world).firstOrNull;
    celebrateFinish(
      context,
      course: 'salah',
      item: m.id,
      group: m.world,
      groupTitle: world?.title,
      groupItems: widget.data.missions
          .where((x) => x.world == m.world)
          .map((x) => x.id),
    );
  }

  late SalahProgress _progress = _clamped(widget.progress);
  late bool _summary = _progress.explored;
  late String? _reflection = _progress.reflection;
  bool _busy = false, _hidden = false, _reflectionSaved = false;
  String? _error;
  final _scroll = ScrollController();

  SalahMission get _m => widget.mission;
  List<String> get _steps => _m.steps;
  int get _last => _steps.length - 1;
  String get _stepName => _steps[_progress.step];

  SalahProgress _clamped(SalahProgress p) =>
      p.step > _m.steps.length - 1 ? p.copyWith(step: _m.steps.length - 1) : p;

  bool get _correct =>
      _progress.choice != null && _progress.choice == _m.check.correct;

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  void _top() {
    if (_scroll.hasClients) _scroll.jumpTo(0);
  }

  Future<bool> _persist(SalahProgress value) async {
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
      key: const Key('salah-mission-screen'),
      appBar: AppBar(
        leading: BackButton(onPressed: _busy ? null : _back),
        title: Text('${_m.id} • ${_m.title}'),
      ),
      body: SafeArea(
        child: ConstrainedBody(
          maxWidth: 640,
          child: Column(
            children: [
              if (!_summary) ...[
                Padding(
                  padding: const EdgeInsets.fromLTRB(22, 8, 22, 10),
                  child: Row(
                    children: [
                      Text(
                        'Step ${_progress.step + 1} of ${_steps.length}',
                        style: const TextStyle(
                          color: salahAccent,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _stepName,
                          key: const Key('salah-step-title'),
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
                  value: (_progress.step + 1) / _steps.length,
                  minHeight: 3,
                  color: salahAccent,
                  backgroundColor: const Color(0xFFE5E9F0),
                ),
              ],
              Expanded(
                child: ListView(
                  key: const Key('salah-mission-body'),
                  controller: _scroll,
                  padding: const EdgeInsets.all(22),
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
                      key: const Key('salah-save-error'),
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
                    key: const Key('salah-next'),
                    style: FilledButton.styleFrom(
                      backgroundColor: salahAccent,
                      minimumSize: const Size(48, 52),
                    ),
                    onPressed:
                        _busy ||
                            (!_summary &&
                                _progress.step == _m.checkStep &&
                                !_correct)
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

  List<Widget> _content() => switch (_stepName) {
    'Story' => _story(),
    'Learn' => _learn(),
    'Words' => _words(),
    'Check' => _check(),
    _ => _practise(),
  };

  List<Widget> _story() {
    final w = widget.data.world(_m.world);
    final first = widget.data.missionsIn(w.id).first.id == _m.id;
    return [
      Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(22),
          gradient: const LinearGradient(
            colors: [brandNavy, salahAccent],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'WORLD ${w.code} • ${w.title.toUpperCase()}',
              style: const TextStyle(
                color: Color(0xFFE3D9FF),
                fontSize: 12,
                fontWeight: FontWeight.w800,
                letterSpacing: .8,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _m.title,
              style: displayStyle(26, color: Colors.white, height: 1.15),
            ),
          ],
        ),
      ),
      if (first) ...[
        const SizedBox(height: 16),
        SoftCard(
          color: salahTint,
          border: salahTint,
          child: Text(
            w.opening,
            style: const TextStyle(
              fontSize: 16,
              height: 1.5,
              fontStyle: FontStyle.italic,
              color: ink,
            ),
          ),
        ),
      ],
      const SizedBox(height: 20),
      salahHeading('With Imaan & Akhlaq'),
      const SizedBox(height: 12),
      StoryCards(paragraphs: [_m.scene], accent: salahAccent),
      const SizedBox(height: 16),
      const Text(
        'A teaching story set in Amanpur',
        style: TextStyle(color: softInk, fontSize: 12),
      ),
    ];
  }

  List<Widget> _learn() {
    final fiqh = widget.data.fiqh;
    final respect = switch (_m.id) {
      'F3' => fiqh.rafChild,
      'F2' || 'F8' || 'W1' || 'W2' || 'J2' || 'I2' => fiqh.disclaimer,
      _ => null,
    };
    return [
      salahHeading('What we learn'),
      const SizedBox(height: 12),
      Text(
        _m.learn,
        style: const TextStyle(
          fontSize: 19,
          height: 1.5,
          fontWeight: FontWeight.w600,
          color: ink,
        ),
      ),
      if (_m.table != null) ...[
        const SizedBox(height: 22),
        SalahTableView(_m.table!),
      ],
      if (respect != null) ...[
        const SizedBox(height: 18),
        SoftCard(
          key: const Key('salah-respect-note'),
          color: const Color(0xFFEAF5EF),
          border: const Color(0xFFCFE8DA),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              eyebrow('Respecting differences', color: successInk),
              const SizedBox(height: 6),
              Text(respect, style: bodyText(16)),
            ],
          ),
        ),
      ],
      const SizedBox(height: 20),
      eyebrow('Evidence'),
      const SizedBox(height: 6),
      Text(
        _m.evidence,
        key: const Key('salah-evidence'),
        style: const TextStyle(fontWeight: FontWeight.w700, color: brandNavy),
      ),
      if (_m.links.isNotEmpty) SourceLinks(_m.links),
    ];
  }

  List<Widget> _words() => [
    salahHeading('Words to remember'),
    const SizedBox(height: 10),
    Text(
      'Read each part slowly with a grown-up. The Arabic is the original; '
      'the meanings help you understand it.',
      style: bodyText(16),
    ),
    const SizedBox(height: 18),
    for (final id in _m.recitations) ...[
      RecitationCard(r: widget.data.recitation(id), hidden: _hidden),
      const SizedBox(height: 14),
    ],
    OutlinedButton(
      key: const Key('salah-hide-words'),
      onPressed: () => setState(() => _hidden = !_hidden),
      child: Text(_hidden ? 'Show the words' : 'Hide the words and remember'),
    ),
  ];

  List<Widget> _check() {
    final c = _m.check;
    return [
      salahHeading('Think and choose'),
      const SizedBox(height: 12),
      Text(c.question, style: bodyText(19)),
      const SizedBox(height: 20),
      for (var i = 0; i < c.options.length; i++)
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: OutlinedButton(
            key: Key('salah-option-$i'),
            onPressed: _busy
                ? null
                : () {
                    VoiceGuide.instance.play(
                      i == _m.check.correct
                          ? VoiceLine.correct
                          : VoiceLine.tryAgain,
                    );
                    _persist(_progress.copyWith(choice: i));
                  },
            style: OutlinedButton.styleFrom(
              alignment: Alignment.centerLeft,
              padding: const EdgeInsets.all(16),
              minimumSize: const Size(48, 56),
              backgroundColor: _progress.choice == i ? salahTint : Colors.white,
              side: BorderSide(
                color: _progress.choice == i
                    ? salahAccent
                    : const Color(0xFFCBD3E1),
              ),
            ),
            child: Text(
              c.options[i],
              style: const TextStyle(fontSize: 16, height: 1.4, color: ink),
            ),
          ),
        ),
      if (_progress.choice != null)
        Semantics(
          liveRegion: true,
          child: Container(
            key: Key(_correct ? 'salah-feedback' : 'salah-try-again'),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: _correct
                  ? const Color(0xFFE8F4ED)
                  : const Color(0xFFFFEFD9),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(
              _correct ? c.feedback : widget.data.tryAgain,
              style: bodyText(16),
            ),
          ),
        ),
    ];
  }

  List<Widget> _practise() => [
    salahHeading('One small action'),
    const SizedBox(height: 16),
    SoftCard(
      color: salahTint,
      border: salahTint,
      padding: const EdgeInsets.all(22),
      child: Text(
        _m.action,
        key: const Key('salah-action'),
        style: const TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          height: 1.5,
          color: ink,
        ),
      ),
    ),
    const SizedBox(height: 16),
    Text(
      'Practise real Salah offline with your family or teacher. '
      'No photos, recordings or proof are needed.',
      style: bodyText(16),
    ),
    const SizedBox(height: 18),
    GrownUpNote(text: _m.guardrail),
  ];

  List<Widget> _finish() => [
    const Icon(Icons.spa_outlined, size: 56, color: salahAccent),
    const SizedBox(height: 16),
    salahHeading('Mission explored', centered: true),
    const SizedBox(height: 10),
    const Text(
      'You explored this mission and saved your action plan.',
      textAlign: TextAlign.center,
      style: TextStyle(fontSize: 17, height: 1.5),
    ),
    const SizedBox(height: 22),
    SoftCard(
      color: salahTint,
      border: salahTint,
      child: Text(
        _m.action,
        style: const TextStyle(
          fontSize: 18,
          height: 1.5,
          fontWeight: FontWeight.w700,
          color: ink,
        ),
      ),
    ),
    const SizedBox(height: 24),
    salahHeading('When you have had a chance…'),
    const SizedBox(height: 8),
    const Text(
      'Did you get a chance to try your action? Every answer is okay.',
      style: TextStyle(fontSize: 16, height: 1.5),
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
          key: Key('salah-reflect-${e.key}'),
          style: OutlinedButton.styleFrom(
            alignment: Alignment.centerLeft,
            minimumSize: const Size(double.infinity, 48),
            backgroundColor: _reflection == e.key ? salahTint : Colors.white,
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
      key: const Key('salah-save-reflection'),
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
      'Come back another day for a gentle review.',
      style: TextStyle(color: softInk, height: 1.5),
    ),
    TextButton(
      key: const Key('salah-again'),
      onPressed: _busy
          ? null
          : () async {
              if (await _persist(
                    _progress.copyWith(step: 0, clearChoice: true),
                  ) &&
                  mounted) {
                setState(() => _summary = false);
                _top();
              }
            },
      child: const Text('Explore the mission again'),
    ),
  ];
}

// ───────────────────────────── Library ─────────────────────────────

class SalahLibraryScreen extends StatelessWidget {
  const SalahLibraryScreen({super.key, required this.data});
  final SalahCourseData data;
  @override
  Widget build(BuildContext context) => Scaffold(
    key: const Key('salah-library-screen'),
    appBar: AppBar(title: const Text('Recitation library')),
    body: SafeArea(
      child: ConstrainedBody(
        maxWidth: 640,
        child: ListView(
          key: const Key('salah-library-list'),
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              'The words of Salah, each with its meaning and source. '
              'Arabic is the original; English and Urdu help you understand.',
              style: bodyText(16),
            ),
            const SizedBox(height: 10),
            Text(
              data.reviewNote,
              style: const TextStyle(color: softInk, fontSize: 13),
            ),
            const SizedBox(height: 16),
            for (final r in data.recitations) ...[
              RecitationCard(r: r),
              const SizedBox(height: 14),
            ],
          ],
        ),
      ),
    ),
  );
}

// ───────────────────────────── Differences ─────────────────────────────

class SalahDifferencesScreen extends StatelessWidget {
  const SalahDifferencesScreen({super.key, required this.data});
  final SalahCourseData data;
  @override
  Widget build(BuildContext context) {
    final f = data.fiqh;
    final ask = RegExp(r'“(.+?)”').firstMatch(f.noProfile)?.group(1);
    return Scaffold(
      key: const Key('salah-differences-screen'),
      appBar: AppBar(title: const Text('Respecting differences')),
      body: SafeArea(
        child: ConstrainedBody(
          maxWidth: 640,
          child: ListView(
            padding: const EdgeInsets.all(18),
            children: [
              salahHeading('Many Muslims, recognized ways'),
              const SizedBox(height: 12),
              Text(f.disclaimer, style: bodyText(18)),
              const SizedBox(height: 14),
              SoftCard(
                color: const Color(0xFFEAF5EF),
                border: const Color(0xFFCFE8DA),
                child: Text(f.rafChild, style: bodyText(16)),
              ),
              if (ask != null) ...[
                const SizedBox(height: 14),
                Row(
                  children: [
                    const Icon(
                      Icons.record_voice_over_outlined,
                      color: salahAccent,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        '$ask.',
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          color: ink,
                          fontSize: 16,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 22),
              Text(
                'Where practice differs',
                style: displayStyle(20, color: ink),
              ),
              const SizedBox(height: 10),
              for (final t in f.topics)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: SoftCard(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          t.topic,
                          style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            color: salahAccent,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(t.difference, style: bodyText(15.5)),
                        const SizedBox(height: 6),
                        Text(
                          t.rule,
                          style: const TextStyle(
                            color: softInk,
                            fontSize: 14,
                            height: 1.45,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 12),
              GrownUpNote(
                title: 'For parents and teachers',
                text: f.parentNote,
              ),
              const SizedBox(height: 12),
              GrownUpNote(
                title: 'Raf‘ al-Yadayn: source note',
                text: f.rafAdult,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
