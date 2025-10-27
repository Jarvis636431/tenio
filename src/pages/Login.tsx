import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import loginImage from '@/assets/login-tech-construction.jpg';

type AuthTab = 'login' | 'register';

export default function Login() {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const { login, register, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      toast({
        title: "请填写完整信息",
        description: "请输入账号和密码",
        variant: "destructive"
      });
      return;
    }
    try {
      await login(loginUsername, loginPassword);
      toast({
        title: "登录成功",
        description: "欢迎回来！"
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "登录失败",
        description: "账号或密码错误",
        variant: "destructive"
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerUsername || !registerPassword || !registerConfirmPassword) {
      toast({
        title: "请填写完整信息",
        description: "请输入账号与两次密码",
        variant: "destructive"
      });
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      toast({
        title: "两次密码不一致",
        description: "请确认两次输入的密码相同",
        variant: "destructive"
      });
      return;
    }

    try {
      await register(registerUsername, registerPassword);
      toast({
        title: "注册成功",
        description: "已自动登录，欢迎使用！"
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "注册失败",
        description: "请稍后再试",
        variant: "destructive"
      });
    }
  };

  return <div className="min-h-screen flex">
      {/* 左侧登录区域 */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <img src="/lovable-uploads/7fc2509c-786f-4b70-8fba-9cf0a66bc806.png" alt="天友" className="h-12 w-12" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">A.PM 智慧建管</h1>
            <p className="text-muted-foreground mt-2">智慧建筑项目管理系统</p>
          </div>

          <Card className="shadow-lg border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium flex gap-2 justify-center">
                <Button
                  type="button"
                  variant={activeTab === 'login' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('login')}
                  disabled={isLoading}
                >
                  登录
                </Button>
                <Button
                  type="button"
                  variant={activeTab === 'register' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('register')}
                  disabled={isLoading}
                >
                  注册
                </Button>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="py-[20px]">
              {activeTab === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username">账号</Label>
                    <Input
                      id="login-username"
                      placeholder="请输入账号"
                      value={loginUsername}
                      onChange={e => setLoginUsername(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">密码</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="请输入密码"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? '登录中...' : '登录'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-username">账号</Label>
                    <Input
                      id="register-username"
                      placeholder="请输入账号"
                      value={registerUsername}
                      onChange={e => setRegisterUsername(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">密码</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="请输入密码"
                      value={registerPassword}
                      onChange={e => setRegisterPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password-confirm">确认密码</Label>
                    <Input
                      id="register-password-confirm"
                      type="password"
                      placeholder="请再次输入密码"
                      value={registerConfirmPassword}
                      onChange={e => setRegisterConfirmPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? '注册中...' : '注册'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 右侧图片区域 */}
      <div className="flex-1 relative overflow-hidden bg-primary/5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
        <img src={loginImage} alt="智慧建筑科技" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
        <div className="absolute bottom-8 left-8 right-8">
          
        </div>
      </div>
    </div>;
}
