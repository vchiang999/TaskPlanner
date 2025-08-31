import React, { useEffect, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit } from 'lucide-react';
import { Task } from './App';

interface SortableTaskItemProps {
  task: Task;
  handleOpenEditDialog: (task: Task) => void;
  index: number;
}

export function SortableTaskItem({ task, handleOpenEditDialog, index }: SortableTaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ 
    id: task.id, 
    disabled: task.priority === 'break' 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (task.priority !== 'break') {
      handleOpenEditDialog(task);
    }
  };

  const getPriorityStyles = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return {
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          borderLeft: '6px solid #f59e0b',
          color: '#92400e'
        };
      case 'medium':
        return {
          background: 'linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)',
          borderLeft: '6px solid #14b8a6',
          color: '#0f766e'
        };
      case 'low':
        return {
          background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
          borderLeft: '6px solid #22c55e',
          color: '#166534'
        };
      case 'break':
        return {
          background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
          borderLeft: '6px solid #ec4899',
          color: '#be185d'
        };
      default:
        return {
          background: '#f1f5f9',
          borderLeft: '6px solid #64748b',
          color: '#334155'
        };
    }
  };

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, index * 100);

    return () => clearTimeout(timer);
  }, [index]);

  const priorityStyles = getPriorityStyles(task.priority);
  
  const cardStyle = {
    ...priorityStyles,
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
    cursor: task.priority === 'break' ? 'default' : 'grab',
    transition: 'all 0.3s ease',
    transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
    opacity: isVisible ? 1 : 0
  };

  const leftSectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const rightSectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const timeStyle = {
    fontSize: '14px',
    fontWeight: '500',
    opacity: 0.8
  };

  const editButtonStyle = {
    padding: '6px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.8)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  };

  // Separate drag listeners from the edit button area
  const dragProps = task.priority === 'break' ? {} : { ...attributes, ...listeners };

  return (
    <div
      ref={setNodeRef}
      style={style}
    >
      <div 
        style={cardStyle}
        className={`transform transition-all duration-500 hover:scale-105 hover:shadow-lg ${
          task.priority === 'break' ? '' : 'cursor-grab active:cursor-grabbing'
        }`}
        {...dragProps}
        onMouseEnter={(e) => {
          if (task.priority !== 'break') {
            e.currentTarget.style.transform = isVisible ? 'translateY(0) scale(1.02)' : 'translateY(20px) scale(0.97)';
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)';
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        }}
      >
        <div style={leftSectionStyle}>
          {task.priority !== 'break' && task.emoji && (
            <span style={{ fontSize: '2rem', filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.1))' }}>
              {task.emoji}
            </span>
          )}
          {task.priority === 'break' && (
            <span style={{ fontSize: '2rem', color: priorityStyles.color }}>
              {task.breakEmoji || '☕'}
            </span>
          )}
          <p style={{ 
            fontSize: '1.125rem', 
            fontWeight: '600', 
            margin: 0,
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
          }}>
            {task.text}
          </p>
        </div>
        <div style={rightSectionStyle}>
          <span style={timeStyle}>
            {task.startTime} - {task.endTime}
          </span>
          {task.priority !== 'break' && (
            <button 
              onClick={handleEditClick} 
              style={{
                ...editButtonStyle,
                position: 'relative',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Edit size={18} style={{ color: priorityStyles.color }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}