
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
    <div className="mb-8 w-full overflow-x-hidden"> {/* Outer container: prevents page scroll */}
      <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"> {/* Scrolling viewport: takes full width of parent, enables its own scroll */}
        <div className="inline-flex whitespace-nowrap gap-2 py-2 px-1"> {/* Content: items stay in one line, can overflow parent */}
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            onClick={() => onSelectCategory(null)}
            className={cn("rounded-full px-4 py-2 text-sm transition-colors shrink-0", {
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
              className={cn("rounded-full px-4 py-2 text-sm transition-colors shrink-0", {
                'bg-primary text-primary-foreground hover:bg-primary/90': selectedCategory === category,
                'border-border hover:bg-accent hover:text-accent-foreground': selectedCategory !== category
              })}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
