import { Request, Response } from 'express';
import Groq from 'groq-sdk';
import prisma from '../utils/prisma';

function getGroq() {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY not set in backend/.env');
  return new Groq({ apiKey: key });
}

async function callGroq(systemPrompt: string, userPrompt: string): Promise<any> {
  const groq = getGroq();
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 2048,
  });
  return JSON.parse(completion.choices[0].message.content || '{}');
}

export async function generateWorkoutPlan(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const userId = req.user!.userId;

  if (!process.env.GROQ_API_KEY) {
    res.status(503).json({ error: 'AI not configured. Add GROQ_API_KEY to backend/.env. Get a free key at console.groq.com' });
    return;
  }

  const [user, equipment] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, include: { profile: true } }),
    prisma.equipment.findMany({ where: { gymId, condition: { not: 'OUT_OF_ORDER' } } }),
  ]);
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }

  const profile = user.profile;
  const equipmentList = equipment.map(e => `${e.name} (${e.category}, qty: ${e.quantity})`).join('\n');

  try {
    const plan = await callGroq(
      'You are an expert certified personal trainer. Always respond with valid JSON only. Be concise but detailed.',
      `Create a personalized weekly workout plan for this gym member. Each exercise MUST have step-by-step form instructions.

Member Profile:
- Name: ${user.firstName} ${user.lastName}
- Goals: ${profile?.goals || 'General fitness'}
- Fitness Level: ${profile?.fitnessLevel || 'BEGINNER'}
- Injuries/Limitations: ${profile?.injuries || 'None'}
- Available Days: ${profile?.availableDays ? JSON.parse(profile.availableDays).join(', ') : 'Mon, Wed, Fri, Sat'}
- Current Weight: ${profile?.currentWeight || 'unknown'}kg
- Target Weight: ${profile?.targetWeight || 'unknown'}kg

Available Gym Equipment:
${equipmentList || 'Standard gym equipment: barbells, dumbbells, cable machines, treadmill, bench, squat rack'}

Return this EXACT JSON structure (no extra fields):
{
  "weeklyPlan": [
    {
      "day": "Monday",
      "focus": "Chest & Triceps",
      "theme": "Push Day",
      "exercises": [
        {
          "name": "Barbell Bench Press",
          "muscleGroup": "Chest, Anterior Deltoid, Triceps",
          "sets": 4,
          "reps": "8-10",
          "rest": "90s",
          "equipment": "Barbell + Flat Bench",
          "difficulty": "Intermediate",
          "category": "chest",
          "formSteps": [
            "Lie flat on bench, feet planted firmly on floor",
            "Grip bar slightly wider than shoulder width",
            "Unrack bar, lower slowly to mid-chest over 3 seconds",
            "Press explosively back up without locking elbows",
            "Keep shoulder blades pinched together throughout"
          ],
          "commonMistakes": ["Bouncing bar off chest", "Flaring elbows too wide", "Arching lower back excessively"],
          "breathingTip": "Inhale on the way down, exhale as you press up"
        }
      ],
      "warmup": "5 min light cardio + dynamic stretches",
      "cooldown": "5-10 min static stretching targeting worked muscles",
      "estimatedDuration": "55 min",
      "intensity": "Moderate-High",
      "caloriesBurned": "320-400"
    }
  ],
  "restDays": ["Wednesday", "Sunday"],
  "generalAdvice": "One specific progressive overload tip for this member's level",
  "nutritionTip": "One specific nutrition recommendation for their goal",
  "progressionPlan": "How to progress this plan after 4 weeks"
}`
    );

    await prisma.memberProfile.update({
      where: { userId },
      data: { workoutPlan: JSON.stringify(plan), planGeneratedAt: new Date() },
    });
    res.json(plan);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getWorkoutPlan(req: Request, res: Response) {
  const userId = req.user!.userId;
  const profile = await prisma.memberProfile.findUnique({ where: { userId } });
  if (!profile?.workoutPlan) {
    res.status(404).json({ error: 'No workout plan yet' });
    return;
  }
  res.json({ plan: JSON.parse(profile.workoutPlan), generatedAt: profile.planGeneratedAt });
}

export async function getProgressSummary(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const userId = req.user!.userId;

  if (!process.env.GROQ_API_KEY) {
    res.status(503).json({ error: 'AI not configured' });
    return;
  }

  const [logs, attendance, profile] = await Promise.all([
    prisma.progressLog.findMany({ where: { gymId, userId }, orderBy: { logDate: 'desc' }, take: 10 }),
    prisma.attendance.findMany({ where: { gymId, userId }, orderBy: { checkInTime: 'desc' }, take: 30 }),
    prisma.memberProfile.findUnique({ where: { userId } }),
  ]);

  try {
    const result = await callGroq(
      'You are a supportive fitness coach. Respond with valid JSON only.',
      `Summarize this gym member's recent progress. Be encouraging and specific.

Goals: ${profile?.goals || 'General fitness'}
Progress logs (recent): ${JSON.stringify(logs.map(l => ({ date: l.logDate, weight: l.weight, waist: l.waistCm, notes: l.notes })))}
Visits in last 30 days: ${attendance.length}
Target weight: ${profile?.targetWeight || 'not set'}kg
Current weight: ${profile?.currentWeight || 'not set'}kg

Return JSON:
{
  "summary": "2-3 sentence encouraging summary",
  "highlights": ["highlight 1", "highlight 2"],
  "recommendation": "one specific actionable recommendation",
  "motivationalMessage": "short inspiring message"
}`
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getOwnerInsights(req: Request, res: Response) {
  const gymId = req.user!.gymId;

  if (!process.env.GROQ_API_KEY) {
    res.status(503).json({ error: 'AI not configured. Add GROQ_API_KEY to backend/.env' });
    return;
  }

  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 86400000);
  const monthAgo = new Date(now.getTime() - 30 * 86400000);

  const [memberCount, activeCount, expiringCount, monthAttendance, atRiskCount, totalRevenue] = await Promise.all([
    prisma.user.count({ where: { gymId, role: 'MEMBER' } }),
    prisma.membership.count({ where: { gymId, status: 'ACTIVE' } }),
    prisma.membership.count({ where: { gymId, status: 'ACTIVE', endDate: { lte: weekAhead } } }),
    prisma.attendance.count({ where: { gymId, checkInTime: { gte: monthAgo } } }),
    prisma.user.count({
      where: {
        gymId, role: 'MEMBER', isActive: true,
        memberships: { some: { status: 'ACTIVE' } },
        attendances: { none: { checkInTime: { gte: new Date(now.getTime() - 14 * 86400000) } } },
      },
    }),
    prisma.membership.aggregate({ where: { gymId }, _sum: { price: true } }),
  ]);

  try {
    const result = await callGroq(
      'You are a gym business consultant. Give data-driven, actionable advice. Respond with valid JSON only.',
      `Analyze this gym's performance and give owner insights.

Gym Stats:
- Total members: ${memberCount}
- Active memberships: ${activeCount}
- Memberships expiring this week: ${expiringCount}
- Check-ins in last 30 days: ${monthAttendance}
- At-risk members (active membership, no visit 14d): ${atRiskCount}
- Total revenue collected: ₹${totalRevenue._sum.price || 0}

Return JSON:
{
  "insights": ["insight 1", "insight 2", "insight 3"],
  "priorityActions": ["action 1", "action 2"],
  "positives": ["positive 1"],
  "revenueOpportunity": "specific revenue growth suggestion"
}`
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
