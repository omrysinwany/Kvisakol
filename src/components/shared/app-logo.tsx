import Image from 'next/image';
import Link from 'next/link';

export function AppLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex items-center hover:opacity-80 transition-opacity ${className}`}
    >
      <Image
        src="/images/products/kvisakol.ico"
        alt="לוגו כביסכל"
        width={160}
        height={160}
        className="w-40 h-40"
      />
    </Link>
  );
}
