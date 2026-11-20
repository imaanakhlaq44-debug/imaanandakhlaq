import 'package:flutter/material.dart';
import '../app_theme.dart';
import '../data/app_repository.dart';
import '../data/learning_journey.dart';
import '../domain.dart';
import 'entry_screens.dart' show brandCream;
import 'journey_preferences_sheet.dart';
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
                'Add your child',
                textAlign: TextAlign.center,
                style: displayStyle(22),
              ),
              const SizedBox(height: 6),
              const Text(
                'Type the child code your school gave you. '
                'It looks like STU-ABCDE.',
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
                decoration: formField('School child code', hint: 'STU-ABCDE'),
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
                      child: const Text('Cancel'),
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
                      child: const Text('Add child'),
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
      _message('Enter the STU code provided by your school.');
      return;
    }
    try {
      await widget.repository.claimChild(code);
      if (mounted) _message('Child added to your family.');
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
            title: 'Could not load your children',
            message: friendlyError(snapshot.error!),
            action: FilledButton(
              onPressed: () => setState(
                () =>
                    _children = widget.repository.children(widget.account.uid),
              ),
              child: const Text('Retry'),
            ),
          ),
        );
      } else if (snapshot.connectionState == ConnectionState.waiting) {
        body = const Center(child: CircularProgressIndicator());
      } else {
        final repository = widget.repository;
        body = _FamilyHome(
          account: widget.account,
          children: snapshot.data!,
          onSelect: widget.onSelect,
          onAddChild: _claim,
          onChooseSection: widget.onChooseSection,
          onSignOut: _signOut,
          onJourneySettings:
              learningJourneyEnabled && repository is FirebaseRepository
              ? (child) => showJourneyPreferences(context, repository.db, child)
              : null,
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
  });
  final Profile account;
  final List<Profile> children;
  final ValueChanged<Profile> onSelect;
  final VoidCallback onAddChild, onSignOut;
  final VoidCallback? onChooseSection;
  final ValueChanged<Profile>? onJourneySettings;
  @override
  State<_FamilyHome> createState() => _FamilyHomeState();
}

class _FamilyHomeState extends State<_FamilyHome> {
  final _scroll = ScrollController();

  @override
  void dispose() {
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
                  title: 'Your family',
                  personName: account.name,
                  badge: school.isEmpty ? 'Family account' : school,
                  badgeIcon: Icons.family_restroom_rounded,
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
                    label: 'Children',
                    icon: Icons.child_care_rounded,
                    color: brandPink,
                    onTap: () {},
                  ),
                  StatItem(
                    value: done,
                    label: 'Chapters',
                    icon: Icons.menu_book_rounded,
                    color: brandOrange,
                    onTap: () {},
                  ),
                  StatItem(
                    value: approved,
                    label: 'Approved',
                    icon: Icons.verified_rounded,
                    color: successInk,
                    onTap: () {},
                  ),
                ],
              ),
            ),
          ],
        ),
        const Reveal(index: 1, child: SectionTitle('Who is learning today?')),
        if (children.isEmpty)
          const Reveal(
            index: 2,
            child: EmptyState(
              icon: Icons.child_care_rounded,
              color: brandPink,
              title: 'No children are linked yet',
              message: 'Add the child code from your school to get started.',
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
                  if (widget.onJourneySettings != null)
                    Align(
                      alignment: AlignmentDirectional.centerEnd,
                      child: TextButton.icon(
                        onPressed: () => widget.onJourneySettings!(child),
                        icon: const Icon(Icons.tune_outlined),
                        label: const Text('Journey settings'),
                      ),
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
                  title: const Text(
                    'Choose section',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                  onTap: widget.onChooseSection,
                ),
              ListTile(
                key: const Key('family-sign-out'),
                leading: const Icon(Icons.logout_rounded, color: dangerInk),
                title: const Text(
                  'Sign out',
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
                              ].join(' · ').ifEmpty('Learner'),
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
                        label: 'chapters done',
                        color: brandOrange,
                      ),
                      const SizedBox(width: 18),
                      _Metric(
                        value: '$approved',
                        label: 'approved',
                        color: successInk,
                      ),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.fromLTRB(14, 9, 10, 9),
                        decoration: BoxDecoration(
                          color: colors.first,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'Start',
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
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Add child with school code',
                      style: TextStyle(
                        color: brandNavy,
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Your school gives a code like STU-ABCDE.',
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
