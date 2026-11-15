import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../app_theme.dart';
import '../../screens/ui_kit.dart';
import 'salah_data.dart';

/// Course accent, the same colour as `courseAccents[3]` in
/// lib/screens/learning_experience.dart (checked by the tests).
const salahAccent = Color(0xFF7B4FD6);
const salahTint = Color(0xFFF1ECFC);
const softInk = Color(0xFF5E6982);

TextStyle bodyText([double size = 17]) =>
    TextStyle(fontSize: size, height: 1.55, color: ink);

Widget salahHeading(String text, {bool centered = false}) => Text(
  text,
  textAlign: centered ? TextAlign.center : TextAlign.start,
  style: displayStyle(24, color: ink, height: 1.2),
);

/// Small label above a block ("FOR GROWN-UPS", "EVIDENCE"…).
Widget eyebrow(String text, {Color color = salahAccent}) => Text(
  text.toUpperCase(),
  style: TextStyle(
    color: color,
    fontSize: 12,
    fontWeight: FontWeight.w800,
    letterSpacing: .8,
  ),
);

class SoftCard extends StatelessWidget {
  const SoftCard({
    super.key,
    required this.child,
    this.color = Colors.white,
    this.border = lineColor,
    this.padding = const EdgeInsets.all(18),
  });
  final Widget child;
  final Color color, border;
  final EdgeInsets padding;
  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    padding: padding,
    decoration: BoxDecoration(
      color: color,
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: border),
    ),
    child: child,
  );
}

/// Note meant for a parent or teacher, kept visibly apart from child text.
class GrownUpNote extends StatelessWidget {
  const GrownUpNote({super.key, required this.text, this.title});
  final String text;
  final String? title;
  @override
  Widget build(BuildContext context) => SoftCard(
    color: const Color(0xFFFFF6EA),
    border: const Color(0xFFF5DDBB),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(
              Icons.family_restroom_rounded,
              size: 18,
              color: Color(0xFFB45F0A),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: eyebrow(
                title ?? 'For grown-ups',
                color: const Color(0xFFB45F0A),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(text, style: const TextStyle(fontSize: 15, height: 1.5)),
      ],
    ),
  );
}

