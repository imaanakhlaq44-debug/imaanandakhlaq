import 'package:flutter/material.dart';

import '../app_theme.dart';
import '../l10n/language.dart';
import '../rewards/habit_log.dart';
import 'habit_tracker.dart' show WeekStrip;
import 'ui_kit.dart';

const challengeColor = Color(0xFFC34F59);
const _tint = Color(0xFFFBEDEE);
const _gold = Color(0xFFF5B83D);

/// Days of a week a child needs to complete the challenge.
const challengeGoalDays = 5;

class WeeklyChallenge {
  const WeeklyChallenge(this.id, this.en, this.ur, this.icon);
  final String id, en, ur;
  final IconData icon;
}

const weeklyChallenges = [
  WeeklyChallenge(
    'fajr',
    'Pray Fajr on time',
    'فجر وقت پر پڑھیں',
    Icons.wb_twilight,
  ),
  WeeklyChallenge(
    'salam',
    'Say salam to everyone you meet',
    'جس سے بھی ملیں اسے سلام کریں',
    Icons.waving_hand,
  ),
  WeeklyChallenge(
    'help',
    'Help at home without being asked',
    'بغیر کہے گھر کے کام میں مدد کریں',
    Icons.cleaning_services,
  ),
  WeeklyChallenge(
    'bismillah',
    'Say Bismillah before every meal',
    'ہر کھانے سے پہلے بسم اللہ پڑھیں',
    Icons.restaurant,
  ),
  WeeklyChallenge(
    'quran',
    'Read Quran for five minutes',
    'پانچ منٹ قرآن پڑھیں',
    Icons.menu_book,
  ),
  WeeklyChallenge(
    'shukr',
    'Say Alhamdulillah for three blessings',
    'تین نعمتوں پر الحمدللہ کہیں',
    Icons.volunteer_activism,
  ),
  WeeklyChallenge(
    'share',
    'Share something with a sibling or friend',
    'بہن بھائی یا دوست کے ساتھ کچھ بانٹیں',
    Icons.redeem,
  ),
  WeeklyChallenge(
    'gentle',
    'Speak gently, even when upset',
    'غصے میں بھی نرمی سے بات کریں',
    Icons.sentiment_satisfied,
  ),
];

DateTime _monday(DateTime t) =>
    DateTime(t.year, t.month, t.day - (t.weekday - 1));

/// This week's challenge: a new one every Monday, in turn.
WeeklyChallenge challengeFor(DateTime day) {
  final m = _monday(day);
  final weeks =
      DateTime.utc(
        m.year,
        m.month,
        m.day,
      ).difference(DateTime.utc(2026, 1, 5)).inDays ~/
      7;
  return weeklyChallenges[weeks % weeklyChallenges.length];
}

HabitLog get challengeLog => HabitLog.of('challenge', items: 1);

Future<void> openWeeklyChallenge(
  BuildContext context, {
  required String scope,
  VoidCallback? onExplore,
}) {
  challengeLog.use(scope);
  return Navigator.of(context).push<void>(
    MaterialPageRoute(
      // Its own page, so it needs its own Urdu right-to-left layout.
      builder: (_) =>
          LanguageScope(child: WeeklyChallengeScreen(onExplore: onExplore)),
    ),
  );
}

class WeeklyChallengeScreen extends StatelessWidget {
  const WeeklyChallengeScreen({super.key, this.log, this.onExplore});
  final HabitLog? log;
  final VoidCallback? onExplore;

