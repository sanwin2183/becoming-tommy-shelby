// templates.js — All schedule templates, add-ons, and utility functions

export const CATEGORIES = {
  wake:     { label: "WAKE",     color: "#D4A03C" },
  work:     { label: "WORK",     color: "#C23B22" },
  exercise: { label: "EXERCISE", color: "#3A8F6A" },
  rest:     { label: "REST",     color: "#5B7FA5" },
  faith:    { label: "FAITH",    color: "#8B5CF6" },
  family:   { label: "FAMILY",   color: "#F97316" },
};

export const timeToMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export const minutesToTime = (min) => {
  const safe = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
};

export const shiftMissions = (missions, fromWake, toWake) => {
  const diff = timeToMinutes(toWake) - timeToMinutes(fromWake);
  if (diff === 0) return missions;
  return missions.map((ms) => ({ ...ms, time: minutesToTime(timeToMinutes(ms.time) + diff) }));
};

export const applyAddOns = (baseMissions, activeAddOnIds, wakeTime) => {
  const extras = activeAddOnIds.flatMap((id) => {
    const addOn = ADD_ONS.find((a) => a.id === id);
    return addOn ? addOn.getMissions(wakeTime) : [];
  });
  const combined = [...baseMissions, ...extras];
  combined.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  return combined.map((m, i) => ({ ...m, id: i + 1 }));
};

const build = (arr) => arr.map((m, i) => ({ id: i + 1, ...m }));

// ─────────────────────────────────────────────────────────────
// TEMPLATE MISSIONS
// ─────────────────────────────────────────────────────────────

const SHELBY = build([
  { time: "05:00", label: "WAKE UP",              command: "Get out of bed. No snooze. Feet on the floor.",                    duration: 5,   category: "wake"     },
  { time: "05:05", label: "COLD WATER",           command: "Splash cold water on your face. Shock the system awake.",           duration: 3,   category: "wake"     },
  { time: "05:08", label: "MEDITATE",             command: "Sit still. Eyes closed. 15 minutes. Breathe and clear the noise.",  duration: 15,  category: "wake"     },
  { time: "05:23", label: "PLAN THE DAY",         command: "Write 3 priorities. Nothing else matters today.",                   duration: 15,  category: "work"     },
  { time: "05:38", label: "STRETCH & WARM UP",    command: "Mobilise your joints. Warm up before the gym. Don't skip this.",   duration: 22,  category: "exercise" },
  { time: "06:00", label: "GYM",                  command: "One hour. Heavy and focused. This is where strength is built.",    duration: 60,  category: "exercise" },
  { time: "07:00", label: "SHOWER",               command: "Cold shower. 20 minutes. Stand in it. Wash it all off.",            duration: 20,  category: "wake"     },
  { time: "07:20", label: "EAT CLEAN",            command: "Simple meal. Protein. No sugar. No garbage.",                      duration: 20,  category: "rest"     },
  { time: "07:40", label: "DEEP WORK — BLOCK 1",  command: "Phone off. Door closed. Execute your first priority.",             duration: 120, category: "work"     },
  { time: "09:40", label: "BREAK",                command: "Stand. Stretch. Water. 10 minutes only.",                           duration: 10,  category: "rest"     },
  { time: "09:50", label: "DEEP WORK — BLOCK 2",  command: "Back to it. Second priority. No distractions.",                   duration: 120, category: "work"     },
  { time: "11:50", label: "WALK",                 command: "20 minutes outside. No phone. Let your mind breathe.",             duration: 20,  category: "exercise" },
  { time: "12:10", label: "DEEP WORK — BLOCK 3",  command: "Third priority. Finish what you started.",                         duration: 80,  category: "work"     },
  { time: "13:30", label: "EAT",                  command: "Fuel the machine. Clean food only.",                                duration: 30,  category: "rest"     },
  { time: "14:00", label: "LEARN",                command: "Read or study for 45 minutes. Sharpen the blade.",                 duration: 45,  category: "work"     },
  { time: "14:45", label: "EXECUTE",              command: "Handle all remaining tasks. Emails. Calls. Admin.",                duration: 75,  category: "work"     },
  { time: "16:00", label: "SECOND TRAINING",      command: "Second session. Push harder than this morning.",                   duration: 45,  category: "exercise" },
  { time: "16:45", label: "REST & RECOVER",       command: "You've earned a pause. Stretch. Hydrate. Breathe.",                duration: 30,  category: "rest"     },
  { time: "17:15", label: "SKILL WORK",           command: "Work on your craft. Build something. Create value.",                duration: 90,  category: "work"     },
  { time: "18:45", label: "EVENING MEAL",         command: "Last meal. Keep it clean. No junk.",                               duration: 30,  category: "rest"     },
  { time: "19:15", label: "REFLECT",              command: "Journal. What worked. What didn't. Be brutally honest.",            duration: 30,  category: "rest"     },
  { time: "21:00", label: "SHUT DOWN",            command: "Phone off. Screens off. Prepare your mind for sleep.",             duration: 30,  category: "rest"     },
  { time: "21:30", label: "SLEEP",                command: "Lights out. Rest hard. Tomorrow we go again.",                     duration: 0,   category: "rest"     },
]);

