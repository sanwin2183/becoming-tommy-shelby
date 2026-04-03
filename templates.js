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

export const shiftWeekly = (weekly, fromWake, toWake) => {
  const result = {};
  for (const day of Object.keys(weekly)) {
    result[day] = shiftMissions(weekly[day], fromWake, toWake);
  }
  return result;
};

export const applyAddOnsToWeekly = (weekly, activeAddOnIds, wakeTime) => {
  const result = {};
  for (const day of Object.keys(weekly)) {
    result[day] = applyAddOns(weekly[day], activeAddOnIds, wakeTime);
  }
  return result;
};

// ─────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────

const build = (arr) => arr.map((m, i) => ({ id: i + 1, ...m }));

const makeWeekly = (wd, sat, sun, fri) => ({
  monday:    wd,
  tuesday:   wd,
  wednesday: wd,
  thursday:  wd,
  friday:    fri || wd,
  saturday:  sat,
  sunday:    sun || sat,
});

// ─────────────────────────────────────────────────────────────
// 1. TOMMY SHELBY
// ─────────────────────────────────────────────────────────────

const SHELBY_WD = build([
  { time: "05:00", label: "WAKE UP",             command: "Get out of bed. No snooze. Feet on the floor.",                    duration: 5,   category: "wake"     },
  { time: "05:05", label: "COLD WATER",          command: "Splash cold water on your face. Shock the system awake.",          duration: 3,   category: "wake"     },
  { time: "05:08", label: "MEDITATE",            command: "Sit still. Eyes closed. 15 minutes. Breathe and clear the noise.", duration: 15,  category: "wake"     },
  { time: "05:23", label: "PLAN THE DAY",        command: "Write 3 priorities. Nothing else matters today.",                  duration: 15,  category: "work"     },
  { time: "05:38", label: "STRETCH & WARM UP",   command: "Mobilise your joints. Warm up before the gym. Don't skip this.",  duration: 22,  category: "exercise" },
  { time: "06:00", label: "GYM",                 command: "One hour. Heavy and focused. This is where strength is built.",   duration: 60,  category: "exercise" },
  { time: "07:00", label: "SHOWER",              command: "Cold shower. 20 minutes. Stand in it. Wash it all off.",           duration: 20,  category: "wake"     },
  { time: "07:20", label: "EAT CLEAN",           command: "Simple meal. Protein. No sugar. No garbage.",                     duration: 20,  category: "rest"     },
  { time: "07:40", label: "DEEP WORK — BLOCK 1", command: "Phone off. Door closed. Execute your first priority.",            duration: 120, category: "work"     },
  { time: "09:40", label: "BREAK",               command: "Stand. Stretch. Water. 10 minutes only.",                          duration: 10,  category: "rest"     },
  { time: "09:50", label: "DEEP WORK — BLOCK 2", command: "Back to it. Second priority. No distractions.",                  duration: 120, category: "work"     },
  { time: "11:50", label: "WALK",                command: "20 minutes outside. No phone. Let your mind breathe.",            duration: 20,  category: "exercise" },
  { time: "12:10", label: "DEEP WORK — BLOCK 3", command: "Third priority. Finish what you started.",                        duration: 80,  category: "work"     },
  { time: "13:30", label: "EAT",                 command: "Fuel the machine. Clean food only.",                               duration: 30,  category: "rest"     },
  { time: "14:00", label: "LEARN",               command: "Read or study for 45 minutes. Sharpen the blade.",                duration: 45,  category: "work"     },
  { time: "14:45", label: "EXECUTE",             command: "Handle all remaining tasks. Emails. Calls. Admin.",               duration: 75,  category: "work"     },
  { time: "16:00", label: "SECOND TRAINING",     command: "Second session. Push harder than this morning.",                  duration: 45,  category: "exercise" },
  { time: "16:45", label: "REST & RECOVER",      command: "You've earned a pause. Stretch. Hydrate. Breathe.",               duration: 30,  category: "rest"     },
  { time: "17:15", label: "SKILL WORK",          command: "Work on your craft. Build something. Create value.",               duration: 90,  category: "work"     },
  { time: "18:45", label: "EVENING MEAL",        command: "Last meal. Keep it clean. No junk.",                              duration: 30,  category: "rest"     },
  { time: "19:15", label: "REFLECT",             command: "Journal. What worked. What didn't. Be brutally honest.",           duration: 30,  category: "rest"     },
  { time: "21:00", label: "SHUT DOWN",           command: "Phone off. Screens off. Prepare your mind for sleep.",            duration: 30,  category: "rest"     },
  { time: "21:30", label: "SLEEP",               command: "Lights out. Rest hard. Tomorrow we go again.",                    duration: 0,   category: "rest"     },
]);

const SHELBY_WE = build([
  { time: "07:00", label: "WAKE UP",             command: "Later start. Still no snooze. Controlled rest, not weakness.",    duration: 5,   category: "wake"     },
  { time: "07:05", label: "COLD WATER",          command: "Cold water. Even on weekends. The discipline doesn't take days off.", duration: 5, category: "wake"  },
  { time: "07:10", label: "MEDITATE",            command: "Sit still. 20 minutes. The quiet weekend morning is yours.",      duration: 20,  category: "wake"     },
  { time: "07:30", label: "LIGHT EXERCISE",      command: "Walk or mobility work. 45 minutes. No rush, full effort.",        duration: 45,  category: "exercise" },
  { time: "08:15", label: "SHOWER",              command: "Cold. Deliberate. Wash off the week.",                             duration: 15,  category: "wake"     },
  { time: "08:30", label: "BREAKFAST",           command: "Eat slowly. Clean food. You've earned this meal.",                 duration: 30,  category: "rest"     },
  { time: "09:00", label: "REFLECT",             command: "Review the week. What worked. What failed. What must change.",     duration: 30,  category: "rest"     },
  { time: "09:30", label: "LEISURE READING",     command: "Read something that interests you. Not work. Just yourself.",     duration: 60,  category: "rest"     },
  { time: "10:30", label: "FAMILY TIME",         command: "Be present with the people who matter. Put the phone down.",      duration: 120, category: "family"   },
  { time: "12:30", label: "LUNCH",               command: "Eat with family if you can. Clean ingredients. Real food.",       duration: 45,  category: "rest"     },
  { time: "13:15", label: "LEISURE",             command: "Whatever restores you. Walking, music, silence. Earn the rest.",  duration: 90,  category: "rest"     },
  { time: "14:45", label: "SKILL WORK",          command: "One focused hour. The craft doesn't sleep on weekends.",          duration: 60,  category: "work"     },
  { time: "15:45", label: "FAMILY TIME",         command: "Afternoon with the people who matter. Be fully there.",           duration: 90,  category: "family"   },
  { time: "17:15", label: "EVENING MEAL",        command: "Good food. No rush. Eat clean, eat slow.",                        duration: 45,  category: "rest"     },
  { time: "18:00", label: "PLAN THE WEEK",       command: "30 minutes. Monday's priorities set tonight. Don't go in blind.", duration: 30,  category: "work"     },
  { time: "20:00", label: "SHUT DOWN",           command: "Earlier tonight. Rest hard. The week starts at 5 AM.",            duration: 30,  category: "rest"     },
  { time: "20:30", label: "SLEEP",               command: "Lights out. Recovery is strategy.",                                duration: 0,   category: "rest"     },
]);

// ─────────────────────────────────────────────────────────────
// 2. JACK DORSEY
// ─────────────────────────────────────────────────────────────

