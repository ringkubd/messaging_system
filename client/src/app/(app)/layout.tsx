import { AppLayout } from '@/_layouts/app-layout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
