import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import dagre from "dagre";
import { formatDateString } from "@/lib/date";
import { isLagTask, formatDurationDays } from "@/lib/task";
import type { ScheduleTask } from "@/features/project";

interface NetworkDiagramProps {
  tasks: ScheduleTask[];
  onNodeClick?: (task: ScheduleTask) => void;
}

type Node = {
  id: string;
  displayId: string;
  title: string;
  start: string;
  end: string;
  level: number;
  task: ScheduleTask;
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

/* ── 布局常量 ── */
const LAYOUT = {
  padding: 80,
  nodeMarginX: 40,
  nodeMarginY: 40,
  dateInsetX: 15,
  dateBoxW: 105,
  dateBoxH: 30,
  dotR: 7,
  capsuleInsetX: 14,
  capsuleH: 52,
  capsulePadX: 50,
  minNodeW: 280,
  nodeH: 130,
  scaleX: 0.9,
  maxScale: 3,
  scaleFactor: 1.1,
} as const;

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
  const capsuleW = textW + LAYOUT.capsulePadX;
  const nodeW = capsuleW + LAYOUT.capsuleInsetX * 2;
  return Math.max(LAYOUT.minNodeW, Math.ceil(nodeW));
}

/** 构建连线 SVG path 字符串 */
function buildEdgePath(from: Node, to: Node, points: Array<{ x: number; y: number }>): string {
  if (points.length > 1) {
    const [first, ...rest] = points;
    return `M ${first.x} ${first.y} ${rest.map((p) => `L ${p.x} ${p.y}`).join(" ")}`;
  }
  const x1 = from.x + from.w;
  const y1 = from.y + from.h / 2;
  const x2 = to.x;
  const y2 = to.y + to.h / 2;
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

/* ── 日期框子组件 ── */
interface DateBoxProps {
  x: number;
  y: number;
  date: string;
  theme: (typeof NODE_THEME)[keyof typeof NODE_THEME];
}

function DateBox({ x, y, date, theme }: DateBoxProps) {
  return (
    <>
      <rect
        x={x}
        y={y}
        width={LAYOUT.dateBoxW}
        height={LAYOUT.dateBoxH}
        fill={theme.bg}
        stroke={theme.border}
        strokeWidth="1.5"
      />
      <text
        x={x + LAYOUT.dateBoxW / 2}
        y={y + LAYOUT.dateBoxH / 2 + 5}
        fontSize="14"
        fill={theme.text}
        textAnchor="middle"
      >
        {formatDateString(date)}
      </text>
    </>
  );
}

/* ── 单个节点块 ── */
interface NodeBlockProps {
  node: Node;
  onNodeClick?: (task: ScheduleTask) => void;
}

function NodeBlock({ node, onNodeClick }: NodeBlockProps) {
  const { x, y, w, h, critical, task, displayId, title, start, end } = node;
  const durationValue = task.durationDays != null ? formatDurationDays(task.durationDays) : "";
  const durationText = durationValue ? `${durationValue}天` : "";
  const theme = critical ? NODE_THEME.critical : NODE_THEME.normal;

  const capsuleY = y + h / 2 - LAYOUT.capsuleH / 2 + 4;
  const capsuleW = w - LAYOUT.capsuleInsetX * 2;

  /* 日期框 — 跨在主框边线上（上半在外，下半在内） */
  const dateOverlap = LAYOUT.dateBoxH / 2;
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
      <DateBox x={x + LAYOUT.dateInsetX} y={topDateY} date={start} theme={theme} />
      <DateBox
        x={x + w - LAYOUT.dateInsetX - LAYOUT.dateBoxW}
        y={topDateY}
        date={end}
        theme={theme}
      />
      <DateBox x={x + LAYOUT.dateInsetX} y={bottomDateY} date={start} theme={theme} />
      <DateBox
        x={x + w - LAYOUT.dateInsetX - LAYOUT.dateBoxW}
        y={bottomDateY}
        date={end}
        theme={theme}
      />

      {/* ── 左右连接圆点 ── */}
      <circle
        cx={x}
        cy={y + h / 2}
        r={LAYOUT.dotR}
        fill="#ffffff"
        stroke={theme.border}
        strokeWidth="1.5"
      />
      <circle
        cx={x + w}
        cy={y + h / 2}
        r={LAYOUT.dotR}
        fill="#ffffff"
        stroke={theme.border}
        strokeWidth="1.5"
      />

      {/* ── 中间内容 ── */}
      {!title.toLowerCase().startsWith("lag") && (
        <text x={x + w / 2} y={capsuleY - 4} fontSize="14" fill={theme.text} textAnchor="middle">
          #{displayId}
        </text>
      )}

      {/* 黄色胶囊 */}
      <rect
        x={x + LAYOUT.capsuleInsetX}
        y={capsuleY}
        width={capsuleW}
        height={LAYOUT.capsuleH}
        rx="12"
        fill={theme.bg}
      />
      <text
        x={x + w / 2}
        y={capsuleY + LAYOUT.capsuleH / 2 + 6}
        fontSize="16"
        fill={theme.text}
        fontWeight="bold"
        textAnchor="middle"
      >
        {title}
      </text>

      {/* ── 底部工期 ── */}
      <text x={x + w / 2} y={y + h - 8} fontSize="14" fill={theme.text} textAnchor="middle">
        {durationText}
      </text>
    </g>
  );
}

