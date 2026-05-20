'use client';
import { type ReactNode } from 'react';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">IB</span>
          </div>
          <h1 className="text-2xl font-bold">IsDB-BISEW Connect</h1>
          <p className="text-muted-foreground text-sm mt-1">Scholarship Community Platform</p>
        </div>
        {children}
      </div>
    </div>
  );
}
