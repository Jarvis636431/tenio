import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import loginImage from '@/assets/login-tech-construction.jpg';
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const {
    login,
    isLoading
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "请填写完整信息",
        description: "请输入邮箱和密码",
        variant: "destructive"
      });
      return;
    }
    try {
      await login(email, password);
      toast({
        title: "登录成功",
        description: "欢迎回来！"
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "登录失败",
        description: "邮箱或密码错误",
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
            <h1 className="text-2xl font-semibold text-foreground">A.PM 智慧建管</h1>
            <p className="text-muted-foreground mt-2">智慧建筑项目管理系统</p>
          </div>

          <Card className="shadow-lg border-border/50">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-xl">登录账户</CardTitle>
              <CardDescription>
                输入您的邮箱和密码以访问系统
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱地址</Label>
                  <Input id="email" type="email" placeholder="请输入邮箱" value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">密码</Label>
                  <Input id="password" type="password" placeholder="请输入密码" value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? '登录中...' : '登录'}
                </Button>
              </form>
              
              <div className="mt-6 text-center text-sm text-muted-foreground">
                <p>演示账户：任意邮箱和密码即可登录</p>
              </div>
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