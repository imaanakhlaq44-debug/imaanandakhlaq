import '../course_entry.dart';
import 'salah_screens.dart';

/// My Salah Journey (30 missions). Course index 3 in `courses` (lib/data/catalog.dart).
///
/// Only this folder, its tests and assets/data/courses/salah-*.json belong
/// to this course. Sources and known gaps: README.md in this folder.
final CourseEntry salahCourse = CourseEntry(
  subtitle: '30 missions • Ready to explore',
  open: (scope) => SalahCourseScreen(scope: scope),
);
