const STORAGE_KEYS = {
  records: "momBaby.feedingRecords.v1",
  reminders: "momBaby.feedingReminders.v1",
  soundEnabled: "momBaby.reminderSoundEnabled.v1",
  reminderAppEnabled: "momBaby.reminderAppEnabled.v1",
  liveActivityEnabled: "momBaby.liveActivityEnabled.v1",
  babyProfile: "momBaby.babyProfile.v1",
  launchSeen: "momBaby.launchSeen.v1",
  cardOpacity: "momBaby.cardOpacity.v1",
  theme: "momBaby.theme.v1",
};

const quickAmounts = [60, 90, 120, 150, 180];
const quickReminderOptions = [120, 180, 240];
const amountRange = { min: 10, max: 300 };
const countdownRange = { min: 1, max: 12 * 60 };
const defaultDailyTargetMl = 900;
const historyWindowDays = 7;
const analysisWindowDays = 7;
const maxBackgroundBytes = 30 * 1024 * 1024;
const mediaDbName = "momBaby.media.v1";
const mediaStoreName = "media";
const babyBackgroundKey = "baby-background";
const guideAgeRange = { min: 0, max: 30 };
const cardOpacityRange = { min: 18, max: 86, defaultValue: 42 };
const initialBabyProfile = loadProfile();

const launchSteps = [
  {
    icon: "droplets",
    kicker: "功能概览",
    title: "记录、提醒、回看一处完成",
    copy: "把喂奶时间、奶量、快捷提醒和近几日趋势放在一个轻量入口里，照护交接时也能快速看清节奏。",
    points: ["喂奶记录", "定点提醒", "趋势分析"],
  },
  {
    icon: "heart",
    kicker: "核心价值观",
    title: "用心养育，用爱呵护每一处细节",
    copy: "记录不是为了制造压力，而是帮助家庭看见规律、理解波动，在每一次照护里更从容地回应宝宝。",
    points: ["尊重节奏", "关注趋势", "温和提醒"],
  },
  {
    icon: "shield",
    kicker: "隐私理念",
    title: "完全本地化运行，数据私有存储",
    copy: "喂奶记录、宝贝信息和背景照片都保存在本机，不上传到云端，尽量降低敏感数据泄露风险。",
    points: ["本机存储", "离线可用", "不上传数据"],
  },
];

const GROWTH_REFERENCES = {
  boy: {
    weight: [
      [0, 2.8, 3.5, 4.2], [1, 3.7, 4.6, 5.6], [2, 4.7, 5.8, 7.1], [3, 5.5, 6.8, 8.3],
      [4, 6.1, 7.5, 9.2], [5, 6.6, 8.0, 9.8], [6, 6.9, 8.4, 10.3], [7, 7.2, 8.8, 10.8],
      [8, 7.5, 9.1, 11.1], [9, 7.7, 9.4, 11.5], [10, 7.9, 9.6, 11.8], [11, 8.1, 9.8, 12.0],
      [12, 8.3, 10.1, 12.3], [13, 8.4, 10.3, 12.5], [14, 8.6, 10.5, 12.8], [15, 8.8, 10.7, 13.0],
      [16, 9.0, 10.9, 13.3], [17, 9.1, 11.1, 13.5], [18, 9.3, 11.3, 13.8], [19, 9.5, 11.5, 14.0],
      [20, 9.7, 11.7, 14.3], [21, 9.8, 11.9, 14.6], [22, 10.0, 12.2, 14.8], [23, 10.2, 12.4, 15.1],
      [24, 10.4, 12.6, 15.4], [27, 10.8, 13.1, 16.1], [30, 11.2, 13.7, 16.7],
    ],
    height: [
      [0, 47.6, 51.2, 54.8], [1, 51.3, 55.1, 59.0], [2, 54.9, 59.0, 63.0], [3, 58.0, 62.2, 66.4],
      [4, 60.5, 64.8, 69.1], [5, 62.5, 66.9, 71.3], [6, 64.2, 68.7, 73.2], [7, 65.7, 70.3, 74.9],
      [8, 67.1, 71.7, 76.4], [9, 68.3, 73.1, 77.8], [10, 69.5, 74.3, 79.1], [11, 70.7, 75.5, 80.4],
      [12, 71.7, 76.7, 81.6], [13, 72.8, 77.8, 82.8], [14, 73.8, 78.9, 84.0], [15, 74.8, 80.0, 85.1],
      [16, 75.8, 81.0, 86.3], [17, 76.8, 82.1, 87.4], [18, 77.7, 83.1, 88.5], [19, 78.6, 84.1, 89.6],
      [20, 79.6, 85.1, 90.6], [21, 80.5, 86.1, 91.7], [22, 81.4, 87.0, 92.7], [23, 82.2, 88.0, 93.7],
      [24, 82.4, 88.2, 94.0], [27, 84.8, 90.8, 96.8], [30, 87.0, 93.2, 99.4],
    ],
  },
  girl: {
    weight: [
      [0, 2.7, 3.3, 4.1], [1, 3.5, 4.3, 5.3], [2, 4.4, 5.4, 6.6], [3, 5.1, 6.2, 7.6],
      [4, 5.6, 6.9, 8.4], [5, 6.0, 7.4, 9.1], [6, 6.4, 7.8, 9.6], [7, 6.7, 8.1, 10.0],
      [8, 6.9, 8.4, 10.4], [9, 7.2, 8.7, 10.8], [10, 7.4, 9.0, 11.1], [11, 7.6, 9.2, 11.4],
      [12, 7.7, 9.4, 11.6], [13, 7.9, 9.6, 11.9], [14, 8.1, 9.8, 12.2], [15, 8.3, 10.0, 12.4],
      [16, 8.4, 10.3, 12.7], [17, 8.6, 10.5, 12.9], [18, 8.8, 10.7, 13.2], [19, 9.0, 10.9, 13.5],
      [20, 9.1, 11.1, 13.8], [21, 9.3, 11.3, 14.0], [22, 9.5, 11.5, 14.3], [23, 9.7, 11.7, 14.6],
      [24, 9.8, 11.9, 14.8], [27, 10.3, 12.5, 15.5], [30, 10.7, 13.0, 16.2],
    ],
    height: [
      [0, 46.8, 50.3, 53.8], [1, 50.4, 54.1, 57.8], [2, 53.8, 57.7, 61.6], [3, 56.7, 60.8, 64.8],
      [4, 59.1, 63.3, 67.4], [5, 61.0, 65.3, 69.6], [6, 62.7, 67.1, 71.5], [7, 64.2, 68.7, 73.1],
      [8, 65.6, 70.1, 74.7], [9, 66.8, 71.5, 76.1], [10, 68.1, 72.8, 77.5], [11, 69.2, 74.0, 78.8],
      [12, 70.4, 75.2, 80.1], [13, 71.4, 76.4, 81.4], [14, 72.5, 77.5, 82.6], [15, 73.5, 78.6, 83.8],
      [16, 74.6, 79.7, 84.9], [17, 75.5, 80.8, 86.1], [18, 76.5, 81.9, 87.2], [19, 77.5, 82.9, 88.3],
      [20, 78.4, 83.9, 89.4], [21, 79.3, 84.9, 90.4], [22, 80.2, 85.8, 91.5], [23, 81.1, 86.8, 92.5],
      [24, 81.2, 87.0, 92.8], [27, 83.6, 89.5, 95.5], [30, 85.7, 91.9, 98.1],
    ],
  },
};

const nativeCallbacks = new Map();
const speechCallbacks = new Map();
const exportCallbacks = new Map();
const widgetPraises = [
  "宝贝今天也闪闪发光",
  "宝贝被爱稳稳包围着",
  "宝贝每一天都在认真长大",
  "宝贝的节奏值得温柔守护",
  "宝贝今天也超级棒",
];
let toastTimer = 0;
let lastTouchEndAt = 0;
let launchPointerState = null;
let lastWidgetSnapshot = "";

const state = {
  activeTab: "feed",
  now: new Date(),
  records: loadArray(STORAGE_KEYS.records),
  reminders: loadArray(STORAGE_KEYS.reminders),
  amountMl: 120,
  recordAt: new Date(),
  reminderMode: "fixed",
  fixedHour: getDefaultFixedTime().hour,
  fixedMinute: getDefaultFixedTime().minute,
  countdownMinutes: 180,
  reminderAmountMl: 120,
  soundEnabled: loadBool(STORAGE_KEYS.soundEnabled, true),
  reminderAppEnabled: loadBool(STORAGE_KEYS.reminderAppEnabled, false),
  liveActivityEnabled: loadBool(STORAGE_KEYS.liveActivityEnabled, false),
  quickReminderEnabled: false,
  quickReminderMinutes: 180,
  selectedHistoryDate: dateKey(new Date()),
  selectedTimelineDate: dateKey(new Date()),
  voiceListening: "",
  voiceMenuOpen: false,
  voiceRecordStatus: "待识别",
  voiceReminderStatus: "待识别",
  profileOpen: false,
  launchOpen: !loadBool(STORAGE_KEYS.launchSeen, false),
  launchStepIndex: 0,
  launchPreviewMode: false,
  launchLoading: false,
  theme: loadTheme(),
  babyProfile: initialBabyProfile,
  guideAgeMonths: getGuideAgeFromProfile(initialBabyProfile),
  cardOpacity: loadNumber(
    STORAGE_KEYS.cardOpacity,
    cardOpacityRange.defaultValue,
    cardOpacityRange.min,
    cardOpacityRange.max
  ),
  backgroundMediaUrl: "",
  backgroundMediaType: "",
  customVisible: {
    recordAmount: false,
    recordTime: false,
    quickReminder: false,
    fixedTime: false,
    countdown: false,
    reminderAmount: false,
  },
};

document.addEventListener("DOMContentLoaded", () => {
  installZoomGuards();
  initTheme();
  applyCardOpacity(state.cardOpacity);
  render();
  hydrateBabyBackground();
  installLaunchGestures();
  document.body.addEventListener("click", handleClick);
  document.body.addEventListener("input", handleInput);
  document.body.addEventListener("change", handleChange);
  window.addEventListener("momBabyNativeNotification", handleNativeNotificationResult);
  window.addEventListener("momBabyNativeSpeech", handleNativeSpeechResult);
  window.addEventListener("momBabyNativeExport", handleNativeExportResult);

  setInterval(() => {
    state.now = new Date();
    state.recordAt = clampRecordTime(state.recordAt, state.now);
    render();
  }, 60 * 1000);
});

function handleClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const action = button.dataset.action;

  if (action === "open-profile") {
    openProfileSheet();
    return;
  }

  if (action === "close-profile") {
    closeProfileSheet();
    return;
  }

  if (action === "save-profile") {
    saveProfileFromForm();
    return;
  }

  if (action === "clear-baby-media") {
    clearBabyMedia();
    return;
  }

  if (action === "export-data") {
    exportData();
    return;
  }

  if (action === "import-data") {
    document.getElementById("importFileInput").click();
    return;
  }

  if (action === "set-theme") {
    const theme = button.dataset.theme;
    if (theme) {
      state.theme = theme;
      saveTheme(theme);
      applyTheme(theme);
      hydrateProfileForm();
    }
    return;
  }

  if (action === "open-launch-preview") {
    openLaunchPreview();
    return;
  }

  if (action === "skip-launch-screen") {
    if (state.launchLoading) return;
    closeLaunchScreen(!state.launchPreviewMode);
    return;
  }

  if (action === "prev-launch-step") {
    if (state.launchLoading) return;
    stepLaunchScreen(-1);
    return;
  }

  if (action === "next-launch-step") {
    if (state.launchLoading) return;
    stepLaunchScreen(1);
    return;
  }

  if (action === "toggle-voice-menu") {
    state.voiceMenuOpen = !state.voiceMenuOpen;
    renderVoiceControls();
    return;
  }

  if (action === "set-tab") {
    state.activeTab = button.dataset.tab;
    ensureSelectedHistoryDate();
    render();
    return;
  }

  if (action === "set-record-amount") {
    state.amountMl = Number(button.dataset.amount);
    state.customVisible.recordAmount = false;
    render();
    return;
  }

  if (action === "set-reminder-amount") {
    state.reminderAmountMl = Number(button.dataset.amount);
    state.customVisible.reminderAmount = false;
    render();
    return;
  }

  if (action === "show-custom-record-amount") {
    showCustomControl("recordAmount", "recordAmountInput");
    return;
  }

  if (action === "show-custom-record-time") {
    showCustomControl("recordTime", "recordTimeInput");
    return;
  }

  if (action === "show-custom-quick-reminder") {
    showCustomControl("quickReminder", "quickReminderInput");
    return;
  }

  if (action === "show-custom-fixed-time") {
    showCustomControl("fixedTime", "fixedTimeInput");
    return;
  }

  if (action === "show-custom-countdown") {
    showCustomControl("countdown", "countdownMinutesInput");
    return;
  }

  if (action === "show-custom-reminder-amount") {
    showCustomControl("reminderAmount", "reminderAmountInput");
    return;
  }

  if (action === "step-record-amount") {
    state.amountMl = clamp(state.amountMl + Number(button.dataset.delta), amountRange.min, amountRange.max);
    render();
    return;
  }

  if (action === "step-reminder-amount") {
    state.reminderAmountMl = clamp(state.reminderAmountMl + Number(button.dataset.delta), amountRange.min, amountRange.max);
    render();
    return;
  }

  if (action === "step-record-time") {
    state.recordAt = clampRecordTime(addMinutes(state.recordAt, Number(button.dataset.delta)), state.now);
    render();
    return;
  }

  if (action === "step-timeline-date") {
    changeTimelineDate(Number(button.dataset.delta));
    return;
  }

  if (action === "add-record") {
    addRecord();
    return;
  }

  if (action === "voice-record") {
    state.voiceMenuOpen = true;
    startVoiceIntent("record");
    return;
  }

  if (action === "voice-reminder") {
    state.voiceMenuOpen = true;
    startVoiceIntent("reminder");
    return;
  }

  if (action === "delete-record") {
    removeRecord(button.dataset.id);
    return;
  }

  if (action === "prepare-record-for-history-day") {
    prepareRecordForHistoryDay(button.dataset.date);
    return;
  }

  if (action === "set-mode") {
    state.reminderMode = button.dataset.mode;
    state.customVisible.fixedTime = false;
    state.customVisible.countdown = false;
    render();
    return;
  }

  if (action === "step-fixed-time") {
    changeFixedTime(Number(button.dataset.delta));
    render();
    return;
  }

  if (action === "step-countdown") {
    state.countdownMinutes = clamp(
      state.countdownMinutes + Number(button.dataset.delta),
      countdownRange.min,
      countdownRange.max
    );
    render();
    return;
  }

  if (action === "set-quick-reminder") {
    state.quickReminderMinutes = Number(button.dataset.minutes);
    state.customVisible.quickReminder = false;
    render();
    return;
  }

  if (action === "schedule-reminder") {
    scheduleReminder();
    return;
  }

  if (action === "delete-reminder") {
    removeReminder(button.dataset.id);
    return;
  }

  if (action === "select-history-day") {
    state.selectedHistoryDate = button.dataset.date;
    state.selectedTimelineDate = button.dataset.date;
    render();
    return;
  }

  if (action === "step-guide-age") {
    state.guideAgeMonths = clamp(
      state.guideAgeMonths + Number(button.dataset.delta),
      guideAgeRange.min,
      guideAgeRange.max
    );
    render();
  }
}

function handleInput(event) {
  const field = event.target.closest("[data-action]");
  if (!field) return;

  if (field.dataset.action === "set-card-opacity") {
    setCardOpacity(field.value);
    renderCardOpacityControl();
  }
}

