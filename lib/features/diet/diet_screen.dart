import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/motion.dart';
import '../../core/widgets/glass_card.dart';
import '../../core/widgets/calorie_ring.dart';
import '../../data/providers/progress_provider.dart';
import '../../data/models/models.dart';
import 'diet_plan_helper.dart';

class DietScreen extends ConsumerStatefulWidget {
  const DietScreen({super.key});

  @override
  ConsumerState<DietScreen> createState() => _DietScreenState();
}

class _DietScreenState extends ConsumerState<DietScreen> {
  // Quick add input controllers
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _kcalController = TextEditingController();
  bool _autoEstimate = false;

  @override
  void dispose() {
    _nameController.dispose();
    _kcalController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
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
            // Title Header & Mode Switcher
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: const Text(
                      'DIET PANEL',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.w900,
                        fontSize: 28,
                        color: AppColors.white,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                _buildModeToggle(appState, notifier),
              ],
            ),
            const SizedBox(height: 32),

            // Calorie Ring & Macro Bars row
            Row(
              children: [
                Expanded(
                  flex: 1,
                  child: Center(
                    child: CalorieRing(
                      consumed: appState.dailyProgress.caloriesConsumed,
                      target: appState.dailyProgress.calorieTarget,
                    ),
                  ),
                ),
                const SizedBox(width: 20),
                Expanded(
                  flex: 1,
                  child: _buildMacrosPanel(appState),
                ),
              ],
            ),
            const SizedBox(height: 36),

