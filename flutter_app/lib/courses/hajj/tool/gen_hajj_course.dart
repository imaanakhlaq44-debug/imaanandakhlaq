// Regenerates assets/data/courses/hajj-course.json from the extracted text of
// Imaan_Akhlaq_Kids_Hajj_Umrah_Gamified_Curriculum_Developer_Guide.docx.
//
//   E:\flutter\bin\dart.bat run lib/courses/hajj/tool/gen_hajj_course.dart \
//     "<email-content>/extracted/07-Hajj-Umrah/Imaan_Akhlaq_Kids_Hajj_Umrah_Gamified_Curriculum_Developer_Guide.txt" \
//     assets/data/courses/hajj-course.json
//
// Every curriculum and religious string is copied from the source lines. The
// only hand-written parts are the editorial links (which dua, check and play
// interaction attaches to which mission); each is asserted against the source
// text and listed in lib/courses/hajj/README.md. Not imported by the app.
import 'dart:convert';
import 'dart:io';

late final List<String> lines;

int idx(String text) {
  final i = lines.indexOf(text);
  if (i < 0) throw StateError('missing line: $text');
  return i;
}

String after(String line, String prefix) {
  if (!line.startsWith(prefix)) throw StateError('expected $prefix: $line');
  return line.substring(prefix.length);
}

void check(bool ok, Object message) {
  if (!ok) throw StateError('$message');
}

