class UserProfile {
  final String name;
  final int streakDays;
  final int level;

  UserProfile({
    required this.name,
    required this.streakDays,
    required this.level,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      name: json['name'] as String? ?? 'User',
      streakDays: json['streakDays'] as int? ?? 3,
      level: json['level'] as int? ?? 1,
    );
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        'streakDays': streakDays,
        'level': level,
      };

  UserProfile copyWith({
    String? name,
    int? streakDays,
    int? level,
  }) {
    return UserProfile(
      name: name ?? this.name,
      streakDays: streakDays ?? this.streakDays,
      level: level ?? this.level,
    );
  }
}

class Meal {
  final String id;
  final DateTime time;
  final String name;
  final int? kcal;
  final bool estimated;
  final bool loggedOnTheFly;
  final bool eaten;

  Meal({
    required this.id,
    required this.time,
    required this.name,
    this.kcal,
    this.estimated = false,
    this.loggedOnTheFly = false,
    this.eaten = false,
  });

  factory Meal.fromJson(Map<String, dynamic> json) {
    return Meal(
      id: json['id'] as String,
      time: DateTime.parse(json['time'] as String),
      name: json['name'] as String,
      kcal: json['kcal'] as int?,
      estimated: json['estimated'] as bool? ?? false,
      loggedOnTheFly: json['loggedOnTheFly'] as bool? ?? false,
      eaten: json['eaten'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'time': time.toIso8601String(),
        'name': name,
        'kcal': kcal,
        'estimated': estimated,
        'loggedOnTheFly': loggedOnTheFly,
        'eaten': eaten,
      };

  Meal copyWith({
    String? id,
    DateTime? time,
    String? name,
    int? kcal,
    bool? estimated,
    bool? loggedOnTheFly,
    bool? eaten,
  }) {
    return Meal(
      id: id ?? this.id,
      time: time ?? this.time,
      name: name ?? this.name,
      kcal: kcal ?? this.kcal,
      estimated: estimated ?? this.estimated,
      loggedOnTheFly: loggedOnTheFly ?? this.loggedOnTheFly,
      eaten: eaten ?? this.eaten,
    );
  }
}

class ExerciseLog {
  final String name;
  final String setsRepsLabel;
  final String weightLabel;
  final bool completed;
  final bool isRest;
  final bool isPostDetermined;
  final bool hasCustomValues;

  const ExerciseLog({
    required this.name,
    required this.setsRepsLabel,
    required this.weightLabel,
    this.completed = false,
    this.isRest = false,
    this.isPostDetermined = false,
    this.hasCustomValues = false,
  });

  factory ExerciseLog.fromJson(Map<String, dynamic> json) {
    return ExerciseLog(
      name: json['name'] as String,
      setsRepsLabel: json['setsRepsLabel'] as String,
      weightLabel: json['weightLabel'] as String,
      completed: json['completed'] as bool? ?? false,
      isRest: json['isRest'] as bool? ?? false,
      isPostDetermined: json['isPostDetermined'] as bool? ?? false,
      hasCustomValues: json['hasCustomValues'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        'setsRepsLabel': setsRepsLabel,
        'weightLabel': weightLabel,
        'completed': completed,
        'isRest': isRest,
        'isPostDetermined': isPostDetermined,
        'hasCustomValues': hasCustomValues,
      };

  ExerciseLog copyWith({
    String? name,
    String? setsRepsLabel,
    String? weightLabel,
    bool? completed,
    bool? isRest,
    bool? isPostDetermined,
    bool? hasCustomValues,
  }) {
    return ExerciseLog(
      name: name ?? this.name,
      setsRepsLabel: setsRepsLabel ?? this.setsRepsLabel,
      weightLabel: weightLabel ?? this.weightLabel,
      completed: completed ?? this.completed,
      isRest: isRest ?? this.isRest,
      isPostDetermined: isPostDetermined ?? this.isPostDetermined,
      hasCustomValues: hasCustomValues ?? this.hasCustomValues,
    );
  }
}

class SleepLog {
  final int durationMinutes;
  final int qualityScore;
  final Map<String, double> stageFractions;

  SleepLog({
    required this.durationMinutes,
    required this.qualityScore,
    required this.stageFractions,
  });

  factory SleepLog.fromJson(Map<String, dynamic> json) {
    return SleepLog(
      durationMinutes: json['durationMinutes'] as int,
      qualityScore: json['qualityScore'] as int,
      stageFractions: Map<String, double>.from(json['stageFractions'] as Map),
    );
  }

  Map<String, dynamic> toJson() => {
        'durationMinutes': durationMinutes,
        'qualityScore': qualityScore,
        'stageFractions': stageFractions,
      };
}

class DailyProgress {
  final String dateString; // YYYY-MM-DD key
  final double momentumFraction; // 0.0 to 1.0
  final int waterMl;
  final int waterTargetMl;
  final int caloriesConsumed;
  final int? calorieTarget;
  final bool customModeDiet;
  final Map<String, double> macrosConsumed;
  final List<Meal> meals;
  final List<ExerciseLog> exercises;
  final SleepLog? sleep;

  DailyProgress({
    required this.dateString,
    required this.momentumFraction,
    required this.waterMl,
    required this.waterTargetMl,
    required this.caloriesConsumed,
    this.calorieTarget,
    required this.customModeDiet,
    required this.macrosConsumed,
    required this.meals,
    required this.exercises,
    this.sleep,
  });

  factory DailyProgress.fromJson(Map<String, dynamic> json) {
    return DailyProgress(
      dateString: json['dateString'] as String,
      momentumFraction: (json['momentumFraction'] as num).toDouble(),
      waterMl: json['waterMl'] as int,
      waterTargetMl: json['waterTargetMl'] as int? ?? 2500,
      caloriesConsumed: json['caloriesConsumed'] as int,
      calorieTarget: json['calorieTarget'] as int?,
      customModeDiet: json['customModeDiet'] as bool? ?? false,
      macrosConsumed: Map<String, double>.from(
        (json['macrosConsumed'] as Map? ?? {}).map(
          (k, v) => MapEntry(k as String, (v as num).toDouble()),
        ),
      ),
      meals: (json['meals'] as List? ?? [])
          .map((m) => Meal.fromJson(Map<String, dynamic>.from(m as Map)))
          .toList(),
      exercises: (json['exercises'] as List? ?? [])
          .map((e) => ExerciseLog.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList(),
      sleep: json['sleep'] != null
          ? SleepLog.fromJson(Map<String, dynamic>.from(json['sleep'] as Map))
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'dateString': dateString,
        'momentumFraction': momentumFraction,
        'waterMl': waterMl,
        'waterTargetMl': waterTargetMl,
        'caloriesConsumed': caloriesConsumed,
        'calorieTarget': calorieTarget,
        'customModeDiet': customModeDiet,
        'macrosConsumed': macrosConsumed,
        'meals': meals.map((m) => m.toJson()).toList(),
        'exercises': exercises.map((e) => e.toJson()).toList(),
        'sleep': sleep?.toJson(),
      };

  DailyProgress copyWith({
    String? dateString,
    double? momentumFraction,
    int? waterMl,
    int? waterTargetMl,
    int? caloriesConsumed,
    int? calorieTarget,
    bool? customModeDiet,
    Map<String, double>? macrosConsumed,
    List<Meal>? meals,
    List<ExerciseLog>? exercises,
    SleepLog? sleep,
    bool clearSleep = false,
  }) {
    return DailyProgress(
      dateString: dateString ?? this.dateString,
      momentumFraction: momentumFraction ?? this.momentumFraction,
      waterMl: waterMl ?? this.waterMl,
      waterTargetMl: waterTargetMl ?? this.waterTargetMl,
      caloriesConsumed: caloriesConsumed ?? this.caloriesConsumed,
      calorieTarget: calorieTarget ?? this.calorieTarget,
      customModeDiet: customModeDiet ?? this.customModeDiet,
      macrosConsumed: macrosConsumed ?? this.macrosConsumed,
      meals: meals ?? this.meals,
      exercises: exercises ?? this.exercises,
      sleep: clearSleep ? null : (sleep ?? this.sleep),
    );
  }
}

class DietPlan {
  final String id;
  final String name;
  final List<Meal> meals;

  DietPlan({
    required this.id,
    required this.name,
    required this.meals,
  });

  factory DietPlan.fromJson(Map<String, dynamic> json) {
    return DietPlan(
      id: json['id'] as String,
      name: json['name'] as String,
      meals: (json['meals'] as List? ?? [])
          .map((m) => Meal.fromJson(Map<String, dynamic>.from(m as Map)))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'meals': meals.map((m) => m.toJson()).toList(),
      };

  DietPlan copyWith({
    String? id,
    String? name,
    List<Meal>? meals,
  }) {
    return DietPlan(
      id: id ?? this.id,
      name: name ?? this.name,
      meals: meals ?? this.meals,
    );
  }
}

class WorkoutPlan {
  final String id;
  final String name;
  final Map<int, List<ExerciseLog>> weeklyExercises;
  final Map<int, bool> weeklyIsRest;
  final Map<int, bool> weeklyRestAfterThree;

  WorkoutPlan({
    required this.id,
    required this.name,
    required this.weeklyExercises,
    required this.weeklyIsRest,
    required this.weeklyRestAfterThree,
  });

  factory WorkoutPlan.fromJson(Map<String, dynamic> json) {
    final exercisesJson = json['weeklyExercises'] as Map? ?? {};
    final isRestJson = json['weeklyIsRest'] as Map? ?? {};
    final restAfterThreeJson = json['weeklyRestAfterThree'] as Map? ?? {};

    final Map<int, List<ExerciseLog>> exercises = {};
    exercisesJson.forEach((k, v) {
      final wday = int.tryParse(k.toString()) ?? 1;
      final list = v as List? ?? [];
      exercises[wday] = list.map((e) => ExerciseLog.fromJson(Map<String, dynamic>.from(e as Map))).toList();
    });

    final Map<int, bool> isRest = {};
    isRestJson.forEach((k, v) {
      isRest[int.tryParse(k.toString()) ?? 1] = v as bool;
    });

    final Map<int, bool> restAfterThree = {};
    restAfterThreeJson.forEach((k, v) {
      restAfterThree[int.tryParse(k.toString()) ?? 1] = v as bool;
    });

    return WorkoutPlan(
      id: json['id'] as String,
      name: json['name'] as String,
      weeklyExercises: exercises,
      weeklyIsRest: isRest,
      weeklyRestAfterThree: restAfterThree,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'weeklyExercises': weeklyExercises.map((k, v) => MapEntry(k.toString(), v.map((e) => e.toJson()).toList())),
        'weeklyIsRest': weeklyIsRest.map((k, v) => MapEntry(k.toString(), v)),
        'weeklyRestAfterThree': weeklyRestAfterThree.map((k, v) => MapEntry(k.toString(), v)),
      };

  WorkoutPlan copyWith({
    String? id,
    String? name,
    Map<int, List<ExerciseLog>>? weeklyExercises,
    Map<int, bool>? weeklyIsRest,
    Map<int, bool>? weeklyRestAfterThree,
  }) {
    return WorkoutPlan(
      id: id ?? this.id,
      name: name ?? this.name,
      weeklyExercises: weeklyExercises ?? this.weeklyExercises,
      weeklyIsRest: weeklyIsRest ?? this.weeklyIsRest,
      weeklyRestAfterThree: weeklyRestAfterThree ?? this.weeklyRestAfterThree,
    );
  }
}

class SleepSchedule {
  final String id;
  final String name;
  final String bedtime;
  final bool isEnabled;

  SleepSchedule({
    required this.id,
    required this.name,
    required this.bedtime,
    required this.isEnabled,
  });

  factory SleepSchedule.fromJson(Map<String, dynamic> json) {
    return SleepSchedule(
      id: json['id'] as String,
      name: json['name'] as String,
      bedtime: json['bedtime'] as String? ?? '10:30 PM',
      isEnabled: json['isEnabled'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'bedtime': bedtime,
        'isEnabled': isEnabled,
      };

  SleepSchedule copyWith({
    String? id,
    String? name,
    String? bedtime,
    bool? isEnabled,
  }) {
    return SleepSchedule(
      id: id ?? this.id,
      name: name ?? this.name,
      bedtime: bedtime ?? this.bedtime,
      isEnabled: isEnabled ?? this.isEnabled,
    );
  }
}
