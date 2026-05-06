import SwiftUI

@main
struct MomBabyApp: App {
    var body: some Scene {
        WindowGroup {
            MomBabyWebView()
                .ignoresSafeArea()
                .background(Color(red: 1.0, green: 0.973, blue: 0.957))
        }
    }
}
