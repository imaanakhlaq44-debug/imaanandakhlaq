import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../app_theme.dart';
import '../l10n/language.dart';
import '../screens/ui_kit.dart';
import 'entitlement.dart';

/// Shows [child] when it is free or the Individual subscription is active;
/// otherwise the paywall takes its place. Wrap each course's lesson,
/// mission or story screen with it where the screen is pushed.
class PaidGate extends StatelessWidget {
  const PaidGate({super.key, required this.free, required this.child});

  /// The free taste of a course (its first lesson).
  final bool free;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    if (free) return child;
    final e = Entitlement.instance;
    e.start();
    return ListenableBuilder(
      listenable: e,
      builder: (context, _) => e.active
          ? child
          : e.ready
          ? const PaywallScreen()
          : const Scaffold(body: Center(child: CircularProgressIndicator())),
    );
  }
}

/// "Unlock every journey": what the subscription gives, the plans from
/// Google Play, a grown-up check before buying, and Restore.
class PaywallScreen extends StatefulWidget {
  const PaywallScreen({super.key});
  @override
  State<PaywallScreen> createState() => _PaywallScreenState();
}

class _PaywallScreenState extends State<PaywallScreen> {
  String? _picked;

  Future<void> _buy(PlanOffer plan) async {
    if (!await askAGrownUp(context) || !mounted) return;
    await Entitlement.instance.buy(plan);
  }

  @override
  Widget build(BuildContext context) => Directionality(
    textDirection: AppLanguage.instance.direction,
    child: ListenableBuilder(
      listenable: Entitlement.instance,
      builder: (context, _) {
        final e = Entitlement.instance;
        final offers = e.offers;
        final picked =
            offers.where((o) => o.id == _picked).firstOrNull ??
            offers.where((o) => o.yearly).firstOrNull ??
            offers.firstOrNull;
        return Scaffold(
          key: const Key('paywall'),
          backgroundColor: canvas,
          body: SafeArea(
            top: false,
            child: Column(
              children: [
                Expanded(
                  child: ListView(
                    padding: EdgeInsets.zero,
                    children: [
                      const _Header(),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            for (final (icon, color, en, ur) in _benefits)
                              _Benefit(
                                icon: icon,
                                color: color,
                                text: tr(en, ur),
                              ),
                            const SizedBox(height: 14),
                            if (!e.storeAvailable)
                              _Notice(
                                tr(
                                  'Subscriptions are bought in the Android app from Google Play.',
                                  'سبسکرپشن اینڈرائیڈ ایپ میں گوگل پلے سے خریدی جاتی ہے۔',
                                ),
                              )
                            else if (offers.isEmpty)
                              _Notice(
                                tr(
                                  'Loading plans from Google Play…',
                                  'گوگل پلے سے پلان لوڈ ہو رہے ہیں…',
                                ),
                              )
                            else
                              for (final o in offers)
                                _PlanCard(
                                  offer: o,
                                  selected: o.id == picked?.id,
                                  onTap: () => setState(() => _picked = o.id),
                                ),
                            if (e.error != null) ...[
                              const SizedBox(height: 8),
                              Text(
                                tr(
                                  'The purchase did not finish. Please try again.',
                                  'خریداری مکمل نہیں ہوئی۔ دوبارہ کوشش کریں۔',
                                ),
                                style: const TextStyle(color: dangerInk),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      FilledButton(
                        key: const Key('paywall-buy'),
                        style: FilledButton.styleFrom(
                          minimumSize: const Size.fromHeight(54),
                          backgroundColor: brandPink,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        onPressed: picked == null || e.busy
                            ? null
                            : () => _buy(picked),
                        child: e.busy
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.5,
                                  color: Colors.white,
                                ),
                              )
                            : Text(
                                tr('Unlock everything', 'سب کچھ کھولیں'),
                                style: const TextStyle(
                                  fontSize: 16.5,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                      ),
                      TextButton(
                        key: const Key('paywall-restore'),
                        onPressed: e.busy || !e.storeAvailable
                            ? null
                            : e.restore,
                        child: Text(
                          tr('Restore my purchase', 'پچھلی خریداری بحال کریں'),
                        ),
                      ),
                      Text(
                        tr(
                          'Renews automatically until cancelled in Google Play. A grown-up must approve every purchase.',
                          'گوگل پلے میں منسوخ کرنے تک خود بخود جاری رہتی ہے۔ ہر خریداری کسی بڑے کی اجازت سے ہوتی ہے۔',
                        ),
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: mutedInk,
                          fontSize: 11.5,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    ),
  );
}

const _benefits = [
  (
    Icons.auto_stories_rounded,
    brandPink,
    'All 8 learning journeys: Qur’an, Hadith, Duas, Salah, Tafsir, Prophet Stories, Hajj and Taleem',
    'آٹھوں سفر: قرآن، حدیث، دعائیں، نماز، تفسیر، قصص الانبیاء، حج اور تعلیم الاسلام',
  ),
  (
    Icons.star_rounded,
    Color(0xFFE5A21E),
    'Stars, badges and daily streaks for every lesson',
    'ہر سبق پر ستارے، بیج اور روزانہ کا سلسلہ',
  ),
  (
    Icons.record_voice_over_rounded,
    Color(0xFF7B4FD6),
    'Cheerful voices in Urdu and English',
    'اردو اور انگریزی میں خوشگوار آوازیں',
  ),
  (
    Icons.family_restroom_rounded,
    successInk,
    'Safe for children: no ads, no chat, no leaderboards',
    'بچوں کے لیے محفوظ: نہ اشتہار، نہ چیٹ، نہ مقابلے کی فہرست',
  ),
];

class _Header extends StatelessWidget {
  const _Header();
  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.paddingOf(context).top;
    return Container(
      padding: EdgeInsets.fromLTRB(20, top + 8, 20, 26),
      decoration: const BoxDecoration(
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(30)),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            brandNavy,
            Color(0xFF3B3485),
            Color(0xFF7A3E8E),
            Color(0xFFC4507E),
          ],
          stops: [0, .42, .75, 1],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(
                key: const Key('paywall-close'),
                onPressed: () => Navigator.of(context).maybePop(),
                icon: const BackButtonIcon(),
                color: Colors.white,
              ),
              const Spacer(),
              const Icon(
                Icons.nightlight_round,
                color: Color(0xFFFFE7A8),
                size: 24,
              ),
            ],
          ),
          const SizedBox(height: 6),
          Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                colors: [Color(0xFFFFD873), Color(0xFFE59A1E)],
              ),
              border: Border.all(color: Colors.white, width: 3),
            ),
            child: const Icon(
              Icons.lock_open_rounded,
              color: Colors.white,
              size: 30,
            ),
          ),
          const SizedBox(height: 14),
          Text(
            tr('Unlock every journey', 'ہر سفر کھولیں'),
            style: displayStyle(27, color: Colors.white),
          ),
          const SizedBox(height: 6),
          Text(
            tr(
              'You tried the first lesson. Keep learning with all lessons, stories and missions.',
              'آپ نے پہلا سبق آزما لیا۔ اب سارے اسباق، کہانیاں اور مشن کے ساتھ سیکھتے رہیں۔',
            ),
            style: TextStyle(
              color: Colors.white.withValues(alpha: .85),
              height: 1.45,
            ),
          ),
        ],
      ),
    );
  }
}

class _Benefit extends StatelessWidget {
  const _Benefit({required this.icon, required this.color, required this.text});
  final IconData icon;
  final Color color;
  final String text;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: color.withValues(alpha: .12),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 7),
            child: Text(
              text,
              style: const TextStyle(
                color: ink,
                fontWeight: FontWeight.w600,
                height: 1.4,
              ),
            ),
          ),
        ),
      ],
    ),
  );
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({
    required this.offer,
    required this.selected,
    required this.onTap,
  });
  final PlanOffer offer;
  final bool selected;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: Material(
      color: selected ? const Color(0xFFFDEAF2) : Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(
          color: selected ? brandPink : lineColor,
          width: selected ? 2 : 1,
        ),
      ),
      child: InkWell(
        key: Key('plan-${offer.id}'),
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Icon(
                selected
                    ? Icons.radio_button_checked_rounded
                    : Icons.radio_button_off_rounded,
                color: selected ? brandPink : mutedInk,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      offer.yearly
                          ? tr('Yearly', 'سالانہ')
                          : tr('Monthly', 'ماہانہ'),
                      style: displayStyle(18),
                    ),
                    if (offer.yearly)
                      Text(
                        tr(
                          'Best value for the whole year',
                          'پورے سال کے لیے بہترین',
                        ),
                        style: const TextStyle(color: mutedInk, fontSize: 12.5),
                      ),
                  ],
                ),
              ),
              Text(offer.price, style: displayStyle(18, color: brandPink)),
            ],
          ),
        ),
      ),
    ),
  );
}

