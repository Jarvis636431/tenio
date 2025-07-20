import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Database, Users, Shield } from "lucide-react";

export default function ProjectManagement() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">项目管理</h1>
        <p className="text-muted-foreground">
          系统设置与项目配置管理
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              数据管理
            </CardTitle>
            <CardDescription>项目数据备份与恢复</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button variant="outline" className="w-full">
                导出项目数据
              </Button>
              <Button variant="outline" className="w-full">
                导入项目数据
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              用户管理
            </CardTitle>
            <CardDescription>系统用户权限管理</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button variant="outline" className="w-full">
                用户列表
              </Button>
              <Button variant="outline" className="w-full">
                权限设置
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              系统设置
            </CardTitle>
            <CardDescription>系统参数与配置管理</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button variant="outline" className="w-full">
                基础设置
              </Button>
              <Button variant="outline" className="w-full">
                通知设置
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              安全管理
            </CardTitle>
            <CardDescription>系统安全与日志管理</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button variant="outline" className="w-full">
                操作日志
              </Button>
              <Button variant="outline" className="w-full">
                安全设置
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}