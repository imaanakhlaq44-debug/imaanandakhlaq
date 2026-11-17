import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:google_sign_in/google_sign_in.dart';
import '../domain.dart';
import '../teacher_domain.dart';
import '../admin_domain.dart';
import 'registration.dart';

abstract class AppRepository {
  /// Everyone attached to [schoolId] (students, teachers, families), live.
  Stream<List<SchoolMember>> schoolMembers(String schoolId);

  // School admin actions. Each goes through the same Cloud Function the web
  // admin dashboard uses, so the server checks the caller and the school.
  Future<Handover> createTeacher({
    required String name,
    String phone,
    String classId,
  });
  Future<Handover> resetTeacherPassword(SchoolMember teacher);
  Future<void> deleteTeacher(SchoolMember teacher);
  Future<Handover> createFamily({required String name, String phone});
  Future<Handover> resetFamilyPassword(SchoolMember family);

  /// Adds a student; returns the STU- code a family can redeem.
  Future<String> createStudent({
    required String name,
    String classId,
    String familyUid,
  });
  Future<void> attachChild({
    required SchoolMember student,
    required SchoolMember family,
  });

  /// Every student of [schoolId], live. Staff only (rules filter on school).
  Stream<List<RosterStudent>> schoolStudents(String schoolId);

  /// Every activity sheet of [schoolId] as (document id, data), live.
  Stream<List<(String, Map<String, dynamic>)>> schoolSubmissions(
    String schoolId,
  );

  /// Approves a sheet (awarding [reviewPoints] once) or sends it back with
  /// [note]. Sending back requires a note.
  Future<void> reviewSheet({
    required Profile teacher,
    required ReviewItem item,
    required bool approve,
    required String note,
  });

  Future<bool> register(RegistrationRequest request);
  Stream<String?> authChanges();
  Future<void> signIn(String login, String password);

  /// Emails a password-reset link. Only for email logins; school
  /// usernames (PAR-/TCH-) are reset by the school.
  Future<void> sendPasswordReset(String email);

  /// Signs in with a Google account. A first-time Google user gets an
  /// Individual profile, like an email signup.
  Future<void> signInWithGoogle();
  Future<void> signOut();
  Stream<Profile?> profile(String uid);

  /// The separate Individual space of a school login, or null before it
  /// is started.
  Stream<Profile?> individualSpace(String uid);

  /// Starts the signed-in school login's Individual space.
  Future<void> startIndividualSpace({required String name});
  Stream<List<Profile>> children(String familyUid);
  Future<void> claimChild(String code);
  Future<Map<String, dynamic>?> submission(String learnerUid, String chapterId);
  Future<void> saveActivity(
    Profile account,
    Profile learner,
    Book book,
    Chapter chapter,
    String answer,
    List<int> cells, {
    required bool submit,
  });
}

class FirebaseRepository implements AppRepository {
  @override
  Future<bool> register(RegistrationRequest request) async {
    request.validate();
    final gateway = await FirebaseRegistrationGateway.open();
    return const RegistrationService().register(
      request,
      gateway,
      schoolId: db.collection('schools').doc().id,
      schoolCode: newSchoolCode(),
    );
  }

  @override
  Stream<List<SchoolMember>> schoolMembers(String schoolId) => db
      .collection('users')
      .where('school_id', isEqualTo: schoolId)
      .snapshots()
      .map((query) {
        final members = [
          for (final doc in query.docs) SchoolMember.fromMap(doc.id, doc.data()),
        ];
        members.sort(
          (a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()),
        );
        return members;
      });

  Future<Map<String, dynamic>> _call(
    String name,
    Map<String, dynamic> data,
  ) async {
    final result = await functions
        .httpsCallable(name)
        .call<Map<String, dynamic>>(data);
    return Map<String, dynamic>.from(result.data);
  }

  Handover _handover(Map<String, dynamic> r, String name, String kind) =>
      Handover(
        name: name,
        username: '${r['username'] ?? ''}',
        password: '${r['password'] ?? ''}',
        kind: kind,
      );

  @override
  Future<Handover> createTeacher({
    required String name,
    String phone = '',
    String classId = '',
  }) async => _handover(
    await _call('createTeacherAccount', {
      'name': name.trim(),
      if (phone.trim().isNotEmpty) 'phone': phone.trim(),
      if (classId.trim().isNotEmpty) 'class_id': classId.trim(),
    }),
    name.trim(),
    'Teacher',
  );

