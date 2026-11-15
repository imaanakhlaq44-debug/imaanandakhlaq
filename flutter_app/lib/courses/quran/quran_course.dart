import '../course_entry.dart';
import 'quran_screens.dart';

/// My Qur'an Companion (Hifz and recitation). Course index 0 in `courses`
/// (lib/data/catalog.dart). Only this folder, its tests and
/// assets/data/courses/quran-*.json belong to this course; see README.md.
final CourseEntry quranCourse = CourseEntry(
  subtitle: '2 paths • 30 Juz • Text & audio pending review',
  open: (scope) => QuranCompanionScreen(scope: scope),
);
