import 'dart:convert';
import 'package:hive_flutter/hive_flutter.dart';
import '../models/models.dart';

class ProgressRepository {
  static const String _profileBoxName = 'profileBox';
  static const String _progressBoxName = 'progressBox';
  static const String _settingsBoxName = 'settingsBox';

  late Box _profileBox;
  late Box _progressBox;
  late Box _settingsBox;

  // Initialize Hive and open boxes
  Future<void> init() async {
    await Hive.initFlutter();
    
    _profileBox = await Hive.openBox(_profileBoxName);
    _progressBox = await Hive.openBox(_progressBoxName);
    _settingsBox = await Hive.openBox(_settingsBoxName);

    // Seed mock data if empty
    if (_profileBox.isEmpty) {
      await _seedDefaultData();
    }
  }

  // Get active user profile
  UserProfile getUserProfile() {
    final raw = _profileBox.get('active_profile');
    if (raw != null) {
      final map = jsonDecode(raw as String) as Map<String, dynamic>;
      return UserProfile.fromJson(map);
    }
    return UserProfile(name: 'Abhijith', streakDays: 7, level: 3);
  }

  // Predefined diet template methods
  List<Meal> getPredefinedDietPlan() {
    final activeId = getActiveDietPlanId();
    final plans = getDietPlans();
    final activePlan = plans.firstWhere((p) => p.id == activeId, orElse: () => plans.first);
    return activePlan.meals;
  }

  Future<void> savePredefinedDietPlan(List<Meal> meals) async {
    final activeId = getActiveDietPlanId();
    final plans = getDietPlans();
    final updatedPlans = plans.map((p) {
      if (p.id == activeId) {
        return p.copyWith(meals: meals);
      }
      return p;
    }).toList();
    await saveDietPlans(updatedPlans);
  }

  // Get default water target / volume size
  int getDefaultWaterVolume() {
    return _settingsBox.get('default_water_volume', defaultValue: 250) as int;
  }

  Future<void> saveDefaultWaterVolume(int ml) async {
    await _settingsBox.put('default_water_volume', ml);
  }

  // Get bedtime reminder time string
  String getBedtimeReminder() {
    final activeId = getActiveSleepScheduleId();
    final schedules = getSleepSchedules();
    final active = schedules.firstWhere((s) => s.id == activeId, orElse: () => schedules.first);
    return active.bedtime;
  }

  Future<void> saveBedtimeReminder(String timeStr) async {
    final activeId = getActiveSleepScheduleId();
    final schedules = getSleepSchedules();
    final updated = schedules.map((s) {
      if (s.id == activeId) {
        return s.copyWith(bedtime: timeStr);
      }
      return s;
    }).toList();
    await saveSleepSchedules(updated);
  }

  // Get bedtime reminder enabled toggle
  bool isBedtimeReminderEnabled() {
    final activeId = getActiveSleepScheduleId();
    final schedules = getSleepSchedules();
    final active = schedules.firstWhere((s) => s.id == activeId, orElse: () => schedules.first);
    return active.isEnabled;
  }

  Future<void> saveBedtimeReminderEnabled(bool enabled) async {
    final activeId = getActiveSleepScheduleId();
    final schedules = getSleepSchedules();
    final updated = schedules.map((s) {
      if (s.id == activeId) {
        return s.copyWith(isEnabled: enabled);
      }
      return s;
    }).toList();
    await saveSleepSchedules(updated);
  }

  // Get global workout logging mode
  String getGlobalWorkoutMode() {
    return _settingsBox.get('global_workout_mode', defaultValue: 'pre-determined') as String;
  }

  Future<void> saveGlobalWorkoutMode(String mode) async {
    await _settingsBox.put('global_workout_mode', mode);
  }

  // Save progress
  void saveProgress(DailyProgress progress) {
    _progressBox.put(progress.dateString, jsonEncode(progress.toJson()));
  }

  // Weekly workout plans methods
  List<ExerciseLog> getWeeklyWorkoutPlan(int weekday) {
    final activeId = getActiveWorkoutPlanId();
    final plans = getWorkoutPlans();
    final activePlan = plans.firstWhere((p) => p.id == activeId, orElse: () => plans.first);
    return activePlan.weeklyExercises[weekday] ?? _getDefaultMockWorkoutForWeekday(weekday);
  }

