# Elite Fitness App — Flutter Build Specification

**For: Coding agent (Claude Code / Cursor / etc.)**
**Purpose:** Build a production-ready, personal-use fitness app in Flutter. This document is the single source of truth — implement exactly what's specified, including animation timing, haptics, and interaction logic. Where a design decision has a psychological/neuroscience rationale, it is explained so you don't "simplify it away" during implementation.

---

## 1. Product Summary

A four-screen looping fitness app: **Control Panel → Diet → Workout → Sleep → (loops back to Control Panel)**. Navigation is a horizontal, bidirectional, infinite `PageView`-style loop. An account menu is accessible from a top-right avatar on every screen.

Core mechanic: a **"Momentum Ring"** — a circular progress indicator where a green "progress" arc visibly grows and "eats into" a red "gaps" arc as the user logs actions through the day. This single object is the emotional anchor of the whole app.

**Design language:** Dark HUD/cockpit aesthetic — near-black navy background, glowing thin-stroke rings, restrained premium motion (no confetti, no cartoonish bounce). Reference points: Apple Watch activity rings (close-ring moment), Whoop's home screen restraint, Teenage Engineering / analog-synth dial aesthetics, Things 3's quiet completion animation.

---

## 2. Tech Stack & Architecture

- **Framework:** Flutter (stable channel), null-safety.
- **State management:** Riverpod (`flutter_riverpod`). Use `StateNotifierProvider` or `NotifierProvider` for daily progress state; `Provider` for derived/computed values (e.g., momentum percentage).
- **Local persistence:** `drift` (SQLite) or `hive` for local-first storage — this is a personal-use app, no backend required initially. Structure the data layer so a future backend swap (Supabase/Firebase) doesn't require rewriting UI.
- **Navigation:** Custom `PageController`-driven horizontal loop (NOT Flutter's default `Navigator` push/pop for the main 4 screens — see Section 4).
- **Animations:** `flutter_animate` package recommended for declarative animation chaining, or hand-rolled `AnimationController` + `CurvedAnimation` where precise control matters (the ring fill especially).
- **Charts/custom drawing:** All rings (Momentum Ring, calorie ring, weekly mini-rings, readiness ring) are **hand-drawn with `CustomPainter`** using `Canvas.drawArc` — do NOT use a generic gauge package; the tug-of-war two-arc mechanic and precise animation control require custom painting.
- **Haptics:** `HapticFeedback` from `flutter/services.dart`. Use `HapticFeedback.lightImpact()` for minor confirmations, `.mediumImpact()` for meaningful completions, `.selectionClick()` for toggles/switches.
- **Fonts:** Inter (Google Fonts package or bundled), weights: Regular, Medium, SemiBold, Bold, ExtraBold.

### Folder structure
```
lib/
  main.dart
  core/
    theme/          // colors, text styles, spacing constants
    widgets/         // shared widgets: MomentumRing, MiniRing, GlassCard, etc.
  features/
    control_panel/
    diet/
    workout/
    sleep/
    account/
  data/
    models/          // DailyProgress, Meal, Exercise, SleepLog, UserProfile
    repositories/
    providers/       // Riverpod providers
```

---

## 3. Design Tokens

```dart
// core/theme/colors.dart
class AppColors {
  static const bg = Color(0xFF090B0F);
  static const bgCard = Color(0xFF111420);
  static const bgCardLight = Color(0xFF1A1E28);
  static const green = Color(0xFF3DDC9E);      // progress / success
  static const red = Color(0xFFE85F52);        // gaps / warning
  static const amber = Color(0xFFF59E3D);      // diet / calories / streak
  static const blueGlow = Color(0xFF4FD1FF);   // water / accent / active state
  static const purple = Color(0xFF9E8CFA);     // fat macro
  static const indigo = Color(0xFF5966E6);     // sleep
  static const white = Color(0xFFF5F7FA);
  static const gray = Color(0xFF8A94A6);
  static const grayDim = Color(0xFF525C6B);
}
```

Corner radii: cards `16-18px`, pills/buttons `full (999px)`, sheets `24px` top corners.
Spacing scale: `4, 8, 12, 16, 20, 24, 32, 48`.
Elevation: no material shadows on cards — use subtle `1px` borders at `white @ 6-8% opacity` instead (this reads as "premium HUD," material elevation shadows read as generic Android).

---

## 4. Navigation Model — The Loop

**Behavior:** 4 screens in a fixed circular order: `[ControlPanel, Diet, Workout, Sleep]`.
- Swipe **right-to-left** (forward): ControlPanel → Diet → Workout → Sleep → ControlPanel (wraps).
- Swipe **left-to-right** (backward): reverses the same order, also wraps.
- Implement via a custom `PageView` with `infinite scroll` simulation: use a very large item count (e.g. `10000`) and `index % 4` to map to the real screen, initial index at `5000` (or nearest multiple of 4) so the user can swipe backward immediately without hitting a wall on first load.

**Position indicator:** 4 dots, bottom-center, ~40px from bottom edge, always visible. Active dot is a pill (20×8px), inactive dots are circles (8×8px). Active dot color matches the current screen's accent (blue=Control, amber=Diet, green=Workout, indigo=Sleep). Animate dot width/color transition over `250ms` with `Curves.easeOut` as the page scrolls (drive it from `PageController`'s scroll offset, not just on settle, so the dot morphs continuously during the swipe gesture — this is important for the "spatial confidence" goal, see Section 9).

