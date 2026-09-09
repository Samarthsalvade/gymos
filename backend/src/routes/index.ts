import { Router } from 'express';
import { authenticate, requireRole, requireSelfOrAdmin } from '../middleware/auth';
import * as auth from '../controllers/auth.controller';
import * as members from '../controllers/members.controller';
import * as attendance from '../controllers/attendance.controller';
import * as equipment from '../controllers/equipment.controller';
import * as memberships from '../controllers/memberships.controller';
import * as progress from '../controllers/progress.controller';
import * as events from '../controllers/events.controller';
import * as ai from '../controllers/ai.controller';
import * as gym from '../controllers/gym.controller';
import * as loyalty from '../controllers/loyalty.controller';
import * as announcements from '../controllers/announcements.controller';
import prisma from '../utils/prisma';

const r = Router();

// ── Auth ──────────────────────────────────────────────────────────────────────
r.post('/auth/login', auth.login);
r.post('/auth/refresh', auth.refresh);
r.post('/auth/logout', auth.logout);
r.post('/auth/register-gym', auth.registerGym);
r.post('/auth/change-password', authenticate, auth.changePassword);

// ── Gym lookup (public — for login step 1) ───────────────────────────────────
r.get('/gym/lookup/:gymCode', async (req, res) => {
  const gym = await prisma.gym.findUnique({
    where: { gymCode: req.params.gymCode.toUpperCase() },
    select: { name: true, logo: true, coverImage: true, accentColor: true, gymCode: true },
  });
  if (!gym) { res.status(404).json({ error: 'Gym not found' }); return; }
  res.json(gym);
});

// ── Gym ───────────────────────────────────────────────────────────────────────
r.get('/gym/settings', authenticate, gym.getGymSettings);
r.put('/gym/settings', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), gym.updateGymSettings);
r.get('/gym/dashboard', authenticate, requireRole('ADMIN', 'MANAGER', 'SUPER_ADMIN'), gym.getDashboardStats);
r.get('/gym/leaderboard', authenticate, gym.getLeaderboard);
r.get('/gym/notifications', authenticate, gym.getNotifications);
r.put('/gym/notifications/:id/read', authenticate, gym.markNotificationRead);
r.get('/gym/badges', authenticate, gym.getBadges);
r.get('/gym/badges/:userId', authenticate, gym.getBadges);

// ── Trainer slots ─────────────────────────────────────────────────────────────
r.get('/trainer-slots', authenticate, gym.getTrainerSlots);
r.post('/trainer-slots', authenticate, requireRole('ADMIN', 'MANAGER', 'TRAINER'), gym.createTrainerSlot);
r.put('/trainer-slots/:id/book', authenticate, gym.bookTrainerSlot);