  Future<void> saveWeeklyWorkoutPlan(
    int weekday,
    List<ExerciseLog> exercises, {
    required bool isRestDay,
    required bool restAfterThree,
  }) async {
    final activeId = getActiveWorkoutPlanId();
    final plans = getWorkoutPlans();
    final updatedPlans = plans.map((p) {
      if (p.id == activeId) {
        final Map<int, List<ExerciseLog>> newExercises = Map.from(p.weeklyExercises);
        final Map<int, bool> newIsRest = Map.from(p.weeklyIsRest);
        final Map<int, bool> newRestAfterThree = Map.from(p.weeklyRestAfterThree);
        newExercises[weekday] = exercises;
        newIsRest[weekday] = isRestDay;
        newRestAfterThree[weekday] = restAfterThree;
        return p.copyWith(
          weeklyExercises: newExercises,
          weeklyIsRest: newIsRest,
          weeklyRestAfterThree: newRestAfterThree,
        );
      }
      return p;
    }).toList();
    await saveWorkoutPlans(updatedPlans);
  }

  bool isWeeklyRestDay(int weekday) {
    final activeId = getActiveWorkoutPlanId();
    final plans = getWorkoutPlans();
    final activePlan = plans.firstWhere((p) => p.id == activeId, orElse: () => plans.first);
    return activePlan.weeklyIsRest[weekday] ?? (weekday == 3 || weekday == 6 || weekday == 7);
  }

  bool isWeeklyRestAfterThree(int weekday) {
    final activeId = getActiveWorkoutPlanId();
    final plans = getWorkoutPlans();
    final activePlan = plans.firstWhere((p) => p.id == activeId, orElse: () => plans.first);
    return activePlan.weeklyRestAfterThree[weekday] ?? false;
  }

  List<ExerciseLog> getSeededExercisesForDate(DateTime date) {
    final weekday = date.weekday;
    final isRest = isWeeklyRestDay(weekday);
    if (isRest) {
      return [
        const ExerciseLog(
          name: 'Rest Day',
          setsRepsLabel: 'Recovery',
          weightLabel: 'Active Rest',
          completed: false,
          isRest: true,
        ),
      ];
    }

    return getWeeklyWorkoutPlan(weekday);
  }

  List<ExerciseLog> _getDefaultMockWorkoutForWeekday(int weekday) {
    switch (weekday) {
      case 1: // Monday
        return const [
          ExerciseLog(name: 'Bench Press', setsRepsLabel: '4 × 8', weightLabel: '60 kg'),
          ExerciseLog(name: 'Overhead Press', setsRepsLabel: '3 × 10', weightLabel: '40 kg'),
          ExerciseLog(name: 'Lateral Raise', setsRepsLabel: '3 × 15', weightLabel: '10 kg'),
        ];
      case 2: // Tuesday
        return const [
          ExerciseLog(name: 'Weighted Pullups', setsRepsLabel: '4 × 6', weightLabel: 'Bodyweight + 10 kg'),
          ExerciseLog(name: 'Barbell Row', setsRepsLabel: '3 × 8', weightLabel: '50 kg'),
          ExerciseLog(name: 'Incline Dumbbell Curl', setsRepsLabel: '3 × 12', weightLabel: '12 kg'),
        ];
      case 4: // Thursday
        return const [
          ExerciseLog(name: 'Barbell Back Squat', setsRepsLabel: '4 × 6', weightLabel: '80 kg'),
          ExerciseLog(name: 'Romanian Deadlift', setsRepsLabel: '3 × 10', weightLabel: '70 kg'),
          ExerciseLog(name: 'Standing Calf Raise', setsRepsLabel: '4 × 15', weightLabel: '30 kg'),
        ];
      case 5: // Friday
        return const [
          ExerciseLog(name: 'Hanging Leg Raise', setsRepsLabel: '3 × 15', weightLabel: 'Bodyweight'),
          ExerciseLog(name: 'Plank Hold', setsRepsLabel: '3 × 60s', weightLabel: 'Bodyweight'),
          ExerciseLog(name: 'Tricep Pushdown', setsRepsLabel: '3 × 12', weightLabel: '20 kg'),
        ];
      default: // Wednesday, Saturday, Sunday
        return const [];
    }
  }

  // Fetch progress for date, generating default mock items if missing
  DailyProgress getProgressForDay(DateTime date) {
    final key = _getDateKey(date);
    final raw = _progressBox.get(key);

    if (raw != null) {
      final map = jsonDecode(raw as String) as Map<String, dynamic>;
      final progress = DailyProgress.fromJson(map);
      final predefinedMeals = getPredefinedDietPlan();
      final computedTarget = predefinedMeals.isEmpty 
          ? null 
          : predefinedMeals.fold<int>(0, (sum, m) => sum + (m.kcal ?? 0));
      return progress.copyWith(
        calorieTarget: progress.customModeDiet ? null : computedTarget,
      );
    }

    final predefinedMeals = getPredefinedDietPlan();
    final seededMeals = predefinedMeals.map((m) {
      // Re-key the meal IDs so they are day-specific, keeping track of time slot
      return m.copyWith(
        id: '${m.id}_$key',
        time: DateTime(date.year, date.month, date.day, m.time.hour, m.time.minute),
        eaten: false,
        loggedOnTheFly: false,
      );
    }).toList();

    // Default mock setup for a new day if no data exists
    return DailyProgress(
      dateString: key,
      momentumFraction: 0.0,
      waterMl: 0,
      waterTargetMl: 2500,
      caloriesConsumed: 0,
      calorieTarget: seededMeals.isEmpty ? null : seededMeals.fold<int>(0, (sum, m) => sum + (m.kcal ?? 0)),
      customModeDiet: false,
      macrosConsumed: const {'protein': 0.0, 'carbs': 0.0, 'fat': 0.0},
      meals: seededMeals,
      exercises: getSeededExercisesForDate(date),
      sleep: null,
    );
  }

