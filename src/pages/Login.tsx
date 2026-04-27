import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, Lock, Smartphone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/features/auth";
import { cn } from "@/lib/utils";

interface LoginForm {
  account: string;
  password: string;
}

interface RegisterForm {
  phone: string;
  smsCode: string;
  username: string;
  password: string;
  confirmPassword: string;
}

type LoginMode = "account" | "phone";

interface RedirectLocationState {
  from?: {
    pathname?: string;
    search?: string;
  };
}

function getRedirectPath(state: unknown) {
  if (!state || typeof state !== "object") return "/projects";
  const redirectState = state as RedirectLocationState;
  const pathname = redirectState.from?.pathname;
  if (!pathname) return "/projects";
  return `${pathname}${redirectState.from?.search ?? ""}`;
}

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const [loginMode, setLoginMode] = useState<LoginMode>("phone");
  const [form, setForm] = useState<LoginForm>({ account: "", password: "" });
  const [phoneForm, setPhoneForm] = useState({ phone: "", code: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(true);
  const [showForgotDialog, setShowForgotDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [profileForm, setProfileForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    phone: "",
    smsCode: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [smsCooldown, setSmsCooldown] = useState(0);
  const [registerSmsCooldown, setRegisterSmsCooldown] = useState(0);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const redirectTo = getRedirectPath(location.state);

  useEffect(() => {
    if (smsCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setSmsCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [smsCooldown]);

  useEffect(() => {
    if (registerSmsCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setRegisterSmsCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [registerSmsCooldown]);

  const handleSendSms = async () => {
    if (!phoneForm.phone.trim()) {
      setError("请输入手机号");
      return;
    }
    setError(null);
    try {
      const result = await auth.sendSms(phoneForm.phone.trim());
      setSmsCooldown(result.cooldown_seconds);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "验证码发送失败");
    }
  };

  const handleSendRegisterSms = async () => {
    if (!registerForm.phone.trim()) {
      setRegisterError("请输入手机号");
      return;
    }
    setRegisterError(null);
    try {
      const result = await auth.sendSms(registerForm.phone.trim());
      setRegisterSmsCooldown(result.cooldown_seconds);
    } catch (sendError) {
      setRegisterError(sendError instanceof Error ? sendError.message : "验证码发送失败");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError("请先阅读并同意服务协议和隐私政策");
      return;
    }

    if (loginMode === "account" && (!form.account || !form.password)) {
      setError("请输入账号和密码");
      return;
    }

    if (loginMode === "phone" && (!phoneForm.phone || !phoneForm.code)) {
      setError("请输入手机号和验证码");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (loginMode === "account") {
        await auth.loginWithPassword({
          account: form.account.trim(),
          password: form.password,
          has_agreed_terms: agreed,
        });
      } else {
        const session = await auth.loginWithSms({
          phone: phoneForm.phone.trim(),
          sms_code: phoneForm.code.trim(),
          has_agreed_terms: agreed,
        });
        if (session.user.is_profile_completed === false) {
          setProfileForm({ username: session.user.username || "", password: "" });
          setShowProfileDialog(true);
          return;
        }
      }
      navigate(redirectTo, { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "登录失败，请检查账号信息");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!profileForm.username.trim() || !profileForm.password) {
      setError("请输入用户名和密码");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await auth.setupProfile({
        username: profileForm.username.trim(),
        password: profileForm.password,
      });
      setShowProfileDialog(false);
      navigate(redirectTo, { replace: true });
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : "资料设置失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterError("两次输入的密码不一致");
      return;
    }
    setRegisterError(null);
    setIsLoading(true);
    try {
      await auth.loginWithSms({
        phone: registerForm.phone.trim(),
        sms_code: registerForm.smsCode.trim(),
        has_agreed_terms: true,
      });
      await auth.setupProfile({
        username: registerForm.username.trim(),
        password: registerForm.password,
      });
      setShowRegisterDialog(false);
      navigate(redirectTo, { replace: true });
    } catch (registerSubmitError) {
      setRegisterError(
        registerSubmitError instanceof Error ? registerSubmitError.message : "注册失败",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-apm-grid">
      <div className="bg-apm-ambient absolute inset-0" />

      {/* Corner decorations */}
      <div className="corner-tl absolute left-0 top-0 z-0 h-[120px] w-[120px] border-l border-t border-cyan-400/15" />
      <div className="corner-br absolute bottom-0 right-0 z-0 h-[120px] w-[120px] border-b border-r border-cyan-400/15" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-[420px]">
          {/* Logo Area */}
          <div className="mb-12 flex items-center justify-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/10">
              <img src="/logo.svg" alt="A.PM" className="h-7 w-7 object-contain" />
            </div>
            <span className="font-display text-[22px] font-bold tracking-[-0.02em] text-white">
              A.<span className="text-cyan-400">PM</span> 智管
            </span>
            <span className="ml-3 text-[11px] text-apm-muted">智筑领航</span>
          </div>

          {/* Login Card */}
          <div className="overflow-hidden border border-cyan-400/20 bg-[rgba(4,18,37,0.85)] shadow-apm-panel backdrop-blur-xl">
            {/* Top gradient bar */}
            <div className="h-[2px] bg-gradient-to-r from-cyan-400 via-cyan-400/30 to-transparent" />

            <div className="px-8 pb-8 pt-7">
              {/* Header */}
              <div className="mb-1">
                <h1 className="font-display text-lg font-bold text-white">欢迎回来</h1>
              </div>
              <p className="mb-7 text-xs text-apm-muted">登录您的账号以访问项目控制台</p>

              {/* Tabs */}
              <div className="mb-6 flex border-b border-cyan-400/20">
                {[
                  { id: "phone" as const, label: "手机号登录" },
                  { id: "account" as const, label: "账号密码登录" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setLoginMode(tab.id);
                      setError(null);
                    }}
                    className={cn(
                      "flex-1 py-2.5 text-[13px] font-medium transition-colors",
                      loginMode === tab.id
                        ? "border-b-2 border-cyan-400 text-cyan-400"
                        : "border-b-2 border-transparent text-apm-muted hover:text-white",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={(e) => void handleSubmit(e)}>
                {/* Phone Login Panel */}
                {loginMode === "phone" && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="form-label">手机号</label>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-[13px] w-[13px] text-apm-dim" />
                        <input
                          type="tel"
                          value={phoneForm.phone}
                          onChange={(e) =>
                            setPhoneForm((current) => ({ ...current, phone: e.target.value }))
                          }
                          className={cn(
                            "h-11 w-full rounded-lg border border-cyan-400/20 bg-cyan-400/5 pl-[38px] pr-4",
                            "text-sm text-white placeholder:text-apm-dim",
                            "focus:border-cyan-400 focus:bg-cyan-400/8 focus:outline-none",
                          )}
                          placeholder="请输入手机号"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="form-label">验证码</label>
                      <div className="flex gap-2.5">
                        <div className="relative flex-1">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-[13px] w-[13px] text-apm-dim" />
                          <input
                            type="text"
                            value={phoneForm.code}
                            onChange={(e) =>
                              setPhoneForm((current) => ({ ...current, code: e.target.value }))
                            }
                            className={cn(
                              "h-11 w-full rounded-lg border border-cyan-400/20 bg-cyan-400/5 pl-[38px] pr-4",
                              "text-sm text-white placeholder:text-apm-dim",
                              "focus:border-cyan-400 focus:bg-cyan-400/8 focus:outline-none",
                            )}
                            placeholder="请输入验证码"
                            disabled={isLoading}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleSendSms()}
                          disabled={auth.isSendingSms || smsCooldown > 0 || isLoading}
                          className="shrink-0 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-4 text-[12px] font-semibold text-cyan-400 transition-colors hover:bg-cyan-400/20"
                        >
                          {smsCooldown > 0 ? `${smsCooldown}s` : "获取验证码"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Account Login Panel */}
                {loginMode === "account" && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="form-label">手机号账号</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-[13px] w-[13px] text-apm-dim" />
                        <input
                          type="text"
                          value={form.account}
                          onChange={(e) => setForm((f) => ({ ...f, account: e.target.value }))}
                          className={cn(
                            "h-11 w-full rounded-lg border border-cyan-400/20 bg-cyan-400/5 pl-[38px] pr-4",
                            "text-sm text-white placeholder:text-apm-dim",
                            "focus:border-cyan-400 focus:bg-cyan-400/8 focus:outline-none",
                          )}
                          placeholder="请输入手机号账号"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="form-label">密码</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-[13px] w-[13px] text-apm-dim" />
                        <input
                          type="password"
                          value={form.password}
                          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                          className={cn(
                            "h-11 w-full rounded-lg border border-cyan-400/20 bg-cyan-400/5 pl-[38px] pr-4",
                            "text-sm text-white placeholder:text-apm-dim",
                            "focus:border-cyan-400 focus:bg-cyan-400/8 focus:outline-none",
                          )}
                          placeholder="请输入密码"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Agreement Checkbox */}
                <div className="my-5 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="agree"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="h-4 w-4 rounded border-cyan-400/20 bg-cyan-400/5 accent-cyan-400"
                  />
                  <label htmlFor="agree" className="text-[11px] text-apm-muted">
                    我已阅读并同意{" "}
                    <button
                      type="button"
                      onClick={() => setShowRegisterDialog(true)}
                      className="text-cyan-400 hover:underline"
                    >
                      服务协议
                    </button>{" "}
                    和{" "}
                    <button
                      type="button"
                      onClick={() => setShowForgotDialog(true)}
                      className="text-cyan-400 hover:underline"
                    >
                      隐私政策
                    </button>
                  </label>
                </div>

                {/* Error Message */}
                {error && (
                  <p className="mb-4 rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">
                    {error}
                  </p>
                )}

                {/* Login Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-[46px] w-full rounded-lg bg-gradient-to-r from-cyan-400 to-sky-500 text-[14px] font-bold tracking-[0.04em] text-slate-950 transition-opacity hover:opacity-90"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      登录中...
                    </>
                  ) : (
                    <>
                      <svg
                        className="mr-1.5 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                        />
                      </svg>
                      登 录
                    </>
                  )}
                </Button>

                {/* Divider */}
                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-cyan-400/20" />
                  <span className="text-[10px] text-apm-dim">其他登录方式</span>
                  <div className="h-px flex-1 bg-cyan-400/20" />
                </div>

                {/* Social Login */}
                <div className="flex justify-center gap-4">
                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/5 text-cyan-400 transition-all hover:border-cyan-400 hover:bg-cyan-400/10"
                  >
                    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 4.3c-.321-.027-.645-.045-.969-.045a7.3 7.3 0 00-3.87 1.144c.063.044.125.088.188.13.277.17.575.246.878.227.456-.027.89-.224 1.224-.556.336-.333.553-.78.612-1.262.026-.17.01-.338-.023-.5zm1.242-2.627c-.089-.267-.266-.504-.508-.68a1.486 1.486 0 00-.823-.246c-.297 0-.582.089-.817.252a1.194 1.194 0 00-.49.777c-.027.142-.021.285.017.423.089.321.267.61.51.822.244.213.552.33.874.33.268 0 .524-.068.751-.202a1.14 1.14 0 00.486-.7v.224zm2.195-3.958c-.232-.29-.575-.459-.966-.459a1.21 1.21 0 00-.979.479 1.504 1.504 0 00-.31.518c-.054.14-.06.287-.017.427.08.289.233.554.44.757.207.203.477.319.765.33.129 0 .255-.018.375-.053.348-.106.641-.33.835-.636.193-.305.256-.66.18-1.005a1.137 1.137 0 00-.323-.358zm3.519.088c-.101-.31-.304-.57-.58-.744a1.252 1.252 0 00-.873-.14 1.32 1.32 0 00-.783.33c-.215.202-.357.477-.404.783a1.63 1.63 0 00.019.54c.027.14.087.273.178.391.17.23.41.39.683.456.272.067.558.042.818-.07.26-.112.477-.314.619-.58a1.1 1.1 0 00.128-.398c.027-.2-.01-.4-.108-.568h.003z" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-7 text-center text-[11px] text-apm-dim">
            还没有账号？
            <button
              type="button"
              onClick={() => setShowRegisterDialog(true)}
              className="mx-1 text-cyan-400 hover:underline"
            >
              立即注册
            </button>
            |
            <button
              type="button"
              onClick={() => setShowForgotDialog(true)}
              className="mx-1 text-cyan-400 hover:underline"
            >
              忘记密码？
            </button>
            <div className="mt-2.5 text-[10px]">© 2026 量维智能科技 · A.PM 智筑领航</div>
          </div>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotDialog} onOpenChange={setShowForgotDialog}>
        <DialogContent className="max-w-md rounded-xl border border-cyan-400/20 bg-[rgba(4,18,37,0.94)] text-white shadow-apm-panel backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="font-display text-white">忘记密码</DialogTitle>
            <DialogDescription className="text-apm-muted">
              输入您的注册邮箱，我们将发送重置密码链接
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setShowForgotDialog(false);
            }}
            className="space-y-4"
          >
            <input
              type="email"
              placeholder="请输入邮箱地址"
              className={cn(
                "h-11 w-full rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-4",
                "text-sm text-white placeholder:text-apm-dim",
                "focus:border-cyan-400 focus:bg-cyan-400/8 focus:outline-none",
              )}
              required
            />
            <Button
              type="submit"
              className="h-11 w-full rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400"
            >
              发送重置链接
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Register Dialog */}
      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent className="max-w-md rounded-xl border border-cyan-400/20 bg-[rgba(4,18,37,0.94)] text-white shadow-apm-panel backdrop-blur-xl">
          <button
            onClick={() => setShowRegisterDialog(false)}
            className="absolute right-4 top-4 rounded-md p-1 text-apm-dim transition-colors hover:bg-white/5 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-white">立即注册</DialogTitle>
            <DialogDescription className="text-apm-muted">
              使用手机号验证码创建账号，并设置用户名和密码
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void handleRegister(e)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-cyan-100/80">手机号</label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={registerForm.phone}
                  onChange={(e) =>
                    setRegisterForm((current) => ({ ...current, phone: e.target.value }))
                  }
                  placeholder="请输入手机号"
                  className={cn(
                    "h-11 min-w-0 flex-1 rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-4",
                    "text-sm text-white placeholder:text-apm-dim",
                    "focus:border-cyan-400 focus:bg-cyan-400/8 focus:outline-none",
                  )}
                  required
                />
                <button
                  type="button"
                  onClick={() => void handleSendRegisterSms()}
                  disabled={auth.isSendingSms || registerSmsCooldown > 0 || isLoading}
                  className="shrink-0 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 text-[12px] font-semibold text-cyan-400 transition-colors hover:bg-cyan-400/20 disabled:opacity-60"
                >
                  {registerSmsCooldown > 0 ? `${registerSmsCooldown}s` : "获取验证码"}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-cyan-100/80">验证码</label>
              <input
                type="text"
                value={registerForm.smsCode}
                onChange={(e) =>
                  setRegisterForm((current) => ({ ...current, smsCode: e.target.value }))
                }
                placeholder="请输入验证码"
                className={cn(
                  "h-11 w-full rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-4",
                  "text-sm text-white placeholder:text-apm-dim",
                  "focus:border-cyan-400 focus:bg-cyan-400/8 focus:outline-none",
                )}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-cyan-100/80">用户名</label>
              <input
                type="text"
                value={registerForm.username}
                onChange={(e) =>
                  setRegisterForm((current) => ({ ...current, username: e.target.value }))
                }
                placeholder="请输入用户名"
                className={cn(
                  "h-11 w-full rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-4",
                  "text-sm text-white placeholder:text-apm-dim",
                  "focus:border-cyan-400 focus:bg-cyan-400/8 focus:outline-none",
                )}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-cyan-100/80">密码</label>
              <input
                type="password"
                value={registerForm.password}
                onChange={(e) =>
                  setRegisterForm((current) => ({ ...current, password: e.target.value }))
                }
                placeholder="请输入密码（至少8位）"
                className={cn(
                  "h-11 w-full rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-4",
                  "text-sm text-white placeholder:text-apm-dim",
                  "focus:border-cyan-400 focus:bg-cyan-400/8 focus:outline-none",
                )}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-cyan-100/80">确认密码</label>
              <input
                type="password"
                value={registerForm.confirmPassword}
                onChange={(e) =>
                  setRegisterForm((current) => ({
                    ...current,
                    confirmPassword: e.target.value,
                  }))
                }
                placeholder="请再次输入密码"
                className={cn(
                  "h-11 w-full rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-4",
                  "text-sm text-white placeholder:text-apm-dim",
                  "focus:border-cyan-400 focus:bg-cyan-400/8 focus:outline-none",
                )}
                required
                minLength={8}
              />
            </div>
            {registerError && (
              <p className="rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">
                {registerError}
              </p>
            )}
            <Button
              type="submit"
              disabled={isLoading || auth.isLoggingIn || auth.isSettingProfile}
              className="h-11 w-full rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400"
            >
              {isLoading ? "注册中..." : "注册"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Setup Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-md rounded-xl border border-cyan-400/20 bg-[rgba(4,18,37,0.94)] text-white shadow-apm-panel backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-white">完善账号资料</DialogTitle>
            <DialogDescription className="text-apm-muted">
              首次短信登录后需要设置展示用户名和后续登录密码
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(event) => void handleSetupProfile(event)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-cyan-100/80">用户名</label>
              <input
                type="text"
                value={profileForm.username}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, username: event.target.value }))
                }
                placeholder="请输入用户名"
                className={cn(
                  "h-11 w-full rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-4",
                  "text-sm text-white placeholder:text-apm-dim",
                  "focus:border-cyan-400 focus:bg-cyan-400/8 focus:outline-none",
                )}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-cyan-100/80">密码</label>
              <input
                type="password"
                value={profileForm.password}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="请输入密码"
                className={cn(
                  "h-11 w-full rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-4",
                  "text-sm text-white placeholder:text-apm-dim",
                  "focus:border-cyan-400 focus:bg-cyan-400/8 focus:outline-none",
                )}
                required
              />
            </div>
            {error && (
              <p className="rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={isLoading || auth.isSettingProfile}
              className="h-11 w-full rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400"
            >
              {isLoading ? "保存中..." : "完成设置"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Login;
