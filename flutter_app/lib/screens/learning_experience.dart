import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../app_theme.dart';
import '../data/catalog.dart';
import '../domain.dart';
import 'hadith_screen.dart';
import '../courses/registry.dart';
import 'ui_kit.dart';

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
  });
  final VoidCallback? onMap;
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
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 22, 20, 12),
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
          color: tint,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(22),
            side: BorderSide(color: accent.withValues(alpha: .28), width: 1.4),
          ),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            key: Key('course-$index'),
            onTap: onTap,
            splashColor: accent.withValues(alpha: .15),
            child: Stack(
              children: [
                // A soft bubble in the corner gives each card some depth.
                Positioned(
                  right: -18,
                  top: -18,
                  child: Container(
                    width: 58,
                    height: 58,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white.withValues(alpha: .55),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(8, 12, 8, 10),
                  child: Column(
                    children: [
                      Container(
                        width: 60,
                        height: 60,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: accent.withValues(alpha: .22),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: CourseArtwork(index: index, size: 44),
                      ),
                      const SizedBox(height: 8),
                      Expanded(
                        child: Center(
                          child: Text(
                            courseNames[index],
                            textAlign: TextAlign.center,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: displayStyle(
                              14.5,
                              color: Color.lerp(accent, brandNavy, .35)!,
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
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [brandNavy, brandIndigo],
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
                Padding(
                  padding: const EdgeInsets.fromLTRB(8, 12, 8, 10),
                  child: Column(
                    children: [
                      Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withValues(alpha: .16),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: .5),
                            width: 1.5,
                          ),
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

class _SmallActionCard extends StatelessWidget {
  const _SmallActionCard();
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(22),
      gradient: const LinearGradient(
        colors: [Color(0xFFFFF1DE), Color(0xFFFFE4EE)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      border: Border.all(color: brandOrange.withValues(alpha: .25)),
    ),
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
          child: const Icon(
            Icons.wb_sunny_rounded,
            color: brandOrange,
            size: 28,
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Today’s small action',
                style: displayStyle(17, color: const Color(0xFFB45F0A)),
              ),
              const SizedBox(height: 3),
              const Text(
                'Say one kind thing to someone.',
                style: TextStyle(
                  color: brandNavy,
                  fontSize: 14.5,
                  fontWeight: FontWeight.w600,
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
      gradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF2C4A7C), brandNavy],
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
        final rings = [
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
          Positioned(
            right: 24,
            top: 22 + MediaQuery.paddingOf(context).top,
            child: Container(
              width: 9,
              height: 9,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: brandOrange,
              ),
            ),
          ),
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
  final entry = courseEntry(index);
  if (entry != null && hadithScope != null) {
    return Navigator.of(context).push<void>(
      MaterialPageRoute(builder: (_) => entry.open(hadithScope)),
    );
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
    padding: const EdgeInsets.all(18),
    itemCount: courses.length + 1,
    itemBuilder: (context, index) {
      if (index == 0) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Learning Hub',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 8),
              Text(
                hadithScope != null
                    ? 'Start with five Hadith lessons, or explore the journeys being prepared.'
                    : 'New learning journeys are in preparation. Explore your stories and books today.',
              ),
            ],
          ),
        );
      }
      final i = index - 1;
      return Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Card(
          child: ListTile(
            contentPadding: const EdgeInsets.all(14),
            leading: CourseArtwork(index: i, size: 54),
            title: Text(
              courses[i].title,
              style: const TextStyle(fontWeight: FontWeight.w800),
            ),
            subtitle: Text(
              i == 1 && hadithScope != null
                  ? '100 lessons • Ready to explore'
                  : (hadithScope == null ? null : courseEntry(i)?.subtitle) ??
                        'In preparation',
            ),
            trailing: const Icon(Icons.chevron_right),
            onTap: () =>
                showCourseDetails(context, i, hadithScope: hadithScope),
          ),
        ),
      );
    },
  );
}

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
      return ListView.builder(
        key: const PageStorageKey('book-library'),
        padding: const EdgeInsets.all(18),
        itemCount: snapshot.data!.length + 1,
        itemBuilder: (context, index) {
          if (index == 0) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Stories & books',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 8),
                  const Text('Choose a book, then open a chapter.'),
                ],
              ),
            );
          }
          final book = snapshot.data![index - 1];
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Card(
              clipBehavior: Clip.antiAlias,
              child: ExpansionTile(
                key: PageStorageKey(book.id),
                leading: const Icon(Icons.menu_book_rounded, color: brandPink),
                title: Text(
                  book.title,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                subtitle: Text('${book.chapters.length} chapters'),
                children: [
                  for (final chapter in book.chapters)
                    ListTile(
                      title: Text(chapter.title),
                      subtitle: Text(
                        'Pages ${chapter.pageStart}–${chapter.pageEnd}',
                      ),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => onChapter(book, chapter),
                    ),
                ],
              ),
            ),
          );
        },
      );
    },
  );
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