  // Fetch all historical progress logs sorted by date key
  List<DailyProgress> getAllProgressLogs() {
    final List<DailyProgress> logs = [];
    final keys = _progressBox.keys.toList()..sort();
    
    for (final key in keys) {
      final raw = _progressBox.get(key);
      if (raw != null) {
        final map = jsonDecode(raw as String) as Map<String, dynamic>;
        logs.add(DailyProgress.fromJson(map));
      }
    }
    return logs;
  }

  // Helper date key YYYY-MM-DD
  String _getDateKey(DateTime date) {
    return "${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}";
  }

  // Populate startup state with clean empty data (no mock logs)
  Future<void> _seedDefaultData() async {
    // 1. Save active profile with baseline values
    final profile = UserProfile(name: 'Abhijith', streakDays: 0, level: 1);
    await _profileBox.put('active_profile', jsonEncode(profile.toJson()));

    // 2. Save a completely clean progress log for today (no mock items completed or eaten)
    final todayKey = _getDateKey(DateTime.now());
    final cleanProgress = DailyProgress(
      dateString: todayKey,
      momentumFraction: 0.0,
      waterMl: 0,
      waterTargetMl: 2500,
      caloriesConsumed: 0,
      calorieTarget: null,
      customModeDiet: false,
      macrosConsumed: const {'protein': 0.0, 'carbs': 0.0, 'fat': 0.0},
      meals: const [],
      exercises: getSeededExercisesForDate(DateTime.now()),
      sleep: null,
    );

    await _progressBox.put(todayKey, jsonEncode(cleanProgress.toJson()));
  }

  // Profile Name Saving
  Future<void> saveUserProfile(UserProfile profile) async {
    await _profileBox.put('active_profile', jsonEncode(profile.toJson()));
  }

  // --- Diet Plans ---
  List<DietPlan> getDietPlans() {
    final raw = _settingsBox.get('diet_plans');
    if (raw != null) {
      final list = jsonDecode(raw as String) as List;
      return list.map((d) => DietPlan.fromJson(Map<String, dynamic>.from(d as Map))).toList();
    }
    
    // Migration helper: load legacy predefined diet plan
    final legacyRaw = _settingsBox.get('predefined_diet_plan');
    List<Meal> defaultMeals = [];
    if (legacyRaw != null) {
      final list = jsonDecode(legacyRaw as String) as List;
      defaultMeals = list.map((m) => Meal.fromJson(Map<String, dynamic>.from(m as Map))).toList();
    }
    
    final defaultPlan = DietPlan(
      id: 'default_diet',
      name: 'Standard Diet',
      meals: defaultMeals,
    );
    return [defaultPlan];
  }

  Future<void> saveDietPlans(List<DietPlan> plans) async {
    final raw = jsonEncode(plans.map((d) => d.toJson()).toList());
    await _settingsBox.put('diet_plans', raw);
  }

  String getActiveDietPlanId() {
    return _settingsBox.get('active_diet_plan_id', defaultValue: 'default_diet') as String;
  }

  Future<void> saveActiveDietPlanId(String id) async {
    await _settingsBox.put('active_diet_plan_id', id);
  }

  // --- Workout Plans ---
  List<WorkoutPlan> getWorkoutPlans() {
    final raw = _settingsBox.get('workout_plans');
    if (raw != null) {
      final list = jsonDecode(raw as String) as List;
      return list.map((w) => WorkoutPlan.fromJson(Map<String, dynamic>.from(w as Map))).toList();
    }
    
    // Migrate legacy weekly schedules
    final Map<int, List<ExerciseLog>> exercises = {};
    final Map<int, bool> isRest = {};
    final Map<int, bool> restAfterThree = {};
    for (int weekday = 1; weekday <= 7; weekday++) {
      // Fetch legacy
      final wPlanRaw = _settingsBox.get('weekly_workout_plan_$weekday');
      if (wPlanRaw != null) {
        final list = jsonDecode(wPlanRaw as String) as List;
        exercises[weekday] = list.map((e) => ExerciseLog.fromJson(Map<String, dynamic>.from(e as Map))).toList();
      } else {
        exercises[weekday] = _getDefaultMockWorkoutForWeekday(weekday);
      }
      isRest[weekday] = _settingsBox.get('weekly_workout_is_rest_$weekday', defaultValue: (weekday == 3 || weekday == 6 || weekday == 7)) as bool;
      restAfterThree[weekday] = _settingsBox.get('weekly_workout_rest_after_three_$weekday', defaultValue: false) as bool;
    }
    
    final defaultPlan = WorkoutPlan(
      id: 'default_workout',
      name: 'Standard Workout',
      weeklyExercises: exercises,
      weeklyIsRest: isRest,
      weeklyRestAfterThree: restAfterThree,
    );
    return [defaultPlan];
  }

