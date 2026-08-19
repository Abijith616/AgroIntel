import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart';
import '../models/models.dart';
import '../repositories/progress_repository.dart';

// Repository provider
final progressRepositoryProvider = Provider<ProgressRepository>((ref) {
  return ProgressRepository();
});

// App State class to bundle daily progress, user profile, default volumes, and historical logs
class AppState {
  final DailyProgress dailyProgress;
  final UserProfile userProfile;
  final int defaultWaterVolume;
  final List<DailyProgress> historyLogs;
  final Map<String, DailyProgress> allLogsMap;
  final String bedtimeReminder;
  final bool isBedtimeReminderEnabled;
  final String globalWorkoutMode;
  final List<DietPlan> dietPlans;
  final String activeDietPlanId;
  final List<WorkoutPlan> workoutPlans;
  final String activeWorkoutPlanId;
  final List<SleepSchedule> sleepSchedules;
  final String activeSleepScheduleId;

  AppState({
    required this.dailyProgress,
    required this.userProfile,
    required this.defaultWaterVolume,
    required this.historyLogs,
    required this.allLogsMap,
    this.bedtimeReminder = '10:30 PM',
    this.isBedtimeReminderEnabled = true,
    this.globalWorkoutMode = 'pre-determined',
    required this.dietPlans,
    required this.activeDietPlanId,
    required this.workoutPlans,
    required this.activeWorkoutPlanId,
    required this.sleepSchedules,
    required this.activeSleepScheduleId,
  });

  AppState copyWith({
    DailyProgress? dailyProgress,
    UserProfile? userProfile,
    int? defaultWaterVolume,
    List<DailyProgress>? historyLogs,
    Map<String, DailyProgress>? allLogsMap,
    String? bedtimeReminder,
    bool? isBedtimeReminderEnabled,
    String? globalWorkoutMode,
    List<DietPlan>? dietPlans,
    String? activeDietPlanId,
    List<WorkoutPlan>? workoutPlans,
    String? activeWorkoutPlanId,
    List<SleepSchedule>? sleepSchedules,
    String? activeSleepScheduleId,
  }) {
    return AppState(
      dailyProgress: dailyProgress ?? this.dailyProgress,
      userProfile: userProfile ?? this.userProfile,
      defaultWaterVolume: defaultWaterVolume ?? this.defaultWaterVolume,
      historyLogs: historyLogs ?? this.historyLogs,
      allLogsMap: allLogsMap ?? this.allLogsMap,
      bedtimeReminder: bedtimeReminder ?? this.bedtimeReminder,
      isBedtimeReminderEnabled: isBedtimeReminderEnabled ?? this.isBedtimeReminderEnabled,
      globalWorkoutMode: globalWorkoutMode ?? this.globalWorkoutMode,
      dietPlans: dietPlans ?? this.dietPlans,
      activeDietPlanId: activeDietPlanId ?? this.activeDietPlanId,
      workoutPlans: workoutPlans ?? this.workoutPlans,
      activeWorkoutPlanId: activeWorkoutPlanId ?? this.activeWorkoutPlanId,
      sleepSchedules: sleepSchedules ?? this.sleepSchedules,
      activeSleepScheduleId: activeSleepScheduleId ?? this.activeSleepScheduleId,
    );
  }
}

// App State notifier using modern Riverpod Notifier
class AppStateNotifier extends Notifier<AppState> {
  ProgressRepository get _repository => ref.read(progressRepositoryProvider);