function handleChange(event) {
  const field = event.target.closest("[data-action]");
  if (!field) return;

  const action = field.dataset.action;

  if (action === "set-custom-record-amount") {
    state.amountMl = sanitizeAmount(field.value, state.amountMl);
    render();
    return;
  }

  if (action === "set-custom-reminder-amount") {
    state.reminderAmountMl = sanitizeAmount(field.value, state.reminderAmountMl);
    render();
    return;
  }

  if (action === "set-custom-record-time") {
    setRecordTimeFromClock(field.value);
    render();
    return;
  }

  if (action === "set-custom-record-date") {
    setRecordDateFromKey(field.value);
    render();
    return;
  }

  if (action === "set-timeline-date") {
    setTimelineDateFromKey(field.value);
    return;
  }

  if (action === "set-custom-fixed-time") {
    setFixedTimeFromClock(field.value);
    render();
    return;
  }

  if (action === "set-custom-countdown") {
    state.countdownMinutes = sanitizeCountdown(field.value, state.countdownMinutes);
    render();
    return;
  }

  if (action === "set-custom-quick-reminder") {
    state.quickReminderMinutes = sanitizeMinutes(field.value, state.quickReminderMinutes, "提醒间隔");
    render();
    return;
  }

  if (action === "set-baby-media") {
    handleBabyMediaFile(field.files?.[0]);
    field.value = "";
    return;
  }

  if (action === "import-data-file") {
    const file = field.files?.[0];
    if (file) {
      importData(file).finally(() => {
        field.value = "";
      });
    }
    return;
  }

  if (action === "set-card-opacity") {
    setCardOpacity(field.value);
    renderCardOpacityControl();
    return;
  }

  if (action === "set-sound-enabled") {
    state.soundEnabled = Boolean(field.checked);
    saveBool(STORAGE_KEYS.soundEnabled, state.soundEnabled);
    render();
    return;
  }

  if (action === "set-reminder-app-enabled") {
    state.reminderAppEnabled = Boolean(field.checked);
    saveBool(STORAGE_KEYS.reminderAppEnabled, state.reminderAppEnabled);
    render();
    return;
  }

  if (action === "set-live-activity-enabled") {
    state.liveActivityEnabled = Boolean(field.checked);
    saveBool(STORAGE_KEYS.liveActivityEnabled, state.liveActivityEnabled);
    showToast(state.liveActivityEnabled ? "已开启灵动岛与锁屏提醒" : "已关闭灵动岛与锁屏提醒");
    render();
    return;
  }

  if (action === "set-quick-reminder-enabled") {
    state.quickReminderEnabled = Boolean(field.checked);
    if (!state.quickReminderEnabled) {
      state.customVisible.quickReminder = false;
    }
    render();
  }
}

function render() {
  state.records = sortRecords(state.records);
  state.reminders = sortReminders(state.reminders);

  const todayRecords = state.records.filter((record) => isToday(record.at, state.now));
  const todayTotal = todayRecords.reduce((sum, record) => sum + Number(record.amountMl), 0);
  const averageAmount = todayRecords.length > 0 ? Math.round(todayTotal / todayRecords.length) : 0;
  const lastRecord = todayRecords[0];
  const nextReminder = getNextReminder(state.reminders, state.now);
  const dailyTargetMl = getDailyTargetMl();

  setText("todayTotal", todayTotal);
  setText("todayCount", `${todayRecords.length} 次`);
  setText("lastRecord", lastRecord ? formatClock(new Date(lastRecord.at)) : "--:--");
  setText("averageAmount", averageAmount ? `${averageAmount} ml` : "--");
  setText("nextReminder", nextReminder ? formatShortReminder(nextReminder, state.now) : "--");
  syncWidgetState(nextReminder);
  document.getElementById("dailyProgress").style.width = `${Math.min(100, (todayTotal / dailyTargetMl) * 100)}%`;
  setText("todayTargetHint", getTodayTargetHint(todayTotal, dailyTargetMl));

  renderProfile();
  renderTabs();
  renderRecordControls();
  renderVoiceControls();
  renderReminderControls();
  renderTimeline();
  renderReminderList();
  renderHistory();
  renderAdvice();
  renderLaunchScreen();
}

function renderTabs() {
  document.getElementById("feedPanel").classList.toggle("is-hidden", state.activeTab !== "feed");
  document.getElementById("reminderPanel").classList.toggle("is-hidden", state.activeTab !== "reminders");
  document.getElementById("historyPanel").classList.toggle("is-hidden", state.activeTab !== "history");
  document.getElementById("advicePanel").classList.toggle("is-hidden", state.activeTab !== "advice");

  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tab === state.activeTab);
  });
}

function renderLaunchScreen() {
  const layer = document.getElementById("launchScreen");
  if (!layer) return;

  const step = launchSteps[state.launchStepIndex] || launchSteps[0];
  const lastStep = state.launchStepIndex === launchSteps.length - 1;

  layer.classList.toggle("is-hidden", !state.launchOpen);
  layer.setAttribute("aria-hidden", state.launchOpen ? "false" : "true");
  setText("launchModeLabel", state.launchPreviewMode ? "测试预览" : "首次介绍");
  setText("launchNextLabel", lastStep ? (state.launchPreviewMode ? "关闭预览" : "开始使用") : "下一步");
  setText("launchSkipButton", state.launchPreviewMode ? "关闭预览" : "跳过");
  setDisabled("launchPrevButton", state.launchStepIndex === 0);
  setDisabled("launchNextButton", false);
  setDisabled("launchSkipButton", false);

  const track = document.getElementById("launchTrack");
  if (track) {
    track.style.transform = `translateX(-${state.launchStepIndex * 100}%)`;
    track.innerHTML = launchSteps.map((item, index) => renderLaunchSlide(item, index)).join("");
  }

  const progress = document.getElementById("launchProgress");
  if (progress) {
    progress.innerHTML = launchSteps
      .map((_, index) => `<i class="${index === state.launchStepIndex ? "is-active" : ""}" aria-hidden="true"></i>`)
      .join("");
  }
}

function renderLaunchSlide(step, index) {
  const active = index === state.launchStepIndex;
  const isLast = index === launchSteps.length - 1;
  return `
    <section class="launch-slide${active ? " is-active" : ""}" aria-hidden="${active ? "false" : "true"}">
      <div class="launch-visual">
        <span><svg><use href="#icon-${step.icon}"></use></svg></span>
        <div>
          ${step.points.map((point) => `<em>${point}</em>`).join("")}
        </div>
      </div>
      <p class="launch-kicker">${step.kicker}</p>
      <h2>${step.title}</h2>
      <p class="launch-copy">${step.copy}</p>
      <div class="launch-points">
        ${step.points.map((point) => `<span><svg><use href="#icon-check"></use></svg>${point}</span>`).join("")}
      </div>
      ${isLast && active ? '<div class="launch-swipe-hint"><svg><use href="#icon-chevron-up"></use></svg><span>上滑开始使用</span></div>' : ""}
    </section>
  `;
}

function renderVoiceControls() {
  const listening = state.voiceListening;
  setText("voiceRecordStatus", listening === "record" ? "正在听..." : state.voiceRecordStatus);
  setText("voiceReminderStatus", listening === "reminder" ? "正在听..." : state.voiceReminderStatus);
  setDisabled("voiceRecordButton", Boolean(listening && listening !== "record"));
  setDisabled("voiceReminderButton", Boolean(listening && listening !== "reminder"));
  document.getElementById("voiceRecordButton")?.classList.toggle("is-listening", listening === "record");
  document.getElementById("voiceReminderButton")?.classList.toggle("is-listening", listening === "reminder");
  document.getElementById("voiceFabButton")?.classList.toggle("is-listening", Boolean(listening));
  document.getElementById("voiceFabMenu")?.classList.toggle("is-hidden", !state.voiceMenuOpen && !listening);
}

function renderProfile() {
  const profile = state.babyProfile;
  const name = profile.name || "宝贝";
  setText("babyProfileName", name);
  setText("babyProfileMeta", getBabyMeta(profile));
  renderBabyAvatar();
  document.getElementById("profileSheet")?.classList.toggle("is-hidden", !state.profileOpen);
  document.getElementById("profileSheet")?.setAttribute("aria-hidden", state.profileOpen ? "false" : "true");
  renderCardOpacityControl();
  renderMediaPreview();
}

function renderBabyAvatar() {
  const avatar = document.getElementById("babyAvatarPreview");
  if (!avatar) return;

  if (state.backgroundMediaUrl && state.backgroundMediaType.startsWith("image/")) {
    avatar.innerHTML = `<img src="${state.backgroundMediaUrl}" alt="">`;
    return;
  }

  avatar.innerHTML = `<img src="./app-icon.png" alt="">`;
}

function renderCardOpacityControl() {
  setInputValue("cardOpacityInput", state.cardOpacity);
  setText("cardOpacityValue", `${state.cardOpacity}%`);
}

function renderMediaPreview() {
  const preview = document.getElementById("babyMediaPreview");
  if (!preview) return;

  if (!state.backgroundMediaUrl) {
    preview.innerHTML = `
      <svg><use href="#icon-image"></use></svg>
      <span>背景板</span>
    `;
    return;
  }

  if (state.backgroundMediaType.startsWith("video/")) {
    preview.innerHTML = `<video src="${state.backgroundMediaUrl}" muted playsinline loop autoplay></video>`;
    return;
  }

  preview.innerHTML = `<img src="${state.backgroundMediaUrl}" alt="">`;
}

function getBabyMeta(profile) {
  const parts = [];
  if (profile.ageMonths !== "") {
    parts.push(`${profile.ageMonths}个月`);
  }
  if (profile.gender && profile.gender !== "unknown") {
    parts.push(profile.gender === "girl" ? "女宝" : "男宝");
  }
  return parts.join(" · ") || "点击配置";
}

function renderRecordControls() {
  setText("recordTimeDetail", formatShortDateTime(state.recordAt, state.now));
  setText("recordAmount", `${state.amountMl} ml`);
  setText("recordClock", formatClock(state.recordAt));
  setInputValue("recordAmountInput", state.amountMl);
  setInputValue("recordDateInput", dateKey(state.recordAt));
  setInputValue("recordTimeInput", formatClock(state.recordAt));
  setInputMax("recordDateInput", dateKey(state.now));
  setInputValue("quickReminderInput", state.quickReminderMinutes);
  setChecked("quickReminderEnabledInput", state.quickReminderEnabled);
  setText("quickReminderPreview", getQuickReminderPreview());
  toggleCustomControl("recordAmountCustom", state.customVisible.recordAmount);
  toggleCustomControl("recordTimeCustom", state.customVisible.recordTime);
  toggleCustomControl("quickReminderGrid", state.quickReminderEnabled);
  toggleCustomControl("quickReminderCustom", state.quickReminderEnabled && state.customVisible.quickReminder);
  renderAmountGrid(
    "recordAmountGrid",
    "set-record-amount",
    state.amountMl,
    "show-custom-record-amount",
    state.customVisible.recordAmount
  );
  renderQuickReminderGrid();
}

function renderReminderControls() {
  const fixedActive = state.reminderMode === "fixed";
  document.getElementById("fixedControls").classList.toggle("is-hidden", !fixedActive);
  document.getElementById("countdownControls").classList.toggle("is-hidden", fixedActive);
  document.querySelectorAll(".segment-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === state.reminderMode);
  });

  setText("reminderModeDetail", fixedActive ? "定点" : "倒计时");
  setText("fixedClock", `${pad(state.fixedHour)}:${pad(state.fixedMinute)}`);
  setText("countdownValue", formatDuration(state.countdownMinutes));
  setText("reminderAmount", `${state.reminderAmountMl} ml`);
  setText("fixedPreview", `下次 ${formatShortDateTime(nextDailyOccurrence(state.fixedHour, state.fixedMinute, state.now), state.now)}`);
  setText("countdownPreview", `预计 ${formatShortDateTime(addMinutes(state.now, state.countdownMinutes), state.now)}`);
  setInputValue("fixedTimeInput", `${pad(state.fixedHour)}:${pad(state.fixedMinute)}`);
  setInputValue("countdownMinutesInput", state.countdownMinutes);
  setInputValue("reminderAmountInput", state.reminderAmountMl);
  setChecked("soundEnabledInput", state.soundEnabled);
  setText("soundEnabledText", state.soundEnabled ? "开启" : "关闭");
  setChecked("reminderAppEnabledInput", state.reminderAppEnabled);
  setText("reminderAppEnabledText", state.reminderAppEnabled ? "开启，到点生成任务" : "关闭");
  setChecked("liveActivityEnabledInput", state.liveActivityEnabled);
  setText("liveActivityEnabledText", state.liveActivityEnabled ? "开启，显示实时倒计时" : "关闭");
  toggleCustomControl("fixedTimeCustom", state.customVisible.fixedTime);
  toggleCustomControl("countdownCustom", state.customVisible.countdown);
  toggleCustomControl("reminderAmountCustom", state.customVisible.reminderAmount);
  renderAmountGrid(
    "reminderAmountGrid",
    "set-reminder-amount",
    state.reminderAmountMl,
    "show-custom-reminder-amount",
    state.customVisible.reminderAmount
  );
}

function renderAmountGrid(containerId, action, activeAmount, customAction, customVisible) {
  const container = document.getElementById(containerId);
  const customActive = customVisible || !quickAmounts.includes(activeAmount);
  const amountButtons = quickAmounts
    .map((amount) => {
      const active = amount === activeAmount ? " is-active" : "";
      return `
        <button class="amount-chip${active}" data-action="${action}" data-amount="${amount}" aria-pressed="${amount === activeAmount}">
          <strong>${amount}</strong>
          <span>ml</span>
        </button>
      `;
    })
    .join("");

  container.innerHTML = `
    ${amountButtons}
    <button class="amount-chip amount-chip-custom${customActive ? " is-active" : ""}" data-action="${customAction}" aria-pressed="${customActive}">
      <strong>自定义</strong>
    </button>
  `;
}

function renderQuickReminderGrid() {
  const container = document.getElementById("quickReminderGrid");
  if (!container) return;

  const customActive = state.customVisible.quickReminder || !quickReminderOptions.includes(state.quickReminderMinutes);
  const optionButtons = quickReminderOptions
    .map((minutes) => {
      const active = minutes === state.quickReminderMinutes ? " is-active" : "";
      return `
        <button class="amount-chip quick-chip${active}" data-action="set-quick-reminder" data-minutes="${minutes}" aria-pressed="${minutes === state.quickReminderMinutes}">
          <strong>${formatDuration(minutes)}</strong>
        </button>
      `;
    })
    .join("");

  container.innerHTML = `
    ${optionButtons}
    <button class="amount-chip quick-chip amount-chip-custom${customActive ? " is-active" : ""}" data-action="show-custom-quick-reminder" aria-pressed="${customActive}">
      <strong>自定义</strong>
    </button>
  `;
}