/// Placeholder where approved recitation audio will go. No audio files
/// exist yet, so this never plays anything.
class AudioComingSlot extends StatelessWidget {
  const AudioComingSlot({super.key});
  @override
  Widget build(BuildContext context) => Semantics(
    label: 'Audio coming after scholarly review',
    excludeSemantics: true,
    child: Container(
      key: const Key('salah-audio-coming'),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: salahTint,
        borderRadius: BorderRadius.circular(30),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.headphones_rounded, size: 17, color: salahAccent),
          SizedBox(width: 6),
          Flexible(
            child: Text(
              'Audio coming after review',
              style: TextStyle(
                color: salahAccent,
                fontWeight: FontWeight.w700,
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    ),
  );
}

Future<void> openSource(BuildContext context, SourceLink link) async {
  try {
    if (!await launchUrl(
      Uri.parse(link.url),
      mode: LaunchMode.externalApplication,
    )) {
      throw StateError('Unavailable');
    }
  } catch (_) {
    if (context.mounted) {
      showMessage(context, 'Could not open the source. ${link.label}');
    }
  }
}

class SourceLinks extends StatelessWidget {
  const SourceLinks(this.links, {super.key});
  final List<SourceLink> links;
  @override
  Widget build(BuildContext context) => Wrap(
    spacing: 4,
    children: [
      for (final l in links)
        TextButton.icon(
          onPressed: () => openSource(context, l),
          icon: const Icon(Icons.open_in_new, size: 15),
          label: Text(l.label),
        ),
    ],
  );
}

class ArabicText extends StatelessWidget {
  const ArabicText(this.text, {super.key, this.size = 27});
  final String text;
  final double size;
  @override
  Widget build(BuildContext context) => Text(
    text,
    key: const Key('salah-arabic'),
    textDirection: TextDirection.rtl,
    textAlign: TextAlign.center,
    style: TextStyle(
      fontFamily: 'NotoNaskhArabic',
      fontSize: size,
      height: 1.95,
      color: brandNavy,
    ),
  );
}

/// One recitation: Arabic (authoritative), meanings, source and the audio
/// slot. [hidden] covers the Arabic for a gentle self-check.
class RecitationCard extends StatelessWidget {
  const RecitationCard({super.key, required this.r, this.hidden = false});
  final SalahRecitation r;
  final bool hidden;
  @override
  Widget build(BuildContext context) => Container(
    decoration: cardDecoration(),
    padding: const EdgeInsets.all(18),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: 8,
          runSpacing: 6,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            TagChip(r.quran ? 'Qur’an' : r.id, color: salahAccent),
            Text(r.title, style: displayStyle(19, color: ink)),
          ],
        ),
        if (r.usedWhere != null) ...[
          const SizedBox(height: 4),
          Text(r.usedWhere!, style: const TextStyle(color: softInk)),
        ],
        const SizedBox(height: 14),
        if (hidden)
          Container(
            key: const Key('salah-words-hidden'),
            width: double.infinity,
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: salahTint,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Text(
              'Take your time. Say what you remember.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 18, height: 1.5, color: ink),
            ),
          )
        else
          ArabicText(r.arabic, size: r.arabic.length > 220 ? 23 : 27),
        const SizedBox(height: 12),
        const AudioComingSlot(),
        const SizedBox(height: 16),
        eyebrow('Meaning'),
        const SizedBox(height: 6),
        Text(
          r.meaningChild ?? r.meaning,
          style: const TextStyle(
            fontSize: 18,
            height: 1.45,
            fontWeight: FontWeight.w700,
            color: ink,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          r.meaningUrdu,
          textDirection: TextDirection.rtl,
          style: const TextStyle(
            fontFamily: 'NotoNaskhArabic',
            fontSize: 18,
            height: 1.8,
            color: ink,
          ),
        ),
        const SizedBox(height: 10),
        Text(
          'Practise: ${r.memorization}',
          style: const TextStyle(color: softInk, height: 1.45),
        ),
        const SizedBox(height: 10),
        Text(
          r.source,
          style: const TextStyle(fontWeight: FontWeight.w700, color: brandNavy),
        ),
        if (r.links.isNotEmpty) SourceLinks(r.links),
        Theme(
          data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
          child: Material(
            type: MaterialType.transparency,
            child: ExpansionTile(
              tilePadding: EdgeInsets.zero,
              childrenPadding: const EdgeInsets.only(bottom: 8),
              title: const Text(
                'Note for grown-ups',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
              ),
              children: [
                Text(
                  r.editorialNote,
                  style: const TextStyle(fontSize: 14, height: 1.5),
                ),
              ],
            ),
          ),
        ),
      ],
    ),
  );
}

/// The manual labels some lines for the developer, e.g.
/// `Narrator: “The Fard prayers…”`. The learner sees only the quoted words.
String spokenPart(String note) {
  final m = RegExp(r'^[^“]{1,40}: “(.+)”$').firstMatch(note);
  return m == null ? note : m.group(1)!;
}

/// A manual table, shown as one card per row so it fits 375 px.
class SalahTableView extends StatelessWidget {
  const SalahTableView(this.table, {super.key});
  final SalahTable table;
  @override
  Widget build(BuildContext context) {
    final header = table.rows.first;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(table.title, style: displayStyle(19, color: ink)),
        const SizedBox(height: 10),
        for (final row in table.rows.skip(1))
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: SoftCard(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    row.first,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      color: salahAccent,
                      fontSize: 16,
                    ),
                  ),
                  for (var i = 1; i < row.length; i++) ...[
                    const SizedBox(height: 6),
                    Text(
                      header[i],
                      style: const TextStyle(color: softInk, fontSize: 13),
                    ),
                    Text(row[i], style: bodyText(15.5)),
                  ],
                ],
              ),
            ),
          ),
        if (table.note != null) ...[
          const SizedBox(height: 4),
          Text(spokenPart(table.note!), style: bodyText(15.5)),
        ],
      ],
    );
  }
}