  Future<void> saveWorkoutPlans(List<WorkoutPlan> plans) async {
    final raw = jsonEncode(plans.map((w) => w.toJson()).toList());
    await _settingsBox.put('workout_plans', raw);
  }

  String getActiveWorkoutPlanId() {
    return _settingsBox.get('active_workout_plan_id', defaultValue: 'default_workout') as String;
  }

  Future<void> saveActiveWorkoutPlanId(String id) async {
    await _settingsBox.put('active_workout_plan_id', id);
  }

  // --- Sleep Schedules ---
  List<SleepSchedule> getSleepSchedules() {
    final raw = _settingsBox.get('sleep_schedules');
    if (raw != null) {
      final list = jsonDecode(raw as String) as List;
      return list.map((s) => SleepSchedule.fromJson(Map<String, dynamic>.from(s as Map))).toList();
    }
    final legacyBedtime = _settingsBox.get('bedtime_reminder', defaultValue: '10:30 PM') as String;
    final legacyEnabled = _settingsBox.get('bedtime_reminder_enabled', defaultValue: true) as bool;
    final defaultSchedule = SleepSchedule(
      id: 'default_sleep',
      name: 'Standard Sleep',
      bedtime: legacyBedtime,
      isEnabled: legacyEnabled,
    );
    return [defaultSchedule];
  }

  Future<void> saveSleepSchedules(List<SleepSchedule> schedules) async {
    final raw = jsonEncode(schedules.map((s) => s.toJson()).toList());
    await _settingsBox.put('sleep_schedules', raw);
  }

  String getActiveSleepScheduleId() {
    return _settingsBox.get('active_sleep_schedule_id', defaultValue: 'default_sleep') as String;
  }

  Future<void> saveActiveSleepScheduleId(String id) async {
    await _settingsBox.put('active_sleep_schedule_id', id);
  }

  // Clear all databases and reset to clean defaults
  Future<void> clearAllData() async {
    await _profileBox.clear();
    await _progressBox.clear();
    await _settingsBox.clear();

    // Reset profile to baseline
    final profile = UserProfile(name: 'Abhijith', streakDays: 0, level: 1);
    await _profileBox.put('active_profile', jsonEncode(profile.toJson()));

    // Seed default diet plan
    final defaultDiet = DietPlan(id: 'default_diet', name: 'Standard Diet', meals: const []);
    await saveDietPlans([defaultDiet]);
    await saveActiveDietPlanId('default_diet');

    // Seed default workout plan
    final Map<int, List<ExerciseLog>> exercises = {};
    final Map<int, bool> isRest = {};
    final Map<int, bool> restAfterThree = {};
    for (int weekday = 1; weekday <= 7; weekday++) {
      exercises[weekday] = const [];
      isRest[weekday] = false;
      restAfterThree[weekday] = false;
    }
    final defaultWorkout = WorkoutPlan(
      id: 'default_workout',
      name: 'Standard Workout',
      weeklyExercises: exercises,
      weeklyIsRest: isRest,
      weeklyRestAfterThree: restAfterThree,
    );
    await saveWorkoutPlans([defaultWorkout]);
    await saveActiveWorkoutPlanId('default_workout');

    // Seed default sleep plan
    final defaultSleep = SleepSchedule(id: 'default_sleep', name: 'Standard Sleep', bedtime: '10:30 PM', isEnabled: true);
    await saveSleepSchedules([defaultSleep]);
    await saveActiveSleepScheduleId('default_sleep');

    // Seed empty daily log for today
    final todayKey = _getDateKey(DateTime.now());
    final cleanProgress = DailyProgress(
      dateString: todayKey,
      momentumFraction: 0.0,
      waterMl: 0,
      waterTargetMl: 2500,
      caloriesConsumed: 0,
      calorieTarget: null,
      customModeDiet: false,
      macrosConsumed: const {'protein': 0.0, 'carbs': 0.0, 'fat': 0.0},
      meals: const [],
      exercises: const [],
      sleep: null,
    );

    await _progressBox.put(todayKey, jsonEncode(cleanProgress.toJson()));
  }
}
