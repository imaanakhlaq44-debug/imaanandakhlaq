import 'package:flutter/material.dart';
import '../app_theme.dart';
import '../entry_kind.dart';
import 'brand_splash.dart';
import '../l10n/language.dart';

const launchLogo = 'assets/images/launch-logo.png';

class LaunchGate extends StatefulWidget {
  const LaunchGate({super.key, required this.child});
  final Widget child;
  @override
  State<LaunchGate> createState() => _LaunchGateState();
}

class _LaunchGateState extends State<LaunchGate> {
  bool _ready = false;
  @override
  Widget build(BuildContext context) => AnimatedSwitcher(
    duration: const Duration(milliseconds: 450),
    switchInCurve: Curves.easeOut,
    switchOutCurve: Curves.easeIn,
    child: _ready
        ? KeyedSubtree(key: const ValueKey('app'), child: widget.child)
        : BrandSplash(
            logo: launchLogo,
            onDone: () {
              if (mounted) setState(() => _ready = true);
            },
          ),
  );
}

class SectionChoice extends StatelessWidget {
  const SectionChoice({super.key, required this.onChoose});
  final ValueChanged<AppSection> onChoose;

  static const _muted = Color(0xFF6B7488);

  /// Fades and lifts [child] in after [delayMs]; finite, so tests settle.
  static Widget _rise(
    int delayMs,
    Widget child,
  ) => TweenAnimationBuilder<double>(
    tween: Tween(begin: 0, end: 1),
    duration: Duration(milliseconds: 450 + delayMs),
    curve: Interval(delayMs / (450 + delayMs), 1, curve: Curves.easeOutCubic),
    builder: (context, t, child) => Opacity(
      opacity: t,
      child: Transform.translate(offset: Offset(0, 18 * (1 - t)), child: child),
    ),
    child: child,
  );

  @override
  Widget build(BuildContext context) => LanguageScope(child: _build(context));

