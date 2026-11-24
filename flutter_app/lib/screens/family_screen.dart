import 'package:flutter/material.dart';
import '../app_theme.dart';
import '../data/app_repository.dart';
import '../data/checklist_cloud.dart';
import '../data/report_notifications.dart';
import '../data/learning_journey.dart';
import '../domain.dart';
import 'entry_screens.dart' show brandCream;
import 'family_checklists.dart';
import 'journey_preferences_sheet.dart';
import '../l10n/language.dart';
import 'ui_kit.dart';

/// Colours per child card, cycled, so siblings are easy to tell apart.
const _childPalette = [
  [brandPink, Color(0xFFF07AA8)],
  [brandOrange, Color(0xFFF2B05A)],
  [brandIndigo, Color(0xFF6B7FC4)],
  [successInk, Color(0xFF4CB98A)],
];

class FamilyScreen extends StatefulWidget {
  const FamilyScreen({
    super.key,
    required this.repository,
    required this.account,
    required this.selectedUid,
    required this.onSelect,
    required this.learnerBuilder,
    this.onChooseSection,
  });
  final AppRepository repository;
  final VoidCallback? onChooseSection;
  final Profile account;
  final String? selectedUid;
  final ValueChanged<Profile> onSelect;
  final Widget Function(Profile) learnerBuilder;
  @override
  State<FamilyScreen> createState() => _FamilyScreenState();
}

class _FamilyScreenState extends State<FamilyScreen> {
  // The weekly habits report on this phone (signed-in families only).
  late final ReportNotifications? _report = switch (widget.repository) {
    final FirebaseRepository r => ReportNotifications(
      store: FirebaseReportDeviceStore(r.db, r.functions),
      familyUid: widget.account.uid,
      push: FirebasePushDevice(),
    )..load(),
    _ => null,
  };

  @override
  void dispose() {
    _report?.dispose();
    super.dispose();
  }

  late Stream<List<Profile>> _children = widget.repository.children(
    widget.account.uid,
  );

