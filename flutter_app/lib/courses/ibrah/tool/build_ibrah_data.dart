// Builds assets/data/courses/ibrah-*.json from the extracted IBRAH texts.
//
// Run from flutter_app/:
//   E:\flutter\bin\dart.bat run lib/courses/ibrah/tool/build_ibrah_data.dart [extracted-06-IBRAH-dir] [inventory.json]
//
// Not imported by the app. Every story line, Arabic line, question, choice,
// feedback and action is copied word for word from the source text; the
// script only decides which line belongs to which screen and leaves out
// developer-only notes (IDs, release checks, mini-game build instructions).
// ignore_for_file: avoid_print
import 'dart:convert';
import 'dart:io';

class Vol {
  const Vol(this.n, this.file, this.prophet, this.prophetAr);
  final int n;
  final String file, prophet, prophetAr;
}

const vols = [
  Vol(
    1,
    'IBRAH_Junior_Volume_01_Prophet_Adam_Complete_Stories_and_Gamified_Missions',
    'Adam',
    'آدم',
  ),
  Vol(
    2,
    'IBRAH_Junior_Volume_02_Prophet_Idris_Complete_Stories_and_Gamified_Missions',
    'Idris',
    'إدريس',
  ),
  Vol(
    3,
    'IBRAH_Junior_Volume_03_Prophet_Nuh_Complete_Stories_and_Gamified_Missions',
    'Nuh',
    'نوح',
  ),
  Vol(4, 'IBRAH_Junior_Volume_4_Prophet_Hud_Resent', 'Hud', 'هود'),
  Vol(
    5,
    'IBRAH_Junior_Volume_05_Prophet_Salih_Complete_Stories_and_Gamified_Missions',
    'Salih',
    'صالح',
  ),
  Vol(
    6,
    'IBRAH_Junior_Volume_06_Prophet_Ibrahim_Complete_Stories_and_Gamified_Missions',
    'Ibrahim',
    'إبراهيم',
  ),
  Vol(7, 'IBRAH_Junior_Volume_07_Prophet_Lut_Fresh_Copy', 'Lut', 'لوط'),
  Vol(8, 'IBRAH_Junior_Volume_8_Ismail_Fresh_Copy', 'Ismail', 'إسماعيل'),
  Vol(
    9,
    'IBRAH_Junior_Volume_09_Ishaq_Yaqub_Complete',
    'Ishaq & Yaqub',
    'إسحاق ويعقوب',
  ),
  Vol(10, 'IBRAH_Junior_Volume_10_Yusuf_Complete', 'Yusuf', 'يوسف'),
  Vol(11, 'IBRAH_Junior_Volume_11_Ayyub_Complete', 'Ayyub', 'أيوب'),
  Vol(12, 'IBRAH_Junior_Volume_12_Shuayb_Complete', 'Shuayb', 'شعيب'),
  Vol(13, 'IBRAH_Junior_Volume_13_Musa_Complete', 'Musa', 'موسى'),
  Vol(14, 'IBRAH_Junior_Volume_14_Harun_Complete', 'Harun', 'هارون'),
  Vol(15, 'IBRAH_Junior_Volume_15_Fresh_Copy', 'Yusha ibn Nun', 'يوشع بن نون'),
  Vol(16, 'IBRAH_Junior_Volume_16_Dawud_Complete', 'Dawud', 'داود'),
  Vol(
    17,
    'IBRAH_Junior_Volume_17_Sulayman_Download_Copy',
    'Sulayman',
    'سليمان',
  ),
  Vol(18, 'IBRAH_Junior_Volume_18_Ilyas_Complete', 'Ilyas', 'إلياس'),
  Vol(19, 'IBRAH_Junior_Volume_19_Al_Yasa_Complete', 'Al-Yasa', 'اليسع'),
  Vol(20, 'IBRAH_Junior_Volume_20_Dhul_Kifl_Complete', 'Dhul-Kifl', 'ذو الكفل'),
  Vol(21, 'IBRAH_Junior_Volume_21_Yunus_Complete', 'Yunus', 'يونس'),
  Vol(22, 'IBRAH_Junior_Volume_22_Zakariyya_Complete', 'Zakariyya', 'زكريا'),
  Vol(23, 'IBRAH_Junior_Volume_23_Yahya_Complete', 'Yahya', 'يحيى'),
  Vol(24, 'IBRAH_Junior_Volume_24_Isa_Complete', 'Isa', 'عيسى'),
];

