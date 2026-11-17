import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:in_app_purchase_android/in_app_purchase_android.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Google Play subscription that unlocks the whole Individual section.
///
/// Create it in Play Console → Monetize → Subscriptions with this product id
/// and two base plans (monthly, yearly). Prices come from Play, never from
/// the app.
const individualSubscriptionId = 'imaan_individual';

/// One plan the learner can buy, as shown on the paywall.
@immutable
class PlanOffer {
  const PlanOffer({
    required this.id,
    required this.title,
    required this.price,
    required this.yearly,
    this.details,
  });
  final String id, title, price;
  final bool yearly;

  /// The store's own record, needed to start the purchase.
  final ProductDetails? details;
}

/// Where purchases come from. [PlayBilling] in the app; tests use
/// [FakeBilling].
abstract class BillingBackend {
  bool get available;

  /// [onActive] gets true/false when access is known, or null when a
  /// purchase flow ended without changing it (cancelled, failed).
  Future<void> start(void Function(bool? active) onActive);
  Future<List<PlanOffer>> plans();
  Future<void> buy(PlanOffer plan);
  Future<void> restore();
  void dispose() {}
}

/// Whether this device's Google Play account has an active Individual
/// subscription. The last known answer is cached so the app works offline.
///
/// Security note: this trusts the Play client on the device. Before a wide
/// release, verify purchase tokens on the server (Cloud Function with the
/// Play Developer API) and grant access from there.
class Entitlement extends ChangeNotifier {
  Entitlement({BillingBackend? backend, this.persist = true})
    : backend = backend ?? PlayBilling();

  static Entitlement instance = Entitlement();

  static const _key = 'imaan.entitlement.v1';
  final BillingBackend backend;
  final bool persist;
  bool _active = false;
  bool _started = false;
  bool busy = false;
  String? error;
  List<PlanOffer> offers = const [];

  /// True once the cached answer has been read, so a subscriber never
  /// sees the paywall flash before their lessons.
  bool ready = false;

  bool get active => _active || _account;

  /// A subscription the server already verified for the signed-in account
  /// (entitlements/{uid}). It unlocks the Individual courses where Google
  /// Play is not available, such as the website, and on another phone.
  bool _account = false;
  void setAccountActive(bool value) {
    if (value == _account) return;
    _account = value;
    notifyListeners();
  }

  bool get storeAvailable => backend.available;

  /// Loads the cached answer, then asks the store (once per launch).
  Future<void> start() async {
    if (_started) return;
    _started = true;
    if (persist) {
      try {
        final cached = await SharedPreferencesAsync().getBool(_key);
        if (cached == true && !_active) {
          _active = true;
          notifyListeners();
        }
      } catch (_) {}
    }
    ready = true;
    notifyListeners();
    try {
      await backend.start(_setActive);
      offers = await backend.plans();
    } catch (e) {
      debugPrint('Entitlement: $e');
    }
    notifyListeners();
  }

  void _setActive(bool? value) {
    busy = false;
    if (value != null && value != _active) {
      _active = value;
      if (persist) {
        SharedPreferencesAsync().setBool(_key, value).catchError((_) {});
      }
    }
    notifyListeners();
  }

  Future<void> buy(PlanOffer plan) async {
    error = null;
    busy = true;
    notifyListeners();
    try {
      await backend.buy(plan);
    } catch (e) {
      busy = false;
      error = '$e';
      notifyListeners();
    }
  }

  Future<void> restore() async {
    error = null;
    busy = true;
    notifyListeners();
    try {
      await backend.restore();
    } catch (e) {
      error = '$e';
    }
    busy = false;
    notifyListeners();
  }
}

/// Google Play Billing through the in_app_purchase plugin.
class PlayBilling extends BillingBackend {
  PlayBilling({this.verifier});

  /// Asks our server (verifyPlaySubscription) whether a Play purchase token
  /// is really active. Returns null when the server cannot be reached; the
  /// purchase is then trusted for now and checked again next launch.
  final Future<bool?> Function(String purchaseToken)? verifier;

  InAppPurchase? _iap;
  StreamSubscription<List<PurchaseDetails>>? _sub;
  bool _available = false;
  void Function(bool?)? _onActive;

  @override
  bool get available => _available;

  /// Whether this Play purchase grants access, asking the server if we can.
  Future<bool> _verified(PurchaseDetails p) async {
    final check = verifier;
    if (check == null) return true;
    final token = p.verificationData.serverVerificationData;
    try {
      return await check(token) ?? true;
    } catch (_) {
      return true;
    }
  }

