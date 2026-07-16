import { useState } from 'react';

interface SortableListProps<T> {
  items: T[];
  keyExtractor: (item: T) => string | number;
  renderItem: (item: T, index: number, isDragging: boolean) => React.ReactNode;
  onReorder: (items: T[]) => void;
  className?: string;
}

export function SortableList<T>({ items, keyExtractor, renderItem, onReorder, className = '' }: SortableListProps<T>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null) return;

    const newItems = [...items];
    const [draggedItem] = newItems.splice(dragIndex, 1);
    newItems.splice(dropIndex, 0, draggedItem);

    onReorder(newItems);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className={className}>
      {items.map((item, index) => (
        <div
          key={keyExtractor(item)}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className="cursor-move transition-all duration-150"
          style={{
            opacity: dragIndex === index ? 0.5 : 1,
            transform: dragOverIndex === index ? 'translateY(4px)' : 'translateY(0)',
          }}
        >
          {renderItem(item, index, dragIndex === index)}
        </div>
      ))}
    </div>
  );
}