function renderTimeline() {
  const timeline = document.getElementById("timeline");
  if (!timeline) return;

  state.selectedTimelineDate = normalizePastDateKey(state.selectedTimelineDate);
  const records = getRecordsForDay(state.selectedTimelineDate);
  const dayLabel = formatHistoryDayLabel(state.selectedTimelineDate);
  const isSelectedToday = state.selectedTimelineDate === dateKey(state.now);

  setText("timelineTitle", `${dayLabel}时间线`);
  setText("timelineDetail", records.length > 0 ? `${records.length} 次 · ${sumRecords(records)} ml` : "0点至24点");
  setInputValue("timelineDateInput", state.selectedTimelineDate);
  setInputMax("timelineDateInput", dateKey(state.now));
  setDisabled("timelineNextDayButton", isSelectedToday);

  if (records.length === 0) {
    timeline.innerHTML = `
      <div class="empty-state">
        <svg><use href="#icon-droplets"></use></svg>
        <span>${isSelectedToday ? "今天还没有喂奶记录" : `${dayLabel}没有喂奶记录`}</span>
      </div>
    `;
    return;
  }

  timeline.innerHTML = `
    <div class="timeline">
      ${records
        .map((record, index) => {
          const line = index < records.length - 1 ? '<div class="timeline-line"></div>' : "";
          return `
            <div class="timeline-row">
              <div class="timeline-marker-wrap">
                <div class="timeline-marker"></div>
                ${line}
              </div>
              <div class="timeline-content">
                <div>
                  <div class="timeline-time">${formatClock(new Date(record.at))}</div>
                  <div class="timeline-date">${dayLabel}第 ${records.length - index} 次</div>
                </div>
                <div class="record-amount">
                  <strong>${record.amountMl}</strong>
                  <span>ml</span>
                  <button class="icon-button is-danger" data-action="delete-record" data-id="${record.id}" aria-label="删除喂奶记录">
                    <svg><use href="#icon-trash"></use></svg>
                  </button>
                </div>
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderReminderList() {
  const list = document.getElementById("reminderList");
  setText("reminderCount", `${state.reminders.length} 条`);

  if (state.reminders.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <svg><use href="#icon-bell"></use></svg>
        <span>暂无喂奶提醒</span>
      </div>
    `;
    return;
  }

  list.innerHTML = `
    <div class="reminder-list">
      ${state.reminders
        .map((reminder) => {
          const isFixed = reminder.mode === "fixed";
          const completed = isReminderCompleted(reminder, state.now);
          const soundLabel = reminder.soundEnabled === false ? "静音" : "响铃";
          const reminderAppLabel = reminder.useReminderApp ? "提醒事项" : "本地通知";
          const title = isFixed
            ? `每天 ${pad(reminder.fixedTime?.hour ?? 0)}:${pad(reminder.fixedTime?.minute ?? 0)}`
            : `${formatDuration(reminder.countdownMinutes ?? 0)}后`;
          const icon = isFixed ? "icon-calendar" : "icon-timer";

          return `
            <div class="reminder-item${completed ? " is-completed" : ""}" data-mode="${reminder.mode}">
              <div class="reminder-icon">
                <svg><use href="#${icon}"></use></svg>
              </div>
              <div class="reminder-body">
                <div class="reminder-title">
                  <span>${title}</span>
                  ${completed ? '<strong class="status-badge">已提示完成</strong>' : ""}
                </div>
                <div class="reminder-meta">${reminder.amountMl} ml · ${soundLabel} · ${reminderAppLabel} · ${formatReminderStatus(reminder, state.now)}</div>
              </div>
              <button class="icon-button is-danger" data-action="delete-reminder" data-id="${reminder.id}" aria-label="取消喂奶提醒">
                <svg><use href="#icon-trash"></use></svg>
              </button>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderHistory() {
  const days = getHistoryDays();
  ensureSelectedHistoryDate(days);
  setText("historyDayCount", `${days.length} 天`);
  renderHistoryChart();
  renderFeedingAnalysis();
  renderHistoryDays(days);
  renderHistoryDetail(days);
}

function renderHistoryChart() {
  const container = document.getElementById("historyChart");
  if (!container) return;

  const targetMl = getDailyTargetMl();
  const days = getRecentDayKeys(historyWindowDays).map((key) => {
    const records = getRecordsForDay(key);
    return {
      key,
      total: sumRecords(records),
      count: records.length,
      hasData: records.length > 0,
    };
  });
  const maxTotal = Math.max(targetMl || 0, ...days.map((day) => day.total));

  const width = 360;
  const height = 224;
  const left = 48;
  const right = 22;
  const top = 28;
  const bottom = 40;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;

  const yMax = Math.max(maxTotal, 100);
  const points = days.map((day, index) => {
    const x = left + (chartWidth / Math.max(1, days.length - 1)) * index;
    const ratio = yMax > 0 ? day.total / yMax : 0;
    const y = top + chartHeight - ratio * chartHeight;
    const safeX = Number.isFinite(x) ? x : left;
    const safeY = Number.isFinite(y) ? y : top + chartHeight;
    return { ...day, x: safeX, y: safeY };
  });

  // Build path segments: only connect consecutive points that both have data
  const segments = [];
  let currentSegment = [];
  points.forEach((point, index) => {
    if (point.hasData) {
      currentSegment.push(point);
    } else {
      if (currentSegment.length >= 1) {
        segments.push([...currentSegment]);
      }
      currentSegment = [];
      if (index < points.length - 1) {
        const next = points[index + 1];
        if (next && next.hasData) {
          segments.push([point]);
        }
      }
    }
  });
  if (currentSegment.length >= 1) {
    segments.push(currentSegment);
  }

  const linePaths = segments
    .filter((seg) => seg.length > 1)
    .map((seg) => buildSmoothChartPath(seg));
  const areaPaths = segments
    .filter((seg) => seg.length > 1)
    .map((seg) => {
      const linePath = buildSmoothChartPath(seg);
      return `${linePath} L ${seg[seg.length - 1].x} ${top + chartHeight} L ${seg[0].x} ${top + chartHeight} Z`;
    });

  const gridLevels = [0.25, 0.5, 0.75].map((ratio) => ({
    y: top + chartHeight - ratio * chartHeight,
    label: Math.round(yMax * ratio) + "ml",
  }));
  const targetY = yMax > 0 ? top + chartHeight - (targetMl / yMax) * chartHeight : top;

  container.innerHTML = `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="最近7天奶量曲线">
      <defs>
        <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(246, 175, 160, 0.24)"></stop>
          <stop offset="100%" stop-color="rgba(246, 175, 160, 0.02)"></stop>
        </linearGradient>
      </defs>
      <rect class="chart-bg" x="1" y="1" width="${width - 2}" height="${height - 2}" rx="10"></rect>
      ${gridLevels
        .map(
          (grid) => `
            <line class="chart-grid" x1="${left}" y1="${grid.y}" x2="${width - right}" y2="${grid.y}"></line>
            <text class="chart-grid-label" x="${left - 6}" y="${grid.y + 3}">${grid.label}</text>
          `
        )
        .join("")}
      ${targetMl > 0 ? `
        <line class="chart-target" x1="${left}" y1="${targetY}" x2="${width - right}" y2="${targetY}"></line>
        <text class="chart-target-label" x="${width - right}" y="${targetY - 6}" text-anchor="end">建议${targetMl}ml</text>
      ` : ""}
      ${areaPaths.map((areaPath) => `<path class="chart-area" d="${areaPath}"></path>`).join("")}
      ${linePaths.map((linePath) => `<path class="chart-line" d="${linePath}"></path>`).join("")}
      ${points
        .map((point, index) => {
          const active = point.key === state.selectedHistoryDate ? " is-active" : "";
          const bandWidth = chartWidth / Math.max(1, points.length - 1);
          const hitX = index === 0 ? left - 12 : point.x - bandWidth / 2;
          const hitWidth = index === points.length - 1 ? width - right - hitX + 12 : bandWidth;
          const dotClass = point.hasData ? "chart-dot" : "chart-dot-muted";
          return `
            <g class="chart-day${active}" data-action="select-history-day" data-date="${point.key}">
              <rect class="chart-hit" x="${hitX}" y="0" width="${hitWidth}" height="${height}"></rect>
              <circle class="${dotClass}${active}" cx="${point.x}" cy="${point.y}" r="${active ? 5 : 4}"></circle>
              <text class="chart-total" x="${point.x}" y="${Math.max(20, point.y - 12)}">${point.hasData ? point.total : ""}</text>
              <text class="chart-label" x="${point.x}" y="${height - 14}">${formatChartDayLabel(point.key)}</text>
            </g>
          `;
        })
        .join("")}
    </svg>
  `;
}

function buildSmoothChartPath(points) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;

    const previous = points[index - 1];
    const controlX = previous.x + (point.x - previous.x) / 2;
    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
  }, "");
}

function renderFeedingAnalysis() {
  const container = document.getElementById("feedingAnalysis");
  if (!container) return;

  const analysis = buildFeedingAnalysis();
  setText("feedingAnalysisStatus", analysis.statusLabel);

  container.innerHTML = `
    <div class="analysis-diagnosis" data-level="${analysis.level}">
      <span>初步判断</span>
      <strong>${analysis.title}</strong>
      <em>${analysis.summary}</em>
    </div>
    <div class="analysis-metrics">
      ${renderAnalysisMetric("日均奶量", analysis.metrics.avgDailyTotalLabel, analysis.reference.totalLabel)}
      ${renderAnalysisMetric("日均次数", analysis.metrics.avgDailyCountLabel, analysis.reference.frequencyLabel)}
      ${renderAnalysisMetric("平均间隔", analysis.metrics.avgIntervalLabel, analysis.reference.intervalLabel)}
      ${renderAnalysisMetric("波动趋势", analysis.metrics.trendLabel, analysis.metrics.variationLabel)}
    </div>
    <div class="analysis-findings">
      ${analysis.findings
        .map(
          (item) => `
            <div class="analysis-finding" data-level="${item.level}">
              <strong>${item.title}</strong>
              <span>${item.body}</span>
            </div>
          `
        )
        .join("")}
    </div>
    <div class="analysis-suggestions">
      <strong>建议</strong>
      ${renderGuideList(analysis.suggestions)}
    </div>
    <div class="source-note">
      <strong>本地参考规则</strong>
      <span>${analysis.sourceNote}</span>
    </div>
    <p class="guide-warning">${analysis.warning}</p>
  `;
}

function renderAnalysisMetric(label, value, detail) {
  return `
    <div class="analysis-metric">
      <span>${label}</span>
      <strong>${value}</strong>
      <em>${detail}</em>
    </div>
  `;
}

function renderHistoryDays(days) {
  const container = document.getElementById("historyDays");
  if (!container) return;

  if (days.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg><use href="#icon-calendar"></use></svg>
        <span>暂无历史记录</span>
      </div>
    `;
    return;
  }

  container.innerHTML = days
    .map((day) => {
      const active = day.key === state.selectedHistoryDate ? " is-active" : "";
      return `
        <button class="history-day${active}" data-action="select-history-day" data-date="${day.key}">
          <span>
            <strong>${formatHistoryDayLabel(day.key)}</strong>
            <em>${day.count} 次 · 平均 ${day.average || "--"} ml</em>
          </span>
          <b>${day.total}<small>ml</small></b>
        </button>
      `;
    })
    .join("");
}

function renderHistoryDetail(days) {
  const container = document.getElementById("historyDetail");
  if (!container) return;

  const day = days.find((item) => item.key === state.selectedHistoryDate) || buildHistoryDay(state.selectedHistoryDate);
  if (!day) {
    setText("historyDetailTitle", "喂奶详情");
    setText("historyDetailSummary", "--");
    container.innerHTML = `
      <div class="empty-state">
        <svg><use href="#icon-notebook"></use></svg>
        <span>选择一天查看详情</span>
      </div>
    `;
    return;
  }

  setText("historyDetailTitle", `${formatHistoryDayLabel(day.key)}喂养详情`);
  setText("historyDetailSummary", `${day.total} ml · ${day.count} 次`);

  container.innerHTML = `
    <div class="history-summary">
      <div><span>总奶量</span><strong>${day.total} ml</strong></div>
      <div><span>喂奶次数</span><strong>${day.count} 次</strong></div>
      <div><span>平均奶量</span><strong>${day.average || "--"} ml</strong></div>
    </div>
    <div class="history-detail-actions">
      <button class="secondary-button" data-action="prepare-record-for-history-day" data-date="${day.key}">
        <svg><use href="#icon-plus"></use></svg>
        <span>补录这天</span>
      </button>
    </div>
    ${
      day.records.length === 0
        ? `<div class="empty-state"><svg><use href="#icon-droplets"></use></svg><span>这天没有喂奶记录</span></div>`
        : `<div class="history-records">
            ${day.records
              .map(
                (record, index) => `
                  <div class="history-record">
                    <span>${formatClock(new Date(record.at))}</span>
                    <em>第 ${day.records.length - index} 次</em>
                    <strong>${record.amountMl} ml</strong>
                  </div>
                `
              )
              .join("")}
          </div>`
    }
  `;
}

function renderAdvice() {
  const ageMonths = clamp(state.guideAgeMonths, guideAgeRange.min, guideAgeRange.max);
  const gender = state.babyProfile.gender;
  const growth = getGrowthReference(ageMonths, gender);
  const feeding = getFeedingGuide(ageMonths);
  const behavior = getBehaviorGuide(ageMonths);
  const care = getCareGuide(ageMonths);

  setText("guideAgeValue", `${ageMonths}个月`);
  setText("guideProfileHint", getGuideProfileHint(ageMonths));
  setText("guideSourceLabel", growth.genderLabel);
  setText("feedingGuideLabel", feeding.targetLabel);

  const growthContainer = document.getElementById("growthReference");
  if (growthContainer) {
    growthContainer.innerHTML = `
      ${renderGrowthCard("体重", `${formatNumber(growth.weight.median)} kg`, `${formatNumber(growth.weight.low)}-${formatNumber(growth.weight.high)} kg`, "P3-P97参考范围")}
      ${renderGrowthCard(growth.heightLabel, `${formatNumber(growth.height.median)} cm`, `${formatNumber(growth.height.low)}-${formatNumber(growth.height.high)} cm`, growth.note)}
    `;
  }

  const feedingContainer = document.getElementById("feedingGuide");
  if (feedingContainer) {
    feedingContainer.innerHTML = `
      <div class="guide-metric">
        <span>建议奶量</span>
        <strong>${feeding.targetLabel}</strong>
        <em>${feeding.frequency}</em>
      </div>
      ${renderGuideList(feeding.methods)}
      <p class="guide-note">${feeding.note}</p>
    `;
  }

  const behaviorContainer = document.getElementById("behaviorGuide");
  if (behaviorContainer) {
    behaviorContainer.innerHTML = `
      <div class="guide-tags">
        ${behavior.tags.map((tag) => `<span>${tag}</span>`).join("")}
      </div>
      ${renderGuideList(behavior.items)}
    `;
  }

  const careContainer = document.getElementById("careGuide");
  if (careContainer) {
    careContainer.innerHTML = `
      ${renderGuideList(care)}
      <div class="source-note">
        <strong>参考来源</strong>
        <span>国家卫健委儿童生长标准 WS/T 423-2022、婴幼儿喂养健康教育核心信息、婴幼儿营养喂养评估服务指南，以及 WHO 婴幼儿喂养公开建议。</span>
      </div>
      <p class="guide-warning">以上为健康儿童的一般参考，不替代儿保医生诊断。若出现体重连续偏离曲线、明显少尿、持续拒奶、呕吐腹泻、精神差或发育倒退，应及时就医。</p>
    `;
  }
}

function renderGrowthCard(label, value, range, detail) {
  return `
    <div class="growth-card">
      <span>${label}</span>
      <strong>${value}</strong>
      <em>${range}</em>
      <small>${detail}</small>
    </div>
  `;
}

function renderGuideList(items) {
  return `
    <ul class="guide-list">
      ${items.map((item) => `<li>${item}</li>`).join("")}
    </ul>
  `;
}

function buildFeedingAnalysis() {
  const todayKey = dateKey(state.now);
  const days = getRecentDayKeys(analysisWindowDays).map((key) => buildHistoryDay(key));
  const dataDays = days.filter((day) => day.count > 0 && day.key !== todayKey);
  const records = sortRecords(dataDays.flatMap((day) => day.records));
  const ageMonths = state.babyProfile.ageMonths === "" ? "" : Number(state.babyProfile.ageMonths);
  const reference = getFeedingAnalysisReference(ageMonths);
  const metrics = getFeedingMetrics(dataDays, records);
  const metricLabels = getAnalysisMetricLabels(metrics);
  const findings = [];
  const suggestions = [];
  let level = "good";
  let title = "趋势接近参考";
  let summary = dataDays.length > 0
    ? `近${analysisWindowDays}天有${dataDays.length}天记录，共${records.length}次。`
    : `近${analysisWindowDays}天暂无可分析的喂奶记录。`;

  const addFinding = (nextLevel, nextTitle, body) => {
    findings.push({ level: nextLevel, title: nextTitle, body });
    level = raiseAnalysisLevel(level, nextLevel);
  };
  const addSuggestion = (text) => {
    if (!suggestions.includes(text)) suggestions.push(text);
  };

  if (dataDays.length === 0) {
    title = "暂无分析样本";
    level = "neutral";
    addFinding("neutral", "记录不足", "至少记录2-3天后，才能判断总量、间隔和波动趋势。");
    addSuggestion("先连续记录2-3天，每次尽量保留奶量和时间，亲喂或漏记要在备注中区分。");
    return finalizeFeedingAnalysis({ level, title, summary, metrics, reference, findings, suggestions });
  }

  if (dataDays.length < 3) {
    level = raiseAnalysisLevel(level, "caution");
    addFinding("caution", "样本偏少", "当前记录天数较少，结论只适合做初步观察，不适合据此调整喂养方案。");
    addSuggestion("继续补足最近3-7天记录后再看趋势，单日少喝或多喝通常先观察精神、尿量和体重变化。");
  }

  if (!reference.hasAge) {
    title = "需要补充月龄";
    level = raiseAnalysisLevel(level, "caution");
    addFinding("caution", "未匹配月龄参考", "宝贝资料里尚未配置月龄，当前只能分析记录趋势，不能判断是否接近月龄奶量建议。");
    addSuggestion("在右上角宝贝信息里填写月龄，系统会按月龄匹配奶量、次数和辅食阶段建议。");
  } else {
    const lowDays = dataDays.filter((day) => day.total < reference.milkMin * 0.85).length;
    const highDays = dataDays.filter((day) => day.total > reference.milkMax * 1.15).length;

    if (metrics.avgDailyTotal < reference.milkMin * 0.85 && lowDays >= Math.min(2, dataDays.length)) {
      title = "奶量可能偏低";
      addFinding("warning", "日总量低于月龄参考", `近几天平均约${metricLabels.avgDailyTotalLabel}，低于${reference.totalLabel}。若存在亲喂、漏记或生病期，需要先确认记录完整性。`);
      addSuggestion("优先核对是否漏记亲喂、夜奶或少量补奶；同时观察24小时尿量、精神状态和近期体重增长。");
      addSuggestion("若连续低于参考并伴随少尿、精神差、持续拒奶或体重增长不理想，应尽快咨询儿保医生。");
    } else if (metrics.avgDailyTotal > reference.milkMax * 1.15 && highDays >= Math.min(2, dataDays.length)) {
      title = "奶量可能偏高";
      addFinding("warning", "日总量高于月龄参考", `近几天平均约${metricLabels.avgDailyTotalLabel}，高于${reference.totalLabel}。需结合饱足信号、辅食和体重曲线判断。`);
      addSuggestion("避免把奶作为唯一安抚方式，宝宝转头、闭嘴、推开奶瓶时不要继续强喂。");
      addSuggestion("若已添加辅食，注意不要让过多奶量挤占正餐和含铁辅食。");
    } else {
      addFinding("good", "日总量接近参考", `近几天平均约${metricLabels.avgDailyTotalLabel}，与${reference.totalLabel}整体接近。`);
      addSuggestion("继续按饥饿和饱足信号喂养，重点看连续趋势，不必追求每天完全一致。");
    }

    if (metrics.avgDailyCount > 0 && metrics.avgDailyCount < reference.countMin - 1) {
      addFinding("caution", "喂奶次数偏少", `日均约${metricLabels.avgDailyCountLabel}，少于${reference.frequencyLabel}，若总量也偏低，需要关注单次奶量和间隔。`);
      addSuggestion("可把白天喂奶节奏拆得更均匀，先小幅缩短间隔，不建议一次性大幅增加单次奶量。");
    } else if (metrics.avgDailyCount > reference.countMax + 1) {
      addFinding("caution", "喂奶次数偏多", `日均约${metricLabels.avgDailyCountLabel}，高于${reference.frequencyLabel}，需区分真实饥饿、安抚性吸吮和少量多次。`);
      addSuggestion("若频繁少量吃奶，可先排查含接不稳、奶嘴流速、胀气或睡前安抚依赖。");
    }
  }

  if (metrics.shortIntervalCount >= 2) {
    addFinding("caution", "短间隔较多", `有${metrics.shortIntervalCount}次间隔短于${formatDuration(reference.shortGapMinutes)}，可能是少量多次、安抚性喂奶或记录拆分。`);
    addSuggestion("短间隔反复出现时，先观察宝宝是否有饱足信号、胀气或需要安抚，不必每次哭闹都立即加奶。");
  }

  if (metrics.longIntervalCount >= 2) {
    addFinding("caution", "长间隔较多", `有${metrics.longIntervalCount}次间隔超过${formatDuration(reference.longGapMinutes)}，若发生在白天或同时总量偏低，需要关注。`);
    addSuggestion("长间隔后不要强行补偿性喂太多，可用接下来几次喂奶平稳补回总量。");
  }

  if (reference.hasAge && ageMonths >= 6 && metrics.nightCount >= dataDays.length * 1.5) {
    addFinding("caution", "夜间喂奶偏密", `近${analysisWindowDays}天夜间记录${metrics.nightCount}次，6月龄后可结合辅食和白天奶量逐步稳定夜间节奏。`);
    addSuggestion("如果夜奶影响白天进食或睡眠，可先增加白天规律奶和辅食，再逐步拉长夜间安抚间隔。");
  }

  if (metrics.variationRatio >= 0.3 && dataDays.length >= 3) {
    addFinding("caution", "日总量波动较大", `近几天日总量波动约${Math.round(metrics.variationRatio * 100)}%，可能与漏记、猛长期、疾病或作息变化有关。`);
    addSuggestion("先标记生病、外出、辅食变化等特殊日，再用连续3天平均值判断趋势。");
  }

  if (findings.every((item) => item.level === "good")) {
    title = "喂养节奏稳定";
    summary = `近${analysisWindowDays}天记录完整度尚可，总量和时间间隔未见明显异常信号。`;
  } else if (level === "caution") {
    summary = "有轻度可关注项，建议先补充记录并结合尿量、体重和精神状态观察。";
  } else if (level === "warning") {
    summary = "存在需要重点关注的喂养信号，建议核对记录并结合儿保指标判断。";
  }

  if (reference.hasAge && ageMonths >= 6) {
    addSuggestion("WHO和中国指南均强调满6月龄后及时添加安全、合适的辅食，奶量分析应与辅食质量一起看。");
  }

  return finalizeFeedingAnalysis({ level, title, summary, metrics, reference, findings, suggestions });
}

function finalizeFeedingAnalysis({ level, title, summary, metrics, reference, findings, suggestions }) {
  if (findings.length === 0) {
    findings.push({ level: "neutral", title: "等待更多记录", body: "记录越连续，趋势判断越可靠。" });
  }

  const metricLabels = getAnalysisMetricLabels(metrics);

  return {
    level,
    title,
    summary,
    metrics: metricLabels,
    reference,
    findings: findings.slice(0, 5),
    suggestions: suggestions.slice(0, 5),
    statusLabel: reference.hasAge ? reference.ageLabel : "需月龄",
    sourceNote: "依据WHO婴幼儿喂养建议、国家卫健委婴幼儿喂养健康教育核心信息及中国婴幼儿喂养建议，结合本机近7天记录生成。",
    warning: "仅为喂养记录的初步分析，不替代医疗诊断。若出现明显少尿、持续拒奶、呕吐腹泻、精神差、体重下降或生长曲线连续偏离，应及时就医。",
  };
}

function getAnalysisMetricLabels(metrics) {
  return {
    avgDailyTotalLabel: metrics.avgDailyTotal > 0 ? `${Math.round(metrics.avgDailyTotal)} ml` : "--",
    avgDailyCountLabel: metrics.avgDailyCount > 0 ? `${formatNumber(round1(metrics.avgDailyCount))} 次` : "--",
    avgIntervalLabel: metrics.avgIntervalMinutes > 0 ? formatDuration(Math.round(metrics.avgIntervalMinutes)) : "--",
    trendLabel: metrics.trendLabel,
    variationLabel: metrics.variationRatio > 0 ? `波动 ${Math.round(metrics.variationRatio * 100)}%` : "样本少",
  };
}

function getFeedingMetrics(dataDays, records) {
  const intervals = getFeedingIntervals(dataDays);
  const totals = dataDays.map((day) => day.total);
  const reference = getFeedingAnalysisReference(
    state.babyProfile.ageMonths === "" ? "" : Number(state.babyProfile.ageMonths)
  );
  const avgDailyTotal = average(totals);
  const avgDailyCount = average(dataDays.map((day) => day.count));
  const avgIntervalMinutes = average(intervals);
  const trendPercent = getTrendPercent(dataDays);
  const variationRatio = avgDailyTotal > 0 ? getStandardDeviation(totals) / avgDailyTotal : 0;

  return {
    avgDailyTotal,
    avgDailyCount,
    avgIntervalMinutes,
    variationRatio,
    trendLabel: formatTrendLabel(trendPercent),
    shortIntervalCount: intervals.filter((minutes) => minutes > 0 && minutes < reference.shortGapMinutes).length,
    longIntervalCount: intervals.filter((minutes) => minutes > reference.longGapMinutes).length,
    nightCount: records.filter((record) => isNightRecord(record)).length,
  };
}

function getFeedingAnalysisReference(ageMonths) {
  if (ageMonths === "") {
    return {
      hasAge: false,
      ageLabel: "未配置月龄",
      totalLabel: "需配置月龄",
      frequencyLabel: "按趋势观察",
      intervalLabel: "按记录估算",
      milkMin: 0,
      milkMax: Number.MAX_SAFE_INTEGER,
      countMin: 0,
      countMax: Number.MAX_SAFE_INTEGER,
      shortGapMinutes: 90,
      longGapMinutes: 6 * 60,
    };
  }

  const age = clamp(Number(ageMonths), guideAgeRange.min, guideAgeRange.max);
  if (age === 0) {
    return makeFeedingReference("新生儿", 500, 700, 8, 12, 60, 5 * 60);
  }
  if (age <= 2) {
    return makeFeedingReference(`${age}月龄`, age === 1 ? 600 : 700, age === 1 ? 700 : 800, 6, 8, 90, 5 * 60);
  }
  if (age <= 5) {
    return makeFeedingReference(`${age}月龄`, age <= 3 ? 800 : 850, age <= 3 ? 900 : 950, age <= 3 ? 5 : 4, age <= 3 ? 7 : 6, 105, 6 * 60);
  }
  if (age <= 7) {
    return makeFeedingReference(`${age}月龄`, age === 6 ? 800 : 700, age === 6 ? 1000 : 900, 4, 6, 120, 7 * 60);
  }
  if (age <= 11) {
    return makeFeedingReference(`${age}月龄`, age <= 8 ? 700 : 600, 800, age <= 8 ? 3 : 2, age <= 8 ? 5 : 4, 150, 8 * 60);
  }
  if (age <= 17) {
    return makeFeedingReference(`${age}月龄`, 600, 700, 2, 3, 180, 10 * 60);
  }
  if (age <= 24) {
    return makeFeedingReference(`${age}月龄`, 400, 600, 2, 3, 180, 11 * 60);
  }
  return makeFeedingReference(`${age}月龄`, 300, 500, 1, 2, 210, 12 * 60);
}

function makeFeedingReference(ageLabel, milkMin, milkMax, countMin, countMax, shortGapMinutes, longGapMinutes) {
  return {
    hasAge: true,
    ageLabel,
    totalLabel: `${milkMin}-${milkMax} ml/日参考`,
    frequencyLabel: `${countMin}-${countMax} 次/日参考`,
    intervalLabel: `${formatDuration(shortGapMinutes)}-${formatDuration(longGapMinutes)}关注`,
    milkMin,
    milkMax,
    countMin,
    countMax,
    shortGapMinutes,
    longGapMinutes,
  };
}

function getGuideProfileHint(ageMonths) {
  if (state.babyProfile.ageMonths === "") {
    return "可在右上角配置宝贝月龄";
  }

  return Number(state.babyProfile.ageMonths) === ageMonths ? "来自宝贝资料" : "手动查看月龄";
}

function getDailyTargetMl() {
  if (state.babyProfile.ageMonths === "") {
    return defaultDailyTargetMl;
  }

  return getFeedingGuide(Number(state.babyProfile.ageMonths)).targetMl || defaultDailyTargetMl;
}

function getTodayTargetHint(todayTotal, dailyTargetMl) {
  if (state.babyProfile.ageMonths === "") {
    return `今日参考目标暂按 ${defaultDailyTargetMl} ml，配置月龄后自动调整`;
  }

  const guide = getFeedingGuide(Number(state.babyProfile.ageMonths));
  const remaining = Math.max(0, dailyTargetMl - todayTotal);
  return remaining > 0
    ? `${guide.ageLabel}参考 ${guide.targetLabel}，今日还差约 ${remaining} ml`
    : `${guide.ageLabel}参考 ${guide.targetLabel}，今日已达到参考量`;
}

function getGuideAgeFromProfile(profile) {
  if (profile.ageMonths === "") return 0;
  return clamp(Number(profile.ageMonths), guideAgeRange.min, guideAgeRange.max);
}

function getGrowthReference(ageMonths, gender) {
  const safeAge = clamp(ageMonths, guideAgeRange.min, guideAgeRange.max);
  const genderKey = gender === "girl" || gender === "boy" ? gender : "unknown";
  const weight = getGrowthMetric(safeAge, genderKey, "weight");
  const height = getGrowthMetric(safeAge, genderKey, "height");
  const exact = weight.exact && height.exact;

  return {
    weight,
    height,
    genderLabel: genderKey === "boy" ? "男童参考" : genderKey === "girl" ? "女童参考" : "综合参考",
    heightLabel: safeAge < 24 ? "身长" : "身高",
    note: exact ? "P3-P97参考范围" : "24/27/30月节点估算",
  };
}

function getGrowthMetric(ageMonths, gender, metric) {
  if (gender === "boy" || gender === "girl") {
    return interpolateGrowth(GROWTH_REFERENCES[gender][metric], ageMonths);
  }

  const boy = interpolateGrowth(GROWTH_REFERENCES.boy[metric], ageMonths);
  const girl = interpolateGrowth(GROWTH_REFERENCES.girl[metric], ageMonths);
  return {
    low: round1((boy.low + girl.low) / 2),
    median: round1((boy.median + girl.median) / 2),
    high: round1((boy.high + girl.high) / 2),
    exact: boy.exact && girl.exact,
  };
}

function interpolateGrowth(series, ageMonths) {
  const exact = series.find((item) => item[0] === ageMonths);
  if (exact) {
    return { low: exact[1], median: exact[2], high: exact[3], exact: true };
  }

  const lower = [...series].reverse().find((item) => item[0] < ageMonths) || series[0];
  const upper = series.find((item) => item[0] > ageMonths) || series[series.length - 1];
  const ratio = (ageMonths - lower[0]) / Math.max(1, upper[0] - lower[0]);

  return {
    low: round1(lerp(lower[1], upper[1], ratio)),
    median: round1(lerp(lower[2], upper[2], ratio)),
    high: round1(lerp(lower[3], upper[3], ratio)),
    exact: false,
  };
}

function getFeedingGuide(ageMonths) {
  const age = clamp(ageMonths, guideAgeRange.min, guideAgeRange.max);

  if (age === 0) {
    return {
      ageLabel: "新生儿",
      targetMl: 600,
      targetLabel: "按需，约600 ml/日参考",
      frequency: "通常8-12次/日，少量多次",
      methods: [
        "优先按需母乳，观察觅食、吸吮、转头、手到口等饥饿信号。",
        "混合或配方喂养可从约30-60 ml/次逐步增加，满月附近常见约600-700 ml/日。",
        "每次喂后拍嗝，夜间不强行拉长间隔，尿量和体重增长比单次奶量更重要。",
      ],
      note: "出生早期奶量个体差异很大，早产、低出生体重、黄疸或体重下降明显时按儿保医生方案。",
    };
  }

  if (age <= 2) {
    return {
      ageLabel: `${age}月龄`,
      targetMl: age === 1 ? 650 : 760,
      targetLabel: age === 1 ? "约600-700 ml/日" : "约700-800 ml/日",
      frequency: "约6-8次/日，仍以奶为全部营养来源",
      methods: [
        "母乳喂养继续按需；配方奶可参考体重、饥饿信号和饱足表现调整。",
        "避免额外喂水、米汤、果汁或成人奶类，除非医生明确建议。",
        "记录24小时总量和尿布情况，单次波动不需要马上纠正。",
      ],
      note: "AAP 提到配方奶通常可按每日约2.5盎司/磅体重估算，且一般不超过约32盎司/日。",
    };
  }

  if (age <= 5) {
    return {
      ageLabel: `${age}月龄`,
      targetMl: age <= 3 ? 850 : 900,
      targetLabel: age <= 3 ? "约800-900 ml/日" : "约850-950 ml/日",
      frequency: age <= 3 ? "约5-7次/日" : "约4-6次/日",
      methods: [
        "继续纯母乳或合适配方奶喂养，通常不需要提前添加辅食。",
        "出现猛长期时可能短期更频繁吃奶，优先看总量、精神和尿量。",
        "喂养时保留停顿，宝宝转头、闭嘴、推开奶瓶时不要强喂。",
      ],
      note: "满6月龄前一般不把辅食作为常规营养来源；是否提前添加应由医生结合发育情况判断。",
    };
  }

  if (age <= 7) {
    return {
      ageLabel: `${age}月龄`,
      targetMl: age === 6 ? 900 : 820,
      targetLabel: age === 6 ? "800-1000 ml/日" : "约700-900 ml/日",
      frequency: "奶类约4-6次/日，辅食从1-2次逐步到2次",
      methods: [
        "满6月龄后开始添加辅食，优先富铁泥糊状食物，如强化铁米粉、肉泥、蛋黄等。",
        "一开始少量尝试，逐步增加种类和稠度，奶仍是主要能量来源。",
        "每次只新增一种常见过敏食物并观察，避免盐、糖、蜂蜜和整颗坚果。",
      ],
      note: "国家卫健委评估指南给出的6月龄奶量参考为800-1000 ml/日。",
    };
  }

  if (age <= 11) {
    return {
      ageLabel: `${age}月龄`,
      targetMl: age <= 8 ? 750 : 680,
      targetLabel: age <= 8 ? "700-800 ml/日" : "约600-800 ml/日",
      frequency: "奶类约3-5次/日，辅食2-3次/日",
      methods: [
        "辅食从泥糊逐步过渡到碎末、小颗粒和手指食物，练习咀嚼和自主抓握。",
        "每天安排谷物、蔬果和动物性食物，继续关注含铁食物。",
        "奶和辅食互相配合，不用辅食完全替代奶，也不要用奶挤掉所有正餐练习。",
      ],
      note: "8月龄国家卫健委参考奶量为700-800 ml/日，12月龄附近逐步到600-700 ml/日。",
    };
  }

  if (age <= 17) {
    return {
      ageLabel: `${age}月龄`,
      targetMl: 620,
      targetLabel: "约600-700 ml/日",
      frequency: "奶类约2-3次/日，三餐逐步成型",
      methods: [
        "1岁后逐步与家人一起进餐，食物做软、碎、淡，保留自主进食机会。",
        "继续母乳、配方奶或合适奶类；奶量过多可能影响正餐摄入。",
        "用固定餐椅和固定进餐节奏，少用零食、果汁安抚情绪。",
      ],
      note: "12月龄国家卫健委参考奶量为600-700 ml/日；家庭食物需适合宝宝咀嚼能力。",
    };
  }

  if (age <= 24) {
    return {
      ageLabel: `${age}月龄`,
      targetMl: 500,
      targetLabel: "400-600 ml/日",
      frequency: "饮奶2-3次/日，三餐两点更稳定",
      methods: [
        "把奶放在正餐和加餐节奏里，重点提升饭菜多样性和自主进食。",
        "每日安排谷薯、蔬果、蛋、肉禽鱼或豆制品，少盐少糖。",
        "不追着喂、不用屏幕喂饭，给孩子选择权，但由家长决定食物边界。",
      ],
      note: "18月龄和24月龄国家卫健委参考奶量为400-600 ml/日。",
    };
  }

  return {
    ageLabel: `${age}月龄`,
    targetMl: 400,
    targetLabel: "约300-500 ml/日",
    frequency: "三餐两点，饮奶可安排1-2次/日",
    methods: [
      "24-30月龄重点是规律三餐、食物多样和稳定作息，奶类作为钙和优质蛋白来源之一。",
      "逐步靠近家庭餐，但仍需少盐、少糖、少油，避免整颗坚果、硬糖等窒息风险。",
      "尊重食欲波动，连续几天看总摄入，不用每餐都达到同一量。",
    ],
    note: "24-36月龄幼儿应逐步适应家庭饮食；若明显偏食、体重增长异常，建议做儿保评估。",
  };
}

function getBehaviorGuide(ageMonths) {
  const age = clamp(ageMonths, guideAgeRange.min, guideAgeRange.max);

  if (age <= 1) {
    return {
      tags: ["睡眠多", "哭声沟通", "看脸听声"],
      items: [
        "会用哭声、觅食和肢体动作表达需求，抱起、轻声回应和规律喂养能帮助建立安全感。",
        "清醒时间短，适合短时间俯卧练习和面对面互动。",
        "重点观察吃奶力量、尿量、体重恢复和黄疸变化。",
      ],
    };
  }

  if (age <= 3) {
    return {
      tags: ["社会性微笑", "咿呀发声", "抬头练习"],
      items: [
        "开始更喜欢看照护者表情，会用笑和声音回应。",
        "每天安排短而频繁的趴玩，帮助颈背力量发展。",
        "喂养时容易分心或胀气，环境安静、节奏慢一些更稳。",
      ],
    };
  }

  if (age <= 5) {
    return {
      tags: ["翻身探索", "抓握入口", "笑声增多"],
      items: [
        "喜欢把手和玩具放进嘴里探索，注意清洁和小物件窒息风险。",
        "可能出现夜醒反复或吃奶节奏变化，先看白天总量和精神状态。",
        "用说话、唱歌和镜子互动，帮助语言和社交回应。",
      ],
    };
  }

  if (age <= 8) {
    return {
      tags: ["坐稳", "辅食探索", "认生"],
      items: [
        "开始练习坐、转移玩具和观察餐桌，适合引入口味和质地练习。",
        "认生和分离焦虑可能出现，固定照护流程会让孩子更安心。",
        "辅食不是比赛，少量、多次、重复暴露比一次吃很多更重要。",
      ],
    };
  }

  if (age <= 11) {
    return {
      tags: ["爬行扶站", "手指食物", "模仿声音"],
      items: [
        "活动能力快速提升，家中低处抽屉、插座、热水和小物件要重新排查。",
        "能练习用手抓软块食物，自主进食会弄脏但很有价值。",
        "会更明确表达喜欢和拒绝，尊重饱足信号有助于建立健康食欲。",
      ],
    };
  }

  if (age <= 17) {
    return {
      tags: ["学步", "指物", "模仿"],
      items: [
        "能听懂更多日常指令，适合用简单语言描述正在做的事情。",
        "独立意识增强，餐桌上可给两种健康选择，减少拉扯。",
        "每天留出户外活动和大运动时间，有助于食欲和睡眠。",
      ],
    };
  }

  if (age <= 23) {
    return {
      tags: ["跑跳尝试", "假装游戏", "情绪爆发"],
      items: [
        "情绪爆发常见，先共情和保证安全，再给简短规则。",
        "可以参与简单家务和餐前准备，增加对食物的熟悉感。",
        "语言理解快于表达，多给命名、等待和回应，不急着替孩子说完。",
      ],
    };
  }

  return {
    tags: ["短句表达", "边界测试", "自主进餐"],
    items: [
      "会更坚持自己的选择，固定作息、清楚边界和可预期流程很重要。",
      "可练习勺叉、开口杯和清理餐桌，不把吃多少作为奖惩。",
      "关注同伴游戏、语言组合和运动协调；若出现发育倒退，应及时评估。",
    ],
  };
}

function getCareGuide(ageMonths) {
  const age = clamp(ageMonths, guideAgeRange.min, guideAgeRange.max);
  const shared = [
    "每月龄建议只作为参考，看趋势比看某一天更重要：体重、身长/身高和头围应随访在相对稳定的曲线上。",
    "喂养记录可用24小时总量判断，不用因某一顿少喝立即补偿。",
  ];

  if (age < 6) {
    return [
      ...shared,
      "优先建立稳定的睡眠、喂养和安抚节奏；照护者疲惫时可以换手，不需要独自硬扛。",
      "不要用果汁、糖水或米汤替代奶；配方奶按说明冲调，不要擅自加浓。",
    ];
  }

  if (age < 12) {
    return [
      ...shared,
      "辅食先重视铁、质地和过敏观察，再追求食谱复杂度。",
      "让孩子坐直进食，不边走边吃；软块食物也要全程看护。",
    ];
  }

  if (age < 24) {
    return [
      ...shared,
      "让孩子参与抓握、舀取和选择，弄脏是学习的一部分。",
      "把奶、正餐和加餐排进固定节奏，减少用奶瓶或零食安抚情绪。",
    ];
  }

  return [
    ...shared,
    "保留三餐两点和户外活动，帮助孩子形成稳定食欲。",
    "少买高糖儿童零食和甜饮，把家庭餐做淡、软、小块，比单独购买“儿童食品”更可靠。",
  ];
}

async function addRecord() {
  const record = {
    id: makeId(),
    amountMl: state.amountMl,
    at: state.recordAt.toISOString(),
  };

  state.records = sortRecords([record, ...state.records]);
  state.selectedTimelineDate = dateKey(new Date(record.at));
  state.selectedHistoryDate = state.selectedTimelineDate;
  saveArray(STORAGE_KEYS.records, state.records);
  const quickReminderResult = state.quickReminderEnabled ? await scheduleQuickReminderForRecord(record) : undefined;
  state.now = new Date();
  const recordToast = getRecordToastLabel(record);
  state.recordAt = new Date();

  if (quickReminderResult?.scheduled && quickReminderResult?.reminderAppWarning === "reminder-app-denied") {
    showToast(`${recordToast}，下次提醒已设置；提醒事项权限未开启`);
  } else if (quickReminderResult?.scheduled && quickReminderResult?.reminderAppWarning) {
    showToast(`${recordToast}，下次提醒已设置；提醒事项未写入`);
  } else if (quickReminderResult?.scheduled) {
    showToast(`${recordToast}，下次提醒已设置`);
  } else if (quickReminderResult?.reason === "past") {
    showToast(`${recordToast}，快捷提醒时间已过`);
  } else if (quickReminderResult?.reason === "failed") {
    showToast(`${recordToast}，提醒设置失败`);
  } else {
    showToast(recordToast);
  }

  render();
}

function removeRecord(recordId) {
  state.records = state.records.filter((record) => record.id !== recordId);
  saveArray(STORAGE_KEYS.records, state.records);
  showToast("记录已删除");
  render();
}

function getRecordToastLabel(record) {
  const key = dateKey(new Date(record.at));
  if (isToday(record.at, state.now)) {
    return `已记录 ${record.amountMl} ml`;
  }

  return `已补录 ${formatHistoryDayLabel(key)} ${record.amountMl} ml`;
}

async function scheduleReminder() {
  const createdAt = new Date();
  const reminder = {
    id: makeId(),
    notificationId: makeId(),
    mode: state.reminderMode,
    amountMl: state.reminderAmountMl,
    createdAt: createdAt.toISOString(),
    repeats: state.reminderMode === "fixed",
    soundEnabled: state.soundEnabled,
    useReminderApp: state.reminderAppEnabled,
    reminderAppId: "",
  };

  if (state.reminderMode === "fixed") {
    reminder.fixedTime = { hour: state.fixedHour, minute: state.fixedMinute };
    reminder.nextAt = nextDailyOccurrence(state.fixedHour, state.fixedMinute, createdAt).toISOString();
  } else {
    reminder.countdownMinutes = state.countdownMinutes;
    reminder.nextAt = addMinutes(createdAt, state.countdownMinutes).toISOString();
  }

  const nativeResult = await sendNativeNotification({
    action: "schedule",
    id: reminder.notificationId,
    mode: reminder.mode,
    amountMl: reminder.amountMl,
    hour: reminder.fixedTime?.hour,
    minute: reminder.fixedTime?.minute,
    countdownMinutes: reminder.countdownMinutes,
    soundEnabled: reminder.soundEnabled,
    useReminderApp: reminder.useReminderApp,
  });

  if (hasNativeBridge() && !nativeResult.ok) {
    showToast(nativeResult.reason === "denied" ? "系统通知未开启" : "提醒设置失败");
    return false;
  }

  reminder.reminderAppId = nativeResult.reminderAppId || "";
  state.reminders = sortReminders([reminder, ...state.reminders]);
  saveArray(STORAGE_KEYS.reminders, state.reminders);
  showToast(getReminderScheduleToast(reminder, nativeResult));
  render();
  return true;
}

async function scheduleQuickReminderForRecord(record) {
  const createdAt = new Date();
  const nextAt = addMinutes(new Date(record.at), state.quickReminderMinutes);
  const secondsUntilReminder = Math.ceil((nextAt.getTime() - createdAt.getTime()) / 1000);

  if (secondsUntilReminder < 1) {
    return { scheduled: false, reason: "past" };
  }

  const reminder = {
    id: makeId(),
    notificationId: makeId(),
    mode: "countdown",
    amountMl: record.amountMl,
    createdAt: createdAt.toISOString(),
    countdownMinutes: state.quickReminderMinutes,
    nextAt: nextAt.toISOString(),
    repeats: false,
    soundEnabled: state.soundEnabled,
    useReminderApp: state.reminderAppEnabled,
    reminderAppId: "",
    source: "quick-record",
  };

  const nativeResult = await sendNativeNotification({
    action: "schedule",
    id: reminder.notificationId,
    mode: reminder.mode,
    amountMl: reminder.amountMl,
    countdownMinutes: reminder.countdownMinutes,
    countdownSeconds: secondsUntilReminder,
    soundEnabled: reminder.soundEnabled,
    useReminderApp: reminder.useReminderApp,
  });

  if (hasNativeBridge() && !nativeResult.ok) {
    return { scheduled: false, reason: "failed" };
  }

  reminder.reminderAppId = nativeResult.reminderAppId || "";
  state.reminders = sortReminders([reminder, ...state.reminders]);
  saveArray(STORAGE_KEYS.reminders, state.reminders);
  return { scheduled: true, reminderAppWarning: reminder.useReminderApp && !reminder.reminderAppId ? nativeResult.reason : "" };
}

function getReminderScheduleToast(reminder, nativeResult) {
  if (!reminder.useReminderApp) {
    return `提醒已设置 · ${reminder.amountMl} ml`;
  }

  if (!hasNativeBridge()) {
    return `提醒已设置 · ${reminder.amountMl} ml`;
  }

  if (nativeResult.reminderAppId) {
    return `提醒已设置 · 已写入提醒事项`;
  }

  if (nativeResult.reason === "reminder-app-denied") {
    return "提醒已设置，提醒事项权限未开启";
  }

  if (nativeResult.reason === "reminder-app-unavailable") {
    return "提醒已设置，未找到提醒事项列表";
  }

  if (nativeResult.reason === "reminder-app-error") {
    return "提醒已设置，提醒事项写入失败";
  }

  return `提醒已设置 · ${reminder.amountMl} ml`;
}

function removeReminder(reminderId) {
  const reminder = state.reminders.find((item) => item.id === reminderId);
  if (reminder) {
    sendNativeNotification({ action: "cancel", id: reminder.notificationId, reminderAppId: reminder.reminderAppId });
  }

  state.reminders = state.reminders.filter((item) => item.id !== reminderId);
  saveArray(STORAGE_KEYS.reminders, state.reminders);
  showToast("提醒已取消");
  render();
}

function openProfileSheet() {
  state.profileOpen = true;
  hydrateProfileForm();
  render();
}

function openLaunchPreview() {
  state.launchOpen = true;
  state.launchPreviewMode = true;
  state.launchStepIndex = 0;
  state.launchLoading = false;
  render();
}

function closeLaunchScreen(saveSeen) {
  if (saveSeen) {
    saveBool(STORAGE_KEYS.launchSeen, true);
  }

  state.launchOpen = false;
  state.launchPreviewMode = false;
  state.launchLoading = false;
  state.launchStepIndex = 0;
  render();
}

function finishLaunchScreen(saveSeen) {
  if (state.launchLoading) return;

  if (saveSeen) {
    saveBool(STORAGE_KEYS.launchSeen, true);
  }

  const layer = document.getElementById("launchScreen");
  if (layer) {
    layer.classList.add("is-fading-out");
    layer.addEventListener("transitionend", () => {
      closeLaunchScreen(false);
    }, { once: true });
  } else {
    closeLaunchScreen(false);
  }
}

function stepLaunchScreen(delta) {
  const nextIndex = state.launchStepIndex + delta;

  if (nextIndex < 0) {
    state.launchStepIndex = 0;
    render();
    return;
  }

  if (nextIndex >= launchSteps.length) {
    finishLaunchScreen(!state.launchPreviewMode);
    return;
  }

  state.launchStepIndex = nextIndex;
  render();
}

function closeProfileSheet() {
  state.profileOpen = false;
  render();
}

function hydrateProfileForm() {
  setInputValue("babyNameInput", state.babyProfile.name);
  setInputValue("babyAgeInput", state.babyProfile.ageMonths);
  setInputValue("babyGenderInput", state.babyProfile.gender || "unknown");
  setInputValue("babyNoteInput", state.babyProfile.note);
  renderCardOpacityControl();
  renderThemeSegmented();
}

function renderThemeSegmented() {
  document.querySelectorAll(".theme-segmented .segment-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.theme === state.theme);
  });
}

function saveProfileFromForm() {
  const profile = {
    ...state.babyProfile,
    name: readInputValue("babyNameInput").trim().slice(0, 12),
    ageMonths: sanitizeProfileAge(readInputValue("babyAgeInput")),
    gender: readInputValue("babyGenderInput") || "unknown",
    note: readInputValue("babyNoteInput").trim().slice(0, 24),
  };

  state.babyProfile = profile;
  state.guideAgeMonths = getGuideAgeFromProfile(profile);
  saveProfile(profile);
  state.profileOpen = false;
  showToast("宝贝信息已保存");
  render();
}

function sanitizeProfileAge(value) {
  if (value === "") return "";
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return "";
  return clamp(parsed, guideAgeRange.min, guideAgeRange.max);
}

async function handleBabyMediaFile(file) {
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("请选择照片");
    return;
  }

  if (file.size > maxBackgroundBytes) {
    showToast("背景文件需小于30MB");
    return;
  }

  try {
    await saveBabyMedia(file);
    state.babyProfile = {
      ...state.babyProfile,
      backgroundMediaType: file.type,
      backgroundMediaName: file.name,
    };
    saveProfile(state.babyProfile);
    applyBackgroundMedia(file, file.type);
    showToast("背景板已更新");
    render();
  } catch {
    showToast("背景保存失败");
  }
}

async function clearBabyMedia() {
  try {
    await deleteBabyMedia();
  } catch {
    // Deleting a missing local media item is harmless.
  }

  state.babyProfile = {
    ...state.babyProfile,
    backgroundMediaType: "",
    backgroundMediaName: "",
  };
  saveProfile(state.babyProfile);
  clearBackgroundMedia();
  showToast("背景板已移除");
  render();
}

async function hydrateBabyBackground() {
  try {
    const media = await getBabyMedia();
    if (!media?.blob) return;
    applyBackgroundMedia(media.blob, media.type || state.babyProfile.backgroundMediaType);
    render();
  } catch {
    clearBackgroundMedia();
  }
}

function applyBackgroundMedia(blob, type) {
  if (state.backgroundMediaUrl) {
    URL.revokeObjectURL(state.backgroundMediaUrl);
  }

  state.backgroundMediaUrl = URL.createObjectURL(blob);
  state.backgroundMediaType = type || blob.type || "";
  renderCustomBackground();
}

function setCardOpacity(value) {
  const parsed = Number.parseInt(value, 10);
  const next = Number.isNaN(parsed)
    ? cardOpacityRange.defaultValue
    : clamp(parsed, cardOpacityRange.min, cardOpacityRange.max);

  state.cardOpacity = next;
  localStorage.setItem(STORAGE_KEYS.cardOpacity, String(next));
  applyCardOpacity(next);
}

function applyCardOpacity(value) {
  const alpha = clamp(Number(value), cardOpacityRange.min, cardOpacityRange.max) / 100;
  const softAlpha = clamp(alpha * 0.48, 0.08, 0.42);
  const veilAlpha = clamp(alpha * 0.84, 0.14, 0.64);
  const controlAlpha = clamp(alpha * 0.58, 0.12, 0.5);
  const root = document.documentElement;

  root.style.setProperty("--card-alpha", alpha.toFixed(2));
  root.style.setProperty("--card-soft-alpha", softAlpha.toFixed(2));
  root.style.setProperty("--card-veil-alpha", veilAlpha.toFixed(2));
  root.style.setProperty("--control-alpha", controlAlpha.toFixed(2));
}

function clearBackgroundMedia() {
  if (state.backgroundMediaUrl) {
    URL.revokeObjectURL(state.backgroundMediaUrl);
  }

  state.backgroundMediaUrl = "";
  state.backgroundMediaType = "";
  renderCustomBackground();
}

function renderCustomBackground() {
  const container = document.getElementById("customBackground");
  if (!container) return;

  document.body.classList.toggle("has-custom-background", Boolean(state.backgroundMediaUrl));

  if (!state.backgroundMediaUrl) {
    container.innerHTML = "";
    return;
  }

  if (state.backgroundMediaType.startsWith("video/")) {
    container.innerHTML = `
      <video class="background-media-blur" src="${state.backgroundMediaUrl}" muted playsinline loop autoplay></video>
      <video class="background-media-focus" src="${state.backgroundMediaUrl}" muted playsinline loop autoplay></video>
    `;
    return;
  }

  container.innerHTML = `
    <img class="background-media-blur" src="${state.backgroundMediaUrl}" alt="">
    <img class="background-media-focus" src="${state.backgroundMediaUrl}" alt="">
  `;
}

async function startVoiceIntent(kind) {
  if (state.voiceListening) return;

  state.voiceListening = kind;
  setVoiceStatus(kind, "正在听...");

  const result = await requestSpeechText(kind);
  state.voiceListening = "";

  if (!result.ok) {
    const message = getSpeechErrorMessage(result.reason);
    setVoiceStatus(kind, message);
    showToast(message);
    renderVoiceControls();
    return;
  }

  const transcript = result.transcript.trim();
  if (!transcript) {
    setVoiceStatus(kind, "未识别到内容");
    showToast("未识别到内容");
    renderVoiceControls();
    return;
  }

  setVoiceStatus(kind, transcript);

  if (kind === "record") {
    await applyVoiceRecord(transcript);
  } else {
    await applyVoiceReminder(transcript);
  }
}

async function applyVoiceRecord(transcript) {
  const now = new Date();
  const parsed = parseVoiceRecord(transcript, now);
  if (!parsed) {
    setVoiceStatus("record", "未识别到奶量");
    showToast("未识别到奶量");
    renderVoiceControls();
    return;
  }

  state.now = now;
  state.amountMl = parsed.amountMl;
  state.recordAt = parsed.at;
  const recordedAt = new Date(parsed.at);
  await addRecord();
  const timeLabel = parsed.hasExplicitTime ? `${formatClock(recordedAt)} · ` : "";
  setVoiceStatus("record", `已识别 ${timeLabel}${parsed.amountMl} ml`);
  renderVoiceControls();
}

async function applyVoiceReminder(transcript) {
  const parsed = parseVoiceReminder(transcript);
  if (!parsed) {
    setVoiceStatus("reminder", "未识别到提醒时间");
    showToast("未识别到提醒时间");
    renderVoiceControls();
    return;
  }

  state.reminderAmountMl = parsed.amountMl;
  if (parsed.mode === "countdown") {
    state.reminderMode = "countdown";
    state.countdownMinutes = parsed.countdownMinutes;
    state.customVisible.countdown = false;
  } else {
    state.reminderMode = "fixed";
    state.fixedHour = parsed.hour;
    state.fixedMinute = parsed.minute;
    state.customVisible.fixedTime = false;
  }

  const scheduled = await scheduleReminder();
  if (scheduled) {
    const timeLabel = parsed.mode === "countdown" ? formatDuration(parsed.countdownMinutes) : `${pad(parsed.hour)}:${pad(parsed.minute)}`;
    setVoiceStatus("reminder", `已识别 ${timeLabel} · ${parsed.amountMl} ml`);
  }
}

function parseVoiceRecord(transcript, now = new Date()) {
  const text = normalizeVoiceText(transcript);
  const amountMl = extractAmount(text);
  if (!amountMl) return undefined;

  const clock = extractClockTime(text);
  const at = clock ? recordDateFromClock(clock, now, text) : new Date(now);

  return {
    amountMl,
    at: clampRecordTime(at, now),
    hasExplicitTime: Boolean(clock),
  };
}

function parseVoiceReminder(transcript) {
  const text = normalizeVoiceText(transcript);
  const amountMl = extractAmount(text) || state.reminderAmountMl;
  const countdownMinutes = extractRelativeMinutes(text);

  if (countdownMinutes) {
    return {
      mode: "countdown",
      amountMl,
      countdownMinutes: clamp(countdownMinutes, countdownRange.min, countdownRange.max),
    };
  }

  const clock = extractClockTime(text);
  if (!clock) return undefined;

  return {
    mode: "fixed",
    amountMl,
    hour: clock.hour,
    minute: clock.minute,
  };
}

function extractAmount(transcript) {
  const text = normalizeVoiceText(transcript);
  const unitPattern = /(\d{1,3}|[零〇一二两三四五六七八九十百]{1,6})\s*(毫升|毫|ml|m l)/gi;
  const unitMatch = firstValidNumberMatch(text, unitPattern);
  if (unitMatch) return unitMatch;

  const amountHintPattern = /(奶量|奶|喝了|喂了|记录|提醒)\s*(\d{1,3}|[零〇一二两三四五六七八九十百]{1,6})/gi;
  let hintedMatch;
  while ((hintedMatch = amountHintPattern.exec(text))) {
    const value = parseSpokenNumber(hintedMatch[2]);
    if (isValidAmount(value)) return value;
  }

  const candidates = [];
  const numberPattern = /(\d{1,3}|[零〇一二两三四五六七八九十百]{1,6})/g;
  let match;
  while ((match = numberPattern.exec(text))) {
    const after = text.slice(match.index + match[0].length, match.index + match[0].length + 3);
    if (/小时|分钟|点|时/.test(after)) continue;

    const value = parseSpokenNumber(match[1]);
    if (isValidAmount(value)) {
      candidates.push(value);
    }
  }

  return candidates[candidates.length - 1];
}

function firstValidNumberMatch(text, pattern) {
  let match;
  while ((match = pattern.exec(text))) {
    const value = parseSpokenNumber(match[1]);
    if (isValidAmount(value)) return value;
  }
  return undefined;
}

function extractRelativeMinutes(transcript) {
  const text = normalizeVoiceText(transcript);
  const numberToken = "(\\d{1,3}|[零〇一二两三四五六七八九十百]{1,6})";
  const hourHalfPattern = new RegExp(`${numberToken}\\s*(个)?半小时`, "i");
  const hourHalfMatch = hourHalfPattern.exec(text);
  if (hourHalfMatch) {
    return parseSpokenNumber(hourHalfMatch[1]) * 60 + 30;
  }

  let minutes = 0;
  let found = false;

  if (/半小时/.test(text)) {
    minutes += 30;
    found = true;
  }

  const hourPattern = new RegExp(`${numberToken}\\s*(个)?(小时|钟头)(半)?`, "i");
  const hourMatch = hourPattern.exec(text);
  if (hourMatch) {
    minutes += parseSpokenNumber(hourMatch[1]) * 60 + (hourMatch[4] ? 30 : 0);
    found = true;
  }

  const minutePattern = new RegExp(`${numberToken}\\s*分钟`, "i");
  const minuteMatch = minutePattern.exec(text);
  if (minuteMatch) {
    minutes += parseSpokenNumber(minuteMatch[1]);
    found = true;
  }

  return found ? minutes : undefined;
}

function extractClockTime(transcript) {
  const text = normalizeVoiceText(transcript);
  const colonMatch = /(\d{1,2})[:：](\d{1,2})/.exec(text);
  if (colonMatch) {
    return normalizeMeridiem(Number(colonMatch[1]), Number(colonMatch[2]), text);
  }

  const numberToken = "(\\d{1,2}|[零〇一二两三四五六七八九十]{1,4})";
  const clockPattern = new RegExp(`${numberToken}\\s*(点|时)(半|${numberToken}\\s*分?)?`, "i");
  const match = clockPattern.exec(text);
  if (!match) return undefined;

  const hour = parseSpokenNumber(match[1]);
  let minute = 0;
  if (match[3] === "半") {
    minute = 30;
  } else if (match[4]) {
    minute = parseSpokenNumber(match[4]);
  }

  return normalizeMeridiem(hour, minute, text);
}

function normalizeMeridiem(hour, minute, text) {
  let nextHour = clamp(hour, 0, 23);
  const nextMinute = clamp(minute, 0, 59);

  if (/(下午|晚上|今晚|傍晚)/.test(text) && nextHour < 12) {
    nextHour += 12;
  }

  if (/中午/.test(text) && nextHour < 11) {
    nextHour += 12;
  }

  if (/(凌晨|早上|上午)/.test(text) && nextHour === 12) {
    nextHour = 0;
  }

  return { hour: nextHour, minute: nextMinute };
}

function recordDateFromClock(clock, now, text = "") {
  const at = new Date(now);
  if (/前天/.test(text)) {
    at.setDate(at.getDate() - 2);
  } else if (/(昨天|昨晚)/.test(text)) {
    at.setDate(at.getDate() - 1);
  }
  at.setHours(clock.hour, clock.minute, 0, 0);
  if (!/(昨天|昨晚|前天)/.test(text) && at > now) {
    at.setDate(at.getDate() - 1);
  }
  return at;
}

function normalizeVoiceText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[，。！？、,.!?]/g, " ")
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 65248))
    .replace(/\s+/g, " ")
    .trim();
}

