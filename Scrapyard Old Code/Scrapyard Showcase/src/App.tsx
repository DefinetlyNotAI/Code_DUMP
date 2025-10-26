import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ProjectGrid } from './components/ProjectGrid';
import { Project } from './types/project';
import projectsData from './data/projects.json';
import { Code2 } from 'lucide-react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Guide from './pages/Guide';


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
    <Router>
      <div className="min-h-screen">
        <img
          src="https://raw.githubusercontent.com/hackclub/scrapyard/refs/heads/main/public/elements/orpheus-flag.svg"
          alt="Orpheus Flag"
          className="orpheus-flag"
        />
        <img
          src="https://raw.githubusercontent.com/hackclub/scrapyard/refs/heads/main/public/elements/orpheus-doodle.svg"
          alt="Orpheus Doodle"
          className="orpheus-doodle"
        />

        <header className="bg-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-4"
            >
              <Code2 className="w-8 h-8 text-[#4c8a7c]" />
              <h1 className="text-3xl font-bold text-[#4c8a7c]">
                Project Showcase
              </h1>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-2 text-black"
            >
              All the stupid ideas in a stupid page🧏
            </motion.p>
            <nav>
              <ul className="flex gap-4">
                <li>
                  <Link to="/">Home</Link>
                </li>
                <li>
                  <Link to="/guide">Guide</Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Routes>
            <Route path="/" element={
              <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
              >
                <ProjectGrid projects={projects} />
              </motion.div>
            } />
            <Route path="/guide" element={<Guide />} />
          </Routes>
        </main>


        <footer className="bg-transparent border-t border-[#4c8a7c]/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-[#4c8a7c]">
              © {new Date().getFullYear()} Project Showcase. No rights reserved (FLOSS YEAH).
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
