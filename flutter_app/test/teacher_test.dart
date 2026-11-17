import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:imaan_akhlaq/app_theme.dart';
import 'package:imaan_akhlaq/data/catalog.dart';
import 'package:imaan_akhlaq/domain.dart';
import 'package:imaan_akhlaq/screens/book_reader.dart';
import 'package:imaan_akhlaq/screens/teacher_shell.dart';
import 'package:imaan_akhlaq/teacher_domain.dart';
import 'app_test.dart' show FakeRepository, viewport;

const teacher = Profile(
  uid: 'teacher',
  name: 'Ms Sara',
  role: AccountRole.teacher,
  schoolId: 'school-1',
);

const ayaan = RosterStudent(uid: 's1', name: 'Ayaan', classId: '3', points: 120);
const hira = RosterStudent(
  uid: 's2',
  name: 'Hira',
  classId: '4',
  approved: ['b1_c1'],
);

Map<String, dynamic> sheet(
  String uid,
  String chapter, {
  String status = 'pending_teacher',
  String at = '2026-11-10T10:00:00Z',
  String answer = 'I helped my sister.',
  Map<String, dynamic> extra = const {},
}) => {
  'student_uid': uid,
  'chapter_id': chapter,
  'school_id': 'school-1',
  'discussionText': answer,
  'submittedAt': at,
  'updatedAt': at,
  'reviewStatus': status,
  'gridState': {
    'cells': [for (var i = 0; i < 63; i++) i % 3],
  },
  ...extra,
};

/// The sheet is a lazy list; scroll the note box into the tree first.
Future<void> revealNote(WidgetTester tester) => tester.scrollUntilVisible(
  find.byKey(const Key('review-note')),
  200,
  scrollable: find.byType(Scrollable).last,
);

