import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart';
import '../../core/theme/colors.dart';
import '../../core/widgets/glass_card.dart';
import '../../data/providers/progress_provider.dart';
import '../../data/models/models.dart';
import 'workout_session_screen.dart';
import 'workout_plan_helper.dart';

class WorkoutScreen extends ConsumerWidget {
  const WorkoutScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appState = ref.watch(appStateProvider);
    final notifier = ref.read(appStateProvider.notifier);
    final topPadding = MediaQuery.of(context).padding.top + 76.0;

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      child: Padding(
        padding: EdgeInsets.fromLTRB(20.0, topPadding, 20.0, 100.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Title
            const Text(
              'WORKOUT',
              style: TextStyle(
                fontFamily: 'Inter',
                fontWeight: FontWeight.w900,
                fontSize: 28,
                color: AppColors.white,
              ),
            ),
            const SizedBox(height: 24),

            // 1. Readiness Card
            _buildReadinessCard(context, appState),
            const SizedBox(height: 16),

            // Global Logging Mode Selector
            _buildGlobalModeSwitcher(context, ref, appState),
            const SizedBox(height: 24),

            // Section Label
            const Text(
              'Exercises',
              style: TextStyle(
                fontFamily: 'Inter',
                fontWeight: FontWeight.w700,
                fontSize: 14,
                color: AppColors.gray,
              ),
            ),
            const SizedBox(height: 16),

            // 2. Exercise Checklist
            if (appState.dailyProgress.exercises.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 36),
                child: Column(
                  children: [
                    const Text(
                      'No exercises active today.',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.w500,
                        color: AppColors.gray,
                      ),
                    ),
                    const SizedBox(height: 16),
                    OutlinedButton.icon(
                      onPressed: () => showAddWorkoutPlanSheet(context, ref),
                      icon: const Icon(Icons.edit_note, color: AppColors.blueGlow, size: 18),
                      label: const Text(
                        'CONFIGURE WORKOUT PLAN',
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontWeight: FontWeight.w800,
                          fontSize: 12,
                          color: AppColors.blueGlow,
                        ),
                      ),
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: AppColors.blueGlow.withOpacity(0.4)),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      ),
                    ),
                  ],
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: appState.dailyProgress.exercises.length,
                separatorBuilder: (context, index) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final ex = appState.dailyProgress.exercises[index];
                  final isGlobalPost = appState.globalWorkoutMode == 'post-determined';
                  
                  final bool showDefaultBadge = !isGlobalPost && ex.isPostDetermined && !ex.hasCustomValues;
                  final String displaySetsReps = showDefaultBadge ? '1 × 10' : ex.setsRepsLabel;

                  return ExerciseCard(
                    exercise: ex,
                    index: index,
                    displaySetsReps: displaySetsReps,
                    showDefaultBadge: showDefaultBadge,
                    onEdit: (ex.isPostDetermined && !isGlobalPost) ? () {
                      _showEditExerciseVolumeDialog(context, ref, ex, index);
                    } : null,
                    onToggle: () {
                      if (isGlobalPost) {
                        if (!ex.completed) {
                          _showLogPostDeterminedDialog(context, ref, ex, index);
                        } else {
                          final resetEx = ex.copyWith(
                            completed: false, 
                            setsRepsLabel: ex.isPostDetermined ? 'Post-determined' : ex.setsRepsLabel,
                            hasCustomValues: ex.isPostDetermined ? false : ex.hasCustomValues,
                          );
                          final updatedExercises = List<ExerciseLog>.from(appState.dailyProgress.exercises);
                          updatedExercises[index] = resetEx;
                          notifier.updateExercises(updatedExercises);
                          HapticFeedback.selectionClick();
                        }
                      } else {
                        notifier.toggleExercise(ex.name);
                      }
                    },
                  );
                },
              ),
            const SizedBox(height: 36),

            // 3. Start Workout CTA Button
            SizedBox(
              height: 56, // 56px tall for sweaty/gloved hands
              child: ElevatedButton(
                onPressed: () {
                  HapticFeedback.lightImpact();
                  if (appState.dailyProgress.exercises.isEmpty) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('No active exercises found. Configure your plan first.'),
                        backgroundColor: AppColors.red,
                        duration: Duration(seconds: 2),
                      ),
                    );
                    showAddWorkoutPlanSheet(context, ref);
                    return;
                  }
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      fullscreenDialog: true,
                      builder: (context) => WorkoutSessionScreen(
                        exercises: appState.dailyProgress.exercises,
                        globalWorkoutMode: appState.globalWorkoutMode,
                        onCompleteWorkout: (completedList) {
                          final updatedProgress = appState.dailyProgress.copyWith(
                            exercises: completedList,
                          );
                          notifier.updateProgressDirectly(updatedProgress);
                        },
                      ),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.blueGlow,
                  foregroundColor: AppColors.bg,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 0,
                ),
                child: const Text(
                  'START WORKOUT SESSION',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.w800,
                    fontSize: 13,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReadinessCard(BuildContext context, AppState appState) {
    final sleepLog = appState.dailyProgress.sleep;
    final hasSleep = sleepLog != null;
    final readinessScore = sleepLog?.qualityScore ?? 0;

    Color scoreColor = AppColors.gray;
    String description = 'Log sleep data to calculate today\'s recovery capacity.';
    
    if (hasSleep) {
      if (readinessScore >= 80) {
        scoreColor = AppColors.green;
        description = 'Optimal recovery capacity. Ready for high intensity.';
      } else if (readinessScore >= 60) {
        scoreColor = AppColors.amber;
        description = 'Moderate recovery. Keep volumes matching targets.';
      } else {
        scoreColor = AppColors.red;
        description = 'Recovery low. Focus on lighter training or rest.';
      }
    }

    return GlassCard(
      backgroundColor: AppColors.indigo.withOpacity(0.04),
      borderColor: AppColors.indigo.withOpacity(0.12),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Row(
        children: [
          // Circular Readiness Ring Painter
          SizedBox(
            width: 48,
            height: 48,
            child: CustomPaint(
              painter: _ReadinessRingPainter(
                score: readinessScore,
                color: scoreColor,
                hasData: hasSleep,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Text(
                      'Readiness Score ',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                        color: AppColors.white,
                      ),
                    ),
                    Text(
                      hasSleep ? '$readinessScore' : '--',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                        color: scoreColor,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.w500,
                    fontSize: 11,
                    color: AppColors.gray,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGlobalModeSwitcher(BuildContext context, WidgetRef ref, AppState appState) {
    final mode = appState.globalWorkoutMode;
    final isPre = mode == 'pre-determined';

    return GlassCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      backgroundColor: Colors.white.withOpacity(0.02),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Global Logging Mode',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                    color: AppColors.white,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'Override logging mode for all exercises',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 11,
                    color: AppColors.gray,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Container(
            height: 32,
            padding: const EdgeInsets.all(2),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.04),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.white.withOpacity(0.08)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                GestureDetector(
                  onTap: () {
                    ref.read(appStateProvider.notifier).setGlobalWorkoutMode('pre-determined');
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    alignment: Alignment.center,
                    width: 56,
                    height: 28,
                    decoration: BoxDecoration(
                      color: isPre ? AppColors.green.withOpacity(0.12) : Colors.transparent,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: isPre ? AppColors.green : Colors.transparent,
                      ),
                    ),
                    child: Text(
                      'PRE',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.w800,
                        fontSize: 10,
                        color: isPre ? AppColors.green : AppColors.gray,
                      ),
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: () {
                    ref.read(appStateProvider.notifier).setGlobalWorkoutMode('post-determined');
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    alignment: Alignment.center,
                    width: 56,
                    height: 28,
                    decoration: BoxDecoration(
                      color: !isPre ? AppColors.amber.withOpacity(0.12) : Colors.transparent,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: !isPre ? AppColors.amber : Colors.transparent,
                      ),
                    ),
                    child: Text(
                      'POST',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.w800,
                        fontSize: 10,
                        color: !isPre ? AppColors.amber : AppColors.gray,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// Exercise Card with custom overshoot checkbox toggle animation
class ExerciseCard extends StatefulWidget {
  final ExerciseLog exercise;
  final int index;
  final String displaySetsReps;
  final bool showDefaultBadge;
  final VoidCallback? onEdit;
  final VoidCallback onToggle;

  const ExerciseCard({
    super.key,
    required this.exercise,
    required this.index,
    required this.displaySetsReps,
    required this.showDefaultBadge,
    this.onEdit,
    required this.onToggle,
  });

  @override
  State<ExerciseCard> createState() => _ExerciseCardState();
}

class _ExerciseCardState extends State<ExerciseCard> with SingleTickerProviderStateMixin {
  late AnimationController _checkController;
  late Animation<double> _checkScaleAnimation;

  @override
  void initState() {
    super.initState();
    _checkController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );

    // Apply variable reward schedule:
    // If the index hash matches (e.g. 3rd and 5th completed exercise, which we mock using index-based condition),
    // we trigger an overshoot bounce curve, otherwise standard easeOut.
    final bool useOvershoot = (widget.index == 2 || widget.index == 4);

    _checkScaleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _checkController,
        curve: useOvershoot ? Curves.easeOutBack : Curves.easeOut,
      ),
    );

    if (widget.exercise.completed) {
      _checkController.value = 1.0;
    }
  }

  @override
  void didUpdateWidget(covariant ExerciseCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.exercise.completed != oldWidget.exercise.completed) {
      if (widget.exercise.completed) {
        _checkController.forward();
      } else {
        _checkController.reverse();
      }
    }
  }

  @override
  void dispose() {
    _checkController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bool completed = widget.exercise.completed;
    final bool isRest = widget.exercise.isRest;
    final Color accentColor = isRest ? AppColors.indigo : AppColors.green;

    return GlassCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      borderColor: completed ? accentColor.withOpacity(0.2) : Colors.white.withOpacity(0.08),
      backgroundColor: completed ? accentColor.withOpacity(0.02) : Colors.white.withOpacity(0.04),
      onTap: widget.onToggle,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              // Checkbox with animation
              AnimatedBuilder(
                animation: _checkScaleAnimation,
                builder: (context, child) {
                  return Container(
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: completed ? accentColor : AppColors.grayDim,
                        width: 2.0,
                      ),
                      borderRadius: BorderRadius.circular(6),
                      color: completed ? accentColor.withOpacity(0.1) : Colors.transparent,
                    ),
                    alignment: Alignment.center,
                    child: Transform.scale(
                      scale: _checkScaleAnimation.value,
                      child: Icon(
                        isRest ? Icons.snooze : Icons.check,
                        size: 14,
                        color: accentColor,
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(width: 14),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        widget.exercise.name,
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                          color: completed ? AppColors.gray : AppColors.white,
                          decoration: completed ? TextDecoration.lineThrough : null,
                        ),
                      ),
                      if (isRest) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.indigo.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'RECOVERY',
                            style: TextStyle(
                              fontFamily: 'Inter',
                              fontWeight: FontWeight.w800,
                              fontSize: 9,
                              color: AppColors.indigo,
                            ),
                          ),
                        ),
                      ],
                      if (widget.showDefaultBadge) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.amber.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'Set count',
                            style: TextStyle(
                              fontFamily: 'Inter',
                              fontWeight: FontWeight.w800,
                              fontSize: 9,
                              color: AppColors.amber,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${widget.displaySetsReps} · ${widget.exercise.weightLabel}',
                    style: const TextStyle(
                      fontFamily: 'Inter',
                      fontWeight: FontWeight.w500,
                      fontSize: 11,
                      color: AppColors.gray,
                    ),
                  ),
                ],
              ),
            ],
          ),
          if (widget.onEdit != null)
            IconButton(
              icon: const Icon(Icons.edit_note, color: AppColors.gray, size: 20),
              onPressed: widget.onEdit,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            ),
        ],
      ),
    );
  }
}