export function NetworkDiagram({ tasks, onNodeClick }: NetworkDiagramProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const isPanningRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [minScale, setMinScale] = useState(0.1);
  const [initialFitDone, setInitialFitDone] = useState(false);
  const visibleTasks = useMemo(
    () => tasks.filter((task) => task.startTime && task.endTime && !isLagTask(task.taskName)),
    [tasks],
  );

  const { nodes, edges, nodeMap, width, height } = useMemo(() => {
    if (visibleTasks.length === 0) {
      return {
        nodes: [] as Node[],
        edges: [] as Edge[],
        nodeMap: new Map<string, Node>(),
        width: 0,
        height: 0,
      };
    }

    const taskMap = new Map<string, ScheduleTask>();
    visibleTasks.forEach((task) => taskMap.set(task.taskId, task));

    const rawEdges: Array<{ from: string; to: string }> = [];
    visibleTasks.forEach((task) => {
      const deps = task.dependencies || [];
      deps.forEach((depId) => {
        const depTaskId = String(depId);
        if (!taskMap.has(depTaskId)) return;
        rawEdges.push({ from: depTaskId, to: task.taskId });
      });
    });

    const baseNodes: Node[] = visibleTasks.map((task) => ({
      id: task.taskId,
      displayId: task.seqNo ? String(task.seqNo) : task.taskId,
      title: task.taskName,
      start: task.startTime,
      end: task.endTime,
      level: 0,
      task,
      critical: Boolean(task.isCriticalPath),
      x: 0,
      y: 0,
      w: calcNodeWidth(task.taskName),
      h: LAYOUT.nodeH,
    }));

    const graph = new dagre.graphlib.Graph();
    graph.setGraph({ rankdir: "LR", nodesep: 60, ranksep: 100 });
    graph.setDefaultEdgeLabel(() => ({}));

    baseNodes.forEach((node) => {
      graph.setNode(node.id, {
        width: node.w + LAYOUT.nodeMarginX,
        height: node.h + LAYOUT.nodeMarginY,
      });
    });
    rawEdges.forEach((edge) => {
      graph.setEdge(edge.from, edge.to);
    });

    dagre.layout(graph);

    const graphMeta = graph.graph();
    const layoutWidth = (graphMeta.width ?? 0) + LAYOUT.padding * 2;
    const layoutHeight = (graphMeta.height ?? 0) + LAYOUT.padding * 2;

    const positioned = baseNodes.map((node) => {
      const pos = graph.node(node.id);
      return {
        ...node,
        x: (pos?.x ?? 0) - node.w / 2 + LAYOUT.padding,
        y: (pos?.y ?? 0) - node.h / 2 + LAYOUT.padding,
      };
    });

    const nodesMap = new Map(positioned.map((n) => [n.id, n]));

    const edgeList: Edge[] = rawEdges.map((edge) => {
      const info = graph.edge(edge.from, edge.to);
      const points = (info?.points ?? []).map((point: { x: number; y: number }) => ({
        x: point.x + LAYOUT.padding,
        y: point.y + LAYOUT.padding,
      }));
      return { ...edge, points };
    });

    return {
      nodes: positioned,
      edges: edgeList,
      nodeMap: nodesMap,
      width: layoutWidth,
      height: layoutHeight,
    };
  }, [visibleTasks]);

  /** 计算适应视图的缩放和偏移 */
  const fitToView = useCallback(() => {
    if (!svgRef.current || width === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = rect.width / width;
    const scaleY = rect.height / height;
    const fitScale = Math.min(scaleX, scaleY) * LAYOUT.scaleX;
    const offsetX = (rect.width - width * fitScale) / 2;
    const offsetY = (rect.height - height * fitScale) / 2;
    setView({ x: offsetX, y: offsetY, scale: fitScale });
    setMinScale(fitScale);
  }, [width, height]);

  /* ── 初始自适应居中 ── */
  useEffect(() => {
    if (!svgRef.current || width === 0 || initialFitDone) return;
    fitToView();
    setInitialFitDone(true);
  }, [width, height, initialFitDone, fitToView]);

  const handleWheel = useCallback(
    (event: React.WheelEvent<SVGSVGElement>) => {
      event.preventDefault();
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const scaleBy = event.deltaY < 0 ? LAYOUT.scaleFactor : 1 / LAYOUT.scaleFactor;
      const nextScale = Math.min(LAYOUT.maxScale, Math.max(minScale, view.scale * scaleBy));
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
    fitToView();
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
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L8,4 L0,8 Z" fill="currentColor" />
          </marker>
        </defs>

        <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
          {/* ── 连线 ── */}
          {edges.map((edge) => {
            const from = nodeMap.get(edge.from);
            const to = nodeMap.get(edge.to);
            if (!from || !to) return null;
            const isCritical = from.critical && to.critical;
            const d = buildEdgePath(from, to, edge.points);
            return (
              <path
                key={`${edge.from}-${edge.to}`}
                d={d}
                stroke={isCritical ? "rgb(60, 140, 221)" : "#2f6fb4"}
                strokeWidth={isCritical ? "3" : "1.5"}
                fill="none"
                markerEnd="url(#arrow)"
                color={isCritical ? "rgb(60, 140, 221)" : "#2f6fb4"}
              />
            );
          })}

          {/* ── 节点 ── */}
          {nodes.map((node) => (
            <NodeBlock key={node.id} node={node} onNodeClick={onNodeClick} />
          ))}
        </g>
      </svg>
    </div>
  );
}
