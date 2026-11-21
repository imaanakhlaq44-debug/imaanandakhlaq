import 'dart:async';

import 'package:flutter/material.dart';

import '../app_theme.dart';
import '../courses/course_journey.dart';
import '../courses/quran/quran_text.dart';
import '../courses/quran/recitation_view.dart';
import '../data/journey_account.dart';
import '../data/learning_journey.dart';
import '../data/journey_lessons.dart';
import '../data/journey_urdu.dart';
import '../l10n/language.dart';
import 'journey_practice_view.dart';
import 'ui_kit.dart';

const _green = Color(0xFF145D4A);
const _cream = Color(0xFFFFF8F2);

enum _JourneyStep {
  stations,
  read,
  reflect,
  listen,
  order,
  practise,
  evidence,
  check,
  compare,
  decide,
  apply,
}

JourneyWorld _journeyWorld(JourneyLevel level) => switch (level.world) {
  'DUA' => JourneyWorld.duas,
  'HAD' => JourneyWorld.hadith,
  'HAJ' => JourneyWorld.hajj,
  'IBR' => JourneyWorld.ibrah,
  'QUR' => JourneyWorld.quran,
  'SAL' => JourneyWorld.salah,
  'TAF' => JourneyWorld.tafsir,
  _ => JourneyWorld.taleem,
};

Future<void> openLearningJourney(
  BuildContext context,
  String scope, {
  JourneyStore? store,
}) async {
  await Navigator.of(context).push<void>(
    MaterialPageRoute(
      builder: (_) => LanguageScope(
        child: JourneyScreen(store: store ?? DeviceJourneyStore(scope)),
      ),
    ),
  );
}

class JourneyScreen extends StatefulWidget {
  const JourneyScreen({
    super.key,
    required this.store,
    this.now = DateTime.now,
    this.loadCatalogue = loadJourneyPreview,
  });

  final JourneyStore store;
  final DateTime Function() now;
  final Future<List<JourneyLevel>> Function() loadCatalogue;

  @override
  State<JourneyScreen> createState() => _JourneyScreenState();
}

class _JourneyScreenState extends State<JourneyScreen> {
  late Future<List<JourneyLevel>> _loading;
  JourneyRecord _record = const JourneyRecord();
  JourneyLevel? _level;
  Future<List<JourneyLesson>>? _lesson;
  List<JourneyLesson>? _loadedStations;
  List<JourneyLevel> _catalogue = const [];
  static const _pageSize = 50;
  int _mapPage = 0;
  int _station = 0;
  int _comparisonItem = 0;
  final _ayahOrder = <int>[];
  final _completedStations = <int>{};
  int? _choice;
  _JourneyStep _step = _JourneyStep.read;
  bool _saving = false;
  bool _finished = false;
  bool _briefing = false;
  bool _reviewing = false;
  bool _practiceOnly = false;
  bool _saveFailed = false;
  bool _timeReached = false;
  Timer? _sessionTimer;
  FirebaseJourneyStore? get _accountStore => switch (widget.store) {
    final FirebaseJourneyStore store => store,
    _ => null,
  };
  JourneyPreferences get _preferences =>
      _accountStore?.preferences ?? const JourneyPreferences();
  JourneyLane? _previewLane;
  JourneyLane? get _lane => _preferences.lane ?? _previewLane;
  bool get _parentLed => _lane == JourneyLane.parentLed;
  List<JourneyLevel> get _eligible =>
      _lane?.eligibleLevels(_catalogue) ?? _catalogue;

  @override
  void initState() {
    super.initState();
    _loading = _load();
  }

  Future<List<JourneyLevel>> _load() async {
    final catalogue = await widget.loadCatalogue();
    final progress = await widget.store.load();
    if (mounted) {
      final minutes = _parentLed
          ? (_preferences.sessionMinutes == 0
                ? 3
                : _preferences.sessionMinutes.clamp(1, 3))
          : _preferences.sessionMinutes;
      _sessionTimer?.cancel();
      if (minutes > 0) {
        _sessionTimer = Timer(
          Duration(minutes: minutes),
          () => setState(() => _timeReached = true),
        );
      }
      setState(() {
        _record = progress;
        _catalogue = catalogue;
        final next = progress.next(_eligible, widget.now());
        _mapPage = next == null ? 0 : _eligible.indexOf(next) ~/ _pageSize;
      });
    }
    return catalogue;
  }

  @override
  void dispose() {
    _sessionTimer?.cancel();
    super.dispose();
  }

  void _show(JourneyLevel level, {bool practiceOnly = false}) {
    _level = level;
    _briefing = true;
    _practiceOnly = practiceOnly;
    _reviewing = !practiceOnly && _record.due(level, widget.now());
    _loadStations(level);
    _mapPage = _eligible.indexOf(level) ~/ _pageSize;
    _station = 0;
    _comparisonItem = 0;
    _ayahOrder.clear();
    _completedStations.clear();
    if (!practiceOnly) _completedStations.addAll(_record.capstoneStations);
    _choice = null;
    final delayedRecall =
        level.world == 'QUR' &&
        level.brief['activity']!.startsWith(
          'Explain the approved meaning guide',
        );
    _step = _reviewing
        ? (delayedRecall ? _JourneyStep.practise : _JourneyStep.check)
        : level.number == 1000
        ? (_completedStations.length == level.stations.length
              ? _JourneyStep.decide
              : _JourneyStep.stations)
        : _JourneyStep.read;
    _finished = false;
    _saveFailed = false;
  }

  void _loadStations(JourneyLevel level) {
    _loadedStations = null;
    final requested = JourneyLesson.loadStations(
      level,
      _catalogue,
      lane: _lane,
    );
    _lesson = requested.then((stations) {
      if (mounted && identical(_level, level)) _loadedStations = stations;
      return stations;
    });
  }

