import 'package:flutter/material.dart';
import '../app_theme.dart';

/// Shared building blocks for the staff workspaces (teacher, school admin).

/// Brand display face for headings and big numbers: Fredoka, the rounded
/// type the website and original app use. It is a variable font, so the
/// weight is set on the `wght` axis as well as with [FontWeight].
TextStyle displayStyle(
  double size, {
  Color color = brandNavy,
  FontWeight weight = FontWeight.w600,
  double? height,
  double? letterSpacing,
}) => TextStyle(
  fontFamily: 'Fredoka',
  fontFamilyFallback: const ['JameelNoori'],
  fontSize: size,
  color: color,
  height: height,
  letterSpacing: letterSpacing,
  fontWeight: weight,
  fontVariations: [FontVariation.weight(weight.value.toDouble())],
);

/// Animates a whole number from its previous value (0 at first) to [value].
class CountUp extends StatelessWidget {
  const CountUp(this.value, {super.key, required this.style, this.suffix = ''});
  final int value;
  final TextStyle style;
  final String suffix;
  @override
  Widget build(BuildContext context) => TweenAnimationBuilder<double>(
    tween: Tween(end: value.toDouble()),
    duration: MediaQuery.of(context).disableAnimations
        ? Duration.zero
        : const Duration(milliseconds: 900),
    curve: Curves.easeOutCubic,
    builder: (context, v, _) => Text('${v.round()}$suffix', style: style),
  );
}

/// Fades and lifts [child] in once, [index] steps after the first item, so a
/// list arrives as a gentle cascade instead of all at once.
class Reveal extends StatelessWidget {
  const Reveal({super.key, required this.index, required this.child});
  final int index;
  final Widget child;
  @override
  Widget build(BuildContext context) {
    if (MediaQuery.of(context).disableAnimations) return child;
    final delay = 60 * index.clamp(0, 8);
    final total = 420 + delay;
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: Duration(milliseconds: total),
      curve: Interval(delay / total, 1, curve: Curves.easeOutCubic),
      builder: (context, t, child) => Opacity(
        opacity: t,
        child: Transform.translate(
          offset: Offset(0, 16 * (1 - t)),
          child: child,
        ),
      ),
      child: child,
    );
  }
}

/// Shrinks [child] slightly while a finger is down on it. Uses raw pointer
/// events, so it never competes with the InkWell inside for the tap.
class Pressable extends StatefulWidget {
  const Pressable({super.key, required this.child, this.scale = .96});
  final Widget child;
  final double scale;
  @override
  State<Pressable> createState() => _PressableState();
}

class _PressableState extends State<Pressable> {
  bool _down = false;
  void _set(bool v) {
    if (v != _down) setState(() => _down = v);
  }

  @override
  Widget build(BuildContext context) => Listener(
    onPointerDown: (_) => _set(true),
    onPointerUp: (_) => _set(false),
    onPointerCancel: (_) => _set(false),
    child: AnimatedScale(
      scale: _down ? widget.scale : 1,
      duration: const Duration(milliseconds: 120),
      curve: Curves.easeOut,
      child: widget.child,
    ),
  );
}

const mutedInk = Color(0xFF6B7488);
const lineColor = Color(0xFFEDE4DE);

/// Outline for lesson and mission cards in the Individual courses: clear
/// enough to separate white cards from the pale page.
const lessonOutline = Color(0xFFD9CEC3);
const dangerInk = Color(0xFFB4233C);
const successInk = Color(0xFF1F8A5B);

BoxDecoration cardDecoration() => BoxDecoration(
  color: Colors.white,
  borderRadius: BorderRadius.circular(20),
  border: Border.all(color: lineColor),
  boxShadow: [
    BoxShadow(
      color: brandNavy.withValues(alpha: .05),
      blurRadius: 18,
      offset: const Offset(0, 6),
    ),
  ],
);

class SectionHeader extends StatelessWidget {
  const SectionHeader({
    super.key,
    required this.eyebrow,
    required this.title,
    this.subtitle,
    this.trailing,
  });
  final String eyebrow, title;
  final String? subtitle;
  final Widget? trailing;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(20, 20, 16, 12),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                eyebrow,
                style: const TextStyle(
                  color: brandPink,
                  fontWeight: FontWeight.w700,
                  fontSize: 13.5,
                  letterSpacing: .3,
                ),
              ),
              const SizedBox(height: 2),
              Text(title, style: displayStyle(26)),
              if (subtitle != null) ...[
                const SizedBox(height: 4),
                Text(
                  subtitle!,
                  style: const TextStyle(color: mutedInk, fontSize: 14.5),
                ),
              ],
            ],
          ),
        ),
        ?trailing,
      ],
    ),
  );
}

