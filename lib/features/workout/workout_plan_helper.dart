import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/colors.dart';
import '../../core/widgets/glass_card.dart';
import '../../data/models/models.dart';
import '../../data/providers/progress_provider.dart';

void showAddWorkoutPlanSheet(BuildContext context, WidgetRef ref) {
  final appState = ref.read(appStateProvider);
  final notifier = ref.read(appStateProvider.notifier);

  // Selected plan tracking
  String selectedPlanId = appState.activeWorkoutPlanId;

  // Initialize weekday based on today's weekday
  final today = DateTime.tryParse(appState.dailyProgress.dateString) ?? DateTime.now();
  int selectedWeekday = today.weekday;

  final initialPlan = appState.workoutPlans.firstWhere(
    (w) => w.id == selectedPlanId,
    orElse: () => appState.workoutPlans.first,
  );

  final Map<int, List<ExerciseLog>> tempWeeklyExercises = {};
  final Map<int, bool> tempWeeklyIsRest = {};
  final Map<int, bool> tempWeeklyRestAfterThree = {};

  void initLocalPlanState(WorkoutPlan plan) {
    tempWeeklyExercises.clear();
    tempWeeklyIsRest.clear();
    tempWeeklyRestAfterThree.clear();
    for (int weekday = 1; weekday <= 7; weekday++) {
      tempWeeklyExercises[weekday] = List.from(plan.weeklyExercises[weekday] ?? const []);
      tempWeeklyIsRest[weekday] = plan.weeklyIsRest[weekday] ?? false;
      tempWeeklyRestAfterThree[weekday] = plan.weeklyRestAfterThree[weekday] ?? false;
    }
  }

  initLocalPlanState(initialPlan);

  // Selector for adding custom rest
  bool isAddingRest = false;
  int restDurationMins = 5;

  final TextEditingController nameCtrl = TextEditingController();
  final TextEditingController weightCtrl = TextEditingController();
  int sets = 3;
  int reps = 10;
  bool isPostDetermined = false;

  final List<String> weekdayNames = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
  ];

  showModalBottomSheet(
    context: context,
    backgroundColor: AppColors.bgCardLight,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (context) {
      return StatefulBuilder(
        builder: (context, setModalState) {
          final currentPlan = ref.watch(appStateProvider).workoutPlans.firstWhere(
                (w) => w.id == selectedPlanId,
                orElse: () => ref.watch(appStateProvider).workoutPlans.first,
              );

          final currentList = tempWeeklyExercises[selectedWeekday] ?? [];
          final isRestDay = tempWeeklyIsRest[selectedWeekday] ?? false;
          final restAfterThree = tempWeeklyRestAfterThree[selectedWeekday] ?? false;

          return Padding(
            padding: EdgeInsets.only(
              left: 20,
              right: 20,
              top: 20,
              bottom: MediaQuery.of(context).viewInsets.bottom + 20,
            ),
            child: Container(
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(context).size.height * 0.85,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Top Handle bar
                    Center(
                      child: Container(
                        width: 36,
                        height: 4,
                        decoration: BoxDecoration(
                          color: Colors.white24,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Configure Workout Plans',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.w800,
                        fontSize: 18,
                        color: AppColors.white,
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Assign workouts and recovery days for the week.',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 12,
                        color: AppColors.gray,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Plan Switcher Panel
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.02),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.white.withOpacity(0.05)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: DropdownButtonHideUnderline(
                                  child: DropdownButton<String>(
                                    value: selectedPlanId,
                                    dropdownColor: AppColors.bgCardLight,
                                    icon: const Icon(Icons.arrow_drop_down, color: Colors.white70),
                                    items: ref.watch(appStateProvider).workoutPlans.map((plan) {
                                      return DropdownMenuItem<String>(
                                        value: plan.id,
                                        child: Text(
                                          plan.name,
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontFamily: 'Inter',
                                            fontWeight: FontWeight.w600,
                                            fontSize: 14,
                                          ),
                                        ),
                                      );
                                    }).toList(),
                                    onChanged: (newVal) {
                                      if (newVal != null) {
                                        setModalState(() {
                                          selectedPlanId = newVal;
                                          final nextPlan = ref.read(appStateProvider).workoutPlans.firstWhere((w) => w.id == newVal);
                                          initLocalPlanState(nextPlan);
                                          nameCtrl.clear();
                                          weightCtrl.clear();
                                        });
                                      }
                                    },
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              TextButton.icon(
                                icon: const Icon(Icons.add, size: 14, color: AppColors.green),
                                label: const Text('New', style: TextStyle(color: AppColors.green, fontSize: 11, fontWeight: FontWeight.w700)),
                                onPressed: () {
                                  _showCreatePlanDialog(context, ref, (newId) {
                                    setModalState(() {
                                      selectedPlanId = newId;
                                      final nextPlan = ref.read(appStateProvider).workoutPlans.firstWhere((w) => w.id == newId);
                                      initLocalPlanState(nextPlan);
                                    });
                                  });
                                },
                              ),
                              TextButton.icon(
                                icon: const Icon(Icons.edit, size: 14, color: AppColors.blueGlow),
                                label: const Text('Rename', style: TextStyle(color: AppColors.blueGlow, fontSize: 11, fontWeight: FontWeight.w700)),
                                onPressed: () {
                                  _showRenamePlanDialog(context, ref, currentPlan);
                                },
                              ),
                              if (ref.watch(appStateProvider).workoutPlans.length > 1)
                                TextButton.icon(
                                  icon: const Icon(Icons.delete, size: 14, color: AppColors.red),
                                  label: const Text('Delete', style: TextStyle(color: AppColors.red, fontSize: 11, fontWeight: FontWeight.w700)),
                                  onPressed: () {
                                    _showDeletePlanDialog(context, ref, selectedPlanId, () {
                                      setModalState(() {
                                        selectedPlanId = ref.read(appStateProvider).activeWorkoutPlanId;
                                        final nextPlan = ref.read(appStateProvider).workoutPlans.firstWhere((w) => w.id == selectedPlanId);
                                        initLocalPlanState(nextPlan);
                                      });
                                    });
                                  },
                                ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                    // 1. Weekday Selector Row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: List.generate(7, (index) {
                        final wDay = index + 1;
                        final isSelected = selectedWeekday == wDay;
                        final dayLabel = ['M', 'T', 'W', 'T', 'F', 'S', 'S'][index];
                        return GestureDetector(
                          onTap: () {
                            HapticFeedback.selectionClick();
                            setModalState(() {
                              selectedWeekday = wDay;
                            });
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 150),
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: isSelected
                                  ? AppColors.blueGlow
                                  : Colors.white.withOpacity(0.03),
                              border: Border.all(
                                color: isSelected
                                    ? AppColors.blueGlow.withOpacity(0.5)
                                    : Colors.white.withOpacity(0.08),
                                width: 1.0,
                              ),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              dayLabel,
                              style: TextStyle(
                                fontFamily: 'Inter',
                                fontWeight: FontWeight.w800,
                                fontSize: 13,
                                color: isSelected
                                    ? AppColors.bg
                                    : AppColors.white,
                              ),
                            ),
                          ),
                        );
                      }),
                    ),
                    const SizedBox(height: 20),

                    // 2. Recovery Toggles (Only when rest toggled on)
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.02),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                            color: Colors.white.withOpacity(0.05), width: 1.0),
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  Icon(Icons.spa,
                                      color: isRestDay
                                          ? AppColors.green
                                          : AppColors.gray,
                                      size: 20),
                                  const SizedBox(width: 8),
                                  const Text(
                                    'Set as Rest Day',
                                    style: TextStyle(
                                      fontFamily: 'Inter',
                                      fontWeight: FontWeight.w700,
                                      fontSize: 13,
                                      color: AppColors.white,
                                    ),
                                  ),
                                ],
                              ),
                              Switch.adaptive(
                                value: isRestDay,
                                activeColor: AppColors.green,
                                onChanged: (value) {
                                  HapticFeedback.lightImpact();
                                  setModalState(() {
                                    tempWeeklyIsRest[selectedWeekday] = value;
                                  });
                                },
                              ),
                            ],
                          ),
                          if (isRestDay) ...[
                            const Divider(color: Colors.white10),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Icon(Icons.timer,
                                        color: restAfterThree
                                            ? AppColors.amber
                                            : AppColors.gray,
                                        size: 20),
                                    const SizedBox(width: 8),
                                    const Text(
                                      'Recovery (rest after 3 completed days)',
                                      style: TextStyle(
                                        fontFamily: 'Inter',
                                        fontWeight: FontWeight.w600,
                                        fontSize: 11,
                                        color: AppColors.white,
                                      ),
                                    ),
                                  ],
                                ),
                                Switch.adaptive(
                                  value: restAfterThree,
                                  activeColor: AppColors.amber,
                                  onChanged: (value) {
                                    HapticFeedback.lightImpact();
                                    setModalState(() {
                                      tempWeeklyRestAfterThree[selectedWeekday] = value;
                                    });
                                  },
                                ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Title: Exercises in plan
                    Text(
                      '${weekdayNames[selectedWeekday - 1].toUpperCase()}\'S TARGET LIST',
                      style: const TextStyle(
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.w800,
                        fontSize: 11,
                        color: AppColors.gray,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 10),

                    // Exercises list
                    if (isRestDay)
                      Container(
                        height: 90,
                        decoration: BoxDecoration(
                          color: AppColors.green.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                              color: AppColors.green.withOpacity(0.15)),
                        ),
                        alignment: Alignment.center,
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.spa,
                                color: AppColors.green, size: 24),
                            const SizedBox(height: 6),
                            Text(
                              restAfterThree
                                  ? 'Active Rest/Recovery Triggered'
                                  : 'Scheduled Rest Day',
                              style: const TextStyle(
                                fontFamily: 'Inter',
                                fontWeight: FontWeight.w700,
                                fontSize: 13,
                                color: AppColors.green,
                              ),
                            ),
                          ],
                        ),
                      )
                    else if (currentList.isEmpty)
                      Container(
                        height: 90,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.02),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                              color: Colors.white.withOpacity(0.04)),
                        ),
                        alignment: Alignment.center,
                        child: const Text(
                          'No exercises configured for this day.\nAdd workouts below.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontFamily: 'Inter',
                            color: AppColors.gray,
                            fontSize: 11,
                            height: 1.5,
                          ),
                        ),
                      )
                    else
                      Container(
                        constraints: const BoxConstraints(maxHeight: 180),
                        child: ListView.separated(
                          shrinkWrap: true,
                          itemCount: currentList.length,
                          separatorBuilder: (c, idx) =>
                              const SizedBox(height: 8),
                          itemBuilder: (c, idx) {
                            final ex = currentList[idx];
                            return Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 8),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.03),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                    color: Colors.white.withOpacity(0.05)),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    ex.isRest
                                        ? Icons.access_alarm
                                        : Icons.fitness_center,
                                    size: 16,
                                    color: ex.isRest
                                        ? AppColors.indigo
                                        : AppColors.blueGlow,
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          ex.name,
                                          style: const TextStyle(
                                            fontFamily: 'Inter',
                                            fontWeight: FontWeight.w700,
                                            fontSize: 13,
                                            color: AppColors.white,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          ex.isRest
                                              ? 'Duration: ${ex.setsRepsLabel} · Focus: ${ex.weightLabel}'
                                              : '${ex.setsRepsLabel} · ${ex.weightLabel}',
                                          style: const TextStyle(
                                            fontFamily: 'Inter',
                                            fontSize: 10,
                                            color: AppColors.gray,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.close,
                                        size: 16, color: AppColors.red),
                                    onPressed: () {
                                      setModalState(() {
                                        currentList.removeAt(idx);
                                        tempWeeklyExercises[selectedWeekday] = currentList;
                                      });
                                      HapticFeedback.lightImpact();
                                    },
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      ),

                    const SizedBox(height: 16),
                    const Divider(color: Colors.white10),
                    const SizedBox(height: 12),

                    // Form to Add Workout
                    if (!isRestDay) ...[
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            isAddingRest ? 'ADD REST INTERVAL' : 'ADD WORKOUT EXERCISE',
                            style: TextStyle(
                              fontFamily: 'Inter',
                              fontWeight: FontWeight.w800,
                              fontSize: 11,
                              color: isAddingRest ? AppColors.indigo : AppColors.blueGlow,
                              letterSpacing: 0.5,
                            ),
                          ),
                          Row(
                            children: [
                              const Text(
                                'Rest Interval',
                                style: TextStyle(
                                    fontFamily: 'Inter',
                                    fontWeight: FontWeight.w500,
                                    fontSize: 11,
                                    color: AppColors.gray),
                              ),
                              Switch.adaptive(
                                value: isAddingRest,
                                activeColor: AppColors.indigo,
                                onChanged: (value) {
                                  setModalState(() {
                                    isAddingRest = value;
                                  });
                                },
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Name Input
                      TextField(
                        controller: nameCtrl,
                        style: const TextStyle(color: AppColors.white),
                        textCapitalization: TextCapitalization.words,
                        decoration: InputDecoration(
                          hintText: isAddingRest ? 'e.g. Water Break' : 'e.g. Bench Press',
                          hintStyle: const TextStyle(color: Colors.white30),
                          labelText: isAddingRest ? 'Rest Interval Label' : 'Exercise Name',
                          labelStyle: const TextStyle(color: AppColors.gray),
                          filled: true,
                          fillColor: Colors.white.withOpacity(0.03),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),

                      if (isAddingRest) ...[
                        // Rest duration slider
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Rest Duration',
                              style: TextStyle(
                                fontFamily: 'Inter',
                                fontWeight: FontWeight.w600,
                                color: AppColors.white,
                                fontSize: 13,
                              ),
                            ),
                            Text(
                              '$restDurationMins minutes',
                              style: const TextStyle(
                                fontFamily: 'Inter',
                                fontWeight: FontWeight.w700,
                                color: AppColors.indigo,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                        Slider(
                          value: restDurationMins.toDouble(),
                          min: 1,
                          max: 20,
                          divisions: 19,
                          activeColor: AppColors.indigo,
                          inactiveColor: Colors.white12,
                          onChanged: (val) {
                            setModalState(() {
                              restDurationMins = val.toInt();
                            });
                          },
                        ),
                        const SizedBox(height: 12),
                      ] else ...[
                        // Post-determined mode selector
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          margin: const EdgeInsets.only(bottom: 12),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.02),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.white.withOpacity(0.04)),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  Icon(Icons.edit_note,
                                      color: isPostDetermined ? AppColors.blueGlow : AppColors.gray,
                                      size: 18),
                                  const SizedBox(width: 8),
                                  const Text(
                                    'Post-determined (Enter logs dynamically)',
                                    style: TextStyle(
                                      fontFamily: 'Inter',
                                      fontWeight: FontWeight.w600,
                                      fontSize: 12,
                                      color: AppColors.white,
                                    ),
                                  ),
                                ],
                              ),
                              Switch.adaptive(
                                value: isPostDetermined,
                                activeColor: AppColors.blueGlow,
                                onChanged: (value) {
                                  HapticFeedback.lightImpact();
                                  setModalState(() {
                                    isPostDetermined = value;
                                  });
                                },
                              ),
                            ],
                          ),
                        ),

                        // Sets / Reps selection row
                        if (!isPostDetermined) ...[
                          Row(
                            children: [
                              Expanded(
                                child: Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.02),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                        color: Colors.white.withOpacity(0.05)),
                                  ),
                                  child: Column(
                                    children: [
                                      const Text('SETS',
                                          style: TextStyle(
                                              fontFamily: 'Inter',
                                              fontSize: 9,
                                              color: AppColors.gray)),
                                      const SizedBox(height: 4),
                                      Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceEvenly,
                                        children: [
                                          IconButton(
                                            icon: const Icon(
                                                Icons.remove_circle_outline,
                                                color: Colors.white60),
                                            onPressed: () {
                                              if (sets > 1) {
                                                setModalState(() => sets--);
                                              }
                                            },
                                          ),
                                          Text('$sets',
                                              style: const TextStyle(
                                                  fontFamily: 'Inter',
                                                  fontWeight: FontWeight.w800,
                                                  color: AppColors.white,
                                                  fontSize: 16)),
                                          IconButton(
                                            icon: const Icon(
                                                Icons.add_circle_outline,
                                                color: Colors.white60),
                                            onPressed: () {
                                              setModalState(() => sets++);
                                            },
                                          ),
                                        ],
                                      )
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.02),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                        color: Colors.white.withOpacity(0.05)),
                                  ),
                                  child: Column(
                                    children: [
                                      const Text('REPS',
                                          style: TextStyle(
                                              fontFamily: 'Inter',
                                              fontSize: 9,
                                              color: AppColors.gray)),
                                      const SizedBox(height: 4),
                                      Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceEvenly,
                                        children: [
                                          IconButton(
                                            icon: const Icon(
                                                Icons.remove_circle_outline,
                                                color: Colors.white60),
                                            onPressed: () {
                                              if (reps > 1) {
                                                setModalState(() => reps--);
                                              }
                                            },
                                          ),
                                          Text('$reps',
                                              style: const TextStyle(
                                                  fontFamily: 'Inter',
                                                  fontWeight: FontWeight.w800,
                                                  color: AppColors.white,
                                                  fontSize: 16)),
                                          IconButton(
                                            icon: const Icon(
                                                Icons.add_circle_outline,
                                                color: Colors.white60),
                                            onPressed: () {
                                              setModalState(() => reps++);
                                            },
                                          ),
                                        ],
                                      )
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                        ],
                      ],

                      // Weight Input
                      TextField(
                        controller: weightCtrl,
                        style: const TextStyle(color: AppColors.white),
                        decoration: InputDecoration(
                          hintText: isAddingRest ? 'e.g. Hydrate' : 'e.g. 60 kg or Bodyweight',
                          hintStyle: const TextStyle(color: Colors.white30),
                          labelText: isAddingRest ? 'Rest Target Focus' : 'Weight/Intensity',
                          labelStyle: const TextStyle(color: AppColors.gray),
                          filled: true,
                          fillColor: Colors.white.withOpacity(0.03),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      OutlinedButton.icon(
                        onPressed: () {
                          if (isAddingRest) {
                            final name = nameCtrl.text.trim().isEmpty ? 'Rest Period' : nameCtrl.text.trim();
                            final focus = weightCtrl.text.trim().isEmpty ? 'Recovery' : weightCtrl.text.trim();
                            setModalState(() {
                              currentList.add(ExerciseLog(
                                name: name,
                                setsRepsLabel: '$restDurationMins mins',
                                weightLabel: focus,
                                completed: false,
                                isRest: true,
                                isPostDetermined: false,
                              ));
                              tempWeeklyExercises[selectedWeekday] = currentList;
                              nameCtrl.clear();
                              weightCtrl.clear();
                              restDurationMins = 5;
                            });
                          } else {
                            final name = nameCtrl.text.trim();
                            if (name.isEmpty) return;
                            final weight = weightCtrl.text.trim().isEmpty
                                ? 'Bodyweight'
                                : weightCtrl.text.trim();

                            setModalState(() {
                              currentList.add(ExerciseLog(
                                name: name,
                                setsRepsLabel: isPostDetermined ? 'Post-determined' : '$sets × $reps',
                                weightLabel: weight,
                                completed: false,
                                isRest: false,
                                isPostDetermined: isPostDetermined,
                              ));
                              tempWeeklyExercises[selectedWeekday] = currentList;
                              nameCtrl.clear();
                              weightCtrl.clear();
                              sets = 3;
                              reps = 10;
                              isPostDetermined = false;
                            });
                          }
                        },
                        icon: Icon(Icons.add, color: isAddingRest ? AppColors.indigo : AppColors.blueGlow),
                        label: const Text(
                          'ADD TO PLAN',
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontWeight: FontWeight.w800,
                            fontSize: 12,
                          ),
                        ),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: isAddingRest ? AppColors.indigo : AppColors.blueGlow,
                          side: BorderSide(
                              color: (isAddingRest ? AppColors.indigo : AppColors.blueGlow).withOpacity(0.4)),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],

                    ElevatedButton(
                      onPressed: () {
                        final updatedPlan = currentPlan.copyWith(
                          weeklyExercises: tempWeeklyExercises,
                          weeklyIsRest: tempWeeklyIsRest,
                          weeklyRestAfterThree: tempWeeklyRestAfterThree,
                        );
                        notifier.updateWorkoutPlan(updatedPlan);
                        // Commits switcher context immediately if editing the active one
                        if (selectedPlanId == ref.read(appStateProvider).activeWorkoutPlanId) {
                          notifier.switchWorkoutPlan(selectedPlanId);
                        }
                        Navigator.pop(context);
                        HapticFeedback.mediumImpact();
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Successfully saved workout plan "${updatedPlan.name}".'),
                            backgroundColor: AppColors.green,
                            duration: const Duration(seconds: 2),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.blueGlow,
                        foregroundColor: AppColors.bg,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: const Text(
                        'SAVE WORKOUT PLAN',
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      );
    },
  );
}

