
export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t">
      <div className="container flex flex-col items-center justify-center py-6 md:flex-row md:py-8">
        <p className="text-sm text-muted-foreground">
          &copy; {currentYear} Kvisakol Orders. כל הזכויות שמורות.
        </p>
      </div>
    </footer>
  );
}
