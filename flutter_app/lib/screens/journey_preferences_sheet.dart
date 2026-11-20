import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

import '../data/journey_account.dart';
import '../data/learning_journey.dart';
import '../domain.dart';

Future<void> showJourneyPreferences(
  BuildContext context,
  FirebaseFirestore db,
  Profile learner,
) => showDialog<void>(
  context: context,
  builder: (_) => _JourneyPreferencesDialog(
    name: learner.name,
    document: JourneyPreferences.document(db, learner.learnerId),
  ),
);

class _JourneyPreferencesDialog extends StatefulWidget {
  const _JourneyPreferencesDialog({required this.name, required this.document});

  final String name;
  final DocumentReference<Map<String, dynamic>> document;

  @override
  State<_JourneyPreferencesDialog> createState() =>
      _JourneyPreferencesDialogState();
}

class _JourneyPreferencesDialogState extends State<_JourneyPreferencesDialog> {
  JourneyPreferences? _draft;
  bool _saving = false;
  bool _loadFailed = false;
  bool _saveFailed = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loadFailed = false);
    try {
      final result = await widget.document
          .get(const GetOptions(source: Source.server))
          .timeout(const Duration(seconds: 8));
      if (mounted) {
        setState(() => _draft = JourneyPreferences.fromMap(result.data()));
      }
    } catch (_) {
      if (mounted) setState(() => _loadFailed = true);
    }
  }

  Future<void> _save(JourneyPreferences next) async {
    setState(() {
      _saving = true;
      _saveFailed = false;
    });
    try {
      await widget.document.firestore.runTransaction((transaction) async {
        transaction.set(widget.document, next.toMap());
      }, timeout: const Duration(seconds: 8));
      if (mounted) Navigator.of(context).pop();
    } catch (_) {
      if (mounted) setState(() => _saveFailed = true);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final draft = _draft;
    return PopScope(
      canPop: !_saving,
      child: AlertDialog(
        scrollable: true,
        title: Text('Learning Journey for ${widget.name}'),
        content: SizedBox(
          width: 400,
          child: draft == null
              ? (_loadFailed
                    ? Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text('Settings could not be opened.'),
                          TextButton(
                            onPressed: _load,
                            child: const Text('Retry'),
                          ),
                        ],
                      )
                    : const LinearProgressIndicator())
              : Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Sync progress between devices'),
                      subtitle: const Text(
                        'Shares lesson completion and review dates with your signed-in account.',
                      ),
                      value: draft.sync,
                      onChanged: _saving
                          ? null
                          : (sync) => setState(
                              () => _draft = draft.copyWith(sync: sync),
                            ),
                    ),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Learn with an adult'),
                      value: draft.supported,
                      onChanged: _saving
                          ? null
                          : (supported) => setState(
                              () =>
                                  _draft = draft.copyWith(supported: supported),
                            ),
                    ),
                    DropdownButtonFormField<String>(
                      initialValue: draft.lane?.name ?? '',
                      decoration: const InputDecoration(
                        labelText: 'Learning age group',
                      ),
                      items: [
                        const DropdownMenuItem(
                          value: '',
                          child: Text('Use the standard journey'),
                        ),
                        for (final lane in JourneyLane.values)
                          DropdownMenuItem(
                            value: lane.name,
                            child: Text('${lane.ages} · ${lane.label}'),
                          ),
                      ],
                      onChanged: _saving
                          ? null
                          : (value) => setState(() {
                              _draft = JourneyPreferences(
                                sync: draft.sync,
                                supported: draft.supported,
                                sessionMinutes: draft.sessionMinutes,
                                lane: JourneyLane.values
                                    .where((item) => item.name == value)
                                    .firstOrNull,
                              );
                            }),
                    ),
                    DropdownButtonFormField<int>(
                      initialValue: draft.sessionMinutes,
                      decoration: const InputDecoration(
                        labelText: 'Session limit',
                      ),
                      items: [
                        for (final limit in const [0, 5, 10, 15, 20])
                          DropdownMenuItem(
                            value: limit,
                            child: Text(
                              limit == 0 ? 'No limit' : '$limit minutes',
                            ),
                          ),
                      ],
                      onChanged: _saving
                          ? null
                          : (limit) {
                              if (limit == null) return;
                              setState(
                                () => _draft = draft.copyWith(
                                  sessionMinutes: limit,
                                ),
                              );
                            },
                    ),
                    if (_saveFailed)
                      const Text('Settings could not be saved. Try again.'),
                  ],
                ),
        ),
        actions: [
          TextButton(
            onPressed: _saving ? null : () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          if (draft != null)
            FilledButton(
              onPressed: _saving ? null : () => _save(draft),
              child: Text(_saving ? 'Saving…' : 'Save'),
            ),
        ],
      ),
    );
  }
}
