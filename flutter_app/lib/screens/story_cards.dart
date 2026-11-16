import 'package:flutter/material.dart';

import '../app_theme.dart';
import 'ui_kit.dart';

/// Splits [text] into pieces of whole sentences, each at most about
/// [maxChars] long. The words are never changed: every piece is an exact
/// slice of the source, and only the spaces between pieces are dropped.
List<String> storyChunks(String text, {int maxChars = 260}) {
  final source = text.trim();
  if (source.isEmpty) return const [];
  // A sentence ends at . ! ? or … (plus any closing quote or bracket),
  // followed by white space.
  final ends = RegExp('[.!?…][\'"’”)]*\\s+');
  final sentences = <String>[];
  var start = 0;
  for (final m in ends.allMatches(source)) {
    sentences.add(source.substring(start, m.end).trim());
    start = m.end;
  }
  if (start < source.length) sentences.add(source.substring(start).trim());

  final chunks = <String>[];
  var from = 0; // index into [sentences] where the current chunk starts
  var length = 0;
  for (var i = 0; i < sentences.length; i++) {
    final next = sentences[i].length;
    if (i > from && length + next > maxChars) {
      chunks.add(_slice(source, sentences, from, i));
      from = i;
      length = 0;
    }
    length += next + 1;
  }
  chunks.add(_slice(source, sentences, from, sentences.length));
  return chunks;
}

/// The exact source text from sentence [a] up to (not including) [b].
String _slice(String source, List<String> sentences, int a, int b) {
  final first = source.indexOf(sentences[a]);
  var end = first;
  var cursor = first;
  for (var i = a; i < b; i++) {
    final at = source.indexOf(sentences[i], cursor);
    end = at + sentences[i].length;
    cursor = end;
  }
  return source.substring(first, end);
}

/// A story read one small card at a time, like turning the pages of a
/// picture book: a few sentences per card, Next/Back, and progress dots.
/// "Read all" shows the whole story at once for grown-ups and re-reading.
class StoryCards extends StatefulWidget {
  const StoryCards({
    super.key,
    required this.paragraphs,
    this.accent = brandPink,
    this.fontSize = 18,
  });

  /// The story's paragraphs exactly as in the source.
  final List<String> paragraphs;
  final Color accent;
  final double fontSize;

  @override
  State<StoryCards> createState() => _StoryCardsState();
}

class _StoryCardsState extends State<StoryCards> {
  late final List<String> _cards = [
    for (final p in widget.paragraphs) ...storyChunks(p),
  ];
  int _i = 0;
  bool _all = false;
  bool _forward = true;

  void _go(int to) => setState(() {
    _forward = to > _i;
    _i = to.clamp(0, _cards.length - 1);
  });

