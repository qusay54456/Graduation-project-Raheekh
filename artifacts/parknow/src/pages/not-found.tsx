import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[calc(100vh-4rem)]">
      <div className="text-primary flex justify-center mb-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
      </div>
      <h1 className="text-3xl font-bold mb-2">الصفحة غير موجودة (404)</h1>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link href="/">
        <Button size="lg">العودة للرئيسية (Back to Home)</Button>
      </Link>
    </div>
  );
}