  @override
  Future<Handover> resetTeacherPassword(SchoolMember teacher) async =>
      _handover(
        await _call('resetTeacherPassword', {'teacher_uid': teacher.uid}),
        teacher.name,
        'Teacher',
      );

  @override
  Future<void> deleteTeacher(SchoolMember teacher) async {
    await _call('deleteTeacherAccount', {'teacher_uid': teacher.uid});
  }

  @override
  Future<Handover> createFamily({
    required String name,
    String phone = '',
  }) async => _handover(
    await _call('createFamilyAccount', {
      'name': name.trim(),
      if (phone.trim().isNotEmpty) 'phone': phone.trim(),
    }),
    name.trim(),
    'Family',
  );

  @override
  Future<Handover> resetFamilyPassword(SchoolMember family) async => _handover(
    await _call('resetFamilyPassword', {'family_uid': family.uid}),
    family.name,
    'Family',
  );

  @override
  Future<String> createStudent({
    required String name,
    String classId = '',
    String familyUid = '',
  }) async {
    final r = await _call('createChild', {
      'name': name.trim(),
      'class_id': classId.trim(),
      if (familyUid.isNotEmpty) 'family_uid': familyUid,
    });
    return '${r['code'] ?? ''}';
  }

  @override
  Future<void> attachChild({
    required SchoolMember student,
    required SchoolMember family,
  }) async {
    await _call('attachChildToFamily', {
      'child_uid': student.uid,
      'family_uid': family.uid,
    });
  }

  @override
  Stream<List<RosterStudent>> schoolStudents(String schoolId) => db
      .collection('users')
      .where('school_id', isEqualTo: schoolId)
      .snapshots()
      .map((query) {
        final students = query.docs
            .where((doc) => doc.data()['role'] == 'student')
            .map((doc) => RosterStudent.fromMap(doc.id, doc.data()))
            .toList();
        students.sort(
          (a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()),
        );
        return students;
      });

  @override
  Stream<List<(String, Map<String, dynamic>)>> schoolSubmissions(
    String schoolId,
  ) => db
      .collection('activity_submissions')
      .where('school_id', isEqualTo: schoolId)
      .snapshots()
      .map((query) => [for (final doc in query.docs) (doc.id, doc.data())]);

  @override
  Future<void> reviewSheet({
    required Profile teacher,
    required ReviewItem item,
    required bool approve,
    required String note,
  }) async {
    final trimmed = note.trim();
    if (auth.currentUser?.uid != teacher.uid || !canReview(teacher)) {
      throw StateError('Please sign in again with your teacher account.');
    }
    if (!approve && trimmed.isEmpty) {
      throw const FormatException(
        'Write a short note so the family knows what to fix.',
      );
    }
    if (trimmed.length > 500) {
      throw const FormatException('Keep the note under 500 characters.');
    }
    final studentRef = db.collection('users').doc(item.student.uid);
    final sheetRef = db
        .collection('activity_submissions')
        .doc(item.submissionId);
    final now = DateTime.now().toUtc().toIso8601String();
    // One transaction, so points and the sheet's status never disagree and a
    // second teacher approving the same sheet cannot award points twice.
    await db.runTransaction((tx) async {
      final student = await tx.get(studentRef);
      final sheet = await tx.get(sheetRef);
      if (!student.exists || !sheet.exists) {
        throw StateError(
          'This sheet is no longer available. Pull down to refresh.',
        );
      }
      final data = sheet.data()!;
      if (data['school_id'] != teacher.schoolId ||
          student.data()!['school_id'] != teacher.schoolId) {
        throw StateError('This learner is not in your school.');
      }
      if (data['reviewStatus'] == 'teacher_approved') {
        throw StateError('Another teacher has already approved this sheet.');
      }
      final game = student.data()!['game_state'];
      if (approve) {
        tx.update(studentRef, {
          'game_state': approvedGameState(game, item.chapterId),
        });
        tx.update(sheetRef, {
          'reviewStatus': 'teacher_approved',
          'teacherNotes': trimmed,
          'teacherApprovedAt': now,
          'teacherApprovedBy': teacher.uid,
          'updatedAt': now,
        });
      } else {
        tx.update(studentRef, {
          'game_state': sentBackGameState(game, item.chapterId),
        });
        tx.update(sheetRef, {
          'reviewStatus': 'needs_redo',
          'teacherNotes': trimmed,
          'teacherReviewedAt': now,
          'teacherApprovedAt': null,
          'updatedAt': now,
        });
      }
    });
  }

