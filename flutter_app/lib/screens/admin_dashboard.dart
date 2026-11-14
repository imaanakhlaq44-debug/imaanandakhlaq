import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../admin_domain.dart';
import '../app_theme.dart';
import '../data/app_repository.dart';
import '../domain.dart';
import '../teacher_domain.dart';
import 'admin_web_screen.dart' show adminDashboardUrl;
import 'entry_screens.dart' show BrandLogoRing, brandCream;
import 'ui_kit.dart';

/// "1 student", "2 students".
String plural(int n, String one, [String? many]) =>
    '$n ${n == 1 ? one : many ?? '${one}s'}';

/// Messages from the admin Cloud Functions are written for people; show them.
String adminError(Object e) {
  if (e is FirebaseFunctionsException &&
      (e.message ?? '').isNotEmpty &&
      e.code != 'internal' &&
      e.code != 'unavailable') {
    return e.message!;
  }
  if (e is FirebaseFunctionsException && e.code == 'unavailable') {
    return 'Check your internet connection and try again.';
  }
  return friendlyError(e);
}

const _gold = Color(0xFFE0A100);
const _silver = Color(0xFF8A94A6);
const _bronze = Color(0xFFC07A3A);

/// Colour per class card, cycled.
const _classPalette = [
  (brandPink, Color(0xFFF07AA8)),
  (brandOrange, Color(0xFFF2B05A)),
  (brandNavy, brandIndigo),
  (successInk, Color(0xFF4CB98A)),
  (Color(0xFF7B4FD6), Color(0xFFA788F0)),
  (Color(0xFF1C8FC2), Color(0xFF5CC0E8)),
];

/// Student list filter: all, one class, or students with no family yet.
const filterAll = '';
const filterNoFamily = '__no_family__';

/// Native school admin dashboard: overview, students, teachers, families.
class AdminDashboard extends StatefulWidget {
  const AdminDashboard({
    super.key,
    required this.repository,
    required this.account,
    required this.onSignOut,
    this.onChooseSection,
  });
  final AppRepository repository;
  final Profile account;
  final VoidCallback onSignOut;
  final VoidCallback? onChooseSection;
  @override
  State<AdminDashboard> createState() => _AdminDashboardState();
}

class _AdminDashboardState extends State<AdminDashboard> {
  int _tab = 0;
  String _studentFilter = filterAll;
  late Stream<List<SchoolMember>> _members;
  late Stream<List<(String, Map<String, dynamic>)>> _sheets;

  @override
  void initState() {
    super.initState();
    _subscribe();
  }

  void _subscribe() {
    _members = widget.repository.schoolMembers(widget.account.schoolId);
    _sheets = widget.repository.schoolSubmissions(widget.account.schoolId);
  }

  String get _schoolName => widget.account.schoolName.isNotEmpty
      ? widget.account.schoolName
      : 'Your school';

  void _go(int tab, {String? filter}) => setState(() {
    _tab = tab;
    if (filter != null) _studentFilter = filter;
  });

  @override
  Widget build(BuildContext context) {
    if (widget.account.schoolId.isEmpty) {
      return Scaffold(
        backgroundColor: brandCream,
        body: MessageView(
          title: 'School link missing',
          message:
              'This admin account is not attached to a school. '
              'Please contact Imaan & Akhlaq support.',
          action: TextButton(
            onPressed: widget.onSignOut,
            child: const Text('Sign out'),
          ),
        ),
      );
    }
    return StreamBuilder<List<SchoolMember>>(
      stream: _members,
      builder: (context, members) =>
          StreamBuilder<List<(String, Map<String, dynamic>)>>(
            stream: _sheets,
            builder: (context, sheets) {
              final summary = members.hasData
                  ? SchoolSummary(members.data!)
                  : null;
              Widget body;
              if (members.hasError) {
                body = MessageView(
                  title: 'Could not load your school',
                  message: friendlyError(members.error!),
                  action: FilledButton(
                    onPressed: () => setState(_subscribe),
                    child: const Text('Retry'),
                  ),
                );
              } else if (summary == null) {
                body = const Center(child: CircularProgressIndicator());
              } else {
                // Sheets only feed one overview line; if they fail to load,
                // the rest of the dashboard still works.
                final pending = sheets.hasData
                    ? buildReviewQueue([
                        for (final s in summary.students)
                          RosterStudent(
                            uid: s.uid,
                            name: s.name,
                            classId: s.classId,
                          ),
                      ], sheets.data!).length
                    : null;
                final activity = sheets.hasData
                    ? WeeklyActivity(sheets.data!, DateTime.now())
                    : null;
                final actions = _Actions(context, widget.repository, summary);
                body = IndexedStack(
                  index: _tab,
                  children: [
                    _OverviewTab(
                      schoolName: _schoolName,
                      adminName: widget.account.name,
                      summary: summary,
                      pendingReviews: pending,
                      activity: activity,
                      actions: actions,
                      onGo: _go,
                      onOpenWebsite: () => _openWebsite(context),
                    ),
                    _StudentsTab(
                      summary: summary,
                      actions: actions,
                      filter: _studentFilter,
                      onFilter: (f) => setState(() => _studentFilter = f),
                    ),
                    _TeachersTab(summary: summary, actions: actions),
                    _FamiliesTab(summary: summary, actions: actions),
                    _MoreTab(
                      account: widget.account,
                      schoolName: _schoolName,
                      summary: summary,
                      onSignOut: widget.onSignOut,
                      onChooseSection: widget.onChooseSection,
                      onOpenWebsite: () => _openWebsite(context),
                    ),
                  ],
                );
              }
              final fab = summary == null
                  ? null
                  : switch (_tab) {
                      1 => _Fab(
                        key: const Key('add-student'),
                        label: 'Add student',
                        icon: Icons.person_add_alt_1_rounded,
                        onPressed: () => _Actions(
                          context,
                          widget.repository,
                          summary,
                        ).addStudent(),
                      ),
                      2 => _Fab(
                        key: const Key('add-teacher'),
                        label: 'Add teacher',
                        icon: Icons.co_present_rounded,
                        onPressed: () => _Actions(
                          context,
                          widget.repository,
                          summary,
                        ).addTeacher(),
                      ),
                      3 => _Fab(
                        key: const Key('add-family'),
                        label: 'Add family',
                        icon: Icons.family_restroom_rounded,
                        onPressed: () => _Actions(
                          context,
                          widget.repository,
                          summary,
                        ).addFamily(),
                      ),
                      _ => null,
                    };
              return Scaffold(
                key: const Key('admin-dashboard'),
                backgroundColor: brandCream,
                body: body,
                floatingActionButton: fab,
                bottomNavigationBar: NavigationBar(
                  selectedIndex: _tab,
                  height: 68,
                  backgroundColor: Colors.white,
                  surfaceTintColor: Colors.transparent,
                  shadowColor: brandNavy.withValues(alpha: .2),
                  elevation: 8,
                  indicatorColor: brandPink.withValues(alpha: .14),
                  labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
                  onDestinationSelected: (i) => _go(i),
                  destinations: const [
                    NavigationDestination(
                      key: Key('admin-tab-overview'),
                      icon: Icon(Icons.space_dashboard_outlined),
                      selectedIcon: Icon(
                        Icons.space_dashboard_rounded,
                        color: brandPink,
                      ),
                      label: 'Home',
                    ),
                    NavigationDestination(
                      key: Key('admin-tab-students'),
                      icon: Icon(Icons.school_outlined),
                      selectedIcon: Icon(
                        Icons.school_rounded,
                        color: brandPink,
                      ),
                      label: 'Students',
                    ),
                    NavigationDestination(
                      key: Key('admin-tab-teachers'),
                      icon: Icon(Icons.co_present_outlined),
                      selectedIcon: Icon(
                        Icons.co_present_rounded,
                        color: brandPink,
                      ),
                      label: 'Teachers',
                    ),
                    NavigationDestination(
                      key: Key('admin-tab-families'),
                      icon: Icon(Icons.family_restroom_outlined),
                      selectedIcon: Icon(
                        Icons.family_restroom_rounded,
                        color: brandPink,
                      ),
                      label: 'Families',
                    ),
                    NavigationDestination(
                      key: Key('admin-tab-more'),
                      icon: Icon(Icons.settings_outlined),
                      selectedIcon: Icon(
                        Icons.settings_rounded,
                        color: brandPink,
                      ),
                      label: 'More',
                    ),
                  ],
                ),
              );
            },
          ),
    );
  }