function parseSpokenNumber(value) {
  const text = String(value || "").trim();
  if (/^\d+$/.test(text)) return Number(text);

  const normalized = text.replace(/[〇两]/g, (char) => (char === "两" ? "二" : "零"));
  const digitMap = { 零: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };

  if (/^[零一二三四五六七八九]+$/.test(normalized) && normalized.length > 1) {
    return Number([...normalized].map((char) => digitMap[char]).join(""));
  }

  const hundredShort = /^([一二三四五六七八九])百([一二三四五六七八九])$/.exec(normalized);
  if (hundredShort) {
    return digitMap[hundredShort[1]] * 100 + digitMap[hundredShort[2]] * 10;
  }

  let total = 0;
  let current = 0;
  [...normalized].forEach((char) => {
    if (digitMap[char] !== undefined) {
      current = digitMap[char];
      return;
    }

    if (char === "十") {
      total += (current || 1) * 10;
      current = 0;
      return;
    }

    if (char === "百") {
      total += (current || 1) * 100;
      current = 0;
    }
  });

  return total + current;
}

function isValidAmount(value) {
  return Number.isInteger(value) && value >= amountRange.min && value <= amountRange.max;
}

function changeFixedTime(deltaMinutes) {
  const value = new Date();
  value.setHours(state.fixedHour, state.fixedMinute, 0, 0);
  value.setMinutes(value.getMinutes() + deltaMinutes);
  state.fixedHour = value.getHours();
  state.fixedMinute = value.getMinutes();
}

