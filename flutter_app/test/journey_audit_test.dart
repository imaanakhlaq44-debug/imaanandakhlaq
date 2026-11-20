import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:imaan_akhlaq/data/journey_lessons.dart';
import 'package:imaan_akhlaq/data/learning_journey.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  final output = Platform.environment['JOURNEY_AUDIT_OUTPUT'];

  test(
    'export observed Journey coverage for all curriculum levels',
    () async {
      final catalogue = await loadJourneyPreview();
      final release = await journeyReleaseHash();
      final eligible = {
        for (final lane in JourneyLane.values)
          lane: lane.eligibleLevels(catalogue).map((level) => level.id).toSet(),
      };
      final rows = <List<String>>[
        [
          'Level',
          'Title',
          'World',
          'Source unit',
          'Source PDF',
          'Source page',
          'Planned exercise',
          'Planned mastery',
          'Standard app activities',
          'Assessment in app',
          'Age routes available',
          'Audio availability',
          'Priority follow-up',
          'Editorial status',
          'Package ID',
        ],
      ];
      final counts = <String, int>{};

      for (final level in catalogue) {
        final stations = await JourneyLesson.loadStations(level, catalogue);
        final exercise = level.brief['activity']!;
        final lower = exercise.toLowerCase();
        final hasAudio = stations.any((lesson) => lesson.listeningClip != null);
        final hasSequence = stations.any(
          (lesson) =>
              lesson.verses.length > 1 || lesson.practice?.inOrder == true,
        );
        final hasCompare =
            level.comparison ||
            stations.any(
              (lesson) => lesson.practice?.explanations.isNotEmpty ?? false,
            );
        final needsListening = RegExp(
          r'\b(audio|sound|listen|echo)\b',
        ).hasMatch(lower);
        final needsPictures = RegExp(
          r'\b(picture|illustrated|visual)\b',
        ).hasMatch(lower);
        final needsOrder = RegExp(
          r'\b(sequence|in order|order two|reconstruct)\b',
        ).hasMatch(lower);
        final needsComparison =
            lower.startsWith('compare') || lower.contains('compare/sort');
        final followUp = [
          if (needsListening && !hasAudio) 'Supply and attach recordings',
          if (needsPictures && level.id != 'IA-0001')
            'Check and supply lesson-specific pictures',
          if (needsOrder && !hasSequence)
            'Build or verify the requested sequence using source cards',
          if (needsComparison && !hasCompare)
            'Build or verify the requested comparison',
          if (level.checkpoint) 'Check cumulative mastery and marking criteria',
          if (stations.any((lesson) => lesson.revealAnswer))
            'Check whether a scored question is required',
          if (lower.contains('adult verification'))
            'Supply or verify the approved meaning guide and record adult verification separately',
        ];
        final observed = <String>{
          if (level.comparison) 'Two-source matching',
          if (level.number == 1000)
            'Eight selectable stations and a final case',
          if (level.cumulative && level.number != 1000)
            'Cumulative practice stations',
          for (final lesson in stations) ..._activities(lesson),
        };
        final status = followUp.isEmpty
            ? 'Exercise and rubric need manual comparison'
            : followUp.join(' | ');
        counts[followUp.isEmpty ? 'manual comparison' : 'specific flags'] =
            (counts[followUp.isEmpty
                    ? 'manual comparison'
                    : 'specific flags'] ??
                0) +
            1;
        rows.add([
          level.id,
          level.title,
          level.world,
          level.sourceUnit,
          level.brief['sourcePdf']!,
          level.brief['sourcePages']!,
          exercise,
          level.brief['mastery']!,
          observed.join(' | '),
          stations.map((lesson) => lesson.question).join(' | '),
          eligible.entries
              .where((entry) => entry.value.contains(level.id))
              .map((entry) => entry.key.ages)
              .join(' | '),
          hasAudio
              ? 'Recitation file reference present; check playback and rights'
              : needsListening
              ? 'Requested media not connected'
              : 'No listening clip in Journey',
          status,
          'Qualified review and signoff pending',
          release,
        ]);
      }

      expect(rows, hasLength(1001));
      final csv =
          '\uFEFF${rows.map((row) => row.map(_csvCell).join(',')).join('\r\n')}\r\n';
      await File(output!).writeAsString(csv, flush: true);
      // ignore: avoid_print
      print('Audited ${rows.length - 1} levels: $counts');
    },
    skip: output == null || output.isEmpty,
  );
}

Iterable<String> _activities(JourneyLesson lesson) sync* {
  if (lesson.listeningClip != null) yield 'Ayah audio matching';
  if (lesson.verses.length > 1) yield 'Ayah ordering';
  if (lesson.practice case final JourneyPractice practice) {
    final type = practice.inOrder
        ? 'Ordering'
        : practice.recall
        ? 'Guided recall or discussion'
        : practice.explanations.isNotEmpty
        ? 'Compare decisions'
        : 'Match or choose';
    yield '$type — ${practice.prompt}';
  }
  yield lesson.revealAnswer
      ? 'Reveal and reflect'
      : 'Knowledge or decision check';
}

String _csvCell(String value) {
  final safe = RegExp(r'^\s*[=+\-@]').hasMatch(value) ? "'$value" : value;
  return '"${safe.replaceAll('"', '""')}"';
}
