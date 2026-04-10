import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, X } from "lucide-react";
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

function Login({ onLogin }: LoginPageProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState<LoginForm>({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotDialog, setShowForgotDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError("请输入用户名和密码");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (onLogin) {
        await onLogin(form);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
      navigate("/upload");
    } catch {
      setError("用户名或密码错误");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020c1b] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-white mb-2">A.PM 智能管理平台</h1>
          <p className="text-cyan-300/70 text-sm">智慧工地 · 项目管理</p>
        </div>

        <div className="bg-[#041332]/80 backdrop-blur-xl border border-cyan-900/40 rounded-xl p-8 shadow-2xl">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-cyan-100/80">
                用户名
              </label>
              <input
                id="username"
                type="text"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                className={cn(
                  "w-full h-11 px-4 rounded-lg bg-[#020c1b]/80 border border-cyan-900/50",
                  "text-white placeholder:text-slate-500",
                  "focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50",
                  "transition-all duration-200",
                )}
                placeholder="请输入用户名"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-cyan-100/80">
                密码
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className={cn(
                    "w-full h-11 px-4 pr-11 rounded-lg bg-[#020c1b]/80 border border-cyan-900/50",
                    "text-white placeholder:text-slate-500",
                    "focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50",
                    "transition-all duration-200",
                  )}
                  placeholder="请输入密码"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm">
              <button
                type="button"
                onClick={() => setShowForgotDialog(true)}
                className="text-cyan-400/70 hover:text-cyan-400 transition-colors"
              >
                忘记密码？
              </button>
              <button
                type="button"
                onClick={() => setShowRegisterDialog(true)}
                className="text-cyan-400/70 hover:text-cyan-400 transition-colors"
              >
                立即注册
              </button>
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium rounded-lg shadow-lg shadow-cyan-500/20 transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  登录中...
                </>
              ) : (
                "登录"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">默认账号: admin / admin123</p>
      </div>

      <Dialog open={showForgotDialog} onOpenChange={setShowForgotDialog}>
        <DialogContent className="bg-[#041332] border-cyan-900/50 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">忘记密码</DialogTitle>
            <DialogDescription className="text-cyan-100/60">
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
                "w-full h-11 px-4 rounded-lg bg-[#020c1b]/80 border border-cyan-900/50",
                "text-white placeholder:text-slate-500",
                "focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50",
              )}
              required
            />
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
            >
              发送重置链接
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent className="bg-[#041332] border-cyan-900/50 text-white max-w-md">
          <button
            onClick={() => setShowRegisterDialog(false)}
            className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <DialogHeader>
            <DialogTitle className="text-white text-xl">立即注册</DialogTitle>
            <DialogDescription className="text-cyan-100/60">
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
                  "w-full h-11 px-4 rounded-lg bg-[#020c1b]/80 border border-cyan-900/50",
                  "text-white placeholder:text-slate-500",
                  "focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50",
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
                  "w-full h-11 px-4 rounded-lg bg-[#020c1b]/80 border border-cyan-900/50",
                  "text-white placeholder:text-slate-500",
                  "focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50",
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
                  "w-full h-11 px-4 rounded-lg bg-[#020c1b]/80 border border-cyan-900/50",
                  "text-white placeholder:text-slate-500",
                  "focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50",
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
                  "w-full h-11 px-4 rounded-lg bg-[#020c1b]/80 border border-cyan-900/50",
                  "text-white placeholder:text-slate-500",
                  "focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50",
                )}
                required
                minLength={8}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
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
