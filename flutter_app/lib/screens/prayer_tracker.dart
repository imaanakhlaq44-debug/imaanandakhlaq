import 'package:flutter/material.dart';

import '../app_theme.dart';
import '../l10n/language.dart';
import '../rewards/prayer_log.dart';
import 'habit_tracker.dart' show ParentSeenBadge;
import 'ui_kit.dart';

/// Salah Studio's colour on the map, used softly across the tracker.
const prayerViolet = Color(0xFF7653AC);
const _lavender = Color(0xFFF1ECFA);
const _lamp = Color(0xFFF5B83D);

String prayerName(Prayer p) => switch (p) {
  Prayer.fajr => tr('Fajr', 'فجر'),
  Prayer.zuhr => tr('Zuhr', 'ظہر'),
  Prayer.asr => tr('Asr', 'عصر'),
  Prayer.maghrib => tr('Maghrib', 'مغرب'),
  Prayer.isha => tr('Isha', 'عشاء'),
};

String _prayerHint(Prayer p) => switch (p) {
  Prayer.fajr => tr('Before sunrise', 'سورج نکلنے سے پہلے'),
  Prayer.zuhr => tr('After midday', 'دوپہر کے بعد'),
  Prayer.asr => tr('Afternoon', 'سہ پہر'),
  Prayer.maghrib => tr('Just after sunset', 'سورج ڈوبنے کے بعد'),
  Prayer.isha => tr('At night', 'رات کو'),
};

IconData _prayerIcon(Prayer p) => switch (p) {
  Prayer.fajr => Icons.wb_twilight,
  Prayer.zuhr => Icons.wb_sunny,
  Prayer.asr => Icons.brightness_6,
  Prayer.maghrib => Icons.nights_stay,
  Prayer.isha => Icons.bedtime,
};

/// Opens the prayer tracker for [scope] (a learner id, or `guest`).
Future<void> openPrayerTracker(
  BuildContext context, {
  required String scope,
  required VoidCallback onLearnSalah,
}) {
  PrayerLog.instance.use(scope).then((_) => PrayerLog.instance.refresh());
  return Navigator.of(context).push<void>(
    MaterialPageRoute(
      // Its own page, so it needs its own Urdu right-to-left layout.
      builder: (_) =>
          LanguageScope(child: PrayerTrackerScreen(onLearnSalah: onLearnSalah)),
    ),
  );
}

/// "My Salah": the child ticks each of the five prayers, lights a lamp for
/// each, and keeps a streak of full days.
class PrayerTrackerScreen extends StatefulWidget {
  const PrayerTrackerScreen({super.key, this.log, this.onLearnSalah});
  final PrayerLog? log;
  final VoidCallback? onLearnSalah;
  @override
  State<PrayerTrackerScreen> createState() => _PrayerTrackerScreenState();
}

class _PrayerTrackerScreenState extends State<PrayerTrackerScreen> {
  PrayerLog get _log => widget.log ?? PrayerLog.instance;
  bool _yesterday = false;

  DateTime get _today {
    final n = _log.clock();
    return DateTime(n.year, n.month, n.day);
  }

  DateTime get _shown =>
      _yesterday ? DateTime(_today.year, _today.month, _today.day - 1) : _today;

