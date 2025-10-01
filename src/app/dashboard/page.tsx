'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AtlasLogo } from '@/components/ui/AtlasLogo';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Globe, Plus, Calendar, Map, Loader2, List } from 'lucide-react';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { SitemapBrowser } from '@/components/projects/SitemapBrowser';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Project {
  id: string;
  name: string;
  domain: string;
  sitemapUrl: string;
  urlCount: number;
  createdAt: any;
}

export default function DashboardPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch projects from Firestore
  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Project[];
      setProjects(projectsData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleProjectCreated = (projectId: string) => {
    // Navigate to canvas page with the new project
    router.push(`/canvas?project=${projectId}`);
  };
  return (
    <div className="min-h-screen bg-[#DDEEF9]">
      {/* Header */}
      <header className="border-b border-[#5B98D6]/20">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link href="/">
            <AtlasLogo size="md" className="text-[#1a1a1a]" />
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/canvas"
              className="text-xs text-[#1a1a1a]/70 transition-colors hover:text-[#1a1a1a]"
            >
              Canvas
            </Link>
            <Link href="/auth">
              <Button
                variant="outline"
                className="h-7 border-[#4863B0]/30 bg-transparent px-3 text-xs font-normal text-[#1a1a1a]/70 hover:bg-[#4863B0]/10 hover:text-[#1a1a1a]"
              >
                Sign Out
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-5xl tracking-tight text-[#1a1a1a]">
              Your Projects
            </h2>
            <p className="mt-1.5 text-sm text-[#1a1a1a]/60">
              Manage and explore your sitemap visualizations
            </p>
          </div>
          <Button
            className="h-8 bg-[#4863B0] px-4 text-xs text-white hover:bg-[#5B98D6]"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-[#4863B0]" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && projects.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#5B98D6]/30 py-16">
            <Globe className="mb-3 h-12 w-12 text-[#5B98D6]/40" />
            <h3 className="mb-1.5 text-lg font-medium text-[#1a1a1a]">
              No projects yet
            </h3>
            <p className="mb-5 text-sm text-[#1a1a1a]/60">
              Create your first project to get started
            </p>
            <Button
              className="h-8 bg-[#4863B0] px-4 text-xs text-white hover:bg-[#5B98D6]"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Create Project
            </Button>
          </div>
        )}

        {/* Projects grid */}
        {!isLoading && projects.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <Card 
                  className="border-[#5B98D6]/30 bg-white transition-all hover:border-[#4863B0] hover:shadow-lg hover:shadow-[#4863B0]/20"
                >
                <Link href={`/canvas?project=${project.id}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-[#1a1a1a]">
                      {project.name}
                    </CardTitle>
                    <CardDescription className="text-xs text-[#1a1a1a]/50">
                      {project.domain}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex items-center justify-between text-xs text-[#1a1a1a]/50">
                      <div className="flex items-center gap-1">
                        <Map className="h-3.5 w-3.5" />
                        {project.urlCount} pages
                      </div>
                      <div className="flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5" />
                        Sitemap
                      </div>
                    </div>
                  </CardContent>
                </Link>
                <div className="border-t border-[#5B98D6]/10 px-4 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedProject(project);
                      setIsBrowserOpen(true);
                    }}
                    className="h-7 w-full text-xs text-[#4863B0] hover:bg-[#5B98D6]/10 hover:text-[#4863B0]"
                  >
                    <List className="mr-1.5 h-3.5 w-3.5" />
                    Browse Sitemap
                  </Button>
                </div>
              </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />

      {/* Sitemap Browser */}
      {selectedProject && (
        <SitemapBrowser
          isOpen={isBrowserOpen}
          onClose={() => {
            setIsBrowserOpen(false);
            setSelectedProject(null);
          }}
          projectId={selectedProject.id}
          projectName={selectedProject.name}
        />
      )}
    </div>
  );
}