  Future<void> _mark(BuildContext context, HabitLog log, DateTime day) async {
    final before = log.record.daysThisWeek(log.clock());
    final tick = await log.toggle(challengeFor(day).id, day: day);
    if (tick == null || !tick.done || !context.mounted) return;
    final after = log.record.daysThisWeek(log.clock());
    final message = before < challengeGoalDays && after >= challengeGoalDays
        ? tr(
            'MashaAllah! Challenge complete — $after days this week!',
            'ماشاءاللہ! چیلنج مکمل — اس ہفتے $after دن!',
          )
        : tr('Well done! Keep going.', 'شاباش! جاری رکھیں۔');
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          key: const Key('challenge-celebration'),
          behavior: SnackBarBehavior.floating,
          backgroundColor: challengeColor,
          content: Row(
            children: [
              const Icon(Icons.auto_awesome, color: _gold),
              const SizedBox(width: 10),
              Expanded(child: Text(message)),
            ],
          ),
        ),
      );
  }

  @override
  Widget build(BuildContext context) {
    final log = this.log ?? challengeLog;
    return Scaffold(
      key: const Key('weekly-challenge'),
      backgroundColor: canvas,
      appBar: AppBar(title: Text(tr('Weekly Challenge', 'ہفتے کا چیلنج'))),
      body: SafeArea(
        child: ConstrainedBody(
          maxWidth: 600,
          child: ListenableBuilder(
            listenable: log,
            builder: (context, _) {
              final now = log.clock();
              final today = DateTime(now.year, now.month, now.day);
              final yesterday = DateTime(
                today.year,
                today.month,
                today.day - 1,
              );
              final challenge = challengeFor(today);
              final record = log.record;
              final days = record.daysThisWeek(today);
              final doneToday = record.countOn(today) > 0;
              final monday = _monday(today);
              final sameWeek = !yesterday.isBefore(monday);
              final complete = days >= challengeGoalDays;
              return ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                children: [
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: _tint,
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Column(
                      children: [
                        Icon(challenge.icon, size: 52, color: challengeColor),
                        const SizedBox(height: 8),
                        Text(
                          tr('This week’s challenge', 'اس ہفتے کا چیلنج'),
                          style: const TextStyle(
                            color: mutedInk,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          tr(challenge.en, challenge.ur),
                          key: const Key('challenge-title'),
                          textAlign: TextAlign.center,
                          style: displayStyle(23),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            for (var i = 0; i < challengeGoalDays; i++)
                              Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 4,
                                ),
                                child: Icon(
                                  i < days ? Icons.star : Icons.star_border,
                                  color: i < days
                                      ? _gold
                                      : challengeColor.withAlpha(80),
                                  size: 30,
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          complete
                              ? tr(
                                  'Challenge complete! MashaAllah',
                                  'چیلنج مکمل! ماشاءاللہ',
                                )
                              : tr(
                                  '$days of $challengeGoalDays days',
                                  '$challengeGoalDays میں سے $days دن',
                                ),
                          key: const Key('challenge-count'),
                          style: const TextStyle(
                            color: ink,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  FilledButton.icon(
                    key: const Key('challenge-today'),
                    style: FilledButton.styleFrom(
                      backgroundColor: doneToday ? successInk : challengeColor,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    onPressed: () => _mark(context, log, today),
                    icon: Icon(doneToday ? Icons.check_circle : Icons.flag),
                    label: Text(
                      doneToday
                          ? tr('Done today!', 'آج ہو گیا!')
                          : tr('I did it today', 'میں نے آج کر لیا'),
                      style: const TextStyle(fontSize: 16),
                    ),
                  ),
                  if (sameWeek) ...[
                    const SizedBox(height: 8),
                    TextButton(
                      key: const Key('challenge-yesterday'),
                      onPressed: () => _mark(context, log, yesterday),
                      style: TextButton.styleFrom(
                        foregroundColor: challengeColor,
                      ),
                      child: Text(
                        record.countOn(yesterday) > 0
                            ? tr(
                                'Yesterday is marked (tap to undo)',
                                'کل کا نشان لگا ہے (ہٹانے کے لیے دبائیں)',
                              )
                            : tr(
                                'I did it yesterday too',
                                'میں نے کل بھی کیا تھا',
                              ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  WeekStrip(
                    title: tr('Monday to Sunday', 'پیر سے اتوار'),
                    today: today,
                    color: challengeColor,
                    days: [
                      for (var i = 0; i < 7; i++)
                        DateTime(monday.year, monday.month, monday.day + i),
                    ],
                    value: (d) => record.countOn(d) > 0 ? 1 : 0,
                    label: (_) => '',
                  ),
                  const SizedBox(height: 14),
                  Text(
                    tr(
                      'A new challenge comes every Monday.',
                      'ہر پیر کو نیا چیلنج آتا ہے۔',
                    ),
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: mutedInk),
                  ),
                  if (onExplore != null) ...[
                    const SizedBox(height: 14),
                    OutlinedButton.icon(
                      key: const Key('challenge-explore'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: challengeColor,
                        side: const BorderSide(color: challengeColor),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      onPressed: onExplore,
                      icon: const Icon(Icons.explore_outlined),
                      label: Text(tr('Explore all courses', 'سب کورس دیکھیں')),
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
}
