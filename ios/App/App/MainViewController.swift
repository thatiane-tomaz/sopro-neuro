import UIKit
import Capacitor

/// ViewController principal da bridge.
/// Registra explicitamente o plugin local AppleSignIn (Capacitor 8 não
/// descobre plugins locais automaticamente quando declarados no app target).
class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(AppleSignInPlugin())
    }
}
