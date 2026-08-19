import 'package:flutter/material.dart';

class AppMotion {
  static const Duration ringPulse = Duration(milliseconds: 1800);
  static const Duration ringScale = Duration(milliseconds: 350);
  static const Duration weeklySlide = Duration(milliseconds: 400);
  static const Duration cardFlash = Duration(milliseconds: 400);
  static const Duration sheetSlide = Duration(milliseconds: 250);
  static const Duration countUp = Duration(milliseconds: 1200);
  static const Duration microToggle = Duration(milliseconds: 150);

  static const Curve ringCurve = Curves.easeInOutCubic;
  static const Curve sheetCurve = Curves.easeOutCubic;
}
