import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../app_theme.dart';
import '../audio/voice.dart';
import '../billing/entitlement.dart';
import '../billing/paywall.dart';
import '../domain.dart';
import '../l10n/language.dart';
import '../rewards/reward_widgets.dart';
import 'entry_screens.dart' show brandCream;
import 'info_pages.dart';

/// Links the side menu opens. Contact details are the app's own Play
/// listing contacts.
class MenuLinks {
  /// The old app's "Contact Us" WhatsApp (About and FAQ pages).
  static const whatsapp = 'https://wa.me/923335756028';
  static const email = 'mailto:contact@imaanakhlaq.org';
  static const store =
      'https://play.google.com/store/apps/details?id=com.imaanakhlaq';
  static const subscriptions =
      'https://play.google.com/store/account/subscriptions'
      '?package=com.imaanakhlaq';
  static const about = 'https://www.imaanakhlaq.org';
  static const privacy = 'https://www.imaanakhlaq.org/privacy';
  static const terms = 'https://www.imaanakhlaq.org/terms';
}

/// The Individual side menu, opened from the ☰ button on the home page.
/// Everything a learner looks for in one place: their profile and plan,
/// rewards, language and sound, help, sharing and signing out.
///
/// Without a [learner] (a guest) the profile card offers Sign in and
/// Create account instead, and account-only items are hidden.
class LearnerMenu extends StatelessWidget {
  const LearnerMenu({
    super.key,
    this.learner,
    this.onProgress,
    this.onSignOut,
    this.onSignIn,
    this.onCreateAccount,
    this.onChooseSection,
    this.openLink,
    this.share,
  });
  final Profile? learner;
  final VoidCallback? onProgress, onSignOut, onSignIn, onCreateAccount;
  final VoidCallback? onChooseSection;

  /// Opens a link; tests replace it.
  final Future<void> Function(String url)? openLink;

  /// Shares text; tests replace it.
  final Future<void> Function(String text)? share;

