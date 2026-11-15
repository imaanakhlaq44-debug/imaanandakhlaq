import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:imaan_akhlaq/domain.dart';

void main() {
  const family = Profile(
    uid: 'family-a',
    name: 'Family',
    role: AccountRole.family,
  );
  const child = Profile(
    uid: 'child-a',
    name: 'A',
    role: AccountRole.student,
    familyUid: 'family-a',
  );
  test('class label comes from class_name or the school class_id', () {
    expect(Profile.fromMap('a', {'class_id': '3'}).className, 'Class 3');
    expect(
      Profile.fromMap('b', {'class_name': 'Grade 2', 'class_id': '3'}).className,
      'Grade 2',
    );
    expect(Profile.fromMap('c', {}).className, '');
  });
  test('legacy usernames resolve to the same existing Firebase identities', () {
    expect(loginEmail(' PAR-7K4QM '), 'par-7k4qm@family.imaanakhlaq.invalid');
    expect(loginEmail('tch-7k4qm'), 'tch-7k4qm@teacher.imaanakhlaq.invalid');
    expect(loginEmail('person@example.com'), 'person@example.com');
    expect(() => loginEmail('+923001234567'), throwsFormatException);
    expect(() => loginEmail('not-an-email'), throwsFormatException);
  });
  test(
    'family ownership never falls back to the signed-in family as learner',
    () {
      expect(ownsLearner(family, child), isTrue);
      expect(ownsLearner(family, family), isFalse);
      expect(
        ownsLearner(
          family,
          const Profile(
            uid: 'other',
            name: 'Other',
            role: AccountRole.student,
            familyUid: 'family-b',
          ),
        ),
        isFalse,
      );
      expect(ownsLearner(child, child), isTrue);
      expect(ownsLearner(child, family), isFalse);
    },
  );
  test(
    'school weekly grid only permits today; individual can learn at own pace',
    () {
      final monday = DateTime(2026, 11, 16);
      expect(editableDay(child, 0, monday), isTrue);
      expect(editableDay(child, 1, monday), isFalse);
      expect(
        editableDay(
          const Profile(uid: 'i', name: 'I', role: AccountRole.individual),
          6,
          monday,
        ),
        isTrue,
      );
      expect(editableDay(child, 6, DateTime(2026, 11, 22)), isTrue);
    },
  );
  test(
    'existing catalogue retains every unique legacy chapter and valid PDF range',
    () {
      final books = Book.decode(
        File('assets/data/activities.json').readAsStringSync(),
      );
      expect(books.length, greaterThanOrEqualTo(4));
      final ids = <String>{};
      for (final book in books) {
        expect(Uri.parse(book.pdfUrl).scheme, 'https');
        expect(book.chapters, isNotEmpty);
        for (final chapter in book.chapters) {
          expect(
            ids.add(chapter.id),
            isTrue,
            reason: 'Duplicate ${chapter.id}',
          );
          expect(chapter.pageStart, greaterThan(0));
          expect(chapter.pageEnd, greaterThanOrEqualTo(chapter.pageStart));
        }
      }
    },
  );
  test(
    'submission preserves legacy IDs and never supplies teacher approval or points',
    () {
      final book = Book.decode(
        File('assets/data/activities.json').readAsStringSync(),
      ).first;
      final chapter = book.chapters.first;
      final cells = List.filled(chapter.rowCount * 7, 0)..[0] = 1;
      final payload = activityPayload(
        account: family,
        learner: child,
        book: book,
        chapter: chapter,
        answer: '<img onerror="bad()">',
        cells: cells,
        now: DateTime.utc(2026),
      );
      expect(payload['student_uid'], 'child-a');
      expect(payload['family_uid'], 'family-a');
      expect(payload['chapter_id'], chapter.id);
      expect(
        payload['discussionText'],
        '<img onerror="bad()">',
      ); // Flutter renders text, never HTML.
      expect(payload.containsKey('teacherApprovedAt'), isFalse);
      expect(payload.containsKey('game_state'), isFalse);
      expect(payload.containsKey('points'), isFalse);
      expect(
        () => activityPayload(
          account: child,
          learner: family,
          book: book,
          chapter: chapter,
          answer: '',
          cells: cells,
          now: DateTime.now(),
        ),
        throwsStateError,
      );
      expect(
        () => activityPayload(
          account: family,
          learner: child,
          book: book,
          chapter: chapter,
          answer: '',
          cells: [7],
          now: DateTime.now(),
        ),
        throwsFormatException,
      );
    },
  );
}
