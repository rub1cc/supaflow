import { cn } from "@/utils/cn";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Container(props: ContainerProps) {
  return (
    <div className={cn("max-w-3xl mx-auto", props.className)}>
      {props.children}
    </div>
  );
}
