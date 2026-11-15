import 'package:flutter/widgets.dart';

import '../course_entry.dart';
import 'tafsir_screens.dart';

/// Tafsir Through Stories. Course index 4 in `courses` (lib/data/catalog.dart).
///
/// Worlds 1–7 come from the seven story volumes in the email curriculum
/// (assets/data/courses/tafsir-world-0N.json). World 8, Self-Improvement, has
/// no source volume yet and shows as "Coming soon". Only this folder, its
/// tests and assets/data/courses/tafsir-*.json belong to this course.
const CourseEntry tafsirCourse = CourseEntry(
  subtitle: '107 missions • 7 worlds to explore',
  open: _open,
);

Widget _open(String scope) => TafsirCourseScreen(scope: scope);