const DORSEY_WD = build([
  { time: "05:00", label: "WAKE UP",             command: "Set your intention for the day. What matters most?",              duration: 5,   category: "wake"     },
  { time: "05:05", label: "MEDITATE",            command: "30 minutes. Sitting practice. No guided audio. Just breath.",     duration: 30,  category: "wake"     },
  { time: "05:35", label: "HIIT CIRCUIT",        command: "3 rounds of 7-minute HIIT. 21 minutes total. All out.",          duration: 21,  category: "exercise" },
  { time: "05:56", label: "WALK TO WORK",        command: "Five miles on foot. This is your thinking time. No earbuds.",    duration: 60,  category: "exercise" },
  { time: "06:56", label: "SHOWER & READY",      command: "Clean up. Prepare. You arrive calm and deliberate.",             duration: 20,  category: "wake"     },
  { time: "07:16", label: "DEEP WORK — BLOCK 1", command: "Focus on the single most important problem. Nothing else.",      duration: 120, category: "work"     },
  { time: "09:16", label: "TEAM BLOCK",          command: "Structured meetings only. No open-ended discussions.",           duration: 90,  category: "work"     },
  { time: "10:46", label: "DEEP WORK — BLOCK 2", command: "Back to focused work. Protect this time fiercely.",              duration: 90,  category: "work"     },
  { time: "12:16", label: "DEEP WORK — BLOCK 3", command: "Third block. You fast until dinner. The mind stays sharp.",     duration: 90,  category: "work"     },
  { time: "13:46", label: "BREAK",               command: "Walk. Water. No food — intermittent fasting continues.",         duration: 15,  category: "rest"     },
  { time: "14:01", label: "DEEP WORK — BLOCK 4", command: "Afternoon focus. Product decisions. Strategic thinking.",        duration: 120, category: "work"     },
  { time: "16:01", label: "REVIEWS & COMMS",     command: "Process email and messages in batch. Intentional, not reactive.",duration: 60,  category: "work"     },
  { time: "17:01", label: "SAUNA",               command: "30 minutes in the sauna. This is recovery and stress relief.",   duration: 30,  category: "rest"     },
  { time: "17:31", label: "ICE BATH",            command: "15 minutes cold immersion. Mind over matter. Every time.",       duration: 15,  category: "rest"     },
  { time: "17:46", label: "DINNER",              command: "First meal of the day. Eat intentionally. No junk.",             duration: 30,  category: "rest"     },
  { time: "18:16", label: "JOURNAL",             command: "Write. What did you learn? What are you grateful for?",          duration: 20,  category: "rest"     },
  { time: "21:30", label: "SHUT DOWN",           command: "Devices down. The day is complete. Sleep is the final act.",     duration: 30,  category: "rest"     },
  { time: "22:00", label: "SLEEP",               command: "Rest. 7 hours. Intention set for tomorrow.",                     duration: 0,   category: "rest"     },
]);

const DORSEY_WE = build([
  { time: "07:00", label: "WAKE UP",             command: "A slower morning. Still intentional. Still present.",             duration: 5,   category: "wake"     },
  { time: "07:05", label: "MEDITATE",            command: "Extend the practice. 45 minutes today. Go deeper.",              duration: 45,  category: "wake"     },
  { time: "07:50", label: "HIKE",                command: "Long trail hike. Nature, silence, and walking meditation.",      duration: 120, category: "exercise" },
  { time: "09:50", label: "SHOWER",              command: "Clean up after the hike. Cold finish.",                           duration: 15,  category: "wake"     },
  { time: "10:05", label: "BREAKFAST",           command: "Weekend allows a meal earlier. Cook something real and clean.",   duration: 30,  category: "rest"     },
  { time: "10:35", label: "READING",             command: "Books, not screens. Something that expands your perspective.",   duration: 90,  category: "rest"     },
  { time: "12:05", label: "COOKING",             command: "Prepare a real meal. The act of cooking is mindful practice.",   duration: 45,  category: "rest"     },
  { time: "12:50", label: "LUNCH",               command: "Eat what you made. Gratitude for the simple things.",            duration: 30,  category: "rest"     },
  { time: "13:20", label: "CREATIVE BLOCK",      command: "Write, sketch, build something outside your normal work.",       duration: 90,  category: "work"     },
  { time: "14:50", label: "WALK",                command: "Afternoon walk. Let the mind wander without agenda.",            duration: 30,  category: "exercise" },
  { time: "15:20", label: "REST",                command: "Read, nap, or simply sit. Recovery has a purpose.",              duration: 60,  category: "rest"     },
  { time: "16:20", label: "SAUNA & ICE",         command: "Sauna 20 min, ice bath 10 min. Ritual recovery.",               duration: 30,  category: "rest"     },
  { time: "16:50", label: "DINNER",              command: "Cook something thoughtful. Enjoy it slowly.",                    duration: 45,  category: "rest"     },
  { time: "17:35", label: "JOURNAL & REFLECT",   command: "What did this week teach you? Write without editing.",           duration: 25,  category: "rest"     },
  { time: "21:00", label: "SHUT DOWN",           command: "Early night. The week starts early. Sleep is the investment.",   duration: 30,  category: "rest"     },
  { time: "21:30", label: "SLEEP",               command: "Rest. Tomorrow's focus begins now.",                             duration: 0,   category: "rest"     },
]);

// ─────────────────────────────────────────────────────────────
// 3. JOCKO WILLINK
// ─────────────────────────────────────────────────────────────

const JOCKO_WD = build([
  { time: "04:30", label: "WAKE UP",             command: "That alarm is your starting gun. Get after it.",                 duration: 5,   category: "wake"     },
  { time: "04:35", label: "GEAR UP",             command: "Clothes on. No deliberating. No checking the phone. Move.",     duration: 10,  category: "wake"     },
  { time: "04:45", label: "WORKOUT",             command: "Jiu-jitsu, barbell, or run. 105 minutes. Maximum effort.",      duration: 105, category: "exercise" },
  { time: "06:30", label: "SHOWER",              command: "Cold. Hard. Fast. Clean up and get to work.",                    duration: 15,  category: "wake"     },
  { time: "06:45", label: "PROTEIN BREAKFAST",   command: "High-protein. No garbage. Fuel the engine.",                    duration: 20,  category: "rest"     },
  { time: "07:05", label: "DEEP WORK — BLOCK 1", command: "Leadership. Business. Writing. Podcasting. Do the work.",       duration: 120, category: "work"     },
  { time: "09:05", label: "BREAK",               command: "Stand. Stretch. 10 minutes. No excuses for getting soft.",      duration: 10,  category: "rest"     },
  { time: "09:15", label: "DEEP WORK — BLOCK 2", command: "Back at it. No complaining. No shortcuts.",                     duration: 120, category: "work"     },
  { time: "11:15", label: "LUNCH",               command: "Eat clean. Fuel the afternoon. Get back in the fight.",         duration: 30,  category: "rest"     },
  { time: "11:45", label: "ADMIN & COMMS",       command: "Email, calls, obligations. Handle them fast and move on.",      duration: 60,  category: "work"     },
  { time: "12:45", label: "MEETINGS & TEAM",     command: "Lead with clarity. No ambiguity. Decentralise where possible.",  duration: 90,  category: "work"     },
  { time: "14:15", label: "JITS / SECOND TRAIN", command: "Jiu-jitsu or second gym session. You're not done yet.",         duration: 90,  category: "exercise" },
  { time: "15:45", label: "COOL DOWN & STRETCH", command: "Cool down. Don't skip it. Longevity is the goal.",              duration: 20,  category: "exercise" },
  { time: "16:05", label: "FAMILY TIME",         command: "Be present with the family. Put the phone down. Be there.",     duration: 90,  category: "family"   },
  { time: "17:35", label: "DINNER",              command: "Eat with family. No devices. Real conversation.",                duration: 30,  category: "family"   },
  { time: "18:05", label: "READ",                command: "60 minutes. History, leadership, strategy, or philosophy.",     duration: 60,  category: "rest"     },
  { time: "19:05", label: "REFLECT",             command: "What did you execute today? What will you attack tomorrow?",    duration: 20,  category: "rest"     },
  { time: "21:30", label: "SHUT DOWN",           command: "Rest is part of the mission. Protect your sleep.",              duration: 30,  category: "rest"     },
  { time: "22:00", label: "SLEEP",               command: "Lights out. 0430 comes fast. Get your rest.",                   duration: 0,   category: "rest"     },
]);