  Future<void> _open(BuildContext context, String url) async {
    Navigator.of(context).pop();
    try {
      if (openLink != null) {
        await openLink!(url);
      } else if (!await launchUrl(
        Uri.parse(url),
        mode: LaunchMode.externalApplication,
      )) {
        throw StateError('not opened');
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(tr('Could not open the link.', 'لنک نہیں کھل سکا۔')),
          ),
        );
      }
    }
  }

  void _then(BuildContext context, VoidCallback action) {
    Navigator.of(context).pop();
    action();
  }

  /// Opens [url] from a page the menu pushed (the menu is closed by then).
  Future<void> _launch(String url) async {
    try {
      if (openLink != null) {
        await openLink!(url);
      } else {
        await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
      }
    } catch (_) {}
  }

  void _push(BuildContext context, Widget page) {
    final navigator = Navigator.of(context);
    navigator.pop();
    navigator.push(MaterialPageRoute<void>(builder: (_) => page));
  }

  @override
  Widget build(BuildContext context) {
    Entitlement.instance.start(); // once; shows the real plan status
    final listen = Listenable.merge([
      AppLanguage.instance,
      VoiceGuide.instance,
      Entitlement.instance,
    ]);
    return Drawer(
      key: const Key('learner-menu'),
      backgroundColor: brandCream,
      width: (MediaQuery.sizeOf(context).width * .84).clamp(260, 340),
      child: ListenableBuilder(
        listenable: listen,
        builder: (context, _) => ListView(
          padding: EdgeInsets.zero,
          children: [
            if (learner == null)
              _GuestCard(
                onSignIn: () => _then(context, onSignIn ?? () {}),
                onCreateAccount: () => _then(context, onCreateAccount ?? () {}),
              )
            else ...[
              _ProfileCard(
                learner: learner!,
                member: Entitlement.instance.active,
                onPlan: () => _push(context, const PaywallScreen()),
              ),
              _Section(tr('My learning', 'میری پڑھائی')),
              if (onProgress != null)
                _Item(
                  key: const Key('menu-progress'),
                  icon: Icons.emoji_events_outlined,
                  label: tr('My progress', 'میری پیش رفت'),
                  onTap: () => _then(context, onProgress!),
                ),
              _Item(
                key: const Key('menu-badges'),
                icon: Icons.military_tech_outlined,
                label: tr('My badges', 'میرے بیج'),
                onTap: () {
                  Navigator.of(context).pop();
                  showBadgesSheet(context);
                },
              ),
            ],
            _Section(tr('Settings', 'ترتیبات')),
            _SwitchItem(
              key: const Key('menu-urdu'),
              icon: Icons.translate_rounded,
              label: tr('Urdu · اردو', 'اردو'),
              value: AppLanguage.instance.urdu,
              onChanged: (v) => AppLanguage.instance.setUrdu(v),
            ),
            _SwitchItem(
              key: const Key('menu-sound'),
              icon: Icons.volume_up_outlined,
              label: tr('Voice and sounds', 'آواز'),
              value: VoiceGuide.instance.on,
              onChanged: (_) => VoiceGuide.instance.toggle(),
            ),
            if (learner != null && Entitlement.instance.active)
              _Item(
                key: const Key('menu-manage-plan'),
                icon: Icons.credit_card_outlined,
                label: tr('Manage subscription', 'سبسکرپشن کا انتظام'),
                onTap: () => _open(context, MenuLinks.subscriptions),
              ),
            _Section(tr('Help', 'مدد')),
            _Item(
              key: const Key('menu-faq'),
              icon: Icons.help_outline_rounded,
              label: tr('FAQ', 'سوال و جواب'),
              onTap: () => _push(
                context,
                FaqScreen(onContact: () => _launch(MenuLinks.whatsapp)),
              ),
            ),
            _Item(
              key: const Key('menu-whatsapp'),
              icon: Icons.chat_outlined,
              label: tr('WhatsApp support', 'واٹس ایپ سپورٹ'),
              onTap: () => _open(context, MenuLinks.whatsapp),
            ),
            _Item(
              key: const Key('menu-feedback'),
              icon: Icons.rate_review_outlined,
              label: tr('Feedback by email', 'ای میل پر رائے'),
              onTap: () => _open(context, MenuLinks.email),
            ),
            _Item(
              key: const Key('menu-about'),
              icon: Icons.info_outline_rounded,
              label: tr('About us', 'ہمارے بارے میں'),
              onTap: () => _push(
                context,
                AboutScreen(onContact: () => _launch(MenuLinks.whatsapp)),
              ),
            ),
            _Section(tr('Share', 'شیئر')),
            _Item(
              key: const Key('menu-share'),
              icon: Icons.share_outlined,
              label: tr('Share the app', 'ایپ شیئر کریں'),
              onTap: () async {
                Navigator.of(context).pop();
                final text = tr(
                  'Learn Imaan and Akhlaq with stories, Qur\'an and duas: '
                      '${MenuLinks.store}',
                  'کہانیوں، قرآن اور دعاؤں کے ساتھ ایمان اور اخلاق سیکھیں: '
                      '${MenuLinks.store}',
                );
                try {
                  if (share != null) {
                    await share!(text);
                  } else {
                    await SharePlus.instance.share(ShareParams(text: text));
                  }
                } catch (_) {}
              },
            ),
            _Item(
              key: const Key('menu-rate'),
              icon: Icons.star_outline_rounded,
              label: tr('Rate us on Google Play', 'گوگل پلے پر ریٹ کریں'),
              onTap: () => _open(context, MenuLinks.store),
            ),
            _Section(tr('Account', 'اکاؤنٹ')),
            _Item(
              key: const Key('menu-privacy'),
              icon: Icons.privacy_tip_outlined,
              label: tr('Privacy policy', 'پرائیویسی پالیسی'),
              onTap: () => _open(context, MenuLinks.privacy),
            ),
            _Item(
              key: const Key('menu-terms'),
              icon: Icons.description_outlined,
              label: tr('Terms of use', 'شرائط'),
              onTap: () => _open(context, MenuLinks.terms),
            ),
            if (onChooseSection != null)
              _Item(
                key: const Key('menu-section'),
                icon: Icons.swap_horiz_rounded,
                label: tr('Individual or School', 'انفرادی یا اسکول'),
                onTap: () => _then(context, onChooseSection!),
              ),
            if (onSignOut != null)
              _Item(
                key: const Key('menu-sign-out'),
                icon: Icons.logout_rounded,
                label: tr('Sign out', 'سائن آؤٹ'),
                color: const Color(0xFFB4435C),
                onTap: () => _then(context, onSignOut!),
              ),
            const _Version(),
          ],
        ),
      ),
    );
  }
}

