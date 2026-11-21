import 'package:flutter/material.dart';

import '../screens/ui_kit.dart';

const journeyNavy = Color(0xFF192F52);
const journeyPink = Color(0xFFCA2962);
const journeyOrange = Color(0xFFDD7A10);
const _paper = Color(0xFFFFF8F2);
const _edge = Color(0xFFE8D5C9);

enum JourneyWorld { quran, hadith, duas, salah, tafsir, ibrah, hajj, taleem }

class CourseJourneyHeader extends StatelessWidget {
  const CourseJourneyHeader({
    super.key,
    required this.world,
    required this.title,
    required this.progress,
    this.value,
    this.progressKey,
    this.action,
    this.actionKey,
    this.onAction,
    this.detail,
    this.detailTitle,
  });

  final JourneyWorld world;
  final String title, progress;
  final String? action, detail, detailTitle;
  final double? value;
  final Key? progressKey, actionKey;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      color: _paper,
      border: Border.all(color: _edge),
      borderRadius: BorderRadius.circular(24),
    ),
    clipBehavior: Clip.antiAlias,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        CourseScene(world: world, guide: true),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: displayStyle(27, color: journeyNavy, height: 1.12),
              ),
              const SizedBox(height: 6),
              Text(
                progress,
                key: progressKey,
                style: const TextStyle(
                  color: journeyNavy,
                  fontWeight: FontWeight.w700,
                ),
              ),
              if (value != null) ...[
                const SizedBox(height: 8),
                LinearProgressIndicator(
                  value: value,
                  color: journeyPink,
                  backgroundColor: const Color(0xFFF0DBCE),
                  minHeight: 7,
                  borderRadius: BorderRadius.circular(8),
                ),
              ],
              if (detail != null) ...[
                const SizedBox(height: 9),
                if (detailTitle != null)
                  Text(
                    detailTitle!,
                    style: const TextStyle(
                      color: journeyNavy,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                Text(detail!, style: const TextStyle(color: journeyNavy)),
              ],
              if (onAction != null) ...[
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    key: actionKey,
                    onPressed: onAction,
                    style: FilledButton.styleFrom(
                      backgroundColor: journeyPink,
                      foregroundColor: Colors.white,
                      minimumSize: const Size(48, 48),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 11,
                      ),
                    ),
                    icon: const Icon(Icons.play_arrow_rounded),
                    label: Text(action!),
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    ),
  );
}

class CourseScene extends StatelessWidget {
  const CourseScene({
    super.key,
    required this.world,
    this.guide = false,
    this.height = 144,
    this.showBothGuides = false,
  });

  final JourneyWorld world;
  final bool guide, showBothGuides;
  final double height;

  @override
  Widget build(BuildContext context) {
    final guideFile = switch (world) {
      JourneyWorld.hadith || JourneyWorld.taleem => 'akhlaq',
      JourneyWorld.duas || JourneyWorld.tafsir => 'imaan',
      _ => null,
    };
    return SizedBox(
      height: height,
      child: LayoutBuilder(
        builder: (context, limits) {
          final width = limits.maxWidth;
          final tileHeight = width * 4 / 3;
          return ClipRect(
            child: Stack(
              fit: StackFit.expand,
              children: [
                Positioned(
                  width: width * 4,
                  height: tileHeight * 2,
                  left: -(world.index % 4) * width,
                  top:
                      -(world.index ~/ 4) * tileHeight -
                      (tileHeight - height) * .55,
                  child: Image.asset(
                    'assets/images/course-scenes.png',
                    fit: BoxFit.fill,
                    excludeFromSemantics: true,
                  ),
                ),
                if (guide && guideFile != null)
                  PositionedDirectional(
                    end: 12,
                    bottom: 11,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (showBothGuides) ...[
                          const _GuidePortrait('imaan'),
                          const SizedBox(width: 6),
                        ],
                        _GuidePortrait(guideFile),
                      ],
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _GuidePortrait extends StatelessWidget {
  const _GuidePortrait(this.name);

  final String name;

  @override
  Widget build(BuildContext context) => Container(
    width: 66,
    height: 66,
    decoration: BoxDecoration(
      color: Colors.white,
      shape: BoxShape.circle,
      border: Border.all(color: Colors.white, width: 3),
    ),
    clipBehavior: Clip.antiAlias,
    child: Image.asset(
      'assets/images/course-guide-$name.png',
      alignment: const Alignment(0, -.72),
      fit: BoxFit.cover,
      cacheWidth: 240,
      excludeFromSemantics: true,
    ),
  );
}

class MissionSteps extends StatelessWidget {
  const MissionSteps({super.key, required this.step, required this.count});

  final int step, count;

  @override
  Widget build(BuildContext context) => ExcludeSemantics(
    child: Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 5),
      child: Row(
        spacing: 5,
        children: [
          for (var index = 0; index < count; index++)
            Expanded(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  color: index < step
                      ? journeyPink
                      : index == step
                      ? journeyOrange
                      : const Color(0xFFE8DDD8),
                ),
                child: const SizedBox(height: 6),
              ),
            ),
        ],
      ),
    ),
  );
}

class JourneyStop extends StatelessWidget {
  const JourneyStop({
    super.key,
    required this.number,
    required this.child,
    this.completed = false,
    this.current = false,
    this.first = false,
    this.last = false,
  });

  final int number;
  final Widget child;
  final bool completed, current, first, last;

  @override
  Widget build(BuildContext context) {
    final filled = completed || current;
    final color = completed ? journeyNavy : journeyPink;
    return Stack(
      children: [
        if (!first || !last)
          PositionedDirectional(
            start: 16,
            top: first ? 24 : 0,
            bottom: last ? null : 0,
            height: last ? 24 : null,
            child: Container(
              width: 3,
              color: journeyOrange.withValues(alpha: .35),
            ),
          ),
        PositionedDirectional(
          start: 0,
          top: 8,
          child: Semantics(
            label: completed
                ? 'Completed'
                : current
                ? 'Next on your route'
                : null,
            excludeSemantics: true,
            child: CircleAvatar(
              radius: 18,
              backgroundColor: filled ? color : const Color(0xFFFDE9D8),
              foregroundColor: filled ? Colors.white : journeyNavy,
              child: completed
                  ? const Icon(Icons.check_rounded, size: 21)
                  : Text('$number'),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsetsDirectional.only(start: 44),
          child: DecoratedBox(
            decoration: BoxDecoration(
              border: current ? Border.all(color: journeyPink, width: 2) : null,
              borderRadius: BorderRadius.circular(16),
            ),
            child: child,
          ),
        ),
      ],
    );
  }
}
