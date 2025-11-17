import React from 'react';
import type { LinkPreview } from '../types';
import { LinkIcon } from './Icons';

export const LinkPreviewSkeleton: React.FC = () => (
  <div className="flex gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg animate-pulse">
    <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-md flex-shrink-0"></div>
    <div className="flex-grow space-y-3 py-1">
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
    </div>
  </div>
);

const LinkPreviewCard: React.FC<{ preview: LinkPreview }> = ({ preview }) => {
  const { url, title, description, image, sitename } = preview;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
    >
      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" />
        ) : (
          <LinkIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
        )}
      </div>
      <div className="flex-grow flex flex-col justify-center min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{sitename || new URL(url).hostname}</p>
        <h4 className="font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">{title}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 overflow-hidden text-ellipsis" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {description}
        </p>
      </div>
    </a>
  );
};

export default LinkPreviewCard;