const _titles = {
  'mr', 'mrs', 'ms', 'miss', 'dr', 'sir', 'madam', 'prof', 'mst', //
  'hafiz', 'qari', 'maulana', 'mufti', 'ustad', 'ustaz', 'ustadha',
};

/// First letter of the person's own name: "Mr Ali" → A, "Ms Sara" → S.
/// Titles and a leading "(…)" are skipped.
String avatarInitial(String name) {
  final words = name
      .replaceAll(RegExp(r'\([^)]*\)'), ' ')
      .split(RegExp(r'\s+'))
      .where((w) => w.isNotEmpty)
      .toList();
  final word = words.firstWhere(
    (w) => !_titles.contains(w.toLowerCase().replaceAll('.', '')),
    orElse: () => words.isEmpty ? '' : words.first,
  );
  return word.isEmpty ? '?' : word.characters.first.toUpperCase();
}

class NameAvatar extends StatelessWidget {
  const NameAvatar(
    this.name, {
    super.key,
    this.size = 42,
    this.colors = const [brandPink, brandOrange],
  });
  final String name;
  final double size;
  final List<Color> colors;
  @override
  Widget build(BuildContext context) => Container(
    width: size,
    height: size,
    alignment: Alignment.center,
    decoration: BoxDecoration(
      shape: BoxShape.circle,
      gradient: LinearGradient(
        colors: colors,
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
    ),
    child: Text(
      avatarInitial(name),
      style: TextStyle(
        color: Colors.white,
        fontWeight: FontWeight.w800,
        fontSize: size * .42,
      ),
    ),
  );
}

class TagChip extends StatelessWidget {
  const TagChip(this.text, {super.key, this.color = brandNavy});
  final String text;
  final Color color;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
    decoration: BoxDecoration(
      color: color.withValues(alpha: .09),
      borderRadius: BorderRadius.circular(20),
    ),
    child: Text(
      text,
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
      style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w700),
    ),
  );
}

/// White search box used above staff lists.
class SearchField extends StatelessWidget {
  const SearchField({super.key, required this.onChanged, this.hint});
  final ValueChanged<String> onChanged;
  final String? hint;
  @override
  Widget build(BuildContext context) => TextField(
    onChanged: onChanged,
    decoration: InputDecoration(
      hintText: hint ?? 'Search by name',
      prefixIcon: const Icon(Icons.search_rounded),
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: lineColor),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: lineColor),
      ),
    ),
  );
}

/// Grouped white card holding list rows separated by hairlines.
class ListCard extends StatelessWidget {
  const ListCard({super.key, required this.children});
  final List<Widget> children;
  @override
  Widget build(BuildContext context) => Container(
    // Shadow behind, border on top, and the white fill on a Material so
    // ListTile tap ripples stay visible.
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(20),
      boxShadow: cardDecoration().boxShadow,
    ),
    foregroundDecoration: BoxDecoration(
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: lineColor),
    ),
    child: Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          for (final (i, child) in children.indexed) ...[
            if (i > 0) const Divider(height: 1, color: lineColor),
            child,
          ],
        ],
      ),
    ),
  );
}

/// Small number tile for dashboards.
class StatTile extends StatelessWidget {
  const StatTile({
    super.key,
    required this.value,
    required this.label,
    required this.icon,
    this.color = brandPink,
    this.onTap,
  });
  final String value, label;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) => Material(
    color: Colors.transparent,
    child: InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Ink(
        decoration: cardDecoration(),
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: color.withValues(alpha: .12),
                borderRadius: BorderRadius.circular(11),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 10),
            Text(
              value,
              style: const TextStyle(
                color: brandNavy,
                fontSize: 24,
                fontWeight: FontWeight.w800,
                height: 1.1,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: mutedInk, fontSize: 13),
            ),
          ],
        ),
      ),
    ),
  );
}

/// Rounded input used in staff forms.
InputDecoration formField(String label, {String? hint, IconData? icon}) =>
    InputDecoration(
      labelText: label,
      hintText: hint,
      prefixIcon: icon == null ? null : Icon(icon),
      filled: true,
      fillColor: const Color(0xFFFBF8F6),
      errorMaxLines: 3,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: lineColor),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: lineColor),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: brandPink, width: 1.6),
      ),
    );

void showMessage(BuildContext context, String text) =>
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));

// ─────────────── Dashboard building blocks (all staff/family) ───────────────

const brandIndigo = Color(0xFF3A4E8C);

String greetingFor(DateTime now) => switch (now.hour) {
  < 12 => 'Good morning',
  < 17 => 'Good afternoon',
  _ => 'Good evening',
};

String todayLabel(DateTime d) {
  const days = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', //
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return '${days[d.weekday - 1]}, ${d.day} ${months[d.month - 1]}';
}

