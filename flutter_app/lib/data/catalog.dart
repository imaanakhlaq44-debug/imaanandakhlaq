import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';
import '../domain.dart';

class Catalog {
  static Future<List<Book>>? _books;
  static List<Book>? _loaded;
  // Parse the bundled catalogue once. PDFs are fetched only when a reader is
  // opened, never on login or while scrolling the dashboard.
  Future<List<Book>> books() {
    if (_loaded != null) {
      return SynchronousFuture(_loaded!);
    }
    return _books ??= rootBundle.loadString('assets/data/activities.json').then(
      (text) {
        final result = Book.decode(text);
        _loaded = result;
        return result;
      },
    );
  }
}

class CourseInfo {
  const CourseInfo(this.title, this.subtitle, this.scope);
  final String title, subtitle, scope;
}

const courses = [
  CourseInfo(
    'My Qur’an Companion',
    'Listen, learn and remember',
    'Hifz, recitation and a personal revision journey.',
  ),
  CourseInfo(
    'Hadith to Live By',
    'Small actions, beautiful character',
    '100 Hadith lessons with practical everyday actions.',
  ),
  CourseInfo(
    'Zad al-Qulub Junior',
    'Duas for everyday moments',
    '100 duas and adhkar across 10 learning volumes.',
  ),
  CourseInfo(
    'My Salah Journey',
    'Learn with care and confidence',
    '30 guided missions, preparation and recitation practice.',
  ),
  CourseInfo(
    'Tafsir Through Stories',
    'Discover Qur’anic guidance',
    'Story-led learning, thoughtful choices and reflection.',
  ),
  CourseInfo(
    'IBRAH Junior',
    'Lessons from the Prophets',
    '24 volumes of source-based stories and character missions.',
  ),
  CourseInfo(
    'Journey to the Holy Cities',
    'Discover Hajj and Umrah',
    '72 learning missions with family guidance.',
  ),
  CourseInfo(
    'Rihlat al-Huda Junior',
    'Growing in understanding',
    'Age-based learning journeys for ages 6–14.',
  ),
];
