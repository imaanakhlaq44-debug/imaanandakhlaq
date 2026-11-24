import 'package:flutter_test/flutter_test.dart';
import 'package:imaan_akhlaq/data/checklist_cloud.dart';
import 'package:imaan_akhlaq/rewards/habit_log.dart';
import 'package:imaan_akhlaq/rewards/prayer_log.dart';
import 'package:imaan_akhlaq/rewards/rewards.dart';

void main() {
  late MemoryChecklistCloud cloud;
  late DateTime now;

  setUp(() {
    cloud = MemoryChecklistCloud('kid-1');
    now = DateTime(2026, 11, 25, 18);
  });

  HabitLog device(MemoryRewardStorage storage) =>
      HabitLog('quran', items: 3, storage: storage, clock: () => now);

  test('a tick reaches the server and shows on another device', () async {
    final phone = device(MemoryRewardStorage());
    await phone.use('kid-1', cloud: cloud);
    await phone.toggle('recite');
    await phone.toggle('listen');
    expect(cloud.days['2026-11-25']!['quran'], {'recite', 'listen'});
    expect(phone.pendingDays, isEmpty);

    final tablet = device(MemoryRewardStorage());
    await tablet.use('kid-1', cloud: cloud);
    expect(tablet.record.on(now), {'recite', 'listen'});
  });

  test('offline ticks are kept and sent on the next visit', () async {
    final storage = MemoryRewardStorage();
    final phone = device(storage);
    cloud.offline = true;
    await phone.use('kid-1', cloud: cloud);
    await phone.toggle('recite');
    expect(phone.record.countOn(now), 1, reason: 'the child can always tick');
    expect(phone.pendingDays, {'2026-11-25'});

    cloud.offline = false;
    final later = device(storage);
    await later.use('kid-1', cloud: cloud);
    expect(cloud.days['2026-11-25']!['quran'], {'recite'});
    expect(later.pendingDays, isEmpty);
    expect(later.record.on(now), {'recite'});
  });

  test('the server copy replaces older device data, not unsent days', () async {
    cloud.days['2026-11-24'] = {
      'quran': {'recite', 'listen', 'learn'},
    };
    final storage = MemoryRewardStorage();
    final phone = device(storage);
    cloud.offline = true;
    await phone.use('kid-1', cloud: cloud);
    await phone.toggle('learn'); // today, not sent yet
    cloud.days['2026-11-25'] = {
      'quran': {'recite'},
    };
    cloud.offline = false;
    final again = device(storage);
    await again.use('kid-1', cloud: cloud);
    expect(again.record.on(DateTime(2026, 11, 24)), {
      'recite',
      'listen',
      'learn',
    });
    expect(
      again.record.on(now),
      {'learn'},
      reason: 'this device\'s newer tick wins over the server for its day',
    );
    expect(cloud.days['2026-11-25']!['quran'], {'learn'});
  });

  test('checklists for one day share the day without overwriting', () async {
    final quran = device(MemoryRewardStorage());
    final prayers = PrayerLog(storage: MemoryRewardStorage(), clock: () => now);
    await quran.use('kid-1', cloud: cloud);
    await prayers.use('kid-1', cloud: cloud);
    await quran.toggle('recite');
    await prayers.toggle(Prayer.fajr);
    expect(cloud.days['2026-11-25'], {
      'quran': {'recite'},
      'salah': {'fajr'},
    });
  });

  test('a day too old for the server stays on the device only', () async {
    final storage = MemoryRewardStorage();
    final phone = device(storage);
    cloud.offline = true;
    await phone.use('kid-1', cloud: cloud);
    await phone.toggle('recite');
    cloud.offline = false;
    now = DateTime(2026, 11, 29, 9); // four days later
    final later = device(storage);
    await later.use('kid-1', cloud: cloud);
    expect(cloud.saves, 0);
    expect(later.pendingDays, isEmpty, reason: 'not retried for ever');
    expect(later.record.on(DateTime(2026, 11, 25)), {'recite'});
  });

  test('guests stay on the device only', () async {
    final phone = device(MemoryRewardStorage());
    await phone.use('guest');
    await phone.toggle('recite');
    expect(cloud.saves, 0);
    expect(phone.pendingDays, isEmpty);
  });
}
