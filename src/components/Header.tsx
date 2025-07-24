
import { Bell, HelpCircle, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="h-14 flex items-center justify-between z-50 px-[24px] rounded-none bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      {/* 左侧品牌区域 */}
      <div className="flex items-center space-x-3 mx-0">
        <img 
          src="/lovable-uploads/7fc2509c-786f-4b70-8fba-9cf0a66bc806.png" 
          alt="天友" 
          className="h-8 w-8 mx-0"
        />
        <h1 className="text-lg font-semibold text-slate-700">天友智管平台</h1>
      </div>

      {/* 右侧操作区域 */}
      <div className="flex items-center space-x-4 px-0 mx-0 py-[20px] my-0">
        {/* 消息通知 */}
        <Button variant="ghost" size="icon" className="relative mx-0">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs"></span>
        </Button>

        {/* 帮助中心 */}
        <Button variant="ghost" size="icon" className="mx-0">
          <HelpCircle className="h-5 w-5" />
        </Button>

        {/* 用户菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg" alt="User" />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              {user?.name || '用户'}
            </DropdownMenuItem>
            <DropdownMenuItem>
              设置
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
