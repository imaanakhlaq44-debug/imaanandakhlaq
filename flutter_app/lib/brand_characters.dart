import 'package:flutter/material.dart';

/// Original approved source assets. Imaan is the girl with a braid and pink
/// kameez; Akhlaq is the boy in a blue shirt. Never substitute generated faces.
class BrandCompanions extends StatelessWidget {
  const BrandCompanions({super.key, this.width = 140, this.height = 120});
  final double width, height;
  @override
  Widget build(BuildContext context) => SizedBox(
    width: width,
    height: height,
    child: ExcludeSemantics(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: Image.asset(
                'assets/images/original-akhlaq.jpg',
                height: height,
                fit: BoxFit.cover,
                alignment: Alignment.topCenter,
                cacheWidth: 240,
              ),
            ),
          ),
          const SizedBox(width: 4),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: Image.asset(
                'assets/images/original-imaan.jpg',
                height: height,
                fit: BoxFit.cover,
                alignment: Alignment.topCenter,
                cacheWidth: 240,
              ),
            ),
          ),
        ],
      ),
    ),
  );
}