function setRecordTimeFromClock(value) {
  const parsed = parseClockValue(value);
  if (!parsed) return;

  const next = new Date(state.recordAt);
  next.setHours(parsed.hour, parsed.minute, 0, 0);

  if (next > state.now) {
    state.recordAt = new Date(state.now);
    showToast("记录时间不能晚于当前时间");
    return;
  }

  state.recordAt = clampRecordTime(next, state.now);
}

function setRecordDateFromKey(value) {
  const date = dateFromInputValue(value);
  if (!date) return;

  const next = new Date(date);
  next.setHours(state.recordAt.getHours(), state.recordAt.getMinutes(), 0, 0);

  if (next > state.now) {
    state.recordAt = new Date(state.now);
    showToast("记录时间不能晚于当前时间");
    return;
  }

  state.recordAt = clampRecordTime(next, state.now);
}

function prepareRecordForHistoryDay(key) {
  const date = dateFromInputValue(key);
  if (!date) return;

  const next = new Date(date);
  const latestRecord = getRecordsForDay(key)[0];

  if (isSameDay(date, state.now)) {
    next.setHours(state.now.getHours(), state.now.getMinutes(), 0, 0);
  } else if (latestRecord) {
    const suggested = addMinutes(new Date(latestRecord.at), 180);
    if (dateKey(suggested) === key) {
      next.setHours(suggested.getHours(), suggested.getMinutes(), 0, 0);
    } else {
      next.setHours(23, 30, 0, 0);
    }
  } else {
    next.setHours(23, 30, 0, 0);
  }

  state.activeTab = "feed";
  state.recordAt = clampRecordTime(next, state.now);
  state.customVisible.recordTime = true;
  showToast(`已切到${formatHistoryDayLabel(key)}补录`);
  render();
}