const JOCKO_WE = build([
  { time: "04:30", label: "WAKE UP",             command: "Weekend. Same time. Discipline doesn't negotiate.",              duration: 5,   category: "wake"     },
  { time: "04:35", label: "GEAR UP",             command: "Trail shoes on. You're going outside today.",                   duration: 10,  category: "wake"     },
  { time: "04:45", label: "TRAIL RUN",           command: "Long run. Hills. Embrace the suck. This is where growth lives.",duration: 90,  category: "exercise" },
  { time: "06:15", label: "SWIM OR SECONDARY",   command: "Open water swim or secondary conditioning. Keep going.",        duration: 45,  category: "exercise" },
  { time: "07:00", label: "SHOWER",              command: "Cold. You know the drill.",                                      duration: 15,  category: "wake"     },
  { time: "07:15", label: "BREAKFAST",           command: "Protein. Real food. Eat enough — you earned it.",               duration: 25,  category: "rest"     },
  { time: "07:40", label: "FAMILY TIME",         command: "The family comes first on weekends. Be fully present.",         duration: 120, category: "family"   },
  { time: "09:40", label: "READ & STUDY",        command: "90 minutes. Go deep on a book. No skimming.",                  duration: 90,  category: "rest"     },
  { time: "11:10", label: "JITS / SKILL WORK",   command: "Open mat or skill drilling. Stay sharp.",                       duration: 60,  category: "exercise" },
  { time: "12:10", label: "LUNCH WITH FAMILY",   command: "Eat together. No devices at the table. Conversations only.",   duration: 45,  category: "family"   },
  { time: "12:55", label: "OUTDOOR ACTIVITY",    command: "Hike, paddle, play with the kids. Move and be outside.",       duration: 120, category: "family"   },
  { time: "14:55", label: "REST & RECOVERY",     command: "Stretch. Foam roll. Let the body rebuild.",                    duration: 30,  category: "rest"     },
  { time: "15:25", label: "FAMILY DINNER PREP",  command: "Cook for the family. Simple, clean, and together.",            duration: 45,  category: "family"   },
  { time: "16:10", label: "FAMILY DINNER",       command: "Around the table. This is what all the work is for.",          duration: 45,  category: "family"   },
  { time: "17:00", label: "READ",                command: "Evening reading. Wind down the right way.",                    duration: 60,  category: "rest"     },
  { time: "20:30", label: "SHUT DOWN",           command: "Early sleep. 0430 Monday is coming. Be ready.",                duration: 30,  category: "rest"     },
  { time: "21:00", label: "SLEEP",               command: "Rest. The mission resumes before dawn.",                        duration: 0,   category: "rest"     },
]);

// ─────────────────────────────────────────────────────────────
// 4. TIM FERRISS
// ─────────────────────────────────────────────────────────────

const FERRISS_WD = build([
  { time: "08:30", label: "WAKE UP",             command: "No alarm panic. Rise slowly. The morning belongs to you.",       duration: 10,  category: "wake"     },
  { time: "08:40", label: "5-MIN JOURNAL",       command: "5-minute journal: 3 things grateful for, 3 intentions, 1 affirmation. Do it daily.", duration: 10, category: "rest" },
  { time: "08:50", label: "TEA CEREMONY",        command: "Brew tea deliberately. 10 minutes. No phone. Just the ritual.", duration: 10,  category: "wake"     },
  { time: "09:00", label: "CREATIVE WRITING",    command: "No email. No Slack. 90 minutes of deep creative output first.", duration: 90,  category: "work"     },
  { time: "10:30", label: "BRUNCH",              command: "High-fat, low-carb brunch. Eat mindfully. No screens.",         duration: 30,  category: "rest"     },
  { time: "11:00", label: "EMAIL BATCH 1",       command: "First email batch of the day. Respond efficiently. Then close.", duration: 30, category: "work"     },
  { time: "11:30", label: "EXERCISE",            command: "Cycling, kettlebells, or climbing. 60-90 minutes of movement.",  duration: 75,  category: "exercise" },
  { time: "12:45", label: "SHOWER",              command: "Cold finish. Reset the system. You're entering flow state.",    duration: 15,  category: "wake"     },
  { time: "13:00", label: "CONTENT BLOCK",       command: "Podcast prep, writing, or interviews. Create something of value.", duration: 90, category: "work"  },
  { time: "14:30", label: "LUNCH",               command: "Real food. Away from the desk. Let the mind rest.",             duration: 30,  category: "rest"     },
  { time: "15:00", label: "LEARNING BLOCK",      command: "Language study, instrument practice, or a new skill. 60 minutes.", duration: 60, category: "work"  },
  { time: "16:00", label: "EMAIL BATCH 2",       command: "Second and final email batch. Then close it for the day.",      duration: 30,  category: "work"     },
  { time: "16:30", label: "WALK",                command: "45-minute walk. No destination. Let the mind wander.",          duration: 45,  category: "exercise" },
  { time: "17:15", label: "DINNER",              command: "Cook or eat clean. Present, unhurried. The day is winding down.", duration: 45, category: "rest"    },
  { time: "18:00", label: "FICTION READING",     command: "Fiction only after 6 PM. The brain deserves real stories.",     duration: 60,  category: "rest"     },
  { time: "19:00", label: "CHAMOMILE & WIND DOWN",command: "Chamomile tea. Dim the lights. Begin transitioning to sleep.", duration: 30,  category: "rest"     },
  { time: "22:30", label: "SHUT DOWN",           command: "All screens off. Journal complete. Tomorrow's plan is set.",    duration: 30,  category: "rest"     },
  { time: "23:00", label: "SLEEP",               command: "Rest. The experiment continues tomorrow.",                       duration: 0,   category: "rest"     },
]);

const FERRISS_WE = build([
  { time: "09:00", label: "WAKE UP",             command: "Even slower this morning. The day is open. Explore it.",         duration: 10,  category: "wake"     },
  { time: "09:10", label: "5-MIN JOURNAL",       command: "Never skip the journal. Gratitude, intentions, affirmation.",   duration: 10,  category: "rest"     },
  { time: "09:20", label: "TEA & READING",       command: "Tea ceremony plus 30 minutes of something inspiring.",          duration: 45,  category: "wake"     },
  { time: "10:05", label: "ADVENTURE EXERCISE",  command: "Hiking, surfing, dancing, or something outside your routine.",  duration: 90,  category: "exercise" },
  { time: "11:35", label: "COOKING EXPERIMENT",  command: "Try a new recipe. Cooking is experimentation. Have fun with it.", duration: 60, category: "rest"   },
  { time: "12:35", label: "BRUNCH",              command: "Eat what you cooked. Present. Grateful.",                        duration: 30,  category: "rest"     },
  { time: "13:05", label: "SOCIAL / EXPLORE",    command: "See a friend. Walk somewhere new. Collect interesting experiences.", duration: 120, category: "family" },
  { time: "15:05", label: "READING",             command: "Explore a book on an unfamiliar topic. Cross-pollinate ideas.", duration: 90,  category: "rest"     },
  { time: "16:35", label: "WALK",                command: "Evening walk. Observe the world. Take notes on what interests you.", duration: 45, category: "exercise" },
  { time: "17:20", label: "DINNER",              command: "Good food, good company, or both.",                              duration: 60,  category: "rest"     },
  { time: "18:20", label: "FICTION READING",     command: "Two hours of reading. This is the weekend reward.",             duration: 120, category: "rest"     },
  { time: "21:30", label: "SHUT DOWN",           command: "End the weekend deliberately. Reflect on what you discovered.", duration: 30,  category: "rest"     },
  { time: "22:00", label: "SLEEP",               command: "Rest well. The experiments never truly stop.",                   duration: 0,   category: "rest"     },
]);

// ─────────────────────────────────────────────────────────────
// 5. DAVID GOGGINS
// ─────────────────────────────────────────────────────────────

