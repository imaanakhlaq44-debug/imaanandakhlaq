import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../app_theme.dart';
import '../../screens/ui_kit.dart';
import 'hajj_data.dart';

/// Course accent (courseAccents[6] in learning_experience.dart).
const hajjGreen = Color(0xFF1F8A5B);
const hajjTint = Color(0xFFE6F3EC);
const hajjSand = Color(0xFFFFF4E3);

class HajjHeading extends StatelessWidget {
  const HajjHeading(this.text, {super.key, this.size = 22});
  final String text;
  final double size;
  @override
  Widget build(BuildContext context) =>
      Text(text, style: displayStyle(size, color: ink, height: 1.2));
}

class HajjEyebrow extends StatelessWidget {
  const HajjEyebrow(this.text, {super.key, this.color = hajjGreen});
  final String text;
  final Color color;
  @override
  Widget build(BuildContext context) => Text(
    text.toUpperCase(),
    style: TextStyle(
      color: color,
      fontSize: 12,
      fontWeight: FontWeight.w800,
      letterSpacing: 1,
    ),
  );
}

class HajjCard extends StatelessWidget {
  const HajjCard({
    super.key,
    required this.child,
    this.color = Colors.white,
    this.padding = const EdgeInsets.all(18),
  });
  final Widget child;
  final Color color;
  final EdgeInsets padding;
  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(20),
      boxShadow: cardDecoration().boxShadow,
    ),
    // Material (not a coloured box) so list tiles inside keep their ink.
    child: Material(
      color: color,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: lessonOutline, width: 1.3),
      ),
      clipBehavior: Clip.antiAlias,
      child: Padding(padding: padding, child: child),
    ),
  );
}

class BodyText extends StatelessWidget {
  const BodyText(this.text, {super.key, this.size = 17, this.color = ink});
  final String text;
  final double size;
  final Color color;
  @override
  Widget build(BuildContext context) => Text(
    text,
    style: TextStyle(fontSize: size, height: 1.55, color: color),
  );
}

class SmallNote extends StatelessWidget {
  const SmallNote(this.text, {super.key});
  final String text;
  @override
  Widget build(BuildContext context) => Text(
    text,
    style: const TextStyle(fontSize: 12.5, height: 1.5, color: mutedInk),
  );
}

class ArabicText extends StatelessWidget {
  const ArabicText(this.text, {super.key, this.size = 28});
  final String text;
  final double size;
  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 20),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: const Color(0xFFDCE8E1)),
    ),
    child: Text(
      text,
      textDirection: TextDirection.rtl,
      textAlign: TextAlign.center,
      style: TextStyle(
        fontFamily: 'NotoNaskhArabic',
        fontSize: size,
        height: 1.9,
        color: brandNavy,
      ),
    ),
  );
}

/// The draft-for-review notice the content rules require on every lesson.
class ReviewNotice extends StatelessWidget {
  const ReviewNotice({super.key});
  @override
  Widget build(BuildContext context) => const SmallNote(
    'Draft for scholarly review: duas, rulings and references are shown exactly as in the curriculum guide and still need review by qualified scholars before release.',
  );
}

/// "Ask a trusted adult" must be reachable on every page (guide T25).
class AskAdultButton extends StatelessWidget {
  const AskAdultButton({super.key, required this.course});
  final HajjCourse course;
  @override
  Widget build(BuildContext context) => IconButton(
    key: const Key('hajj-ask-adult'),
    tooltip: 'Ask a trusted adult',
    icon: const Icon(Icons.front_hand_outlined),
    onPressed: () => showAskAdult(context, course),
  );
}

Future<void> showAskAdult(BuildContext context, HajjCourse course) {
  final unwell = course
      .maps('faq', course.parent)
      .firstWhere((f) => (f['q'] as String).contains('lost, unwell'));
  return showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    builder: (context) => SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
        child: Column(
          key: const Key('hajj-ask-adult-sheet'),
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const HajjHeading('Ask my guardian'),
            const SizedBox(height: 10),
            const BodyText(
              'Not sure what to do? Stop and ask a trusted adult or scholar. It is always okay to say “I need help.”',
            ),
            const SizedBox(height: 16),
            HajjCard(
              color: hajjSand,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    unwell['q'] as String,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      color: ink,
                    ),
                  ),
                  const SizedBox(height: 6),
                  BodyText(unwell['a'] as String, size: 15),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Okay'),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

/// Evidence chips, e.g. "S01 Official Nusuk Umrah Journey", that open the
/// source link from the guide's register.
class EvidenceChips extends StatelessWidget {
  const EvidenceChips({super.key, required this.course, required this.ids});
  final HajjCourse course;
  final List<String> ids;
  @override
  Widget build(BuildContext context) => Wrap(
    spacing: 8,
    runSpacing: 8,
    children: [
      for (final id in ids)
        if (course.source(id) case final s?)
          ActionChip(
            key: Key('hajj-evidence-$id'),
            avatar: const Icon(Icons.menu_book_outlined, size: 16),
            label: Text(
              '$id ${s['title']}',
              softWrap: true,
              style: const TextStyle(fontSize: 13),
            ),
            onPressed: () => openSourceUrl(context, s['url'] as String),
          ),
    ],
  );
}

Future<void> openSourceUrl(BuildContext context, String url) async {
  try {
    if (!await launchUrl(
      Uri.parse(url),
      mode: LaunchMode.externalApplication,
    )) {
      throw StateError('Unavailable');
    }
  } catch (_) {
    if (context.mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Could not open $url')));
    }
  }
}

/// Simple guardian check before parent-only areas. It is a speed bump for
/// young children, not an account check (see README).
Future<bool> confirmGrownUp(BuildContext context) async =>
    await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('For parents and guardians'),
        content: const Text(
          'This part is for a grown-up. Please hand the device to your parent or guardian.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Go back'),
          ),
          FilledButton(
            key: const Key('hajj-grown-up-yes'),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('I am a grown-up'),
          ),
        ],
      ),
    ) ??
    false;

void showSaveError(BuildContext context) =>
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        key: Key('hajj-save-error'),
        content: Text('Your progress was not saved. Please try again.'),
      ),
    );
