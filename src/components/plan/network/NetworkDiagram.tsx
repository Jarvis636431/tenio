import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import dagre from "dagre";
import type { PlanTask } from "@/types/domain/plan";

interface NetworkDiagramProps {
  tasks: PlanTask[];
  onNodeClick?: (task: PlanTask) => void;
  currentDate?: Date | null;
}

type Node = {
  id: string;
  displayId: string;
  title: string;
  start: string;
  end: string;
  level: number;
  task: PlanTask;
  critical: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
};

type Edge = {
  from: string;
  to: string;
  points: Array<{ x: number; y: number }>;
};

type TaskStatus = "not_started" | "in_progress" | "completed";

const NODE_THEME = {
  critical: {
    bg: "#9fb7d4",
    border: "#3c8cdd",
    text: "#ffffff",
  },
  normal: {
    bg: "#5f5f61",
    border: "#6b6b6e",
    text: "#ffffff",
  },
} as const;

function parseDependencyIds(value: string): string[] {
  return value
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter((id) => id.length > 0);
}

function isLagTask(taskName?: string): boolean {
  return (taskName ?? "").trim().toLowerCase().startsWith("lag");
}

/* ── 节点尺寸常量（匹配 HTML 样式） ── */
const MIN_NODE_W = 280;
const NODE_H = 130;
const DATE_BOX_W = 105;
const DATE_BOX_H = 30;
const DOT_R = 7;
const CAPSULE_INSET_X = 14;
const CAPSULE_H = 52;
const CAPSULE_PAD_X = 50; // 胶囊内文字左右 padding
const STATUS_COLORS: Record<TaskStatus, { capsule: string; dot: string }> = {
  not_started: { capsule: "#d1d5db", dot: "#ffffff" },
  in_progress: { capsule: "#fdeeb3", dot: "#fdeeb3" },
  completed: { capsule: "#C8E5B3", dot: "#C8E5B3" },
};

/** 估算文字像素宽度（中文≈fontSize，其他≈fontSize*0.55） */
function estimateTextWidth(text: string, fontSize: number): number {
  let w = 0;
  for (const ch of text) {
    w += ch.charCodeAt(0) > 0x7f ? fontSize : fontSize * 0.55;
  }
  return w;
}

/** 根据标题文字长度计算节点宽度 */
function calcNodeWidth(title: string): number {
  const textW = estimateTextWidth(title, 16);
  const capsuleW = textW + CAPSULE_PAD_X;
  const nodeW = capsuleW + CAPSULE_INSET_X * 2;
  return Math.max(MIN_NODE_W, Math.ceil(nodeW));
}

function toDate(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value: Date | null): string {
  if (!value) return "-";
  return value.toISOString().slice(0, 10);
}

function formatDateString(value: string): string {
  if (!value) return "-";
  // Prefer raw date part to avoid timezone display or shifts.
  if (value.length >= 10) {
    const datePart = value.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      return datePart;
    }
  }
  return formatDate(toDate(value));
}

function getTaskStatus(
  start: string,
  end: string,
  current: Date | null,
): TaskStatus {
  const startDate = toDate(start);
  const endDate = toDate(end);
  if (!current || !startDate || !endDate) return "not_started";
  const currentTime = current.getTime();
  if (currentTime < startDate.getTime()) return "not_started";
  if (currentTime > endDate.getTime()) return "completed";
  return "in_progress";
}

function formatDurationDays(value?: string | number): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toFixed(1);
  }
  if (typeof value === "string") {
    const numeric = Number(value.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(numeric)) {
      return numeric.toFixed(1);
    }
  }
  return "";
}

