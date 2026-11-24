import 'package:flutter/material.dart';

import '../app_theme.dart';
import '../data/checklist_cloud.dart';
import '../domain.dart';
import '../l10n/language.dart';
import '../rewards/prayer_log.dart' show Prayer;
import '../rewards/rewards.dart' show dayKey;
import 'habit_tracker.dart';
import 'prayer_tracker.dart' show prayerViolet, prayerName;
import 'ui_kit.dart';
import 'weekly_challenge.dart';

/// One checklist as a parent sees it in the weekly report.
class _Line {
  const _Line(this.id, this.title, this.icon, this.color, this.labels);
  final String id, title;
  final IconData icon;
  final Color color;

  /// Item id → what the parent reads.
  final Map<String, String> labels;

  /// Ticks possible in one day.
  int get perDay => id == 'challenge' ? 1 : labels.length;
}

Map<String, String> _labels(HabitSpot spot) => {
  for (final item in spot.items) item.id: tr(item.en, item.ur),
};

/// Built each frame, so the words follow the language switch.
List<_Line> _lines() => [
  _Line('salah', tr('Salah', 'نماز'), Icons.mosque, prayerViolet, {
    for (final p in Prayer.values) p.name: prayerName(p),
  }),
  _Line(
    'quran',
    tr('Quran', 'قرآن'),
    Icons.local_florist,
    quranSpot.color,
    _labels(quranSpot),
  ),
  _Line(
    'duas',
    tr('Duas', 'دعائیں'),
    Icons.front_hand,
    duaSpot.color,
    _labels(duaSpot),
  ),
  _Line(
    'hadith',
    tr('Hadith', 'حدیث'),
    Icons.format_quote,
    hadithSpot.color,
    _labels(hadithSpot),
  ),
  _Line(
    'deeds',
    tr('Good deeds', 'اچھے کام'),
    Icons.volunteer_activism,
    deedsSpot.color,
    _labels(deedsSpot),
  ),
  _Line(
    'challenge',
    tr('Weekly goal', 'ہفتے کا ہدف'),
    Icons.flag,
    challengeColor,
    {for (final c in weeklyChallenges) c.id: tr(c.en, c.ur)},
  ),
];

/// Opens a child's daily habits for their parent: the week at a glance, and
/// the recent days waiting to be confirmed.
Future<void> showChildChecklists(
  BuildContext context,
  Profile child,
  ChecklistCloud cloud,
) => Navigator.of(context).push<void>(
  MaterialPageRoute(
    builder: (_) => LanguageScope(
      child: ChildChecklistsScreen(child: child, cloud: cloud),
    ),
  ),
);

class ChildChecklistsScreen extends StatefulWidget {
  const ChildChecklistsScreen({
    super.key,
    required this.child,
    required this.cloud,
    this.clock = DateTime.now,
  });
  final Profile child;
  final ChecklistCloud cloud;
  final DateTime Function() clock;
  @override
  State<ChildChecklistsScreen> createState() => _ChildChecklistsScreenState();
}

class _ChildChecklistsScreenState extends State<ChildChecklistsScreen> {
  late Future<Map<String, Map<String, Set<String>>>> _days = _load();
  String? _confirming;

  DateTime get _today {
    final n = widget.clock();
    return DateTime(n.year, n.month, n.day);
  }

  DateTime _ago(int n) => DateTime(_today.year, _today.month, _today.day - n);

  Future<Map<String, Map<String, Set<String>>>> _load() =>
      widget.cloud.loadSince(dayKey(_ago(13)));

