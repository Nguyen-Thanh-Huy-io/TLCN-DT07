export type StatementValueType = 'STRING' | 'NUMBER' | 'DATE' | 'JSON';
export type StatementRank = 'PREFERRED' | 'NORMAL' | 'DEPRECATED';
export type VerificationStatus = 'UNVERIFIED' | 'VERIFIED' | 'DISPUTED';

export interface StatementReferenceItem {
  id: string;
  referenceId: string;
  referenceTitle: string;
  referenceAuthor?: string | null;
  pageNumber?: string | null;
  chapter?: string | null;
  quote?: string | null;
  note?: string | null;
}

export interface HistoricalStatementItem {
  id: string;
  subjectEntityId?: string | null;
  subjectEntity?: {
    id: string;
    name: string;
    slug: string;
    type: string;
    imageUrl?: string | null;
  } | null;

  subjectEventId?: string | null;
  subjectEvent?: {
    id: string;
    title: string;
    slug: string;
    dateText?: string | null;
    startYear?: number | null;
    endYear?: number | null;
  } | null;

  predicateId: string;
  predicate: {
    id: string;
    code: string;
    label: string;
    inverseLabel?: string | null;
    description?: string | null;
  };

  objectEntityId?: string | null;
  objectEntity?: {
    id: string;
    name: string;
    slug: string;
    type: string;
    imageUrl?: string | null;
  } | null;

  objectEventId?: string | null;
  objectEvent?: {
    id: string;
    title: string;
    slug: string;
    dateText?: string | null;
    startYear?: number | null;
    endYear?: number | null;
  } | null;

  objectValue?: any | null;
  objectValueType?: StatementValueType | null;

  validFromYear?: number | null;
  validToYear?: number | null;

  displayOrder: number;
  isPrimary: boolean;
  qualifiers?: Record<string, any> | null;
  verificationStatus: VerificationStatus;
  rank: StatementRank;

  references?: StatementReferenceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateHistoricalStatementPayload {
  subjectEntityId?: string | null;
  subjectEventId?: string | null;
  predicateId: string;
  objectEntityId?: string | null;
  objectEventId?: string | null;
  objectValue?: any | null;
  objectValueType?: StatementValueType | null;
  validFromYear?: number | null;
  validToYear?: number | null;
  displayOrder?: number;
  isPrimary?: boolean;
  qualifiers?: Record<string, any>;
  verificationStatus?: VerificationStatus;
  rank?: StatementRank;
  references?: Array<{
    referenceId: string;
    pageNumber?: string;
    chapter?: string;
    quote?: string;
    note?: string;
  }>;
}

export interface GraphNodeItem {
  id: string;
  label: string;
  kind: 'ENTITY' | 'EVENT' | 'LITERAL';
  typeCode?: string;
  typeLabel?: string;
  avatarUrl?: string;
  startYear?: number | null;
  endYear?: number | null;
  dateText?: string | null;
  distance?: number;
}

export interface GraphEdgeItem {
  id: string;
  source: string;
  target: string;
  predicateId: string;
  predicateCode: string;
  predicateLabel: string;
  validFromYear?: number | null;
  validToYear?: number | null;
  isPrimary: boolean;
  qualifiers?: Record<string, any> | null;
}

export interface StatementGraphData {
  rootNodeId: string;
  depth: number;
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
  totalNodes: number;
  totalEdges: number;
}
