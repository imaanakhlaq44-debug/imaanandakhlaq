import 'package:flutter/widgets.dart';

import '../course_entry.dart';
import 'duas_screens.dart';

/// Zad al-Qulub Junior (100 Duas and Adhkar). Course index 2 in `courses`
/// (lib/data/catalog.dart). Only this folder, its tests and
/// assets/data/courses/duas-*.json belong to this course.
const CourseEntry duasCourse = CourseEntry(
  subtitle: '100 duas • 10 volumes • Ready to explore',
  open: _open,
);

Widget _open(String scope) => DuasCourseScreen(scope: scope);