  @override
  AppState build() {
    final now = DateTime.now();
    final List<DailyProgress> logs = [];
    for (int i = 6; i >= 0; i--) {
      logs.add(_repository.getProgressForDay(now.subtract(Duration(days: i))));
    }

    final allLogs = _repository.getAllProgressLogs();
    final Map<String, DailyProgress> map = {};
    for (final log in allLogs) {
      map[log.dateString] = log;
    }

    return AppState(
      dailyProgress: _repository.getProgressForDay(now),
      userProfile: _repository.getUserProfile(),
      defaultWaterVolume: _repository.getDefaultWaterVolume(),
      historyLogs: logs,
      allLogsMap: map,
      bedtimeReminder: _repository.getBedtimeReminder(),
      isBedtimeReminderEnabled: _repository.isBedtimeReminderEnabled(),
      globalWorkoutMode: _repository.getGlobalWorkoutMode(),
      dietPlans: _repository.getDietPlans(),
      activeDietPlanId: _repository.getActiveDietPlanId(),
      workoutPlans: _repository.getWorkoutPlans(),
      activeWorkoutPlanId: _repository.getActiveWorkoutPlanId(),
      sleepSchedules: _repository.getSleepSchedules(),
      activeSleepScheduleId: _repository.getActiveSleepScheduleId(),
    );
  }

  // Load progress for a specific date
  void loadDate(DateTime date) {
    final List<DailyProgress> logs = [];
    for (int i = 6; i >= 0; i--) {
      logs.add(_repository.getProgressForDay(date.subtract(Duration(days: i))));
    }
    state = state.copyWith(
      dailyProgress: _repository.getProgressForDay(date),
      historyLogs: logs,
    );
  }

  // Refreshes profile from repository
  void reloadProfile() {
    state = state.copyWith(
      userProfile: _repository.getUserProfile(),
    );
  }

  // Log water intake
  void logWater([int? ml]) {
    final logVolume = ml ?? state.defaultWaterVolume;
    final currentProgress = state.dailyProgress;
    
    final newWater = (currentProgress.waterMl + logVolume).clamp(0, 99999);
    final updatedProgress = currentProgress.copyWith(
      waterMl: newWater,
    );

    _saveAndEmit(updatedProgress);
    
    // Play light haptic feedback for water log
    HapticFeedback.lightImpact();
  }

  // Set default water container size
  Future<void> updateDefaultWaterVolume(int ml) async {
    await _repository.saveDefaultWaterVolume(ml);
    state = state.copyWith(defaultWaterVolume: ml);
    HapticFeedback.selectionClick();
  }

  // Toggle meal eaten state
  void toggleMeal(String mealId) {
    final currentProgress = state.dailyProgress;
    final updatedMeals = currentProgress.meals.map((meal) {
      if (meal.id == mealId) {
        return meal.copyWith(eaten: !meal.eaten);
      }
      return meal;
    }).toList();

    // Recompute calories and macros consumed
    int totalKcal = 0;
    double totalP = 0.0;
    double totalC = 0.0;
    double totalF = 0.0;

    for (final meal in updatedMeals) {
      if (meal.eaten) {
        final kcal = meal.kcal ?? 0;
        totalKcal += kcal;
        // Mock macro distribution based on kcal
        totalP += (kcal * 0.08); // protein ~32% of kcal
        totalC += (kcal * 0.10); // carbs ~40% of kcal
        totalF += (kcal * 0.03); // fat ~27% of kcal
      }
    }

    final updatedProgress = currentProgress.copyWith(
      meals: updatedMeals,
      caloriesConsumed: totalKcal,
      macrosConsumed: {
        'protein': totalP.clamp(0.0, 300.0),
        'carbs': totalC.clamp(0.0, 400.0),
        'fat': totalF.clamp(0.0, 150.0),
      },
    );

    _saveAndEmit(updatedProgress);
    HapticFeedback.lightImpact();
  }

  // Toggle Custom Mode on Diet Screen
  void toggleCustomModeDiet(bool enabled) {
    final currentProgress = state.dailyProgress;
    final predefined = _repository.getPredefinedDietPlan();
    final defaultTarget = predefined.isEmpty 
        ? null 
        : predefined.fold<int>(0, (sum, m) => sum + (m.kcal ?? 0));
    final updatedProgress = currentProgress.copyWith(
      customModeDiet: enabled,
      calorieTarget: enabled ? null : defaultTarget,
    );

    _saveAndEmit(updatedProgress);
    HapticFeedback.selectionClick();
  }

  // Predefined Diet Plan Management
  List<Meal> getPredefinedDietPlan() {
    return _repository.getPredefinedDietPlan();
  }

