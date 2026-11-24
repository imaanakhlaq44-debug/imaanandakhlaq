import 'package:flutter/material.dart';

import '../app_theme.dart';
import '../l10n/language.dart';
import '../rewards/habit_log.dart';
import '../rewards/prayer_log.dart' show prayerStreakGoals;
import 'ui_kit.dart';

const _lamp = Color(0xFFF5B83D);

/// One thing a child can tick each day.
class HabitItem {
  const HabitItem(this.id, this.en, this.ur, this.icon);
  final String id, en, ur;
  final IconData icon;
}

/// A map place that became a daily checklist.
class HabitSpot {
  const HabitSpot({
    required this.id,
    required this.titleEn,
    required this.titleUr,
    required this.color,
    required this.tint,
    required this.heroIcon,
    required this.unitOn,
    required this.unitOff,
    required this.items,
    required this.doneEn,
    required this.doneUr,
    required this.noteEn,
    required this.noteUr,
    required this.courseEn,
    required this.courseUr,
  });
  final String id, titleEn, titleUr, doneEn, doneUr, noteEn, noteUr;
  final String courseEn, courseUr;
  final Color color, tint;
  final IconData heroIcon, unitOn, unitOff;
  final List<HabitItem> items;

  HabitLog get log => HabitLog.of(id, items: items.length);
}

const quranSpot = HabitSpot(
  id: 'quran',
  titleEn: 'My Quran Garden',
  titleUr: 'میرا قرآن باغیچہ',
  color: Color(0xFFD63678),
  tint: Color(0xFFFCEBF2),
  heroIcon: Icons.local_florist,
  unitOn: Icons.local_florist,
  unitOff: Icons.local_florist_outlined,
  items: [
    HabitItem('recite', 'I recited Quran', 'میں نے قرآن پڑھا', Icons.menu_book),
    HabitItem(
      'listen',
      'I listened to Quran',
      'میں نے قرآن سنا',
      Icons.headphones,
    ),
    HabitItem(
      'learn',
      'I learned or revised an ayah',
      'میں نے ایک آیت یاد کی یا دہرائی',
      Icons.psychology,
    ),
  ],
  doneEn: 'MashaAllah! Your Quran garden is in full bloom today.',
  doneUr: 'ماشاءاللہ! آج آپ کا قرآن باغیچہ پورا کھل گیا۔',
  noteEn: 'Even one ayah a day makes a flower grow.',
  noteUr: 'روز ایک آیت بھی ایک پھول کھلا دیتی ہے۔',
  courseEn: 'Open the Quran course',
  courseUr: 'قرآن کورس کھولیں',
);

const duaSpot = HabitSpot(
  id: 'duas',
  titleEn: 'My Daily Duas',
  titleUr: 'میری روز کی دعائیں',
  color: Color(0xFF208977),
  tint: Color(0xFFE6F4F1),
  heroIcon: Icons.front_hand,
  unitOn: Icons.light,
  unitOff: Icons.light_outlined,
  items: [
    HabitItem('wake', 'When I woke up', 'جاگنے کی دعا', Icons.wb_twilight),
    HabitItem('eat', 'Before eating', 'کھانے سے پہلے', Icons.restaurant),
    HabitItem(
      'after-eat',
      'After eating',
      'کھانے کے بعد',
      Icons.check_circle_outline,
    ),
    HabitItem(
      'leave',
      'Leaving home',
      'گھر سے نکلتے وقت',
      Icons.door_front_door,
    ),
    HabitItem('enter', 'Entering home', 'گھر میں داخل ہوتے وقت', Icons.home),
    HabitItem('sleep', 'Before sleeping', 'سونے سے پہلے', Icons.bedtime),
  ],
  doneEn: 'MashaAllah! Every dua today — the corner is glowing.',
  doneUr: 'ماشاءاللہ! آج کی ساری دعائیں — کونا جگمگا اٹھا۔',
  noteEn: 'Tick a dua after you say it.',
  noteUr: 'دعا پڑھنے کے بعد نشان لگائیں۔',
  courseEn: 'Learn the duas',
  courseUr: 'دعائیں سیکھیں',
);