const GOGGINS_WD = build([
  { time: "03:00", label: "WAKE UP",             command: "3 AM. Most people are sleeping. You are not most people.",       duration: 5,   category: "wake"     },
  { time: "03:05", label: "STRETCH & MOBILITY",  command: "30 minutes of stretching. Your body is your tool. Maintain it.", duration: 30, category: "exercise" },
  { time: "03:35", label: "LONG RUN",            command: "15 to 20 miles. In the dark. In the cold. In whatever. Go.",    duration: 120, category: "exercise" },
  { time: "05:35", label: "SHOWER",              command: "Cold. Then hot. Then cold again. The body adapts.",             duration: 15,  category: "wake"     },
  { time: "05:50", label: "BREAKFAST",           command: "Fuel the machine. High protein, real food. No junk.",           duration: 20,  category: "rest"     },
  { time: "06:10", label: "DEEP WORK — BLOCK 1", command: "The world is still quiet. Work without interruption.",          duration: 120, category: "work"     },
  { time: "08:10", label: "BREAK",               command: "10 minutes. Hydrate. Assess. Then keep going.",                 duration: 10,  category: "rest"     },
  { time: "08:20", label: "DEEP WORK — BLOCK 2", command: "You ran 20 miles. Sitting at a desk is easy. Get it done.",    duration: 120, category: "work"     },
  { time: "10:20", label: "LUNCH",               command: "Eat clean. You burned thousands of calories. Refuel properly.", duration: 25,  category: "rest"     },
  { time: "10:45", label: "BIKE OR SECOND WORKOUT", command: "60 to 90 minutes cycling or strength work. Not optional.",   duration: 75,  category: "exercise" },
  { time: "12:00", label: "MEAL PREP",           command: "Prepare your meals for tomorrow. Control what goes in your body.", duration: 30, category: "rest"   },
  { time: "12:30", label: "WORK & OBLIGATIONS",  command: "Handle what the day demands. Stay present. No self-pity.",      duration: 90,  category: "work"     },
  { time: "14:00", label: "STUDY & READING",     command: "Read something that builds your mind. 60 minutes minimum.",    duration: 60,  category: "work"     },
  { time: "15:00", label: "REFLECT",             command: "Accountability mirror. What did you do well? What were you weak at?", duration: 20, category: "rest" },
  { time: "19:30", label: "SHUT DOWN",           command: "Rest is not weakness. Sleep is training. Begin the shutdown.",  duration: 30,  category: "rest"     },
  { time: "20:00", label: "SLEEP",               command: "Lights out. The alarm will sound at 3 AM. Be ready.",          duration: 0,   category: "rest"     },
]);

const GOGGINS_WE = build([
  { time: "03:00", label: "WAKE UP",             command: "You think the weekend earns a break? It doesn't. Rise.",        duration: 5,   category: "wake"     },
  { time: "03:05", label: "MOBILITY",            command: "Stretch and foam roll. You have miles ahead of you.",           duration: 30,  category: "exercise" },
  { time: "03:35", label: "ULTRA LONG RUN",      command: "Weekend is for the long ones. 20-30 miles. Find your limit.",   duration: 180, category: "exercise" },
  { time: "06:35", label: "RECOVERY PROTOCOL",   command: "Ice, stretch, compression. Treat recovery as seriously as training.", duration: 30, category: "rest" },
  { time: "07:05", label: "BREAKFAST",           command: "You earned every calorie. Eat real food. Refuel completely.",   duration: 25,  category: "rest"     },
  { time: "07:30", label: "SWIM OR BIKE",        command: "Secondary training. Active recovery. Stay in motion.",          duration: 60,  category: "exercise" },
  { time: "08:30", label: "MENTAL TRAINING",     command: "Visualisation, journaling, or reading about resilience.",       duration: 60,  category: "rest"     },
  { time: "09:30", label: "STUDY",               command: "Read and learn. The mind must grow as fast as the body.",       duration: 90,  category: "work"     },
  { time: "11:00", label: "MEAL PREP",           command: "Batch cook for the week. Your performance depends on fuel.",    duration: 60,  category: "rest"     },
  { time: "12:00", label: "LUNCH",               command: "Clean, high-quality food. Eat in silence and reflect.",         duration: 25,  category: "rest"     },
  { time: "12:25", label: "REST",                command: "Active rest only. Walk, stretch, breathe.",                     duration: 60,  category: "rest"     },
  { time: "13:25", label: "REFLECT & JOURNAL",   command: "What did you push through this week? What scared you? Did you do it anyway?", duration: 30, category: "rest" },
  { time: "18:30", label: "SHUT DOWN",           command: "3 AM comes no matter what. Sleep early. Sleep hard.",          duration: 30,  category: "rest"     },
  { time: "19:00", label: "SLEEP",               command: "Rest. The road calls before dawn.",                             duration: 0,   category: "rest"     },
]);

// ─────────────────────────────────────────────────────────────
// 6. ELON MUSK
// ─────────────────────────────────────────────────────────────

const MUSK_WD = build([
  { time: "07:00", label: "WAKE UP",             command: "Six hours. That's enough. Get to work.",                         duration: 5,   category: "wake"     },
  { time: "07:05", label: "EMAIL TRIAGE",        command: "Five minutes. Only existential fires. Everything else can wait.", duration: 5,  category: "work"     },
  { time: "07:10", label: "SHOWER & READY",      command: "Fast. Efficient. You have no time to waste.",                   duration: 15,  category: "wake"     },
  { time: "07:25", label: "WORK BLOCK 1",        command: "First factory or office block. 30-min slots. Decisions only.",  duration: 90,  category: "work"     },
  { time: "08:55", label: "WORK BLOCK 2",        command: "Engineering, product, or strategy. Stay on the hardest problems.", duration: 90, category: "work"   },
  { time: "10:25", label: "WORKING LUNCH",       command: "Eat at the desk. Don't waste the hour. Keep processing.",       duration: 30,  category: "rest"     },
  { time: "10:55", label: "WORK BLOCK 3",        command: "Production walkthrough or site visit. See the actual work.",    duration: 90,  category: "work"     },
  { time: "12:25", label: "WORK BLOCK 4",        command: "Design reviews. Technical decisions. Move things forward.",     duration: 90,  category: "work"     },
  { time: "13:55", label: "WORK BLOCK 5",        command: "Address the bottlenecks. No bureaucracy. Just execution.",      duration: 90,  category: "work"     },
  { time: "15:25", label: "CRITICAL EMAILS",     command: "Respond to the critical threads. Short. Direct. Actionable.",   duration: 30,  category: "work"     },
  { time: "15:55", label: "WORK BLOCK 6",        command: "Evening push. This is where other people quit. You don't.",    duration: 120, category: "work"     },
  { time: "17:55", label: "WORK BLOCK 7",        command: "Night session. Critical problems only. Push the mission forward.", duration: 120, category: "work"  },
  { time: "19:55", label: "KIDS TIME",           command: "Family. Children. Be present — even briefly. It matters.",     duration: 60,  category: "family"   },
  { time: "20:55", label: "LATE WORK SESSION",   command: "Back to the problems. The mission doesn't clock out.",          duration: 120, category: "work"     },
  { time: "23:00", label: "SHUT DOWN",           command: "Wind down. You'll be back at 7. Sleep is a tool.",             duration: 30,  category: "rest"     },
  { time: "23:30", label: "SLEEP",               command: "Six hours. No more, no less. The mission continues at dawn.",   duration: 0,   category: "rest"     },
]);

const MUSK_WE = build([
  { time: "07:30", label: "WAKE UP",             command: "Slightly later. Still early. The work doesn't fully stop.",     duration: 5,   category: "wake"     },
  { time: "07:35", label: "EMAIL TRIAGE",        command: "Critical threads only. Filter ruthlessly.",                     duration: 15,  category: "work"     },
  { time: "07:50", label: "SHOWER & READY",      command: "Fast. Always fast.",                                            duration: 15,  category: "wake"     },
  { time: "08:05", label: "WORK BLOCK",          command: "Strategic thinking. Writing. High-level problems. No meetings.", duration: 120, category: "work"   },
  { time: "10:05", label: "KIDS TIME",           command: "Weekend mornings belong to the kids. Be fully there.",          duration: 90,  category: "family"   },
  { time: "11:35", label: "LUNCH WITH FAMILY",   command: "Eat together. Put the devices down. One real hour.",           duration: 45,  category: "family"   },
  { time: "12:20", label: "WORK BLOCK",          command: "Afternoon focus. Industry reading, strategy, or product work.", duration: 120, category: "work"     },
  { time: "14:20", label: "FAMILY ACTIVITY",     command: "Something active with the kids. Build, explore, create.",      duration: 90,  category: "family"   },
  { time: "15:50", label: "WORK BLOCK",          command: "Evening push. Lighter than weekdays. Still meaningful.",        duration: 90,  category: "work"     },
  { time: "17:20", label: "DINNER",              command: "Eat. If possible, with the family. Present.",                   duration: 30,  category: "rest"     },
  { time: "17:50", label: "WORK BLOCK",          command: "Final session. Tie up the important threads.",                  duration: 90,  category: "work"     },
  { time: "21:30", label: "SHUT DOWN",           command: "Earlier tonight. The week is long. Protect the sleep.",        duration: 30,  category: "rest"     },
  { time: "22:00", label: "SLEEP",               command: "Rest. Monday comes fast.",                                      duration: 0,   category: "rest"     },
]);

