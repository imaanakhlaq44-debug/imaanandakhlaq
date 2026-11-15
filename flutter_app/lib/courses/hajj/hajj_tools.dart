import 'package:flutter/material.dart';
import '../../app_theme.dart';
import '../../screens/ui_kit.dart';
import 'hajj_data.dart';
import 'hajj_widgets.dart';

class _ToolScaffold extends StatelessWidget {
  const _ToolScaffold({
    required this.keyName,
    required this.title,
    required this.c,
    required this.children,
  });
  final String keyName, title;
  final HajjController c;
  final List<Widget> Function() children;
  @override
  Widget build(BuildContext context) => Scaffold(
    key: Key(keyName),
    backgroundColor: canvas,
    appBar: AppBar(
      title: Text(title),
      actions: [AskAdultButton(course: c.course)],
    ),
    body: SafeArea(
      child: ConstrainedBody(
        maxWidth: 640,
        child: ListenableBuilder(
          listenable: c,
          builder: (context, _) => ListView(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 28),
            children: children(),
          ),
        ),
      ),
    ),
  );
}

Future<void> _save(
  BuildContext context,
  HajjController c,
  HajjProgress next,
) async {
  try {
    await c.save(next);
  } catch (_) {
    if (context.mounted) showSaveError(context);
  }
}

String _date(DateTime d) {
  final l = d.toLocal();
  return '${l.day}/${l.month}/${l.year}';
}

