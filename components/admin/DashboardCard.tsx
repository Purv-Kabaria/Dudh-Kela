'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  index?: number;
}

export function DashboardCard({
  title,
  value,
  icon: Icon,
  trend,
  className,
  index = 0,
}: DashboardCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    
    gsap.fromTo(card, 
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        delay: index * 0.1,
        ease: 'power3.out',
      }
    );
  }, [index]);

  return (
    <Card
      ref={cardRef}
      className={cn(
        "p-4 sm:p-6 opacity-0 bg-white dark:bg-black border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-black/60 dark:text-white/60">{title}</p>
          <h3 className="text-2xl font-bold tracking-tight text-black dark:text-white">{value}</h3>
          {trend && (
            <p className="text-sm flex items-center gap-1 font-medium text-black dark:text-white">
              {trend.isPositive ? "↑" : "↓"} {trend.value}%
            </p>
          )}
        </div>
        <div className="h-10 w-10 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-black dark:text-white" />
        </div>
      </div>
    </Card>
  );
} 