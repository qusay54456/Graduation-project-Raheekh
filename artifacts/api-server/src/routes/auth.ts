import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import { db, usersTable, passwordResetCodesTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { RegisterBody, LoginBody, ForgotPasswordBody, VerifyResetCodeBody, ResetPasswordBody } from "@workspace/api-zod";
import { sendEmail, emailEnabled } from "../lib/email";

const router: IRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "محاولات كثيرة جداً، حاول مرة أخرى بعد 15 دقيقة (Too many attempts, try again in 15 minutes)" },
  keyGenerator: (req) => `${req.ip}:${(req.body as any)?.email ?? ""}`,
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "تم تجاوز الحد، حاول مرة أخرى لاحقاً" },
  keyGenerator: (req) => `${req.ip}:${(req.body as any)?.email ?? ""}`,
});

const verifyCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "محاولات كثيرة جداً، حاول مرة أخرى لاحقاً" },
  keyGenerator: (req) => `${req.ip}:${(req.body as any)?.email ?? ""}`,
});

function userToJson(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone ?? null,
    profilePhotoUrl: user.profilePhotoUrl ?? null,
    isBlocked: user.isBlocked,
    createdAt: user.createdAt.toISOString(),
  };
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, email, password, phone } = parsed.data;

  if (password.length < 6) {
    res.status(400).json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(409).json({ error: "البريد الإلكتروني مستخدم بالفعل" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // SECURITY: Public registration always creates a regular user. Supervisor
  // role can only be granted by another supervisor via PATCH /users/:id.
  const [user] = await db.insert(usersTable).values({
    name,
    email,
    passwordHash,
    role: "user",
    phone: phone ?? null,
  }).returning();

  req.session.userId = user.id;

  res.status(201).json({
    user: userToJson(user),
    message: "تم إنشاء الحساب بنجاح",
  });
});

router.post("/auth/login", loginLimiter, async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
    return;
  }

  if (user.isBlocked) {
    res.status(403).json({ error: "هذا الحساب محظور (Account is blocked)" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
    return;
  }

  req.session.userId = user.id;

  res.json({
    user: userToJson(user),
    message: "تم تسجيل الدخول بنجاح",
  });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session.destroy(() => {
    res.json({ message: "تم تسجيل الخروج بنجاح" });
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ error: "غير مصرح" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "المستخدم غير موجود" });
    return;
  }

  res.json(userToJson(user));
});

router.post("/auth/forgot-password", passwordResetLimiter, async (req, res): Promise<void> => {
  const parsed = ForgotPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  // Always return success to avoid leaking which emails are registered
  if (!user) {
    res.json({ message: "إذا كان البريد مسجلاً، ستتلقى رمز التحقق", devCode: null });
    return;
  }

  // Invalidate any prior unused codes for this email before issuing a new one.
  await db
    .update(passwordResetCodesTable)
    .set({ used: true })
    .where(and(eq(passwordResetCodesTable.email, email), eq(passwordResetCodesTable.used, false)));

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db.insert(passwordResetCodesTable).values({ email, code, expiresAt });

  const result = await sendEmail({
    to: email,
    subject: "ParkNow - رمز إعادة تعيين كلمة المرور",
    text: `رمز التحقق الخاص بك: ${code}\n\nصالح لمدة 15 دقيقة.\n\nYour ParkNow verification code: ${code}\nValid for 15 minutes.`,
    html: `<div style="font-family:sans-serif;direction:rtl"><h2>إعادة تعيين كلمة المرور</h2><p>رمز التحقق الخاص بك:</p><h1 style="background:#1a2b4a;color:white;padding:16px;text-align:center;letter-spacing:4px;border-radius:8px">${code}</h1><p>صالح لمدة 15 دقيقة.</p></div>`,
  });

  // SECURITY: Only expose the code in the API response in development AND only
  // when the email could not be sent. Never leak codes in production.
  const exposeDevCode =
    process.env.NODE_ENV !== "production" && (!emailEnabled || !result.sent);

  res.json({
    message: "إذا كان البريد مسجلاً، ستتلقى رمز التحقق",
    devCode: exposeDevCode ? code : null,
  });
});

router.post("/auth/verify-code", verifyCodeLimiter, async (req, res): Promise<void> => {
  const parsed = VerifyResetCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, code } = parsed.data;

  const [entry] = await db
    .select()
    .from(passwordResetCodesTable)
    .where(
      and(
        eq(passwordResetCodesTable.email, email),
        eq(passwordResetCodesTable.code, code),
        eq(passwordResetCodesTable.used, false),
        gt(passwordResetCodesTable.expiresAt, new Date()),
      ),
    );

  if (!entry) {
    res.status(400).json({ error: "رمز غير صحيح أو منتهي الصلاحية" });
    return;
  }

  res.json({ message: "الرمز صحيح" });
});

router.post("/auth/reset-password", verifyCodeLimiter, async (req, res): Promise<void> => {
  const parsed = ResetPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, code, newPassword } = parsed.data;

  if (newPassword.length < 6) {
    res.status(400).json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
    return;
  }

  const [entry] = await db
    .select()
    .from(passwordResetCodesTable)
    .where(
      and(
        eq(passwordResetCodesTable.email, email),
        eq(passwordResetCodesTable.code, code),
        eq(passwordResetCodesTable.used, false),
        gt(passwordResetCodesTable.expiresAt, new Date()),
      ),
    );

  if (!entry) {
    res.status(400).json({ error: "رمز غير صحيح أو منتهي الصلاحية" });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.email, email));
  await db.update(passwordResetCodesTable).set({ used: true }).where(eq(passwordResetCodesTable.id, entry.id));

  res.json({ message: "تم تغيير كلمة المرور بنجاح" });
});

export default router;