const deedsSpot = HabitSpot(
  id: 'deeds',
  titleEn: 'My Good Deeds',
  titleUr: 'میرے اچھے کام',
  color: Color(0xFFD97426),
  tint: Color(0xFFFCF0E4),
  heroIcon: Icons.volunteer_activism,
  unitOn: Icons.auto_stories,
  unitOff: Icons.auto_stories_outlined,
  items: [
    HabitItem(
      'help',
      'I helped at home',
      'میں نے گھر میں مدد کی',
      Icons.cleaning_services,
    ),
    HabitItem('truth', 'I told the truth', 'میں نے سچ بولا', Icons.verified),
    HabitItem(
      'share',
      'I shared with someone',
      'میں نے کچھ بانٹا',
      Icons.redeem,
    ),
    HabitItem(
      'kind',
      'I was kind to my family',
      'میں نے گھر والوں سے پیار کیا',
      Icons.favorite,
    ),
    HabitItem(
      'thanks',
      'I said thank you',
      'میں نے شکریہ ادا کیا',
      Icons.emoji_emotions,
    ),
  ],
  doneEn: 'MashaAllah! A new book for every good deed today.',
  doneUr: 'ماشاءاللہ! آج ہر اچھے کام پر ایک نئی کتاب آ گئی۔',
  noteEn: 'Each good deed adds a book to your library.',
  noteUr: 'ہر اچھا کام آپ کی لائبریری میں ایک کتاب بڑھاتا ہے۔',
  courseEn: 'Read a story',
  courseUr: 'کہانی پڑھیں',
);

const hadithSpot = HabitSpot(
  id: 'hadith',
  titleEn: 'Hadith of the Day',
  titleUr: 'آج کی حدیث',
  color: Color(0xFF3478B8),
  tint: Color(0xFFE8F1FA),
  heroIcon: Icons.format_quote,
  unitOn: Icons.window,
  unitOff: Icons.window_outlined,
  items: [
    HabitItem(
      'read',
      'I read today’s hadith',
      'میں نے آج کی حدیث پڑھی',
      Icons.menu_book,
    ),
    HabitItem(
      'act',
      'I did today’s action',
      'میں نے آج کا عمل کیا',
      Icons.task_alt,
    ),
  ],
  doneEn: 'MashaAllah! You read it and lived it today.',
  doneUr: 'ماشاءاللہ! آج آپ نے حدیث پڑھی بھی اور عمل بھی کیا۔',
  noteEn: 'A new hadith comes every day.',
  noteUr: 'ہر دن ایک نئی حدیث آتی ہے۔',
  courseEn: 'Open the Hadith course',
  courseUr: 'حدیث کورس کھولیں',
);

/// A short hadith with something a child can do about it today.
class DailyHadith {
  const DailyHadith(this.en, this.ur, this.source, this.actEn, this.actUr);
  final String en, ur, source, actEn, actUr;
}

const dailyHadiths = [
  DailyHadith(
    'The best of you are those with the best character.',
    'تم میں سب سے بہتر وہ ہے جس کے اخلاق سب سے اچھے ہوں۔',
    'Sahih al-Bukhari 3559',
    'Be extra kind to someone today.',
    'آج کسی کے ساتھ خاص طور پر اچھا سلوک کریں۔',
  ),
  DailyHadith(
    'Your smile for your brother is charity.',
    'اپنے بھائی کے سامنے مسکرانا صدقہ ہے۔',
    'Jami at-Tirmidhi 1956',
    'Smile and greet three people.',
    'تین لوگوں سے مسکرا کر ملیں۔',
  ),
  DailyHadith(
    'Spread the greeting of salam among yourselves.',
    'آپس میں سلام کو عام کرو۔',
    'Sahih Muslim 54',
    'Say salam to everyone at home.',
    'گھر میں سب کو سلام کریں۔',
  ),
  DailyHadith(
    'None of you truly believes until he loves for his brother what he loves for himself.',
    'تم میں سے کوئی اس وقت تک کامل مومن نہیں ہو سکتا جب تک اپنے بھائی کے لیے وہی پسند نہ کرے جو اپنے لیے پسند کرتا ہے۔',
    'Sahih al-Bukhari 13',
    'Share something you like.',
    'اپنی پسند کی کوئی چیز کسی کے ساتھ بانٹیں۔',
  ),
  DailyHadith(
    'Whoever does not thank people has not thanked Allah.',
    'جو لوگوں کا شکریہ ادا نہیں کرتا وہ اللہ کا شکر ادا نہیں کرتا۔',
    'Sunan Abi Dawud 4811',
    'Thank everyone who helps you today.',
    'آج جو بھی مدد کرے اس کا شکریہ ادا کریں۔',
  ),
  DailyHadith(
    'Cleanliness is half of faith.',
    'صفائی آدھا ایمان ہے۔',
    'Sahih Muslim 223',
    'Tidy your room and your things.',
    'اپنا کمرہ اور چیزیں صاف ستھری رکھیں۔',
  ),
  DailyHadith(
    'Whoever believes in Allah and the Last Day should say something good or keep silent.',
    'جو اللہ اور آخرت کے دن پر ایمان رکھتا ہے وہ اچھی بات کہے یا خاموش رہے۔',
    'Sahih al-Bukhari 6018',
    'Use only kind words today.',
    'آج صرف اچھے الفاظ بولیں۔',
  ),
];

