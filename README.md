# 沐奶时光

一个本地运行的 iOS 母婴喂奶记录 App。当前项目只保留一套 App 方案：SwiftUI 原生壳 + `WKWebView` 加载 App 内置的 `web/` 页面资源，不依赖 Expo development server。

> 🌐 **项目介绍页**：[ssdwgg.github.io/mombaby](https://ssdwgg.github.io/mombaby/)

## 当前版本

- iOS 工程：`ios/MomBaby/MomBaby.xcodeproj`
- App 页面：`web/index.html`、`web/styles.css`、`web/app.js`
- App 图标：`assets/mnsg.png`，并同步生成到 `web/` 和 `ios/MomBaby/MomBaby/Assets.xcassets/AppIcon.appiconset`

## 功能

- 记录每天 0 点到 24 点内每次喂奶的时间和奶量。
- 汇总今日总奶量、次数、平均奶量和最近一次喂奶时间。
- 设置每日定点喂奶提醒，提醒内容包含建议奶量。
- 设置单次倒计时喂奶提醒，提醒内容包含建议奶量。
- 可选择额外写入 iOS 提醒事项 App，作为系统提醒事项任务。
- 喂奶记录和提醒配置保存在手机本地。3
- 根据 0-30 月龄和性别展示身高体重参考、喂养奶量建议、行为表现和养育经验。

## 本地预览

运行一个只用于预览静态页面的本地服务：

```bash
npm run preview
```

然后打开：

```text
http://127.0.0.1:4173
```

浏览器预览可以查看界面和本地保存效果；真正的 iOS 通知提醒需要安装到 iPhone 后测试。

## 测试开屏页

- 首次安装或清空 App 数据后，开屏介绍会自动展示一次，并用 `localStorage` 的 `momBaby.launchSeen.v1` 标记是否已看过。
- 测试版可以在页面底部点击「预览开屏页」反复打开开屏介绍，不会改变首次展示标记。
- 如果要在真机上重新验证首次展示流程，删除手机上的 App 后再通过 Xcode Run 安装。

## 安装到 iPhone

1. 运行 `npm run ios` 打开 `ios/MomBaby/MomBaby.xcodeproj`。
2. 选择 `MomBaby` target，进入 `Signing & Capabilities`。
3. 勾选 `Automatically manage signing`。
4. Team 选择你的个人开发团队。
5. Bundle Identifier 保持 `com.renshuaiweidemac.mombabyfeeding`。
6. 连接 iPhone，选择真机，点击 Xcode 的 Run。

这个版本不使用 Push Notifications capability，只使用 iOS 本地通知，所以个人开发团队可以构建。第一次设置提醒时，系统会弹出通知权限请求。

## 图标

重新生成图标：

```bash
npm run icon
```

生成后重新用 Xcode 安装，手机桌面图标才会更新。

## 验证

```bash
npm run check
```
