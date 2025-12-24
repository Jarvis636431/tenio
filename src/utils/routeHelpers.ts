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
  const basePath = `/project/${projectId}`;
  
  if (!viewId) {
    return basePath; // 项目主页
  }
  
  // 映射表：(viewId, tabId) => 路径
  const pathMap: Record<string, Record<string, string> | string> = {
    'homepage': '',
    'basic-info': 'basic-info',
    'plan-and-orders': {
      '': 'plan',
      'task-overview': 'plan/overview',
      'gantt-chart': 'plan/gantt',
    },
    'task-overview': 'plan/overview',
    'gantt-chart': 'plan/gantt',
    'real-time-monitoring': {
      '': 'monitoring',
      'labor': 'monitoring/labor',
      'cost': 'monitoring/cost',
    },
    'labor': 'monitoring/labor',
    'cost': 'monitoring/cost',
    'craftsman-management': 'craftsman',
    'communication-collaboration': 'communication',
    'funding-materials': 'funding',
    'toolbox': {
      '': 'toolbox',
      'quality-inspection': 'toolbox/quality',
      'daily-log': 'toolbox/daily-log',
      'knowledge-qa': 'toolbox/qa',
    },
    'quality-inspection': 'toolbox/quality',
    'daily-log': 'toolbox/daily-log',
    'knowledge-qa': 'toolbox/qa',
  };
  
  const mapping = pathMap[viewId];
  
  if (typeof mapping === 'string') {
    // 简单映射
    return `${basePath}/${mapping}`.replace(/\/$/, '');
  } else if (mapping && typeof mapping === 'object') {
    // 带 tab 的映射
    const subPath = mapping[tabId || ''] || mapping[''];
    return `${basePath}/${subPath}`.replace(/\/$/, '');
  }
  
  // 默认返回主页
  return basePath;
}