void main() {
  group('review queue', () {
    test('keeps submitted, unapproved sheets of this school only', () {
      final queue = buildReviewQueue(
        [ayaan, hira],
        [
          ('s1_b1_c1', sheet('s1', 'b1_c1')),
          // Already approved on the student's progress.
          ('s2_b1_c1', sheet('s2', 'b1_c1')),
          // Approved on the sheet itself.
          ('s1_b1_c2', sheet('s1', 'b1_c2', status: 'teacher_approved')),
          // Sent back and not redone yet.
          ('s1_b1_c3', sheet('s1', 'b1_c3', status: 'needs_redo')),
          // Not on this teacher's roster.
          ('x_b1_c1', sheet('x', 'b1_c1')),
          // A draft with nothing in it.
          ('s2_b1_c2', {'student_uid': 's2', 'chapter_id': 'b1_c2'}),
        ],
      );
      expect(queue.map((r) => r.submissionId), ['s1_b1_c1']);
      expect(queue.single.cells.length, 63);
      expect(queue.single.answer, 'I helped my sister.');
    });

    test('oldest first, newest copy per chapter, redone sheets marked', () {
      final queue = buildReviewQueue(
        [ayaan, hira],
        [
          ('a', sheet('s1', 'b1_c2', at: '2026-11-12T00:00:00Z')),
          ('b', sheet('s1', 'b1_c2', at: '2026-11-13T00:00:00Z')),
          (
            'c',
            sheet(
              's2',
              'b1_c3',
              at: '2026-11-11T00:00:00Z',
              extra: {'teacherReviewedAt': '2026-11-09T00:00:00Z'},
            ),
          ),
        ],
      );
      expect(queue.map((r) => r.submissionId), ['c', 'b']);
      expect(queue.first.wasSentBack, isTrue);
      expect(queue.last.wasSentBack, isFalse);
    });

    test('approval awards points once and keeps other progress', () {
      final once = approvedGameState({
        'points': 100,
        'completed': ['b1_c1'],
        'badge': 'star',
      }, 'b1_c1');
      expect(once['points'], 100 + reviewPoints);
      expect(once['teacher_approved'], ['b1_c1']);
      expect(once['completed'], ['b1_c1']);
      expect(once['badge'], 'star');
      final twice = approvedGameState(once, 'b1_c1');
      expect(twice['points'], 100 + reviewPoints);
      expect(approvedGameState(null, 'b1_c1')['points'], 50 + reviewPoints);
    });

    test('sending back reopens the chapter everywhere', () {
      final state = sentBackGameState({
        'points': 150,
        'completed': ['b1_c1', 'b1_c2'],
        'parent_approved': ['b1_c1'],
        'teacher_approved': ['b1_c1'],
      }, 'b1_c1');
      expect(state['completed'], ['b1_c2']);
      expect(state['parent_approved'], isEmpty);
      expect(state['teacher_approved'], isEmpty);
      expect(state['points'], 150);
    });

    test('roster reads legacy fields', () {
      final s = RosterStudent.fromMap('u', {
        'name': ' Zara ',
        'class_id': '5',
        'game_state': {
          'totalPoints': 80,
          'completed': ['a', 'b'],
        },
      });
      expect(s.name, 'Zara');
      expect(s.classLabel, 'Class 5');
      expect(s.points, 80);
      expect(s.completed, 2);
      expect(RosterStudent.fromMap('v', {}).classLabel, 'No class');
    });
  });

  group('teacher workspace', () {
    setUpAll(() async {
      await (FontLoader('AppSans')
            ..addFont(rootBundle.load('assets/fonts/roboto-regular.ttf'))
            ..addFont(rootBundle.load('assets/fonts/roboto-bold.ttf')))
          .load();
    });

    Future<FakeRepository> pump(WidgetTester tester) async {
      viewport(tester);
      final repo = FakeRepository()
        ..roster = [ayaan, hira]
        ..sheets = [('s1_b1_c1', sheet('s1', 'b1_c1'))];
      addTearDown(repo.dispose);
      // Asset reads are real I/O; load the catalogue outside the fake clock.
      await tester.runAsync(() => Catalog().books());
      await tester.pumpWidget(
        MaterialApp(
          theme: appTheme(),
          home: Navigator(
            onGenerateRoute: (_) => MaterialPageRoute<void>(
              builder: (_) =>
                  TeacherShell(repository: repo, account: teacher),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      return repo;
    }

    testWidgets('shows the queue and approves a sheet', (tester) async {
      final repo = await pump(tester);
      expect(find.text('Teacher workspace'), findsOneWidget);
      expect(find.text('1 sheet is waiting for your review.'), findsOneWidget);
      expect(find.text('The Farm and the Brave Sister'), findsOneWidget);
      await tester.tap(find.byKey(const Key('review-s1_b1_c1')));
      await tester.pumpAndSettle();
      expect(find.text('Review sheet'), findsOneWidget);
      expect(find.text('I helped my sister.'), findsOneWidget);
      await revealNote(tester);
      await tester.enterText(find.byKey(const Key('review-note')), 'Great!');
      await tester.ensureVisible(find.byKey(const Key('approve-sheet')));
      await tester.tap(find.byKey(const Key('approve-sheet')));
      await tester.pumpAndSettle();
      expect(repo.reviews, [('s1_b1_c1', true, 'Great!')]);
      expect(find.text('Review sheet'), findsNothing);
      expect(tester.takeException(), isNull);
    });

    testWidgets('sending back needs a note and a confirmation', (
      tester,
    ) async {
      final repo = await pump(tester);
      await tester.tap(find.byKey(const Key('review-s1_b1_c1')));
      await tester.pumpAndSettle();
      final sendBack = find.byKey(const Key('send-back-sheet'));
      await revealNote(tester);
      await tester.scrollUntilVisible(
        sendBack,
        200,
        scrollable: find.byType(Scrollable).last,
      );
      await tester.tap(sendBack);
      await tester.pumpAndSettle();
      expect(
        find.text('Write a short note so the family knows what to fix.'),
        findsOneWidget,
      );
      expect(repo.reviews, isEmpty);
      await tester.enterText(
        find.byKey(const Key('review-note')),
        'Please fill in Friday.',
      );
      await tester.ensureVisible(sendBack);
      await tester.tap(sendBack);
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('confirm-send-back')));
      await tester.pumpAndSettle();
      expect(repo.reviews, [('s1_b1_c1', false, 'Please fill in Friday.')]);
    });

    testWidgets('students tab filters by class and searches', (tester) async {
      await pump(tester);
      await tester.tap(find.byKey(const Key('teacher-tab-students')));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('teacher-student-s1')), findsOneWidget);
      expect(find.byKey(const Key('teacher-student-s2')), findsOneWidget);
      expect(find.text('120 pts'), findsOneWidget);
      await tester.tap(find.byKey(const Key('teacher-filter-3')));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('teacher-student-s1')), findsOneWidget);
      expect(find.byKey(const Key('teacher-student-s2')), findsNothing);
      await tester.tap(find.byKey(const Key('teacher-filter-')));
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextField), 'hir');
      await tester.pumpAndSettle();
      expect(find.text('Ayaan'), findsNothing);
      expect(find.text('Hira'), findsOneWidget);
    });

    testWidgets('books tab lists every book; reading blocks screenshots', (
      tester,
    ) async {
      final calls = <bool>[];
      tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
        const MethodChannel('imaan/screen_guard'),
        (call) async {
          calls.add(call.arguments as bool);
          return null;
        },
      );
      addTearDown(
        () => tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
          const MethodChannel('imaan/screen_guard'),
          null,
        ),
      );
      await pump(tester);
      await tester.tap(find.byKey(const Key('teacher-tab-books')));
      await tester.pumpAndSettle();
      for (final id in ['book1', 'book2', 'book3', 'book4']) {
        expect(find.byKey(Key('teacher-book-$id')), findsOneWidget);
      }
      await tester.scrollUntilVisible(
        find.textContaining('cannot be downloaded'),
        200,
        scrollable: find.byType(Scrollable).last,
      );
      await tester.ensureVisible(find.byKey(const Key('teacher-book-book1')));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('teacher-book-book1')));
      await tester.pumpAndSettle();
      final chapter = find.byKey(const Key('teacher-chapter-b1_c1'));
      await tester.ensureVisible(chapter);
      await tester.pumpAndSettle();

      await tester.tap(chapter);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 400));
      expect(find.byType(BookReaderScreen), findsOneWidget);
      expect(calls, [true]);
      Navigator.of(tester.element(find.byType(BookReaderScreen))).pop();
      await tester.pump();
      await tester.pump(const Duration(seconds: 1));
      await tester.pump(const Duration(seconds: 1));
      expect(find.byType(BookReaderScreen), findsNothing);
      expect(calls, [true, false]);
    });

    test('approved this week counts recent approvals only', () {
      final now = DateTime(2026, 11, 15, 12);
      String at(int d) =>
          now.subtract(Duration(days: d)).toUtc().toIso8601String();
      expect(
        approvedThisWeek([
          ('a', {'teacherApprovedAt': at(1)}),
          ('b', {'teacherApprovedAt': at(6)}),
          ('c', {'teacherApprovedAt': at(9)}),
          ('d', {'teacherApprovedAt': null}),
        ], now),
        2,
      );
    });

    testWidgets('a teacher without a school sees a clear message', (
      tester,
    ) async {
      viewport(tester);
      final repo = FakeRepository();
      addTearDown(repo.dispose);
      await tester.pumpWidget(
        MaterialApp(
          theme: appTheme(),
          home: TeacherShell(
            repository: repo,
            account: const Profile(
              uid: 't',
              name: 'T',
              role: AccountRole.teacher,
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('School link missing'), findsOneWidget);
    });
  });
}
