import 'package:flutter/material.dart';
import '../admin_domain.dart' show WeeklyActivity;
import '../app_theme.dart';
import '../data/app_repository.dart';
import '../data/catalog.dart';
import '../domain.dart';
import '../teacher_domain.dart';
import 'entry_screens.dart' show BrandLogoRing, brandCream;
import 'ui_kit.dart';

/// Sheets a teacher approved in the last 7 days.
int approvedThisWeek(
  List<(String, Map<String, dynamic>)> sheets,
  DateTime now,
) {
  final since = now.subtract(const Duration(days: 7));
  return sheets.where((s) {
    final at = s.$2['teacherApprovedAt'];
    final t = at is String ? DateTime.tryParse(at)?.toLocal() : null;
    return t != null && t.isAfter(since);
  }).length;
}

/// Native teacher workspace: review queue, class roster and account.
class TeacherShell extends StatefulWidget {
  const TeacherShell({
    super.key,
    required this.repository,
    required this.account,
    this.onChooseSection,
  });
  final AppRepository repository;
  final Profile account;
  final VoidCallback? onChooseSection;
  @override
  State<TeacherShell> createState() => _TeacherShellState();
}

class _TeacherShellState extends State<TeacherShell> {
  int _tab = 0;
  late Stream<List<RosterStudent>> _students;
  late Stream<List<(String, Map<String, dynamic>)>> _sheets;

  @override
  void initState() {
    super.initState();
    _subscribe();
  }

  void _subscribe() {
    _students = widget.repository.schoolStudents(widget.account.schoolId);
    _sheets = widget.repository.schoolSubmissions(widget.account.schoolId);
  }

  Future<void> _signOut() async {
    try {
      await widget.repository.signOut();
    } catch (e) {
      if (mounted) showMessage(context, friendlyError(e));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!canReview(widget.account)) {
      return Scaffold(
        backgroundColor: brandCream,
        appBar: AppBar(
          title: const Text('Teacher workspace'),
          backgroundColor: brandCream,
        ),
        body: MessageView(
          title: 'School link missing',
          message:
              'Your teacher account is not linked to a school yet. '
              'Please ask your school admin to check your login.',
          action: TextButton(
            onPressed: _signOut,
            child: const Text('Sign out'),
          ),
        ),
      );
    }
    return StreamBuilder<List<RosterStudent>>(
      stream: _students,
      builder: (context, students) =>
          StreamBuilder<List<(String, Map<String, dynamic>)>>(
            stream: _sheets,
            builder: (context, sheets) {
              final error = students.error ?? sheets.error;
              final loading = !students.hasData || !sheets.hasData;
              final roster = students.data ?? const <RosterStudent>[];
              final queue = loading
                  ? const <ReviewItem>[]
                  : buildReviewQueue(roster, sheets.data!);
              Widget body;
              if (error != null) {
                body = SafeArea(
                  child: MessageView(
                    title: 'Could not load your school',
                    message: friendlyError(error),
                    action: FilledButton(
                      onPressed: () => setState(_subscribe),
                      child: const Text('Retry'),
                    ),
                  ),
                );
              } else if (loading) {
                body = const Center(child: CircularProgressIndicator());
              } else {
                final now = DateTime.now();
                final activity = WeeklyActivity(sheets.data!, now);
                body = IndexedStack(
                  index: _tab,
                  children: [
                    _ReviewsTab(
                      repository: widget.repository,
                      teacher: widget.account,
                      queue: queue,
                      students: roster.length,
                      approvedWeek: approvedThisWeek(sheets.data!, now),
                      activeWeek: activity.activeStudents.length,
                      onTab: (i) => setState(() => _tab = i),
                    ),
                    _StudentsTab(students: roster),
                    _AccountTab(
                      account: widget.account,
                      studentCount: roster.length,
                      pending: queue.length,
                      onChooseSection: widget.onChooseSection,
                      onSignOut: _signOut,
                    ),
                  ],
                );
              }
              return Scaffold(
                backgroundColor: brandCream,
                body: body,
                bottomNavigationBar: NavigationBar(
                  selectedIndex: _tab,
                  height: 68,
                  backgroundColor: Colors.white,
                  surfaceTintColor: Colors.transparent,
                  shadowColor: brandNavy.withValues(alpha: .2),
                  elevation: 8,
                  indicatorColor: brandPink.withValues(alpha: .14),
                  onDestinationSelected: (i) => setState(() => _tab = i),
                  destinations: [
                    NavigationDestination(
                      key: const Key('teacher-tab-reviews'),
                      icon: Badge(
                        isLabelVisible: queue.isNotEmpty,
                        label: Text('${queue.length}'),
                        child: const Icon(Icons.fact_check_outlined),
                      ),
                      selectedIcon: Badge(
                        isLabelVisible: queue.isNotEmpty,
                        label: Text('${queue.length}'),
                        child: const Icon(
                          Icons.fact_check_rounded,
                          color: brandPink,
                        ),
                      ),
                      label: 'Reviews',
                    ),
                    const NavigationDestination(
                      key: Key('teacher-tab-students'),
                      icon: Icon(Icons.groups_outlined),
                      selectedIcon: Icon(
                        Icons.groups_rounded,
                        color: brandPink,
                      ),
                      label: 'Students',
                    ),
                    const NavigationDestination(
                      key: Key('teacher-tab-account'),
                      icon: Icon(Icons.person_outline_rounded),
                      selectedIcon: Icon(
                        Icons.person_rounded,
                        color: brandPink,
                      ),
                      label: 'Account',
                    ),
                  ],
                ),
              );
            },
          ),
    );
  }
}

