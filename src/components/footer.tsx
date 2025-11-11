
"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="container mx-auto max-w-5xl px-4 py-6 flex justify-between items-center text-sm text-muted-foreground">
      <span>Built with Next.js and ShadCN UI.</span>
      <div className="flex items-center gap-4">
        <Link href="/pricing" className="underline hover:text-primary">
          Pricing
        </Link>
        <Link href="/admin/messages" className="underline hover:text-primary">
          View Messages
        </Link>
        <Link href="/nano-and-display" className="underline hover:text-primary">
          Transform
        </Link>
        <Link href="/contact" className="underline hover:text-primary">
          Contact Us
        </Link>
      </div>
    </footer>
  );
}