  @override
  Future<void> start(void Function(bool? active) onActive) async {
    _onActive = onActive;
    if (kIsWeb || defaultTargetPlatform != TargetPlatform.android) return;
    final iap = _iap = InAppPurchase.instance;
    _available = await iap.isAvailable();
    if (!_available) return;
    _sub = iap.purchaseStream.listen(_onPurchases, onError: (_) {});
    await _refresh();
  }

  /// Asks Play which subscriptions are active right now.
  Future<void> _refresh() async {
    final addition = _iap!
        .getPlatformAddition<InAppPurchaseAndroidPlatformAddition>();
    final past = await addition.queryPastPurchases();
    final mine = past.pastPurchases.where(
      (p) =>
          p.productID == individualSubscriptionId &&
          (p.status == PurchaseStatus.purchased ||
              p.status == PurchaseStatus.restored),
    );
    var active = false;
    for (final p in mine) {
      if (p.pendingCompletePurchase) await _iap!.completePurchase(p);
      if (!active && await _verified(p)) active = true;
    }
    _onActive?.call(active);
  }

  Future<void> _onPurchases(List<PurchaseDetails> list) async {
    for (final p in list) {
      if (p.productID != individualSubscriptionId) continue;
      switch (p.status) {
        case PurchaseStatus.purchased:
        case PurchaseStatus.restored:
          if (p.pendingCompletePurchase) await _iap!.completePurchase(p);
          _onActive?.call(await _verified(p));
          continue;
        case PurchaseStatus.error:
        case PurchaseStatus.canceled:
          // The learner keeps whatever access they already had.
          _onActive?.call(null);
        case PurchaseStatus.pending:
          break;
      }
      if (p.pendingCompletePurchase) await _iap!.completePurchase(p);
    }
  }

  @override
  Future<List<PlanOffer>> plans() async {
    if (!_available) return const [];
    final res = await _iap!.queryProductDetails({individualSubscriptionId});
    final offers = <PlanOffer>[];
    for (final d in res.productDetails) {
      final yearly = d is GooglePlayProductDetails
          ? (d
                        .productDetails
                        .subscriptionOfferDetails?[d.subscriptionIndex ?? 0]
                        .pricingPhases
                        .last
                        .billingPeriod ??
                    '')
                .contains('Y')
          : false;
      offers.add(
        PlanOffer(
          id: d.id,
          title: d.title,
          price: d.price,
          yearly: yearly,
          details: d,
        ),
      );
    }
    offers.sort((a, b) => a.yearly == b.yearly ? 0 : (a.yearly ? 1 : -1));
    return offers;
  }

  @override
  Future<void> buy(PlanOffer plan) async {
    final details = plan.details;
    if (!_available || details == null) {
      throw StateError('Google Play is not available on this device.');
    }
    await _iap!.buyNonConsumable(
      purchaseParam: PurchaseParam(productDetails: details),
    );
  }

  @override
  Future<void> restore() async {
    if (!_available) {
      throw StateError('Google Play is not available on this device.');
    }
    await _refresh();
  }

  @override
  void dispose() => _sub?.cancel();
}

/// A store that never talks to Google, for tests and previews.
class FakeBilling extends BillingBackend {
  FakeBilling({this.active = false, this.storeOpen = true});
  bool active;
  final bool storeOpen;
  void Function(bool?)? _onActive;
  final bought = <String>[];

  @override
  bool get available => storeOpen;

  @override
  Future<void> start(void Function(bool? active) onActive) async {
    _onActive = onActive;
    onActive(active);
  }

  @override
  Future<List<PlanOffer>> plans() async => storeOpen
      ? const [
          PlanOffer(
            id: 'monthly',
            title: 'Monthly',
            price: 'Rs 500',
            yearly: false,
          ),
          PlanOffer(
            id: 'yearly',
            title: 'Yearly',
            price: 'Rs 4,500',
            yearly: true,
          ),
        ]
      : const [];

  @override
  Future<void> buy(PlanOffer plan) async {
    bought.add(plan.id);
    active = true;
    _onActive?.call(true);
  }

  @override
  Future<void> restore() async => _onActive?.call(active);
}

/// The server check used in the app: the `verifyPlaySubscription` Cloud
/// Function. Returns null (unknown) when it cannot be reached.
Future<bool?> Function(String) serverVerifier(
  Future<Map<String, dynamic>> Function(String name, Map<String, dynamic> data)
  call,
) => (token) async {
  try {
    final r = await call('verifyPlaySubscription', {
      'purchaseToken': token,
      'productId': individualSubscriptionId,
    });
    final active = r['active'];
    return active is bool ? active : null;
  } catch (e) {
    debugPrint('verifyPlaySubscription: $e');
    return null;
  }
};
