import 'package:flutter/material.dart';

import '../app_theme.dart';
import '../brand_characters.dart';
import '../l10n/language.dart';
import 'entry_screens.dart' show BrandLogoRing, brandCream;
import 'ui_kit.dart' show displayStyle;

/// One FAQ answer: an opening line, optional bullet points and an
/// optional closing line. Text is the old app's FAQ (public/apk/faqs.html),
/// kept word for word.
class FaqItem {
  const FaqItem(
    this.question,
    this.answer, [
    this.points = const [],
    this.after = '',
  ]);
  final String question, answer, after;
  final List<String> points;
}

const schoolFaqs = [
  FaqItem(
    'What is the Imaan & Akhlaq program for schools?',
    'It is a structured character-building curriculum designed for schools, helping students develop strong Islamic values, positive behavior, and ethical decision-making alongside their regular academics.',
  ),
  FaqItem(
    'How can this program be integrated into our school system?',
    'The program is designed to be flexible and easy to implement. Schools can:',
    [
      'Use the weekly library period for it',
      'Use it during activity or character-building warmups every day',
      'Reinforce learning through the Imaan & Akhlaq Club model',
    ],
  ),
  FaqItem(
    'What age groups does the curriculum cover?',
    'The program covers students from Early Childhood (ECCE) up to Grade 7, with content designed according to each age level.',
  ),
  FaqItem(
    'What does the school receive as part of the program?',
    'Schools get a complete package, including:',
    [
      'Curriculum books',
      'Workbooks and activities',
      'Teacher guidance support',
      'Access to digital portal (where applicable)',
      'Supporting content like audio stories and engagement tools',
    ],
  ),
  FaqItem(
    'Does the program require special teacher training?',
    'Basic orientation is recommended, but the program is designed to be teacher-friendly:',
    [
      'Lessons are structured and easy to follow',
      'Clear objectives are provided',
      'Activities are guided step-by-step',
      'Support can be provided to ensure smooth delivery',
    ],
  ),
  FaqItem(
    'How is student progress measured?',
    'Progress is tracked through:',
    [
      'Classroom participation',
      'Activity completion',
      'Behavioral observations',
      'Digital assessments (via portal)',
    ],
    'This allows schools to monitor character development, not just academic performance.',
  ),
  FaqItem(
    'What makes this program different from traditional Islamiat subjects?',
    'This program goes beyond theory. It focuses on:',
    [
      'Practical application in daily life',
      'Habit-building',
      'Emotional connection through stories',
      'Continuous reinforcement through activities',
    ],
  ),
  FaqItem(
    'Will this increase the burden on our existing timetable?',
    'No, the program is designed to be lightweight and adaptable:',
    [
      'Can be conducted in short weekly sessions',
      'Activities are integrated, not additional pressure',
      'Supports overall student development without overload',
    ],
  ),
  FaqItem(
    'How does this program benefit our institution?',
    'Schools can expect:',
    [
      'Improved student behavior and discipline',
      'Stronger moral environment',
      'Positive school culture',
      'Increased parent satisfaction',
      'A unique value-based identity for the institution',
    ],
  ),
  FaqItem(
    'Is there evidence or pilot success of this program?',
    'Yes, the program has already been piloted successfully and is being adopted by multiple schools, showing strong acceptance and positive feedback.',
  ),
  FaqItem(
    'How does the digital portal support schools?',
    'The portal adds value by:',
    [
      'Providing structured digital learning',
      'Offering quizzes and assessments',
      'Tracking student progress',
      'Creating engagement through gamification',
    ],
    'It supports both teachers and students in maintaining consistency.',
  ),
  FaqItem(
    'Can parents be involved through this program?',
    'Yes, parent involvement is a key feature:',
    [
      'Home-based activities',
      'Reinforcement tasks',
      'Better school-parent connection',
    ],
    'This ensures learning continues beyond the classroom.',
  ),
  FaqItem(
    'Who manages assessment and paper checking?',
    'The institution just has to implement the program — there is no burden of paper checking, etc. Everything is managed by our supported LMS (Learning Management System).',
  ),
  FaqItem(
    'What kind of support does the institution receive?',
    'Institutions receive:',
    [
      'Implementation guidance',
      'Ongoing support (where applicable)',
      'Updates and additional resources',
      'Access to evolving content ecosystem',
    ],
  ),
  FaqItem(
    'What is the long-term vision of the program?',
    'The program aims to reach thousands of schools globally, creating a generation of students with strong faith and character, while continuously expanding through digital platforms and new content formats.',
  ),
  FaqItem(
    'How can our school get started?',
    'Schools can begin by:',
    [
      'Contacting the program team',
      'Reviewing the curriculum',
      'Starting with a pilot batch or selected classes',
    ],
    'A step-by-step onboarding process is provided for smooth adoption.',
  ),
];

