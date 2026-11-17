import 'dart:ui' show PointerDeviceKind;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import 'app_theme.dart';

/// Lets every list, page and carousel scroll by dragging with a mouse,
/// trackpad or pen, as well as by touch and the mouse wheel.
class DragEverywhereScrollBehavior extends MaterialScrollBehavior {
  const DragEverywhereScrollBehavior();
  @override
  Set<PointerDeviceKind> get dragDevices => const {
    PointerDeviceKind.touch,
    PointerDeviceKind.mouse,
    PointerDeviceKind.trackpad,
    PointerDeviceKind.stylus,
    PointerDeviceKind.invertedStylus,
    PointerDeviceKind.unknown,
  };
}

/// On a wide web window the app opens in a phone-sized frame in the middle,
/// over a soft colourful backdrop, so it looks and feels like the mobile
/// app. Phones, and the Android app itself, stay full screen.
class PhoneFrame extends StatelessWidget {
  const PhoneFrame({super.key, required this.child, this.enabled = kIsWeb});
  final Widget child;
  final bool enabled;

  static const phoneWidth = 420.0;
  static const maxPhoneHeight = 920.0;

  @override
  Widget build(BuildContext context) {
    final media = MediaQuery.of(context);
    final size = media.size;
    if (!enabled || size.width < phoneWidth + 120) return child;
    final height = (size.height - 32).clamp(560.0, maxPhoneHeight);
    final inner = media.copyWith(
      size: Size(phoneWidth, height),
      padding: EdgeInsets.zero,
      viewPadding: EdgeInsets.zero,
      viewInsets: EdgeInsets.zero,
    );
    return ColoredBox(
      color: const Color(0xFFFBF5F2),
      child: Stack(
        children: [
          const Positioned.fill(child: _Backdrop()),
          Center(
            child: Container(
              key: const Key('phone-frame'),
              width: phoneWidth,
              height: height,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(30),
                border: Border.all(color: Colors.white, width: 6),
                boxShadow: [
                  BoxShadow(
                    color: brandNavy.withValues(alpha: .18),
                    blurRadius: 50,
                    offset: const Offset(0, 22),
                  ),
                ],
              ),
              clipBehavior: Clip.antiAlias,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: MediaQuery(data: inner, child: child),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Soft colour on both sides of the phone: gentle blobs, stars and moons.
class _Backdrop extends StatelessWidget {
  const _Backdrop();
  @override
  Widget build(BuildContext context) {
    Widget blob(double size, Color color) => Container(
      width: size,
      height: size,
      decoration: BoxDecoration(shape: BoxShape.circle, color: color),
    );
    Widget icon(IconData data, double size, Color color) =>
        Icon(data, size: size, color: color);
    return IgnorePointer(
      child: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFFFDF1EC), Color(0xFFF7EEFA), Color(0xFFEEF3FB)],
          ),
        ),
        child: Stack(
          children: [
            Positioned(
              left: -80,
              top: -60,
              child: blob(320, const Color(0xFFFBE1EA)),
            ),
            Positioned(
              left: 60,
              bottom: -120,
              child: blob(300, const Color(0xFFFFEBD2)),
            ),
            Positioned(
              right: -90,
              top: 80,
              child: blob(340, const Color(0xFFE6E8FA)),
            ),
            Positioned(
              right: 80,
              bottom: -100,
              child: blob(260, const Color(0xFFDDF2E8)),
            ),
            Positioned(
              left: 90,
              top: 140,
              child: icon(Icons.auto_awesome, 30, const Color(0xFFF0B9CB)),
            ),
            Positioned(
              left: 180,
              bottom: 170,
              child: icon(Icons.star_rounded, 26, const Color(0xFFF7CF8F)),
            ),
            Positioned(
              right: 140,
              top: 60,
              child: Transform.rotate(
                angle: -.5,
                child: icon(
                  Icons.nightlight_round,
                  34,
                  const Color(0xFFC9C3EE),
                ),
              ),
            ),
            Positioned(
              right: 200,
              bottom: 220,
              child: icon(Icons.auto_awesome, 24, const Color(0xFFA9D8C2)),
            ),
          ],
        ),
      ),
    );
  }
}
