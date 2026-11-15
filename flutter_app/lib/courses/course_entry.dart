import 'package:flutter/widgets.dart';

/// A learning journey that is ready to open in the app.
///
/// Each course lives in its own folder under `lib/courses/<course>/` and
/// exposes one top-level `CourseEntry?` (null while it is still being
/// prepared). Its data goes in `assets/data/courses/<course>-*.json`, which
/// pubspec already bundles, so adding a course never touches shared files.
class CourseEntry {
  const CourseEntry({required this.subtitle, required this.open});

  /// Short status for the Learn list, e.g. "30 missions • Ready to explore".
  final String subtitle;

  /// Builds the course's first screen. [scope] separates saved progress per
  /// learner ("guest" for visitors, otherwise the learner's own scope).
  final Widget Function(String scope) open;
}