function setFixedTimeFromClock(value) {
  const parsed = parseClockValue(value);
  if (!parsed) return;

  state.fixedHour = parsed.hour;
  state.fixedMinute = parsed.minute;
}

function getQuickReminderPreview() {
  if (!state.quickReminderEnabled) {
    return "关闭";
  }

  const nextAt = addMinutes(state.recordAt, state.quickReminderMinutes);
  const label = formatDuration(state.quickReminderMinutes);

  if (nextAt <= state.now) {
    return `${label}后 · 时间已过`;
  }

  return `${label}后 · ${formatShortDateTime(nextAt, state.now)}`;
}

function showCustomControl(key, inputId) {
  state.customVisible[key] = true;
  render();
  window.setTimeout(() => {
    const input = document.getElementById(inputId);
    input?.focus();
    input?.select?.();
  }, 0);
}

function toggleCustomControl(id, visible) {
  document.getElementById(id)?.classList.toggle("is-hidden", !visible);
}

function sanitizeAmount(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  const next = clamp(parsed, amountRange.min, amountRange.max);
  if (next !== parsed) {
    showToast(`奶量范围 ${amountRange.min}-${amountRange.max} ml`);
  }
  return next;
}

function sanitizeCountdown(value, fallback) {
  return sanitizeMinutes(value, fallback, "倒计时");
}

