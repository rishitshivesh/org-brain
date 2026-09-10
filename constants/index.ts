import {
  BookOpenCheck,
  Cable,
  Code2,
  Computer,
  FlaskConical,
  Gauge,
  MessageSquare,
  OctagonAlertIcon,
  WorkflowIcon,
} from "lucide-react";

export const APP_ROUTES = {
  ask: "/",
  work: "/work",
  incidents: "/incidents",
  services: "/services",
  graph: "/graph",
  knowledge: "/knowledge",
  scenarioLab: "/scenario-lab",
  evaluations: "/evaluations",
  architecture: "/architecture",
} as const;

export const SIDEBAR_ITEMS = [
  {
    label: "Ask",
    href: APP_ROUTES.ask,
    icon: MessageSquare,
  },
  {
    label: "Work",
    href: APP_ROUTES.work,
    icon: WorkflowIcon,
  },
  {
    label: "Incidents",
    href: APP_ROUTES.incidents,
    icon: OctagonAlertIcon,
  },
  {
    label: "Services",
    href: APP_ROUTES.services,
    icon: Computer,
  },
  {
    label: "Graph",
    href: APP_ROUTES.graph,
    icon: Cable,
  },
  {
    label: "Knowledge",
    href: APP_ROUTES.knowledge,
    icon: BookOpenCheck,
  },
  {
    label: "Scenario Lab",
    href: APP_ROUTES.scenarioLab,
    icon: FlaskConical,
  },
  {
    label: "Evaluations",
    href: APP_ROUTES.evaluations,
    icon: Gauge,
  },
  {
    label: "Architecture",
    href: APP_ROUTES.architecture,
    icon: Code2,
  },
];