class _Notice extends StatelessWidget {
  const _Notice(this.text);
  final String text;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: const Color(0xFFFFF6E6),
      borderRadius: BorderRadius.circular(16),
    ),
    child: Text(
      text,
      key: const Key('paywall-notice'),
      style: const TextStyle(color: brandNavy, height: 1.4),
    ),
  );
}

/// A simple grown-up check before any purchase (Families policy): a
/// multiplication a young child is unlikely to answer. Returns true when
/// the answer is right.
Future<bool> askAGrownUp(BuildContext context, {math.Random? random}) async {
  final r = random ?? math.Random();
  final ok = await showDialog<bool>(
    context: context,
    builder: (context) => _ParentGate(a: 6 + r.nextInt(4), b: 6 + r.nextInt(4)),
  );
  return ok ?? false;
}

class _ParentGate extends StatefulWidget {
  const _ParentGate({required this.a, required this.b});
  final int a, b;
  @override
  State<_ParentGate> createState() => _ParentGateState();
}

class _ParentGateState extends State<_ParentGate> {
  final _answer = TextEditingController();

  @override
  void dispose() {
    _answer.dispose();
    super.dispose();
  }

  void _submit() => Navigator.of(
    context,
  ).pop(int.tryParse(_answer.text.trim()) == widget.a * widget.b);

  @override
  Widget build(BuildContext context) => Directionality(
    textDirection: AppLanguage.instance.direction,
    child: AlertDialog(
      key: const Key('parent-gate'),
      title: Text(tr('Ask a grown-up', 'کسی بڑے سے پوچھیں')),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            tr(
              'To continue, a parent or teacher please answer:',
              'آگے بڑھنے کے لیے والدین یا استاد یہ جواب دیں:',
            ),
          ),
          const SizedBox(height: 12),
          Text(
            '${widget.a} × ${widget.b} = ?',
            key: const Key('parent-gate-question'),
            textDirection: TextDirection.ltr,
            style: displayStyle(26),
          ),
          const SizedBox(height: 8),
          TextField(
            key: const Key('parent-gate-answer'),
            controller: _answer,
            keyboardType: TextInputType.number,
            autofocus: true,
            textDirection: TextDirection.ltr,
            decoration: InputDecoration(hintText: tr('Answer', 'جواب')),
            onSubmitted: (_) => _submit(),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: Text(tr('Cancel', 'منسوخ')),
        ),
        FilledButton(
          key: const Key('parent-gate-ok'),
          onPressed: _submit,
          child: Text(tr('Continue', 'جاری رکھیں')),
        ),
      ],
    ),
  );
}