final arabicRe = RegExp(
  r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]',
);
final letterRe = RegExp(r'[A-Za-z\u00C0-\u024F\u1E00-\u1EFF]');

bool isArabic(String s) {
  final a = arabicRe.allMatches(s).length;
  final l = letterRe.allMatches(s).length;
  return a >= 8 && a > l * 3;
}

String clean(String s) => s.replaceAll(RegExp(r'\s+'), ' ').trim();

// ---- section detection -----------------------------------------------------

final missionMarkers = <(RegExp, bool)>[
  (RegExp(r'^MISSION \d+ OF \d+ •'), false), // 1, 5
  (RegExp(r'^Mission \d+ · '), true), // 2
  (RegExp(r'^MISSION \d+\s+·\s+'), true), // 3
  (RegExp(r'^MISSION \d+ — '), true), // 4
  (RegExp(r'^IBRAH JUNIOR\s+•\s+VOLUME \d+\s+•\s+MISSION \d+\s*$'), false), // 6
  (RegExp(r'^LEARNING MISSION \d+ OF'), false), // 7
  (RegExp(r'^ʿIBRAH JUNIOR \| MISSION \d+ — '), true), // 8
  (RegExp(r'^MISSION \d+\s+•\s+'), true), // 9-24
];

final storyMarkers = <(RegExp, bool)>[
  (RegExp(r'^CONNECTED STORY\s+•\s+EPISODE \d+ OF \d+'), false),
  (RegExp(r'^Story \d+ · '), true),
  (RegExp(r'^CONNECTED STORY \d+ OF \d+ — '), true),
];

(bool, bool)? matchMarker(String line, List<(RegExp, bool)> markers) {
  for (final (re, inline) in markers) {
    if (re.hasMatch(line)) return (true, inline);
  }
  return null;
}

int findLine(List<String> lines, RegExp re, [int from = 0]) {
  for (var i = from; i < lines.length; i++) {
    if (re.hasMatch(lines[i])) return i;
  }
  return -1;
}

int nextPart(List<String> lines, int from) {
  for (var i = from + 1; i < lines.length; i++) {
    final l = lines[i];
    if (RegExp(r'^PART [IVXA]+ — ').hasMatch(l) ||
        l.startsWith('Closing synthesis') ||
        l.startsWith('Editorial source register')) {
      return i;
    }
  }
  return lines.length;
}

String inlineTitle(String line) {
  final m = RegExp(
    r'^(?:.*?MISSION \d+|Mission \d+|Story \d+|CONNECTED STORY \d+ OF \d+)\s*(?:—|·|•)\s*(.+)$',
  ).firstMatch(line);
  return clean(m?.group(1) ?? line);
}

// ---- evidence (Arabic + reference + meaning) ------------------------------

final verseRe = RegExp(r'\b(\d{1,3}):(\d{1,3})(?:\s*[–-]\s*(\d{1,3}))?');
final meaningRe = RegExp(
  r'meaning(?: guide)?(?: \([^)]*\))?\s*[:•]\s*(.+)$',
  caseSensitive: false,
);

/// Every verse in refs such as "11:84–85" or "21:51".
Set<String> expand(Iterable<String> refs) {
  final out = <String>{};
  for (final r in refs) {
    for (final m in verseRe.allMatches(r)) {
      final a = int.parse(m.group(2)!);
      final b = m.group(3) == null ? a : int.parse(m.group(3)!);
      for (var i = a; i <= b && i < a + 60; i++) {
        out.add('${m.group(1)}:$i');
      }
    }
  }
  return out;
}

