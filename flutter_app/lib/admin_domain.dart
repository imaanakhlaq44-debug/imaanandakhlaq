import 'teacher_domain.dart';

/// Anyone on a school's roster, as the school admin sees them.
enum MemberRole { student, teacher, family, admin, other }

class SchoolMember {
  const SchoolMember({
    required this.uid,
    required this.name,
    required this.role,
    this.classId = '',
    this.username = '',
    this.phone = '',
    this.familyUid = '',
    this.points = 0,
    this.completed = 0,
    this.approved = 0,
    this.createdAt = '',
  });
  final String uid, name, classId, username, phone, familyUid, createdAt;
  final MemberRole role;
  final int points, completed, approved;

  factory SchoolMember.fromMap(String uid, Map<String, dynamic> data) {
    String text(String key) => data[key] is String
        ? (data[key] as String).trim()
        : (data[key] is num ? '${data[key]}' : '');
    final student = RosterStudent.fromMap(uid, data);
    return SchoolMember(
      uid: uid,
      name: text('name').isEmpty ? 'Unnamed' : text('name'),
      role: switch (data['role']) {
        'student' => MemberRole.student,
        'teacher' => MemberRole.teacher,
        'family' => MemberRole.family,
        'school_admin' => MemberRole.admin,
        _ => MemberRole.other,
      },
      classId: text('class_id').isNotEmpty ? text('class_id') : text('classId'),
      username: text('username'),
      phone: text('phone'),
      familyUid: text('family_uid'),
      points: student.points,
      completed: student.completed,
      approved: student.approved.length,
      createdAt: text('created_at'),
    );
  }

  String get classLabel => classId.isEmpty ? 'No class' : 'Class $classId';
}

/// Everything the overview needs, derived once from the live roster.
class SchoolSummary {
  SchoolSummary(List<SchoolMember> members)
    : students = members.where((m) => m.role == MemberRole.student).toList(),
      teachers = members.where((m) => m.role == MemberRole.teacher).toList(),
      families = members.where((m) => m.role == MemberRole.family).toList();

  final List<SchoolMember> students, teachers, families;

  Set<String> get classes => {
    for (final s in students)
      if (s.classId.isNotEmpty) s.classId,
  };

  int get studentsWithoutFamily =>
      students.where((s) => s.familyUid.isEmpty).length;

  int get approvedChapters => students.fold(0, (sum, s) => sum + s.approved);

  List<SchoolMember> get topStudents =>
      [...students]..sort((a, b) => b.points.compareTo(a.points));

  List<SchoolMember> childrenOf(String familyUid) =>
      students.where((s) => s.familyUid == familyUid).toList();

  /// Students per class label, classes in natural order, "No class" last.
  Map<String, List<SchoolMember>> byClass(Iterable<SchoolMember> list) {
    final groups = <String, List<SchoolMember>>{};
    for (final s in list) {
      groups.putIfAbsent(s.classLabel, () => []).add(s);
    }
    final keys = groups.keys.toList()
      ..sort((a, b) {
        if (a == 'No class') return 1;
        if (b == 'No class') return -1;
        final na = int.tryParse(a.replaceFirst('Class ', ''));
        final nb = int.tryParse(b.replaceFirst('Class ', ''));
        if (na != null && nb != null) return na.compareTo(nb);
        return a.compareTo(b);
      });
    return {for (final k in keys) k: groups[k]!};
  }
}

/// When a sheet was handed in, in local time, or null if never submitted.
DateTime? submittedOn(Map<String, dynamic> sheet) {
  final raw = sheet['submittedAt'] ?? sheet['activityCompletedAt'];
  if (raw is! String || raw.isEmpty) return null;
  return DateTime.tryParse(raw)?.toLocal();
}

/// Submission activity for the overview chart, from the school's sheets.
class WeeklyActivity {
  WeeklyActivity(List<(String, Map<String, dynamic>)> sheets, DateTime now) {
    final today = DateTime(now.year, now.month, now.day);
    for (final (_, data) in sheets) {
      final at = submittedOn(data);
      if (at == null) continue;
      final day = DateTime(at.year, at.month, at.day);
      final ago = today.difference(day).inDays;
      if (ago >= 0 && ago < 7) {
        perDay[6 - ago]++;
        final uid = data['student_uid'];
        if (uid is String) activeStudents.add(uid);
      } else if (ago >= 7 && ago < 14) {
        lastWeek++;
      }
    }
    days = [for (var i = 6; i >= 0; i--) today.subtract(Duration(days: i))];
  }

  /// Oldest first: index 6 is today.
  final List<int> perDay = List.filled(7, 0);
  late final List<DateTime> days;
  int lastWeek = 0;
  final Set<String> activeStudents = {};

  int get thisWeek => perDay.fold(0, (a, b) => a + b);
  int get best => perDay.fold(0, (a, b) => b > a ? b : a);

  /// Share of [students] who submitted anything in the last 7 days, 0–1.
  double activeShare(Iterable<SchoolMember> students) {
    final list = students.toList();
    if (list.isEmpty) return 0;
    return list.where((s) => activeStudents.contains(s.uid)).length /
        list.length;
  }
}

/// A login the school hands to a teacher or family. The password is shown
/// once, right after it is created or reset; it is never stored.
class Handover {
  const Handover({
    required this.name,
    required this.username,
    required this.password,
    required this.kind,
  });
  final String name, username, password, kind;
}

/// Name rules shared by every add form (the callables enforce the same).
String? validateName(String? value, String what) {
  final v = (value ?? '').trim();
  if (v.length < 2) return 'Enter the $what name.';
  if (v.length > 80) return 'Keep the name under 80 characters.';
  return null;
}

String? validatePhone(String? value) {
  final v = (value ?? '').trim();
  if (v.isEmpty) return null;
  if (!RegExp(r'^\+?[\d\s\-()]{7,20}$').hasMatch(v)) {
    return 'That phone number does not look right.';
  }
  return null;
}