  void updatePredefinedDietPlan(List<Meal> predefinedMeals) {
    _repository.savePredefinedDietPlan(predefinedMeals);

    final currentProgress = state.dailyProgress;
    final dateKey = currentProgress.dateString;

    // Filter out existing predefined meals, keeping only custom ones
    final customMeals = currentProgress.meals.where((m) => m.loggedOnTheFly).toList();

    // Map new predefined meals to today's date context
    final date = DateTime.tryParse(dateKey) ?? DateTime.now();
    final newPredefinedMeals = predefinedMeals.map((m) {
      return m.copyWith(
        id: '${m.id}_$dateKey',
        time: DateTime(date.year, date.month, date.day, m.time.hour, m.time.minute),
        eaten: false,
        loggedOnTheFly: false,
      );
    }).toList();

    final updatedMeals = [...customMeals, ...newPredefinedMeals];

    // Recompute target calorie
    final int? newCalorieTarget = predefinedMeals.isEmpty 
        ? null 
        : predefinedMeals.fold<int>(0, (sum, m) => sum + (m.kcal ?? 0));

    // Recompute calories consumed
    int totalKcal = 0;
    double totalP = 0.0;
    double totalC = 0.0;
    double totalF = 0.0;

    for (final meal in updatedMeals) {
      if (meal.eaten) {
        final k = meal.kcal ?? 0;
        totalKcal += k;
        totalP += (k * 0.08);
        totalC += (k * 0.10);
        totalF += (k * 0.03);
      }
    }

    final updatedProgress = currentProgress.copyWith(
      meals: updatedMeals,
      calorieTarget: currentProgress.customModeDiet ? null : newCalorieTarget,
      caloriesConsumed: totalKcal,
      macrosConsumed: {
        'protein': totalP.clamp(0.0, 300.0),
        'carbs': totalC.clamp(0.0, 400.0),
        'fat': totalF.clamp(0.0, 150.0),
      },
    );

    _saveAndEmit(updatedProgress);
    HapticFeedback.mediumImpact();
  }

  // Quick Add Custom Meal
  void quickAddMeal(String name, int? kcal, {required bool autoEstimate}) {
    int finalKcal = kcal ?? 250;
    if (kcal == null && autoEstimate) {
      // Heuristic auto-estimation mapping
      final lowerName = name.toLowerCase();
      if (lowerName.contains('coffee') || lowerName.contains('banana') || lowerName.contains('snack')) {
        finalKcal = 140;
      } else if (lowerName.contains('biryani') || lowerName.contains('rice') || lowerName.contains('dinner') || lowerName.contains('salmon')) {
        finalKcal = 720;
      } else if (lowerName.contains('shake') || lowerName.contains('drink') || lowerName.contains('protein')) {
        finalKcal = 180;
      } else if (lowerName.contains('egg') || lowerName.contains('oats') || lowerName.contains('breakfast')) {
        finalKcal = 350;
      } else {
        finalKcal = 250; // default fallback
      }
    }

    final newMeal = Meal(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      time: DateTime.now(),
      name: name,
      kcal: finalKcal,
      estimated: kcal == null && autoEstimate,
      loggedOnTheFly: true,
      eaten: true,
    );

    final currentProgress = state.dailyProgress;
    final updatedMeals = [...currentProgress.meals, newMeal];

    // Recompute calories and macros
    int totalKcal = 0;
    double totalP = 0.0;
    double totalC = 0.0;
    double totalF = 0.0;

    for (final meal in updatedMeals) {
      if (meal.eaten) {
        final k = meal.kcal ?? 0;
        totalKcal += k;
        totalP += (k * 0.08);
        totalC += (k * 0.10);
        totalF += (k * 0.03);
      }
    }

    final updatedProgress = currentProgress.copyWith(
      meals: updatedMeals,
      caloriesConsumed: totalKcal,
      macrosConsumed: {
        'protein': totalP.clamp(0.0, 300.0),
        'carbs': totalC.clamp(0.0, 400.0),
        'fat': totalF.clamp(0.0, 150.0),
      },
    );

    _saveAndEmit(updatedProgress);
    HapticFeedback.mediumImpact();
  }