  Future<void> _confirm(String day, Map<String, Set<String>> ticks) async {
    setState(() => _confirming = day);
    try {
      await widget.cloud.confirm(day, ticks);
      if (!mounted) return;
      setState(() => _days = _load());
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            tr(
              'Could not confirm. Check the connection and retry.',
              'تصدیق نہیں ہو سکی۔ انٹرنیٹ دیکھ کر دوبارہ کوشش کریں۔',
            ),
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _confirming = null);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    key: const Key('child-checklists'),
    backgroundColor: canvas,
    appBar: AppBar(
      title: Text(
        '${widget.child.name} · ${tr('Daily habits', 'روز کی عادتیں')}',
      ),
    ),
    body: SafeArea(
      child: ConstrainedBody(
        maxWidth: 640,
        child: FutureBuilder(
          future: _days,
          builder: (context, snapshot) {
            if (snapshot.hasError) {
              return MessageView(
                title: tr('Could not load the habits', 'عادتیں نہیں کھل سکیں'),
                message: tr(
                  'Check the connection and try again.',
                  'انٹرنیٹ دیکھ کر دوبارہ کوشش کریں۔',
                ),
                action: FilledButton(
                  onPressed: () => setState(() => _days = _load()),
                  child: Text(tr('Retry', 'دوبارہ کوشش کریں')),
                ),
              );
            }
            if (!snapshot.hasData) {
              return const Center(child: CircularProgressIndicator());
            }
            final days = snapshot.data!;
            final lines = _lines();
            return RefreshIndicator(
              onRefresh: () async {
                setState(() => _days = _load());
                await _days;
              },
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
                children: [
                  Text(tr('This week', 'اس ہفتے'), style: displayStyle(22)),
                  const SizedBox(height: 4),
                  Text(
                    tr(
                      'The last 7 days, compared with the 7 before.',
                      'پچھلے 7 دن، اس سے پہلے کے 7 دن کے مقابلے میں۔',
                    ),
                    style: const TextStyle(color: mutedInk),
                  ),
                  const SizedBox(height: 12),
                  for (final line in lines) _report(line, days),
                  const SizedBox(height: 18),
                  Text(tr('Confirm', 'تصدیق'), style: displayStyle(22)),
                  const SizedBox(height: 4),
                  Text(
                    tr(
                      'Check what your child ticked, then confirm it. They '
                          'see your confirmation in the app.',
                      'دیکھیں بچے نے کیا نشان لگائے، پھر تصدیق کریں۔ بچے کو '
                          'ایپ میں آپ کی تصدیق نظر آئے گی۔',
                    ),
                    style: const TextStyle(color: mutedInk),
                  ),
                  const SizedBox(height: 12),
                  ..._confirmDays(days, lines),
                ],
              ),
            );
          },
        ),
      ),
    ),
  );

  int _count(
    Map<String, Map<String, Set<String>>> days,
    _Line line,
    int from,
    int to,
  ) {
    var total = 0;
    for (var i = from; i <= to; i++) {
      total += days[dayKey(_ago(i))]?[line.id]?.length ?? 0;
    }
    return total;
  }

  Widget _report(_Line line, Map<String, Map<String, Set<String>>> days) {
    final now = _count(days, line, 0, 6);
    final before = _count(days, line, 7, 13);
    final most = line.perDay * 7;
    final trend = now == before
        ? null
        : now > before
        ? Icons.trending_up
        : Icons.trending_down;
    return Container(
      key: Key('report-${line.id}'),
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: lineColor),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: line.color.withValues(alpha: .12),
              shape: BoxShape.circle,
            ),
            child: Icon(line.icon, color: line.color, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  line.title,
                  style: const TextStyle(
                    color: ink,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: LinearProgressIndicator(
                    value: most == 0 ? 0 : (now / most).clamp(0, 1),
                    minHeight: 8,
                    backgroundColor: const Color(0xFFEEEAF2),
                    color: line.color,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                line.id == 'challenge'
                    ? tr('$now days', '$now دن')
                    : '$now / $most',
                key: Key('report-${line.id}-count'),
                // "0 / 35" reads left to right in Urdu too.
                textDirection: line.id == 'challenge'
                    ? null
                    : TextDirection.ltr,
                style: const TextStyle(color: ink, fontWeight: FontWeight.w800),
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (trend != null)
                    Icon(
                      trend,
                      size: 16,
                      color: now > before ? successInk : dangerInk,
                    ),
                  const SizedBox(width: 2),
                  Text(
                    tr('last week $before', 'پچھلا ہفتہ $before'),
                    style: const TextStyle(color: mutedInk, fontSize: 12),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  List<Widget> _confirmDays(
    Map<String, Map<String, Set<String>>> days,
    List<_Line> lines,
  ) {
    final out = <Widget>[];
    for (var i = 0; i < 7; i++) {
      final day = dayKey(_ago(i));
      final data = days[day];
      final ticks = {
        for (final line in lines)
          if (data?[line.id] case final Set<String> s when s.isNotEmpty)
            line.id: s,
      };
      if (ticks.isEmpty) continue;
      final confirmed = ticks.entries.every(
        (e) => (data?[confirmedKey(e.key)] ?? const {}).containsAll(e.value),
      );
      out.add(_dayCard(i, day, ticks, confirmed, lines));
    }
    if (out.isEmpty) {
      out.add(
        EmptyState(
          icon: Icons.event_available,
          color: prayerViolet,
          title: tr(
            'Nothing ticked this week yet',
            'اس ہفتے ابھی کچھ نشان نہیں لگا',
          ),
          message: tr(
            'When your child ticks a prayer or a good deed, it shows '
                'here for you to confirm.',
            'جب بچہ نماز یا کوئی اچھا کام نشان لگائے گا تو یہاں تصدیق کے '
                'لیے آئے گا۔',
          ),
        ),
      );
    }
    return out;
  }

  Widget _dayCard(
    int ago,
    String day,
    Map<String, Set<String>> ticks,
    bool confirmed,
    List<_Line> lines,
  ) {
    final title = switch (ago) {
      0 => tr('Today', 'آج'),
      1 => tr('Yesterday', 'کل'),
      _ => tr('$ago days ago', '$ago دن پہلے'),
    };
    final comma = tr(', ', '، ');
    return Container(
      key: Key('confirm-$day'),
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: confirmed ? successInk.withValues(alpha: .4) : lineColor,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: ink,
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(width: 8),
              Text(day, style: const TextStyle(color: mutedInk, fontSize: 12)),
            ],
          ),
          const SizedBox(height: 8),
          for (final line in lines)
            if (ticks[line.id] case final Set<String> items)
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(line.icon, size: 18, color: line.color),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        '${line.title}: '
                        '${[for (final i in items) line.labels[i] ?? i].join(comma)}',
                        style: const TextStyle(color: ink),
                      ),
                    ),
                  ],
                ),
              ),
          const SizedBox(height: 8),
          confirmed
              ? Row(
                  children: [
                    const Icon(Icons.verified, color: successInk, size: 20),
                    const SizedBox(width: 6),
                    Text(
                      tr('Confirmed', 'تصدیق ہو گئی'),
                      style: const TextStyle(
                        color: successInk,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                )
              : FilledButton.icon(
                  key: Key('confirm-button-$day'),
                  style: FilledButton.styleFrom(backgroundColor: successInk),
                  onPressed: _confirming == null
                      ? () => _confirm(day, ticks)
                      : null,
                  icon: _confirming == day
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.verified_outlined),
                  label: Text(tr('Confirm', 'تصدیق کریں')),
                ),
        ],
      ),
    );
  }
}