  Future<void> _tap(Prayer p) async {
    final tick = await _log.toggle(p, day: _shown);
    if (tick == null || !mounted || !tick.prayed) return;
    final message = tick.goalReached != null
        ? tr(
            'MashaAllah! ${tick.goalReached} full days in a row!',
            'ماشاءاللہ! لگاتار ${tick.goalReached} دن پوری نماز!',
          )
        : tick.dayComplete
        ? tr(
            'MashaAllah! All five prayers done today.',
            'ماشاءاللہ! آج کی پانچوں نمازیں ہو گئیں۔',
          )
        : null;
    if (message == null) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          key: const Key('prayer-celebration'),
          behavior: SnackBarBehavior.floating,
          backgroundColor: prayerViolet,
          content: Row(
            children: [
              const Icon(Icons.auto_awesome, color: _lamp),
              const SizedBox(width: 10),
              Expanded(child: Text(message)),
            ],
          ),
        ),
      );
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    key: const Key('prayer-tracker'),
    backgroundColor: canvas,
    appBar: AppBar(title: Text(tr('My Salah', 'میری نماز'))),
    body: SafeArea(
      child: ConstrainedBody(
        maxWidth: 600,
        child: ListenableBuilder(
          listenable: _log,
          builder: (context, _) {
            final record = _log.record;
            final now = _log.clock();
            final prayed = record.on(_shown);
            return ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              children: [
                _Hero(
                  count: prayed.length,
                  streak: record.streakOn(now),
                  yesterday: _yesterday,
                ),
                if (record.confirmedOn(_shown)) ...[
                  const SizedBox(height: 10),
                  const ParentSeenBadge(),
                ],
                const SizedBox(height: 14),
                Row(
                  children: [
                    _DayChip(
                      key: const Key('prayer-day-today'),
                      label: tr('Today', 'آج'),
                      selected: !_yesterday,
                      onTap: () => setState(() => _yesterday = false),
                    ),
                    const SizedBox(width: 8),
                    _DayChip(
                      key: const Key('prayer-day-yesterday'),
                      label: tr('Yesterday', 'کل'),
                      selected: _yesterday,
                      onTap: () => setState(() => _yesterday = true),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                for (final p in Prayer.values)
                  _PrayerRow(
                    prayer: p,
                    prayed: prayed.contains(p),
                    onTap: () => _tap(p),
                  ),
                const SizedBox(height: 14),
                _Week(record: record, today: _today),
                const SizedBox(height: 14),
                Text(
                  tr(
                    'Tick each prayer with Ammi or Abbu after you pray it.',
                    'ہر نماز پڑھنے کے بعد امی یا ابو کے ساتھ نشان لگائیں۔',
                  ),
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: mutedInk),
                ),
                if (widget.onLearnSalah != null) ...[
                  const SizedBox(height: 14),
                  OutlinedButton.icon(
                    key: const Key('prayer-learn-salah'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: prayerViolet,
                      side: const BorderSide(color: prayerViolet),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    onPressed: widget.onLearnSalah,
                    icon: const Icon(Icons.school_outlined),
                    label: Text(tr('Learn how to pray', 'نماز سیکھیں')),
                  ),
                ],
              ],
            );
          },
        ),
      ),
    ),
  );
}

