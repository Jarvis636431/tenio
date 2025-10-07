import { useLocation, useParams } from "react-router-dom";
import { useProject } from "@/contexts/ProjectContext";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";

export function PageBreadcrumb() {
  const location = useLocation();
  const { id } = useParams();
  const { currentProject } = useProject();
  const searchParams = new URLSearchParams(location.search);
  const view = searchParams.get('view');
  const tab = searchParams.get('tab');

  // 根据当前路径生成面包屑
  const getBreadcrumbItems = () => {
    const items = [];

    // 首页和项目管理页面不显示面包屑
    if (location.pathname === '/' || location.pathname === '/project-management') {
      return [];
    }

    // 项目详情页面
    if (location.pathname.startsWith('/project/') && id) {
      if (currentProject) {
        items.push({ label: currentProject.name, isClickable: false });
      }

      // 根据view和tab参数添加子页面
      if (view) {
        const viewLabels: { [key: string]: string } = {
          'basic-info': '基础信息',
          'plan-and-orders': '施工总览',
          'real-time-monitoring': '实时监测',
          'craftsman-management': '工匠管理',
          'communication-collaboration': '沟通协作'
        };

        const tabLabels: { [key: string]: string } = {
          'task-overview': '任务总览',
          'gantt-chart': '施工工序甘特图',
          'procurement': '采购进度',
          'labor': '施工人数',
          'cost': '人工成本',
          'funding': '资金使用',
          'materials': '物料供应'
        };

        // 如果有tab参数，显示tab对应的页面
        if (tab && tabLabels[tab]) {
          items.push({ 
            label: tabLabels[tab], 
            href: `/project/${id}?view=${view}&tab=${tab}`, 
            isCurrent: true 
          });
        } else {
          // 否则显示view对应的页面
          const viewLabel = viewLabels[view] || view;
          items.push({ 
            label: viewLabel, 
            href: `/project/${id}?view=${view}`, 
            isCurrent: true 
          });
        }
      } else {
        // 如果没有view参数，当前项目就是当前页面
        items[items.length - 1].isCurrent = true;
      }
    }

    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  // 如果没有面包屑项目，不渲染组件
  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => (
          <div key={index} className="flex items-center">
            <BreadcrumbItem>
              {item.isCurrent ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : item.isClickable === false ? (
                <span className="text-muted-foreground">{item.label}</span>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
