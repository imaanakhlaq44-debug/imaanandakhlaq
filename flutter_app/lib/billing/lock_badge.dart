import 'package:flutter/material.dart';

import '../app_theme.dart';
import 'entitlement.dart';

/// Marks a lesson row that needs the Individual subscription: the row's
/// trailing arrow is replaced by a padlock chip, in the same place, so the
/// list stays tidy. Free lessons and subscribers see the row unchanged.
class LockCorner extends StatelessWidget {
  const LockCorner({super.key, required this.free, required this.child});
  final bool free;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    if (free) return child;
    final e = Entitlement.instance;
    e.start();
    return ListenableBuilder(
      listenable: e,
      child: child,
      builder: (context, child) => e.active || !e.ready
          ? child!
          : Stack(
              children: [
                child!,
                // Sits over the row's own chevron, vertically centred.
                const PositionedDirectional(
                  end: 8,
                  top: 0,
                  bottom: 0,
                  child: IgnorePointer(child: Center(child: LockBadge())),
                ),
              ],
            ),
    );
  }
}

/// A calm padlock chip: white disc, thin gold ring, navy lock.
class LockBadge extends StatelessWidget {
  const LockBadge({super.key, this.size = 34});
  final double size;
  @override
  Widget build(BuildContext context) => Semantics(
    label: 'Locked',
    child: Container(
      key: const Key('lesson-lock'),
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: const Color(0xFFFFF7E6),
        border: Border.all(color: const Color(0xFFE5B65A), width: 1.4),
        boxShadow: const [
          // A white halo hides the arrow underneath cleanly.
          BoxShadow(color: Colors.white, spreadRadius: 4),
        ],
      ),
      child: Icon(Icons.lock_rounded, size: size * .5, color: brandNavy),
    ),
  );
}
