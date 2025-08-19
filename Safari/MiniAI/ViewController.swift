import Cocoa
import SafariServices

class ViewController: NSViewController {

    @IBOutlet weak var appNameLabel: NSTextField!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        self.appNameLabel.stringValue = "Mini AI"
    }
    
    @IBAction func openSafariExtensionPreferences(_ sender: AnyObject?) {
        SFSafariApplication.showPreferencesForExtension(withIdentifier: "YOUR.BUNDLE.ID.Extension") { error in
            if let _ = error {
                // Insert code to inform the user that something went wrong.
            }
        }
    }
}