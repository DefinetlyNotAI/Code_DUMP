import React from 'react';
import { WikiPageImage } from '../types/WikiTypes';

interface ImageGalleryProps {
  images: WikiPageImage[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  const [selectedImage, setSelectedImage] = React.useState<WikiPageImage | null>(null);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((image, index) => (
          <div 
            key={index}
            className="overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedImage(image)}
          >
            <div className="aspect-w-16 aspect-h-9 bg-gray-100 dark:bg-gray-700">
              <img
                src={image.src}
                alt={image.alt}
                className="object-cover w-full h-full"
              />
            </div>
            {image.caption && (
              <div className="p-2 text-sm text-gray-600 dark:text-gray-300">
                {image.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Image modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="max-w-4xl max-h-full overflow-auto bg-white dark:bg-gray-800 rounded-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={selectedImage.src}
                alt={selectedImage.alt}
                className="max-h-[80vh] w-auto"
              />
              <button
                className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-opacity"
                onClick={() => setSelectedImage(null)}
              >
                ✕
              </button>
            </div>
            {selectedImage.caption && (
              <div className="p-4 text-center">
                {selectedImage.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;