import Foundation
import AuthenticationServices
import Capacitor

/// Plugin local (sem dependência externa) para o Sign in with Apple nativo.
/// Expõe `AppleSignIn.authorize({ nonce })` para o JS e devolve o `identityToken`.
@objc(AppleSignInPlugin)
public class AppleSignInPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppleSignInPlugin"
    public let jsName = "AppleSignIn"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "authorize", returnType: CAPPluginReturnPromise)
    ]

    private var pendingCall: CAPPluginCall?

    @objc func authorize(_ call: CAPPluginCall) {
        guard #available(iOS 13.0, *) else {
            call.reject("unavailable", "SIGN_IN_WITH_APPLE_UNAVAILABLE")
            return
        }

        self.pendingCall = call

        DispatchQueue.main.async {
            let provider = ASAuthorizationAppleIDProvider()
            let request = provider.createRequest()
            request.requestedScopes = [.fullName, .email]
            // nonce já vem hasheado (SHA-256) do lado JS
            if let nonce = call.getString("nonce") {
                request.nonce = nonce
            }

            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            controller.performRequests()
        }
    }
}

@available(iOS 13.0, *)
extension AppleSignInPlugin: ASAuthorizationControllerDelegate {
    public func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithAuthorization authorization: ASAuthorization
    ) {
        guard let call = self.pendingCall else { return }
        self.pendingCall = nil

        guard
            let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
            let tokenData = credential.identityToken,
            let identityToken = String(data: tokenData, encoding: .utf8)
        else {
            call.reject("no_identity_token", "NO_IDENTITY_TOKEN")
            return
        }

        var result: [String: Any] = [
            "identityToken": identityToken,
            "user": credential.user
        ]
        if let email = credential.email {
            result["email"] = email
        }
        if let given = credential.fullName?.givenName {
            result["givenName"] = given
        }
        if let family = credential.fullName?.familyName {
            result["familyName"] = family
        }
        if let codeData = credential.authorizationCode,
           let code = String(data: codeData, encoding: .utf8) {
            result["authorizationCode"] = code
        }

        call.resolve(result)
    }

    public func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithError error: Error
    ) {
        guard let call = self.pendingCall else { return }
        self.pendingCall = nil

        if let authError = error as? ASAuthorizationError, authError.code == .canceled {
            call.reject("canceled", "USER_CANCELED")
            return
        }

        call.reject(error.localizedDescription, "APPLE_SIGN_IN_FAILED")
    }
}

@available(iOS 13.0, *)
extension AppleSignInPlugin: ASAuthorizationControllerPresentationContextProviding {
    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        return self.bridge?.viewController?.view.window ?? UIWindow()
    }
}