  Future<void> _openWebsite(BuildContext context) async {
    final ok = await launchUrl(
      adminDashboardUrl(widget.account.role),
      mode: LaunchMode.externalApplication,
    );
    if (!ok && context.mounted) {
      showMessage(context, 'Could not open the browser.');
    }
  }
}

class _Fab extends StatelessWidget {
  const _Fab({
    super.key,
    required this.label,
    required this.icon,
    required this.onPressed,
  });
  final String label;
  final IconData icon;
  final VoidCallback onPressed;
  @override
  Widget build(BuildContext context) => FloatingActionButton.extended(
    onPressed: onPressed,
    backgroundColor: brandPink,
    foregroundColor: Colors.white,
    elevation: 3,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
    icon: Icon(icon),
    label: Text(
      label,
      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
    ),
  );
}

// ═════════════════════════════ Overview ═════════════════════════════

class _OverviewTab extends StatelessWidget {
  const _OverviewTab({
    required this.schoolName,
    required this.adminName,
    required this.summary,
    required this.pendingReviews,
    required this.activity,
    required this.actions,
    required this.onGo,
    required this.onOpenWebsite,
  });
  final String schoolName, adminName;
  final SchoolSummary summary;
  final int? pendingReviews;
  final WeeklyActivity? activity;
  final _Actions actions;
  final void Function(int tab, {String? filter}) onGo;
  final VoidCallback onOpenWebsite;

  @override
  Widget build(BuildContext context) {
    final scale = MediaQuery.textScalerOf(context).scale(1).clamp(1.0, 1.6);
    final statHeight = 112 * scale;
    final classes = summary.byClass(summary.students);
    return ListView(
      key: const Key('admin-overview'),
      padding: EdgeInsets.zero,
      children: [
        // Hero with the stat cards riding over its lower edge.
        Stack(
          children: [
            Column(
              children: [
                DashboardHero(
                  title: schoolName,
                  personName: adminName,
                  badge: 'School admin workspace',
                  onProfile: () => onGo(4),
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
                    value: summary.students.length,
                    label: 'Students',
                    icon: Icons.school_rounded,
                    color: brandPink,
                    onTap: () => onGo(1, filter: filterAll),
                  ),
                  StatItem(
                    value: summary.teachers.length,
                    label: 'Teachers',
                    icon: Icons.co_present_rounded,
                    color: brandIndigo,
                    onTap: () => onGo(2),
                  ),
                  StatItem(
                    value: summary.families.length,
                    label: 'Families',
                    icon: Icons.family_restroom_rounded,
                    color: brandOrange,
                    onTap: () => onGo(3),
                  ),
                  StatItem(
                    value: summary.classes.length,
                    label: 'Classes',
                    icon: Icons.meeting_room_rounded,
                    color: successInk,
                    onTap: () => onGo(1, filter: filterAll),
                  ),
                ],
              ),
            ),
          ],
        ),
        const Reveal(index: 1, child: SectionTitle('Quick actions')),
        Reveal(
          index: 2,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _QuickAction(
                  key: const Key('quick-add-student'),
                  label: 'Add\nstudent',
                  icon: Icons.person_add_alt_1_rounded,
                  colors: const [brandPink, Color(0xFFF07AA8)],
                  onTap: actions.addStudent,
                ),
                _QuickAction(
                  key: const Key('quick-add-teacher'),
                  label: 'Add\nteacher',
                  icon: Icons.co_present_rounded,
                  colors: const [brandNavy, brandIndigo],
                  onTap: actions.addTeacher,
                ),
                _QuickAction(
                  key: const Key('quick-add-family'),
                  label: 'Add\nfamily',
                  icon: Icons.family_restroom_rounded,
                  colors: const [brandOrange, Color(0xFFF2B05A)],
                  onTap: actions.addFamily,
                ),
                _QuickAction(
                  label: 'Full\nwebsite',
                  icon: Icons.language_rounded,
                  colors: const [successInk, Color(0xFF4CB98A)],
                  onTap: onOpenWebsite,
                ),
              ],
            ),
          ),
        ),
        const Reveal(index: 3, child: SectionTitle('Needs attention')),
        Reveal(
          index: 4,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                if (summary.teachers.isEmpty)
                  _AttentionCard(
                    icon: Icons.co_present_rounded,
                    color: brandIndigo,
                    title: 'Add your first teacher',
                    subtitle: 'Teachers review the work students submit.',
                    action: 'Add teacher',
                    onAction: actions.addTeacher,
                  ),
                if (summary.studentsWithoutFamily > 0)
                  _AttentionCard(
                    icon: Icons.link_rounded,
                    color: brandOrange,
                    title:
                        '${plural(summary.studentsWithoutFamily, 'student')} '
                        'without a family',
                    subtitle: 'Link them so parents can follow progress.',
                    action: 'Link now',
                    onAction: () => onGo(1, filter: filterNoFamily),
                  ),
                if ((pendingReviews ?? 0) > 0)
                  _AttentionCard(
                    icon: Icons.fact_check_rounded,
                    color: brandPink,
                    title:
                        '${plural(pendingReviews!, 'sheet')} waiting for '
                        'teachers',
                    subtitle: 'Teachers approve these in their app.',
                  ),
                if (summary.teachers.isNotEmpty &&
                    summary.studentsWithoutFamily == 0 &&
                    (pendingReviews ?? 0) == 0)
                  const _AttentionCard(
                    icon: Icons.task_alt_rounded,
                    color: successInk,
                    title: 'All caught up',
                    subtitle: 'Nothing needs your attention right now.',
                  ),
              ],
            ),
          ),
        ),
        if (activity != null) ...[
          Reveal(
            index: 5,
            child: SectionTitle(
              'This week',
              trailing: '${plural(activity!.thisWeek, 'sheet')} submitted',
            ),
          ),
          Reveal(
            index: 6,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: _WeekChart(
                activity: activity!,
                students: summary.students.length,
              ),
            ),
          ),
        ],
        if (classes.isNotEmpty) ...[
          Reveal(
            index: 7,
            child: SectionTitle(
              'Classes',
              trailing: plural(summary.classes.length, 'class', 'classes'),
            ),
          ),
          Reveal(
            index: 8,
            child: SizedBox(
              height: 150 * scale,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  for (final (i, entry) in classes.entries.indexed)
                    _ClassCard(
                      label: entry.key,
                      count: entry.value.length,
                      points: entry.value.fold(0, (s, m) => s + m.points),
                      active: activity?.activeShare(entry.value),
                      colors: _classPalette[i % _classPalette.length],
                      onTap: () => onGo(
                        1,
                        filter: entry.value.first.classId.isEmpty
                            ? filterAll
                            : entry.value.first.classId,
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
        if (summary.students.isNotEmpty) ...[
          Reveal(
            index: 8,
            child: SectionTitle(
              'Top students',
              trailing:
                  '${plural(summary.approvedChapters, 'chapter')} approved',
            ),
          ),
          Reveal(
            index: 8,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: _Leaderboard(students: summary.topStudents),
            ),
          ),
        ],
        const SizedBox(height: 28),
      ],
    );
  }
}