/// Dua and dhikr studio (section 10): Arabic, meaning, source and teaching
/// note, with a hide-the-words recall and a gentle "practise again tomorrow".
class DuaStudioScreen extends StatelessWidget {
  const DuaStudioScreen({super.key, required this.c});
  final HajjController c;
  @override
  Widget build(BuildContext context) => _ToolScaffold(
    keyName: 'hajj-dua-studio',
    title: 'Dua Studio',
    c: c,
    children: () => [
      BodyText(c.course.text('duaIntro'), size: 15),
      const SizedBox(height: 14),
      for (var i = 0; i < c.course.duas.length; i++)
        Reveal(
          index: i,
          child: Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _row(context, c.course.duas[i]),
          ),
        ),
      const SmallNote(
        'Arabic audio will follow after review by a qualified reciter.',
      ),
      const SizedBox(height: 6),
      const ReviewNotice(),
    ],
  );

  Widget _row(BuildContext context, HajjDua d) {
    final last = c.progress.duas[d.id];
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        key: Key('hajj-dua-${d.id}'),
        onTap: () => Navigator.of(context).push<void>(
          MaterialPageRoute(
            builder: (_) => DuaCardScreen(c: c, dua: d),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(d.title, style: displayStyle(17, color: ink)),
              const SizedBox(height: 8),
              Text(
                d.arabic,
                textDirection: TextDirection.rtl,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontFamily: 'NotoNaskhArabic',
                  fontSize: 20,
                  height: 1.8,
                  color: brandNavy,
                ),
              ),
              Text(
                last == null
                    ? d.source
                    : '${d.source} • practised ${_date(last)}',
                style: const TextStyle(color: mutedInk, fontSize: 13),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class DuaCardScreen extends StatefulWidget {
  const DuaCardScreen({super.key, required this.c, required this.dua});
  final HajjController c;
  final HajjDua dua;
  @override
  State<DuaCardScreen> createState() => _DuaCardScreenState();
}

class _DuaCardScreenState extends State<DuaCardScreen> {
  bool _hidden = false;
  @override
  Widget build(BuildContext context) {
    final c = widget.c, d = widget.dua;
    return _ToolScaffold(
      keyName: 'hajj-dua-card',
      title: d.title,
      c: c,
      children: () {
        final last = c.progress.duas[d.id];
        final today = DateTime.now();
        final practisedToday =
            last != null && DateUtils.isSameDay(last.toLocal(), today);
        return [
          if (_hidden)
            const HajjCard(
              key: Key('hajj-dua-hidden'),
              child: Text(
                'Take your time. Say what you remember.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 19, height: 1.5, color: ink),
              ),
            )
          else
            ArabicText(d.arabic),
          if (d.shortEcho != null && !_hidden) ...[
            const SizedBox(height: 10),
            const SmallNote('Short echo for younger ages:'),
            const SizedBox(height: 6),
            ArabicText(d.shortEcho!, size: 26),
          ],
          const SizedBox(height: 16),
          const HajjEyebrow('What it means'),
          const SizedBox(height: 6),
          BodyText(d.meaning, size: 19),
          const SizedBox(height: 14),
          Text(
            d.source,
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              color: brandNavy,
            ),
          ),
          const SizedBox(height: 4),
          SmallNote('Teaching note: ${d.note}'),
          const SizedBox(height: 18),
          OutlinedButton(
            key: const Key('hajj-dua-hide'),
            onPressed: () => setState(() => _hidden = !_hidden),
            child: Text(_hidden ? 'Show words' : 'Hide words and remember'),
          ),
          const SizedBox(height: 10),
          FilledButton.icon(
            key: const Key('hajj-dua-practised'),
            style: FilledButton.styleFrom(backgroundColor: hajjGreen),
            icon: const Icon(Icons.check),
            label: Text(
              practisedToday ? 'Practised today' : 'I practised this today',
            ),
            onPressed: practisedToday
                ? null
                : () => _save(
                    context,
                    c,
                    c.progress.copyWith(
                      duas: {...c.progress.duas, d.id: today.toUtc()},
                    ),
                  ),
          ),
          const SizedBox(height: 8),
          SmallNote(
            last == null
                ? 'Learn slowly. Listening and understanding come first.'
                : 'Last practised ${_date(last)}. Come back tomorrow for a gentle revision.',
          ),
          const SizedBox(height: 14),
          const ReviewNotice(),
        ];
      },
    );
  }
}

/// Historical-site cards for the Explore tab (section 7).
class HolyPlacesScreen extends StatelessWidget {
  const HolyPlacesScreen({super.key, required this.c});
  final HajjController c;
  @override
  Widget build(BuildContext context) {
    final sites = c.course.maps('sites');
    return _ToolScaffold(
      keyName: 'hajj-places',
      title: 'Makkah & Madinah places',
      c: c,
      children: () => [
        const BodyText(
          'Each place card shows what we learn there and how it is classified: a place of required rites, a separate visit, or history.',
          size: 15,
        ),
        const SizedBox(height: 14),
        for (var i = 0; i < sites.length; i++)
          Reveal(
            index: i,
            child: Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: HajjCard(
                key: Key('hajj-site-$i'),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      sites[i]['name'] as String,
                      style: displayStyle(18, color: ink),
                    ),
                    const SizedBox(height: 6),
                    BodyText(sites[i]['learn'] as String, size: 16),
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: hajjSand,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        sites[i]['classification'] as String,
                        style: const TextStyle(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF8A4B0B),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        const ReviewNotice(),
      ],
    );
  }
}

/// Forty days of good character (section 12): pick one small action a day.
/// Private, non-punitive, no streaks.
class FortyDayScreen extends StatelessWidget {
  const FortyDayScreen({super.key, required this.c});
  final HajjController c;
  @override
  Widget build(BuildContext context) {
    final days = c.course.strings('fortyDays');
    return _ToolScaffold(
      keyName: 'hajj-forty',
      title: '40-day kindness path',
      c: c,
      children: () => [
        BodyText(c.course.text('fortyIntro'), size: 15),
        const SizedBox(height: 8),
        Text(
          '${c.progress.days.length} of 40 small actions tried',
          key: const Key('hajj-forty-count'),
          style: const TextStyle(fontWeight: FontWeight.w800, color: hajjGreen),
        ),
        const SizedBox(height: 12),
        for (var d = 1; d <= 40; d++)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Material(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              clipBehavior: Clip.antiAlias,
              child: CheckboxListTile(
                key: Key('hajj-day-$d'),
                value: c.progress.days.contains(d),
                activeColor: hajjGreen,
                secondary: CircleAvatar(
                  backgroundColor: hajjTint,
                  foregroundColor: hajjGreen,
                  child: Text(
                    '$d',
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                ),
                title: Text(days[d - 1], style: const TextStyle(color: ink)),
                onChanged: (v) {
                  final next = {...c.progress.days};
                  v == true ? next.add(d) : next.remove(d);
                  _save(context, c, c.progress.copyWith(days: next));
                },
              ),
            ),
          ),
        const SmallNote(
          'Missed a day? That is okay — start again whenever you like.',
        ),
      ],
    );
  }
}

/// Parent Corner (sections 1, 6, 13C, 14 and 17): the guide's own guidance
/// for grown-ups. It is reference reading, never a ritual tracker.
class ParentCornerScreen extends StatelessWidget {
  const ParentCornerScreen({super.key, required this.c});
  final HajjController c;
  @override
  Widget build(BuildContext context) {
    final course = c.course;
    final parent = course.parent;
    final marked = c.progress.missions.values
        .where((m) => m.parentMarked)
        .length;
    Widget section(String title, List<Widget> body) => Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: HajjCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: displayStyle(19, color: ink)),
            const SizedBox(height: 10),
            ...body,
          ],
        ),
      ),
    );
    Widget bullet(String t) => Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 7, right: 8),
            child: Icon(Icons.circle, size: 7, color: hajjGreen),
          ),
          Expanded(child: BodyText(t, size: 15)),
        ],
      ),
    );
    Widget row(String a, String b, [String? c]) => Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            a,
            style: const TextStyle(fontWeight: FontWeight.w800, color: ink),
          ),
          BodyText(b, size: 15),
          if (c != null) SmallNote(c),
        ],
      ),
    );
    return _ToolScaffold(
      keyName: 'hajj-parent',
      title: 'Parent Corner',
      c: c,
      children: () => [
        section('Our promise', [
          BodyText(course.text('vision'), size: 15),
          const SizedBox(height: 8),
          BodyText(course.text('promise'), size: 15),
        ]),
        section('Your child’s notebook', [
          Text(
            '${c.progress.learnedCount} of 72 missions explored • $marked real actions marked by you',
            key: const Key('hajj-parent-summary'),
            style: const TextStyle(fontWeight: FontWeight.w700, color: ink),
          ),
          const SizedBox(height: 6),
          const BodyText(
            'Open any finished mission and tap “Grown-up: mark the real action” when your child has practised its daily action at home. This marks a habit, never the validity of worship.',
            size: 14.5,
          ),
        ]),
        section('Boundaries', [
          for (final b in course.strings('boundaries')) bullet(b),
        ]),
        section('Hajj routes (parent-only reference)', [
          for (final r in course.maps('routes', parent))
            row(r['route'], r['feature'], 'Hady: ${r['hady']}'),
        ]),
        section('Hajj days — teaching map', [
          for (final d in course.maps('hajjDays', parent))
            row('${d['when']} • ${d['where']}', d['lesson']),
          SmallNote(parent['hajjDaysNote'] as String),
        ]),
        section('If your family travels', [
          for (final t in List<String>.from(parent['companion'] as List))
            bullet(t),
          const SmallNote(
            'This app has no live travel companion. Use current official instructions and a qualified guide.',
          ),
        ]),
        section('Questions families ask', [
          for (final f in course.maps('faq', parent))
            ExpansionTile(
              tilePadding: EdgeInsets.zero,
              childrenPadding: const EdgeInsets.only(bottom: 10),
              expandedAlignment: Alignment.centerLeft,
              title: Text(
                f['q'] as String,
                style: const TextStyle(fontWeight: FontWeight.w700, color: ink),
              ),
              children: [BodyText(f['a'] as String, size: 15)],
            ),
        ]),
        section('Sources', [
          for (final s in course.maps('sources'))
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(
                '${s['id']} ${s['title']}',
                style: const TextStyle(fontWeight: FontWeight.w700, color: ink),
              ),
              subtitle: Text('${s['note']}\n${s['url']}'),
              isThreeLine: true,
              onTap: () => openSourceUrl(context, s['url'] as String),
            ),
          SmallNote(course.text('reviewNote')),
          const SizedBox(height: 6),
          SmallNote(course.text('finalWarning')),
        ]),
        section('This learner’s data', [
          const BodyText(
            'Progress for this course stays on this device. You can clear it at any time.',
            size: 15,
          ),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            key: const Key('hajj-clear'),
            icon: const Icon(Icons.delete_outline),
            label: const Text('Clear Journey progress'),
            onPressed: () async {
              final ok = await showDialog<bool>(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Clear Journey progress?'),
                  content: const Text(
                    'This removes missions, dua practice and the 40-day path for this learner on this device. It cannot be undone.',
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: const Text('Cancel'),
                    ),
                    FilledButton(
                      key: const Key('hajj-clear-yes'),
                      onPressed: () => Navigator.pop(context, true),
                      child: const Text('Clear'),
                    ),
                  ],
                ),
              );
              if (ok == true && context.mounted) {
                await _save(context, c, HajjProgress(age: c.progress.age));
              }
            },
          ),
        ]),
      ],
    );
  }
}
