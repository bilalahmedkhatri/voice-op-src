import React from 'react';
import { FaMicrochip, FaSpinner } from 'react-icons/fa';

export default function ModelSkeleton() {
  return (
    <div className="relative flex flex-col gap-1.5">
      <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-800 uppercase tracking-wider">
        <FaMicrochip className="text-[#ff9b8f]" />
        Select AI Voice Model
      </label>
      <div className="w-full flex items-center justify-center p-3 rounded-2xl bg-white border border-gray-200/90 shadow-2xs">
        <FaSpinner className="animate-spin text-gray-400" />
      </div>
    </div>
  );
}