/* ── 单个节点块 ── */
function NodeBlock({
  node,
  onNodeClick,
  status,
}: {
  node: Node;
  onNodeClick?: (task: PlanTask) => void;
  status: TaskStatus;
}) {
  const { x, y, w, h, critical, task, displayId, title, start, end } = node;
  const durationValue =
    task.duration !== ""
      ? formatDurationDays(task.duration)
      : formatDurationDays(task.actualWorkDays);
  const durationText = durationValue ? `${durationValue}天` : "";
  const statusColor = STATUS_COLORS[status];
  const theme = critical ? NODE_THEME.critical : NODE_THEME.normal;

  const capsuleY = y + h / 2 - CAPSULE_H / 2 + 4;
  const capsuleW = w - CAPSULE_INSET_X * 2;

  /* 日期框 — 跨在主框边线上（上半在外，下半在内） */
  const dateInsetX = 15;
  const dateOverlap = DATE_BOX_H / 2; // 一半在框外，一半在框内
  const topDateY = y - dateOverlap;
  const bottomDateY = y + h - dateOverlap;

  return (
    <g
      data-node-block="true"
      onClick={() => onNodeClick?.(task)}
      className={onNodeClick ? "cursor-pointer" : undefined}
    >
      {/* 主体方框 */}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill={theme.bg}
        stroke={theme.border}
        strokeWidth="1.5"
      />

      {/* ── 四角日期框 ── */}
      {/* 左上 ES */}
      <rect x={x + dateInsetX} y={topDateY} width={DATE_BOX_W} height={DATE_BOX_H} fill={theme.bg} stroke={theme.border} strokeWidth="1.5" />
      <text x={x + dateInsetX + DATE_BOX_W / 2} y={topDateY + DATE_BOX_H / 2 + 5} fontSize="14" fill={theme.text} textAnchor="middle">{formatDateString(start)}</text>

      {/* 右上 EF */}
      <rect x={x + w - dateInsetX - DATE_BOX_W} y={topDateY} width={DATE_BOX_W} height={DATE_BOX_H} fill={theme.bg} stroke={theme.border} strokeWidth="1.5" />
      <text x={x + w - dateInsetX - DATE_BOX_W / 2} y={topDateY + DATE_BOX_H / 2 + 5} fontSize="14" fill={theme.text} textAnchor="middle">{formatDateString(end)}</text>

      {/* 左下 LS */}
      <rect x={x + dateInsetX} y={bottomDateY} width={DATE_BOX_W} height={DATE_BOX_H} fill={theme.bg} stroke={theme.border} strokeWidth="1.5" />
      <text x={x + dateInsetX + DATE_BOX_W / 2} y={bottomDateY + DATE_BOX_H / 2 + 5} fontSize="14" fill={theme.text} textAnchor="middle">{formatDateString(start)}</text>

      {/* 右下 LF */}
      <rect x={x + w - dateInsetX - DATE_BOX_W} y={bottomDateY} width={DATE_BOX_W} height={DATE_BOX_H} fill={theme.bg} stroke={theme.border} strokeWidth="1.5" />
      <text x={x + w - dateInsetX - DATE_BOX_W / 2} y={bottomDateY + DATE_BOX_H / 2 + 5} fontSize="14" fill={theme.text} textAnchor="middle">{formatDateString(end)}</text>

      {/* ── 左右连接圆点 — 正好在节点边缘，与连线对齐 ── */}
      <circle
        cx={x}
        cy={y + h / 2}
        r={DOT_R}
        fill={statusColor.dot}
        stroke={theme.border}
        strokeWidth="1.5"
      />
      <circle
        cx={x + w}
        cy={y + h / 2}
        r={DOT_R}
        fill={statusColor.dot}
        stroke={theme.border}
        strokeWidth="1.5"
      />

      {/* ── 中间内容 ── */}
      {!title.toLowerCase().startsWith("lag") && (
        <text x={x + w / 2} y={capsuleY - 4} fontSize="14" fill={theme.text} textAnchor="middle">#{displayId}</text>
      )}

      {/* 黄色胶囊 */}
      <rect
        x={x + CAPSULE_INSET_X}
        y={capsuleY}
        width={capsuleW}
        height={CAPSULE_H}
        rx="12"
        fill={theme.bg}
      />
      <text x={x + w / 2} y={capsuleY + CAPSULE_H / 2 + 6} fontSize="16" fill={theme.text} fontWeight="bold" textAnchor="middle">{title}</text>

      {/* ── 底部工期（主框内底部，两个日期框之间） ── */}
      <text x={x + w / 2} y={y + h - 8} fontSize="14" fill={theme.text} textAnchor="middle">{durationText}</text>
    </g>
  );
}

