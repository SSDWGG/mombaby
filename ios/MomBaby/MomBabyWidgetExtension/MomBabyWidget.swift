import ActivityKit
import SwiftUI
import UIKit
import WidgetKit

private enum MomBabyWidgetTheme {
    static func accent(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark
            ? Color(red: 0.48, green: 0.82, blue: 0.72)
            : Color(red: 0.86, green: 0.38, blue: 0.34)
    }

    static func primaryText(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark
            ? Color(red: 0.98, green: 0.94, blue: 0.90)
            : Color(red: 0.24, green: 0.18, blue: 0.16)
    }

    static func secondaryText(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark
            ? Color(red: 0.78, green: 0.70, blue: 0.65)
            : Color(red: 0.48, green: 0.39, blue: 0.35)
    }

    static func backgroundColors(for colorScheme: ColorScheme) -> [Color] {
        colorScheme == .dark
            ? [
                Color(red: 0.12, green: 0.10, blue: 0.09),
                Color(red: 0.18, green: 0.14, blue: 0.12),
                Color(red: 0.10, green: 0.18, blue: 0.16),
            ]
            : [
                Color(red: 1.00, green: 0.95, blue: 0.92),
                Color(red: 0.92, green: 0.98, blue: 0.95),
                Color(red: 1.00, green: 0.90, blue: 0.87),
            ]
    }

    static var adaptiveAccent: Color {
        Color(uiColor: UIColor { traits in
            traits.userInterfaceStyle == .dark
                ? UIColor(red: 0.48, green: 0.82, blue: 0.72, alpha: 1)
                : UIColor(red: 0.86, green: 0.38, blue: 0.34, alpha: 1)
        })
    }

    static var adaptiveActivityBackground: Color {
        Color(uiColor: UIColor { traits in
            traits.userInterfaceStyle == .dark
                ? UIColor(red: 0.12, green: 0.10, blue: 0.09, alpha: 1)
                : UIColor(red: 1.00, green: 0.95, blue: 0.92, alpha: 1)
        })
    }
}

private struct AppIconMark: View {
    let size: CGFloat

    var body: some View {
        Image("WidgetAppIcon")
            .resizable()
            .scaledToFit()
            .frame(width: size, height: size)
            .clipShape(RoundedRectangle(cornerRadius: max(3, size * 0.22), style: .continuous))
            .shadow(color: .black.opacity(size >= 24 ? 0.14 : 0), radius: 4, y: 2)
            .accessibilityHidden(true)
    }
}

private extension View {
    @ViewBuilder
    func momBabyWidgetContainerBackground<Background: View>(@ViewBuilder _ background: () -> Background) -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            self.containerBackground(for: .widget) {
                background()
            }
        } else {
            self.background(background())
        }
    }
}

struct MomBabyReminderEntry: TimelineEntry {
    let date: Date
    let snapshot: MomBabyFeedingSnapshot
}