/// The hadith shown on [day]: one per day, in turn.
DailyHadith hadithFor(DateTime day) {
  final d = DateTime.utc(day.year, day.month, day.day);
  final n = d.difference(DateTime.utc(2026)).inDays;
  return dailyHadiths[n % dailyHadiths.length];
}

/// Opens [spot]'s checklist for [scope] (a learner id, or `guest`).
Future<void> openHabitTracker(
  BuildContext context,
  HabitSpot spot, {
  required String scope,
  VoidCallback? onCourse,
}) {
  spot.log.use(scope).then((_) => spot.log.refresh());
  return Navigator.of(context).push<void>(
    MaterialPageRoute(
      // Its own page, so it needs its own Urdu right-to-left layout.
      builder: (_) => LanguageScope(
        child: HabitTrackerScreen(spot: spot, onCourse: onCourse),
      ),
    ),
  );
}

class HabitTrackerScreen extends StatefulWidget {
  const HabitTrackerScreen({
    super.key,
    required this.spot,
    this.log,
    this.onCourse,
  });
  final HabitSpot spot;
  final HabitLog? log;
  final VoidCallback? onCourse;
  @override
  State<HabitTrackerScreen> createState() => _HabitTrackerScreenState();
}

class _HabitTrackerScreenState extends State<HabitTrackerScreen> {
  HabitSpot get spot => widget.spot;
  HabitLog get _log => widget.log ?? spot.log;
  bool _yesterday = false;

  DateTime get _today {
    final n = _log.clock();
    return DateTime(n.year, n.month, n.day);
  }

  DateTime get _shown =>
      _yesterday ? DateTime(_today.year, _today.month, _today.day - 1) : _today;

