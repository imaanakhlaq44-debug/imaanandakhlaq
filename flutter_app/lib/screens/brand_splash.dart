import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../app_theme.dart';

/// The animated splash carried over from the original Capacitor app
/// (`scripts/apk-splash.cjs` + `#preloader` in `kidba_assets/css/style.css`):
/// floating brand shapes, a bouncing ringed logo, a letter-by-letter
/// multi-colour wordmark, a gradient progress bar and the bottom tagline.
///
/// Everything is driven by one finite controller so the splash always ends
/// (tests can `pumpAndSettle`) and calls [onDone] once.
class BrandSplash extends StatefulWidget {
  const BrandSplash({super.key, required this.logo, required this.onDone});

  final String logo;
  final VoidCallback onDone;

  static const duration = Duration(milliseconds: 2000);

  @override
  State<BrandSplash> createState() => _BrandSplashState();
}

const _cream = Color(0xFFFDF8F5);
const _tan = Color(0xFFC99A6B);

class _Shape {
  const _Shape(
    this.size,
    this.color, {
    this.top,
    this.left,
    this.right,
    this.bottom,
    required this.period,
    this.delay = 0,
    this.square = false,
    this.turn = 0,
  });
  final double size;
  final Color color;
  // Values between -1 and 1 are fractions of the screen; others are pixels.
  final double? top, left, right, bottom;
  final double period, delay, turn;
  final bool square;
}

const _shapes = [
  _Shape(180, brandPink, top: -40, left: -30, period: 8),
  _Shape(120, brandOrange, top: .15, right: -20, period: 10, delay: 1),
  _Shape(90, brandNavy, bottom: .20, left: .05, period: 7, delay: 2),
  _Shape(140, _tan, bottom: -30, right: .10, period: 9, delay: .5),
  _Shape(
    60,
    brandPink,
    top: .40,
    right: .15,
    period: 6,
    delay: 3,
    square: true,
    turn: 45,
  ),
  _Shape(50, brandOrange, top: .60, left: .12, period: 8, delay: 1.5),
  _Shape(30, brandPink, top: .10, left: .35, period: 5, delay: 2.5),
  _Shape(
    45,
    _tan,
    bottom: .15,
    left: .40,
    period: 7,
    delay: 4,
    square: true,
    turn: 30,
  ),
];

const _letters = [
  ('I', brandPink, .05),
  ('m', brandOrange, .10),
  ('a', brandNavy, .15),
  ('a', _tan, .20),
  ('n', brandPink, .25),
  ('&', brandOrange, .30),
  ('A', brandNavy, .35),
  ('k', brandPink, .40),
  ('h', brandOrange, .45),
  ('l', _tan, .50),
  ('a', brandNavy, .55),
  ('q', brandPink, .60),
];