struct MomBabyReminderProvider: TimelineProvider {
    func placeholder(in context: Context) -> MomBabyReminderEntry {
        MomBabyReminderEntry(
            date: Date(),
            snapshot: MomBabyFeedingSnapshot(
                hasReminder: true,
                nextAt: Date().addingTimeInterval(45 * 60),
                mode: "countdown",
                amountMl: 120,
                babyName: "宝贝",
                praise: "宝贝今天也闪闪发光",
                fixedHour: nil,
                fixedMinute: nil,
                updatedAt: Date()
            )
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (MomBabyReminderEntry) -> Void) {
        completion(MomBabyReminderEntry(date: Date(), snapshot: MomBabySharedStore.loadSnapshot()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<MomBabyReminderEntry>) -> Void) {
        let now = Date()
        let snapshot = MomBabySharedStore.loadSnapshot()
        let entry = MomBabyReminderEntry(date: now, snapshot: snapshot)

        if let nextDate = snapshot.effectiveNextDate(now: now) {
            completion(Timeline(entries: [entry], policy: .after(nextDate.addingTimeInterval(1))))
        } else {
            completion(Timeline(entries: [entry], policy: .after(now.addingTimeInterval(60 * 60))))
        }
    }
}

struct MomBabyFeedingWidgetView: View {
    let entry: MomBabyReminderEntry
    @Environment(\.widgetFamily) private var family
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        if family == .accessoryInline {
            accessoryInlineView
                .momBabyWidgetContainerBackground {
                    Color.clear
                }
        } else {
            widgetContent
                .momBabyWidgetContainerBackground {
                    widgetBackground
                }
        }
    }

    @ViewBuilder
    private var widgetContent: some View {
        if let targetDate = entry.snapshot.effectiveNextDate(now: entry.date) {
            if family == .accessoryRectangular {
                accessoryRectangularCountdownView(targetDate: targetDate)
            } else {
                countdownView(targetDate: targetDate)
            }
        } else if family == .accessoryRectangular {
            accessoryRectangularPraiseView
        } else {
            praiseView
        }
    }

    private func countdownView(targetDate: Date) -> some View {
        VStack(alignment: .leading, spacing: family == .systemSmall ? 8 : 10) {
            HStack(spacing: 6) {
                AppIconMark(size: 22)
                Text("距下次喂奶")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(MomBabyWidgetTheme.secondaryText(for: colorScheme))
            }

            Text(targetDate, style: .timer)
                .font(timerFont)
                .minimumScaleFactor(0.62)
                .monospacedDigit()
                .foregroundStyle(MomBabyWidgetTheme.primaryText(for: colorScheme))

            Text(entry.snapshot.amountMl > 0 ? "建议 \(entry.snapshot.amountMl) ml" : "\(entry.snapshot.displayName)的小提醒")
                .font(.caption.weight(.medium))
                .lineLimit(1)
                .foregroundStyle(MomBabyWidgetTheme.secondaryText(for: colorScheme))

            if family == .systemMedium {
                ProgressView(timerInterval: entry.date...targetDate, countsDown: true)
                    .tint(MomBabyWidgetTheme.accent(for: colorScheme))
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .padding()
    }

    private var praiseView: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                AppIconMark(size: 22)
                Text(entry.snapshot.displayName)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(MomBabyWidgetTheme.secondaryText(for: colorScheme))
            }

            Text(entry.snapshot.displayPraise)
                .font(praiseFont)
                .lineLimit(family == .accessoryRectangular ? 2 : 3)
                .minimumScaleFactor(0.72)
                .foregroundStyle(MomBabyWidgetTheme.primaryText(for: colorScheme))

            if family == .systemMedium {
                Text("没有下次喂奶提醒时，就把这一刻留给夸夸宝贝。")
                    .font(.caption)
                    .foregroundStyle(MomBabyWidgetTheme.secondaryText(for: colorScheme))
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .padding()
    }

    private func accessoryRectangularCountdownView(targetDate: Date) -> some View {
        VStack(alignment: .center, spacing: 4) {
            HStack(spacing: 5) {
                AppIconMark(size: 15)
                Text("下次喂奶")
                    .font(.caption2.weight(.semibold))
                    .lineLimit(1)
            }
            .foregroundStyle(MomBabyWidgetTheme.secondaryText(for: colorScheme))

            Text(targetDate, style: .timer)
                .font(.system(size: 25, weight: .heavy, design: .rounded))
                .minimumScaleFactor(0.58)
                .monospacedDigit()
                .lineLimit(1)
                .foregroundStyle(MomBabyWidgetTheme.primaryText(for: colorScheme))

            Text(entry.snapshot.amountMl > 0 ? "\(entry.snapshot.amountMl) ml" : entry.snapshot.displayName)
                .font(.caption2.weight(.medium))
                .lineLimit(1)
                .foregroundStyle(MomBabyWidgetTheme.secondaryText(for: colorScheme))
        }
        .multilineTextAlignment(.center)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
        .padding(.horizontal, 6)
    }

    private var accessoryRectangularPraiseView: some View {
        VStack(alignment: .center, spacing: 5) {
            AppIconMark(size: 16)

            Text(entry.snapshot.displayPraise)
                .font(.callout.weight(.bold))
                .lineLimit(2)
                .minimumScaleFactor(0.7)
                .foregroundStyle(MomBabyWidgetTheme.primaryText(for: colorScheme))
        }
        .multilineTextAlignment(.center)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
        .padding(.horizontal, 6)
    }

    @ViewBuilder
    private var accessoryInlineView: some View {
        HStack(spacing: 4) {
            AppIconMark(size: 12)

            if let targetDate = entry.snapshot.effectiveNextDate(now: entry.date) {
                Text(targetDate, style: .timer)
                    .monospacedDigit()
            } else {
                Text(entry.snapshot.displayPraise)
                    .lineLimit(1)
            }
        }
        .foregroundStyle(MomBabyWidgetTheme.primaryText(for: colorScheme))
    }

    private var widgetBackground: some View {
        LinearGradient(
            colors: MomBabyWidgetTheme.backgroundColors(for: colorScheme),
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    private var timerFont: Font {
        switch family {
        case .systemSmall:
            return .system(size: 31, weight: .bold, design: .rounded)
        default:
            return .system(size: 38, weight: .bold, design: .rounded)
        }
    }

    private var praiseFont: Font {
        switch family {
        case .accessoryRectangular:
            return .callout.weight(.bold)
        case .systemSmall:
            return .headline.weight(.bold)
        default:
            return .title3.weight(.bold)
        }
    }
}

struct MomBabyFeedingWidget: Widget {
    let kind = MomBabySharedStore.widgetKind

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: MomBabyReminderProvider()) { entry in
            MomBabyFeedingWidgetView(entry: entry)
        }
        .configurationDisplayName("沐奶时光")
        .description("显示下次喂奶倒计时；没有提醒时，给宝贝一句温柔夸奖。")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryInline, .accessoryRectangular])
    }
}