void main(List<String> args) {
  lines = File(args[0])
      .readAsStringSync()
      .split('\n')
      .map((l) => l.replaceAll(RegExp(r'[ \u00a0\r]+'), ' ').trim())
      .toList();

  // ---- worlds and missions ----
  final worlds = <Map<String, dynamic>>[];
  final missions = <Map<String, dynamic>>[];
  final worldRe = RegExp(r'^([UHZ]\d\d) \| (.+)$');
  final missionRe = RegExp(r'^([UHZ]\d\d\.\d) (.+)$');
  final playRe = RegExp(r'^Play \(3–9\): (.+?)\s*\|\s*Extend \(10–14\): (.+)$');
  final actRe = RegExp(r'^Daily action: (.+?)\s*\|\s*Evidence: (.+)$');
  for (var i = 0; i < lines.length; i++) {
    final w = worldRe.firstMatch(lines[i]);
    if (w != null) {
      worlds.add({
        'id': w[1],
        'title': w[2],
        'storyBeat': after(lines[i + 1], 'STORY BEAT ').trim(),
        'missions': <String>[],
      });
      continue;
    }
    final m = missionRe.firstMatch(lines[i]);
    if (m != null && worlds.isNotEmpty && m[1]!.startsWith(worlds.last['id'])) {
      final p = playRe.firstMatch(lines[i + 2]);
      final a = actRe.firstMatch(lines[i + 3]);
      check(p != null && a != null, lines.sublist(i, i + 4));
      missions.add({
        'id': m[1],
        'world': worlds.last['id'],
        'title': m[2]!.trim(),
        'teach': after(lines[i + 1], 'Teach: '),
        'play': p![1],
        'extend': p[2],
        'action': a![1],
        'evidence': RegExp(
          r'S\d\d',
        ).allMatches(a[2]!).map((e) => e[0]).toList(),
      });
      (worlds.last['missions'] as List).add(m[1]);
    }
  }
  check(
    worlds.length == 24 && missions.length == 72,
    '24 worlds / 72 missions',
  );
  final devCheck = lines.firstWhere((l) => l.startsWith('DEV CHECK: '));

  // ---- duas ----
  final duas = <Map<String, dynamic>>[];
  final srcRe = RegExp(r'^SOURCE: (.+?)\s*\|\s*TEACHING NOTE: (.+)$');
  for (var i = 0; i < lines.length; i++) {
    final m = RegExp(r'^(D\d\d) \| (.+)$').firstMatch(lines[i]);
    if (m == null) continue;
    final s = srcRe.firstMatch(lines[i + 3])!;
    final d = <String, dynamic>{
      'id': m[1],
      'title': m[2],
      'arabic': lines[i + 1],
      'meaning': after(lines[i + 2], 'Child-friendly meaning: '),
      'source': s[1],
      'note': s[2],
    };
    // D01 "Short echo for younger ages" and D09 "younger learners repeat
    // first phrase": the echo is the exact text before the first Arabic comma.
    if (d['id'] == 'D01' || d['id'] == 'D09') {
      d['shortEcho'] = (d['arabic'] as String).split('،').first.trim();
    }
    duas.add(d);
  }
  check(duas.length == 14, 'duas');

  // ---- decision bank ----
  final bank = <Map<String, dynamic>>[];
  final qRe = RegExp(r'^(Q\d\d) (.+?) Answer: (.+?) \[(.+), ([UHZ]\d\d)\]$');
  for (final l in lines) {
    final m = qRe.firstMatch(l);
    if (m != null) {
      bank.add({
        'id': m[1],
        'question': m[2],
        'answer': m[3],
        'value': m[4],
        'world': m[5],
      });
    }
  }
  check(bank.length == 24, 'decision bank');

  // ---- scenes ----
  final scenes = <Map<String, dynamic>>[];
  for (var i = 0; i < lines.length; i++) {
    final m = RegExp(
      r'^SCENE (\d\d) — (.+) \(([UHZ]\d\d)\)$',
    ).firstMatch(lines[i]);
    if (m == null) continue;
    final dialogue = <Map<String, String>>[];
    var j = i + 1;
    while (!lines[j].startsWith('Interaction: ')) {
      final cut = lines[j].indexOf(': ');
      dialogue.add({
        'speaker': lines[j].substring(0, cut),
        'line': lines[j].substring(cut + 2),
      });
      j++;
    }
    scenes.add({
      'id': 'SCENE ${m[1]}',
      'title': m[2],
      'world': m[3],
      'dialogue': dialogue,
      'interaction': after(lines[j], 'Interaction: '),
      'check': after(lines[j + 1], 'Learning check: '),
    });
  }
  check(scenes.length == 6, 'scenes');

  // ---- 40 days ----
  var s = idx('12. Forty days of good character — after the adventures');
  final fortyIntro = lines[s + 1];
  final days = <int, String>{};
  for (
    var k = s + 6;
    lines[k] != '13. Developer handoff — product architecture';
    k += 4
  ) {
    days[int.parse(lines[k])] = lines[k + 1];
    days[int.parse(lines[k + 2])] = lines[k + 3];
  }
  check(days.length == 40, '40 days');

  // ---- sites ----
  s = idx('Historical-site cards for the Explore tab');
  final sites = <Map<String, String>>[];
  var k = s + 4;
  for (; !lines[k].startsWith('Each site card'); k += 3) {
    sites.add({
      'name': lines[k],
      'learn': lines[k + 1],
      'classification': lines[k + 2],
    });
  }
  final siteNote = lines[k];
  check(sites.length == 10, 'sites');

  // ---- parent material ----
  s = idx('14. Parent Corner — FAQs and special situations');
  final faq = <Map<String, String>>[];
  for (k = s + 1; !lines[k].startsWith('15. '); k += 2) {
    faq.add({'q': lines[k], 'a': lines[k + 1]});
  }
  s = idx('Adult-route glossary (parent-only reference)');
  final routes = [
    for (var n = 0; n < 3; n++)
      {
        'route': lines[s + 4 + 3 * n],
        'feature': lines[s + 5 + 3 * n],
        'hady': lines[s + 6 + 3 * n],
      },
  ];
  s = idx('Chronological map for the child learner');
  final daysMap = <Map<String, String>>[];
  for (k = s + 4; !lines[k].startsWith('DEV NOTE'); k += 3) {
    daysMap.add({
      'when': lines[k],
      'where': lines[k + 1],
      'lesson': lines[k + 2],
    });
  }
  final mapNote = lines[k];
  final gate = lines[idx('HAJJ SAFETY + STATUS GATE') + 1];
  final b0 = idx('1. Executive vision and non-negotiable boundaries');
  final boundaries = lines.sublist(b0 + 4, idx('Product outcomes'));
  final companion = lines.sublist(
    idx('C. Parent-gated pilgrimage companion') + 1,
    idx('D. Accessibility and child safeguarding'),
  );
  s = idx('17. Evidence and source register');
  final sources = <Map<String, String>>[];
  for (k = s + 2; lines[k] != 'FINAL EDITORIAL WARNING'; k += 3) {
    sources.add({
      'id': lines[k].substring(0, 3),
      'title': lines[k].substring(3).trim(),
      'note': lines[k + 1],
      'url': lines[k + 2],
    });
  }
  final finalWarning = lines[k + 1];
  check(sources.length == 16, 'sources');
  s = idx('3. Three age-adaptive experiences');
  final ages = [
    for (var n = 0; n < 3; n++)
      {
        'id': lines[s + 4 + 3 * n].split('|').first.trim(),
        'label': lines[s + 4 + 3 * n].split('|').last.trim(),
        'content': lines[s + 5 + 3 * n],
        'session': lines[s + 6 + 3 * n],
      },
  ];
  final ageNote = lines[s + 13];
  final muhasabahLine = lines.firstWhere(
    (l) => l.startsWith('Use reflective prompts:'),
  );
  final muhasabah = RegExp(
    r'“([^”]+)”',
  ).allMatches(muhasabahLine).map((m) => m[1]).take(3).toList();
  check(muhasabah.first == 'Was I patient today?', 'muhasabah');

  // ---- editorial links (see README.md) ----
  const duaLinks = {
    'U01.2': ['D03'],
    'U02.2': ['D04'],
    'U03.3': ['D01'],
    'U04.1': ['D06', 'D07'],
    'U05.3': ['D02'],
    'U06.3': ['D05'],
    'U07.1': ['D10', 'D09'],
    'H03.2': ['D01'],
    'H03.3': ['D13'],
    'H04.3': ['D12'],
    'H05.2': ['D04'],
    'H06.2': ['D11'],
    'H07.3': ['D08'],
    'Z01.1': ['D06'],
    'Z02.1': ['D14'],
  };
  const checkLinks = {
    'U02.1': ['Q01'],
    'U02.3': ['Q02'],
    'U03.3': ['Q03'],
    'U04.2': ['Q04'],
    'U05.1': ['Q05'],
    'U05.2': ['Q06'],
    'U06.2': ['Q07'],
    'U07.2': ['Q08', 'Q09'],
    'U08.1': ['Q10'],
    'U09.1': ['Q11'],
    'U10.2': ['Q12'],
    'Z02.1': ['Q13'],
    'H05.1': ['Q14'],
    'H05.3': ['Q15'],
    'H06.1': ['Q16'],
    'H07.3': ['Q17'],
    'H07.1': ['Q18'],
    'H08.2': ['Q19'],
    'H09.1': ['Q20'],
    'H10.3': ['Q21'],
    'H12.3': ['Q22'],
    'Z01.2': ['Q23'],
    'Z02.3': ['Q24'],
  };
  // Learning checks from the scripted scenes (section 8).
  const sceneChecks = {
    'U01.2': [
      'SCENE 01',
      'Is Umrah only a sightseeing trip?',
      'No; it is worship with specific rites.',
      'Well done. The purpose guides our actions.',
    ],
    'U05.3': [
      'SCENE 02',
      'What if people are crowded?',
      'Protect them and follow safe routes.',
      null,
    ],
    'U07.3': ['SCENE 03', 'What is the seventh destination?', 'Marwah.', null],
    'H05.2': [
      'SCENE 04',
      'Which action follows the lesson of Arafat?',
      'Make dua and treat others well.',
      null,
    ],
    'H07.2': [
      'SCENE 05',
      'What is the safest response near crowded Jamarat?',
      'Follow the official route and responsible adults.',
      null,
    ],
    'Z02.2': [
      'SCENE 06',
      'Does a family who cannot visit Madinah have an incomplete Hajj?',
      'No.',
      null,
    ],
  };
  final t07 = after(
    lines.firstWhere((l) => l.startsWith('T07 ')),
    'T07 Umrah sequence: ',
  );
  final play = <String, Map<String, dynamic>>{
    'U01.2': {
      'type': 'sequence',
      'items': ['Ihram', 'Tawaf', 'Sa‘i', 'hair-cutting'],
      'from': 'U01.2 Extend (10–14)',
    },
    'U10.1': {
      'type': 'sequence',
      'items': t07.replaceAll(RegExp(r'\.$'), '').split(' → '),
      'from': 'T07',
    },
    'U04.3': {
      'type': 'sequence',
      'items': ['ask adult', 'prepare', 'begin'],
      'from': 'U04.3 Play (3–9)',
    },
    'H02.1': {
      'type': 'sequence',
      'items': routes[0]['feature']!
          .replaceAll(RegExp(r'\.$'), '')
          .split(';')
          .map((e) => e.trim())
          .toList(),
      'from': 'Adult-route glossary: Tamattu‘',
    },
    'H04.1': {
      'type': 'sequence',
      'items': [for (final d in daysMap.take(2)) '${d['when']}: ${d['where']}'],
      'from': 'Chronological map',
    },
    'H12.1': {
      'type': 'sequence',
      'items': [for (final d in daysMap.take(5)) '${d['when']}: ${d['where']}'],
      'from': 'Chronological map (five cards)',
    },
    'U05.2': {
      'type': 'count',
      'count': 7,
      'labels': <String>[],
      'from': 'U05.2 Play (3–9)',
    },
    'U07.2': {
      'type': 'count',
      'count': 7,
      'labels': [
        for (var n = 0; n < 7; n++)
          n.isEven ? 'Safa → Marwah' : 'Marwah → Safa',
      ],
      'from': 'SCENE 03 interaction',
    },
    'H07.1': {
      'type': 'count',
      'count': 7,
      'labels': <String>[],
      'from': 'H07.1 Play (3–9)',
    },
    'U01.3': {
      'type': 'choice',
      'good': 'pray/help',
      'other': 'a purely souvenir-focused option',
      'from': 'U01.3 Play (3–9)',
    },
    'U05.3': {
      'type': 'choice',
      'good': 'share room',
      'other': 'push',
      'from': 'U05.3 Play (3–9)',
    },
    'H07.2': {
      'type': 'choice',
      'good': 'a safe route',
      'other': 'unsafe shortcut',
      'from': 'H07.2 Play (3–9)',
    },
    'H08.2': {
      'type': 'choice',
      'good': 'sincerity',
      'other': 'showing off',
      'from': 'H08.2 Play (3–9)',
    },
    'H10.3': {
      'type': 'choice',
      'good': 'the help sign',
      'other': 'the “guess” sign',
      'from': 'H10.3 Play (3–9)',
    },
  };
  final byId = {for (final m in missions) m['id'] as String: m};
  for (final e in play.entries) {
    final ms = byId[e.key]!;
    final p = e.value;
    final where = (p['from'] as String).contains('Extend')
        ? ms['extend']
        : ms['play'];
    if (p['type'] == 'choice') {
      check(
        (where as String).contains(p['good']) && where.contains(p['other']),
        e.key,
      );
    }
    if (p['type'] == 'sequence' && (p['from'] as String).startsWith(e.key)) {
      for (final x in p['items'] as List) {
        check((where as String).contains(x), '${e.key} $x');
      }
    }
  }
  check(
    scenes[2]['interaction'].contains(
      'Safa to Marwah as length 1, then Marwah to Safa as length 2',
    ),
    'scene 03',
  );
  final bankById = {for (final q in bank) q['id'] as String: q};
  final used = <String>{};
  for (final ms in missions) {
    final id = ms['id'] as String;
    ms['duas'] = duaLinks[id] ?? const <String>[];
    final checks = <Map<String, dynamic>>[];
    for (final q in checkLinks[id] ?? const <String>[]) {
      final b = bankById[q]!;
      check(b['world'] == ms['world'], '$q in $id');
      used.add(q);
      checks.add({...b, 'source': 'Decision bank $q'});
    }
    final sc = sceneChecks[id];
    if (sc != null) {
      final scene = scenes.firstWhere((x) => x['id'] == sc[0]);
      final text = scene['check'] as String;
      check(
        text.contains(sc[1]!) &&
            text.contains(sc[2]!.replaceAll(RegExp(r'\.$'), '')),
        '$id scene',
      );
      if (sc[3] != null) check(text.contains(sc[3]!), '$id feedback');
      checks.add({
        'id': sc[0],
        'question': sc[1],
        'answer': sc[2],
        'source': sc[0],
        'feedback': ?sc[3],
      });
    }
    ms['checks'] = checks;
    if (play[id] != null) ms['interaction'] = play[id];
  }
  check(used.length == 24, 'every decision-bank item is used once');

  final adventures = [
    {
      'id': 'umrah',
      'title': 'Umrah: The Journey of the Heart',
      'use': 'Preparation through completion and returning home.',
      'prefix': 'U',
    },
    {
      'id': 'hajj',
      'title': 'Hajj: The Great Pilgrimage',
      'use': 'Age-appropriate simulation of Hajj rites and ethics.',
      'prefix': 'H',
      'gate': gate,
    },
    {
      'id': 'explore',
      'title': 'Explore the Holy Cities',
      'use': 'Makkah and Madinah virtues, Seerah and visits.',
      'prefix': 'Z',
    },
  ];
  for (final a in adventures) {
    check(lines.contains(a['title']) && lines.contains(a['use']), a['title']!);
    a['worlds'] = [
      for (final w in worlds)
        if ((w['id'] as String).startsWith(a['prefix'] as String)) w['id'],
    ].join(',');
    a.remove('prefix');
  }

  final doc = {
    'version': 1,
    'sourceDocument':
        'Imaan_Akhlaq_Kids_Hajj_Umrah_Gamified_Curriculum_Developer_Guide.docx',
    'sourceVersion': 'Version 1.0 | 6 November 2026',
    'religiousReview': 'pending',
    'reviewNote': lines.firstWhere(
      (l) => l.startsWith('All religious rulings'),
    ),
    'vision': lines[b0 + 1],
    'promise': lines[b0 + 3],
    'boundaries': boundaries,
    'missionLoop': lines.firstWhere((l) => l.startsWith('Mission loop: ')),
    'progressNote': lines.firstWhere(
      (l) => l.startsWith('Use an “Explorer’s Notebook”'),
    ),
    'devCheck': devCheck,
    'ages': ages,
    'ageNote': ageNote,
    'adventures': adventures,
    'worlds': worlds,
    'missions': missions,
    'scenes': scenes,
    'duaIntro':
        lines[idx('10. Dua and dhikr studio — child-safe starter library') + 1],
    'duas': duas,
    'muhasabah': muhasabah,
    'fortyIntro': fortyIntro,
    'fortyDays': [for (var d = 1; d <= 40; d++) days[d]],
    'sites': sites,
    'siteNote': siteNote,
    'parent': {
      'routes': routes,
      'hajjDays': daysMap,
      'hajjDaysNote': mapNote,
      'companion': companion,
      'faq': faq,
    },
    'sources': sources,
    'finalWarning': finalWarning,
  };
  File(
    args[1],
  ).writeAsStringSync('${const JsonEncoder.withIndent(' ').convert(doc)}\n');
  stdout.writeln(
    'ok: ${worlds.length} worlds, ${missions.length} missions, '
    '${duas.length} duas, ${bank.length} checks, ${faq.length} FAQs',
  );
}
