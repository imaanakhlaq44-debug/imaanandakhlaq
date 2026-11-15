import 'course_entry.dart';
import 'duas/duas_course.dart';
import 'hajj/hajj_course.dart';
import 'ibrah/ibrah_course.dart';
import 'quran/quran_course.dart';
import 'salah/salah_course.dart';
import 'tafsir/tafsir_course.dart';
import 'taleem/taleem_course.dart';

export 'course_entry.dart';

/// The ready course for [index] in `courses` (lib/data/catalog.dart), or
/// null while it is still in preparation. Hadith (index 1) keeps its own
/// screen, HadithCourseScreen.
///
/// Do not edit this switch to add a course: set the course's own entry in
/// `lib/courses/<course>/<course>_course.dart` instead.
CourseEntry? courseEntry(int index) => switch (index) {
  0 => quranCourse,
  2 => duasCourse,
  3 => salahCourse,
  4 => tafsirCourse,
  5 => ibrahCourse,
  6 => hajjCourse,
  7 => taleemCourse,
  _ => null,
};