const ATHLETE = build([
  { time: "05:30", label: "WAKE UP",              command: "Get up. Champions don't sleep in.",                                 duration: 5,   category: "wake"     },
  { time: "05:35", label: "COLD WATER",           command: "Cold water on your face. Wake that body up.",                       duration: 5,   category: "wake"     },
  { time: "05:40", label: "VISUALISE",            command: "10 minutes. See yourself performing. See yourself winning.",        duration: 10,  category: "wake"     },
  { time: "05:50", label: "PLAN THE DAY",         command: "Set training goals. What will you improve today?",                  duration: 10,  category: "work"     },
  { time: "06:00", label: "MORNING TRAINING",     command: "Session 1. Strength, speed, or skill work. No half measures.",     duration: 90,  category: "exercise" },
  { time: "07:30", label: "SHOWER",               command: "Cold shower. Ice the muscles. Recover faster.",                     duration: 20,  category: "wake"     },
  { time: "07:50", label: "PROTEIN BREAKFAST",    command: "Protein-first. Eggs, meat, or shake. Fuel the recovery.",          duration: 25,  category: "rest"     },
  { time: "08:15", label: "RECOVERY STRETCH",     command: "20 minutes. Foam roll, stretch, breathe. Non-negotiable.",         duration: 20,  category: "exercise" },
  { time: "08:35", label: "TACTICS & STUDY",      command: "Study your sport. Watch film. Read. Get smarter than your competition.", duration: 60, category: "work" },
  { time: "09:35", label: "DEEP WORK",            command: "Handle non-training priorities. Full focus.",                       duration: 90,  category: "work"     },
  { time: "11:05", label: "MID-MORNING FUEL",     command: "Complex carbs and protein. Stay fuelled for session 2.",           duration: 20,  category: "rest"     },
  { time: "11:25", label: "REST / NAP",           command: "30 minutes. Eyes closed. Let the body repair.",                    duration: 30,  category: "rest"     },
  { time: "11:55", label: "ADMIN & CALLS",        command: "Clear inbox, calls, and obligations. Fast and focused.",           duration: 45,  category: "work"     },
  { time: "12:40", label: "LUNCH",                command: "High-quality fuel. Lean protein, vegetables, complex carbs.",       duration: 30,  category: "rest"     },
  { time: "13:10", label: "PRE-TRAINING PREP",    command: "Gear up. Mental prep. Warm up routine begins.",                    duration: 30,  category: "exercise" },
  { time: "13:40", label: "WARM UP",              command: "Activate. Loosen up. Prepare every muscle.",                       duration: 20,  category: "exercise" },
  { time: "14:00", label: "TRAINING SESSION 2",   command: "Skills, sport-specific drills, or conditioning. Full effort.",    duration: 90,  category: "exercise" },
  { time: "15:30", label: "COOL DOWN & STRETCH",  command: "Don't skip this. Cool down properly. Ice if needed.",              duration: 20,  category: "exercise" },
  { time: "15:50", label: "POST-WORKOUT MEAL",    command: "Recovery meal within 30 minutes. Protein and carbs. Now.",        duration: 25,  category: "rest"     },
  { time: "16:15", label: "SPORT ANALYSIS",       command: "Review today. Analyse performance. Find what to fix.",             duration: 45,  category: "work"     },
  { time: "17:00", label: "EVENING MEAL",         command: "Clean dinner. Balanced macros. Prepare for tomorrow.",             duration: 30,  category: "rest"     },
  { time: "17:30", label: "REFLECT",              command: "What improved today? What needs work? Write it down.",             duration: 20,  category: "rest"     },
  { time: "21:00", label: "SHUT DOWN",            command: "Screen off. Champions prioritise recovery.",                        duration: 30,  category: "rest"     },
  { time: "21:30", label: "SLEEP",                command: "8-9 hours minimum. Sleep is training.",                             duration: 0,   category: "rest"     },
]);

