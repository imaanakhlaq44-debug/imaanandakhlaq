import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../app_theme.dart';

/// The learner's chosen language for the Individual section: English or Urdu.
///
/// Urdu is written in Jameel Noori Nastaleeq (the `JameelNoori` font, also a
/// global fallback in [appTheme]) and laid out right to left inside
/// [LanguageScope]. Course content stays in its source language for now: only
/// the app's own words (buttons, headings, home, rewards) are translated.
class AppLanguage extends ChangeNotifier {
  AppLanguage({this.persist = true}) {
    if (persist) _load();
  }

  static AppLanguage instance = AppLanguage();

  static const _key = 'imaan.language.v1';
  final bool persist;
  bool _urdu = false;
  SharedPreferencesAsync? _prefs;

  bool get urdu => _urdu;
  TextDirection get direction => _urdu ? TextDirection.rtl : TextDirection.ltr;

  Future<void> _load() async {
    try {
      _prefs ??= SharedPreferencesAsync();
      final saved = await _prefs!.getString(_key);
      if (saved == 'ur' && !_urdu) {
        _urdu = true;
        notifyListeners();
      }
    } catch (_) {
      // No storage (tests, private mode): stay in English.
    }
  }

  Future<void> setUrdu(bool value) async {
    if (value == _urdu) return;
    _urdu = value;
    notifyListeners();
    if (!persist) return;
    try {
      _prefs ??= SharedPreferencesAsync();
      await _prefs!.setString(_key, value ? 'ur' : 'en');
    } catch (_) {}
  }

  Future<void> toggle() => setUrdu(!_urdu);
}

/// The English or Urdu form of an app string, for the current language.
String tr(String en, String ur) => AppLanguage.instance.urdu ? ur : en;

/// Rebuilds [child] when the language changes and, in Urdu, lays it out
/// right to left with Nastaleeq-friendly line spacing.
class LanguageScope extends StatelessWidget {
  const LanguageScope({super.key, required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: AppLanguage.instance,
    builder: (context, _) {
      final lang = AppLanguage.instance;
      Widget scoped = Directionality(
        textDirection: lang.direction,
        child: KeyedSubtree(
          // A fresh subtree so every tr() string is rebuilt at once.
          key: ValueKey(lang.urdu),
          child: child,
        ),
      );
      if (lang.urdu) {
        // Nastaleeq reads smaller than Latin at the same size: lift it a
        // little, on top of the learner's own text-size setting.
        final mq = MediaQuery.of(context);
        scoped = MediaQuery(
          data: mq.copyWith(
            textScaler: _Scaled(mq.textScaler, urduTextScale),
          ),
          child: scoped,
        );
      }
      return scoped;
    },
  );
}

/// How much larger Urdu text is drawn than the same English size.
const urduTextScale = 1.14;

class _Scaled extends TextScaler {
  const _Scaled(this.base, this.factor);
  final TextScaler base;
  final double factor;
  @override
  double scale(double fontSize) => base.scale(fontSize) * factor;
  @override
  double get textScaleFactor => base.scale(14) / 14 * factor;
  @override
  bool operator ==(Object other) =>
      other is _Scaled && other.base == base && other.factor == factor;
  @override
  int get hashCode => Object.hash(base, factor);
}

/// The اردو / EN switch.
class LanguageToggle extends StatelessWidget {
  const LanguageToggle({super.key, this.onDark = false});

  /// True when placed on a dark background (the story hero).
  final bool onDark;

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: AppLanguage.instance,
    builder: (context, _) {
      final urdu = AppLanguage.instance.urdu;
      final fg = onDark ? Colors.white : brandNavy;
      Widget seg(String label, bool active, {bool nastaleeq = false}) =>
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: EdgeInsets.fromLTRB(10, nastaleeq ? 0 : 5, 10, 5),
            decoration: BoxDecoration(
              color: active
                  ? (onDark ? Colors.white : brandPink)
                  : Colors.transparent,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              label,
              textDirection: nastaleeq ? TextDirection.rtl : TextDirection.ltr,
              style: TextStyle(
                fontFamily: nastaleeq ? 'JameelNoori' : null,
                fontSize: nastaleeq ? 16 : 12.5,
                height: nastaleeq ? 1.6 : 1.2,
                fontWeight: FontWeight.w800,
                color: active ? (onDark ? brandNavy : Colors.white) : fg,
              ),
            ),
          );
      return Semantics(
        button: true,
        label: urdu ? 'Switch to English' : 'Switch to Urdu',
        excludeSemantics: true,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            key: const Key('language-toggle'),
            borderRadius: BorderRadius.circular(22),
            onTap: AppLanguage.instance.toggle,
            child: Container(
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                color: onDark
                    ? Colors.white.withValues(alpha: .16)
                    : Colors.white,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(
                  color: onDark
                      ? Colors.white.withValues(alpha: .35)
                      : brandNavy.withValues(alpha: .15),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                textDirection: TextDirection.ltr,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  seg('EN', !urdu),
                  seg('اردو', urdu, nastaleeq: true),
                ],
              ),
            ),
          ),
        ),
      );
    },
  );
}