**Why this matters (rationale for agent, don't skip):** The loop removes "where do I tap" decisions (Hick's Law — decision time scales with number of choices). A continuously-animating indicator (not a snap-on-release indicator) gives real-time proprioceptive feedback during the gesture itself, which is what makes a spatial mental model form fast.

---

## 5. Screen 1 — Control Panel

### 5.1 Layout (top to bottom)
1. Top bar: Streak badge (left), Avatar (right) — see Section 8 for shared component.
2. Momentum Ring (center, ~236px diameter) with glow.
3. Weekly strip (7 mini-rings).
4. Water tracker card.
5. "Next Up" card.
6. Bottom page indicator (shared, see Section 4).

### 5.2 Momentum Ring — Component Spec
This is the most important component in the app. Build it as `lib/core/widgets/momentum_ring.dart`.

**Visual structure (outer to inner):**
- Outer soft glow: a blurred green circle behind the ring, opacity driven by current progress fraction (more progress = slightly stronger glow). Use `ImageFilter.blur` on a `Container` or a `BoxShadow` with large `blurRadius` (~60) and low opacity (~0.25-0.3 at full progress, ~0.1 at low progress).
- Track: full 360° ring, `strokeWidth ~18px`, color `bgCardLight`, drawn first (base layer).
- **Gaps arc (red):** drawn on top of track, sweeping from `progressFraction * 360°` to `360°` (clockwise from 12 o'clock).
- **Progress arc (green):** drawn on top of gaps arc, sweeping from `0°` to `progressFraction * 360°`.
- Center: large percentage text (`Inter ExtraBold, 52px, white`), subtitle "MOMENTUM" (`Inter SemiBold, 11px, letterSpacing 3px, gray`, uppercase, small-caps feel via manual uppercase).

**The "eating" mechanic — CRITICAL, do not simplify:**
`progressFraction` is a single source-of-truth double (0.0–1.0) representing the fraction of today's plan completed (weighted average across diet/workout/water — exact weighting formula is a TODO for you to propose, default suggestion: workout 40%, diet 35%, water 25%). The red arc is **not a separate independent value** — it is always `1 - progressFraction`. The two arcs share one moving boundary.

**Animation on value change (e.g., user logs a meal):**
- The boundary angle animates from old value to new value over `600ms` using `Curves.easeInOutCubic`. This must be a genuinely smooth arc sweep (animate the `progressFraction` itself via `AnimationController`, not just cross-fade opacity).
- **This animation must fire in real time, immediately after the user's action** (e.g. tapping "done" on an exercise, saving a meal) — not on next screen load. Tight action→visible-consequence timing is the entire point (operant conditioning — delayed feedback weakens the habit loop being built).

**Non-linear pulse near completion (goal-gradient effect):**
- At `progressFraction < 0.5`: ring is static (no pulse).
- At `0.5 ≤ progressFraction < 0.85`: outer glow pulses very subtly, opacity oscillating ±5% over a `2.5s` loop.
- At `progressFraction ≥ 0.85`: pulse tightens to a `1.2s` loop, opacity oscillates ±12%, and the ring's stroke gets a very subtle brightness boost (`Color.lerp` toward white by ~8%).
- Rationale: motivation isn't linear — it accelerates near completion (Kivetz et al., goal-gradient effect). The UI should visually mirror that acceleration, not stay flat.

**Completion animation (progressFraction reaches 1.0):**
- Do NOT use a single fixed animation every day — habituation flattens the reward response fast. Implement a pool of **5 variants** and pick pseudo-randomly (or rotate deterministically by day-of-year % 5) so day 47 doesn't feel identical to day 3:
  1. Soft outward glow diffusion from ring edge (radial gradient scale-up, `800ms`, fades out) + single ascending two-note chime.
  2. Ring briefly brightens to near-white then eases back to green over `1s`, no sound, just a soft haptic (`HapticFeedback.mediumImpact()`).
  3. Thin light "sweep" travels once around the ring stroke (like a loading shimmer) + soft chime.
  4. Center percentage text briefly scales `1.0 → 1.08 → 1.0` over `500ms` (`Curves.easeOutBack`) + glow pulse.
  5. Very brief (`300ms`) full-ring color flash to a lighter green tint, then settles.
- All variants stay in the "minimal/premium" register: no confetti, no particle bursts, no jingles longer than 2 notes. Restraint IS the reward here — a loud celebration would cheapen the cockpit aesthetic.

### 5.3 Weekly Strip
- Row of 7 `MiniRing` widgets (32-34px diameter each), same track/gaps/progress structure as the main ring but no center text — just a day-letter label below (`M T W T F S S`).
- Today's mini-ring is visually distinct: slightly larger (34 vs 32px) and uses `blueGlow` for its progress color instead of green, with its day-letter in white instead of gray.
- Tapping a past day's mini-ring: no-op for now (future: could open a day-detail sheet). Do not build this interaction yet, just leave the `onTap` stub.

### 5.4 Water Tracker Card
- Rounded card, droplet icon in a circular tinted background, running total text (`"1,200 / 2,500 ml"`), subtitle (`"Tap to log a glass"`), and a circular "+" button on the right.
- **Default tap behavior:** tapping the "+" button (NOT the card body) instantly logs the user's **default container size** (learned from their most-frequent past entry, default `500ml` for a new user) with **zero intermediate dialog**. This is the core low-friction requirement — do not add a confirmation step or a size picker on tap.
- **Long-press on "+":** opens a small popover/bottom sheet with quick container options (`200ml glass`, `500ml bottle`, `1000ml bottle`, custom input) to change the default or log a one-off different amount.
- On tap: `HapticFeedback.lightImpact()`, the ml text updates with a quick count-up animation (`300ms`, animate the displayed number from old to new value, not an instant jump), and the Momentum Ring's progress updates in the background per Section 5.2's animation spec.

### 5.5 "Next Up" Card
- Green-tinted card showing the next scheduled action (e.g., "Leg Day — 6:00 PM"), pulled from the Workout/Diet schedule for today.
- Rationale: this is an implementation-intention prompt ("I will do X at Y time" — Gollwitzer). Keep the copy format as `[Action] — [Time]`, do not genericize it to "You have a workout today."
- Tapping the card: navigates directly to the relevant screen (Workout or Diet) — this is one of the few places a direct jump (not a swipe) is justified, since it's an explicit "take me there" action, not primary navigation.

---

## 6. Screen 2 — Diet

### 6.1 Layout
1. Top bar (shared).
2. "DIET" label + **Custom Mode toggle** (top-right of label row, see 6.3).
3. Calorie ring (single arc, amber, same `CustomPainter` base as Momentum Ring but simpler — no gaps arc needed here, just a single progress sweep against target).
4. Macro bars: Protein / Carbs / Fat — horizontal bars with label, value text, and animated fill.
5. "TODAY'S MEALS" section header (+ inline "+" quick-add icon, **only rendered when Custom Mode is ON**).
6. Meal list (cards).

### 6.2 Predefined Mode (default state)
- This is a plan the user builds once (in an "Add Diet Plan" flow — see Section 6.4) and it repeats daily: fixed meal slots (e.g., Breakfast/Lunch/Dinner/Snack) each with a target name/kcal/macros.
- On this screen, Predefined mode shows the day's planned meals as **checkable cards** — tapping a meal card toggles it "eaten" (checkmark appears, card dims slightly, kcal/macros count toward the ring and bars).
- No "+" icon is visible in this mode — the plan is fixed; you don't add ad hoc items here (if the user needs to eat something unplanned, they should flip Custom Mode on, not hack around the predefined structure).

### 6.3 Custom Mode Toggle
- Small pill switch, top-right, default **off**.
- Tapping it: `HapticFeedback.selectionClick()`, switch animates (thumb slides `150ms` `Curves.easeOut`, track color crossfades from gray to green-tinted).
- **When ON:**
  - The inline "+" icon appears next to "TODAY'S MEALS" (fade+scale in, `200ms`).
  - The calorie ring subtitle changes from `"of [target] kcal"` to `"~ estimated · no fixed target"` — do not show a hard target number while in custom mode; it's psychologically counterproductive to imply failure against a target that doesn't apply on an unpredictable day.
  - Existing/new meal cards get a small `"logged on the fly"` tag under the time, distinguishing improvised entries from predefined ones in history data (useful for the CSV export later).
- **When OFF (switching back):** the day's already-logged custom entries are preserved, but the "+" disappears and the ring target reverts to the predefined daily target. Custom Mode is a per-day override toggle, not a plan-replacement — switching it off does not delete anything.

### 6.4 Quick Add ("+") Interaction — Custom Mode Only
- Tapping the inline "+" slides up a **bottom sheet** (NOT a full-screen navigation — this must happen without leaving the Diet screen, that's the entire point of this feature).
- Sheet contents: grabber handle, "Quick Add" title, an editable time chip defaulting to **current time** (tap to open a time picker), a single text field ("What did you eat?"), and a "Save" action.
- **Auto-estimate toggle** (small switch within or near the sheet, defaulting ON): if the user leaves kcal blank, an AI/heuristic estimate fills in `~kcal` based on the meal name text (implementation note for agent: stub this with a simple keyword-lookup table initially; flag it clearly as a `TODO: replace with real estimation service/LLM call` in code comments — do not block the sheet's core save flow on this being perfect).
- On save: sheet dismisses (`250ms` slide-down), new meal card appears at the top of the list with a brief highlight flash (`400ms`, background color pulses from `blueGlow @ 15%` back to normal), Momentum Ring and calorie ring animate to new values per their respective animation specs, running total footer updates with count-up animation.
- No cap on number of entries per day.

### 6.5 Macro Bars
- Each bar: label (`PROTEIN`/`CARBS`/`FAT`, small caps, letterspaced), value text (`"142g / 180g"`, right-aligned), track (dark rounded rect), fill (colored rounded rect).
- Fill width animates on any data change, same `600ms` `Curves.easeInOutCubic` as the main ring, for visual consistency across the whole app — **all progress-fill animations in this app should share this exact curve/duration** unless otherwise specified. Consistency here is what makes the app feel like one coherent system rather than a pile of independent widgets.

---

## 7. Screen 3 — Workout

### 7.1 Layout
1. Top bar (shared).
2. "WORKOUT" label.
3. Recovery/Readiness card: small ring (60px) + "Primed for a heavy session"-style message, computed from recovery score.
4. Workout title (e.g., "Leg Day") + subtitle (`"5 exercises · ~48 min"`).
5. Exercise list — checkable cards.
6. "Start Workout" CTA (large, bottom, pill-shaped, green fill).
7. Bottom page indicator.

### 7.2 Exercise Cards
- Each: circular checkbox (left), name + `sets × reps · weight` subtitle, tappable across the whole card (not just the checkbox — large tap target, this screen is used mid-workout with sweaty/imprecise input, see Section 10 ergonomics notes).
- Tap toggles completion: checkbox fills green with a checkmark, card border tints green, name text dims to gray (completed items recede visually so the eye is drawn to what's still pending — this is intentional, do not make completed items equally prominent).
- On tap: `HapticFeedback.mediumImpact()` (stronger than diet/water taps — this is a bigger accomplishment unit), Momentum Ring updates.
- **Variable reward on exercise completion:** every 3rd-5th completed exercise (pseudo-random), trigger a small extra flourish — e.g. the checkmark's fill animates in with a slight overshoot bounce (`Curves.easeOutBack`) instead of the standard linear fill. Not every checkmark should feel identical.

### 7.3 "Start Workout" CTA
- Tapping it: for v1, this can transition into a "workout session mode" — a simplified, larger-touch-target view of the current exercise with a big "Next" button and a rest timer between sets. **Build this as a modal full-screen route** (not part of the swipe loop) since it's a focused task mode, not a navigation destination — pushing/popping with `Navigator` is correct here, unlike the main 4 screens.
- Session mode UI requirements: minimum tap target 56×56px (larger than the 44px baseline elsewhere — sweaty/gloved hands need bigger targets), high contrast, large type (readable at arm's length in gym lighting), a rest-timer countdown with a subtle ring animation (reuse the ring `CustomPainter`), and haptic pulse when a rest timer completes.

---

## 8. Screen 4 — Sleep

### 8.1 Layout
1. Top bar (shared).
2. "SLEEP" label.
3. Big duration number (`"7h 42m"`) + quality subtitle (`"Good sleep · Quality score 84"`, colored by quality tier: green ≥ 80, amber 60-79, red < 60).
4. Sleep stages segmented bar (Deep/REM/Light/Awake) + legend.
5. Weekly trend mini bar chart (reuses the 7-column layout pattern from the Control Panel's weekly strip, but as vertical bars, not rings — sleep duration is better represented as a magnitude bar than a completion ring, since there's no "done/not done" binary for sleep the way there is for water or exercises).
6. "Next bedtime" card (indigo-tinted).
7. Bottom page indicator.

### 8.2 Morning-use design constraints
- This screen is opened once a day, immediately after waking — a state of measurably worse contrast sensitivity and slower reading. Do not reduce type sizes here below what's used elsewhere; if anything, keep the big duration number generously large (44px, already spec'd).
- Framing: NEVER use guilt language ("You failed to get enough sleep"). Use autonomy-supportive framing that explains consequence without judgment — e.g. "6h 40m — Your recovery capacity today is reduced" rather than "6h 40m — Not enough!" This is a hard requirement, not a copy suggestion; self-determination theory research shows shame-based framing produces short-term compliance but predicts long-term app abandonment.

### 8.3 Sleep Stages Bar
- Single horizontal rounded rect, segmented into 4 colored sections proportional to each stage's fraction of total sleep, `2px` gaps between segments.
- Segments animate their width in on screen load (staggered: Deep first, then REM, then Light, then Awake, each starting `80ms` after the previous, `500ms` `Curves.easeOut` each) — a staggered reveal rather than all segments appearing simultaneously reads as more polished and gives the eye time to parse each stage.

### 8.4 Next Bedtime Card
- Moon icon, "Next bedtime: [time]" title, "Keeps your recovery on track" subtitle.
- Tapping it: opens a bedtime reminder settings sheet (notification time picker) — stub this if not building notifications in v1, but leave the tap target and sheet-opening animation wired up.

---

## 9. Account Menu (Global — accessible from every screen's avatar)

### 9.1 Trigger
- Avatar (top-right, every screen) is a persistent 40px circle. Tapping it opens the account dropdown.
- On tap: avatar gets a `2px` glowing ring outline (`blueGlow`) that fades in over `150ms`, a scrim (`black @ 55%`) fades in over the rest of the screen (`200ms`), and the dropdown panel slides+fades in from the top-right anchor point (`250ms`, `Curves.easeOutCubic`, slight scale from `0.95 → 1.0` combined with the slide — an "emerging from the avatar" feel, not a generic modal pop-up).
- Tapping the scrim (anywhere outside the panel) or pressing back: reverses the same animation to close.

### 9.2 Panel Contents (top to bottom)
1. Profile header: avatar, name, "[N]-day streak · Level [X]".
2. Divider.
3. **Add Diet Plan** — opens the diet-plan builder flow (predefined-plan creation, separate from the Custom Mode quick-add).
4. **Add Workout Plan** — analogous builder for workout routines.
5. **Add Sleep Schedule** — bedtime/wake-time target builder.
6. **Switch Plan** — subtitle "Diet · Workout · Sleep" — lets the user swap which saved plan is currently active (e.g., a "Cutting" diet plan vs a "Bulking" one), without deleting the others. This is the single entry that handles switching for all three domains rather than three separate switchers cluttering the menu.
7. Divider.
8. **Download Progress Report** (blueGlow-tinted, subtitle "Export CSV / PDF for Claude") — see Section 9.3.
9. Divider.
10. **Log Out** (red).

Each row: icon in a small tinted rounded square, label, optional subtitle, full-row tap target (min height 52-60px), subtle background highlight on press (`white @ 4%`, `100ms` fade).

### 9.3 Download Progress Report — Implementation Notes
- **Format: default to CSV or plain Markdown text export, not PDF.** The user's stated purpose is manually handing this to an LLM (Claude) for analysis — structured plain text is far more useful for that than a PDF, which is harder for an LLM-facing manual copy/paste workflow and adds unnecessary rendering complexity for v1. Offer PDF as a secondary "share as PDF" option later if needed, but CSV/Markdown is the primary path.
- Fields to include per day: date, momentum %, calories consumed vs target (or "custom mode, no target" flag), macros, water ml, exercises completed/total, sleep duration + quality score, streak status.
- Implementation: generate the file locally (`csv` package or manual string building), use `share_plus` package to trigger the OS share sheet (so the user can send it to a clipboard, file, or directly paste into a chat).

---

## 10. Ergonomics Requirements (apply globally)

- **Minimum tap target:** 44×44px everywhere, **56×56px inside Workout session mode** specifically (sweaty hands, less precision).
- **Thumb-zone awareness:** primary actions (logging, checking off, the "+") should sit in the reachable bottom-two-thirds of the screen where possible. The avatar (top-right) is intentionally in the *least* convenient zone — that's correct, per Fitts's Law, for a low-frequency, higher-consequence action like logout, so it isn't accidentally triggered.
- **Contrast:** maintain WCAG AA minimum contrast for all text against its background, but bias toward *higher* than minimum on the Sleep and Workout screens specifically (morning grogginess / gym environment lighting respectively both degrade effective readability).
- **Haptics tiering:** `selectionClick()` for toggles/switches, `lightImpact()` for minor logs (water, single meal item check), `mediumImpact()` for meaningful completions (exercise checked, full ring completion). Never use `heavyImpact()` anywhere in this app — the aesthetic is restrained, not aggressive.

---

## 11. Animation Timing Reference (single source of truth — reuse these constants, do not invent new durations ad hoc)

```dart
class AppMotion {
  static const fillChange = Duration(milliseconds: 600);
  static const fillCurve = Curves.easeInOutCubic;

  static const sheetSlide = Duration(milliseconds: 250);
  static const sheetCurve = Curves.easeOutCubic;

  static const microToggle = Duration(milliseconds: 150);
  static const microCurve = Curves.easeOut;

  static const cardFlash = Duration(milliseconds: 400);

  static const countUp = Duration(milliseconds: 300);

  static const completionGlow = Duration(milliseconds: 800);
}
```

---

## 12. Interaction Map (exhaustive — every tappable element)

| Element | Screen | On Tap | Animation | Haptic | Why |
|---|---|---|---|---|---|
| Momentum Ring | Control Panel | No-op (display only) | — | — | Ring is a status display, not a button — avoid accidental interaction |
| Weekly mini-ring (today) | Control Panel | No-op v1 (stub for future day-detail) | — | — | Keep v1 scope tight |
| Water "+" button | Control Panel | Logs default container size instantly | Count-up ml text (300ms), ring fill update (600ms) | lightImpact | Fogg Behavior Model — minimize ability-cost for high-frequency action |
| Water "+" long-press | Control Panel | Opens size-picker popover | Popover scale-in (150ms) | selectionClick | Escape hatch for non-default logging without slowing default path |
| Next Up card | Control Panel | Navigates to relevant screen (Diet or Workout) | Cross-fade page transition | lightImpact | Explicit "take me there," justified exception to swipe-only nav |
| Avatar | Any screen | Opens account dropdown | Ring glow-in + scrim fade + panel slide (250ms) | selectionClick | — |
| Custom Mode toggle | Diet | Flips predefined/custom state | Thumb slide + track color crossfade (150ms) | selectionClick | — |
| Inline "+" (custom mode only) | Diet | Opens Quick Add bottom sheet | Icon fade+scale in (200ms) on mode switch; sheet slide-up (250ms) on tap | lightImpact | Sheet keeps user on-screen, zero navigation cost |
| Quick Add "Save" | Diet (sheet) | Saves entry, closes sheet | Sheet slide-down (250ms), new card highlight flash (400ms), ring/bar updates (600ms) | mediumImpact | Confirms a meaningful data-entry completion |
| Predefined meal card | Diet | Toggles eaten/not-eaten | Checkmark fill, card dim (300ms) | lightImpact | — |
| Exercise card | Workout | Toggles complete/incomplete | Checkbox fill (with occasional overshoot bounce), text dims, border tints (300ms) | mediumImpact | Bigger accomplishment unit than a diet/water tap |
| Start Workout CTA | Workout | Pushes full-screen session mode | Standard modal push transition | lightImpact | Focused task mode, correctly uses Navigator not swipe-loop |
| Next bedtime card | Sleep | Opens reminder time picker sheet | Sheet slide-up (250ms) | lightImpact | — |
| Account: Add Diet/Workout/Sleep Plan | Account menu | Opens respective plan builder | Panel closes, new screen pushes | lightImpact | — |
| Account: Switch Plan | Account menu | Opens plan-switcher list | Panel closes, sheet/list opens | lightImpact | — |
| Account: Download Progress Report | Account menu | Generates file, opens OS share sheet | Panel closes, brief loading spinner if generation > 200ms | lightImpact | — |
| Account: Log Out | Account menu | Confirms, then logs out | Standard confirm dialog | mediumImpact | Destructive action, deliberately low-frequency zone (top-right) + confirm step |
| Bottom page dots | Any screen | No-op (display only), driven by swipe | Continuous morph during swipe gesture | — | Real-time proprioceptive feedback during the gesture itself |

---

## 13. Psychology & Neuroscience Reference (why the app is built this way — for agent context, not user-facing copy)

- **Hick's Law:** decision time increases with number of choices. The swipe-loop and single-focal-metric Control Panel both exist to minimize in-the-moment decisions.
- **Goal-gradient effect (Kivetz et al.):** motivation accelerates as completion nears. Applied via the ring's non-linear pulse intensity near 85-100%.
- **Loss aversion (Kahneman & Tversky):** the visible red "gaps" arc leverages the fact that avoiding a loss motivates more strongly than pursuing an equivalent gain — stronger than a plain fill-only progress bar would.
- **Operant conditioning / tight feedback loops:** all progress animations must fire immediately after the triggering action, not on next load — delayed reinforcement weakens the habit association being built.
- **Variable reward schedules:** completion animations and exercise-check flourishes are pooled/randomized rather than identical every time, to avoid dopamine-response flattening from full predictability.
- **Fogg Behavior Model (B=MAP):** the water "+" and Quick Add flows are designed to minimize *ability*-cost (fewest possible taps/fields) rather than relying on motivation alone.
- **Implementation intentions (Gollwitzer):** the "Next Up" card uses the `[Action] — [Time]` format specifically because "I will do X at Y" outperforms vague intent framing for follow-through.
- **Self-determination theory (autonomy-supportive framing):** Sleep screen copy avoids guilt/shame language; frames outcomes as informational ("your recovery capacity is reduced") rather than evaluative ("you failed").
- **Fitts's Law:** the avatar/account menu is deliberately placed in a harder-to-reach zone since it's low-frequency and higher-consequence (logout risk) — this is intentional friction, not an oversight.

---

## 14. Data Models (starting point — expand as needed)

```dart
class DailyProgress {
  final DateTime date;
  final double momentumFraction; // 0.0-1.0, derived from below
  final int caloriesConsumed;
  final int? calorieTarget; // null if custom mode with no fixed target
  final Map<String, double> macrosConsumed; // protein/carbs/fat grams
  final int waterMl;
  final int waterTargetMl;
  final List<ExerciseLog> exercises;
  final SleepLog? sleep;
  final bool customModeDiet;
}

class Meal {
  final String id;
  final DateTime time;
  final String name;
  final int? kcal;
  final bool estimated;
  final bool loggedOnTheFly; // true if added via Custom Mode quick-add
}

class ExerciseLog {
  final String name;
  final String setsRepsLabel; // e.g. "4 × 8"
  final String weightLabel;   // e.g. "80kg"
  final bool completed;
}

class SleepLog {
  final Duration duration;
  final int qualityScore; // 0-100
  final Map<String, double> stageFractions; // deep/rem/light/awake
}

class UserProfile {
  final String name;
  final int streakDays;
  final int level;
}
```

---

## 15. Build Order (suggested)

1. Design tokens + shared widgets (`MomentumRing` CustomPainter first — everything else depends on getting this right).
2. Navigation shell: the infinite `PageView` loop + bottom dot indicator.
3. Control Panel (static data first, then wire to a mock Riverpod provider).
4. Diet screen: Predefined mode fully working, then Custom Mode toggle + Quick Add sheet.
5. Workout screen + session mode.
6. Sleep screen.
7. Account menu + Download Progress Report (CSV export via `share_plus`).
8. Polish pass: haptics, completion animation variants, staggered reveals.
9. Local persistence wiring (Hive/Drift) — replace mock providers with real storage.

---

**End of spec. Implement literally — where a duration, curve, or color is given, use that exact value unless it's explicitly marked as a placeholder/TODO.**
