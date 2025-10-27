import { Bell, HelpCircle, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import userAvatar from "@/assets/user-avatar.png";
export function Header() {
  const {
    logout,
    user
  } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
  };
  
  const handleLogoClick = () => {
    navigate("/");
  };
  return <header className="h-12 flex items-center justify-between z-50 px-4 rounded-none bg-sidebar border-b border-border">
      {/* 左侧品牌区域 */}
      <div className="flex items-center space-x-2.5 cursor-pointer transition-opacity hover:opacity-80" onClick={handleLogoClick}>
        <img src="/lovable-uploads/Frame 2147224672.svg" alt="天友" className="h-7 w-7" />
        <h1 className="text-base font-semibold text-slate-700">A.PM 智慧建管</h1>
      </div>

      {/* 右侧操作区域 */}
      <div className="flex items-center space-x-2">
        {/* 消息通知 */}
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-category-red-600 rounded-full text-xs"></span>
        </Button>

        {/* 帮助中心 */}
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <HelpCircle className="h-4 w-4" />
        </Button>

        {/* 用户菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-sm">
              <Avatar className="h-7 w-7">
                <AvatarImage src={userAvatar} alt="User" />
                <AvatarFallback>
                  <User className="h-3.5 w-3.5" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48" align="end" forceMount>
            <DropdownMenuItem>
              <User className="mr-2 h-3.5 w-3.5" />
              {user?.username || '用户'}
            </DropdownMenuItem>
            <DropdownMenuItem>
              设置
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-3.5 w-3.5" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>;
}
