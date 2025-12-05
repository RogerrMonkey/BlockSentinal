// Type definitions matching backend Pydantic schemas

export enum ScanStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum Severity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum FindingSource {
  SLITHER = "slither",
  ML = "ml",
  HYBRID = "hybrid",
}

export interface ScanCreate {
  source_type: "upload" | "address";
  contract_address?: string;
  network: "mainnet" | "sepolia";
  source_code?: string;
}

export interface ScanSummary {
  total_findings: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface ScanResponse {
  scan_id: string;
  status: ScanStatus;
  current_stage?: string;  // init, slither, mythril, ai, report
  contract_address?: string;
  created_at: string;
  completed_at?: string;
  summary?: ScanSummary;
  report_url?: string;
  error_message?: string;
}

export interface ScanListItem {
  scan_id: string;
  status: ScanStatus;
  contract_address?: string;
  created_at: string;
  findings_count: number;
}

export interface ScanListResponse {
  scans: ScanListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface Finding {
  id: string;
  scan_id: string;
  vulnerability_type: string;
  severity: Severity;
  confidence: number;
  line_number?: number;
  code_snippet?: string;
  description: string;
  remediation?: string;
  source: FindingSource;
}

export interface ReportResponse {
  scan_id: string;
  contract_address?: string;
  status: ScanStatus;
  created_at: string;
  completed_at?: string;
  summary: ScanSummary;
  findings: Finding[];
}

export interface ApiError {
  detail: string;
}
