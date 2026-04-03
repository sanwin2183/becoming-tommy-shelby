import { useState } from "react";
import { TEMPLATES, ADD_ONS, CATEGORIES, shiftMissions, applyAddOns } from "./templates";

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState(null);
  const [wakeTime, setWakeTime] = useState("05:00");
  const [activeAddOns, setActiveAddOns] = useState([]);

  const pickTemplate = (t) => {
    setSelected(t);
    setWakeTime(t.defaultWakeTime);
  };

  const toggleAddOn = (id) =>
    setActiveAddOns((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));

  const handleComplete = () => {
    const shifted = shiftMissions(selected.missions, selected.defaultWakeTime, wakeTime);
    const final = applyAddOns(shifted, activeAddOns, wakeTime);
    onComplete({ templateId: selected.id, templateName: selected.name, wakeTime, addOns: activeAddOns, missions: final });
  };

  const previewMissions = selected
    ? shiftMissions(selected.missions, selected.defaultWakeTime, wakeTime).slice(0, 5)
    : [];

  return (
    <div style={s.container}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* ── HEADER ── */}
      <div style={s.header}>
        <div style={s.logo}>BTS</div>
        <div style={s.stepRow}>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{ ...s.stepDot, ...(step >= n ? s.stepDotActive : {}) }} />
          ))}
        </div>
      </div>

      {/* ══ SCREEN 1: CHOOSE YOUR PATH ══ */}
      {step === 1 && (
        <div style={s.screen}>
          <div style={s.headline}>CHOOSE YOUR PATH</div>
          <div style={s.subline}>Every great life starts with a plan. Pick the one that fits yours.</div>
          <div style={s.templateGrid}>
            {TEMPLATES.map((t) => (
              <div
                key={t.id}
                style={{ ...s.card, ...(selected?.id === t.id ? s.cardSelected : {}) }}
                onClick={() => pickTemplate(t)}
              >
                <div style={s.cardEmoji}>{t.emoji}</div>
                <div style={s.cardName}>{t.name}</div>
                <div style={s.cardDesc}>{t.description}</div>
                <div style={s.cardTagline}>{t.tagline}</div>
                <div style={s.cardCount}>{t.missions.length} TASKS</div>
              </div>
            ))}
          </div>
          <button
            style={{ ...s.primaryBtn, opacity: selected ? 1 : 0.3 }}
            disabled={!selected}
            onClick={() => setStep(2)}
          >
            NEXT — ADJUST WAKE TIME →
          </button>
        </div>
      )}

      {/* ══ SCREEN 2: ADJUST WAKE TIME ══ */}
      {step === 2 && (
        <div style={s.screen}>
          <div style={s.headline}>ADJUST YOUR WAKE TIME</div>
          <div style={s.subline}>All task times shift relative to when you wake up.</div>

          <div style={s.wakeCard}>
            <div style={s.wakeLabel}>WAKE TIME</div>
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              style={s.timeInput}
            />
          </div>

          <div style={s.previewBox}>
            <div style={s.previewTitle}>PREVIEW — FIRST 5 TASKS</div>
            {previewMissions.map((m) => (
              <div key={m.id} style={s.previewRow}>
                <span style={{ ...s.previewDot, background: CATEGORIES[m.category]?.color || "#888" }} />
                <span style={s.previewTime}>{m.time}</span>
                <span style={s.previewLabel}>{m.label}</span>
              </div>
            ))}
          </div>

          <div style={s.btnRow}>
            <button style={s.backBtn} onClick={() => setStep(1)}>← BACK</button>
            <button style={s.primaryBtn} onClick={() => setStep(3)}>NEXT — ADD YOUR LIFE →</button>
          </div>
        </div>
      )}

      {/* ══ SCREEN 3: ADD YOUR LIFE ══ */}
      {step === 3 && (
        <div style={s.screen}>
          <div style={s.headline}>ADD YOUR LIFE</div>
          <div style={s.subline}>Toggle anything that applies. These tasks will be added to your schedule.</div>

          <div style={s.addOnList}>
            {ADD_ONS.map((a) => {
              const active = activeAddOns.includes(a.id);
              return (
                <div
                  key={a.id}
                  style={{ ...s.addOnRow, ...(active ? s.addOnRowActive : {}) }}
                  onClick={() => toggleAddOn(a.id)}
                >
                  <span style={s.addOnEmoji}>{a.emoji}</span>
                  <div style={s.addOnInfo}>
                    <div style={s.addOnLabel}>{a.label}</div>
                    <div style={s.addOnDesc}>{a.description}</div>
                  </div>
                  <div style={{ ...s.toggle, ...(active ? s.toggleOn : {}) }}>
                    <div style={{ ...s.toggleThumb, ...(active ? s.toggleThumbOn : {}) }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={s.btnRow}>
            <button style={s.backBtn} onClick={() => setStep(2)}>← BACK</button>
            <button style={s.primaryBtn} onClick={handleComplete}>EXECUTE. THIS IS YOUR DAY. →</button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  container: {
    minHeight: "100vh",
    background: "#0A0A0A",
    color: "#E8E4DD",
    fontFamily: "'Inter', sans-serif",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid #1A1A1A",
  },
  logo: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "28px",
    color: "#D4A03C",
    letterSpacing: "4px",
  },
  stepRow: { display: "flex", gap: "8px", alignItems: "center" },
  stepDot: {
    width: "8px", height: "8px", borderRadius: "50%",
    background: "#222", transition: "background 0.2s",
  },
  stepDotActive: { background: "#D4A03C" },
  screen: {
    flex: 1,
    padding: "28px 20px 40px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    maxWidth: "640px",
    margin: "0 auto",
    width: "100%",
  },
  headline: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "32px",
    letterSpacing: "4px",
    color: "#E8E4DD",
    lineHeight: 1,
  },
  subline: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    color: "#555",
    marginTop: "-8px",
  },

  // Template cards
  templateGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  card: {
    background: "#111",
    border: "1px solid #1E1E1E",
    borderRadius: "6px",
    padding: "16px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    transition: "border-color 0.15s",
  },
  cardSelected: {
    border: "1px solid #D4A03C",
    background: "#141209",
  },
  cardEmoji: { fontSize: "22px" },
  cardName: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "16px",
    letterSpacing: "2px",
    color: "#E8E4DD",
  },
  cardDesc: {
    fontFamily: "'Inter', sans-serif",
    fontSize: "10px",
    color: "#555",
    lineHeight: 1.4,
  },
  cardTagline: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "9px",
    color: "#D4A03C",
    fontStyle: "italic",
  },
  cardCount: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "9px",
    color: "#333",
    marginTop: "4px",
  },

  // Wake time
  wakeCard: {
    background: "#111",
    border: "1px solid #1E1E1E",
    borderRadius: "6px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  wakeLabel: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "12px",
    letterSpacing: "3px",
    color: "#555",
  },
  timeInput: {
    background: "#0A0A0A",
    border: "1px solid #333",
    borderRadius: "4px",
    color: "#D4A03C",
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "48px",
    letterSpacing: "4px",
    padding: "8px 16px",
    textAlign: "center",
    outline: "none",
    width: "220px",
  },

  // Preview
  previewBox: {
    background: "#111",
    border: "1px solid #1E1E1E",
    borderRadius: "6px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  previewTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "11px",
    letterSpacing: "3px",
    color: "#444",
    marginBottom: "2px",
  },
  previewRow: { display: "flex", alignItems: "center", gap: "10px" },
  previewDot: { width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0 },
  previewTime: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "12px",
    color: "#D4A03C",
    minWidth: "44px",
  },
  previewLabel: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "13px",
    letterSpacing: "1px",
    color: "#E8E4DD",
  },

  // Add-ons
  addOnList: { display: "flex", flexDirection: "column", gap: "8px" },
  addOnRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "14px 16px",
    background: "#111",
    border: "1px solid #1E1E1E",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "border-color 0.15s",
  },
  addOnRowActive: { border: "1px solid #D4A03C44", background: "#131210" },
  addOnEmoji: { fontSize: "20px", flexShrink: 0 },
  addOnInfo: { flex: 1 },
  addOnLabel: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "14px",
    letterSpacing: "2px",
    color: "#E8E4DD",
  },
  addOnDesc: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px",
    color: "#555",
    marginTop: "2px",
  },
  toggle: {
    width: "40px", height: "22px", borderRadius: "11px",
    background: "#222", position: "relative", flexShrink: 0,
    transition: "background 0.2s",
  },
  toggleOn: { background: "#D4A03C" },
  toggleThumb: {
    position: "absolute", top: "3px", left: "3px",
    width: "16px", height: "16px", borderRadius: "50%",
    background: "#555", transition: "left 0.2s, background 0.2s",
  },
  toggleThumbOn: { left: "21px", background: "#0A0A0A" },

  // Buttons
  primaryBtn: {
    padding: "15px",
    background: "#D4A03C",
    border: "none",
    borderRadius: "4px",
    color: "#0A0A0A",
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "15px",
    letterSpacing: "2px",
    cursor: "pointer",
  },
  backBtn: {
    padding: "15px 20px",
    background: "transparent",
    border: "1px solid #2A2A2A",
    borderRadius: "4px",
    color: "#555",
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "14px",
    letterSpacing: "2px",
    cursor: "pointer",
    flexShrink: 0,
  },
  btnRow: { display: "flex", gap: "10px" },
};