// ─────────────────────────────────────────────────────────────
// 7. PROPHET MUHAMMAD (PBUH)
// ─────────────────────────────────────────────────────────────

const PROPHET_WD = build([
  { time: "04:00", label: "TAHAJJUD",            command: "Rise in the last third of the night. This hour is yours and Allah's alone.", duration: 30, category: "faith" },
  { time: "04:30", label: "FAJR PRAYER & ADHKAR",command: "Rise for Fajr. The angels of the night and day witness this hour.", duration: 20, category: "faith" },
  { time: "04:50", label: "ADHKAR & QURAN",      command: "Morning adhkar. Recite with presence. Begin with Ayatul Kursi.", duration: 30,  category: "faith"    },
  { time: "05:20", label: "PLAN THE DAY",        command: "Set your intentions. Let your work be for Allah's sake.",        duration: 15,  category: "work"     },
  { time: "05:35", label: "WALK & MOVEMENT",     command: "Light morning movement. The Prophet loved to walk. Follow his sunnah.", duration: 30, category: "exercise" },
  { time: "06:05", label: "MORNING MEAL",        command: "Begin with dates if available. Eat lightly. The sunnah is moderation.", duration: 20, category: "rest" },
  { time: "06:25", label: "DEEP WORK — BLOCK 1", command: "The blessed hours after Fajr. Work with full presence.",         duration: 120, category: "work"     },
  { time: "08:25", label: "COMMUNITY & AFFAIRS", command: "Tend to the needs of others. The best people are those who benefit others.", duration: 60, category: "family" },
  { time: "09:25", label: "DEEP WORK — BLOCK 2", command: "Continue your efforts. Tawakkul — trust in Allah, but tie your camel.", duration: 90, category: "work" },
  { time: "11:55", label: "BREAK & DHIKR",       command: "Subhanallah 33×. Alhamdulillah 33×. Allahu Akbar 34×.",        duration: 10,  category: "faith"    },
  { time: "12:05", label: "DHUHR PRAYER",        command: "Stop. Face the qiblah. Pray Dhuhr with full khushu.",           duration: 20,  category: "faith"    },
  { time: "12:25", label: "QAYLULAH",            command: "Prophetic nap. 20-30 minutes. Rest is sunnah.",                 duration: 25,  category: "rest"     },
  { time: "12:50", label: "LUNCH",               command: "Eat with gratitude. Bismillah. Share if you can.",              duration: 30,  category: "rest"     },
  { time: "13:20", label: "DEEP WORK — BLOCK 3", command: "Afternoon work. Stay upright. Avoid laziness — it is discouraged.", duration: 90, category: "work" },
  { time: "14:50", label: "ASR PRAYER & DHIKR",  command: "Pray Asr. The prayer between two darknesses. Do not miss it.", duration: 25,  category: "faith"    },
  { time: "15:15", label: "COMMUNITY AFFAIRS",   command: "Visit the sick. Help a neighbour. Give sadaqah. Islam is action.", duration: 60, category: "family" },
  { time: "16:15", label: "FAMILY TIME",         command: "Be gentle with your family. The best of you is the best to his family.", duration: 60, category: "family" },
  { time: "17:15", label: "DINNER",              command: "Eat with the family. Simple. Halal. Begin with Bismillah.",     duration: 30,  category: "rest"     },
  { time: "17:45", label: "MAGHRIB PRAYER",      command: "Pray Maghrib at its time. The gates of mercy open at sunset.",  duration: 20,  category: "faith"    },
  { time: "18:05", label: "QURAN & TEACHING",    command: "Recite, reflect, and share knowledge. The best is Quran.",      duration: 60,  category: "faith"    },
  { time: "19:05", label: "ISHA PRAYER & DUA",   command: "Pray Isha. Make sincere dua. Seek forgiveness. End with Allah.", duration: 25, category: "faith"   },
  { time: "19:30", label: "REFLECT",             command: "What did you do today for the akhira? Account for yourself.",  duration: 20,  category: "rest"     },
  { time: "21:00", label: "SLEEP",               command: "Sleep on your right side. Recite your sleeping duas. Rest.",   duration: 0,   category: "rest"     },
]);

const PROPHET_FRI = build([
  { time: "04:00", label: "TAHAJJUD",            command: "Friday night into Friday morning. The most blessed time to rise.", duration: 30, category: "faith" },
  { time: "04:30", label: "FAJR PRAYER & ADHKAR",command: "Fajr on Jumu'ah. Read Surah Al-Kahf this morning.",             duration: 25,  category: "faith"    },
  { time: "04:55", label: "SURAH AL-KAHF",       command: "Read the full Surah Al-Kahf. Light upon light until next Friday.", duration: 30, category: "faith"  },
  { time: "05:25", label: "GHUSL (RITUAL BATH)", command: "Friday ghusl is sunnah. Prepare your body for the day of Jumu'ah.", duration: 20, category: "wake" },
  { time: "05:45", label: "BEST CLOTHES",        command: "Dress in your best. Wear fragrance. This is the day of Eid every week.", duration: 10, category: "wake" },
  { time: "05:55", label: "QURAN & SALAH",       command: "Send abundant salawat upon the Prophet. This day is his day.",   duration: 30,  category: "faith"    },
  { time: "06:25", label: "MORNING WORK",        command: "Work with blessing. Friday carries its own barakah.",            duration: 120, category: "work"     },
  { time: "08:25", label: "COMMUNITY PREP",      command: "Arrive early to Jumu'ah. The earlier you come, the greater the reward.", duration: 60, category: "faith" },
  { time: "09:25", label: "EARLY ARRIVAL — MASJID", command: "Arrive at the masjid early. Pray nafl. Read Quran. Wait for the adhan.", duration: 120, category: "faith" },
  { time: "11:25", label: "JUMU'AH PRAYER",      command: "The weekly congregation. Listen to the khutbah with full attention.", duration: 60, category: "faith" },
  { time: "12:25", label: "COMMUNITY GATHERING", command: "Connect with the ummah. Share knowledge. Break bread together.", duration: 60,  category: "family"   },
  { time: "13:25", label: "LUNCH",               command: "Eat with brothers and sisters. This is a day of community.",    duration: 30,  category: "rest"     },
  { time: "13:55", label: "ASR PRAYER & DHIKR",  command: "The hour before Asr on Friday — the most likely hour of acceptance.", duration: 25, category: "faith" },
  { time: "14:20", label: "FAMILY TIME",         command: "Friday afternoon belongs to family. Be present and gentle.",    duration: 90,  category: "family"   },
  { time: "15:50", label: "SPECIAL DUA",         command: "The last hour before Maghrib on Friday. Make abundant dua.",   duration: 30,  category: "faith"    },
  { time: "16:20", label: "DINNER",              command: "Friday dinner. Eat together. Celebrate the blessed day.",       duration: 30,  category: "rest"     },
  { time: "16:50", label: "MAGHRIB PRAYER",      command: "Pray Maghrib. Friday ends but its light continues.",            duration: 20,  category: "faith"    },
  { time: "17:10", label: "QURAN RECITATION",    command: "Evening Quran. Send salawat. Reflect on the week.",            duration: 45,  category: "faith"    },
  { time: "17:55", label: "ISHA PRAYER & DUA",   command: "Isha on Friday. End the blessed day in gratitude.",            duration: 25,  category: "faith"    },
  { time: "20:00", label: "SLEEP",               command: "Rest. Jumu'ah has been completed. Alhamdulillah.",             duration: 0,   category: "rest"     },
]);