function sanitizeMinutes(value, fallback, label) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  const next = clamp(parsed, countdownRange.min, countdownRange.max);
  if (next !== parsed) {
    showToast(`${label}范围 ${countdownRange.min}-${countdownRange.max} 分钟`);
  }
  return next;
}

function parseClockValue(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return undefined;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return undefined;

  return { hour, minute };
}

function installZoomGuards() {
  document.addEventListener(
    "touchend",
    (event) => {
      const now = Date.now();
      if (now - lastTouchEndAt <= 320) {
        event.preventDefault();
      }
      lastTouchEndAt = now;
    },
    { passive: false }
  );

  document.addEventListener(
    "gesturestart",
    (event) => {
      event.preventDefault();
    },
    { passive: false }
  );
}

function installLaunchGestures() {
  const carousel = document.getElementById("launchCarousel");
  if (!carousel) return;

  carousel.addEventListener("pointerdown", (event) => {
    if (!state.launchOpen || state.launchLoading || event.button > 0) return;

    launchPointerState = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      deltaX: 0,
      deltaY: 0,
      axis: "",
      moved: false,
    };
    carousel.classList.add("is-dragging");
    carousel.setPointerCapture?.(event.pointerId);
  });

  carousel.addEventListener("pointermove", (event) => {
    if (!launchPointerState || launchPointerState.id !== event.pointerId) return;

    const deltaX = event.clientX - launchPointerState.startX;
    const deltaY = event.clientY - launchPointerState.startY;
    launchPointerState.deltaX = deltaX;
    launchPointerState.deltaY = deltaY;
    launchPointerState.moved = true;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    if (!launchPointerState.axis && Math.max(absX, absY) > 8) {
      launchPointerState.axis = absX >= absY ? "x" : "y";
    }

    const track = document.getElementById("launchTrack");
    if (track) {
      const baseOffset = state.launchStepIndex * 100;
      track.style.transition = "none";
      if (launchPointerState.axis === "x") {
        const carouselWidth = carousel.getBoundingClientRect().width;
        const dragRatio = carouselWidth > 0 ? (deltaX / carouselWidth) * 100 : 0;
        track.style.transform = `translateX(-${baseOffset - dragRatio}%)`;
      } else {
        track.style.transform = `translateX(-${baseOffset}%)`;
      }
    }
  });

  carousel.addEventListener("pointerup", (event) => finishLaunchGesture(event, carousel));
  carousel.addEventListener("pointercancel", () => {
    launchPointerState = null;
    const track = document.getElementById("launchTrack");
    if (track) {
      track.style.transition = "";
      track.style.transform = `translateX(-${state.launchStepIndex * 100}%)`;
    }
    carousel.classList.remove("is-dragging");
  });

  carousel.addEventListener("keydown", (event) => {
    if (!state.launchOpen || state.launchLoading) return;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      stepLaunchScreen(-1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      stepLaunchScreen(1);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      stepLaunchScreen(-1);
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      stepLaunchScreen(1);
    }
  });
}

function finishLaunchGesture(event, carousel) {
  if (!launchPointerState || launchPointerState.id !== event.pointerId) return;

  const deltaX = launchPointerState.deltaX || 0;
  const deltaY = launchPointerState.deltaY || 0;
  launchPointerState = null;
  carousel.classList.remove("is-dragging");

  const track = document.getElementById("launchTrack");
  if (track) {
    track.style.transition = "";
    track.style.transform = `translateX(-${state.launchStepIndex * 100}%)`;
  }

  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  if (absY >= 46 && absY > absX * 1.2) {
    stepLaunchScreen(deltaY < 0 ? 1 : -1);
    return;
  }

  if (absX >= 46 && absX > absY * 1.25) {
    stepLaunchScreen(deltaX < 0 ? 1 : -1);
  }
}

function setVoiceStatus(kind, message) {
  if (kind === "record") {
    state.voiceRecordStatus = message;
  } else {
    state.voiceReminderStatus = message;
  }
  renderVoiceControls();
}

function requestSpeechText(kind) {
  if (hasNativeSpeechBridge()) {
    return sendNativeSpeech({ action: "start", context: kind });
  }

  return requestBrowserSpeech();
}

function sendNativeSpeech(payload) {
  return new Promise((resolve) => {
    const callbackId = makeId();
    const timer = window.setTimeout(() => {
      speechCallbacks.delete(callbackId);
      resolve({ ok: false, transcript: "", reason: "timeout" });
    }, 15000);

    speechCallbacks.set(callbackId, (result) => {
      window.clearTimeout(timer);
      resolve(result);
    });

    window.webkit.messageHandlers.momBabySpeech.postMessage({
      ...payload,
      callbackId,
    });
  });
}

function requestBrowserSpeech() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    return Promise.resolve({ ok: false, transcript: "", reason: "unsupported" });
  }

  return new Promise((resolve) => {
    const recognition = new SpeechRecognition();
    let transcript = "";
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(result);
    };
    const timer = window.setTimeout(() => {
      recognition.stop();
    }, 10000);

    recognition.lang = "zh-CN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || "")
        .join("");
    };
    recognition.onerror = (event) => finish({ ok: false, transcript: "", reason: event.error || "error" });
    recognition.onend = () => finish({ ok: Boolean(transcript), transcript, reason: transcript ? "" : "empty" });

    try {
      recognition.start();
    } catch {
      finish({ ok: false, transcript: "", reason: "start-failed" });
    }
  });
}

function sendNativeNotification(payload) {
  if (!hasNativeBridge()) {
    return Promise.resolve({ ok: true, reason: "preview" });
  }

  return new Promise((resolve) => {
    const callbackId = makeId();
    const timer = window.setTimeout(() => {
      nativeCallbacks.delete(callbackId);
      resolve({ ok: false, reason: "timeout" });
    }, 60000);

    nativeCallbacks.set(callbackId, (result) => {
      window.clearTimeout(timer);
      resolve(result);
    });

    window.webkit.messageHandlers.momBabyNotifications.postMessage({
      ...payload,
      callbackId,
    });
  });
}

function sendNativeExport(payload) {
  if (!hasNativeExportBridge()) {
    return Promise.resolve({ ok: false, reason: "unsupported" });
  }

  return new Promise((resolve) => {
    const callbackId = makeId();
    const timer = window.setTimeout(() => {
      exportCallbacks.delete(callbackId);
      resolve({ ok: false, reason: "timeout" });
    }, 5 * 60 * 1000);

    exportCallbacks.set(callbackId, (result) => {
      window.clearTimeout(timer);
      resolve(result);
    });

    try {
      window.webkit.messageHandlers.momBabyExport.postMessage({
        ...payload,
        callbackId,
      });
    } catch {
      window.clearTimeout(timer);
      exportCallbacks.delete(callbackId);
      resolve({ ok: false, reason: "post-failed" });
    }
  });
}

function handleNativeNotificationResult(event) {
  const detail = event.detail || {};
  const callback = nativeCallbacks.get(detail.callbackId);
  if (!callback) return;
  nativeCallbacks.delete(detail.callbackId);
  callback({
    ok: Boolean(detail.ok),
    reason: detail.reason || "",
    reminderAppId: detail.reminderAppId || "",
  });
}

function handleNativeSpeechResult(event) {
  const detail = event.detail || {};
  const callback = speechCallbacks.get(detail.callbackId);
  if (!callback) return;
  speechCallbacks.delete(detail.callbackId);
  callback({
    ok: Boolean(detail.ok),
    transcript: detail.transcript || "",
    reason: detail.reason || "",
  });
}

function handleNativeExportResult(event) {
  const detail = event.detail || {};
  const callback = exportCallbacks.get(detail.callbackId);
  if (!callback) return;
  exportCallbacks.delete(detail.callbackId);
  callback({
    ok: Boolean(detail.ok),
    reason: detail.reason || "",
  });
}

function hasNativeBridge() {
  return Boolean(window.webkit?.messageHandlers?.momBabyNotifications);
}

function hasNativeSpeechBridge() {
  return Boolean(window.webkit?.messageHandlers?.momBabySpeech);
}

function hasNativeExportBridge() {
  return Boolean(window.webkit?.messageHandlers?.momBabyExport);
}

function hasNativeWidgetBridge() {
  return Boolean(window.webkit?.messageHandlers?.momBabyWidget);
}

function syncWidgetState(nextReminder) {
  if (!hasNativeWidgetBridge()) return;

  const nextDate = nextReminder ? getReminderNextDate(nextReminder, state.now) : undefined;
  const payload = {
    action: "sync",
    hasReminder: Boolean(nextDate),
    nextAt: nextDate ? nextDate.toISOString() : "",
    mode: nextReminder?.mode || "",
    amountMl: nextReminder?.amountMl || 0,
    babyName: state.babyProfile.name || "宝贝",
    praise: getWidgetPraise(),
    fixedHour: nextReminder?.fixedTime?.hour ?? null,
    fixedMinute: nextReminder?.fixedTime?.minute ?? null,
    liveActivityEnabled: state.liveActivityEnabled,
  };
  const signature = JSON.stringify(payload);

  if (signature === lastWidgetSnapshot) return;

  try {
    window.webkit.messageHandlers.momBabyWidget.postMessage(payload);
    lastWidgetSnapshot = signature;
  } catch {
    lastWidgetSnapshot = "";
  }
}

function getWidgetPraise() {
  const name = state.babyProfile.name?.trim() || "宝贝";
  const index = Math.abs(hashString(`${dateKey(state.now)}:${name}`)) % widgetPraises.length;
  return `${name}，${widgetPraises[index].replace(/^宝贝/, "")}`;
}

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index++) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return hash;
}

function getSpeechErrorMessage(reason) {
  if (reason === "denied") return "语音权限未开启";
  if (reason === "microphone-denied") return "麦克风权限未开启";
  if (reason === "unsupported") return "当前环境不支持语音";
  if (reason === "empty") return "未识别到内容";
  if (reason === "busy") return "语音识别中";
  return "语音识别失败";
}

function loadBool(key, fallback) {
  const stored = localStorage.getItem(key);
  if (stored === null) return fallback;
  return stored === "true";
}

function saveBool(key, value) {
  localStorage.setItem(key, value ? "true" : "false");
}

function loadNumber(key, fallback, min, max) {
  const parsed = Number.parseInt(localStorage.getItem(key) || "", 10);
  if (Number.isNaN(parsed)) return fallback;
  return clamp(parsed, min, max);
}

function loadTheme() {
  const stored = localStorage.getItem(STORAGE_KEYS.theme);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

function saveTheme(theme) {
  localStorage.setItem(STORAGE_KEYS.theme, theme);
}

function resolveTheme(theme) {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

function applyTheme(theme) {
  const resolved = resolveTheme(theme);
  document.documentElement.setAttribute("data-theme", resolved);
}

function initTheme() {
  applyTheme(state.theme);

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (state.theme === "system") {
      applyTheme("system");
    }
  });
}

function loadProfile() {
  const fallback = {
    name: "",
    ageMonths: "",
    gender: "unknown",
    note: "",
    backgroundMediaType: "",
    backgroundMediaName: "",
  };

  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.babyProfile) || "{}");
    return {
      ...fallback,
      ...parsed,
      ageMonths: parsed.ageMonths === 0 || parsed.ageMonths ? sanitizeProfileAge(String(parsed.ageMonths)) : "",
    };
  } catch {
    return fallback;
  }
}

function saveProfile(profile) {
  localStorage.setItem(STORAGE_KEYS.babyProfile, JSON.stringify(profile));
}

function loadArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function openMediaDb() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("indexeddb-unavailable"));
      return;
    }

    const request = window.indexedDB.open(mediaDbName, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(mediaStoreName)) {
        db.createObjectStore(mediaStoreName);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("indexeddb-open-failed"));
  });
}

async function saveBabyMedia(file) {
  const db = await openMediaDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(mediaStoreName, "readwrite");
    transaction.objectStore(mediaStoreName).put(
      {
        blob: file,
        type: file.type,
        name: file.name,
        updatedAt: new Date().toISOString(),
      },
      babyBackgroundKey
    );
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error("indexeddb-save-failed"));
    };
  });
}

async function getBabyMedia() {
  const db = await openMediaDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(mediaStoreName, "readonly");
    const request = transaction.objectStore(mediaStoreName).get(babyBackgroundKey);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("indexeddb-read-failed"));
    transaction.oncomplete = () => db.close();
  });
}

async function deleteBabyMedia() {
  const db = await openMediaDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(mediaStoreName, "readwrite");
    transaction.objectStore(mediaStoreName).delete(babyBackgroundKey);
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error("indexeddb-delete-failed"));
    };
  });
}

function getHistoryDays() {
  const groups = new Map();

  state.records.forEach((record) => {
    const key = dateKey(new Date(record.at));
    const records = groups.get(key) || [];
    records.push(record);
    groups.set(key, records);
  });

  return Array.from(groups.entries())
    .map(([key, records]) => buildHistoryDay(key, records))
    .sort((left, right) => right.key.localeCompare(left.key));
}

function getFeedingIntervals(days) {
  return days.flatMap((day) => {
    const ordered = [...day.records].sort((left, right) => new Date(left.at).getTime() - new Date(right.at).getTime());
    return ordered.slice(1).map((record, index) => {
      const previous = new Date(ordered[index].at);
      const current = new Date(record.at);
      return Math.round((current.getTime() - previous.getTime()) / 60000);
    });
  }).filter((minutes) => Number.isFinite(minutes) && minutes > 0);
}

function buildHistoryDay(key, records = getRecordsForDay(key)) {
  if (!key) return undefined;
  const sortedRecords = sortRecords(records);
  const total = sumRecords(sortedRecords);
  return {
    key,
    records: sortedRecords,
    total,
    count: sortedRecords.length,
    average: sortedRecords.length > 0 ? Math.round(total / sortedRecords.length) : 0,
  };
}

function getRecordsForDay(key) {
  return sortRecords(state.records.filter((record) => dateKey(new Date(record.at)) === key));
}

function sumRecords(records) {
  return records.reduce((sum, record) => sum + Number(record.amountMl), 0);
}

function ensureSelectedHistoryDate(days = getHistoryDays()) {
  if (days.some((day) => day.key === state.selectedHistoryDate)) {
    return;
  }

  if (getRecentDayKeys(historyWindowDays).includes(state.selectedHistoryDate)) {
    return;
  }

  state.selectedHistoryDate = days[0]?.key || dateKey(state.now);
}

function normalizePastDateKey(key) {
  const date = dateFromInputValue(key);
  if (!date) return dateKey(state.now);

  const today = dateFromKey(dateKey(state.now));
  return date > today ? dateKey(today) : key;
}

function setTimelineDateFromKey(value) {
  const date = dateFromInputValue(value);
  if (!date) return;

  state.selectedTimelineDate = normalizePastDateKey(dateKey(date));
  if (dateKey(date) !== state.selectedTimelineDate) {
    showToast("不能查看未来日期");
  }
  render();
}