// Custom Painter for circular Readiness Ring
class _ReadinessRingPainter extends CustomPainter {
  final int score;
  final Color color;
  final bool hasData;

  _ReadinessRingPainter({
    required this.score,
    required this.color,
    required this.hasData,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (min(size.width, size.height) / 2) - 3;
    const strokeWidth = 5.0;

    // Track
    final trackPaint = Paint()
      ..color = AppColors.bgCardLight
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;
    canvas.drawCircle(center, radius, trackPaint);

    if (hasData) {
      // Arc progress
      const startAngle = -pi / 2;
      final sweepAngle = 2 * pi * (score / 100);

      final progressPaint = Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round;

      // Draw glow
      final glowPaint = Paint()
        ..color = color.withOpacity(0.2)
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth * 1.8
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3);
      canvas.drawCircle(center, radius, glowPaint);

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        sweepAngle,
        false,
        progressPaint,
      );
    }

    // Score text
    final textPainter = TextPainter(
      text: TextSpan(
        text: hasData ? '$score' : '--',
        style: const TextStyle(
          fontFamily: 'Inter',
          fontWeight: FontWeight.w800,
          fontSize: 12,
          color: AppColors.white,
        ),
      ),
      textDirection: TextDirection.ltr,
    );
    textPainter.layout();
    textPainter.paint(
      canvas,
      Offset(
        center.dx - (textPainter.width / 2),
        center.dy - (textPainter.height / 2),
      ),
    );
  }

  @override
  bool shouldRepaint(covariant _ReadinessRingPainter oldDelegate) {
    return oldDelegate.score != score ||
        oldDelegate.color != color ||
        oldDelegate.hasData != hasData;
  }
}

