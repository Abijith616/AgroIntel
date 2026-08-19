import 'dart:math';
import 'package:flutter/material.dart';
import '../theme/colors.dart';
import '../theme/motion.dart';

class MomentumRing extends StatefulWidget {
  final double progress; // 0.0 to 1.0
  final double size;

  const MomentumRing({
    super.key,
    required this.progress,
    this.size = 236.0,
  });

  @override
  State<MomentumRing> createState() => _MomentumRingState();
}

class _MomentumRingState extends State<MomentumRing> with TickerProviderStateMixin {
  // 1. Progress animation
  late AnimationController _progressController;
  late Animation<double> _progressAnimation;

  // 2. Breathing pulse animation
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  // 3. Completion reward animations
  late AnimationController _completionController;
  int _rewardType = 0; // 0 to 4
  bool _showReward = false;

  @override
  void initState() {
    super.initState();

    // Progress Animation
    _progressController = AnimationController(
      vsync: this,
      duration: AppMotion.ringScale,
    );
    _progressAnimation = Tween<double>(begin: 0.0, end: widget.progress).animate(
      CurvedAnimation(parent: _progressController, curve: AppMotion.ringCurve),
    );
    _progressController.forward();

    // Breathing Pulse Animation (Sweeps 4% to 24% opacity over 1800ms)
    _pulseController = AnimationController(
      vsync: this,
      duration: AppMotion.ringPulse,
    );
    _pulseAnimation = Tween<double>(begin: 0.04, end: 0.24).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOutCubic),
    );
    _pulseController.repeat(reverse: true);

    // Completion Reward controller
    _completionController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    _completionController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        setState(() {
          _showReward = false;
        });
        _completionController.reset();
      }
    });

    if (widget.progress >= 1.0) {
      _triggerCompletionReward();
    }
  }

  @override
  void didUpdateWidget(covariant MomentumRing oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.progress != widget.progress) {
      _progressAnimation = Tween<double>(
        begin: _progressAnimation.value,
        end: widget.progress,
      ).animate(
        CurvedAnimation(parent: _progressController, curve: AppMotion.ringCurve),
      );
      _progressController.forward(from: 0.0);

      // Trigger reward if transition crosses 100% completion
      if (widget.progress >= 1.0 && oldWidget.progress < 1.0) {
        _triggerCompletionReward();
      }
    }
  }

  void _triggerCompletionReward() {
    setState(() {
      _rewardType = Random().nextInt(5);
      _showReward = true;
    });
    _completionController.forward(from: 0.0);
  }

  @override
  void dispose() {
    _progressController.dispose();
    _pulseController.dispose();
    _completionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: Listenable.merge([_progressAnimation, _pulseAnimation, _completionController]),
      builder: (context, child) {
        final currentProgress = _progressAnimation.value;
        final glowVal = _pulseAnimation.value;

        // Custom messaging based on momentum
        String statusText = 'RALLY TIME';
        Color statusColor = AppColors.red;
        if (currentProgress >= 0.8) {
          statusText = 'CRUSHING IT';
          statusColor = AppColors.green;
        } else if (currentProgress >= 0.5) {
          statusText = 'ON TRACK';
          statusColor = AppColors.amber;
        }

        return Container(
          width: widget.size,
          height: widget.size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            boxShadow: [
              // Dual-color blended breathing glow corresponding to the progress split (green/red)
              BoxShadow(
                color: AppColors.green.withOpacity(glowVal * currentProgress.clamp(0.0, 1.0) * 0.7),
                blurRadius: 40,
                spreadRadius: 1,
              ),
              BoxShadow(
                color: AppColors.red.withOpacity(glowVal * (1.0 - currentProgress).clamp(0.0, 1.0) * 0.7),
                blurRadius: 40,
                spreadRadius: 1,
              ),
            ],
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              // 1. Custom painted ring
              Positioned.fill(
                child: CustomPaint(
                  painter: _MomentumRingPainter(
                    progress: currentProgress,
                    rewardValue: _showReward ? _completionController.value : 0.0,
                    rewardType: _showReward ? _rewardType : -1,
                  ),
                ),
              ),

              // 2. Ring Interior Labels
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '${(currentProgress * 100).toInt()}%',
                    style: const TextStyle(
                      fontFamily: 'Inter',
                      fontWeight: FontWeight.w900,
                      fontSize: 48,
                      letterSpacing: -1.0,
                      color: AppColors.white,
                    ),
                  ),
                  const Text(
                    'MOMENTUM',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontWeight: FontWeight.w800,
                      fontSize: 11,
                      letterSpacing: 2.0,
                      color: AppColors.gray,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    statusText,
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontWeight: FontWeight.w800,
                      fontSize: 12,
                      letterSpacing: 1.0,
                      color: statusColor,
                    ),
                  ),
                ],
              ),

              // 3. Overflow reward overlay (like large checkmark)
              if (_showReward && _rewardType == 4)
                ScaleTransition(
                  scale: Tween<double>(begin: 0.0, end: 1.0).animate(
                    CurvedAnimation(
                      parent: _completionController,
                      curve: Curves.easeOutBack,
                    ),
                  ),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: const BoxDecoration(
                      color: AppColors.green,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.check,
                      size: 64,
                      color: AppColors.bg,
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}

class _MomentumRingPainter extends CustomPainter {
  final double progress;
  final double rewardValue;
  final int rewardType;

  _MomentumRingPainter({
    required this.progress,
    required this.rewardValue,
    required this.rewardType,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (min(size.width, size.height) / 2) - 12;
    const strokeWidth = 14.0;

    // 1. Draw track
    final trackPaint = Paint()
      ..color = AppColors.bgCard
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;
    canvas.drawCircle(center, radius, trackPaint);

    const startAngle = -pi / 2; // 12 o'clock
    final sweepAngle = 2 * pi * progress.clamp(0.0, 1.0);

    // 2. Draw gaps arc glow & gaps arc (Red)
    if (progress < 1.0) {
      final gapsPaint = Paint()
        ..color = AppColors.red
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth;

      final gapsGlowPaint = Paint()
        ..color = AppColors.red.withOpacity(0.08)
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth * 1.8
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6);

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle + sweepAngle,
        2 * pi - sweepAngle,
        false,
        gapsGlowPaint,
      );

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle + sweepAngle,
        2 * pi - sweepAngle,
        false,
        gapsPaint,
      );
    }

    // 3. Draw progress arc glow & progress arc (Green)
    if (progress > 0.0) {
      final progressPaint = Paint()
        ..color = AppColors.green
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round;

      final progressGlowPaint = Paint()
        ..color = AppColors.green.withOpacity(0.12)
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth * 1.8
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6);

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        sweepAngle,
        false,
        progressGlowPaint,
      );

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        sweepAngle,
        false,
        progressPaint,
      );
    }

    // 4. Draw reward animations on top
    if (rewardValue > 0.0) {
      switch (rewardType) {
        case 0: // Particle Burst (Expanding sparks)
          final sparkPaint = Paint()
            ..color = AppColors.green.withOpacity(1.0 - rewardValue)
            ..strokeWidth = 3
            ..style = PaintingStyle.stroke;
          for (int i = 0; i < 8; i++) {
            final angle = i * (pi / 4) + (rewardValue * 0.2);
            final double startDist = radius + 10;
            final double endDist = radius + 10 + (25 * rewardValue);
            canvas.drawLine(
              Offset(center.dx + startDist * cos(angle), center.dy + startDist * sin(angle)),
              Offset(center.dx + endDist * cos(angle), center.dy + endDist * sin(angle)),
              sparkPaint,
            );
          }
          break;

        case 1: // Double Flash (Rapid opacity overlays)
          final double flashOpacity = (sin(rewardValue * pi * 4).abs()) * 0.3;
          final flashPaint = Paint()
            ..color = Colors.white.withOpacity(flashOpacity)
            ..style = PaintingStyle.fill;
          canvas.drawCircle(center, radius + (strokeWidth / 2), flashPaint);
          break;

        case 2: // Expanding Ring Ripple (Concentric circles fading out)
          final ripplePaint = Paint()
            ..color = AppColors.green.withOpacity(1.0 - rewardValue)
            ..style = PaintingStyle.stroke
            ..strokeWidth = 2.0;
          canvas.drawCircle(center, radius + (35 * rewardValue), ripplePaint);
          break;

        case 3: // Spin Burst (fast spin sweep indicator)
          final spinPaint = Paint()
            ..color = AppColors.blueGlow.withOpacity(1.0 - rewardValue)
            ..style = PaintingStyle.stroke
            ..strokeWidth = strokeWidth * 0.5
            ..strokeCap = StrokeCap.round;
          final double spinStart = startAngle + (rewardValue * pi * 4);
          canvas.drawArc(
            Rect.fromCircle(center: center, radius: radius),
            spinStart,
            pi * 0.5,
            false,
            spinPaint,
          );
          break;
      }
    }
  }

  @override
  bool shouldRepaint(covariant _MomentumRingPainter oldDelegate) {
    return oldDelegate.progress != progress ||
        oldDelegate.rewardValue != rewardValue ||
        oldDelegate.rewardType != rewardType;
  }
}
