import { WashingMachine } from 'lucide-react';
import Link from 'next/link';

export function AppLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 text-xl font-bold text-primary hover:opacity-80 transition-opacity ${className}`}>
      <WashingMachine className="h-7 w-7" />
      <span>כביסכל הזמנות</span>
    </Link>
  );
}