void _showCreatePlanDialog(BuildContext context, WidgetRef ref, Function(String) onCreated) {
  final controller = TextEditingController();
  showDialog(
    context: context,
    builder: (ctx) => AlertDialog(
      backgroundColor: AppColors.bgCard,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: Colors.white.withOpacity(0.08)),
      ),
      title: const Text('Create Workout Plan', style: TextStyle(color: Colors.white, fontFamily: 'Inter', fontWeight: FontWeight.w700)),
      content: TextField(
        controller: controller,
        style: const TextStyle(color: Colors.white, fontFamily: 'Inter'),
        decoration: InputDecoration(
          hintText: 'Plan name (e.g. Strength Training)',
          hintStyle: TextStyle(color: Colors.white.withOpacity(0.3)),
          enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Colors.white30)),
          focusedBorder: const UnderlineInputBorder(borderSide: BorderSide(color: AppColors.blueGlow)),
        ),
        autofocus: true,
        textCapitalization: TextCapitalization.words,
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx),
          child: const Text('Cancel', style: TextStyle(color: Colors.white70)),
        ),
        TextButton(
          onPressed: () {
            final name = controller.text.trim();
            if (name.isNotEmpty) {
              ref.read(appStateProvider.notifier).createWorkoutPlan(name);
              final plans = ref.read(appStateProvider).workoutPlans;
              if (plans.isNotEmpty) {
                onCreated(plans.last.id);
              }
            }
            Navigator.pop(ctx);
          },
          child: const Text('Create', style: TextStyle(color: AppColors.blueGlow, fontWeight: FontWeight.bold)),
        ),
      ],
    ),
  );
}