void _showEditExerciseVolumeDialog(BuildContext context, WidgetRef ref, ExerciseLog exercise, int index) {
  final appState = ref.read(appStateProvider);
  final notifier = ref.read(appStateProvider.notifier);

  int sets = 1;
  int reps = 10;

  if (exercise.hasCustomValues && exercise.setsRepsLabel.contains('×')) {
    final parts = exercise.setsRepsLabel.split('×');
    sets = int.tryParse(parts[0].trim()) ?? 1;
    reps = int.tryParse(parts[1].trim()) ?? 10;
  }

  showModalBottomSheet(
    context: context,
    backgroundColor: AppColors.bgCardLight,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (context) {
      return StatefulBuilder(
        builder: (context, setModalState) {
          return Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
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
                Text(
                  'Edit ${exercise.name} Volume',
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.w800,
                    fontSize: 18,
                    color: AppColors.white,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Configure your custom sets and reps for this workout.',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 12,
                    color: AppColors.gray,
                  ),
                ),
                const SizedBox(height: 24),

                // Sets Selector
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Sets',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                        color: AppColors.white,
                      ),
                    ),
                    Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.remove, color: AppColors.white),
                          onPressed: () {
                            if (sets > 1) {
                              setModalState(() => sets--);
                            }
                          },
                        ),
                        Text(
                          '$sets',
                          style: const TextStyle(
                            fontFamily: 'Inter',
                            fontWeight: FontWeight.w800,
                            fontSize: 16,
                            color: AppColors.white,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.add, color: AppColors.white),
                          onPressed: () {
                            setModalState(() => sets++);
                          },
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Reps Selector
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Reps per Set',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                        color: AppColors.white,
                      ),
                    ),
                    Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.remove, color: AppColors.white),
                          onPressed: () {
                            if (reps > 1) {
                              setModalState(() => reps--);
                            }
                          },
                        ),
                        Text(
                          '$reps',
                          style: const TextStyle(
                            fontFamily: 'Inter',
                            fontWeight: FontWeight.w800,
                            fontSize: 16,
                            color: AppColors.white,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.add, color: AppColors.white),
                          onPressed: () {
                            setModalState(() => reps++);
                          },
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                ElevatedButton(
                  onPressed: () {
                    final updatedExercises = List<ExerciseLog>.from(appState.dailyProgress.exercises);
                    updatedExercises[index] = exercise.copyWith(
                      setsRepsLabel: '$sets × $reps',
                      hasCustomValues: true,
                    );
                    notifier.updateExercises(updatedExercises);
                    Navigator.pop(context);
                    HapticFeedback.mediumImpact();
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
                    'SAVE CHANGES',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontWeight: FontWeight.w800,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      );
    },
  );
}

