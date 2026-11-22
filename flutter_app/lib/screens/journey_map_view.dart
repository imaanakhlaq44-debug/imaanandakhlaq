import 'package:flutter/material.dart';

import '../courses/course_journey.dart';
import 'ui_kit.dart';

class AmanpurMapBanner extends StatelessWidget {
  const AmanpurMapBanner({
    super.key,
    required this.title,
    required this.progress,
    required this.fraction,
    this.nextLabel,
    this.nextTitle,
    this.action,
    this.onPlay,
  });

  final String title, progress;
  final double fraction;
  final String? nextLabel, nextTitle, action;
  final VoidCallback? onPlay;

  @override
  Widget build(BuildContext context) => Card(
    elevation: 0,
    margin: EdgeInsets.zero,
    color: journeyNavy,
    clipBehavior: Clip.antiAlias,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          height: 110,
          child: Image.asset(
            'assets/images/amanpur-map.png',
            alignment: const Alignment(0, -.58),
            fit: BoxFit.cover,
            excludeFromSemantics: true,
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 10, 14, 11),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(title, style: displayStyle(24, color: Colors.white)),
              const SizedBox(height: 5),
              Text(progress, style: const TextStyle(color: Colors.white)),
              const SizedBox(height: 7),
              LinearProgressIndicator(
                value: fraction,
                color: const Color(0xFFFFBC69),
                backgroundColor: const Color(0xFF516581),
                borderRadius: BorderRadius.circular(10),
                minHeight: 6,
              ),
              if (nextTitle != null) ...[
                const SizedBox(height: 8),
                Text(
                  nextLabel!,
                  style: const TextStyle(
                    color: Color(0xFFFFCE99),
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  nextTitle!,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 6),
                FilledButton.icon(
                  key: const Key('journey-play-next'),
                  onPressed: onPlay,
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFFFFC783),
                    foregroundColor: journeyNavy,
                    minimumSize: const Size(48, 48),
                  ),
                  icon: const Icon(Icons.play_arrow_rounded),
                  label: Text(action!),
                ),
              ],
            ],
          ),
        ),
      ],
    ),
  );
}

enum AmanpurStopStatus { complete, review, next, practice }

class AmanpurMapStop extends StatelessWidget {
  const AmanpurMapStop({
    super.key,
    required this.index,
    required this.length,
    required this.number,
    required this.title,
    required this.status,
    required this.statusLabel,
    required this.checkpoint,
    required this.checkpointLabel,
    required this.onTap,
  });