List<Map<String, dynamic>> evidenceIn(List<String> lines) {
  final out = <Map<String, dynamic>>[];
  for (var i = 0; i < lines.length; i++) {
    if (!isArabic(lines[i])) continue;
    String? ref, meaning;
    if (i > 0 &&
        !isArabic(lines[i - 1]) &&
        verseRe.hasMatch(lines[i - 1]) &&
        lines[i - 1].length < 110) {
      ref = clean(lines[i - 1]);
    }
    for (var j = i + 1; j < lines.length && j <= i + 3; j++) {
      if (isArabic(lines[j])) break;
      final l = lines[j];
      if (ref == null &&
          verseRe.hasMatch(l) &&
          l.length < 70 &&
          !meaningRe.hasMatch(l)) {
        ref = clean(l);
      }
      if (l.startsWith('Reference:')) ref = clean(l.substring(10));
      final m = meaningRe.firstMatch(l);
      if (m != null) {
        meaning = clean(m.group(1)!);
        if (ref == null) {
          final pre = l.substring(0, m.start);
          if (verseRe.hasMatch(pre)) ref = clean(pre.replaceAll('|', ''));
        }
        break;
      }
    }
    out.add({
      'arabic': clean(lines[i]),
      'reference': ?ref,
      'meaning': ?meaning,
      'verses': expand([ref ?? '']).toList(),
    });
  }
  return out;
}

// ---- generic block classification ------------------------------------------

final devLine = RegExp(
  r'^(Developer|DEVELOPER (?!ANSWER)|Completion:|Completion check|Teacher checkpoint|Mastery rule|Release check|'
  r'Editorial publishing rule|Age adaptation|Developer setup|5–6 guided|7–9 standard|10–13 advanced|'
  r'Narrate the source|Full story segment|Show source ID|World IBRAH|STABLE ID|IBRAH JUNIOR|ʿIBRAH JUNIOR|'
  r'MINI-GAME|Suggested mini-game|Suggested interactive activity|Suggested mechanic|Mini-game:|GAME / VOCABULARY|'
  r'Memory mode|Narration connection|Qur’anic anchors:|Additional complete verses|Revision check|'
  r'Complete selected āyah|Full selected āyah|Working transcription|Interactive mini-game|'
  r'Option$|Choice$|Learner option$|Developer activity|HUD-M|LEARNING LINKS|Teacher’s historical anchor|'
  r'.{0,8}DISCOVER — THE QUR’AN • Read the approved Arabic)',
);

bool isHeading(String s) =>
    s.length <= 72 &&
    !RegExp(r'[.?!”"’:;,]$').hasMatch(s) &&
    !s.startsWith('“') &&
    !s.startsWith('"');

final kvRe = RegExp(r'^(?:\d+\s*[·.]?\s+)?([^•:|]{2,64}?)\s*(?:•|:)\s+(.+)$');

Map<String, dynamic> block(String raw) {
  final s = clean(raw);
  if (isArabic(s)) return {'t': 'ar', 'text': s};
  final m = kvRe.firstMatch(s);
  if (m != null && m.group(1)!.split(' ').length <= 9) {
    return {'t': 'kv', 'label': clean(m.group(1)!), 'text': clean(m.group(2)!)};
  }
  if (isHeading(s)) {
    return {'t': 'h', 'text': s.replaceFirst(RegExp(r'^\d+\s*[·.]?\s+'), '')};
  }
  return {'t': 'p', 'text': s};
}

/// "A MOMENT TO REFLECT  What good…" → "A MOMENT TO REFLECT • What good…".
String capsLabel(String s) => s.replaceFirstMapped(
  RegExp(r"^([A-Z][A-Z ’ʾ'/-]{3,40}?)\s{2,}(?=[^\s•·:|—])"),
  (m) => '${m[1]} • ',
);

/// Volume 12 repeats two production instructions inside its mission cards.
String stripTemplate(String s) => s
    .replaceAll(
      'Read/listen to the cited verse in the source panel. Present its full approved Arabic, accurate translation, verse number and recitation. The specific selected source is in Part I when available; supporting verses require the approved canonical verse record.',
      '',
    )
    .replaceAll(
      ' Present a short age-appropriate explanation that does not collapse the Prophet’s mission into the modern school example.',
      '',
    );

// ---- stories ---------------------------------------------------------------

final storyCallout = RegExp(
  r'^(CARRY FORWARD|EPISODE TAKEAWAY|Challenge of the Day|Level-Up|Narration break|STORY ACTION)',
);

