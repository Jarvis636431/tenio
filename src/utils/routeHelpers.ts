// URL 路径助手函数
// 用于将旧的 view/tab 参数转换为新的路径参数格式

/**
 * 将 view ID 和 tab ID 转换为项目路径
 * @param projectId - 项目 ID
 * @param viewId - 视图 ID（旧格式）
 * @param tabId - 标签 ID（旧格式，可选）
 * @returns 新的项目路径
 */
export function getProjectPath(projectId: string, viewId?: string, tabId?: string): string {
  if (!viewId) {
    return `/project/${projectId}`;
  }
  
  // IDs now directly match the URL segments, so simple concatenation is enough
  const basePath = `/project/${projectId}/${viewId}`;
  
  if (tabId) {
    return `${basePath}/${tabId}`;
  }
  
  return basePath;
}