  final int index, length, number;
  final String title, statusLabel, checkpointLabel;
  final AmanpurStopStatus status;
  final bool checkpoint;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final leading = index.isEven;
    final rtl = Directionality.of(context) == TextDirection.rtl;
    final active = status == AmanpurStopStatus.next;
    final complete = status == AmanpurStopStatus.complete;
    final review = status == AmanpurStopStatus.review;
    final accent = switch (status) {
      AmanpurStopStatus.next => journeyPink,
      AmanpurStopStatus.complete => journeyNavy,
      AmanpurStopStatus.review => const Color(0xFF94500B),
      AmanpurStopStatus.practice => const Color(0xFF45624B),
    };
    return LayoutBuilder(
      builder: (context, bounds) {
        final markerWidth = (bounds.maxWidth * .27).clamp(48.0, 100.0);
        final left = leading != rtl;
        final marker = SizedBox(
          width: markerWidth,
          child: Center(
            child: Container(
              constraints: const BoxConstraints(minWidth: 42, minHeight: 42),
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 3),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: active || complete ? accent : const Color(0xFFFFF7E5),
                border: Border.all(color: Colors.white, width: active ? 4 : 3),
                boxShadow: [
                  BoxShadow(
                    color: accent.withValues(alpha: .24),
                    blurRadius: 6,
                  ),
                ],
              ),
              child: complete
                  ? const Icon(Icons.check_rounded, color: Colors.white)
                  : Text(
                      '$number',
                      textAlign: TextAlign.center,
                      style: displayStyle(
                        15,
                        color: active ? Colors.white : accent,
                      ),
                    ),
            ),
          ),
        );
        final caption = checkpoint
            ? checkpointLabel
            : active || review
            ? statusLabel
            : null;
        final sign = Expanded(
          child: Align(
            alignment: leading
                ? AlignmentDirectional.centerStart
                : AlignmentDirectional.centerEnd,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 164),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                decoration: BoxDecoration(
                  color: active
                      ? const Color(0xFFFFE7F1)
                      : const Color(0xFFFFFCED),
                  border: Border.all(
                    color: active ? journeyPink : const Color(0xFFDADAC3),
                  ),
                  borderRadius: BorderRadius.circular(9),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: journeyNavy,
                        fontWeight: FontWeight.w800,
                        fontSize: 12.5,
                      ),
                    ),
                    if (caption != null)
                      Text(
                        caption,
                        style: TextStyle(
                          color: accent,
                          fontWeight: FontWeight.w800,
                          fontSize: 11,
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        );
        return CustomPaint(
          painter: _AmanpurPath(
            markerX: left ? markerWidth / 2 : bounds.maxWidth - markerWidth / 2,
            left: left,
            first: index == 0,
            last: index == length - 1,
          ),
          child: Semantics(
            label: '$number, $title, $statusLabel',
            excludeSemantics: true,
            button: true,
            onTap: onTap,
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                key: ValueKey('journey-stop-$number'),
                onTap: onTap,
                child: Padding(
                  padding: EdgeInsetsDirectional.fromSTEB(
                    leading ? 0 : 10,
                    8,
                    leading ? 10 : 0,
                    8,
                  ),
                  child: Row(
                    children: leading ? [marker, sign] : [sign, marker],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _AmanpurPath extends CustomPainter {
  const _AmanpurPath({
    required this.markerX,
    required this.left,
    required this.first,
    required this.last,
  });

  final double markerX;
  final bool left, first, last;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.save();
    canvas.clipRect(Offset.zero & size);
    final w = size.width;
    final h = size.height;
    final y = h / 2;
    final edgeX = left ? 0.0 : w;
    final grass = Paint()..color = const Color(0xFFDDEBD2);
    canvas.drawOval(
      Rect.fromCenter(center: Offset(edgeX, y), width: w * .7, height: h * .89),
      grass,
    );
    grass.color = const Color(0xFFCFDFC0);
    canvas.drawCircle(Offset(left ? w * .14 : w * .86, h * .18), 5, grass);
    canvas.drawCircle(Offset(left ? w * .25 : w * .75, h * .83), 4, grass);

    final path = Path();
    if (first) {
      path.moveTo(markerX, y);
    } else {
      path
        ..moveTo(w / 2, 0)
        ..cubicTo(w / 2, h * .23, markerX, h * .22, markerX, y);
    }
    if (!last) {
      path.cubicTo(markerX, h * .78, w / 2, h * .77, w / 2, h);
    }
    final stroke = Paint()..style = PaintingStyle.stroke;
    canvas.drawPath(
      path,
      stroke
        ..color = const Color(0xFFD7AE76)
        ..strokeWidth = 19,
    );
    canvas.drawPath(
      path,
      stroke
        ..color = const Color(0xFFFFDEAD)
        ..strokeWidth = 15,
    );
    stroke
      ..color = const Color(0xFFA67740)
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round;
    for (final segment in path.computeMetrics()) {
      for (var offset = 1.0; offset < segment.length; offset += 10) {
        canvas.drawPath(
          segment.extractPath(offset, (offset + 4).clamp(0.0, segment.length)),
          stroke,
        );
      }
    }
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _AmanpurPath old) =>
      old.markerX != markerX ||
      old.left != left ||
      old.first != first ||
      old.last != last;
}
