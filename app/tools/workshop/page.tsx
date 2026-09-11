import type { Metadata } from "next";
import WorkshopTool from "@/components/workshop/WorkshopTool";

export const metadata: Metadata = {
  title: "Process Workshop",
  robots: "noindex, nofollow",
};

export default function WorkshopPage() {
  return <WorkshopTool />;
}