  Future<void> _finish() async {
    if (_saving || _level == null) return;
    if (_practiceOnly) {
      setState(() => _finished = true);
      return;
    }
    setState(() {
      _saving = true;
      _saveFailed = false;
    });
    final updated = _record.finish(_level!, widget.now());
    try {
      final saved = await widget.store.save(updated);
      if (!mounted) return;
      setState(() {
        _record = saved;
        _finished = true;
      });
    } catch (_) {
      if (mounted) setState(() => _saveFailed = true);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) => PopScope(
    canPop: !_saving,
    child: Scaffold(
      backgroundColor: _cream,
      appBar: AppBar(
        title: Text(tr('Learning Journey', 'سیکھنے کا سفر')),
        actions: [
          if (_level?.number == 1000 &&
              !_briefing &&
              !_reviewing &&
              !_timeReached &&
              !_finished &&
              _step != _JourneyStep.stations &&
              _completedStations.length < _level!.stations.length)
            TextButton(
              onPressed: _saving ? null : () => _go(_JourneyStep.stations),
              child: Text(tr('Stations', 'سرگرمیاں')),
            ),
          if (_level != null && !_timeReached)
            TextButton.icon(
              onPressed: _saving ? null : () => setState(() => _level = null),
              icon: const Icon(Icons.map_outlined),
              label: Text(tr('Map', 'نقشہ')),
            ),
        ],
      ),
      body: _timeReached && !_saving
          ? MessageView(
              title: tr('Time for a break', 'وقفے کا وقت'),
              message: tr(
                'This learning session has ended.',
                'یہ تعلیمی نشست ختم ہو گئی ہے۔',
              ),
              action: FilledButton(
                onPressed: () => Navigator.of(context).pop(),
                child: Text(tr('Return home', 'ہوم پر جائیں')),
              ),
            )
          : SafeArea(
              child: FutureBuilder<List<JourneyLevel>>(
                future: _loading,
                builder: (context, snapshot) {
                  if (snapshot.hasError) {
                    return MessageView(
                      title: tr('Journey unavailable', 'سفر نہیں کھل سکا'),
                      message: tr(
                        'The lessons or your saved progress could not be loaded.',
                        'اسباق یا محفوظ پیش رفت نہیں کھل سکی۔',
                      ),
                      action: OutlinedButton(
                        onPressed: () => setState(() => _loading = _load()),
                        child: Text(tr('Try again', 'دوبارہ کوشش کریں')),
                      ),
                    );
                  }
                  if (snapshot.data == null) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  final catalogue = _eligible;
                  final level = _level;
                  return ConstrainedBody(
                    maxWidth: 610,
                    child: ListView(
                      key: ValueKey((
                        level?.id,
                        _briefing,
                        _step,
                        _finished,
                        _mapPage,
                        _station,
                      )),
                      padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
                      children: [
                        if (level == null)
                          ..._map(catalogue)
                        else if (_finished)
                          ..._completion(catalogue)
                        else if (_briefing)
                          _missionBriefing(level)
                        else
                          ..._activity(level),
                      ],
                    ),
                  );
                },
              ),
            ),
    ),
  );

  List<Widget> _map(List<JourneyLevel> catalogue) {
    final now = widget.now();
    final next = _record.next(catalogue, now);
    final done = catalogue
        .where((l) => _record.levels.containsKey(l.id))
        .length;
    final page = catalogue.skip(_mapPage * _pageSize).take(_pageSize).toList();
    final review = next != null && _record.due(next, now);
    return [
      CourseJourneyHeader(
        key: const Key('journey-map-overview'),
        world: JourneyWorld.hadith,
        title: tr('Amanpur Journey Map', 'امن پور کا سفری نقشہ'),
        progress: tr(
          '$done of ${catalogue.length} levels complete',
          '${catalogue.length} میں سے $done لیول مکمل',
        ),
        value: catalogue.isEmpty ? 0 : done / catalogue.length,
        detailTitle: next == null
            ? null
            : review
            ? tr(
                'Review · Level ${next.number}',
                'دہرائی · لیول ${next.number}',
              )
            : tr(
                'Next mission · Level ${next.number}',
                'اگلا مشن · لیول ${next.number}',
              ),
        detail: next?.title,
        action: review
            ? tr('Start review', 'دہرائی شروع کریں')
            : tr('Continue Journey', 'سفر جاری رکھیں'),
        actionKey: const Key('journey-play-next'),
        onAction: next == null || _saving
            ? null
            : () => setState(() => _show(next)),
      ),
      const SizedBox(height: 12),
      Text(
        tr(
          'Try any of the ${catalogue.length} levels. Complete them in order to save progress.',
          '${catalogue.length} میں سے کوئی لیول آزمائیں۔ پیش رفت محفوظ کرنے کے لیے اسباق ترتیب سے مکمل کریں۔',
        ),
      ),
      if (learningJourneyPreview &&
          !learningJourneyRelease &&
          _accountStore == null)
        Padding(
          padding: const EdgeInsets.only(top: 12),
          child: DropdownButtonFormField<String>(
            key: ValueKey(_previewLane),
            initialValue: _previewLane?.name ?? '',
            decoration: InputDecoration(
              labelText: tr('Preview age group', 'عمر کے گروپ کا پیش نظارہ'),
            ),
            items: [
              DropdownMenuItem(
                value: '',
                child: Text(tr('Standard journey', 'عام سفر')),
              ),
              for (final lane in JourneyLane.values)
                DropdownMenuItem(
                  value: lane.name,
                  child: Text('${lane.ages} · ${lane.label}'),
                ),
            ],
            onChanged: (value) => setState(() {
              _previewLane = JourneyLane.values
                  .where((lane) => lane.name == value)
                  .firstOrNull;
              _mapPage = 0;
            }),
          ),
        ),
      const SizedBox(height: 18),
      if (_preferences.sync && _accountStore?.upToDate == false)
        OutlinedButton.icon(
          onPressed: _saving ? null : _retrySync,
          icon: const Icon(Icons.sync_rounded),
          label: Text(
            _saving
                ? tr('Syncing…', 'ہم آہنگ ہو رہا ہے…')
                : tr(
                    'Retry syncing saved progress',
                    'محفوظ پیش رفت دوبارہ ہم آہنگ کریں',
                  ),
          ),
        ),
      if (page.isNotEmpty)
        DropdownButtonFormField<int>(
          key: ValueKey(_mapPage),
          initialValue: _mapPage,
          decoration: InputDecoration(labelText: tr('Levels', 'لیول')),
          items: [
            for (var start = 0; start < catalogue.length; start += _pageSize)
              DropdownMenuItem(
                value: start ~/ _pageSize,
                child: Text(
                  '${catalogue[start].number}–${catalogue.skip(start).take(_pageSize).last.number}',
                ),
              ),
          ],
          onChanged: _saving
              ? null
              : (page) {
                  if (page != null) setState(() => _mapPage = page);
                },
        ),
      const SizedBox(height: 12),
      for (final (index, level) in page.indexed)
        JourneyStop(
          number: level.number,
          first: index == 0,
          last: index == page.length - 1,
          completed:
              _record.levels.containsKey(level.id) && !_record.due(level, now),
          current: level.id == next?.id,
          child: Card(
            clipBehavior: Clip.antiAlias,
            color: Colors.white,
            elevation: 0,
            margin: const EdgeInsets.fromLTRB(2, 2, 2, 6),
            child: ListTile(
              key: ValueKey('journey-stop-${level.number}'),
              title: Text(
                level.title,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  color: journeyNavy,
                ),
              ),
              subtitle: Text(
                _record.due(level, now)
                    ? tr('Review due', 'دہرائی کا وقت')
                    : _record.levels.containsKey(level.id)
                    ? tr('Completed', 'مکمل')
                    : _record.unlocked(catalogue, level)
                    ? tr('Ready to start', 'شروع کریں')
                    : tr('Try preview', 'سبق آزمائیں'),
              ),
              trailing: level.checkpoint
                  ? Icon(
                      Icons.flag_outlined,
                      semanticLabel: tr('Checkpoint', 'جائزہ'),
                    )
                  : const Icon(Icons.chevron_right_rounded, color: journeyPink),
              onTap: _saving
                  ? null
                  : () => setState(
                      () => _show(
                        level,
                        practiceOnly: !_record.unlocked(catalogue, level),
                      ),
                    ),
            ),
          ),
        ),
    ];
  }

