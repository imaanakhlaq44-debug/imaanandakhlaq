import 'dart:convert';

enum AccountRole {
  family,
  student,
  individual,
  teacher,
  schoolAdmin,
  superAdmin,
  unknown,
}

class Profile {
  const Profile({
    required this.uid,
    required this.name,
    required this.role,
    this.schoolId = '',
    this.familyUid = '',
    this.className = '',
    this.schoolName = '',
    this.completed = const [],
    this.approved = const [],
    this.individualSpace = false,
  });
  final String uid, name, schoolId, familyUid, className, schoolName;
  final AccountRole role;
  final List<String> completed, approved;

  /// True for the separate Individual space of a school login: same login
  /// (uid), its own profile in individual_spaces/{uid} and its own work.
  final bool individualSpace;

  /// The id its work is saved under. An Individual space never shares ids
  /// with the school record of the same login.
  String get learnerId => individualSpace ? individualSpaceId(uid) : uid;

  /// The Individual space of [uid], from its individual_spaces document.
  factory Profile.space(String uid, Map<String, dynamic> data) => Profile(
    uid: uid,
    name: data['name'] is String && (data['name'] as String).trim().isNotEmpty
        ? (data['name'] as String).trim()
        : 'Learner',
    role: AccountRole.individual,
    individualSpace: true,
  );
  bool get isLearner =>
      role == AccountRole.student || role == AccountRole.individual;
  bool get isStaff => [
    AccountRole.teacher,
    AccountRole.schoolAdmin,
    AccountRole.superAdmin,
  ].contains(role);
  factory Profile.fromMap(String uid, Map<String, dynamic> data) {
    final game = data['game_state'] is Map
        ? data['game_state'] as Map
        : const {};
    List<String> strings(dynamic value) =>
        value is List ? value.whereType<String>().toList() : [];
    return Profile(
      uid: uid,
      name: data['name'] is String ? data['name'] as String : 'Learner',
      role: switch (data['role']) {
        'family' => AccountRole.family,
        'student' => AccountRole.student,
        'individual' => AccountRole.individual,
        'teacher' => AccountRole.teacher,
        'school_admin' => AccountRole.schoolAdmin,
        'super_admin' => AccountRole.superAdmin,
        _ => AccountRole.unknown,
      },
      schoolId: data['school_id'] is String ? data['school_id'] as String : '',
      familyUid: data['family_uid'] is String
          ? data['family_uid'] as String
          : '',
      // Schools store the class as class_id ("3"); older profiles may carry
      // a ready label in class_name.
      className: data['class_name'] is String &&
              (data['class_name'] as String).trim().isNotEmpty
          ? (data['class_name'] as String).trim()
          : (data['class_id'] is String &&
                    (data['class_id'] as String).trim().isNotEmpty
                ? 'Class ${(data['class_id'] as String).trim()}'
                : ''),
      schoolName: data['school_name'] is String
          ? data['school_name'] as String
          : '',
      completed: strings(game['completed']),
      approved: strings(game['teacher_approved']),
    );
  }
}

/// Learner id of the Individual space kept by the school login [uid].
String individualSpaceId(String uid) => 'ind_$uid';

String loginEmail(String input) {
  final value = input.trim();
  if (RegExp(r'^PAR-[A-Z0-9]{4,8}$', caseSensitive: false).hasMatch(value)) {
    return '${value.toLowerCase()}@family.imaanakhlaq.invalid';
  }
  if (RegExp(r'^TCH-[A-Z0-9]{4,8}$', caseSensitive: false).hasMatch(value)) {
    return '${value.toLowerCase()}@teacher.imaanakhlaq.invalid';
  }
  if (RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(value)) return value;
  throw const FormatException(
    'Enter your email or school username (PAR- / TCH-).',
  );
}

bool ownsLearner(Profile account, Profile learner) =>
    account.role == AccountRole.family
    ? learner.role == AccountRole.student && learner.familyUid == account.uid
    : account.isLearner && learner.uid == account.uid;

class Book {
  const Book({
    required this.id,
    required this.title,
    required this.pdfUrl,
    required this.chapters,
  });
  final String id, title, pdfUrl;
  final List<Chapter> chapters;
  static List<Book> decode(String source) {
    final data = jsonDecode(source) as Map<String, dynamic>;
    return data.entries.map((entry) {
      final value = entry.value as Map<String, dynamic>;
      final chapters = value['chapters'] as Map<String, dynamic>;
      return Book(
        id: entry.key,
        title: value['title'] as String,
        pdfUrl: value['pdfUrl'] as String,
        chapters: chapters.entries
            .map((c) => Chapter.fromMap(c.key, c.value as Map<String, dynamic>))
            .toList(),
      );
    }).toList();
  }
}

class Chapter {
  const Chapter({
    required this.key,
    required this.id,
    required this.title,
    required this.question,
    required this.pageStart,
    required this.pageEnd,
    required this.sections,
  });
  final String key, id, title, question;
  final int pageStart, pageEnd;
  final List<ActivitySection> sections;
  int get rowCount => sections.fold(0, (sum, s) => sum + s.questions.length);
  factory Chapter.fromMap(String key, Map<String, dynamic> data) => Chapter(
    key: key,
    id: data['id'] as String,
    title: data['title'] as String,
    question: data['discussionQuestion'] as String? ?? '',
    pageStart: data['pageStart'] as int? ?? 1,
    pageEnd: data['pageEnd'] as int? ?? 1,
    sections: (data['sections'] as List? ?? [])
        .map(
          (s) => ActivitySection(
            s['heading'] as String,
            List<String>.from(s['questions'] as List),
          ),
        )
        .toList(),
  );
}

class ActivitySection {
  const ActivitySection(this.title, this.questions);
  final String title;
  final List<String> questions;
}

bool editableDay(Profile learner, int day, DateTime now) =>
    learner.role == AccountRole.individual || day == now.weekday - 1;

Map<String, dynamic> activityPayload({
  required Profile account,
  required Profile learner,
  required Book book,
  required Chapter chapter,
  required String answer,
  required List<int> cells,
  required DateTime now,
}) {
  if (!ownsLearner(account, learner)) {
    throw StateError('This learner does not belong to this account.');
  }
  if (cells.length != chapter.rowCount * 7 ||
      cells.any((c) => c < 0 || c > 2)) {
    throw const FormatException('Invalid activity grid.');
  }
  return {
    'student_uid': learner.uid,
    if (account.role == AccountRole.family) 'family_uid': account.uid,
    'student_name': learner.name,
    'school_id': learner.schoolId,
    'chapter_id': chapter.id,
    'chapter_title': chapter.title,
    'book_id': book.id,
    'discussionText': answer.trim(),
    'gridState': {
      'yes': cells.where((c) => c == 1).length,
      'no': cells.where((c) => c == 2).length,
      'total': cells.length,
      'cells': cells,
    },
    'updatedAt': now.toUtc().toIso8601String(),
  };
}
