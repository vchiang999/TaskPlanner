import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit, Coffee, Gamepad2 } from 'lucide-react';
import { Task } from './App';

interface SortableTaskItemProps {
  task: Task;
  handleOpenEditDialog: (task: Task) => void;
}

export function SortableTaskItem({ task, handleOpenEditDialog }: SortableTaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id, disabled: task.priority === 'break' });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleOpenEditDialog(task);
  };

  const getPriorityClasses = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-yellow-200 border-yellow-500';
      case 'medium':
        return 'bg-teal-200 border-teal-500';
      case 'low':
        return 'bg-green-200 border-green-500';
      case 'break':
        return 'bg-pink-200 border-pink-500';
      default:
        return 'bg-gray-200 border-gray-500';
    }
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-2">
      <div className={`p-4 rounded-lg shadow-sm flex items-center justify-between border-l-4 ${getPriorityClasses(task.priority)}`}>
        <div className="flex items-center space-x-3">
          {task.priority !== 'break' && task.emoji && <span className="text-3xl">{task.emoji}</span>}
          {task.priority === 'break' && (
            <span className="text-3xl">
              {Math.random() > 0.5 ? <Coffee size={32} /> : <Gamepad2 size={32} />}
            </span>
          )}
          <p className="text-lg font-medium">{task.text}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-600">
            {task.startTime} - {task.endTime}
          </span>
          {task.priority !== 'break' && (
            <button onClick={handleEditClick} className="p-1 rounded-full hover:bg-white transition-all duration-300">
              <Edit size={20} className="text-slate-600" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