const MONK = build([
  { time: "05:00", label: "WAKE UP",              command: "Rise. The day is waiting. No rush. Just presence.",                duration: 5,   category: "wake"     },
  { time: "05:05", label: "COLD WATER",           command: "Cold water. Wake slowly. Be gentle with the morning.",             duration: 5,   category: "wake"     },
  { time: "05:10", label: "MORNING MEDITATION",   command: "60 minutes. Sit. Breathe. Observe without reacting. Just be.",    duration: 60,  category: "wake"     },
  { time: "06:10", label: "JOURNALING",           command: "30 minutes. Write freely. Gratitude. Fears. Goals. Truth.",        duration: 30,  category: "rest"     },
  { time: "06:40", label: "YOGA & MOVEMENT",      command: "Gentle. Intentional. Connect body and breath.",                    duration: 30,  category: "exercise" },
  { time: "07:10", label: "SIMPLE BREAKFAST",     command: "Simple. Clean. Mindful eating. No screens.",                       duration: 20,  category: "rest"     },
  { time: "07:30", label: "SACRED READING",       command: "Read something that elevates you. Philosophy, wisdom, faith.",     duration: 45,  category: "work"     },
  { time: "08:15", label: "DEEP WORK",            command: "Focused work. No distractions. Silence is your tool.",             duration: 90,  category: "work"     },
  { time: "09:45", label: "WALKING MEDITATION",   command: "Walk slowly. Notice everything. Phone stays home.",                duration: 20,  category: "exercise" },
  { time: "10:05", label: "DEEP WORK 2",          command: "Return to work. Calm. Deliberate. Unhurried.",                     duration: 90,  category: "work"     },
  { time: "11:35", label: "SIMPLE LUNCH",         command: "Light, clean meal. Eat slowly. No distraction.",                  duration: 25,  category: "rest"     },
  { time: "12:00", label: "REST",                 command: "30 minutes. Eyes closed. Let the mind settle.",                    duration: 30,  category: "rest"     },
  { time: "12:30", label: "DEEP WORK 3",          command: "Final focused block. Complete what must be done.",                 duration: 60,  category: "work"     },
  { time: "13:30", label: "AFTERNOON MEDITATION", command: "20 minutes. Mid-day reset. Return to stillness.",                  duration: 20,  category: "wake"     },
  { time: "13:50", label: "STUDY & LEARN",        command: "Philosophy, science, or craft. Read deeply. Take notes.",         duration: 60,  category: "work"     },
  { time: "14:50", label: "WALK IN NATURE",       command: "Slow walk. No destination. Observe. Be grateful.",                 duration: 30,  category: "exercise" },
  { time: "15:20", label: "CREATIVE WORK",        command: "Write, draw, create. No judgment. Pure expression.",               duration: 90,  category: "work"     },
  { time: "16:50", label: "SERVICE",              command: "Do something for others. No reward needed.",                       duration: 45,  category: "rest"     },
  { time: "17:35", label: "EVENING MEAL",         command: "Simple. Light. Grateful. No screens.",                             duration: 20,  category: "rest"     },
  { time: "17:55", label: "EVENING READING",      command: "60 minutes of meaningful reading. Let it sink in.",               duration: 60,  category: "work"     },
  { time: "18:55", label: "EVENING MEDITATION",   command: "30 minutes. Review the day. Forgive. Let go. Rest.",              duration: 30,  category: "wake"     },
  { time: "21:00", label: "SHUT DOWN",            command: "All off. Silence. Prepare for deep sleep.",                        duration: 30,  category: "rest"     },
  { time: "21:30", label: "SLEEP",                command: "Rest completely. You showed up today.",                             duration: 0,   category: "rest"     },
]);

const BUILDER = build([
  { time: "06:30", label: "WAKE UP",              command: "Up. Code doesn't write itself.",                                    duration: 5,   category: "wake"     },
  { time: "06:35", label: "COLD WATER",           command: "Cold water. Boot sequence initiated.",                              duration: 5,   category: "wake"     },
  { time: "06:40", label: "PLAN & REVIEW",        command: "20 minutes. Review yesterday. Set today's build goal. Ship.",      duration: 20,  category: "work"     },
  { time: "07:00", label: "EXERCISE",             command: "30 minutes. Move the body. The mind works better after.",         duration: 30,  category: "exercise" },
  { time: "07:30", label: "SHOWER & EAT",         command: "Shower fast. Eat clean. Get back to the machine.",                duration: 30,  category: "wake"     },
  { time: "08:00", label: "DEEP WORK — BLOCK 1",  command: "Main project. No Slack, no email. Build.",                        duration: 150, category: "work"     },
  { time: "10:30", label: "BREAK + WALK",         command: "15 minutes. Step away. Let the subconscious solve problems.",     duration: 15,  category: "rest"     },
  { time: "10:45", label: "DEEP WORK — BLOCK 2",  command: "Continue. Solve the hard problems. Ship something.",              duration: 150, category: "work"     },
  { time: "13:15", label: "LUNCH",                command: "Eat. Step away from the screen. Return sharp.",                    duration: 30,  category: "rest"     },
  { time: "13:45", label: "LEARN",                command: "45 minutes. New language, framework, or concept. Stay sharp.",    duration: 45,  category: "work"     },
  { time: "14:30", label: "DEEP WORK — BLOCK 3",  command: "Side project. Build the thing you actually care about.",          duration: 90,  category: "work"     },
  { time: "16:00", label: "EXERCISE & WALK",      command: "Move. Clear the head. Return with fresh perspective.",             duration: 30,  category: "exercise" },
  { time: "16:30", label: "CODE REVIEW & DOCS",   command: "Review your work. Document. Write clean code.",                   duration: 30,  category: "work"     },
  { time: "17:00", label: "DEEP WORK — BLOCK 4",  command: "Polish and ship. Finish what you started today.",                 duration: 60,  category: "work"     },
  { time: "18:00", label: "DINNER",               command: "Eat clean. No screens. Let the mind rest.",                        duration: 30,  category: "rest"     },
  { time: "18:30", label: "INDUSTRY READING",     command: "45 minutes. Blogs, papers, or books in your field.",              duration: 45,  category: "work"     },
  { time: "19:15", label: "REFLECT & PLAN",       command: "What did you ship? What's blocking you? Plan tomorrow.",          duration: 30,  category: "rest"     },
  { time: "21:00", label: "SHUT DOWN",            command: "Close the laptop. Rest is part of the build.",                    duration: 30,  category: "rest"     },
  { time: "21:30", label: "SLEEP",                command: "Sleep well. Your code compiles while you dream.",                  duration: 0,   category: "rest"     },
]);