@available(iOSApplicationExtension 16.2, *)
struct MomBabyFeedingLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: MomBabyFeedingAttributes.self) { context in
            MomBabyLiveActivityContent(snapshot: context.state.snapshot)
                .activityBackgroundTint(MomBabyWidgetTheme.adaptiveActivityBackground)
                .activitySystemActionForegroundColor(MomBabyWidgetTheme.adaptiveAccent)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    dynamicIslandLeading(snapshot: context.state.snapshot)
                }

                DynamicIslandExpandedRegion(.trailing) {
                    dynamicIslandTimer(snapshot: context.state.snapshot)
                        .font(.headline.monospacedDigit())
                        .foregroundStyle(.white)
                }

                DynamicIslandExpandedRegion(.bottom) {
                    dynamicIslandBottom(snapshot: context.state.snapshot)
                        .foregroundStyle(.white)
                }
            } compactLeading: {
                AppIconMark(size: 18)
            } compactTrailing: {
                compactTimer(snapshot: context.state.snapshot)
                    .foregroundStyle(.white)
            } minimal: {
                AppIconMark(size: 15)
            }
        }
    }

    private func dynamicIslandLeading(snapshot: MomBabyFeedingSnapshot) -> some View {
        HStack(spacing: 7) {
            AppIconMark(size: 19)

            VStack(alignment: .leading, spacing: 2) {
                Text(snapshot.effectiveNextDate() == nil ? snapshot.displayName : "距下次喂奶时间")
                    .font(.caption.weight(.semibold))
                    .lineLimit(1)

                Text(dynamicIslandSuggestion(snapshot: snapshot))
                    .font(.caption2.weight(.medium))
                    .foregroundStyle(.white.opacity(0.76))
                    .lineLimit(1)
                    .minimumScaleFactor(0.78)
            }
        }
        .foregroundStyle(.white)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func dynamicIslandSuggestion(snapshot: MomBabyFeedingSnapshot) -> String {
        if snapshot.effectiveNextDate() == nil {
            return "宝贝今天也很棒"
        }

        return snapshot.amountMl > 0 ? "建议 \(snapshot.amountMl) ml" : "建议看看宝贝状态"
    }

    private func dynamicIslandTimer(snapshot: MomBabyFeedingSnapshot) -> some View {
        Group {
            if let targetDate = snapshot.effectiveNextDate() {
                Text(targetDate, style: .timer)
            } else {
                Text("真棒")
            }
        }
        .monospacedDigit()
    }

    private func compactTimer(snapshot: MomBabyFeedingSnapshot) -> some View {
        Group {
            if let targetDate = snapshot.effectiveNextDate() {
                Text(targetDate, style: .timer)
            } else {
                Text("棒")
            }
        }
        .font(.caption2.weight(.bold).monospacedDigit())
        .minimumScaleFactor(0.64)
        .lineLimit(1)
    }

    private func dynamicIslandBottom(snapshot: MomBabyFeedingSnapshot) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            if let targetDate = snapshot.effectiveNextDate() {
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text(snapshot.amountMl > 0 ? "\(snapshot.displayName)下次建议 \(snapshot.amountMl) ml" : "\(snapshot.displayName)的喂奶提醒")
                        .font(.caption.weight(.semibold))
                        .lineLimit(1)
                    Spacer(minLength: 0)
                    Text(targetDate, style: .timer)
                        .font(.caption.weight(.bold).monospacedDigit())
                        .lineLimit(1)
                }
                ProgressView(timerInterval: Date()...targetDate, countsDown: true)
                    .tint(MomBabyWidgetTheme.adaptiveAccent)
            } else {
                Text(snapshot.displayPraise)
                    .font(.caption.weight(.semibold))
                    .lineLimit(2)
            }
        }
    }
}

