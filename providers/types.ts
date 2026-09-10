import type {
  ArchitectureProvider,
  DeploymentProvider,
  Incident,
  IncidentId,
  ObservabilityProvider,
  RepositoryProvider,
  ServiceCatalogProvider,
  WorkItemProvider,
} from "@/types/org-brain";

export interface IncidentProvider {
  list(): Promise<Incident[]>;
  getById(id: IncidentId): Promise<Incident | null>;
}

export interface OrgBrainProviders {
  workItems: WorkItemProvider;
  repositories: RepositoryProvider;
  services: ServiceCatalogProvider;
  deployments: DeploymentProvider;
  incidents: IncidentProvider;
  observability: ObservabilityProvider;
  architecture: ArchitectureProvider;
}
