import { useMemo } from "react";
import type { PlanTask } from "@/types/domain/plan";

interface NetworkDiagramProps {
  tasks: PlanTask[];
}

type Node = {
  id: number;
  title: string;
  start: string;
  end: string;
  level: number;
};

type Edge = {
  from: number;
  to: number;
};

function parseDependencyIds(value: string): number[] {
  return value
    .split(/[,\s]+/)
    .map((item) => Number(item.trim()))
    .filter((id) => Number.isFinite(id));
}

export function NetworkDiagram({ tasks }: NetworkDiagramProps) {
  const { nodes, edges, width, height } = useMemo(() => {
    if (tasks.length === 0) {
      return { nodes: [] as Node[], edges: [] as Edge[], width: 0, height: 0 };
    }

    const taskMap = new Map<number, PlanTask>();
    tasks.forEach((task) => taskMap.set(task.id, task));

    const edges: Edge[] = [];
    const inDegree = new Map<number, number>();
    const levelMap = new Map<number, number>();

    tasks.forEach((task) => {
      inDegree.set(task.id, 0);
      levelMap.set(task.id, 0);
    });

    tasks.forEach((task) => {
      const deps = task.prerequisiteProcess
        ? parseDependencyIds(task.prerequisiteProcess)
        : [];
      deps.forEach((depId) => {
        if (!taskMap.has(depId)) return;
        edges.push({ from: depId, to: task.id });
        inDegree.set(task.id, (inDegree.get(task.id) ?? 0) + 1);
      });
    });

    const queue: number[] = [];
    inDegree.forEach((deg, id) => {
      if (deg === 0) queue.push(id);
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentLevel = levelMap.get(current) ?? 0;
      edges
        .filter((edge) => edge.from === current)
        .forEach((edge) => {
          const nextLevel = Math.max(
            levelMap.get(edge.to) ?? 0,
            currentLevel + 1,
          );
          levelMap.set(edge.to, nextLevel);
          inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) - 1);
          if ((inDegree.get(edge.to) ?? 0) === 0) {
            queue.push(edge.to);
          }
        });
    }

    const nodes: Node[] = tasks.map((task) => ({
      id: task.id,
      title: task.task,
      start: task.startTime,
      end: task.endTime,
      level: levelMap.get(task.id) ?? 0,
    }));

    const levelGroups = new Map<number, Node[]>();
    nodes.forEach((node) => {
      const list = levelGroups.get(node.level) ?? [];
      list.push(node);
      levelGroups.set(node.level, list);
    });

    const levelGap = 260;
    const rowGap = 120;
    const nodeWidth = 220;
    const nodeHeight = 70;
    const padding = 40;
    const maxLevel = Math.max(...nodes.map((n) => n.level));
    const maxRows =
      Math.max(...Array.from(levelGroups.values()).map((list) => list.length)) ||
      1;

    const width = padding * 2 + (maxLevel + 1) * levelGap;
    const height = padding * 2 + maxRows * rowGap;

    const positioned = nodes.map((node) => {
      const index = levelGroups.get(node.level)?.indexOf(node) ?? 0;
      const x = padding + node.level * levelGap;
      const y = padding + index * rowGap;
      return { ...node, x, y, w: nodeWidth, h: nodeHeight };
    });

    return { nodes: positioned, edges, width, height };
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
        当前项目暂无施工任务数据
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto rounded-xl border border-gray-100 bg-white">
      <div className="min-h-full min-w-full p-6">
        <svg width={width} height={height}>
          <defs>
            <marker
              id="arrow"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 Z" fill="#94a3b8" />
            </marker>
          </defs>
          {edges.map((edge, index) => {
            const from = nodes.find((node) => node.id === edge.from);
            const to = nodes.find((node) => node.id === edge.to);
            if (!from || !to) return null;
            const x1 = from.x + from.w;
            const y1 = from.y + from.h / 2;
            const x2 = to.x;
            const y2 = to.y + to.h / 2;
            const midX = (x1 + x2) / 2;
            return (
              <path
                key={`${edge.from}-${edge.to}-${index}`}
                d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                stroke="#94a3b8"
                strokeWidth="1.2"
                fill="none"
                markerEnd="url(#arrow)"
              />
            );
          })}

          {nodes.map((node) => (
            <g key={node.id}>
              <rect
                x={node.x}
                y={node.y}
                width={node.w}
                height={node.h}
                rx="10"
                fill="#ffffff"
                stroke="#e2e8f0"
              />
              <text
                x={node.x + 12}
                y={node.y + 26}
                fontSize="13"
                fill="#0f172a"
                fontWeight="600"
              >
                {node.title}
              </text>
              <text x={node.x + 12} y={node.y + 48} fontSize="11" fill="#64748b">
                {node.start} → {node.end}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
