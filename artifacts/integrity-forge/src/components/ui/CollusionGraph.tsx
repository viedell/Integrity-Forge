import { useMemo } from "react";
import { SimilarityNode, SimilarityEdge } from "@workspace/api-client-react/src/generated/api.schemas";

interface CollusionGraphProps {
  nodes: SimilarityNode[];
  edges: SimilarityEdge[];
  width?: number;
  height?: number;
}

export function CollusionGraph({ nodes, edges, width = 600, height = 400 }: CollusionGraphProps) {
  // A very simple static layout for the nodes just to visualize something.
  // In a real app we'd use a force-directed layout like d3-force.
  
  const positions = useMemo(() => {
    const pos = new Map<string, { x: number, y: number }>();
    const radius = Math.min(width, height) / 2 - 40;
    const center = { x: width / 2, y: height / 2 };
    
    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI;
      pos.set(node.id, {
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle)
      });
    });
    
    return pos;
  }, [nodes, width, height]);

  if (nodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-secondary/20 rounded-md border border-dashed border-border" style={{ minHeight: height }}>
        <p className="text-muted-foreground text-sm font-mono">No network data available</p>
      </div>
    );
  }

  return (
    <div className="relative border border-border rounded-md bg-card overflow-hidden" style={{ width: '100%', height }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
        {/* Draw edges */}
        {edges.map(edge => {
          const sourceNode = nodes.find(n => n.submissionId === edge.sourceSubmissionId);
          const targetNode = nodes.find(n => n.submissionId === edge.targetSubmissionId);
          
          if (!sourceNode || !targetNode) return null;
          
          const sourcePos = positions.get(sourceNode.id);
          const targetPos = positions.get(targetNode.id);
          
          if (!sourcePos || !targetPos) return null;
          
          // Thicker/redder for higher similarity
          const strokeWidth = Math.max(1, (edge.similarityScore / 100) * 5);
          const isHighSimilarity = edge.similarityScore > 75;
          const strokeColor = isHighSimilarity ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground) / 0.3)";
          
          return (
            <line
              key={edge.id}
              x1={sourcePos.x}
              y1={sourcePos.y}
              x2={targetPos.x}
              y2={targetPos.y}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              opacity={isHighSimilarity ? 0.8 : 0.4}
            />
          );
        })}
        
        {/* Draw nodes */}
        {nodes.map(node => {
          const pos = positions.get(node.id);
          if (!pos) return null;
          
          const isFlagged = node.status === 'flagged_plagiarism' || node.status === 'flagged_ai';
          const fillColor = isFlagged ? "hsl(var(--destructive))" : "hsl(var(--primary))";
          
          return (
            <g key={node.id} transform={`translate(${pos.x}, ${pos.y})`}>
              <circle
                r={8}
                fill={fillColor}
                stroke="hsl(var(--background))"
                strokeWidth={2}
                className="cursor-pointer transition-all hover:r-[10px]"
              />
              <text
                y={20}
                textAnchor="middle"
                className="text-[10px] fill-muted-foreground font-mono font-medium pointer-events-none"
              >
                {node.studentName.split(' ')[0]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
