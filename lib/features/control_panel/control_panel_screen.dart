import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/motion.dart';
import '../../core/widgets/glass_card.dart';
import '../../core/widgets/momentum_ring.dart';
import '../../core/widgets/mini_ring.dart';
import '../../data/providers/progress_provider.dart';
import 'widgets/activity_calendar_card.dart';

class ControlPanelScreen extends ConsumerWidget {
  final Function(int)? onNavigateToPage;

  const ControlPanelScreen({super.key, this.onNavigateToPage});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appState = ref.watch(appStateProvider);
    final notifier = ref.read(appStateProvider.notifier);

    // Padding helper to clear the fixed top bar overlay
    final topPadding = MediaQuery.of(context).padding.top + 76.0;

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      child: Padding(
        padding: EdgeInsets.fromLTRB(20.0, topPadding, 20.0, 100.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // 1. Title
            const Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'CONTROL PANEL',
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontWeight: FontWeight.w900,
                  fontSize: 28,
                  letterSpacing: 0.5,
                  color: AppColors.white,
                ),
              ),
            ),
            const SizedBox(height: 32),

            // 2. Central Momentum Ring
            MomentumRing(progress: appState.dailyProgress.momentumFraction),
            const SizedBox(height: 48),

            // 3. Weekly Strip
            _buildWeeklyStrip(appState),
            const SizedBox(height: 32),

            // 4. Water Tracker Card
            _buildWaterCard(context, appState, notifier),
            const SizedBox(height: 16),

            // 5. Next Up Card
            _buildNextUpCard(context, appState),
            const SizedBox(height: 16),

            // 6. GitHub Activity Heatmap Calendar Card
            ActivityCalendarCard(allLogsMap: appState.allLogsMap),
          ],
        ),
      ),
    );
  }

  // Weekly mini-rings strip
  Widget _buildWeeklyStrip(AppState appState) {
    final List<String> dayLabels = [];
    final now = DateTime.now();
    for (int i = 6; i >= 0; i--) {
      final date = now.subtract(Duration(days: i));
      dayLabels.add(_getWeekdayLabel(date.weekday));
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'This Week',
          style: TextStyle(
            fontFamily: 'Inter',
            fontWeight: FontWeight.w700,
            fontSize: 13,
            color: AppColors.gray,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(7, (index) {
            final log = (index < appState.historyLogs.length) ? appState.historyLogs[index] : null;
            final progress = log?.momentumFraction ?? 0.0;
            return MiniRing(
              progress: progress,
              label: dayLabels[index],
              isToday: index == 6,
            );
          }),
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

  // Water Card builder
  Widget _buildWaterCard(
    BuildContext context,
    AppState appState,
    AppStateNotifier notifier,
  ) {
    return GlassCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.blueGlow.withOpacity(0.12),
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: const Icon(
                  Icons.water_drop,
                  color: AppColors.blueGlow,
                  size: 20,
                ),
              ),
              const SizedBox(width: 14),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Animated count-up text
                  TweenAnimationBuilder<double>(
                    tween: Tween<double>(
                      begin: 0.0,
                      end: appState.dailyProgress.waterMl.toDouble(),
                    ),
                    duration: AppMotion.countUp,
                    builder: (context, value, child) {
                      return RichText(
                        text: TextSpan(
                          style: const TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 15,
                            color: AppColors.white,
                          ),
                          children: [
                            TextSpan(
                              text: '${value.toInt()}',
                              style: const TextStyle(fontWeight: FontWeight.w800),
                            ),
                            TextSpan(
                              text: ' / ${appState.dailyProgress.waterTargetMl} ml',
                              style: const TextStyle(
                                fontWeight: FontWeight.w500,
                                color: AppColors.gray,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'Tap to log a glass',
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
          ),

          // Log Actions: Plus & Minus
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Minus Button
              GestureDetector(
                onTap: () => notifier.logWater(-appState.defaultWaterVolume),
                child: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: AppColors.blueGlow.withOpacity(0.06),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: AppColors.blueGlow.withOpacity(0.15),
                      width: 1.0,
                    ),
                  ),
                  alignment: Alignment.center,
                  child: Icon(
                    Icons.remove,
                    color: AppColors.blueGlow.withOpacity(0.7),
                    size: 20,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // Plus Button
              GestureDetector(
                onTap: () => notifier.logWater(),
                onLongPress: () {
                  HapticFeedback.selectionClick();
                  _showWaterSizePicker(context, appState, notifier);
                },
                child: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: AppColors.blueGlow.withOpacity(0.15),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: AppColors.blueGlow.withOpacity(0.3),
                      width: 1.0,
                    ),
                  ),
                  alignment: Alignment.center,
                  child: const Icon(
                    Icons.add,
                    color: AppColors.blueGlow,
                    size: 20,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // Water Size Picker Bottom Sheet
  void _showWaterSizePicker(
    BuildContext context,
    AppState appState,
    AppStateNotifier notifier,
  ) {
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
              // Grabber Handle
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
                'Select Container Size',
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontWeight: FontWeight.w800,
                  fontSize: 18,
                  color: AppColors.white,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Long-pressing the plus logs your default size.',
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontWeight: FontWeight.w500,
                  fontSize: 12,
                  color: AppColors.gray,
                ),
              ),
              const SizedBox(height: 20),

              // Options
              _buildWaterOption(context, 'Small Glass (200ml)', 200, appState, notifier),
              _buildWaterOption(context, 'Standard Bottle (500ml)', 500, appState, notifier),
              _buildWaterOption(context, 'Large Bottle (1000ml)', 1000, appState, notifier),

              const SizedBox(height: 12),
              // Custom input row
              Row(
                children: [
                  const Expanded(
                    child: Text(
                      'Custom volume...',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                        color: AppColors.white,
                      ),
                    ),
                  ),
                  SizedBox(
                    width: 100,
                    child: TextField(
                      keyboardType: TextInputType.number,
                      textAlign: TextAlign.right,
                      decoration: const InputDecoration(
                        hintText: 'ml',
                        suffixText: ' ml',
                        border: InputBorder.none,
                      ),
                      onSubmitted: (value) {
                        Navigator.pop(context);
                        final ml = int.tryParse(value);
                        if (ml != null && ml > 0) {
                          notifier.logWater(ml);
                        }
                      },
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildWaterOption(
    BuildContext context,
    String label,
    int ml,
    AppState appState,
    AppStateNotifier notifier,
  ) {
    final isDefault = appState.defaultWaterVolume == ml;

    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(
        label,
        style: TextStyle(
          fontFamily: 'Inter',
          fontWeight: isDefault ? FontWeight.w700 : FontWeight.w500,
          fontSize: 14,
          color: isDefault ? AppColors.blueGlow : AppColors.white,
        ),
      ),
      trailing: isDefault
          ? const Icon(Icons.check, color: AppColors.blueGlow, size: 20)
          : null,
      onTap: () {
        Navigator.pop(context);
        notifier.updateDefaultWaterVolume(ml);
        notifier.logWater(ml);
      },
    );
  }

  // Next Up Card builder
  Widget _buildNextUpCard(BuildContext context, AppState appState) {
    final hasWorkouts = appState.dailyProgress.exercises.isNotEmpty;
    final remainingCount = appState.dailyProgress.exercises.where((e) => !e.completed).length;

    return GlassCard(
      backgroundColor: AppColors.green.withOpacity(0.04),
      borderColor: AppColors.green.withOpacity(0.15),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      onTap: () {
        if (onNavigateToPage != null) {
          // Slide to Workout page (index 2)
          onNavigateToPage!(2);
          HapticFeedback.lightImpact();
        }
      },
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'NEXT UP',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.w700,
                    fontSize: 10,
                    letterSpacing: 1.5,
                    color: AppColors.green,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  hasWorkouts
                      ? (remainingCount > 0
                          ? '$remainingCount exercises remaining'
                          : 'Workout completed!')
                      : 'No active workout plan',
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                    color: AppColors.white,
                  ),
                ),
              ],
            ),
          ),
          const Icon(
            Icons.chevron_right,
            color: AppColors.green,
            size: 24,
          ),
        ],
      ),
    );
  }
}
