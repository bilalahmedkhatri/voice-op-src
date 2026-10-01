'use client';
import React from 'react';
import PostCard from './PostCard';

interface Post {
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  tag: string;
}

interface PostListProps {
  posts: Post[];
}

const PostList: React.FC<PostListProps> = ({ posts }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => <PostCard key={post.slug} {...post} />)}
    </div>
  );
};

export default PostList;
