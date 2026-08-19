import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/colors.dart';
import '../../../core/widgets/glass_card.dart';
import '../../../data/models/models.dart';

class ActivityCalendarCard extends StatelessWidget {
  final Map<String, DailyProgress> allLogsMap;

  const ActivityCalendarCard({
    super.key,
    required this.allLogsMap,
  });

  @override
  Widget build(BuildContext context) {
    // Generate date range from earliest log or at least 16 weeks back up to today
    final now = DateTime.now();
    
    // Find earliest date key in allLogsMap
    DateTime startDate = now.subtract(const Duration(days: 16 * 7 - 1)); // Default ~16 weeks back
    if (allLogsMap.isNotEmpty) {
      final sortedKeys = allLogsMap.keys.toList()..sort();
      final earliestStr = sortedKeys.first;
      final parts = earliestStr.split('-');
      if (parts.length == 3) {
        final earliestDate = DateTime.tryParse(earliestStr);
        if (earliestDate != null && earliestDate.isBefore(startDate)) {
          startDate = earliestDate;
        }
      }
    }

    // Align startDate to the preceding Monday so rows 0..6 represent Mon..Sun
    final daysToSubtract = (startDate.weekday - DateTime.monday) % 7;
    final alignedStartDate = DateTime(startDate.year, startDate.month, startDate.day).subtract(Duration(days: daysToSubtract));
    final today = DateTime(now.year, now.month, now.day);

    // Calculate total days and number of full weeks up to today
    final totalDays = today.difference(alignedStartDate).inDays + 1;
    final numWeeks = ((totalDays + 6) ~/ 7).clamp(12, 104); // At least 12 weeks, scrollable up to 2 years

    // Count total active days (where momentum > 0)
    int activeDaysCount = 0;
    allLogsMap.forEach((key, log) {
      if (log.momentumFraction > 0) activeDaysCount++;
    });

    return GlassCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Header with Title & Legend
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: AppColors.green.withOpacity(0.12),
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: const Icon(
                      Icons.grid_on_rounded,
                      color: AppColors.green,
                      size: 16,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'ACTIVITY LOG',
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontWeight: FontWeight.w800,
                          fontSize: 12,
                          letterSpacing: 1.2,
                          color: AppColors.green,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '$activeDaysCount active days logged',
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

              // Color Intensity Legend (Less -> More)
              Row(
                children: [
                  const Text(
                    'Less',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 10,
                      color: AppColors.gray,
                    ),
                  ),
                  const SizedBox(width: 4),
                  _buildLegendTile(0.0),
                  const SizedBox(width: 3),
                  _buildLegendTile(0.2),
                  const SizedBox(width: 3),
                  _buildLegendTile(0.5),
                  const SizedBox(width: 3),
                  _buildLegendTile(0.9),
                  const SizedBox(width: 4),
                  const Text(
                    'More',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 10,
                      color: AppColors.gray,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),

          // 2. Heatmap Grid View
          SizedBox(
            height: 136, // Height for month labels + 7 weekday rows
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              reverse: true, // Start scrolled to the right (most recent/today)
              physics: const BouncingScrollPhysics(),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Weekday Row Labels (M, W, F)
                  Padding(
                    padding: const EdgeInsets.only(top: 22.0, right: 8.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text('M', style: TextStyle(fontSize: 9, color: AppColors.gray, fontFamily: 'Inter')),
                        SizedBox(height: 14),
                        Text('W', style: TextStyle(fontSize: 9, color: AppColors.gray, fontFamily: 'Inter')),
                        SizedBox(height: 14),
                        Text('F', style: TextStyle(fontSize: 9, color: AppColors.gray, fontFamily: 'Inter')),
                      ],
                    ),
                  ),

                  // Weeks Columns Grid
                  Row(
                    children: List.generate(numWeeks, (weekIndex) {
                      final weekStartDate = alignedStartDate.add(Duration(days: weekIndex * 7));
                      final monthName = _getMonthName(weekStartDate.month);
                      final showMonthLabel = (weekIndex == 0) || (weekStartDate.day <= 7);

                      return Padding(
                        padding: const EdgeInsets.only(right: 4.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Month Header Label above column
                            SizedBox(
                              height: 18,
                              width: 14,
                              child: showMonthLabel
                                  ? Text(
                                      monthName,
                                      style: const TextStyle(
                                        fontFamily: 'Inter',
                                        fontSize: 9,
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.gray,
                                      ),
                                    )
                                  : null,
                            ),
                            const SizedBox(height: 4),

                            // 7 Days of the Week (Mon - Sun)
                            Column(
                              children: List.generate(7, (dayOfWeekIndex) {
                                final dayDate = weekStartDate.add(Duration(days: dayOfWeekIndex));
                                final isFuture = dayDate.isAfter(today);
                                final isToday = _isSameDay(dayDate, today);
                                final key = _formatDateKey(dayDate);
                                final log = allLogsMap[key];
                                final momentum = log?.momentumFraction ?? 0.0;

                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 4.0),
                                  child: _buildDayTile(
                                    context: context,
                                    date: dayDate,
                                    momentum: momentum,
                                    isFuture: isFuture,
                                    isToday: isToday,
                                    log: log,
                                  ),
                                );
                              }),
                            ),
                          ],
                        ),
                      );
                    }),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Legend Tile
  Widget _buildLegendTile(double momentum) {
    return Container(
      width: 9,
      height: 9,
      decoration: BoxDecoration(
        color: _getTileColor(momentum, false),
        borderRadius: BorderRadius.circular(2),
        border: Border.all(
          color: _getTileBorderColor(momentum, false),
          width: 0.5,
        ),
      ),
    );
  }

  // Interactive Day Dot/Tile
  Widget _buildDayTile({
    required BuildContext context,
    required DateTime date,
    required double momentum,
    required bool isFuture,
    required bool isToday,
    required DailyProgress? log,
  }) {
    if (isFuture) {
      return Container(
        width: 12,
        height: 12,
        decoration: BoxDecoration(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(2.5),
        ),
      );
    }

    final tileColor = _getTileColor(momentum, isToday);
    final borderColor = _getTileBorderColor(momentum, isToday);

    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        _showDayDetailsModal(context, date, momentum, log);
      },
      child: Container(
        width: 12,
        height: 12,
        decoration: BoxDecoration(
          color: tileColor,
          borderRadius: BorderRadius.circular(2.5),
          border: Border.all(
            color: borderColor,
            width: isToday ? 1.2 : 0.5,
          ),
          boxShadow: (momentum >= 0.75)
              ? [
                  BoxShadow(
                    color: AppColors.green.withOpacity(0.35),
                    blurRadius: 3,
                    spreadRadius: 0.5,
                  ),
                ]
              : null,
        ),
      ),
    );
  }

  // Color Calculation
  Color _getTileColor(double momentum, bool isToday) {
    if (momentum <= 0.0) {
      return AppColors.grayDim.withOpacity(0.3);
    } else if (momentum < 0.35) {
      return AppColors.green.withOpacity(0.3);
    } else if (momentum < 0.75) {
      return AppColors.green.withOpacity(0.65);
    } else {
      return AppColors.green;
    }
  }

  Color _getTileBorderColor(double momentum, bool isToday) {
    if (isToday) {
      return AppColors.white;
    }
    if (momentum <= 0.0) {
      return Colors.white.withOpacity(0.05);
    }
    return AppColors.green.withOpacity(0.8);
  }

  // Day Details Modal Sheet
  void _showDayDetailsModal(
    BuildContext context,
    DateTime date,
    double momentum,
    DailyProgress? log,
  ) {
    final formattedDate = _formatFullDate(date);
    final momentumPct = (momentum * 100).toInt();

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
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle Bar
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

              // Title & Date
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        formattedDate,
                        style: const TextStyle(
                          fontFamily: 'Inter',
                          fontWeight: FontWeight.w800,
                          fontSize: 18,
                          color: AppColors.white,
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Daily Activity Summary',
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontWeight: FontWeight.w500,
                          fontSize: 12,
                          color: AppColors.gray,
                        ),
                      ),
                    ],
                  ),

                  // Momentum Badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.green.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: AppColors.green.withOpacity(0.3),
                      ),
                    ),
                    child: Text(
                      '$momentumPct% Momentum',
                      style: const TextStyle(
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.w800,
                        fontSize: 12,
                        color: AppColors.green,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Details Cards
              if (log == null || momentum <= 0.0) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.04),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Center(
                    child: Text(
                      'No activity recorded on this day.',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        color: AppColors.gray,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ),
              ] else ...[
                _buildDetailRow(
                  icon: Icons.water_drop,
                  color: AppColors.blueGlow,
                  label: 'Water Intake',
                  value: '${log.waterMl} / ${log.waterTargetMl} ml',
                ),
                const SizedBox(height: 12),
                _buildDetailRow(
                  icon: Icons.restaurant,
                  color: AppColors.amber,
                  label: 'Nutrition',
                  value: log.calorieTarget != null ? '${log.caloriesConsumed} / ${log.calorieTarget} kcal' : '${log.caloriesConsumed} kcal',
                ),
                const SizedBox(height: 12),
                _buildDetailRow(
                  icon: Icons.fitness_center,
                  color: AppColors.green,
                  label: 'Workouts',
                  value: '${log.exercises.where((e) => e.completed).length} of ${log.exercises.length} completed',
                ),
                if (log.sleep != null) ...[
                  const SizedBox(height: 12),
                  _buildDetailRow(
                    icon: Icons.bedtime,
                    color: AppColors.purple,
                    label: 'Sleep',
                    value: '${log.sleep!.durationMinutes ~/ 60}h ${log.sleep!.durationMinutes % 60}m (Quality: ${log.sleep!.qualityScore}/100)',
                  ),
                ],
              ],
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDetailRow({
    required IconData icon,
    required Color color,
    required String label,
    required String value,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.06),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: color.withOpacity(0.15),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 18),
              const SizedBox(width: 10),
              Text(
                label,
                style: const TextStyle(
                  fontFamily: 'Inter',
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                  color: AppColors.white,
                ),
              ),
            ],
          ),
          Text(
            value,
            style: TextStyle(
              fontFamily: 'Inter',
              fontWeight: FontWeight.w700,
              fontSize: 13,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  // Helpers
  String _formatDateKey(DateTime d) {
    return "${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}";
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  String _getMonthName(int month) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[(month - 1) % 12];
  }

  String _formatFullDate(DateTime date) {
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final weekday = weekdays[date.weekday - 1];
    final month = months[date.month - 1];
    return '$weekday, $month ${date.day}, ${date.year}';
  }
}
