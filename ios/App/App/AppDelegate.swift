import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}

// MARK: - WebView navigation containment
//
// The app is a thin WKWebView shell over the live site. We were rejected
// three times because navigation to a host other than server.url's host
// (notably the hey2am.app -> www.hey2am.app 307 redirect) was handed off
// to Safari by Capacitor's default navigation handling.
//
// capacitor.config.ts `allowNavigation` already keeps both hosts in the
// WebView. This is the belt-and-suspenders second layer: a navigation
// delegate that explicitly keeps ANY hey2am.app URL (apex or subdomain)
// in the WebView and only ever hands genuinely external URLs to the
// system. It wraps Capacitor's own delegate and forwards every other
// callback to it, so the bridge lifecycle is untouched.
//
// Wired up via Main.storyboard (the bridge view controller's custom class
// points at HeyBridgeViewController).

class HeyBridgeViewController: CAPBridgeViewController {
    private var navigationGuard: WebViewNavigationGuard?

    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        installNavigationGuard()
    }

    private func installNavigationGuard() {
        guard let webView = bridge?.webView else { return }
        guard let capacitorDelegate = webView.navigationDelegate else { return }
        // Don't double-wrap if capacitorDidLoad somehow runs twice.
        if capacitorDelegate is WebViewNavigationGuard { return }
        let guardDelegate = WebViewNavigationGuard(wrapping: capacitorDelegate)
        navigationGuard = guardDelegate            // retain — navigationDelegate is weak
        webView.navigationDelegate = guardDelegate
    }
}

final class WebViewNavigationGuard: NSObject, WKNavigationDelegate {
    // Capacitor's original navigation delegate. The bridge retains it
    // strongly, so this unowned-style strong ref is safe to forward to.
    private let wrapped: WKNavigationDelegate

    init(wrapping delegate: WKNavigationDelegate) {
        self.wrapped = delegate
        super.init()
    }

    private func shouldKeepInWebView(_ url: URL) -> Bool {
        let scheme = (url.scheme ?? "").lowercased()
        // Bridge / local content schemes always stay in-app.
        if scheme == "capacitor" || scheme == "ionic" || scheme == "file" || scheme == "about" {
            return true
        }
        // Any hey2am.app URL — apex or any subdomain. This is what makes
        // the apex->www redirect (and any future cross-subdomain link)
        // resolve inside the WebView instead of opening Safari.
        let host = (url.host ?? "").lowercased()
        return host == "hey2am.app" || host.hasSuffix(".hey2am.app")
    }

    private func openExternally(_ url: URL) {
        let scheme = (url.scheme ?? "").lowercased()
        let openableSchemes: Set<String> = ["http", "https", "mailto", "tel", "sms", "facetime", "maps"]
        if openableSchemes.contains(scheme), UIApplication.shared.canOpenURL(url) {
            UIApplication.shared.open(url, options: [:], completionHandler: nil)
        }
    }

    // iOS 13+ navigation-policy callback (the only one WKWebView calls when
    // implemented, and our deployment target is iOS 15). Self-contained:
    // calls the decision handler exactly once on every path, so it can
    // never hang the WebView.
    func webView(_ webView: WKWebView,
                 decidePolicyFor navigationAction: WKNavigationAction,
                 preferences: WKWebpagePreferences,
                 decisionHandler: @escaping (WKNavigationActionPolicy, WKWebpagePreferences) -> Void) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.allow, preferences)
            return
        }
        if shouldKeepInWebView(url) {
            decisionHandler(.allow, preferences)
            return
        }
        openExternally(url)
        decisionHandler(.cancel, preferences)
    }

    // Forward every other WKNavigationDelegate callback (didFinish,
    // didCommit, didFail, server-trust auth challenges, …) to Capacitor's
    // handler so the bridge keeps working exactly as before.
    override func responds(to aSelector: Selector!) -> Bool {
        if super.responds(to: aSelector) { return true }
        return wrapped.responds(to: aSelector)
    }

    override func forwardingTarget(for aSelector: Selector!) -> Any? {
        if wrapped.responds(to: aSelector) { return wrapped }
        return super.forwardingTarget(for: aSelector)
    }
}