// ── Members ───────────────────────────────────────────────────────────────────
r.get('/members', authenticate, requireRole('ADMIN', 'MANAGER', 'TRAINER', 'SUPER_ADMIN'), members.listMembers);
r.post('/members', authenticate, requireRole('ADMIN', 'MANAGER', 'SUPER_ADMIN'), members.createMember);
r.get('/members/me', authenticate, members.getMyProfile);
r.put('/members/me', authenticate, members.updateMyProfile);
// requireSelfOrAdmin prevents spoofing another member's stats via URL
r.get('/members/:id/stats', authenticate, requireSelfOrAdmin, members.getMemberStats);
r.get('/members/:id', authenticate, requireRole('ADMIN', 'MANAGER', 'SUPER_ADMIN'), members.getMember);
r.put('/members/:id', authenticate, requireRole('ADMIN', 'MANAGER', 'SUPER_ADMIN'), members.updateMember);
r.delete('/members/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), members.deleteMember);

// ── Attendance ────────────────────────────────────────────────────────────────
r.post('/attendance/scan', authenticate, requireRole('ADMIN','MANAGER','SUPER_ADMIN','TRAINER'), attendance.scanQR);
r.post('/attendance/checkin', authenticate, attendance.checkIn);
r.post('/attendance/checkout', authenticate, attendance.checkOut);
r.get('/attendance/me', authenticate, attendance.getMyAttendance);
r.get('/attendance/summary', authenticate, requireRole('ADMIN', 'MANAGER', 'SUPER_ADMIN'), attendance.getAttendanceSummary);
r.get('/attendance', authenticate, requireRole('ADMIN', 'MANAGER', 'SUPER_ADMIN'), attendance.getAttendance);

// ── Equipment ─────────────────────────────────────────────────────────────────
r.get('/equipment', authenticate, equipment.listEquipment);
r.post('/equipment', authenticate, requireRole('ADMIN', 'MANAGER', 'SUPER_ADMIN'), equipment.createEquipment);
r.put('/equipment/:id', authenticate, requireRole('ADMIN', 'MANAGER', 'SUPER_ADMIN'), equipment.updateEquipment);
r.delete('/equipment/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), equipment.deleteEquipment);

// ── Memberships ───────────────────────────────────────────────────────────────
r.get('/membership-plans', authenticate, memberships.getPlans);
r.get('/memberships/me', authenticate, memberships.getMyMemberships);
r.get('/memberships/expiring', authenticate, requireRole('ADMIN', 'MANAGER', 'SUPER_ADMIN'), memberships.getExpiringMemberships);
r.get('/memberships/revenue', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), memberships.getRevenueReport);
r.get('/memberships/churn-risk', authenticate, requireRole('ADMIN', 'MANAGER', 'SUPER_ADMIN'), memberships.getChurnRisk);
r.get('/memberships', authenticate, requireRole('ADMIN', 'MANAGER', 'SUPER_ADMIN'), memberships.listMemberships);
r.post('/memberships', authenticate, requireRole('ADMIN', 'MANAGER', 'SUPER_ADMIN'), memberships.createMembership);
r.put('/memberships/:id', authenticate, requireRole('ADMIN', 'MANAGER', 'SUPER_ADMIN'), memberships.updateMembership);
r.post('/memberships/:id/renew', authenticate, requireRole('ADMIN', 'MANAGER', 'SUPER_ADMIN'), memberships.renewMembership);
r.post('/memberships/:id/refund', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), memberships.refundMembership);

// ── Progress ──────────────────────────────────────────────────────────────────
r.get('/progress', authenticate, progress.getLogs);
r.post('/progress', authenticate, progress.createLog);
r.delete('/progress/:id', authenticate, progress.deleteLog);

// ── Events ────────────────────────────────────────────────────────────────────
r.get('/events', authenticate, events.listEvents);
r.post('/events', authenticate, requireRole('ADMIN', 'MANAGER', 'SUPER_ADMIN'), events.createEvent);
r.put('/events/:id', authenticate, requireRole('ADMIN', 'MANAGER', 'SUPER_ADMIN'), events.updateEvent);
r.delete('/events/:id', authenticate, requireRole('ADMIN', 'MANAGER', 'SUPER_ADMIN'), events.deleteEvent);

// ── AI ────────────────────────────────────────────────────────────────────────
r.post('/ai/workout-plan', authenticate, ai.generateWorkoutPlan);
r.get('/ai/workout-plan', authenticate, ai.getWorkoutPlan);
r.get('/ai/progress-summary', authenticate, ai.getProgressSummary);
r.get('/ai/owner-insights', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), ai.getOwnerInsights);

// ── Loyalty ───────────────────────────────────────────────────────────────────
r.get('/loyalty/me', authenticate, loyalty.getMyLoyalty);
r.get('/loyalty/leaderboard', authenticate, loyalty.getLoyaltyLeaderboard);

// ── Announcements ─────────────────────────────────────────────────────────────
r.get('/announcements', authenticate, announcements.list);
r.post('/announcements', authenticate, requireRole('ADMIN', 'MANAGER', 'SUPER_ADMIN'), announcements.create);
r.delete('/announcements/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), announcements.remove);

export default r;
