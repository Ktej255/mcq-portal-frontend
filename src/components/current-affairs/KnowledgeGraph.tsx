"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ReactFlow, Background, Controls, MiniMap, Panel, Node, Edge, Position, useNodesState, useEdgesState, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { caService, GraphNodeOut, GraphEdgeOut, CAFilters } from '@/services/api/caService';
import { CAFilterBar } from './CAFilterBar';

/**
 * KnowledgeGraph — Interactive node-edge visualization using react-flow.
 * Subject-colored nodes, relevance-sized, causality arrows, click-to-detail.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */

const SUBJECT_COLORS: Record<string, string> = {
  geography: '#22c55e',
  economy: '#f59e0b',
  polity: '#3b82f6',
  environment: '#14b8a6',
  'science-tech': '#a855f7',
  history: '#ef4444',
  'disaster-mgmt': '#f97316',
  'internal-security': '#6366f1',
};

const EDGE_STYLES: Record<string, any> = {
  thread: { stroke: '#94a3b8', strokeWidth: 1.5 },
  causality: { stroke: '#1d9e75', strokeWidth: 2 },
  syllabus_link: { stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '5 3' },
  cross_subject: { stroke: '#a855f7', strokeWidth: 1.5, strokeDasharray: '3 3' },
};

function getNodeSize(relevance: number): number {
  return 30 + (relevance - 1) * 12; // 30px for score 1, 78px for score 5
}

function layoutGraph(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 100 });

  nodes.forEach(node => {
    const size = (node.data?.size as number) || 50;
    g.setNode(node.id, { width: size + 40, height: size + 20 });
  });
  edges.forEach(edge => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutNodes = nodes.map(node => {
    const pos = g.node(node.id);
    return { ...node, position: { x: pos.x - 40, y: pos.y - 20 } };
  });

  return { nodes: layoutNodes, edges };
}

interface KnowledgeGraphProps {
  onNodeClick?: (itemId: number) => void;
}

export function KnowledgeGraph({ onNodeClick }: KnowledgeGraphProps) {
  const [rawNodes, setRawNodes] = useState<GraphNodeOut[]>([]);
  const [rawEdges, setRawEdges] = useState<GraphEdgeOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Partial<CAFilters>>({});
  const [selectedNode, setSelectedNode] = useState<GraphNodeOut | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    try {
      const data = await caService.getGraphData(filters);
      setRawNodes(data.nodes);
      setRawEdges(data.edges);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchGraph(); }, [fetchGraph]);

  // Transform backend data to react-flow format + apply dagre layout
  useEffect(() => {
    if (rawNodes.length === 0) { setNodes([]); setEdges([]); return; }

    const rfNodes: Node[] = rawNodes.map(n => {
      const size = getNodeSize(n.relevance_score);
      const color = SUBJECT_COLORS[n.subject] || '#94a3b8';
      return {
        id: n.id,
        position: { x: 0, y: 0 },
        data: {
          label: n.label,
          subject: n.subject,
          relevance: n.relevance_score,
          isCompleted: n.is_completed,
          nodeType: n.node_type,
          publishDate: n.publish_date,
          size,
          color,
        },
        style: {
          width: size + 40,
          height: size,
          borderRadius: '12px',
          border: `2px solid ${color}`,
          backgroundColor: n.is_completed ? `${color}15` : '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '9px',
          fontWeight: 900,
          color: '#13251d',
          padding: '4px',
          textAlign: 'center' as const,
          overflow: 'hidden',
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      };
    });

    const rfEdges: Edge[] = rawEdges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label || undefined,
      style: EDGE_STYLES[e.edge_type] || EDGE_STYLES.thread,
      markerEnd: e.edge_type === 'causality' ? { type: MarkerType.ArrowClosed, color: '#1d9e75' } : undefined,
      labelStyle: { fontSize: '8px', fontWeight: 700 },
    }));

    const laid = layoutGraph(rfNodes, rfEdges);
    setNodes(laid.nodes);
    setEdges(laid.edges);
  }, [rawNodes, rawEdges, setNodes, setEdges]);

  const handleNodeClick = useCallback((_: any, node: Node) => {
    const raw = rawNodes.find(n => n.id === node.id);
    setSelectedNode(raw || null);
    if (raw && raw.node_type === 'ca_item') {
      const itemId = parseInt(raw.id.replace('ca_', ''));
      onNodeClick?.(itemId);
    }
  }, [rawNodes, onNodeClick]);

  if (loading) {
    return <div className="h-[600px] rounded-2xl bg-[#fffdf8] border border-[#dcd5c7] animate-pulse flex items-center justify-center text-sm text-[#5d675f]">Loading graph...</div>;
  }

  if (rawNodes.length === 0) {
    return <div className="h-[400px] rounded-2xl bg-[#fffdf8] border border-[#dcd5c7] flex items-center justify-center text-sm text-[#5d675f]">No data for current filters</div>;
  }

  return (
    <div className="space-y-4">
      <CAFilterBar filters={filters} onFiltersChange={setFilters} />

      <div className="h-[600px] rounded-2xl border border-[#dcd5c7] overflow-hidden bg-white">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          fitView
          minZoom={0.3}
          maxZoom={2}
        >
          <Background color="#dcd5c7" gap={20} />
          <Controls className="!bg-white !border-[#dcd5c7] !rounded-lg" />
          <MiniMap nodeColor={(n) => (n.data?.color as string) || '#94a3b8'} className="!bg-[#f7f4ee] !border-[#dcd5c7] !rounded-lg" />

          {/* Legend */}
          <Panel position="top-left" className="bg-white/90 rounded-lg border border-[#dcd5c7] p-2 space-y-1">
            <p className="text-[8px] font-black text-[#49675e] uppercase">Edge Types</p>
            <div className="flex items-center gap-1.5 text-[8px] text-[#5d675f]">
              <div className="w-4 h-0.5 bg-[#94a3b8]" /> Thread
            </div>
            <div className="flex items-center gap-1.5 text-[8px] text-[#5d675f]">
              <div className="w-4 h-0.5 bg-[#1d9e75]" /> Causality
            </div>
            <div className="flex items-center gap-1.5 text-[8px] text-[#5d675f]">
              <div className="w-4 h-0.5 bg-[#3b82f6] border-dashed border-t" /> Syllabus
            </div>
          </Panel>

          {/* Selected node panel */}
          {selectedNode && (
            <Panel position="top-right" className="bg-white rounded-lg border border-[#dcd5c7] p-3 max-w-[200px]">
              <p className="text-[10px] font-black text-[#1d9e75] uppercase">{selectedNode.subject}</p>
              <p className="text-xs font-black text-[#13251d] mt-0.5">{selectedNode.label}</p>
              {selectedNode.publish_date && <p className="text-[9px] text-[#5d675f] mt-1">{selectedNode.publish_date}</p>}
              {selectedNode.is_completed && <p className="text-[9px] text-[#1d9e75] font-bold mt-1">✓ Completed</p>}
            </Panel>
          )}
        </ReactFlow>
      </div>
    </div>
  );
}

export default KnowledgeGraph;
