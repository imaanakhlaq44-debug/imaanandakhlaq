import 'dart:async';

import 'package:flutter/material.dart';

import '../../app_theme.dart';
import 'quran_text.dart';
import 'quran_screens.dart' show quranAccent;

/// The passage's ayahs in Uthmani script with Husary's recitation: play the
/// whole passage, tap any ayah to hear just that one, repeat each ayah 1, 3
/// or 5 times, and follow the word being recited as it lights up.
///
/// The app never scores recitation; this is for listening and following.
class RecitationView extends StatefulWidget {
  const RecitationView({
    super.key,
    required this.verses,
    required this.reciter,
    this.showControls = true,
  });

  final List<QuranVerse> verses;
  final String reciter;

  /// False in "See it": the text with tap-to-listen only.
  final bool showControls;

  @override
  State<RecitationView> createState() => _RecitationViewState();
}

class _RecitationViewState extends State<RecitationView> {
  late final AyahAudio _audio = AyahAudio.create();
  StreamSubscription<Duration>? _posSub;
  StreamSubscription<void>? _doneSub;

  int? _current; // index into verses while playing
  int? _word;
  int _repeat = 1, _heard = 0;
  bool _playing = false, _paused = false, _single = false;

  @override
  void initState() {
    super.initState();
    _posSub = _audio.position.listen((p) {
      final i = _current;
      if (i == null || !mounted) return;
      final w = widget.verses[i].wordAt(p.inMilliseconds);
      if (w != _word) setState(() => _word = w);
    });
    _doneSub = _audio.completed.listen((_) => _next());
  }

  @override
  void dispose() {
    _posSub?.cancel();
    _doneSub?.cancel();
    _audio.stop();
    _audio.dispose();
    super.dispose();
  }

  Future<void> _start(int index, {bool single = false}) async {
    final url = widget.verses[index].audio;
    setState(() {
      _current = index;
      _word = null;
      _playing = true;
      _paused = false;
      _single = single;
      if (!single || _heard >= _repeat) _heard = 0;
    });
    if (url == null) return _next();
    try {
      await _audio.play(url);
    } catch (_) {
      if (mounted) _stop();
    }
  }

  void _next() {
    final i = _current;
    if (i == null || !mounted) return;
    _heard++;
    if (_heard < _repeat) {
      _start(i, single: _single);
      return;
    }
    _heard = 0;
    if (_single || i + 1 >= widget.verses.length) {
      _stop();
    } else {
      _start(i + 1);
    }
  }

  void _stop() {
    _audio.stop();
    if (mounted) {
      setState(() {
        _playing = false;
        _paused = false;
        _current = null;
        _word = null;
      });
    }
  }

  Future<void> _toggle() async {
    if (!_playing) return _start(0);
    if (_paused) {
      await _audio.resume();
      setState(() => _paused = false);
    } else {
      await _audio.pause();
      setState(() => _paused = true);
    }
  }

  @override
  Widget build(BuildContext context) => Column(
    key: const Key('quran-recitation'),
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      if (widget.showControls) ...[_controls(), const SizedBox(height: 12)],
      for (var i = 0; i < widget.verses.length; i++) _ayah(i),
      const SizedBox(height: 4),
      Text(
        'Recitation: ${widget.reciter}. Uthmani text, Ḥafṣ ʿan ʿĀṣim.',
        style: const TextStyle(color: Color(0xFF66738E), fontSize: 12),
      ),
    ],
  );

  Widget _controls() => Container(
    padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
    decoration: BoxDecoration(
      color: const Color(0xFFFCE8F0),
      borderRadius: BorderRadius.circular(18),
    ),
    // Wraps onto two lines on narrow phones instead of running off-screen.
    child: Wrap(
      spacing: 8,
      runSpacing: 8,
      crossAxisAlignment: WrapCrossAlignment.center,
      alignment: WrapAlignment.spaceBetween,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            FilledButton.icon(
              key: const Key('quran-play'),
              style: FilledButton.styleFrom(
                backgroundColor: quranAccent,
                minimumSize: const Size(48, 46),
              ),
              onPressed: _toggle,
              icon: Icon(
                !_playing || _paused
                    ? Icons.play_arrow_rounded
                    : Icons.pause_rounded,
              ),
              label: Text(
                !_playing ? 'Listen' : (_paused ? 'Resume' : 'Pause'),
              ),
            ),
            if (_playing) ...[
              const SizedBox(width: 6),
              IconButton(
                key: const Key('quran-stop'),
                tooltip: 'Stop',
                onPressed: _stop,
                icon: const Icon(Icons.stop_rounded, color: quranAccent),
              ),
            ],
          ],
        ),
        Wrap(
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: 6,
          runSpacing: 6,
          children: [
            const Text(
              'Each ayah',
              style: TextStyle(color: ink, fontWeight: FontWeight.w700),
            ),
            const SizedBox(width: 6),
            SegmentedButton<int>(
              key: const Key('quran-repeat'),
              showSelectedIcon: false,
              style: const ButtonStyle(visualDensity: VisualDensity.compact),
              segments: const [
                ButtonSegment(value: 1, label: Text('×1')),
                ButtonSegment(value: 3, label: Text('×3')),
                ButtonSegment(value: 5, label: Text('×5')),
              ],
              selected: {_repeat},
              onSelectionChanged: (s) => setState(() {
                _repeat = s.first;
                _heard = 0;
              }),
            ),
          ],
        ),
      ],
    ),
  );

  Widget _ayah(int i) {
    final v = widget.verses[i];
    final active = _current == i;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: active ? const Color(0xFFFFF7FA) : Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: BorderSide(
            color: active ? quranAccent : const Color(0xFFD9CEC3),
            width: active ? 1.8 : 1.2,
          ),
        ),
        child: InkWell(
          key: Key('quran-ayah-${v.key}'),
          borderRadius: BorderRadius.circular(18),
          onTap: () => _start(i, single: true),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Directionality(
                  textDirection: TextDirection.rtl,
                  child: Text.rich(
                    TextSpan(
                      children: [
                        for (final (t, token) in v.tokens.indexed) ...[
                          TextSpan(
                            text: token,
                            style:
                                active &&
                                    _word != null &&
                                    v.tokenWords[t] == _word
                                ? const TextStyle(
                                    color: quranAccent,
                                    backgroundColor: Color(0xFFFCE8F0),
                                  )
                                : null,
                          ),
                          const TextSpan(text: ' '),
                        ],
                      ],
                    ),
                    key: Key('quran-text-${v.key}'),
                    textAlign: TextAlign.right,
                    style: const TextStyle(
                      fontFamily: 'NotoNaskhArabic',
                      fontSize: 28,
                      height: 2.1,
                      color: ink,
                    ),
                  ),
                ),
                Row(
                  children: [
                    Container(
                      width: 30,
                      height: 30,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: quranAccent, width: 1.4),
                      ),
                      child: Text(
                        '${v.ayah}',
                        style: const TextStyle(
                          color: quranAccent,
                          fontWeight: FontWeight.w800,
                          fontSize: 12.5,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      v.key,
                      style: const TextStyle(
                        color: Color(0xFF66738E),
                        fontSize: 12.5,
                      ),
                    ),
                    const Spacer(),
                    Icon(
                      active && !_paused
                          ? Icons.graphic_eq_rounded
                          : Icons.volume_up_rounded,
                      color: quranAccent,
                      size: 20,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