export function NetworkDiagram({
  tasks,
  onNodeClick,
  currentDate = null,
}: NetworkDiagramProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const isPanningRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [initialized, setInitialized] = useState(false);
  const [minScale, setMinScale] = useState(0.1);
  const visibleTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.startTime && task.endTime && !isLagTask(task.task),
      ),
    [tasks],
  );

  const { nodes, edges, width, height } = useMemo(() => {
    if (visibleTasks.length === 0) {
      return { nodes: [] as Node[], edges: [] as Edge[], width: 0, height: 0 };
    }

    const taskMap = new Map<string, PlanTask>();
    visibleTasks.forEach((task) => taskMap.set(task.id, task));

    const rawEdges: Array<{ from: string; to: string }> = [];
    visibleTasks.forEach((task) => {
      const deps = task.prerequisiteProcess
        ? parseDependencyIds(task.prerequisiteProcess)
        : [];
      deps.forEach((depId) => {
        if (!taskMap.has(depId)) return;
        rawEdges.push({ from: depId, to: task.id });
      });
    });

    const padding = 80;

    const baseNodes: Node[] = visibleTasks.map((task) => ({
      id: task.id,
      displayId: task.seqNo ? String(task.seqNo) : task.id,
      title: task.task,
      start: task.startTime,
      end: task.endTime,
      level: 0,
      task,
      critical: Boolean(task.criticalPath),
      x: 0,
      y: 0,
      w: calcNodeWidth(task.task),
      h: NODE_H,
    }));

    const graph = new dagre.graphlib.Graph();
    graph.setGraph({ rankdir: "LR", nodesep: 60, ranksep: 100 });
    graph.setDefaultEdgeLabel(() => ({}));

    baseNodes.forEach((node) => {
      graph.setNode(node.id, { width: node.w + 40, height: node.h + 40 });
    });
    rawEdges.forEach((edge) => {
      graph.setEdge(edge.from, edge.to);
    });

    dagre.layout(graph);

    const graphMeta = graph.graph();
    const layoutWidth = (graphMeta.width ?? 0) + padding * 2;
    const layoutHeight = (graphMeta.height ?? 0) + padding * 2;

    const positioned = baseNodes.map((node) => {
      const pos = graph.node(node.id);
      return {
        ...node,
        x: (pos?.x ?? 0) - node.w / 2 + padding,
        y: (pos?.y ?? 0) - node.h / 2 + padding,
      };
    });

    const edges: Edge[] = rawEdges.map((edge) => {
      const info = graph.edge(edge.from, edge.to);
      const points = (
        info?.points ?? []
      ).map((point: { x: number; y: number }) => ({
        x: point.x + padding,
        y: point.y + padding,
      }));
      return { ...edge, points };
    });

    return { nodes: positioned, edges, width: layoutWidth, height: layoutHeight };
  }, [tasks]);

  /* ── 初始自适应居中 ── */
  useEffect(() => {
    if (!svgRef.current || width === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = rect.width / width;
    const scaleY = rect.height / height;
    const fitScale = Math.min(scaleX, scaleY) * 60;
    setMinScale(fitScale);
    if (initialized) return
    const offsetX = (rect.width - width * fitScale) / 2;
    const offsetY = (rect.height - height * fitScale) / 2;
    setView({ x: offsetX, y: offsetY, scale: fitScale });
    setInitialized(true);
  }, [width, height, initialized]);

  useEffect(() => {
    if (!initialized || !currentDate || nodes.length === 0 || !svgRef.current) return;

    const criticalInProgress = nodes.find(
      (node) =>
        node.critical &&
        getTaskStatus(node.start, node.end, currentDate) === "in_progress",
    );
    const inProgress = nodes.find(
      (node) => getTaskStatus(node.start, node.end, currentDate) === "in_progress",
    );
    const targetNode =
      criticalInProgress ??
      inProgress ??
      nodes
        .filter((node) => {
          const start = toDate(node.start);
          return start ? start.getTime() >= currentDate.getTime() : false;
        })
        .sort(
          (a, b) =>
            (toDate(a.start)?.getTime() ?? Number.MAX_SAFE_INTEGER) -
            (toDate(b.start)?.getTime() ?? Number.MAX_SAFE_INTEGER),
        )[0] ??
      nodes[nodes.length - 1];

    const rect = svgRef.current.getBoundingClientRect();
    const nextScale = Math.max(view.scale, minScale);
    const nodeCenterX = targetNode.x + targetNode.w / 2;
    const nodeCenterY = targetNode.y + targetNode.h / 2;
    const offsetX = rect.width / 2 - nodeCenterX * nextScale;
    const offsetY = rect.height / 2 - nodeCenterY * nextScale;
    setView((prev) => ({ ...prev, x: offsetX, y: offsetY, scale: nextScale }));
  }, [initialized, currentDate, nodes, minScale, view.scale]);

  const handleWheel = useCallback(
    (event: React.WheelEvent<SVGSVGElement>) => {
      event.preventDefault();
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const scaleBy = event.deltaY < 0 ? 1.1 : 0.9;
      const nextScale = Math.min(3, Math.max(minScale, view.scale * scaleBy));
      const ratio = nextScale / view.scale;
      setView({
        x: mouseX - (mouseX - view.x) * ratio,
        y: mouseY - (mouseY - view.y) * ratio,
        scale: nextScale,
      });
    },
    [view, minScale],
  );

  const handlePointerDown: React.PointerEventHandler<SVGSVGElement> = (e) => {
    const target = e.target as Element | null;
    if (target?.closest("[data-node-block='true']")) {
      return;
    }
    isPanningRef.current = true;
    lastPointRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove: React.PointerEventHandler<SVGSVGElement> = (e) => {
    if (!isPanningRef.current) return;
    const dx = e.clientX - lastPointRef.current.x;
    const dy = e.clientY - lastPointRef.current.y;
    lastPointRef.current = { x: e.clientX, y: e.clientY };
    setView((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  };

  const handlePointerUp: React.PointerEventHandler<SVGSVGElement> = (e) => {
    isPanningRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleDoubleClick: React.MouseEventHandler<SVGSVGElement> = () => {
    if (!svgRef.current || width === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = rect.width / width;
    const scaleY = rect.height / height;
    const fitScale = Math.min(scaleX, scaleY) * 0.9;
    const offsetX = (rect.width - width * fitScale) / 2;
    const offsetY = (rect.height - height * fitScale) / 2;
    setView({ x: offsetX, y: offsetY, scale: fitScale });
    setMinScale(fitScale);
  };

  if (tasks.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-cyan-300/70">
        当前项目暂无施工任务数据
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden overscroll-none bg-[#03112a]"
      onWheel={(e) => e.preventDefault()}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ cursor: "grab", touchAction: "none", display: "block" }}
      >
        <defs>
          <marker
            id="arrow"
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 Z" fill="#2f6fb4" />
          </marker>
          <marker
            id="arrow-critical"
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 Z" fill="rgb(60, 140, 221)" />
          </marker>
        </defs>

        <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
          {/* ── 连线 ── */}
          {edges.map((edge, index) => {
            const from = nodes.find((n) => n.id === edge.from);
            const to = nodes.find((n) => n.id === edge.to);
            if (!from || !to) return null;
            const isCritical = from.critical && to.critical;
            const points = edge.points;
            const d =
              points.length > 1
                ? `M ${points[0].x} ${points[0].y} ${points
                    .slice(1)
                    .map((p) => `L ${p.x} ${p.y}`)
                    .join(" ")}`
                : (() => {
                    const x1 = from.x + from.w;
                    const y1 = from.y + from.h / 2;
                    const x2 = to.x;
                    const y2 = to.y + to.h / 2;
                    const mx = (x1 + x2) / 2;
                    return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
                  })();
            return (
              <path
                key={`${edge.from}-${edge.to}-${index}`}
                d={d}
                stroke={isCritical ? "rgb(60, 140, 221)" : "#2f6fb4"}
                strokeWidth={isCritical ? "3" : "1.5"}
                fill="none"
                markerEnd={isCritical ? "url(#arrow-critical)" : "url(#arrow)"}
              />
            );
          })}

          {/* ── 节点 ── */}
          {nodes.map((node) => (
            <NodeBlock
              key={node.id}
              node={node}
              onNodeClick={onNodeClick}
              status={getTaskStatus(node.start, node.end, currentDate)}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
