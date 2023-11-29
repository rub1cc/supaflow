import { Database } from "./database.types";

export type Step = {
  id: string;
  type: "STEP";
  title: string;
  description?: string;
  screenshot?: {
    url: string;
  };
};

export type WorkflowItem = Step;

export type Workflow = Database["public"]["Tables"]["workflows"]["Row"] & {
  items: WorkflowItem[];
  meta?: {
    title: string;
    description: string;
    image: string;
  };
};
