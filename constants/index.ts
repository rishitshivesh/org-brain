import {
  Computer,
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
    icon: MessageSquare,
  },
  {
    label: "Knowledge",
    href: APP_ROUTES.knowledge,
    icon: MessageSquare,
  },
  {
    label: "Scenario Lab",
    href: APP_ROUTES.scenarioLab,
    icon: MessageSquare,
  },
];