/// One white card holding the four headline numbers side by side, so all of
/// them are visible at once on a phone.

class _QuickAction extends StatelessWidget {
  const _QuickAction({
    super.key,
    required this.label,
    required this.icon,
    required this.colors,
    required this.onTap,
  });
  final String label;
  final IconData icon;
  final List<Color> colors;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Expanded(
    child: Semantics(
      button: true,
      label: label.replaceAll('\n', ' '),
      excludeSemantics: true,
      child: Pressable(
        scale: .92,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(18),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Column(
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    gradient: LinearGradient(
                      colors: colors,
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: colors.first.withValues(alpha: .3),
                        blurRadius: 14,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Icon(icon, color: Colors.white, size: 28),
                ),
                const SizedBox(height: 8),
                Text(
                  label,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: brandNavy,
                    fontSize: 12.5,
                    height: 1.2,
                    fontWeight: FontWeight.w600,
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

class _AttentionCard extends StatelessWidget {
  const _AttentionCard({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
    this.action,
    this.onAction,
  });
  final IconData icon;
  final Color color;
  final String title, subtitle;
  final String? action;
  final VoidCallback? onAction;
  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 10),
    padding: const EdgeInsets.fromLTRB(14, 14, 12, 14),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      border: Border(left: BorderSide(color: color, width: 5)),
      boxShadow: [
        BoxShadow(
          color: brandNavy.withValues(alpha: .05),
          blurRadius: 16,
          offset: const Offset(0, 6),
        ),
      ],
    ),
    child: Row(
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: color.withValues(alpha: .12),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Icon(icon, color: color),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: brandNavy,
                  fontWeight: FontWeight.w800,
                  fontSize: 15,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(color: mutedInk, fontSize: 13),
              ),
            ],
          ),
        ),
        if (action != null) ...[
          const SizedBox(width: 8),
          FilledButton(
            onPressed: onAction,
            style: FilledButton.styleFrom(
              backgroundColor: color,
              minimumSize: const Size(48, 40),
              padding: const EdgeInsets.symmetric(horizontal: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Text(action!),
          ),
        ],
      ],
    ),
  );
}

class _ClassCard extends StatelessWidget {
  const _ClassCard({
    required this.label,
    required this.count,
    required this.points,
    required this.active,
    required this.colors,
    required this.onTap,
  });
  final String label;
  final int count, points;

