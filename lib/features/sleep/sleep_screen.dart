import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/motion.dart';
import '../../core/widgets/glass_card.dart';
import '../../data/providers/progress_provider.dart';

class SleepScreen extends ConsumerWidget {
  const SleepScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appState = ref.watch(appStateProvider);
    final notifier = ref.read(appStateProvider.notifier);
    final topPadding = MediaQuery.of(context).padding.top + 76.0;

    // Check if sleep log is loaded, otherwise use default values
    final sleepLog = appState.dailyProgress.sleep;
    final int durationMins = sleepLog?.durationMinutes ?? 0;
    final int qualityScore = sleepLog?.qualityScore ?? 0;
    
    final hours = durationMins ~/ 60;
    final mins = durationMins % 60;

    // Quality tier coloring
    Color scoreColor = AppColors.red;
    String qualityText = 'Poor sleep';
    if (qualityScore >= 80) {
      scoreColor = AppColors.green;
      qualityText = 'Good sleep';
    } else if (qualityScore >= 60) {
      scoreColor = AppColors.amber;
      qualityText = 'Moderate sleep';
    }

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      child: Padding(
        padding: EdgeInsets.fromLTRB(20.0, topPadding, 20.0, 100.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Title
            const Text(
              'SLEEP',
              style: TextStyle(
                fontFamily: 'Inter',
                fontWeight: FontWeight.w900,
                fontSize: 28,
                color: AppColors.white,
              ),
            ),
            const SizedBox(height: 24),

            // Large Duration & Score Card
            GestureDetector(
              onTap: () => _showSleepLogPicker(context, notifier, hasLog: durationMins > 0),
              onLongPress: () {
                if (durationMins > 0) {
                  HapticFeedback.mediumImpact();
                  _showClearSleepConfirmation(context, notifier);
                }
              },
              behavior: HitTestBehavior.opaque,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    durationMins > 0 ? '${hours}h ${mins}m' : 'No sleep data',
                    style: const TextStyle(
                      fontFamily: 'Inter',
                      fontWeight: FontWeight.w900,
                      fontSize: 48,
                      color: AppColors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(
                        durationMins > 0
                            ? '$qualityText · Quality score '
                            : 'Tap here to log today\'s sleep ',
                        style: const TextStyle(
                          fontFamily: 'Inter',
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                          color: AppColors.gray,
                        ),
                      ),
                      if (durationMins > 0)
                        Text(
                          '$qualityScore',
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                            color: scoreColor,
                          ),
                        )
                      else
                        const Icon(
                          Icons.edit_note,
                          color: AppColors.gray,
                          size: 18,
                        ),
                    ],
                  ),
                  if (durationMins > 0) ...[
                    const SizedBox(height: 6),
                    Row(
                      children: const [
                        Icon(Icons.touch_app_outlined, size: 12, color: AppColors.gray),
                        SizedBox(width: 4),
                        Text(
                          'Tap to edit · Tap & hold to clear record',
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontWeight: FontWeight.w500,
                            fontSize: 11,
                            color: AppColors.gray,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 32),

            // 1. Sleep Stages Segmented Bar
            if (durationMins > 0) ...[
              _buildSleepStagesBar(sleepLog),
              const SizedBox(height: 32),
            ],

            // 2. Weekly Trend Bar Chart
            _buildWeeklyTrendChart(appState),
            const SizedBox(height: 32),

            // 3. Next Bedtime Reminder Card
            _buildNextBedtimeCard(context, appState, notifier),
          ],
        ),
      ),
    );
  }

  // Sleep Stages Segmented Bar
  Widget _buildSleepStagesBar(dynamic sleepLog) {
    // Stage fractions: Deep 22%, REM 28%, Light 42%, Awake 8%
    final Map<String, double> stages = sleepLog?.stageFractions ?? {
      'deep': 0.22,
      'rem': 0.28,
      'light': 0.42,
      'awake': 0.08,
    };

    Widget buildSegment(Color color, double fraction, int index) {
      return Expanded(
        flex: (fraction * 100).round(),
        child: Container(
          height: 16,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
      )
      .animate()
      .scaleX(
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeOut,
        alignment: Alignment.centerLeft,
        delay: Duration(milliseconds: 80 * index),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Sleep Stages',
          style: TextStyle(
            fontFamily: 'Inter',
            fontWeight: FontWeight.w700,
            fontSize: 13,
            color: AppColors.gray,
          ),
        ),
        const SizedBox(height: 12),

        // Segmented Bar with 2px spacing
        Row(
          children: [
            buildSegment(AppColors.green, stages['deep'] ?? 0.22, 0),
            const SizedBox(width: 2),
            buildSegment(AppColors.blueGlow, stages['rem'] ?? 0.28, 1),
            const SizedBox(width: 2),
            buildSegment(AppColors.indigo, stages['light'] ?? 0.42, 2),
            const SizedBox(width: 2),
            buildSegment(AppColors.red, stages['awake'] ?? 0.08, 3),
          ],
        ),
        const SizedBox(height: 16),

        // Legend grid
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _buildLegendItem('Deep', '${(stages['deep']! * 100).toInt()}%', AppColors.green),
            _buildLegendItem('REM', '${(stages['rem']! * 100).toInt()}%', AppColors.blueGlow),
            _buildLegendItem('Light', '${(stages['light']! * 100).toInt()}%', AppColors.indigo),
            _buildLegendItem('Awake', '${(stages['awake']! * 100).toInt()}%', AppColors.red),
          ],
        ),
      ],
    );
  }

  Widget _buildLegendItem(String label, String value, Color color) {
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 6),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontFamily: 'Inter',
                fontWeight: FontWeight.w600,
                fontSize: 10,
                color: AppColors.gray,
              ),
            ),
            Text(
              value,
              style: const TextStyle(
                fontFamily: 'Inter',
                fontWeight: FontWeight.w700,
                fontSize: 12,
                color: AppColors.white,
              ),
            ),
          ],
        ),
      ],
    );
  }

  // Weekly Trend Bar Chart
  Widget _buildWeeklyTrendChart(AppState appState) {
    final List<double> durations = [];
    final List<String> dayLabels = [];
    final now = DateTime.now();

    for (int index = 0; index < 7; index++) {
      final date = now.subtract(Duration(days: 6 - index));
      dayLabels.add(_getWeekdayLabel(date.weekday));

      final log = (index < appState.historyLogs.length) ? appState.historyLogs[index] : null;
      if (log != null && log.sleep != null) {
        durations.add(log.sleep!.durationMinutes / 60.0);
      } else {
        durations.add(0.0);
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Weekly Duration Trend',
          style: TextStyle(
            fontFamily: 'Inter',
            fontWeight: FontWeight.w700,
            fontSize: 13,
            color: AppColors.gray,
          ),
        ),
        const SizedBox(height: 16),
        Container(
          height: 120,
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: List.generate(7, (index) {
              final isToday = index == 6;
              final duration = durations[index];
              final isShort = duration > 0.0 && duration < 7.0;

              // Color based on status: today is blueGlow, short sleep is amber, others indigo
              Color barColor = AppColors.indigo.withOpacity(0.6);
              if (isToday) {
                barColor = AppColors.blueGlow;
              } else if (isShort) {
                barColor = AppColors.amber;
              }

              // Compute height fraction relative to 10 hours max scale
              final double heightFraction = (duration / 10.0).clamp(0.0, 1.0);

              return Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    // Hour value text (shown only for today and short sleep)
                    if (duration > 0.0 && (isToday || isShort))
                      Text(
                        '${duration.toInt()}h',
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontWeight: FontWeight.w800,
                          fontSize: 9,
                          color: barColor,
                        ),
                      )
                    else
                      const Text('', style: TextStyle(fontSize: 9)),
                    const SizedBox(height: 4),

                    // Vertical Bar
                    Expanded(
                      child: duration > 0.0
                          ? FractionallySizedBox(
                              heightFactor: heightFraction,
                              alignment: Alignment.bottomCenter,
                              child: Container(
                                width: 14,
                                decoration: BoxDecoration(
                                  color: barColor,
                                  borderRadius: BorderRadius.circular(999),
                                ),
                              ),
                            )
                          : Container(
                              width: 14,
                              height: 4,
                              decoration: BoxDecoration(
                                color: Colors.white10,
                                borderRadius: BorderRadius.circular(999),
                              ),
                            ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      dayLabels[index],
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontWeight: isToday ? FontWeight.w700 : FontWeight.w500,
                        fontSize: 11,
                        color: isToday ? AppColors.white : AppColors.gray,
                      ),
                    ),
                  ],
                ),
              );
            }),
          ),
        ),
      ],
    );
  }

  String _getWeekdayLabel(int weekday) {
    switch (weekday) {
      case DateTime.monday: return 'M';
      case DateTime.tuesday: return 'T';
      case DateTime.wednesday: return 'W';
      case DateTime.thursday: return 'T';
      case DateTime.friday: return 'F';
      case DateTime.saturday: return 'S';
      case DateTime.sunday: return 'S';
      default: return '';
    }
  }

  // Next Bedtime Card
  Widget _buildNextBedtimeCard(BuildContext context, AppState appState, AppStateNotifier notifier) {
    final isEnabled = appState.isBedtimeReminderEnabled;

    return GlassCard(
      backgroundColor: isEnabled 
          ? AppColors.indigo.withOpacity(0.06) 
          : Colors.white.withOpacity(0.03),
      borderColor: isEnabled 
          ? AppColors.indigo.withOpacity(0.18) 
          : Colors.white10,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      onTap: () {
        HapticFeedback.lightImpact();
        _showBedtimeReminderPicker(context, appState, notifier);
      },
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: isEnabled ? Colors.white10 : Colors.white.withOpacity(0.05),
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Icon(
              isEnabled ? Icons.bedtime : Icons.bedtime_off_outlined,
              color: isEnabled ? AppColors.indigo : AppColors.gray,
              size: 20,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isEnabled 
                      ? 'Next bedtime: ${appState.bedtimeReminder}' 
                      : 'Bedtime reminder disabled',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.w800,
                    fontSize: 14,
                    color: isEnabled ? AppColors.white : AppColors.gray,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  isEnabled 
                      ? 'Keeps your recovery on track · Tap to edit' 
                      : 'Tap to configure & enable reminder',
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
          Icon(
            Icons.tune, 
            color: isEnabled ? AppColors.indigo : AppColors.gray, 
            size: 20,
          ),
        ],
      ),
    );
  }

  // Bedtime Reminder Settings Bottom Sheet
  void _showBedtimeReminderPicker(BuildContext context, AppState appState, AppStateNotifier notifier) {
    TimeOfDay selectedTime = _parseTimeOfDay(appState.bedtimeReminder);
    bool reminderEnabled = appState.isBedtimeReminderEnabled;

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.bgCardLight,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final formattedStr = _formatTimeOfDay(selectedTime);

            return Container(
              padding: const EdgeInsets.all(24),
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
                  const SizedBox(height: 20),
                  const Text(
                    'Bedtime Reminder Settings',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontWeight: FontWeight.w800,
                      fontSize: 18,
                      color: AppColors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Configure notifications to optimize recovery cycles.',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontWeight: FontWeight.w500,
                      fontSize: 12,
                      color: AppColors.gray,
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Toggle Switch Card
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: AppColors.bgCard,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white.withOpacity(0.08)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Icon(
                              reminderEnabled ? Icons.notifications_active_outlined : Icons.notifications_off_outlined,
                              color: reminderEnabled ? AppColors.indigo : AppColors.gray,
                              size: 22,
                            ),
                            const SizedBox(width: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Enable Reminder',
                                  style: TextStyle(
                                    fontFamily: 'Inter',
                                    fontWeight: FontWeight.w700,
                                    fontSize: 14,
                                    color: AppColors.white,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  reminderEnabled ? 'Daily alerts active' : 'Notifications disabled',
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
                        Switch.adaptive(
                          value: reminderEnabled,
                          activeColor: AppColors.indigo,
                          onChanged: (val) {
                            setModalState(() {
                              reminderEnabled = val;
                            });
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Interactive Time Selector Button (Disabled visually if reminder is off)
                  Opacity(
                    opacity: reminderEnabled ? 1.0 : 0.4,
                    child: IgnorePointer(
                      ignoring: !reminderEnabled,
                      child: InkWell(
                        onTap: () async {
                          final picked = await showTimePicker(
                            context: context,
                            initialTime: selectedTime,
                          );
                          if (picked != null) {
                            setModalState(() {
                              selectedTime = picked;
                            });
                          }
                        },
                        borderRadius: BorderRadius.circular(16),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                          decoration: BoxDecoration(
                            color: AppColors.indigo.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: AppColors.indigo.withOpacity(0.3),
                              width: 1.5,
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.access_time_rounded, color: AppColors.indigo, size: 24),
                                  const SizedBox(width: 12),
                                  const Text(
                                    'Target Bedtime',
                                    style: TextStyle(
                                      fontFamily: 'Inter',
                                      fontWeight: FontWeight.w600,
                                      fontSize: 14,
                                      color: AppColors.white,
                                    ),
                                  ),
                                ],
                              ),
                              Row(
                                children: [
                                  Text(
                                    formattedStr,
                                    style: const TextStyle(
                                      fontFamily: 'Inter',
                                      fontWeight: FontWeight.w900,
                                      fontSize: 20,
                                      color: AppColors.indigo,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  const Icon(Icons.edit, size: 16, color: AppColors.indigo),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 28),

                  ElevatedButton(
                    onPressed: () {
                      HapticFeedback.selectionClick();
                      final timeStr = _formatTimeOfDay(selectedTime);
                      notifier.updateBedtimeReminder(timeStr);
                      notifier.toggleBedtimeReminderEnabled(reminderEnabled);
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.indigo,
                      foregroundColor: AppColors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: const Text(
                      'Save Settings',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
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

  // Time parsing & formatting helpers
  TimeOfDay _parseTimeOfDay(String str) {
    try {
      final parts = str.trim().split(' ');
      if (parts.length == 2) {
        final timeParts = parts[0].split(':');
        int hour = int.parse(timeParts[0]);
        int minute = int.parse(timeParts[1]);
        final period = parts[1].toUpperCase();
        if (period == 'PM' && hour < 12) hour += 12;
        if (period == 'AM' && hour == 12) hour = 0;
        return TimeOfDay(hour: hour, minute: minute);
      }
    } catch (_) {}
    return const TimeOfDay(hour: 22, minute: 30);
  }

  String _formatTimeOfDay(TimeOfDay time) {
    final hour = time.hourOfPeriod == 0 ? 12 : time.hourOfPeriod;
    final minute = time.minute.toString().padLeft(2, '0');
    final period = time.period == DayPeriod.am ? 'AM' : 'PM';
    return '$hour:$minute $period';
  }

  void _showClearSleepConfirmation(BuildContext context, AppStateNotifier notifier) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.bgCardLight,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(24),
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
              const SizedBox(height: 20),
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppColors.red.withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: const Icon(
                      Icons.delete_outline,
                      color: AppColors.red,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Clear Sleep Record?',
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontWeight: FontWeight.w800,
                            fontSize: 18,
                            color: AppColors.white,
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'This will remove today\'s logged sleep session.',
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontWeight: FontWeight.w500,
                            fontSize: 12,
                            color: AppColors.gray,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 28),

              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.white,
                        side: const BorderSide(color: Colors.white24),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: const Text(
                        'Cancel',
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        notifier.clearSleep();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.red,
                        foregroundColor: AppColors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: const Text(
                        'Clear Record',
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
            ],
          ),
        );
      },
    );
  }

  void _showSleepLogPicker(BuildContext context, AppStateNotifier notifier, {bool hasLog = false}) {
    int calculateDurationMinutes(TimeOfDay bedtime, TimeOfDay wakeup) {
      int bedtimeMins = bedtime.hour * 60 + bedtime.minute;
      int wakeupMins = wakeup.hour * 60 + wakeup.minute;
      if (wakeupMins >= bedtimeMins) {
        return wakeupMins - bedtimeMins;
      } else {
        return (1440 - bedtimeMins) + wakeupMins;
      }
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.bgCardLight,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        int selectedHours = 8;
        int selectedQuality = 80;
        bool useTimes = false;
        TimeOfDay bedtime = const TimeOfDay(hour: 22, minute: 30);
        TimeOfDay wakeup = const TimeOfDay(hour: 6, minute: 30);

        return StatefulBuilder(
          builder: (context, setModalState) {
            return SafeArea(
              child: Padding(
                padding: EdgeInsets.only(
                  bottom: MediaQuery.of(context).viewInsets.bottom,
                ),
                child: SingleChildScrollView(
                  child: Container(
                    padding: const EdgeInsets.all(24),
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
                        const SizedBox(height: 20),
                        Text(
                          hasLog ? 'Edit Sleep Session' : 'Log Sleep Session',
                          style: const TextStyle(
                            fontFamily: 'Inter',
                            fontWeight: FontWeight.w800,
                            fontSize: 18,
                            color: AppColors.white,
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Mode Selector Toggle
                        Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: AppColors.bgCard,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: GestureDetector(
                                  onTap: () => setModalState(() => useTimes = false),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(vertical: 8),
                                    decoration: BoxDecoration(
                                      color: !useTimes ? AppColors.bgCardLight : Colors.transparent,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    alignment: Alignment.center,
                                    child: Text(
                                      'QUICK DURATION',
                                      style: TextStyle(
                                        fontFamily: 'Inter',
                                        fontWeight: FontWeight.w800,
                                        fontSize: 10,
                                        color: !useTimes ? AppColors.indigo : AppColors.gray,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              Expanded(
                                child: GestureDetector(
                                  onTap: () => setModalState(() => useTimes = true),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(vertical: 8),
                                    decoration: BoxDecoration(
                                      color: useTimes ? AppColors.bgCardLight : Colors.transparent,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    alignment: Alignment.center,
                                    child: Text(
                                      'CLOCK TIMES',
                                      style: TextStyle(
                                        fontFamily: 'Inter',
                                        fontWeight: FontWeight.w800,
                                        fontSize: 10,
                                        color: useTimes ? AppColors.indigo : AppColors.gray,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),

                        if (!useTimes) ...[
                          // Sleep Duration Slider
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Duration',
                                style: TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w700, color: AppColors.white),
                              ),
                              Text(
                                '$selectedHours hours',
                                style: const TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w800, color: AppColors.indigo),
                              ),
                            ],
                          ),
                          Slider(
                            value: selectedHours.toDouble(),
                            min: 4,
                            max: 12,
                            divisions: 8,
                            activeColor: AppColors.indigo,
                            inactiveColor: Colors.white10,
                            onChanged: (val) {
                              setModalState(() {
                                selectedHours = val.toInt();
                              });
                            },
                          ),
                        ] else ...[
                          // Clock Times Selectors
                          Row(
                            children: [
                              // Bedtime Button
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Bedtime',
                                      style: TextStyle(
                                        fontFamily: 'Inter',
                                        fontWeight: FontWeight.w700,
                                        fontSize: 12,
                                        color: AppColors.gray,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    InkWell(
                                      onTap: () async {
                                        final picked = await showTimePicker(
                                          context: context,
                                          initialTime: bedtime,
                                        );
                                        if (picked != null) {
                                          setModalState(() => bedtime = picked);
                                        }
                                      },
                                      borderRadius: BorderRadius.circular(12),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                                        decoration: BoxDecoration(
                                          color: AppColors.bgCard,
                                          borderRadius: BorderRadius.circular(12),
                                          border: Border.all(color: Colors.white.withOpacity(0.08)),
                                        ),
                                        child: Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            const Icon(Icons.bedtime, color: AppColors.indigo, size: 18),
                                            Text(
                                              bedtime.format(context),
                                              style: const TextStyle(
                                                fontFamily: 'Inter',
                                                fontWeight: FontWeight.w800,
                                                fontSize: 14,
                                                color: AppColors.white,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 16),
                              // Wake up Button
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Wake Up',
                                      style: TextStyle(
                                        fontFamily: 'Inter',
                                        fontWeight: FontWeight.w700,
                                        fontSize: 12,
                                        color: AppColors.gray,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    InkWell(
                                      onTap: () async {
                                        final picked = await showTimePicker(
                                          context: context,
                                          initialTime: wakeup,
                                        );
                                        if (picked != null) {
                                          setModalState(() => wakeup = picked);
                                        }
                                      },
                                      borderRadius: BorderRadius.circular(12),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                                        decoration: BoxDecoration(
                                          color: AppColors.bgCard,
                                          borderRadius: BorderRadius.circular(12),
                                          border: Border.all(color: Colors.white.withOpacity(0.08)),
                                        ),
                                        child: Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            const Icon(Icons.wb_sunny, color: AppColors.amber, size: 18),
                                            Text(
                                              wakeup.format(context),
                                              style: const TextStyle(
                                                fontFamily: 'Inter',
                                                fontWeight: FontWeight.w800,
                                                fontSize: 14,
                                                color: AppColors.white,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),
                          // Calculated Duration Display
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Calculated Duration',
                                style: TextStyle(
                                  fontFamily: 'Inter',
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.white,
                                ),
                              ),
                              Builder(
                                builder: (context) {
                                  int totalMins = calculateDurationMinutes(bedtime, wakeup);
                                  int hours = totalMins ~/ 60;
                                  int mins = totalMins % 60;
                                  String text = '${hours}h';
                                  if (mins > 0) text += ' ${mins}m';
                                  return Text(
                                    text,
                                    style: const TextStyle(
                                      fontFamily: 'Inter',
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.indigo,
                                    ),
                                  );
                                },
                              ),
                            ],
                          ),
                        ],
                        const SizedBox(height: 24),

                        // Sleep Quality Slider
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Quality Score',
                              style: TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w700, color: AppColors.white),
                            ),
                            Text(
                              '$selectedQuality%',
                              style: const TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w800, color: AppColors.indigo),
                            ),
                          ],
                        ),
                        Slider(
                          value: selectedQuality.toDouble(),
                          min: 30,
                          max: 100,
                          divisions: 70,
                          activeColor: AppColors.indigo,
                          inactiveColor: Colors.white10,
                          onChanged: (val) {
                            setModalState(() {
                              selectedQuality = val.toInt();
                            });
                          },
                        ),
                        const SizedBox(height: 24),

                        ElevatedButton(
                          onPressed: () {
                            HapticFeedback.selectionClick();
                            final finalDurationMins = useTimes 
                                ? calculateDurationMinutes(bedtime, wakeup) 
                                : selectedHours * 60;
                            notifier.logSleep(finalDurationMins, selectedQuality);
                            Navigator.pop(context);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.indigo,
                            foregroundColor: AppColors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          child: Text(
                            hasLog ? 'Update Sleep' : 'Log Sleep',
                            style: const TextStyle(
                              fontFamily: 'Inter',
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                            ),
                          ),
                        ),

                        if (hasLog) ...[
                          const SizedBox(height: 12),
                          TextButton.icon(
                            onPressed: () {
                              Navigator.pop(context);
                              notifier.clearSleep();
                            },
                            icon: const Icon(Icons.delete_outline, size: 18, color: AppColors.red),
                            label: const Text(
                              'Clear Today\'s Sleep Record',
                              style: TextStyle(
                                fontFamily: 'Inter',
                                fontWeight: FontWeight.w700,
                                fontSize: 13,
                                color: AppColors.red,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }
}
