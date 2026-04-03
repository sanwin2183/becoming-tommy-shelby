import { useState } from "react";
import { CATEGORIES, timeToMinutes } from "./templates";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS = { monday: "MON", tuesday: "TUE", wednesday: "WED", thursday: "THU", friday: "FRI", saturday: "SAT", sunday: "SUN" };
const BLANK_FORM = { label: "", time: "08:00", duration: 30, command: "", category: "work" };

export default function ScheduleEditor({ weekly: initial, onSave, onClose, onReset }) {
  const todayDayName = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const [weekly, setWeekly] = useState(() => {
    const w = {};
    for (const d of DAYS) w[d] = [...(initial[d] || [])];
    return w;
  });
  const [activeDay, setActiveDay] = useState(todayDayName);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState(BLANK_FORM);
  const [copyOpen, setCopyOpen] = useState(false);
  const [copyTargets, setCopyTargets] = useState([]);
  const [sameEveryDay, setSameEveryDay] = useState(false);

  const sorted = [...(weekly[activeDay] || [])].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  const updateDay = (day, newMissions) =>
    setWeekly(prev => ({ ...prev, [day]: newMissions.map((m, i) => ({ ...m, id: i + 1 })) }));

  const updateActiveDay = (newMissions) => {
    if (sameEveryDay) {
      const reindexed = newMissions.map((m, i) => ({ ...m, id: i + 1 }));
      setWeekly(() => Object.fromEntries(DAYS.map(d => [d, reindexed])));
    } else {
      updateDay(activeDay, newMissions);
    }
  };

  const startEdit = (m) => {
    setAdding(false);
    setEditingId(m.id);
    setForm({ label: m.label, time: m.time, duration: m.duration, command: m.command, category: m.category });
  };

  const saveEdit = () => {
    const updated = sorted.map(m =>
      m.id === editingId ? { ...m, ...form, duration: Number(form.duration) } : m
    );
    updateActiveDay(updated);
    setEditingId(null);
  };

  const deleteTask = (id) => {
    updateActiveDay(sorted.filter(m => m.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const moveUp = (idx) => {
    if (idx === 0) return;
    const arr = [...sorted];
    const tmp = arr[idx].time;
    arr[idx] = { ...arr[idx], time: arr[idx - 1].time };
    arr[idx - 1] = { ...arr[idx - 1], time: tmp };
    updateActiveDay(arr);
  };

  const moveDown = (idx) => {
    if (idx === sorted.length - 1) return;
    const arr = [...sorted];
    const tmp = arr[idx].time;
    arr[idx] = { ...arr[idx], time: arr[idx + 1].time };
    arr[idx + 1] = { ...arr[idx + 1], time: tmp };
    updateActiveDay(arr);
  };

  const addTask = () => {
    const newId = (weekly[activeDay] || []).length > 0
      ? Math.max(...(weekly[activeDay] || []).map(m => m.id)) + 1 : 1;
    const combined = [...(weekly[activeDay] || []), { ...addForm, id: newId, duration: Number(addForm.duration) }];
    updateActiveDay(combined);
    setAdding(false);
    setAddForm(BLANK_FORM);
  };

  const applyCopy = () => {
    const src = weekly[activeDay];
    const updated = { ...weekly };
    for (const d of copyTargets) updated[d] = src.map((m, i) => ({ ...m, id: i + 1 }));
    setWeekly(updated);
    setCopyOpen(false);
    setCopyTargets([]);
  };

  const toggleSameEveryDay = () => {
    if (!sameEveryDay) {
      const src = weekly[activeDay];
      setWeekly(Object.fromEntries(DAYS.map(d => [d, src.map((m, i) => ({ ...m, id: i + 1 }))])));
    }
    setSameEveryDay(s => !s);
  };

  const Field = ({ label, children }) => (
    <div style={s.field}>
      <div style={s.fieldLabel}>{label}</div>
      {children}
    </div>
  );

  const EditForm = ({ f, setF, onSave: onS, onCancel }) => (
    <div style={s.editForm}>
      <Field label="LABEL">
        <input style={s.input} value={f.label} onChange={e => setF({ ...f, label: e.target.value })} placeholder="TASK NAME" />
      </Field>
      <div style={s.formRow}>
        <Field label="TIME">
          <input type="time" style={s.input} value={f.time} onChange={e => setF({ ...f, time: e.target.value })} />
        </Field>
        <Field label="DURATION (MIN)">
          <input type="number" style={s.input} value={f.duration} min="0" max="480"
            onChange={e => setF({ ...f, duration: e.target.value })} />
        </Field>
      </div>
      <Field label="CATEGORY">
        <select style={s.input} value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>
          {Object.entries(CATEGORIES).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </Field>
      <Field label="COMMAND (INSTRUCTION TEXT)">
        <textarea style={{ ...s.input, ...s.textarea }} value={f.command}
          onChange={e => setF({ ...f, command: e.target.value })} placeholder="What must be done." rows={2} />
      </Field>
      <div style={s.formBtnRow}>
        <button style={s.saveBtn} onClick={onS} disabled={!f.label.trim()}>SAVE</button>
        <button style={s.cancelBtn} onClick={onCancel}>CANCEL</button>
      </div>
    </div>
  );

  return (
    <div style={s.container}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.title}>WEEKLY SCHEDULE</div>
          <div style={s.subtitle}>{sorted.length} tasks on {activeDay.toUpperCase()}</div>
        </div>
        <div style={s.headerBtns}>
          <button style={s.resetBtn} onClick={onReset}>RESET TO TEMPLATE</button>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>
      </div>

      {/* Day tabs */}
      <div style={s.dayTabs}>
        {DAYS.map(day => (
          <button
            key={day}
            style={{ ...s.dayTab, ...(activeDay === day ? s.dayTabActive : {}) }}
            onClick={() => { setActiveDay(day); setEditingId(null); setAdding(false); }}
          >
            {DAY_LABELS[day]}
            <div style={{ ...s.dayTabDot, background: activeDay === day ? "#D4A03C" : "#2A2A2A" }} />
          </button>
        ))}
      </div>

      {/* Tools bar */}
      <div style={s.toolBar}>
        <button
          style={{ ...s.toolBtn, ...(sameEveryDay ? s.toolBtnActive : {}) }}
          onClick={toggleSameEveryDay}
        >
          {sameEveryDay ? "✓ " : ""}SAME EVERY DAY
        </button>
        <button style={s.toolBtn} onClick={() => { setCopyOpen(o => !o); setCopyTargets([]); }}>
          COPY TO...
        </button>
      </div>

      {/* Copy panel */}
      {copyOpen && (
        <div style={s.copyPanel}>
          <div style={s.copyTitle}>COPY {activeDay.toUpperCase()} TO:</div>
          <div style={s.copyDays}>
            {DAYS.filter(d => d !== activeDay).map(d => (
              <button
                key={d}
                style={{ ...s.copyDayBtn, ...(copyTargets.includes(d) ? s.copyDayBtnActive : {}) }}
                onClick={() => setCopyTargets(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
              >
                {DAY_LABELS[d]}
              </button>
            ))}
            <button
              style={{ ...s.copyDayBtn, ...(copyTargets.length === 6 ? s.copyDayBtnActive : {}) }}
              onClick={() => setCopyTargets(copyTargets.length === 6 ? [] : DAYS.filter(d => d !== activeDay))}
            >ALL</button>
          </div>
          <div style={s.copyActions}>
            <button style={s.saveBtn} disabled={copyTargets.length === 0} onClick={applyCopy}>APPLY COPY</button>
            <button style={s.cancelBtn} onClick={() => { setCopyOpen(false); setCopyTargets([]); }}>CANCEL</button>
          </div>
        </div>
      )}

      {/* Mission list */}
      <div style={s.list}>
        {sorted.map((m, idx) => (
          <div key={m.id}>
            <div style={{ ...s.row, ...(editingId === m.id ? s.rowEditing : {}) }}>
              <div style={{ ...s.catDot, background: CATEGORIES[m.category]?.color || "#888" }} />
              <div style={s.rowTime}>{m.time}</div>
              <div style={s.rowInfo}>
                <div style={s.rowLabel}>{m.label}</div>
                {m.duration > 0 && <div style={s.rowDur}>{m.duration} min</div>}
              </div>
              <div style={s.rowBtns}>
                <button style={s.iconBtn} onClick={() => moveUp(idx)} title="Move up">↑</button>
                <button style={s.iconBtn} onClick={() => moveDown(idx)} title="Move down">↓</button>
                <button style={{ ...s.iconBtn, color: "#D4A03C" }} onClick={() => editingId === m.id ? setEditingId(null) : startEdit(m)}>
                  {editingId === m.id ? "✕" : "✎"}
                </button>
                <button style={{ ...s.iconBtn, color: "#C23B22" }} onClick={() => deleteTask(m.id)}>✕</button>
              </div>
            </div>
            {editingId === m.id && (
              <EditForm f={form} setF={setForm} onSave={saveEdit} onCancel={() => setEditingId(null)} />
            )}
          </div>
        ))}

        {/* Add task */}
        {adding ? (
          <div style={s.addBox}>
            <div style={s.addTitle}>NEW TASK — {activeDay.toUpperCase()}</div>
            <EditForm f={addForm} setF={setAddForm} onSave={addTask} onCancel={() => { setAdding(false); setAddForm(BLANK_FORM); }} />
          </div>
        ) : (
          <button style={s.addBtn} onClick={() => { setAdding(true); setEditingId(null); }}>
            + ADD TASK
          </button>
        )}
      </div>

      {/* Save bar */}
      <div style={s.saveBar}>
        <button style={s.saveFinalBtn} onClick={() => onSave(weekly)}>
          SAVE SCHEDULE
        </button>
      </div>
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
    alignItems: "flex-start",
    padding: "20px",
    borderBottom: "1px solid #1A1A1A",
    gap: "12px",
    flexWrap: "wrap",
  },
  title: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "24px",
    letterSpacing: "4px",
    color: "#E8E4DD",
  },
  subtitle: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px",
    color: "#444",
    marginTop: "4px",
  },
  headerBtns: { display: "flex", gap: "8px", alignItems: "center" },
  resetBtn: {
    padding: "8px 14px",
    background: "transparent",
    border: "1px solid #C23B22",
    borderRadius: "4px",
    color: "#C23B22",
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "12px",
    letterSpacing: "2px",
    cursor: "pointer",
  },
  closeBtn: {
    padding: "8px 12px",
    background: "transparent",
    border: "1px solid #2A2A2A",
    borderRadius: "4px",
    color: "#666",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "14px",
    cursor: "pointer",
  },

  // Day tabs
  dayTabs: {
    display: "flex",
    borderBottom: "1px solid #1A1A1A",
    overflowX: "auto",
  },
  dayTab: {
    flex: 1,
    minWidth: "44px",
    padding: "10px 4px 8px",
    background: "none",
    border: "none",
    borderBottom: "2px solid transparent",
    color: "#555",
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "13px",
    letterSpacing: "1px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "5px",
  },
  dayTabActive: {
    color: "#D4A03C",
    borderBottomColor: "#D4A03C",
  },
  dayTabDot: {
    width: "4px",
    height: "4px",
    borderRadius: "50%",
  },

  // Tools bar
  toolBar: {
    display: "flex",
    gap: "8px",
    padding: "10px 16px",
    borderBottom: "1px solid #1A1A1A",
  },
  toolBtn: {
    padding: "6px 14px",
    background: "transparent",
    border: "1px solid #2A2A2A",
    borderRadius: "4px",
    color: "#666",
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "11px",
    letterSpacing: "2px",
    cursor: "pointer",
  },
  toolBtnActive: {
    border: "1px solid #D4A03C44",
    color: "#D4A03C",
    background: "#141209",
  },

  // Copy panel
  copyPanel: {
    background: "#0F0F0F",
    border: "1px solid #2A2A2A",
    margin: "0 16px",
    borderRadius: "4px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  copyTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "11px",
    letterSpacing: "3px",
    color: "#555",
  },
  copyDays: { display: "flex", gap: "6px", flexWrap: "wrap" },
  copyDayBtn: {
    padding: "6px 12px",
    background: "transparent",
    border: "1px solid #2A2A2A",
    borderRadius: "3px",
    color: "#555",
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "12px",
    letterSpacing: "1px",
    cursor: "pointer",
  },
  copyDayBtnActive: {
    border: "1px solid #D4A03C",
    color: "#D4A03C",
    background: "#141209",
  },
  copyActions: { display: "flex", gap: "8px" },

  // List
  list: {
    flex: 1,
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    overflowY: "auto",
    paddingBottom: "80px",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    background: "#111",
    border: "1px solid #1A1A1A",
    borderRadius: "4px",
  },
  rowEditing: { border: "1px solid #D4A03C44", borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  catDot: { width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0 },
  rowTime: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "12px",
    color: "#D4A03C",
    minWidth: "40px",
    flexShrink: 0,
  },
  rowInfo: { flex: 1, minWidth: 0 },
  rowLabel: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "14px",
    letterSpacing: "1px",
    color: "#E8E4DD",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  rowDur: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "9px",
    color: "#444",
    marginTop: "1px",
  },
  rowBtns: { display: "flex", gap: "4px", flexShrink: 0 },
  iconBtn: {
    background: "none",
    border: "none",
    color: "#555",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "13px",
    cursor: "pointer",
    padding: "4px 6px",
    borderRadius: "2px",
  },

  // Edit form
  editForm: {
    background: "#0F0F0F",
    border: "1px solid #D4A03C44",
    borderTop: "none",
    borderBottomLeftRadius: "4px",
    borderBottomRightRadius: "4px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  field: { display: "flex", flexDirection: "column", gap: "4px" },
  fieldLabel: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "10px",
    letterSpacing: "2px",
    color: "#444",
  },
  formRow: { display: "flex", gap: "10px" },
  input: {
    width: "100%",
    padding: "8px 10px",
    background: "#0A0A0A",
    border: "1px solid #2A2A2A",
    borderRadius: "3px",
    color: "#E8E4DD",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "12px",
    outline: "none",
    boxSizing: "border-box",
  },
  textarea: { resize: "vertical", minHeight: "52px" },
  formBtnRow: { display: "flex", gap: "8px" },
  saveBtn: {
    padding: "8px 20px",
    background: "#D4A03C",
    border: "none",
    borderRadius: "3px",
    color: "#0A0A0A",
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "13px",
    letterSpacing: "2px",
    cursor: "pointer",
  },
  cancelBtn: {
    padding: "8px 16px",
    background: "transparent",
    border: "1px solid #2A2A2A",
    borderRadius: "3px",
    color: "#555",
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "13px",
    letterSpacing: "2px",
    cursor: "pointer",
  },

  // Add task
  addBox: {
    background: "#111",
    border: "1px dashed #2A2A2A",
    borderRadius: "4px",
    padding: "14px",
    marginTop: "4px",
  },
  addTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "12px",
    letterSpacing: "3px",
    color: "#555",
    marginBottom: "10px",
  },
  addBtn: {
    padding: "12px",
    background: "transparent",
    border: "1px dashed #2A2A2A",
    borderRadius: "4px",
    color: "#444",
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "14px",
    letterSpacing: "3px",
    cursor: "pointer",
    width: "100%",
    marginTop: "4px",
  },

  // Save bar
  saveBar: {
    position: "fixed",
    bottom: 0, left: 0, right: 0,
    padding: "12px 16px",
    background: "#0A0A0A",
    borderTop: "1px solid #1A1A1A",
  },
  saveFinalBtn: {
    width: "100%",
    padding: "14px",
    background: "#D4A03C",
    border: "none",
    borderRadius: "4px",
    color: "#0A0A0A",
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "16px",
    letterSpacing: "3px",
    cursor: "pointer",
  },
};
