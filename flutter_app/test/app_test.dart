import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:imaan_akhlaq/app.dart';
import 'package:imaan_akhlaq/app_theme.dart';
import 'package:imaan_akhlaq/data/app_repository.dart';
import 'package:imaan_akhlaq/domain.dart';
import 'package:imaan_akhlaq/teacher_domain.dart';
import 'package:imaan_akhlaq/admin_domain.dart';
import 'package:imaan_akhlaq/data/catalog.dart';
import 'package:imaan_akhlaq/screens/learning_experience.dart';
import 'package:imaan_akhlaq/data/registration.dart';
import 'package:imaan_akhlaq/screens/chapter_screen.dart';

const child = Profile(
  uid: 'child',
  name: 'Ayaan',
  role: AccountRole.student,
  familyUid: 'family',
);
const family = Profile(
  uid: 'family',
  name: 'Ahmad family',
  role: AccountRole.family,
);
const individual = Profile(
  uid: 'individual',
  name: 'Ayaan',
  role: AccountRole.individual,
);

class FakeRepository implements AppRepository {
  final auth = StreamController<String?>.broadcast();
  final kids = StreamController<List<Profile>>.broadcast();
  String? initial;
  String loginUid = 'individual';
  RegistrationRequest? lastRegistration;
  bool failLogin = false, failSave = false;
  int loginCalls = 0, saveCalls = 0, registrationCalls = 0;
  bool failRegistration = false;
  List<RosterStudent> roster = const [];
  List<(String, Map<String, dynamic>)> sheets = const [];
  final reviews = <(String, bool, String)>[];
  List<SchoolMember> members = const [];
  final adminCalls = <String>[];
  @override
  Stream<List<SchoolMember>> schoolMembers(String schoolId) =>
      Stream.value(members);
  @override
  Future<Handover> createTeacher({
    required String name,
    String phone = '',
    String classId = '',
  }) async {
    adminCalls.add('createTeacher:$name:$classId');
    return Handover(
      name: name,
      username: 'TCH-NEW01',
      password: 'ABCD-EFGH',
      kind: 'Teacher',
    );
  }

  @override
  Future<Handover> resetTeacherPassword(SchoolMember teacher) async {
    adminCalls.add('resetTeacher:${teacher.uid}');
    return Handover(
      name: teacher.name,
      username: teacher.username,
      password: 'WXYZ-1234',
      kind: 'Teacher',
    );
  }

  @override
  Future<void> deleteTeacher(SchoolMember teacher) async =>
      adminCalls.add('deleteTeacher:${teacher.uid}');
  @override
  Future<Handover> createFamily({required String name, String phone = ''}) async {
    adminCalls.add('createFamily:$name');
    return Handover(
      name: name,
      username: 'PAR-NEW01',
      password: 'ABCD-EFGH',
      kind: 'Family',
    );
  }

  @override
  Future<Handover> resetFamilyPassword(SchoolMember family) async {
    adminCalls.add('resetFamily:${family.uid}');
    return Handover(
      name: family.name,
      username: family.username,
      password: 'WXYZ-1234',
      kind: 'Family',
    );
  }

  @override
  Future<String> createStudent({
    required String name,
    String classId = '',
    String familyUid = '',
  }) async {
    adminCalls.add('createStudent:$name:$classId:$familyUid');
    return 'STU-ABCDE';
  }

  @override
  Future<void> attachChild({
    required SchoolMember student,
    required SchoolMember family,
  }) async => adminCalls.add('attach:${student.uid}:${family.uid}');
  @override
  Stream<List<RosterStudent>> schoolStudents(String schoolId) =>
      Stream.value(roster);
  @override
  Stream<List<(String, Map<String, dynamic>)>> schoolSubmissions(
    String schoolId,
  ) => Stream.value(sheets);
  @override
  Future<void> reviewSheet({
    required Profile teacher,
    required ReviewItem item,
    required bool approve,
    required String note,
  }) async {
    if (!approve && note.trim().isEmpty) {
      throw const FormatException('Write a short note.');
    }
    reviews.add((item.submissionId, approve, note.trim()));
  }

