import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// The bundled course framework, generated word for word from the tables of
/// Imaan_Akhlaq_Masnun_Quran_Recitation_Hifz_Developer_Framework.docx.
///
/// The source gives ayah REFERENCES only. It contains no Arabic Qur'an text,
/// meanings or audio, so none is stored here: see README.md in this folder.
const quranFrameworkAsset = 'assets/data/courses/quran-framework.json';

/// A position in the Qur'an, compared by surah then ayah (never by title).
@immutable
class AyahRef implements Comparable<AyahRef> {
  const AyahRef(this.surah, this.ayah);
  factory AyahRef.parse(String text) {
    final parts = text.split(':');
    if (parts.length != 2) throw FormatException('Bad ayah reference', text);
    return AyahRef(int.parse(parts[0]), int.parse(parts[1]));
  }
  final int surah, ayah;
  @override
  int compareTo(AyahRef other) =>
      surah != other.surah ? surah - other.surah : ayah - other.ayah;
  bool operator <=(AyahRef other) => compareTo(other) <= 0;
  @override
  bool operator ==(Object other) =>
      other is AyahRef && other.surah == surah && other.ayah == ayah;
  @override
  int get hashCode => Object.hash(surah, ayah);
  @override
  String toString() => '$surah:$ayah';
}

/// A contiguous range inside one surah, e.g. "2:285-286" or "2:255".
@immutable
class AyahRange {
  const AyahRange(this.surah, this.from, this.to);
  factory AyahRange.parse(String text) {
    final parts = text.split(':');
    if (parts.length != 2) throw FormatException('Bad ayah range', text);
    final ayahs = parts[1].split('-');
    final from = int.parse(ayahs.first);
    final to = int.parse(ayahs.last);
    if (to < from || from < 1) throw FormatException('Bad ayah range', text);
    return AyahRange(int.parse(parts[0]), from, to);
  }
  final int surah, from, to;
  AyahRef get start => AyahRef(surah, from);
  AyahRef get end => AyahRef(surah, to);
  int get count => to - from + 1;

  /// Ordered ayah ids, e.g. 112:1, 112:2, 112:3, 112:4.
  List<AyahRef> get ayahs => [
    for (var a = from; a <= to; a++) AyahRef(surah, a),
  ];
  bool contains(AyahRange other) =>
      other.surah == surah && other.from >= from && other.to <= to;

  /// Display form with an en dash, as the source writes it.
  String get label => from == to ? '$surah:$from' : '$surah:$from–$to';
  @override
  bool operator ==(Object other) =>
      other is AyahRange &&
      other.surah == surah &&
      other.from == from &&
      other.to == to;
  @override
  int get hashCode => Object.hash(surah, from, to);
  @override
  String toString() => label;
}

class CatalogueLabel {
  const CatalogueLabel(this.id, this.name, this.meaning, this.rule);
  final String id, name, meaning, rule;
}

class Experience {
  const Experience(this.id, this.name, this.users, this.pacing);
  final String id, name, users, pacing;
}

class LessonStep {
  const LessonStep(this.name, this.text);
  final String name, text;
}

class PracticeMode {
  const PracticeMode(this.name, this.action, this.use);
  final String name, action, use;
}

class ReviewOutcome {
  const ReviewOutcome(this.id, this.after, this.result, this.next);
  final String id, after, result, next;
}

class RevisionPolicy {
  const RevisionPolicy({
    required this.intervalsDays,
    required this.note,
    required this.outcomes,
    required this.mastery,
    required this.masteryNote,
  });
  final List<int> intervalsDays;
  final String note, masteryNote;
  final List<ReviewOutcome> outcomes;

  /// "Practicing" → "Can Recite with Help" → "Can Recite Independently" →
  /// "Retained After Review", in the source's words.
  final List<String> mastery;
}

class MasnunEntry {
  const MasnunEntry({
    required this.id,
    required this.range,
    required this.passageId,
    required this.title,
    required this.juz,
    required this.context,
    required this.source,
    required this.sourceUrl,
  });
  final String id, passageId, title, context, source, sourceUrl;
  final AyahRange range;
  final int juz;
}

class JuzSelection {
  const JuzSelection(this.range, this.label, this.passageId, this.continuation);
  final AyahRange range;
  final String label, passageId;

