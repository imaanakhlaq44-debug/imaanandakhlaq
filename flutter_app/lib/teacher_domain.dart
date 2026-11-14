import 'domain.dart';

/// Points a school learner earns when a teacher approves one chapter sheet.
/// Same figure the web teacher dashboard awards.
const reviewPoints = 50;

/// A learner on a teacher's school roster.
class RosterStudent {
  const RosterStudent({
    required this.uid,
    required this.name,
    this.classId = '',
    this.points = 0,
    this.completed = 0,
    this.approved = const [],
  });
  final String uid, name, classId;
  final int points, completed;
  final List<String> approved;

  /// Mirrors `normalizeGameState` in the web TeacherDashboard.
  factory RosterStudent.fromMap(String uid, Map<String, dynamic> data) {
    final game = data['game_state'] is Map
        ? data['game_state'] as Map
        : const {};
    List<String> strings(dynamic v) =>
        v is List ? v.whereType<String>().toList() : const [];
    final raw = data['class_id'] ?? data['classId'] ?? data['class_name'];
    final points = game['points'] is num
        ? (game['points'] as num).round()
        : game['totalPoints'] is num
        ? (game['totalPoints'] as num).round()
        : 50;
    return RosterStudent(
      uid: uid,
      name: data['name'] is String && (data['name'] as String).trim() != ''
          ? (data['name'] as String).trim()
          : 'Student',
      classId: raw is String ? raw.trim() : (raw is num ? '$raw' : ''),
      points: points,
      completed: strings(game['completed']).length,
      approved: strings(game['teacher_approved']),
    );
  }

  String get classLabel => classId.isEmpty ? 'No class' : 'Class $classId';
}

/// One submitted chapter sheet waiting for the teacher.
class ReviewItem {
  const ReviewItem({
    required this.submissionId,
    required this.student,
    required this.chapterId,
    required this.answer,
    required this.cells,
    required this.parentNotes,
    required this.teacherNotes,
    required this.reviewStatus,
    required this.updatedAt,
    this.wasSentBack = false,
  });
  final String submissionId, chapterId, answer, teacherNotes, reviewStatus;
  final RosterStudent student;
  final List<int> cells;
  final List<String> parentNotes;
  final String updatedAt;

  /// Redone after a teacher sent it back; [teacherNotes] is that note.
  final bool wasSentBack;
}

String _timestamp(Map<String, dynamic> s) {
  for (final key in ['updatedAt', 'submittedAt', 'activityCompletedAt']) {
    final v = s[key];
    if (v is String && v.isNotEmpty) return v;
  }
  return '';
}

bool _submitted(Map<String, dynamic> s) =>
    s['submittedAt'] != null ||
    s['activityCompletedAt'] != null ||
    (s['discussionText'] is String &&
        (s['discussionText'] as String).trim().isNotEmpty) ||
    s['gridState'] != null;

/// The teacher's queue: the newest sheet per student and chapter that the
/// student has submitted and no teacher has approved yet. Follows
/// `buildPendingReviewQueue` in the web dashboard, with one change: a sheet a
/// teacher sent back stays out of the queue until the student submits again.
List<ReviewItem> buildReviewQueue(
  List<RosterStudent> students,
  List<(String, Map<String, dynamic>)> submissions,
) {
  final byUid = {for (final s in students) s.uid: s};
  final newest = <String, (String, Map<String, dynamic>)>{};
  for (final entry in submissions) {
    final data = entry.$2;
    final uid = data['student_uid'], chapter = data['chapter_id'];
    if (uid is! String || chapter is! String || !byUid.containsKey(uid)) {
      continue;
    }
    final key = '$uid::$chapter';
    final existing = newest[key];
    if (existing == null ||
        _timestamp(data).compareTo(_timestamp(existing.$2)) >= 0) {
      newest[key] = entry;
    }
  }
  final queue = <ReviewItem>[];
  for (final (id, data) in newest.values) {
    final student = byUid[data['student_uid']]!;
    final chapter = data['chapter_id'] as String;
    final approved =
        student.approved.contains(chapter) ||
        data['reviewStatus'] == 'teacher_approved' ||
        data['teacherApprovedAt'] != null;
    // A sheet sent back stays 'needs_redo' until the learner submits again,
    // which turns it back into 'pending_teacher'.
    if (approved || !_submitted(data) || data['reviewStatus'] == 'needs_redo') {
      continue;
    }
    final grid = data['gridState'] is Map ? data['gridState'] as Map : const {};
    queue.add(
      ReviewItem(
        submissionId: id,
        student: student,
        chapterId: chapter,
        answer: data['discussionText'] is String
            ? (data['discussionText'] as String).trim()
            : '',
        cells: grid['cells'] is List
            ? (grid['cells'] as List).whereType<num>().map((n) => n.toInt()).toList()
            : const [],
        parentNotes: data['parentNotes'] is List
            ? (data['parentNotes'] as List)
                  .whereType<String>()
                  .map((n) => n.trim())
                  .where((n) => n.isNotEmpty)
                  .toList()
            : const [],
        teacherNotes: data['teacherNotes'] is String
            ? data['teacherNotes'] as String
            : '',
        reviewStatus: data['reviewStatus'] is String
            ? data['reviewStatus'] as String
            : '',
        updatedAt: _timestamp(data),
        wasSentBack: data['teacherReviewedAt'] != null,
      ),
    );
  }
  // Oldest first: the student who has waited longest is seen first.
  queue.sort((a, b) => a.updatedAt.compareTo(b.updatedAt));
  return queue;
}

/// `game_state` after approving [chapterId]: added to teacher_approved and
/// [reviewPoints] awarded once. Every other key is kept as it was.
Map<String, dynamic> approvedGameState(Object? raw, String chapterId) {
  final state = Map<String, dynamic>.from(raw is Map ? raw : const {});
  final approved = List<String>.from(
    (state['teacher_approved'] is List ? state['teacher_approved'] as List : [])
        .whereType<String>(),
  );
  for (final key in ['completed', 'parent_approved']) {
    if (state[key] is! List) state[key] = <String>[];
  }
  var points = state['points'] is num
      ? (state['points'] as num).round()
      : state['totalPoints'] is num
      ? (state['totalPoints'] as num).round()
      : 50;
  if (!approved.contains(chapterId)) {
    approved.add(chapterId);
    points += reviewPoints;
  }
  state['teacher_approved'] = approved;
  state['points'] = points;
  if (state['unlockedCount'] is! num || (state['unlockedCount'] as num) < 1) {
    state['unlockedCount'] = 1;
  }
  return state;
}

/// `game_state` after sending [chapterId] back: removed from every progress
/// list so the learner can do it again, exactly as the web dashboard does.
Map<String, dynamic> sentBackGameState(Object? raw, String chapterId) {
  final state = Map<String, dynamic>.from(raw is Map ? raw : const {});
  for (final key in ['completed', 'parent_approved', 'teacher_approved']) {
    state[key] = (state[key] is List ? state[key] as List : [])
        .whereType<String>()
        .where((id) => id != chapterId)
        .toList();
  }
  return state;
}

/// Teachers may only act on their own school's learners.
bool canReview(Profile teacher) =>
    teacher.role == AccountRole.teacher && teacher.schoolId.isNotEmpty;
