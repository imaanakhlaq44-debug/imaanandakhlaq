import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:imaan_akhlaq/admin_domain.dart';
import 'package:imaan_akhlaq/app_theme.dart';
import 'package:imaan_akhlaq/domain.dart';
import 'package:imaan_akhlaq/screens/admin_dashboard.dart';
import 'package:imaan_akhlaq/screens/ui_kit.dart' show avatarInitial;
import 'app_test.dart' show FakeRepository, viewport;

const admin = Profile(
  uid: 'admin',
  name: 'Amna',
  role: AccountRole.schoolAdmin,
  schoolId: 'school-1',
  schoolName: 'Demo School',
);

SchoolMember member(String uid, Map<String, dynamic> data) =>
    SchoolMember.fromMap(uid, {'school_id': 'school-1', ...data});

final roster = [
  member('s1', {
    'role': 'student',
    'name': 'Ayaan',
    'class_id': '3',
    'family_uid': 'f1',
    'game_state': {
      'points': 150,
      'teacher_approved': ['a', 'b'],
    },
  }),
  member('s2', {'role': 'student', 'name': 'Hira', 'class_id': '4'}),
  member('s3', {'role': 'student', 'name': 'Zara', 'class_id': '10'}),
  member('t1', {
    'role': 'teacher',
    'name': 'Ms Sara',
    'username': 'TCH-SARA1',
    'class_id': '3',
  }),
  member('f1', {
    'role': 'family',
    'name': 'Ahmad Family',
    'username': 'PAR-AHMD1',
  }),
  member('a1', {'role': 'school_admin', 'name': 'Amna'}),
];