const NINE_TO_FIVE = build([
  { time: "06:00", label: "WAKE UP",              command: "Up. You have a life to fund. Let's go.",                           duration: 5,   category: "wake"     },
  { time: "06:05", label: "COLD WATER",           command: "Cold water. Wake up properly before the world does.",              duration: 5,   category: "wake"     },
  { time: "06:10", label: "MEDITATE",             command: "10 minutes. Centre yourself before the commute chaos.",            duration: 10,  category: "wake"     },
  { time: "06:20", label: "EXERCISE",             command: "30 minutes. Move before work steals your energy.",                duration: 30,  category: "exercise" },
  { time: "06:50", label: "SHOWER",               command: "Clean up. Show up sharp.",                                          duration: 15,  category: "wake"     },
  { time: "07:05", label: "BREAKFAST",            command: "Eat clean. No skipping. You need fuel.",                           duration: 15,  category: "rest"     },
  { time: "07:20", label: "COMMUTE",              command: "Travel time. Listen to something useful. No mindless scrolling.",  duration: 45,  category: "rest"     },
  { time: "08:05", label: "WORK — BLOCK 1",       command: "First 2 hours are your best. Do the hardest task first.",         duration: 120, category: "work"     },
  { time: "10:05", label: "WORK BREAK",           command: "Stand. Walk. Water. 10 minutes.",                                  duration: 10,  category: "rest"     },
  { time: "10:15", label: "WORK — BLOCK 2",       command: "Back to it. Second priority. Meetings if unavoidable.",           duration: 100, category: "work"     },
  { time: "11:55", label: "LUNCH",                command: "Step away from the desk. Eat real food. Breathe.",                duration: 45,  category: "rest"     },
  { time: "12:40", label: "WORK — BLOCK 3",       command: "Afternoon grind. Stay focused. Resist the slump.",                duration: 90,  category: "work"     },
  { time: "14:10", label: "WORK BREAK",           command: "Stretch. Walk. Water. Back in 10.",                                duration: 10,  category: "rest"     },
  { time: "14:20", label: "WORK — BLOCK 4",       command: "Final push. Clear your task list before you leave.",              duration: 100, category: "work"     },
  { time: "16:00", label: "COMMUTE HOME",         command: "Travel time. Decompress. Leave work at work.",                    duration: 45,  category: "rest"     },
  { time: "16:45", label: "GYM",                  command: "45 minutes. This is your time. Own it.",                          duration: 45,  category: "exercise" },
  { time: "17:30", label: "SHOWER",               command: "Wash off the day. Fresh for the evening.",                        duration: 15,  category: "wake"     },
  { time: "17:45", label: "DINNER",               command: "Cook. Eat clean. Fuel the recovery.",                              duration: 30,  category: "rest"     },
  { time: "18:15", label: "LEARN",                command: "45 minutes. Build skills outside your job. Your future needs it.", duration: 45, category: "work"     },
  { time: "19:00", label: "PERSONAL TIME",        command: "Read. Connect. Rest. This is your reward.",                       duration: 60,  category: "rest"     },
  { time: "20:00", label: "REFLECT",              command: "20 minutes. Journal. What moved forward today?",                   duration: 20,  category: "rest"     },
  { time: "21:00", label: "SHUT DOWN",            command: "Screens off. Sleep is your competitive advantage.",                duration: 30,  category: "rest"     },
  { time: "21:30", label: "SLEEP",                command: "Rest. Tomorrow you do it again.",                                  duration: 0,   category: "rest"     },
]);

const MINIMALIST = build([
  { time: "06:00", label: "WAKE UP",              command: "Rise. Keep it simple.",                                             duration: 5,   category: "wake"     },
  { time: "06:05", label: "COLD WATER & BREATHE", command: "Cold water. 5 deep breaths. That's all the ritual you need.",     duration: 5,   category: "wake"     },
  { time: "06:10", label: "MOVE",                 command: "45 minutes. Run, lift, or walk. Move your body. Don't overthink.", duration: 45,  category: "exercise" },
  { time: "06:55", label: "SHOWER & EAT",         command: "Shower. Simple meal. Under 30 minutes. Go.",                      duration: 30,  category: "wake"     },
  { time: "07:25", label: "DEEP WORK",            command: "4 hours. Phone off. One task. Go.",                                duration: 240, category: "work"     },
  { time: "11:25", label: "EAT",                  command: "Simple meal. Real food. 20 minutes.",                              duration: 20,  category: "rest"     },
  { time: "11:45", label: "DEEP WORK 2",          command: "3 hours. Finish what matters. No excuses.",                       duration: 180, category: "work"     },
  { time: "14:45", label: "MOVE & CLEAR",         command: "30 minutes. Walk or move. Clear the mind.",                       duration: 30,  category: "exercise" },
  { time: "15:15", label: "EAT",                  command: "Simple meal. Stay fuelled.",                                       duration: 20,  category: "rest"     },
  { time: "15:35", label: "LEARN OR BUILD",       command: "2 hours. Read, learn, or work on something personal.",            duration: 120, category: "work"     },
  { time: "17:35", label: "REFLECT",              command: "10 minutes. What mattered today? What didn't?",                    duration: 10,  category: "rest"     },
  { time: "21:00", label: "SHUT DOWN",            command: "Off. Done. Sleep.",                                                duration: 30,  category: "rest"     },
  { time: "21:30", label: "SLEEP",                command: "Rest.",                                                             duration: 0,   category: "rest"     },
]);

