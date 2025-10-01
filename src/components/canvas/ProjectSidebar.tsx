'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Map, Globe, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, query, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

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

  useEffect(() => {
    const fetchProjects = async () => {
      if (!isOpen || !db) return;

      try {
        const projectsRef = collection(db, 'projects');
        const q = query(projectsRef);
        const snapshot = await getDocs(q);

        const projectList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setProjects(projectList);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  const handleProjectClick = (projectId: string) => {
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

  return (
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
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-0 top-0 z-50 h-full w-80 border-r border-[#5B98D6]/20 bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#5B98D6]/20 px-4 py-3">
              <h2 className="text-sm font-medium text-[#1a1a1a]">Your Projects</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="text-[#1a1a1a]/40 hover:text-[#1a1a1a]"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>

            {/* Projects List */}
            <div className="overflow-y-auto p-3" style={{ height: 'calc(100% - 53px)' }}>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#4863B0] border-t-transparent" />
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.35,
                        delay: index * 0.06,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="relative"
                    >
                      <button
                        onClick={() => handleProjectClick(project.id)}
                        className={`group relative w-full overflow-hidden rounded-xl border p-3 text-left transition-all ${
                          currentProjectId === project.id
                            ? 'border-[#4863B0] bg-[#5B98D6]/10'
                            : 'border-[#5B98D6]/20 bg-white hover:border-[#4863B0]/40 hover:bg-[#5B98D6]/5'
                        }`}
                      >
                        <div className="mb-2 pr-8">
                          <h3 className="truncate text-sm font-medium text-[#1a1a1a]">
                            {project.name}
                          </h3>
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-[#1a1a1a]/50">
                            <Globe className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{project.domain}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-[#1a1a1a]/40">
                          <Map className="h-3 w-3" />
                          <span>{project.urlCount || 0}</span>
                          <span className="ml-1">•</span>
                          <span className="ml-1">Sitemap</span>
                        </div>

                        {/* More menu button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === project.id ? null : project.id);
                          }}
                          className="absolute right-2 top-2 rounded-lg p-1 text-[#1a1a1a]/40 opacity-0 transition-all hover:bg-[#5B98D6]/10 hover:text-[#4863B0] group-hover:opacity-100"
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
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
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
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