  @override
  Widget build(BuildContext context) {
    final accent = widget.accent;
    final style = TextStyle(fontSize: widget.fontSize, height: 1.6, color: ink);
    if (_cards.isEmpty) return const SizedBox.shrink();
    if (_cards.length == 1) {
      return _Card(
        key: const Key('story-cards'),
        text: _cards.first,
        style: style,
        accent: accent,
        page: 1,
        pages: 1,
      );
    }
    if (_all) {
      return Column(
        key: const Key('story-cards'),
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (final p in widget.paragraphs)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(p, style: style),
            ),
          TextButton.icon(
            key: const Key('story-cards-mode'),
            onPressed: () => setState(() => _all = false),
            icon: const Icon(Icons.style_rounded),
            label: const Text('Read as cards'),
          ),
        ],
      );
    }
    final last = _i == _cards.length - 1;
    final reduce = MediaQuery.of(context).disableAnimations;
    return Column(
      key: const Key('story-cards'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        GestureDetector(
          onTap: last ? null : () => _go(_i + 1),
          onHorizontalDragEnd: (d) {
            final v = d.primaryVelocity ?? 0;
            if (v < -200 && !last) _go(_i + 1);
            if (v > 200 && _i > 0) _go(_i - 1);
          },
          child: AnimatedSwitcher(
            duration: Duration(milliseconds: reduce ? 0 : 320),
            switchInCurve: Curves.easeOutCubic,
            switchOutCurve: Curves.easeInCubic,
            transitionBuilder: (child, anim) {
              final incoming = child.key == ValueKey(_i);
              final dx = (incoming == _forward) ? .18 : -.18;
              return FadeTransition(
                opacity: anim,
                child: SlideTransition(
                  position: Tween(
                    begin: Offset(incoming ? dx : -dx, 0),
                    end: Offset.zero,
                  ).animate(anim),
                  child: child,
                ),
              );
            },
            layoutBuilder: (current, previous) => Stack(
              alignment: Alignment.topCenter,
              children: [...previous, ?current],
            ),
            child: _Card(
              key: ValueKey(_i),
              text: _cards[_i],
              style: style,
              accent: accent,
              page: _i + 1,
              pages: _cards.length,
            ),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            IconButton.outlined(
              key: const Key('story-back'),
              tooltip: 'Back',
              onPressed: _i == 0 ? null : () => _go(_i - 1),
              icon: const Icon(Icons.arrow_back_rounded),
            ),
            Expanded(
              child: _Dots(count: _cards.length, index: _i, accent: accent),
            ),
            last
                ? Container(
                    key: const Key('story-end'),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 9,
                    ),
                    decoration: BoxDecoration(
                      color: successInk.withValues(alpha: .1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.check_circle_rounded,
                          color: successInk,
                          size: 18,
                        ),
                        SizedBox(width: 4),
                        Text(
                          'The end',
                          style: TextStyle(
                            color: successInk,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                  )
                : FilledButton.icon(
                    key: const Key('story-next'),
                    style: FilledButton.styleFrom(
                      backgroundColor: accent,
                      minimumSize: const Size(48, 44),
                    ),
                    onPressed: () => _go(_i + 1),
                    iconAlignment: IconAlignment.end,
                    icon: const Icon(Icons.arrow_forward_rounded, size: 20),
                    label: const Text('Next'),
                  ),
          ],
        ),
        Align(
          alignment: AlignmentDirectional.centerStart,
          child: TextButton(
            key: const Key('story-cards-mode'),
            onPressed: () => setState(() => _all = true),
            child: const Text('Read the whole story'),
          ),
        ),
      ],
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({
    super.key,
    required this.text,
    required this.style,
    required this.accent,
    required this.page,
    required this.pages,
  });
  final String text;
  final TextStyle style;
  final Color accent;
  final int page, pages;
  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    constraints: const BoxConstraints(minHeight: 170),
    padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
    decoration: BoxDecoration(
      gradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Colors.white, Color.lerp(Colors.white, accent, .07)!],
      ),
      borderRadius: BorderRadius.circular(24),
      border: Border.all(color: accent.withValues(alpha: .18)),
      boxShadow: [
        BoxShadow(
          color: accent.withValues(alpha: .12),
          blurRadius: 18,
          offset: const Offset(0, 8),
        ),
      ],
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.auto_stories_rounded, size: 18, color: accent),
            const SizedBox(width: 6),
            Text(
              pages == 1 ? 'Read along' : 'Page $page of $pages',
              style: TextStyle(
                color: accent,
                fontWeight: FontWeight.w800,
                fontSize: 12.5,
                letterSpacing: .3,
              ),
            ),
            const Spacer(),
            Icon(
              Icons.auto_awesome,
              size: 16,
              color: accent.withValues(alpha: .4),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Text(text, style: style),
      ],
    ),
  );
}

class _Dots extends StatelessWidget {
  const _Dots({required this.count, required this.index, required this.accent});
  final int count, index;
  final Color accent;
  @override
  Widget build(BuildContext context) {
    if (count > 12) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: LinearProgressIndicator(
            value: (index + 1) / count,
            minHeight: 8,
            color: accent,
            backgroundColor: accent.withValues(alpha: .12),
          ),
        ),
      );
    }
    return Wrap(
      alignment: WrapAlignment.center,
      spacing: 6,
      runSpacing: 6,
      children: [
        for (var i = 0; i < count; i++)
          AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            width: i == index ? 20 : 8,
            height: 8,
            decoration: BoxDecoration(
              color: i <= index ? accent : accent.withValues(alpha: .18),
              borderRadius: BorderRadius.circular(8),
            ),
          ),
      ],
    );
  }
}
