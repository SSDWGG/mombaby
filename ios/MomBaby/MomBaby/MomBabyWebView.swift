import SwiftUI
import AVFoundation
import EventKit
import Speech
import UIKit
import UserNotifications
import WebKit

struct MomBabyWebView: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.userContentController.add(context.coordinator, name: "momBabyNotifications")
        configuration.userContentController.add(context.coordinator, name: "momBabySpeech")
        configuration.userContentController.add(context.coordinator, name: "momBabyExport")

        let webView = WKWebView(frame: .zero, configuration: configuration)
        context.coordinator.webView = webView
        UNUserNotificationCenter.current().delegate = context.coordinator

        webView.navigationDelegate = context.coordinator
        webView.backgroundColor = UIColor(red: 1.0, green: 0.973, blue: 0.957, alpha: 1)
        webView.isOpaque = false
        webView.scrollView.backgroundColor = .clear
        webView.scrollView.bounces = true
        webView.scrollView.bouncesZoom = false
        webView.scrollView.showsVerticalScrollIndicator = false
        webView.scrollView.showsHorizontalScrollIndicator = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.delegate = context.coordinator
        webView.scrollView.minimumZoomScale = 1
        webView.scrollView.maximumZoomScale = 1
        webView.allowsBackForwardNavigationGestures = false

        if #available(iOS 16.4, *) {
            webView.isInspectable = true
        }

        loadApp(in: webView)
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    static func dismantleUIView(_ uiView: WKWebView, coordinator: Coordinator) {
        uiView.scrollView.delegate = nil
        uiView.configuration.userContentController.removeScriptMessageHandler(forName: "momBabyNotifications")
        uiView.configuration.userContentController.removeScriptMessageHandler(forName: "momBabySpeech")
        uiView.configuration.userContentController.removeScriptMessageHandler(forName: "momBabyExport")
    }

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    private func loadApp(in webView: WKWebView) {
        guard let indexURL = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "web") else {
            webView.loadHTMLString(
                """
                <!doctype html>
                <html lang="zh-CN">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <body style="margin:0;display:grid;place-items:center;height:100vh;background:#fff8f4;color:#4b4552;font-family:-apple-system">
                    <p>未找到应用资源</p>
                  </body>
                </html>
                """,
                baseURL: nil
            )
            return
        }

        webView.loadFileURL(indexURL, allowingReadAccessTo: indexURL.deletingLastPathComponent())
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler, UNUserNotificationCenterDelegate, UIScrollViewDelegate {
        weak var webView: WKWebView?
        private let eventStore = EKEventStore()
        private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "zh_CN"))
        private let audioEngine = AVAudioEngine()
        private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
        private var recognitionTask: SFSpeechRecognitionTask?
        private var speechCallbackId: String?
        private var speechStopTimer: Timer?
        private var speechTapInstalled = false
        private var lastTranscript = ""

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            webView.evaluateJavaScript("document.body.style.webkitUserSelect='none';") { _, _ in }
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard let body = message.body as? [String: Any],
                  let action = body["action"] as? String else {
                return
            }

            let callbackId = body["callbackId"] as? String

            if message.name == "momBabyNotifications" {
                switch action {
                case "schedule":
                    scheduleNotification(from: body, callbackId: callbackId)
                case "cancel":
                    cancelNotification(from: body, callbackId: callbackId)
                default:
                    sendResult(callbackId: callbackId, ok: false, reason: "unknown-action")
                }
                return
            }

            if message.name == "momBabySpeech" {
                switch action {
                case "start":
                    startSpeechRecognition(callbackId: callbackId)
                case "stop":
                    finishSpeechRecognition(ok: true, transcript: lastTranscript, reason: "")
                default:
                    sendSpeechResult(callbackId: callbackId, ok: false, transcript: "", reason: "unknown-action")
                }
                return
            }

            if message.name == "momBabyExport" {
                switch action {
                case "share":
                    shareExport(from: body, callbackId: callbackId)
                default:
                    sendExportResult(callbackId: callbackId, ok: false, reason: "unknown-action")
                }
            }
        }

        func userNotificationCenter(
            _ center: UNUserNotificationCenter,
            willPresent notification: UNNotification,
            withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
        ) {
            var options: UNNotificationPresentationOptions = [.banner]
            let soundEnabled = notification.request.content.userInfo["soundEnabled"] as? Bool ?? true

            if soundEnabled {
                options.insert(.sound)
            }

            completionHandler(options)
        }

        func viewForZooming(in scrollView: UIScrollView) -> UIView? {
            nil
        }

        private func startSpeechRecognition(callbackId: String?) {
            guard speechCallbackId == nil else {
                sendSpeechResult(callbackId: callbackId, ok: false, transcript: "", reason: "busy")
                return
            }

            guard speechRecognizer != nil else {
                sendSpeechResult(callbackId: callbackId, ok: false, transcript: "", reason: "unsupported")
                return
            }

            guard speechRecognizer?.isAvailable == true else {
                sendSpeechResult(callbackId: callbackId, ok: false, transcript: "", reason: "unavailable")
                return
            }

            SFSpeechRecognizer.requestAuthorization { [weak self] status in
                guard let self else { return }

                guard status == .authorized else {
                    self.sendSpeechResult(callbackId: callbackId, ok: false, transcript: "", reason: "denied")
                    return
                }

                self.requestMicrophoneAuthorization { granted in
                    guard granted else {
                        self.sendSpeechResult(callbackId: callbackId, ok: false, transcript: "", reason: "microphone-denied")
                        return
                    }

                    DispatchQueue.main.async {
                        self.beginSpeechSession(callbackId: callbackId)
                    }
                }
            }
        }

        private func requestMicrophoneAuthorization(completion: @escaping (Bool) -> Void) {
            if #available(iOS 17.0, *) {
                AVAudioApplication.requestRecordPermission(completionHandler: completion)
            } else {
                AVAudioSession.sharedInstance().requestRecordPermission(completion)
            }
        }

        private func beginSpeechSession(callbackId: String?) {
            finishAudioCapture()
            recognitionTask?.cancel()
            recognitionTask = nil
            lastTranscript = ""
            speechCallbackId = callbackId

            let audioSession = AVAudioSession.sharedInstance()
            do {
                try audioSession.setCategory(.record, mode: .measurement, options: [.duckOthers])
                try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
            } catch {
                finishSpeechRecognition(ok: false, transcript: "", reason: "audio-session")
                return
            }

            let request = SFSpeechAudioBufferRecognitionRequest()
            request.shouldReportPartialResults = true
            recognitionRequest = request

            let inputNode = audioEngine.inputNode
            let recordingFormat = inputNode.outputFormat(forBus: 0)
            inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { [weak self] buffer, _ in
                self?.recognitionRequest?.append(buffer)
            }
            speechTapInstalled = true

            audioEngine.prepare()
            do {
                try audioEngine.start()
            } catch {
                finishSpeechRecognition(ok: false, transcript: "", reason: "audio-start")
                return
            }

            recognitionTask = speechRecognizer?.recognitionTask(with: request) { [weak self] result, error in
                guard let self else { return }

                if let result {
                    self.lastTranscript = result.bestTranscription.formattedString
                    self.scheduleSpeechStopTimer()

                    if result.isFinal {
                        self.finishSpeechRecognition(ok: true, transcript: self.lastTranscript, reason: "")
                    }
                    return
                }

                if error != nil {
                    let transcript = self.lastTranscript
                    self.finishSpeechRecognition(
                        ok: !transcript.isEmpty,
                        transcript: transcript,
                        reason: transcript.isEmpty ? "recognition-error" : ""
                    )
                }
            }

            DispatchQueue.main.asyncAfter(deadline: .now() + 10) { [weak self] in
                guard let self, self.speechCallbackId == callbackId else { return }
                self.finishSpeechRecognition(ok: !self.lastTranscript.isEmpty, transcript: self.lastTranscript, reason: self.lastTranscript.isEmpty ? "empty" : "")
            }
        }

        private func scheduleSpeechStopTimer() {
            DispatchQueue.main.async { [weak self] in
                guard let self else { return }
                self.speechStopTimer?.invalidate()
                self.speechStopTimer = Timer.scheduledTimer(withTimeInterval: 1.6, repeats: false) { [weak self] _ in
                    guard let self else { return }
                    self.finishSpeechRecognition(ok: !self.lastTranscript.isEmpty, transcript: self.lastTranscript, reason: self.lastTranscript.isEmpty ? "empty" : "")
                }
            }
        }

        private func finishSpeechRecognition(ok: Bool, transcript: String, reason: String) {
            if !Thread.isMainThread {
                DispatchQueue.main.async { [weak self] in
                    self?.finishSpeechRecognition(ok: ok, transcript: transcript, reason: reason)
                }
                return
            }

            let callbackId = speechCallbackId
            speechCallbackId = nil
            speechStopTimer?.invalidate()
            speechStopTimer = nil
            finishAudioCapture()
            recognitionTask?.cancel()
            recognitionTask = nil
            recognitionRequest = nil
            try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
            sendSpeechResult(callbackId: callbackId, ok: ok, transcript: transcript, reason: reason)
        }

        private func finishAudioCapture() {
            if audioEngine.isRunning {
                audioEngine.stop()
                recognitionRequest?.endAudio()
            }

            if speechTapInstalled {
                audioEngine.inputNode.removeTap(onBus: 0)
                speechTapInstalled = false
            }
        }

        private func scheduleNotification(from body: [String: Any], callbackId: String?) {
            guard let id = body["id"] as? String,
                  let mode = body["mode"] as? String else {
                sendResult(callbackId: callbackId, ok: false, reason: "missing-fields")
                return
            }

            let amountMl = intValue(body["amountMl"], default: 120)
            let soundEnabled = boolValue(body["soundEnabled"], default: true)
            let useReminderApp = boolValue(body["useReminderApp"], default: false)
            let center = UNUserNotificationCenter.current()
            let authorizationOptions: UNAuthorizationOptions = soundEnabled ? [.alert, .sound, .badge] : [.alert, .badge]

            center.requestAuthorization(options: authorizationOptions) { [weak self] granted, error in
                guard let self else { return }

                if error != nil {
                    self.sendResult(callbackId: callbackId, ok: false, reason: "authorization-error")
                    return
                }

                guard granted else {
                    self.sendResult(callbackId: callbackId, ok: false, reason: "denied")
                    return
                }

                let content = UNMutableNotificationContent()
                content.title = "该喂奶了"
                content.body = "建议奶量 \(amountMl) ml"
                content.userInfo = ["soundEnabled": soundEnabled]

                if soundEnabled {
                    content.sound = .default
                }

                let trigger: UNNotificationTrigger
                if mode == "fixed" {
                    var components = DateComponents()
                    components.hour = self.clamp(self.intValue(body["hour"], default: 8), min: 0, max: 23)
                    components.minute = self.clamp(self.intValue(body["minute"], default: 0), min: 0, max: 59)
                    trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
                } else {
                    let fallbackSeconds = self.clamp(self.intValue(body["countdownMinutes"], default: 180), min: 1, max: 12 * 60) * 60
                    let seconds = self.clamp(self.intValue(body["countdownSeconds"], default: fallbackSeconds), min: 1, max: 12 * 60 * 60)
                    trigger = UNTimeIntervalNotificationTrigger(timeInterval: TimeInterval(seconds), repeats: false)
                }

                let request = UNNotificationRequest(identifier: id, content: content, trigger: trigger)
                center.removePendingNotificationRequests(withIdentifiers: [id])
                center.add(request) { addError in
                    if addError != nil {
                        self.sendResult(callbackId: callbackId, ok: false, reason: "schedule-error")
                        return
                    }

                    guard useReminderApp else {
                        self.sendResult(callbackId: callbackId, ok: true, reason: "")
                        return
                    }

                    self.scheduleReminderTask(from: body, amountMl: amountMl) { reminderAppId, reminderReason in
                        self.sendResult(
                            callbackId: callbackId,
                            ok: true,
                            reason: reminderReason,
                            reminderAppId: reminderAppId
                        )
                    }
                }
            }
        }

        private func cancelNotification(from body: [String: Any], callbackId: String?) {
            guard let id = body["id"] as? String else {
                sendResult(callbackId: callbackId, ok: false, reason: "missing-id")
                return
            }

            UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [id])
            let reminderAppId = (body["reminderAppId"] as? String) ?? ""
            guard !reminderAppId.isEmpty else {
                sendResult(callbackId: callbackId, ok: true, reason: "")
                return
            }

            removeReminderTask(identifier: reminderAppId) { [weak self] in
                self?.sendResult(callbackId: callbackId, ok: true, reason: "")
            }
        }

        private func scheduleReminderTask(
            from body: [String: Any],
            amountMl: Int,
            completion: @escaping (String, String) -> Void
        ) {
            DispatchQueue.main.async { [weak self] in
                guard let self else { return }

                self.requestReminderAccess { granted, reason in
                    guard granted else {
                        completion("", reason)
                        return
                    }

                    guard let calendar = self.eventStore.defaultCalendarForNewReminders() else {
                        completion("", "reminder-app-unavailable")
                        return
                    }

                    let dueAt = self.reminderDueDate(from: body)
                    var components = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: dueAt)
                    components.calendar = Calendar.current
                    components.timeZone = TimeZone.current

                    let reminder = EKReminder(eventStore: self.eventStore)
                    reminder.calendar = calendar
                    reminder.title = "喂奶提醒 · \(amountMl) ml"
                    reminder.notes = "由沐奶时光创建。到点建议喂奶 \(amountMl) ml。"
                    reminder.startDateComponents = components
                    reminder.dueDateComponents = components
                    reminder.addAlarm(EKAlarm(absoluteDate: dueAt))

                    if (body["mode"] as? String) == "fixed" {
                        reminder.addRecurrenceRule(EKRecurrenceRule(recurrenceWith: .daily, interval: 1, end: nil))
                    }

                    do {
                        try self.eventStore.save(reminder, commit: true)
                        completion(reminder.calendarItemIdentifier, "")
                    } catch {
                        completion("", "reminder-app-error")
                    }
                }
            }
        }

        private func removeReminderTask(identifier: String, completion: @escaping () -> Void) {
            DispatchQueue.main.async { [weak self] in
                guard let self else { return }

                self.requestReminderAccess { granted, _ in
                    guard granted else {
                        completion()
                        return
                    }

                    if let reminder = self.eventStore.calendarItem(withIdentifier: identifier) as? EKReminder {
                        try? self.eventStore.remove(reminder, commit: true)
                    }

                    completion()
                }
            }
        }

        private func shareExport(from body: [String: Any], callbackId: String?) {
            guard let content = body["content"] as? String,
                  !content.isEmpty,
                  let data = content.data(using: .utf8) else {
                sendExportResult(callbackId: callbackId, ok: false, reason: "invalid-content")
                return
            }

            let filename = safeExportFilename((body["filename"] as? String) ?? "momBaby-backup.json")
            let directoryURL = FileManager.default.temporaryDirectory
                .appendingPathComponent("MomBabyExport-\(UUID().uuidString)", isDirectory: true)
            let fileURL = directoryURL.appendingPathComponent(filename)

            do {
                try FileManager.default.createDirectory(at: directoryURL, withIntermediateDirectories: true)
                try data.write(to: fileURL, options: .atomic)
            } catch {
                try? FileManager.default.removeItem(at: directoryURL)
                sendExportResult(callbackId: callbackId, ok: false, reason: "write-failed")
                return
            }

            DispatchQueue.main.async { [weak self] in
                guard let self,
                      let webView = self.webView,
                      let presenter = self.presentingViewController() else {
                    self?.sendExportResult(callbackId: callbackId, ok: false, reason: "present-failed")
                    try? FileManager.default.removeItem(at: directoryURL)
                    return
                }

                let activityController = UIActivityViewController(activityItems: [fileURL], applicationActivities: nil)
                activityController.completionWithItemsHandler = { [weak self] _, completed, _, error in
                    if error != nil {
                        self?.sendExportResult(callbackId: callbackId, ok: false, reason: "share-error")
                    } else {
                        self?.sendExportResult(callbackId: callbackId, ok: true, reason: completed ? "" : "cancelled")
                    }

                    DispatchQueue.global(qos: .utility).asyncAfter(deadline: .now() + 60) {
                        try? FileManager.default.removeItem(at: directoryURL)
                    }
                }

                if let popover = activityController.popoverPresentationController {
                    popover.sourceView = webView
                    popover.sourceRect = CGRect(x: webView.bounds.midX, y: webView.bounds.maxY - 1, width: 1, height: 1)
                    popover.permittedArrowDirections = []
                }

                presenter.present(activityController, animated: true)
            }
        }

        private func safeExportFilename(_ filename: String) -> String {
            let fallback = "momBaby-backup.json"
            let invalidCharacters = CharacterSet(charactersIn: "/\\?%*|\"<>:")
            let cleaned = filename
                .components(separatedBy: invalidCharacters)
                .joined(separator: "-")
                .trimmingCharacters(in: .whitespacesAndNewlines)

            return cleaned.isEmpty ? fallback : cleaned
        }

        private func presentingViewController() -> UIViewController? {
            let window = UIApplication.shared.connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .flatMap { $0.windows }
                .first { $0.isKeyWindow }

            var presenter = window?.rootViewController
            while let presented = presenter?.presentedViewController {
                presenter = presented
            }
            return presenter
        }

        private func requestReminderAccess(completion: @escaping (Bool, String) -> Void) {
            let status = EKEventStore.authorizationStatus(for: .reminder)

            if #available(iOS 17.0, *) {
                switch status {
                case .fullAccess:
                    completion(true, "")
                case .notDetermined:
                    eventStore.requestFullAccessToReminders { granted, error in
                        completion(granted, error == nil && granted ? "" : (error == nil ? "reminder-app-denied" : "reminder-app-error"))
                    }
                case .denied, .restricted, .writeOnly:
                    completion(false, "reminder-app-denied")
                @unknown default:
                    completion(false, "reminder-app-denied")
                }
                return
            }

            switch status {
            case .authorized, .fullAccess:
                completion(true, "")
            case .notDetermined:
                eventStore.requestAccess(to: .reminder) { granted, error in
                    completion(granted, error == nil && granted ? "" : (error == nil ? "reminder-app-denied" : "reminder-app-error"))
                }
            case .denied, .restricted, .writeOnly:
                completion(false, "reminder-app-denied")
            @unknown default:
                completion(false, "reminder-app-denied")
            }
        }

        private func reminderDueDate(from body: [String: Any]) -> Date {
            if (body["mode"] as? String) == "fixed" {
                let hour = clamp(intValue(body["hour"], default: 8), min: 0, max: 23)
                let minute = clamp(intValue(body["minute"], default: 0), min: 0, max: 59)
                var next = Calendar.current.date(bySettingHour: hour, minute: minute, second: 0, of: Date()) ?? Date()
                if next <= Date() {
                    next = Calendar.current.date(byAdding: .day, value: 1, to: next) ?? next
                }
                return next
            }

            let fallbackSeconds = clamp(intValue(body["countdownMinutes"], default: 180), min: 1, max: 12 * 60) * 60
            let seconds = clamp(intValue(body["countdownSeconds"], default: fallbackSeconds), min: 1, max: 12 * 60 * 60)
            return Date().addingTimeInterval(TimeInterval(seconds))
        }

        private func sendResult(callbackId: String?, ok: Bool, reason: String, reminderAppId: String = "") {
            guard let callbackId else { return }

            let payload: [String: Any] = [
                "callbackId": callbackId,
                "ok": ok,
                "reason": reason,
                "reminderAppId": reminderAppId,
            ]

            guard let data = try? JSONSerialization.data(withJSONObject: payload),
                  let json = String(data: data, encoding: .utf8) else {
                return
            }

            DispatchQueue.main.async { [weak self] in
                self?.webView?.evaluateJavaScript(
                    "window.dispatchEvent(new CustomEvent('momBabyNativeNotification', { detail: \(json) }));",
                    completionHandler: nil
                )
            }
        }

        private func sendSpeechResult(callbackId: String?, ok: Bool, transcript: String, reason: String) {
            guard let callbackId else { return }

            let payload: [String: Any] = [
                "callbackId": callbackId,
                "ok": ok,
                "transcript": transcript,
                "reason": reason,
            ]

            guard let data = try? JSONSerialization.data(withJSONObject: payload),
                  let json = String(data: data, encoding: .utf8) else {
                return
            }

            DispatchQueue.main.async { [weak self] in
                self?.webView?.evaluateJavaScript(
                    "window.dispatchEvent(new CustomEvent('momBabyNativeSpeech', { detail: \(json) }));",
                    completionHandler: nil
                )
            }
        }

        private func sendExportResult(callbackId: String?, ok: Bool, reason: String) {
            guard let callbackId else { return }

            let payload: [String: Any] = [
                "callbackId": callbackId,
                "ok": ok,
                "reason": reason,
            ]

            guard let data = try? JSONSerialization.data(withJSONObject: payload),
                  let json = String(data: data, encoding: .utf8) else {
                return
            }

            DispatchQueue.main.async { [weak self] in
                self?.webView?.evaluateJavaScript(
                    "window.dispatchEvent(new CustomEvent('momBabyNativeExport', { detail: \(json) }));",
                    completionHandler: nil
                )
            }
        }

        private func intValue(_ value: Any?, default defaultValue: Int) -> Int {
            if let value = value as? Int {
                return value
            }

            if let value = value as? NSNumber {
                return value.intValue
            }

            if let value = value as? String, let integer = Int(value) {
                return integer
            }

            return defaultValue
        }

        private func boolValue(_ value: Any?, default defaultValue: Bool) -> Bool {
            if let value = value as? Bool {
                return value
            }

            if let value = value as? NSNumber {
                return value.boolValue
            }

            if let value = value as? String {
                return value == "true"
            }

            return defaultValue
        }

        private func clamp(_ value: Int, min: Int, max: Int) -> Int {
            Swift.min(max, Swift.max(min, value))
        }
    }
}
