import 'package:flutter/material.dart';

import '../app_theme.dart';
import '../screens/ui_kit.dart';
import 'rewards.dart';
import '../l10n/language.dart';

const _gold = Color(0xFFF5B83D);
const _flame = Color(0xFFF07A3C);

/// Records a finished item with [Rewards.instance] and, when it earned
/// something new, plays a short celebration over the current screen.
///
/// Never throws and never blocks: the lesson is already saved by the caller.
Future<RewardResult?> celebrateFinish(
  BuildContext context, {
  required String course,
  required String item,
  int mistakes = 0,
  String? group,
  String? groupTitle,
  Iterable<String>? groupItems,
}) async {
  RewardResult? result;
  try {
    result = await Rewards.instance.finish(
      course: course,
      item: item,
      mistakes: mistakes,
      group: group,
      groupTitle: groupTitle,
      groupItems: groupItems,
    );
  } catch (_) {
    return null;
  }
  if (result != null && context.mounted) showRewardCelebration(context, result);
  return result;
}

/// A non-blocking celebration card that drops in, shows the stars (and a new
/// badge or streak), then leaves on its own. Taps pass through underneath.
void showRewardCelebration(BuildContext context, RewardResult result) {
  final overlay = Overlay.maybeOf(context, rootOverlay: true);
  if (overlay == null) return;
  late OverlayEntry entry;
  entry = OverlayEntry(
    builder: (_) => Directionality(
      textDirection: AppLanguage.instance.direction,
      child: _Celebration(
        result: result,
        onDone: () {
          if (entry.mounted) entry.remove();
        },
      ),
    ),
  );
  overlay.insert(entry);
}

class _Celebration extends StatefulWidget {
  const _Celebration({required this.result, required this.onDone});
  final RewardResult result;
  final VoidCallback onDone;
  @override
  State<_Celebration> createState() => _CelebrationState();
}

