export interface Project {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  tags: string[];
  rank?: '🥇' | '🥈' | '🥉' | '🎖️';
  githubUrl?: string;
  demoUrl?: string;
}