  Future<void> _tap(HabitItem item) async {
    final tick = await _log.toggle(item.id, day: _shown);
    if (tick == null || !mounted || !tick.done) return;
    final message = tick.goalReached != null
        ? tr(
            'MashaAllah! ${tick.goalReached} full days in a row!',
            'ماشاءاللہ! لگاتار ${tick.goalReached} دن مکمل!',
          )
        : tick.dayComplete
        ? tr(spot.doneEn, spot.doneUr)
        : null;
    if (message == null) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          key: const Key('habit-celebration'),
          behavior: SnackBarBehavior.floating,
          backgroundColor: spot.color,
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
    key: Key('habit-${spot.id}'),
    backgroundColor: canvas,
    appBar: AppBar(title: Text(tr(spot.titleEn, spot.titleUr))),
    body: SafeArea(
      child: ConstrainedBody(
        maxWidth: 600,
        child: ListenableBuilder(
          listenable: _log,
          builder: (context, _) {
            final record = _log.record;
            final done = record.on(_shown);
            final total = spot.items.length;
            final streak = record.streakOn(_log.clock(), total);
            final hadith = spot.id == hadithSpot.id ? hadithFor(_shown) : null;
            return ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              children: [
                _hero(done.length, total, streak),
                if (record.confirmedOn(_shown)) ...[
                  const SizedBox(height: 10),
                  const ParentSeenBadge(),
                ],
                if (hadith != null) ...[
                  const SizedBox(height: 12),
                  _HadithCard(hadith: hadith, color: spot.color),
                ],
                const SizedBox(height: 14),
                Row(
                  children: [
                    _chip(tr('Today', 'آج'), !_yesterday, false),
                    const SizedBox(width: 8),
                    _chip(tr('Yesterday', 'کل'), _yesterday, true),
                  ],
                ),
                const SizedBox(height: 10),
                for (final item in spot.items)
                  _row(item, done.contains(item.id)),
                const SizedBox(height: 14),
                _week(record, total),
                const SizedBox(height: 14),
                Text(
                  tr(spot.noteEn, spot.noteUr),
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: mutedInk),
                ),
                if (widget.onCourse != null) ...[
                  const SizedBox(height: 14),
                  OutlinedButton.icon(
                    key: const Key('habit-course'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: spot.color,
                      side: BorderSide(color: spot.color),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    onPressed: widget.onCourse,
                    icon: const Icon(Icons.school_outlined),
                    label: Text(tr(spot.courseEn, spot.courseUr)),
                  ),
                ],
              ],
            );
          },
        ),
      ),
    ),
  );

  Widget _hero(int count, int total, int streak) {
    final next = prayerStreakGoals.firstWhere(
      (g) => g > streak,
      orElse: () => streak + 10,
    );
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: spot.tint,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        children: [
          Icon(spot.heroIcon, size: 48, color: spot.color),
          const SizedBox(height: 10),
          Wrap(
            alignment: WrapAlignment.center,
            children: [
              for (var i = 0; i < total; i++)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 5),
                  child: Icon(
                    i < count ? spot.unitOn : spot.unitOff,
                    key: Key('habit-unit-$i-${i < count ? 'on' : 'off'}'),
                    color: i < count ? spot.color : spot.color.withAlpha(70),
                    size: 28,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            _yesterday
                ? tr('Yesterday: $count of $total', 'کل: $total میں سے $count')
                : tr('Today: $count of $total', 'آج: $total میں سے $count'),
            key: const Key('habit-count'),
            style: displayStyle(22),
          ),
          const SizedBox(height: 8),
          _pill(
            streak == 0
                ? tr(
                    'Finish all $total to start a streak',
                    'سب $total مکمل کر کے سلسلہ شروع کریں',
                  )
                : tr(
                    '$streak-day streak · next goal $next days',
                    '$streak دن کا سلسلہ · اگلا ہدف $next دن',
                  ),
          ),
        ],
      ),
    );
  }

  Widget _chip(String label, bool selected, bool yesterday) => ChoiceChip(
    key: Key(yesterday ? 'habit-day-yesterday' : 'habit-day-today'),
    label: Text(label),
    selected: selected,
    onSelected: (_) => setState(() => _yesterday = yesterday),
    selectedColor: spot.color,
    backgroundColor: Colors.white,
    showCheckmark: false,
    labelStyle: TextStyle(
      color: selected ? Colors.white : ink,
      fontWeight: FontWeight.w700,
    ),
    side: BorderSide(color: selected ? spot.color : lineColor),
  );

  Widget _row(HabitItem item, bool done) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Material(
      color: done ? spot.tint : Colors.white,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        key: Key('habit-item-${item.id}'),
        borderRadius: BorderRadius.circular(18),
        onTap: () => _tap(item),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: done ? spot.color.withAlpha(90) : lineColor,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: spot.tint,
                  shape: BoxShape.circle,
                ),
                child: Icon(item.icon, color: spot.color),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  tr(item.en, item.ur),
                  style: const TextStyle(
                    color: ink,
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 220),
                transitionBuilder: (child, a) =>
                    ScaleTransition(scale: a, child: child),
                child: Icon(
                  done ? Icons.check_circle : Icons.radio_button_unchecked,
                  key: ValueKey(done),
                  color: done ? successInk : const Color(0xFFCFCAD8),
                  size: 32,
                  semanticLabel: done
                      ? tr('Done', 'ہو گیا')
                      : tr('Not yet', 'ابھی نہیں'),
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );

  Widget _week(HabitRecord record, int total) => WeekStrip(
    title: tr(
      'This week: ${record.weekCount(_today)} of ${total * 7}',
      'اس ہفتے: ${total * 7} میں سے ${record.weekCount(_today)}',
    ),
    today: _today,
    color: spot.color,
    value: (day) => record.countOn(day) / total,
    label: (day) => '${record.countOn(day)}',
  );
}