const FAITHFUL = build([
  { time: "05:00", label: "FAJR PRAYER",          command: "Rise for Fajr. Begin with Allah's name. Pray with full presence.", duration: 20, category: "faith"    },
  { time: "05:20", label: "QURAN RECITATION",     command: "Read with reflection. Understand what you recite.",                duration: 30,  category: "faith"    },
  { time: "05:50", label: "PLAN THE DAY",         command: "Set your intentions. What will you do for the sake of Allah today?", duration: 15, category: "work"   },
  { time: "06:05", label: "EXERCISE",             command: "Your body is an amanah. Take care of it.",                         duration: 45,  category: "exercise" },
  { time: "06:50", label: "SHOWER",               command: "Clean yourself. Begin the day fresh.",                             duration: 20,  category: "wake"     },
  { time: "07:10", label: "BREAKFAST",            command: "Bismillah. Eat with gratitude. Clean, halal food.",                duration: 20,  category: "rest"     },
  { time: "07:30", label: "DEEP WORK — BLOCK 1",  command: "Work with excellence. Your work is a form of ibadah.",            duration: 150, category: "work"     },
  { time: "10:00", label: "BREAK",                command: "Rest. Hydrate. Make dhikr.",                                       duration: 10,  category: "rest"     },
  { time: "10:10", label: "DEEP WORK — BLOCK 2",  command: "Continue. Stay focused. Avoid the haram.",                        duration: 110, category: "work"     },
  { time: "12:00", label: "DHUHR PRAYER",         command: "Stop. Face the qiblah. Pray Dhuhr with full focus.",              duration: 20,  category: "faith"    },
  { time: "12:20", label: "LUNCH",                command: "Halal. Clean. Eat with gratitude. Eat slowly.",                    duration: 30,  category: "rest"     },
  { time: "12:50", label: "REST",                 command: "Qaylulah — the Prophetic nap. 20-30 minutes.",                    duration: 25,  category: "rest"     },
  { time: "13:15", label: "DEEP WORK — BLOCK 3",  command: "Afternoon session. Work hard. Avoid gossip and distraction.",     duration: 90,  category: "work"     },
  { time: "14:45", label: "BREAK",                command: "Stretch. Subhanallah 33×. Alhamdulillah 33×. Allahu Akbar 33×.",  duration: 10,  category: "rest"     },
  { time: "14:55", label: "ASR PRAYER & DHIKR",   command: "Pray Asr. The prayer between two darknesses. Don't miss it.",    duration: 25,  category: "faith"    },
  { time: "15:20", label: "EXECUTE",              command: "Clear obligations. Admin. Calls. Finish the day's duties.",        duration: 60,  category: "work"     },
  { time: "16:20", label: "WALK",                 command: "Walk and reflect. What can you do for others today?",             duration: 20,  category: "exercise" },
  { time: "16:40", label: "COMMUNITY & SADAQAH",  command: "Give. Volunteer. Help someone. Sadaqah does not decrease wealth.", duration: 50, category: "faith"    },
  { time: "17:30", label: "DINNER",               command: "Halal. Simple. With family if possible.",                          duration: 30,  category: "rest"     },
  { time: "18:00", label: "MAGHRIB PRAYER",       command: "Pray Maghrib at its time. The gates of mercy open at sunset.",    duration: 20,  category: "faith"    },
  { time: "18:20", label: "QURAN STUDY",          command: "Study tafsir. Learn the meaning. Grow in understanding.",         duration: 60,  category: "faith"    },
  { time: "19:20", label: "ISHA PRAYER & DHIKR",  command: "Pray Isha. Make dua. Seek forgiveness. End the day with Allah.", duration: 25,  category: "faith"    },
  { time: "19:45", label: "REFLECT & JOURNAL",    command: "What did you do today for the akhira? Write it down.",           duration: 20,  category: "rest"     },
  { time: "21:00", label: "SHUT DOWN",            command: "Recite Ayatul Kursi. Say your sleeping duas. Rest.",              duration: 30,  category: "rest"     },
  { time: "21:30", label: "SLEEP",                command: "Sleep on your right side. Tomorrow, do better.",                  duration: 0,   category: "rest"     },
]);

