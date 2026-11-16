import '../../billing/paywall.dart';
import '../../audio/voice.dart';
import 'package:imaan_akhlaq/rewards/reward_widgets.dart';
import 'dart:math';
import 'package:flutter/material.dart';
import '../../app_theme.dart';
import '../../screens/ui_kit.dart';
import 'ibrah_data.dart';

/// Course accent (Prophet Stories) from courseAccents in learning_experience.
const ibrahAccent = Color(0xFFC2416E);
const _tint = Color(0xFFFBEAF0);
const _reviewBanner =
    'Working edition from the content owner. Arabic, meanings and stories still need scholarly review before release.';

// ---- course home: one card per prophet ----------------------------------------

class IbrahCourseScreen extends StatefulWidget {
  const IbrahCourseScreen({super.key, required this.scope, this.store});
  final String scope;
  final IbrahProgressStore? store;
  @override
  State<IbrahCourseScreen> createState() => _IbrahCourseScreenState();
}

class _IbrahCourseScreenState extends State<IbrahCourseScreen> {
  late final _progress = IbrahProgressController(
    widget.store ?? DeviceIbrahProgressStore.forLearner(widget.scope),
  );
  List<IbrahVolumeSummary>? _volumes;
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
      final v = await IbrahLibrary.index();
      await _progress.load();
      if (mounted) setState(() => _volumes = v);
    } catch (_) {
      if (mounted) {
        setState(
          () => _error =
              'We could not load the stories and your saved progress. Please try again.',
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    key: const Key('ibrah-course'),
    backgroundColor: canvas,
    appBar: AppBar(title: const Text('Stories of the Prophets')),
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
            : ListenableBuilder(
                listenable: _progress,
                builder: (context, _) => ListView(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
                  children: [
                    _Hero(volumes: _volumes!, progress: _progress.progress),
                    const SizedBox(height: 18),
                    for (var i = 0; i < _volumes!.length; i++)
                      Reveal(
                        index: i,
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _VolumeCard(
                            summary: _volumes![i],
                            progress: _progress.progress,
                            onTap: () => Navigator.of(context).push(
                              MaterialPageRoute<void>(
                                builder: (_) => IbrahVolumeScreen(
                                  summary: _volumes![i],
                                  progress: _progress,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    const SizedBox(height: 6),
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
                      _reviewBanner,
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
    ),
  );
}

class _Hero extends StatelessWidget {
  const _Hero({required this.volumes, required this.progress});
  final List<IbrahVolumeSummary> volumes;
  final IbrahProgress progress;
  @override
  Widget build(BuildContext context) {
    final total = volumes.fold<int>(0, (a, v) => a + v.missions);
    final done = volumes.fold<int>(
      0,
      (a, v) => a + progress.missionsDone(v.id),
    );
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: brandNavy,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'ʿIBRAH JUNIOR • QISAS-UL-NABIYEEN',
            style: TextStyle(
              color: Color(0xFFFFD6E7),
              fontSize: 12,
              fontWeight: FontWeight.w800,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            '${volumes.length} Prophets.\nStories to live by.',
            style: displayStyle(28, color: Colors.white, height: 1.15),
          ),
          const SizedBox(height: 14),
          Text(
            '$done of $total missions explored',
            key: const Key('ibrah-progress-count'),
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 10),
          LinearProgressIndicator(
            value: total == 0 ? 0 : done / total,
            minHeight: 6,
            borderRadius: BorderRadius.circular(8),
            backgroundColor: const Color(0xFF465682),
            color: brandPink,
          ),
        ],
      ),
    );
  }
}

class _VolumeCard extends StatelessWidget {
  const _VolumeCard({
    required this.summary,
    required this.progress,
    required this.onTap,
  });
  final IbrahVolumeSummary summary;
  final IbrahProgress progress;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    final done = progress.missionsDone(summary.id);
    final complete = done >= summary.missions && summary.missions > 0;
    return Pressable(
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          key: Key('ibrah-volume-${summary.number}'),
          borderRadius: BorderRadius.circular(20),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 48,
                  height: 48,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: complete ? ibrahAccent : _tint,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: complete
                      ? const Icon(Icons.check, color: Colors.white)
                      : Text(
                          '${summary.number}',
                          style: displayStyle(20, color: ibrahAccent),
                        ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Wrap(
                        crossAxisAlignment: WrapCrossAlignment.center,
                        spacing: 8,
                        children: [
                          Text(summary.prophet, style: displayStyle(20)),
                          Text(
                            summary.prophetArabic,
                            textDirection: TextDirection.rtl,
                            style: const TextStyle(
                              fontFamily: 'NotoNaskhArabic',
                              fontSize: 17,
                              color: ibrahAccent,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        summary.title,
                        style: const TextStyle(
                          color: ink,
                          fontWeight: FontWeight.w700,
                          height: 1.3,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '${summary.stories} stories • ${summary.missions} missions'
                        '${done > 0 ? ' • $done explored' : ''}',
                        style: const TextStyle(color: mutedInk, fontSize: 13),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: ibrahAccent),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ---- volume: stories, missions, review ----------------------------------------

class IbrahVolumeScreen extends StatefulWidget {
  const IbrahVolumeScreen({
    super.key,
    required this.summary,
    required this.progress,
  });
  final IbrahVolumeSummary summary;
  final IbrahProgressController progress;
  @override
  State<IbrahVolumeScreen> createState() => _IbrahVolumeScreenState();
}

class _IbrahVolumeScreenState extends State<IbrahVolumeScreen> {
  IbrahVolume? _volume;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _failed = false);
    try {
      final v = await IbrahLibrary.volume(widget.summary);
      if (mounted) setState(() => _volume = v);
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  void _push(Widget screen) => Navigator.of(
    context,
  ).push(MaterialPageRoute<void>(builder: (_) => screen));

  @override
  Widget build(BuildContext context) {
    final v = _volume;
    return Scaffold(
      key: const Key('ibrah-volume-screen'),
      backgroundColor: canvas,
      appBar: AppBar(title: Text('Prophet ${widget.summary.prophet}')),
      body: SafeArea(
        child: ConstrainedBody(
          maxWidth: 640,
          child: _failed
              ? MessageView(
                  title: 'Let’s try again',
                  message: 'This volume could not be opened. Please try again.',
                  action: FilledButton(
                    onPressed: _load,
                    child: const Text('Retry'),
                  ),
                )
              : v == null
              ? const Center(child: CircularProgressIndicator())
              : ListenableBuilder(
                  listenable: widget.progress,
                  builder: (context, _) {
                    final p = widget.progress.progress;
                    return ListView(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
                      children: [
                        _VolumeHeader(volume: v),
                        const SizedBox(height: 22),
                        _SectionLabel(
                          'Stories',
                          '${p.storiesDone(v.id)} of ${v.stories.length} read',
                        ),
                        const SizedBox(height: 10),
                        for (final s in v.stories)
                          _Row(
                            key: Key('ibrah-story-${s.number}'),
                            leading: '${s.number}',
                            title: s.title,
                            subtitle: s.subtitle ?? 'Imaan & Akhlaq story',
                            done: p.storyRead(v.id, s.id),
                            icon: Icons.menu_book_outlined,
                            onTap: () => _push(
                              PaidGate(
                                free: v.number == 1 && s.number == 1,
                                child: IbrahStoryScreen(
                                  volume: v,
                                  story: s,
                                  progress: widget.progress,
                                ),
                              ),
                            ),
                          ),
                        const SizedBox(height: 22),
                        _SectionLabel(
                          'Missions',
                          '${p.missionsDone(v.id)} of ${v.missions.length} explored',
                        ),
                        const SizedBox(height: 10),
                        for (final m in v.missions)
                          _Row(
                            key: Key('ibrah-mission-${m.number}'),
                            leading: '${m.number}',
                            title: m.title,
                            subtitle: _missionStatus(p.mission(v.id, m.id), m),
                            done: p.mission(v.id, m.id).done,
                            icon: Icons.flag_outlined,
                            onTap: () => _push(
                              PaidGate(
                                free: v.number == 1 && m.story == 1,
                                child: IbrahMissionScreen(
                                  volume: v,
                                  mission: m,
                                  progress: widget.progress,
                                ),
                              ),
                            ),
                          ),
                        const SizedBox(height: 22),
                        _SectionLabel(
                          'Review',
                          p.reviewed.containsKey(v.id)
                              ? 'Reviewed'
                              : 'At the end',
                        ),
                        const SizedBox(height: 10),
                        _Row(
                          key: const Key('ibrah-review'),
                          leading: '★',
                          title: 'Volume review',
                          subtitle: v.review.length >= 2
                              ? 'Match the Qur’anic words to their meaning'
                              : 'Read the closing lesson',
                          done: p.reviewed.containsKey(v.id),
                          icon: Icons.auto_awesome_outlined,
                          onTap: () => _push(
                            PaidGate(
                              free: false,
                              child: IbrahReviewScreen(
                                volume: v,
                                progress: widget.progress,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 18),
                        Text(
                          'Source: ${v.sourceDocument}',
                          style: const TextStyle(
                            fontSize: 12,
                            color: mutedInk,
                            height: 1.5,
                          ),
                        ),
                      ],
                    );
                  },
                ),
        ),
      ),
    );
  }

  String _missionStatus(IbrahMissionProgress p, IbrahMission m) {
    final story = m.story == null ? '' : 'Story ${m.story} • ';
    if (p.done) {
      return switch (p.reflection) {
        'practised' => '${story}Explored • Practised',
        'learning' => '${story}Explored • Still learning',
        _ => '${story}Explored',
      };
    }
    if (p.step > 0) return '${story}Continue from step ${p.step + 1} of 4';
    return '${story}Discover • Decide • Act • Remember';
  }
}

class _VolumeHeader extends StatelessWidget {
  const _VolumeHeader({required this.volume});
  final IbrahVolume volume;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(22),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'VOLUME ${volume.number}',
          style: const TextStyle(
            color: ibrahAccent,
            fontSize: 12,
            fontWeight: FontWeight.w800,
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: 6),
        Text(volume.heading, style: displayStyle(22, height: 1.2)),
        const SizedBox(height: 4),
        Text(
          volume.title,
          style: const TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w700,
            color: ink,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          volume.themes,
          style: const TextStyle(color: mutedInk, height: 1.4),
        ),
        for (final p in volume.introduction.take(1)) ...[
          const SizedBox(height: 12),
          Text(
            p,
            style: const TextStyle(fontSize: 15, height: 1.55, color: ink),
          ),
        ],
        const SizedBox(height: 12),
        _Note(volume.reviewNote),
      ],
    ),
  );
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.title, this.trailing);
  final String title, trailing;
  @override
  Widget build(BuildContext context) => Wrap(
    alignment: WrapAlignment.spaceBetween,
    crossAxisAlignment: WrapCrossAlignment.end,
    spacing: 12,
    children: [
      Text(title, style: displayStyle(22)),
      Text(trailing, style: const TextStyle(color: mutedInk, fontSize: 13)),
    ],
  );
}

class _Row extends StatelessWidget {
  const _Row({
    super.key,
    required this.leading,
    required this.title,
    required this.subtitle,
    required this.done,
    required this.icon,
    required this.onTap,
  });
  final String leading, title, subtitle;
  final bool done;
  final IconData icon;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: Pressable(
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(
              children: [
                CircleAvatar(
                  backgroundColor: done ? ibrahAccent : _tint,
                  foregroundColor: done ? Colors.white : ibrahAccent,
                  child: done
                      ? const Icon(Icons.check, size: 20)
                      : Text(
                          leading,
                          style: const TextStyle(fontWeight: FontWeight.w800),
                        ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          color: ink,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        subtitle,
                        style: const TextStyle(
                          color: mutedInk,
                          fontSize: 13,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(icon, color: ibrahAccent),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}

// ---- shared text widgets -------------------------------------------------------

class _Note extends StatelessWidget {
  const _Note(this.text);
  final String text;
  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: const Color(0xFFFFF4E5),
      borderRadius: BorderRadius.circular(14),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Icon(Icons.info_outline, size: 18, color: brandOrange),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(fontSize: 13, height: 1.45, color: ink),
          ),
        ),
      ],
    ),
  );
}

Widget _heading(String text, {bool centered = false}) => Text(
  text,
  textAlign: centered ? TextAlign.center : TextAlign.start,
  style: displayStyle(24, height: 1.2),
);

Widget _arabic(String text, {Key? key}) => Container(
  key: key,
  width: double.infinity,
  padding: const EdgeInsets.all(18),
  decoration: BoxDecoration(
    color: Colors.white,
    borderRadius: BorderRadius.circular(18),
    border: Border.all(color: const Color(0xFFE0E5EF)),
  ),
  child: Text(
    text,
    textDirection: TextDirection.rtl,
    textAlign: TextAlign.center,
    style: const TextStyle(
      fontFamily: 'NotoNaskhArabic',
      fontSize: 26,
      height: 1.9,
      color: brandNavy,
    ),
  ),
);

/// Renders source blocks: headings, paragraphs, labelled lines and Arabic.
List<Widget> _blocks(List<IbrahBlock> blocks, {double size = 17}) => [
  for (final b in blocks)
    Padding(
      padding: EdgeInsets.only(
        bottom: b.kind == 'h' ? 6 : 12,
        top: b.kind == 'h' ? 6 : 0,
      ),
      child: switch (b.kind) {
        'ar' => _arabic(b.text),
        'h' => Text(
          b.text,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: ibrahAccent,
            height: 1.35,
          ),
        ),
        'kv' => Text.rich(
          TextSpan(
            children: [
              TextSpan(
                text: '${b.label}  ',
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  color: brandNavy,
                ),
              ),
              TextSpan(text: b.text),
            ],
          ),
          style: TextStyle(fontSize: size, height: 1.55, color: ink),
        ),
        _ => Text(
          b.text,
          style: TextStyle(fontSize: size, height: 1.6, color: ink),
        ),
      },
    ),
];

Widget _evidenceCard(IbrahEvidence e) => Padding(
  padding: const EdgeInsets.only(bottom: 14),
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      _arabic(e.arabic),
      if (e.reference != null)
        Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Text(
            e.reference!,
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              color: brandNavy,
            ),
          ),
        ),
      if (e.meaning != null)
        Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Text(
            e.meaning!,
            style: const TextStyle(fontSize: 16, height: 1.5, color: ink),
          ),
        ),
    ],
  ),
);

Widget _bottomButton({
  required Key key,
  required String label,
  required VoidCallback? onPressed,
  bool busy = false,
}) => Padding(
  padding: const EdgeInsets.fromLTRB(16, 8, 16, 14),
  child: SizedBox(
    width: double.infinity,
    child: FilledButton(
      key: key,
      style: FilledButton.styleFrom(
        backgroundColor: ibrahAccent,
        minimumSize: const Size(48, 52),
      ),
      onPressed: busy ? null : onPressed,
      child: busy
          ? const SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : Text(label, textAlign: TextAlign.center),
    ),
  ),
);

const _saveError = 'Your progress was not saved. Please try again.';

Widget _errorLine(BuildContext context, String? error) => error == null
    ? const SizedBox.shrink()
    : Padding(
        padding: const EdgeInsets.fromLTRB(16, 6, 16, 0),
        child: Semantics(
          liveRegion: true,
          child: Text(
            error,
            key: const Key('ibrah-save-error'),
            style: TextStyle(color: Theme.of(context).colorScheme.error),
          ),
        ),
      );

// ---- story reading ----------------------------------------------------------------

class IbrahStoryScreen extends StatefulWidget {
  const IbrahStoryScreen({
    super.key,
    required this.volume,
    required this.story,
    required this.progress,
  });
  final IbrahVolume volume;
  final IbrahStory story;
  final IbrahProgressController progress;
  @override
  State<IbrahStoryScreen> createState() => _IbrahStoryScreenState();
}

class _IbrahStoryScreenState extends State<IbrahStoryScreen> {
  bool _busy = false;
  String? _error;

  Future<void> _finish() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    final p = widget.progress;
    final ok =
        p.progress.storyRead(widget.volume.id, widget.story.id) ||
        await p.save(p.progress.withStory(widget.volume.id, widget.story.id));
    if (!mounted) return;
    setState(() {
      _busy = false;
      if (!ok) _error = _saveError;
    });
    if (ok) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.story;
    final linked = widget.volume.missionsFor(s.number);
    return Scaffold(
      key: const Key('ibrah-story-screen'),
      backgroundColor: canvas,
      appBar: AppBar(title: Text('Story ${s.number}')),
      body: SafeArea(
        child: ConstrainedBody(
          maxWidth: 640,
          child: Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
                  children: [
                    Text(
                      'PROPHET ${widget.volume.prophet.toUpperCase()} • STORY ${s.number} OF ${widget.volume.stories.length}',
                      style: const TextStyle(
                        color: ibrahAccent,
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        letterSpacing: .8,
                      ),
                    ),
                    const SizedBox(height: 8),
                    _heading(s.title),
                    if (s.subtitle != null) ...[
                      const SizedBox(height: 6),
                      Text(
                        s.subtitle!,
                        style: const TextStyle(
                          color: mutedInk,
                          fontSize: 16,
                          height: 1.4,
                        ),
                      ),
                    ],
                    const SizedBox(height: 14),
                    const _Note(
                      'A modern Imaan & Akhlaq teaching story. The characters and conversations are fiction; only the cited Qur’an and Hadith are sacred text.',
                    ),
                    const SizedBox(height: 18),
                    ..._blocks(s.blocks, size: 18),
                    if (linked.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(
                        linked.length == 1
                            ? 'Mission for this story: ${linked.first.title}'
                            : 'Missions for this story: ${linked.map((m) => m.title).join(' • ')}',
                        style: const TextStyle(color: mutedInk, height: 1.5),
                      ),
                    ],
                  ],
                ),
              ),
              _errorLine(context, _error),
              _bottomButton(
                key: const Key('ibrah-story-done'),
                label: 'I read this story',
                busy: _busy,
                onPressed: _finish,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ---- mission: Discover → Decide → Act → Remember ----------------------------------

class IbrahMissionScreen extends StatefulWidget {
  const IbrahMissionScreen({
    super.key,
    required this.volume,
    required this.mission,
    required this.progress,
  });
  final IbrahVolume volume;
  final IbrahMission mission;
  final IbrahProgressController progress;
  @override
  State<IbrahMissionScreen> createState() => _IbrahMissionScreenState();
}

class _IbrahMissionScreenState extends State<IbrahMissionScreen> {
  /// Wrong picks in the Decide step this visit; fewer mistakes, more stars.
  int _mistakes = 0;

  static const _steps = ['Discover', 'Decide', 'Daily action', 'Remember'];
  late IbrahMissionProgress _p = widget.progress.progress.mission(
    widget.volume.id,
    widget.mission.id,
  );
  late bool _summary = _p.done;
  late String? _reflection = _p.reflection;
  bool _busy = false;
  String? _error;
  final _scroll = ScrollController();

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  IbrahMission get m => widget.mission;
  bool get _correct => _p.choice != null && m.choices[_p.choice!].correct;

  Future<bool> _persist(IbrahMissionProgress next) async {
    if (_busy) return false;
    setState(() {
      _busy = true;
      _error = null;
    });
    final c = widget.progress;
    final ok = await c.save(
      c.progress.withMission(widget.volume.id, m.id, next),
    );
    if (!mounted) return ok;
    setState(() {
      _busy = false;
      if (ok) {
        _p = next;
      } else {
        _error = _saveError;
      }
    });
    return ok;
  }

  void _top() {
    if (_scroll.hasClients) _scroll.jumpTo(0);
  }

  Future<void> _next() async {
    if (_p.step < 3) {
      if (await _persist(_p.copyWith(step: _p.step + 1))) _top();
      return;
    }
    final first = _p.completedAt == null;
    final ok = await _persist(
      IbrahMissionProgress(
        step: 3,
        choice: _p.choice,
        reflection: _reflection,
        completedAt: _p.completedAt ?? DateTime.now().toUtc(),
      ),
    );
    if (ok && mounted) {
      if (first) {
        celebrateFinish(
          context,
          course: 'ibrah',
          item: '${widget.volume.id}/${m.id}',
          mistakes: _mistakes,
          group: widget.volume.id,
          groupTitle: widget.volume.title,
          groupItems: widget.volume.missions.map(
            (x) => '${widget.volume.id}/${x.id}',
          ),
        );
      }
      setState(() => _summary = true);
      _top();
    }
  }

  void _back() {
    if (_busy) return;
    if (!_summary && _p.step > 0) {
      _persist(_p.copyWith(step: _p.step - 1)).then((ok) {
        if (ok) _top();
      });
    } else {
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) => PopScope(
    canPop: !_busy && (_summary || _p.step == 0),
    onPopInvokedWithResult: (didPop, _) {
      if (!didPop && !_busy) _back();
    },
    child: Scaffold(
      key: const Key('ibrah-mission-screen'),
      backgroundColor: canvas,
      appBar: AppBar(
        leading: BackButton(onPressed: _busy ? null : _back),
        title: Text('Mission ${m.number}'),
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
                        'Step ${_p.step + 1} of 4',
                        style: const TextStyle(
                          color: ibrahAccent,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _steps[_p.step],
                          key: const Key('ibrah-step-title'),
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
                  value: (_p.step + 1) / 4,
                  minHeight: 3,
                  color: ibrahAccent,
                  backgroundColor: const Color(0xFFE5E9F0),
                ),
              ],
              Expanded(
                child: ListView(
                  controller: _scroll,
                  padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
                  children: _summary ? _finish() : _content(),
                ),
              ),
              _errorLine(context, _error),
              _bottomButton(
                key: const Key('ibrah-next'),
                busy: _busy,
                label: _summary
                    ? 'Back to missions'
                    : _p.step == 3
                    ? 'Finish mission'
                    : 'Continue',
                onPressed: _summary
                    ? () => Navigator.of(context).pop()
                    : (_p.step == 1 && !_correct)
                    ? null
                    : _next,
              ),
            ],
          ),
        ),
      ),
    ),
  );

  List<Widget> _content() => switch (_p.step) {
    0 => [
      _heading(m.title),
      const SizedBox(height: 14),
      ..._blocks(m.discover),
      if (m.evidence.isNotEmpty) ...[
        const SizedBox(height: 6),
        const Text(
          'From the Qur’anic source library',
          style: TextStyle(
            fontWeight: FontWeight.w800,
            color: ibrahAccent,
            fontSize: 16,
          ),
        ),
        const SizedBox(height: 10),
        for (final e in m.evidence) _evidenceCard(e),
      ],
      const SizedBox(height: 4),
      const Text(
        'Imaan & Akhlaq scenes are fictional examples, kept apart from the Qur’anic account.',
        style: TextStyle(color: mutedInk, fontSize: 12, height: 1.5),
      ),
    ],
    1 => [
      _heading('What would you choose?'),
      const SizedBox(height: 12),
      Text(
        m.question,
        style: const TextStyle(fontSize: 19, height: 1.5, color: ink),
      ),
      const SizedBox(height: 20),
      for (var i = 0; i < m.choices.length; i++)
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: OutlinedButton(
            key: Key('ibrah-choice-$i'),
            onPressed: _busy
                ? null
                : () {
                    final right = m.choices[i].correct;
                    if (!right) _mistakes++;
                    VoiceGuide.instance.play(
                      right ? VoiceLine.correct : VoiceLine.tryAgain,
                    );
                    _persist(_p.copyWith(choice: i));
                  },
            style: OutlinedButton.styleFrom(
              alignment: Alignment.centerLeft,
              padding: const EdgeInsets.all(16),
              minimumSize: const Size(48, 56),
              backgroundColor: _p.choice == i ? _tint : Colors.white,
              side: BorderSide(
                color: _p.choice == i ? ibrahAccent : const Color(0xFFCBD3E1),
              ),
            ),
            child: Text(
              '${m.choices[i].letter}.  ${m.choices[i].text}',
              style: const TextStyle(fontSize: 16, height: 1.4, color: ink),
            ),
          ),
        ),
      if (_p.choice != null)
        Semantics(
          liveRegion: true,
          child: Container(
            key: const Key('ibrah-feedback'),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: _correct
                  ? const Color(0xFFE8F4ED)
                  : const Color(0xFFFFEFD9),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(
              m.choices[_p.choice!].feedback ??
                  (_correct
                      ? 'That is the response this mission teaches.'
                      : 'Not quite. Read the guidance again and try another choice.'),
              style: const TextStyle(fontSize: 16, height: 1.5, color: ink),
            ),
          ),
        ),
    ],
    2 => [
      _heading('One small action'),
      const SizedBox(height: 16),
      Container(
        key: const Key('ibrah-action'),
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(
          color: _tint,
          borderRadius: BorderRadius.circular(22),
        ),
        child: Text(
          m.action,
          style: displayStyle(
            21,
            color: ink,
            weight: FontWeight.w500,
            height: 1.45,
          ),
        ),
      ),
      const SizedBox(height: 18),
      const Text(
        'Try it when a suitable moment comes. Nobody needs a photo or proof.',
        style: TextStyle(fontSize: 16, height: 1.6),
      ),
    ],
    _ => [
      _heading('Remember'),
      const SizedBox(height: 14),
      ..._blocks(m.remember),
      const SizedBox(height: 10),
      const Text(
        'How is it going? This stays private on this device.',
        style: TextStyle(fontSize: 16, height: 1.5, color: ink),
      ),
      const SizedBox(height: 10),
      for (final e in const {
        'practised': 'Practised',
        'learning': 'Still learning',
        'skip': 'Skip',
      }.entries)
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: OutlinedButton(
            key: Key('ibrah-reflect-${e.key}'),
            style: OutlinedButton.styleFrom(
              alignment: Alignment.centerLeft,
              minimumSize: const Size(double.infinity, 48),
              backgroundColor: _reflection == e.key ? _tint : Colors.white,
              side: BorderSide(
                color: _reflection == e.key
                    ? ibrahAccent
                    : const Color(0xFFCBD3E1),
              ),
            ),
            onPressed: _busy ? null : () => setState(() => _reflection = e.key),
            child: Text(e.value, style: const TextStyle(color: ink)),
          ),
        ),
    ],
  };

  List<Widget> _finish() => [
    const SizedBox(height: 8),
    const Icon(Icons.local_florist_outlined, size: 56, color: ibrahAccent),
    const SizedBox(height: 14),
    _heading('Mission explored', centered: true),
    const SizedBox(height: 10),
    Text(
      m.title,
      textAlign: TextAlign.center,
      style: const TextStyle(fontSize: 17, height: 1.5, color: mutedInk),
    ),
    const SizedBox(height: 22),
    const Text(
      'Your action',
      style: TextStyle(
        fontWeight: FontWeight.w800,
        color: ibrahAccent,
        fontSize: 16,
      ),
    ),
    const SizedBox(height: 8),
    Text(
      m.action,
      style: const TextStyle(
        fontSize: 18,
        height: 1.5,
        fontWeight: FontWeight.w700,
        color: ink,
      ),
    ),
    const SizedBox(height: 20),
    const Text(
      'Come back in a few days for a gentle review.',
      style: TextStyle(color: mutedInk, height: 1.5),
    ),
    TextButton(
      key: const Key('ibrah-play-again'),
      onPressed: _busy
          ? null
          : () async {
              if (await _persist(_p.copyWith(step: 0)) && mounted) {
                setState(() => _summary = false);
                _top();
              }
            },
      child: const Text('Play the mission again'),
    ),
  ];
}

// ---- volume review ---------------------------------------------------------------

class IbrahReviewScreen extends StatefulWidget {
  const IbrahReviewScreen({
    super.key,
    required this.volume,
    required this.progress,
  });
  final IbrahVolume volume;
  final IbrahProgressController progress;
  @override
  State<IbrahReviewScreen> createState() => _IbrahReviewScreenState();
}

class _IbrahReviewScreenState extends State<IbrahReviewScreen> {
  late final List<IbrahEvidence> _items;
  late final List<List<int>> _options;
  int _at = 0;
  int? _picked;
  bool _busy = false;
  String? _error;
  final _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    final pool = widget.volume.review;
    final rnd = Random(widget.volume.number);
    final order = List<int>.generate(pool.length, (i) => i)..shuffle(rnd);
    final picked = pool.length < 2
        ? <int>[]
        : order.take(min(6, pool.length)).toList();
    _items = [for (final i in picked) pool[i]];
    _options = [
      for (final i in picked)
        ([
          i,
          ...(List<int>.generate(pool.length, (j) => j)
                ..remove(i)
                ..shuffle(rnd))
              .take(2),
        ]..shuffle(rnd)),
    ];
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  bool get _gameDone => _at >= _items.length;
  int get _answer => widget.volume.review.indexOf(_items[_at]);

  void _continue() {
    setState(() {
      _at++;
      _picked = null;
    });
    if (_scroll.hasClients) _scroll.jumpTo(0);
  }

  Future<void> _complete() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    final c = widget.progress;
    final ok = await c.save(
      c.progress.withReview(widget.volume.id, DateTime.now().toUtc()),
    );
    if (!mounted) return;
    setState(() {
      _busy = false;
      if (!ok) _error = _saveError;
    });
    if (ok) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final pool = widget.volume.review;
    return Scaffold(
      key: const Key('ibrah-review-screen'),
      backgroundColor: canvas,
      appBar: AppBar(title: Text('Review • ${widget.volume.prophet}')),
      body: SafeArea(
        child: ConstrainedBody(
          maxWidth: 640,
          child: Column(
            children: [
              Expanded(
                child: ListView(
                  controller: _scroll,
                  padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
                  children: _gameDone
                      ? [
                          _heading('The closing lesson'),
                          const SizedBox(height: 14),
                          ..._blocks(widget.volume.synthesis),
                        ]
                      : [
                          Text(
                            'Question ${_at + 1} of ${_items.length}',
                            style: const TextStyle(
                              color: ibrahAccent,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 8),
                          _heading('What do these words mean?'),
                          const SizedBox(height: 14),
                          _arabic(
                            _items[_at].arabic,
                            key: const Key('ibrah-review-arabic'),
                          ),
                          const SizedBox(height: 16),
                          for (final o in _options[_at])
                            Padding(
                              padding: const EdgeInsets.only(bottom: 10),
                              child: OutlinedButton(
                                key: Key('ibrah-review-option-$o'),
                                onPressed: () => setState(() => _picked = o),
                                style: OutlinedButton.styleFrom(
                                  alignment: Alignment.centerLeft,
                                  padding: const EdgeInsets.all(14),
                                  minimumSize: const Size(48, 52),
                                  backgroundColor: _picked == o
                                      ? _tint
                                      : Colors.white,
                                  side: BorderSide(
                                    color: _picked == o
                                        ? ibrahAccent
                                        : const Color(0xFFCBD3E1),
                                  ),
                                ),
                                child: Text(
                                  pool[o].meaning!,
                                  style: const TextStyle(
                                    fontSize: 15,
                                    height: 1.4,
                                    color: ink,
                                  ),
                                ),
                              ),
                            ),
                          if (_picked != null)
                            Semantics(
                              liveRegion: true,
                              child: Container(
                                key: const Key('ibrah-review-feedback'),
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: _picked == _answer
                                      ? const Color(0xFFE8F4ED)
                                      : const Color(0xFFFFEFD9),
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: Text(
                                  _picked == _answer
                                      ? 'Well remembered. ${_items[_at].reference ?? ''}'
                                            .trim()
                                      : 'Not this one. Look at the words again and try another meaning.',
                                  style: const TextStyle(
                                    fontSize: 15,
                                    height: 1.5,
                                    color: ink,
                                  ),
                                ),
                              ),
                            ),
                        ],
                ),
              ),
              _errorLine(context, _error),
              _bottomButton(
                key: const Key('ibrah-review-next'),
                busy: _busy,
                label: _gameDone ? 'Finish review' : 'Next',
                onPressed: _gameDone
                    ? _complete
                    : _picked == _answer
                    ? _continue
                    : null,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
