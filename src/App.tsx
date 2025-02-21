import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ProjectGrid } from './components/ProjectGrid.tsx';
import { Project } from './types/project.ts';
import projectsData from './data/projects.json';
import { Code2 } from 'lucide-react';

const rankOrder = {
  '🥇': 1,
  '🥈': 2,
  '🥉': 3,
  '🎖️': 4,
};

function App() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    // Sort projects by rank, unranked projects go last
    const sortedProjects = [...projectsData.projects].sort((a, b) => {
      if (!a.rank && !b.rank) return 0;
      if (!a.rank) return 1;
      if (!b.rank) return -1;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      return rankOrder[a.rank] - rankOrder[b.rank];
    });
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    setProjects(sortedProjects);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-4"
          >
            <Code2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Project Showcase
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-2 text-gray-600 dark:text-gray-300"
          >
            Exploring innovation through code and design
          </motion.p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <ProjectGrid projects={projects} />
        </motion.div>
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600 dark:text-gray-300">
            © {new Date().getFullYear()} Project Showcase. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;