import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart';
import '../core/theme/colors.dart';
import '../core/theme/motion.dart';
import '../data/providers/progress_provider.dart';
import 'control_panel/control_panel_screen.dart';
import 'diet/diet_screen.dart';
import 'workout/workout_screen.dart';
import 'sleep/sleep_screen.dart';
import 'workout/workout_plan_helper.dart';
import 'diet/diet_plan_helper.dart';
import 'sleep/sleep_plan_helper.dart';

class NavigationShell extends ConsumerStatefulWidget {
  const NavigationShell({super.key});

  @override
  ConsumerState<NavigationShell> createState() => _NavigationShellState();
}

class _NavigationShellState extends ConsumerState<NavigationShell> with TickerProviderStateMixin {
  static const int _initialPage = 5000;
  late PageController _pageController;
  double _pageOffset = _initialPage.toDouble();

  bool _isAccountOpen = false;
  bool _isSwitchPlanExpanded = false;
  late AnimationController _accountController;
  late Animation<double> _scrimAnimation;
  late Animation<double> _panelAnimation;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(initialPage: _initialPage);
    _pageController.addListener(_onPageScroll);

    // Account menu animations
    _accountController = AnimationController(
      vsync: this,
      duration: AppMotion.sheetSlide,
    );
    _scrimAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _accountController,
        curve: const Interval(0.0, 0.8, curve: Curves.linear),
      ),
    );
    _panelAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _accountController,
        curve: AppMotion.sheetCurve,
      ),
    );
  }

  @override
  void dispose() {
    _pageController.removeListener(_onPageScroll);
    _pageController.dispose();
    _accountController.dispose();
    super.dispose();
  }

  void _onPageScroll() {
    if (mounted) {
      setState(() {
        _pageOffset = _pageController.page ?? _initialPage.toDouble();
      });
    }
  }

  void _toggleAccountMenu() {
    setState(() {
      _isAccountOpen = !_isAccountOpen;
      if (_isAccountOpen) {
        _accountController.forward();
        HapticFeedback.selectionClick();
      } else {
        _accountController.reverse();
        _isSwitchPlanExpanded = false;
        HapticFeedback.selectionClick();
      }
    });
  }

  // Get active color based on screen index
  Color _getAccentColor(int screenIndex) {
    switch (screenIndex) {
      case 0:
        return AppColors.blueGlow;
      case 1:
        return AppColors.amber;
      case 2:
        return AppColors.green;
      case 3:
        return AppColors.indigo;
      default:
        return AppColors.blueGlow;
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = ref.watch(appStateProvider);
    final currentScreenIndex = (_pageOffset.round() % 4);

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Stack(
        children: [
          // 1. Looping PageView
          Positioned.fill(
            child: PageView.builder(
              controller: _pageController,
              itemBuilder: (context, index) {
                final realIndex = index % 4;
                switch (realIndex) {
                  case 0:
                    return ControlPanelScreen(
                      onNavigateToPage: (targetIndex) {
                        final currentActive = _pageController.page ?? _initialPage.toDouble();
                        final diff = targetIndex - (currentActive % 4);
                        _pageController.animateToPage(
                          (currentActive + diff).round(),
                          duration: const Duration(milliseconds: 400),
                          curve: Curves.easeOutCubic,
                        );
                      },
                    );
                  case 1:
                    return const DietScreen();
                  case 2:
                    return const WorkoutScreen();
                  case 3:
                    return const SleepScreen();
                  default:
                    return const SizedBox.shrink();
                }
              },
            ),
          ),

          // 2. Fixed Top Header Row (Streak & Avatar)
          Positioned(
            top: MediaQuery.of(context).padding.top + 16,
            left: 20,
            right: 20,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Streak Pill
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.bgCard,
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(
                      color: AppColors.amber.withOpacity(0.2),
                      width: 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.whatshot,
                        color: AppColors.amber,
                        size: 16,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        '${appState.userProfile.streakDays}',
                        style: const TextStyle(
                          fontFamily: 'Inter',
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                          color: AppColors.amber,
                        ),
                      ),
                    ],
                  ),
                ),

                // Avatar Button
                GestureDetector(
                  onTap: _toggleAccountMenu,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // Glow ring outline (fades in)
                      AnimatedContainer(
                        duration: AppMotion.microToggle,
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: _isAccountOpen ? AppColors.blueGlow : Colors.transparent,
                            width: 2,
                          ),
                          boxShadow: _isAccountOpen
                              ? [
                                  BoxShadow(
                                    color: AppColors.blueGlow.withOpacity(0.3),
                                    blurRadius: 8,
                                    spreadRadius: 1,
                                  )
                                ]
                              : null,
                        ),
                      ),
                      Container(
                        width: 36,
                        height: 36,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: LinearGradient(
                            colors: [Color(0xFF2E3349), Color(0xFF1B1E2E)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          appState.userProfile.name[0].toUpperCase(),
                          style: const TextStyle(
                            fontFamily: 'Inter',
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                            color: AppColors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // 3. Page Indicator Dots (Driven continuously by controller scroll offset)
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(4, (i) {
                final currentActive = _pageOffset % 4.0;
                double diff = (i - currentActive).abs();
                if (diff > 2.0) {
                  diff = 4.0 - diff;
                }
                final activeFactor = (1.0 - diff).clamp(0.0, 1.0);
                
                final dotWidth = 8.0 + (12.0 * activeFactor);
                final dotColor = Color.lerp(
                  AppColors.grayDim,
                  _getAccentColor(currentScreenIndex),
                  activeFactor,
                )!;

                return Container(
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: dotWidth,
                  height: 8,
                  decoration: BoxDecoration(
                    color: dotColor,
                    borderRadius: BorderRadius.circular(999),
                  ),
                );
              }),
            ),
          ),

          // 4. Scrim Overlay for Account Menu Popover
          if (_isAccountOpen)
            Positioned.fill(
              child: GestureDetector(
                onTap: _toggleAccountMenu,
                behavior: HitTestBehavior.opaque,
                child: FadeTransition(
                  opacity: _scrimAnimation,
                  child: Container(
                    color: Colors.black.withOpacity(0.55),
                  ),
                ),
              ),
            ),

          // 5. Account Dropdown Panel
          if (_isAccountOpen)
            Positioned(
              top: MediaQuery.of(context).padding.top + 68,
              right: 20,
              child: ScaleTransition(
                scale: Tween<double>(begin: 0.95, end: 1.0).animate(
                  CurvedAnimation(
                    parent: _accountController,
                    curve: AppMotion.sheetCurve,
                  ),
                ),
                alignment: Alignment.topRight,
                child: FadeTransition(
                  opacity: _panelAnimation,
                  child: _buildAccountMenu(context, appState),
                ),
              ),
            ),
        ],
      ),
    );
  }

  // Account Dropdown Menu Widget
  Widget _buildAccountMenu(BuildContext context, AppState appState) {
    return Container(
      width: 280,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.bgCardLight,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: Colors.white.withOpacity(0.08),
          width: 1.0,
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header info
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.bgCard,
                ),
                alignment: Alignment.center,
                child: Text(
                  appState.userProfile.name.isNotEmpty ? appState.userProfile.name[0].toUpperCase() : 'U',
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.w700,
                    fontSize: 18,
                    color: AppColors.white,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: GestureDetector(
                  onTap: () => _showEditNameDialog(context, appState.userProfile.name),
                  behavior: HitTestBehavior.opaque,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              appState.userProfile.name,
                              style: const TextStyle(
                                fontFamily: 'Inter',
                                fontWeight: FontWeight.w700,
                                fontSize: 16,
                                color: AppColors.white,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Icon(
                            Icons.edit,
                            size: 14,
                            color: Colors.white.withOpacity(0.5),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${appState.userProfile.streakDays}-day streak · Level ${appState.userProfile.level}',
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
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(color: Colors.white12, height: 1),
          const SizedBox(height: 8),

          // Menu Row: Add Diet Plan
          _buildMenuRow(
            icon: Icons.restaurant_menu,
            title: 'Add Diet Plan',
            iconBg: AppColors.green.withOpacity(0.15),
            iconColor: AppColors.green,
            onTap: () {
              _toggleAccountMenu();
              showAddDietPlanSheet(context, ref);
            },
          ),

          // Menu Row: Add/Edit Workout Plan
          _buildMenuRow(
            icon: Icons.fitness_center,
            title: 'Add/Edit Workout Plan',
            iconBg: AppColors.amber.withOpacity(0.15),
            iconColor: AppColors.amber,
            onTap: () {
              _toggleAccountMenu();
              showAddWorkoutPlanSheet(context, ref);
            },
          ),

          // Menu Row: Add Sleep Schedule
          _buildMenuRow(
            icon: Icons.bedtime,
            title: 'Add Sleep Schedule',
            iconBg: AppColors.indigo.withOpacity(0.15),
            iconColor: AppColors.indigo,
            onTap: () {
              _toggleAccountMenu();
              showAddSleepPlanSheet(context, ref);
            },
          ),

          // Menu Row: Switch Plan
          _buildMenuRow(
            icon: Icons.sync,
            title: 'Switch Plan',
            subtitle: 'Diet · Workout · Sleep',
            iconBg: AppColors.purple.withOpacity(0.15),
            iconColor: AppColors.purple,
            trailing: Icon(
              _isSwitchPlanExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
              color: Colors.white54,
              size: 20,
            ),
            onTap: () {
              setState(() {
                _isSwitchPlanExpanded = !_isSwitchPlanExpanded;
              });
              HapticFeedback.selectionClick();
            },
          ),

          // Expandable Switch Plan Submenu
          if (_isSwitchPlanExpanded)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.03),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withOpacity(0.05)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // --- Diet Section ---
                  _buildSubPlanSectionHeader('DIET PLANS', AppColors.green),
                  ...appState.dietPlans.map((plan) {
                    final isActive = plan.id == appState.activeDietPlanId;
                    return _buildSubPlanItem(
                      name: plan.name,
                      isActive: isActive,
                      activeColor: AppColors.green,
                      onTap: () {
                        ref.read(appStateProvider.notifier).switchDietPlan(plan.id);
                      },
                    );
                  }),
                  const SizedBox(height: 12),
                  // --- Workout Section ---
                  _buildSubPlanSectionHeader('WORKOUT PLANS', AppColors.amber),
                  ...appState.workoutPlans.map((plan) {
                    final isActive = plan.id == appState.activeWorkoutPlanId;
                    return _buildSubPlanItem(
                      name: plan.name,
                      isActive: isActive,
                      activeColor: AppColors.amber,
                      onTap: () {
                        ref.read(appStateProvider.notifier).switchWorkoutPlan(plan.id);
                      },
                    );
                  }),
                  const SizedBox(height: 12),
                  // --- Sleep Section ---
                  _buildSubPlanSectionHeader('SLEEP SCHEDULES', AppColors.indigo),
                  ...appState.sleepSchedules.map((plan) {
                    final isActive = plan.id == appState.activeSleepScheduleId;
                    return _buildSubPlanItem(
                      name: plan.name,
                      isActive: isActive,
                      activeColor: AppColors.indigo,
                      onTap: () {
                        ref.read(appStateProvider.notifier).switchSleepSchedule(plan.id);
                      },
                    );
                  }),
                ],
              ),
            ),

          const SizedBox(height: 8),
          const Divider(color: Colors.white12, height: 1),
          const SizedBox(height: 8),

          // Menu Row: Progress Report
          _buildMenuRow(
            icon: Icons.download,
            title: 'Download Progress Report',
            subtitle: 'Export CSV for Claude',
            titleColor: AppColors.blueGlow,
            iconBg: AppColors.blueGlow.withOpacity(0.15),
            iconColor: AppColors.blueGlow,
            onTap: () {
              _toggleAccountMenu();
              _exportProgressReport(context);
            },
          ),

          const SizedBox(height: 8),
          const Divider(color: Colors.white12, height: 1),
          const SizedBox(height: 8),

          // Menu Row: Reset All Data
          _buildMenuRow(
            icon: Icons.delete_forever,
            title: 'Reset All Data',
            subtitle: 'Clear all database history',
            titleColor: AppColors.red,
            iconBg: AppColors.red.withOpacity(0.15),
            iconColor: AppColors.red,
            onTap: () {
              _toggleAccountMenu();
              _showResetConfirmationDialog(context);
            },
          ),

          const SizedBox(height: 8),
          const Divider(color: Colors.white12, height: 1),
          const SizedBox(height: 8),

          // Menu Row: Log Out
          _buildMenuRow(
            icon: Icons.logout,
            title: 'Log Out',
            titleColor: AppColors.red,
            iconBg: AppColors.red.withOpacity(0.15),
            iconColor: AppColors.red,
            onTap: () {
              _toggleAccountMenu();
              _showToast(context, 'Logged out successfully');
            },
          ),
        ],
      ),
    );
  }

  void _showEditNameDialog(BuildContext context, String currentName) {
    final controller = TextEditingController(text: currentName);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.bgCard,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: Colors.white.withOpacity(0.08)),
        ),
        title: const Text(
          'Edit Profile Name',
          style: TextStyle(color: Colors.white, fontFamily: 'Inter', fontWeight: FontWeight.w700),
        ),
        content: TextField(
          controller: controller,
          style: const TextStyle(color: Colors.white, fontFamily: 'Inter'),
          decoration: InputDecoration(
            hintText: 'Enter name',
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
                ref.read(appStateProvider.notifier).updateProfileName(newName);
              }
              Navigator.pop(ctx);
            },
            child: const Text('Save', style: TextStyle(color: AppColors.blueGlow, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildSubPlanSectionHeader(String title, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6, left: 4),
      child: Text(
        title,
        style: TextStyle(
          fontFamily: 'Inter',
          fontWeight: FontWeight.w800,
          fontSize: 9,
          color: color.withOpacity(0.8),
          letterSpacing: 1.0,
        ),
      ),
    );
  }

  Widget _buildSubPlanItem({
    required String name,
    required bool isActive,
    required Color activeColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6.0, horizontal: 4.0),
        child: Row(
          children: [
            Icon(
              isActive ? Icons.radio_button_checked : Icons.radio_button_off,
              size: 14,
              color: isActive ? activeColor : Colors.white30,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                name,
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                  fontSize: 12,
                  color: isActive ? AppColors.white : Colors.white60,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showResetConfirmationDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: AppColors.bgCardLight,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: BorderSide(color: Colors.white.withOpacity(0.08), width: 1.0),
          ),
          title: const Text(
            'Reset All Data?',
            style: TextStyle(
              fontFamily: 'Inter',
              fontWeight: FontWeight.w800,
              color: AppColors.white,
            ),
          ),
          content: const Text(
            'This will permanently clear all your progress logs, history, and streaks. This action cannot be undone.',
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
                ref.read(appStateProvider.notifier).resetAllData();
                _showToast(context, 'All progress data has been reset');
              },
              child: const Text(
                'Reset',
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
  }

  Widget _buildMenuRow({
    required IconData icon,
    required String title,
    String? subtitle,
    required Color iconBg,
    Color? iconColor,
    required VoidCallback onTap,
    Color? titleColor,
    Widget? trailing,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 8.0),
        child: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: iconBg,
                borderRadius: BorderRadius.circular(8),
              ),
              alignment: Alignment.center,
              child: Icon(
                icon,
                color: iconColor ?? titleColor ?? AppColors.white,
                size: 16,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                      color: titleColor ?? AppColors.white,
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.w500,
                        fontSize: 10,
                        color: AppColors.gray,
                      ),
                    ),
                  ]
                ],
              ),
            ),
            if (trailing != null) ...[
              const SizedBox(width: 8),
              trailing,
            ],
          ],
        ),
      ),
    );
  }

  void _exportProgressReport(BuildContext context) {
    final mdReport = ref.read(appStateProvider.notifier).generateProgressReportMarkdown();
    
    Clipboard.setData(ClipboardData(text: mdReport)).then((_) {
      _showToast(context, 'Report copied to clipboard! (Ready for Claude)');
    });
  }

  void _showToast(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          message,
          style: const TextStyle(
            fontFamily: 'Inter',
            fontWeight: FontWeight.w600,
            fontSize: 13,
            color: AppColors.white,
          ),
        ),
        backgroundColor: AppColors.bgCardLight,
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}
