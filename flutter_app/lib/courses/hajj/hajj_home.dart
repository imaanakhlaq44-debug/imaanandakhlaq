import '../../billing/lock_badge.dart';
import '../../billing/paywall.dart';
import 'package:flutter/material.dart';
import '../../app_theme.dart';
import '../../screens/ui_kit.dart';
import 'hajj_data.dart';
import 'hajj_mission.dart';
import 'hajj_tools.dart';
import 'hajj_widgets.dart';

/// Journey to the Holy Cities: choose an adventure, then a world, then a
/// mission. Also opens the Dua Studio, holy places, 40-day path and the
/// parent corner.
class HajjCourseScreen extends StatefulWidget {
  const HajjCourseScreen({super.key, required this.scope, this.store});
  final String scope;
  final HajjProgressStore? store;
  @override
  State<HajjCourseScreen> createState() => _HajjCourseScreenState();
}

class _HajjCourseScreenState extends State<HajjCourseScreen> {
  late final HajjProgressStore _store =
      widget.store ?? DeviceHajjProgressStore.forLearner(widget.scope);
  HajjController? _c;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _c?.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _error = null);
    try {
      final course = await HajjCourse.load();
      final progress = await _store.load();
      if (!mounted) return;
      setState(() {
        _c?.dispose();
        _c = HajjController(course: course, store: _store, progress: progress);
      });
    } catch (_) {
      if (mounted) {
        setState(
          () => _error =
              'We could not load the journey and your saved progress. Please try again.',
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    key: const Key('hajj-course'),
    backgroundColor: canvas,
    appBar: AppBar(
      title: const Text('Journey to the Holy Cities'),
      actions: [if (_c != null) AskAdultButton(course: _c!.course)],
    ),
    body: SafeArea(
      child: ConstrainedBody(
        maxWidth: 640,
        child: _error != null
            ? MessageView(
                title: 'Let’s try again',
                message: _error!,
                action: FilledButton(
                  key: const Key('hajj-retry'),
                  onPressed: _load,
                  child: const Text('Retry'),
                ),
              )
            : _c == null
            ? const Center(child: CircularProgressIndicator())
            : ListenableBuilder(
                listenable: _c!,
                builder: (context, _) => _home(context, _c!),
              ),
      ),
    ),
  );

  Widget _home(BuildContext context, HajjController c) {
    final course = c.course;
    final p = c.progress;
    var i = 0;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
      children: [
        Reveal(index: i++, child: _hero(p)),
        const SizedBox(height: 18),
        Reveal(index: i++, child: _ageCard(c)),
        const SizedBox(height: 22),
        const HajjEyebrow('Choose your adventure'),
        const SizedBox(height: 10),
        for (final a in course.adventures) ...[
          Reveal(index: i++, child: _adventureCard(context, c, a)),
          const SizedBox(height: 12),
        ],
        const SizedBox(height: 10),
        const HajjEyebrow('Learning tools'),
        const SizedBox(height: 10),
        Reveal(
          index: i++,
          child: _tool(
            'hajj-open-duas',
            Icons.record_voice_over_outlined,
            'Dua Studio',
            '${course.duas.length} duas and dhikr with meanings',
            () => _push(context, DuaStudioScreen(c: c)),
          ),
        ),
        Reveal(
          index: i++,
          child: _tool(
            'hajj-open-places',
            Icons.mosque_outlined,
            'Makkah & Madinah places',
            '${course.maps('sites').length} landmark cards',
            () => _push(context, HolyPlacesScreen(c: c)),
          ),
        ),
        Reveal(
          index: i++,
          child: _tool(
            'hajj-open-forty',
            Icons.eco_outlined,
            '40-day kindness path',
            '${p.days.length} of 40 small actions tried',
            () => _push(context, FortyDayScreen(c: c)),
          ),
        ),
        Reveal(
          index: i++,
          child: _tool(
            'hajj-open-parent',
            Icons.family_restroom_outlined,
            'Parent Corner',
            'Guidance, routes, FAQs and sources for grown-ups',
            () async {
              if (await confirmGrownUp(context) && context.mounted) {
                _push(context, ParentCornerScreen(c: c));
              }
            },
          ),
        ),
        const SizedBox(height: 18),
        SmallNote(
          widget.scope == 'guest'
              ? 'Trying as a guest. Progress is saved on this device.'
              : 'Progress is saved on this device for this learner. No points, no scores for worship.',
        ),
        const SizedBox(height: 6),
        const ReviewNotice(),
      ],
    );
  }

  Widget _hero(HajjProgress p) => Container(
    padding: const EdgeInsets.all(22),
    decoration: BoxDecoration(
      gradient: const LinearGradient(
        colors: [brandNavy, Color(0xFF1C4D4A)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      borderRadius: BorderRadius.circular(26),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const HajjEyebrow('Safar al-Haramayn', color: Color(0xFFBFE8D2)),
        const SizedBox(height: 8),
        Text(
          'Learn the journey.\nLove the Sunnah.\nLive the lessons.',
          style: displayStyle(26, color: Colors.white, height: 1.15),
        ),
        const SizedBox(height: 14),
        Text(
          '${p.learnedCount} of 72 missions explored',
          key: const Key('hajj-progress-count'),
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 8),
        LinearProgressIndicator(
          value: p.learnedCount / 72,
          minHeight: 6,
          borderRadius: BorderRadius.circular(8),
          backgroundColor: const Color(0xFF3E5C72),
          color: const Color(0xFF7FD4A6),
        ),
      ],
    ),
  );

  Widget _ageCard(HajjController c) {
    final ages = c.course.maps('ages');
    final current = ages.firstWhere((a) => a['id'] == c.progress.age);
    return HajjCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const HajjEyebrow('Who is learning?'),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (var n = 0; n < ages.length; n++)
                ChoiceChip(
                  key: Key('hajj-age-$n'),
                  selected: ages[n]['id'] == c.progress.age,
                  selectedColor: hajjTint,
                  label: Text('${ages[n]['id']} • ${ages[n]['label']}'),
                  onSelected: (_) async {
                    try {
                      await c.save(c.progress.copyWith(age: ages[n]['id']));
                    } catch (_) {
                      if (mounted) showSaveError(context);
                    }
                  },
                ),
            ],
          ),
          const SizedBox(height: 10),
          SmallNote('${current['content']} ${current['session']}'),
        ],
      ),
    );
  }

  Widget _adventureCard(
    BuildContext context,
    HajjController c,
    HajjAdventure a,
  ) {
    final ids = [for (final w in a.worldIds) ...c.course.world(w).missionIds];
    final done = ids.where((id) => c.progress.mission(id).learned).length;
    final icon = switch (a.id) {
      'umrah' => Icons.mosque_outlined,
      'hajj' => Icons.landscape_outlined,
      _ => Icons.explore_outlined,
    };
    return Pressable(
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          key: Key('hajj-adventure-${a.id}'),
          onTap: () => _push(context, AdventureScreen(c: c, adventure: a)),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: hajjTint,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(icon, color: hajjGreen, size: 28),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(a.title, style: displayStyle(18, color: ink)),
                      const SizedBox(height: 3),
                      Text(
                        a.use,
                        style: const TextStyle(color: mutedInk, height: 1.35),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '${a.worldIds.length} worlds • $done of ${ids.length} missions',
                        style: const TextStyle(
                          color: hajjGreen,
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: hajjGreen),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _tool(
    String key,
    IconData icon,
    String title,
    String subtitle,
    VoidCallback onTap,
  ) => Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      clipBehavior: Clip.antiAlias,
      child: ListTile(
        key: Key(key),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        leading: Icon(icon, color: hajjGreen),
        title: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.w800, color: ink),
        ),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    ),
  );
}

