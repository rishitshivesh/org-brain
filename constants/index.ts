import {
  Activity,
  BookOpenCheck,
  Brain,
  Cable,
  Code2,
  Computer,
  FlaskConical,
  Gauge,
  GitFork,
  MessageSquare,
  OctagonAlertIcon,
  Send,
  WorkflowIcon,
} from "lucide-react";

export const APP_ROUTES = {
  ask: "/",
  work: "/work",
  incidents: "/incidents",
  services: "/services",
  flows: "/flows",
  graph: "/graph",
  knowledge: "/knowledge",
  scenarioLab: "/scenario-lab",
  history: "/history",
  handoffs: "/handoffs",
  evaluations: "/evaluations",
  architecture: "/architecture",
  runtime: "/runtime",
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
    label: "Flows",
    href: APP_ROUTES.flows,
    icon: GitFork,
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
    label: "History",
    href: APP_ROUTES.history,
    icon: Brain,
  },
  {
    label: "Handoffs",
    href: APP_ROUTES.handoffs,
    icon: Send,
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
  {
    label: "Runtime",
    href: APP_ROUTES.runtime,
    icon: Activity,
  },
];