  @override
  Future<bool> register(RegistrationRequest request) async {
    registrationCalls++;
    lastRegistration = request;
    if (failRegistration) {
      throw StateError('Could not create your account. Try again.');
    }
    return true;
  }

  @override
  Stream<String?> authChanges() async* {
    yield initial;
    yield* auth.stream;
  }

  @override
  Future<void> signIn(String login, String password) async {
    loginCalls++;
    if (failLogin) throw StateError('Your login or password is incorrect.');
    auth.add(loginUid);
  }

  int googleCalls = 0;
  @override
  Future<void> signInWithGoogle() async {
    googleCalls++;
    auth.add(loginUid);
  }

  final resetEmails = <String>[];
  @override
  Future<void> sendPasswordReset(String email) async {
    resetEmails.add(email);
  }

  @override
  Future<void> signOut() async {
    auth.add(null);
  }

  @override
  Stream<Profile?> profile(String uid) => Stream.value(
    uid == 'teacher'
        ? const Profile(
            uid: 'teacher',
            name: 'Teacher',
            role: AccountRole.teacher,
            schoolId: 'school-1',
          )
        : uid == 'admin'
        ? const Profile(
            uid: 'admin',
            name: 'Admin',
            role: AccountRole.schoolAdmin,
            schoolId: 'school-1',
          )
        : uid == 'family'
        ? family
        : uid == 'child'
        ? child
        : individual,
  );
  @override
  Stream<List<Profile>> children(String uid) async* {
    yield [child];
    yield* kids.stream;
  }

  @override
  Future<void> claimChild(String code) async {}
  @override
  Future<Map<String, dynamic>?> submission(String uid, String id) async => null;
  @override
  Future<void> saveActivity(
    Profile account,
    Profile learner,
    Book book,
    Chapter chapter,
    String answer,
    List<int> cells, {
    required bool submit,
  }) async {
    saveCalls++;
    if (failSave) throw StateError('Connection lost. Please retry.');
  }

  Future<void> dispose() async {
    await auth.close();
    await kids.close();
  }
}

