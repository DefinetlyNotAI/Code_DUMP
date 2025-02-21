import { motion } from 'framer-motion';
import { Github, ExternalLink } from 'lucide-react';
import { Project } from '../types/project';
import { useInView } from 'react-intersection-observer';

interface ProjectCardProps {
  project: Project;
  index: number;
}

export function ProjectCard({ project, index }: ProjectCardProps) {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
      <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          whileHover={{
            scale: 1.03,
            rotate: 2,
            transition: { duration: 0.2 }
          }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="project-card"
      >
        <div className="pin" />
        <div className="project-card-inner rounded-lg shadow-lg overflow-hidden h-full">
          <div className="relative">
            <img
                src={project.imageUrl}
                alt={project.name}
                className="w-full h-48 object-cover"
                loading="lazy"
            />
            {project.rank && (
                <div
                    className="absolute top-4 right-4 text-2xl group cursor-help"
                    aria-label={`Rank: ${project.rank}`}
                >
                  <span>{project.rank}</span>
                  <div className="absolute right-0 mt-1 px-2 py-1 bg-black bg-opacity-75 text-white text-sm rounded-md
                            opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap
                            pointer-events-none transform translate-y-2 group-hover:translate-y-0">
                    {project.rank === '🥇' && 'First Place'}
                    {project.rank === '🥈' && 'Second Place'}
                    {project.rank === '🥉' && 'Third Place'}
                    {project.rank === '🎖️' && 'Honorable Mention'}
                  </div>
                </div>
            )}
          </div>

          <div className="p-6">
            <h3 className="text-xl font-bold mb-2 text-[#4c8a7c]">
              {project.name}
            </h3>
            <p className="text-black mb-4">
              {project.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {project.tags.map((tag) => (
                  <span
                      key={tag}
                      className="px-3 py-1 bg-[#4c8a7c]/10 text-[#4c8a7c] rounded-full text-sm"
                  >
                {tag}
              </span>
              ))}
            </div>

            <div className="flex gap-4">
              {project.githubUrl && (
                  <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#4c8a7c] hover:text-[#4c8a7c]/80
                         transition-colors duration-200"
                  >
                    <Github size={20} />
                    <span>Code</span>
                  </a>
              )}
              {project.demoUrl && (
                  <a
                      href={project.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#4c8a7c] hover:text-[#4c8a7c]/80
                         transition-colors duration-200"
                  >
                    <ExternalLink size={20} />
                    <span>Demo</span>
                  </a>
              )}
            </div>
          </div>
        </div>
      </motion.div>
  );
}