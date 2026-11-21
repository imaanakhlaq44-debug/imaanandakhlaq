import 'package:flutter/material.dart';

import '../app_theme.dart';
import '../courses/course_journey.dart';
import '../l10n/language.dart';
import 'ui_kit.dart';

Future<void> openJourneyHomePreview(BuildContext context) =>
    Navigator.of(context).push<void>(
      MaterialPageRoute(
        builder: (_) => const LanguageScope(child: _JourneyHomePreview()),
      ),
    );

class _JourneyHomePreview extends StatelessWidget {
  const _JourneyHomePreview();

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: const Color(0xFFFFF8F2),
    appBar: AppBar(title: Text(tr('Learning Journey', 'سیکھنے کا سفر'))),
    body: SafeArea(
      child: ConstrainedBody(
        maxWidth: 610,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Card(
              margin: EdgeInsets.zero,
              clipBehavior: Clip.antiAlias,
              color: Colors.white,
              elevation: 0,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const CourseScene(
                    world: JourneyWorld.duas,
                    guide: true,
                    height: 164,
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          tr('Mission preview', 'مشن کی جھلک'),
                          style: const TextStyle(
                            color: journeyPink,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          tr(
                            'Begin with Allah’s Name',
                            'اللہ کے نام سے شروع کریں',
                          ),
                          style: displayStyle(27, color: journeyNavy),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Text(
              tr('Inside a mission', 'مشن میں کیا ہے'),
              style: displayStyle(21, color: journeyNavy),
            ),
            const SizedBox(height: 8),
            for (final (index, (icon, title, detail)) in [
              (
                Icons.menu_book_rounded,
                tr('Explore', 'سبق دیکھیں'),
                tr('Read the story', 'کہانی پڑھیں'),
              ),
              (
                Icons.extension_rounded,
                tr('Practise', 'مشق کریں'),
                tr('Try a short challenge', 'چھوٹی سی مشق کریں'),
              ),
              (
                Icons.lightbulb_outline_rounded,
                tr('Think', 'سوچیں'),
                tr('Make a choice', 'ایک فیصلہ کریں'),
              ),
              (
                Icons.favorite_border_rounded,
                tr('Apply', 'عمل کریں'),
                tr('Try a small action today', 'آج ایک چھوٹا سا عمل آزمائیں'),
              ),
            ].indexed)
              JourneyStop(
                number: index + 1,
                first: index == 0,
                last: index == 3,
                child: Card(
                  elevation: 0,
                  color: Colors.white,
                  margin: const EdgeInsets.only(bottom: 6),
                  child: ListTile(
                    leading: Icon(icon, color: journeyPink),
                    title: Text(
                      title,
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
                    subtitle: Text(detail),
                  ),
                ),
              ),
            const SizedBox(height: 10),
            Text(
              tr(
                'The 1,000-level Journey will open after its curriculum review.',
                'ایک ہزار لیول کا سفر نصاب کا جائزہ مکمل ہونے پر کھلے گا۔',
              ),
              style: const TextStyle(color: journeyNavy),
            ),
          ],
        ),
      ),
    ),
  );
}