void _showLogPostDeterminedDialog(BuildContext context, WidgetRef ref, ExerciseLog exercise, int index) {
  final appState = ref.read(appStateProvider);
  final notifier = ref.read(appStateProvider.notifier);

  int sets = 3;
  int reps = 10;

  showModalBottomSheet(
    context: context,
    backgroundColor: AppColors.bgCardLight,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (context) {
      return StatefulBuilder(
        builder: (context, setModalState) {
          return Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
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
                Text(
                  'Log ${exercise.name}',
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.w800,
                    fontSize: 18,
                    color: AppColors.white,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Enter the sets and reps you completed.',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 12,
                    color: AppColors.gray,
                  ),
                ),
                const SizedBox(height: 24),

                // Sets Selector
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Sets Completed',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                        color: AppColors.white,
                      ),
                    ),
                    Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.remove, color: AppColors.white),
                          onPressed: () {
                            if (sets > 1) {
                              setModalState(() => sets--);
                            }
                          },
                        ),
                        Text(
                          '$sets',
                          style: const TextStyle(
                            fontFamily: 'Inter',
                            fontWeight: FontWeight.w800,
                            fontSize: 16,
                            color: AppColors.white,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.add, color: AppColors.white),
                          onPressed: () {
                            setModalState(() => sets++);
                          },
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Reps Selector
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Reps per Set',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                        color: AppColors.white,
                      ),
                    ),
                    Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.remove, color: AppColors.white),
                          onPressed: () {
                            if (reps > 1) {
                              setModalState(() => reps--);
                            }
                          },
                        ),
                        Text(
                          '$reps',
                          style: const TextStyle(
                            fontFamily: 'Inter',
                            fontWeight: FontWeight.w800,
                            fontSize: 16,
                            color: AppColors.white,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.add, color: AppColors.white),
                          onPressed: () {
                            setModalState(() => reps++);
                          },
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                ElevatedButton(
                  onPressed: () {
                    final updatedExercises = List<ExerciseLog>.from(appState.dailyProgress.exercises);
                    updatedExercises[index] = exercise.copyWith(
                      completed: true,
                      setsRepsLabel: '$sets × $reps',
                    );
                    notifier.updateExercises(updatedExercises);
                    Navigator.pop(context);
                    HapticFeedback.mediumImpact();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.green,
                    foregroundColor: AppColors.bg,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text(
                    'LOG WORKOUT',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontWeight: FontWeight.w800,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      );
    },
  );
}
