'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface PostCardProps {
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  tag: string;
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
};

const PostCard: React.FC<PostCardProps> = ({ slug, title, description, imageUrl, tag }) => {
  return (
    <Link href={`/blog/${slug}`} className="block group text-inherit no-underline h-full">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 overflow-hidden flex flex-col h-full cursor-pointer hover:-translate-y-1">
        <div className="relative w-full aspect-video">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
          />
          <span className="absolute top-3 right-3 z-10 bg-orange-50/90 text-[#c83a2a] border border-orange-200/80 px-2.5 py-0.5 rounded-full text-xs font-semibold backdrop-blur-xs shadow-2xs">
            {tag}
          </span>
        </div>
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#c83a2a] transition-colors leading-snug line-clamp-2">
            {truncateText(title, 100)}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">
            {truncateText(description, 120)}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default PostCard;
