import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import AuthScreen from "./AuthScreen";
import Onboarding from "./Onboarding";
import ScheduleEditor from "./ScheduleEditor";
import { CATEGORIES, TEMPLATES, shiftWeekly, applyAddOnsToWeekly } from "./templates";

const DEBRIEF_QUESTIONS = [
  "Did you execute all three priorities today?",
  "Where did you lose discipline?",
  "What will you do differently tomorrow?",
  "Rate your focus today: 1-10.",
  "Did you control your urges?",
];

const URGE_RESPONSES = [
  { title: "DELAY 10 MINUTES", text: "Set a timer. If the urge remains after 10 minutes, reassess. It won't." },
  { title: "MOVE YOUR BODY", text: "Drop and give me 20 push-ups. Now. Blood goes to muscles, not weakness." },
  { title: "BREATHE", text: "4 seconds in. Hold 7. Out 8. Repeat 5 times. You control your body." },
  { title: "COLD WATER", text: "Go splash cold water on your face and wrists. Shock the system." },
  { title: "REMEMBER WHY", text: "You started this to become someone. That person doesn't give in." },
];

const RULES = [
  { id: "no_phone_work", label: "No phone during deep work", maxViolations: 0 },
  { id: "clean_eating", label: "No junk food or sugar", maxViolations: 0 },
  { id: "no_snooze", label: "No snooze button", maxViolations: 0 },
  { id: "screen_curfew", label: "No screens after 21:00", maxViolations: 0 },
  { id: "masturbation", label: "Max 1 release per day", maxViolations: 1 },
];

const localStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const todayKey = () => localStr(new Date());
const tomorrowKey = () => { const d = new Date(); d.setDate(d.getDate() + 1); return localStr(d); };
const offsetDay = (base, n) => { const [y, m, day] = base.split("-").map(Number); return localStr(new Date(y, m - 1, day + n)); };
const prevMonth = (ym) => { const [y, m] = ym.split("-").map(Number); return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`; };
const nextMonth = (ym) => { const [y, m] = ym.split("-").map(Number); return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`; };
const buildCalendar = (ym) => {
  const [y, m] = ym.split("-").map(Number);
  const firstDow = new Date(y, m - 1, 1).getDay();
  const days = new Date(y, m, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(`${ym}-${String(d).padStart(2, "0")}`);
  return cells;
};
const formatNoteDate = (key) => {
  const today = todayKey();
  const tomorrow = tomorrowKey();
  const d = new Date(key + "T00:00:00");
  const label = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase();
  if (key === today) return { label, tag: "TODAY" };
  if (key === tomorrow) return { label, tag: "TOMORROW" };
  return { label, tag: null };
};

const defaultDayState = () => ({
  date: todayKey(),
  completed: [],
  failed: [],
  ruleViolations: {},
  streak: 0,
  debriefAnswers: [],
  debriefDone: false,
  urgeCount: 0,
});

export default function BecomingTommyShelby() {
  const [view, setView] = useState("command");
  const [dayState, setDayState] = useState(defaultDayState());
  const [globalStreak, setGlobalStreak] = useState(0);
  const [currentMissionIdx, setCurrentMissionIdx] = useState(0);
  const [urgeMode, setUrgeMode] = useState(false);
  const [urgeStep, setUrgeStep] = useState(0);
  const [ruleWarning, setRuleWarning] = useState(null);
  const [debriefStep, setDebriefStep] = useState(0);
  const [debriefInput, setDebriefInput] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(new Date());
  const lastFiveMinWarnRef = useRef(new Set());
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [nameUpdateMsg, setNameUpdateMsg] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const lastNotifMinRef = useRef(-1);
  const [schedule, setSchedule] = useState(null); // null=loading, false=no schedule, object=loaded
  const [showEditor, setShowEditor] = useState(false);
  const [notesDate, setNotesDate] = useState(todayKey());
  const [notesContent, setNotesContent] = useState("");
  const [notesOriginal, setNotesOriginal] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesSavedMsg, setNotesSavedMsg] = useState("");
  const [notesCalMonth, setNotesCalMonth] = useState(todayKey().slice(0, 7));
  const [notesHasDates, setNotesHasDates] = useState(new Set());
  const [notesCalView, setNotesCalView] = useState(false);
  const [scheduleViewDay, setScheduleViewDay] = useState(null); // null = today
  const [notifBannerDismissed, setNotifBannerDismissed] = useState(false);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Mission alarm — fires at mission start + 5-min warning before end
  useEffect(() => {
    if (!loaded || !user) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const DAY_NAMES_NOTIF = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
    const todayMs = DAY_NAMES_NOTIF[now.getDay()];
    const todayMissions = schedule?.weekly?.[todayMs] || [];
    const nowMin = now.getHours() * 60 + now.getMinutes();
    if (nowMin !== lastNotifMinRef.current) {
      lastNotifMinRef.current = nowMin;
      const startHit = todayMissions.find(ms => {
        const [mh, mm] = ms.time.split(":").map(Number);
        return mh * 60 + mm === nowMin;
      });
      if (startHit) {
        new Notification(`⏱ ${startHit.label}`, { body: startHit.command, icon: "/favicon.ico" });
      }
      const fiveMin = todayMissions.find(ms => {
        if (ms.duration <= 0) return false;
        const [mh, mm] = ms.time.split(":").map(Number);
        return mh * 60 + mm + ms.duration === nowMin + 5;
      });
      if (fiveMin && !lastFiveMinWarnRef.current.has(fiveMin.id)) {
        lastFiveMinWarnRef.current.add(fiveMin.id);
        new Notification(`⏰ 5 MIN LEFT: ${fiveMin.label}`, { body: "Finish strong.", icon: "/favicon.ico" });
      }
    }
  }, [now, loaded, user]);

  const enableNotifications = async () => {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  };

  // Auth state listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (!u) { setLoaded(false); setSchedule(null); } // reset when signed out
    });
    return unsub;
  }, []);

  // Load state from Firestore
  useEffect(() => {
    if (!user) return;
    setLoaded(false);
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid, "data", "state"));
        if (snap.exists()) {
          const parsed = snap.data();
          if (parsed.date === todayKey()) {
            setDayState(parsed);
          } else {
            // New day — carry streak (70% threshold)
            const prevTotal = parsed.totalMissions || 10;
            const wasGoodDay = parsed.completed.length / prevTotal >= 0.7;
            const newStreak = wasGoodDay ? (parsed.streak || 0) + 1 : 0;
            const fresh = defaultDayState();
            fresh.streak = newStreak;
            setDayState(fresh);
          }
        } else {
          setDayState(defaultDayState());
        }
      } catch {}
      setLoaded(true);
    })();
  }, [user]);

  // Load schedule from Firestore
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        let snap = await getDoc(doc(db, "users", user.uid, "schedule", "weekly"));
        if (snap.exists()) {
          setSchedule(snap.data());
        } else {
          // Try old single-day format and migrate
          snap = await getDoc(doc(db, "users", user.uid, "schedule", "current"));
          if (snap.exists()) {
            const old = snap.data();
            if (old.missions) {
              const allDays = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
              const w = Object.fromEntries(allDays.map(d => [d, old.missions]));
              setSchedule({ ...old, weekly: w });
            } else { setSchedule(false); }
          } else { setSchedule(false); }
        }
      } catch { setSchedule(false); }
    })();
  }, [user]);

  // Save state to Firestore + update leaderboard entry
  useEffect(() => {
    if (!loaded || !user) return;
    (async () => {
      try {
        const DAY_NAMES_SAVE = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
        const missionCount = schedule?.weekly?.[DAY_NAMES_SAVE[new Date().getDay()]]?.length || 1;
        await setDoc(doc(db, "users", user.uid, "data", "state"), {
          ...dayState,
          totalMissions: missionCount,
        });
        await setDoc(doc(db, "leaderboard", user.uid), {
          displayName: user.displayName || user.email?.split("@")[0] || "Soldier",
          streak: dayState.streak,
          score: Math.max(0, Math.min(100, Math.round(
            (dayState.completed.length / missionCount) * 60
            - Object.values(dayState.ruleViolations).reduce((a, b) => a + b, 0) * 10
            - dayState.urgeCount * 2
            + Math.min(dayState.streak * 2, 20)
          ))),
          completed: dayState.completed.length,
          total: missionCount,
          updatedAt: serverTimestamp(),
        });
      } catch {}
    })();
  }, [dayState, loaded, user]);

  // Fetch leaderboard when tab is opened
  useEffect(() => {
    if (!user) return;
    setLeaderboardLoading(true);
    getDocs(collection(db, "leaderboard"))
      .then(snap => {
        const rows = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
        rows.sort((a, b) => b.streak - a.streak || b.score - a.score);
        setLeaderboard(rows);
      })
      .catch(() => {})
      .finally(() => setLeaderboardLoading(false));
  }, [view === "leaderboard" ? view : null, user]);

  // Fetch which dates in the calendar month have notes
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const snap = await getDocs(collection(db, "users", user.uid, "notes"));
        const dates = new Set(snap.docs.map(d => d.id).filter(id => id.startsWith(notesCalMonth)));
        setNotesHasDates(dates);
      } catch {}
    })();
  }, [user, notesCalMonth]);

  // Load note for the currently viewed date
  useEffect(() => {
    if (!user) return;
    setNotesLoading(true);
    setNotesContent("");
    setNotesOriginal("");
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid, "notes", notesDate));
        const text = snap.exists() ? (snap.data().content || "") : "";
        setNotesContent(text);
        setNotesOriginal(text);
      } catch {}
      setNotesLoading(false);
    })();
  }, [user, notesDate]);

  const saveNote = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, "users", user.uid, "notes", notesDate), {
        content: notesContent,
        date: notesDate,
        updatedAt: serverTimestamp(),
      });
      setNotesOriginal(notesContent);
      setNotesSavedMsg("Saved.");
      setTimeout(() => setNotesSavedMsg(""), 2000);
    } catch {}
  };

  // Save permanent debrief history when debrief is completed
  useEffect(() => {
    if (!dayState.debriefDone || !user || !loaded) return;
    setDoc(doc(db, "users", user.uid, "history", dayState.date), {
      date: dayState.date,
      debrief: dayState.debriefAnswers,
      missionsCompleted: dayState.completed.length,
      missionsFailed: dayState.failed.length,
      ruleViolations: dayState.ruleViolations,
      urgeCount: dayState.urgeCount,
      streak: dayState.streak,
      savedAt: serverTimestamp(),
    }).catch(() => {});
  }, [dayState.debriefDone, user, loaded]);

  // Auto-detect current mission by time
  useEffect(() => {
    const h = now.getHours();
    const m = now.getMinutes();
    const nowMin = h * 60 + m;
    const dayNames = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
    const missions = schedule?.weekly?.[dayNames[now.getDay()]] || [];
    let best = 0;
    for (let i = 0; i < missions.length; i++) {
      const [mh, mm] = missions[i].time.split(":").map(Number);
      if (nowMin >= mh * 60 + mm) best = i;
    }
    // Skip completed/failed
    while (best < missions.length - 1 &&
      (dayState.completed.includes(missions[best].id) ||
       dayState.failed.includes(missions[best].id))) {
      best++;
    }
    setCurrentMissionIdx(best);
  }, [now, dayState.completed, dayState.failed]);

  const DAY_NAMES = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  const todayDayName = DAY_NAMES[now.getDay()];
  const missions = schedule?.weekly?.[todayDayName] || [];
  const mission = missions[currentMissionIdx];

  const completeMission = () => {
    if (!mission || dayState.completed.includes(mission.id) || dayState.failed.includes(mission.id)) return;
    setDayState(s => ({ ...s, completed: [...s.completed, mission.id] }));
  };

  const failMission = () => {
    if (!mission || dayState.completed.includes(mission.id) || dayState.failed.includes(mission.id)) return;
    setDayState(s => ({ ...s, failed: [...s.failed, mission.id] }));
  };

  const reportViolation = (ruleId) => {
    const rule = RULES.find(r => r.id === ruleId);
    const current = dayState.ruleViolations[ruleId] || 0;
    const newCount = current + 1;
    setDayState(s => ({
      ...s,
      ruleViolations: { ...s.ruleViolations, [ruleId]: newCount },
    }));
    if (newCount > rule.maxViolations) {
      setRuleWarning(`RULE BROKEN: "${rule.label}" — You're losing control. Fix it. Now.`);
      setTimeout(() => setRuleWarning(null), 5000);
    }
  };

  const handleUrge = () => {
    setUrgeMode(true);
    setUrgeStep(0);
    setDayState(s => ({ ...s, urgeCount: s.urgeCount + 1 }));
  };

  const shelbyScore = () => {
    const totalMissions = missions.length || 1;
    const completedPct = (dayState.completed.length / totalMissions) * 60;
    const violations = Object.values(dayState.ruleViolations).reduce((a, b) => a + b, 0);
    const rulePenalty = violations * 10;
    const urgePenalty = dayState.urgeCount * 2;
    const streakBonus = Math.min(dayState.streak * 2, 20);
    return Math.max(0, Math.min(100, Math.round(completedPct - rulePenalty - urgePenalty + streakBonus)));
  };

  const formatTime = (s) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const submitDebrief = () => {
    const entry = { question: DEBRIEF_QUESTIONS[debriefStep], answer: debriefInput };
    const answers = [...dayState.debriefAnswers, entry];
    setDebriefInput("");
    if (debriefStep < DEBRIEF_QUESTIONS.length - 1) {
      setDebriefStep(debriefStep + 1);
      setDayState(s => ({ ...s, debriefAnswers: answers }));
    } else {
      setDayState(s => ({ ...s, debriefAnswers: answers, debriefDone: true }));
      setView("score");
    }
  };

  const catColor = (cat) => CATEGORIES[cat]?.color || "#888";

  const streakStatus = () => {
    const total = missions.length;
    if (total === 0) return null;
    const pct = dayState.completed.length / total;
    if (pct >= 0.9) return { label: "EXCELLENT", color: "#D4A03C" };
    if (pct >= 0.7) return { label: "STREAK HELD", color: "#3A8F6A" };
    return { label: "STREAK BROKEN", color: "#C23B22" };
  };

  const handleOnboardingComplete = async (data) => {
    const scheduleData = {
      templateId: data.templateId,
      templateName: data.templateName,
      wakeTime: data.wakeTime,
      addOns: data.addOns,
      weekly: data.weekly,
    };
    setSchedule(scheduleData);
    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid, "schedule", "weekly"), scheduleData);
      } catch {}
    }
  };

  const handleScheduleSave = async (newWeekly) => {
    const updated = { ...schedule, weekly: newWeekly };
    setSchedule(updated);
    setShowEditor(false);
    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid, "schedule", "weekly"), updated);
      } catch {}
    }
  };

  const handleScheduleReset = async () => {
    const template = TEMPLATES.find(t => t.id === schedule?.templateId);
    if (!template) return;
    const shiftedWeekly = shiftWeekly(template.weekly, template.defaultWakeTime, schedule.wakeTime);
    const finalWeekly = applyAddOnsToWeekly(shiftedWeekly, schedule.addOns || [], schedule.wakeTime);
    const updated = { ...schedule, weekly: finalWeekly };
    setSchedule(updated);
    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid, "schedule", "weekly"), updated);
      } catch {}
    }
  };

  const handleChangeName = async () => {
    if (!newDisplayName.trim() || !user) return;
    try {
      await updateProfile(user, { displayName: newDisplayName.trim() });
      setNewDisplayName("");
      setNameUpdateMsg("Name updated.");
    } catch {
      setNameUpdateMsg("Failed to update. Try again.");
    }
    setTimeout(() => setNameUpdateMsg(""), 3000);
  };

  if (authLoading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingText}>LOADING ORDERS...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (!loaded) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingText}>LOADING ORDERS...</div>
      </div>
    );
  }

  if (schedule === null) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingText}>LOADING ORDERS...</div>
      </div>
    );
  }

  if (schedule === false) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (showEditor) {
    return (
      <ScheduleEditor
        weekly={schedule.weekly}
        onSave={handleScheduleSave}
        onClose={() => setShowEditor(false)}
        onReset={handleScheduleReset}
      />
    );
  }

  return (
    <div style={styles.container}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* Notification permission banner */}
      {notifPermission !== "granted" && !notifBannerDismissed && (
        <div style={{ background: "#111", borderBottom: "1px solid #222", padding: "8px 16px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "#555", flex: 1 }}>
            Keep this tab open to receive mission alerts.
          </span>
          {notifPermission !== "denied" && (
            <button onClick={enableNotifications} style={{ padding: "4px 12px", background: "#D4A03C", border: "none", borderRadius: "3px", color: "#0A0A0A", fontFamily: "'Bebas Neue', sans-serif", fontSize: "11px", letterSpacing: "2px", cursor: "pointer" }}>
              ENABLE ALERTS
            </button>
          )}
          <button onClick={() => setNotifBannerDismissed(true)} style={{ background: "none", border: "none", color: "#333", cursor: "pointer", fontSize: "16px", lineHeight: 1 }}>✕</button>
        </div>
      )}

      {/* Rule Warning Overlay */}
      {ruleWarning && (
        <div style={styles.warningOverlay}>
          <div style={styles.warningIcon}>⚠</div>
          <div style={styles.warningText}>{ruleWarning}</div>
        </div>
      )}

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>BTS</div>
          <div style={styles.titleBlock}>
            <div style={styles.title}>BECOMING TOMMY SHELBY</div>
            <div style={styles.subtitle}>
              {now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }).toUpperCase()}
              {" · "}
              {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
              {" · "}
              {(schedule?.templateName || "").toUpperCase()}
            </div>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button
            onClick={enableNotifications}
            title={notifPermission === "granted" ? "Alarms on" : notifPermission === "denied" ? "Alarms blocked in browser settings" : "Enable mission alarms"}
            style={styles.bellBtn}
          >
            {notifPermission === "granted" ? "🔔" : "🔕"}
          </button>
          <div style={styles.streakBadge}>
            <span style={styles.streakNum}>{dayState.streak}</span>
            <span style={styles.streakLabel}>DAY STREAK</span>
          </div>
          <div style={styles.scoreBadge}>
            <span style={styles.scoreNum}>{shelbyScore()}</span>
            <span style={styles.scoreLabel}>SCORE</span>
          </div>
          <button style={styles.accountAvatarBtn} onClick={() => setView("account")} title="Account">
            <div style={styles.accountAvatar}>
              {(user.displayName || user.email || "?")[0].toUpperCase()}
            </div>
          </button>
        </div>
      </header>

      {/* Nav */}
      <nav style={styles.nav}>
        {[
          { key: "command", label: "COMMAND" },
          { key: "schedule", label: "SCHEDULE" },
          { key: "rules", label: "RULES" },
          { key: "debrief", label: "DEBRIEF" },
          { key: "notes", label: "NOTES" },
          { key: "score", label: "SCORE" },
          { key: "leaderboard", label: "RANKS" },
          { key: "account", label: "ACCOUNT" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            style={view === tab.key ? { ...styles.navBtn, ...styles.navBtnActive } : styles.navBtn}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main style={styles.main}>
        {/* ====== COMMAND VIEW ====== */}
        {view === "command" && !urgeMode && (
          <div style={styles.commandView}>
            <div style={{ ...styles.categoryTag, background: catColor(mission.category) }}>
              {mission.category.toUpperCase()}
            </div>
            <div style={styles.missionTime}>{mission.time}</div>
            <h1 style={styles.commandTitle}>{mission.label}</h1>
            <p style={styles.commandText}>{mission.command}</p>

            {mission.duration > 0 && (() => {
              const [mh, mm] = mission.time.split(":").map(Number);
              const endMin = mh * 60 + mm + mission.duration;
              const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
              const remainSec = Math.max(0, Math.round((endMin - nowMin) * 60));
              const pct = Math.max(0, Math.min(100, (remainSec / (mission.duration * 60)) * 100));
              return (
                <div style={styles.timerBlock}>
                  <div style={styles.timerDisplay}>{formatTime(remainSec)}</div>
                  <div style={styles.timerBar}>
                    <div style={{ ...styles.timerFill, width: `${pct}%` }} />
                  </div>
                  {remainSec === 0 && (
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#C23B22", letterSpacing: "2px" }}>
                      TIME'S UP
                    </div>
                  )}
                </div>
              );
            })()}

            <div style={styles.actionRow}>
              {(() => {
                const done = dayState.completed.includes(mission?.id);
                const failed = dayState.failed.includes(mission?.id);
                const locked = done || failed;
                return (
                  <>
                    <button
                      style={{ ...styles.completeBtn, opacity: locked ? 0.35 : 1, cursor: locked ? "default" : "pointer" }}
                      onClick={completeMission}
                    >
                      {done ? "✓ DONE" : "✓ COMPLETE"}
                    </button>
                    <button
                      style={{ ...styles.failBtn, opacity: locked ? 0.35 : 1, cursor: locked ? "default" : "pointer" }}
                      onClick={failMission}
                    >
                      {failed ? "✗ FAILED" : "✗ FAIL"}
                    </button>
                  </>
                );
              })()}
            </div>

            <button style={styles.urgeBtn} onClick={handleUrge}>
              I FEEL AN URGE
            </button>

            <div style={styles.progressRow}>
              <span style={styles.progressLabel}>TODAY'S PROGRESS</span>
              <div style={styles.progressBar}>
                <div style={{
                  ...styles.progressFill,
                  width: `${missions.length ? (dayState.completed.length / missions.length) * 100 : 0}%`,
                }} />
              </div>
              <span style={styles.progressText}>
                {dayState.completed.length}/{missions.length}
              </span>
            </div>
          </div>
        )}

        {/* ====== URGE MODE ====== */}
        {view === "command" && urgeMode && (
          <div style={styles.urgeView}>
            <div style={styles.urgeHeader}>URGE CONTROL PROTOCOL</div>
            <div style={styles.urgeCard}>
              <div style={styles.urgeStep}>STEP {urgeStep + 1} OF {URGE_RESPONSES.length}</div>
              <h2 style={styles.urgeTitle}>{URGE_RESPONSES[urgeStep].title}</h2>
              <p style={styles.urgeText}>{URGE_RESPONSES[urgeStep].text}</p>
            </div>
            <div style={styles.urgeActions}>
              {urgeStep < URGE_RESPONSES.length - 1 ? (
                <button style={styles.completeBtn} onClick={() => setUrgeStep(urgeStep + 1)}>
                  NEXT STEP →
                </button>
              ) : (
                <button style={styles.completeBtn} onClick={() => setUrgeMode(false)}>
                  I'M IN CONTROL NOW
                </button>
              )}
              <button style={styles.secondaryBtn} onClick={() => setUrgeMode(false)}>
                BACK TO MISSION
              </button>
            </div>
          </div>
        )}

        {/* ====== SCHEDULE VIEW ====== */}
        {view === "schedule" && (() => {
          const allDays = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
          const dayLabels = { monday:"MON", tuesday:"TUE", wednesday:"WED", thursday:"THU", friday:"FRI", saturday:"SAT", sunday:"SUN" };
          const displayDay = scheduleViewDay || todayDayName;
          const displayMissions = schedule?.weekly?.[displayDay] || [];
          const isToday = displayDay === todayDayName;
          return (
            <div style={styles.scheduleView}>
              <div style={styles.scheduleHeader}>
                <h2 style={styles.sectionTitle}>{isToday ? "TODAY'S ORDERS" : `${displayDay.toUpperCase()}'S ORDERS`}</h2>
                <button style={styles.editScheduleBtn} onClick={() => setShowEditor(true)}>EDIT SCHEDULE</button>
              </div>
              {/* Day tabs */}
              <div style={{ display: "flex", gap: "4px", marginBottom: "12px", overflowX: "auto" }}>
                {allDays.map(d => (
                  <button
                    key={d}
                    onClick={() => setScheduleViewDay(d === todayDayName ? null : d)}
                    style={{
                      padding: "5px 10px",
                      background: "none",
                      border: "none",
                      borderBottom: `2px solid ${displayDay === d ? "#D4A03C" : "transparent"}`,
                      color: displayDay === d ? "#D4A03C" : d === todayDayName ? "#888" : "#444",
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: "13px",
                      letterSpacing: "1px",
                      cursor: "pointer",
                    }}
                  >
                    {dayLabels[d]}{d === todayDayName ? " ●" : ""}
                  </button>
                ))}
              </div>
              <div style={styles.scheduleList}>
                {displayMissions.map((m, i) => {
                  const done = isToday && dayState.completed.includes(m.id);
                  const fail = isToday && dayState.failed.includes(m.id);
                  const isCurrent = isToday && i === currentMissionIdx;
                  return (
                    <div
                      key={m.id}
                      style={{
                        ...styles.scheduleItem,
                        ...(isCurrent ? styles.scheduleItemCurrent : {}),
                        ...(done ? styles.scheduleItemDone : {}),
                        ...(fail ? styles.scheduleItemFail : {}),
                      }}
                      onClick={() => { if (isToday) { setCurrentMissionIdx(i); setView("command"); } }}
                    >
                      <div style={styles.scheduleTime}>{m.time}</div>
                      <div style={styles.scheduleInfo}>
                        <div style={styles.scheduleLabel}>{m.label}</div>
                        <div style={styles.scheduleDur}>{m.duration > 0 ? `${m.duration} min` : ""}</div>
                      </div>
                      <div style={{
                        ...styles.scheduleDot,
                        background: done ? "#3A8F6A" : fail ? "#C23B22" : catColor(m.category),
                        opacity: done || fail ? 1 : 0.4,
                      }}>
                        {done ? "✓" : fail ? "✗" : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ====== RULES VIEW ====== */}
        {view === "rules" && (
          <div style={styles.rulesView}>
            <h2 style={styles.sectionTitle}>THE RULES</h2>
            <p style={styles.rulesSubtext}>You set these. You follow them. No negotiation.</p>
            <div style={styles.rulesList}>
              {RULES.map(rule => {
                const violations = dayState.ruleViolations[rule.id] || 0;
                const broken = violations > rule.maxViolations;
                return (
                  <div key={rule.id} style={{ ...styles.ruleCard, ...(broken ? styles.ruleCardBroken : {}) }}>
                    <div style={styles.ruleInfo}>
                      <div style={styles.ruleLabel}>{rule.label}</div>
                      <div style={styles.ruleStatus}>
                        {broken
                          ? `BROKEN — ${violations} violation${violations > 1 ? "s" : ""}`
                          : violations > 0
                          ? `${violations}/${rule.maxViolations + 1} — holding`
                          : "HOLDING"
                        }
                      </div>
                    </div>
                    <button
                      style={styles.violationBtn}
                      onClick={() => reportViolation(rule.id)}
                    >
                      REPORT VIOLATION
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ====== DEBRIEF VIEW ====== */}
        {view === "debrief" && (
          <div style={styles.debriefView}>
            <h2 style={styles.sectionTitle}>DAILY DEBRIEF</h2>
            {dayState.debriefDone ? (
              <div style={styles.debriefDone}>
                <div style={styles.debriefDoneIcon}>✓</div>
                <p style={styles.debriefDoneText}>Debrief complete. Rest now.</p>
                <div style={styles.debriefAnswersList}>
                  {dayState.debriefAnswers.map((entry, i) => (
                    <div key={i} style={styles.debriefReview}>
                      <div style={styles.debriefQ}>{entry.question || entry}</div>
                      <div style={styles.debriefA}>{entry.answer || "—"}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={styles.debriefActive}>
                <div style={styles.debriefProgress}>
                  QUESTION {debriefStep + 1} OF {DEBRIEF_QUESTIONS.length}
                </div>
                <h3 style={styles.debriefQuestion}>{DEBRIEF_QUESTIONS[debriefStep]}</h3>
                <textarea
                  style={styles.debriefInput}
                  value={debriefInput}
                  onChange={e => setDebriefInput(e.target.value)}
                  placeholder="Answer honestly..."
                  rows={4}
                />
                <button
                  style={{
                    ...styles.completeBtn,
                    opacity: debriefInput.trim() ? 1 : 0.4,
                    cursor: debriefInput.trim() ? "pointer" : "default",
                  }}
                  onClick={submitDebrief}
                  disabled={!debriefInput.trim()}
                >
                  {debriefStep < DEBRIEF_QUESTIONS.length - 1 ? "NEXT →" : "FINISH DEBRIEF"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ====== SCORE VIEW ====== */}
        {view === "score" && (
          <div style={styles.scoreView}>
            <h2 style={styles.sectionTitle}>SHELBY SCORE</h2>
            {streakStatus() && (
              <div style={{ ...styles.streakStatusBanner, background: streakStatus().color + "22", border: `1px solid ${streakStatus().color}44` }}>
                <span style={{ ...styles.streakStatusLabel, color: streakStatus().color }}>{streakStatus().label}</span>
                <span style={styles.streakStatusSub}>{dayState.completed.length}/{missions.length} missions · {missions.length ? Math.round((dayState.completed.length / missions.length) * 100) : 0}% complete</span>
              </div>
            )}
            <div style={styles.bigScore}>
              <div style={styles.bigScoreNum}>{shelbyScore()}</div>
              <div style={styles.bigScoreLabel}>/ 100</div>
            </div>
            <div style={styles.scoreBreakdown}>
              <div style={styles.scoreStat}>
                <span style={styles.scoreStatLabel}>Missions Completed</span>
                <span style={styles.scoreStatVal}>{dayState.completed.length} / {missions.length}</span>
              </div>
              <div style={styles.scoreStat}>
                <span style={styles.scoreStatLabel}>Missions Failed</span>
                <span style={{ ...styles.scoreStatVal, color: dayState.failed.length > 0 ? "#C23B22" : "#3A8F6A" }}>
                  {dayState.failed.length}
                </span>
              </div>
              <div style={styles.scoreStat}>
                <span style={styles.scoreStatLabel}>Rule Violations</span>
                <span style={{ ...styles.scoreStatVal, color: Object.values(dayState.ruleViolations).reduce((a,b)=>a+b,0) > 0 ? "#C23B22" : "#3A8F6A" }}>
                  {Object.values(dayState.ruleViolations).reduce((a, b) => a + b, 0)}
                </span>
              </div>
              <div style={styles.scoreStat}>
                <span style={styles.scoreStatLabel}>Urges Controlled</span>
                <span style={styles.scoreStatVal}>{dayState.urgeCount}</span>
              </div>
              <div style={styles.scoreStat}>
                <span style={styles.scoreStatLabel}>Current Streak</span>
                <span style={{ ...styles.scoreStatVal, color: "#D4A03C" }}>{dayState.streak} days</span>
              </div>
              <div style={styles.scoreStat}>
                <span style={styles.scoreStatLabel}>Debrief</span>
                <span style={{ ...styles.scoreStatVal, color: dayState.debriefDone ? "#3A8F6A" : "#888" }}>
                  {dayState.debriefDone ? "DONE" : "PENDING"}
                </span>
              </div>
            </div>
            <div style={styles.scoreQuote}>
              "You don't get what you deserve. You get what you take."
            </div>
          </div>
        )}
        {/* ====== NOTES VIEW ====== */}
        {view === "notes" && (
          <div style={ns.container}>
            {notesCalView ? (
              /* ── CALENDAR VIEW ── */
              <div>
                <div style={ns.calTopRow}>
                  <button style={ns.calMonthArrow} onClick={() => {
                    const pm = prevMonth(notesCalMonth);
                    setNotesCalMonth(pm);
                    (async () => {
                      try {
                        const snap = await getDocs(collection(db, "users", user.uid, "notes"));
                        setNotesHasDates(new Set(snap.docs.map(d => d.id).filter(id => id.startsWith(pm))));
                      } catch {}
                    })();
                  }}>‹</button>
                  <div style={ns.calMonthLabel}>
                    {new Date(notesCalMonth + "-01T00:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase()}
                  </div>
                  <button style={ns.calMonthArrow} onClick={() => {
                    const nm = nextMonth(notesCalMonth);
                    setNotesCalMonth(nm);
                    (async () => {
                      try {
                        const snap = await getDocs(collection(db, "users", user.uid, "notes"));
                        setNotesHasDates(new Set(snap.docs.map(d => d.id).filter(id => id.startsWith(nm))));
                      } catch {}
                    })();
                  }}>›</button>
                </div>
                <div style={ns.calDow}>
                  {["SUN","MON","TUE","WED","THU","FRI","SAT"].map(d => (
                    <div key={d} style={ns.calDowCell}>{d}</div>
                  ))}
                </div>
                <div style={ns.calGrid}>
                  {buildCalendar(notesCalMonth).map((dateKey, i) => {
                    if (!dateKey) return <div key={i} />;
                    const today = todayKey();
                    const tomorrow = tomorrowKey();
                    const isToday = dateKey === today;
                    const isTomorrow = dateKey === tomorrow;
                    const isFut = dateKey > tomorrow;
                    const hasNote = notesHasDates.has(dateKey);
                    return (
                      <button
                        key={dateKey}
                        style={{
                          ...ns.calCell,
                          ...(isToday ? ns.calCellToday : {}),
                          ...(isTomorrow ? ns.calCellTomorrow : {}),
                          ...(isFut ? ns.calCellFuture : {}),
                          ...(notesDate === dateKey ? ns.calCellSelected : {}),
                        }}
                        onClick={() => {
                          setNotesDate(dateKey);
                          setNotesCalView(false);
                        }}
                      >
                        <span>{new Date(dateKey + "T00:00:00").getDate()}</span>
                        {hasNote && <div style={ns.calDot} />}
                      </button>
                    );
                  })}
                </div>
                <button style={ns.closeCal} onClick={() => setNotesCalView(false)}>BACK TO NOTE</button>
              </div>
            ) : (
              /* ── NOTE VIEW ── */
              (() => {
                const today = todayKey();
                const tomorrow = tomorrowKey();
                const isEditable = notesDate === today || notesDate === tomorrow;
                const isFuture = notesDate > tomorrow;
                const { label: dateLabel, tag } = formatNoteDate(notesDate);
                const isDirty = notesContent !== notesOriginal;
                return (
                  <>
                    {/* Date navigation row */}
                    <div style={ns.nav}>
                      <button style={ns.navArrow} onClick={() => setNotesDate(offsetDay(notesDate, -1))}>‹</button>
                      <button style={ns.dateBlock} onClick={() => {
                        setNotesCalMonth(notesDate.slice(0, 7));
                        setNotesCalView(true);
                      }}>
                        {tag && <div style={{ ...ns.dateTag, color: tag === "TODAY" ? "#D4A03C" : "#5B9BD5" }}>{tag}</div>}
                        <div style={ns.dateLabel}>{dateLabel}</div>
                        <div style={ns.calHint}>📅 calendar</div>
                      </button>
                      <button
                        style={{ ...ns.navArrow, opacity: notesDate > today ? 0.2 : 1, cursor: notesDate > today ? "default" : "pointer" }}
                        onClick={() => { if (notesDate <= today) setNotesDate(offsetDay(notesDate, 1)); }}
                      >›</button>
                    </div>

                    {notesDate !== today && (
                      <button style={ns.todayBtn} onClick={() => setNotesDate(today)}>JUMP TO TODAY</button>
                    )}

                    {notesLoading ? (
                      <div style={ns.loading}>loading...</div>
                    ) : isFuture ? (
                      <div style={ns.blocked}>
                        <div style={ns.blockedIcon}>—</div>
                        <div style={ns.blockedText}>You can only write notes for today and tomorrow.</div>
                      </div>
                    ) : isEditable ? (
                      <div style={ns.editorWrap}>
                        <textarea
                          style={ns.textarea}
                          value={notesContent}
                          onChange={e => setNotesContent(e.target.value)}
                          placeholder={notesDate === tomorrow
                            ? "Plan tomorrow. What must get done? What will you do differently?"
                            : "Capture today. What happened? What do you need to remember?"}
                          spellCheck={false}
                        />
                        <div style={ns.saveRow}>
                          {notesSavedMsg
                            ? <span style={ns.savedMsg}>{notesSavedMsg}</span>
                            : <span style={ns.charCount}>{notesContent.length} chars</span>
                          }
                          <button
                            style={{ ...ns.saveBtn, opacity: isDirty ? 1 : 0.35, cursor: isDirty ? "pointer" : "default" }}
                            onClick={saveNote}
                            disabled={!isDirty}
                          >SAVE</button>
                        </div>
                      </div>
                    ) : (
                      <div style={ns.readWrap}>
                        {notesContent
                          ? <pre style={ns.readText}>{notesContent}</pre>
                          : <div style={ns.emptyPast}>No notes for this day.</div>
                        }
                      </div>
                    )}
                  </>
                );
              })()
            )}
          </div>
        )}

        {/* ====== LEADERBOARD VIEW ====== */}
        {view === "leaderboard" && (
          <div style={styles.lbView}>
            <h2 style={styles.sectionTitle}>RANKS</h2>
            <p style={styles.lbSubtext}>Sorted by streak, then today's score.</p>

            {leaderboardLoading && (
              <div style={styles.lbLoading}>LOADING RANKS...</div>
            )}

            {!leaderboardLoading && leaderboard.length === 0 && (
              <div style={styles.lbEmpty}>No soldiers on the board yet.</div>
            )}

            {!leaderboardLoading && leaderboard.map((entry, i) => {
              const isMe = entry.uid === user.uid;
              const medal = i === 0 ? "#D4A03C" : i === 1 ? "#A0A0A0" : i === 2 ? "#8B5E3C" : null;
              return (
                <div key={entry.uid} style={{ ...styles.lbRow, ...(isMe ? styles.lbRowMe : {}) }}>
                  <div style={{ ...styles.lbRank, color: medal || "#444" }}>
                    {medal ? ["①","②","③"][i] : `#${i + 1}`}
                  </div>
                  <div style={styles.lbAvatar}>
                    {(entry.displayName || "?")[0].toUpperCase()}
                  </div>
                  <div style={styles.lbInfo}>
                    <div style={styles.lbName}>
                      {entry.displayName || "Soldier"}
                      {isMe && <span style={styles.lbYouBadge}> YOU</span>}
                    </div>
                    <div style={styles.lbProgressWrap}>
                      <div style={styles.lbProgressBar}>
                        <div style={{ ...styles.lbProgressFill, width: `${(entry.completed / entry.total) * 100}%` }} />
                      </div>
                      <span style={styles.lbProgressText}>{entry.completed}/{entry.total}</span>
                    </div>
                  </div>
                  <div style={styles.lbStats}>
                    <div style={styles.lbStreakNum}>{entry.streak}</div>
                    <div style={styles.lbStreakLabel}>STREAK</div>
                    <div style={styles.lbScoreNum}>{entry.score}</div>
                    <div style={styles.lbScoreLabel}>SCORE</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ====== ACCOUNT VIEW ====== */}
        {view === "account" && (
          <div style={styles.accountView}>
            <h2 style={styles.sectionTitle}>ACCOUNT</h2>

            <div style={styles.accountCard}>
              <div style={styles.accountAvatarLarge}>
                {(user.displayName || user.email || "?")[0].toUpperCase()}
              </div>
              <div style={styles.accountName}>{user.displayName || "—"}</div>
              <div style={styles.accountEmail}>{user.email}</div>
            </div>

            <div style={styles.accountSection}>
              <div style={styles.accountSectionTitle}>CHANGE NAME</div>
              <input
                style={styles.accountInput}
                placeholder={user.displayName || "Enter new name"}
                value={newDisplayName}
                onChange={e => setNewDisplayName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleChangeName()}
              />
              <button
                style={{ ...styles.accountBtn, opacity: newDisplayName.trim() ? 1 : 0.4 }}
                onClick={handleChangeName}
                disabled={!newDisplayName.trim()}
              >
                UPDATE NAME
              </button>
              {nameUpdateMsg && (
                <div style={styles.accountMsg}>{nameUpdateMsg}</div>
              )}
            </div>

            <div style={styles.accountSection}>
              <div style={styles.accountSectionTitle}>SESSION</div>
              <button
                style={styles.signOutBtn}
                onClick={() => signOut(auth)}
              >
                SIGN OUT
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#0A0A0A",
    color: "#E8E4DD",
    fontFamily: "'Inter', sans-serif",
    display: "flex",
    flexDirection: "column",
    maxWidth: "100%",
    overflow: "hidden",
  },
  loadingScreen: {
    minHeight: "100vh",
    background: "#0A0A0A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "24px",
    letterSpacing: "8px",
    color: "#D4A03C",
  },

  // Warning
  warningOverlay: {
    position: "fixed",
    top: 0, left: 0, right: 0,
    zIndex: 999,
    background: "linear-gradient(135deg, #8B0000, #C23B22)",
    padding: "20px",
    textAlign: "center",
    animation: "none",
    borderBottom: "2px solid #FF4444",
  },
  warningIcon: { fontSize: "32px", marginBottom: "4px" },
  warningText: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "18px",
    letterSpacing: "2px",
    color: "#fff",
  },

  // Header
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid #1A1A1A",
    flexWrap: "wrap",
    gap: "12px",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "12px" },
  logo: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "28px",
    color: "#D4A03C",
    letterSpacing: "3px",
    lineHeight: 1,
  },
  titleBlock: {},
  title: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "14px",
    letterSpacing: "4px",
    color: "#888",
  },
  subtitle: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    color: "#555",
    marginTop: "2px",
  },
  headerRight: { display: "flex", gap: "16px" },
  streakBadge: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "4px 12px",
    background: "#141414",
    borderRadius: "4px",
    border: "1px solid #222",
  },
  streakNum: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "24px",
    color: "#D4A03C",
    lineHeight: 1,
  },
  streakLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "8px",
    letterSpacing: "1px",
    color: "#666",
  },
  scoreBadge: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "4px 12px",
    background: "#141414",
    borderRadius: "4px",
    border: "1px solid #222",
  },
  scoreNum: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "24px",
    color: "#E8E4DD",
    lineHeight: 1,
  },
  scoreLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "8px",
    letterSpacing: "1px",
    color: "#666",
  },

  // Nav
  nav: {
    display: "flex",
    borderBottom: "1px solid #1A1A1A",
    overflow: "auto",
  },
  navBtn: {
    flex: 1,
    padding: "12px 8px",
    background: "none",
    border: "none",
    borderBottom: "2px solid transparent",
    color: "#555",
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "14px",
    letterSpacing: "2px",
    cursor: "pointer",
    minWidth: "fit-content",
    transition: "all 0.2s",
  },
  navBtnActive: {
    color: "#D4A03C",
    borderBottomColor: "#D4A03C",
  },

  main: {
    flex: 1,
    padding: "24px 20px",
    overflow: "auto",
  },

  // Command View
  commandView: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "20px",
  },
  categoryTag: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px",
    letterSpacing: "3px",
    padding: "4px 12px",
    borderRadius: "2px",
    color: "#0A0A0A",
    fontWeight: 700,
  },
  missionTime: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "14px",
    color: "#555",
  },
  commandTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "clamp(36px, 8vw, 56px)",
    letterSpacing: "4px",
    lineHeight: 1.05,
    color: "#E8E4DD",
    margin: 0,
  },
  commandText: {
    fontSize: "15px",
    lineHeight: 1.6,
    color: "#999",
    maxWidth: "400px",
    margin: 0,
  },
  timerBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    width: "100%",
    maxWidth: "300px",
  },
  timerDisplay: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "56px",
    color: "#D4A03C",
    letterSpacing: "4px",
    lineHeight: 1,
  },
  startBtn: {
    background: "#D4A03C",
    color: "#0A0A0A",
    border: "none",
    padding: "10px 32px",
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "16px",
    letterSpacing: "3px",
    cursor: "pointer",
    borderRadius: "2px",
  },
  timerBar: {
    width: "100%",
    height: "4px",
    background: "#1A1A1A",
    borderRadius: "2px",
    overflow: "hidden",
  },
  timerFill: {
    height: "100%",
    background: "#D4A03C",
    transition: "width 1s linear",
    borderRadius: "2px",
  },
  actionRow: {
    display: "flex",
    gap: "12px",
    width: "100%",
    maxWidth: "360px",
  },
  completeBtn: {
    flex: 1,
    padding: "14px 20px",
    background: "#3A8F6A",
    color: "#fff",
    border: "none",
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "16px",
    letterSpacing: "2px",
    cursor: "pointer",
    borderRadius: "2px",
    transition: "opacity 0.2s",
  },
  failBtn: {
    flex: 1,
    padding: "14px 20px",
    background: "#C23B22",
    color: "#fff",
    border: "none",
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "16px",
    letterSpacing: "2px",
    cursor: "pointer",
    borderRadius: "2px",
  },
  urgeBtn: {
    padding: "12px 32px",
    background: "none",
    border: "1px solid #333",
    color: "#888",
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "14px",
    letterSpacing: "3px",
    cursor: "pointer",
    borderRadius: "2px",
    marginTop: "8px",
    transition: "all 0.2s",
  },
  progressRow: {
    width: "100%",
    maxWidth: "360px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "16px",
  },
  progressLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "9px",
    letterSpacing: "1px",
    color: "#555",
    whiteSpace: "nowrap",
  },
  progressBar: {
    flex: 1,
    height: "3px",
    background: "#1A1A1A",
    borderRadius: "2px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "#3A8F6A",
    transition: "width 0.3s",
  },
  progressText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    color: "#666",
  },

  // Urge View
  urgeView: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "24px",
    textAlign: "center",
  },
  urgeHeader: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "14px",
    letterSpacing: "6px",
    color: "#C23B22",
  },
  urgeCard: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: "4px",
    padding: "32px 24px",
    maxWidth: "400px",
    width: "100%",
  },
  urgeStep: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px",
    color: "#555",
    letterSpacing: "2px",
    marginBottom: "16px",
  },
  urgeTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "32px",
    letterSpacing: "3px",
    color: "#D4A03C",
    margin: "0 0 12px 0",
  },
  urgeText: {
    fontSize: "15px",
    lineHeight: 1.6,
    color: "#999",
    margin: 0,
  },
  urgeActions: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    width: "100%",
    maxWidth: "300px",
  },
  secondaryBtn: {
    padding: "10px 20px",
    background: "none",
    border: "1px solid #333",
    color: "#666",
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "14px",
    letterSpacing: "2px",
    cursor: "pointer",
    borderRadius: "2px",
  },

  // Schedule View
  scheduleView: {},
  scheduleHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0",
  },
  editScheduleBtn: {
    padding: "6px 14px",
    background: "transparent",
    border: "1px solid #2A2A2A",
    borderRadius: "4px",
    color: "#D4A03C",
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "12px",
    letterSpacing: "2px",
    cursor: "pointer",
    marginBottom: "16px",
  },
  sectionTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "28px",
    letterSpacing: "4px",
    color: "#D4A03C",
    margin: "0 0 16px 0",
  },
  scheduleList: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  scheduleItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    background: "#0F0F0F",
    borderRadius: "2px",
    cursor: "pointer",
    transition: "background 0.15s",
    borderLeft: "3px solid transparent",
  },
  scheduleItemCurrent: {
    background: "#141410",
    borderLeftColor: "#D4A03C",
  },
  scheduleItemDone: { opacity: 0.5 },
  scheduleItemFail: { opacity: 0.5 },
  scheduleTime: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "12px",
    color: "#555",
    minWidth: "42px",
  },
  scheduleInfo: { flex: 1 },
  scheduleLabel: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "16px",
    letterSpacing: "1px",
    color: "#ccc",
  },
  scheduleDur: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px",
    color: "#444",
  },
  scheduleDot: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    color: "#fff",
    fontWeight: 700,
    flexShrink: 0,
  },

  // Rules
  rulesView: {},
  rulesSubtext: {
    fontSize: "13px",
    color: "#555",
    margin: "0 0 20px 0",
  },
  rulesList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  ruleCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px",
    background: "#0F0F0F",
    borderRadius: "4px",
    border: "1px solid #1A1A1A",
    gap: "12px",
    flexWrap: "wrap",
  },
  ruleCardBroken: {
    borderColor: "#C23B22",
    background: "#120808",
  },
  ruleInfo: { flex: 1 },
  ruleLabel: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "18px",
    letterSpacing: "1px",
    color: "#ccc",
  },
  ruleStatus: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px",
    color: "#666",
    letterSpacing: "1px",
    marginTop: "4px",
  },
  violationBtn: {
    padding: "8px 16px",
    background: "none",
    border: "1px solid #333",
    color: "#C23B22",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px",
    letterSpacing: "1px",
    cursor: "pointer",
    borderRadius: "2px",
    whiteSpace: "nowrap",
  },

  // Debrief
  debriefView: {},
  debriefActive: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    maxWidth: "500px",
  },
  debriefProgress: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px",
    letterSpacing: "3px",
    color: "#555",
  },
  debriefQuestion: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "28px",
    letterSpacing: "2px",
    color: "#E8E4DD",
    margin: 0,
    lineHeight: 1.2,
  },
  debriefInput: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: "4px",
    color: "#E8E4DD",
    fontFamily: "'Inter', sans-serif",
    fontSize: "14px",
    padding: "14px",
    resize: "vertical",
    outline: "none",
    lineHeight: 1.5,
  },
  debriefDone: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    textAlign: "center",
  },
  debriefDoneIcon: {
    fontSize: "48px",
    color: "#3A8F6A",
  },
  debriefDoneText: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "24px",
    letterSpacing: "3px",
    color: "#888",
  },
  debriefAnswersList: {
    width: "100%",
    maxWidth: "500px",
    textAlign: "left",
  },
  debriefReview: {
    padding: "12px 0",
    borderBottom: "1px solid #1A1A1A",
  },
  debriefQ: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    color: "#555",
    marginBottom: "4px",
  },
  debriefA: {
    fontSize: "14px",
    color: "#ccc",
    lineHeight: 1.4,
  },

  // Score
  scoreView: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "24px",
  },
  streakStatusBanner: {
    width: "100%",
    borderRadius: "6px",
    padding: "14px 18px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },
  streakStatusLabel: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "22px",
    letterSpacing: "4px",
  },
  streakStatusSub: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px",
    color: "#666",
  },
  bigScore: {
    display: "flex",
    alignItems: "baseline",
    gap: "8px",
  },
  bigScoreNum: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "96px",
    color: "#D4A03C",
    lineHeight: 1,
  },
  bigScoreLabel: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "24px",
    color: "#333",
  },
  scoreBreakdown: {
    width: "100%",
    maxWidth: "400px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  scoreStat: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 16px",
    background: "#0F0F0F",
    borderRadius: "2px",
  },
  scoreStatLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    color: "#666",
  },
  scoreStatVal: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "13px",
    color: "#ccc",
    fontWeight: 700,
  },
  scoreQuote: {
    fontFamily: "'Inter', sans-serif",
    fontSize: "13px",
    fontStyle: "italic",
    color: "#444",
    marginTop: "16px",
    textAlign: "center",
    maxWidth: "300px",
  },

  // Account view
  accountView: {
    padding: "24px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    maxWidth: "480px",
    margin: "0 auto",
    width: "100%",
  },
  accountCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    padding: "24px",
    background: "#111",
    border: "1px solid #1A1A1A",
    borderRadius: "6px",
  },
  accountAvatarLarge: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    background: "#D4A03C",
    color: "#0A0A0A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "32px",
    marginBottom: "4px",
  },
  accountName: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "22px",
    letterSpacing: "3px",
    color: "#E8E4DD",
  },
  accountEmail: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    color: "#555",
  },
  accountSection: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "20px",
    background: "#111",
    border: "1px solid #1A1A1A",
    borderRadius: "6px",
  },
  accountSectionTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "12px",
    letterSpacing: "3px",
    color: "#555",
    marginBottom: "4px",
  },
  accountInput: {
    width: "100%",
    padding: "10px 12px",
    background: "#0A0A0A",
    border: "1px solid #2A2A2A",
    borderRadius: "4px",
    color: "#E8E4DD",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "13px",
    outline: "none",
  },
  accountBtn: {
    padding: "11px",
    background: "#D4A03C",
    border: "none",
    borderRadius: "4px",
    color: "#0A0A0A",
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "14px",
    letterSpacing: "2px",
    cursor: "pointer",
  },
  accountMsg: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    color: "#3A8F6A",
    textAlign: "center",
  },
  signOutBtn: {
    padding: "11px",
    background: "transparent",
    border: "1px solid #C23B22",
    borderRadius: "4px",
    color: "#C23B22",
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "14px",
    letterSpacing: "2px",
    cursor: "pointer",
  },
  bellBtn: {
    background: "none",
    border: "1px solid #2A2A2A",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "18px",
    padding: "4px 8px",
    lineHeight: 1,
  },
  accountAvatarBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
  },
  accountAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#D4A03C",
    color: "#0A0A0A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "18px",
  },

  // Leaderboard
  lbView: {
    padding: "24px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxWidth: "600px",
    margin: "0 auto",
    width: "100%",
  },
  lbSubtext: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    color: "#444",
    marginTop: "-6px",
    marginBottom: "6px",
  },
  lbLoading: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "16px",
    letterSpacing: "4px",
    color: "#444",
    textAlign: "center",
    padding: "40px 0",
  },
  lbEmpty: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "12px",
    color: "#444",
    textAlign: "center",
    padding: "40px 0",
  },
  lbRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 16px",
    background: "#111",
    border: "1px solid #1A1A1A",
    borderRadius: "6px",
  },
  lbRowMe: {
    border: "1px solid #D4A03C44",
    background: "#161410",
  },
  lbRank: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "20px",
    minWidth: "32px",
    textAlign: "center",
  },
  lbAvatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "#1E1E1E",
    color: "#D4A03C",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "20px",
    flexShrink: 0,
  },
  lbInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: 0,
  },
  lbName: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "16px",
    letterSpacing: "2px",
    color: "#E8E4DD",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  lbYouBadge: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "9px",
    color: "#D4A03C",
    background: "rgba(212,160,60,0.12)",
    padding: "1px 5px",
    borderRadius: "2px",
    marginLeft: "6px",
    verticalAlign: "middle",
  },
  lbProgressWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  lbProgressBar: {
    flex: 1,
    height: "4px",
    background: "#1E1E1E",
    borderRadius: "2px",
    overflow: "hidden",
  },
  lbProgressFill: {
    height: "100%",
    background: "#3A8F6A",
    borderRadius: "2px",
    transition: "width 0.4s ease",
  },
  lbProgressText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px",
    color: "#555",
    flexShrink: 0,
  },
  lbStats: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    flexShrink: 0,
  },
  lbStreakNum: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "22px",
    color: "#D4A03C",
    lineHeight: 1,
  },
  lbStreakLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "8px",
    color: "#555",
    letterSpacing: "1px",
  },
  lbScoreNum: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "16px",
    color: "#888",
    lineHeight: 1,
  },
  lbScoreLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "8px",
    color: "#444",
    letterSpacing: "1px",
  },
};

