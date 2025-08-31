import React, { useEffect, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit, Trash2 } from 'lucide-react';
import { Task } from './App';

interface SortableTaskItemProps {
  task: Task;
  handleOpenEditDialog: (task: Task, event?: React.MouseEvent) => void;
  handleTaskComplete: (taskId: number) => void;
  handleDeleteTask: (taskId: number) => void;
  index: number;
}

export function SortableTaskItem({ task, handleOpenEditDialog, handleTaskComplete, handleDeleteTask, index }: SortableTaskItemProps) {
  const isMobile = window.innerWidth < 768;
  
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
      handleOpenEditDialog(task, e);
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (task.priority !== 'break') {
      handleTaskComplete(task.id);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (task.priority !== 'break') {
      handleDeleteTask(task.id);
    }
  };

  const getPriorityStyles = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return {
          background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
          borderLeft: '6px solid #dc2626',
          color: '#991b1b'
        };
      case 'medium':
        return {
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          borderLeft: '6px solid #f59e0b',
          color: '#92400e'
        };
      case 'low':
        return {
          background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
          borderLeft: '6px solid #22c55e',
          color: '#166534'
        };
      case 'break':
        return {
          background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
          borderLeft: '6px solid #6b7280',
          color: '#374151'
        };
      default:
        return {
          background: '#f1f5f9',
          borderLeft: '6px solid #64748b',
          color: '#334155'
        };
    }
  };

  // Function to get priority emoji dot - fixed color matching
  const getPriorityEmoji = (priority: 'high' | 'medium' | 'low'): string => {
    switch (priority) {
      case 'high': return '🔴'; // Red dot for high priority (matches red background)
      case 'medium': return '🟡'; // Yellow dot for medium priority (matches yellow background)  
      case 'low': return '🟢'; // Green dot for low priority (matches green background)
      default: return '⭐';
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
    padding: isMobile ? '12px' : '16px',
    borderRadius: '12px',
    boxShadow: task.completed 
      ? '0 2px 4px -1px rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.03)' 
      : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: isMobile ? '8px' : '12px',
    cursor: task.priority === 'break' ? 'default' : 'grab',
    transition: 'all 0.3s ease',
    transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
    opacity: isVisible ? (task.completed && task.priority !== 'break' ? 0.7 : 1) : 0,
    filter: task.completed && task.priority !== 'break' ? 'saturate(0.7)' : 'none'
  };

  const leftSectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? '8px' : '12px',
    flex: 1,
    minWidth: 0
  };

  const rightSectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? '8px' : '12px',
    flexShrink: 0
  };

  const timeStyle = {
    fontSize: '14px',
    fontWeight: '500',
    opacity: 0.8
  };

  const editButtonStyle = {
    padding: isMobile ? '10px' : '6px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.8)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    minWidth: isMobile ? '44px' : 'auto',
    minHeight: isMobile ? '44px' : 'auto'
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
          {/* Checkbox for task completion */}
          {task.priority !== 'break' && (
            <input
              type="checkbox"
              checked={task.completed}
              onChange={handleCheckboxChange}
              onClick={handleCheckboxClick}
              style={{
                width: '20px',
                height: '20px',
                accentColor: '#3b82f6',
                cursor: 'pointer',
                position: 'relative',
                zIndex: 10
              }}
            />
          )}
          
          {task.priority !== 'break' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Priority emoji dot */}
              <span style={{ 
                fontSize: '1.5rem',
                opacity: task.completed ? 0.5 : 1,
                transition: 'opacity 0.3s ease'
              }}>
                {getPriorityEmoji(task.priority as 'high' | 'medium' | 'low')}
              </span>
              
              {/* Task emoji */}
              {task.emoji && (
                <span style={{ 
                  fontSize: '2rem', 
                  filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.1))',
                  opacity: task.completed ? 0.5 : 1,
                  transition: 'opacity 0.3s ease'
                }}>
                  {task.emoji}
                </span>
              )}
            </div>
          )}
          {task.priority === 'break' && (
            <span style={{ fontSize: '2rem', color: priorityStyles.color }}>
              {task.breakEmoji || '☕'}
            </span>
          )}
          <p style={{ 
            fontSize: isMobile ? '1rem' : '1.125rem', 
            fontWeight: '600', 
            margin: 0,
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
            textDecoration: task.completed ? 'line-through' : 'none',
            opacity: task.completed ? 0.6 : 1,
            transition: 'all 0.3s ease',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: isMobile ? 'nowrap' : 'normal'
          }}>
            {task.text}
          </p>
        </div>
        <div style={rightSectionStyle}>
          <span style={{
            ...timeStyle,
            fontSize: isMobile ? '12px' : '14px',
            whiteSpace: 'nowrap'
          }}>
            {isMobile ? 
              `${task.startTime.split(' ')[0]}-${task.endTime.split(' ')[0]}` : 
              `${task.startTime} - ${task.endTime}`
            }
          </span>
          {task.priority !== 'break' && (
            <div style={{ display: 'flex', gap: '8px' }}>
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
                title="Edit activity"
              >
                <Edit size={isMobile ? 20 : 18} style={{ color: priorityStyles.color }} />
              </button>
              
              <button 
                onClick={handleDeleteClick} 
                style={{
                  ...editButtonStyle,
                  position: 'relative',
                  zIndex: 10,
                  background: 'rgba(239, 68, 68, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title="Delete activity"
              >
                <Trash2 size={isMobile ? 20 : 18} style={{ color: '#ef4444' }} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}