Chapter? _chapterFor(List<Book> books, String id) {
  for (final book in books) {
    for (final chapter in book.chapters) {
      if (chapter.id == id) return chapter;
    }
  }
  return null;
}

class _ReviewsTab extends StatelessWidget {
  const _ReviewsTab({
    required this.repository,
    required this.teacher,
    required this.queue,
    required this.students,
    required this.approvedWeek,
    required this.activeWeek,
    required this.onTab,
  });
  final AppRepository repository;
  final Profile teacher;
  final List<ReviewItem> queue;
  final int students, approvedWeek, activeWeek;
  final ValueChanged<int> onTab;

  @override
  Widget build(BuildContext context) {
    final scale = MediaQuery.textScalerOf(context).scale(1).clamp(1.0, 1.6);
    final statHeight = 112 * scale;
    return FutureBuilder<List<Book>>(
      future: Catalog().books(),
      builder: (context, books) {
        final catalog = books.data ?? const <Book>[];
        return ListView(
          key: const Key('teacher-reviews'),
          padding: EdgeInsets.zero,
          children: [
            Stack(
              children: [
                Column(
                  children: [
                    DashboardHero(
                      title: teacher.schoolName.isNotEmpty
                          ? teacher.schoolName
                          : 'Your classes',
                      personName: teacher.name,
                      badge: 'Teacher workspace',
                      badgeIcon: Icons.co_present_rounded,
                      onProfile: () => onTab(2),
                    ),
                    SizedBox(height: statHeight - 44),
                  ],
                ),
                Positioned(
                  left: 16,
                  right: 16,
                  bottom: 8,
                  height: statHeight - 8,
                  child: StatStrip(
                    children: [
                      StatItem(
                        value: queue.length,
                        label: 'To review',
                        icon: Icons.fact_check_rounded,
                        color: brandPink,
                        onTap: () {},
                      ),
                      StatItem(
                        value: students,
                        label: 'Students',
                        icon: Icons.groups_rounded,
                        color: brandIndigo,
                        onTap: () => onTab(1),
                      ),
                      StatItem(
                        value: approvedWeek,
                        label: 'Approved',
                        icon: Icons.verified_rounded,
                        color: successInk,
                        onTap: () {},
                      ),
                      StatItem(
                        value: activeWeek,
                        label: 'Active',
                        icon: Icons.bolt_rounded,
                        color: brandOrange,
                        onTap: () => onTab(1),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            Reveal(
              index: 1,
              child: SectionTitle(
                'Waiting for you',
                trailing: queue.isEmpty ? null : 'Oldest first',
              ),
            ),
            Reveal(
              index: 1,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                child: Text(
                  queue.isEmpty
                      ? 'Nothing is waiting for you.'
                      : '${queue.length} ${queue.length == 1 ? 'sheet is' : 'sheets are'} waiting for your review.',
                  style: const TextStyle(color: mutedInk, fontSize: 14),
                ),
              ),
            ),
            if (queue.isEmpty)
              const Reveal(
                index: 2,
                child: EmptyState(
                  icon: Icons.celebration_rounded,
                  color: brandOrange,
                  title: 'All caught up!',
                  message:
                      'New sheets appear here as soon as students submit '
                      'them.',
                ),
              ),
            for (final (i, item) in queue.indexed)
              Reveal(
                index: i + 2,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                  child: _ReviewCard(
                    item: item,
                    chapterTitle:
                        _chapterFor(catalog, item.chapterId)?.title ??
                        item.chapterId,
                    onOpen: () => Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => ReviewSheetScreen(
                          repository: repository,
                          teacher: teacher,
                          item: item,
                          chapter: _chapterFor(catalog, item.chapterId),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            const SizedBox(height: 24),
          ],
        );
      },
    );
  }
}

String _waited(String iso) {
  final t = DateTime.tryParse(iso)?.toLocal();
  if (t == null) return '';
  final d = DateTime.now().difference(t);
  if (d.inMinutes < 60) return 'just now';
  if (d.inHours < 24) return '${d.inHours}h ago';
  if (d.inDays == 1) return 'yesterday';
  return '${d.inDays} days ago';
}

class _ReviewCard extends StatelessWidget {
  const _ReviewCard({
    required this.item,
    required this.chapterTitle,
    required this.onOpen,
  });
  final ReviewItem item;
  final String chapterTitle;
  final VoidCallback onOpen;
  @override
  Widget build(BuildContext context) {
    final waited = _waited(item.updatedAt);
    final yes = item.cells.where((c) => c == 1).length;
    final total = item.cells.length;
    return Pressable(
      scale: .98,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(22),
          boxShadow: cardDecoration().boxShadow,
        ),
        child: Material(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            key: Key('review-${item.submissionId}'),
            onTap: onOpen,
            child: IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    width: 5,
                    color: item.wasSentBack ? brandOrange : brandPink,
                  ),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(14, 14, 10, 14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              NameAvatar(item.student.name, size: 44),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item.student.name,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: displayStyle(17),
                                    ),
                                    Text(
                                      chapterTitle,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        color: mutedInk,
                                        fontSize: 13.5,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Container(
                                width: 34,
                                height: 34,
                                decoration: BoxDecoration(
                                  color: brandPink.withValues(alpha: .1),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.arrow_forward_rounded,
                                  color: brandPink,
                                  size: 19,
                                ),
                              ),
                            ],
                          ),
                          if (item.answer.isNotEmpty) ...[
                            const SizedBox(height: 10),
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: brandCream,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                '“${item.answer}”',
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Color(0xFF3E4A63),
                                  height: 1.4,
                                  fontStyle: FontStyle.italic,
                                ),
                              ),
                            ),
                          ],
                          const SizedBox(height: 10),
                          Wrap(
                            spacing: 6,
                            runSpacing: 6,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            children: [
                              TagChip(item.student.classLabel),
                              if (item.wasSentBack)
                                const TagChip('Redone', color: brandOrange)
                              else
                                const TagChip('New', color: brandPink),
                              if (total > 0)
                                TagChip(
                                  '$yes/$total actions',
                                  color: successInk,
                                ),
                              if (waited.isNotEmpty)
                                Text(
                                  waited,
                                  style: const TextStyle(
                                    color: mutedInk,
                                    fontSize: 12,
                                  ),
                                ),
                            ],
                          ),
                        ],
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
  }
}

/// The full sheet, with approve / send back.
class ReviewSheetScreen extends StatefulWidget {
  const ReviewSheetScreen({
    super.key,
    required this.repository,
    required this.teacher,
    required this.item,
    required this.chapter,
  });
  final AppRepository repository;
  final Profile teacher;
  final ReviewItem item;
  final Chapter? chapter;
  @override
  State<ReviewSheetScreen> createState() => _ReviewSheetScreenState();
}

class _ReviewSheetScreenState extends State<ReviewSheetScreen> {
  late final _note = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _note.dispose();
    super.dispose();
  }

  Future<void> _review(bool approve) async {
    if (!approve && _note.text.trim().isEmpty) {
      setState(
        () => _error = 'Write a short note so the family knows what to fix.',
      );
      return;
    }
    if (!approve) {
      final sure = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Send back to redo?'),
          content: Text(
            '${widget.item.student.name} will see your note and can do this '
            'chapter again.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              key: const Key('confirm-send-back'),
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Send back'),
            ),
          ],
        ),
      );
      if (sure != true || !mounted) return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await widget.repository.reviewSheet(
        teacher: widget.teacher,
        item: widget.item,
        approve: approve,
        note: _note.text,
      );
      if (!mounted) return;
      final messenger = ScaffoldMessenger.of(context);
      Navigator.of(context).pop();
      messenger.showSnackBar(
        SnackBar(
          content: Text(
            approve
                ? 'Approved. $reviewPoints points for ${widget.item.student.name}.'
                : 'Sent back to ${widget.item.student.name} with your note.',
          ),
        ),
      );
    } catch (e) {
      if (mounted) setState(() => _error = friendlyError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Widget _section(String title, Widget child) => Padding(
    padding: const EdgeInsets.only(top: 18),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            color: brandPink,
            fontWeight: FontWeight.w800,
            fontSize: 14.5,
          ),
        ),
        const SizedBox(height: 8),
        child,
      ],
    ),
  );

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    final chapter = widget.chapter;
    return Scaffold(
      backgroundColor: brandCream,
      appBar: AppBar(
        backgroundColor: brandCream,
        title: Text('Review sheet', style: displayStyle(21)),
      ),
      body: SafeArea(
        child: ConstrainedBody(
          maxWidth: 640,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 28),
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: cardDecoration(),
                child: Row(
                  children: [
                    NameAvatar(item.student.name, size: 48),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.student.name,
                            style: const TextStyle(
                              color: brandNavy,
                              fontWeight: FontWeight.w800,
                              fontSize: 18,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            chapter?.title ?? item.chapterId,
                            style: const TextStyle(color: mutedInk),
                          ),
                          const SizedBox(height: 6),
                          TagChip(item.student.classLabel),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              if (item.wasSentBack && item.teacherNotes.isNotEmpty)
                _section(
                  'Your earlier note',
                  _NoteBox(text: item.teacherNotes, color: brandOrange),
                ),
              _section(
                chapter?.question.isNotEmpty == true
                    ? chapter!.question
                    : 'Discussion answer',
                _NoteBox(
                  text: item.answer.isEmpty
                      ? 'No written answer.'
                      : item.answer,
                  color: brandPink,
                ),
              ),
              _section(
                'Daily actions',
                chapter == null || item.cells.isEmpty
                    ? const _NoteBox(
                        text: 'No daily actions were recorded.',
                        color: brandNavy,
                      )
                    : _GridSummary(chapter: chapter, cells: item.cells),
              ),
              if (item.parentNotes.isNotEmpty)
                _section(
                  'Parent feedback',
                  Column(
                    children: [
                      for (final n in item.parentNotes)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: _NoteBox(text: n, color: brandOrange),
                        ),
                    ],
                  ),
                ),
              _section(
                'Your note to the family',
                TextField(
                  key: const Key('review-note'),
                  controller: _note,
                  enabled: !_busy,
                  minLines: 3,
                  maxLines: 6,
                  maxLength: 500,
                  textCapitalization: TextCapitalization.sentences,
                  decoration: InputDecoration(
                    hintText:
                        'What went well, or what to work on. '
                        'Required when sending back.',
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: const BorderSide(color: lineColor),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: const BorderSide(color: lineColor),
                    ),
                  ),
                ),
              ),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Semantics(
                    liveRegion: true,
                    child: Text(
                      _error!,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.error,
                      ),
                    ),
                  ),
                ),
              const SizedBox(height: 16),
              FilledButton.icon(
                key: const Key('approve-sheet'),
                onPressed: _busy ? null : () => _review(true),
                style: FilledButton.styleFrom(
                  minimumSize: const Size.fromHeight(54),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                icon: _busy
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.check_circle_rounded),
                label: const Text('Approve  ·  +$reviewPoints points'),
              ),
              const SizedBox(height: 10),
              OutlinedButton.icon(
                key: const Key('send-back-sheet'),
                onPressed: _busy ? null : () => _review(false),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(52),
                  foregroundColor: dangerInk,
                  side: const BorderSide(color: Color(0xFFF2C4CC)),
                  backgroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                icon: const Icon(Icons.undo_rounded),
                label: const Text('Send back to redo'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NoteBox extends StatelessWidget {
  const _NoteBox({required this.text, required this.color});
  final String text;
  final Color color;
  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      border: Border(left: BorderSide(color: color, width: 4)),
    ),
    child: Text(
      text,
      style: const TextStyle(color: Color(0xFF2E3A52), height: 1.45),
    ),
  );
}