const PROPHET_WE = build([
  { time: "04:00", label: "TAHAJJUD",            command: "Rise in the last third of the night. This hour is yours and Allah's alone.", duration: 30, category: "faith" },
  { time: "04:30", label: "FAJR PRAYER & ADHKAR",command: "Rise for Fajr. The angels of the night and day witness this hour.", duration: 20, category: "faith" },
  { time: "04:50", label: "ADHKAR & QURAN",      command: "Morning adhkar. Recite Quran with reflection and presence.",    duration: 45,  category: "faith"    },
  { time: "05:35", label: "WALK",                command: "Morning walk. Reflect on Allah's creation. Be grateful.",       duration: 30,  category: "exercise" },
  { time: "06:05", label: "MORNING MEAL",        command: "Light, halal breakfast. Bismillah. Gratitude for the provision.", duration: 20, category: "rest"   },
  { time: "06:25", label: "FAMILY TIME",         command: "Weekend mornings with family. The Prophet was gentle at home.", duration: 90,  category: "family"   },
  { time: "07:55", label: "COMMUNITY SERVICE",   command: "Serve the community. Visit. Help. Give. Islam is complete action.", duration: 90, category: "family" },
  { time: "09:25", label: "STUDY & REFLECTION",  command: "Deep learning of deen. Tafsir, hadith, or Islamic science.",   duration: 90,  category: "faith"    },
  { time: "11:55", label: "DHUHR PRAYER",        command: "Pray Dhuhr. Return to stillness.",                              duration: 20,  category: "faith"    },
  { time: "12:15", label: "QAYLULAH",            command: "Sunnah nap. Rest in the middle of the day.",                   duration: 25,  category: "rest"     },
  { time: "12:40", label: "LUNCH WITH FAMILY",   command: "Eat together. Bismillah. Share food and conversation.",         duration: 45,  category: "family"   },
  { time: "13:25", label: "OUTDOOR ACTIVITY",    command: "The Prophet loved horses and movement. Go outside and move.",   duration: 60,  category: "exercise" },
  { time: "14:25", label: "ASR PRAYER",          command: "Pray Asr. Do not delay it.",                                    duration: 20,  category: "faith"    },
  { time: "14:45", label: "FAMILY TIME",         command: "Afternoon with the family. Love them as the Prophet loved his.", duration: 90, category: "family"  },
  { time: "16:15", label: "DINNER",              command: "Eat clean and halal. Share it with those in need if you can.",  duration: 30,  category: "rest"     },
  { time: "16:45", label: "MAGHRIB PRAYER",      command: "Pray Maghrib at the call. Be consistent in all five.",          duration: 20,  category: "faith"    },
  { time: "17:05", label: "QURAN & DHIKR",       command: "Evening Quran recitation. Send salawat. Make istighfar.",      duration: 45,  category: "faith"    },
  { time: "17:50", label: "ISHA PRAYER",         command: "Pray Isha. Complete the five. End the day with Allah.",         duration: 20,  category: "faith"    },
  { time: "19:30", label: "SLEEP",               command: "Early sleep is sunnah. Rest. The night prayer calls before dawn.", duration: 0, category: "rest"   },
]);

// ─────────────────────────────────────────────────────────────
// 8. THE MONK (Thich Nhat Hanh inspired)
// ─────────────────────────────────────────────────────────────

const MONK_WD = build([
  { time: "03:45", label: "WAKE UP",             command: "The bell calls you home. Breathe. Let the silence hold you.",   duration: 5,   category: "wake"     },
  { time: "03:50", label: "SITTING MEDITATION",  command: "One hour of sitting practice. No agenda. Just breath and presence.", duration: 60, category: "wake" },
  { time: "04:50", label: "WALKING MEDITATION",  command: "30 minutes walking in silence. Each step a prayer.",           duration: 30,  category: "exercise" },
  { time: "05:20", label: "MINDFUL BREAKFAST",   command: "Simple food. Eaten in silence. Each bite fully tasted.",        duration: 30,  category: "rest"     },
  { time: "05:50", label: "DHARMA STUDY",        command: "Study the teachings. Read deeply. Let the words settle.",       duration: 60,  category: "work"     },
  { time: "06:50", label: "MINDFUL WORK",        command: "Work as practice. Full presence in every action. No rushing.",  duration: 90,  category: "work"     },
  { time: "08:20", label: "WALKING BREAK",       command: "Walk slowly. Notice the ground beneath you. Breathe.",         duration: 15,  category: "exercise" },
  { time: "08:35", label: "MINDFUL WORK 2",      command: "Return to work. Unhurried. Deliberate. Complete.",              duration: 90,  category: "work"     },
  { time: "10:05", label: "NOBLE SILENCE LUNCH", command: "Lunch in noble silence. Eat slowly. No speech. No screens.",   duration: 45,  category: "rest"     },
  { time: "10:50", label: "REST",                command: "30 minutes rest. Eyes closed or open. Simply being.",           duration: 30,  category: "rest"     },
  { time: "11:20", label: "AFTERNOON WALKING MEDITATION", command: "Slow walking. Half an hour. Every step is arrival.", duration: 30,  category: "exercise" },
  { time: "11:50", label: "COMMUNITY SERVICE",   command: "Work in service of others. Cooking, cleaning, or caregiving.", duration: 60,  category: "family"   },
  { time: "12:50", label: "DHARMA DISCUSSION",   command: "Share teachings or listen to others share theirs.",             duration: 45,  category: "work"     },
  { time: "13:35", label: "FREE TIME",           command: "Walking, reading, or sitting. Do what restores you.",           duration: 60,  category: "rest"     },
  { time: "14:35", label: "EVENING SITTING MEDITATION", command: "45 minutes of sitting. The day settles into stillness.", duration: 45, category: "wake"   },
  { time: "15:20", label: "SIMPLE DINNER",       command: "Last meal of the day. Light. Mindful. Grateful.",               duration: 30,  category: "rest"     },
  { time: "15:50", label: "NIGHT JOURNAL",       command: "15 minutes. What arose today? What passed through you?",        duration: 15,  category: "rest"     },
  { time: "21:00", label: "SLEEP",               command: "Rest completely. The bell will call you again before dawn.",    duration: 0,   category: "rest"     },
]);

const MONK_WD_ALT = MONK_WD; // Mon-Fri identical

const MONK_SUN = build([
  { time: "03:45", label: "WAKE UP",             command: "The bell calls you home. Sunday is the day of mindfulness.",   duration: 5,   category: "wake"     },
  { time: "03:50", label: "EXTENDED MEDITATION", command: "Two hours of sitting. Go as deep as the practice allows.",    duration: 120, category: "wake"     },
  { time: "05:50", label: "WALKING MEDITATION",  command: "Extended walking practice. 45 minutes. Full presence.",       duration: 45,  category: "exercise" },
  { time: "06:35", label: "MINDFUL BREAKFAST",   command: "Simple breakfast. Eaten slowly. In complete silence.",         duration: 30,  category: "rest"     },
  { time: "07:05", label: "DHARMA TALK",         command: "Listen to teachings. Sit and receive. Let understanding arise.", duration: 90, category: "work"   },
  { time: "08:35", label: "DEEP DHARMA STUDY",   command: "Study and contemplation of the teachings. Read. Reflect.",    duration: 90,  category: "work"     },
  { time: "10:05", label: "DAY OF MINDFULNESS",  command: "Every action today is meditation. No rushing. No agenda.",    duration: 120, category: "rest"     },
  { time: "12:05", label: "NOBLE SILENCE LUNCH", command: "Mindful lunch in full silence. Taste every bite.",            duration: 45,  category: "rest"     },
  { time: "12:50", label: "COMMUNITY SHARING",   command: "Share practice with others. What did you observe this week?", duration: 60,  category: "family"   },
  { time: "13:50", label: "WALKING IN NATURE",   command: "Long slow walk outside. Nature is the greatest teacher.",     duration: 90,  category: "exercise" },
  { time: "15:20", label: "EVENING MEDITATION",  command: "One hour of sitting to close the day of mindfulness.",        duration: 60,  category: "wake"     },
  { time: "16:20", label: "SIMPLE DINNER",       command: "Light, mindful dinner. Simple food. Profound gratitude.",     duration: 30,  category: "rest"     },
  { time: "16:50", label: "NIGHT JOURNAL",       command: "Reflect on the day of mindfulness. What arose? What passed?", duration: 20,  category: "rest"     },
  { time: "21:30", label: "SLEEP",               command: "Rest in awareness. The practice continues even in sleep.",    duration: 0,   category: "rest"     },
]);

