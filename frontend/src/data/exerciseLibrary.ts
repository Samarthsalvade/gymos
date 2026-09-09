/**
 * Comprehensive Exercise Library
 * Maps exercise keywords → YouTube video IDs + detailed form instructions
 * Videos from trusted fitness educators (Jeff Nippard, Alan Thrall, Scott Herman, etc.)
 */

export interface ExerciseMedia {
  youtubeId: string;
  thumbnail: string;
  credit?: string;
}

export interface ExerciseGuide {
  formSteps: string[];
  commonMistakes: string[];
  breathingTip: string;
  muscleGroup: string;
  equipment: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  media: ExerciseMedia;
}

// YouTube video IDs for exercise demonstrations
const EXERCISE_DB: Record<string, ExerciseGuide> = {

  // ── CHEST ───────────────────────────────────────────────
  'bench press': {
    muscleGroup: 'Chest, Triceps, Front Deltoids',
    equipment: 'Barbell, Bench',
    difficulty: 'Intermediate',
    media: { youtubeId: 'rT7DgCr-3pg', thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&q=80', credit: 'Jeff Nippard' },
    formSteps: [
      'Lie flat on bench with eyes directly under the bar',
      'Plant feet firmly on the floor, wider than shoulder-width',
      'Grip the bar slightly wider than shoulder-width — thumbs wrapped around',
      'Retract and depress your shoulder blades (pinch them down and together)',
      'Unrack the bar and lower it slowly to your mid-chest (3–4 second descent)',
      'Touch lightly — do NOT bounce off chest',
      'Press the bar up and slightly back toward the rack in a slight arc',
      'Lock out at the top without fully relaxing shoulder blades',
    ],
    commonMistakes: ['Flaring elbows 90° out (causes shoulder injury)', 'Bouncing the bar off the chest', 'Lifting the hips off the bench', 'Gripping the bar with wrists bent backwards'],
    breathingTip: 'Deep breath in and brace your core before lowering. Exhale forcefully as you press up.',
  },

  'incline bench press': {
    muscleGroup: 'Upper Chest, Front Deltoids, Triceps',
    equipment: 'Barbell, Incline Bench (30–45°)',
    difficulty: 'Intermediate',
    media: { youtubeId: 'jPLdzuHckI8', thumbnail: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500&q=80' },
    formSteps: [
      'Set bench at 30–45° (higher angles shift more to front delts)',
      'Sit back against the pad with feet flat on floor',
      'Grip bar slightly wider than shoulders with thumbs wrapped',
      'Unrack and lower to your upper chest / collarbone area',
      'Keep elbows at about 60–75° angle from your torso',
      'Press up in a slight arc back to starting position',
      'Squeeze chest hard at the top',
    ],
    commonMistakes: ['Using too high an angle (>45°) which hits deltoids more than chest', 'Letting elbows flare excessively', 'Losing back arch and shoulder blade retraction'],
    breathingTip: 'Inhale as you lower the bar, exhale as you press.',
  },

  'push up': {
    muscleGroup: 'Chest, Triceps, Core, Front Deltoids',
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    media: { youtubeId: 'IODxDxX7oi4', thumbnail: 'https://images.unsplash.com/photo-1600881333168-2ef49b341f30?w=500&q=80' },
    formSteps: [
      'Place hands slightly wider than shoulder-width, fingers pointing forward',
      'Create a rigid plank — squeeze glutes and brace core',
      'Lower your chest to the floor keeping elbows at 45° angle (not flared)',
      'Your chest should touch (or nearly touch) the floor first',
      'Push up explosively through your palms, fully extend arms',
      'Keep your body as one rigid unit throughout — no sagging hips',
    ],
    commonMistakes: ['Sagging hips (banana back)', 'Flaring elbows out to 90°', 'Only going halfway down', 'Looking up — keep neck neutral'],
    breathingTip: 'Inhale going down, exhale as you push up.',
  },

  'dumbbell fly': {
    muscleGroup: 'Chest (Pectoral Stretch), Front Deltoids',
    equipment: 'Dumbbells, Flat Bench',
    difficulty: 'Beginner',
    media: { youtubeId: 'eozdVDA78K0', thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&q=80' },
    formSteps: [
      'Lie flat on bench, hold dumbbells above chest with palms facing each other',
      'Slight bend in elbows — maintain this angle throughout (not straight arms)',
      'Lower dumbbells in a wide arc out to the sides, feel a deep chest stretch',
      'Stop when dumbbells are at shoulder level or slightly below',
      'Squeeze chest and bring dumbbells back up in the same arc',
      'Think "hugging a barrel" — elbows lead the movement',
    ],
    commonMistakes: ['Turning it into a press (bending elbows too much)', 'Going too heavy and tearing pec', 'Not getting full stretch at the bottom'],
    breathingTip: 'Inhale on the way down (opening), exhale as you close and squeeze.',
  },

  'cable fly': {
    muscleGroup: 'Inner and Outer Chest',
    equipment: 'Cable Machine',
    difficulty: 'Beginner',
    media: { youtubeId: 'Iwe6AmxVf7o', thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&q=80' },
    formSteps: [
      'Set cables at shoulder height (high cables for lower chest, low for upper)',
      'Stand in the center, one foot forward for stability',
      'Hold handles with slight elbow bend, lean forward slightly at hips',
      'Bring hands together in front of you in a hugging motion',
      'Squeeze chest hard at the point where hands meet',
      'Slowly return to the starting position with controlled tension',
    ],
    commonMistakes: ['Letting arms go too far back (shoulder strain)', 'Losing elbow angle and turning into a press', 'Using momentum instead of muscle control'],
    breathingTip: 'Exhale as you bring the handles together, inhale as you open up.',
  },

  // ── BACK ────────────────────────────────────────────────
  'pull up': {
    muscleGroup: 'Latissimus Dorsi, Biceps, Rhomboids, Core',
    equipment: 'Pull-up Bar',
    difficulty: 'Intermediate',
    media: { youtubeId: 'eGo4IYlbE5g', thumbnail: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=500&q=80' },
    formSteps: [
      'Hang with hands slightly wider than shoulder-width, palms facing away (pronated)',
      'Depress and retract your shoulder blades — activate lats before pulling',
      'Lead with your chest, not your chin — imagine pushing your chest up to the bar',
      'Drive your elbows down and back toward your hips',
      'Pull until chin clears the bar, ideally chest touches or comes close',
      'Lower under control — full dead hang at the bottom for full range of motion',
    ],
    commonMistakes: ['Shrugging shoulders to ears at the top', 'Kipping or swinging for momentum', 'Only going halfway down', 'Chin-leading instead of chest-leading'],
    breathingTip: 'Exhale as you pull up, inhale as you lower down.',
  },

  'lat pulldown': {
    muscleGroup: 'Latissimus Dorsi, Biceps, Rear Deltoids',
    equipment: 'Cable Machine, Lat Bar',
    difficulty: 'Beginner',
    media: { youtubeId: 'CAwf7n6Tuhs', thumbnail: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=500&q=80' },
    formSteps: [
      'Sit and lock thighs under the pad firmly',
      'Grip the bar wider than shoulder-width with overhand grip',
      'Lean back slightly (15–20°) — NOT excessively',
      'Depress shoulder blades and drive elbows straight down to hips',
      'Pull bar to upper chest (not behind the neck — dangerous for spine)',
      'Squeeze lats hard when bar is at chest level',
      'Return bar up slowly — feel the lat stretch at the top',
    ],
    commonMistakes: ['Pulling behind the neck (cervical spine stress)', 'Using too much bicep (arms doing all the work)', 'Leaning back too far (turns into row)', 'No controlled return (losing tension)'],
    breathingTip: 'Exhale on the pull, inhale as you extend arms back up.',
  },

  'deadlift': {
    muscleGroup: 'Hamstrings, Glutes, Lower Back, Traps, Core',
    equipment: 'Barbell',
    difficulty: 'Advanced',
    media: { youtubeId: 'op9kVnSso6Q', thumbnail: 'https://images.unsplash.com/photo-1517963879433-6ad2171073fb?w=500&q=80' },
    formSteps: [
      'Stand with bar over mid-foot (about 1 inch from shins)',
      'Feet hip-width apart, toes slightly out',
      'Hinge at hips and grip bar just outside legs (double overhand or mixed grip)',
      'Flatten your back — chest up, shoulders slightly in front of bar',
      'Take a deep breath, brace your core like you\'re about to get punched',
      'Push the floor away (leg drive), NOT pulling with your back',
      'Keep bar dragging close to your body as it rises (it should scrape shins)',
      'Lock out hips and knees simultaneously — stand tall, don\'t hyperextend',
      'Lower by hinging at hips first, then bending knees once bar passes them',
    ],
    commonMistakes: ['Rounding the lower back (most dangerous mistake)', 'Bar drifting away from the body', 'Jerking the bar instead of smooth drive', 'Hyperextending at lockout'],
    breathingTip: 'Take a HUGE breath before lifting, hold (Valsalva maneuver), exhale at the top or on the way down.',
  },

  'barbell row': {
    muscleGroup: 'Latissimus Dorsi, Rhomboids, Rear Deltoids, Biceps',
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    media: { youtubeId: 'G8l_8chR5BE', thumbnail: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=500&q=80' },
    formSteps: [
      'Stand with feet hip-width, hinge forward to 45–60° with flat back',
      'Grip bar just outside legs with overhand grip',
      'Start with arms fully extended — bar hangs below your chest',
      'Drive elbows back and up — lead with the elbows, not hands',
      'Pull bar to your lower sternum / upper abs (NOT your chest)',
      'Squeeze shoulder blades together at the top',
      'Lower bar with full control to full arm extension',
    ],
    commonMistakes: ['Rounding the lower back', 'Using too much body English (heaving)', 'Pulling to the chest instead of abs', 'Not getting full stretch at bottom'],
    breathingTip: 'Brace core, exhale as you row up, inhale as you lower.',
  },

  'cable row': {
    muscleGroup: 'Mid Back, Latissimus Dorsi, Biceps',
    equipment: 'Cable Machine',
    difficulty: 'Beginner',
    media: { youtubeId: 'GZbfZ033f74', thumbnail: 'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=500&q=80' },
    formSteps: [
      'Sit on the bench with feet on the platform, slight knee bend',
      'Sit tall — neutral spine throughout (no hunching)',
      'Grab the cable handle, arms extended but don\'t let shoulders round forward',
      'Drive elbows straight back — NOT out to sides',
      'Pull handle to your belly button, squeeze shoulder blades together',
      'Hold for 1 second at peak contraction',
      'Let arms extend forward with control, allowing full shoulder stretch',
    ],
    commonMistakes: ['Rounding the back at full extension (shoulder rounding OK, but not spine)', 'Leaning too far back (turns into a back extension)', 'Pulling to chest instead of abs'],
    breathingTip: 'Exhale on the pull, inhale on the release.',
  },

  // ── LEGS ────────────────────────────────────────────────
  'squat': {
    muscleGroup: 'Quadriceps, Hamstrings, Glutes, Core',
    equipment: 'Barbell, Squat Rack',
    difficulty: 'Intermediate',
    media: { youtubeId: 'ultWZbUMPL8', thumbnail: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=500&q=80' },
    formSteps: [
      'Set the bar at upper chest height in the rack',
      'Step under bar — high bar: on upper traps. Low bar: across rear delts',
      'Feet shoulder to hip-width, toes out 15–30°',
      'Unrack, take 2 steps back. Brace core + take a deep breath',
      'Break at the hips and knees simultaneously — "sit between your legs"',
      'Squat until hip crease is BELOW the top of your knee (parallel or below)',
      'Keep knees tracking over toes — don\'t let them cave inward',
      'Drive through your heels and mid-foot to stand up',
      'Lock out hips fully at the top — don\'t lean too far forward',
    ],
    commonMistakes: ['Knee valgus (knees caving inward)', 'Not breaking parallel (quarter squats)', 'Excessive forward lean', 'Heels rising off the floor (ankle mobility issue)'],
    breathingTip: 'Deep breath at the top, hold throughout the descent AND ascent (Valsalva). Exhale at lockout.',
  },

  'leg press': {
    muscleGroup: 'Quadriceps, Glutes, Hamstrings',
    equipment: 'Leg Press Machine',
    difficulty: 'Beginner',
    media: { youtubeId: 'IZxyjW7MPJQ', thumbnail: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=500&q=80' },
    formSteps: [
      'Sit in the machine with your back and head flat against the pad',
      'Place feet shoulder-width on the platform, toes slightly out',
      'Unlock the safety handles before pressing',
      'Lower the platform by bending knees until they\'re at 90° (or slightly past)',
      'Do NOT let your lower back peel off the seat at the bottom',
      'Press through your heels — don\'t lock knees completely at top',
      'Engage the safety handles when done',
    ],
    commonMistakes: ['Placing feet too low (puts stress on knees)', 'Lower back lifting off pad at bottom', 'Fully locking out knees (joint stress)', 'Going too heavy and limiting range'],
    breathingTip: 'Inhale as you lower the weight, exhale as you press.',
  },

  'romanian deadlift': {
    muscleGroup: 'Hamstrings, Glutes, Lower Back',
    equipment: 'Barbell or Dumbbells',
    difficulty: 'Intermediate',
    media: { youtubeId: 'JCXUYuzwNrM', thumbnail: 'https://images.unsplash.com/photo-1517963879433-6ad2171073fb?w=500&q=80' },
    formSteps: [
      'Stand holding bar at hips, shoulder-width overhand grip',
      'Slight bend in knees — maintain this throughout (this is NOT a deadlift)',
      'Hinge at your hips by pushing them BACK — think "closing a door with your butt"',
      'Lower bar along your legs (bar grazes or stays very close to shins)',
      'Lower until you feel a deep hamstring stretch (usually shin level)',
      'Drive hips forward to return to starting position — squeeze glutes at top',
    ],
    commonMistakes: ['Bending knees too much (turning into a deadlift)', 'Rounding the lower back', 'Not pushing hips back enough (just bending forward)', 'Bar drifting away from legs'],
    breathingTip: 'Inhale at the top, hold breath and hinge down, exhale as you drive hips forward.',
  },

  'lunge': {
    muscleGroup: 'Quadriceps, Glutes, Hamstrings, Balance',
    equipment: 'Bodyweight or Dumbbells',
    difficulty: 'Beginner',
    media: { youtubeId: 'D7KaRcUTQeE', thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80' },
    formSteps: [
      'Stand tall, feet hip-width, core braced',
      'Step forward with one leg — long enough that both knees reach ~90° at bottom',
      'Lower back knee toward the floor — stop 1–2 inches above ground',
      'Front knee should track over the foot — NOT caving inward',
      'Drive through the front heel to stand back up',
      'Alternate legs or complete all reps on one side first',
    ],
    commonMistakes: ['Front knee going past the toes (excessive lean)', 'Torso leaning too far forward', 'Back knee slamming the floor', 'Steps too short — not getting depth'],
    breathingTip: 'Inhale as you step and lower, exhale as you push back up.',
  },

  'hip thrust': {
    muscleGroup: 'Glutes (Maximum Activation), Hamstrings',
    equipment: 'Barbell, Bench',
    difficulty: 'Beginner',
    media: { youtubeId: 'LM8XfLyNmVc', thumbnail: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&q=80' },
    formSteps: [
      'Sit on the floor, upper back against a bench edge (just below shoulder blades)',
      'Roll barbell over your hips (use a pad for comfort)',
      'Feet flat on floor, hip-width, knees at ~90° when at the top',
      'Drive through your heels — thrust hips up explosively',
      'At the top: body parallel to floor, knees at 90°, SQUEEZE glutes hard',
      'Chin tuck to neutral — do NOT hyperextend your lower back',
      'Lower hips back toward the floor slowly',
    ],
    commonMistakes: ['Hyperextending lower back at the top (this is lower back, not glutes)', 'Feet too far away (more hamstring, less glute)', 'Not squeezing glutes at top', 'Looking up and neck hyperextending'],
    breathingTip: 'Exhale hard and forcefully as you thrust up, inhale on the way down.',
  },

  'leg extension': {
    muscleGroup: 'Quadriceps (Isolation)',
    equipment: 'Leg Extension Machine',
    difficulty: 'Beginner',
    media: { youtubeId: 'YyvSfVjQeL0', thumbnail: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=500&q=80' },
    formSteps: [
      'Sit with your back flat against the pad, knees at the edge of the seat',
      'Adjust the ankle pad to sit just above the ankles (not the foot)',
      'Grip the handles on the sides for stability',
      'Extend both legs until fully straight — squeeze quads HARD at the top',
      'Hold for 1 second at peak contraction',
      'Lower with control — DON\'T let the weight crash down',
    ],
    commonMistakes: ['Not fully extending (losing peak quad contraction)', 'Using momentum (swinging up quickly)', 'Sitting too far forward (reduces ROM)', 'Forgetting to squeeze at the top'],
    breathingTip: 'Exhale as you extend up, inhale as you lower.',
  },

  'leg curl': {
    muscleGroup: 'Hamstrings (Isolation)',
    equipment: 'Leg Curl Machine',
    difficulty: 'Beginner',
    media: { youtubeId: '1Tq3QdYUuHs', thumbnail: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=500&q=80' },
    formSteps: [
      'Lie face down, knees just at the edge of the bench',
      'Ankle pad should sit just above your heels',
      'Keep hips pressed into the bench throughout',
      'Curl legs up by contracting hamstrings — full range of motion',
      'Aim to bring heels as close to glutes as possible',
      'Squeeze hard at the top, then lower with control',
    ],
    commonMistakes: ['Hips lifting off the bench (using lower back)', 'Not getting full range of motion', 'Dropping the weight quickly on the way down', 'Pointing toes (engages calves instead)'],
    breathingTip: 'Exhale on the curl, inhale as you extend back.',
  },

  'calf raise': {
    muscleGroup: 'Gastrocnemius, Soleus',
    equipment: 'Calf Raise Machine or Step',
    difficulty: 'Beginner',
    media: { youtubeId: 'gwLzBJYoWlA', thumbnail: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=500&q=80' },
    formSteps: [
      'Stand with the balls of your feet on the edge of a step (heels hanging off)',
      'Start with full heel drop — maximum stretch of the calf',
      'Rise up onto your toes as high as possible — maximum contraction',
      'Hold at the very top for 1–2 seconds to maximize tension',
      'Lower slowly back to full stretch',
      'Complete the full range on EVERY rep — no short range raises',
    ],
    commonMistakes: ['Not going through full range of motion (short reps are ineffective)', 'Bouncing at the bottom', 'Going too fast — calves need slow controlled reps', 'Not holding at the top'],
    breathingTip: 'Exhale on the way up, inhale on the way down.',
  },

  'bulgarian split squat': {
    muscleGroup: 'Quadriceps, Glutes, Hamstrings, Balance',
    equipment: 'Bench, Dumbbells or Bodyweight',
    difficulty: 'Intermediate',
    media: { youtubeId: 'vUPiR16QLGI', thumbnail: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=500&q=80' },
    formSteps: [
      'Stand 2–3 feet in front of a bench, facing away from it',
      'Rest the top of one foot on the bench behind you (laces down)',
      'Front foot should be far enough that your front shin stays vertical at the bottom',
      'Lower your back knee toward the floor — keep torso upright',
      'Front knee tracks over the front foot, goes to at least 90°',
      'Drive through your front heel to come back up',
      'Complete all reps on one leg before switching',
    ],
    commonMistakes: ['Front foot too close to bench (knee goes past toes)', 'Torso leaning too far forward', 'Back foot pushing into bench for help (defeat the purpose)'],
    breathingTip: 'Inhale as you lower, exhale as you drive up.',
  },

  // ── SHOULDERS ───────────────────────────────────────────
  'overhead press': {
    muscleGroup: 'Front Deltoids, Side Deltoids, Triceps, Serratus',
    equipment: 'Barbell or Dumbbells',
    difficulty: 'Intermediate',
    media: { youtubeId: '2yjwXTZQDDI', thumbnail: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&q=80' },
    formSteps: [
      'Grip the bar just outside shoulder-width with elbows slightly forward',
      'The bar should rest on the front delts/collarbone in the rack position',
      'Feet hip-width, core braced, glutes squeezed',
      'Press the bar STRAIGHT up — not forward. Move your head back slightly as bar passes',
      'Lock out arms overhead — bar should be stacked over your heels',
      'Lower bar back to collarbone under control',
    ],
    commonMistakes: ['Pressing in front of body (bar drifts forward)', 'Flaring elbows too wide', 'Excessive lower back arch (lean back too much)', 'Not fully locking out overhead'],
    breathingTip: 'Brace and breathe in before each rep, exhale at the top.',
  },

  'lateral raise': {
    muscleGroup: 'Side (Medial) Deltoids',
    equipment: 'Dumbbells',
    difficulty: 'Beginner',
    media: { youtubeId: 'geenhiHgu-4', thumbnail: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&q=80' },
    formSteps: [
      'Stand with dumbbells at sides, slight forward lean (10–15°)',
      'Slight bend in elbows — maintain this throughout',
      'Raise dumbbells out to the sides — lead with the elbow, not the hand',
      'As you raise, tilt the front of the dumbbell down slightly (like pouring water)',
      'Stop when arms are parallel to floor — any higher shifts to traps',
      'Lower with FULL control — the lowering phase builds the muscle too',
    ],
    commonMistakes: ['Swinging the weights up (using momentum)', 'Shrugging traps (using traps instead of delts)', 'Raising too high above shoulders', 'Dropping arms too quickly'],
    breathingTip: 'Exhale as you raise, inhale as you lower.',
  },

  'arnold press': {
    muscleGroup: 'All Three Deltoid Heads, Triceps',
    equipment: 'Dumbbells',
    difficulty: 'Intermediate',
    media: { youtubeId: '6Z15_WdXmVw', thumbnail: 'https://images.unsplash.com/photo-1549476464-37392f717541?w=500&q=80' },
    formSteps: [
      'Start with dumbbells at shoulder height, palms facing YOU (like a bicep curl finish)',
      'As you press up, rotate your palms to face FORWARD at the top',
      'Arms fully extended overhead at the top',
      'Reverse the rotation on the way down — palms face you at the bottom again',
      'The rotation engages more of the deltoid throughout the movement',
    ],
    commonMistakes: ['Rushing the rotation (losing the benefit)', 'Not fully pressing overhead', 'Going too heavy and losing the rotational component'],
    breathingTip: 'Exhale on the press, inhale on the way down.',
  },

  'face pull': {
    muscleGroup: 'Rear Deltoids, Rotator Cuff, Rhomboids',
    equipment: 'Cable Machine, Rope Attachment',
    difficulty: 'Beginner',
    media: { youtubeId: 'eIq5CB9JfKE', thumbnail: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&q=80' },
    formSteps: [
      'Set cable at or above face height with a rope attachment',
      'Grab rope with thumbs pointing up, step back to create tension',
      'Pull rope toward your FACE (not neck/chest) — thumbs move toward your ears',
      'External rotate at the end — elbows should end up BEHIND your head',
      'Squeeze rear delts and external rotators at peak contraction',
      'Slowly return to starting position',
    ],
    commonMistakes: ['Pulling to neck or chest (removes rear delt activation)', 'Using too much weight (loses rotation)', 'Not externally rotating at the end', 'Pulling elbows DOWN instead of BACK'],
    breathingTip: 'Exhale as you pull, inhale as you release.',
  },

  // ── ARMS ────────────────────────────────────────────────
  'bicep curl': {
    muscleGroup: 'Biceps Brachii, Brachialis',
    equipment: 'Dumbbells or Barbell',
    difficulty: 'Beginner',
    media: { youtubeId: '8d2MHB-Zq0M', thumbnail: 'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=500&q=80' },
    formSteps: [
      'Stand with feet shoulder-width, dumbbells at sides, palms facing forward',
      'Pin your upper arms to your sides — they should NOT move during the curl',
      'Curl the weight by contracting your biceps (not swinging shoulders back)',
      'Supinate your wrist (rotate palm up) as you curl — maximizes bicep activation',
      'Squeeze hard at the top, elbow fully bent',
      'Lower SLOWLY under control — the eccentric (lowering) builds muscle too',
      'Full extension at the bottom for complete range of motion',
    ],
    commonMistakes: ['Swinging torso backward (using momentum)', 'Not fully extending at the bottom', 'Elbows drifting forward at the top', 'Going too heavy and losing form'],
    breathingTip: 'Exhale as you curl up, inhale as you lower down.',
  },

  'hammer curl': {
    muscleGroup: 'Brachialis, Biceps, Brachioradialis (Forearm)',
    equipment: 'Dumbbells',
    difficulty: 'Beginner',
    media: { youtubeId: 'TwD-YGVP4Bk', thumbnail: 'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=500&q=80' },
    formSteps: [
      'Hold dumbbells with a neutral grip (palms facing each other, thumbs up)',
      'Keep upper arms fixed at your sides',
      'Curl the dumbbells upward maintaining the neutral grip (hammer position)',
      'Squeeze at the top, forearms perpendicular to floor or slightly past',
      'Lower with full control',
      'Can be done alternating or simultaneously',
    ],
    commonMistakes: ['Rotating wrists (defeats the neutral grip benefit)', 'Swinging elbows forward at the top', 'Not getting full range of motion'],
    breathingTip: 'Exhale on the curl, inhale as you lower.',
  },

  'tricep pushdown': {
    muscleGroup: 'Triceps (All Three Heads)',
    equipment: 'Cable Machine, Bar or Rope Attachment',
    difficulty: 'Beginner',
    media: { youtubeId: 'vB5OHsJ3EME', thumbnail: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500&q=80' },
    formSteps: [
      'Set cable to high position with straight bar or rope',
      'Stand close to the machine — slight forward lean (10–15°)',
      'Tuck upper arms against your ribs — they don\'t move',
      'Push the bar or rope straight down by extending at the elbows',
      'Fully lock out arms at the bottom — squeeze triceps hard',
      'Control the return up — don\'t let elbows flare out',
    ],
    commonMistakes: ['Elbows flaring out from sides', 'Using body weight to push down (leaning)', 'Not fully extending (not locking out)', 'Upper arms moving forward and back'],
    breathingTip: 'Exhale on the pushdown, inhale as you return.',
  },

  'skull crusher': {
    muscleGroup: 'Triceps (Long Head Focus)',
    equipment: 'EZ Bar or Barbell, Flat Bench',
    difficulty: 'Intermediate',
    media: { youtubeId: 'NIKqr8OmQ4k', thumbnail: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500&q=80' },
    formSteps: [
      'Lie flat on bench, hold EZ bar with close grip, arms perpendicular to body',
      'Upper arms pointing straight up — these stay fixed throughout',
      'Lower bar by bending ONLY at the elbows — toward forehead/top of head (hence "skull crusher")',
      'Keep elbows from flaring out — point them at the ceiling',
      'Extend back to straight arms by contracting triceps',
      'Do NOT lock elbows completely at the top — keep tension',
    ],
    commonMistakes: ['Letting elbows flare wide (shifts to chest)', 'Moving upper arms (defeats isolation)', 'Going too heavy and losing control near the head'],
    breathingTip: 'Inhale as you lower toward your skull, exhale as you extend.',
  },

  // ── CORE ────────────────────────────────────────────────
  'plank': {
    muscleGroup: 'Core (Transverse Abdominis), Shoulders, Glutes',
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    media: { youtubeId: 'ASdvN_XEl_c', thumbnail: 'https://images.unsplash.com/photo-1571945192237-4734538e59f6?w=500&q=80' },
    formSteps: [
      'Forearms on the floor, elbows directly below shoulders',
      'Come up onto toes — body forms a straight line from head to heels',
      'SQUEEZE glutes hard — this is the most important cue',
      'Pull your belly button toward your spine (brace your core)',
      'Keep your hips in line — no sagging and no "tent" position (hips up)',
      'Breathe steadily throughout — don\'t hold your breath',
      'Look at the floor to keep neck neutral',
    ],
    commonMistakes: ['Hips sagging (no core engagement)', 'Hips too high (removes core tension)', 'Holding breath', 'Head dropping down or looking up', 'Not squeezing glutes'],
    breathingTip: 'Breathe steadily — exhale through pursed lips to increase intra-abdominal pressure.',
  },

  'crunch': {
    muscleGroup: 'Rectus Abdominis (Upper), Obliques',
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    media: { youtubeId: 'Xyd_fa5zoEU', thumbnail: 'https://images.unsplash.com/photo-1571945192237-4734538e59f6?w=500&q=80' },
    formSteps: [
      'Lie on your back, knees bent at 90°, feet flat on floor',
      'Cross arms on chest or place fingertips lightly behind ears (DON\'T pull head)',
      'Press lower back into the floor before you start',
      'Curl your upper torso ONLY toward your knees — not a full sit-up',
      'Focus on shortening the gap between ribs and hips (ab contraction)',
      'At the top, exhale fully and squeeze abs hard',
      'Lower slowly under control — don\'t drop back down',
    ],
    commonMistakes: ['Pulling neck/head forward with hands (neck strain)', 'Full sit-ups instead of crunches (hip flexors do the work)', 'Going too fast and losing tension', 'Not fully exhaling and squeezing at top'],
    breathingTip: 'Exhale forcefully at the top of the crunch, inhale as you lower.',
  },

  'mountain climber': {
    muscleGroup: 'Core, Hip Flexors, Shoulders, Cardiovascular',
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    media: { youtubeId: 'nmwgirgXLYM', thumbnail: 'https://images.unsplash.com/photo-1571945192237-4734538e59f6?w=500&q=80' },
    formSteps: [
      'Start in a high plank position — wrists under shoulders, body rigid',
      'Brace core and squeeze glutes (same as a plank)',
      'Drive one knee toward your chest rapidly while keeping hips flat',
      'Return that leg and immediately drive the other knee forward',
      'Alternate at a pace you can maintain while keeping hips LEVEL (not bouncing up and down)',
      'Keep shoulders directly over wrists — don\'t let hips rock side to side',
    ],
    commonMistakes: ['Hips bouncing up and down', 'Losing plank position (hips dropping)', 'Going so fast that form breaks down completely', 'Shoulders drifting back from wrists'],
    breathingTip: 'Breathe rhythmically throughout — exhale as each knee drives in.',
  },
};

// ── Keyword lookup ───────────────────────────────────────────────
export function getExerciseGuide(exerciseName: string, category?: string): ExerciseGuide | null {
  const name = (exerciseName || '').toLowerCase().trim();

  // Exact match first
  for (const [key, guide] of Object.entries(EXERCISE_DB)) {
    if (name === key || name.includes(key) || key.includes(name)) {
      return guide;
    }
  }

  // Keyword partial match
  const keywords = Object.keys(EXERCISE_DB);
  for (const key of keywords) {
    const keyWords = key.split(' ');
    if (keyWords.some(w => w.length > 3 && name.includes(w))) {
      return EXERCISE_DB[key];
    }
  }

  // Category fallback
  const cat = (category || '').toLowerCase();
  if (cat.includes('chest')) return EXERCISE_DB['push up'];
  if (cat.includes('back')) return EXERCISE_DB['lat pulldown'];
  if (cat.includes('leg') || cat.includes('glute')) return EXERCISE_DB['squat'];
  if (cat.includes('shoulder')) return EXERCISE_DB['lateral raise'];
  if (cat.includes('arm') || cat.includes('bicep')) return EXERCISE_DB['bicep curl'];
  if (cat.includes('tricep')) return EXERCISE_DB['tricep pushdown'];
  if (cat.includes('core') || cat.includes('ab')) return EXERCISE_DB['plank'];
  if (cat.includes('cardio')) return null;

  return null;
}

// ── YouTube embed URL ────────────────────────────────────────────
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=1&modestbranding=1&rel=0&showinfo=0`;
}

export function getYoutubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

// Static Unsplash fallback images by keyword
export const EXERCISE_IMAGES: Record<string, string> = {
  'bench press':      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&q=80',
  'squat':            'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=500&q=80',
  'deadlift':         'https://images.unsplash.com/photo-1517963879433-6ad2171073fb?w=500&q=80',
  'pull':             'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=500&q=80',
  'press':            'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&q=80',
  'row':              'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=500&q=80',
  'curl':             'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=500&q=80',
  'tricep':           'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500&q=80',
  'lunge':            'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80',
  'plank':            'https://images.unsplash.com/photo-1571945192237-4734538e59f6?w=500&q=80',
  'crunch':           'https://images.unsplash.com/photo-1571945192237-4734538e59f6?w=500&q=80',
  'shoulder':         'https://images.unsplash.com/photo-1549476464-37392f717541?w=500&q=80',
  'fly':              'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500&q=80',
  'push':             'https://images.unsplash.com/photo-1600881333168-2ef49b341f30?w=500&q=80',
  'cardio':           'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=500&q=80',
  'default':          'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500&q=80',
};

export function getExerciseImage(exerciseName: string, category?: string): string {
  const name = (exerciseName || '').toLowerCase();
  for (const [key, url] of Object.entries(EXERCISE_IMAGES)) {
    if (name.includes(key)) return url;
  }
  const cat = (category || '').toLowerCase();
  for (const [key, url] of Object.entries(EXERCISE_IMAGES)) {
    if (cat.includes(key)) return url;
  }
  return EXERCISE_IMAGES['default'];
}
