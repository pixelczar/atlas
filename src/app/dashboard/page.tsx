import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AtlasLogo } from '@/components/ui/AtlasLogo';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Globe, Plus, Calendar, Map } from 'lucide-react';

const demoProjects = [
  {
    id: '1',
    name: 'Example.com Sitemap',
    url: 'https://example.com',
    createdAt: '2025-09-28',
    nodes: 15,
  },
  {
    id: '2',
    name: 'My Portfolio',
    url: 'https://myportfolio.dev',
    createdAt: '2025-09-25',
    nodes: 8,
  },
  {
    id: '3',
    name: 'E-commerce Site',
    url: 'https://shop.example.com',
    createdAt: '2025-09-20',
    nodes: 42,
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#DDEEF9]">
      {/* Header */}
      <header className="border-b border-[#5B98D6]/20">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-8">
          <Link href="/">
            <AtlasLogo size="lg" className="text-[#1a1a1a]" />
          </Link>
          <nav className="flex items-center gap-8">
            <Link
              href="/canvas"
              className="text-sm text-[#1a1a1a]/70 transition-colors hover:text-[#1a1a1a]"
            >
              Canvas
            </Link>
            <Link href="/auth">
              <Button
                variant="outline"
                className="border-[#4863B0]/30 bg-transparent text-sm font-normal text-[#1a1a1a]/70 hover:bg-[#4863B0]/10 hover:text-[#1a1a1a]"
              >
                Sign Out
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="mx-auto max-w-7xl px-8 py-16">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-5xl tracking-tight text-[#1a1a1a]">
              Your Projects
            </h2>
            <p className="mt-3 text-lg text-[#1a1a1a]/60">
              Manage and explore your sitemap visualizations
            </p>
          </div>
          <Button className="bg-[#4863B0] text-white px-6 hover:bg-[#5B98D6]">
            New Project
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {demoProjects.map((project) => (
            <Link key={project.id} href={`/canvas?project=${project.id}`}>
              <Card className="border-[#5B98D6]/30 bg-white transition-all hover:border-[#4863B0] hover:shadow-lg hover:shadow-[#4863B0]/20">
                <CardHeader>
                  <CardTitle className="text-xl text-[#1a1a1a]">
                    {project.name}
                  </CardTitle>
                  <CardDescription className="text-[#1a1a1a]/50">
                    {project.url}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-[#1a1a1a]/50">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {project.createdAt}
                    </div>
                    <div className="flex items-center gap-1">
                      {project.nodes} nodes
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