  Widget _build(BuildContext context) => Scaffold(
    key: const Key('section-choice'),
    backgroundColor: brandCream,
    body: BrandBackdrop(
      child: SafeArea(
        child: Stack(
          children: [
            LayoutBuilder(
              builder: (context, constraints) => SingleChildScrollView(
                child: ConstrainedBox(
                  constraints: BoxConstraints(minHeight: constraints.maxHeight),
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _rise(0, Center(child: _logoRing())),
                        const SizedBox(height: 22),
                        _rise(
                          80,
                          Text(
                            tr('Assalamu Alaikum!', 'السلام علیکم!'),
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: brandPink,
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              letterSpacing: .4,
                            ),
                          ),
                        ),
                        const SizedBox(height: 6),
                        _rise(
                          120,
                          Text(
                            tr('Choose your space', 'اپنی جگہ چنیں'),
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontFamily: 'Fredoka',
                              fontFamilyFallback: ['JameelNoori'],
                              fontVariations: [FontVariation('wght', 600)],
                              fontSize: 30,
                              fontWeight: FontWeight.w600,
                              color: brandNavy,
                              height: 1.15,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        _rise(
                          160,
                          Text(
                            tr(
                              'Learn at home or with your school.',
                              'گھر پر سیکھیں یا اپنے اسکول کے ساتھ۔',
                            ),
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: _muted, fontSize: 15),
                          ),
                        ),
                        const SizedBox(height: 30),
                        _rise(
                          240,
                          _ChoiceCard(
                            key: const Key('choose-individual'),
                            title: tr('Individual', 'انفرادی'),
                            tag: tr(
                              'For kids & families',
                              'بچوں اور گھر والوں کے لیے',
                            ),
                            subtitle: tr(
                              'Stories, Hadith and activities at home, '
                                  'at your own pace.',
                              'کہانیاں، حدیث اور سرگرمیاں گھر پر، '
                                  'اپنی رفتار سے۔',
                            ),
                            icon: Icons.auto_stories_rounded,
                            gradient: const [brandPink, brandOrange],
                            accent: brandPink,
                            onTap: () => onChoose(AppSection.individual),
                          ),
                        ),
                        const SizedBox(height: 14),
                        _rise(
                          320,
                          _ChoiceCard(
                            key: const Key('choose-school'),
                            title: tr('School', 'اسکول'),
                            tag: tr(
                              'For students & teachers',
                              'طلبہ اور اساتذہ کے لیے',
                            ),
                            subtitle: tr(
                              'Sign in with the account your school '
                                  'gave you, or register a school.',
                              'اسکول کے دیے ہوئے اکاؤنٹ سے سائن اِن کریں، '
                                  'یا اپنا اسکول رجسٹر کریں۔',
                            ),
                            icon: Icons.school_rounded,
                            gradient: const [brandNavy, Color(0xFF3A4E8C)],
                            accent: brandNavy,
                            onTap: () => onChoose(AppSection.school),
                          ),
                        ),
                        const SizedBox(height: 28),
                        _rise(
                          400,
                          Text(
                            tr(
                              'ISLAMIC STORIES & EDUCATION FOR KIDS',
                              'بچوں کے لیے اسلامی کہانیاں اور تعلیم',
                            ),
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: Color(0xFFB5A99A),
                              fontSize: 11.5,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 1.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            const Positioned(top: 10, right: 12, child: LanguageToggle()),
          ],
        ),
      ),
    ),
  );

  static Widget _logoRing() => const BrandLogoRing(size: 138, cacheWidth: 480);
}

const brandCream = Color(0xFFFDF8F5);

/// The splash's soft brand shapes, held still, behind [child].
class BrandBackdrop extends StatelessWidget {
  const BrandBackdrop({super.key, required this.child});
  final Widget child;

  static Widget _blob(double size, Color color, {bool square = false}) =>
      Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: color.withValues(alpha: .13),
          shape: square ? BoxShape.rectangle : BoxShape.circle,
          borderRadius: square ? BorderRadius.circular(14) : null,
        ),
      );

  @override
  Widget build(BuildContext context) => Stack(
    children: [
      Positioned(top: -50, left: -40, child: _blob(190, brandPink)),
      Positioned(top: 90, right: -36, child: _blob(120, brandOrange)),
      Positioned(bottom: 120, left: -30, child: _blob(96, brandNavy)),
      Positioned(
        bottom: -40,
        right: 20,
        child: _blob(150, const Color(0xFFC99A6B)),
      ),
      Positioned(
        top: 250,
        left: 28,
        child: Transform.rotate(
          angle: .6,
          child: _blob(34, brandPink, square: true),
        ),
      ),
      Positioned.fill(child: child),
    ],
  );
}

/// The round logo in its pink ring, as on the splash.
class BrandLogoRing extends StatelessWidget {
  const BrandLogoRing({super.key, required this.size, this.cacheWidth = 240});
  final double size;
  final int cacheWidth;

  @override
  Widget build(BuildContext context) => Container(
    width: size,
    height: size,
    decoration: BoxDecoration(
      shape: BoxShape.circle,
      // The logo artwork's own warm white, so no square edge shows.
      color: const Color(0xFFFEFBF8),
      border: Border.all(color: brandPink, width: size > 120 ? 5 : 4),
      boxShadow: [
        BoxShadow(
          color: brandPink.withValues(alpha: .22),
          blurRadius: 26,
          offset: const Offset(0, 10),
        ),
      ],
    ),
    child: ClipOval(
      child: Center(
        child: Image.asset(
          launchLogo,
          width: size * .97,
          height: size * .97,
          fit: BoxFit.contain,
          cacheWidth: cacheWidth,
          semanticLabel: 'Imaan Akhlaq Learning Hub',
        ),
      ),
    ),
  );
}

/// A soft, lightly tinted door into one section of the app: colour lives in
/// the icon tile and arrow, the card itself stays calm.
class _ChoiceCard extends StatelessWidget {
  const _ChoiceCard({
    super.key,
    required this.title,
    required this.tag,
    required this.subtitle,
    required this.icon,
    required this.gradient,
    required this.accent,
    required this.onTap,
  });

  final String title, tag, subtitle;
  final IconData icon;
  final List<Color> gradient;
  final Color accent;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final showTag = MediaQuery.textScalerOf(context).scale(14) <= 17;
    final tint = Color.lerp(Colors.white, accent, .07)!;
    return Semantics(
      button: true,
      label: '$title. $subtitle',
      excludeSemantics: true,
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(22),
          boxShadow: [
            BoxShadow(
              color: accent.withValues(alpha: .10),
              blurRadius: 18,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Material(
          borderRadius: BorderRadius.circular(22),
          clipBehavior: Clip.antiAlias,
          child: Ink(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.white, tint],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              border: Border.all(color: accent.withValues(alpha: .16)),
              borderRadius: BorderRadius.circular(22),
            ),
            child: InkWell(
              onTap: onTap,
              splashColor: accent.withValues(alpha: .08),
              highlightColor: accent.withValues(alpha: .04),
              child: Stack(
                children: [
                  // One quiet bubble in the corner.
                  Positioned(
                    right: -28,
                    top: -34,
                    child: Container(
                      width: 96,
                      height: 96,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: accent.withValues(alpha: .05),
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 14, 16),
                    child: Row(
                      children: [
                        Container(
                          width: 58,
                          height: 58,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(18),
                            gradient: LinearGradient(
                              colors: gradient,
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: accent.withValues(alpha: .22),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Icon(icon, color: Colors.white, size: 30),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (showTag) ...[
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: accent.withValues(alpha: .08),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    tag,
                                    style: TextStyle(
                                      color: accent,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      letterSpacing: .2,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 4),
                              ],
                              Text(
                                title,
                                style: TextStyle(
                                  color: accent,
                                  fontSize: 19,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                subtitle,
                                style: const TextStyle(
                                  color: Color(0xFF6B7488),
                                  fontSize: 13.5,
                                  height: 1.35,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          width: 34,
                          height: 34,
                          decoration: BoxDecoration(
                            color: accent.withValues(alpha: .10),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.arrow_forward_rounded,
                            color: accent,
                            size: 20,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
