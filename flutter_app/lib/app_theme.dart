import 'package:flutter/material.dart';

const ink = Color(0xFF16294D);
const brandNavy = Color(0xFF1E2D5A);
const brandPink = Color(0xFFD63678);
const brandOrange = Color(0xFFE08020);
const canvas = Color(0xFFF4F6FA);

ThemeData appTheme() => ThemeData(
  useMaterial3: true,
  fontFamily: 'AppSans',
  // Urdu letters (Individual section in Urdu) fall back to Nastaleeq.
  fontFamilyFallback: const ['JameelNoori'],
  colorScheme: ColorScheme.fromSeed(seedColor: brandPink, surface: canvas)
      .copyWith(
        primary: brandPink,
        onPrimary: Colors.white,
        secondary: brandNavy,
        onSecondary: Colors.white,
        tertiary: brandOrange,
      ),
  scaffoldBackgroundColor: canvas,
  appBarTheme: const AppBarTheme(
    backgroundColor: Colors.white,
    surfaceTintColor: Colors.transparent,
    scrolledUnderElevation: 0,
    titleTextStyle: TextStyle(
      fontFamily: 'AppSans',
      fontFamilyFallback: ['JameelNoori'],
      fontSize: 20,
      fontWeight: FontWeight.w700,
      color: ink,
    ),
    foregroundColor: ink,
    centerTitle: false,
  ),
  textTheme: const TextTheme(
    headlineLarge: TextStyle(fontWeight: FontWeight.w800, color: ink),
    headlineSmall: TextStyle(fontWeight: FontWeight.w800, color: ink),
    titleLarge: TextStyle(fontWeight: FontWeight.w700, color: ink),
    bodyLarge: TextStyle(height: 1.5, color: ink),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: Colors.white,
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: const BorderSide(color: Color(0xFFE5E9F0)),
    ),
    contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
  ),
  outlinedButtonTheme: OutlinedButtonThemeData(
    style: OutlinedButton.styleFrom(
      minimumSize: const Size(48, 54),
      foregroundColor: brandNavy,
      textStyle: const TextStyle(
        fontFamily: 'AppSans',
        fontFamilyFallback: ['JameelNoori'],
        fontSize: 16,
        fontWeight: FontWeight.w700,
      ),
      side: const BorderSide(color: Color(0xFFCBD3E1)),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
    ),
  ),
  textButtonTheme: TextButtonThemeData(
    style: TextButton.styleFrom(minimumSize: const Size(48, 48)),
  ),
  filledButtonTheme: FilledButtonThemeData(
    style: FilledButton.styleFrom(
      minimumSize: const Size(48, 54),
      textStyle: const TextStyle(
        fontFamily: 'AppSans',
        fontFamilyFallback: ['JameelNoori'],
        fontSize: 16,
        fontWeight: FontWeight.w700,
      ),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
    ),
  ),
  cardTheme: CardThemeData(
    color: Colors.white,
    elevation: 0,
    margin: EdgeInsets.zero,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(22),
      side: const BorderSide(color: Color(0xFFE5E9F0)),
    ),
  ),
);

class ConstrainedBody extends StatelessWidget {
  const ConstrainedBody({super.key, required this.child, this.maxWidth = 900});
  final Widget child;
  final double maxWidth;
  @override
  Widget build(BuildContext context) => Align(
    alignment: Alignment.topCenter,
    child: ConstrainedBox(
      constraints: BoxConstraints(maxWidth: maxWidth),
      child: child,
    ),
  );
}

class MessageView extends StatelessWidget {
  const MessageView({
    super.key,
    required this.title,
    required this.message,
    this.action,
  });
  final String title, message;
  final Widget? action;
  @override
  Widget build(BuildContext context) => Center(
    child: SingleChildScrollView(
      padding: const EdgeInsets.all(28),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 440),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.spa_outlined, size: 48, color: brandPink),
            const SizedBox(height: 20),
            Text(
              title,
              style: Theme.of(context).textTheme.headlineSmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center),
            if (action != null)
              Padding(padding: const EdgeInsets.only(top: 24), child: action),
          ],
        ),
      ),
    ),
  );
}
