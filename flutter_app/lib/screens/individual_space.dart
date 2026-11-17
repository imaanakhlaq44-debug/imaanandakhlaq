import 'package:flutter/material.dart';

import '../app_theme.dart';
import '../data/app_repository.dart';
import '../domain.dart';
import 'entry_screens.dart' show BrandLogoRing, brandCream;
import 'learner_shell.dart';

/// Opens the Individual section for a school login (teacher, admin,
/// student or family). Its Individual work lives in a separate space under
/// the same login; the school record is never touched. The first visit asks
/// to start that space.
class IndividualSpaceGate extends StatefulWidget {
  const IndividualSpaceGate({
    super.key,
    required this.repository,
    required this.account,
    this.onChooseSection,
  });
  final AppRepository repository;

  /// The school profile of this login (only its name and uid are used).
  final Profile account;
  final VoidCallback? onChooseSection;
  @override
  State<IndividualSpaceGate> createState() => _IndividualSpaceGateState();
}

class _IndividualSpaceGateState extends State<IndividualSpaceGate> {
  late Stream<Profile?> _space = widget.repository.individualSpace(
    widget.account.uid,
  );

  @override
  Widget build(BuildContext context) => StreamBuilder<Profile?>(
    stream: _space,
    builder: (context, snap) {
      if (snap.hasError) {
        return Scaffold(
          body: MessageView(
            title: 'Could not open your Individual space',
            message: friendlyError(snap.error!),
            action: FilledButton(
              onPressed: () => setState(
                () => _space = widget.repository.individualSpace(
                  widget.account.uid,
                ),
              ),
              child: const Text('Retry'),
            ),
          ),
        );
      }
      if (snap.connectionState == ConnectionState.waiting) {
        return const Scaffold(body: Center(child: CircularProgressIndicator()));
      }
      final space = snap.data;
      if (space == null) {
        return StartIndividualSpace(
          repository: widget.repository,
          suggestedName: widget.account.name,
          onChooseSection: widget.onChooseSection,
        );
      }
      return LearnerShell(
        repository: widget.repository,
        account: space,
        learner: space,
        onChooseSection: widget.onChooseSection,
      );
    },
  );
}

/// Asks a school login to start its separate Individual space.
class StartIndividualSpace extends StatefulWidget {
  const StartIndividualSpace({
    super.key,
    required this.repository,
    required this.suggestedName,
    this.onChooseSection,
  });
  final AppRepository repository;
  final String suggestedName;
  final VoidCallback? onChooseSection;
  @override
  State<StartIndividualSpace> createState() => _StartIndividualSpaceState();
}

class _StartIndividualSpaceState extends State<StartIndividualSpace> {
  late final _name = TextEditingController(text: widget.suggestedName);
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  Future<void> _start() async {
    if (_busy) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await widget.repository.startIndividualSpace(name: _name.text);
    } catch (e) {
      if (mounted) setState(() => _error = friendlyError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _signOut() async {
    try {
      await widget.repository.signOut();
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: brandCream,
    appBar: AppBar(
      backgroundColor: brandCream,
      leading: widget.onChooseSection == null
          ? null
          : BackButton(onPressed: _busy ? null : widget.onChooseSection),
    ),
    body: SafeArea(
      child: ConstrainedBody(
        maxWidth: 480,
        child: ListView(
          key: const Key('start-individual-space'),
          padding: const EdgeInsets.fromLTRB(22, 8, 22, 24),
          children: [
            const Center(child: BrandLogoRing(size: 92)),
            const SizedBox(height: 18),
            Text(
              'Your own Individual space',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: brandNavy,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'This login belongs to a school. You can also learn on your '
              'own with the same login: your Individual progress is kept '
              'separately and your school never sees it.',
              textAlign: TextAlign.center,
              style: TextStyle(height: 1.5, color: Color(0xFF4A4F63)),
            ),
            const SizedBox(height: 22),
            TextField(
              key: const Key('space-name'),
              controller: _name,
              enabled: !_busy,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(
                labelText: 'Your name',
                border: OutlineInputBorder(),
              ),
            ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Text(
                  _error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ),
            const SizedBox(height: 18),
            FilledButton(
              key: const Key('start-space'),
              onPressed: _busy ? null : _start,
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(52),
              ),
              child: _busy
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Start my Individual space'),
            ),
            const SizedBox(height: 10),
            TextButton(
              onPressed: _busy ? null : _signOut,
              child: const Text('Use a different account'),
            ),
          ],
        ),
      ),
    ),
  );
}
