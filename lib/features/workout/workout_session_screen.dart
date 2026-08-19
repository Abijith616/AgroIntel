import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme/colors.dart';
import '../../core/widgets/glass_card.dart';
import '../../data/models/models.dart';

class WorkoutSessionScreen extends StatefulWidget {
  final List<ExerciseLog> exercises;
  final String globalWorkoutMode;
  final Function(List<ExerciseLog>) onCompleteWorkout;

  const WorkoutSessionScreen({
    super.key,
    required this.exercises,
    required this.globalWorkoutMode,
    required this.onCompleteWorkout,
  });

  @override
  State<WorkoutSessionScreen> createState() => _WorkoutSessionScreenState();
}

class _WorkoutSessionScreenState extends State<WorkoutSessionScreen> {
  int _currentExerciseIndex = 0;
  int _currentSet = 1;
  int _totalSets = 4;

  // Post-determined input values during workout session
  int _postSets = 3;
  int _postReps = 10;

  // Rest Timer State
  bool _isResting = false;
  int _restTimeRemaining = 60;
  final int _restTimeTotal = 60;
  Timer? _restTimer;

  // Exercise state clones
  late List<ExerciseLog> _sessionExercises;

  @override
  void initState() {
    super.initState();
    _sessionExercises = List.from(widget.exercises);
    // Parse sets from setsRepsLabel (e.g. "4 × 8" -> 4 sets)
    _updateTotalSetsForCurrentExercise();
  }

  @override
  void dispose() {
    _restTimer?.cancel();
    super.dispose();
  }

  void _updateTotalSetsForCurrentExercise() {
    if (_currentExerciseIndex < _sessionExercises.length) {
      final ex = _sessionExercises[_currentExerciseIndex];
      if (ex.isRest) {
        _totalSets = 1;
        return;
      }
      final bool rendersAsPost = widget.globalWorkoutMode == 'post-determined';
      if (rendersAsPost) {
        _postSets = 3;
        _postReps = 10;
        _totalSets = 1;
        return;
      }
      if (ex.isPostDetermined && !ex.hasCustomValues) {
        _totalSets = 1;
        return;
      }
      final label = ex.setsRepsLabel;
      final parts = label.split('×');
      if (parts.isNotEmpty) {
        _totalSets = int.tryParse(parts[0].trim()) ?? 4;
      }
    }
  }

  void _onCompletePostDeterminedExercise() {
    HapticFeedback.mediumImpact();
    setState(() {
      _sessionExercises[_currentExerciseIndex] = _sessionExercises[_currentExerciseIndex].copyWith(
        completed: true,
        setsRepsLabel: '$_postSets × $_postReps',
        hasCustomValues: true,
      );
    });

    // Move to next exercise
    if (_currentExerciseIndex < _sessionExercises.length - 1) {
      setState(() {
        _currentExerciseIndex++;
        _currentSet = 1;
      });
      _updateTotalSetsForCurrentExercise();
      _startRestTimer();
    } else {
      // Workout complete!
      _finishWorkout();
    }
  }