List<Map<String, dynamic>> parseStories(List<String> lines) {
  final starts = <int>[];
  for (var i = 0; i < lines.length; i++) {
    if (matchMarker(lines[i], storyMarkers) != null) starts.add(i);
  }
  final out = <Map<String, dynamic>>[];
  for (var k = 0; k < starts.length; k++) {
    final s = starts[k];
    final e = k + 1 < starts.length ? starts[k + 1] : lines.length;
    final (_, inline) = matchMarker(lines[s], storyMarkers)!;
    final number = int.parse(RegExp(r'(\d+)').firstMatch(lines[s])!.group(1)!);
    var i = s + 1;
    final title = inline ? inlineTitle(lines[s]) : clean(lines[i++]);
    String? subtitle;
    if (i < e && lines[i].length < 110 && !storyCallout.hasMatch(lines[i])) {
      subtitle = clean(lines[i++]);
    }
    final blocks = <Map<String, dynamic>>[];
    for (; i < e; i++) {
      final l = clean(lines[i]);
      if (l.isEmpty || devLine.hasMatch(l)) continue;
      if (storyCallout.hasMatch(l)) {
        if (l == 'STORY ACTION' && i + 1 < e) {
          blocks.add({
            't': 'kv',
            'label': 'Story action',
            'text': clean(lines[++i]),
          });
          continue;
        }
        final m = RegExp(r'^([^•:]+?)\s*(?:•|·|:)\s*(.+)$').firstMatch(l);
        var text = m?.group(2) ?? l;
        text = text.replaceFirst(RegExp(r'\s*\|\s*Missions?:.*$'), '');
        blocks.add({
          't': 'kv',
          'label': clean(m?.group(1) ?? ''),
          'text': clean(text),
        });
        continue;
      }
      blocks.add({'t': isArabic(l) ? 'ar' : 'p', 'text': l});
    }
    out.add({
      'id': 's${number.toString().padLeft(2, '0')}',
      'number': number,
      'title': title,
      'subtitle': ?subtitle,
      'blocks': blocks,
    });
  }
  return out;
}

// ---- missions --------------------------------------------------------------

final choiceRe = RegExp(r'^([A-D])[.)]\s+(\S.*)$');
final soloLetter = RegExp(r'^([A-D])$');
final answerRe = RegExp(
  r'(?:answer key|Correct response|Correct choice|Correct teaching choice|Best response|Recommended answer)\s*[:—•\-–]*\s*(?:Option\s+)?([A-D])\b[.:—–\-\s]*(.*)$',
  caseSensitive: false,
);
final actionRe = RegExp(
  r'(one daily action|daily[- ]life action|practical action|do one good thing today|core daily action|challenge of the day)',
  caseSensitive: false,
);
final tableHeader = {'Option', 'Choice', 'Learner option'};
final fbRes = [
  RegExp(r'^([A-D])(?: feedback)?[:.]\s+(.+)$'),
  RegExp(r'^IF THE LEARNER CHOOSES ([A-D])\s*•\s*(.+)$'),
  RegExp(r'^If Option ([A-D]) selected:\s*(.+)$'),
  RegExp(r'^If child chooses ([A-D]):\s*(.+)$'),
];