  // Edit Custom Meal
  void editCustomMeal(String mealId, String name, int? kcal, {required bool autoEstimate}) {
    int finalKcal = kcal ?? 250;
    if (kcal == null && autoEstimate) {
      final lowerName = name.toLowerCase();
      if (lowerName.contains('coffee') || lowerName.contains('banana') || lowerName.contains('snack')) {
        finalKcal = 140;
      } else if (lowerName.contains('biryani') || lowerName.contains('rice') || lowerName.contains('dinner') || lowerName.contains('salmon')) {
        finalKcal = 720;
      } else if (lowerName.contains('shake') || lowerName.contains('drink') || lowerName.contains('protein')) {
        finalKcal = 180;
      } else if (lowerName.contains('egg') || lowerName.contains('oats') || lowerName.contains('breakfast')) {
        finalKcal = 350;
      } else {
        finalKcal = 250;
      }
    }

    final currentProgress = state.dailyProgress;
    final updatedMeals = currentProgress.meals.map((meal) {
      if (meal.id == mealId) {
        return meal.copyWith(
          name: name,
          kcal: finalKcal,
          estimated: kcal == null && autoEstimate,
        );
      }
      return meal;
    }).toList();

    // Recompute calories and macros
    int totalKcal = 0;
    double totalP = 0.0;
    double totalC = 0.0;
    double totalF = 0.0;

    for (final meal in updatedMeals) {
      if (meal.eaten) {
        final k = meal.kcal ?? 0;
        totalKcal += k;
        totalP += (k * 0.08);
        totalC += (k * 0.10);
        totalF += (k * 0.03);
      }
    }

    final updatedProgress = currentProgress.copyWith(
      meals: updatedMeals,
      caloriesConsumed: totalKcal,
      macrosConsumed: {
        'protein': totalP.clamp(0.0, 300.0),
        'carbs': totalC.clamp(0.0, 400.0),
        'fat': totalF.clamp(0.0, 150.0),
      },
    );

    _saveAndEmit(updatedProgress);
    HapticFeedback.mediumImpact();
  }

  // Delete Custom Meal
  void deleteCustomMeal(String mealId) {
    final currentProgress = state.dailyProgress;
    final updatedMeals = currentProgress.meals.where((meal) => meal.id != mealId).toList();

    // Recompute calories and macros
    int totalKcal = 0;
    double totalP = 0.0;
    double totalC = 0.0;
    double totalF = 0.0;

    for (final meal in updatedMeals) {
      if (meal.eaten) {
        final k = meal.kcal ?? 0;
        totalKcal += k;
        totalP += (k * 0.08);
        totalC += (k * 0.10);
        totalF += (k * 0.03);
      }
    }

    final updatedProgress = currentProgress.copyWith(
      meals: updatedMeals,
      caloriesConsumed: totalKcal,
      macrosConsumed: {
        'protein': totalP.clamp(0.0, 300.0),
        'carbs': totalC.clamp(0.0, 400.0),
        'fat': totalF.clamp(0.0, 150.0),
      },
    );

    _saveAndEmit(updatedProgress);
    HapticFeedback.heavyImpact();
  }

  // Toggle Exercise completion status
  void toggleExercise(String exerciseName) {
    final currentProgress = state.dailyProgress;
    final updatedExercises = currentProgress.exercises.map((ex) {
      if (ex.name == exerciseName) {
        return ex.copyWith(completed: !ex.completed);
      }
      return ex;
    }).toList();

    final updatedProgress = currentProgress.copyWith(
      exercises: updatedExercises,
    );

    _saveAndEmit(updatedProgress);

    // Feedback
    HapticFeedback.mediumImpact();
  }

  // Update complete DailyProgress (used in session mode completion or sleep reminders)
  void updateProgressDirectly(DailyProgress progress) {
    _saveAndEmit(progress);
  }

