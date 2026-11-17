import 'package:flutter/material.dart';
import '../app_theme.dart';
import '../data/app_repository.dart';
import '../domain.dart';
import 'book_reader.dart';

class ChapterScreen extends StatefulWidget {
  const ChapterScreen({
    super.key,
    required this.repository,
    required this.account,
    required this.learner,
    required this.book,
    required this.chapter,
  });
  final AppRepository repository;
  final Profile account, learner;
  final Book book;
  final Chapter chapter;
  @override
  State<ChapterScreen> createState() => _ChapterScreenState();
}

class _ChapterScreenState extends State<ChapterScreen> {
  final _answer = TextEditingController();
  late final Stream<Profile?> _access = widget.repository.profile(
    widget.learner.uid,
  );
  late List<int> _cells = List.filled(widget.chapter.rowCount * 7, 0);
  int _day = DateTime.now().weekday - 1;
  bool _loading = true, _saving = false, _dirty = false, _approved = false;
  String? _error;
  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _answer.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await widget.repository.submission(
        widget.learner.uid,
        widget.chapter.id,
      );
      if (!mounted) return;
      _answer.text = data?['discussionText'] as String? ?? '';
      final grid = data?['gridState'];
      final cells = grid is Map ? grid['cells'] : null;
      if (cells is List &&
          cells.length == _cells.length &&
          cells.every((c) => c is int && c >= 0 && c <= 2)) {
        _cells = List<int>.from(cells);
      }
      _approved =
          data?['reviewStatus'] == 'teacher_approved' ||
          data?['teacherApprovedAt'] != null;
      setState(() => _loading = false);
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = friendlyError(e);
          _loading = false;
        });
      }
    }
  }

  Future<void> _save(bool submit) async {
    if (_saving || _approved) return;
    if (submit && _answer.text.trim().isEmpty) {
      _message('Write your reflection before submitting.');
      return;
    }
    FocusScope.of(context).unfocus();
    setState(() => _saving = true);
    try {
      await widget.repository.saveActivity(
        widget.account,
        widget.learner,
        widget.book,
        widget.chapter,
        _answer.text,
        List<int>.of(_cells),
        submit: submit,
      );
      if (!mounted) return;
      setState(() => _dirty = false);
      _message(
        submit
            ? (widget.learner.role == AccountRole.individual
                  ? 'Activity completed.'
                  : 'Activity sent for review.')
            : 'Your progress has been saved.',
      );
    } catch (e) {
      if (mounted) _message(friendlyError(e));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _message(String text) =>
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
  Future<void> _leave() async {
    if (_saving) return;
    final discard = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Leave without saving?'),
        content: const Text('Your latest changes have not been saved.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Keep editing'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Leave'),
          ),
        ],
      ),
    );
    if (discard == true && mounted) {
      setState(() => _dirty = false);
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) Navigator.pop(context);
      });
    }
  }

  @override
  Widget build(BuildContext context) => StreamBuilder<Profile?>(
    stream: _access,
    builder: (context, access) {
      if (access.hasError ||
          (access.connectionState != ConnectionState.waiting &&
              (access.data == null ||
                  !ownsLearner(widget.account, access.data!)))) {
        return Scaffold(
          appBar: AppBar(),
          body: const MessageView(
            title: 'Learner unavailable',
            message:
                'Access to this learner has changed. Return to your family dashboard.',
          ),
        );
      }
      if (!access.hasData) {
        return const Scaffold(body: Center(child: CircularProgressIndicator()));
      }
      return PopScope(
        canPop: !_dirty && !_saving,
        onPopInvokedWithResult: (didPop, _) {
          if (!didPop) _leave();
        },
        child: Scaffold(
          appBar: AppBar(title: Text(widget.chapter.title)),
          body: SafeArea(
            child: ConstrainedBody(
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : _error != null
                  ? MessageView(
                      title: 'Could not open this activity',
                      message: _error!,
                      action: FilledButton(
                        onPressed: _load,
                        child: const Text('Retry'),
                      ),
                    )
                  : _content(),
            ),
          ),
        ),
      );
    },
  );
  Widget _content() {
    final chapter = widget.chapter;
    final readOnly = _approved || _saving;
    final dayAllowed = editableDay(widget.learner, _day, DateTime.now());
    var row = 0;
    return ListView(
      padding: const EdgeInsets.all(22),
      children: [
        Text(
          'READ · REFLECT · PRACTISE',
          style: const TextStyle(
            color: brandPink,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.5,
            fontSize: 11,
          ),
        ),
        const SizedBox(height: 12),
        Text(chapter.title, style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 20),
        OutlinedButton.icon(
          onPressed: () => Navigator.push(
            context,
            MaterialPageRoute<void>(
              builder: (_) =>
                  BookReaderScreen(book: widget.book, chapter: chapter),
            ),
          ),
          icon: const Icon(Icons.menu_book_outlined),
          label: Text(
            'Read story · pages ${chapter.pageStart}–${chapter.pageEnd}',
          ),
        ),
        const SizedBox(height: 24),
        if (_approved)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(18),
              child: Text(
                'Reviewed by your teacher. This activity is read-only.',
              ),
            ),
          ),
        const SizedBox(height: 12),
        Text('Think about it', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        Text(chapter.question, style: Theme.of(context).textTheme.bodyLarge),
        const SizedBox(height: 14),
        TextField(
          controller: _answer,
          readOnly: readOnly,
          minLines: 3,
          maxLines: 8,
          maxLength: 4000,
          decoration: const InputDecoration(
            labelText: 'Your reflection',
            alignLabelWithHint: true,
            hintText: 'Write what you learned…',
          ),
          onChanged: (_) => setState(() => _dirty = true),
        ),
        const SizedBox(height: 24),
        Text(
          'My weekly practice',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<int>(
          initialValue: _day,
          decoration: const InputDecoration(labelText: 'Choose a day'),
          items: [
            for (var i = 0; i < 7; i++)
              DropdownMenuItem(
                value: i,
                child: Text(
                  const [
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday',
                    'Sunday',
                  ][i],
                ),
              ),
          ],
          onChanged: _saving
              ? null
              : (value) {
                  if (value != null) setState(() => _day = value);
                },
        ),
        const SizedBox(height: 10),
        Text(
          dayAllowed
              ? 'Tap an action to mark: not answered → yes → not yet.'
              : 'This day is read-only. School learners can update today’s actions.',
        ),
        const SizedBox(height: 18),
        for (final section in chapter.sections) ...[
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Text(
              section.title,
              style: const TextStyle(fontWeight: FontWeight.w800, color: ink),
            ),
          ),
          for (final question in section.questions)
            _action(question, row++, dayAllowed && !readOnly),
        ],
        const SizedBox(height: 24),
        if (!_approved) ...[
          OutlinedButton.icon(
            onPressed: _saving ? null : () => _save(false),
            icon: const Icon(Icons.save_outlined),
            label: const Text('Save progress'),
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: _saving ? null : () => _save(true),
            child: _saving
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(
                    widget.learner.role == AccountRole.individual
                        ? 'Complete activity'
                        : 'Submit for review',
                  ),
          ),
          const SizedBox(height: 12),
          const Text(
            'Save progress before leaving. Submission sends your reflection and weekly practice for review.',
            style: TextStyle(color: Color(0xFF6B7A90), height: 1.5),
          ),
        ],
        const SizedBox(height: 20),
      ],
    );
  }

  Widget _action(String question, int row, bool enabled) {
    final index = row * 7 + _day;
    final value = _cells[index];
    final label = const ['Not answered', 'Yes', 'Not yet'][value];
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Card(
        child: ListTile(
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 10,
          ),
          title: Text(question),
          subtitle: Text(label),
          trailing: Icon(
            value == 1
                ? Icons.check_circle
                : value == 2
                ? Icons.remove_circle_outline
                : Icons.radio_button_unchecked,
            color: value == 1 ? brandPink : Colors.grey,
          ),
          enabled: enabled,
          onTap: enabled
              ? () => setState(() {
                  _cells[index] = (value + 1) % 3;
                  _dirty = true;
                })
              : null,
        ),
      ),
    );
  }
}
