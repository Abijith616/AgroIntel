import 'dart:math';
import 'package:flutter/material.dart';
import '../theme/colors.dart';

class MiniRing extends StatelessWidget {
  final double progress; // 0.0 to 1.0
  final String label;
  final bool isToday;
  final double size;

  const MiniRing({
    super.key,
    required this.progress,
    required this.label,
    this.isToday = false,
    this.size = 32.0,
  });

  @override
  Widget build(BuildContext context) {
    final double actualSize = isToday ? 34.0 : 32.0;
    final accentColor = isToday ? AppColors.blueGlow : AppColors.green;
    final labelColor = isToday ? AppColors.white : AppColors.gray;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: actualSize,
          height: actualSize,
          child: CustomPaint(
            painter: _MiniRingPainter(
              progress: progress.clamp(0.0, 1.0),
              accentColor: accentColor,
              isToday: isToday,
            ),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          label,
          style: TextStyle(
            fontFamily: 'Inter',
            fontWeight: isToday ? FontWeight.w700 : FontWeight.w500,
            fontSize: 11,
            color: labelColor,
          ),
        ),
      ],
    );
  }
}

class _MiniRingPainter extends CustomPainter {
  final double progress;
  final Color accentColor;
  final bool isToday;

  _MiniRingPainter({
    required this.progress,
    required this.accentColor,
    required this.isToday,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (min(size.width, size.height) / 2) - 2;
    const strokeWidth = 3.5;

    // 1. Draw track
    final trackPaint = Paint()
      ..color = AppColors.bgCardLight
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;
    canvas.drawCircle(center, radius, trackPaint);

    const startAngle = -pi / 2; // 12 o'clock
    final sweepAngle = 2 * pi * progress;

    // 2. Draw gaps arc (Red)
    if (progress < 1.0) {
      final gapsPaint = Paint()
        ..color = AppColors.red
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle + sweepAngle,
        2 * pi - sweepAngle,
        false,
        gapsPaint,
      );
    }

    // 3. Draw progress arc
    if (progress > 0.0) {
      final progressPaint = Paint()
        ..color = accentColor
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round;

      // Draw a subtle glow for today's active ring
      if (isToday) {
        final glowPaint = Paint()
          ..color = accentColor.withOpacity(0.3)
          ..style = PaintingStyle.stroke
          ..strokeWidth = strokeWidth * 2.0
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3);
        canvas.drawCircle(center, radius, glowPaint);
      }

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
  bool shouldRepaint(covariant _MiniRingPainter oldDelegate) {
    return oldDelegate.progress != progress ||
        oldDelegate.accentColor != accentColor ||
        oldDelegate.isToday != isToday;
  }
}
