import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../app_theme.dart';
import '../data/catalog.dart';
import '../domain.dart';
import 'hadith_screen.dart';

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
          padding: const EdgeInsets.fromLTRB(18, 20, 18, 8),
          sliver: SliverList.list(
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Explore learning',
                      style: Theme.of(
                        context,
                      ).textTheme.titleLarge?.copyWith(fontSize: 21),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 18),
          sliver: SliverGrid.builder(
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: columns,
              mainAxisExtent: scale > 1.2 ? 118 + (scale - 1) * 60 : 110,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
            ),
            itemCount: courseNames.length + (onMap == null ? 0 : 1),
            itemBuilder: (context, i) => Material(
              color: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: const BorderSide(color: Color(0xFFCBD3E1), width: 1.2),
              ),
              clipBehavior: Clip.antiAlias,
              child: InkWell(
                key: Key(i == 8 ? 'home-map' : 'course-$i'),
                onTap: i == 8 ? onMap : () => onCourse(i),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 8,
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (i == 8)
                        const SizedBox(
                          width: 46,
                          height: 46,
                          child: Icon(
                            Icons.explore_rounded,
                            color: brandPink,
                            size: 38,
                          ),
                        )
                      else
                        CourseArtwork(index: i, size: 46),
                      const SizedBox(height: 7),
                      Expanded(
                        child: Center(
                          child: Text(
                            i == 8 ? 'Adventure map' : courseNames[i],
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: ink,
                              fontSize: 13,
                              height: 1.15,
                              fontWeight: FontWeight.w700,
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
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(18, 16, 18, 22),
          sliver: SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFCBD3E1), width: 1.2),
              ),
              child: const Row(
                children: [
                  Icon(
                    Icons.event_available_outlined,
                    color: brandOrange,
                    size: 30,
                  ),
                  SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Today’s small action',
                          style: TextStyle(
                            color: ink,
                            fontWeight: FontWeight.w800,
                            fontSize: 15,
                          ),
                        ),
                        SizedBox(height: 3),
                        Text(
                          'Say one kind thing to someone.',
                          style: TextStyle(color: ink, fontSize: 14),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
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
    decoration: BoxDecoration(
      borderRadius: const BorderRadius.vertical(bottom: Radius.circular(24)),
      gradient: const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF294573), Color(0xFF1E2D5A)],
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
                  ? 'Story time'
                  : next?.title ?? 'Continue reading',
              maxLines: stacked ? null : 3,
              overflow: stacked ? null : TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 24,
                height: 1.15,
                fontWeight: FontWeight.w800,
              ),
            );
          },
        );
        Widget button() => TextButton.icon(
          key: const Key('continue-learning'),
          style: TextButton.styleFrom(
            foregroundColor: Colors.white,
            padding: const EdgeInsets.only(right: 10),
            minimumSize: const Size(48, 48),
          ),
          icon: const Icon(Icons.play_circle_fill_rounded, size: 32),
          onPressed: onContinue,
          label: Text(
            learner == null ? 'Read a story' : 'Continue',
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
          ),
        );
        if (stacked) {
          return Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                title(),
                const SizedBox(height: 8),
                Center(child: artwork(220, 145)),
                const SizedBox(height: 12),
                SizedBox(width: double.infinity, child: button()),
              ],
            ),
          );
        }
        return ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 168),
          child: Stack(
            children: [
              Positioned(
                right: -8,
                bottom: 0,
                child: artwork(constraints.maxWidth * .60, 166),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(18, 28, 0, 22),
                child: SizedBox(
                  width: constraints.maxWidth * .44,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [title(), const SizedBox(height: 20), button()],
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
                  ? '5 lessons • Ready to explore'
                  : 'In preparation',
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