/// Questions down, Mon–Sun across, ✓ / ✗ / – per cell (row-major cells, the
/// layout the activity sheet saves).
class _GridSummary extends StatelessWidget {
  const _GridSummary({required this.chapter, required this.cells});
  final Chapter chapter;
  final List<int> cells;
  static const _days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  @override
  Widget build(BuildContext context) {
    final yes = cells.where((c) => c == 1).length;
    final no = cells.where((c) => c == 2).length;
    var index = 0;
    final rows = <Widget>[];
    for (final section in chapter.sections) {
      rows.add(
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
          child: Text(
            section.title,
            style: const TextStyle(
              color: brandPink,
              fontWeight: FontWeight.w800,
              fontSize: 13,
            ),
          ),
        ),
      );
      for (final question in section.questions) {
        final start = index;
        index += 7;
        rows.add(
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  question,
                  style: const TextStyle(fontSize: 13.5, color: brandNavy),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    for (var d = 0; d < 7; d++)
                      Expanded(child: _cell(_days[d], cells, start + d)),
                  ],
                ),
              ],
            ),
          ),
        );
      }
    }
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: lineColor),
      ),
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
            child: Wrap(
              spacing: 8,
              children: [
                TagChip('$yes done', color: successInk),
                TagChip('$no missed', color: dangerInk),
              ],
            ),
          ),
          ...rows,
        ],
      ),
    );
  }

  Widget _cell(String day, List<int> cells, int i) {
    final v = i < cells.length ? cells[i] : 0;
    final (icon, color) = switch (v) {
      1 => (Icons.check_circle_rounded, successInk),
      2 => (Icons.cancel_rounded, dangerInk),
      _ => (Icons.remove_rounded, const Color(0xFFC9CED8)),
    };
    return Column(
      children: [
        Text(day, style: const TextStyle(fontSize: 11, color: mutedInk)),
        Icon(icon, size: 20, color: color),
      ],
    );
  }
}