List<Map<String, dynamic>> parseMissions(
  List<String> lines,
  List<Map<String, dynamic>> library,
  List<String> warnings,
  int vol,
) {
  final starts = <int>[];
  for (var i = 0; i < lines.length; i++) {
    if (matchMarker(lines[i], missionMarkers) != null) starts.add(i);
  }
  final out = <Map<String, dynamic>>[];
  for (var k = 0; k < starts.length; k++) {
    final s = starts[k];
    final e = k + 1 < starts.length ? starts[k + 1] : lines.length;
    final (_, inline) = matchMarker(lines[s], missionMarkers)!;
    final number = int.parse(
      RegExp(
        r'MISSION (\d+)',
        caseSensitive: false,
      ).firstMatch(lines[s])!.group(1)!,
    );
    var i = s + 1;
    final title = inline ? inlineTitle(lines[s]) : clean(lines[i++]);
    final body = [
      for (var j = i; j < e; j++) clean(capsLabel(stripTemplate(lines[j]))),
    ].where((l) => l.isNotEmpty).toList();
    final head = [lines[s], ...body.take(4)].join(' ');
    final storyM = RegExp(
      r'(?:story|episode)[:\s]*(?:story\s*|episode\s*)?0*(\d+)',
      caseSensitive: false,
    ).firstMatch(head);
    final storyNo = storyM == null ? null : int.parse(storyM.group(1)!);

    final ci = body.indexWhere(
      (l) => choiceRe.hasMatch(l) || soloLetter.hasMatch(l),
    );
    final ai = body.indexWhere((l) => answerRe.hasMatch(l));
    if (ci < 0 || ai < 0 || ai < ci) {
      warnings.add(
        'vol $vol mission $number: no choices/answer (ci=$ci ai=$ai)',
      );
      continue;
    }
    // Question: closest line before the first choice that is not a table header.
    var qi = ci - 1;
    while (qi >= 0 && tableHeader.contains(body[qi])) {
      qi--;
    }
    final question = body[qi]
        .replaceFirst(RegExp(r'^.*?DECIDE[^•]*•\s*'), '')
        .replaceFirst(RegExp(r'^Question:\s*'), '');
    final choices = <Map<String, dynamic>>[];
    for (var j = ci; j < ai; j++) {
      final m = choiceRe.firstMatch(body[j]);
      if (m != null) {
        choices.add({'letter': m.group(1), 'text': m.group(2)});
      } else if (soloLetter.hasMatch(body[j]) && j + 1 < ai) {
        choices.add({'letter': body[j], 'text': body[++j]});
      }
    }
    final am = answerRe.firstMatch(body[ai])!;
    final correct = am.group(1)!;
    final answerNote = clean(am.group(2) ?? '');
    final feedback = <String, String>{};
    String? correctWhy;
    var j = ai + 1;
    for (; j < body.length; j++) {
      final l = body[j];
      RegExpMatch? m;
      for (final re in fbRes) {
        m ??= re.firstMatch(l);
      }
      if (m != null) {
        // Adam's volume puts all three on one line: "A: … • B: … • C: …".
        final multi = RegExp(
          r'([A-D]):\s(.*?)(?=\s•\s[A-D]:\s|$)',
        ).allMatches(l).toList();
        if (multi.length > 1) {
          for (final x in multi) {
            feedback[x.group(1)!] = clean(x.group(2)!);
          }
        } else {
          feedback[m.group(1)!] = clean(m.group(2)!);
        }
        continue;
      }
      final why = RegExp(
        r'^(?:Supportive feedback:|Why this choice\?)\s*(.+)$',
      ).firstMatch(l);
      if (why != null) {
        correctWhy = clean(why.group(1)!);
        continue;
      }
      // "For other choices:" is addressed to developers ("Let the learner
      // retry…"); the app shows its own gentle retry line instead.
      if (l.startsWith('For other choices:')) continue;
      break;
    }
    for (final c in choices) {
      final letter = c['letter'] as String;
      c['correct'] = letter == correct;
      final fb =
          feedback[letter] ??
          (letter == correct
              ? (correctWhy ?? (answerNote.isEmpty ? null : answerNote))
              : null);
      if (fb != null) c['feedback'] = fb;
    }
    if (!choices.any((c) => c['correct'] == true)) {
      warnings.add(
        'vol $vol mission $number: correct letter $correct not among choices',
      );
    }
    // Daily action and the "remember" screen.
    String? action;
    final remember = <Map<String, dynamic>>[];
    for (var r = j; r < body.length; r++) {
      final l = body[r];
      if (devLine.hasMatch(l)) {
        // Volume 2 puts the mini-game build note on the line after its heading.
        if (l.startsWith('Interactive mini-game')) r++;
        continue;
      }
      final am2 = actionRe.firstMatch(l);
      if (action == null && am2 != null && l.indexOf(am2.group(0)!) < 30) {
        var rest = l
            .substring(am2.end)
            .replaceFirst(RegExp(r'^[\s:•—–\-]+'), '');
        rest = rest.replaceFirst(RegExp(r'^Exactly one action\s*'), '');
        if (rest.split(' ').length >= 4) {
          action = clean(rest);
        } else {
          while (r + 1 < body.length &&
              actionRe.hasMatch(body[r + 1]) &&
              body[r + 1].length < 40) {
            r++;
          }
          if (r + 1 < body.length) action = clean(body[++r]);
        }
        continue;
      }
      if (RegExp(r'^(Act and reflect|Reflect and revisit)$').hasMatch(l)) {
        continue;
      }
      remember.add(block(l));
    }
    if (action == null) {
      warnings.add('vol $vol mission $number: no daily action');
    }
    var discover = <Map<String, dynamic>>[];
    for (var d = 0; d < qi; d++) {
      final l = body[d];
      if (devLine.hasMatch(l) || tableHeader.contains(l)) continue;
      if (RegExp(r'[•:]$').hasMatch(l)) continue;
      discover.add(block(l));
    }
    // Adam: "Source anchor / Learning target" table flattened into four lines.
    final sa = discover.indexWhere((b) => b['text'] == 'Source anchor');
    if (sa >= 0 &&
        sa + 3 < discover.length &&
        discover[sa + 1]['text'] == 'Learning target') {
      discover.replaceRange(sa, sa + 4, [
        {'t': 'kv', 'label': 'Source anchor', 'text': discover[sa + 2]['text']},
        {
          't': 'kv',
          'label': 'Learning target',
          'text': discover[sa + 3]['text'],
        },
      ]);
    }
    while (discover.isNotEmpty && discover.last['t'] == 'h') {
      discover.removeLast();
    }
    discover = discover.toList();
    final refs = {for (final v in verseRe.allMatches(head)) v.group(0)!};
    final wanted = expand(refs);
    // Cards without Arabic point to the volume's Part I source library.
    final evidence = discover.any((b) => b['t'] == 'ar')
        ? <Map<String, dynamic>>[]
        : [
            for (final x in library)
              if ((x['verses'] as List).any(wanted.contains))
                {
                  for (final en in x.entries)
                    if (en.key != 'verses') en.key: en.value,
                },
          ];
    out.add({
      'id': 'm${number.toString().padLeft(2, '0')}',
      'number': number,
      'title': title,
      'story': ?storyNo,
      'verses': refs.toList(),
      'discover': discover,
      'evidence': evidence,
      'question': question,
      'choices': choices,
      'action': ?action,
      'remember': remember,
    });
  }
  return out;
}

