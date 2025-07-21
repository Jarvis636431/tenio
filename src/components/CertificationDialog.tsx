
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Phone, Award, Calendar } from "lucide-react";

interface Craftsman {
  id: number;
  name: string;
  trade: string;
  level: 1 | 2 | 3 | 4;
  gender: string;
  age: number;
  bio: string;
  phone: string;
  certificationStatus: string;
}

interface CertificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  craftsman: Craftsman;
}

export function CertificationDialog({ open, onOpenChange, craftsman }: CertificationDialogProps) {
  const getLevelDisplay = (level: number) => {
    return "★".repeat(level) + "☆".repeat(4 - level);
  };

  const getTradeColor = (trade: string) => {
    switch (trade) {
      case "木工": return "bg-amber-100 text-amber-800";
      case "电工": return "bg-yellow-100 text-yellow-800";
      case "钢筋工": return "bg-blue-100 text-blue-800";
      case "混凝土工": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>资格认证详情 - {craftsman.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 证件照区域 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-lg">证件照</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={`/placeholder.svg`} alt={craftsman.name} />
                  <AvatarFallback className="text-2xl">
                    {craftsman.name.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h3 className="font-semibold text-lg">{craftsman.name}</h3>
                  <p className="text-muted-foreground">{craftsman.trade}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 基本信息和简介 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 基本信息卡片 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  基本信息
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">姓名</label>
                    <p className="text-lg font-semibold">{craftsman.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">性别</label>
                    <p className="text-lg">{craftsman.gender}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">年龄</label>
                    <p className="text-lg">{craftsman.age}岁</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">联系方式</label>
                    <p className="text-lg flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {craftsman.phone}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">工种</label>
                    <div className="mt-1">
                      <Badge className={getTradeColor(craftsman.trade)}>
                        {craftsman.trade}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">技能等级</label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-yellow-500 text-lg">{getLevelDisplay(craftsman.level)}</span>
                      <span className="text-sm text-muted-foreground">{craftsman.level}级</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 个人简介 */}
            <Card>
              <CardHeader>
                <CardTitle>个人简介</CardTitle>
                <CardDescription>工作经验和技能描述</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-base leading-relaxed">{craftsman.bio}</p>
              </CardContent>
            </Card>

            {/* 资格认证 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  资格认证盖章
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">认证状态</span>
                    <Badge 
                      variant={craftsman.certificationStatus === '已认证' ? 'default' : 'secondary'}
                      className={craftsman.certificationStatus === '已认证' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                    >
                      {craftsman.certificationStatus}
                    </Badge>
                  </div>
                  
                  {craftsman.certificationStatus === '已认证' && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <div className="space-y-2">
                        <Award className="h-12 w-12 mx-auto text-green-600" />
                        <h4 className="text-lg font-semibold">认证证书</h4>
                        <p className="text-muted-foreground">
                          {craftsman.trade}技能等级证书 - {craftsman.level}级
                        </p>
                        <div className="mt-4 text-sm text-muted-foreground">
                          <p>认证机构：建设行业技能鉴定中心</p>
                          <p>认证时间：2024年1月15日</p>
                          <p>证书编号：CRT-{craftsman.id.toString().padStart(6, '0')}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {craftsman.certificationStatus === '待认证' && (
                    <div className="border-2 border-dashed border-yellow-300 rounded-lg p-8 text-center">
                      <div className="space-y-2">
                        <Calendar className="h-12 w-12 mx-auto text-yellow-600" />
                        <h4 className="text-lg font-semibold">待认证</h4>
                        <p className="text-muted-foreground">
                          认证材料审核中，预计3-5个工作日完成
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
