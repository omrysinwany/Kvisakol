'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export function CategoryFilter({ categories, selectedCategory, onSelectCategory }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-8 justify-center">
      <Button
        variant={selectedCategory === null ? 'default' : 'outline'}
        onClick={() => onSelectCategory(null)}
        className={cn("rounded-full px-4 py-2 text-sm transition-colors", {
          'bg-primary text-primary-foreground hover:bg-primary/90': selectedCategory === null,
          'border-border hover:bg-accent hover:text-accent-foreground': selectedCategory !== null
        })}
      >
        הכל
      </Button>
      {categories.map((category) => (
        <Button
          key={category}
          variant={selectedCategory === category ? 'default' : 'outline'}
          onClick={() => onSelectCategory(category)}
          className={cn("rounded-full px-4 py-2 text-sm transition-colors", {
            'bg-primary text-primary-foreground hover:bg-primary/90': selectedCategory === category,
            'border-border hover:bg-accent hover:text-accent-foreground': selectedCategory !== category
          })}
        >
          {category}
        </Button>
      ))}
    </div>
  );
}