  // Generate CSV/Markdown text of the user's progress log for Claude
  String generateProgressReportMarkdown() {
    final allLogs = _repository.getAllProgressLogs();
    final buffer = StringBuffer();
    
    buffer.writeln("# Meridian Progress Report");
    buffer.writeln("Generated on: ${DateTime.now().toIso8601String()}\n");
    buffer.writeln("| Date | Momentum % | Calories Consumed | Target | Water ml | Exercises Completed | Sleep Duration | Quality Score |");
    buffer.writeln("| --- | --- | --- | --- | --- | --- | --- | --- |");

    for (final log in allLogs) {
      final momentumPct = (log.momentumFraction * 100).toInt();
      final calTargetStr = log.customModeDiet ? 'Custom' : (log.calorieTarget != null ? '${log.calorieTarget}' : 'No Target');
      final completedExercises = log.exercises.where((e) => e.completed).length;
      final totalExercises = log.exercises.length;
      
      String sleepStr = 'No data';
      String qualityStr = 'No data';
      if (log.sleep != null) {
        final hours = log.sleep!.durationMinutes ~/ 60;
        final mins = log.sleep!.durationMinutes % 60;
        sleepStr = '${hours}h ${mins}m';
        qualityStr = '${log.sleep!.qualityScore}';
      }

      buffer.writeln(
        "| ${log.dateString} | $momentumPct% | ${log.caloriesConsumed} kcal | $calTargetStr | ${log.waterMl} ml | $completedExercises/$totalExercises | $sleepStr | $qualityStr |"
      );
    }
    
    return buffer.toString();
  }

  // Update current day's active exercises list
  void updateExercises(List<ExerciseLog> exercises) {
    final updated = state.dailyProgress.copyWith(exercises: exercises);
    _saveAndEmit(updated);
  }

  // Get weekly workout plan templates
  List<ExerciseLog> getWeeklyWorkoutPlan(int weekday) {
    return _repository.getWeeklyWorkoutPlan(weekday);
  }

  bool isWeeklyRestDay(int weekday) {
    return _repository.isWeeklyRestDay(weekday);
  }

  bool isWeeklyRestAfterThree(int weekday) {
    return _repository.isWeeklyRestAfterThree(weekday);
  }

  // Save weekly workout plan template and sync current day's progress if weekdays match
  void saveWeeklyWorkoutPlan(
    int weekday,
    List<ExerciseLog> exercises, {
    required bool isRestDay,
    required bool restAfterThree,
  }) {
    _repository.saveWeeklyWorkoutPlan(
      weekday,
      exercises,
      isRestDay: isRestDay,
      restAfterThree: restAfterThree,
    );

    // If today is this weekday, update today's progress, merging completed status where possible
    final today = DateTime.tryParse(state.dailyProgress.dateString) ?? DateTime.now();
    if (today.weekday == weekday) {
      final oldExercises = state.dailyProgress.exercises;
      final seededExercises = _repository.getSeededExercisesForDate(today);

      // Merge completion status of existing matching exercise names to avoid losing progress
      final updatedExercises = seededExercises.map((newEx) {
        final match = oldExercises.firstWhere(
          (oldEx) => oldEx.name == newEx.name,
          orElse: () => newEx,
        );
        return newEx.copyWith(completed: match.completed);
      }).toList();

      final updatedProgress = state.dailyProgress.copyWith(exercises: updatedExercises);
      _saveAndEmit(updatedProgress);
    }
  }

  // Log sleep entry
  void logSleep(int durationMins, int qualityScore) {
    final updated = state.dailyProgress.copyWith(
      sleep: SleepLog(
        durationMinutes: durationMins,
        qualityScore: qualityScore,
        stageFractions: const {'deep': 0.22, 'rem': 0.28, 'light': 0.42, 'awake': 0.08},
      ),
    );
    _saveAndEmit(updated);
    HapticFeedback.mediumImpact();
  }

