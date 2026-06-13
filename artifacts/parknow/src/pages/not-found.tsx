import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "@/hooks/use-i18n";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[calc(100vh-4rem)]">
      <div className="text-primary flex justify-center mb-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
      </div>
      <h1 className="text-3xl font-bold mb-2">{t("notFound.title")} (404)</h1>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">{t("notFound.subtitle")}</p>
      <Link href="/">
        <Button size="lg" data-testid="button-not-found-home">
          {t("notFound.goHome")}
        </Button>
      </Link>
    </div>
  );
}
