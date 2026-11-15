import '../course_entry.dart';
import 'ibrah_screens.dart';

/// IBRAH Junior, stories of the Prophets (24 volumes). Course index 5 in `courses` (lib/data/catalog.dart).
///
/// Only this folder, its tests and assets/data/courses/ibrah-*.json belong to
/// this course. Volumes done/left and sources: lib/courses/ibrah/README.md.
final CourseEntry ibrahCourse = CourseEntry(
  subtitle: '24 Prophets • Stories & missions',
  open: (scope) => IbrahCourseScreen(scope: scope),
);
