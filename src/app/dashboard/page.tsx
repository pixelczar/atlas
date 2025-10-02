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
import { Globe, Plus, Calendar, Map, Loader2, List, FileText, Clock } from 'lucide-react';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { SitemapBrowser } from '@/components/projects/SitemapBrowser';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatDistanceToNow } from 'date-fns';

interface Project {
  id: string;
  name: string;
  domain: string;
  sitemapUrl: string;
  urlCount: number;
  sitemaps?: string[];
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
    const q = query(collection(db, 'projects'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Project[];
      
      // Sort by most recently accessed (or created if never accessed)
      projectsData.sort((a, b) => {
        const aTime = (a as any).lastAccessed?.seconds || a.createdAt?.seconds || 0;
        const bTime = (b as any).lastAccessed?.seconds || b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
      
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
                <Link 
                  href={`/canvas?project=${project.id}`}
                  onClick={async () => {
                    // Update lastAccessed timestamp
                    try {
                      const projectRef = doc(db, 'projects', project.id);
                      await updateDoc(projectRef, {
                        lastAccessed: new Date(),
                      });
                    } catch (error) {
                      console.error('Error updating lastAccessed:', error);
                    }
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="mb-3 flex items-start gap-3">
                      {/* Favicon */}
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-[#5B98D6]/20 bg-white overflow-hidden">
                        <img 
                          src={`https://www.google.com/s2/favicons?domain=${project.domain}&sz=64`}
                          alt={project.domain}
                          className="h-6 w-6 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              const icon = document.createElement('div');
                              icon.innerHTML = '<svg class="h-5 w-5 text-[#4863B0]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke-width="2"/></svg>';
                              parent.appendChild(icon.firstChild!);
                            }
                          }}
                        />
                      </div>

                      {/* Project Info */}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg text-[#1a1a1a] truncate">
                          {project.name}
                        </CardTitle>
                        <CardDescription className="text-xs text-[#1a1a1a]/50 truncate">
                          {project.domain}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3 space-y-2">
                    <div className="flex items-center gap-3 text-xs text-[#1a1a1a]/50">
                      <div 
                        className="flex items-center gap-1 cursor-help"
                        title={`${project.urlCount} pages in total`}
                      >
                        <Map className="h-3.5 w-3.5" />
                        <span className="font-medium text-[#4863B0]">{project.urlCount}</span> pages
                      </div>
                      <div className="h-3 w-px bg-[#5B98D6]/20" />
                      <div 
                        className="flex items-center gap-1 cursor-help"
                        title={`${project.sitemaps?.length || 1} sitemap file${(project.sitemaps?.length || 1) !== 1 ? 's' : ''} found`}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span className="font-medium text-[#4863B0]">{project.sitemaps?.length || 1}</span> {(project.sitemaps?.length || 1) === 1 ? 'sitemap' : 'sitemaps'}
                      </div>
                    </div>
                    {project.createdAt && (
                      <div 
                        className="flex items-center gap-1 text-xs text-[#1a1a1a]/40 cursor-help"
                        title={new Date(project.createdAt.seconds * 1000).toLocaleString()}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          Created {formatDistanceToNow(new Date(project.createdAt.seconds * 1000), { addSuffix: true })}
                        </span>
                      </div>
                    )}
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