// ─────────────────────────────────────────────────────────────
// 9. MARK WAHLBERG
// ─────────────────────────────────────────────────────────────

const WAHLBERG_WD = build([
  { time: "02:30", label: "WAKE UP",             command: "2:30. God gave you another day. Don't waste it.",              duration: 5,   category: "wake"     },
  { time: "02:35", label: "PRAYER",              command: "15 minutes of prayer. Every single morning. No exceptions.",   duration: 15,  category: "faith"    },
  { time: "02:50", label: "PRE-WORKOUT MEAL",    command: "Fuel before training. Eat clean. Your body needs it.",         duration: 20,  category: "rest"     },
  { time: "03:10", label: "PREPARE FOR GYM",     command: "Gear up. Get your mindset right. The next 95 minutes are everything.", duration: 10, category: "wake" },
  { time: "03:20", label: "WARM UP",             command: "20-minute warm up. No skipping. Protect those joints.",        duration: 20,  category: "exercise" },
  { time: "03:40", label: "INTENSE GYM SESSION", command: "95 minutes. Chest, back, arms. Heavy. Focused. No phone.",    duration: 95,  category: "exercise" },
  { time: "05:15", label: "CRYO RECOVERY",       command: "30 minutes cryo chamber. This is your edge. Use it.",         duration: 30,  category: "rest"     },
  { time: "05:45", label: "BREAKFAST #2",        command: "Second meal of the day. High protein. Real food. Eat well.",   duration: 30,  category: "rest"     },
  { time: "06:15", label: "SHOWER",              command: "Cold shower. Clean up. You've already done more than most will all day.", duration: 15, category: "wake" },
  { time: "06:30", label: "BUSINESS MEETINGS",   command: "Meetings, calls, production business. Work the room.",         duration: 90,  category: "work"     },
  { time: "08:00", label: "GOLF",                command: "Golf round or practice. Stay sharp across all dimensions.",    duration: 90,  category: "exercise" },
  { time: "09:30", label: "LUNCH",               command: "Third meal. Clean protein, vegetables, smart carbs.",          duration: 30,  category: "rest"     },
  { time: "10:00", label: "WORK BLOCK",          command: "Production, brand, or business obligations. Execute.",         duration: 90,  category: "work"     },
  { time: "11:30", label: "SPORT TRAINING",      command: "Basketball, boxing, or athletic training. Stay elite.",        duration: 60,  category: "exercise" },
  { time: "12:30", label: "CRYO RECOVERY #2",    command: "Second cryo session if needed. Recovery is non-negotiable.",  duration: 30,  category: "rest"     },
  { time: "13:00", label: "FAMILY TIME",         command: "Family. Kids. This is the whole point. Be 100% present.",     duration: 120, category: "family"   },
  { time: "15:00", label: "DINNER",              command: "Early dinner. Clean food. Eat with the family at the table.", duration: 30,  category: "family"   },
  { time: "15:30", label: "WIND DOWN",           command: "Decompress. Stretching or light movement. Signal sleep.",      duration: 30,  category: "rest"     },
  { time: "19:30", label: "SLEEP",               command: "Lights out at 7:30 PM. 2:30 comes in 7 hours. Rest.",         duration: 0,   category: "rest"     },
]);

const WAHLBERG_WE = build([
  { time: "04:00", label: "WAKE UP",             command: "Weekend. One hour later. Still grateful. Still praying first.", duration: 5,  category: "wake"     },
  { time: "04:05", label: "PRAYER",              command: "Morning prayer. The first act. Always.",                        duration: 15,  category: "faith"    },
  { time: "04:20", label: "PRE-WORKOUT MEAL",    command: "Fuel up. You're still training. Just a bit later.",            duration: 20,  category: "rest"     },
  { time: "04:40", label: "GYM",                 command: "Weekend session. Still intense. Still no shortcuts.",           duration: 90,  category: "exercise" },
  { time: "06:10", label: "CRYO RECOVERY",       command: "Recovery session. You did the work. Now let the body adapt.",  duration: 30,  category: "rest"     },
  { time: "06:40", label: "BREAKFAST",           command: "Big clean breakfast. You've earned it.",                        duration: 30,  category: "rest"     },
  { time: "07:10", label: "CHARITY GOLF",        command: "Weekend golf. Often charity events. Give back through sport.",  duration: 180, category: "exercise" },
  { time: "10:10", label: "FAMILY ACTIVITY",     command: "The whole family. Outside, active, and together. Non-negotiable.", duration: 120, category: "family" },
  { time: "12:10", label: "LUNCH WITH FAMILY",   command: "Eat together. Loud. Fun. Grateful. This is everything.",       duration: 45,  category: "family"   },
  { time: "12:55", label: "REST",                command: "Rest and recover. The body needs it on weekends.",             duration: 60,  category: "rest"     },
  { time: "13:55", label: "FAMILY ACTIVITIES",   command: "Afternoon is family time. All of it. No work. No exceptions.", duration: 120, category: "family"   },
  { time: "15:55", label: "DINNER",              command: "Early family dinner. Clean, real food. Together at the table.", duration: 45, category: "family"   },
  { time: "16:40", label: "WIND DOWN",           command: "Stretch, light reading, prayer. Signal the body for sleep.",   duration: 30,  category: "rest"     },
  { time: "20:00", label: "SLEEP",               command: "Rest. 4 AM comes. Family and faith made today worth it.",      duration: 0,   category: "rest"     },
]);

// ─────────────────────────────────────────────────────────────
// 10. THE DEVELOPER (DHH / Cal Newport inspired)
// ─────────────────────────────────────────────────────────────

const DEV_WD = build([
  { time: "08:00", label: "WAKE UP",             command: "No alarm panic. No social media. Coffee first, problems second.", duration: 10, category: "wake"   },
  { time: "08:10", label: "COFFEE RITUAL",       command: "10 minutes. Brew deliberately. Drink slowly. Set the tone.",    duration: 10,  category: "wake"     },
  { time: "08:20", label: "DEEP CODING — BLOCK 1", command: "No Slack. No email. No standups. Just you and the problem.", duration: 120, category: "work"    },
  { time: "10:20", label: "BREAK",               command: "Step away. Walk outside for 10 minutes. Come back with fresh eyes.", duration: 10, category: "rest" },
  { time: "10:30", label: "DEEP CODING — BLOCK 2", command: "Continue. The hard problems get solved in the second block.", duration: 90, category: "work"   },
  { time: "12:00", label: "LUNCH BREAK",         command: "Away from the desk. Outside if possible. Real food. Full break.", duration: 60, category: "rest"  },
  { time: "13:00", label: "FOCUS BLOCK",         command: "Code review, architecture, or documentation. Still no meetings.", duration: 60, category: "work"  },
  { time: "14:00", label: "AFTERNOON FOCUS",     command: "Ship something. Close the loop on a problem. Make progress.",  duration: 60,  category: "work"     },
  { time: "15:00", label: "MEETINGS WINDOW",     command: "If you must have meetings, batch them here. Not before noon.",  duration: 60,  category: "work"     },
  { time: "16:00", label: "EXERCISE",            command: "Run, bike, or swim. 45-60 minutes. Non-negotiable.",            duration: 55,  category: "exercise" },
  { time: "16:55", label: "SHOWER",              command: "Cold finish. Clear the mind from the day's work.",              duration: 15,  category: "wake"     },
  { time: "17:10", label: "DIGITAL SUNSET",      command: "No work screens after 6 PM. The problem will still be there tomorrow.", duration: 10, category: "rest" },
  { time: "17:20", label: "DINNER",              command: "Cook a real meal or eat something clean. Present.",             duration: 45,  category: "rest"     },
  { time: "18:05", label: "FAMILY / LEISURE",    command: "Be a person, not a programmer. Talk to humans. Be present.",   duration: 90,  category: "family"   },
  { time: "19:35", label: "FICTION READING",     command: "Fiction only in the evening. The brain needs narrative.",      duration: 60,  category: "rest"     },
  { time: "21:30", label: "SHUT DOWN",           command: "Write tomorrow's one most important task. Then close everything.", duration: 15, category: "rest"  },
  { time: "21:45", label: "WIND DOWN",           command: "No screens. Dim lights. Let the mind prepare for sleep.",       duration: 15,  category: "rest"     },
  { time: "22:00", label: "SLEEP",               command: "Rest. The compiler runs in your dreams.",                       duration: 0,   category: "rest"     },
]);