function changeTimelineDate(deltaDays) {
  const date = dateFromInputValue(state.selectedTimelineDate) || dateFromKey(dateKey(state.now));
  date.setDate(date.getDate() + deltaDays);
  setTimelineDateFromKey(dateKey(date));
}

function getRecentDayKeys(count) {
  return Array.from({ length: count }, (_, index) => {
    const value = new Date(state.now);
    value.setHours(0, 0, 0, 0);
    value.setDate(value.getDate() - (count - 1 - index));
    return dateKey(value);
  });
}

function todayBounds(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function isToday(isoDate, now = new Date()) {
  const value = new Date(isoDate);
  const { start, end } = todayBounds(now);
  return value >= start && value < end;
}

function formatClock(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatShortDateTime(date, now = new Date()) {
  if (isSameDay(date, now)) {
    return `今天 ${formatClock(date)}`;
  }
  return `${date.getMonth() + 1}月${date.getDate()}日 ${formatClock(date)}`;
}

function formatHistoryDayLabel(key) {
  const date = dateFromKey(key);
  if (isSameDay(date, state.now)) {
    return "今天";
  }

  const yesterday = addDays(state.now, -1);
  if (isSameDay(date, yesterday)) {
    return "昨天";
  }

  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatChartDayLabel(key) {
  const date = dateFromKey(key);
  if (isSameDay(date, state.now)) {
    return "今";
  }

  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatDuration(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}分钟`;
  if (minutes === 0) return `${hours}小时`;
  return `${hours}小时${minutes}分钟`;
}

function nextDailyOccurrence(hour, minute, now = new Date()) {
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function addDays(date, days) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function lerp(start, end, ratio) {
  return start + (end - start) * ratio;
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function average(values) {
  const validValues = values.filter((value) => Number.isFinite(value));
  if (validValues.length === 0) return 0;
  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
}

function getStandardDeviation(values) {
  const avg = average(values);
  if (!avg || values.length < 2) return 0;
  const variance = average(values.map((value) => (value - avg) ** 2));
  return Math.sqrt(variance);
}

function getTrendPercent(days) {
  if (days.length < 4) return undefined;

  const ordered = [...days].sort((left, right) => left.key.localeCompare(right.key));
  const midpoint = Math.floor(ordered.length / 2);
  const earlierAverage = average(ordered.slice(0, midpoint).map((day) => day.total));
  const recentAverage = average(ordered.slice(midpoint).map((day) => day.total));
  if (!earlierAverage) return undefined;

  return ((recentAverage - earlierAverage) / earlierAverage) * 100;
}

function formatTrendLabel(percent) {
  if (!Number.isFinite(percent)) return "样本少";
  if (Math.abs(percent) < 10) return "基本平稳";
  return percent > 0 ? `上升 ${Math.round(percent)}%` : `下降 ${Math.abs(Math.round(percent))}%`;
}

function raiseAnalysisLevel(currentLevel, nextLevel) {
  const order = { neutral: 0, good: 1, caution: 2, warning: 3 };
  return order[nextLevel] > order[currentLevel] ? nextLevel : currentLevel;
}

function isNightRecord(record) {
  const hour = new Date(record.at).getHours();
  return hour >= 0 && hour < 6;
}

function dateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dateFromKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function dateFromInputValue(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) return undefined;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (dateKey(date) !== value) return undefined;
  return date;
}

function clampRecordTime(value, now) {
  const next = new Date(value);
  if (Number.isNaN(next.getTime())) return new Date(now);
  if (next > now) return new Date(now);
  return next;
}

function getNextReminder(reminders, now) {
  return reminders
    .map((reminder) => ({ reminder, nextAt: getReminderNextDate(reminder, now) }))
    .filter((item) => item.nextAt)
    .sort((left, right) => left.nextAt.getTime() - right.nextAt.getTime())[0]?.reminder;
}

function getReminderNextDate(reminder, now) {
  if (reminder.mode === "fixed" && reminder.fixedTime) {
    return nextDailyOccurrence(reminder.fixedTime.hour, reminder.fixedTime.minute, now);
  }

  if (!reminder.nextAt) return undefined;
  const next = new Date(reminder.nextAt);
  return next > now ? next : undefined;
}

function formatShortReminder(reminder, now) {
  const next = getReminderNextDate(reminder, now);
  return next ? formatClock(next) : "--";
}

function formatReminderStatus(reminder, now) {
  if (isReminderCompleted(reminder, now)) {
    return "已提示完成";
  }

  if (reminder.mode === "fixed" && reminder.fixedTime) {
    return `下次 ${formatShortDateTime(nextDailyOccurrence(reminder.fixedTime.hour, reminder.fixedTime.minute, now), now)}`;
  }

  if (!reminder.nextAt) return "待触发";
  const next = new Date(reminder.nextAt);
  return next > now ? `预计 ${formatShortDateTime(next, now)}` : "已触发";
}

function isReminderCompleted(reminder, now) {
  if (reminder.repeats || !reminder.nextAt) {
    return false;
  }

  return new Date(reminder.nextAt) <= now;
}

function sortRecords(records) {
  return [...records].sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime());
}

function sortReminders(reminders) {
  return [...reminders].sort((left, right) => {
    const leftNext = getReminderNextDate(left, state.now)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const rightNext = getReminderNextDate(right, state.now)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return leftNext - rightNext;
  });
}

function getDefaultFixedTime() {
  const value = new Date(Date.now() + 3 * 60 * 60 * 1000);
  value.setMinutes(0, 0, 0);
  return { hour: value.getHours(), minute: value.getMinutes() };
}

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

function setInputValue(id, value) {
  const input = document.getElementById(id);
  if (input && input.value !== String(value)) {
    input.value = value;
  }
}

function setInputMax(id, value) {
  const input = document.getElementById(id);
  if (input && input.max !== String(value)) {
    input.max = value;
  }
}

function readInputValue(id) {
  return document.getElementById(id)?.value || "";
}

function setChecked(id, checked) {
  const input = document.getElementById(id);
  if (input) {
    input.checked = checked;
  }
}

function setDisabled(id, disabled) {
  const element = document.getElementById(id);
  if (element) {
    element.disabled = disabled;
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

function isSameDay(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// --- Data export/import ---

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function validateImportData(parsed) {
  const errors = [];
  if (!parsed || typeof parsed !== "object") {
    errors.push("无效的导入文件格式");
    return errors;
  }
  if (parsed.version !== 1) {
    errors.push("不支持的数据版本: " + (parsed.version ?? "未知"));
    return errors;
  }
  if (!parsed.data || typeof parsed.data !== "object") {
    errors.push("导入文件中缺少数据内容");
    return errors;
  }
  const records = parsed.data[STORAGE_KEYS.records];
  if (records !== undefined) {
    if (!Array.isArray(records)) {
      errors.push("喂奶记录格式错误");
    } else {
      for (const record of records) {
        if (!record.id || !record.amountMl || !record.at) {
          errors.push("存在无效的喂奶记录");
          break;
        }
      }
    }
  }
  const reminders = parsed.data[STORAGE_KEYS.reminders];
  if (reminders !== undefined) {
    if (!Array.isArray(reminders)) {
      errors.push("喂奶提醒格式错误");
    } else {
      for (const reminder of reminders) {
        if (!reminder.id || !reminder.mode) {
          errors.push("存在无效的喂奶提醒");
          break;
        }
      }
    }
  }
  return errors;
}

function triggerFileDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 1000);
}

async function shareOrDownloadExport(json, blob, filename) {
  if (hasNativeExportBridge()) {
    const result = await sendNativeExport({
      action: "share",
      filename,
      content: json,
    });

    if (!result.ok && result.reason !== "cancelled") {
      throw new Error(getExportErrorMessage(result.reason));
    }

    return { method: "native", cancelled: result.reason === "cancelled" };
  }

  const shareResult = await shareExportFile(blob, filename);
  if (shareResult.available) {
    return shareResult;
  }

  triggerFileDownload(blob, filename);
  return { method: "download", cancelled: false };
}

async function shareExportFile(blob, filename) {
  if (typeof File !== "function" || !navigator.share) {
    return { available: false };
  }

  const file = new File([blob], filename, { type: "application/json" });
  const shareData = {
    title: "沐奶时光数据备份",
    text: "沐奶时光数据备份文件",
    files: [file],
  };

  try {
    if (!navigator.canShare || !navigator.canShare(shareData)) {
      return { available: false };
    }
  } catch {
    return { available: false };
  }

  try {
    await navigator.share(shareData);
    return { available: true, method: "share", cancelled: false };
  } catch (error) {
    if (error?.name === "AbortError") {
      return { available: true, method: "share", cancelled: true };
    }
    throw error;
  }
}

function getExportErrorMessage(reason) {
  if (reason === "timeout") return "导出分享超时";
  if (reason === "invalid-content") return "导出内容无效";
  if (reason === "write-failed") return "备份文件创建失败";
  if (reason === "present-failed") return "无法打开系统分享面板";
  if (reason === "share-error") return "系统分享失败";
  return "系统分享不可用";
}

function confirmImportData(summary) {
  return new Promise((resolve) => {
    const layer = document.createElement("section");
    layer.className = "confirm-layer";
    layer.tabIndex = -1;
    layer.setAttribute("role", "dialog");
    layer.setAttribute("aria-modal", "true");
    layer.setAttribute("aria-label", "确认导入数据");
    layer.innerHTML = `
      <button class="confirm-backdrop" data-confirm="cancel" aria-label="取消导入"></button>
      <div class="confirm-dialog">
        <div>
          <p class="confirm-kicker">数据导入</p>
          <h2>覆盖当前数据？</h2>
        </div>
        <p>${summary}</p>
        <div class="confirm-actions">
          <button class="ghost-button" data-confirm="cancel">取消</button>
          <button class="primary-button" data-confirm="confirm">确认导入</button>
        </div>
      </div>
    `;

    const cleanup = (result) => {
      layer.remove();
      resolve(result);
    };

    layer.addEventListener("click", (event) => {
      const control = event.target.closest("[data-confirm]");
      if (!control) return;
      cleanup(control.dataset.confirm === "confirm");
    });

    layer.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        cleanup(false);
      }
    });

    document.body.appendChild(layer);
    layer.focus();
    layer.querySelector("[data-confirm='confirm']")?.focus();
  });
}

function getImportSummary(parsed) {
  const data = parsed.data || {};
  const records = Array.isArray(data[STORAGE_KEYS.records]) ? data[STORAGE_KEYS.records].length : 0;
  const reminders = Array.isArray(data[STORAGE_KEYS.reminders]) ? data[STORAGE_KEYS.reminders].length : 0;
  const exportedAt = parsed.exportedAt ? new Date(parsed.exportedAt) : undefined;
  const exportedLabel = exportedAt && !Number.isNaN(exportedAt.getTime())
    ? `，备份时间 ${formatShortDateTime(exportedAt, state.now)}`
    : "";

  return `将导入 ${records} 条喂奶记录、${reminders} 个提醒${exportedLabel}，并覆盖当前记录、提醒、宝贝信息和设置。`;
}

async function exportData() {
  try {
    const profile = loadProfile();
    const exportProfile = { ...profile };
    delete exportProfile.backgroundMediaType;
    delete exportProfile.backgroundMediaName;

    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        [STORAGE_KEYS.records]: loadArray(STORAGE_KEYS.records),
        [STORAGE_KEYS.reminders]: loadArray(STORAGE_KEYS.reminders),
        [STORAGE_KEYS.soundEnabled]: localStorage.getItem(STORAGE_KEYS.soundEnabled) ?? "true",
        [STORAGE_KEYS.reminderAppEnabled]: localStorage.getItem(STORAGE_KEYS.reminderAppEnabled) ?? "false",
        [STORAGE_KEYS.liveActivityEnabled]: localStorage.getItem(STORAGE_KEYS.liveActivityEnabled) ?? "false",
        [STORAGE_KEYS.babyProfile]: exportProfile,
        [STORAGE_KEYS.cardOpacity]: localStorage.getItem(STORAGE_KEYS.cardOpacity) ?? "42",
        [STORAGE_KEYS.theme]: localStorage.getItem(STORAGE_KEYS.theme) ?? "system",
      },
    };

    try {
      const media = await getBabyMedia();
      if (media && media.blob) {
        const buffer = await media.blob.arrayBuffer();
        const base64 = arrayBufferToBase64(buffer);
        payload.data["momBaby.media.v1"] = {
          key: babyBackgroundKey,
          data: base64,
          type: media.type || "image/png",
          name: media.name || "background",
        };
      }
    } catch {
      // IndexedDB media is optional
    }

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const filename = "momBaby-backup-" + dateKey(new Date()) + ".json";
    const result = await shareOrDownloadExport(json, blob, filename);
    showToast(result.cancelled ? "已取消导出" : "数据导出成功");
  } catch (error) {
    showToast("导出失败: " + error.message);
  }
}

async function importData(file) {
  try {
    showToast("正在读取备份...");
    const text = await file.text();
    const parsed = JSON.parse(text);
    const errors = validateImportData(parsed);
    if (errors.length > 0) {
      showToast("导入失败: " + errors[0]);
      return;
    }

    const confirmed = await confirmImportData(getImportSummary(parsed));
    if (!confirmed) {
      showToast("已取消导入");
      return;
    }

    showToast("正在导入备份...");

    const { data } = parsed;

    if (data[STORAGE_KEYS.records] !== undefined) {
      saveArray(STORAGE_KEYS.records, data[STORAGE_KEYS.records]);
    }
    if (data[STORAGE_KEYS.reminders] !== undefined) {
      saveArray(STORAGE_KEYS.reminders, data[STORAGE_KEYS.reminders]);
    }
    if (data[STORAGE_KEYS.soundEnabled] !== undefined) {
      localStorage.setItem(STORAGE_KEYS.soundEnabled, data[STORAGE_KEYS.soundEnabled]);
    }
    if (data[STORAGE_KEYS.reminderAppEnabled] !== undefined) {
      localStorage.setItem(STORAGE_KEYS.reminderAppEnabled, data[STORAGE_KEYS.reminderAppEnabled]);
    }
    if (data[STORAGE_KEYS.liveActivityEnabled] !== undefined) {
      localStorage.setItem(STORAGE_KEYS.liveActivityEnabled, data[STORAGE_KEYS.liveActivityEnabled]);
    }
    if (data[STORAGE_KEYS.babyProfile] !== undefined) {
      localStorage.setItem(STORAGE_KEYS.babyProfile, JSON.stringify(data[STORAGE_KEYS.babyProfile]));
    }
    if (data[STORAGE_KEYS.cardOpacity] !== undefined) {
      localStorage.setItem(STORAGE_KEYS.cardOpacity, data[STORAGE_KEYS.cardOpacity]);
    }
    if (data[STORAGE_KEYS.theme] !== undefined) {
      localStorage.setItem(STORAGE_KEYS.theme, data[STORAGE_KEYS.theme]);
    }

    if (data["momBaby.media.v1"]) {
      try {
        const mediaData = data["momBaby.media.v1"];
        const binaryString = atob(mediaData.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mediaData.type || "image/png" });
        const mediaFile = new File([blob], mediaData.name || "background", {
          type: mediaData.type || "image/png",
        });
        await saveBabyMedia(mediaFile);
      } catch {
        showToast("数据已导入，但背景照片恢复失败");
      }
    }

    state.records = loadArray(STORAGE_KEYS.records);
    state.reminders = loadArray(STORAGE_KEYS.reminders);
    state.soundEnabled = loadBool(STORAGE_KEYS.soundEnabled, true);
    state.reminderAppEnabled = loadBool(STORAGE_KEYS.reminderAppEnabled, false);
    state.liveActivityEnabled = loadBool(STORAGE_KEYS.liveActivityEnabled, false);
    state.babyProfile = loadProfile();
    state.cardOpacity = loadNumber(STORAGE_KEYS.cardOpacity, cardOpacityRange.defaultValue, cardOpacityRange.min, cardOpacityRange.max);
    state.theme = loadTheme();
    applyTheme(state.theme);
    applyCardOpacity(state.cardOpacity);
    closeProfileSheet();
    await hydrateBabyBackground();
    render();
    showToast("数据导入完成");
  } catch (error) {
    showToast("导入失败: " + error.message);
  }
}
