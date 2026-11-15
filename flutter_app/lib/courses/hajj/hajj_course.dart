import '../course_entry.dart';
import 'hajj_home.dart';

/// Journey to the Holy Cities (Hajj and Umrah). Course index 6 in `courses`
/// (lib/data/catalog.dart). Only this folder, its tests and
/// assets/data/courses/hajj-*.json belong to this course; see README.md.
final CourseEntry hajjCourse = CourseEntry(
  subtitle: '72 missions • Ready to explore',
  open: (scope) => HajjCourseScreen(scope: scope),
);