const ns = {
  container: {
    display: "flex",
    flexDirection: "column",
    maxWidth: "620px",
    margin: "0 auto",
    width: "100%",
    padding: "24px 20px 40px",
    minHeight: "100%",
  },

  // ── note view ──
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "20px",
  },
  navArrow: {
    background: "none",
    border: "none",
    color: "#555",
    fontSize: "28px",
    lineHeight: 1,
    cursor: "pointer",
    padding: "4px 12px",
    fontFamily: "'Inter', sans-serif",
  },
  dateBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "3px",
    flex: 1,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px 0",
  },
  dateTag: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "11px",
    letterSpacing: "3px",
  },
  dateLabel: {
    fontFamily: "'Inter', sans-serif",
    fontWeight: 600,
    fontSize: "13px",
    color: "#888",
    letterSpacing: "0.5px",
    textAlign: "center",
  },
  calHint: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "9px",
    color: "#444",
    marginTop: "2px",
    letterSpacing: "0.5px",
  },
  todayBtn: {
    alignSelf: "center",
    background: "none",
    border: "1px solid #1E1E1E",
    borderRadius: "4px",
    color: "#3A3A3A",
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "10px",
    letterSpacing: "2px",
    padding: "5px 12px",
    cursor: "pointer",
    marginBottom: "20px",
  },
  loading: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    color: "#333",
    textAlign: "center",
    marginTop: "60px",
  },
  blocked: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    marginTop: "60px",
  },
  blockedIcon: { fontFamily: "'JetBrains Mono', monospace", fontSize: "32px", color: "#2A2A2A" },
  blockedText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    color: "#333",
    textAlign: "center",
    lineHeight: 1.6,
  },
  editorWrap: { display: "flex", flexDirection: "column", flex: 1, gap: "12px" },
  textarea: {
    flex: 1,
    minHeight: "360px",
    background: "#0D0D0D",
    border: "1px solid #1C1C1C",
    borderRadius: "6px",
    color: "#D8D4CE",
    fontFamily: "'Inter', sans-serif",
    fontSize: "15px",
    lineHeight: "1.75",
    padding: "20px",
    outline: "none",
    resize: "none",
  },
  saveRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  charCount: { fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "#2A2A2A" },
  savedMsg: { fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "#3A8F6A" },
  saveBtn: {
    background: "none",
    border: "1px solid #2A2A2A",
    borderRadius: "4px",
    color: "#D4A03C",
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "12px",
    letterSpacing: "2px",
    padding: "6px 16px",
    cursor: "pointer",
  },
  readWrap: {
    background: "#0D0D0D",
    border: "1px solid #1C1C1C",
    borderRadius: "6px",
    padding: "20px",
    minHeight: "200px",
  },
  readText: {
    fontFamily: "'Inter', sans-serif",
    fontSize: "15px",
    lineHeight: "1.75",
    color: "#888",
    margin: 0,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  emptyPast: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    color: "#2A2A2A",
    textAlign: "center",
    paddingTop: "40px",
  },

  // ── calendar view ──
  calTopRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "20px",
  },
  calMonthArrow: {
    background: "none",
    border: "none",
    color: "#555",
    fontSize: "24px",
    cursor: "pointer",
    padding: "4px 12px",
    fontFamily: "'Inter', sans-serif",
  },
  calMonthLabel: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "18px",
    letterSpacing: "4px",
    color: "#D8D4CE",
  },
  calDow: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    marginBottom: "6px",
  },
  calDowCell: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "9px",
    color: "#333",
    textAlign: "center",
    padding: "4px 0",
    letterSpacing: "0.5px",
  },
  calGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "4px",
    marginBottom: "24px",
  },
  calCell: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    aspectRatio: "1",
    background: "none",
    border: "1px solid #181818",
    borderRadius: "6px",
    color: "#666",
    fontFamily: "'Inter', sans-serif",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    gap: "2px",
  },
  calCellToday: { border: "1px solid #D4A03C44", color: "#D4A03C" },
  calCellTomorrow: { border: "1px solid #5B9BD544", color: "#5B9BD5" },
  calCellFuture: { color: "#272727", cursor: "default", border: "1px solid #111" },
  calCellSelected: { background: "#1A1A1A", border: "1px solid #D4A03C" },
  calDot: {
    width: "4px",
    height: "4px",
    borderRadius: "50%",
    background: "#D4A03C",
    position: "absolute",
    bottom: "5px",
  },
  closeCal: {
    display: "block",
    width: "100%",
    padding: "12px",
    background: "none",
    border: "1px solid #1E1E1E",
    borderRadius: "6px",
    color: "#3A3A3A",
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "13px",
    letterSpacing: "3px",
    cursor: "pointer",
  },
};