void viewport(WidgetTester tester, {double scale = 1}) {
  tester.view.physicalSize = const Size(390, 844);
  tester.view.devicePixelRatio = 1;
  tester.platformDispatcher.textScaleFactorTestValue = scale;
  addTearDown(() {
    tester.view.resetPhysicalSize();
    tester.view.resetDevicePixelRatio();
    tester.platformDispatcher.clearTextScaleFactorTestValue();
  });
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  WidgetController.hitTestWarningShouldBeFatal = true;
  setUpAll(() async {
    await Catalog().books();
    await (FontLoader('AppSans')
          ..addFont(rootBundle.load('assets/fonts/roboto-regular.ttf'))
          ..addFont(rootBundle.load('assets/fonts/roboto-bold.ttf')))
        .load();
    await (FontLoader('Fredoka')
          ..addFont(rootBundle.load('assets/fonts/fredoka.ttf')))
        .load();
    await (FontLoader(
      'MaterialIcons',
    )..addFont(rootBundle.load('fonts/MaterialIcons-Regular.otf'))).load();
  });
  testWidgets(
    'login validates input, exposes recoverable errors, and supports retry',
    (tester) async {
      viewport(tester);
      final repo = FakeRepository()..failLogin = true;
      addTearDown(repo.dispose);
      await tester.pumpWidget(ImaanApp(repository: repo));
      await enterSection(tester, school: repo.initial == 'family');
      await tester.tap(find.text('Profile'));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('home-sign-in')));
      await tester.pumpAndSettle();
      await tester.ensureVisible(find.text('Continue'));
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();
      expect(repo.loginCalls, 0);
      await tester.enterText(
        find.byKey(const Key('login')),
        'person@example.com',
      );
      await tester.enterText(find.byKey(const Key('password')), 'password');
      await tester.ensureVisible(find.text('Continue'));
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();
      expect(find.text('Your login or password is incorrect.'), findsOneWidget);
      repo.failLogin = false;
      await tester.ensureVisible(find.text('Continue'));
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();
      expect(
        tester
            .widget<LearningDashboard>(find.byType(LearningDashboard))
            .learner
            ?.uid,
        'individual',
      );
      expect(tester.takeException(), isNull);
    },
  );
  testWidgets(
    'individual sign-in offers Google, forgot password and a password eye',
    (tester) async {
      viewport(tester);
      final repo = FakeRepository();
      addTearDown(repo.dispose);
      await tester.pumpWidget(ImaanApp(repository: repo));
      await enterSection(tester, school: false);
      await tester.tap(find.text('Profile'));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('home-sign-in')));
      await tester.pumpAndSettle();

      // Eye shows the password.
      await tester.enterText(find.byKey(const Key('password')), 'secret12');
      EditableText field() => tester.widget<EditableText>(
        find.descendant(
          of: find.byKey(const Key('password')),
          matching: find.byType(EditableText),
        ),
      );
      expect(field().obscureText, isTrue);
      await tester.tap(find.byTooltip('Show password'));
      await tester.pump();
      expect(field().obscureText, isFalse);

      // Forgot password sends to the typed email.
      await tester.enterText(find.byKey(const Key('login')), 'me@example.com');
      await tester.ensureVisible(find.byKey(const Key('forgot-password')));
      await tester.tap(find.byKey(const Key('forgot-password')));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('reset-send')));
      await tester.pumpAndSettle();
      expect(repo.resetEmails, ['me@example.com']);
      expect(find.textContaining('reset link is on its way'), findsOneWidget);

      // Google signs in.
      await tester.ensureVisible(find.byKey(const Key('google-sign-in')));
      await tester.tap(find.byKey(const Key('google-sign-in')));
      await tester.pumpAndSettle();
      expect(repo.googleCalls, 1);
      expect(find.byType(LearningDashboard), findsOneWidget);
      expect(tester.takeException(), isNull);
    },
  );
  testWidgets(
    'family selection uses child profile; revoked child access returns to picker',
    (tester) async {
      viewport(tester);
      final repo = FakeRepository()..initial = 'family';
      addTearDown(repo.dispose);
      await tester.pumpWidget(ImaanApp(repository: repo));
      await enterSection(tester, school: repo.initial == 'family');
      await tester.tap(find.text('Ayaan'));
      await tester.pumpAndSettle();
      expect(
        tester
            .widget<LearningDashboard>(find.byType(LearningDashboard))
            .learner
            ?.uid,
        'child',
      );
      repo.kids.add([]);
      await tester.pumpAndSettle();
      expect(find.textContaining('No children are linked'), findsOneWidget);
      expect(find.byType(LearningDashboard), findsNothing);
    },
  );
  testWidgets('sign-out destroys pushed learner routes', (tester) async {
    viewport(tester);
    final repo = FakeRepository()..initial = 'individual';
    addTearDown(repo.dispose);
    await tester.pumpWidget(ImaanApp(repository: repo));
    await enterSection(tester, school: repo.initial == 'family');
    await tester.tap(find.text('Books'));
    await tester.pump(const Duration(milliseconds: 500));

    await tester.pumpAndSettle();
    final book = Book.decode(
      File('assets/data/activities.json').readAsStringSync(),
    ).first;
    await tester.tap(find.text(book.title));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text(book.chapters.first.title));
    await tester.tap(find.text(book.chapters.first.title));
    await tester.pumpAndSettle();
    expect(find.text('Think about it'), findsOneWidget);
    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();
    expect(find.text('Think about it'), findsNothing);
    await tester.ensureVisible(find.text(book.chapters.first.title));
    await tester.tap(find.text(book.chapters.first.title));
    await tester.pumpAndSettle();
    repo.auth.add(null);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Profile'));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('home-create-account')), findsOneWidget);
    expect(find.text('Think about it'), findsNothing);
  });
  testWidgets(
    'activity rejects empty submission and reports save failure without losing reflection',
    (tester) async {
      viewport(tester);
      final repo = FakeRepository()..failSave = true;
      addTearDown(repo.dispose);
      final book = Book.decode(
        File('assets/data/activities.json').readAsStringSync(),
      ).first;
      await tester.pumpWidget(
        MaterialApp(
          theme: appTheme(),
          home: ChapterScreen(
            repository: repo,
            account: individual,
            learner: individual,
            book: book,
            chapter: book.chapters.first,
          ),
        ),
      );
      await tester.pumpAndSettle();
      await tester.scrollUntilVisible(
        find.text('Complete activity'),
        500,
        scrollable: find.byType(Scrollable).first,
      );
      await tester.ensureVisible(find.text('Complete activity'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Complete activity'));
      await tester.pumpAndSettle();
      expect(repo.saveCalls, 0);
      expect(
        find.text('Write your reflection before submitting.'),
        findsOneWidget,
      );
      await tester.pump(const Duration(seconds: 5));
      await tester.pumpAndSettle();
      await tester.scrollUntilVisible(
        find.byType(TextField),
        -500,
        scrollable: find.byType(Scrollable).first,
      );
      await tester.enterText(
        find.byType(TextField),
        'I learned to stay near trusted adults.',
      );
      await tester.scrollUntilVisible(
        find.text('Save progress'),
        500,
        scrollable: find.byType(Scrollable).first,
      );
      await tester.ensureVisible(find.text('Save progress'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Save progress'));
      await tester.pumpAndSettle();
      expect(find.text('Connection lost. Please retry.'), findsOneWidget);
      await tester.scrollUntilVisible(
        find.byType(TextField),
        -500,
        scrollable: find.byType(Scrollable).first,
      );
      expect(
        find.text('I learned to stay near trusted adults.'),
        findsOneWidget,
      );
    },
  );
  testWidgets('small mobile layout supports large text without overflow', (
    tester,
  ) async {
    viewport(tester, scale: 1.6);
    final repo = FakeRepository()..initial = 'individual';
    addTearDown(repo.dispose);
    await tester.pumpWidget(ImaanApp(repository: repo));
    await enterSection(tester, school: repo.initial == 'family');
    for (final tab in ['Map', 'Learn', 'Progress', 'Books', 'Home']) {
      await tester.tap(find.text(tab));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull, reason: tab);
    }
  });
  testWidgets('dashboard visual review at phone size', (tester) async {
    viewport(tester);
    final repo = FakeRepository()..initial = 'individual';
    addTearDown(repo.dispose);
    await tester.pumpWidget(ImaanApp(repository: repo));
    await enterSection(tester, school: repo.initial == 'family');
    await precacheExperienceImages(tester);
    await expectLater(
      find.byType(MaterialApp),
      matchesGoldenFile('goldens/dashboard.png'),
    );
  });
}

Future<void> precacheExperienceImages(WidgetTester tester) async {
  final context = tester.element(find.byType(MaterialApp));
  await tester.runAsync(
    () => Future.wait([
      precacheImage(
        const ResizeImage(
          AssetImage('assets/images/reading-hero-book1.png'),
          width: 640,
        ),
        context,
      ),
      precacheImage(
        const ResizeImage(
          AssetImage('assets/images/course-atlas.png'),
          width: 1024,
        ),
        context,
      ),
      precacheImage(
        const ResizeImage(
          AssetImage('assets/images/original-imaan.jpg'),
          width: 240,
        ),
        context,
      ),
      precacheImage(
        const ResizeImage(
          AssetImage('assets/images/original-akhlaq.jpg'),
          width: 240,
        ),
        context,
      ),
      precacheImage(
        const ResizeImage(
          AssetImage('assets/images/amanpur-map.png'),
          width: 1000,
        ),
        context,
      ),
    ]),
  );
  await tester.pumpAndSettle();
}

Future<void> enterSection(WidgetTester tester, {bool school = false}) async {
  await tester.pumpAndSettle();
  await tester.tap(
    find.byKey(Key(school ? 'choose-school' : 'choose-individual')),
  );
  await tester.pumpAndSettle();
}