/// Navy gradient header shared by every workspace: date, greeting, a big
/// [title] (school or family name) and a small [badge] line.
class DashboardHero extends StatelessWidget {
  const DashboardHero({
    super.key,
    required this.title,
    required this.personName,
    required this.badge,
    required this.onProfile,
    this.badgeIcon = Icons.verified_rounded,
    this.colors = const [brandNavy, brandIndigo],
    this.greeting,
    this.dateText,
    this.action,
  });
  final String title, personName, badge;
  final IconData badgeIcon;
  final List<Color> colors;
  final VoidCallback onProfile;

  /// Replace the English greeting and date (the family page in Urdu).
  final String? greeting, dateText;

  /// Shown before the account avatar, such as a language switch.
  final Widget? action;
  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final top = MediaQuery.paddingOf(context).top;
    return ClipRRect(
      borderRadius: const BorderRadius.vertical(bottom: Radius.circular(34)),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: colors,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Stack(
          children: [
            // Quiet decoration: two thin rings and one soft pink glow, kept
            // to the top-right so the text side stays clean.
            Positioned(right: -70, top: -70, child: _ring(230, .07)),
            Positioned(right: -20, top: -20, child: _ring(130, .09)),
            Positioned(
              right: 36,
              bottom: 28,
              child: _glow(70, brandPink.withValues(alpha: .18)),
            ),
            Positioned(
              right: 118,
              top: 64 + top,
              child: _glow(10, brandOrange.withValues(alpha: .7)),
            ),
            Padding(
              padding: EdgeInsets.fromLTRB(20, top + 18, 16, 64),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: .14),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.calendar_today_rounded,
                              size: 13,
                              color: Colors.white,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              dateText ?? todayLabel(now),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 12.5,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Spacer(),
                      if (action != null) ...[
                        action!,
                        const SizedBox(width: 10),
                      ],
                      Semantics(
                        button: true,
                        label: 'Account',
                        child: GestureDetector(
                          onTap: onProfile,
                          child: Container(
                            padding: const EdgeInsets.all(2),
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white,
                            ),
                            child: NameAvatar(personName, size: 38),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Text(
                    '${greeting ?? greetingFor(now)}, $personName',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: .82),
                      fontSize: 14.5,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    title,
                    style: displayStyle(31, color: Colors.white, height: 1.12),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(badgeIcon, size: 16, color: Color(0xFFFFC9DE)),
                      const SizedBox(width: 6),
                      Text(
                        badge,
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: .78),
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  static Widget _glow(double size, Color color) => Container(
    width: size,
    height: size,
    decoration: BoxDecoration(shape: BoxShape.circle, color: color),
  );

  static Widget _ring(double size, double alpha) => Container(
    width: size,
    height: size,
    decoration: BoxDecoration(
      shape: BoxShape.circle,
      border: Border.all(
        color: Colors.white.withValues(alpha: alpha),
        width: 18,
      ),
    ),
  );
}

class StatItem extends StatelessWidget {
  const StatItem({
    super.key,
    required this.value,
    required this.label,
    required this.icon,
    required this.color,
    required this.onTap,
  });
  final int value;
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Expanded(
    child: Semantics(
      button: true,
      label: '$value $label',
      excludeSemantics: true,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 12),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: .13),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 17),
              ),
              const SizedBox(height: 6),
              CountUp(value, style: displayStyle(23, height: 1.1)),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: mutedInk, fontSize: 12),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

class StatStrip extends StatelessWidget {
  const StatStrip({super.key, required this.children});
  final List<Widget> children;
  @override
  Widget build(BuildContext context) => Container(
    // Shadow outside, white fill on the Material: the card stays pure white
    // and tap ripples stay visible.
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(22),
      boxShadow: [
        BoxShadow(
          color: brandNavy.withValues(alpha: .14),
          blurRadius: 24,
          offset: const Offset(0, 10),
        ),
      ],
    ),
    child: Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(22),
      clipBehavior: Clip.antiAlias,
      child: Row(
        // Full-height segments, so the whole quarter is the tap target.
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (final (i, child) in children.indexed) ...[
            if (i > 0)
              const Center(
                child: SizedBox(
                  height: 44,
                  child: VerticalDivider(width: 1, color: lineColor),
                ),
              ),
            child,
          ],
        ],
      ),
    ),
  );
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.text, {super.key, this.trailing});
  final String text;
  final String? trailing;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(20, 26, 20, 12),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(child: Text(text, style: displayStyle(21))),
        if (trailing != null)
          Text(
            trailing!,
            style: const TextStyle(color: mutedInk, fontSize: 13),
          ),
      ],
    ),
  );
}

