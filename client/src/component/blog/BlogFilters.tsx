"use client";

import { blogCategories, BlogCategory } from "./blogData";

interface Props {
  active: BlogCategory;
  onChange: (category: BlogCategory) => void;
}

export default function BlogFilters({ active, onChange }: Props) {
  return (
    <div className="flex flex-wrap justify-start gap-3">
      {blogCategories.map((category) => {
        const isActive = category === active;
        return (
          <button
            key={category}
            type="button"
            onClick={() => onChange(category)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
              isActive
                ? "bg-[#1A1A1A] text-white"
                : "bg-[#EDE8E1] text-[#1A1A1A] hover:bg-[#E5DFD6]"
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
