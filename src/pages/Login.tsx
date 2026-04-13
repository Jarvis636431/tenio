import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Smartphone,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface LoginForm {
  username: string;
  password: string;
}

interface LoginPageProps {
  onLogin?: (form: LoginForm) => Promise<void>;
}

type LoginMode = "account" | "phone";

function Login({ onLogin }: LoginPageProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState<LoginForm>({ username: "", password: "" });
  const [phoneForm, setPhoneForm] = useState({ phone: "", code: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>("account");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotDialog, setShowForgotDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loginMode === "account" && (!form.username || !form.password)) {
      setError("请输入用户名和密码");
      return;
    }

    if (loginMode === "phone" && (!phoneForm.phone || !phoneForm.code)) {
      setError("请输入手机号和验证码");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload =
        loginMode === "account" ? form : { username: phoneForm.phone, password: phoneForm.code };

      if (onLogin) {
        await onLogin(payload);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
      navigate("/projects");
    } catch {
      setError("用户名或密码错误");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-apm-grid">
      <div className="bg-apm-ambient absolute inset-0" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-[18%] top-[18%] h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-[10%] right-[12%] h-[28rem] w-[28rem] rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-12 flex items-center justify-center gap-4">
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/12 p-3 text-cyan-100 shadow-apm-glow">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <div className="font-display text-[1.75rem] font-semibold tracking-[-0.03em] text-white">
                A.<span className="text-cyan-300">PM</span> 智管
              </div>
              <p className="mt-1 text-xs uppercase tracking-[0.24em] text-apm-muted">
                Smart Construction Workspace
              </p>
            </div>
          </div>

          <div className="apm-topline rounded-[26px] border border-apm bg-apm-card p-8 shadow-apm-panel backdrop-blur-xl">
            <div className="mb-7">
              <h1 className="font-display text-xl font-semibold text-white">登录工作台</h1>
              <p className="mt-1 text-sm text-apm-muted">
                进入 A.PM AI 工作区，继续上传资料、生成方案与推进项目分析。
              </p>
            </div>

            <div className="mb-6 flex border-b border-cyan-400/15">
              {[
                { id: "account" as const, label: "账号登录" },
                { id: "phone" as const, label: "短信登录" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setLoginMode(tab.id);
                    setError(null);
                  }}
                  className={cn(
                    "flex-1 border-b-2 px-1 py-3 text-sm font-medium transition-colors",
                    loginMode === tab.id
                      ? "border-cyan-300 text-cyan-200"
                      : "border-transparent text-apm-muted hover:text-white",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
              {loginMode === "account" ? (
                <>
                  <div className="space-y-2">
                    <label
                      htmlFor="username"
                      className="text-[11px] font-semibold uppercase tracking-[0.14em] text-apm-muted"
                    >
                      用户名
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-apm-dim" />
                      <input
                        id="username"
                        type="text"
                        value={form.username}
                        onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                        className={cn(
                          "h-12 w-full rounded-xl border border-cyan-400/15 bg-cyan-400/5 pl-11 pr-4",
                          "text-white placeholder:text-apm-dim",
                          "focus:border-cyan-300 focus:bg-cyan-400/8 focus:outline-none",
                          "transition-all duration-200",
                        )}
                        placeholder="请输入用户名"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="text-[11px] font-semibold uppercase tracking-[0.14em] text-apm-muted"
                    >
                      密码
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-apm-dim" />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        className={cn(
                          "h-12 w-full rounded-xl border border-cyan-400/15 bg-cyan-400/5 pl-11 pr-12",
                          "text-white placeholder:text-apm-dim",
                          "focus:border-cyan-300 focus:bg-cyan-400/8 focus:outline-none",
                          "transition-all duration-200",
                        )}
                        placeholder="请输入密码"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-apm-dim transition-colors hover:bg-white/5 hover:text-cyan-200"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label
                      htmlFor="phone"
                      className="text-[11px] font-semibold uppercase tracking-[0.14em] text-apm-muted"
                    >
                      手机号
                    </label>
                    <div className="relative">
                      <Smartphone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-apm-dim" />
                      <input
                        id="phone"
                        type="tel"
                        value={phoneForm.phone}
                        onChange={(e) =>
                          setPhoneForm((current) => ({ ...current, phone: e.target.value }))
                        }
                        className={cn(
                          "h-12 w-full rounded-xl border border-cyan-400/15 bg-cyan-400/5 pl-11 pr-4",
                          "text-white placeholder:text-apm-dim",
                          "focus:border-cyan-300 focus:bg-cyan-400/8 focus:outline-none",
                          "transition-all duration-200",
                        )}
                        placeholder="请输入手机号"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="code"
                      className="text-[11px] font-semibold uppercase tracking-[0.14em] text-apm-muted"
                    >
                      验证码
                    </label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-apm-dim" />
                        <input
                          id="code"
                          type="text"
                          value={phoneForm.code}
                          onChange={(e) =>
                            setPhoneForm((current) => ({ ...current, code: e.target.value }))
                          }
                          className={cn(
                            "h-12 w-full rounded-xl border border-cyan-400/15 bg-cyan-400/5 pl-11 pr-4",
                            "text-white placeholder:text-apm-dim",
                            "focus:border-cyan-300 focus:bg-cyan-400/8 focus:outline-none",
                            "transition-all duration-200",
                          )}
                          placeholder="输入验证码"
                          disabled={isLoading}
                        />
                      </div>
                      <button
                        type="button"
                        className="rounded-xl border border-cyan-400/15 bg-cyan-400/10 px-4 text-sm font-medium text-cyan-200 transition-colors hover:bg-cyan-400/15"
                      >
                        发送验证码
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setShowForgotDialog(true)}
                  className="text-cyan-300/80 transition-colors hover:text-cyan-200"
                >
                  忘记密码？
                </button>
                <button
                  type="button"
                  onClick={() => setShowRegisterDialog(true)}
                  className="text-cyan-300/80 transition-colors hover:text-cyan-200"
                >
                  立即注册
                </button>
              </div>

              {error && (
                <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 font-semibold tracking-[0.02em] text-slate-950 shadow-lg shadow-cyan-500/20 transition-all duration-200 hover:from-cyan-300 hover:to-sky-400"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    登录中...
                  </>
                ) : (
                  <>
                    进入工作台
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-cyan-400/15" />
              <span className="text-[10px] uppercase tracking-[0.16em] text-apm-dim">
                workspace access
              </span>
              <div className="h-px flex-1 bg-cyan-400/15" />
            </div>

            <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/6 px-4 py-3 text-sm text-apm-muted">
              默认账号：<span className="text-white">admin</span> /{" "}
              <span className="text-white">admin123</span>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showForgotDialog} onOpenChange={setShowForgotDialog}>
        <DialogContent className="rounded-[24px] border-cyan-400/15 bg-apm-panel text-white shadow-apm-panel backdrop-blur-xl">
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
                "h-12 w-full rounded-xl border border-cyan-400/15 bg-cyan-400/5 px-4",
                "text-white placeholder:text-apm-dim",
                "focus:border-cyan-300 focus:bg-cyan-400/8 focus:outline-none",
              )}
              required
            />
            <Button
              type="submit"
              className="h-11 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 hover:from-cyan-300 hover:to-sky-400"
            >
              <Mail className="mr-2 h-4 w-4" />
              发送重置链接
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent className="max-w-md rounded-[24px] border-cyan-400/15 bg-apm-panel text-white shadow-apm-panel backdrop-blur-xl">
          <button
            onClick={() => setShowRegisterDialog(false)}
            className="absolute right-4 top-4 rounded-md p-1 text-apm-dim transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-white">立即注册</DialogTitle>
            <DialogDescription className="text-apm-muted">
              创建一个新账号开始使用 A.PM 智能管理平台
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setShowRegisterDialog(false);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-cyan-100/80">用户名</label>
              <input
                type="text"
                placeholder="请输入用户名"
                className={cn(
                  "h-11 w-full rounded-xl border border-cyan-400/15 bg-cyan-400/5 px-4",
                  "text-white placeholder:text-apm-dim",
                  "focus:border-cyan-300 focus:bg-cyan-400/8 focus:outline-none",
                )}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-cyan-100/80">邮箱</label>
              <input
                type="email"
                placeholder="请输入邮箱地址"
                className={cn(
                  "h-11 w-full rounded-xl border border-cyan-400/15 bg-cyan-400/5 px-4",
                  "text-white placeholder:text-apm-dim",
                  "focus:border-cyan-300 focus:bg-cyan-400/8 focus:outline-none",
                )}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-cyan-100/80">密码</label>
              <input
                type="password"
                placeholder="请输入密码（至少8位）"
                className={cn(
                  "h-11 w-full rounded-xl border border-cyan-400/15 bg-cyan-400/5 px-4",
                  "text-white placeholder:text-apm-dim",
                  "focus:border-cyan-300 focus:bg-cyan-400/8 focus:outline-none",
                )}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-cyan-100/80">确认密码</label>
              <input
                type="password"
                placeholder="请再次输入密码"
                className={cn(
                  "h-11 w-full rounded-xl border border-cyan-400/15 bg-cyan-400/5 px-4",
                  "text-white placeholder:text-apm-dim",
                  "focus:border-cyan-300 focus:bg-cyan-400/8 focus:outline-none",
                )}
                required
                minLength={8}
              />
            </div>
            <Button
              type="submit"
              className="h-11 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 hover:from-cyan-300 hover:to-sky-400"
            >
              注册
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Login;
