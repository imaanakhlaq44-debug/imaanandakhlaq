import 'dart:math';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';

enum RegistrationKind { individual, school }

class RegistrationRequest {
  const RegistrationRequest({
    required this.name,
    required this.email,
    required this.phone,
    required this.password,
    this.kind = RegistrationKind.individual,
    this.schoolName = '',
    this.location = '',
  });
  final String name, email, phone, password, schoolName, location;
  final RegistrationKind kind;
  void validate() {
    if (name.trim().length < 2 || name.trim().length > 80) {
      throw const FormatException('Enter your name (2–80 characters).');
    }
    if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email.trim())) {
      throw const FormatException('Enter a valid email address.');
    }
    if (!RegExp(r'^\+?[\d\s\-()]{7,20}$').hasMatch(phone.trim())) {
      throw const FormatException('Enter a valid contact number.');
    }
    if (password.length < 8) {
      throw const FormatException('Use a password with at least 8 characters.');
    }
    if (kind == RegistrationKind.school &&
        (schoolName.trim().length < 2 || schoolName.trim().length > 120)) {
      throw const FormatException('Enter your school name (2–120 characters).');
    }
  }
}

abstract class RegistrationGateway {
  Future<String> createAuth(String email, String password);
  Future<void> saveProfile(String uid, Map<String, dynamic> data);
  Future<void> saveSchool(String id, Map<String, dynamic> data);
  Future<void> sendVerification();
  Future<void> deleteProfile(String uid);
  Future<void> deleteAuth();
  Future<void> close();
}

class RegistrationService {
  const RegistrationService();
  Future<bool> register(
    RegistrationRequest request,
    RegistrationGateway gateway, {
    required String schoolId,
    required String schoolCode,
  }) async {
    String? uid;
    var profileSaved = false, ready = false;
    try {
      request.validate();
      uid = await gateway.createAuth(request.email.trim(), request.password);
      await gateway.saveProfile(uid, {
        'role': request.kind == RegistrationKind.school
            ? 'school_admin'
            : 'individual',
        'name': request.name.trim(),
        'email': request.email.trim(),
        'phone': request.phone.trim(),
        if (request.kind == RegistrationKind.school) 'school_id': schoolId,
        // trial_end is owned by setTrialOnSignup, never by this client.
      });
      profileSaved = true;
      if (request.kind == RegistrationKind.school) {
        await gateway.saveSchool(schoolId, {
          'name': request.schoolName.trim(),
          'location': request.location.trim(),
          'school_code': schoolCode,
          'admin_uid': uid,
        });
      }
      ready = true;
      try {
        await gateway.sendVerification();
        return true;
      } catch (_) {
        return false;
      }
    } catch (_) {
      // A half-created login must not strand the next signup attempt.
      if (!ready && uid != null) {
        if (profileSaved) {
          try {
            await gateway.deleteProfile(uid);
          } catch (_) {}
        }
        try {
          await gateway.deleteAuth();
        } catch (_) {}
      }
      rethrow;
    } finally {
      try {
        await gateway.close();
      } catch (_) {}
    }
  }
}

class FirebaseRegistrationGateway implements RegistrationGateway {
  FirebaseRegistrationGateway._(this.app, this.auth, this.db);
  final FirebaseApp app;
  final FirebaseAuth auth;
  final FirebaseFirestore db;
  static Future<FirebaseRegistrationGateway> open() async {
    // Use an isolated auth session: the main SessionGate must never see a
    // newly created user until their Firestore profile is complete.
    final app = await Firebase.initializeApp(
      name: 'signup-${DateTime.now().microsecondsSinceEpoch}',
      options: Firebase.app().options,
    );
    final auth = FirebaseAuth.instanceFor(app: app);
    final db = FirebaseFirestore.instanceFor(app: app);
    const host = String.fromEnvironment('FIREBASE_EMULATOR_HOST');
    if (host.isNotEmpty) {
      await auth.useAuthEmulator(host, 9099);
      db.useFirestoreEmulator(host, 8080);
    }
    return FirebaseRegistrationGateway._(app, auth, db);
  }

  @override
  Future<String> createAuth(String email, String password) async =>
      (await auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      )).user!.uid;
  @override
  Future<void> saveProfile(String uid, Map<String, dynamic> data) =>
      db.collection('users').doc(uid).set(data);
  @override
  Future<void> saveSchool(String id, Map<String, dynamic> data) =>
      db.collection('schools').doc(id).set(data);
  @override
  Future<void> sendVerification() => auth.currentUser!.sendEmailVerification();
  @override
  Future<void> deleteProfile(String uid) =>
      db.collection('users').doc(uid).delete();
  @override
  Future<void> deleteAuth() => auth.currentUser!.delete();
  @override
  Future<void> close() async {
    try {
      await auth.signOut();
    } finally {
      try {
        await db.terminate();
      } finally {
        await app.delete();
      }
    }
  }
}

String newSchoolCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  final random = Random.secure();
  return 'SCH-${List.generate(8, (_) => alphabet[random.nextInt(alphabet.length)]).join()}';
}