const DEVOTED = build([
  { time: "06:00", label: "WAKE UP",              command: "Rise. This day is a gift. Don't waste it.",                        duration: 5,   category: "wake"     },
  { time: "06:05", label: "MORNING PRAYER",       command: "Spend the first minutes with God. Surrender. Ask. Listen.",       duration: 20,  category: "faith"    },
  { time: "06:25", label: "BIBLE & DEVOTIONAL",   command: "Read Scripture. One passage, deeply. Journal your reflection.",   duration: 30,  category: "faith"    },
  { time: "06:55", label: "EXERCISE",             command: "Your body is a temple. Treat it like one.",                       duration: 45,  category: "exercise" },
  { time: "07:40", label: "SHOWER",               command: "Refresh. Begin the day clean.",                                    duration: 15,  category: "wake"     },
  { time: "07:55", label: "BREAKFAST",            command: "Eat with gratitude. Thank God for the meal.",                      duration: 20,  category: "rest"     },
  { time: "08:15", label: "DEEP WORK — BLOCK 1",  command: "Work as if working for the Lord, not for men. Colossians 3:23.", duration: 120, category: "work"     },
  { time: "10:15", label: "BREAK",                command: "Rest. Hydrate. Quick prayer of thanks.",                           duration: 10,  category: "rest"     },
  { time: "10:25", label: "DEEP WORK — BLOCK 2",  command: "Continue. Excellence is a form of worship.",                     duration: 120, category: "work"     },
  { time: "12:25", label: "LUNCH",                command: "Step away. Eat. Pray briefly over your food.",                    duration: 30,  category: "rest"     },
  { time: "12:55", label: "SERVICE & COMMUNITY",  command: "Give your time. Serve others. Love your neighbour.",              duration: 60,  category: "faith"    },
  { time: "13:55", label: "DEEP WORK — BLOCK 3",  command: "Return refreshed. Final focused block of work.",                 duration: 90,  category: "work"     },
  { time: "15:25", label: "WALK & PRAYER",        command: "Walk outside. Pray as you go. Be grateful for the creation.",    duration: 25,  category: "faith"    },
  { time: "15:50", label: "EXECUTE",              command: "Finish obligations. Admin. Calls. Leave nothing undone.",          duration: 70,  category: "work"     },
  { time: "17:00", label: "EXERCISE",             command: "Physical discipline reflects spiritual discipline.",               duration: 30,  category: "exercise" },
  { time: "17:30", label: "FAMILY & COMMUNITY",   command: "Be present with the people God put in your life.",               duration: 45,  category: "family"   },
  { time: "18:15", label: "DINNER",               command: "Share the meal. Give thanks before eating.",                      duration: 30,  category: "rest"     },
  { time: "18:45", label: "GRATITUDE PRACTICE",   command: "Name 5 specific things you're grateful for today. Write them.",  duration: 15,  category: "rest"     },
  { time: "19:00", label: "READ & STUDY",         command: "Faith literature, theology, or personal growth. 60 minutes.",    duration: 60,  category: "work"     },
  { time: "20:00", label: "EVENING PRAYER",       command: "Give the day back to God. Confess. Forgive. Rest in grace.",     duration: 15,  category: "faith"    },
  { time: "21:00", label: "SHUT DOWN",            command: "Lay down your burdens. Tomorrow is in His hands.",                duration: 30,  category: "rest"     },
  { time: "21:30", label: "SLEEP",                command: "Rest in peace. Literally.",                                        duration: 0,   category: "rest"     },
]);

const PARENT = build([
  { time: "06:00", label: "WAKE UP",              command: "Up before the kids. This is your only quiet time. Own it.",       duration: 5,   category: "wake"     },
  { time: "06:05", label: "EXERCISE",             command: "20 minutes. Quick and hard. You don't have more time.",           duration: 20,  category: "exercise" },
  { time: "06:25", label: "SHOWER",               command: "Shower fast. Get ready before the chaos starts.",                 duration: 15,  category: "wake"     },
  { time: "06:40", label: "FAMILY BREAKFAST",     command: "Feed the kids. Eat yourself. Be present. No phone.",             duration: 25,  category: "family"   },
  { time: "07:05", label: "SCHOOL DROP-OFF",      command: "Get them there. Don't rush. These moments matter.",               duration: 30,  category: "family"   },
  { time: "07:35", label: "DEEP WORK — BLOCK 1",  command: "This is your best window. Do the most important work NOW.",      duration: 120, category: "work"     },
  { time: "09:35", label: "BREAK",                command: "Stand. Breathe. Water. 10 minutes.",                              duration: 10,  category: "rest"     },
  { time: "09:45", label: "DEEP WORK — BLOCK 2",  command: "Back to it. Keep the momentum going.",                           duration: 100, category: "work"     },
  { time: "11:25", label: "LUNCH",                command: "Eat well. Step away from the screen.",                            duration: 30,  category: "rest"     },
  { time: "11:55", label: "ADMIN & CALLS",        command: "Clear inbox, calls, obligations. Do it efficiently.",             duration: 55,  category: "work"     },
  { time: "12:50", label: "DEEP WORK — BLOCK 3",  command: "One final block before pick-up. Finish something today.",        duration: 60,  category: "work"     },
  { time: "13:50", label: "SCHOOL PICK-UP",       command: "Pick them up. Be there fully. Ask about their day and listen.",  duration: 30,  category: "family"   },
  { time: "14:20", label: "KIDS TIME",            command: "Homework help. Play. Be fully present. They grow fast.",          duration: 60,  category: "family"   },
  { time: "15:20", label: "EXERCISE",             command: "45 minutes. This is your health. Protect it.",                   duration: 45,  category: "exercise" },
  { time: "16:05", label: "DINNER PREP",          command: "Cook a real meal. For the family. Clean ingredients.",            duration: 30,  category: "rest"     },
  { time: "16:35", label: "FAMILY DINNER",        command: "Eat together. No phones. Ask questions. Listen.",                 duration: 30,  category: "family"   },
  { time: "17:05", label: "KIDS BEDTIME",         command: "Bath, stories, prayers. Be present. This matters more than work.", duration: 60, category: "family"  },
  { time: "18:05", label: "PERSONAL TIME",        command: "Read. Learn. Work on yourself. You can't pour from empty.",      duration: 60,  category: "work"     },
  { time: "19:05", label: "PARTNER TIME",         command: "Connect with your partner. Be present. Relationships need investment.", duration: 45, category: "family" },
  { time: "19:50", label: "REFLECT",              command: "20 minutes. Did you show up as a parent today? A partner?",      duration: 20,  category: "rest"     },
  { time: "21:00", label: "SHUT DOWN",            command: "Sleep is not a luxury. It's fuel. Protect it.",                   duration: 30,  category: "rest"     },
  { time: "21:30", label: "SLEEP",                command: "Rest. You earned it.",                                             duration: 0,   category: "rest"     },
]);

