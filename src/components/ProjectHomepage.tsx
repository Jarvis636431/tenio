import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  Users, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  Eye
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProjectHomepageProps {
  projectId: string;
  projectName: string;
}

export function ProjectHomepage({ projectId, projectName }: ProjectHomepageProps) {
  const navigate = useNavigate();
  
  // 模拟项目数据
  const projectStats = useMemo(() => ({
    totalTasks: 60,
    completedTasks: 23,
    inProgressTasks: 12,
    pendingTasks: 25,
    totalWorkers: 45,
    activeWorkers: 38,
    projectDuration: 45, // 天
    daysElapsed: 18,
    budget: 2500000,
    spent: 1200000,
    remaining: 1300000
  }), []);

  const progressPercentage = Math.round((projectStats.completedTasks / projectStats.totalTasks) * 100);
  const budgetPercentage = Math.round((projectStats.spent / projectStats.budget) * 100);
  const timePercentage = Math.round((projectStats.daysElapsed / projectStats.projectDuration) * 100);

  const quickActions = [
    {
      title: "任务总览",
      description: "查看和管理所有任务",
      icon: BarChart3,
      color: "bg-blue-500",
      href: `/project/${projectId}?view=task-overview`
    },
    {
      title: "甘特图",
      description: "可视化项目进度",
      icon: Calendar,
      color: "bg-green-500",
      href: `/project/${projectId}?view=gantt-chart`
    },
    {
      title: "人员管理",
      description: "管理施工人员",
      icon: Users,
      color: "bg-purple-500",
      href: `/project/${projectId}?view=craftsman-management`
    },
    {
      title: "实时监控",
      description: "监控现场情况",
      icon: TrendingUp,
      color: "bg-orange-500",
      href: `/project/${projectId}?view=real-time-monitoring`
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: "task_completed",
      title: "1层剪力墙放线完成",
      time: "2小时前",
      worker: "测量员 - 张三"
    },
    {
      id: 2,
      type: "task_started",
      title: "1层剪力墙模板拼装开始",
      time: "4小时前",
      worker: "木工 - 李四"
    },
    {
      id: 3,
      type: "worker_added",
      title: "新增钢筋工2人",
      time: "1天前",
      worker: "管理员"
    },
    {
      id: 4,
      type: "task_updated",
      title: "2层施工计划调整",
      time: "2天前",
      worker: "项目经理"
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "task_completed":
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case "task_started":
        return <div className="w-2 h-2 bg-blue-500 rounded-full" />;
      case "worker_added":
        return <div className="w-2 h-2 bg-purple-500 rounded-full" />;
      case "task_updated":
        return <div className="w-2 h-2 bg-orange-500 rounded-full" />;
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full" />;
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* 项目标题和基本信息 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{projectName}</h1>
        <p className="text-gray-600 mt-1">项目ID: {projectId}</p>
      </div>

      {/* 项目统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 任务进度 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">任务进度</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressPercentage}%</div>
            <p className="text-xs text-muted-foreground">
              {projectStats.completedTasks} / {projectStats.totalTasks} 任务完成
            </p>
            <Progress value={progressPercentage} className="mt-2" />
          </CardContent>
        </Card>

        {/* 人员状态 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">人员状态</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats.activeWorkers}</div>
            <p className="text-xs text-muted-foreground">
              {projectStats.totalWorkers} 总人员，{projectStats.activeWorkers} 在岗
            </p>
            <div className="flex items-center mt-2">
              <Badge variant="outline" className="text-xs">
                {Math.round((projectStats.activeWorkers / projectStats.totalWorkers) * 100)}% 在岗率
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* 时间进度 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">时间进度</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{timePercentage}%</div>
            <p className="text-xs text-muted-foreground">
              第 {projectStats.daysElapsed} 天 / 共 {projectStats.projectDuration} 天
            </p>
            <Progress value={timePercentage} className="mt-2" />
          </CardContent>
        </Card>

        {/* 预算状态 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">预算状态</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budgetPercentage}%</div>
            <p className="text-xs text-muted-foreground">
              已用 ¥{projectStats.spent.toLocaleString()} / 预算 ¥{projectStats.budget.toLocaleString()}
            </p>
            <Progress value={budgetPercentage} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 快速入口 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>快速入口</CardTitle>
            <CardDescription>快速访问项目各个功能模块</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start space-y-2 hover:shadow-md transition-shadow"
                  onClick={() => navigate(action.href)}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div className={`p-2 rounded-lg ${action.color} text-white`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{action.title}</div>
                      <div className="text-sm text-muted-foreground">{action.description}</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 最近活动 */}
        <Card>
          <CardHeader>
            <CardTitle>最近活动</CardTitle>
            <CardDescription>项目最新动态</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.worker}</p>
                    <p className="text-xs text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4">
              <Eye className="h-4 w-4 mr-2" />
              查看全部
            </Button>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