class _BrandSplashState extends State<BrandSplash>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: BrandSplash.duration,
  );

  @override
  void initState() {
    super.initState();
    _c.addStatusListener((s) {
      if (s == AnimationStatus.completed) widget.onDone();
    });
    _c.forward();
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  double get _seconds => _c.value * BrandSplash.duration.inMilliseconds / 1000;

  /// CSS `splashFloat`: 0 → -15px (33%) → 8px (66%) → 0, with scale/rotate.
  static (double, double, double) _float(double phase) {
    double seg(double a, double b, double t) =>
        a + (b - a) * Curves.easeInOut.transform(t);
    if (phase < 1 / 3) {
      final t = phase * 3;
      return (seg(0, -15, t), seg(1, 1.05, t), seg(0, 5, t));
    } else if (phase < 2 / 3) {
      final t = (phase - 1 / 3) * 3;
      return (seg(-15, 8, t), seg(1.05, .95, t), seg(5, -3, t));
    }
    final t = (phase - 2 / 3) * 3;
    return (seg(8, 0, t), seg(.95, 1, t), seg(-3, 0, t));
  }

  /// CSS `swPop`: scale 0 → 1.15 → 1, rising from 20px, over .5s.
  static (double, double, double) _pop(double t) {
    if (t <= 0) return (0, 20, 0);
    if (t >= 1) return (1, 0, 1);
    if (t < .6) {
      final k = Curves.easeOut.transform(t / .6);
      return (1.15 * k, 20 - 24 * k, k);
    }
    final k = Curves.easeInOut.transform((t - .6) / .4);
    return (1.15 - .15 * k, -4 + 4 * k, 1);
  }

  Widget _shape(_Shape s, Size size) {
    double? resolve(double? v, double extent) =>
        v == null ? null : (v.abs() < 1 ? v * extent : v);
    final phase = ((_seconds + s.delay) % s.period) / s.period;
    final (dy, scale, rot) = _float(phase);
    return Positioned(
      top: resolve(s.top, size.height),
      left: resolve(s.left, size.width),
      right: resolve(s.right, size.width),
      bottom: resolve(s.bottom, size.height),
      child: Transform.translate(
        offset: Offset(0, dy),
        child: Transform.rotate(
          angle: (s.turn + rot) * math.pi / 180,
          child: Transform.scale(
            scale: scale,
            child: Container(
              width: s.size,
              height: s.size,
              decoration: BoxDecoration(
                color: s.color.withValues(alpha: .14),
                borderRadius: s.square ? BorderRadius.circular(12) : null,
                shape: s.square ? BoxShape.rectangle : BoxShape.circle,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _logo(double diameter, bool still) {
    // splashLogoBounce: 0 → -10px → 0 every 2.5s.
    final bounce = still
        ? 0.0
        : -10 * math.sin(math.pi * ((_seconds % 2.5) / 2.5));
    return Transform.translate(
      offset: Offset(0, bounce),
      child: Container(
        width: diameter,
        height: diameter,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: const Color(0xFFFEFBF8),
          border: Border.all(color: brandPink, width: 6),
          boxShadow: [
            BoxShadow(
              color: brandPink.withValues(alpha: .25),
              blurRadius: 30,
              offset: const Offset(0, 12),
            ),
          ],
        ),
        alignment: Alignment.center,
        // Clipped to the ring like the CSS `overflow: hidden`, so the logo's
        // square white corners never cross the pink border.
        child: ClipOval(
          child: SizedBox.expand(
            child: Center(
              child: Image.asset(
                widget.logo,
                width: diameter * .97,
                height: diameter * .97,
                fit: BoxFit.contain,
                cacheWidth: 480,
                semanticLabel: 'Imaan Akhlaq Learning Hub',
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _wordmark(double fontSize, bool still) => Semantics(
    label: 'Imaan Akhlaq Learning Hub',
    excludeSemantics: true,
    child: Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.baseline,
      textBaseline: TextBaseline.alphabetic,
      children: [
        for (final (ch, color, delay) in _letters)
          _letter(ch, color, delay, fontSize, still),
      ],
    ),
  );

  Widget _letter(
    String ch,
    Color color,
    double delay,
    double size,
    bool still,
  ) {
    final (scale, dy, opacity) = still
        ? (1.0, 0.0, 1.0)
        : _pop((_seconds - delay) / .5);
    final amp = ch == '&';
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: amp ? 8 : .5),
      child: Opacity(
        opacity: opacity,
        child: Transform.translate(
          offset: Offset(0, dy),
          child: Transform.scale(
            scale: scale,
            child: Text(
              ch,
              style: TextStyle(
                color: color,
                fontFamily: 'Fredoka',
                fontVariations: const [FontVariation('wght', 600)],
                fontSize: amp ? size * .7 : size,
                fontWeight: FontWeight.w600,
                letterSpacing: 2,
                height: 1,
                shadows: const [
                  Shadow(
                    color: Color(0x0F000000),
                    blurRadius: 8,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  /// "LEARNING HUB" under the wordmark, between two short rules; it fades in
  /// once the letters have landed.
  Widget _hubTag(double size, bool still) {
    final t = still ? 1.0 : ((_seconds - 1.05) / .45).clamp(0.0, 1.0);
    final ease = Curves.easeOutCubic.transform(t);
    Widget rule(List<Color> colors) => Container(
      width: size * 1.6,
      height: 2,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(2),
        gradient: LinearGradient(colors: colors),
      ),
    );
    return Opacity(
      opacity: ease,
      child: Transform.translate(
        offset: Offset(0, 8 * (1 - ease)),
        child: Row(
          key: const Key('brand-learning-hub'),
          mainAxisSize: MainAxisSize.min,
          children: [
            rule([brandPink.withValues(alpha: 0), brandPink]),
            const SizedBox(width: 10),
            Text(
              'LEARNING HUB',
              style: TextStyle(
                color: brandNavy,
                fontFamily: 'Fredoka',
                fontVariations: const [FontVariation('wght', 600)],
                fontWeight: FontWeight.w600,
                fontSize: size,
                letterSpacing: size * .28,
                height: 1,
              ),
            ),
            const SizedBox(width: 10),
            rule([brandOrange, brandOrange.withValues(alpha: 0)]),
          ],
        ),
      ),
    );
  }

  Widget _progress(double width) {
    // splashProgress over 1.3s.
    final t = (_seconds / 1.3).clamp(0.0, 1.0);
    return Container(
      width: width,
      height: 5,
      decoration: BoxDecoration(
        color: brandPink.withValues(alpha: .12),
        borderRadius: BorderRadius.circular(4),
      ),
      alignment: Alignment.centerLeft,
      child: FractionallySizedBox(
        widthFactor: Curves.easeInOut.transform(t),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(4),
            gradient: const LinearGradient(colors: [brandPink, brandOrange]),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final still = MediaQuery.of(context).disableAnimations;
    return Scaffold(
      key: const Key('brand-splash'),
      backgroundColor: _cream,
      body: LayoutBuilder(
        builder: (context, box) {
          final size = box.biggest;
          final compact = size.width < 576;
          return AnimatedBuilder(
            animation: _c,
            builder: (context, _) => Stack(
              clipBehavior: Clip.hardEdge,
              children: [
                for (final s in _shapes) _shape(s, size),
                SafeArea(
                  child: Center(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          _logo(180, still),
                          const SizedBox(height: 24),
                          FittedBox(
                            fit: BoxFit.scaleDown,
                            child: _wordmark(compact ? 32 : 42, still),
                          ),
                          const SizedBox(height: 10),
                          FittedBox(
                            fit: BoxFit.scaleDown,

                            child: _hubTag(compact ? 15 : 18, still),
                          ),
                          const SizedBox(height: 22),
                          _progress(compact ? 180 : 240),
                          const SizedBox(height: 14),
                          Text(
                            'Loading joyful learning'
                            '${'.' * ((_seconds / .35).floor() % 4)}',
                            style: const TextStyle(
                              color: Color(0xFF8B7E74),
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              letterSpacing: .3,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                Positioned(
                  left: 16,
                  right: 16,
                  bottom: 32 + MediaQuery.paddingOf(context).bottom,
                  child: const Text(
                    'ISLAMIC STORIES & EDUCATION FOR KIDS',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Color(0xFFB5A99A),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 1.5,
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