  // Clear sleep entry for current day
  void clearSleep() {
    final updated = state.dailyProgress.copyWith(
      clearSleep: true,
    );
    _saveAndEmit(updated);
    HapticFeedback.heavyImpact();
  }

  // Save bedtime reminder setting
  void updateBedtimeReminder(String timeStr) {
    _repository.saveBedtimeReminder(timeStr);
    state = state.copyWith(bedtimeReminder: timeStr);
    HapticFeedback.mediumImpact();
  }

  // Toggle bedtime reminder on/off
  void toggleBedtimeReminderEnabled(bool enabled) {
    _repository.saveBedtimeReminderEnabled(enabled);
    state = state.copyWith(isBedtimeReminderEnabled: enabled);
    HapticFeedback.mediumImpact();
  }

  // Update global workout logging mode
  void setGlobalWorkoutMode(String mode) {
    _repository.saveGlobalWorkoutMode(mode);
    state = state.copyWith(globalWorkoutMode: mode);
    HapticFeedback.selectionClick();
  }

  // Clear/Reset all data from Hive boxes
  Future<void> resetAllData() async {
    await _repository.clearAllData();
    final now = DateTime.now();
    final List<DailyProgress> logs = [];
    for (int i = 6; i >= 0; i--) {
      logs.add(_repository.getProgressForDay(now.subtract(Duration(days: i))));
    }
    final allLogs = _repository.getAllProgressLogs();
    final Map<String, DailyProgress> map = {};
    for (final log in allLogs) {
      map[log.dateString] = log;
    }
    state = AppState(
      dailyProgress: _repository.getProgressForDay(now),
      userProfile: _repository.getUserProfile(),
      defaultWaterVolume: _repository.getDefaultWaterVolume(),
      historyLogs: logs,
      allLogsMap: map,
      globalWorkoutMode: _repository.getGlobalWorkoutMode(),
      dietPlans: _repository.getDietPlans(),
      activeDietPlanId: _repository.getActiveDietPlanId(),
      workoutPlans: _repository.getWorkoutPlans(),
      activeWorkoutPlanId: _repository.getActiveWorkoutPlanId(),
      sleepSchedules: _repository.getSleepSchedules(),
      activeSleepScheduleId: _repository.getActiveSleepScheduleId(),
    );
    HapticFeedback.heavyImpact();
  }

  // --- Profile Name Editing ---
  void updateProfileName(String newName) {
    final updated = state.userProfile.copyWith(name: newName);
    _repository.saveUserProfile(updated);
    state = state.copyWith(userProfile: updated);
    HapticFeedback.mediumImpact();
  }

  // --- Diet Plans ---
  void createDietPlan(String name) {
    final newPlan = DietPlan(
      id: 'diet_${DateTime.now().millisecondsSinceEpoch}',
      name: name,
      meals: const [],
    );
    final updatedList = [...state.dietPlans, newPlan];
    _repository.saveDietPlans(updatedList);
    state = state.copyWith(dietPlans: updatedList);
    HapticFeedback.mediumImpact();
  }

  void updateDietPlan(DietPlan plan) {
    final updatedList = state.dietPlans.map((p) => p.id == plan.id ? plan : p).toList();
    _repository.saveDietPlans(updatedList);
    state = state.copyWith(dietPlans: updatedList);
    HapticFeedback.mediumImpact();
  }

  void deleteDietPlan(String id) {
    if (state.dietPlans.length <= 1) return;
    final updatedList = state.dietPlans.where((p) => p.id != id).toList();
    _repository.saveDietPlans(updatedList);
    
    String nextActiveId = state.activeDietPlanId;
    if (state.activeDietPlanId == id) {
      nextActiveId = updatedList.first.id;
      _repository.saveActiveDietPlanId(nextActiveId);
    }
    
    state = state.copyWith(
      dietPlans: updatedList,
      activeDietPlanId: nextActiveId,
    );
    HapticFeedback.heavyImpact();
  }

