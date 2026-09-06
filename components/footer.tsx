import Link from 'next/link';
import { Code2, Mail, MessageCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card/20">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Code2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold">
                masmasit<span className="text-primary">.online</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              {'IT Community, Talent & Agency Ecosystem for Indonesian practitioners.'}
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground/70">
              {'Komunitas IT, Talent & Agency untuk praktisi Indonesia.'}
            </p>
            <div className="mt-4 flex gap-3">
              <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <MessageCircle className="h-5 w-5" />
              </a>
              <a href="mailto:hello@masmasit.online" className="text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Community</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/directory" className="hover:text-primary transition-colors">Members</Link></li>
              <li><Link href="/jobs" className="hover:text-primary transition-colors">Jobs</Link></li>
              <li><Link href="/projects" className="hover:text-primary transition-colors">Projects</Link></li>
              <li><Link href="/courses" className="hover:text-primary transition-colors">LMS</Link></li>
              <li><Link href="/events" className="hover:text-primary transition-colors">Events</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Talent & Agency</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/talents" className="hover:text-primary transition-colors">Talents</Link></li>
              <li><Link href="/services" className="hover:text-primary transition-colors">Services</Link></li>
              <li><Link href="/case-studies" className="hover:text-primary transition-colors">Case Studies</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border/40 pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} masmasit.online — {`Built for Indonesian IT practitioners · Dibangun untuk praktisi IT Indonesia`}</p>
        </div>
      </div>
    </footer>
  );
}
