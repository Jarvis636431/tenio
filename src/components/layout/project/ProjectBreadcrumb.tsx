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
import { PROJECT_BREADCRUMB_NAME_MAP } from "@/constants/project-breadcrumb";

export function ProjectBreadcrumb() {
  const location = useLocation();
  const { id } = useParams();
  const { currentProject } = useProject();
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

      if (viewSegment && PROJECT_BREADCRUMB_NAME_MAP[viewSegment]) {
        // 添加一级导航面包屑
        const isLast = !tabSegment;
        items.push({
          label: PROJECT_BREADCRUMB_NAME_MAP[viewSegment],
          href: !isLast ? `/project/${id}/${viewSegment}` : undefined,
          isCurrent: isLast,
        });

        // 如果有二级导航，添加二级导航面包屑
        if (tabSegment && PROJECT_BREADCRUMB_NAME_MAP[tabSegment]) {
          items.push({
            label: PROJECT_BREADCRUMB_NAME_MAP[tabSegment],
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
