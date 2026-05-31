import { useNavigate } from 'react-router-dom';
import { SearchIcon } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
}

export function SearchBar({ placeholder = `搜索文件名...` }: SearchBarProps) {
  const navigate = useNavigate();

  return (
    <button
      data-cmp="SearchBar"
      onClick={() => navigate('/search')}
      className="flex-1 flex items-center gap-2.5 h-10 px-4 rounded-2xl bg-muted border border-border active:border-primary/40 transition-colors text-left"
    >
      <SearchIcon size={15} className="text-muted-foreground flex-shrink-0" strokeWidth={2.5} />
      <span className="text-sm text-muted-foreground">{placeholder}</span>
    </button>
  );
}
