import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Loader2, Smartphone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthDialog, FormField, FormInput, SMSInput } from "@/features/auth/components";
import {
  accountLoginSchema,
  phoneLoginSchema,
  profileSchema,
  registerSchema,
} from "@/features/auth/schemas/auth-schemas";
import { useAuth, useSmsCooldown } from "@/features/auth";
import { cn } from "@/lib/utils";
import type {
  AccountLoginFormData,
  ProfileFormData,
  RegisterFormData,
} from "@/features/auth/schemas/auth-schemas";

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

interface PolicySection {
  title: string;
  content: string;
}

function PolicyContent({ sections }: { sections: PolicySection[] }) {
  return (
    <div className="space-y-4 text-[13px] leading-6 text-apm-muted">
      <div className="rounded-md border border-cyan-400/15 bg-cyan-400/5 px-3.5 py-2.5 text-xs text-cyan-100/80">
        更新日期：2026年4月30日
      </div>
      <div className="space-y-4">
        {sections.map((section) => (
          <section key={section.title} className="space-y-1.5">
            <h3 className="text-sm font-semibold text-cyan-100">{section.title}</h3>
            <p>{section.content}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

function PasswordVisibilityButton({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  const Icon = visible ? EyeOff : Eye;

  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-apm-dim transition-colors hover:bg-cyan-400/10 hover:text-cyan-200 focus:outline-none focus:ring-1 focus:ring-cyan-400/40"
      aria-label={visible ? "隐藏密码" : "显示密码"}
      title={visible ? "隐藏密码" : "显示密码"}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const [loginMode, setLoginMode] = useState<LoginMode>("phone");
  const [form, setForm] = useState<AccountLoginFormData>({ account: "", password: "" });
  const [phoneForm, setPhoneForm] = useState<{ phone: string; code: string }>({
    phone: "",
    code: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(true);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [showForgotDialog, setShowForgotDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    username: "",
    password: "",
  });
  const [registerForm, setRegisterForm] = useState<RegisterFormData>({
    phone: "",
    smsCode: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [smsError, setSmsError] = useState<string | null>(null);
  const [registerSmsError, setRegisterSmsError] = useState<string | null>(null);
  const redirectTo = getRedirectPath(location.state);

  const { cooldown: smsCooldown, start: startSmsCooldown } = useSmsCooldown();
  const { cooldown: registerSmsCooldown, start: startRegisterSmsCooldown } = useSmsCooldown();

  const handleSendSms = async () => {
    const result = phoneLoginSchema.shape.phone.safeParse({ phone: phoneForm.phone });
    if (!result.success) {
      setSmsError(result.error.issues[0].message);
      return;
    }
    setSmsError(null);
    try {
      const res = await auth.sendSms(phoneForm.phone.trim());
      startSmsCooldown(res.cooldown_seconds);
    } catch (err) {
      setSmsError(err instanceof Error ? err.message : "验证码发送失败");
    }
  };

  const handleSendRegisterSms = async () => {
    const result = registerSchema.shape.phone.safeParse(registerForm.phone);
    if (!result.success) {
      setRegisterSmsError(result.error.issues[0].message);
      return;
    }
    setRegisterSmsError(null);
    try {
      const res = await auth.sendSms(registerForm.phone.trim());
      startRegisterSmsCooldown(res.cooldown_seconds);
    } catch (err) {
      setRegisterSmsError(err instanceof Error ? err.message : "验证码发送失败");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!agreed) {
      setError("请先阅读并同意服务协议和隐私政策");
      return;
    }

    let validation;
    if (loginMode === "account") {
      validation = accountLoginSchema.safeParse(form);
      if (!validation.success) {
        setError(validation.error.issues[0].message);
        return;
      }
    } else {
      validation = phoneLoginSchema.safeParse(phoneForm);
      if (!validation.success) {
        setError(validation.error.issues[0].message);
        return;
      }
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
    const validation = profileSchema.safeParse(profileForm);
    if (!validation.success) {
      setError(validation.error.issues[0].message);
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
    const validation = registerSchema.safeParse(registerForm);
    if (!validation.success) {
      setRegisterError(validation.error.issues[0].message);
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
                    <FormInput
                      label="手机号"
                      type="tel"
                      value={phoneForm.phone}
                      onChange={(e) =>
                        setPhoneForm((current) => ({ ...current, phone: e.target.value }))
                      }
                      placeholder="请输入手机号"
                      icon={<Smartphone className="h-[13px] w-[13px]" />}
                      disabled={isLoading}
                    />

                    <SMSInput
                      value={phoneForm.code}
                      onChange={(code) => setPhoneForm((current) => ({ ...current, code }))}
                      onSendCode={handleSendSms}
                      cooldown={smsCooldown}
                      disabled={isLoading}
                      error={smsError ?? undefined}
                    />
                  </div>
                )}

                {/* Account Login Panel */}
                {loginMode === "account" && (
                  <div className="space-y-4">
                    <FormInput
                      label="手机号账号"
                      type="text"
                      value={form.account}
                      onChange={(e) => setForm((f) => ({ ...f, account: e.target.value }))}
                      placeholder="请输入手机号账号"
                      icon={<User className="h-[13px] w-[13px]" />}
                      disabled={isLoading}
                    />

                    <FormInput
                      label="密码"
                      type={showLoginPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      placeholder="请输入密码"
                      icon={<Lock className="h-[13px] w-[13px]" />}
                      rightElement={
                        <PasswordVisibilityButton
                          visible={showLoginPassword}
                          onToggle={() => setShowLoginPassword((current) => !current)}
                        />
                      }
                      disabled={isLoading}
                    />
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
                      onClick={() => setShowTermsDialog(true)}
                      className="text-cyan-400 hover:underline"
                    >
                      服务协议
                    </button>{" "}
                    和{" "}
                    <button
                      type="button"
                      onClick={() => setShowPrivacyDialog(true)}
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
                    aria-label="使用微信登录"
                    title="使用微信登录"
                    className="flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/5 text-cyan-400 transition-all hover:border-cyan-400 hover:bg-cyan-400/10"
                  >
                    <svg
                      aria-hidden="true"
                      className="h-[18px] w-[18px]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
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

      {/* Terms Dialog */}
      <AuthDialog
        open={showTermsDialog}
        onOpenChange={setShowTermsDialog}
        title="服务协议"
        description="请在使用 A.PM 智能管理平台前阅读以下条款"
        className="max-w-[620px]"
      >
        <PolicyContent
          sections={[
            {
              title: "1. 服务范围",
              content:
                "A.PM 为项目资料上传、施工计划分析、成本工期测算和 AI 辅助问答提供数字化工具。平台输出内容用于项目管理参考，具体工程决策仍需结合合同、图纸、现场条件和专业人员判断。",
            },
            {
              title: "2. 账号使用",
              content:
                "您应妥善保管账号、验证码和密码，不得将账号转让、出租或用于未经授权的项目数据访问。因账号保管不当造成的风险，由账号使用方承担。",
            },
            {
              title: "3. 数据与资料",
              content:
                "您上传的合同、图纸、清单和项目资料应确保来源合法、内容真实，并已获得必要授权。请勿上传与项目无关、侵权、违法或包含恶意代码的文件。",
            },
            {
              title: "4. AI 辅助结果",
              content:
                "AI 生成的计划、摘要、建议和分析结果可能存在偏差或遗漏。您应在采纳前进行复核，平台不替代工程咨询、法律、财务或安全生产责任主体。",
            },
            {
              title: "5. 服务变更",
              content:
                "平台可能根据产品迭代、运维安全或合规要求调整功能。重大变化会在合理范围内通过页面提示、系统通知或其他方式告知。",
            },
          ]}
        />
      </AuthDialog>

      {/* Privacy Dialog */}
      <AuthDialog
        open={showPrivacyDialog}
        onOpenChange={setShowPrivacyDialog}
        title="隐私政策"
        description="了解我们如何收集、使用和保护您的信息"
        className="max-w-[620px]"
      >
        <PolicyContent
          sections={[
            {
              title: "1. 信息收集",
              content:
                "为完成登录、账号识别和项目协作，我们会收集手机号、用户名、登录状态、项目资料上传记录以及使用过程中产生的必要操作日志。",
            },
            {
              title: "2. 信息使用",
              content:
                "相关信息用于账号认证、项目数据展示、文件处理、AI 服务调用、故障排查和安全审计。未经授权，我们不会将您的项目资料用于与服务无关的用途。",
            },
            {
              title: "3. 信息保护",
              content:
                "我们会通过访问控制、传输保护、权限隔离和日志审计等方式保护数据安全。请您同时妥善保管账号凭据，避免在公共设备上保存登录状态。",
            },
            {
              title: "4. 第三方服务",
              content:
                "语音识别、对象存储、AI 推理或地图等能力可能由第三方基础服务提供。我们会在业务必要范围内传递完成服务所需的信息。",
            },
            {
              title: "5. 权利与联系",
              content:
                "如需查询、更正或删除账号相关信息，可联系平台管理员或项目服务人员。涉及项目归档、审计或合同履约要求的数据，将按业务和合规要求处理。",
            },
          ]}
        />
      </AuthDialog>

      {/* Forgot Password Dialog */}
      <AuthDialog
        open={showForgotDialog}
        onOpenChange={setShowForgotDialog}
        title="忘记密码"
        description="输入您的注册邮箱，我们将发送重置密码链接"
        submitText="发送重置链接"
        onSubmit={(e) => {
          e.preventDefault();
          setShowForgotDialog(false);
        }}
      >
        <FormInput type="email" placeholder="请输入邮箱地址" className="h-11 w-full" />
      </AuthDialog>

      {/* Register Dialog */}
      <AuthDialog
        open={showRegisterDialog}
        onOpenChange={setShowRegisterDialog}
        title="立即注册"
        description="使用手机号验证码创建账号，并设置用户名和密码"
        submitText="注册"
        submitDisabled={auth.isLoggingIn || auth.isSettingProfile}
        isSubmitting={isLoading}
        error={registerError}
        onSubmit={handleRegister}
      >
        <FormField label="手机号">
          <FormInput
            type="tel"
            value={registerForm.phone}
            onChange={(e) => setRegisterForm((current) => ({ ...current, phone: e.target.value }))}
            placeholder="请输入手机号"
          />
        </FormField>
        <SMSInput
          label="验证码"
          value={registerForm.smsCode}
          onChange={(code) => setRegisterForm((current) => ({ ...current, smsCode: code }))}
          onSendCode={handleSendRegisterSms}
          cooldown={registerSmsCooldown}
          disabled={isLoading}
          error={registerSmsError ?? undefined}
        />
        <FormField label="用户名">
          <FormInput
            type="text"
            value={registerForm.username}
            onChange={(e) =>
              setRegisterForm((current) => ({ ...current, username: e.target.value }))
            }
            placeholder="请输入用户名"
          />
        </FormField>
        <FormField label="密码">
          <FormInput
            type={showRegisterPassword ? "text" : "password"}
            value={registerForm.password}
            onChange={(e) =>
              setRegisterForm((current) => ({ ...current, password: e.target.value }))
            }
            placeholder="请输入密码（至少8位）"
            rightElement={
              <PasswordVisibilityButton
                visible={showRegisterPassword}
                onToggle={() => setShowRegisterPassword((current) => !current)}
              />
            }
          />
        </FormField>
        <FormField label="确认密码">
          <FormInput
            type={showRegisterConfirmPassword ? "text" : "password"}
            value={registerForm.confirmPassword}
            onChange={(e) =>
              setRegisterForm((current) => ({ ...current, confirmPassword: e.target.value }))
            }
            placeholder="请再次输入密码"
            rightElement={
              <PasswordVisibilityButton
                visible={showRegisterConfirmPassword}
                onToggle={() => setShowRegisterConfirmPassword((current) => !current)}
              />
            }
          />
        </FormField>
      </AuthDialog>

      {/* Setup Profile Dialog */}
      <AuthDialog
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
        title="完善账号资料"
        description="首次短信登录后需要设置展示用户名和后续登录密码"
        submitText="完成设置"
        submitDisabled={auth.isSettingProfile}
        isSubmitting={isLoading}
        error={error}
        onSubmit={handleSetupProfile}
      >
        <FormField label="用户名">
          <FormInput
            type="text"
            value={profileForm.username}
            onChange={(e) =>
              setProfileForm((current) => ({ ...current, username: e.target.value }))
            }
            placeholder="请输入用户名"
          />
        </FormField>
        <FormField label="密码">
          <FormInput
            type={showProfilePassword ? "text" : "password"}
            value={profileForm.password}
            onChange={(e) =>
              setProfileForm((current) => ({ ...current, password: e.target.value }))
            }
            placeholder="请输入密码"
            rightElement={
              <PasswordVisibilityButton
                visible={showProfilePassword}
                onToggle={() => setShowProfilePassword((current) => !current)}
              />
            }
          />
        </FormField>
      </AuthDialog>
    </div>
  );
}

export default Login;