class _CelebrationState extends State<_Celebration>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: Duration(milliseconds: widget.result.badge != null ? 3400 : 2600),
  );

  @override
  void initState() {
    super.initState();
    _c.forward().whenComplete(widget.onDone);
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final r = widget.result;
    final reduce = MediaQuery.maybeOf(context)?.disableAnimations ?? false;
    return IgnorePointer(
      child: SafeArea(
        child: Align(
          alignment: Alignment.topCenter,
          child: AnimatedBuilder(
            animation: _c,
            builder: (context, child) {
              final t = _c.value;
              // In for the first 15%, out over the last 15%.
              final inT = Curves.easeOutBack.transform((t / .15).clamp(0, 1));
              final outT = Curves.easeIn.transform(
                ((t - .85) / .15).clamp(0, 1),
              );
              final show = reduce ? 1.0 : inT * (1 - outT);
              return Opacity(
                opacity: show.clamp(0, 1),
                child: Transform.translate(
                  offset: Offset(0, -40 * (1 - show)),
                  child: child,
                ),
              );
            },
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Material(
                color: Colors.transparent,
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Container(
                    key: const Key('reward-celebration'),
                    padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(color: _gold.withValues(alpha: .45)),
                      boxShadow: [
                        BoxShadow(
                          color: _gold.withValues(alpha: .28),
                          blurRadius: 24,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            for (var i = 0; i < 3; i++)
                              _PopStar(
                                controller: _c,
                                index: i,
                                filled: i < r.stars,
                              ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          r.stars == 3
                              ? tr(
                                  'MashaAllah, well done!',
                                  'ماشاءاللہ، شاباش!',
                                )
                              : tr(
                                  'Good effort, keep going!',
                                  'اچھی کوشش، آگے بڑھتے رہیں!',
                                ),
                          textAlign: TextAlign.center,
                          style: displayStyle(18),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          tr(
                            '+${r.stars} stars  •  ${r.totalStars} in total',
                            '+${r.stars} ستارے  •  کل ${r.totalStars}',
                          ),
                          style: const TextStyle(
                            color: mutedInk,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        if (r.streakGrew && r.streak > 1) ...[
                          const SizedBox(height: 8),
                          _Pill(
                            icon: Icons.local_fire_department_rounded,
                            color: _flame,
                            text: tr(
                              '${r.streak}-day learning streak!',
                              'لگاتار ${r.streak} دن سے سیکھ رہے ہیں!',
                            ),
                          ),
                        ],
                        if (r.badge != null) ...[
                          const SizedBox(height: 10),
                          _BadgeEarned(badge: r.badge!),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _PopStar extends StatelessWidget {
  const _PopStar({
    required this.controller,
    required this.index,
    required this.filled,
  });
  final AnimationController controller;
  final int index;
  final bool filled;
  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: controller,
    builder: (context, _) {
      final start = .08 + index * .06;
      final t = ((controller.value - start) / .12).clamp(0.0, 1.0);
      final s = Curves.elasticOut.transform(t);
      return Transform.scale(
        scale: .4 + .6 * s,
        child: Transform.rotate(
          angle: (1 - s) * -.6,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 3),
            child: Icon(
              filled ? Icons.star_rounded : Icons.star_outline_rounded,
              size: index == 1 ? 46 : 38,
              color: filled ? _gold : const Color(0xFFD9D2C8),
              shadows: filled
                  ? [Shadow(color: _gold.withValues(alpha: .5), blurRadius: 12)]
                  : null,
            ),
          ),
        ),
      );
    },
  );
}

class _Pill extends StatelessWidget {
  const _Pill({required this.icon, required this.color, required this.text});
  final IconData icon;
  final Color color;
  final String text;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
    decoration: BoxDecoration(
      color: color.withValues(alpha: .1),
      borderRadius: BorderRadius.circular(20),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 4),
        Flexible(
          child: Text(
            text,
            style: TextStyle(color: color, fontWeight: FontWeight.w800),
          ),
        ),
      ],
    ),
  );
}

class _BadgeEarned extends StatelessWidget {
  const _BadgeEarned({required this.badge});
  final RewardBadge badge;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(10),
    decoration: BoxDecoration(
      gradient: const LinearGradient(
        colors: [Color(0xFFFFF4D6), Color(0xFFFFE8CB)],
      ),
      borderRadius: BorderRadius.circular(16),
    ),
    child: Row(
      children: [
        const BadgeMedal(size: 44),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                tr('New badge unlocked!', 'نیا بیج مل گیا!'),
                style: const TextStyle(
                  color: Color(0xFFB45F0A),
                  fontWeight: FontWeight.w800,
                  fontSize: 12.5,
                ),
              ),
              Text(
                badge.title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: displayStyle(15.5),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

/// A round gold medal with a star, used for badges.
class BadgeMedal extends StatelessWidget {
  const BadgeMedal({super.key, this.size = 52, this.earned = true});
  final double size;
  final bool earned;
  @override
  Widget build(BuildContext context) => Container(
    width: size,
    height: size,
    decoration: BoxDecoration(
      shape: BoxShape.circle,
      gradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: earned
            ? const [Color(0xFFFFD873), Color(0xFFE59A1E)]
            : const [Color(0xFFE9E4DD), Color(0xFFD3CCC2)],
      ),
      border: Border.all(color: Colors.white, width: size * .06),
      boxShadow: [
        BoxShadow(
          color: (earned ? _gold : Colors.black).withValues(alpha: .25),
          blurRadius: 8,
          offset: const Offset(0, 3),
        ),
      ],
    ),
    child: Icon(
      Icons.workspace_premium_rounded,
      color: Colors.white,
      size: size * .55,
    ),
  );
}

/// Streak, stars and badges for the learner, shown on the Individual home.
class RewardStrip extends StatelessWidget {
  const RewardStrip({super.key});

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: Rewards.instance,
    builder: (context, _) {
      final s = Rewards.instance.state;
      final now = Rewards.instance.clock();
      final streak = s.streakOn(now);
      final today = s.learnedOn(now);
      return Material(
        color: Colors.transparent,
        child: InkWell(
          key: const Key('reward-strip'),
          borderRadius: BorderRadius.circular(22),
          onTap: () => showBadgesSheet(context),
          child: Ink(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: _gold.withValues(alpha: .3)),
              boxShadow: [
                BoxShadow(
                  color: _gold.withValues(alpha: .14),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Row(
              children: [
                _StripItem(
                  icon: Icons.local_fire_department_rounded,
                  color: today ? _flame : const Color(0xFFC9BFB3),
                  value: streak,
                  label: tr(
                    streak == 1 ? 'day streak' : 'days streak',
                    'دن لگاتار',
                  ),
                ),
                const _Divider(),
                _StripItem(
                  icon: Icons.star_rounded,
                  color: _gold,
                  value: s.stars,
                  label: tr('stars', 'ستارے'),
                ),
                const _Divider(),
                _StripItem(
                  icon: Icons.workspace_premium_rounded,
                  color: const Color(0xFF7B4FD6),
                  value: s.badges.length,
                  label: tr(s.badges.length == 1 ? 'badge' : 'badges', 'بیج'),
                ),
                const Icon(Icons.chevron_right_rounded, color: mutedInk),
              ],
            ),
          ),
        ),
      );
    },
  );
}

class _Divider extends StatelessWidget {
  const _Divider();
  @override
  Widget build(BuildContext context) =>
      Container(width: 1, height: 34, color: lineColor);
}

class _StripItem extends StatelessWidget {
  const _StripItem({
    required this.icon,
    required this.color,
    required this.value,
    required this.label,
  });
  final IconData icon;
  final Color color;
  final int value;
  final String label;
  @override
  Widget build(BuildContext context) => Expanded(
    child: Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(width: 3),
            CountUp(value, style: displayStyle(20)),
          ],
        ),
        Text(
          label,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            color: mutedInk,
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    ),
  );
}

/// The learner's badge shelf.
Future<void> showBadgesSheet(
  BuildContext context,
) => showModalBottomSheet<void>(
  context: context,
  showDragHandle: true,
  isScrollControlled: true,
  builder: (context) {
    final s = Rewards.instance.state;
    final now = Rewards.instance.clock();
    return Directionality(
      textDirection: AppLanguage.instance.direction,
      child: SafeArea(
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.sizeOf(context).height * .8,
          ),
          child: ListView(
            key: const Key('badges-sheet'),
            shrinkWrap: true,
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
            children: [
              Text(tr('My rewards', 'میرے انعامات'), style: displayStyle(24)),
              const SizedBox(height: 4),
              Text(
                tr(
                  'Stars for every lesson you finish, a badge for every '
                      'world you complete.',
                  'ہر مکمل سبق پر ستارے، اور ہر مکمل دنیا پر ایک بیج۔',
                ),
                style: const TextStyle(color: mutedInk, height: 1.4),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  _SheetStat(
                    icon: Icons.local_fire_department_rounded,
                    color: _flame,
                    value: '${s.streakOn(now)}',
                    label: tr('Streak now', 'موجودہ سلسلہ'),
                  ),
                  const SizedBox(width: 10),
                  _SheetStat(
                    icon: Icons.emoji_events_rounded,
                    color: const Color(0xFF7B4FD6),
                    value: '${s.bestStreak}',
                    label: tr('Best streak', 'بہترین سلسلہ'),
                  ),
                  const SizedBox(width: 10),
                  _SheetStat(
                    icon: Icons.check_circle_rounded,
                    color: successInk,
                    value: '${s.finished}',
                    label: tr('Finished', 'مکمل'),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Text(tr('Badges', 'بیج'), style: displayStyle(19)),
              const SizedBox(height: 10),
              if (s.badges.isEmpty)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF6E6),
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Row(
                    children: [
                      const BadgeMedal(size: 46, earned: false),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          tr(
                            'Finish every lesson in one world or volume to win '
                                'your first badge!',
                            'کسی ایک دنیا یا جلد کے سارے سبق مکمل کریں اور '
                                'اپنا پہلا بیج جیتیں!',
                          ),
                          style: const TextStyle(
                            color: brandNavy,
                            fontWeight: FontWeight.w600,
                            height: 1.35,
                          ),
                        ),
                      ),
                    ],
                  ),
                )
              else
                Wrap(
                  spacing: 12,
                  runSpacing: 14,
                  children: [
                    for (final b in s.badges.reversed)
                      SizedBox(
                        width: 96,
                        child: Column(
                          children: [
                            const BadgeMedal(size: 58),
                            const SizedBox(height: 6),
                            Text(
                              b.title,
                              textAlign: TextAlign.center,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: brandNavy,
                                fontWeight: FontWeight.w700,
                                fontSize: 12.5,
                                height: 1.2,
                              ),
                            ),
                            Text(
                              tr(
                                rewardCourseNames[b.course] ?? b.course,
                                rewardCourseNamesUrdu[b.course] ?? b.course,
                              ),
                              style: const TextStyle(
                                color: mutedInk,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
            ],
          ),
        ),
      ),
    );
  },
);

class _SheetStat extends StatelessWidget {
  const _SheetStat({
    required this.icon,
    required this.color,
    required this.value,
    required this.label,
  });
  final IconData icon;
  final Color color;
  final String value, label;
  @override
  Widget build(BuildContext context) => Expanded(
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .08),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Icon(icon, color: color),
          const SizedBox(height: 2),
          Text(value, style: displayStyle(20)),
          Text(
            label,
            textAlign: TextAlign.center,
            style: const TextStyle(color: mutedInk, fontSize: 12),
          ),
        ],
      ),
    ),
  );
}