  /// Set when one surah lesson spans two Juz (Yā-Sīn 36:1–27 / 36:28–83).
  final String? continuation;
}

class JuzInfo {
  const JuzInfo(this.number, this.start, this.end, this.focus, this.selections);
  final int number;
  final AyahRef start, end;
  final String focus;
  final List<JuzSelection> selections;
  bool containsRef(AyahRef r) => start <= r && r <= end;
  bool containsRange(AyahRange r) => containsRef(r.start) && containsRef(r.end);
  bool overlaps(AyahRange r) => start <= r.end && r.start <= end;
}

class Juz30Surah {
  const Juz30Surah(this.surah, this.name, this.range, this.ayahCount, this.id);
  final int surah, ayahCount;
  final String name, id;
  final AyahRange range;
}

class RoadPhase {
  const RoadPhase({
    required this.phase,
    required this.principle,
    required this.order,
    required this.orderPending,
    required this.passageIds,
  });
  final String phase, principle, order;

  /// The source leaves this order to an editor ("editor-approved order",
  /// "remaining long surahs"), so the app says so instead of inventing one.
  final bool orderPending;
  final List<String> passageIds;
}

class QuranPassage {
  const QuranPassage({
    required this.id,
    required this.range,
    required this.title,
    required this.labels,
    required this.juz,
    this.masnunId,
    this.chunks = const [],
    this.chunkNote,
    this.publicationRule,
    this.juzPlacement,
    this.storyboardTheme,
  });
  final String id;
  final AyahRange range;

  /// Name as the source gives it, or null for a reference-only selection.
  final String? title;
  final List<String> labels;
  final List<int> juz;
  final String? masnunId,
      chunkNote,
      publicationRule,
      juzPlacement,
      storyboardTheme;

  /// Editor-approved chunk plan (§7), empty when the source gives none.
  final List<AyahRange> chunks;
  String get displayTitle => title ?? 'Qur’an ${range.label}';
  bool get isMasnun => labels.contains('M');
}

class QuranCourseData {
  QuranCourseData({
    required this.source,
    required this.sourceVersion,
    required this.reviewStatus,
    required this.editorialNote,
    required this.implementationDecision,
    required this.proficiencyNote,
    required this.masnunNote,
    required this.coverageNote,
    required this.labels,
    required this.experiences,
    required this.steps,
    required this.modes,
    required this.revision,
    required this.masnun,
    required this.juz,
    required this.juz30,
    required this.road,
    required List<QuranPassage> passages,
  }) : passages = {for (final p in passages) p.id: p};

  final String source,
      sourceVersion,
      reviewStatus,
      editorialNote,
      implementationDecision,
      proficiencyNote,
      masnunNote,
      coverageNote;
  final List<CatalogueLabel> labels;
  final List<Experience> experiences;
  final List<LessonStep> steps;
  final List<PracticeMode> modes;
  final RevisionPolicy revision;
  final List<MasnunEntry> masnun;
  final List<JuzInfo> juz;
  final List<Juz30Surah> juz30;
  final List<RoadPhase> road;

  /// Every passage by id, in canonical surah/ayah order.
  final Map<String, QuranPassage> passages;

  QuranPassage passage(String id) =>
      passages[id] ?? (throw StateError('Unknown passage $id'));
  CatalogueLabel label(String id) => labels.firstWhere((l) => l.id == id);
  MasnunEntry? masnunFor(QuranPassage p) =>
      masnun.where((m) => m.passageId == p.id).firstOrNull;

  /// Passages in the learning road, in pedagogical (not Qur'anic) order.
  List<QuranPassage> get roadPassages => [
    for (final phase in road)
      for (final id in phase.passageIds) passage(id),
  ];