const NIGHT_OWL = build([
  { time: "09:00", label: "WAKE UP",              command: "Rise. The world has had a 3-hour head start. That's fine.",       duration: 5,   category: "wake"     },
  { time: "09:05", label: "COLD WATER",           command: "Cold water. You need it more than early risers do.",              duration: 5,   category: "wake"     },
  { time: "09:10", label: "MEDITATE",             command: "15 minutes. Start slow. You peak later. Be patient.",             duration: 15,  category: "wake"     },
  { time: "09:25", label: "PLAN THE DAY",         command: "What must happen today? Write it. You'll execute tonight.",       duration: 10,  category: "work"     },
  { time: "09:35", label: "BREAKFAST",            command: "Eat well. Fuel the engine. The real work starts soon.",           duration: 20,  category: "rest"     },
  { time: "09:55", label: "LIGHT EXERCISE",       command: "30 minutes. Move. Save intensity for the gym later.",             duration: 30,  category: "exercise" },
  { time: "10:25", label: "DEEP WORK — BLOCK 1",  command: "Warm up the brain. Get into it.",                                duration: 120, category: "work"     },
  { time: "12:25", label: "LUNCH",                command: "Step away. Eat. Let the mind rest briefly.",                      duration: 30,  category: "rest"     },
  { time: "12:55", label: "DEEP WORK — BLOCK 2",  command: "Second block. You're warming up now. Push harder.",              duration: 120, category: "work"     },
  { time: "14:55", label: "BREAK",                command: "Walk. Breathe. Let the subconscious work.",                       duration: 15,  category: "rest"     },
  { time: "15:10", label: "DEEP WORK — BLOCK 3",  command: "Third block. Admin, calls, obligations. Clear the decks.",       duration: 90,  category: "work"     },
  { time: "16:40", label: "GYM",                  command: "Peak performance. Evening gym is yours. Go hard.",                duration: 60,  category: "exercise" },
  { time: "17:40", label: "SHOWER",               command: "Cold shower. Refresh. You're entering prime creative hours.",    duration: 20,  category: "wake"     },
  { time: "18:00", label: "DINNER",               command: "Good food. Real ingredients. Fuel the night ahead.",              duration: 30,  category: "rest"     },
  { time: "18:30", label: "ADMIN & CALLS",        command: "Handle the world. Emails, messages, obligations. Done.",          duration: 60,  category: "work"     },
  { time: "19:30", label: "WALK & UNWIND",        command: "Evening walk. Clear the last of the day's noise.",               duration: 30,  category: "exercise" },
  { time: "20:00", label: "SKILL WORK",           command: "90 minutes. Your craft. Your art. Your edge.",                   duration: 90,  category: "work"     },
  { time: "21:30", label: "DEEP CREATIVE WORK",   command: "The night belongs to you. Create freely. This is your time.",   duration: 120, category: "work"     },
  { time: "23:30", label: "REFLECT",              command: "What did you create? What moved forward?",                        duration: 20,  category: "rest"     },
  { time: "23:50", label: "SHUT DOWN",            command: "You owned the night. Now rest.",                                  duration: 40,  category: "rest"     },
  { time: "00:30", label: "SLEEP",                command: "Lights out. You'll do it again tomorrow.",                        duration: 0,   category: "rest"     },
]);

// ─────────────────────────────────────────────────────────────
// TEMPLATES EXPORT
// ─────────────────────────────────────────────────────────────