  FirebaseRepository(this.auth, this.db, this.functions);
  final FirebaseAuth auth;
  final FirebaseFirestore db;
  final FirebaseFunctions functions;
  @override
  Stream<String?> authChanges() =>
      auth.authStateChanges().map((user) => user?.uid);
  @override
  Future<void> signIn(String login, String password) async {
    await auth.signInWithEmailAndPassword(
      email: loginEmail(login),
      password: password,
    );
  }

  @override
  Future<void> sendPasswordReset(String email) =>
      auth.sendPasswordResetEmail(email: email.trim());

  /// The project's Web OAuth client (public identifier, not a secret).
  static const googleWebClientId = String.fromEnvironment(
    'GOOGLE_WEB_CLIENT_ID',
    defaultValue:
        '373650938167-tqhaqlg7cso84k1n25o8c7gbkhsr67o3.apps.googleusercontent.com',
  );
  static Future<void>? _googleReady;

  @override
  Future<void> signInWithGoogle() async {
    final UserCredential result;
    if (kIsWeb) {
      result = await auth.signInWithPopup(GoogleAuthProvider());
    } else {
      final google = GoogleSignIn.instance;
      await (_googleReady ??= google.initialize(
        serverClientId: googleWebClientId,
      ));
      final account = await google.authenticate();
      final idToken = account.authentication.idToken;
      if (idToken == null) {
        throw StateError('Google sign-in did not finish. Please try again.');
      }
      result = await auth.signInWithCredential(
        GoogleAuthProvider.credential(idToken: idToken),
      );
    }
    final user = result.user!;
    final doc = db.collection('users').doc(user.uid);
    if (!(await doc.get()).exists) {
      // Same shape as an email signup; trial_end is stamped server-side.
      await doc.set({
        'role': 'individual',
        'name': (user.displayName ?? '').trim().isEmpty
            ? (user.email ?? 'Learner').split('@').first
            : user.displayName!.trim(),
        'email': user.email ?? '',
        'phone': '',
      });
    }
  }

  @override
  Future<void> signOut() async {
    await auth.signOut();
    if (!kIsWeb && _googleReady != null) {
      try {
        await GoogleSignIn.instance.signOut();
      } catch (_) {}
    }
  }
  @override
  Stream<Profile?> profile(String uid) => db
      .collection('users')
      .doc(uid)
      .snapshots()
      .map((doc) => doc.exists ? Profile.fromMap(doc.id, doc.data()!) : null);
  @override
  Stream<Profile?> individualSpace(String uid) => db
      .collection('individual_spaces')
      .doc(uid)
      .snapshots()
      .map((doc) => doc.exists ? Profile.space(doc.id, doc.data()!) : null);

  @override
  Future<void> startIndividualSpace({required String name}) async {
    final user = auth.currentUser;
    if (user == null) throw StateError('Please sign in again.');
    final trimmed = name.trim();
    if (trimmed.isEmpty || trimmed.length > 80) {
      throw const FormatException('Enter your name (1–80 characters).');
    }
    await db.collection('individual_spaces').doc(user.uid).set({
      'name': trimmed,
      'email': user.email ?? '',
      'created_at': DateTime.now().toUtc().toIso8601String(),
    });
  }

  @override
  Stream<List<Profile>> children(String familyUid) => db
      .collection('users')
      .where('family_uid', isEqualTo: familyUid)
      .snapshots()
      .map((query) {
        final children = query.docs
            .map((doc) => Profile.fromMap(doc.id, doc.data()))
            .where((p) => p.role == AccountRole.student)
            .toList();
        children.sort((a, b) => a.name.compareTo(b.name));
        return children;
      });
  @override
  Future<void> claimChild(String code) async {
    await functions.httpsCallable('claimChild').call<void>({
      'code': code.trim().toUpperCase(),
    });
  }