  void switchDietPlan(String planId) {
    _repository.saveActiveDietPlanId(planId);
    final activePlan = state.dietPlans.firstWhere((p) => p.id == planId);
    
    final todayKey = state.dailyProgress.dateString;
    final date = DateTime.tryParse(todayKey) ?? DateTime.now();
    final customMeals = state.dailyProgress.meals.where((m) => m.loggedOnTheFly).toList();
    
    final newPredefinedMeals = activePlan.meals.map((m) {
      return m.copyWith(
        id: '${m.id}_$todayKey',
        time: DateTime(date.year, date.month, date.day, m.time.hour, m.time.minute),
        eaten: false,
        loggedOnTheFly: false,
      );
    }).toList();
    
    final updatedMeals = [...customMeals, ...newPredefinedMeals];
    final int? newCalorieTarget = activePlan.meals.isEmpty
        ? null
        : activePlan.meals.fold<int>(0, (sum, m) => sum + (m.kcal ?? 0));
        
    final updatedProgress = state.dailyProgress.copyWith(
      meals: updatedMeals,
      calorieTarget: state.dailyProgress.customModeDiet ? null : newCalorieTarget,
    );
    
    state = state.copyWith(activeDietPlanId: planId);
    _saveAndEmit(updatedProgress);
    HapticFeedback.mediumImpact();
  }

  // --- Workout Plans ---
  void createWorkoutPlan(String name) {
    final Map<int, List<ExerciseLog>> exercises = {};
    final Map<int, bool> isRest = {};
    final Map<int, bool> restAfterThree = {};
    for (int weekday = 1; weekday <= 7; weekday++) {
      exercises[weekday] = const [];
      isRest[weekday] = false;
      restAfterThree[weekday] = false;
    }
    final newPlan = WorkoutPlan(
      id: 'workout_${DateTime.now().millisecondsSinceEpoch}',
      name: name,
      weeklyExercises: exercises,
      weeklyIsRest: isRest,
      weeklyRestAfterThree: restAfterThree,
    );
    final updatedList = [...state.workoutPlans, newPlan];
    _repository.saveWorkoutPlans(updatedList);
    state = state.copyWith(workoutPlans: updatedList);
    HapticFeedback.mediumImpact();
  }

  void updateWorkoutPlan(WorkoutPlan plan) {
    final updatedList = state.workoutPlans.map((p) => p.id == plan.id ? plan : p).toList();
    _repository.saveWorkoutPlans(updatedList);
    state = state.copyWith(workoutPlans: updatedList);
    HapticFeedback.mediumImpact();
  }

  void deleteWorkoutPlan(String id) {
    if (state.workoutPlans.length <= 1) return;
    final updatedList = state.workoutPlans.where((w) => w.id != id).toList();
    _repository.saveWorkoutPlans(updatedList);
    
    String nextActiveId = state.activeWorkoutPlanId;
    if (state.activeWorkoutPlanId == id) {
      nextActiveId = updatedList.first.id;
      _repository.saveActiveWorkoutPlanId(nextActiveId);
    }
    
    state = state.copyWith(
      workoutPlans: updatedList,
      activeWorkoutPlanId: nextActiveId,
    );
    HapticFeedback.heavyImpact();
  }

  void switchWorkoutPlan(String planId) {
    _repository.saveActiveWorkoutPlanId(planId);
    final activePlan = state.workoutPlans.firstWhere((p) => p.id == planId);
    
    final today = DateTime.tryParse(state.dailyProgress.dateString) ?? DateTime.now();
    final isRest = activePlan.weeklyIsRest[today.weekday] ?? false;
    
    List<ExerciseLog> updatedExercises = [];
    if (isRest) {
      updatedExercises = [
        const ExerciseLog(
          name: 'Rest Day',
          setsRepsLabel: 'Recovery',
          weightLabel: 'Active Rest',
          completed: false,
          isRest: true,
        ),
      ];
    } else {
      updatedExercises = activePlan.weeklyExercises[today.weekday] ?? const [];
    }
    
    final updatedProgress = state.dailyProgress.copyWith(exercises: updatedExercises);
    
    state = state.copyWith(activeWorkoutPlanId: planId);
    _saveAndEmit(updatedProgress);
    HapticFeedback.mediumImpact();
  }