// ---- volume -------------------------------------------------------------------

Map<String, dynamic> parseVolume(
  Vol v,
  List<String> lines,
  Map<String, dynamic>? inv,
  List<String> warnings,
) {
  int part(RegExp re) => findLine(lines, re);
  final libStart = [
    part(RegExp(r'^PART [IA]+ — .*[Ss]ource library')),
    part(RegExp(r'^Primary revelation library')),
  ].firstWhere((x) => x >= 0, orElse: () => -1);
  final storyStart = part(RegExp(r'^PART [IV]+ — .*[Ss]tories'));
  var missionStart = part(RegExp(r'^PART [IV]+ — .*[Mm]issions'));
  final synthStart = [
    part(RegExp(r'^PART [IV]+ — .*[Ss]ynthesis')),
    part(RegExp(r'^Closing synthesis')),
  ].firstWhere((x) => x >= 0, orElse: () => -1);
  final storyEnd = missionStart >= 0
      ? missionStart
      : nextPart(lines, storyStart);
  var storyLines = lines.sublist(storyStart + 1, storyEnd);
  if (missionStart < 0) {
    // Volume 6 runs its missions straight after the stories.
    final first = storyLines.indexWhere(
      (l) => matchMarker(l, missionMarkers) != null,
    );
    missionStart = storyStart + first;
    storyLines = storyLines.sublist(0, first);
  }
  final missionEnd = synthStart > missionStart
      ? synthStart
      : nextPart(lines, missionStart);
  final library = libStart < 0
      ? <Map<String, dynamic>>[]
      : evidenceIn(lines.sublist(libStart + 1, nextPart(lines, libStart)));
  final stories = parseStories(storyLines);
  final missionLines = lines.sublist(missionStart + 1, missionEnd);
  final missions = parseMissions(missionLines, library, warnings, v.n);
  // Review items: the volume's source library; volumes without one use the
  // Arabic anchors printed inside the mission cards.
  var review = library.where((x) => x['meaning'] != null).toList();
  if (review.length < 2) {
    review = evidenceIn(
      missionLines,
    ).where((x) => x['meaning'] != null).toList();
  }
  final seen = <String>{};
  review = [
    for (final x in review)
      if (seen.add(x['arabic'] as String))
        {
          for (final en in x.entries)
            if (en.key != 'verses') en.key: en.value,
        },
  ];
  final synthesis = <Map<String, dynamic>>[];
  if (synthStart >= 0) {
    for (final l in lines.sublist(
      synthStart + 1,
      nextPart(lines, synthStart),
    )) {
      final c = clean(l);
      if (c.isEmpty || devLine.hasMatch(c)) continue;
      synthesis.add({
        't': isArabic(c) ? 'ar' : (isHeading(c) ? 'h' : 'p'),
        'text': c,
      });
    }
  }
  final intro = <String>[];
  final introAt = findLine(lines, RegExp(r'^Editorial introduction'));
  if (introAt >= 0) {
    for (var i = introAt + 1; i < lines.length && intro.length < 2; i++) {
      if (lines[i].length > 150) {
        intro.add(clean(lines[i]));
      } else if (intro.isNotEmpty) {
        break;
      }
    }
  }
  final reviewLine = lines
      .take(16)
      .firstWhere(
        (l) =>
            l.length < 260 &&
            RegExp(
              r'review(?: is)? required|requires?\b.*review|review.*before|review\b.*\brequired',
              caseSensitive: false,
            ).hasMatch(l),
        orElse: () => 'Scholarly review required before publication.',
      );
  final counts = lines
      .take(12)
      .firstWhere(
        (l) =>
            RegExp(r'stories', caseSensitive: false).hasMatch(l) &&
            RegExp(r'missions', caseSensitive: false).hasMatch(l),
        orElse: () => '',
      );
  if (stories.isEmpty) warnings.add('vol ${v.n}: no stories');
  if (review.length < 2) {
    warnings.add('vol ${v.n}: review has ${review.length} items');
  }
  return {
    'id': 'ibrah-${v.n.toString().padLeft(2, '0')}',
    'number': v.n,
    'prophet': v.prophet,
    'prophetArabic': v.prophetAr,
    'heading': clean(lines[4]),
    'title': clean(lines[5]),
    'themes': clean(lines[6]),
    'scope': clean(counts),
    'reviewNote': clean(reviewLine),
    'introduction': intro,
    'stories': stories,
    'missions': missions,
    'review': review,
    'synthesis': synthesis,
    'source': {
      'document': 'originals/06-IBRAH/${v.file}.docx',
      'extractedText': 'extracted/06-IBRAH/${v.file}.txt',
      'sha256': ?inv?['sha256'],
      'collection':
          'imaan-email-content-2026-11-14 (later 24-file IBRAH bundle)',
      'status':
          'Working edition from the content owner. Arabic, translations, Tafsir and child-safeguarding require qualified scholarly review before release.',
    },
  };
}