const individualFaqs = [
  FaqItem(
    'What is Imaan & Akhlaq?',
    'Imaan & Akhlaq is a children’s program that helps build strong faith (Imaan) and good character (Akhlaq) through stories, activities, and engaging learning methods. It teaches children how to live Islamic values in their daily life.',
  ),
  FaqItem(
    'Is this just a set of books?',
    'No, it is much more than books. It is a complete learning system that includes:',
    [
      'Story-based curriculum',
      'Activities and workbooks',
      'Audio stories',
      'Puppet shows',
      'A digital learning portal',
    ],
    'All of these work together to shape a child’s thinking, behavior, and habits.',
  ),
  FaqItem(
    'Who is this program for?',
    'This program is designed for children from early years (ECCE) up to Grade 7, with content tailored according to age and understanding level.',
  ),
  FaqItem(
    'What makes Imaan & Akhlaq different from other programs?',
    'Most programs focus on information, but Imaan & Akhlaq focuses on transformation.',
    [
      'It connects learning with real-life actions',
      'It uses stories children can relate to',
      'It builds habits, not just knowledge',
      'It involves both school and home',
    ],
  ),
  FaqItem(
    'How does the program teach children?',
    'Children learn through:',
    [
      'Stories inspired by Qur’an and Seerah',
      'Real-life situations they can relate to',
      'Activities and practice at home',
      'Fun and engaging methods like games and storytelling',
    ],
    'This makes learning easy, enjoyable, and meaningful.',
  ),
  FaqItem(
    'What are Imaan and Akhlaq as characters?',
    'Imaan and Akhlaq are shown as a brother and sister in the stories. They help children understand how to:',
    [
      'Make the right choices',
      'Stay strong in difficult situations',
      'Practice good manners in everyday life',
    ],
  ),
  FaqItem(
    'Is this program only for schools?',
    'No, it can be used:',
    [
      'In schools as a structured curriculum',
      'At home by parents to guide their children',
    ],
    'It is designed to connect both learning environments.',
  ),
  FaqItem(
    'What role do parents play in this program?',
    'Parents play a very important role. The program includes:',
    [
      'Home activities',
      'Practice exercises',
      'Simple tasks that strengthen family interaction',
    ],
    'This helps children apply what they learn in real life.',
  ),
  FaqItem(
    'How does the digital portal help my child?',
    'The portal provides a safe and guided learning space where children can:',
    [
      'Access lessons and stories',
      'Take quizzes and earn rewards',
      'Track their progress',
      'Stay motivated through fun learning',
    ],
    'It turns learning into a continuous and engaging journey.',
  ),
  FaqItem(
    'Is the content suitable for young children?',
    'Yes, all content is age-appropriate and designed carefully:',
    ['Simple for younger children', 'More structured for older students'],
    'Everything is made to match the child’s level of understanding.',
  ),
  FaqItem(
    'Does the program include entertainment?',
    'Yes, but with purpose. It includes:',
    ['Audio bedtime stories', 'Puppet shows', 'Interactive content'],
    'All entertainment is designed to teach positive values, not just pass time.',
  ),
  FaqItem(
    'What kind of impact can I expect on my child?',
    'With consistency, you can expect:',
    [
      'Better behavior and manners',
      'Stronger connection with Islamic values',
      'Improved decision-making',
      'More confidence in doing the right thing',
    ],
  ),
  FaqItem(
    'Is this program based on authentic Islamic teachings?',
    'Yes, the content is inspired by:',
    ['Qur’anic teachings', 'Seerah (life of the Prophet ﷺ)'],
    'It presents these teachings in a way that children can understand and follow.',
  ),
  FaqItem(
    'How is this different from traditional Islamic education?',
    'Traditional education often focuses on memorization and theory, while this program focuses on:',
    ['Understanding', 'Application', 'Daily life behavior'],
  ),
  FaqItem(
    'What is the main goal of Imaan & Akhlaq?',
    'The goal is simple but powerful: To raise children who not only know Islam, but also live it in their character and actions.',
  ),
];

