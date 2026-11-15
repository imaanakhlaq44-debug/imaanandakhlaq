import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:imaan_akhlaq/rewards/rewards.dart';

void main() {
  late MemoryRewardStorage storage;
  late DateTime now;
  late Rewards rewards;

  setUp(() {
    storage = MemoryRewardStorage();
    now = DateTime(2026, 11, 16, 10);
    rewards = Rewards(storage: storage, clock: () => now);
  });

  test('a finished item earns stars once, fewer for mistakes', () async {
    await rewards.use('kid-1');
    final a = await rewards.finish(course: 'duas', item: 'dua-01');
    expect(a!.stars, 3);
    expect(await rewards.finish(course: 'duas', item: 'dua-01'), isNull);
    final b = await rewards.finish(course: 'ibrah', item: 'v1/m1', mistakes: 1);
    expect(b!.stars, 2);
    final c = await rewards.finish(course: 'ibrah', item: 'v1/m2', mistakes: 9);
    expect(c!.stars, 1, reason: 'every finished step is worth a star');
    expect(rewards.state.stars, 6);
  });

  test('finishing every item of a group earns its badge once', () async {
    await rewards.use('kid-1');
    const items = ['m1', 'm2'];
    final first = await rewards.finish(
      course: 'salah',
      item: 'm1',
      group: 'w1',
      groupTitle: 'Getting Ready',
      groupItems: items,
    );
    expect(first!.badge, isNull);
    final second = await rewards.finish(
      course: 'salah',
      item: 'm2',
      group: 'w1',
      groupTitle: 'Getting Ready',
      groupItems: items,
    );
    expect(second!.badge?.title, 'Getting Ready');
    expect(rewards.state.badges.single.id, 'salah/w1');
  });

  test('streak grows once a day and lapses after a missed day', () async {
    await rewards.use('kid-1');
    await rewards.finish(course: 'duas', item: 'a');
    await rewards.finish(course: 'duas', item: 'b');
    expect(rewards.state.streakOn(now), 1);
    now = now.add(const Duration(days: 1));
    final next = await rewards.finish(course: 'duas', item: 'c');
    expect(next!.streak, 2);
    expect(next.streakGrew, isTrue);
    now = now.add(const Duration(days: 2));
    expect(rewards.state.streakOn(now), 0);
    final again = await rewards.finish(course: 'duas', item: 'd');
    expect(again!.streak, 1);
    expect(rewards.state.bestStreak, 2);
  });

  test('rewards are kept per learner and survive a reload', () async {
    await rewards.use('kid-1');
    await rewards.finish(course: 'tafsir', item: '01-01');
    await rewards.use('kid-2');
    expect(rewards.state.stars, 0);
    final reloaded = Rewards(storage: storage, clock: () => now);
    await reloaded.use('kid-1');
    expect(reloaded.state.stars, 3);
    final saved = jsonDecode(storage.data.values.first) as Map;
    expect(saved['version'], 1);
  });

  test('broken storage never blocks learning', () async {
    final broken = Rewards(storage: _Broken(), clock: () => now);
    await broken.use('kid-1');
    final r = await broken.finish(course: 'duas', item: 'x');
    expect(r!.stars, 3);
  });
}

class _Broken implements RewardStorage {
  @override
  Future<String?> read(String key) async => throw StateError('no disk');
  @override
  Future<void> write(String key, String value) async =>
      throw StateError('no disk');
}
