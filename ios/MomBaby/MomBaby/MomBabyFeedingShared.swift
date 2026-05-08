import Foundation

#if canImport(ActivityKit)
import ActivityKit
#endif

enum MomBabySharedStore {
    static let appGroupID = "group.com.renshuaiweidemac.mombabyfeeding"
    static let snapshotKey = "momBaby.widget.feedingSnapshot.v1"
    static let widgetKind = "MomBabyFeedingWidget"

    static var defaults: UserDefaults {
        UserDefaults(suiteName: appGroupID) ?? .standard
    }

    static func loadSnapshot() -> MomBabyFeedingSnapshot {
        guard let data = defaults.data(forKey: snapshotKey),
              let snapshot = try? JSONDecoder.momBaby.decode(MomBabyFeedingSnapshot.self, from: data) else {
            return .fallback
        }

        return snapshot
    }

    static func saveSnapshot(_ snapshot: MomBabyFeedingSnapshot) {
        guard let data = try? JSONEncoder.momBaby.encode(snapshot) else { return }
        defaults.set(data, forKey: snapshotKey)
    }
}

struct MomBabyFeedingSnapshot: Codable, Equatable, Hashable {
    var hasReminder: Bool
    var nextAt: Date?
    var mode: String
    var amountMl: Int
    var babyName: String
    var praise: String
    var fixedHour: Int?
    var fixedMinute: Int?
    var updatedAt: Date

    static let fallback = MomBabyFeedingSnapshot(
        hasReminder: false,
        nextAt: nil,
        mode: "",
        amountMl: 0,
        babyName: "宝贝",
        praise: "宝贝今天也闪闪发光",
        fixedHour: nil,
        fixedMinute: nil,
        updatedAt: Date()
    )

    var displayName: String {
        let trimmed = babyName.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? "宝贝" : trimmed
    }

    var displayPraise: String {
        let trimmed = praise.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? "\(displayName)今天也很棒" : trimmed
    }

    func effectiveNextDate(now: Date = Date()) -> Date? {
        if mode == "fixed", let fixedHour, let fixedMinute {
            return Self.nextDailyOccurrence(hour: fixedHour, minute: fixedMinute, now: now)
        }

        guard hasReminder, let nextAt, nextAt > now else {
            return nil
        }

        return nextAt
    }

    private static func nextDailyOccurrence(hour: Int, minute: Int, now: Date) -> Date? {
        let calendar = Calendar.current
        let safeHour = min(23, max(0, hour))
        let safeMinute = min(59, max(0, minute))
        var next = calendar.date(bySettingHour: safeHour, minute: safeMinute, second: 0, of: now)

        if let value = next, value <= now {
            next = calendar.date(byAdding: .day, value: 1, to: value)
        }

        return next
    }
}

extension JSONDecoder {
    static var momBaby: JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }
}

extension JSONEncoder {
    static var momBaby: JSONEncoder {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        return encoder
    }
}

#if canImport(ActivityKit)
@available(iOS 16.2, *)
struct MomBabyFeedingAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var snapshot: MomBabyFeedingSnapshot
    }

    var title: String = "沐奶时光"
}
#endif