class _StudentsTab extends StatefulWidget {
  const _StudentsTab({required this.students});
  final List<RosterStudent> students;
  @override
  State<_StudentsTab> createState() => _StudentsTabState();
}

class _StudentsTabState extends State<_StudentsTab> {
  String _query = '';
  String _class = '';

  @override
  Widget build(BuildContext context) {
    final q = _query.trim().toLowerCase();
    final classes =
        {
          for (final s in widget.students)
            if (s.classId.isNotEmpty) s.classId,
        }.toList()..sort((a, b) {
          final na = int.tryParse(a), nb = int.tryParse(b);
          if (na != null && nb != null) return na.compareTo(nb);
          return a.compareTo(b);
        });
    final shown =
        widget.students
            .where(
              (s) =>
                  (q.isEmpty || s.name.toLowerCase().contains(q)) &&
                  (_class.isEmpty || s.classId == _class),
            )
            .toList()
          ..sort((a, b) => b.points.compareTo(a.points));
    return ListView(
      key: const Key('teacher-students'),
      padding: const EdgeInsets.only(bottom: 24),
      children: [
        PageHeader(
          title: 'Students',
          subtitle:
              '${widget.students.length} students · ${classes.length} '
              '${classes.length == 1 ? 'class' : 'classes'}',
          icon: Icons.groups_rounded,
          color: brandIndigo,
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
          child: SearchField(onChanged: (v) => setState(() => _query = v)),
        ),
        if (classes.length > 1)
          SizedBox(
            height: 44,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                for (final (value, label) in [
                  ('', 'All · ${widget.students.length}'),
                  for (final c in classes) (c, 'Class $c'),
                ])
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      key: Key('teacher-filter-$value'),
                      label: Text(label),
                      selected: _class == value,
                      onSelected: (_) => setState(() => _class = value),
                      showCheckmark: false,
                      selectedColor: brandNavy,
                      backgroundColor: Colors.white,
                      side: const BorderSide(color: lineColor),
                      labelStyle: TextStyle(
                        color: _class == value ? Colors.white : brandNavy,
                        fontWeight: FontWeight.w700,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        const SizedBox(height: 10),
        if (shown.isEmpty)
          const EmptyState(
            icon: Icons.search_off_rounded,
            color: mutedInk,
            title: 'No students found',
            message: 'Try another class or clear the search.',
          ),
        for (final (i, s) in shown.indexed)
          RowCard(
            index: i,
            key: Key('teacher-student-${s.uid}'),
            child: Row(
              children: [
                NameAvatar(s.name, size: 44),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        s.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: brandNavy,
                          fontWeight: FontWeight.w800,
                          fontSize: 15.5,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          TagChip(s.classLabel),
                          const SizedBox(width: 6),
                          Flexible(
                            child: TagChip(
                              '${s.approved.length} approved',
                              color: successInk,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                PointsPill(s.points),
              ],
            ),
          ),
      ],
    );
  }
}

class _AccountTab extends StatelessWidget {
  const _AccountTab({
    required this.account,
    required this.studentCount,
    required this.pending,
    required this.onSignOut,
    this.onChooseSection,
  });
  final Profile account;
  final int studentCount, pending;
  final VoidCallback onSignOut;
  final VoidCallback? onChooseSection;
  @override
  Widget build(BuildContext context) => ListView(
    key: const Key('teacher-account'),
    padding: EdgeInsets.fromLTRB(
      16,
      MediaQuery.paddingOf(context).top + 24,
      16,
      24,
    ),
    children: [
      const Center(child: BrandLogoRing(size: 92)),
      const SizedBox(height: 14),
      Text(account.name, textAlign: TextAlign.center, style: displayStyle(23)),
      const SizedBox(height: 2),
      Text(
        account.schoolName.isNotEmpty
            ? '${account.schoolName} · Teacher'
            : 'Teacher',
        textAlign: TextAlign.center,
        style: const TextStyle(color: mutedInk),
      ),
      const SizedBox(height: 20),
      SizedBox(
        height: 104,
        child: StatStrip(
          children: [
            StatItem(
              value: studentCount,
              label: 'Students',
              icon: Icons.groups_rounded,
              color: brandIndigo,
              onTap: () {},
            ),
            StatItem(
              value: pending,
              label: 'To review',
              icon: Icons.fact_check_rounded,
              color: brandPink,
              onTap: () {},
            ),
          ],
        ),
      ),
      const SizedBox(height: 20),
      ListCard(
        children: [
          if (onChooseSection != null)
            ListTile(
              leading: const Icon(Icons.swap_horiz_rounded, color: brandNavy),
              title: const Text(
                'Choose section',
                style: TextStyle(fontWeight: FontWeight.w700),
              ),
              onTap: onChooseSection,
            ),
          ListTile(
            key: const Key('teacher-sign-out'),
            leading: const Icon(Icons.logout_rounded, color: dangerInk),
            title: const Text(
              'Sign out',
              style: TextStyle(color: dangerInk, fontWeight: FontWeight.w700),
            ),
            onTap: onSignOut,
          ),
        ],
      ),
    ],
  );
}