  factory QuranCourseData.fromJson(Map<String, dynamic> j) {
    List<Map<String, dynamic>> list(String k) =>
        (j[k] as List).map((e) => Map<String, dynamic>.from(e)).toList();
    final juz = [
      for (final m in list('juz'))
        JuzInfo(
          m['juz'] as int,
          AyahRef.parse(m['start'] as String),
          AyahRef.parse(m['end'] as String),
          m['focus'] as String,
          [
            for (final s in (m['selections'] as List).cast<Map>())
              JuzSelection(
                AyahRange.parse(s['range'] as String),
                s['label'] as String,
                s['passage'] as String,
                s['continuation'] as String?,
              ),
          ],
        ),
    ];
    final rev = Map<String, dynamic>.from(j['revision'] as Map);
    return QuranCourseData(
      source: j['source'] as String,
      sourceVersion: j['sourceVersion'] as String,
      reviewStatus: j['reviewStatus'] as String,
      editorialNote: j['editorialNote'] as String,
      implementationDecision: j['implementationDecision'] as String,
      proficiencyNote: j['proficiencyNote'] as String,
      masnunNote: j['masnunNote'] as String,
      coverageNote: j['coverageNote'] as String,
      labels: [
        for (final m in list('labels'))
          CatalogueLabel(
            m['id'] as String,
            m['name'] as String,
            m['meaning'] as String,
            m['rule'] as String,
          ),
      ],
      experiences: [
        for (final m in list('experiences'))
          Experience(
            m['id'] as String,
            m['name'] as String,
            m['users'] as String,
            m['pacing'] as String,
          ),
      ],
      steps: [
        for (final m in list('steps'))
          LessonStep(m['name'] as String, m['text'] as String),
      ],
      modes: [
        for (final m in list('modes'))
          PracticeMode(
            m['name'] as String,
            m['action'] as String,
            m['use'] as String,
          ),
      ],
      revision: RevisionPolicy(
        intervalsDays: (rev['intervalsDays'] as List).cast<int>(),
        note: rev['note'] as String,
        masteryNote: rev['masteryNote'] as String,
        mastery: (rev['mastery'] as List).cast<String>(),
        outcomes: [
          for (final o in (rev['outcomes'] as List).cast<Map>())
            ReviewOutcome(
              o['id'] as String,
              o['after'] as String,
              o['result'] as String,
              o['next'] as String,
            ),
        ],
      ),
      masnun: [
        for (final m in list('masnun'))
          MasnunEntry(
            id: m['id'] as String,
            range: AyahRange.parse(m['range'] as String),
            passageId: m['passage'] as String,
            title: m['title'] as String,
            juz: m['juz'] as int,
            context: m['context'] as String,
            source: m['source'] as String,
            sourceUrl: m['sourceUrl'] as String,
          ),
      ],
      juz: juz,
      juz30: [
        for (final m in list('juz30'))
          Juz30Surah(
            m['surah'] as int,
            m['name'] as String,
            AyahRange.parse(m['range'] as String),
            m['ayahCount'] as int,
            m['passage'] as String,
          ),
      ],
      road: [
        for (final m in list('road'))
          RoadPhase(
            phase: m['phase'] as String,
            principle: m['principle'] as String,
            order: m['order'] as String,
            orderPending: m['orderPending'] == true,
            passageIds: (m['passages'] as List).cast<String>(),
          ),
      ],
      passages: [
        for (final m in list('passages'))
          () {
            final range = AyahRange.parse(m['range'] as String);
            return QuranPassage(
              id: m['id'] as String,
              range: range,
              title: m['title'] as String?,
              labels: (m['labels'] as List).cast<String>(),
              // Juz tags come from the canonical boundaries, so a passage
              // crossing two Juz (Yā-Sīn) carries both.
              juz: [
                for (final z in juz)
                  if (z.overlaps(range)) z.number,
              ],
              masnunId: m['masnun'] as String?,
              chunks: [
                for (final c in (m['chunks'] as List? ?? const []))
                  AyahRange.parse(c as String),
              ],
              chunkNote: m['chunkNote'] as String?,
              publicationRule: m['publicationRule'] as String?,
              juzPlacement: m['juzPlacement'] as String?,
              storyboardTheme: m['storyboardTheme'] as String?,
            );
          }(),
      ],
    );
  }

  static QuranCourseData? _loaded;
  static Future<QuranCourseData>? _loading;
  static Future<QuranCourseData> load() {
    if (_loaded != null) return SynchronousFuture(_loaded!);
    return _loading ??= rootBundle
        .loadString(quranFrameworkAsset)
        .then(
          (t) => _loaded = QuranCourseData.fromJson(
            Map<String, dynamic>.from(jsonDecode(t) as Map),
          ),
        )
        .catchError((Object e) {
          _loading = null; // allow Retry after a failed read
          throw e;
        });
  }
}
