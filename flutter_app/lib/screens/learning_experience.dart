import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../app_theme.dart';
import '../data/catalog.dart';
import '../domain.dart';
import 'hadith_screen.dart';
import '../courses/registry.dart';
import 'ui_kit.dart';
import 'entry_screens.dart' show brandCream;
import '../rewards/rewards.dart';
import '../rewards/reward_widgets.dart';

const courseNames = [
  'Quran',
  'Hadith',
  'Duas',
  'Salah',
  'Tafsir',
  'Prophet Stories',
  'Hajj & Umrah',
  'Taleem-ul-Islam',
];
const courseTints = [
  Color(0xFFFCE2EE),
  Color(0xFFDFF1FC),
  Color(0xFFFFE8CB),
  Color(0xFFEDDEF8),
  Color(0xFFDEEFFB),
  Color(0xFFFBE2EB),
  Color(0xFFE0F2E7),
  Color(0xFFFFECD7),
];

/// The atlas is drawn in native clipping widgets, not eight separate downloads.
/// All tiles share the same cache key and a bounded 1024px decoded image.
class CourseArtwork extends StatelessWidget {
  const CourseArtwork({super.key, required this.index, this.size = 62});
  final int index;
  final double size;
  @override
  Widget build(BuildContext context) => SizedBox(
    width: size,
    height: size,
    child: ExcludeSemantics(
      child: ClipRect(
        child: OverflowBox(
          alignment: Alignment(-1 + (index % 4) * 2 / 3, index < 4 ? -1 : 1),
          minWidth: size * 4,
          maxWidth: size * 4,
          minHeight: size * 2,
          maxHeight: size * 2,
          child: Image.asset(
            'assets/images/course-atlas.png',
            width: size * 4,
            height: size * 2,
            fit: BoxFit.fill,
            cacheWidth: 1024,
          ),
        ),
      ),
    ),
  );
}

/// Strong colour per subject, paired with [courseTints] for the card fill.
const courseAccents = [
  Color(0xFFD63678), // Quran
  Color(0xFF1C8FC2), // Hadith
  Color(0xFFE08020), // Duas
  Color(0xFF7B4FD6), // Salah
  Color(0xFF2F7FD0), // Tafsir
  Color(0xFFC2416E), // Prophet Stories
  Color(0xFF1F8A5B), // Hajj & Umrah
  Color(0xFFD9822B), // Taleem-ul-Islam
];

class LearningDashboard extends StatelessWidget {
  const LearningDashboard({
    super.key,
    this.learner,
    required this.books,
    required this.onContinue,
    required this.onCourse,
    this.onMap,
    this.rewardScope,
  });
  final VoidCallback? onMap;

  /// The Individual learner whose stars, badges and streak are shown, or
  /// null (school learners) to hide the rewards strip.
  final String? rewardScope;
  final Profile? learner;
  final Future<List<Book>> books;
  final VoidCallback onContinue;
  final ValueChanged<int> onCourse;
  @override
  Widget build(BuildContext context) {
    final scale = MediaQuery.textScalerOf(context).scale(14) / 14;
    final columns = scale > 1.2 || MediaQuery.sizeOf(context).width < 350
        ? 2
        : 3;
    final count = courseNames.length + (onMap == null ? 0 : 1);
    if (rewardScope != null) Rewards.instance.use(rewardScope!);
    return CustomScrollView(
      key: const PageStorageKey('smart-home'),
      slivers: [
        SliverToBoxAdapter(
          child: _ContinueCard(
            learner: learner,
            books: books,
            onContinue: onContinue,
          ),
        ),
        if (rewardScope != null)
          const SliverPadding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 0),
            sliver: SliverToBoxAdapter(
              child: Reveal(index: 0, child: RewardStrip()),
            ),
          ),
        SliverPadding(
          padding: EdgeInsets.fromLTRB(
            20,
            rewardScope == null ? 22 : 18,
            20,
            12,
          ),
          sliver: SliverToBoxAdapter(
            child: Reveal(
              index: 0,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Explore learning', style: displayStyle(23)),
                  const SizedBox(height: 2),
                  const Text(
                    'Pick a subject and start a little adventure.',
                    style: TextStyle(color: mutedInk, fontSize: 13.5),
                  ),
                ],
              ),
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          sliver: SliverGrid.builder(
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: columns,
              mainAxisExtent: scale > 1.2 ? 132 + (scale - 1) * 64 : 124,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
            ),
            itemCount: count,
            itemBuilder: (context, i) => Reveal(
              index: 1 + i,
              child: i == 8
                  ? _MapTile(onTap: onMap)
                  : _SubjectTile(index: i, onTap: () => onCourse(i)),
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 18, 16, 24),
          sliver: SliverToBoxAdapter(
            child: Reveal(index: count + 1, child: const _SmallActionCard()),
          ),
        ),
      ],
    );
  }
}

