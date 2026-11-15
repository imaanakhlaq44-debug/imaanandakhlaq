import 'package:flutter/widgets.dart';
import '../course_entry.dart';
import 'taleem_screens.dart';

/// Rihlat al-Huda Junior / Taleem-ul-Islam (4 age editions). Course index 7 in `courses` (lib/data/catalog.dart).
///
/// Only this folder, its tests and assets/data/courses/taleem-*.json belong
/// to this course. Sources and gaps: README.md in this folder.
const CourseEntry taleemCourse = CourseEntry(
  subtitle: '4 age editions • 101 lessons • Ready to explore',
  open: _open,
);

Widget _open(String scope) => TaleemHomeScreen(scope: scope);