  Future<void> _claim() async {
    final controller = TextEditingController();
    final code = await showDialog<String>(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.white,
        insetPadding: const EdgeInsets.all(22),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(22, 24, 22, 18),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: brandPink.withValues(alpha: .12),
                  ),
                  child: const Icon(
                    Icons.person_add_alt_1_rounded,
                    color: brandPink,
                    size: 32,
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Text(
                tr('Add your child', 'اپنا بچہ شامل کریں'),
                textAlign: TextAlign.center,
                style: displayStyle(22),
              ),
              const SizedBox(height: 6),
              Text(
                tr(
                  'Type the child code your school gave you. '
                      'It looks like STU-ABCDE.',
                  'اسکول کا دیا ہوا بچے کا کوڈ لکھیں۔ یہ STU-ABCDE جیسا ہوتا ہے۔',
                ),
                textAlign: TextAlign.center,
                style: TextStyle(color: mutedInk, height: 1.4),
              ),
              const SizedBox(height: 18),
              TextField(
                key: const Key('claim-code'),
                controller: controller,
                autofocus: true,
                textCapitalization: TextCapitalization.characters,
                textAlign: TextAlign.center,
                style: displayStyle(22, letterSpacing: 2),
                decoration: formField(
                  tr('School child code', 'بچے کا اسکول کوڈ'),
                  hint: 'STU-ABCDE',
                ),
                onSubmitted: (v) => Navigator.pop(context, v),
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size.fromHeight(50),
                      ),
                      child: Text(tr('Cancel', 'منسوخ')),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: FilledButton(
                      onPressed: () => Navigator.pop(context, controller.text),
                      style: FilledButton.styleFrom(
                        minimumSize: const Size.fromHeight(50),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: Text(tr('Add child', 'بچہ شامل کریں')),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
    // The dialog route may still be animating out; let it dispose the field
    // before releasing its controller.
    await Future<void>.delayed(const Duration(milliseconds: 250));
    controller.dispose();
    if (code == null || !mounted) return;
    if (!RegExp(
      r'^STU-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}$',
    ).hasMatch(code.trim().toUpperCase())) {
      _message(
        tr(
          'Enter the STU code provided by your school.',
          'اسکول کا دیا ہوا STU کوڈ لکھیں۔',
        ),
      );
      return;
    }
    try {
      await widget.repository.claimChild(code);
      if (mounted) {
        _message(
          tr('Child added to your family.', 'بچہ آپ کی فیملی میں شامل ہو گیا۔'),
        );
      }
    } catch (e) {
      if (mounted) _message(friendlyError(e));
    }
  }

  void _message(String value) => showMessage(context, value);

  Future<void> _signOut() async {
    try {
      await widget.repository.signOut();
    } catch (e) {
      if (mounted) _message(friendlyError(e));
    }
  }

  @override
  Widget build(BuildContext context) => StreamBuilder<List<Profile>>(
    stream: _children,
    builder: (context, snapshot) {
      if (snapshot.hasData && widget.selectedUid != null) {
        final selected = snapshot.data!.where(
          (child) =>
              child.uid == widget.selectedUid &&
              ownsLearner(widget.account, child),
        );
        if (selected.isNotEmpty) return widget.learnerBuilder(selected.first);
      }
      Widget body;
      if (snapshot.hasError) {
        body = SafeArea(
          child: MessageView(
            title: tr(
              'Could not load your children',
              'بچوں کی معلومات نہیں کھل سکیں',
            ),
            message: friendlyError(snapshot.error!),
            action: FilledButton(
              onPressed: () => setState(
                () =>
                    _children = widget.repository.children(widget.account.uid),
              ),
              child: Text(tr('Retry', 'دوبارہ کوشش کریں')),
            ),
          ),
        );
      } else if (snapshot.connectionState == ConnectionState.waiting) {
        body = const Center(child: CircularProgressIndicator());
      } else {
        final repository = widget.repository;
        body = LanguageScope(
          child: _FamilyHome(
            account: widget.account,
            children: snapshot.data!,
            onSelect: widget.onSelect,
            onAddChild: _claim,
            onChooseSection: widget.onChooseSection,
            onSignOut: _signOut,
            onJourneySettings:
                learningJourneyEnabled && repository is FirebaseRepository
                ? (child) =>
                      showJourneyPreferences(context, repository.db, child)
                : null,
            onDailyHabits: repository is FirebaseRepository
                ? (child) => showChildChecklists(
                    context,
                    child,
                    FirebaseChecklistCloud(repository.db, child.learnerId),
                  )
                : null,
            report: _report,
          ),
        );
      }
      return Scaffold(backgroundColor: brandCream, body: body);
    },
  );
}

class _FamilyHome extends StatefulWidget {
  const _FamilyHome({
    required this.account,
    required this.children,
    required this.onSelect,
    required this.onAddChild,
    required this.onSignOut,
    this.onChooseSection,
    this.onJourneySettings,
    this.onDailyHabits,
    this.report,
  });
  final Profile account;
  final List<Profile> children;
  final ValueChanged<Profile> onSelect;
  final VoidCallback onAddChild, onSignOut;
  final VoidCallback? onChooseSection;
  final ValueChanged<Profile>? onJourneySettings;

  /// Opens a child's daily habits: the weekly report and confirmations.
  final ValueChanged<Profile>? onDailyHabits;

  /// The weekly report on this phone, or null where it is not offered.
  final ReportNotifications? report;
  @override
  State<_FamilyHome> createState() => _FamilyHomeState();
}

class _FamilyHomeState extends State<_FamilyHome> {
  final _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    AppLanguage.instance.addListener(_languageChanged);
  }

  // The report comes in the language the family reads the app in.
  void _languageChanged() =>
      widget.report?.setLanguage(urdu: AppLanguage.instance.urdu);

  @override
  void dispose() {
    AppLanguage.instance.removeListener(_languageChanged);
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final account = widget.account, children = widget.children;
    final scale = MediaQuery.textScalerOf(context).scale(1).clamp(1.0, 1.6);
    final statHeight = 112 * scale;
    final done = children.fold(0, (n, c) => n + c.completed.toSet().length);
    final approved = children.fold(0, (n, c) => n + c.approved.toSet().length);
    final school = children
        .map((c) => c.schoolName)
        .firstWhere((s) => s.isNotEmpty, orElse: () => '');
    return ListView(
      key: const Key('family-home'),
      controller: _scroll,
      padding: EdgeInsets.zero,
      children: [
        Stack(
          children: [
            Column(
              children: [
                DashboardHero(
                  title: tr('Your family', 'آپ کی فیملی'),
                  personName: account.name,
                  badge: school.isEmpty
                      ? tr('Family account', 'فیملی اکاؤنٹ')
                      : school,
                  badgeIcon: Icons.family_restroom_rounded,
                  greeting: AppLanguage.instance.urdu
                      ? urduGreeting(DateTime.now())
                      : null,
                  dateText: AppLanguage.instance.urdu
                      ? urduDate(DateTime.now())
                      : null,
                  action: const LanguageToggle(onDark: true),
                  colors: const [Color(0xFF7A2E5C), brandPink],
                  onProfile: () => _scroll.animateTo(
                    _scroll.position.maxScrollExtent,
                    duration: const Duration(milliseconds: 500),
                    curve: Curves.easeOutCubic,
                  ),
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
                    value: children.length,
                    label: tr('Children', 'بچے'),
                    icon: Icons.child_care_rounded,
                    color: brandPink,
                    onTap: () {},
                  ),
                  StatItem(
                    value: done,
                    label: tr('Chapters', 'باب'),
                    icon: Icons.menu_book_rounded,
                    color: brandOrange,
                    onTap: () {},
                  ),
                  StatItem(
                    value: approved,
                    label: tr('Approved', 'منظور'),
                    icon: Icons.verified_rounded,
                    color: successInk,
                    onTap: () {},
                  ),
                ],
              ),
            ),
          ],
        ),
        Reveal(
          index: 1,
          child: SectionTitle(
            tr('Who is learning today?', 'آج کون سیکھ رہا ہے؟'),
          ),
        ),
        if (children.isEmpty)
          Reveal(
            index: 2,
            child: EmptyState(
              icon: Icons.child_care_rounded,
              color: brandPink,
              title: tr(
                'No children are linked yet',
                'ابھی کوئی بچہ شامل نہیں',
              ),
              message: tr(
                'Add the child code from your school to get started.',
                'شروع کرنے کے لیے اسکول کا دیا ہوا کوڈ شامل کریں۔',
              ),
            ),
          ),
        for (final (i, child) in children.indexed)
          Reveal(
            index: i + 2,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _ChildCard(
                    child: child,
                    colors: _childPalette[i % _childPalette.length],
                    onTap: () => widget.onSelect(child),
                  ),
                  if (widget.onJourneySettings != null ||
                      widget.onDailyHabits != null)
                    Wrap(
                      alignment: WrapAlignment.end,
                      children: [
                        if (widget.onDailyHabits != null)
                          TextButton.icon(
                            key: Key('daily-habits-${child.uid}'),
                            onPressed: () => widget.onDailyHabits!(child),
                            icon: const Icon(Icons.verified_outlined),
                            label: Text(tr('Daily habits', 'روز کی عادتیں')),
                          ),
                        if (widget.onJourneySettings != null)
                          TextButton.icon(
                            onPressed: () => widget.onJourneySettings!(child),
                            icon: const Icon(Icons.tune_outlined),
                            label: Text(
                              tr('Journey settings', 'سفر کی ترتیبات'),
                            ),
                          ),
                      ],
                    ),
                ],
              ),
            ),
          ),
        Reveal(
          index: children.length + 2,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
            child: _AddChildCard(onTap: widget.onAddChild),
          ),
        ),
        if (widget.report case final report?)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
            child: _WeeklyReportCard(report: report),
          ),
        const SizedBox(height: 22),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: ListCard(
            children: [
              if (widget.onChooseSection != null)
                ListTile(
                  leading: const Icon(
                    Icons.swap_horiz_rounded,
                    color: brandNavy,
                  ),
                  title: Text(
                    tr('Choose section', 'حصہ منتخب کریں'),
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                  onTap: widget.onChooseSection,
                ),
              ListTile(
                key: const Key('family-sign-out'),
                leading: const Icon(Icons.logout_rounded, color: dangerInk),
                title: Text(
                  tr('Sign out', 'سائن آؤٹ'),
                  style: TextStyle(
                    color: dangerInk,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                onTap: widget.onSignOut,
              ),
            ],
          ),
        ),
        const SizedBox(height: 28),
      ],
    );
  }
}

