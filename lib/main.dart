import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/colors.dart';
import 'data/repositories/progress_repository.dart';
import 'data/providers/progress_provider.dart';
import 'features/navigation_shell.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize progress database/repository
  final repository = ProgressRepository();
  await repository.init();

  runApp(
    ProviderScope(
      overrides: [
        progressRepositoryProvider.overrideWithValue(repository),
      ],
      child: const MainApp(),
    ),
  );
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Meridian',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: AppColors.bg,
        primaryColor: AppColors.blueGlow,
        colorScheme: const ColorScheme.dark(
          primary: AppColors.blueGlow,
          secondary: AppColors.green,
          surface: AppColors.bgCard,
          error: AppColors.red,
        ),
        fontFamily: 'Inter',
        textTheme: const TextTheme(
          bodyLarge: TextStyle(color: AppColors.white),
          bodyMedium: TextStyle(color: AppColors.gray),
        ),
        // Dark HUD bottom sheet theme
        bottomSheetTheme: const BottomSheetThemeData(
          backgroundColor: AppColors.bgCardLight,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
        ),
      ),
      home: const NavigationShell(),
    );
  }
}
