import Link from "next/link";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CsvExportButtonProps {
  href: string;
  label?: string;
}

export function CsvExportButton({
  href,
  label = "Export CSV",
}: CsvExportButtonProps) {
  return (
    <Button variant="outline" asChild>
      <Link href={href} prefetch={false}>
        <Download className="mr-2 h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
}