            if (appState.dailyProgress.customModeDiet) ...[
              ElevatedButton.icon(
                onPressed: () => _showQuickAddSheet(context, notifier),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.amber.withOpacity(0.15),
                  foregroundColor: AppColors.amber,
                  side: BorderSide(color: AppColors.amber.withOpacity(0.3), width: 1.0),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                icon: const Icon(Icons.add, size: 20),
                label: const Text(
                  'QUICK ADD MEAL',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.w800,
                    fontSize: 13,
                    letterSpacing: 1.0,
                  ),
                ),
              ),
              const SizedBox(height: 28),
            ],

            // Predefined checklists
            const Text(
              'Meal Log Checklist',
              style: TextStyle(
                fontFamily: 'Inter',
                fontWeight: FontWeight.w800,
                fontSize: 14,
                color: AppColors.white,
              ),
            ),
            const SizedBox(height: 12),
            _buildChecklist(appState, notifier),
          ],
        ),
      ),
    );
  }

  // Predefined/Custom toggle button
  Widget _buildModeToggle(AppState appState, AppStateNotifier notifier) {
    final customActive = appState.dailyProgress.customModeDiet;

    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppColors.bgCard,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildToggleOption('PREDEFINED', !customActive, () {
            if (customActive) notifier.toggleCustomModeDiet(false);
          }),
          _buildToggleOption('CUSTOM', customActive, () {
            if (!customActive) notifier.toggleCustomModeDiet(true);
          }),
        ],
      ),
    );
  }

  Widget _buildToggleOption(String label, bool active, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: active ? AppColors.bgCardLight : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontFamily: 'Inter',
            fontWeight: FontWeight.w800,
            fontSize: 10,
            letterSpacing: 1.0,
            color: active ? AppColors.amber : AppColors.gray,
          ),
        ),
      ),
    );
  }

  // Macros panel displaying total values
  Widget _buildMacrosPanel(AppState appState) {
    final Map<String, double> macros = appState.dailyProgress.macrosConsumed;
    final int protein = (macros['protein'] ?? 0.0).toInt();
    final int carbs = (macros['carbs'] ?? 0.0).toInt();
    final int fat = (macros['fat'] ?? 0.0).toInt();

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildMacroRow('PROTEIN', '${protein}g', AppColors.blueGlow),
        const SizedBox(height: 10),
        _buildMacroRow('CARBS', '${carbs}g', AppColors.amber),
        const SizedBox(height: 10),
        _buildMacroRow('FAT', '${fat}g', AppColors.purple),
      ],
    );
  }

  Widget _buildMacroRow(String label, String valueLabel, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.bgCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.04)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(
                  color: color,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                label,
                style: const TextStyle(
                  fontFamily: 'Inter',
                  fontWeight: FontWeight.w700,
                  fontSize: 10,
                  letterSpacing: 1.0,
                  color: AppColors.gray,
                ),
              ),
            ],
          ),
          Text(
            valueLabel,
            style: const TextStyle(
              fontFamily: 'Inter',
              fontWeight: FontWeight.w800,
              fontSize: 12,
              color: AppColors.white,
            ),
          ),
        ],
      ),
    );
  }

  // Meal Checklist cards
  Widget _buildChecklist(AppState appState, AppStateNotifier notifier) {
    final customMode = appState.dailyProgress.customModeDiet;
    final meals = appState.dailyProgress.meals.where((m) => m.loggedOnTheFly == customMode).toList();

    if (meals.isEmpty) {
      if (!customMode) {
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 36),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'No predefined diet plan added.',
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                  color: AppColors.gray,
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () => showAddDietPlanSheet(context, ref),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.amber,
                  foregroundColor: AppColors.bg,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                icon: const Icon(Icons.settings, size: 18),
                label: const Text(
                  'CONFIGURE DIET PLAN',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.w800,
                    fontSize: 12,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ],
          ),
        );
      }

      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 36),
        child: Center(
          child: Text(
            'No custom meals logged yet today.',
            style: TextStyle(
              fontFamily: 'Inter',
              fontWeight: FontWeight.w500,
              color: AppColors.gray,
            ),
          ),
        ),
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: meals.length,
      itemBuilder: (context, index) {
        final meal = meals[index];
        final formattedTime = '${meal.time.hour.toString().padLeft(2, '0')}:${meal.time.minute.toString().padLeft(2, '0')}';

        return GestureDetector(
          onLongPress: () {
            if (customMode) {
              _showCustomMealOptions(context, meal, notifier);
            } else {
              final templatePlan = notifier.getPredefinedDietPlan();
              final templateIndex = templatePlan.indexWhere((m) =>
                  m.name == meal.name &&
                  m.time.hour == meal.time.hour &&
                  m.time.minute == meal.time.minute);
              if (templateIndex != -1) {
                showAddDietPlanSheet(context, ref, initialEditIndex: templateIndex);
              } else {
                showAddDietPlanSheet(context, ref);
              }
            }
          },
          child: AnimatedContainer(
            duration: AppMotion.cardFlash,
            margin: const EdgeInsets.only(bottom: 12),
            child: GlassCard(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              backgroundColor: meal.eaten
                  ? AppColors.amber.withOpacity(0.04)
                  : Colors.white.withOpacity(0.02),
              borderColor: meal.eaten
                  ? AppColors.amber.withOpacity(0.2)
                  : Colors.white.withOpacity(0.08),
              child: Row(
                children: [
                  // Checklist check icon
                  GestureDetector(
                    onTap: () => notifier.toggleMeal(meal.id),
                    child: Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: meal.eaten ? AppColors.amber : Colors.transparent,
                        border: Border.all(
                          color: meal.eaten ? AppColors.amber : AppColors.gray,
                          width: 1.5,
                        ),
                      ),
                      alignment: Alignment.center,
                      child: meal.eaten
                          ? const Icon(Icons.check, size: 16, color: AppColors.bg)
                          : null,
                    ),
                  ),
                  const SizedBox(width: 16),

                  // Name & Metadata
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          meal.name,
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                            color: meal.eaten ? AppColors.white : AppColors.gray,
                            decoration: meal.eaten ? TextDecoration.lineThrough : null,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Text(
                              formattedTime,
                              style: const TextStyle(
                                fontFamily: 'Inter',
                                fontWeight: FontWeight.w500,
                                fontSize: 11,
                                color: AppColors.gray,
                              ),
                            ),
                            if (meal.kcal != null) ...[
                              const SizedBox(width: 8),
                              Container(width: 3, height: 3, decoration: const BoxDecoration(shape: BoxShape.circle, color: Colors.white24)),
                              const SizedBox(width: 8),
                              Text(
                                '${meal.kcal} kcal',
                                style: TextStyle(
                                  fontFamily: 'Inter',
                                  fontWeight: FontWeight.w600,
                                  fontSize: 11,
                                  color: meal.estimated ? AppColors.blueGlow : AppColors.amber,
                                ),
                              ),
                              if (meal.estimated) ...[
                                const SizedBox(width: 6),
                                const Text(
                                  '• EST',
                                  style: TextStyle(
                                    fontFamily: 'Inter',
                                    fontWeight: FontWeight.w800,
                                    fontSize: 8,
                                    letterSpacing: 0.5,
                                    color: AppColors.blueGlow,
                                  ),
                                ),
                              ]
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  // Quick Add Meal Bottom Sheet Modal
  void _showQuickAddSheet(BuildContext context, AppStateNotifier notifier) {
    // Reset controllers
    _nameController.clear();
    _kcalController.clear();
    setState(() {
      _autoEstimate = false;
    });

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.bgCardLight,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            top: 24,
            left: 24,
            right: 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Handle
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
                'Quick Add Meal',
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontWeight: FontWeight.w800,
                  fontSize: 18,
                  color: AppColors.white,
                ),
              ),
              const SizedBox(height: 20),

              // Name Input
              TextField(
                controller: _nameController,
                style: const TextStyle(color: AppColors.white, fontFamily: 'Inter'),
                decoration: InputDecoration(
                  hintText: 'e.g. Avocado Salad',
                  hintStyle: const TextStyle(color: Colors.white30),
                  filled: true,
                  fillColor: AppColors.bgCard,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Calories Input & Switch row
              StatefulBuilder(
                builder: (context, setStateSheet) {
                  return Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _kcalController,
                              keyboardType: TextInputType.number,
                              enabled: !_autoEstimate,
                              style: const TextStyle(color: AppColors.white, fontFamily: 'Inter'),
                              decoration: InputDecoration(
                                hintText: _autoEstimate ? 'Auto Estimating' : 'e.g. 350',
                                hintStyle: TextStyle(color: _autoEstimate ? AppColors.blueGlow : Colors.white30),
                                suffixText: 'kcal',
                                filled: true,
                                fillColor: AppColors.bgCard,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide.none,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      SwitchListTile(
                        value: _autoEstimate,
                        activeColor: AppColors.blueGlow,
                        title: const Text(
                          'Smart Calorie Heuristics',
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                            color: AppColors.white,
                          ),
                        ),
                        subtitle: const Text(
                          'Use AI estimation rules for calorie value',
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 11,
                            color: AppColors.gray,
                          ),
                        ),
                        onChanged: (val) {
                          setStateSheet(() {
                            _autoEstimate = val;
                          });
                        },
                      ),
                    ],
                  );
                },
              ),
              const SizedBox(height: 24),

              // Save Action Button (56px tall for sweaty fingers)
              SizedBox(
                height: 56,
                child: ElevatedButton(
                  onPressed: () {
                    final name = _nameController.text.trim();
                    if (name.isNotEmpty) {
                      final kcalVal = int.tryParse(_kcalController.text);
                      notifier.quickAddMeal(
                        name,
                        kcalVal,
                        autoEstimate: _autoEstimate,
                      );
                      Navigator.pop(context);
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.amber,
                    foregroundColor: AppColors.bg,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: const Text(
                    'ADD TO LOG',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        );
      },
    );
  }

  void _showCustomMealOptions(BuildContext context, Meal meal, AppStateNotifier notifier) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.bgCardLight,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
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
                'Options: ${meal.name}',
                style: const TextStyle(
                  fontFamily: 'Inter',
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                  color: AppColors.white,
                ),
              ),
              const SizedBox(height: 20),
              ListTile(
                leading: const Icon(Icons.edit, color: AppColors.amber),
                title: const Text(
                  'Edit Custom Meal',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                    color: AppColors.white,
                  ),
                ),
                onTap: () {
                  Navigator.pop(context); // close options
                  _showEditCustomMealSheet(context, meal, notifier);
                },
              ),
              const Divider(color: Colors.white10),
              ListTile(
                leading: const Icon(Icons.delete, color: AppColors.red),
                title: const Text(
                  'Delete Custom Meal',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                    color: AppColors.red,
                  ),
                ),
                onTap: () {
                  notifier.deleteCustomMeal(meal.id);
                  Navigator.pop(context);
                },
              ),
              const SizedBox(height: 12),
            ],
          ),
        );
      },
    );
  }

  void _showEditCustomMealSheet(BuildContext context, Meal meal, AppStateNotifier notifier) {
    final TextEditingController nameCtrl = TextEditingController(text: meal.name);
    final TextEditingController kcalCtrl = TextEditingController(text: (meal.kcal ?? 250).toString());
    bool autoEstimate = meal.estimated;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.bgCardLight,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
                top: 24,
                left: 24,
                right: 24,
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
                  const SizedBox(height: 20),
                  const Text(
                    'Edit Custom Meal',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontWeight: FontWeight.w800,
                      fontSize: 18,
                      color: AppColors.white,
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Name Input
                  TextField(
                    controller: nameCtrl,
                    style: const TextStyle(color: AppColors.white, fontFamily: 'Inter'),
                    decoration: InputDecoration(
                      hintText: 'e.g. Avocado Salad',
                      hintStyle: const TextStyle(color: Colors.white30),
                      filled: true,
                      fillColor: AppColors.bgCard,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Calories Input & Switch row
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: kcalCtrl,
                              keyboardType: TextInputType.number,
                              enabled: !autoEstimate,
                              style: const TextStyle(color: AppColors.white, fontFamily: 'Inter'),
                              decoration: InputDecoration(
                                hintText: autoEstimate ? 'Auto Estimating' : 'e.g. 350',
                                hintStyle: TextStyle(color: autoEstimate ? AppColors.blueGlow : Colors.white30),
                                suffixText: 'kcal',
                                filled: true,
                                fillColor: AppColors.bgCard,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide.none,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      SwitchListTile(
                        value: autoEstimate,
                        activeColor: AppColors.blueGlow,
                        title: const Text(
                          'Smart Calorie Heuristics',
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                            color: AppColors.white,
                          ),
                        ),
                        subtitle: const Text(
                          'Use AI estimation rules for calorie value',
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 11,
                            color: AppColors.gray,
                          ),
                        ),
                        onChanged: (val) {
                          setModalState(() {
                            autoEstimate = val;
                          });
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Save Action Button
                  SizedBox(
                    height: 56,
                    child: ElevatedButton(
                      onPressed: () {
                        final name = nameCtrl.text.trim();
                        if (name.isNotEmpty) {
                          final kcalVal = int.tryParse(kcalCtrl.text);
                          notifier.editCustomMeal(
                            meal.id,
                            name,
                            kcalVal,
                            autoEstimate: autoEstimate,
                          );
                          Navigator.pop(context);
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.amber,
                        foregroundColor: AppColors.bg,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: const Text(
                        'SAVE CHANGES',
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            );
          },
        );
      },
    );
  }
}
