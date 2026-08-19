import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/colors.dart';
import '../../data/models/models.dart';
import '../../data/providers/progress_provider.dart';

void showAddSleepPlanSheet(BuildContext context, WidgetRef ref) {
  final notifier = ref.read(appStateProvider.notifier);

  String selectedPlanId = ref.read(appStateProvider).activeSleepScheduleId;

  showModalBottomSheet(
    context: context,
    backgroundColor: AppColors.bgCardLight,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (context) {
      return StatefulBuilder(
        builder: (context, setModalState) {
          final appState = ref.watch(appStateProvider);
          final currentPlan = appState.sleepSchedules.firstWhere(
            (s) => s.id == selectedPlanId,
            orElse: () => appState.sleepSchedules.first,
          );

          return Padding(
            padding: EdgeInsets.only(
              left: 20,
              right: 20,
              top: 20,
              bottom: MediaQuery.of(context).viewInsets.bottom + 20,
            ),
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
                const Text(
                  'Configure Sleep Schedules',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.w800,
                    fontSize: 18,
                    color: AppColors.white,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Manage bedtime alerts and sleeping configurations.',
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
                                items: appState.sleepSchedules.map((plan) {
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
                          if (appState.sleepSchedules.length > 1)
                            TextButton.icon(
                              icon: const Icon(Icons.delete, size: 14, color: AppColors.red),
                              label: const Text('Delete', style: TextStyle(color: AppColors.red, fontSize: 11, fontWeight: FontWeight.w700)),
                              onPressed: () {
                                _showDeletePlanDialog(context, ref, selectedPlanId, () {
                                  setModalState(() {
                                    selectedPlanId = ref.read(appStateProvider).activeSleepScheduleId;
                                  });
                                });
                              },
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Bedtime Picker Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Bedtime Target Alert',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                        color: AppColors.white,
                      ),
                    ),
                    TextButton.icon(
                      icon: const Icon(Icons.access_time, size: 20, color: AppColors.indigo),
                      label: Text(
                        currentPlan.bedtime,
                        style: const TextStyle(
                          fontFamily: 'Inter',
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
                          color: AppColors.indigo,
                        ),
                      ),
                      onPressed: () async {
                        // Parse timeOfDay
                        final parts = currentPlan.bedtime.split(' ');
                        final timeParts = parts[0].split(':');
                        int hour = int.tryParse(timeParts[0]) ?? 10;
                        final int minute = int.tryParse(timeParts[1]) ?? 30;
                        if (parts.length > 1 && parts[1].toUpperCase() == 'PM' && hour < 12) {
                          hour += 12;
                        } else if (parts.length > 1 && parts[1].toUpperCase() == 'AM' && hour == 12) {
                          hour = 0;
                        }
                        
                        final TimeOfDay? picked = await showTimePicker(
                          context: context,
                          initialTime: TimeOfDay(hour: hour, minute: minute),
                        );
                        if (picked != null) {
                          final formattedTime = picked.format(context);
                          final updated = currentPlan.copyWith(bedtime: formattedTime);
                          notifier.updateSleepSchedule(updated);
                          setModalState(() {});
                        }
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Divider(color: Colors.white10),
                const SizedBox(height: 12),

                // Enabled Toggle
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Enable bedtime reminder',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                        color: AppColors.white,
                      ),
                    ),
                    Switch.adaptive(
                      value: currentPlan.isEnabled,
                      activeColor: AppColors.indigo,
                      onChanged: (value) {
                        final updated = currentPlan.copyWith(isEnabled: value);
                        notifier.updateSleepSchedule(updated);
                        setModalState(() {});
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                ElevatedButton(
                  onPressed: () {
                    // Commit active schedule
                    if (selectedPlanId == ref.read(appStateProvider).activeSleepScheduleId) {
                      notifier.switchSleepSchedule(selectedPlanId);
                    }
                    Navigator.pop(context);
                    HapticFeedback.mediumImpact();
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
                    'SAVE SLEEP SCHEDULE',
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
      title: const Text('Create Sleep Schedule', style: TextStyle(color: Colors.white, fontFamily: 'Inter', fontWeight: FontWeight.w700)),
      content: TextField(
        controller: controller,
        style: const TextStyle(color: Colors.white, fontFamily: 'Inter'),
        decoration: InputDecoration(
          hintText: 'Schedule name (e.g. Weekend Sleep)',
          hintStyle: TextStyle(color: Colors.white.withOpacity(0.3)),
          enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Colors.white30)),
          focusedBorder: const UnderlineInputBorder(borderSide: BorderSide(color: AppColors.indigo)),
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
              ref.read(appStateProvider.notifier).createSleepSchedule(name, '10:30 PM');
              final plans = ref.read(appStateProvider).sleepSchedules;
              if (plans.isNotEmpty) {
                onCreated(plans.last.id);
              }
            }
            Navigator.pop(ctx);
          },
          child: const Text('Create', style: TextStyle(color: AppColors.indigo, fontWeight: FontWeight.bold)),
        ),
      ],
    ),
  );
}

void _showRenamePlanDialog(BuildContext context, WidgetRef ref, SleepSchedule plan) {
  final controller = TextEditingController(text: plan.name);
  showDialog(
    context: context,
    builder: (ctx) => AlertDialog(
      backgroundColor: AppColors.bgCard,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: Colors.white.withOpacity(0.08)),
      ),
      title: const Text('Rename Sleep Schedule', style: TextStyle(color: Colors.white, fontFamily: 'Inter', fontWeight: FontWeight.w700)),
      content: TextField(
        controller: controller,
        style: const TextStyle(color: Colors.white, fontFamily: 'Inter'),
        decoration: InputDecoration(
          hintStyle: TextStyle(color: Colors.white.withOpacity(0.3)),
          enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Colors.white30)),
          focusedBorder: const UnderlineInputBorder(borderSide: BorderSide(color: AppColors.indigo)),
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
              ref.read(appStateProvider.notifier).updateSleepSchedule(plan.copyWith(name: newName));
            }
            Navigator.pop(ctx);
          },
          child: const Text('Rename', style: TextStyle(color: AppColors.indigo, fontWeight: FontWeight.bold)),
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
      title: const Text('Delete Sleep Schedule?', style: TextStyle(color: Colors.white, fontFamily: 'Inter', fontWeight: FontWeight.w700)),
      content: const Text(
        'Are you sure you want to delete this sleep schedule? This action cannot be undone.',
        style: TextStyle(color: AppColors.gray, fontFamily: 'Inter', fontSize: 13, height: 1.4),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx),
          child: const Text('Cancel', style: TextStyle(color: Colors.white70)),
        ),
        TextButton(
          onPressed: () {
            ref.read(appStateProvider.notifier).deleteSleepSchedule(planId);
            onDelete();
            Navigator.pop(ctx);
          },
          child: const Text('Delete', style: TextStyle(color: AppColors.red, fontWeight: FontWeight.bold)),
        ),
      ],
    ),
  );
}
