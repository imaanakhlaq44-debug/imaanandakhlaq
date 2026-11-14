import 'package:flutter_test/flutter_test.dart';
import 'package:imaan_akhlaq/data/registration.dart';

class FakeRegistrationGateway implements RegistrationGateway {
  final calls = <String>[];
  Map<String, dynamic>? profile, school;
  String? fail;
  Future<void> step(String name) async {
    calls.add(name);
    if (fail == name) {
      throw StateError('Failed $name');
    }
  }

  @override
  Future<String> createAuth(String email, String password) async {
    await step('auth');
    return 'new-user';
  }

  @override
  Future<void> saveProfile(String uid, Map<String, dynamic> data) async {
    await step('profile');
    profile = data;
  }

  @override
  Future<void> saveSchool(String id, Map<String, dynamic> data) async {
    await step('school');
    school = data;
  }

  @override
  Future<void> sendVerification() => step('email');
  @override
  Future<void> deleteProfile(String uid) => step('delete-profile');
  @override
  Future<void> deleteAuth() => step('delete-auth');
  @override
  Future<void> close() => step('close');
}

void main() {
  const service = RegistrationService();
  const individual = RegistrationRequest(
    name: 'Parent',
    email: 'parent@example.com',
    phone: '+923001234567',
    password: 'secure-password',
  );
  test(
    'individual registration creates profile before verification and keeps trial server-owned',
    () async {
      final gateway = FakeRegistrationGateway();
      expect(
        await service.register(
          individual,
          gateway,
          schoolId: 'new-school',
          schoolCode: 'SCH-TEST',
        ),
        isTrue,
      );
      expect(gateway.calls, ['auth', 'profile', 'email', 'close']);
      expect(gateway.profile!['role'], 'individual');
      expect(gateway.profile!.containsKey('school_id'), isFalse);
      expect(gateway.profile!.containsKey('trial_end'), isFalse);
    },
  );
  test('school profile exists before the school document is created', () async {
    final gateway = FakeRegistrationGateway();
    await service.register(
      const RegistrationRequest(
        name: 'Admin',
        email: 'admin@example.com',
        phone: '+923001234567',
        password: 'secure-password',
        kind: RegistrationKind.school,
        schoolName: 'My school',
      ),
      gateway,
      schoolId: 'school-id',
      schoolCode: 'SCH-TEST',
    );
    expect(gateway.calls, ['auth', 'profile', 'school', 'email', 'close']);
    expect(gateway.profile!['school_id'], 'school-id');
    expect(gateway.school!['admin_uid'], 'new-user');
  });
  test('failed profile creation rolls back the new auth account', () async {
    final gateway = FakeRegistrationGateway()..fail = 'profile';
    await expectLater(
      service.register(individual, gateway, schoolId: '', schoolCode: ''),
      throwsStateError,
    );
    expect(gateway.calls, ['auth', 'profile', 'delete-auth', 'close']);
  });
  test('failed school creation rolls back both profile and auth', () async {
    final gateway = FakeRegistrationGateway()..fail = 'school';
    await expectLater(
      service.register(
        const RegistrationRequest(
          name: 'Admin',
          email: 'admin@example.com',
          phone: '+923001234567',
          password: 'secure-password',
          kind: RegistrationKind.school,
          schoolName: 'My school',
        ),
        gateway,
        schoolId: 'new-school',
        schoolCode: 'SCH-TEST',
      ),
      throwsStateError,
    );
    expect(gateway.calls, [
      'auth',
      'profile',
      'school',
      'delete-profile',
      'delete-auth',
      'close',
    ]);
  });
  test(
    'verification delivery failure does not delete an already-created account',
    () async {
      final gateway = FakeRegistrationGateway()..fail = 'email';
      expect(
        await service.register(
          individual,
          gateway,
          schoolId: '',
          schoolCode: '',
        ),
        isFalse,
      );
      expect(gateway.calls, ['auth', 'profile', 'email', 'close']);
    },
  );
  test(
    'invalid signup never creates an account and still closes isolated session',
    () async {
      final gateway = FakeRegistrationGateway();
      await expectLater(
        service.register(
          const RegistrationRequest(
            name: 'A',
            email: 'bad',
            phone: 'x',
            password: 'short',
          ),
          gateway,
          schoolId: '',
          schoolCode: '',
        ),
        throwsFormatException,
      );
      expect(gateway.calls, ['close']);
    },
  );
}
