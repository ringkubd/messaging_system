'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/_stores/auth-store';
import { AuthLayout } from '@/_layouts/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', round: '', batch: '', course: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ ...form, round: form.round || null, batch: form.batch || null, course: form.course || null });
      toast.success('Account created!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Anwar Hossain" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Min. 8 characters" required />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label>Round</Label>
            <Input value={form.round} onChange={e => setForm(p => ({ ...p, round: e.target.value }))} placeholder="e.g. 2024" />
          </div>
          <div className="space-y-2">
            <Label>Batch</Label>
            <Input value={form.batch} onChange={e => setForm(p => ({ ...p, batch: e.target.value }))} placeholder="e.g. 4" />
          </div>
          <div className="space-y-2">
            <Label>Course</Label>
            <Input value={form.course} onChange={e => setForm(p => ({ ...p, course: e.target.value }))} placeholder="e.g. Web" />
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <a href="/auth/login" className="text-emerald-600 hover:underline font-medium">Sign In</a>
        </p>
      </form>
    </AuthLayout>
  );
}