export const TEMPLATES = [
  { id: "shelby",      name: "THE SHELBY",     emoji: "⚡", defaultWakeTime: "05:00", missions: SHELBY,      description: "Discipline-focused. Early riser, meditation, gym, deep work blocks.", tagline: "For those who want total control."          },
  { id: "athlete",     name: "THE ATHLETE",    emoji: "🏆", defaultWakeTime: "05:30", missions: ATHLETE,     description: "Training-heavy. Two sessions, sport-specific practice, recovery.",    tagline: "For those who live to compete."            },
  { id: "monk",        name: "THE MONK",       emoji: "🧘", defaultWakeTime: "05:00", missions: MONK,        description: "Long meditation, journaling, simple meals, minimal screen time.",     tagline: "For those seeking inner peace."            },
  { id: "builder",     name: "THE BUILDER",    emoji: "🔨", defaultWakeTime: "06:30", missions: BUILDER,     description: "Developer/creator focused. 4 deep work blocks, learning, side projects.", tagline: "For those building something."          },
  { id: "nine_to_five",name: "THE 9-TO-5",     emoji: "🏢", defaultWakeTime: "06:00", missions: NINE_TO_FIVE,description: "Realistic for commuters. Morning routine, full work day, gym after.", tagline: "For those with a day job."                },
  { id: "minimalist",  name: "THE MINIMALIST", emoji: "◼", defaultWakeTime: "06:00", missions: MINIMALIST,  description: "Only 13 tasks. Wake, move, deep work, eat, reflect, sleep. No fluff.", tagline: "For those starting from zero."           },
  { id: "faithful",    name: "THE FAITHFUL",   emoji: "🌙", defaultWakeTime: "05:00", missions: FAITHFUL,    description: "5 daily prayers (Fajr–Isha), Quran, deep work, community. Times are approximate — adjust to your location.", tagline: "For those guided by faith (Islamic)." },
  { id: "devoted",     name: "THE DEVOTED",    emoji: "✝", defaultWakeTime: "06:00", missions: DEVOTED,     description: "Morning prayer & devotional, Bible reading, service, gratitude practice.", tagline: "For those walking with Christ."        },
  { id: "parent",      name: "THE PARENT",     emoji: "👨‍👧", defaultWakeTime: "06:00", missions: PARENT,      description: "School drop-off/pick-up, family meals, work blocks, partner time.", tagline: "For those raising the next generation."  },
  { id: "night_owl",   name: "THE NIGHT OWL",  emoji: "🦉", defaultWakeTime: "09:00", missions: NIGHT_OWL,   description: "Late wake, deep work in day, creative work at night, gym in evening.", tagline: "For those who own the night."          },
];

// ─────────────────────────────────────────────────────────────
// ADD-ONS
// ─────────────────────────────────────────────────────────────

export const ADD_ONS = [
  {
    id: "dogWalking", label: "Dog Walking", emoji: "🐕",
    description: "Adds 3x 20-min walks throughout your day",
    getMissions: (wakeTime) => {
      const wakeMin = timeToMinutes(wakeTime);
      return [
        { label: "MORNING DOG WALK", time: minutesToTime(wakeMin + 30), command: "Take the dog out. You both need to move.", duration: 20, category: "family" },
        { label: "MIDDAY DOG WALK",  time: "12:30",                     command: "Midday break. Dog needs out. Clear your head.", duration: 20, category: "family" },
        { label: "EVENING DOG WALK", time: "18:30",                     command: "Last walk of the day. Decompress.", duration: 20, category: "family" },
      ];
    },
  },
  {
    id: "cooking", label: "Meal Prep & Cooking", emoji: "🍳",
    description: "Adds prep time before main meals",
    getMissions: (wakeTime) => {
      const wakeMin = timeToMinutes(wakeTime);
      return [
        { label: "BREAKFAST PREP", time: minutesToTime(wakeMin + 40), command: "Prepare your morning meal. Real ingredients only.", duration: 20, category: "rest" },
        { label: "DINNER PREP",    time: "17:00",                     command: "Cook a real meal. No takeout.",                    duration: 25, category: "rest" },
      ];
    },
  },
  {
    id: "commute", label: "Commute", emoji: "🚇",
    description: "Adds 30-min morning and evening travel blocks",
    getMissions: (wakeTime) => {
      const wakeMin = timeToMinutes(wakeTime);
      return [
        { label: "MORNING COMMUTE", time: minutesToTime(wakeMin + 90), command: "Travel time. Listen to something useful. No mindless scrolling.", duration: 30, category: "rest" },
        { label: "EVENING COMMUTE", time: "17:00",                     command: "Travel time. Decompress. Leave work at work.",                   duration: 30, category: "rest" },
      ];
    },
  },
  {
    id: "kids", label: "Kids / School Run", emoji: "👶",
    description: "Adds school drop-off (08:00) and pick-up (15:00)",
    getMissions: () => [
      { label: "SCHOOL DROP-OFF", time: "08:00", command: "Get the kids to school. Be present. Don't rush them.", duration: 30, category: "family" },
      { label: "SCHOOL PICK-UP",  time: "15:00", command: "Pick up the kids. Ask how their day was. Listen.",      duration: 30, category: "family" },
    ],
  },
  {
    id: "prayerTimes", label: "Prayer Times", emoji: "🤲",
    description: "Adds morning, midday, and evening prayer blocks",
    getMissions: (wakeTime) => {
      const wakeMin = timeToMinutes(wakeTime);
      return [
        { label: "MORNING PRAYER",  time: minutesToTime(wakeMin + 5), command: "Begin the day with prayer.",           duration: 15, category: "faith" },
        { label: "MIDDAY PRAYER",   time: "12:00",                    command: "Pause. Pray. Return to your mission.", duration: 15, category: "faith" },
        { label: "EVENING PRAYER",  time: "19:30",                    command: "End the day in gratitude.",            duration: 15, category: "faith" },
      ];
    },
  },
  {
    id: "medication", label: "Medication / Health", emoji: "💊",
    description: "Adds morning and evening health reminders",
    getMissions: (wakeTime) => {
      const wakeMin = timeToMinutes(wakeTime);
      return [
        { label: "MORNING MEDS",  time: minutesToTime(wakeMin + 35), command: "Take your medication. No skipping.", duration: 5, category: "rest" },
        { label: "EVENING MEDS",  time: "20:00",                     command: "Evening medication. Stay consistent.", duration: 5, category: "rest" },
      ];
    },
  },
];
