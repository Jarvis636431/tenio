import { useLocation, useParams } from "react-router-dom";
import { useProject } from "@/hooks/useProject";
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
  // 路径片段到名称的映射
  const segmentNameMap: { [key: string]: string } = {
    // 一级导航
    plan: "施工总览",
    monitoring: "实时监测",
    craftsman: "工匠管理",
    funding: "资金物料",

    // 二级导航 (Tabs)
    overview: "任务总览",
    gantt: "施工工序甘特图",
    procurement: "采购进度",
    labor: "施工人数",
    cost: "人工成本",
    materials: "物料供应",
  };

  // 根据当前路径生成面包屑
  const getBreadcrumbItems = () => {
    const items = [];

    // 首页和项目管理页面不显示面包屑
    if (
      location.pathname === "/" ||
      location.pathname === "/project-management"
    ) {
      return [];
    }

    // 项目详情页面
    // 路径格式: /project/:id/:view/:tab
    if (location.pathname.startsWith("/project/") && id) {
      if (currentProject) {
        items.push({
          label: currentProject.name,
          href: `/project/${id}`,
          isClickable: true,
        });
      }

      // 解析路径片段
      // /project/123/plan/gantt -> ["project", "123", "plan", "gantt"]
      // 过滤掉空字符串
      const segments = location.pathname.split("/").filter(Boolean);

      // 第0个是 "project", 第1个是 id, 第2个是 view, 第3个是 tab
      const viewSegment = segments[2];
      const tabSegment = segments[3];

      if (viewSegment && segmentNameMap[viewSegment]) {
        // 添加一级导航面包屑
        const isLast = !tabSegment;
        items.push({
          label: segmentNameMap[viewSegment],
          href: !isLast ? `/project/${id}/${viewSegment}` : undefined,
          isCurrent: isLast,
        });

        // 如果有二级导航，添加二级导航面包屑
        if (tabSegment && segmentNameMap[tabSegment]) {
          items.push({
            label: segmentNameMap[tabSegment],
            href: undefined, // 最后一级通常不可点击或就是当前页
            isCurrent: true,
          });
        }
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
              ) : item.href ? (
                <BreadcrumbLink asChild>
                  <Link to={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              ) : (
                <span className="text-muted-foreground">{item.label}</span>
              )}
            </BreadcrumbItem>
            {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
