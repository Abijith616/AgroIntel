import 'dart:math';
import 'package:flutter/material.dart';
import '../theme/colors.dart';

class CalorieRing extends StatelessWidget {
  final int consumed;
  final int? target; // Null implies Custom Mode (no targets)
  final double size;

  const CalorieRing({
    super.key,
    required this.consumed,
    this.target,
    this.size = 180.0,
  });

  @override
  Widget build(BuildContext context) {
    // Custom Mode Check
    final isCustomMode = target == null;
    final double progress = isCustomMode ? 0.0 : (consumed / target!).clamp(0.0, 1.0);

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Custom painted progress arc
          Positioned.fill(
            child: CustomPaint(
              painter: _CalorieRingPainter(
                progress: progress,
                isCustomMode: isCustomMode,
              ),
            ),
          ),

          // Inner Content
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '$consumed',
                style: const TextStyle(
                  fontFamily: 'Inter',
                  fontWeight: FontWeight.w900,
                  fontSize: 32,
                  color: AppColors.white,
                ),
              ),
              const Text(
                'KCAL EATEN',
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontWeight: FontWeight.w800,
                  fontSize: 10,
                  letterSpacing: 1.5,
                  color: AppColors.gray,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Total: ${target ?? 0}',
                style: const TextStyle(
                  fontFamily: 'Inter',
                  fontWeight: FontWeight.w600,
                  fontSize: 11,
                  color: AppColors.amber,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CalorieRingPainter extends CustomPainter {
  final double progress;
  final bool isCustomMode;

  _CalorieRingPainter({
    required this.progress,
    required this.isCustomMode,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (min(size.width, size.height) / 2) - 8;
    const strokeWidth = 10.0;

    // 1. Draw track
    final trackPaint = Paint()
      ..color = AppColors.bgCard
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;
    canvas.drawCircle(center, radius, trackPaint);

    if (isCustomMode) {
      // Draw alternating colored dash segments for Custom Mode to visually indicate "limitless" tracking
      final paint = Paint()
        ..color = AppColors.amber.withOpacity(0.35)
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth;

      const int dashes = 12;
      const double angleStep = 2 * pi / dashes;
      for (int i = 0; i < dashes; i++) {
        canvas.drawArc(
          Rect.fromCircle(center: center, radius: radius),
          (i * angleStep) - (pi / 2),
          angleStep * 0.5,
          false,
          paint,
        );
      }
    } else {
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

      // 3. Draw progress arc (Amber)
      if (progress > 0.0) {
        final progressPaint = Paint()
          ..color = AppColors.amber
          ..style = PaintingStyle.stroke
          ..strokeWidth = strokeWidth
          ..strokeCap = StrokeCap.round;

        // Glow
        final glowPaint = Paint()
          ..color = AppColors.amber.withOpacity(0.18)
          ..style = PaintingStyle.stroke
          ..strokeWidth = strokeWidth * 2.0
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 5);
        canvas.drawCircle(center, radius, glowPaint);

        canvas.drawArc(
          Rect.fromCircle(center: center, radius: radius),
          startAngle,
          sweepAngle,
          false,
          progressPaint,
        );
      }
    }
  }

  @override
  bool shouldRepaint(covariant _CalorieRingPainter oldDelegate) {
    return oldDelegate.progress != progress || oldDelegate.isCustomMode != isCustomMode;
  }
}
