import type {Metadata} from 'next';
import WorkspaceShell from './WorkspaceShell';

export const metadata: Metadata = {robots: {index: false, follow: false}, alternates: {canonical: null, languages: {}}};
export default function WorkspaceLayout({children}: {children: React.ReactNode}) {
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
