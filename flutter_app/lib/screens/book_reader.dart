import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:pdfrx/pdfrx.dart';

import '../app_theme.dart';
import '../domain.dart';

/// Turns Android's screenshot and screen-recording block on and off.
///
/// On Android this sets FLAG_SECURE on the app window (see MainActivity):
/// screenshots and recordings come out black and the page is hidden in the
/// recent-apps preview. Other platforms ignore it.
class ScreenGuard {
  static const _channel = MethodChannel('imaan/screen_guard');
  static int _holders = 0;

  /// Whether the native call is made; tests switch it off.
  static bool enabled = !kIsWeb;

  static Future<void> acquire() async {
    if (++_holders == 1) await _set(true);
  }

  static Future<void> release() async {
    if (_holders == 0) return;
    if (--_holders == 0) await _set(false);
  }

  static Future<void> _set(bool secure) async {
    if (!enabled) return;
    try {
      await _channel.invokeMethod<void>('secure', secure);
    } on MissingPluginException {
      // Not Android: nothing to do.
    } on PlatformException {
      // Never stop someone reading because the guard failed.
    }
  }
}

/// Reads a book inside the app only: no download, share, print or copy,
/// and no screenshots while it is open. Opens at [chapter]'s first page,
/// or at the start of the book.
class BookReaderScreen extends StatefulWidget {
  const BookReaderScreen({super.key, required this.book, this.chapter});
  final Book book;
  final Chapter? chapter;
  @override
  State<BookReaderScreen> createState() => _BookReaderScreenState();
}

class _BookReaderScreenState extends State<BookReaderScreen> {
  @override
  void initState() {
    super.initState();
    ScreenGuard.acquire();
  }

  @override
  void dispose() {
    ScreenGuard.release();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: Text(widget.chapter?.title ?? widget.book.title),
    ),
    body: PdfViewer.uri(
      Uri.parse(widget.book.pdfUrl),
      initialPageNumber: widget.chapter?.pageStart ?? 1,
      params: const PdfViewerParams(
        backgroundColor: canvas,
        // Reading only: the text cannot be selected or copied out.
        textSelectionParams: PdfTextSelectionParams(enabled: false),
      ),
    ),
  );
}