Widget _pill(String text) => Container(
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
          text,
          key: const Key('habit-streak'),
          style: const TextStyle(color: ink, fontWeight: FontWeight.w700),
        ),
      ),
    ],
  ),
);

class _HadithCard extends StatelessWidget {
  const _HadithCard({required this.hadith, required this.color});
  final DailyHadith hadith;
  final Color color;
  @override
  Widget build(BuildContext context) => Container(
    key: const Key('hadith-of-day'),
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: lineColor),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '“${tr(hadith.en, hadith.ur)}”',
          style: const TextStyle(
            color: ink,
            fontSize: 17,
            height: 1.4,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          hadith.source,
          style: const TextStyle(color: mutedInk, fontSize: 12),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Icon(Icons.flag, color: color, size: 20),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                tr('Today: ${hadith.actEn}', 'آج کا عمل: ${hadith.actUr}'),
                style: TextStyle(color: color, fontWeight: FontWeight.w800),
              ),
            ),
          ],
        ),
      ],
    ),
  );
}

/// Seven small rings for the last seven days, ending today.
class WeekStrip extends StatelessWidget {
  const WeekStrip({
    super.key,
    required this.title,
    required this.today,
    required this.color,
    required this.value,
    required this.label,
    this.days,
  });
  final String title;
  final DateTime today;
  final Color color;
  final double Function(DateTime) value;
  final String Function(DateTime) label;

  /// The days to show; the seven ending [today] when null.
  final List<DateTime>? days;
  static const _en = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  static const _ur = ['پیر', 'منگل', 'بدھ', 'جمعرات', 'جمعہ', 'ہفتہ', 'اتوار'];
  @override
  Widget build(BuildContext context) {
    final shown =
        days ??
        [
          for (var i = 6; i >= 0; i--)
            DateTime(today.year, today.month, today.day - i),
        ];
    return Container(
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
            title,
            key: const Key('week-title'),
            style: const TextStyle(color: ink, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              for (final day in shown) Expanded(child: _day(day, day == today)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _day(DateTime day, bool isToday) {
    final v = value(day).clamp(0.0, 1.0);
    final full = v >= 1;
    return Column(
      children: [
        SizedBox(
          width: 34,
          height: 34,
          child: Stack(
            alignment: Alignment.center,
            children: [
              CircularProgressIndicator(
                value: v,
                strokeWidth: 4,
                backgroundColor: const Color(0xFFEEEAF2),
                color: full ? _lamp : color,
              ),
              full
                  ? const Icon(Icons.star, color: _lamp, size: 16)
                  : Text(
                      label(day),
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
          tr(_en[day.weekday - 1], _ur[day.weekday - 1]),
          maxLines: 1,
          overflow: TextOverflow.fade,
          softWrap: false,
          style: TextStyle(
            color: isToday ? color : mutedInk,
            fontSize: 11,
            fontWeight: isToday ? FontWeight.w800 : FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

/// Shown to the child when a parent has confirmed everything ticked that day.
class ParentSeenBadge extends StatelessWidget {
  const ParentSeenBadge({super.key});
  @override
  Widget build(BuildContext context) => Container(
    key: const Key('parent-seen'),
    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
    decoration: BoxDecoration(
      color: const Color(0xFFE7F5EE),
      borderRadius: BorderRadius.circular(16),
    ),
    child: Row(
      children: [
        const Icon(Icons.verified, color: successInk),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            tr(
              'Ammi or Abbu saw this — well done!',
              'امی یا ابو نے دیکھ لیا — شاباش!',
            ),
            style: const TextStyle(color: ink, fontWeight: FontWeight.w800),
          ),
        ),
      ],
    ),
  );
}
