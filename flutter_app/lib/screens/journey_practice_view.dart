import 'package:flutter/material.dart';

import '../data/journey_lessons.dart';
import '../l10n/language.dart';

class JourneyPracticeView extends StatefulWidget {
  const JourneyPracticeView({
    super.key,
    required this.practice,
    required this.onComplete,
  });

  final JourneyPractice practice;
  final VoidCallback onComplete;

  @override
  State<JourneyPracticeView> createState() => _JourneyPracticeViewState();
}

class _JourneyPracticeViewState extends State<JourneyPracticeView> {
  final _order = <int>[];
  final _explored = <int>{};
  int? _choice;

  @override
  Widget build(BuildContext context) {
    final practice = widget.practice;
    final comparing = practice.explanations.isNotEmpty;
    final finished = practice.inOrder
        ? _order.length == practice.items.length
        : _choice != null;
    final correct = comparing
        ? _explored.length >= 2
        : practice.inOrder
        ? finished &&
              _order.indexed.every(
                (item) => practice.items[item.$1] == practice.items[item.$2],
              )
        : _choice == practice.correct;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(practice.prompt, style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        if (comparing)
          for (final (index, value) in practice.items.indexed)
            ExpansionTile(
              title: Text(value),
              children: [
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Text(
                    practice.explanations[index].isEmpty
                        ? tr(
                            'What could happen next?',
                            'اس کے بعد کیا ہو سکتا ہے؟',
                          )
                        : practice.explanations[index],
                  ),
                ),
              ],
              onExpansionChanged: (opened) {
                if (opened) setState(() => _explored.add(index));
              },
            )
        else if (practice.recall && !finished)
          OutlinedButton(
            onPressed: () => setState(() => _choice = practice.correct),
            child: Text(tr('Check my recall', 'اپنی یادداشت جانچیں')),
          )
        else if (practice.inOrder) ...[
          for (final (position, index) in _order.indexed)
            ListTile(
              leading: CircleAvatar(child: Text('${position + 1}')),
              title: Text(practice.items[index]),
            ),
          for (var index = practice.items.length - 1; index >= 0; index--)
            if (!_order.contains(index))
              OutlinedButton(
                onPressed: () => setState(() => _order.add(index)),
                child: Text(practice.items[index], textAlign: TextAlign.center),
              ),
          if (_order.isNotEmpty)
            TextButton(
              onPressed: () => setState(_order.clear),
              child: Text(tr('Start this order again', 'ترتیب دوبارہ بنائیں')),
            ),
        ] else if (!practice.recall)
          for (final (index, value) in practice.items.indexed)
            OutlinedButton(
              onPressed: () => setState(() => _choice = index),
              child: Text(value, textAlign: TextAlign.center),
            ),
        if (finished && !comparing)
          Semantics(
            liveRegion: true,
            child: Text(
              practice.recall
                  ? practice.items.single
                  : correct
                  ? tr('That matches the lesson.', 'یہ سبق سے ملتا ہے۔')
                  : tr(
                      'Try again with what you learned.',
                      'سبق کو ذہن میں رکھ کر دوبارہ کوشش کریں۔',
                    ),
            ),
          ),
        if (correct)
          FilledButton(
            onPressed: widget.onComplete,
            child: Text(tr('Continue', 'آگے بڑھیں')),
          ),
      ],
    );
  }
}