class _ChildCard extends StatelessWidget {
  const _ChildCard({
    required this.child,
    required this.colors,
    required this.onTap,
  });
  final Profile child;
  final List<Color> colors;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    final done = child.completed.toSet().length;
    final approved = child.approved.toSet().length;
    return Pressable(
      scale: .98,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: colors.first.withValues(alpha: .18),
              blurRadius: 22,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Material(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            key: Key('child-${child.uid}'),
            onTap: onTap,
            child: Column(
              children: [
                // Coloured band with the child's initial and name.
                Container(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: colors,
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 56,
                        height: 56,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: .25),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                        child: Text(
                          avatarInitial(child.name),
                          style: displayStyle(26, color: Colors.white),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              child.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: displayStyle(22, color: Colors.white),
                            ),
                            Text(
                              [
                                if (child.className.isNotEmpty) child.className,
                                if (child.schoolName.isNotEmpty)
                                  child.schoolName,
                              ].join(' · ').ifEmpty(tr('Learner', 'طالب علم')),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: .88),
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 14, 14, 14),
                  child: Row(
                    children: [
                      _Metric(
                        value: '$done',
                        label: tr('chapters done', 'باب مکمل'),
                        color: brandOrange,
                      ),
                      const SizedBox(width: 18),
                      _Metric(
                        value: '$approved',
                        label: tr('approved', 'منظور'),
                        color: successInk,
                      ),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.fromLTRB(14, 9, 10, 9),
                        decoration: BoxDecoration(
                          color: colors.first,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              tr('Start', 'شروع'),
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            SizedBox(width: 4),
                            Icon(
                              Icons.arrow_forward_rounded,
                              color: Colors.white,
                              size: 18,
                            ),
                          ],
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

extension on String {
  String ifEmpty(String other) => isEmpty ? other : this;
}

class _Metric extends StatelessWidget {
  const _Metric({
    required this.value,
    required this.label,
    required this.color,
  });
  final String value, label;
  final Color color;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(value, style: displayStyle(22, color: color, height: 1.1)),
      Text(label, style: const TextStyle(color: mutedInk, fontSize: 12)),
    ],
  );
}

class _AddChildCard extends StatelessWidget {
  const _AddChildCard({required this.onTap});
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Pressable(
    scale: .98,
    child: Material(
      color: Colors.white.withValues(alpha: .7),
      borderRadius: BorderRadius.circular(22),
      child: InkWell(
        key: const Key('add-child'),
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            border: Border.all(
              color: brandPink.withValues(alpha: .35),
              width: 1.5,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: brandPink.withValues(alpha: .12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.add_rounded, color: brandPink),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      tr(
                        'Add child with school code',
                        'اسکول کوڈ سے بچہ شامل کریں',
                      ),
                      style: TextStyle(
                        color: brandNavy,
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      tr(
                        'Your school gives a code like STU-ABCDE.',
                        'اسکول STU-ABCDE جیسا کوڈ دیتا ہے۔',
                      ),
                      style: TextStyle(color: mutedInk, fontSize: 13),
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

/// Turns the Sunday report on or off for this phone, and sends a test.
class _WeeklyReportCard extends StatelessWidget {
  const _WeeklyReportCard({required this.report});
  final ReportNotifications report;

  void _say(BuildContext context, String en, String ur) => ScaffoldMessenger.of(
    context,
  ).showSnackBar(SnackBar(content: Text(tr(en, ur))));

  Future<void> _switch(BuildContext context, bool value) async {
    if (!value) {
      await report.turnOff();
      return;
    }
    final problem = await report.turnOn(urdu: AppLanguage.instance.urdu);
    if (!context.mounted) return;
    switch (problem) {
      case ReportProblem.notAllowed:
        _say(
          context,
          'Notifications are blocked. Allow them for this app in your '
              'phone or browser settings, then try again.',
          'نوٹیفکیشن بند ہیں۔ فون یا براؤزر کی سیٹنگ میں اس ایپ کے لیے '
              'اجازت دیں، پھر دوبارہ کوشش کریں۔',
        );
      case ReportProblem.unavailable:
        _say(
          context,
          'Could not turn it on. Check the connection and try again.',
          'آن نہیں ہو سکا۔ انٹرنیٹ دیکھ کر دوبارہ کوشش کریں۔',
        );
      case null:
        _say(
          context,
          'Done! The report comes every Sunday evening.',
          'ہو گیا! رپورٹ ہر اتوار کی شام آئے گی۔',
        );
    }
  }

  Future<void> _test(BuildContext context) async {
    final ok = await report.sendTest();
    if (!context.mounted) return;
    ok
        ? _say(
            context,
            'Sent! It should arrive in a moment.',
            'بھیج دی! تھوڑی دیر میں پہنچ جائے گی۔',
          )
        : _say(
            context,
            'Could not send it. Try again in a little while.',
            'نہیں بھیجی جا سکی۔ تھوڑی دیر بعد دوبارہ کوشش کریں۔',
          );
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: report,
    builder: (context, _) => Container(
      key: const Key('weekly-report-card'),
      padding: const EdgeInsets.fromLTRB(16, 14, 10, 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: lineColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: successInk.withValues(alpha: .12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.notifications_active_outlined,
                  color: successInk,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      tr(
                        'Weekly report on this phone',
                        'اس فون پر ہفتہ وار رپورٹ',
                      ),
                      style: const TextStyle(
                        color: ink,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      tr(
                        "Every Sunday evening: each child's prayers and good "
                            'habits for the week.',
                        'ہر اتوار کی شام: ہر بچے کی ہفتے بھر کی نماز اور اچھی '
                            'عادتیں۔',
                      ),
                      style: const TextStyle(color: mutedInk, fontSize: 13),
                    ),
                  ],
                ),
              ),
              Switch(
                key: const Key('weekly-report-switch'),
                value: report.on,
                activeThumbColor: successInk,
                onChanged: report.busy ? null : (v) => _switch(context, v),
              ),
            ],
          ),
          if (report.on)
            Align(
              alignment: AlignmentDirectional.centerEnd,
              child: TextButton.icon(
                key: const Key('weekly-report-test'),
                onPressed: report.busy ? null : () => _test(context),
                icon: const Icon(Icons.send_outlined),
                label: Text(tr('Send one now', 'ابھی ایک بھیجیں')),
              ),
            ),
        ],
      ),
    ),
  );
}
