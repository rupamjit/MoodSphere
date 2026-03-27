import Session from "../models/Session.js";
import Student from "../models/Student.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const normalizeScoreTo100 = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;

  // If score is already in percentage range, keep it.
  if (value >= 0 && value <= 100) return Math.round(value);

  // If score is in sentiment range [-1, 1], map to [0, 100].
  if (value >= -1 && value <= 1) return Math.round(((value + 1) / 2) * 100);

  return Math.round(clamp(value, 0, 100));
};

const toDayKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const getRiskFromScore = (score100) => {
  if (score100 < 40) return "high";
  if (score100 < 65) return "medium";
  return "low";
};

const buildTrend = (moodHistory, days) => {
  const byDay = new Map();

  for (const row of moodHistory || []) {
    const key = toDayKey(row.date || row.createdAt || new Date());
    const score = normalizeScoreTo100(row.finalScore);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(score);
  }

  const points = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = toDayKey(d);
    const values = byDay.get(key) || [];
    const score = values.length
      ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
      : 0;

    points.push({
      date: d,
      score,
      hasData: values.length > 0,
    });
  }

  return points;
};

const getCurrentStreak = (moodHistory) => {
  const uniqueDays = new Set((moodHistory || []).map((row) => toDayKey(row.date || row.createdAt || new Date())));
  const sorted = [...uniqueDays].sort((a, b) => (a > b ? -1 : 1));

  if (!sorted.length) return 0;

  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (let i = 0; i < sorted.length; i++) {
    const expected = toDayKey(cursor);
    if (sorted[i] !== expected) {
      // Allow streak to start from yesterday when user has not checked in today yet.
      if (streak === 0 && i === 0) {
        const yesterday = new Date();
        yesterday.setHours(0, 0, 0, 0);
        yesterday.setDate(yesterday.getDate() - 1);
        if (sorted[i] === toDayKey(yesterday)) {
          streak = 1;
          cursor.setDate(cursor.getDate() - 2);
          continue;
        }
      }
      break;
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

const buildCalendarIntensity = (moodHistory, year, monthIndex) => {
  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 0);

  const intensityMap = new Map();

  for (const row of moodHistory || []) {
    const d = new Date(row.date || row.createdAt || new Date());
    if (d < monthStart || d > monthEnd) continue;

    const day = d.getDate();
    const score = normalizeScoreTo100(row.finalScore);

    if (!intensityMap.has(day)) intensityMap.set(day, []);
    intensityMap.get(day).push(score);
  }

  const days = [];
  const today = new Date();

  for (let day = 1; day <= monthEnd.getDate(); day++) {
    const values = intensityMap.get(day) || [];
    const avg = values.length
      ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
      : 0;

    let level = "empty";
    if (values.length) {
      if (avg >= 75) level = "high";
      else if (avg >= 50) level = "mid";
      else level = "low";
    }

    if (
      year === today.getFullYear() &&
      monthIndex === today.getMonth() &&
      day === today.getDate() &&
      values.length
    ) {
      level = "today";
    }

    days.push({
      day,
      score: avg,
      level,
      hasData: values.length > 0,
    });
  }

  return {
    year,
    month: monthIndex + 1,
    monthLabel: monthStart.toLocaleString("en-US", { month: "long", year: "numeric" }),
    days,
  };
};

const buildPatternRecognition = ({ currentScore, consistency, weeklyDelta, currentRisk }) => {
  const riskBoost = currentRisk === "high" ? 15 : currentRisk === "medium" ? 8 : 0;

  const focus = clamp(Math.round(currentScore + 6 + weeklyDelta * 0.3), 10, 98);
  const calm = clamp(Math.round(currentScore + 2), 10, 98);
  const energy = clamp(Math.round(45 + consistency * 0.4 + Math.max(weeklyDelta, 0)), 10, 98);
  const stress = clamp(Math.round(100 - currentScore + riskBoost), 5, 95);
  const sleep = clamp(
    Math.round(50 + (consistency - 50) * 0.4 - Math.max(-weeklyDelta, 0)),
    10,
    95
  );

  const nodes = [
    { label: "Focus", pct: focus, color: "#EA580C", emoji: "🎯" },
    { label: "Calm", pct: calm, color: "#FB923C", emoji: "😌" },
    { label: "Energy", pct: energy, color: "#F59E0B", emoji: "⚡" },
    { label: "Stress", pct: stress, color: "#FDBA74", emoji: "😤" },
    { label: "Sleep", pct: sleep, color: "#C2410C", emoji: "😴" },
  ];

  const topTwo = [...nodes]
    .filter((n) => n.label !== "Stress")
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 2)
    .map((n) => n.label);

  const insight =
    stress >= 60
      ? `${topTwo.join(" and ")} are strong, but Stress is elevated today. Prioritize recovery blocks.`
      : `${topTwo.join(" and ")} are dominant today, while Stress remains below baseline.`;

  return { nodes, insight };
};

const buildDashboardPayload = async (studentId, period = "30d") => {
  const student = await Student.findById(studentId)
    .select("name currentMood moodScore riskLevel moodHistory allSessions")
    .lean();

  if (!student) {
    return null;
  }

  const moodHistory = student.moodHistory || [];
  const days = period === "7d" ? 7 : 30;

  const trendPoints = buildTrend(moodHistory, days);
  const trend30 = buildTrend(moodHistory, 30);

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const completedThisMonth = await Session.countDocuments({
    studentId,
    status: "completed",
    endedAt: { $gte: monthStart },
  });

  const recentSessions = await Session.find({ studentId, status: "completed" })
    .sort({ endedAt: -1, createdAt: -1 })
    .limit(3)
    .select("finalMood finalScore riskLevel endedAt createdAt")
    .lean();

  const uniqueActiveDays30 = new Set(
    trend30.filter((p) => p.hasData).map((p) => toDayKey(p.date))
  ).size;
  const consistency = Math.round((uniqueActiveDays30 / 30) * 100);

  const currentScore = normalizeScoreTo100(student.moodScore);
  const currentRisk = student.riskLevel || getRiskFromScore(currentScore);
  const streak = getCurrentStreak(moodHistory);

  const prev7 = trend30.slice(16, 23).map((p) => p.score);
  const last7 = trend30.slice(23).map((p) => p.score);
  const prevAvg = prev7.length ? prev7.reduce((a, b) => a + b, 0) / prev7.length : 0;
  const lastAvg = last7.length ? last7.reduce((a, b) => a + b, 0) / last7.length : 0;
  const weeklyDelta = Math.round(lastAvg - prevAvg);

  const calendar = buildCalendarIntensity(moodHistory, today.getFullYear(), today.getMonth());
  const patternRecognition = buildPatternRecognition({
    currentScore,
    consistency,
    weeklyDelta,
    currentRisk,
  });

  const tips = [];
  if (currentRisk === "high") tips.push("Consider a short guided check-in and reach out to your mentor today.");
  if (consistency < 50) tips.push("Try a daily check-in reminder to improve consistency.");
  if (weeklyDelta >= 0) tips.push("Your mood trend is improving. Keep your current routine.");
  else tips.push("Your trend dipped this week. Add short breaks between study blocks.");
  if (!tips.length) tips.push("You are doing well. Keep your check-ins regular.");

  return {
    profile: {
      name: student.name,
      currentMood: student.currentMood || "neutral",
      moodScore: currentScore,
      riskLevel: currentRisk,
    },
    stats: {
      moodScore: currentScore,
      weeklyDelta,
      currentRisk,
      completedSessionsThisMonth: completedThisMonth,
      consistency,
      currentStreak: streak,
    },
    trend: {
      period,
      points: trendPoints,
    },
    streak: {
      currentStreak: streak,
      calendar,
    },
    patternRecognition,
    recentSessions: recentSessions.map((s) => ({
      mood: s.finalMood || "neutral",
      score: normalizeScoreTo100(s.finalScore),
      risk: s.riskLevel || getRiskFromScore(normalizeScoreTo100(s.finalScore)),
      time: s.endedAt || s.createdAt,
    })),
    aiTips: tips.slice(0, 3),
  };
};

export const getDashboardOverview = async (req, res) => {
  try {
    const period = req.query.period === "7d" ? "7d" : "30d";
    const payload = await buildDashboardPayload(req.user.id, period);

    if (!payload) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDashboardTrend = async (req, res) => {
  try {
    const period = req.query.period === "7d" ? "7d" : "30d";
    const payload = await buildDashboardPayload(req.user.id, period);

    if (!payload) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json(payload.trend);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDashboardStreak = async (req, res) => {
  try {
    const payload = await buildDashboardPayload(req.user.id, "30d");

    if (!payload) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json(payload.streak);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDashboardRecentSessions = async (req, res) => {
  try {
    const payload = await buildDashboardPayload(req.user.id, "30d");

    if (!payload) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json(payload.recentSessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDashboardAiTips = async (req, res) => {
  try {
    const payload = await buildDashboardPayload(req.user.id, "30d");

    if (!payload) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json(payload.aiTips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
