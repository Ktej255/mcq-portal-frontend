import { apiClient } from './client';

export interface TraceBase {
  trace_id: string;
  parent_trace_id: string | null;
  module_name: string;
  function_name: string;
  status: string;
  duration_ms: number | null;
  created_at: string;
}

export interface TraceDetail extends TraceBase {
  user_id: number | null;
  attempt_id: number | null;
  input_payload: any | null;
  output_payload: any | null;
  error_message: string | null;
  provider_metadata: any | null;
}

export interface TraceTreeNode extends TraceDetail {
  children: TraceTreeNode[];
}

export interface JobExecution {
  id: number;
  job_name: string;
  job_type: string;
  reference_id: string | null;
  status: string;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  retries: number;
  error_payload: any | null;
  metadata_payload: any | null;
}

export interface OperationalMetric {
  id: number;
  metric_type: string;
  value: number;
  metadata_json: any | null;
  timestamp: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  ownership?: string;
  risk?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface MutationRecord {
  id: string;
  timestamp: string;
  agent: string;
  files: string[];
  justification: string;
  risk: string;
  blast_radius: string;
  status: string;
}

export const observabilityService = {
  listTraces: async (limit = 50, offset = 0, module?: string, status?: string) => {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    if (module) params.append('module', module);
    if (status) params.append('status', status);
    
    return apiClient.get<{ traces: TraceDetail[], total: number }>(`/observability/traces?${params.toString()}`);
  },

  getTraceTree: async (traceId: string) => {
    return apiClient.get<TraceTreeNode>(`/observability/traces/${traceId}/tree`);
  },

  getTraceDetail: async (traceId: string) => {
    return apiClient.get<TraceDetail>(`/observability/traces/${traceId}`);
  },
  
  listJobs: async (limit = 50, offset = 0, status?: string) => {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    if (status) params.append('status', status);
    return apiClient.get<{ jobs: JobExecution[], total: number }>(`/observability/jobs?${params.toString()}`);
  },

  listMetrics: async (limit = 100, metricType?: string) => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (metricType) params.append('metric_type', metricType);
    return apiClient.get<{ metrics: OperationalMetric[], total: number }>(`/observability/metrics?${params.toString()}`);
  },

  getMetrics: async (): Promise<OperationalMetric[]> => {
    const response = await apiClient.get('observability/metrics');
    return response.data?.metrics ?? [];
  },

  recordMetricsSnapshot: async (): Promise<void> => {
    await apiClient.post('observability/metrics/snapshot');
  },

  getDependencyGraph: async () => {
    return apiClient.get<DependencyGraph>('/observability/governance/graph');
  },

  getMutationTimeline: async () => {
    return apiClient.get<{ mutations: MutationRecord[] }>('/observability/governance/timeline');
  },
};