  /// Share of the class that submitted work this week, 0–1; null while
  /// sheets are still loading.
  final double? active;
  final (Color, Color) colors;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(right: 12, bottom: 8),
    child: Pressable(
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(22),
          boxShadow: [
            BoxShadow(
              color: colors.$1.withValues(alpha: .28),
              blurRadius: 16,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Material(
          borderRadius: BorderRadius.circular(22),
          clipBehavior: Clip.antiAlias,
          child: Ink(
            width: 150,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [colors.$1, colors.$2],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: InkWell(
              onTap: onTap,
              child: Stack(
                children: [
                  Positioned(
                    right: -16,
                    top: -16,
                    child: Icon(
                      Icons.meeting_room_rounded,
                      size: 78,
                      color: Colors.white.withValues(alpha: .13),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          label,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: displayStyle(17, color: Colors.white),
                        ),
                        const Spacer(),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.baseline,
                          textBaseline: TextBaseline.alphabetic,
                          children: [
                            CountUp(
                              count,
                              style: displayStyle(
                                30,
                                color: Colors.white,
                                height: 1,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                count == 1 ? 'student' : 'students',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: .85),
                                  fontSize: 12.5,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        if (active != null) ...[
                          ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: TweenAnimationBuilder<double>(
                              tween: Tween(end: active!),
                              duration: const Duration(milliseconds: 900),
                              curve: Curves.easeOutCubic,
                              builder: (context, v, _) =>
                                  LinearProgressIndicator(
                                    value: v,
                                    minHeight: 6,
                                    color: Colors.white,
                                    backgroundColor: Colors.white.withValues(
                                      alpha: .25,
                                    ),
                                  ),
                            ),
                          ),
                          const SizedBox(height: 5),
                          Text(
                            '${(active! * 100).round()}% active this week',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: .9),
                              fontSize: 11.5,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ] else
                          Text(
                            '$points pts',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: .9),
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
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
    ),
  );
}

/// Seven days of submissions as bars, today highlighted, with the change
/// against the week before.
class _WeekChart extends StatelessWidget {
  const _WeekChart({required this.activity, required this.students});
  final WeeklyActivity activity;
  final int students;

  static const _letters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  @override
  Widget build(BuildContext context) {
    final best = activity.best;
    final delta = activity.thisWeek - activity.lastWeek;
    final activePct = students == 0
        ? 0
        : (activity.activeStudents.length / students * 100).round();
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 14),
      decoration: cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CountUp(
                      activity.thisWeek,
                      style: displayStyle(30, height: 1),
                    ),
                    const SizedBox(height: 2),
                    const Text(
                      'sheets in the last 7 days',
                      style: TextStyle(color: mutedInk, fontSize: 13),
                    ),
                  ],
                ),
              ),
              _DeltaChip(delta),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 120,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                for (var i = 0; i < 7; i++)
                  Expanded(
                    child: _Bar(
                      value: activity.perDay[i],
                      share: best == 0 ? 0 : activity.perDay[i] / best,
                      label: _letters[activity.days[i].weekday - 1],
                      today: i == 6,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: brandCream,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                const Icon(Icons.bolt_rounded, color: brandOrange, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '${activity.activeStudents.length} of '
                    '${plural(students, 'student')} active this week '
                    '($activePct%)',
                    style: const TextStyle(
                      color: brandNavy,
                      fontWeight: FontWeight.w600,
                      fontSize: 13.5,
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
}

class _Bar extends StatelessWidget {
  const _Bar({
    required this.value,
    required this.share,
    required this.label,
    required this.today,
  });
  final int value;
  final double share;
  final String label;
  final bool today;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 5),
    child: Column(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        Text(
          value == 0 ? '' : '$value',
          style: TextStyle(
            color: today ? brandPink : mutedInk,
            fontSize: 11.5,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 4),
        Expanded(
          child: Align(
            alignment: Alignment.bottomCenter,
            child: TweenAnimationBuilder<double>(
              tween: Tween(end: share),
              duration: const Duration(milliseconds: 900),
              curve: Curves.easeOutCubic,
              builder: (context, v, _) => FractionallySizedBox(
                // A sliver even on empty days, so the week reads as a row.
                heightFactor: v.clamp(.06, 1.0),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    gradient: today
                        ? const LinearGradient(
                            colors: [brandPink, brandOrange],
                            begin: Alignment.bottomCenter,
                            end: Alignment.topCenter,
                          )
                        : null,
                    color: today
                        ? null
                        : (value == 0
                              ? lineColor
                              : brandNavy.withValues(alpha: .18)),
                  ),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          label,
          style: TextStyle(
            color: today ? brandPink : mutedInk,
            fontSize: 12,
            fontWeight: today ? FontWeight.w800 : FontWeight.w600,
          ),
        ),
      ],
    ),
  );
}

class _DeltaChip extends StatelessWidget {
  const _DeltaChip(this.delta);
  final int delta;
  @override
  Widget build(BuildContext context) {
    final (icon, color, text) = delta > 0
        ? (Icons.trending_up_rounded, successInk, '+$delta')
        : delta < 0
        ? (Icons.trending_down_rounded, dangerInk, '$delta')
        : (Icons.trending_flat_rounded, mutedInk, 'same');
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 4),
          Text(
            '$text vs last week',
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w700,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}

class _Leaderboard extends StatelessWidget {
  const _Leaderboard({required this.students});
  final List<SchoolMember> students;
  @override
  Widget build(BuildContext context) {
    final podium = students.take(3).toList();
    final rest = students.skip(3).take(5).toList();
    // Always three slots in the order 2 · 1 · 3, the way a real podium
    // stands; an empty slot keeps 1st in the middle with fewer students.
    final order = <(SchoolMember, int)?>[
      podium.length > 1 ? (podium[1], 2) : null,
      (podium[0], 1),
      podium.length > 2 ? (podium[2], 3) : null,
    ];
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 18, 12, 8),
      decoration: cardDecoration(),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              for (final place in order)
                Expanded(
                  child: place == null
                      ? const SizedBox.shrink()
                      : _PodiumPlace(student: place.$1, rank: place.$2),
                ),
            ],
          ),
          if (rest.isNotEmpty) ...[
            const SizedBox(height: 10),
            for (final (i, s) in rest.indexed)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Row(
                  children: [
                    SizedBox(
                      width: 28,
                      child: Text(
                        '${i + 4}',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: mutedInk,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    NameAvatar(s.name, size: 32),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        s.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: brandNavy,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    PointsPill(s.points),
                  ],
                ),
              ),
          ],
        ],
      ),
    );
  }
}

class _PodiumPlace extends StatelessWidget {
  const _PodiumPlace({required this.student, required this.rank});
  final SchoolMember student;
  final int rank;
  @override
  Widget build(BuildContext context) {
    final (color, height, avatar) = switch (rank) {
      1 => (_gold, 74.0, 58.0),
      2 => (_silver, 54.0, 48.0),
      _ => (_bronze, 40.0, 44.0),
    };
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Column(
        children: [
          if (rank == 1)
            const Icon(Icons.emoji_events_rounded, color: _gold, size: 26),
          Stack(
            clipBehavior: Clip.none,
            alignment: Alignment.bottomCenter,
            children: [
              Container(
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: color, width: 3),
                ),
                child: NameAvatar(student.name, size: avatar),
              ),
              Positioned(
                bottom: -8,
                child: Container(
                  width: 22,
                  height: 22,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                  child: Text(
                    '$rank',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            student.name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: brandNavy,
              fontWeight: FontWeight.w800,
              fontSize: 13.5,
            ),
          ),
          Text(
            '${student.points} pts',
            style: const TextStyle(
              color: brandOrange,
              fontWeight: FontWeight.w800,
              fontSize: 12.5,
            ),
          ),
          const SizedBox(height: 6),
          // The pedestal rises into place, 1st place last and tallest.
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: height),
            duration: Duration(milliseconds: 700 + 150 * (3 - rank)),
            curve: Curves.easeOutBack,
            builder: (context, h, _) => Container(
              height: h.clamp(0, height + 8),
              alignment: Alignment.topCenter,
              padding: const EdgeInsets.only(top: 6),
              decoration: BoxDecoration(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(12),
                ),
                gradient: LinearGradient(
                  colors: [
                    color.withValues(alpha: .9),
                    color.withValues(alpha: .55),
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
              child: h < 24
                  ? null
                  : Text('$rank', style: displayStyle(18, color: Colors.white)),
            ),
          ),
        ],
      ),
    );
  }
}

// ═════════════════════════ Shared list pieces ═════════════════════════

/// Page header for the list tabs.

/// A tappable white card row.

class _UsernamePill extends StatelessWidget {
  const _UsernamePill(this.username);
  final String username;
  @override
  Widget build(BuildContext context) => InkWell(
    borderRadius: BorderRadius.circular(10),
    onTap: () async {
      await Clipboard.setData(ClipboardData(text: username));
      if (context.mounted) showMessage(context, '$username copied.');
    },
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: brandNavy.withValues(alpha: .06),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            username,
            style: const TextStyle(
              color: brandNavy,
              fontWeight: FontWeight.w700,
              fontSize: 12.5,
              letterSpacing: .3,
            ),
          ),
          const SizedBox(width: 4),
          const Icon(Icons.copy_rounded, size: 13, color: mutedInk),
        ],
      ),
    ),
  );
}

// ═════════════════════════════ Students ═════════════════════════════

class _StudentsTab extends StatefulWidget {
  const _StudentsTab({
    required this.summary,
    required this.actions,
    required this.filter,
    required this.onFilter,
  });
  final SchoolSummary summary;
  final _Actions actions;
  final String filter;
  final ValueChanged<String> onFilter;
  @override
  State<_StudentsTab> createState() => _StudentsTabState();
}

class _StudentsTabState extends State<_StudentsTab> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final summary = widget.summary;
    final q = _query.trim().toLowerCase();
    final classIds = summary.classes.toList()
      ..sort((a, b) {
        final na = int.tryParse(a), nb = int.tryParse(b);
        if (na != null && nb != null) return na.compareTo(nb);
        return a.compareTo(b);
      });
    final shown =
        summary.students.where((s) {
          if (q.isNotEmpty && !s.name.toLowerCase().contains(q)) return false;
          if (widget.filter == filterNoFamily) return s.familyUid.isEmpty;
          if (widget.filter != filterAll) return s.classId == widget.filter;
          return true;
        }).toList()..sort((a, b) {
          final c = a.classId.compareTo(b.classId);
          return c != 0 ? c : a.name.compareTo(b.name);
        });
    final familyName = {for (final f in summary.families) f.uid: f.name};
    final chips = <(String, String)>[
      (filterAll, 'All · ${summary.students.length}'),
      for (final c in classIds) (c, 'Class $c'),
      if (summary.studentsWithoutFamily > 0)
        (filterNoFamily, 'No family · ${summary.studentsWithoutFamily}'),
    ];
    return ListView(
      key: const Key('admin-students'),
      padding: const EdgeInsets.only(bottom: 110),
      children: [
        PageHeader(
          title: 'Students',
          subtitle:
              '${plural(summary.students.length, 'student')} · '
              '${plural(summary.classes.length, 'class', 'classes')}',
          icon: Icons.school_rounded,
          color: brandPink,
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
          child: SearchField(onChanged: (v) => setState(() => _query = v)),
        ),
        SizedBox(
          height: 44,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            children: [
              for (final (value, label) in chips)
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    key: Key('filter-$value'),
                    label: Text(label),
                    selected: widget.filter == value,
                    onSelected: (_) => widget.onFilter(value),
                    showCheckmark: false,
                    selectedColor: value == filterNoFamily
                        ? brandOrange
                        : brandNavy,
                    backgroundColor: Colors.white,
                    side: const BorderSide(color: lineColor),
                    labelStyle: TextStyle(
                      color: widget.filter == value ? Colors.white : brandNavy,
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
        if (summary.students.isEmpty)
          const EmptyState(
            icon: Icons.school_rounded,
            color: brandPink,
            title: 'No students yet',
            message: 'Tap “Add student” to create the first one.',
          )
        else if (shown.isEmpty)
          const EmptyState(
            icon: Icons.search_off_rounded,
            color: mutedInk,
            title: 'Nobody here',
            message: 'Try another class or clear the search.',
          ),
        for (final (i, s) in shown.indexed)
          RowCard(
            index: i,
            key: Key('student-${s.uid}'),
            onTap: () => widget.actions.studentDetails(s),
            child: Row(
              children: [
                NameAvatar(s.name, size: 46),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Line 1: name, points on the right.
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              s.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: brandNavy,
                                fontWeight: FontWeight.w800,
                                fontSize: 15.5,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          PointsPill(s.points),
                        ],
                      ),
                      const SizedBox(height: 6),
                      // Line 2: class, then family; the family shortens
                      // with an ellipsis instead of wrapping.
                      Row(
                        children: [
                          TagChip(s.classLabel),
                          const SizedBox(width: 6),
                          Flexible(
                            child: s.familyUid.isEmpty
                                ? const TagChip('No family', color: brandOrange)
                                : TagChip(
                                    familyName[s.familyUid] ?? 'Family linked',
                                    color: successInk,
                                  ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

// ═════════════════════════════ Teachers ═════════════════════════════

class _TeachersTab extends StatelessWidget {
  const _TeachersTab({required this.summary, required this.actions});
  final SchoolSummary summary;
  final _Actions actions;
  @override
  Widget build(BuildContext context) {
    final teachers = summary.teachers;
    return ListView(
      key: const Key('admin-teachers'),
      padding: const EdgeInsets.only(bottom: 110),
      children: [
        PageHeader(
          title: 'Teachers',
          subtitle:
              '${plural(teachers.length, 'teacher')} · each with '
              'their own login',
          icon: Icons.co_present_rounded,
          color: brandIndigo,
        ),
        if (teachers.isEmpty)
          const EmptyState(
            icon: Icons.co_present_rounded,
            color: brandIndigo,
            title: 'No teachers yet',
            message:
                'Tap “Add teacher”. You will get a login to hand them '
                'straight away.',
          ),
        for (final (i, t) in teachers.indexed)
          RowCard(
            index: i,
            key: Key('teacher-${t.uid}'),
            child: Row(
              children: [
                NameAvatar(
                  t.name,
                  size: 48,
                  colors: const [brandNavy, brandIndigo],
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        t.name,
                        style: const TextStyle(
                          color: brandNavy,
                          fontWeight: FontWeight.w800,
                          fontSize: 15.5,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 6,
                        runSpacing: 4,
                        children: [
                          if (t.username.isNotEmpty) _UsernamePill(t.username),
                          if (t.classId.isNotEmpty) TagChip(t.classLabel),
                        ],
                      ),
                    ],
                  ),
                ),
                if (t.username.isNotEmpty)
                  RoundAction(
                    key: Key('reset-teacher-${t.uid}'),
                    icon: Icons.key_rounded,
                    tooltip: 'Reset password',
                    color: brandNavy,
                    onPressed: () => actions.resetTeacher(t),
                  ),
                const SizedBox(width: 6),
                RoundAction(
                  key: Key('remove-teacher-${t.uid}'),
                  icon: Icons.delete_outline_rounded,
                  tooltip: 'Remove teacher',
                  color: dangerInk,
                  onPressed: () => actions.removeTeacher(t),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

// ═════════════════════════════ Families ═════════════════════════════

class _FamiliesTab extends StatefulWidget {
  const _FamiliesTab({required this.summary, required this.actions});
  final SchoolSummary summary;
  final _Actions actions;
  @override
  State<_FamiliesTab> createState() => _FamiliesTabState();
}

class _FamiliesTabState extends State<_FamiliesTab> {
  String _query = '';
  @override
  Widget build(BuildContext context) {
    final summary = widget.summary;
    final q = _query.trim().toLowerCase();
    final families = summary.families
        .where(
          (f) =>
              q.isEmpty ||
              f.name.toLowerCase().contains(q) ||
              f.username.toLowerCase().contains(q),
        )
        .toList();
    return ListView(
      key: const Key('admin-families'),
      padding: const EdgeInsets.only(bottom: 110),
      children: [
        PageHeader(
          title: 'Families',
          subtitle:
              '${plural(summary.families.length, 'family', 'families')} · '
              'one login per home',
          icon: Icons.family_restroom_rounded,
          color: brandOrange,
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
          child: SearchField(
            hint: 'Search name or PAR- username',
            onChanged: (v) => setState(() => _query = v),
          ),
        ),
        if (summary.families.isEmpty)
          const EmptyState(
            icon: Icons.family_restroom_rounded,
            color: brandOrange,
            title: 'No families yet',
            message:
                'Tap “Add family” to create a parent login, then link '
                'their children.',
          ),
        for (final (i, f) in families.indexed)
          Builder(
            builder: (context) {
              final kids = summary.childrenOf(f.uid);
              return RowCard(
                index: i,
                key: Key('family-${f.uid}'),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        NameAvatar(
                          f.name,
                          size: 48,
                          colors: const [brandOrange, Color(0xFFF2B05A)],
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                f.name,
                                style: const TextStyle(
                                  color: brandNavy,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 15.5,
                                ),
                              ),
                              const SizedBox(height: 6),
                              if (f.username.isNotEmpty)
                                _UsernamePill(f.username),
                            ],
                          ),
                        ),
                        RoundAction(
                          key: Key('reset-family-${f.uid}'),
                          icon: Icons.key_rounded,
                          tooltip: 'Reset password',
                          color: brandNavy,
                          onPressed: () => widget.actions.resetFamily(f),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: brandCream,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: kids.isEmpty
                          ? const Text(
                              'No children linked yet',
                              style: TextStyle(color: mutedInk),
                            )
                          : Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                for (final k in kids)
                                  Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      NameAvatar(k.name, size: 24),
                                      const SizedBox(width: 6),
                                      Text(
                                        k.name,
                                        style: const TextStyle(
                                          color: brandNavy,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        k.classLabel,
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
                  ],
                ),
              );
            },
          ),
      ],
    );
  }
}

// ═════════════════════════════ More ═════════════════════════════

class _MoreTab extends StatelessWidget {
  const _MoreTab({
    required this.account,
    required this.schoolName,
    required this.summary,
    required this.onSignOut,
    required this.onOpenWebsite,
    this.onChooseSection,
  });
  final Profile account;
  final String schoolName;
  final SchoolSummary summary;
  final VoidCallback onSignOut, onOpenWebsite;
  final VoidCallback? onChooseSection;

  @override
  Widget build(BuildContext context) => ListView(
    key: const Key('admin-more'),
    padding: EdgeInsets.fromLTRB(
      16,
      MediaQuery.paddingOf(context).top + 24,
      16,
      28,
    ),
    children: [
      const Center(child: BrandLogoRing(size: 92)),
      const SizedBox(height: 14),
      Text(account.name, textAlign: TextAlign.center, style: displayStyle(22)),
      const SizedBox(height: 2),
      Text(
        '$schoolName · School admin',
        textAlign: TextAlign.center,
        style: const TextStyle(color: mutedInk),
      ),
      const SizedBox(height: 22),
      ListCard(
        children: [
          ListTile(
            leading: const _TileIcon(Icons.language_rounded, successInk),
            title: const Text(
              'Full dashboard on the website',
              style: TextStyle(fontWeight: FontWeight.w700),
            ),
            subtitle: const Text(
              'Bulk import, attendance register, printing and settings.',
            ),
            trailing: const Icon(Icons.open_in_new_rounded, color: mutedInk),
            onTap: onOpenWebsite,
          ),
          if (onChooseSection != null)
            ListTile(
              leading: const _TileIcon(Icons.swap_horiz_rounded, brandNavy),
              title: const Text(
                'Choose section',
                style: TextStyle(fontWeight: FontWeight.w700),
              ),
              onTap: onChooseSection,
            ),
          ListTile(
            key: const Key('admin-sign-out'),
            leading: const _TileIcon(Icons.logout_rounded, dangerInk),
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

class _TileIcon extends StatelessWidget {
  const _TileIcon(this.icon, this.color);
  final IconData icon;
  final Color color;
  @override
  Widget build(BuildContext context) => Container(
    width: 40,
    height: 40,
    decoration: BoxDecoration(
      color: color.withValues(alpha: .12),
      borderRadius: BorderRadius.circular(12),
    ),
    child: Icon(icon, color: color, size: 21),
  );
}

// ═════════════════════════════ Actions ═════════════════════════════

/// Every admin action, so the overview's quick actions and the list tabs
/// open exactly the same flows.
class _Actions {
  _Actions(this.context, this.repository, this.summary);
  final BuildContext context;
  final AppRepository repository;
  final SchoolSummary summary;

  Future<void> addStudent() async {
    final form = GlobalKey<FormState>();
    final name = TextEditingController(), klass = TextEditingController();
    String? familyUid;
    final code = await _formSheet<String>(
      context,
      title: 'Add student',
      subtitle: 'They appear in their class straight away.',
      icon: Icons.person_add_alt_1_rounded,
      color: brandPink,
      action: 'Add student',
      form: form,
      fields: (setSheet) => [
        TextFormField(
          key: const Key('student-name'),
          controller: name,
          textCapitalization: TextCapitalization.words,
          textInputAction: TextInputAction.next,
          decoration: formField('Student name', icon: Icons.person_rounded),
          validator: (v) => validateName(v, 'student'),
        ),
        const SizedBox(height: 12),
        TextFormField(
          key: const Key('student-class'),
          controller: klass,
          decoration: formField(
            'Class',
            hint: 'e.g. 3 or 4-B',
            icon: Icons.meeting_room_rounded,
          ),
          validator: (v) =>
              (v ?? '').trim().length > 40 ? 'Keep the class short.' : null,
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          initialValue: familyUid,
          isExpanded: true,
          decoration: formField(
            'Family (optional)',
            icon: Icons.family_restroom_rounded,
          ),
          items: [
            const DropdownMenuItem(value: null, child: Text('No family yet')),
            for (final f in summary.families)
              DropdownMenuItem(value: f.uid, child: Text(f.name)),
          ],
          onChanged: (v) => setSheet(() => familyUid = v),
        ),
        const SizedBox(height: 16),
      ],
      submit: () => repository.createStudent(
        name: name.text,
        classId: klass.text,
        familyUid: familyUid ?? '',
      ),
    );
    if (code == null || !context.mounted) return;
    await _success(
      key: const Key('student-added'),
      title: '${name.text.trim()} added',
      message: familyUid == null
          ? 'Give this code to the parent. They add the child from their '
                'family app.'
          : 'Already linked to the family. Keep this code as a spare.',
      rows: [('Child code', code)],
    );
  }

  Future<void> addTeacher() async {
    final form = GlobalKey<FormState>();
    final name = TextEditingController(),
        phone = TextEditingController(),
        klass = TextEditingController();
    final handover = await _formSheet<Handover>(
      context,
      title: 'Add teacher',
      subtitle: 'We create their login. You hand it over.',
      icon: Icons.co_present_rounded,
      color: brandIndigo,
      action: 'Create teacher login',
      form: form,
      fields: (_) => [
        TextFormField(
          key: const Key('teacher-name'),
          controller: name,
          textCapitalization: TextCapitalization.words,
          textInputAction: TextInputAction.next,
          decoration: formField('Teacher name', icon: Icons.person_rounded),
          validator: (v) => validateName(v, "teacher's"),
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: phone,
          keyboardType: TextInputType.phone,
          textInputAction: TextInputAction.next,
          decoration: formField('Phone (optional)', icon: Icons.phone_rounded),
          validator: validatePhone,
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: klass,
          decoration: formField(
            'Class (optional)',
            hint: 'e.g. 3',
            icon: Icons.meeting_room_rounded,
          ),
        ),
        const SizedBox(height: 16),
      ],
      submit: () => repository.createTeacher(
        name: name.text,
        phone: phone.text,
        classId: klass.text,
      ),
    );
    if (handover != null && context.mounted) await _handover(handover);
  }

  Future<void> addFamily() async {
    final form = GlobalKey<FormState>();
    final name = TextEditingController(), phone = TextEditingController();
    final handover = await _formSheet<Handover>(
      context,
      title: 'Add family',
      subtitle: 'One login per home, for every child in it.',
      icon: Icons.family_restroom_rounded,
      color: brandOrange,
      action: 'Create family login',
      form: form,
      fields: (_) => [
        TextFormField(
          key: const Key('family-name'),
          controller: name,
          textCapitalization: TextCapitalization.words,
          textInputAction: TextInputAction.next,
          decoration: formField(
            'Family name',
            hint: 'e.g. Ahmad Family',
            icon: Icons.family_restroom_rounded,
          ),
          validator: (v) => validateName(v, 'family'),
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: phone,
          keyboardType: TextInputType.phone,
          decoration: formField(
            'Parent phone (optional)',
            icon: Icons.phone_rounded,
          ),
          validator: validatePhone,
        ),
        const SizedBox(height: 16),
      ],
      submit: () => repository.createFamily(name: name.text, phone: phone.text),
    );
    if (handover != null && context.mounted) await _handover(handover);
  }

  Future<void> resetTeacher(SchoolMember t) =>
      _reset(t, () => repository.resetTeacherPassword(t));

  Future<void> resetFamily(SchoolMember f) =>
      _reset(f, () => repository.resetFamilyPassword(f));

  Future<void> _reset(SchoolMember m, Future<Handover> Function() run) async {
    if (!await _confirm(
      title: 'Reset password?',
      message:
          '${m.name} will need the new password to sign in. '
          'The old one stops working.',
      action: 'Reset',
      icon: Icons.key_rounded,
      color: brandNavy,
    )) {
      return;
    }
    if (!context.mounted) return;
    final h = await _busy(run);
    if (h != null && context.mounted) await _handover(h);
  }

  Future<void> removeTeacher(SchoolMember t) async {
    if (!await _confirm(
      title: 'Remove ${t.name}?',
      message:
          'Their login is deleted and they can no longer sign in. '
          'Students and their work stay as they are.',
      action: 'Remove',
      icon: Icons.person_remove_rounded,
      color: dangerInk,
    )) {
      return;
    }
    if (!context.mounted) return;
    final ok = await _busy(() async {
      await repository.deleteTeacher(t);
      return true;
    });
    if (ok == true && context.mounted) {
      showMessage(context, '${t.name} removed.');
    }
  }

  Future<void> studentDetails(SchoolMember s) => showModalBottomSheet<void>(
    context: context,
    backgroundColor: Colors.white,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
    ),
    builder: (sheet) {
      final family = summary.families
          .where((f) => f.uid == s.familyUid)
          .firstOrNull;
      return SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const _Grabber(),
              const SizedBox(height: 16),
              Center(child: NameAvatar(s.name, size: 72)),
              const SizedBox(height: 10),
              Text(
                s.name,
                textAlign: TextAlign.center,
                style: displayStyle(21),
              ),
              Text(
                family == null
                    ? s.classLabel
                    : '${s.classLabel} · ${family.name}',
                textAlign: TextAlign.center,
                style: const TextStyle(color: mutedInk),
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  _MiniStat('${s.points}', 'Points', brandOrange),
                  const SizedBox(width: 10),
                  _MiniStat('${s.approved}', 'Approved', successInk),
                  const SizedBox(width: 10),
                  _MiniStat('${s.completed}', 'Done', brandPink),
                ],
              ),
              const SizedBox(height: 18),
              if (s.familyUid.isEmpty)
                FilledButton.icon(
                  key: const Key('attach-family'),
                  onPressed: () {
                    Navigator.pop(sheet);
                    _attach(s);
                  },
                  style: FilledButton.styleFrom(
                    backgroundColor: brandOrange,
                    minimumSize: const Size.fromHeight(52),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  icon: const Icon(Icons.link_rounded),
                  label: const Text('Link to a family'),
                )
              else
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: successInk.withValues(alpha: .08),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.check_circle_rounded, color: successInk),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Linked to a family. Parents can follow '
                          'progress in their app.',
                          style: TextStyle(color: Color(0xFF1C5E40)),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      );
    },
  );

  Future<void> _attach(SchoolMember student) async {
    final families = summary.families;
    if (families.isEmpty) {
      showMessage(context, 'Add a family first, in the Families tab.');
      return;
    }
    final family = await showModalBottomSheet<SchoolMember>(
      context: context,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (sheet) => SafeArea(
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.sizeOf(sheet).height * .7,
          ),
          child: ListView(
            shrinkWrap: true,
            padding: const EdgeInsets.fromLTRB(8, 12, 8, 8),
            children: [
              const _Grabber(),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
                child: Text(
                  'Link ${student.name} to…',
                  style: displayStyle(19),
                ),
              ),
              for (final f in families)
                ListTile(
                  key: Key('pick-family-${f.uid}'),
                  leading: NameAvatar(
                    f.name,
                    size: 38,
                    colors: const [brandOrange, Color(0xFFF2B05A)],
                  ),
                  title: Text(
                    f.name,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  subtitle: Text(
                    '${f.username} · '
                    '${plural(summary.childrenOf(f.uid).length, 'child', 'children')}',
                  ),
                  onTap: () => Navigator.pop(sheet, f),
                ),
            ],
          ),
        ),
      ),
    );
    if (family == null || !context.mounted) return;
    final ok = await _busy(() async {
      await repository.attachChild(student: student, family: family);
      return true;
    });
    if (ok == true && context.mounted) {
      showMessage(context, '${student.name} is now with ${family.name}.');
    }
  }

  // ── dialogs ──

  Future<void> _handover(Handover h) => _success(
    key: const Key('handover'),
    title: '${h.kind} login ready',
    message:
        'Share this with ${h.name} now. The password is shown only once; '
        'if it is lost, reset it.',
    rows: [('Username', h.username), ('Password', h.password)],
    doneKey: const Key('handover-done'),
  );

  Future<void> _success({
    required Key key,
    required String title,
    required String message,
    required List<(String, String)> rows,
    Key? doneKey,
  }) => showDialog<void>(
    context: context,
    barrierDismissible: false,
    builder: (context) => Dialog(
      key: key,
      backgroundColor: Colors.white,
      insetPadding: const EdgeInsets.all(20),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(22, 26, 22, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 68,
                height: 68,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: successInk.withValues(alpha: .12),
                ),
                child: const Icon(
                  Icons.check_rounded,
                  color: successInk,
                  size: 38,
                ),
              ),
            ),
            const SizedBox(height: 14),
            Text(title, textAlign: TextAlign.center, style: displayStyle(21)),
            const SizedBox(height: 6),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: mutedInk, height: 1.4),
            ),
            const SizedBox(height: 18),
            for (final (label, value) in rows) ...[
              _CopyRow(label: label, value: value),
              const SizedBox(height: 10),
            ],
            const SizedBox(height: 6),
            FilledButton(
              key: doneKey,
              onPressed: () => Navigator.pop(context),
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(52),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: const Text('Done'),
            ),
          ],
        ),
      ),
    ),
  );

  Future<bool> _confirm({
    required String title,
    required String message,
    required String action,
    required IconData icon,
    required Color color,
  }) async =>
      await showDialog<bool>(
        context: context,
        builder: (context) => Dialog(
          backgroundColor: Colors.white,
          insetPadding: const EdgeInsets.all(24),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(28),
          ),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(22, 24, 22, 18),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: color.withValues(alpha: .12),
                    ),
                    child: Icon(icon, color: color, size: 30),
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  title,
                  textAlign: TextAlign.center,
                  style: displayStyle(19),
                ),
                const SizedBox(height: 6),
                Text(
                  message,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: mutedInk, height: 1.4),
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(context, false),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(48),
                        ),
                        child: const Text('Cancel'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: FilledButton(
                        key: const Key('admin-confirm'),
                        style: FilledButton.styleFrom(
                          backgroundColor: color,
                          minimumSize: const Size.fromHeight(48),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        onPressed: () => Navigator.pop(context, true),
                        child: Text(action),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ) ??
      false;

  Future<T?> _busy<T>(Future<T> Function() task) async {
    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );
    try {
      final result = await task();
      if (context.mounted) Navigator.of(context, rootNavigator: true).pop();
      return result;
    } catch (e) {
      if (context.mounted) {
        Navigator.of(context, rootNavigator: true).pop();
        showMessage(context, adminError(e));
      }
      return null;
    }
  }
}

class _Grabber extends StatelessWidget {
  const _Grabber();
  @override
  Widget build(BuildContext context) => Center(
    child: Container(
      width: 42,
      height: 4,
      decoration: BoxDecoration(
        color: lineColor,
        borderRadius: BorderRadius.circular(4),
      ),
    ),
  );
}

class _MiniStat extends StatelessWidget {
  const _MiniStat(this.value, this.label, this.color);
  final String value, label;
  final Color color;
  @override
  Widget build(BuildContext context) => Expanded(
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .08),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 22,
              fontWeight: FontWeight.w800,
            ),
          ),
          Text(label, style: const TextStyle(color: mutedInk, fontSize: 12.5)),
        ],
      ),
    ),
  );
}

class _CopyRow extends StatelessWidget {
  const _CopyRow({required this.label, required this.value});
  final String label, value;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.fromLTRB(14, 8, 4, 8),
    decoration: BoxDecoration(
      color: brandCream,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: lineColor),
    ),
    child: Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(color: mutedInk, fontSize: 12),
              ),
              SelectableText(
                value,
                style: const TextStyle(
                  color: brandNavy,
                  fontSize: 19,
                  fontWeight: FontWeight.w800,
                  letterSpacing: .6,
                ),
              ),
            ],
          ),
        ),
        IconButton(
          tooltip: 'Copy $label',
          onPressed: () async {
            await Clipboard.setData(ClipboardData(text: value));
            if (context.mounted) showMessage(context, '$label copied.');
          },
          icon: const Icon(Icons.copy_rounded, color: brandPink),
        ),
      ],
    ),
  );
}

