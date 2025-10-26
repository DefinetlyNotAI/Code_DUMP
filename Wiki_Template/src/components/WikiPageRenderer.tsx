import React, { useState } from 'react';
import { WikiPage } from '../types/WikiTypes';
import { getRelatedPages } from '../utils/pageUtils';
import WikiMarkdown from './WikiMarkdown';
import TagList from './TagList';
import ImageGallery from './ImageGallery';
import LinkSection from './LinkSection';
import StatusBadge from './StatusBadge';
import RatingDisplay from './RatingDisplay';

interface WikiPageRendererProps {
  page: WikiPage;
  category: string;
}

const WikiPageRenderer: React.FC<WikiPageRendererProps> = ({ page, category }) => {
  const [relatedPages, setRelatedPages] = React.useState<Record<string, WikiPage[]>>({});
  const [selectedDifficultyLevel, setSelectedDifficultyLevel] = useState<number | null>(null);
  const [selectedAscensionLevel, setSelectedAscensionLevel] = useState<number | null>(null);
  const [showRelated, setShowRelated] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  React.useEffect(() => {
    const loadRelatedPages = async () => {
      const related = await getRelatedPages(page);
      setRelatedPages(related);
    };

    loadRelatedPages();
  }, [page]);

  // Get available ascension levels for characters
  const ascensionLevels = (category === 'characters' || category === 'enemies') && 'ascension' in page && page.ascension
    ? Object.keys(page.ascension.levels).map(Number).sort((a, b) => a - b)
    : [];

  // Get available difficulty levels for enemies
  const difficultyLevels = category === 'enemies' && 'difficulty' in page && page.difficulty
    ? Object.keys(page.difficulty.levels).map(Number).sort((a, b) => a - b)
    : [];

  // Get rarity color class
  const getRarityColorClass = (rating?: number) => {
    switch (rating) {
      case 5: return 'text-yellow-400'; // Legendary
      case 4: return 'text-purple-400'; // Epic
      case 3: return 'text-blue-400';   // Rare
      case 2: return 'text-green-400';  // Uncommon
      case 1: return 'text-gray-400';   // Common
      default: return 'text-white';
    }
  };

  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            {page.icon && (
              <span className="text-2xl mr-2">{page.icon}</span>
            )}
            <h1 className={`text-3xl font-bold ${getRarityColorClass(page.rating)}`}>{page.title}</h1>
          </div>
          {page.rating && (
            <RatingDisplay rating={page.rating} />
          )}
        </div>
        
        {page.tags && page.tags.length > 0 && (
          <TagList tags={page.tags} />
        )}
        
        {page.meta?.status === 'wip' && (
          <div className="mt-2">
            <StatusBadge status="wip" />
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="p-6">
        {/* Text sections */}
        {Object.entries(page.text).map(([heading, content]) => (
          <section key={heading} className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
              {heading}
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              {page.md ? (
                <WikiMarkdown content={content} />
              ) : (
                <p>{content}</p>
              )}
            </div>
          </section>
        ))}

        {/* Enemy Difficulty Levels */}
        {category === 'enemies' && difficultyLevels.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
              Difficulty Levels
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {difficultyLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedDifficultyLevel(level)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedDifficultyLevel === level
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Level {level}
                </button>
              ))}
            </div>

            {selectedDifficultyLevel && 'difficulty' in page && page.difficulty?.levels[selectedDifficultyLevel] && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="text-lg font-medium mb-2">Stats</div>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(page.difficulty.levels[selectedDifficultyLevel].stats).map(([stat, value]) => (
                        <div key={stat} className="flex justify-between">
                          <span className="capitalize">{stat.replace('_', ' ')}</span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="text-lg font-medium mb-2">Drops</div>
                    <ul className="space-y-2">
                      {page.difficulty.levels[selectedDifficultyLevel].drops.map((drop, index) => (
                        <li key={index} className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">{drop.item}</span>
                            {drop.quantity && (
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {' '}({drop.quantity.min}-{drop.quantity.max})
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {(drop.chance * 100).toFixed(1)}%
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {page.difficulty.levels[selectedDifficultyLevel].abilities && (
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="text-lg font-medium mb-2">Abilities</div>
                    <div className="flex flex-wrap gap-2">
                      {page.difficulty.levels[selectedDifficultyLevel].abilities?.map((ability, index) => (
                        <a
                          key={index}
                          href={`/abilities/${ability.toLowerCase().replace(/\s+/g, '_')}`}
                          className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                        >
                          {ability}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Character/Enemy Ascension */}
        {(category === 'characters' || category === 'enemies') && ascensionLevels.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
              Ascension Levels
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {ascensionLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedAscensionLevel(level)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedAscensionLevel === level
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Level {level}
                </button>
              ))}
            </div>

            {selectedAscensionLevel && 'ascension' in page && page.ascension?.levels[selectedAscensionLevel] && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="text-lg font-medium mb-2">Requirements</div>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        Level {selectedAscensionLevel}
                      </div>
                      {page.ascension.levels[selectedAscensionLevel].experience && (
                        <div className="text-gray-600 dark:text-gray-400">
                          {page.ascension.levels[selectedAscensionLevel].experience?.toLocaleString()} XP
                        </div>
                      )}
                      {page.ascension.levels[selectedAscensionLevel].gold && (
                        <div className="text-yellow-600 dark:text-yellow-400">
                          {page.ascension.levels[selectedAscensionLevel].gold?.toLocaleString()} Gold
                        </div>
                      )}
                    </div>
                  </div>

                  {page.ascension.levels[selectedAscensionLevel].stats && (
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="text-lg font-medium mb-2">Stats</div>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(page.ascension.levels[selectedAscensionLevel].stats || {}).map(([stat, value]) => (
                          <div key={stat} className="flex justify-between">
                            <span className="capitalize">{stat}</span>
                            <span className="font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {page.ascension.levels[selectedAscensionLevel].items && (
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="text-lg font-medium mb-2">Required Items</div>
                    <ul className="space-y-2">
                      {page.ascension.levels[selectedAscensionLevel].items?.map((item, index) => (
                        <li key={index} className="flex justify-between">
                          <span>{item.name}</span>
                          <span className="font-medium">×{item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {page.ascension.levels[selectedAscensionLevel].abilities && (
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="text-lg font-medium mb-2">Unlocked Abilities</div>
                    <div className="flex flex-wrap gap-2">
                      {page.ascension.levels[selectedAscensionLevel].abilities?.map((ability, index) => (
                        <a
                          key={index}
                          href={`/abilities/${ability.toLowerCase().replace(/\s+/g, '_')}`}
                          className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                        >
                          {ability}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Enemy Stats */}
        {category === 'enemies' && 'stats' in page && (
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
              Base Stats
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(page.stats).map(([stat, value]) => (
                <div key={stat} className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{stat}</div>
                  <div className="text-xl font-medium">{value}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Enemy Drops */}
        {category === 'enemies' && 'drops' in page && page.drops && (
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
              Base Drops
            </h2>
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <ul className="space-y-3">
                {page.drops.map((drop, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{drop.item}</span>
                      {drop.quantity && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {' '}({drop.quantity.min}-{drop.quantity.max})
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {(drop.chance * 100).toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Images */}
        {page.images && page.images.length > 0 && (
          <section className="mb-8">
            <button
              onClick={() => setShowGallery(!showGallery)}
              className="w-full text-left"
            >
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center">
                <span>Gallery</span>
                <span className="ml-2 text-sm text-gray-500">
                  {showGallery ? '(Click to hide)' : '(Click to show)'}
                </span>
              </h2>
            </button>
            {showGallery && <ImageGallery images={page.images} />}
          </section>
        )}

        {/* Links */}
        {Object.entries(relatedPages).length > 0 && (
          <section className="mb-8">
            <button
              onClick={() => setShowRelated(!showRelated)}
              className="w-full text-left"
            >
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center">
                <span>Related Content</span>
                <span className="ml-2 text-sm text-gray-500">
                  {showRelated ? '(Click to hide)' : '(Click to show)'}
                </span>
              </h2>
            </button>
            {showRelated && Object.entries(relatedPages).map(([type, pages]) => (
              <LinkSection key={type} type={type} pages={pages} />
            ))}
          </section>
        )}

        {/* Metadata */}
        {page.meta && (
          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
            {page.meta.created && (
              <p>Created: {new Date(page.meta.created).toLocaleDateString()}</p>
            )}
            {page.meta.updated && (
              <p>Last updated: {new Date(page.meta.updated).toLocaleDateString()}</p>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default WikiPageRenderer;