void main() {
  group('school summary', () {
    test('splits roles and counts what the overview shows', () {
      final s = SchoolSummary(roster);
      expect(s.students.length, 3);
      expect(s.teachers.single.username, 'TCH-SARA1');
      expect(s.families.single.name, 'Ahmad Family');
      expect(s.classes, {'3', '4', '10'});
      expect(s.studentsWithoutFamily, 2);
      expect(s.approvedChapters, 2);
      expect(s.topStudents.first.name, 'Ayaan');
      expect(s.childrenOf('f1').map((c) => c.name), ['Ayaan']);
      // Numeric classes sort as numbers, not text.
      expect(s.byClass(s.students).keys, ['Class 3', 'Class 4', 'Class 10']);
    });

    test('form validation matches the server rules', () {
      expect(validateName(' A ', 'student'), isNotNull);
      expect(validateName('Ali', 'student'), isNull);
      expect(validatePhone(''), isNull);
      expect(validatePhone('0300 1234567'), isNull);
      expect(validatePhone('abc'), isNotNull);
      expect(plural(1, 'chapter'), '1 chapter');
      expect(plural(2, 'class', 'classes'), '2 classes');
    });

    test('weekly activity counts the last 7 days and the week before', () {
      final now = DateTime(2026, 11, 15, 10);
      String at(int daysAgo) =>
          now.subtract(Duration(days: daysAgo)).toUtc().toIso8601String();
      final activity = WeeklyActivity([
        ('a', {'student_uid': 's1', 'submittedAt': at(0)}),
        ('b', {'student_uid': 's1', 'submittedAt': at(0)}),
        ('c', {'student_uid': 's2', 'submittedAt': at(3)}),
        ('d', {'student_uid': 's3', 'submittedAt': at(9)}),
        ('e', {'student_uid': 's3', 'activityCompletedAt': at(6)}),
        ('f', {'student_uid': 's2'}), // draft, never submitted
      ], now);
      expect(activity.perDay, [1, 0, 0, 1, 0, 0, 2]);
      expect(activity.thisWeek, 4);
      expect(activity.lastWeek, 1);
      expect(activity.best, 2);
      expect(activity.days.last.day, 15);
      expect(activity.activeStudents, {'s1', 's2', 's3'});
      final summary = SchoolSummary(roster);
      expect(activity.activeShare(summary.students), 1);
      expect(
        WeeklyActivity(const [], now).activeShare(summary.students),
        0,
      );
    });

    test('avatars use the person, not their title', () {
      expect(avatarInitial('Mr Ali (Demo)'), 'A');
      expect(avatarInitial('Ms. Sara'), 'S');
      expect(avatarInitial('Dr Hina Khan'), 'H');
      expect(avatarInitial('(Demo) Zara'), 'Z');
      expect(avatarInitial('Mr'), 'M');
      expect(avatarInitial('  '), '?');
    });
  });

  group('admin dashboard', () {
    setUpAll(() async {
      await (FontLoader('AppSans')
            ..addFont(rootBundle.load('assets/fonts/roboto-regular.ttf'))
            ..addFont(rootBundle.load('assets/fonts/roboto-bold.ttf')))
          .load();
    });

    Future<FakeRepository> pump(WidgetTester tester, {double scale = 1}) async {
      viewport(tester, scale: scale);
      final repo = FakeRepository()..members = roster;
      addTearDown(repo.dispose);
      await tester.pumpWidget(
        MaterialApp(
          theme: appTheme(),
          home: AdminDashboard(
            repository: repo,
            account: admin,
            onSignOut: () {},
          ),
        ),
      );
      await tester.pumpAndSettle();
      return repo;
    }

    Future<void> tapKey(WidgetTester tester, String key) async {
      await tester.tap(find.byKey(Key(key)));
      await tester.pumpAndSettle();
    }

    testWidgets('overview shows the school at a glance', (tester) async {
      await pump(tester);
      expect(find.text('Demo School'), findsOneWidget);
      expect(find.text('School admin workspace'), findsOneWidget);
      expect(find.text('2 students without a family'), findsOneWidget);
      await tester.scrollUntilVisible(
        find.text('2 chapters approved'),
        200,
        scrollable: find
            .descendant(
              of: find.byKey(const Key('admin-overview')),
              matching: find.byType(Scrollable),
            )
            .first,
      );
      expect(find.text('150 pts'), findsWidgets);
      expect(tester.takeException(), isNull);
    });

    testWidgets('quick action and attention card lead to the right place', (
      tester,
    ) async {
      final repo = await pump(tester);
      await tapKey(tester, 'quick-add-teacher');
      expect(find.byKey(const Key('teacher-name')), findsOneWidget);
      await tester.enterText(find.byKey(const Key('teacher-name')), 'Mr Ali');
      await tapKey(tester, 'admin-form-submit');
      expect(repo.adminCalls, ['createTeacher:Mr Ali:']);
      await tapKey(tester, 'handover-done');
      await tester.tap(find.text('Link now'));
      await tester.pumpAndSettle();
      // Students tab, filtered to those without a family.
      expect(find.byKey(const Key('student-s1')), findsNothing);
      expect(find.byKey(const Key('student-s2')), findsOneWidget);
      expect(find.byKey(const Key('student-s3')), findsOneWidget);
    });

    testWidgets('filters by class and adds a student', (tester) async {
      final repo = await pump(tester);
      await tapKey(tester, 'admin-tab-students');
      await tapKey(tester, 'filter-10');
      expect(find.byKey(const Key('student-s3')), findsOneWidget);
      expect(find.byKey(const Key('student-s1')), findsNothing);
      await tapKey(tester, 'add-student');
      await tapKey(tester, 'admin-form-submit');
      expect(find.text('Enter the student name.'), findsOneWidget);
      await tester.enterText(find.byKey(const Key('student-name')), 'Bilal');
      await tester.enterText(find.byKey(const Key('student-class')), '5');
      await tapKey(tester, 'admin-form-submit');
      expect(repo.adminCalls, ['createStudent:Bilal:5:']);
      expect(find.byKey(const Key('student-added')), findsOneWidget);
      expect(find.text('STU-ABCDE'), findsOneWidget);
    });

    testWidgets('links a student without a family', (tester) async {
      final repo = await pump(tester);
      await tapKey(tester, 'admin-tab-students');
      await tapKey(tester, 'student-s2');
      await tapKey(tester, 'attach-family');
      await tapKey(tester, 'pick-family-f1');
      expect(repo.adminCalls, ['attach:s2:f1']);
    });

    testWidgets('adds a teacher and hands over the login', (tester) async {
      final repo = await pump(tester);
      await tapKey(tester, 'admin-tab-teachers');
      expect(find.text('TCH-SARA1'), findsOneWidget);
      await tapKey(tester, 'add-teacher');
      await tester.enterText(find.byKey(const Key('teacher-name')), 'Mr Ali');
      await tapKey(tester, 'admin-form-submit');
      expect(repo.adminCalls, ['createTeacher:Mr Ali:']);
      expect(find.byKey(const Key('handover')), findsOneWidget);
      expect(find.text('TCH-NEW01'), findsOneWidget);
      expect(find.text('ABCD-EFGH'), findsOneWidget);
      await tapKey(tester, 'handover-done');
      expect(find.byKey(const Key('handover')), findsNothing);
    });

    testWidgets('resets and removes a teacher only after confirming', (
      tester,
    ) async {
      final repo = await pump(tester);
      await tapKey(tester, 'admin-tab-teachers');
      await tapKey(tester, 'reset-teacher-t1');
      await tapKey(tester, 'admin-confirm');
      expect(find.text('WXYZ-1234'), findsOneWidget);
      await tapKey(tester, 'handover-done');
      await tapKey(tester, 'remove-teacher-t1');
      await tester.tap(find.text('Cancel'));
      await tester.pumpAndSettle();
      expect(repo.adminCalls, ['resetTeacher:t1']);
      await tapKey(tester, 'remove-teacher-t1');
      await tapKey(tester, 'admin-confirm');
      expect(repo.adminCalls, ['resetTeacher:t1', 'deleteTeacher:t1']);
    });

    testWidgets('families show their children and add a family', (
      tester,
    ) async {
      final repo = await pump(tester);
      await tapKey(tester, 'admin-tab-families');
      expect(find.text('PAR-AHMD1'), findsOneWidget);
      expect(
        find.descendant(
          of: find.byKey(const Key('family-f1')),
          matching: find.text('Ayaan'),
        ),
        findsOneWidget,
      );
      await tapKey(tester, 'add-family');
      await tester.enterText(
        find.byKey(const Key('family-name')),
        'Khan Family',
      );
      await tapKey(tester, 'admin-form-submit');
      expect(repo.adminCalls, ['createFamily:Khan Family']);
      expect(find.text('PAR-NEW01'), findsOneWidget);
    });

    testWidgets('large text on a phone does not overflow', (tester) async {
      await pump(tester, scale: 1.4);
      for (final tab in [
        'admin-tab-students',
        'admin-tab-teachers',
        'admin-tab-families',
        'admin-tab-more',
        'admin-tab-overview',
      ]) {
        await tapKey(tester, tab);
      }
      expect(tester.takeException(), isNull);
    });
  });
}