const DEV_WE = build([
  { time: "08:30", label: "WAKE UP",             command: "Slightly later. Still no social media first thing. Never.",    duration: 10,  category: "wake"     },
  { time: "08:40", label: "COFFEE & READING",    command: "Coffee and a book. Not a screen. This is how weekends begin.", duration: 30,  category: "wake"     },
  { time: "09:10", label: "EXERCISE",            command: "Hiking, running, or cycling. Longer and more relaxed today.",  duration: 90,  category: "exercise" },
  { time: "10:40", label: "SHOWER",              command: "Cold finish. Clean up. The day is open.",                       duration: 15,  category: "wake"     },
  { time: "10:55", label: "BRUNCH",              command: "Make something real. Eat slowly. Weekend brunch is sacred.",   duration: 45,  category: "rest"     },
  { time: "11:40", label: "SIDE PROJECT",        command: "If you want — something you build for joy, not for work.",    duration: 90,  category: "work"     },
  { time: "13:10", label: "LUNCH & REST",        command: "Real food. Real rest. Step away from any screen.",             duration: 60,  category: "rest"     },
  { time: "14:10", label: "READING",             command: "Technical or recreational. 90 minutes. No devices.",          duration: 90,  category: "rest"     },
  { time: "15:40", label: "WALK",                command: "Afternoon walk. Think about nothing in particular.",           duration: 45,  category: "exercise" },
  { time: "16:25", label: "FAMILY / FRIENDS",    command: "Be with people. Close the laptop entirely. Be a human.",      duration: 90,  category: "family"   },
  { time: "17:55", label: "DINNER",              command: "Cook something you enjoy. Eat without screens.",               duration: 45,  category: "rest"     },
  { time: "18:40", label: "FICTION READING",     command: "Two hours of reading. This is the weekend's best gift.",      duration: 120, category: "rest"     },
  { time: "21:30", label: "SHUT DOWN",           command: "Plan one thing for Monday morning only. Then close everything.", duration: 15, category: "rest"  },
  { time: "21:45", label: "SLEEP",               command: "Rest. No code tonight. You are more than your output.",        duration: 0,   category: "rest"     },
]);

// ─────────────────────────────────────────────────────────────
// TEMPLATES EXPORT
// ─────────────────────────────────────────────────────────────

export const TEMPLATES = [
  {
    id: "shelby",
    name: "TOMMY SHELBY",
    emoji: "⚡",
    defaultWakeTime: "05:00",
    description: "Discipline-first. Early rise, cold water, meditation, gym, and relentless deep work blocks. Control everything.",
    tagline: "For those who want total control.",
    source: "Peaky Blinders (fictional archetype)",
    weekly: makeWeekly(SHELBY_WD, SHELBY_WE),
  },
  {
    id: "dorsey",
    name: "JACK DORSEY",
    emoji: "🐦",
    defaultWakeTime: "05:00",
    description: "Meditation, HIIT, intermittent fasting, sauna, and ice bath. Calm, intentional, and radically focused.",
    tagline: "For those who move with intention.",
    source: "Jack Dorsey (Twitter / Block co-founder)",
    weekly: makeWeekly(DORSEY_WD, DORSEY_WE),
  },
  {
    id: "jocko",
    name: "JOCKO WILLINK",
    emoji: "🎖️",
    defaultWakeTime: "04:30",
    description: "4:30 wake, brutal training, jiu-jitsu, leadership work, family. Extreme ownership of every hour.",
    tagline: "For those who get after it.",
    source: "Jocko Willink (Navy SEAL, author, podcaster)",
    weekly: makeWeekly(JOCKO_WD, JOCKO_WE),
  },
  {
    id: "ferriss",
    name: "TIM FERRISS",
    emoji: "📖",
    defaultWakeTime: "08:30",
    description: "5-minute journal, tea ritual, creative writing, batched email, learning blocks. Curious and experimental.",
    tagline: "For those who experiment on themselves.",
    source: "Tim Ferriss (author, investor, podcaster)",
    weekly: makeWeekly(FERRISS_WD, FERRISS_WE),
  },
  {
    id: "goggins",
    name: "DAVID GOGGINS",
    emoji: "🔥",
    defaultWakeTime: "03:00",
    description: "3 AM wake, 20-mile runs, double workouts, and radical accountability. No excuses, no days off.",
    tagline: "For those who want to find their limit.",
    source: "David Goggins (ultramarathon runner, Navy SEAL, author)",
    weekly: makeWeekly(GOGGINS_WD, GOGGINS_WE),
  },
  {
    id: "musk",
    name: "ELON MUSK",
    emoji: "🚀",
    defaultWakeTime: "07:00",
    description: "80-100 hour weeks in 30-minute time blocks. Factory floors, engineering decisions, existential problems only.",
    tagline: "For those building civilisation.",
    source: "Elon Musk (Tesla, SpaceX, xAI)",
    weekly: makeWeekly(MUSK_WD, MUSK_WE),
  },
  {
    id: "prophet",
    name: "THE PROPHET (PBUH)",
    emoji: "🌙",
    defaultWakeTime: "04:30",
    description: "Tahajjud, five prayers, Quran, community service, and qaylulah rest. A life built entirely on devotion and purpose.",
    tagline: "For those guided by faith and service.",
    source: "Islamic tradition — Sunnah of the Prophet Muhammad (ﷺ)",
    weekly: makeWeekly(PROPHET_WD, PROPHET_WE, PROPHET_WE, PROPHET_FRI),
  },
  {
    id: "monk",
    name: "THE MONK",
    emoji: "🧘",
    defaultWakeTime: "03:45",
    description: "1-hour sitting meditation, walking meditation, noble silence, mindful work, and evening sitting. Presence in every breath.",
    tagline: "For those seeking stillness.",
    source: "Plum Village schedule — Thich Nhat Hanh tradition",
    weekly: makeWeekly(MONK_WD, MONK_WD_ALT, MONK_SUN),
  },
  {
    id: "wahlberg",
    name: "MARK WAHLBERG",
    emoji: "💪",
    defaultWakeTime: "02:30",
    description: "2:30 AM wake, prayer, gym, cryo, golf, and family. Intense but family-first. God, family, then everything else.",
    tagline: "For those who prove it before sunrise.",
    source: "Mark Wahlberg (actor, producer, entrepreneur)",
    weekly: makeWeekly(WAHLBERG_WD, WAHLBERG_WE),
  },
  {
    id: "developer",
    name: "THE DEVELOPER",
    emoji: "💻",
    defaultWakeTime: "08:00",
    description: "4-hour morning deep coding block, no meetings before noon, exercise, digital sunset at 6 PM. Craft over busywork.",
    tagline: "For those who build things that last.",
    source: "DHH (Ruby on Rails creator) / Cal Newport (Deep Work author)",
    weekly: makeWeekly(DEV_WD, DEV_WE),
  },
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
