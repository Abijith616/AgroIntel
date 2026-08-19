import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/colors.dart';
import '../../data/models/models.dart';
import '../../data/providers/progress_provider.dart';

void showAddDietPlanSheet(BuildContext context, WidgetRef ref, {int? initialEditIndex}) {
  final notifier = ref.read(appStateProvider.notifier);

  // Keep track of edited state
  String selectedPlanId = ref.read(appStateProvider).activeDietPlanId;
  final appState = ref.read(appStateProvider);
  final initialPlan = appState.dietPlans.firstWhere(
    (p) => p.id == selectedPlanId,
    orElse: () => appState.dietPlans.first,
  );
  List<Meal> editList = List.from(initialPlan.meals);

  final TextEditingController nameCtrl = TextEditingController();
  final TextEditingController kcalCtrl = TextEditingController();
  TimeOfDay selectedTime = const TimeOfDay(hour: 8, minute: 0);
  int? editingIndex = initialEditIndex;

  if (initialEditIndex != null && initialEditIndex >= 0 && initialEditIndex < editList.length) {
    final meal = editList[initialEditIndex];
    nameCtrl.text = meal.name;
    kcalCtrl.text = (meal.kcal ?? 300).toString();
    selectedTime = TimeOfDay(hour: meal.time.hour, minute: meal.time.minute);
  }

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
          final currentPlan = ref.watch(appStateProvider).dietPlans.firstWhere(
                (p) => p.id == selectedPlanId,
                orElse: () => ref.watch(appStateProvider).dietPlans.first,
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
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Configure Diet Plan',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.w800,
                        fontSize: 18,
                        color: AppColors.white,
                      ),
                    ),
                    if (editList.isNotEmpty)
                      TextButton.icon(
                        style: TextButton.styleFrom(
                          foregroundColor: AppColors.red,
                        ),
                        icon: const Icon(Icons.delete_sweep, size: 18),
                        label: const Text(
                          'Clear All',
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontWeight: FontWeight.w700,
                            fontSize: 11,
                          ),
                        ),
                        onPressed: () {
                          showDialog(
                            context: context,
                            builder: (BuildContext context) {
                              return AlertDialog(
                                backgroundColor: AppColors.bgCardLight,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(20),
                                  side: BorderSide(
                                      color: Colors.white.withOpacity(0.08),
                                      width: 1.0),
                                ),
                                title: const Text(
                                  'Clear All Meals?',
                                  style: TextStyle(
                                    fontFamily: 'Inter',
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.white,
                                  ),
                                ),
                                content: const Text(
                                  'Are you sure you want to clear all meals from this plan?',
                                  style: TextStyle(
                                    fontFamily: 'Inter',
                                    fontWeight: FontWeight.w500,
                                    fontSize: 13,
                                    color: AppColors.gray,
                                  ),
                                ),
                                actions: [
                                  TextButton(
                                    onPressed: () => Navigator.pop(context),
                                    child: const Text(
                                      'Cancel',
                                      style: TextStyle(
                                        fontFamily: 'Inter',
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.gray,
                                      ),
                                    ),
                                  ),
                                  TextButton(
                                    onPressed: () {
                                      Navigator.pop(context);
                                      setModalState(() {
                                        editList.clear();
                                        editingIndex = null;
                                        nameCtrl.clear();
                                        kcalCtrl.clear();
                                      });
                                      HapticFeedback.heavyImpact();
                                    },
                                    child: const Text(
                                      'Clear',
                                      style: TextStyle(
                                        fontFamily: 'Inter',
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.red,
                                      ),
                                    ),
                                  ),
                                ],
                              );
                            },
                          );
                        },
                      ),
                  ],
                ),
                const SizedBox(height: 12),

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
                                items: ref.watch(appStateProvider).dietPlans.map((plan) {
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
                                      final selectedPlan = ref.read(appStateProvider).dietPlans.firstWhere((p) => p.id == newVal);
                                      editList = List.from(selectedPlan.meals);
                                      editingIndex = null;
                                      nameCtrl.clear();
                                      kcalCtrl.clear();
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
                                  final selectedPlan = ref.read(appStateProvider).dietPlans.firstWhere((p) => p.id == newId);
                                  editList = List.from(selectedPlan.meals);
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
                          if (ref.watch(appStateProvider).dietPlans.length > 1)
                            TextButton.icon(
                              icon: const Icon(Icons.delete, size: 14, color: AppColors.red),
                              label: const Text('Delete', style: TextStyle(color: AppColors.red, fontSize: 11, fontWeight: FontWeight.w700)),
                              onPressed: () {
                                _showDeletePlanDialog(context, ref, selectedPlanId, () {
                                  setModalState(() {
                                    selectedPlanId = ref.read(appStateProvider).activeDietPlanId;
                                    final selectedPlan = ref.read(appStateProvider).dietPlans.firstWhere((p) => p.id == selectedPlanId);
                                    editList = List.from(selectedPlan.meals);
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

                // Predefined list preview
                if (editList.isEmpty)
                  Container(
                    height: 120,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.02),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white.withOpacity(0.04)),
                    ),
                    alignment: Alignment.center,
                    child: const Text(
                      'No meals configured for this plan.\nAdd meal slots below.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontFamily: 'Inter',
                        color: AppColors.gray,
                        fontSize: 12,
                        height: 1.5,
                      ),
                    ),
                  )
                else
                  Container(
                    constraints: const BoxConstraints(maxHeight: 180),
                    child: ListView.separated(
                      shrinkWrap: true,
                      itemCount: editList.length,
                      separatorBuilder: (c, idx) => const SizedBox(height: 8),
                      itemBuilder: (c, idx) {
                        final meal = editList[idx];
                        final isEditingThis = editingIndex == idx;

                        return Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: isEditingThis
                                ? AppColors.amber.withOpacity(0.08)
                                : Colors.white.withOpacity(0.03),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isEditingThis
                                  ? AppColors.amber.withOpacity(0.3)
                                  : Colors.white.withOpacity(0.05),
                            ),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: AppColors.green,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      meal.name,
                                      style: const TextStyle(
                                        fontFamily: 'Inter',
                                        fontWeight: FontWeight.w700,
                                        fontSize: 13,
                                        color: AppColors.white,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      '${TimeOfDay(hour: meal.time.hour, minute: meal.time.minute).format(context)} · ${meal.kcal} kcal',
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
                                icon: const Icon(Icons.edit,
                                    size: 16, color: AppColors.amber),
                                onPressed: () {
                                  setModalState(() {
                                    editingIndex = idx;
                                    nameCtrl.text = meal.name;
                                    kcalCtrl.text = meal.kcal.toString();
                                    selectedTime = TimeOfDay(
                                        hour: meal.time.hour,
                                        minute: meal.time.minute);
                                  });
                                },
                              ),
                              IconButton(
                                icon: const Icon(Icons.close,
                                    size: 16, color: AppColors.red),
                                onPressed: () {
                                  setModalState(() {
                                    editList.removeAt(idx);
                                    if (editingIndex == idx) {
                                      editingIndex = null;
                                      nameCtrl.clear();
                                      kcalCtrl.clear();
                                    } else if (editingIndex != null &&
                                        editingIndex! > idx) {
                                      editingIndex = editingIndex! - 1;
                                    }
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

                // Meal form inputs
                Text(
                  editingIndex != null ? 'EDIT MEAL SLOT' : 'ADD NEW MEAL SLOT',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.w800,
                    fontSize: 11,
                    color: editingIndex != null ? AppColors.amber : AppColors.blueGlow,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 12),

                TextField(
                  controller: nameCtrl,
                  style: const TextStyle(color: Colors.white, fontSize: 13, fontFamily: 'Inter'),
                  textCapitalization: TextCapitalization.words,
                  decoration: InputDecoration(
                    labelText: 'Meal Name',
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

                TextField(
                  controller: kcalCtrl,
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  style: const TextStyle(color: Colors.white, fontSize: 13, fontFamily: 'Inter'),
                  decoration: InputDecoration(
                    labelText: 'Calories (kcal)',
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

                // Time Slot Selector
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Target Time',
                      style: TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w600, color: AppColors.white),
                    ),
                    TextButton.icon(
                      icon: Icon(Icons.access_time, size: 18, color: editingIndex != null ? AppColors.amber : AppColors.blueGlow),
                      label: Text(
                        selectedTime.format(context),
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontWeight: FontWeight.w700,
                          color: editingIndex != null ? AppColors.amber : AppColors.blueGlow,
                        ),
                      ),
                      onPressed: () async {
                        final TimeOfDay? picked = await showTimePicker(
                          context: context,
                          initialTime: selectedTime,
                        );
                        if (picked != null) {
                          setModalState(() {
                            selectedTime = picked;
                          });
                        }
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                OutlinedButton.icon(
                  onPressed: () {
                    final name = nameCtrl.text.trim();
                    if (name.isEmpty) return;
                    final kcal = int.tryParse(kcalCtrl.text) ?? 300;
                    
                    final templateTime = DateTime(2026, 1, 1, selectedTime.hour, selectedTime.minute);

                    setModalState(() {
                      if (editingIndex != null) {
                        editList[editingIndex!] = editList[editingIndex!].copyWith(
                          name: name,
                          kcal: kcal,
                          time: templateTime,
                        );
                        editingIndex = null;
                      } else {
                        editList.add(Meal(
                          id: 'predefined_${DateTime.now().millisecondsSinceEpoch}',
                          time: templateTime,
                          name: name,
                          kcal: kcal,
                          estimated: false,
                          loggedOnTheFly: false,
                          eaten: false,
                        ));
                      }
                      nameCtrl.clear();
                      kcalCtrl.clear();
                    });
                  },
                  icon: Icon(Icons.save, color: editingIndex != null ? AppColors.amber : AppColors.blueGlow),
                  label: Text(
                    editingIndex != null ? 'UPDATE MEAL SLOT' : 'ADD TO PLAN TEMPLATE',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontWeight: FontWeight.w800,
                      fontSize: 12,
                      color: editingIndex != null ? AppColors.amber : AppColors.blueGlow,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: (editingIndex != null ? AppColors.amber : AppColors.blueGlow).withOpacity(0.4)),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
                const SizedBox(height: 24),

                ElevatedButton(
                  onPressed: () {
                    final updatedPlan = currentPlan.copyWith(meals: editList);
                    notifier.updateDietPlan(updatedPlan);
                    // Also trigger sync to active log if selectedPlan is the active one
                    if (selectedPlanId == ref.read(appStateProvider).activeDietPlanId) {
                      notifier.switchDietPlan(selectedPlanId);
                    }
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
                    'SAVE DIET PLAN TEMPLATE',
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
      title: const Text('Create Diet Plan', style: TextStyle(color: Colors.white, fontFamily: 'Inter', fontWeight: FontWeight.w700)),
      content: TextField(
        controller: controller,
        style: const TextStyle(color: Colors.white, fontFamily: 'Inter'),
        decoration: InputDecoration(
          hintText: 'Plan name (e.g. Bulk Diet)',
          hintStyle: TextStyle(color: Colors.white.withOpacity(0.3)),
          enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Colors.white30)),
          focusedBorder: const UnderlineInputBorder(borderSide: BorderSide(color: AppColors.green)),
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
              ref.read(appStateProvider.notifier).createDietPlan(name);
              // Wait a split second to fetch the generated last item
              final plans = ref.read(appStateProvider).dietPlans;
              if (plans.isNotEmpty) {
                onCreated(plans.last.id);
              }
            }
            Navigator.pop(ctx);
          },
          child: const Text('Create', style: TextStyle(color: AppColors.green, fontWeight: FontWeight.bold)),
        ),
      ],
    ),
  );
}

void _showRenamePlanDialog(BuildContext context, WidgetRef ref, DietPlan plan) {
  final controller = TextEditingController(text: plan.name);
  showDialog(
    context: context,
    builder: (ctx) => AlertDialog(
      backgroundColor: AppColors.bgCard,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: Colors.white.withOpacity(0.08)),
      ),
      title: const Text('Rename Diet Plan', style: TextStyle(color: Colors.white, fontFamily: 'Inter', fontWeight: FontWeight.w700)),
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
              ref.read(appStateProvider.notifier).updateDietPlan(plan.copyWith(name: newName));
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
      title: const Text('Delete Diet Plan?', style: TextStyle(color: Colors.white, fontFamily: 'Inter', fontWeight: FontWeight.w700)),
      content: const Text(
        'Are you sure you want to delete this diet plan? This action cannot be undone.',
        style: TextStyle(color: AppColors.gray, fontFamily: 'Inter', fontSize: 13, height: 1.4),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx),
          child: const Text('Cancel', style: TextStyle(color: Colors.white70)),
        ),
        TextButton(
          onPressed: () {
            ref.read(appStateProvider.notifier).deleteDietPlan(planId);
            onDelete();
            Navigator.pop(ctx);
          },
          child: const Text('Delete', style: TextStyle(color: AppColors.red, fontWeight: FontWeight.bold)),
        ),
      ],
    ),
  );
}