void main(List<String> args) {
  final dir = args.isEmpty
      ? r'C:\Users\Almas\OneDrive\Documents\ChatGPT\Almas\imaan-email-content-2026-11-14\extracted\06-IBRAH'
      : args[0];
  final invPath = args.length > 1 ? args[1] : '$dir\\..\\..\\inventory.json';
  final inventory = <String, Map<String, dynamic>>{};
  if (File(invPath).existsSync()) {
    for (final e in jsonDecode(File(invPath).readAsStringSync()) as List) {
      inventory[(e['filename'] as String).replaceAll('.docx', '')] =
          Map<String, dynamic>.from(e as Map);
    }
  }
  final warnings = <String>[];
  final index = <Map<String, dynamic>>[];
  const enc = JsonEncoder.withIndent(' ');
  for (final v in vols) {
    final lines = File('$dir\\${v.file}.txt').readAsLinesSync();
    final data = parseVolume(v, lines, inventory[v.file], warnings);
    final name = 'ibrah-${v.n.toString().padLeft(2, '0')}.json';
    File(
      'assets/data/courses/$name',
    ).writeAsStringSync('${enc.convert(data)}\n');
    index.add({
      'id': data['id'],
      'number': v.n,
      'prophet': v.prophet,
      'prophetArabic': v.prophetAr,
      'title': data['title'],
      'themes': data['themes'],
      'file': 'assets/data/courses/$name',
      'stories': (data['stories'] as List).length,
      'missions': (data['missions'] as List).length,
    });
    print(
      '${v.n}\t${v.prophet}\tstories ${(data['stories'] as List).length}\t'
      'missions ${(data['missions'] as List).length}\treview ${(data['review'] as List).length}',
    );
  }
  File('assets/data/courses/ibrah-index.json').writeAsStringSync(
    '${enc.convert({'course': 'IBRAH Junior / Qisas-ul-Nabiyeen', 'note': 'Generated by lib/courses/ibrah/tool/build_ibrah_data.dart from the extracted IBRAH texts (later 24-file bundle). Scholarly review required before release.', 'volumes': index})}\n',
  );
  for (final w in warnings) {
    print('WARN $w');
  }
}