  Future<Map<String, dynamic>?> _ownedDocument(
    String collection,
    String id,
    String learnerUid,
  ) async {
    final uid = auth.currentUser?.uid;
    if (uid == null) {
      throw StateError('Please sign in again.');
    }
    // Missing direct document reads are denied by legacy rules. A query with
    // explicit ownership filters safely returns an empty result instead.
    Query<Map<String, dynamic>> query = db
        .collection(collection)
        .where(FieldPath.documentId, isEqualTo: id)
        .where('student_uid', isEqualTo: learnerUid);
    if (learnerUid == individualSpaceId(uid)) {
      query = query.where('owner_uid', isEqualTo: uid);
    } else if (uid != learnerUid) {
      query = query.where('family_uid', isEqualTo: uid);
    }
    final result = await query.limit(1).get();
    return result.docs.isEmpty ? null : result.docs.first.data();
  }

  @override
  Future<Map<String, dynamic>?> submission(
    String learnerUid,
    String chapterId,
  ) async {
    final docs = await Future.wait([
      _ownedDocument(
        'activity_submissions',
        '${learnerUid}_$chapterId',
        learnerUid,
      ),
      _ownedDocument(
        'activity_drafts',
        'flutter_${learnerUid}_$chapterId',
        learnerUid,
      ),
    ]);
    final submitted = docs[0], draft = docs[1];
    if (submitted?['reviewStatus'] == 'teacher_approved' ||
        submitted?['teacherApprovedAt'] != null) {
      return submitted;
    }
    if (draft != null &&
        (draft['updatedAt'] as String? ?? '').compareTo(
              submitted?['updatedAt'] as String? ?? '',
            ) >
            0) {
      return draft;
    }
    return submitted;
  }

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
    if (auth.currentUser?.uid != account.uid ||
        !ownsLearner(account, learner)) {
      throw StateError('Please sign in and choose your learner again.');
    }
    await functions
        .httpsCallable('saveLearnerActivity')
        .call<Map<String, dynamic>>({
          'learner_uid': learner.learnerId,
          'book_id': book.id,
          'chapter_id': chapter.id,
          'discussion_text': answer,
          'cells': cells,
          'submit': submit,
        });
  }
}

String friendlyError(Object error) {
  if (error is FormatException) return error.message;
  if (error is GoogleSignInException) {
    return error.code == GoogleSignInExceptionCode.canceled
        ? 'Google sign-in was cancelled.'
        : 'Google sign-in is not available right now. Please use your email.';
  }
  if (error is StateError) return error.message;
  if (error is FirebaseAuthException) {
    return switch (error.code) {
      'invalid-credential' || 'wrong-password' || 'user-not-found' =>
        'Your login or password is incorrect. Please try again.',
      'too-many-requests' =>
        'Too many attempts. Please wait a little and try again.',
      'network-request-failed' =>
        'Check your internet connection and try again.',
      'email-already-in-use' =>
        'This email already has an account (it may be your school login). '
            'Sign in with it: a school login can open its own separate '
            'Individual space. Forgot the password? Use "Forgot password?".',
      'weak-password' => 'Please choose a stronger password.',
      'invalid-email' => 'Enter a valid email address.',
      'user-disabled' => 'This account is disabled. Contact your school.',
      'popup-closed-by-user' || 'cancelled-popup-request' =>
        'Google sign-in was cancelled.',
      'account-exists-with-different-credential' =>
        'This email already has an account. Sign in with your email and password.',
      _ => 'Could not sign in. Check your details and try again.',
    };
  }
  if (error is FirebaseFunctionsException) {
    return switch (error.code) {
      'not-found' =>
        'Activity saving is not available yet. Please contact your school.',
      'failed-precondition' =>
        'This activity has been reviewed and can no longer be edited.',
      'permission-denied' =>
        'You can only edit your own learner’s actions for today.',
      _ => 'Could not save your work. Keep this screen open and try again.',
    };
  }
  if (error is FirebaseException) {
    return switch (error.code) {
      'permission-denied' =>
        'You do not have access to this content. Contact your school.',
      'unavailable' || 'deadline-exceeded' =>
        'Connection unavailable. Your changes have not been confirmed. Please retry.',
      _ => 'Could not complete this request. Please try again.',
    };
  }
  return 'Something went wrong. Please try again.';
}