  Future<void> _retrySync() async {
    setState(() => _saving = true);
    try {
      final cloudAndDevice = await widget.store.load();
      final saved = await widget.store.save(_record.merge(cloudAndDevice));
      if (mounted) setState(() => _record = saved);
    } catch (_) {
      // The retry remains available if device storage was unavailable.
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  List<Widget> _completion(List<JourneyLevel> catalogue) {
    final next = _record.next(catalogue, widget.now());
    return [
      Center(
        child: CircleAvatar(
          radius: 40,
          backgroundColor: const Color(0xFFFFE7CF),
          foregroundColor: journeyNavy,
          child: Icon(
            !_practiceOnly && !_reviewing && _level!.checkpoint
                ? Icons.flag_rounded
                : Icons.check_rounded,
            size: 48,
          ),
        ),
      ),
      const SizedBox(height: 18),
      Text(
        _practiceOnly
            ? tr('Practice complete', 'مشق مکمل')
            : _reviewing
            ? tr('Review complete', 'دہرائی مکمل')
            : tr('Level complete', 'لیول مکمل'),
        textAlign: TextAlign.center,
        style: displayStyle(29, color: journeyNavy),
      ),
      const SizedBox(height: 8),
      Text(
        _practiceOnly
            ? tr(
                'Complete the earlier lessons in order to save this level.',
                'یہ لیول محفوظ کرنے کے لیے پہلے کے اسباق ترتیب سے مکمل کریں۔',
              )
            : _preferences.sync && _accountStore?.upToDate == true
            ? tr('Your progress is synced.', 'آپ کی پیش رفت ہم آہنگ ہے۔')
            : tr(
                'Your progress is saved on this device.',
                'آپ کی پیش رفت اس ڈیوائس پر محفوظ ہے۔',
              ),
        textAlign: TextAlign.center,
      ),
      const SizedBox(height: 22),
      if (next != null)
        FilledButton.icon(
          onPressed: () => setState(() => _show(next)),
          icon: const Icon(Icons.play_arrow_rounded),
          label: Text(tr('Continue Journey', 'سفر جاری رکھیں')),
        ),
      const SizedBox(height: 8),
      OutlinedButton(
        onPressed: () => setState(() => _level = null),
        child: Text(tr('Open the map', 'نقشہ کھولیں')),
      ),
    ];
  }

  String _levelTitle(JourneyLevel level) => switch (level.id) {
    'IA-0001' => tr(level.title, 'اللہ کے نام سے شروع کریں'),
    'IA-0002' => tr(level.title, 'سورۃ الفاتحہ'),
    'IA-0009' => tr(level.title, 'سورۃ الاخلاص'),
    _ => level.title,
  };

  Widget _missionBriefing(JourneyLevel level) =>
      FutureBuilder<List<JourneyLesson>>(
        future: _lesson,
        initialData: _loadedStations,
        builder: (context, snapshot) {
          final lessons = snapshot.data;
          final cards = lessons == null
              ? const <(IconData, String, String)>[]
              : _briefingCards(level, lessons);
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Card(
                key: const Key('journey-mission-briefing'),
                margin: EdgeInsets.zero,
                color: Colors.white,
                elevation: 0,
                clipBehavior: Clip.antiAlias,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    CourseScene(
                      world: _journeyWorld(level),
                      height: 164,
                      guide: true,
                    ),
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _reviewing
                                ? tr(
                                    'Review mission · ${level.number}',
                                    'دہرائی کا مشن · ${level.number}',
                                  )
                                : _practiceOnly
                                ? tr(
                                    'Practice mission · ${level.number}',
                                    'مشق کا مشن · ${level.number}',
                                  )
                                : tr(
                                    'Mission ${level.number}',
                                    'مشن ${level.number}',
                                  ),
                            style: const TextStyle(
                              color: journeyPink,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _levelTitle(level),
                            style: displayStyle(28, color: journeyNavy),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            [
                              if (level.checkpoint) tr('Checkpoint', 'جائزہ'),
                              level.brief['session']!,
                            ].join(' · '),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              if (snapshot.hasError) ...[
                Text(tr('Could not load this lesson.', 'یہ سبق نہیں کھل سکا۔')),
                OutlinedButton(
                  onPressed: () => setState(() => _loadStations(level)),
                  child: Text(tr('Try again', 'دوبارہ کوشش کریں')),
                ),
              ] else if (lessons == null)
                const LinearProgressIndicator()
              else ...[
                Text(
                  tr('Inside this mission', 'اس مشن میں کیا ہے'),
                  style: displayStyle(21, color: journeyNavy),
                ),
                const SizedBox(height: 8),
                LayoutBuilder(
                  builder: (context, bounds) => Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final (index, (icon, title, detail))
                          in cards.indexed)
                        SizedBox(
                          width: cards.length == 1 || bounds.maxWidth < 280
                              ? bounds.maxWidth
                              : (bounds.maxWidth - 8) / 2,
                          child: _MissionPreviewTile(
                            index: index,
                            icon: icon,
                            title: title,
                            detail: detail,
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                FilledButton.icon(
                  key: const Key('journey-start-mission'),
                  style: FilledButton.styleFrom(
                    backgroundColor: journeyPink,
                    foregroundColor: Colors.white,
                    minimumSize: const Size(48, 54),
                  ),
                  onPressed: () => setState(() => _briefing = false),
                  icon: const Icon(Icons.play_arrow_rounded),
                  label: Text(
                    _reviewing
                        ? tr('Start review', 'دہرائی شروع کریں')
                        : tr('Start mission', 'مشن شروع کریں'),
                  ),
                ),
              ],
            ],
          );
        },
      );

  List<(IconData, String, String)> _briefingCards(
    JourneyLevel level,
    List<JourneyLesson> lessons,
  ) {
    final lesson = lessons.first;
    if (_reviewing) {
      return [
        (
          Icons.replay_rounded,
          tr('Recall', 'یاد کریں'),
          tr('Review what you learned', 'سیکھے ہوئے سبق کی دہرائی کریں'),
        ),
      ];
    }
    final capstone = level.number == 1000;
    return [
      if (capstone)
        (
          Icons.flag_outlined,
          tr('Stations', 'سرگرمیاں'),
          tr(
            '${_completedStations.length} of ${lessons.length} finished',
            '${lessons.length} میں سے ${_completedStations.length} مکمل',
          ),
        )
      else
        (
          Icons.menu_book_rounded,
          tr('Explore', 'سبق دیکھیں'),
          lessons.length > 1
              ? tr(
                  'Explore ${lessons.length} activities',
                  '${lessons.length} سرگرمیاں دیکھیں',
                )
              : lesson.verses.isNotEmpty
              ? tr('Read the passage', 'آیات پڑھیں')
              : tr('Read the story', 'کہانی پڑھیں'),
        ),
      if (!capstone)
        (
          Icons.extension_rounded,
          tr('Practise', 'مشق کریں'),
          lesson.verses.length > 1
              ? tr('Put the ayahs in order', 'آیات ترتیب سے لگائیں')
              : lesson.listeningClip != null
              ? tr('Match what you hear', 'سنی ہوئی بات ملائیں')
              : tr('Try the lesson challenge', 'سبق کی مشق آزمائیں'),
        ),
      if (!_parentLed)
        (
          Icons.lightbulb_outline_rounded,
          tr('Think', 'سوچیں'),
          level.comparison
              ? tr('Compare what you learned', 'جو سیکھا اس کا موازنہ کریں')
              : tr('Make a choice', 'ایک فیصلہ کریں'),
        ),
      (
        Icons.favorite_border_rounded,
        tr('Apply', 'عمل کریں'),
        tr('Try a small action today', 'آج ایک چھوٹا سا عمل آزمائیں'),
      ),
    ];
  }

  List<Widget> _activity(JourneyLevel level) => [
    Text(
      _practiceOnly
          ? tr(
              'Preview · Level ${level.number}',
              'پیش نظارہ · لیول ${level.number}',
            )
          : _reviewing
          ? tr(
              'Review · Level ${level.number}',
              'دہرائی · لیول ${level.number}',
            )
          : tr('Level ${level.number}', 'لیول ${level.number}'),
      style: const TextStyle(fontWeight: FontWeight.w700, color: journeyPink),
    ),
    const SizedBox(height: 6),
    Text(_levelTitle(level), style: displayStyle(29)),
    const SizedBox(height: 6),
    Text(
      [
        if (level.checkpoint) tr('Checkpoint', 'جائزہ'),
        level.difficulty,
        level.brief['session']!,
      ].join(' · '),
    ),
    const SizedBox(height: 16),
    _missionTrack(),
    const SizedBox(height: 12),
    FutureBuilder<List<JourneyLesson>>(
      future: _lesson,
      initialData: _loadedStations,
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(tr('Could not load this lesson.', 'یہ سبق نہیں کھل سکا۔')),
              TextButton(
                onPressed: () => setState(() => _loadStations(level)),
                child: Text(tr('Try again', 'دوبارہ کوشش کریں')),
              ),
            ],
          );
        }
        final stations = snapshot.data;
        if (stations == null) return const LinearProgressIndicator();
        final lesson = stations[_station];
        final last = _station == stations.length - 1;
        final sources = JourneyLesson.stationLevels(
          level,
          _catalogue,
          lane: _lane,
        );
        final sourceLevel = sources[_station];
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (stations.length > 1 && _step != _JourneyStep.stations) ...[
              Text(
                tr(
                  'Activity ${_station + 1} of ${stations.length}',
                  'سرگرمی ${_station + 1} از ${stations.length}',
                ),
              ),
              const SizedBox(height: 12),
            ],
            if (_preferences.supported ||
                _parentLed ||
                _lane == JourneyLane.guided) ...[
              Text(
                tr(
                  'Learn together with a trusted adult.',
                  'کسی قابلِ اعتماد بڑے کے ساتھ سیکھیں۔',
                ),
              ),
              const SizedBox(height: 12),
            ],
            switch (_step) {
              _JourneyStep.stations => _stations(sources),
              _JourneyStep.read => _lessonCard(sourceLevel, lesson),
              _JourneyStep.reflect => _prompt(
                tr('Think quietly', 'خاموشی سے سوچیں'),
                level.prompt('reflection'),
                tr('Continue', 'آگے بڑھیں'),
                () => _go(_practiceStep(lesson)),
                allowSkip: true,
              ),
              _JourneyStep.listen => _listening(lesson),
              _JourneyStep.order => _orderAyahs(lesson),
              _JourneyStep.practise => JourneyPracticeView(
                practice: lesson.practice!,
                onComplete: () => _go(_JourneyStep.check),
              ),
              _JourneyStep.evidence => JourneyPracticeView(
                practice: JourneyPractice(
                  prompt: tr(
                    'Which card gives the source reference?',
                    'اصل حوالہ کس کارڈ پر ہے؟',
                  ),
                  items: [lesson.choices[lesson.correct], lesson.source],
                  correct: 1,
                ),
                onComplete: () => _advanceChecked(last),
              ),
              _JourneyStep.check => _activityCheck(
                sourceLevel,
                lesson,
                last: last,
              ),
              _JourneyStep.compare => _compare(level, stations),
              _JourneyStep.decide => _decision(level),
              _JourneyStep.apply => _prompt(
                tr('Try this today if you like', 'چاہیں تو آج یہ کریں'),
                level.prompt('dailyAction'),
                _finishLabel,
                _finish,
              ),
            },
            if (_saveFailed)
              Text(
                tr(
                  'Progress could not be saved. Please try again.',
                  'پیش رفت محفوظ نہیں ہو سکی۔ دوبارہ کوشش کریں۔',
                ),
              ),
          ],
        );
      },
    ),
  ];

  Widget _missionTrack() {
    final stage = switch (_step) {
      _JourneyStep.read || _JourneyStep.stations || _JourneyStep.reflect => 0,
      _JourneyStep.listen ||
      _JourneyStep.order ||
      _JourneyStep.practise ||
      _JourneyStep.check ||
      _JourneyStep.evidence => 1,
      _JourneyStep.compare || _JourneyStep.decide => 2,
      _JourneyStep.apply => 3,
    };
    final labels = _reviewing
        ? [tr('Review', 'دہرائی')]
        : [
            tr('Explore', 'سبق دیکھیں'),
            tr('Practise', 'مشق کریں'),
            if (!_parentLed) tr('Think', 'سوچیں'),
            tr('Apply', 'عمل کریں'),
          ];
    final current = _reviewing
        ? 0
        : _parentLed && stage == 3
        ? 2
        : stage;
    return Card(
      color: Colors.white,
      elevation: 0,
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.only(top: 10, bottom: 8),
        child: Column(
          children: [
            Text(
              labels.length == 1
                  ? labels.single
                  : tr(
                      'Step ${current + 1} of ${labels.length} · ${labels[current]}',
                      'مرحلہ ${current + 1} از ${labels.length} · ${labels[current]}',
                    ),
              key: const Key('journey-mission-stage'),
              style: const TextStyle(
                fontWeight: FontWeight.w800,
                color: journeyNavy,
              ),
            ),
            const SizedBox(height: 8),
            MissionSteps(step: current, count: labels.length),
          ],
        ),
      ),
    );
  }

  void _go(_JourneyStep step) => setState(() {
    _step = step;
    _choice = null;
  });

  _JourneyStep _practiceStep(JourneyLesson lesson) {
    return lesson.listeningClip == null
        ? _afterListening(lesson)
        : _JourneyStep.listen;
  }

  _JourneyStep _afterListening(JourneyLesson lesson) =>
      lesson.verses.length > 1 ? _JourneyStep.order : _afterOrdering(lesson);

  _JourneyStep _afterOrdering(JourneyLesson lesson) =>
      !_parentLed && lesson.practice != null
      ? _JourneyStep.practise
      : _JourneyStep.check;

  String get _finishLabel => _saving
      ? tr('Saving…', 'محفوظ ہو رہا ہے…')
      : _practiceOnly
      ? tr('Finish practice', 'مشق مکمل کریں')
      : tr('Save and finish', 'محفوظ کریں اور مکمل کریں');

  Widget _lessonCard(JourneyLevel level, JourneyLesson lesson) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Card(
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(lesson.story, style: Theme.of(context).textTheme.bodyLarge),
              const SizedBox(height: 16),
              if (lesson.verses.isNotEmpty && _parentLed)
                ExpansionTile(
                  title: Text(tr('Listen together', 'مل کر سنیں')),
                  children: [
                    RecitationView(
                      verses: lesson.verses,
                      reciter: lesson.reciter,
                    ),
                  ],
                )
              else if (lesson.verses.isNotEmpty)
                RecitationView(verses: lesson.verses, reciter: lesson.reciter)
              else
                for (final line in lesson.arabic)
                  Align(
                    alignment: Alignment.center,
                    child: Text(
                      line,
                      textDirection: TextDirection.rtl,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontFamily: 'NotoNaskhArabic',
                        fontSize: 23,
                        height: 1.8,
                        color: _green,
                      ),
                    ),
                  ),
              if (lesson.meaning.isNotEmpty) ...[
                const SizedBox(height: 10),
                Text(lesson.meaning),
              ],
              const SizedBox(height: 10),
              Text(lesson.source, style: Theme.of(context).textTheme.bodySmall),
              if (lesson.practice case final JourneyPractice practice
                  when !_parentLed && practice.explanations.isEmpty)
                ExpansionTile(
                  tilePadding: EdgeInsets.zero,
                  title: Text(tr('Practice notes', 'مشق کی رہنمائی')),
                  children: [
                    if (practice.inOrder)
                      for (final (index, item) in practice.items.indexed)
                        ListTile(
                          leading: Text('${index + 1}'),
                          title: Text(item),
                        )
                    else
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Text(practice.items[practice.correct]),
                      ),
                  ],
                ),
              const SizedBox(height: 6),
              ExpansionTile(
                tilePadding: EdgeInsets.zero,
                title: Text(tr('Source details', 'حوالے کی تفصیل')),
                children: [
                  Text(
                    '${level.brief['sourcePdf']} · p. ${level.brief['sourcePages']}',
                  ),
                  Text(level.sourceUnit),
                ],
              ),
            ],
          ),
        ),
      ),
      const SizedBox(height: 18),
      FilledButton(
        onPressed: () => _go(
          _reviewing
              ? _JourneyStep.check
              : _parentLed
              ? _practiceStep(lesson)
              : _station == 0
              ? _JourneyStep.reflect
              : _practiceStep(lesson),
        ),
        child: Text(tr('Start activity', 'سرگرمی شروع کریں')),
      ),
    ],
  );

  Widget _activityCheck(
    JourneyLevel sourceLevel,
    JourneyLesson lesson, {
    required bool last,
  }) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Text(lesson.question, style: Theme.of(context).textTheme.titleLarge),
      const SizedBox(height: 14),
      if ((_preferences.supported || _lane == JourneyLane.guided) &&
          lesson.meaning.isNotEmpty)
        ExpansionTile(
          tilePadding: EdgeInsets.zero,
          title: Text(tr('Read a hint together', 'مل کر اشارہ پڑھیں')),
          children: [Text(lesson.meaning)],
        ),
      if (lesson.revealAnswer && _choice == null)
        OutlinedButton(
          onPressed: () => setState(() => _choice = lesson.correct),
          child: Text(tr('Reveal answer', 'جواب دیکھیں')),
        ),
      for (final (index, label)
          in lesson.revealAnswer
              ? const <(int, String)>[]
              : lesson.choices.indexed)
        if (!_parentLed ||
            index == lesson.correct ||
            index == (lesson.correct + 1) % lesson.choices.length)
          Padding(
            padding: const EdgeInsets.only(bottom: 9),
            child: OutlinedButton(
              onPressed: _saving ? null : () => setState(() => _choice = index),
              style: _choice == index
                  ? OutlinedButton.styleFrom(
                      backgroundColor: const Color(0xFFE8F3E8),
                    )
                  : null,
              child: sourceLevel.number == 1
                  ? Row(
                      children: [
                        ExcludeSemantics(
                          child: Icon(
                            const [
                              Icons.dinner_dining,
                              Icons.restaurant,
                              Icons.restaurant_menu,
                            ][index],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(label, textAlign: TextAlign.center),
                        ),
                      ],
                    )
                  : Text(label, textAlign: TextAlign.center),
            ),
          ),
      if (_choice != null) ...[
        Semantics(
          liveRegion: true,
          child: Text(
            lesson.feedbackFor(_choice!),
            style: const TextStyle(color: _green, fontWeight: FontWeight.w700),
          ),
        ),
        const SizedBox(height: 12),
      ],
      if (_choice == lesson.correct)
        FilledButton(
          onPressed: _saving
              ? null
              : () {
                  final evidence =
                      (_lane == JourneyLane.advanced || _level!.checkpoint) &&
                      !_reviewing &&
                      lesson.choices[lesson.correct] != lesson.source;
                  if (evidence) {
                    _go(_JourneyStep.evidence);
                  } else {
                    _advanceChecked(last);
                  }
                },
          child: Text(
            _level!.number == 1000 && !_reviewing
                ? tr('Complete station', 'سرگرمی مکمل کریں')
                : !last
                ? tr('Next activity', 'اگلی سرگرمی')
                : _reviewing
                ? _finishLabel
                : tr('Continue', 'آگے بڑھیں'),
          ),
        ),
      TextButton(
        onPressed: _saving ? null : () => _go(_JourneyStep.read),
        child: Text(tr('Read the lesson again', 'سبق دوبارہ پڑھیں')),
      ),
    ],
  );

  void _advanceChecked(bool last) {
    if (!_reviewing && _level!.number == 1000) {
      _completeStation();
    } else if (last && _reviewing) {
      _finish();
    } else if (last) {
      _go(
        _parentLed
            ? _JourneyStep.apply
            : _level!.comparison
            ? _JourneyStep.compare
            : _JourneyStep.decide,
      );
    } else {
      setState(() {
        _station++;
        _choice = null;
        _ayahOrder.clear();
        _step = _reviewing ? _JourneyStep.check : _JourneyStep.read;
      });
    }
  }

  Widget _stations(List<JourneyLevel> sources) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Text(
        tr('Choose a station', 'ایک سرگرمی منتخب کریں'),
        style: Theme.of(context).textTheme.titleLarge,
      ),
      const SizedBox(height: 10),
      for (final (index, source) in sources.indexed)
        OutlinedButton.icon(
          onPressed: _completedStations.contains(index)
              ? null
              : () => setState(() {
                  _station = index;
                  _choice = null;
                  _ayahOrder.clear();
                  _step = _JourneyStep.read;
                }),
          icon: Icon(
            _completedStations.contains(index)
                ? Icons.check_circle_outline
                : Icons.menu_book_outlined,
          ),
          label: Text(
            index == 0
                ? tr(
                    'Prophets · Read and check the source',
                    'انبیاء · اصل حوالہ پڑھیں اور جانچیں',
                  )
                : source.title,
          ),
        ),
    ],
  );

  Future<void> _completeStation() async {
    if (_saving) return;
    if (!_practiceOnly && !_record.levels.containsKey(_level!.id)) {
      setState(() {
        _saving = true;
        _saveFailed = false;
      });
      try {
        final saved = await widget.store.save(_record.finishStation(_station));
        if (!mounted) return;
        _record = saved;
      } catch (_) {
        if (mounted) setState(() => _saveFailed = true);
        return;
      } finally {
        if (mounted) setState(() => _saving = false);
      }
    }
    setState(() {
      _completedStations.add(_station);
      _choice = null;
      _step = _completedStations.length == _level!.stations.length
          ? _JourneyStep.decide
          : _JourneyStep.stations;
    });
  }

  Widget _prompt(
    String heading,
    String copy,
    String action,
    VoidCallback onContinue, {
    bool allowSkip = false,
  }) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Text(heading, style: Theme.of(context).textTheme.titleLarge),
      const SizedBox(height: 10),
      Text(copy),
      if (allowSkip) ...[
        const SizedBox(height: 8),
        Text(
          tr(
            'Keep your answer to yourself or talk with a trusted adult.',
            'اپنا جواب اپنے پاس رکھیں یا کسی قابلِ اعتماد بڑے سے بات کریں۔',
          ),
        ),
      ],
      const SizedBox(height: 16),
      FilledButton(onPressed: _saving ? null : onContinue, child: Text(action)),
      if (allowSkip)
        TextButton(
          onPressed: onContinue,
          child: Text(tr('Skip this reflection', 'اس غور و فکر کو چھوڑ دیں')),
        ),
    ],
  );

  Widget _listening(JourneyLesson lesson) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Text(
        tr('Which ayah did you hear?', 'آپ نے کون سی آیت سنی؟'),
        style: Theme.of(context).textTheme.titleLarge,
      ),
      const SizedBox(height: 10),
      _JourneyClip(url: lesson.listeningClip!),
      const SizedBox(height: 10),
      for (final (index, text) in lesson.listeningChoices.indexed)
        OutlinedButton(
          onPressed: () => setState(() => _choice = index),
          child: Text(
            text,
            textDirection: TextDirection.rtl,
            textAlign: TextAlign.center,
            style: const TextStyle(fontFamily: 'NotoNaskhArabic', fontSize: 23),
          ),
        ),
      if (_choice != null)
        Semantics(
          liveRegion: true,
          child: Text(
            _choice == lesson.listeningAnswer
                ? tr('That matches the recitation.', 'یہ تلاوت سے ملتی ہے۔')
                : tr(
                    'Listen again and try another ayah.',
                    'دوبارہ سنیں اور دوسری آیت آزمائیں۔',
                  ),
          ),
        ),
      if (_choice == lesson.listeningAnswer)
        FilledButton(
          onPressed: () => _go(_afterListening(lesson)),
          child: Text(tr('Continue', 'آگے بڑھیں')),
        ),
      TextButton(
        onPressed: () => _go(_afterListening(lesson)),
        child: Text(tr('Use the reading activity', 'پڑھنے کی سرگرمی کریں')),
      ),
    ],
  );

  Widget _orderAyahs(JourneyLesson lesson) {
    final fullFatihah =
        lesson.verses.length == 7 && lesson.verses.first.key == '1:1';
    final verses = lesson.verses
        .take(
          _parentLed || _lane == JourneyLane.guided
              ? 2
              : fullFatihah
              ? 7
              : _lane == JourneyLane.advanced
              ? 4
              : 3,
        )
        .toList();
    final correct =
        _ayahOrder.length == verses.length &&
        _ayahOrder.indexed.every(
          (item) => verses[item.$2].text == verses[item.$1].text,
        );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          tr(
            'Put these ayahs in Qur’anic order',
            'ان آیات کو قرآن کی ترتیب میں رکھیں',
          ),
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 10),
        for (var index = verses.length - 1; index >= 0; index--)
          if (!_ayahOrder.contains(index))
            OutlinedButton(
              onPressed: () => setState(() => _ayahOrder.add(index)),
              child: _orderText(verses[index].text),
            ),
        for (final (position, index) in _ayahOrder.indexed)
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: CircleAvatar(child: Text('${position + 1}')),
            title: _orderText(verses[index].text),
          ),
        if (_ayahOrder.isNotEmpty)
          TextButton(
            onPressed: () => setState(_ayahOrder.clear),
            child: Text(tr('Start this order again', 'ترتیب دوبارہ بنائیں')),
          ),
        if (_ayahOrder.length == verses.length)
          Semantics(
            liveRegion: true,
            child: Text(
              correct
                  ? tr('That is the Qur’anic order.', 'یہ قرآن کی ترتیب ہے۔')
                  : tr(
                      'Try again. You can reopen the passage to check the order.',
                      'دوبارہ کوشش کریں۔ ترتیب دیکھنے کے لیے آیات دوبارہ کھول سکتے ہیں۔',
                    ),
            ),
          ),
        if (correct)
          FilledButton(
            onPressed: () => _go(_afterOrdering(lesson)),
            child: Text(tr('Continue', 'آگے بڑھیں')),
          ),
        TextButton(
          onPressed: () {
            _ayahOrder.clear();
            _go(_JourneyStep.read);
          },
          child: Text(tr('Read the passage again', 'آیات دوبارہ پڑھیں')),
        ),
      ],
    );
  }

  Widget _orderText(String text) => Text(
    text,
    textDirection: TextDirection.rtl,
    textAlign: TextAlign.center,
    style: const TextStyle(fontFamily: 'NotoNaskhArabic', fontSize: 22),
  );

  Widget _compare(JourneyLevel level, List<JourneyLesson> stations) {
    final sources = JourneyLesson.stationLevels(level, _catalogue);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          tr(
            'Match each question to its lesson',
            'ہر سوال کو اس کے سبق سے ملائیں',
          ),
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 10),
        Text(
          '${_comparisonItem + 1}/2 · ${stations[_comparisonItem].question}',
        ),
        const SizedBox(height: 10),
        for (final (index, source) in sources.indexed)
          OutlinedButton(
            onPressed: () => setState(() => _choice = index),
            child: Text(source.title),
          ),
        if (_choice != null && _choice != _comparisonItem)
          Semantics(
            liveRegion: true,
            child: Text(
              tr(
                'Think about what each lesson taught, then try again.',
                'دونوں اسباق کی تعلیم پر غور کریں، پھر دوبارہ کوشش کریں۔',
              ),
            ),
          ),
        if (_choice == _comparisonItem)
          FilledButton(
            onPressed: _comparisonItem == 1
                ? () => _go(_JourneyStep.decide)
                : () => setState(() {
                    _comparisonItem++;
                    _choice = null;
                  }),
            child: Text(tr('Continue', 'آگے بڑھیں')),
          ),
      ],
    );
  }

  Widget _decision(JourneyLevel level) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Text(
        tr('Explain your choice', 'اپنے انتخاب کی وجہ بتائیں'),
        style: Theme.of(context).textTheme.titleLarge,
      ),
      const SizedBox(height: 10),
      if (level.number == 1000) ...[
        Text(
          tr(
            'At the Amanpur exhibition, a friend wants to include a story they found online. You cannot find its source. Another child is left out while your team decides what to do.',
            'امن پور کی نمائش میں ایک دوست انٹرنیٹ سے ملی کہانی شامل کرنا چاہتا ہے۔ آپ کو اس کا حوالہ نہیں ملتا۔ فیصلہ کرتے ہوئے آپ کی ٹیم ایک بچے کو نظر انداز کر دیتی ہے۔',
          ),
        ),
        const SizedBox(height: 10),
      ],
      if (level.number == 1000) ...[
        for (final (index, option) in [
          tr(
            'Include the story now and find its source another day.',
            'ابھی کہانی شامل کریں اور کسی اور دن حوالہ تلاش کریں۔',
          ),
          tr(
            'Ask a trusted adult to help check the source and invite the child into the discussion.',
            'حوالہ جانچنے کے لیے کسی قابلِ اعتماد بڑے سے مدد لیں اور بچے کو گفتگو میں شامل کریں۔',
          ),
          tr(
            'Leave the decision to the loudest person in the group.',
            'گروہ میں سب سے اونچی آواز والے شخص پر فیصلہ چھوڑ دیں۔',
          ),
        ].indexed)
          OutlinedButton(
            onPressed: () => setState(() => _choice = index),
            child: Text(option),
          ),
        if (_choice != null)
          Semantics(
            liveRegion: true,
            child: Text(
              _choice == 1
                  ? tr(
                      'Checking the source protects accuracy. Including the child shows kindness.',
                      'حوالہ جانچنے سے بات درست رہتی ہے۔ بچے کو شامل کرنا مہربانی ہے۔',
                    )
                  : tr(
                      'Look for a choice that checks the source and includes the other child.',
                      'ایسا انتخاب تلاش کریں جو حوالہ جانچے اور دوسرے بچے کو شامل کرے۔',
                    ),
            ),
          ),
        const SizedBox(height: 10),
      ],
      Text(level.prompt('decision')),
      const SizedBox(height: 8),
      Text(
        tr(
          'Say your reason to yourself or discuss it with a trusted adult.',
          'وجہ اپنے دل میں کہیں یا کسی قابلِ اعتماد بڑے سے بات کریں۔',
        ),
      ),
      ExpansionTile(
        tilePadding: EdgeInsets.zero,
        title: Text(
          tr('Review guide for adults', 'بڑوں کے لیے جائزے کی رہنمائی'),
        ),
        children: [
          Text(level.brief['rubric']!),
          const SizedBox(height: 8),
          Text(level.brief['mastery']!),
        ],
      ),
      const SizedBox(height: 10),
      FilledButton(
        onPressed: level.number == 1000 && _choice != 1
            ? null
            : () => _go(_JourneyStep.apply),
        child: Text(tr('Continue', 'آگے بڑھیں')),
      ),
    ],
  );
}

