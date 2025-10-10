'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Map, Globe, MoreVertical, Trash2, Edit2, Sparkles, FileText, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, query, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { formatDistanceToNow } from 'date-fns';

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentProjectId?: string;
}

export function ProjectSidebar({ isOpen, onClose, currentProjectId }: ProjectSidebarProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchProjects = async () => {
    if (!db) return;

    try {
      setIsLoading(true);
      const projectsRef = collection(db, 'projects');
      const q = query(projectsRef);
      const snapshot = await getDocs(q);

      const projectList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];

      // Sort by most recently accessed (or created if never accessed)
      projectList.sort((a: any, b: any) => {
        const aTime = a.lastAccessed?.seconds || a.createdAt?.seconds || 0;
        const bTime = b.lastAccessed?.seconds || b.createdAt?.seconds || 0;
        return bTime - aTime;
      });

      setProjects(projectList);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  const handleProjectClick = async (projectId: string) => {
    // Update lastAccessed timestamp
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        lastAccessed: new Date(),
      });
      
      // Refresh the list to show updated sort order
      await fetchProjects();
    } catch (error) {
      console.error('Error updating lastAccessed:', error);
    }
    
    router.push(`/canvas?project=${projectId}`);
    onClose();
  };

  const handleDelete = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await deleteDoc(doc(db, 'projects', projectId));
      setProjects(projects.filter(p => p.id !== projectId));
      
      if (currentProjectId === projectId) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project');
    }
  };

  const handleEdit = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement edit modal
    alert('Edit functionality coming soon!');
  };

  const handleProjectCreated = (projectId: string) => {
    router.push(`/canvas?project=${projectId}`);
    onClose();
  };

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -385 }}
            animate={{ 
              opacity: 1, 
              x: 0,
              transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
            }}
            exit={{ 
              opacity: 0, 
              x: -385,
              transition: { duration: 0.16, ease: [0.4, 0, 1, 1] }
            }}
            className="fixed left-0 top-0 z-50 h-full w-96 border-r border-[#5B98D6] bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#5B98D6]/20 px-4 py-3">
              <h2 className="text-sm font-medium text-[#1a1a1a]">Your Projects</h2>
              <button
                onClick={onClose}
                className="text-[#1a1a1a]/40 transition-colors hover:text-[#1a1a1a]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* New Project Button */}
            <div className="p-3">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#5B98D6]/20 bg-[#4863B0] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#5B98D6]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                New Project
              </button>
            </div>

            {/* Projects List */}
            <div className="overflow-y-auto p-3" style={{ height: 'calc(100% - 118px)' }}>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#4863B0]/50 border-t-transparent" />
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.16,
                        delay: index * 0.06,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="relative"
                    >
                      <button
                        onClick={() => handleProjectClick(project.id)}
                        className={`group relative w-full cursor-pointer overflow-hidden rounded-lg border p-3 text-left transition-all ${
                          currentProjectId === project.id
                            ? 'border-[#4863B0] bg-[#5B98D6]/10'
                            : 'border-[#5B98D6]/20 bg-white hover:border-[#4863B0]/40 hover:bg-[#5B98D6]/5'
                        }`}
                      >
                        <div className="mb-2 flex items-start gap-2.5 pr-8">
                          {/* Favicon */}
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-[#5B98D6]/20 bg-white overflow-hidden">
                            <img 
                              src={`https://www.google.com/s2/favicons?domain=${project.domain}&sz=64`}
                              alt={project.domain}
                              className="h-5 w-5 object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent && !parent.querySelector('svg')) {
                                  const icon = document.createElement('div');
                                  icon.innerHTML = '<svg class="h-4 w-4 text-[#4863B0]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke-width="2"/></svg>';
                                  const firstChild = icon.firstChild as Node;
                                  if (firstChild) parent.appendChild(firstChild);
                                }
                              }}
                            />
                          </div>

                          {/* Project Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="truncate text-sm font-medium text-[#1a1a1a]">
                              {project.name}
                            </h3>
                            <div className="mt-0.5 flex items-center gap-1 text-xs text-[#1a1a1a]/50">
                              <Globe className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{project.domain}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs text-[#1a1a1a]/50">
                            <div 
                              className="flex items-center gap-1 cursor-help" 
                              title={`${project.urlCount || 0} pages in total`}
                            >
                              <Map className="h-3 w-3" />
                              <span className="font-medium text-[#4863B0]">{project.urlCount || 0}</span>
                              <span>pages</span>
                            </div>
                            <span>•</span>
                            <div 
                              className="flex items-center gap-1 cursor-help" 
                              title={`${project.sitemaps?.length || 1} sitemap file${(project.sitemaps?.length || 1) !== 1 ? 's' : ''} found`}
                            >
                              <FileText className="h-3 w-3" />
                              <span className="font-medium text-[#4863B0]">{project.sitemaps?.length || 1}</span>
                              <span>{(project.sitemaps?.length || 1) === 1 ? 'sitemap' : 'sitemaps'}</span>
                            </div>
                          </div>
                          {project.createdAt && (
                            <div 
                              className="flex items-center gap-1 text-xs text-[#1a1a1a]/40 cursor-help"
                              title={new Date(project.createdAt.seconds * 1000).toLocaleString()}
                            >
                              <Clock className="h-3 w-3" />
                              <span>
                                {formatDistanceToNow(new Date(project.createdAt.seconds * 1000), { addSuffix: true })}
                              </span>
                            </div>
                          )}
                        </div>
                      </button>

                      {/* More menu button - outside main button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === project.id ? null : project.id);
                        }}
                        className="absolute right-2 top-2 rounded-lg p-1 text-[#1a1a1a]/40 transition-colors hover:bg-[#5B98D6]/10 hover:text-[#4863B0]"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>

                        {/* Dropdown menu */}
                        <AnimatePresence>
                          {openMenuId === project.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(null);
                                }}
                              />
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-2 top-10 z-20 w-32 overflow-hidden rounded-lg border border-[#5B98D6]/20 bg-white shadow-xl"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={(e) => handleEdit(project.id, e)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#1a1a1a] transition-colors hover:bg-[#5B98D6]/10"
                                >
                                  <Edit2 className="h-3 w-3" />
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => handleDelete(project.id, e)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-600 transition-colors hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Delete
                                </button>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    <CreateProjectModal
      isOpen={isCreateModalOpen}
      onClose={() => setIsCreateModalOpen(false)}
      onProjectCreated={handleProjectCreated}
    />
    </>
  );
}

