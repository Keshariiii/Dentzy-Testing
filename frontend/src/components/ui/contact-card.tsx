import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, PlusIcon } from 'lucide-react';

export type ContactInfoItem = {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
  className?: string;
};

export type ContactCardProps = React.ComponentProps<'div'> & {
  title?: string;
  description?: string;
  contactInfo?: ContactInfoItem[];
  formSectionClassName?: string;
};

export function ContactCard({
  title = 'Get in touch',
  description = 'If you have any questions regarding our laboratory services or need support, please fill out the form. We respond within 1 business day.',
  contactInfo,
  className,
  formSectionClassName,
  children,
  ...props
}: ContactCardProps) {
  return (
    <div className="relative p-3.5 w-full max-w-5xl mx-auto overflow-visible">
      <div
        className={cn(
          'bg-surface border border-primary/25 relative grid h-full w-full rounded-2xl shadow-sm md:grid-cols-2 lg:grid-cols-3',
          className
        )}
        {...props}
      >
        <PlusIcon className="absolute -top-3 -left-3 h-6 w-6 text-primary pointer-events-none" aria-hidden="true" />
        <PlusIcon className="absolute -top-3 -right-3 h-6 w-6 text-primary pointer-events-none" aria-hidden="true" />
        <PlusIcon className="absolute -bottom-3 -left-3 h-6 w-6 text-primary pointer-events-none" aria-hidden="true" />
        <PlusIcon className="absolute -right-3 -bottom-3 h-6 w-6 text-primary pointer-events-none" aria-hidden="true" />

        <div className="flex flex-col justify-between p-6 sm:p-8 md:p-10 lg:col-span-2">
          <div className="relative space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-charcoal">
              {title}
            </h2>
            <p className="text-charcoal/70 max-w-xl text-sm sm:text-base leading-relaxed">
              {description}
            </p>
            <div className="grid gap-3 pt-4 sm:grid-cols-2">
              {contactInfo?.map((info, index) => (
                <ContactInfo key={index} {...info} />
              ))}
            </div>
          </div>
        </div>

        <div
          className={cn(
            'bg-surface-alt flex h-full w-full items-center border-t border-primary/15 p-6 sm:p-8 md:col-span-1 md:border-t-0 md:border-l rounded-b-2xl md:rounded-b-none md:rounded-r-2xl',
            formSectionClassName
          )}
        >
          <div className="w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}

function ContactInfo({
  icon: Icon,
  label,
  value,
  href,
  className,
}: ContactInfoItem) {
  const content = (
    <div
      className={cn(
        'flex items-center gap-3.5 p-3 rounded-xl bg-surface border border-primary/15 transition-all hover:border-primary/40 hover:shadow-xs',
        className
      )}
    >
      <div className="bg-primary/10 text-primary-accent rounded-lg p-2.5 shrink-0 flex items-center justify-center">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-[11px] text-charcoal/60 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-charcoal truncate">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        className="text-inherit no-underline block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noreferrer' : undefined}
      >
        {content}
      </a>
    );
  }

  return content;
}