class _MissionPreviewTile extends StatelessWidget {
  const _MissionPreviewTile({
    required this.index,
    required this.icon,
    required this.title,
    required this.detail,
  });

  final int index;
  final IconData icon;
  final String title, detail;

  @override
  Widget build(BuildContext context) {
    final pink = index.isEven;
    final accent = pink ? journeyPink : journeyNavy;
    return Container(
      constraints: const BoxConstraints(minHeight: 120),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: pink ? const Color(0xFFFBE7EF) : const Color(0xFFFFEBD8),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              CircleAvatar(
                radius: 17,
                backgroundColor: Colors.white,
                foregroundColor: accent,
                child: Icon(icon, size: 19),
              ),
              Text('${index + 1}', style: displayStyle(18, color: accent)),
            ],
          ),
          const SizedBox(height: 6),
          Text(title, style: displayStyle(17, color: journeyNavy)),
          const SizedBox(height: 3),
          Text(
            detail,
            style: const TextStyle(color: journeyNavy, height: 1.25),
          ),
        ],
      ),
    );
  }
}

class _JourneyClip extends StatefulWidget {
  const _JourneyClip({required this.url});
  final String url;

  @override
  State<_JourneyClip> createState() => _JourneyClipState();
}

class _JourneyClipState extends State<_JourneyClip> {
  late final AyahAudio _audio = AyahAudio.create();
  bool _loading = false;
  bool _failed = false;

  Future<void> _play() async {
    setState(() {
      _loading = true;
      _failed = false;
    });
    try {
      await _audio.stop();
      if (!mounted) return;
      await _audio.play(widget.url);
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _audio.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      OutlinedButton.icon(
        onPressed: _loading ? null : _play,
        icon: const Icon(Icons.volume_up_outlined),
        label: Text(tr('Listen to the ayah', 'آیت سنیں')),
      ),
      if (_failed)
        Text(
          tr(
            'Audio could not play. You can try again or use the reading activity.',
            'آڈیو نہیں چل سکی۔ دوبارہ کوشش کریں یا پڑھنے کی سرگرمی کریں۔',
          ),
        ),
    ],
  );
}
