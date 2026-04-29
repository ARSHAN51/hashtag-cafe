import { PageTransition } from "@/components/shared/page-transition";

export default function RootTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageTransition>{children}</PageTransition>;
}