/// The old app's FAQ (side menu → FAQ), with its two tabs: Individual
/// (shown first here) and School.
class FaqScreen extends StatefulWidget {
  const FaqScreen({super.key, this.school = false, this.onContact});
  final bool school;
  final VoidCallback? onContact;
  @override
  State<FaqScreen> createState() => _FaqScreenState();
}

class _FaqScreenState extends State<FaqScreen> {
  late bool _school = widget.school;
  int? _open = 0;

  @override
  Widget build(BuildContext context) {
    final items = _school ? schoolFaqs : individualFaqs;
    return Scaffold(
      backgroundColor: brandCream,
      appBar: AppBar(backgroundColor: brandCream, title: const Text('FAQs')),
      body: SafeArea(
        child: ConstrainedBody(
          maxWidth: 720,
          child: ListView(
            key: const Key('faq-list'),
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
            children: [
              SegmentedButton<bool>(
                key: const Key('faq-tabs'),
                showSelectedIcon: false,
                segments: const [
                  ButtonSegment(value: false, label: Text('For Individual')),
                  ButtonSegment(value: true, label: Text('For School')),
                ],
                selected: {_school},
                onSelectionChanged: (s) => setState(() {
                  _school = s.first;
                  _open = 0;
                }),
              ),
              const SizedBox(height: 16),
              Text(
                _school
                    ? 'Imaan & Akhlaq for Schools'
                    : 'Imaan & Akhlaq for Individuals',
                style: displayStyle(21),
              ),
              const SizedBox(height: 4),
              Text(
                _school
                    ? 'Frequently asked questions about our character-building program for educational institutions.'
                    : 'Frequently asked questions for parents and families using the program at home.',
                style: const TextStyle(color: Color(0xFF6B7488), height: 1.4),
              ),
              const SizedBox(height: 14),
              for (var i = 0; i < items.length; i++)
                _FaqCard(
                  key: ValueKey('${_school}_$i'),
                  number: i + 1,
                  item: items[i],
                  open: _open == i,
                  onTap: () => setState(() => _open = _open == i ? null : i),
                ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: brandNavy,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  children: [
                    const Text(
                      'Ready to get started?',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Contact our team for onboarding, pilot batches, or curriculum review.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: .85),
                        height: 1.4,
                      ),
                    ),
                    if (widget.onContact != null) ...[
                      const SizedBox(height: 12),
                      FilledButton(
                        key: const Key('faq-contact'),
                        onPressed: widget.onContact,
                        style: FilledButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: brandNavy,
                        ),
                        child: const Text('Contact Us'),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FaqCard extends StatelessWidget {
  const _FaqCard({
    super.key,
    required this.number,
    required this.item,
    required this.open,
    required this.onTap,
  });
  final int number;
  final FaqItem item;
  final bool open;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    const body = TextStyle(color: Color(0xFF4A4F63), height: 1.5);
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(
            color: open
                ? brandPink.withValues(alpha: .35)
                : const Color(0xFFEDE4DE),
          ),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(14, 14, 12, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 26,
                      height: 26,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: brandPink.withValues(alpha: .12),
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        '$number',
                        style: const TextStyle(
                          color: brandPink,
                          fontSize: 12.5,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        item.question,
                        style: const TextStyle(
                          color: brandNavy,
                          fontWeight: FontWeight.w700,
                          height: 1.3,
                        ),
                      ),
                    ),
                    Icon(
                      open
                          ? Icons.keyboard_arrow_up_rounded
                          : Icons.keyboard_arrow_down_rounded,
                      color: const Color(0xFF9AA1B2),
                    ),
                  ],
                ),
                if (open)
                  Padding(
                    padding: const EdgeInsetsDirectional.only(
                      start: 36,
                      top: 10,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(item.answer, style: body),
                        for (final p in item.points)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('•  ', style: body),
                                Expanded(child: Text(p, style: body)),
                              ],
                            ),
                          ),
                        if (item.after.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 6),
                            child: Text(item.after, style: body),
                          ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// The old app's About Us (public/apk/about.html), word for word.
class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key, required this.onContact});
  final VoidCallback onContact;

  static const _objectives = [
    (
      Icons.favorite_rounded,
      Color(0xFFE2608E),
      'Character-Centered',
      'To develop strong moral character by integrating Islamic values into everyday learning and behavior.',
    ),
    (
      Icons.sports_esports_rounded,
      Color(0xFF5B6CD8),
      'Holistic Learning',
      'Combining curriculum, storytelling, activities, and interactive tools for engaging education.',
    ),
    (
      Icons.mosque_rounded,
      Color(0xFF2E9E6B),
      'Faith Integration',
      'Strengthening children\'s connection with Islamic teachings through prophetic stories.',
    ),
    (
      Icons.star_rounded,
      Color(0xFFD9822B),
      'Behavior Transformation',
      'Inspiring courage, kindness, responsibility, and integrity in real-life situations.',
    ),
  ];

  static const _stages = [
    (
      'Foundation Stage',
      'Ages 5 – 8',
      'Foundational character building through storytelling, basic activity modules, and an introduction to prophetic narratives.',
    ),
    (
      'Interactive Stage',
      'Ages 9 – 10',
      'Interactive development with advanced club engagements, responsibility focus, and group tasks.',
    ),
    (
      'Ethical Maturation',
      'Ages 11 – 13',
      'Real-world scenarios, peer mentoring, and leadership grounded in prophetic stories.',
    ),
    (
      'Uswah e Hasana',
      'Ages 14+',
      'Embodying character, leading clubs, and complex behavioral transformation.',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    const body = TextStyle(color: Color(0xFF4A4F63), height: 1.55);
    Widget heading(String text) => Padding(
      padding: const EdgeInsets.only(top: 22, bottom: 8),
      child: Text(text, style: displayStyle(20)),
    );
    Widget card(Widget child) => Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFEDE4DE)),
      ),
      child: child,
    );
    return Scaffold(
      backgroundColor: brandCream,
      appBar: AppBar(
        backgroundColor: brandCream,
        title: Text(tr('About Us', 'ہمارے بارے میں')),
      ),
      body: SafeArea(
        child: ConstrainedBody(
          maxWidth: 680,
          child: ListView(
            key: const Key('about-page'),
            padding: const EdgeInsets.fromLTRB(18, 4, 18, 28),
            children: [
              const Center(child: BrandLogoRing(size: 96)),
              heading('Introduction & Objective'),
              card(
                const Text(
                  'Rooted in timeless Islamic values, Imaan & Akhlaq brings to life the inspiring journey of two siblings — Imaan (faith) and Akhlaq (character) — who guide young learners to live with courage, kindness, and integrity.',
                  style: body,
                ),
              ),
              heading('Our Vision'),
              card(
                const Text(
                  'To nurture a generation of confident, responsible, and virtuous Muslims by embedding Imaan (faith) and Akhlaq (character) at the heart of education, enabling young learners to live with courage, kindness, and integrity in every aspect of life.',
                  style: body,
                ),
              ),
              heading('Guided by Imaan & Akhlaq'),
              card(
                const Column(
                  children: [
                    BrandCompanions(width: 220, height: 170),
                    SizedBox(height: 10),
                    Text(
                      'Interactive characters in our educational experiences.',
                      textAlign: TextAlign.center,
                      style: body,
                    ),
                  ],
                ),
              ),
              heading('Introduction'),
              card(
                const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Designed as more than just a curriculum, the program offers a holistic learning experience that seamlessly blends structured books, engaging coloring activities, and prophetic storytelling with modern tools such as games, animations, and school-based clubs.',
                      style: body,
                    ),
                    SizedBox(height: 10),
                    Text(
                      'At its core, Imaan & Akhlaq aims to develop children into moral figures of Uswah e Hasana. Following the success of pilot implementations, the program is set for a nationwide launch in 2026!',
                      style: body,
                    ),
                  ],
                ),
              ),
              heading('Core Objectives'),
              for (final (icon, color, title, text) in _objectives)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: card(
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: color.withValues(alpha: .12),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(icon, color: color, size: 21),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                title,
                                style: const TextStyle(
                                  color: brandNavy,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(text, style: body),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              heading('Progression Focus'),
              for (final (name, ages, text) in _stages)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: card(
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                name,
                                style: const TextStyle(
                                  color: brandNavy,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 3,
                              ),
                              decoration: BoxDecoration(
                                color: brandOrange.withValues(alpha: .14),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                ages,
                                style: const TextStyle(
                                  color: Color(0xFFB0661F),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(text, style: body),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 14),
              const Text(
                'Imaan & Akhlaq — Nurturing Faith & Character',
                textAlign: TextAlign.center,
                style: TextStyle(color: brandNavy, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 12),
              FilledButton.icon(
                key: const Key('about-contact'),
                onPressed: onContact,
                icon: const Icon(Icons.chat_outlined),
                label: const Text('Contact Us'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