/// One subject: tinted card, artwork on a white disc, rounded label.
class _SubjectTile extends StatelessWidget {
  const _SubjectTile({required this.index, required this.onTap});
  final int index;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    final accent = courseAccents[index];
    final tint = courseTints[index];
    return Pressable(
      scale: .95,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(22),
          boxShadow: [
            BoxShadow(
              color: accent.withValues(alpha: .16),
              blurRadius: 14,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Material(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(22),
            side: BorderSide(color: accent.withValues(alpha: .22), width: 1.2),
          ),
          clipBehavior: Clip.antiAlias,
          child: Ink(
            // Light at the top, the subject colour deepening toward the base.
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color.lerp(tint, Colors.white, .55)!,
                  tint,
                  Color.lerp(tint, accent, .16)!,
                ],
                stops: const [0, .55, 1],
              ),
            ),
            child: InkWell(
              key: Key('course-$index'),
              onTap: onTap,
              splashColor: accent.withValues(alpha: .15),
              child: Stack(
                children: [
                  // Soft accent wave across the bottom of the card.
                  Positioned(
                    left: -30,
                    right: -30,
                    bottom: -44,
                    child: Container(
                      height: 70,
                      decoration: BoxDecoration(
                        borderRadius: const BorderRadius.all(
                          Radius.elliptical(120, 40),
                        ),
                        color: accent.withValues(alpha: .1),
                      ),
                    ),
                  ),
                  // Sparkle in the corner.
                  Positioned(
                    right: 9,
                    top: 8,
                    child: Icon(
                      Icons.auto_awesome,
                      size: 13,
                      color: accent.withValues(alpha: .45),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(8, 11, 8, 10),
                    child: Column(
                      children: [
                        // Icon on a white disc inside a soft accent halo.
                        Container(
                          width: 66,
                          height: 66,
                          padding: const EdgeInsets.all(3),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [
                                accent.withValues(alpha: .55),
                                accent.withValues(alpha: .12),
                              ],
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: accent.withValues(alpha: .28),
                                blurRadius: 12,
                                offset: const Offset(0, 5),
                              ),
                            ],
                          ),
                          child: Container(
                            alignment: Alignment.center,
                            decoration: const BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                            ),
                            child: CourseArtwork(index: index, size: 44),
                          ),
                        ),
                        const SizedBox(height: 7),
                        Expanded(
                          child: Center(
                            child: Text(
                              courseNames[index],
                              textAlign: TextAlign.center,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: displayStyle(
                                14.5,
                                color: Color.lerp(accent, brandNavy, .4)!,
                                height: 1.1,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// The ninth tile: the story map, drawn as the "special" card.
class _MapTile extends StatelessWidget {
  const _MapTile({required this.onTap});
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) => Pressable(
    scale: .95,
    child: Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: brandNavy.withValues(alpha: .28),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Material(
        borderRadius: BorderRadius.circular(22),
        clipBehavior: Clip.antiAlias,
        child: Ink(
          // Same evening sky as the story hero, so the "special" tile belongs.
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [brandNavy, Color(0xFF3B3485), Color(0xFF8A3F8C)],
              stops: [0, .55, 1],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: InkWell(
            key: const Key('home-map'),
            onTap: onTap,
            child: Stack(
              children: [
                Positioned(
                  right: -22,
                  bottom: -22,
                  child: Icon(
                    Icons.map_rounded,
                    size: 84,
                    color: Colors.white.withValues(alpha: .1),
                  ),
                ),
                const Positioned(
                  left: 10,
                  top: 10,
                  child: Icon(
                    Icons.auto_awesome,
                    size: 12,
                    color: Color(0xCCFFE7A8),
                  ),
                ),
                const Positioned(
                  right: 12,
                  top: 30,
                  child: Icon(
                    Icons.auto_awesome,
                    size: 9,
                    color: Color(0x99FFE7A8),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(8, 12, 8, 10),
                  child: Column(
                    children: [
                      Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: const LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [Color(0xFFFFC56B), brandOrange],
                          ),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: .7),
                            width: 2,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(
                                0xFFFFB45C,
                              ).withValues(alpha: .55),
                              blurRadius: 16,
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.explore_rounded,
                          color: Colors.white,
                          size: 34,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Expanded(
                        child: Center(
                          child: Text(
                            'Adventure map',
                            textAlign: TextAlign.center,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: displayStyle(
                              14.5,
                              color: Colors.white,
                              height: 1.1,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}

/// Today's small good deed. Tapping "I did it" celebrates on the spot; the
/// tick is only for this visit and is not saved anywhere.
class _SmallActionCard extends StatefulWidget {
  const _SmallActionCard();
  @override
  State<_SmallActionCard> createState() => _SmallActionCardState();
}

class _SmallActionCardState extends State<_SmallActionCard> {
  bool _done = false;

  @override
  Widget build(BuildContext context) => AnimatedContainer(
    duration: const Duration(milliseconds: 350),
    curve: Curves.easeOutCubic,
    clipBehavior: Clip.antiAlias,
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(22),
      gradient: LinearGradient(
        colors: _done
            ? const [Color(0xFFE3F6EA), Color(0xFFFFF4D6)]
            : const [Color(0xFFFFF1DE), Color(0xFFFFE4EE)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      border: Border.all(
        color: (_done ? const Color(0xFF1F8A5B) : brandOrange).withValues(
          alpha: .28,
        ),
      ),
      boxShadow: [
        BoxShadow(
          color: brandOrange.withValues(alpha: .12),
          blurRadius: 16,
          offset: const Offset(0, 6),
        ),
      ],
    ),
    child: Stack(
      children: [
        // Sun rays peeking from the corner.
        Positioned(
          left: -34,
          top: -34,
          child: Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  const Color(0xFFFFD27A).withValues(alpha: .55),
                  const Color(0x00FFD27A),
                ],
              ),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 12, 16),
          child: Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: brandOrange.withValues(alpha: .25),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 300),
                  transitionBuilder: (child, anim) =>
                      ScaleTransition(scale: anim, child: child),
                  child: Icon(
                    _done ? Icons.favorite_rounded : Icons.wb_sunny_rounded,
                    key: ValueKey(_done),
                    color: _done ? brandPink : brandOrange,
                    size: 28,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _done ? 'MashaAllah!' : 'Today’s small action',
                      style: displayStyle(
                        17,
                        color: _done
                            ? const Color(0xFF1F8A5B)
                            : const Color(0xFFB45F0A),
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      _done
                          ? 'You made someone smile today.'
                          : 'Say one kind thing to someone.',
                      style: const TextStyle(
                        color: brandNavy,
                        fontSize: 14.5,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Semantics(
                button: true,
                label: _done ? 'Done' : 'I did it',
                child: Pressable(
                  scale: .9,
                  child: Material(
                    color: _done ? const Color(0xFF1F8A5B) : Colors.white,
                    shape: const StadiumBorder(),
                    elevation: _done ? 0 : 2,
                    shadowColor: brandOrange.withValues(alpha: .3),
                    child: InkWell(
                      key: const Key('small-action-done'),
                      customBorder: const StadiumBorder(),
                      onTap: () => setState(() => _done = !_done),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 10,
                        ),
                        child: Icon(
                          Icons.check_rounded,
                          size: 22,
                          color: _done ? Colors.white : brandOrange,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _ContinueCard extends StatelessWidget {
  const _ContinueCard({
    required this.learner,
    required this.books,
    required this.onContinue,
  });
  final Profile? learner;
  final Future<List<Book>> books;
  final VoidCallback onContinue;
  @override
  Widget build(BuildContext context) => Container(
    key: const Key('reading-hero'),
    clipBehavior: Clip.antiAlias,
    decoration: const BoxDecoration(
      borderRadius: BorderRadius.vertical(bottom: Radius.circular(30)),
      // Storybook evening sky: deep navy at the top-left where the text sits,
      // warming through violet into a soft sunset pink behind the artwork.
      gradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          brandNavy,
          Color(0xFF3B3485),
          Color(0xFF7A3E8E),
          Color(0xFFC4507E),
        ],
        stops: [0, .42, .75, 1],
      ),
    ),
    child: LayoutBuilder(
      builder: (context, constraints) {
        final stacked =
            constraints.maxWidth < 300 ||
            MediaQuery.textScalerOf(context).scale(14) > 19;
        Widget artwork(double width, double height) => Image.asset(
          'assets/images/reading-hero-book1.png',
          key: const Key('reading-hero-art'),
          width: width,
          height: height,
          fit: BoxFit.contain,
          alignment: Alignment.bottomCenter,
          cacheWidth: 640,
          excludeFromSemantics: true,
        );
        Widget label() => Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: brandOrange.withValues(alpha: .9),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            learner == null ? 'Story time' : 'Up next',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w800,
              letterSpacing: .3,
            ),
          ),
        );
        Widget title() => FutureBuilder<List<Book>>(
          future: books,
          builder: (context, snapshot) {
            final done = learner?.completed.toSet() ?? <String>{};
            final next = snapshot.data
                ?.expand((book) => book.chapters)
                .where((chapter) => !done.contains(chapter.id))
                .firstOrNull;
            return Text(
              learner == null
                  ? 'Read a story together'
                  : next?.title ?? 'Continue reading',
              maxLines: stacked ? null : 3,
              overflow: stacked ? null : TextOverflow.ellipsis,
              style: displayStyle(23, color: Colors.white, height: 1.15),
            );
          },
        );
        Widget button() => FilledButton.icon(
          key: const Key('continue-learning'),
          style: FilledButton.styleFrom(
            backgroundColor: Colors.white,
            foregroundColor: brandPink,
            minimumSize: const Size(48, 46),
            padding: const EdgeInsets.fromLTRB(10, 0, 16, 0),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            elevation: 2,
            shadowColor: Colors.black26,
          ),
          icon: const Icon(Icons.play_circle_fill_rounded, size: 26),
          onPressed: onContinue,
          label: Text(
            learner == null ? 'Read a story' : 'Continue',
            style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w800),
          ),
        );
        final w = constraints.maxWidth;
        final topInset = MediaQuery.paddingOf(context).top;
        Widget star(double left, double top, double size, double alpha) =>
            Positioned(
              left: left,
              top: top + topInset,
              child: Icon(
                Icons.auto_awesome,
                size: size,
                color: const Color(0xFFFFE7A8).withValues(alpha: alpha),
              ),
            );
        Widget dot(double left, double top, double size, double alpha) =>
            Positioned(
              left: left,
              top: top + topInset,
              child: Container(
                width: size,
                height: size,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: alpha),
                ),
              ),
            );
        final rings = [
          // Warm lamp-light glow behind the reading children.
          Positioned(
            right: stacked ? null : -w * .12,
            left: stacked ? w * .5 - 160 : null,
            bottom: stacked ? 30 : -90,
            child: IgnorePointer(
              child: Container(
                width: 320,
                height: 320,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFFFFB45C).withValues(alpha: .55),
                      const Color(0xFFFF8A5C).withValues(alpha: .18),
                      const Color(0x00FF8A5C),
                    ],
                    stops: const [0, .5, 1],
                  ),
                ),
              ),
            ),
          ),
          // Soft rolling hill along the bottom edge.
          Positioned(
            left: -w * .2,
            right: -w * .2,
            bottom: -150,
            child: Container(
              height: 200,
              decoration: BoxDecoration(
                borderRadius: const BorderRadius.all(
                  Radius.elliptical(400, 120),
                ),
                color: Colors.white.withValues(alpha: .07),
              ),
            ),
          ),
          Positioned(
            left: -60,
            top: -60,
            child: Container(
              width: 170,
              height: 170,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: Colors.white.withValues(alpha: .06),
                  width: 16,
                ),
              ),
            ),
          ),
          // Crescent moon.
          Positioned(
            right: 18,
            top: 14 + topInset,
            child: Transform.rotate(
              angle: -.5,
              child: Icon(
                Icons.nightlight_round,
                size: 26,
                color: const Color(0xFFFFE7A8),
                shadows: [
                  Shadow(
                    color: const Color(0xFFFFD27A).withValues(alpha: .8),
                    blurRadius: 14,
                  ),
                ],
              ),
            ),
          ),
          star(w * .38, 18, 14, .85),
          star(w * .55, 46, 10, .6),
          star(w * .8, 64, 12, .7),
          dot(w * .3, 40, 3, .5),
          dot(w * .66, 22, 3, .7),
          dot(w * .52, 84, 2.5, .45),
          dot(w * .9, 40, 2.5, .55),
        ];
        if (stacked) {
          return Stack(
            children: [
              ...rings,
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    label(),
                    const SizedBox(height: 8),
                    title(),
                    const SizedBox(height: 8),
                    Center(child: artwork(220, 145)),
                    const SizedBox(height: 12),
                    SizedBox(width: double.infinity, child: button()),
                  ],
                ),
              ),
            ],
          );
        }
        return ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 188),
          child: Stack(
            children: [
              ...rings,
              Positioned(
                right: -8,
                bottom: 0,
                child: artwork(constraints.maxWidth * .58, 176),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 26, 0, 22),
                child: SizedBox(
                  width: constraints.maxWidth * .46,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      label(),
                      const SizedBox(height: 10),
                      title(),
                      const SizedBox(height: 16),
                      button(),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    ),
  );
}

class AdventureMap extends StatelessWidget {
  const AdventureMap({
    super.key,
    required this.onCourse,
    required this.onBooks,
    required this.onLearn,
  });
  final ValueChanged<int> onCourse;
  final VoidCallback onBooks, onLearn;
  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, constraints) {
      final width = constraints.maxWidth;
      final scale = MediaQuery.textScalerOf(context).scale(14) / 14;
      final height = math.max(
        constraints.maxHeight,
        width * 1.777 + math.max(0, scale - 1) * 140,
      );
      final markerWidth =
          (width * .12).clamp(52.0, 56.0) * math.max(1.0, scale);
      final markerHeight = markerWidth * 1.27;
      // Round pin heads are centered in the clear spaces marked by the user.
      Widget stop(
        String label,
        String key,
        double x,
        double y,
        Color color,
        VoidCallback action,
      ) => Positioned(
        left: (width * x - markerWidth / 2).clamp(4.0, width - markerWidth - 4),
        top: height * y - markerWidth * .485,
        width: markerWidth,
        child: PhysicalShape(
          clipper: const _MapMarkerClipper(),
          clipBehavior: Clip.antiAlias,
          color: color,
          shadowColor: const Color(0x600F2443),
          elevation: 3,
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              key: Key(key),
              onTap: action,
              child: SizedBox(
                height: markerHeight,
                child: Stack(
                  children: [
                    Positioned(
                      top: markerWidth * .075,
                      left: markerWidth * .09,
                      width: markerWidth * .82,
                      height: markerWidth * .82,
                      child: DecoratedBox(
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 2),
                            child: Text(
                              label,
                              textAlign: TextAlign.center,
                              softWrap: false,
                              style: const TextStyle(
                                color: ink,
                                fontSize: 10,
                                height: 1.1,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
      return SingleChildScrollView(
        key: const PageStorageKey('adventure-map'),
        child: SizedBox(
          width: width,
          height: height,
          child: Stack(
            children: [
              Positioned.fill(
                child: Image.asset(
                  'assets/images/amanpur-map.png',
                  fit: BoxFit.fill,
                  cacheWidth: 1000,
                  excludeFromSemantics: true,
                ),
              ),
              stop(
                'Quran\nGarden',
                'map-quran',
                0.255,
                0.09,
                const Color(0xFFD63678),
                () => onCourse(0),
              ),
              stop(
                'Hadith\nHouse',
                'map-hadith',
                0.775,
                0.1,
                const Color(0xFF3478B8),
                () => onCourse(1),
              ),
              stop(
                'Dua\nCorner',
                'map-duas',
                0.175,
                0.28,
                const Color(0xFF208977),
                () => onCourse(2),
              ),
              stop(
                'Salah\nStudio',
                'map-salah',
                0.785,
                0.3,
                const Color(0xFF7653AC),
                () => onCourse(3),
              ),
              stop(
                'Story\nLibrary',
                'map-books',
                0.205,
                0.55,
                const Color(0xFFD97426),
                onBooks,
              ),
              stop(
                'Explore\nMore',
                'map-explore',
                0.88,
                0.64,
                const Color(0xFFC34F59),
                onLearn,
              ),
            ],
          ),
        ),
      );
    },
  );
}

class _MapMarkerClipper extends CustomClipper<Path> {
  const _MapMarkerClipper();
  @override
  Path getClip(Size size) => Path()
    ..moveTo(size.width * .5, size.height)
    ..cubicTo(
      size.width * .42,
      size.height * .84,
      0,
      size.height * .55,
      0,
      size.height * .36,
    )
    ..cubicTo(0, size.height * .16, size.width * .22, 0, size.width * .5, 0)
    ..cubicTo(
      size.width * .78,
      0,
      size.width,
      size.height * .16,
      size.width,
      size.height * .36,
    )
    ..cubicTo(
      size.width,
      size.height * .55,
      size.width * .58,
      size.height * .84,
      size.width * .5,
      size.height,
    )
    ..close();
  @override
  bool shouldReclip(_MapMarkerClipper oldClipper) => false;
}

Future<void> showCourseDetails(
  BuildContext context,
  int index, {
  String? hadithScope,
}) {
  if (index == 1 && hadithScope != null) {
    return Navigator.of(context).push<void>(
      MaterialPageRoute(builder: (_) => HadithCourseScreen(scope: hadithScope)),
    );
  }
  if (hadithScope != null) Rewards.instance.use(hadithScope);
  final entry = courseEntry(index);
  if (entry != null && hadithScope != null) {
    return Navigator.of(
      context,
    ).push<void>(MaterialPageRoute(builder: (_) => entry.open(hadithScope)));
  }
  return showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    builder: (context) => SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CourseArtwork(index: index, size: 86),
            const SizedBox(height: 14),
            Text(
              courses[index].title,
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 12),
            Text(
              courses[index].scope,
              style: const TextStyle(fontSize: 16, height: 1.5),
            ),
            const SizedBox(height: 16),
            const Text(
              'In preparation. This journey will open after its lessons and audio are reviewed.',
              style: TextStyle(color: Color(0xFF66738E), height: 1.5),
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Got it'),
            ),
          ],
        ),
      ),
    ),
  );
}

class CourseLibrary extends StatelessWidget {
  const CourseLibrary({super.key, this.hadithScope});
  final String? hadithScope;
  @override
  Widget build(BuildContext context) => ListView.builder(
    key: const PageStorageKey('course-library'),
    padding: const EdgeInsets.only(bottom: 24),
    itemCount: courses.length + 1,
    itemBuilder: (context, index) {
      if (index == 0) {
        return PageHeader(
          title: 'Learning Hub',
          subtitle: hadithScope != null
              ? 'Start with the Hadith lessons, or explore the other journeys.'
              : 'New learning journeys are in preparation. Explore your stories and books today.',
          icon: Icons.auto_stories_rounded,
          color: brandPink,
        );
      }
      final i = index - 1;
      final status = i == 1 && hadithScope != null
          ? '100 lessons • Ready to explore'
          : (hadithScope == null ? null : courseEntry(i)?.subtitle) ??
                'In preparation';
      final ready = status != 'In preparation';
      final accent = courseAccents[i];
      return RowCard(
        index: i,
        accent: accent,
        onTap: () => showCourseDetails(context, i, hadithScope: hadithScope),
        child: Row(
          children: [
            Container(
              width: 64,
              height: 64,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: courseTints[i],
                shape: BoxShape.circle,
                border: Border.all(
                  color: accent.withValues(alpha: .25),
                  width: 1.5,
                ),
              ),
              child: CourseArtwork(index: i, size: 46),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    courses[i].title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: displayStyle(
                      16.5,
                      color: Color.lerp(accent, brandNavy, .45)!,
                      height: 1.15,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    courses[i].subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: mutedInk, fontSize: 13),
                  ),
                  const SizedBox(height: 8),
                  _StatusChip(text: status, ready: ready),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: accent.withValues(alpha: .12),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.arrow_forward_rounded, color: accent, size: 20),
            ),
          ],
        ),
      );
    },
  );
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.text, required this.ready});
  final String text;
  final bool ready;
  @override
  Widget build(BuildContext context) {
    final color = ready ? successInk : mutedInk;
    return Container(
      padding: const EdgeInsets.fromLTRB(7, 3, 10, 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: ready ? .12 : .09),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            ready ? Icons.play_circle_fill_rounded : Icons.schedule_rounded,
            size: 14,
            color: color,
          ),
          const SizedBox(width: 4),
          Flexible(
            child: Text(
              text,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: color,
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Book cover colours, cycled.
const _bookColors = [
  [Color(0xFF2C4A7C), brandNavy],
  [brandPink, Color(0xFFF07AA8)],
  [brandOrange, Color(0xFFF2B05A)],
  [successInk, Color(0xFF4CB98A)],
  [Color(0xFF7B4FD6), Color(0xFFA788F0)],
];

class BookLibrary extends StatelessWidget {
  const BookLibrary({
    super.key,
    required this.books,
    required this.onChapter,
    required this.onRetry,
  });
  final Future<List<Book>> books;
  final void Function(Book, Chapter) onChapter;
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) => FutureBuilder<List<Book>>(
    future: books,
    builder: (context, snapshot) {
      if (snapshot.hasError) {
        return MessageView(
          title: 'Books could not load',
          message: 'Please try again.',
          action: FilledButton(onPressed: onRetry, child: const Text('Retry')),
        );
      }
      if (!snapshot.hasData) {
        return const Center(child: CircularProgressIndicator());
      }
      final list = snapshot.data!;
      return ListView.builder(
        key: const PageStorageKey('book-library'),
        padding: const EdgeInsets.only(bottom: 24),
        itemCount: list.length + 1,
        itemBuilder: (context, index) {
          if (index == 0) {
            return const PageHeader(
              title: 'Stories & books',
              subtitle: 'Choose a book, then open a chapter.',
              icon: Icons.menu_book_rounded,
              color: brandIndigo,
            );
          }
          final i = index - 1;
          return Reveal(
            index: i,
            child: _BookCard(
              number: i + 1,
              book: list[i],
              colors: _bookColors[i % _bookColors.length],
              onChapter: onChapter,
            ),
          );
        },
      );
    },
  );
}

class _BookCard extends StatefulWidget {
  const _BookCard({
    required this.number,
    required this.book,
    required this.colors,
    required this.onChapter,
  });
  final int number;
  final Book book;
  final List<Color> colors;
  final void Function(Book, Chapter) onChapter;
  @override
  State<_BookCard> createState() => _BookCardState();
}

class _BookCardState extends State<_BookCard> {
  late bool _open =
      PageStorage.maybeOf(
            context,
          )?.readState(context, identifier: 'book-${widget.book.id}')
          as bool? ??
      false;

  void _toggle() {
    setState(() => _open = !_open);
    PageStorage.maybeOf(
      context,
    )?.writeState(context, _open, identifier: 'book-${widget.book.id}');
  }

  @override
  Widget build(BuildContext context) {
    final accent = widget.colors.first;
    final book = widget.book;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(22),
          boxShadow: [
            BoxShadow(
              color: accent.withValues(alpha: .16),
              blurRadius: 22,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Material(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          clipBehavior: Clip.antiAlias,
          child: Column(
            children: [
              InkWell(
                onTap: _toggle,
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    children: [
                      // A small "cover" with the book number.
                      Container(
                        width: 58,
                        height: 74,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          borderRadius: const BorderRadius.horizontal(
                            left: Radius.circular(6),
                            right: Radius.circular(14),
                          ),
                          gradient: LinearGradient(
                            colors: widget.colors,
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: accent.withValues(alpha: .3),
                              blurRadius: 10,
                              offset: const Offset(2, 5),
                            ),
                          ],
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.auto_stories_rounded,
                              color: Colors.white,
                              size: 22,
                            ),
                            Text(
                              '${widget.number}',
                              style: displayStyle(20, color: Colors.white),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              book.title,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: displayStyle(17, height: 1.15),
                            ),
                            const SizedBox(height: 6),
                            TagChip(
                              '${book.chapters.length} chapters',
                              color: accent,
                            ),
                          ],
                        ),
                      ),
                      AnimatedRotation(
                        turns: _open ? .5 : 0,
                        duration: const Duration(milliseconds: 200),
                        child: Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: accent.withValues(alpha: .12),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.keyboard_arrow_down_rounded,
                            color: accent,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              AnimatedSize(
                duration: const Duration(milliseconds: 220),
                curve: Curves.easeOutCubic,
                alignment: Alignment.topCenter,
                child: !_open
                    ? const SizedBox(width: double.infinity)
                    : Container(
                        width: double.infinity,
                        color: brandCream,
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        child: Column(
                          children: [
                            for (final (n, chapter) in book.chapters.indexed)
                              InkWell(
                                onTap: () => widget.onChapter(book, chapter),
                                child: Padding(
                                  padding: const EdgeInsets.fromLTRB(
                                    16,
                                    10,
                                    14,
                                    10,
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 30,
                                        height: 30,
                                        alignment: Alignment.center,
                                        decoration: BoxDecoration(
                                          color: Colors.white,
                                          shape: BoxShape.circle,
                                          border: Border.all(
                                            color: accent.withValues(
                                              alpha: .35,
                                            ),
                                          ),
                                        ),
                                        child: Text(
                                          '${n + 1}',
                                          style: displayStyle(
                                            13,
                                            color: accent,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              chapter.title,
                                              style: const TextStyle(
                                                color: brandNavy,
                                                fontWeight: FontWeight.w700,
                                              ),
                                            ),
                                            Text(
                                              'Pages ${chapter.pageStart}–${chapter.pageEnd}',
                                              style: const TextStyle(
                                                color: mutedInk,
                                                fontSize: 12.5,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Icon(
                                        Icons.chevron_right_rounded,
                                        color: accent,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class LearningNavigation extends StatelessWidget {
  const LearningNavigation({
    super.key,
    required this.selectedIndex,
    required this.onSelected,
    this.guest = false,
  });
  final int selectedIndex;
  final ValueChanged<int> onSelected;
  final bool guest;
  @override
  Widget build(BuildContext context) => NavigationBar(
    height: 64,
    elevation: 0,
    backgroundColor: Colors.white,
    indicatorColor: const Color(0xFFFCE2EE),
    selectedIndex: selectedIndex,
    onDestinationSelected: onSelected,
    destinations: [
      const NavigationDestination(
        key: Key('nav-home'),
        icon: Icon(Icons.home_outlined),
        selectedIcon: Icon(Icons.home, color: brandPink),
        label: 'Home',
      ),
      const NavigationDestination(
        key: Key('nav-map'),
        icon: Icon(Icons.map_outlined),
        selectedIcon: Icon(Icons.map, color: brandPink),
        label: 'Map',
      ),
      const NavigationDestination(
        key: Key('nav-learn'),
        icon: Icon(Icons.school_outlined),
        selectedIcon: Icon(Icons.school, color: brandPink),
        label: 'Learn',
      ),
      const NavigationDestination(
        key: Key('nav-books'),
        icon: Icon(Icons.menu_book_outlined),
        selectedIcon: Icon(Icons.menu_book, color: brandPink),
        label: 'Books',
      ),
      NavigationDestination(
        key: const Key('nav-profile'),
        icon: Icon(guest ? Icons.person_outline : Icons.insights_outlined),
        selectedIcon: Icon(
          guest ? Icons.person : Icons.insights,
          color: brandPink,
        ),
        label: guest ? 'Profile' : 'Progress',
      ),
    ],
  );
}