void _push(BuildContext context, Widget screen) =>
    Navigator.of(context).push<void>(MaterialPageRoute(builder: (_) => screen));

/// The worlds of one adventure, each with its story beat and three missions.
class AdventureScreen extends StatelessWidget {
  const AdventureScreen({super.key, required this.c, required this.adventure});
  final HajjController c;
  final HajjAdventure adventure;
  @override
  Widget build(BuildContext context) => Scaffold(
    key: Key('hajj-adventure-screen-${adventure.id}'),
    backgroundColor: canvas,
    appBar: AppBar(
      title: Text(adventure.title),
      actions: [AskAdultButton(course: c.course)],
    ),
    body: SafeArea(
      child: ConstrainedBody(
        maxWidth: 640,
        child: ListenableBuilder(
          listenable: c,
          builder: (context, _) => ListView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
            children: [
              if (adventure.gate != null) ...[
                HajjCard(
                  key: const Key('hajj-safety-gate'),
                  color: hajjSand,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const HajjEyebrow(
                        'Learning only',
                        color: Color(0xFFB45F0A),
                      ),
                      const SizedBox(height: 6),
                      BodyText(adventure.gate!, size: 14.5),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
              ],
              for (var w = 0; w < adventure.worldIds.length; w++) ...[
                Reveal(
                  index: w,
                  child: _world(context, c.course.world(adventure.worldIds[w])),
                ),
                const SizedBox(height: 14),
              ],
              const ReviewNotice(),
            ],
          ),
        ),
      ),
    ),
  );

  Widget _world(BuildContext context, HajjWorld world) => HajjCard(
    key: Key('hajj-world-${world.id}'),
    padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        HajjEyebrow('World ${world.id}'),
        const SizedBox(height: 4),
        Text(world.title, style: displayStyle(19, color: ink, height: 1.2)),
        const SizedBox(height: 6),
        Text(
          world.storyBeat,
          style: const TextStyle(color: mutedInk, height: 1.45),
        ),
        const SizedBox(height: 6),
        for (final id in world.missionIds) _missionTile(context, id),
      ],
    ),
  );

  Widget _missionTile(BuildContext context, String id) {
    final m = c.course.missions[id]!;
    final p = c.progress.mission(id);
    final status = p.parentMarked
        ? 'Practised the value • marked by a grown-up'
        : p.learned
        ? 'Learning completed'
        : p.step > 0
        ? 'Continue from step ${p.step + 1}'
        : 'Not started';
    return LockCorner(
      free: id == c.course.worlds.first.missionIds.first,
      child: ListTile(
        key: Key('hajj-mission-$id'),
        contentPadding: EdgeInsets.zero,
        leading: CircleAvatar(
          backgroundColor: p.learned ? hajjGreen : hajjTint,
          foregroundColor: p.learned ? Colors.white : hajjGreen,
          child: p.learned
              ? Icon(p.parentMarked ? Icons.volunteer_activism : Icons.check)
              : Text(
                  id.split('.').last,
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
        ),
        title: Text(
          m.title,
          style: const TextStyle(fontWeight: FontWeight.w800, color: ink),
        ),
        subtitle: Text(status),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => Navigator.of(context).push<void>(
          MaterialPageRoute(
            builder: (_) => PaidGate(
              free: id == c.course.worlds.first.missionIds.first,
              child: HajjMissionScreen(c: c, missionId: id),
            ),
          ),
        ),
      ),
    );
  }
}