class _ProfileCard extends StatelessWidget {
  const _ProfileCard({
    required this.learner,
    required this.member,
    required this.onPlan,
  });
  final Profile learner;
  final bool member;
  final VoidCallback onPlan;
  @override
  Widget build(BuildContext context) {
    final initial = learner.name.trim().isEmpty
        ? '?'
        : learner.name.trim().characters.first.toUpperCase();
    return Container(
      margin: EdgeInsets.fromLTRB(
        12,
        12 + MediaQuery.paddingOf(context).top,
        12,
        6,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFEDE4DE)),
        boxShadow: [
          BoxShadow(
            color: brandNavy.withValues(alpha: .06),
            blurRadius: 18,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: const Color(0xFFFCE2EE),
                  child: Text(
                    initial,
                    style: const TextStyle(
                      color: brandPink,
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        learner.name,
                        key: const Key('menu-name'),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: brandNavy,
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      if (learner.email.isNotEmpty)
                        Text(
                          learner.email,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Color(0xFF6B7488),
                            fontSize: 13,
                          ),
                        ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: brandNavy.withValues(alpha: .07),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          tr('Individual', 'انفرادی'),
                          style: const TextStyle(
                            color: brandNavy,
                            fontSize: 11.5,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFFF1E8E2)),
          Material(
            color: Colors.transparent,
            child: InkWell(
              key: const Key('menu-plan'),
              onTap: onPlan,
              borderRadius: const BorderRadius.vertical(
                bottom: Radius.circular(22),
              ),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(14, 12, 10, 12),
                child: Row(
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: (member ? const Color(0xFF2E9E6B) : brandOrange)
                            .withValues(alpha: .13),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        member
                            ? Icons.verified_rounded
                            : Icons.lock_open_rounded,
                        size: 20,
                        color: member
                            ? const Color(0xFF2E9E6B)
                            : const Color(0xFFD9822B),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            tr('Subscription', 'سبسکرپشن'),
                            style: const TextStyle(
                              color: Color(0xFF6B7488),
                              fontSize: 12,
                            ),
                          ),
                          Text(
                            member
                                ? tr(
                                    'Member · all journeys open',
                                    'ممبر · سب سفر کھلے ہیں',
                                  )
                                : tr(
                                    'Free plan · unlock all journeys',
                                    'مفت · سب سفر کھولیں',
                                  ),
                            key: const Key('menu-plan-status'),
                            style: const TextStyle(
                              color: brandNavy,
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(
                      Icons.chevron_right_rounded,
                      color: Color(0xFF9AA1B2),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// The guest's card at the top of the menu: sign in or create an account.
class _GuestCard extends StatelessWidget {
  const _GuestCard({required this.onSignIn, required this.onCreateAccount});
  final VoidCallback onSignIn, onCreateAccount;
  @override
  Widget build(BuildContext context) => Container(
    margin: EdgeInsets.fromLTRB(
      12,
      12 + MediaQuery.paddingOf(context).top,
      12,
      6,
    ),
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(22),
      border: Border.all(color: const Color(0xFFEDE4DE)),
      boxShadow: [
        BoxShadow(
          color: brandNavy.withValues(alpha: .06),
          blurRadius: 18,
          offset: const Offset(0, 6),
        ),
      ],
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            const CircleAvatar(
              radius: 26,
              backgroundColor: Color(0xFFFCE2EE),
              child: Icon(Icons.person_rounded, color: brandPink, size: 28),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    tr('Welcome!', 'خوش آمدید!'),
                    style: const TextStyle(
                      color: brandNavy,
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  Text(
                    tr(
                      'Sign in to save your learning.',
                      'اپنی پڑھائی محفوظ کرنے کے لیے سائن اِن کریں۔',
                    ),
                    style: const TextStyle(
                      color: Color(0xFF6B7488),
                      fontSize: 13,
                      height: 1.3,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        FilledButton.icon(
          key: const Key('home-sign-in'),
          onPressed: onSignIn,
          style: FilledButton.styleFrom(
            minimumSize: const Size.fromHeight(46),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
          icon: const Icon(Icons.login_rounded, size: 20),
          label: Text(tr('Sign in', 'سائن اِن')),
        ),
        const SizedBox(height: 8),
        OutlinedButton.icon(
          key: const Key('home-create-account'),
          onPressed: onCreateAccount,
          style: OutlinedButton.styleFrom(
            minimumSize: const Size.fromHeight(46),
            foregroundColor: brandNavy,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
          icon: const Icon(Icons.person_add_alt_1_rounded, size: 20),
          label: Text(tr('Create account', 'اکاؤنٹ بنائیں')),
        ),
      ],
    ),
  );
}

class _Section extends StatelessWidget {
  const _Section(this.title);
  final String title;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsetsDirectional.fromSTEB(22, 16, 16, 4),
    child: Text(
      title.toUpperCase(),
      style: const TextStyle(
        color: Color(0xFF9A8F88),
        fontSize: 11.5,
        fontWeight: FontWeight.w700,
        letterSpacing: .8,
      ),
    ),
  );
}

class _Item extends StatelessWidget {
  const _Item({
    super.key,
    required this.icon,
    required this.label,
    required this.onTap,
    this.color = brandNavy,
  });
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color color;
  @override
  Widget build(BuildContext context) => ListTile(
    onTap: onTap,
    contentPadding: const EdgeInsetsDirectional.only(start: 22, end: 14),
    minLeadingWidth: 24,
    leading: Icon(icon, color: color, size: 23),
    title: Text(
      label,
      style: TextStyle(
        color: color,
        fontSize: 15.5,
        fontWeight: FontWeight.w600,
      ),
    ),
  );
}

class _SwitchItem extends StatelessWidget {
  const _SwitchItem({
    super.key,
    required this.icon,
    required this.label,
    required this.value,
    required this.onChanged,
  });
  final IconData icon;
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;
  @override
  Widget build(BuildContext context) => SwitchListTile(
    value: value,
    onChanged: onChanged,
    contentPadding: const EdgeInsetsDirectional.only(start: 22, end: 10),
    secondary: Icon(icon, color: brandNavy, size: 23),
    activeThumbColor: Colors.white,
    activeTrackColor: brandPink,
    title: Text(
      label,
      style: const TextStyle(
        color: brandNavy,
        fontSize: 15.5,
        fontWeight: FontWeight.w600,
      ),
    ),
  );
}

class _Version extends StatelessWidget {
  const _Version();
  @override
  Widget build(BuildContext context) => FutureBuilder<PackageInfo>(
    future: PackageInfo.fromPlatform(),
    builder: (context, snap) => Padding(
      padding: const EdgeInsets.fromLTRB(22, 18, 22, 24),
      child: Text(
        snap.hasData ? '${tr('Version', 'ورژن')} ${snap.data!.version}' : '',
        key: const Key('menu-version'),
        style: const TextStyle(color: Color(0xFF9A8F88), fontSize: 12.5),
      ),
    ),
  );
}