class PageHeader extends StatelessWidget {
  const PageHeader({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
  });
  final String title, subtitle;
  final IconData icon;
  final Color color;
  @override
  Widget build(BuildContext context) => Padding(
    padding: EdgeInsets.fromLTRB(
      20,
      MediaQuery.paddingOf(context).top + 18,
      20,
      14,
    ),
    child: Row(
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: color.withValues(alpha: .13),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Icon(icon, color: color, size: 26),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: displayStyle(26, height: 1.1)),
              const SizedBox(height: 2),
              Text(subtitle, style: const TextStyle(color: mutedInk)),
            ],
          ),
        ),
      ],
    ),
  );
}

/// The list card used across the school workspaces: white, with a colour
/// stripe and a soft glow in its [accent] so each list has its own identity.
class RowCard extends StatelessWidget {
  const RowCard({
    super.key,
    required this.child,
    this.onTap,
    this.index = 0,
    this.accent = brandPink,
    this.outline,
  });
  final Widget child;
  final VoidCallback? onTap;
  final int index;
  final Color accent;

  /// A stronger outline colour (lesson lists); defaults to a faint accent.
  final Color? outline;
  @override
  Widget build(BuildContext context) => Reveal(
    index: index,
    child: Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: Pressable(
        scale: onTap == null ? 1 : .985,
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            boxShadow: [
              BoxShadow(
                color: accent.withValues(alpha: .13),
                blurRadius: 22,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          foregroundDecoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            border: outline == null
                ? Border.all(color: accent.withValues(alpha: .16))
                : Border.all(color: outline!, width: 1.3),
          ),
          child: Material(
            color: Colors.white,
            borderRadius: BorderRadius.circular(22),
            clipBehavior: Clip.antiAlias,
            child: InkWell(
              onTap: onTap,
              splashColor: accent.withValues(alpha: .1),
              child: Stack(
                children: [
                  // Soft glow in the corner.
                  Positioned(
                    right: -34,
                    top: -34,
                    child: Container(
                      width: 104,
                      height: 104,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            accent.withValues(alpha: .10),
                            accent.withValues(alpha: 0),
                          ],
                        ),
                      ),
                    ),
                  ),
                  // Colour stripe on the leading edge.
                  Positioned(
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 5,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [accent, accent.withValues(alpha: .45)],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(18, 14, 14, 14),
                    child: child,
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

/// [NameAvatar] inside a white ring and a thin coloured halo.
class RingAvatar extends StatelessWidget {
  const RingAvatar(
    this.name, {
    super.key,
    this.size = 46,
    this.colors = const [brandPink, brandOrange],
  });
  final String name;
  final double size;
  final List<Color> colors;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(2),
    decoration: BoxDecoration(
      shape: BoxShape.circle,
      gradient: LinearGradient(
        colors: [
          colors.first.withValues(alpha: .55),
          colors.last.withValues(alpha: .25),
        ],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      boxShadow: [
        BoxShadow(
          color: colors.first.withValues(alpha: .25),
          blurRadius: 10,
          offset: const Offset(0, 4),
        ),
      ],
    ),
    child: Container(
      padding: const EdgeInsets.all(2),
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.white,
      ),
      child: NameAvatar(name, size: size - 8, colors: colors),
    ),
  );
}

class PointsPill extends StatelessWidget {
  const PointsPill(this.points, {super.key});
  final int points;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
    decoration: BoxDecoration(
      color: brandOrange.withValues(alpha: .12),
      borderRadius: BorderRadius.circular(20),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(Icons.star_rounded, size: 15, color: brandOrange),
        const SizedBox(width: 3),
        Text(
          '$points pts',
          style: const TextStyle(
            color: Color(0xFFB45F0A),
            fontWeight: FontWeight.w800,
            fontSize: 12.5,
          ),
        ),
      ],
    ),
  );
}

class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.icon,
    required this.color,
    required this.title,
    required this.message,
  });
  final IconData icon;
  final Color color;
  final String title, message;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(28, 36, 28, 0),
    child: Column(
      children: [
        Container(
          width: 96,
          height: 96,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: color.withValues(alpha: .1),
          ),
          child: Icon(icon, size: 46, color: color),
        ),
        const SizedBox(height: 16),
        Text(title, textAlign: TextAlign.center, style: displayStyle(18)),
        const SizedBox(height: 6),
        Text(
          message,
          textAlign: TextAlign.center,
          style: const TextStyle(color: mutedInk, height: 1.4),
        ),
      ],
    ),
  );
}

class RoundAction extends StatelessWidget {
  const RoundAction({
    super.key,
    required this.icon,
    required this.tooltip,
    required this.color,
    required this.onPressed,
  });
  final IconData icon;
  final String tooltip;
  final Color color;
  final VoidCallback onPressed;
  @override
  Widget build(BuildContext context) => IconButton(
    tooltip: tooltip,
    onPressed: onPressed,
    style: IconButton.styleFrom(
      backgroundColor: color.withValues(alpha: .1),
      foregroundColor: color,
      minimumSize: const Size(44, 44),
    ),
    icon: Icon(icon, size: 21),
  );
}