@available(iOSApplicationExtension 16.2, *)
private struct MomBabyLiveActivityContent: View {
    let snapshot: MomBabyFeedingSnapshot
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                AppIconMark(size: 32)

                VStack(alignment: .leading, spacing: 2) {
                    Text(snapshot.effectiveNextDate() == nil ? snapshot.displayName : "距下次喂奶")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(MomBabyWidgetTheme.secondaryText(for: colorScheme))
                    Text(snapshot.amountMl > 0 ? "建议 \(snapshot.amountMl) ml" : "到点记得看看宝贝")
                        .font(.caption2.weight(.medium))
                        .foregroundStyle(MomBabyWidgetTheme.secondaryText(for: colorScheme))
                }

                Spacer(minLength: 0)
            }

            if let targetDate = snapshot.effectiveNextDate() {
                Text(targetDate, style: .timer)
                    .font(.system(size: 38, weight: .heavy, design: .rounded))
                    .minimumScaleFactor(0.62)
                    .monospacedDigit()
                    .lineLimit(1)
                    .foregroundStyle(MomBabyWidgetTheme.primaryText(for: colorScheme))
                    .frame(maxWidth: .infinity, alignment: .center)

                ProgressView(timerInterval: Date()...targetDate, countsDown: true)
                    .tint(MomBabyWidgetTheme.accent(for: colorScheme))
            } else {
                Text(snapshot.displayPraise)
                    .font(.title3.weight(.bold))
                    .lineLimit(2)
                    .minimumScaleFactor(0.72)
                    .foregroundStyle(MomBabyWidgetTheme.primaryText(for: colorScheme))
                    .frame(maxWidth: .infinity, alignment: .center)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
    }
}

@main
struct MomBabyWidgetBundle: WidgetBundle {
    var body: some Widget {
        MomBabyFeedingWidget()
        MomBabyFeedingLiveActivity()
    }
}