class _Hero extends StatelessWidget {
  const _Hero({
    required this.count,
    required this.streak,
    required this.yesterday,
  });
  final int count, streak;
  final bool yesterday;
  @override
  Widget build(BuildContext context) {
    final next = prayerStreakGoals.firstWhere(
      (g) => g > streak,
      orElse: () => streak + 10,
    );
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: _lavender,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        children: [
          Icon(
            Icons.mosque,
            size: 52,
            color: count == 5 ? prayerViolet : prayerViolet.withAlpha(150),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              for (var i = 0; i < 5; i++)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 5),
                  child: Icon(
                    i < count ? Icons.light_mode : Icons.light_mode_outlined,
                    key: Key('prayer-lamp-$i-${i < count ? 'lit' : 'off'}'),
                    color: i < count ? _lamp : const Color(0xFFC9BEDD),
                    size: 28,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            yesterday
                ? tr('Yesterday: $count of 5', 'کل: 5 میں سے $count')
                : tr('Today: $count of 5', 'آج: 5 میں سے $count'),
            key: const Key('prayer-count'),
            style: displayStyle(22),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.local_fire_department,
                  color: Color(0xFFF07A3C),
                  size: 20,
                ),
                const SizedBox(width: 6),
                Flexible(
                  child: Text(
                    streak == 0
                        ? tr(
                            'Pray all five to start a streak',
                            'پانچوں نمازیں پڑھ کر سلسلہ شروع کریں',
                          )
                        : tr(
                            '$streak-day streak · next goal $next days',
                            '$streak دن کا سلسلہ · اگلا ہدف $next دن',
                          ),
                    key: const Key('prayer-streak'),
                    style: const TextStyle(
                      color: ink,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DayChip extends StatelessWidget {
  const _DayChip({
    super.key,
    required this.label,
    required this.selected,
    required this.onTap,
  });
  final String label;
  final bool selected;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => ChoiceChip(
    label: Text(label),
    selected: selected,
    onSelected: (_) => onTap(),
    selectedColor: prayerViolet,
    backgroundColor: Colors.white,
    showCheckmark: false,
    labelStyle: TextStyle(
      color: selected ? Colors.white : ink,
      fontWeight: FontWeight.w700,
    ),
    side: BorderSide(color: selected ? prayerViolet : lineColor),
  );
}

class _PrayerRow extends StatelessWidget {
  const _PrayerRow({
    required this.prayer,
    required this.prayed,
    required this.onTap,
  });
  final Prayer prayer;
  final bool prayed;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Material(
      color: prayed ? const Color(0xFFF6F2FC) : Colors.white,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        key: Key('prayer-${prayer.name}'),
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: prayed ? prayerViolet.withAlpha(90) : lineColor,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: const BoxDecoration(
                  color: _lavender,
                  shape: BoxShape.circle,
                ),
                child: Icon(_prayerIcon(prayer), color: prayerViolet),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      prayerName(prayer),
                      style: const TextStyle(
                        color: ink,
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    Text(
                      _prayerHint(prayer),
                      style: const TextStyle(color: mutedInk, fontSize: 13),
                    ),
                  ],
                ),
              ),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 220),
                transitionBuilder: (child, a) =>
                    ScaleTransition(scale: a, child: child),
                child: Icon(
                  prayed ? Icons.check_circle : Icons.radio_button_unchecked,
                  key: ValueKey(prayed),
                  color: prayed ? successInk : const Color(0xFFC9BEDD),
                  size: 32,
                  semanticLabel: prayed
                      ? tr('Prayed', 'پڑھ لی')
                      : tr('Not yet', 'ابھی نہیں'),
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

class _Week extends StatelessWidget {
  const _Week({required this.record, required this.today});
  final PrayerRecord record;
  final DateTime today;
  static const _en = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  static const _ur = ['پیر', 'منگل', 'بدھ', 'جمعرات', 'جمعہ', 'ہفتہ', 'اتوار'];
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: lineColor),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          tr(
            'This week: ${record.weekCount(today)} of 35',
            'اس ہفتے: 35 میں سے ${record.weekCount(today)}',
          ),
          key: const Key('prayer-week'),
          style: const TextStyle(color: ink, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            for (var i = 6; i >= 0; i--)
              Expanded(
                child: _WeekDay(
                  day: DateTime(today.year, today.month, today.day - i),
                  record: record,
                  isToday: i == 0,
                ),
              ),
          ],
        ),
      ],
    ),
  );
}

class _WeekDay extends StatelessWidget {
  const _WeekDay({
    required this.day,
    required this.record,
    required this.isToday,
  });
  final DateTime day;
  final PrayerRecord record;
  final bool isToday;
  @override
  Widget build(BuildContext context) {
    final count = record.countOn(day);
    final full = count == 5;
    return Column(
      children: [
        SizedBox(
          width: 34,
          height: 34,
          child: Stack(
            alignment: Alignment.center,
            children: [
              CircularProgressIndicator(
                value: count / 5,
                strokeWidth: 4,
                backgroundColor: const Color(0xFFECE6F5),
                color: full ? _lamp : prayerViolet,
              ),
              full
                  ? const Icon(Icons.star, color: _lamp, size: 16)
                  : Text(
                      '$count',
                      style: const TextStyle(
                        color: ink,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
            ],
          ),
        ),
        const SizedBox(height: 4),
        Text(
          tr(_Week._en[day.weekday - 1], _Week._ur[day.weekday - 1]),
          maxLines: 1,
          overflow: TextOverflow.fade,
          softWrap: false,
          style: TextStyle(
            color: isToday ? prayerViolet : mutedInk,
            fontSize: 11,
            fontWeight: isToday ? FontWeight.w800 : FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