  void _startRestTimer() {
    _restTimer?.cancel();
    setState(() {
      _isResting = true;
      _restTimeRemaining = _restTimeTotal;
    });

    _restTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_restTimeRemaining > 1) {
        setState(() {
          _restTimeRemaining--;
        });
      } else {
        _stopRestTimer();
        // Haptic pulse alert when rest completes
        HapticFeedback.mediumImpact();
      }
    });
  }

  void _stopRestTimer() {
    _restTimer?.cancel();
    setState(() {
      _isResting = false;
    });
  }

  void _onCompleteSet() {
    HapticFeedback.lightImpact();
    if (_currentSet < _totalSets) {
      setState(() {
        _currentSet++;
      });
      _startRestTimer();
    } else {
      // Mark current exercise as complete in our session list
      setState(() {
        _sessionExercises[_currentExerciseIndex] = _sessionExercises[_currentExerciseIndex].copyWith(completed: true);
      });

      // Move to next exercise
      if (_currentExerciseIndex < _sessionExercises.length - 1) {
        setState(() {
          _currentExerciseIndex++;
          _currentSet = 1;
        });
        _updateTotalSetsForCurrentExercise();
        _startRestTimer();
      } else {
        // Workout complete!
        _finishWorkout();
      }
    }
  }

  void _finishWorkout() {
    // Mark remaining exercises as complete
    final completedList = _sessionExercises.map((ex) => ex.copyWith(completed: true)).toList();
    widget.onCompleteWorkout(completedList);
    HapticFeedback.mediumImpact();
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    if (_currentExerciseIndex >= _sessionExercises.length) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final currentExercise = _sessionExercises[_currentExerciseIndex];

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: AppColors.white, size: 28),
          onPressed: () {
            HapticFeedback.selectionClick();
            Navigator.pop(context);
          },
        ),
        title: const Text(
          'WORKOUT SESSION',
          style: TextStyle(
            fontFamily: 'Inter',
            fontWeight: FontWeight.w800,
            fontSize: 14,
            letterSpacing: 1.5,
            color: AppColors.gray,
          ),
        ),
        actions: [
          TextButton(
            onPressed: _finishWorkout,
            child: const Text(
              'FINISH',
              style: TextStyle(
                fontFamily: 'Inter',
                fontWeight: FontWeight.w800,
                color: AppColors.green,
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 1. Progress Indicator
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Exercise ${_currentExerciseIndex + 1} of ${_sessionExercises.length}',
                    style: const TextStyle(
                      fontFamily: 'Inter',
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                      color: AppColors.gray,
                    ),
                  ),
                  Text(
                    (widget.globalWorkoutMode == 'post-determined')
                        ? 'Post-determined Mode'
                        : 'Set $_currentSet of $_totalSets',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                      color: (widget.globalWorkoutMode == 'post-determined') ? AppColors.amber : AppColors.blueGlow,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: SizedBox(
                  height: 4,
                  child: LinearProgressIndicator(
                    value: (_currentExerciseIndex + ((widget.globalWorkoutMode == 'post-determined') ? 1.0 : (_currentSet / _totalSets))) / _sessionExercises.length,
                    backgroundColor: AppColors.bgCard,
                    color: AppColors.blueGlow,
                  ),
                ),
              ),
              const Spacer(),

              // 2. Main Timer / Focus Zone
              if (_isResting)
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'REST TIMER',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.w800,
                        fontSize: 12,
                        letterSpacing: 2.0,
                        color: AppColors.green,
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: 180,
                      height: 180,
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          CustomPaint(
                            size: const Size(180, 180),
                            painter: _TimerRingPainter(
                              progress: _restTimeRemaining / _restTimeTotal,
                            ),
                          ),
                          Text(
                            '0:${_restTimeRemaining.toString().padLeft(2, '0')}',
                            style: const TextStyle(
                              fontFamily: 'Inter',
                              fontWeight: FontWeight.w900,
                              fontSize: 48,
                              color: AppColors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextButton(
                      onPressed: _stopRestTimer,
                      style: TextButton.styleFrom(
                        foregroundColor: AppColors.red,
                      ),
                      child: const Text(
                        'SKIP REST',
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                          letterSpacing: 1.0,
                        ),
                      ),
                    ),
                  ],
                )
              else
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      currentExercise.name.toUpperCase(),
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.w900,
                        fontSize: 32,
                        color: AppColors.white,
                      ),
                    ),
                    const SizedBox(height: 16),
                    if (widget.globalWorkoutMode == 'post-determined') ...[
                      const Text(
                        'LOG COMPLETED WORKOUT VOLUME',
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontWeight: FontWeight.w800,
                          fontSize: 11,
                          letterSpacing: 1.0,
                          color: AppColors.amber,
                        ),
                      ),
                      const SizedBox(height: 12),
                      GlassCard(
                        backgroundColor: Colors.white.withOpacity(0.02),
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                        child: Column(
                          children: [
                            // Sets Input Selector
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'Sets Done',
                                  style: TextStyle(
                                    fontFamily: 'Inter',
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.white,
                                  ),
                                ),
                                Row(
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.remove, color: AppColors.white),
                                      onPressed: () {
                                        if (_postSets > 1) {
                                          setState(() => _postSets--);
                                        }
                                      },
                                    ),
                                    Text(
                                      '$_postSets',
                                      style: const TextStyle(
                                        fontFamily: 'Inter',
                                        fontWeight: FontWeight.w800,
                                        fontSize: 18,
                                        color: AppColors.white,
                                      ),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.add, color: AppColors.white),
                                      onPressed: () {
                                        setState(() => _postSets++);
                                      },
                                    ),
                                  ],
                                ),
                              ],
                            ),
                            const Divider(color: Colors.white10),
                            // Reps Input Selector
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'Reps Done',
                                  style: TextStyle(
                                    fontFamily: 'Inter',
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.white,
                                  ),
                                ),
                                Row(
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.remove, color: AppColors.white),
                                      onPressed: () {
                                        if (_postReps > 1) {
                                          setState(() => _postReps--);
                                        }
                                      },
                                    ),
                                    Text(
                                      '$_postReps',
                                      style: const TextStyle(
                                        fontFamily: 'Inter',
                                        fontWeight: FontWeight.w800,
                                        fontSize: 18,
                                        color: AppColors.white,
                                      ),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.add, color: AppColors.white),
                                      onPressed: () {
                                        setState(() => _postReps++);
                                      },
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ] else ...[
                      GlassCard(
                        backgroundColor: Colors.white.withOpacity(0.02),
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                            Column(
                              children: [
                                Text(
                                  currentExercise.isRest ? 'DURATION' : 'WEIGHT',
                                  style: const TextStyle(
                                    fontFamily: 'Inter',
                                    fontWeight: FontWeight.w600,
                                    fontSize: 11,
                                    color: AppColors.gray,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  currentExercise.isRest ? currentExercise.setsRepsLabel : currentExercise.weightLabel,
                                  style: const TextStyle(
                                    fontFamily: 'Inter',
                                    fontWeight: FontWeight.w800,
                                    fontSize: 22,
                                    color: AppColors.white,
                                  ),
                                ),
                              ],
                            ),
                            Container(width: 1, height: 40, color: Colors.white12),
                            Column(
                              children: [
                                Text(
                                  currentExercise.isRest ? 'TYPE' : 'REPS',
                                  style: const TextStyle(
                                    fontFamily: 'Inter',
                                    fontWeight: FontWeight.w600,
                                    fontSize: 11,
                                    color: AppColors.gray,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  currentExercise.isRest
                                      ? currentExercise.weightLabel
                                      : (currentExercise.isPostDetermined && !currentExercise.hasCustomValues
                                          ? '10'
                                          : (currentExercise.setsRepsLabel.contains('×')
                                              ? currentExercise.setsRepsLabel.split('×').last.trim()
                                              : currentExercise.setsRepsLabel)),
                                  style: const TextStyle(
                                    fontFamily: 'Inter',
                                    fontWeight: FontWeight.w800,
                                    fontSize: 22,
                                    color: AppColors.white,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),

              const Spacer(),

              // 3. CTA Action Button (56px tall for gloved/sweaty hands)
              SizedBox(
                height: 56,
                child: ElevatedButton(
                  onPressed: (widget.globalWorkoutMode == 'post-determined') ? _onCompletePostDeterminedExercise : _onCompleteSet,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _isResting
                        ? AppColors.bgCardLight
                        : ((widget.globalWorkoutMode == 'post-determined') ? AppColors.amber : AppColors.blueGlow),
                    foregroundColor: _isResting ? AppColors.white : AppColors.bg,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: Text(
                    _isResting
                        ? 'RESTING... TAP TO FORCE NEXT SET'
                        : ((widget.globalWorkoutMode == 'post-determined')
                            ? 'LOG EXERCISE & CONTINUE'
                            : (_currentSet == _totalSets
                                ? 'COMPLETE FINAL SET & LOG'
                                : 'COMPLETE SET $_currentSet')),
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                      letterSpacing: 0.5,
                      color: _isResting ? AppColors.gray : AppColors.bg,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TimerRingPainter extends CustomPainter {
  final double progress;

  _TimerRingPainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (min(size.width, size.height) / 2) - 4;
    const strokeWidth = 8.0;

    final trackPaint = Paint()
      ..color = AppColors.bgCardLight
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;
    canvas.drawCircle(center, radius, trackPaint);

    const startAngle = -pi / 2;
    final sweepAngle = 2 * pi * progress;

    if (progress > 0.0) {
      final progressPaint = Paint()
        ..color = AppColors.green
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round;

      // Glow
      final glowPaint = Paint()
        ..color = AppColors.green.withOpacity(0.2)
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth * 1.8
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4);
      canvas.drawCircle(center, radius, glowPaint);

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        sweepAngle,
        false,
        progressPaint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _TimerRingPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}