/// Bottom sheet with a form; returns what [submit] returns, or null.
Future<T?> _formSheet<T>(
  BuildContext context, {
  required String title,
  required String subtitle,
  required IconData icon,
  required Color color,
  required String action,
  required List<Widget> Function(StateSetter) fields,
  required GlobalKey<FormState> form,
  required Future<T> Function() submit,
}) => showModalBottomSheet<T>(
  context: context,
  isScrollControlled: true,
  backgroundColor: Colors.white,
  shape: const RoundedRectangleBorder(
    borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
  ),
  builder: (context) {
    var busy = false;
    String? error;
    return StatefulBuilder(
      builder: (context, setSheet) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.viewInsetsOf(context).bottom,
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
            child: Form(
              key: form,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const _Grabber(),
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: .12),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Icon(icon, color: color),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(title, style: displayStyle(21)),
                            Text(
                              subtitle,
                              style: const TextStyle(color: mutedInk),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  ...fields(setSheet),
                  if (error != null)
                    Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: dangerInk.withValues(alpha: .07),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        error!,
                        style: const TextStyle(color: dangerInk),
                      ),
                    ),
                  FilledButton(
                    key: const Key('admin-form-submit'),
                    onPressed: busy
                        ? null
                        : () async {
                            if (!form.currentState!.validate()) return;
                            setSheet(() {
                              busy = true;
                              error = null;
                            });
                            try {
                              final result = await submit();
                              if (context.mounted) {
                                Navigator.pop(context, result);
                              }
                            } catch (e) {
                              setSheet(() {
                                busy = false;
                                error = adminError(e);
                              });
                            }
                          },
                    style: FilledButton.styleFrom(
                      minimumSize: const Size.fromHeight(54),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: busy
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Text(action),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  },
);
