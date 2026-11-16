import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:imaan_akhlaq/screens/story_cards.dart';

/// Finds the story cards that carry [paragraph] word for word.
Finder storyShown(String paragraph) => find.byWidgetPredicate(
  (w) => w is StoryCards && w.paragraphs.contains(paragraph),
);

String _squash(String s) => s.replaceAll(RegExp(r'\s+'), ' ').trim();

/// Every story text in the bundled course data.
Iterable<String> _allStories() sync* {
  final dir = Directory('assets/data');
  for (final f in dir.listSync(recursive: true).whereType<File>()) {
    if (!f.path.endsWith('.json')) continue;
    Iterable<String> walk(Object? v) sync* {
      if (v is Map) {
        for (final e in v.entries) {
          if ((e.key == 'story' || e.key == 'scene') && e.value is String) {
            yield e.value as String;
          } else if (e.key == 'story' && e.value is List) {
            yield* (e.value as List).whereType<String>();
          } else {
            yield* walk(e.value);
          }
        }
      } else if (v is List) {
        for (final x in v) {
          yield* walk(x);
        }
      }
    }

    yield* walk(jsonDecode(f.readAsStringSync()));
  }
}

void main() {
  test('chunks are exact slices of whole sentences and keep every word', () {
    const text =
        'The Adhan began. Imaan stopped her game! "Shall we listen?" asked '
        'Akhlaq. They listened quietly… Then Dadi Jaan smiled.';
    final chunks = storyChunks(text, maxChars: 40);
    expect(chunks.length, greaterThan(1));
    for (final c in chunks) {
      expect(text.contains(c), isTrue, reason: c);
    }
    expect(_squash(chunks.join(' ')), _squash(text));
  });

  test('every course story splits without losing or changing a word', () {
    final stories = _allStories().toList();
    expect(stories.length, greaterThan(100));
    for (final s in stories) {
      final chunks = storyChunks(s);
      for (final c in chunks) {
        expect(s.contains(c), isTrue, reason: 'not a slice: $c');
      }
      expect(_squash(chunks.join(' ')), _squash(s), reason: s);
    }
  });

  testWidgets('cards turn with Next and Back, and can show the whole story', (
    tester,
  ) async {
    final story = [
      List.generate(
        8,
        (i) => 'Sentence number ${i + 1} of the story is here.',
      ).join(' '),
    ];
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(child: StoryCards(paragraphs: story)),
        ),
      ),
    );
    expect(find.text('Page 1 of 2'), findsOneWidget);
    expect(
      tester.widget<IconButton>(find.byKey(const Key('story-back'))).onPressed,
      isNull,
    );
    await tester.tap(find.byKey(const Key('story-next')));
    await tester.pumpAndSettle();
    expect(find.text('Page 2 of 2'), findsOneWidget);
    expect(find.byKey(const Key('story-end')), findsOneWidget);
    await tester.tap(find.byKey(const Key('story-back')));
    await tester.pumpAndSettle();
    expect(find.text('Page 1 of 2'), findsOneWidget);
    await tester.tap(find.byKey(const Key('story-cards-mode')));
    await tester.pumpAndSettle();
    expect(find.text(story.first), findsOneWidget);
  });
}
