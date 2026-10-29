import type {
  AREAS,
  STATUSES,
  PRIORITIES,
  FREQUENCIES,
  RESULTS,
} from "../config/project";
export type Area = (typeof AREAS)[number];
export type Status = (typeof STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type Frequency = (typeof FREQUENCIES)[number];
export type Result = (typeof RESULTS)[number];
export interface Assessment {
  people: number;
  environment: number;
  worsening: number;
}
export interface History {
  id: string;
  date: string;
  text: string;
}
export interface Demand {
  id: string;
  protocol: string;
  title: string;
  area: Area;
  location: string;
  description: string;
  origin: string;
  registeredAt: string;
  assessment: Assessment | null;
  override: Priority | null;
  justification: string;
  responsible: string;
  status: Status;
  deadline: string;
  nextAction: string;
  notes: History[];
  completedAt: string;
  resolution: string;
  history: History[];
  sourceInspectionId: string | null;
  sourceRoutineId: string | null;
}
export interface Routine {
  id: string;
  name: string;
  location: string;
  area: Area;
  frequency: Frequency;
  nextDate: string;
  responsible: string;
  checklist: string[];
  anchorDay: number;
}
export interface Inspection {
  id: string;
  routineId: string;
  date: string;
  notes: string;
  items: { label: string; result: Result }[];
}
export interface AppData {
  formatVersion: 1;
  seededAt: string;
  demands: Demand[];
  routines: Routine[];
  inspections: Inspection[];
}
export interface Snapshot {
  data: AppData;
  revision: number;
}
export interface Filters {
  q: string;
  area: string;
  status: string;
  responsible: string;
  priority: string;
  overdue: string;
  from: string;
  to: string;
  sort: string;
  dateKind: string;
}
export const emptyFilters: Filters = {
  q: "",
  area: "",
  status: "",
  responsible: "",
  priority: "",
  overdue: "",
  from: "",
  to: "",
  sort: "priority",
  dateKind: "registered",
};
