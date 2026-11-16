import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:imaan_akhlaq/courses/quran/quran_data.dart';
import 'package:imaan_akhlaq/courses/quran/quran_text.dart';
import 'package:imaan_akhlaq/courses/quran/recitation_view.dart';

Map<String, dynamic> _json(String path) =>
    jsonDecode(File(path).readAsStringSync()) as Map<String, dynamic>;

void main() {
  final raw = _json('assets/data/courses/quran-text.json');
  final text = QuranText.parse(raw);

  test('the imported text matches its checksum, so no letter changed', () {
    final verses = Map<String, dynamic>.from(raw['verses'] as Map);
    final body = verses.entries
        .map((e) => '${e.key}\t${(e.value as Map)['text']}')
        .join('\n');
    expect(sha256.convert(utf8.encode(body)).toString(), raw['checksum']);
    expect(raw['count'], verses.length);
  });

  test('every passage of the course has its text and recitation', () {
    final framework = _json('assets/data/courses/quran-framework.json');
    for (final p in framework['passages'] as List) {
      for (final part in (p['range'] as String).split(RegExp(r'[,;] ?'))) {
        final r = AyahRange.parse(part.trim());
        final verses = text.of(r);
        expect(verses.length, r.count, reason: '${p['id']} $part');
        for (final v in verses) {
          expect(v.words, isNotEmpty, reason: v.key);
          expect(v.timing.length, v.words.length, reason: v.key);
          expect(v.audio, startsWith('https://'), reason: v.key);
          expect(v.audio, contains('Husary_Muallim'), reason: v.key);
        }
      }
    }
  });

  test('the app shows the full verse text, and every word can light up', () {
    for (final v in text.verses.values) {
      // What is shown is the published text itself, not the word list,
      // which can drop small tajweed marks (e.g. 2:2).
      expect(
        v.tokens.join(' '),
        v.text.trim().replaceAll(RegExp(r'\s+'), ' '),
        reason: v.key,
      );
      final mapped = v.tokenWords.whereType<int>().toList();
      expect(mapped, List.generate(v.words.length, (i) => i), reason: v.key);
    }
  });

  testWidgets('Listen plays the passage ayah by ayah, repeating as chosen', (
    tester,
  ) async {
    final audio = SilentAyahAudio();
    final previous = AyahAudio.create;
    AyahAudio.create = () => audio;
    addTearDown(() => AyahAudio.create = previous);
    final ikhlas = text.of(AyahRange.parse('112:1-4'));
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(
            child: RecitationView(verses: ikhlas, reciter: text.reciter),
          ),
        ),
      ),
    );
    expect(find.byKey(const Key('quran-text-112:1')), findsOneWidget);

    await tester.tap(find.byKey(const Key('quran-play')));
    await tester.pump();
    expect(audio.played, [ikhlas[0].audio]);
    for (var i = 0; i < 4; i++) {
      audio.finish();
      await tester.pump();
    }
    expect(audio.played, [for (final v in ikhlas) v.audio]);

    // Tap one ayah with ×3: it plays three times, then stops.
    audio.played.clear();
    await tester.tap(find.text('×3'));
    await tester.pump();
    await tester.tap(find.byKey(const Key('quran-ayah-112:2')));
    await tester.pump();
    for (var i = 0; i < 3; i++) {
      audio.finish();
      await tester.pump();
    }
    expect(audio.played, List.filled(3, ikhlas[1].audio));
  });

  testWidgets('controls fit a small phone while playing, with large text', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 700);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    final audio = SilentAyahAudio();
    final previous = AyahAudio.create;
    AyahAudio.create = () => audio;
    addTearDown(() => AyahAudio.create = previous);
    await tester.pumpWidget(
      MaterialApp(
        home: MediaQuery(
          data: const MediaQueryData(
            size: Size(320, 700),
            textScaler: TextScaler.linear(1.5),
          ),
          child: Scaffold(
            body: SingleChildScrollView(
              child: RecitationView(
                verses: text.of(AyahRange.parse('1:1-7')),
                reciter: text.reciter,
              ),
            ),
          ),
        ),
      ),
    );
    await tester.tap(find.byKey(const Key('quran-play')));
    await tester.pump();
    expect(find.byKey(const Key('quran-stop')), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  test('the word under the recitation is found from the timings', () {
    final v = text.verses['112:1']!;
    final (start, end) = v.timing.first!;
    expect(v.wordAt(start), 0);
    expect(v.wordAt(end + 1), isNot(0));
  });
}