void _showRenamePlanDialog(BuildContext context, WidgetRef ref, WorkoutPlan plan) {
  final controller = TextEditingController(text: plan.name);
  showDialog(
    context: context,
    builder: (ctx) => AlertDialog(
      backgroundColor: AppColors.bgCard,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: Colors.white.withOpacity(0.08)),
      ),
      title: const Text('Rename Workout Plan', style: TextStyle(color: Colors.white, fontFamily: 'Inter', fontWeight: FontWeight.w700)),
      content: TextField(
        controller: controller,
        style: const TextStyle(color: Colors.white, fontFamily: 'Inter'),
        decoration: InputDecoration(
          hintStyle: TextStyle(color: Colors.white.withOpacity(0.3)),
          enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Colors.white30)),
          focusedBorder: const UnderlineInputBorder(borderSide: BorderSide(color: AppColors.blueGlow)),
        ),
        autofocus: true,
        textCapitalization: TextCapitalization.words,
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx),
          child: const Text('Cancel', style: TextStyle(color: Colors.white70)),
        ),
        TextButton(
          onPressed: () {
            final newName = controller.text.trim();
            if (newName.isNotEmpty) {
              ref.read(appStateProvider.notifier).updateWorkoutPlan(plan.copyWith(name: newName));
            }
            Navigator.pop(ctx);
          },
          child: const Text('Rename', style: TextStyle(color: AppColors.blueGlow, fontWeight: FontWeight.bold)),
        ),
      ],
    ),
  );
}

void _showDeletePlanDialog(BuildContext context, WidgetRef ref, String planId, VoidCallback onDelete) {
  showDialog(
    context: context,
    builder: (ctx) => AlertDialog(
      backgroundColor: AppColors.bgCard,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: Colors.white.withOpacity(0.08)),
      ),
      title: const Text('Delete Workout Plan?', style: TextStyle(color: Colors.white, fontFamily: 'Inter', fontWeight: FontWeight.w700)),
      content: const Text(
        'Are you sure you want to delete this workout plan? This action cannot be undone.',
        style: TextStyle(color: AppColors.gray, fontFamily: 'Inter', fontSize: 13, height: 1.4),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx),
          child: const Text('Cancel', style: TextStyle(color: Colors.white70)),
        ),
        TextButton(
          onPressed: () {
            ref.read(appStateProvider.notifier).deleteWorkoutPlan(planId);
            onDelete();
            Navigator.pop(ctx);
          },
          child: const Text('Delete', style: TextStyle(color: AppColors.red, fontWeight: FontWeight.bold)),
        ),
      ],
    ),
  );
}