  // --- Sleep Schedules ---
  void createSleepSchedule(String name, String bedtime) {
    final newPlan = SleepSchedule(
      id: 'sleep_${DateTime.now().millisecondsSinceEpoch}',
      name: name,
      bedtime: bedtime,
      isEnabled: true,
    );
    final updatedList = [...state.sleepSchedules, newPlan];
    _repository.saveSleepSchedules(updatedList);
    state = state.copyWith(sleepSchedules: updatedList);
    HapticFeedback.mediumImpact();
  }

  void updateSleepSchedule(SleepSchedule plan) {
    final updatedList = state.sleepSchedules.map((s) => s.id == plan.id ? plan : s).toList();
    _repository.saveSleepSchedules(updatedList);
    state = state.copyWith(sleepSchedules: updatedList);
    HapticFeedback.mediumImpact();
  }

  void deleteSleepSchedule(String id) {
    if (state.sleepSchedules.length <= 1) return;
    final updatedList = state.sleepSchedules.where((s) => s.id != id).toList();
    _repository.saveSleepSchedules(updatedList);
    
    String nextActiveId = state.activeSleepScheduleId;
    if (state.activeSleepScheduleId == id) {
      nextActiveId = updatedList.first.id;
      _repository.saveActiveSleepScheduleId(nextActiveId);
    }
    
    state = state.copyWith(
      sleepSchedules: updatedList,
      activeSleepScheduleId: nextActiveId,
      bedtimeReminder: updatedList.firstWhere((s) => s.id == nextActiveId).bedtime,
      isBedtimeReminderEnabled: updatedList.firstWhere((s) => s.id == nextActiveId).isEnabled,
    );
    HapticFeedback.heavyImpact();
  }

  void switchSleepSchedule(String planId) {
    _repository.saveActiveSleepScheduleId(planId);
    final active = state.sleepSchedules.firstWhere((s) => s.id == planId);
    
    state = state.copyWith(
      activeSleepScheduleId: planId,
      bedtimeReminder: active.bedtime,
      isBedtimeReminderEnabled: active.isEnabled,
    );
    HapticFeedback.mediumImpact();
  }

  // Helper: saves to Hive and updates state
  void _saveAndEmit(DailyProgress progress) {
    // Recalculate momentum fraction
    final completedEx = progress.exercises.where((e) => e.completed).length;
    final totalEx = progress.exercises.length;
    
    final waterProgress = (progress.waterMl / progress.waterTargetMl).clamp(0.0, 1.0);
    final targetKcal = progress.calorieTarget;
    final dietProgress = targetKcal != null && targetKcal > 0
        ? (progress.caloriesConsumed / targetKcal).clamp(0.0, 1.0)
        : 1.0;
    final workoutProgress = totalEx > 0 ? (completedEx / totalEx).clamp(0.0, 1.0) : 0.0;

    final double calculatedMomentum = (workoutProgress * 0.4) + (dietProgress * 0.35) + (waterProgress * 0.25);
    final finalProgress = progress.copyWith(
      momentumFraction: calculatedMomentum.clamp(0.0, 1.0),
    );

    _repository.saveProgress(finalProgress);

    // Reload history logs based on current progress's date
    final date = DateTime.tryParse(finalProgress.dateString) ?? DateTime.now();
    final List<DailyProgress> logs = [];
    for (int i = 6; i >= 0; i--) {
      logs.add(_repository.getProgressForDay(date.subtract(Duration(days: i))));
    }

    final updatedAllLogsMap = Map<String, DailyProgress>.from(state.allLogsMap);
    updatedAllLogsMap[finalProgress.dateString] = finalProgress;

    state = state.copyWith(
      dailyProgress: finalProgress,
      historyLogs: logs,
      allLogsMap: updatedAllLogsMap,
    );
  }
}

// Global state provider using modern Riverpod NotifierProvider
final appStateProvider = NotifierProvider<AppStateNotifier, AppState>(() {
  return AppStateNotifier();
});
