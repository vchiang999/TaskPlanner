import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableTaskItem } from './SortableTaskItem';
import { PlusCircle, Settings, Clock, AlertTriangle, GraduationCap } from 'lucide-react';

// A simple interface to define the shape of a task object
export interface Task {
  id: number;
  text: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low' | 'break';
  startTime: string;
  endTime: string;
  emoji?: string;
  breakEmoji?: string; // Fixed emoji for break times
}

// Helper function to format time consistently
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });
};

// Function to automatically assign emoji based on task text
const getEmojiForTask = (taskText: string): string => {
  const lowerCaseText = taskText.toLowerCase();
  if (lowerCaseText.includes('read') || lowerCaseText.includes('book') || lowerCaseText.includes('homework') || lowerCaseText.includes('study')) return '📚';
  if (lowerCaseText.includes('clean') || lowerCaseText.includes('tidy') || lowerCaseText.includes('room')) return '🧹';
  if (lowerCaseText.includes('math') || lowerCaseText.includes('numbers')) return '🔢';
  if (lowerCaseText.includes('draw') || lowerCaseText.includes('art') || lowerCaseText.includes('paint')) return '🎨';
  if (lowerCaseText.includes('play') || lowerCaseText.includes('game') || lowerCaseText.includes('outside')) return '🎮';
  if (lowerCaseText.includes('walk') || lowerCaseText.includes('dog')) return '🐶';
  return '⭐';
};

// Function to round to nearest 10 minutes
const roundToNearest10 = (minutes: number): number => {
  return Math.max(10, Math.floor(minutes / 10) * 10);
};

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskPriority, setSelectedTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [editTaskText, setEditTaskText] = useState('');
  const [bubbleEditPosition, setBubbleEditPosition] = useState<{x: number, y: number} | null>(null);
  
  // Break time and schedule settings
  const [includeBreaks, setIncludeBreaks] = useState(true);
  const [breakDuration, setBreakDuration] = useState(10); // Default to 10 minutes
  const [taskDuration, setTaskDuration] = useState(30);
  const [tasksPerBreak, setTasksPerBreak] = useState(2);
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(16);
  const [isSchoolDay, setIsSchoolDay] = useState(false);
  
  // Warning states
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [suggestedTaskDuration, setSuggestedTaskDuration] = useState(30);
  
  // Mobile UI states
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showScheduleSettings, setShowScheduleSettings] = useState(!isMobile);
  const [showBreakSettings, setShowBreakSettings] = useState(!isMobile);
  const [currentView, setCurrentView] = useState<'tasks' | 'settings'>('tasks'); // Mobile tab state
  const [taskAddedBubbles, setTaskAddedBubbles] = useState<{id: number, text: string}[]>([]); // Task added confirmations

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 300, // Increased delay to prevent text selection
        tolerance: 10, // Increased tolerance
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle school day toggle
  useEffect(() => {
    if (isSchoolDay) {
      setStartHour(15); // 3 PM
      setEndHour(19);   // 7 PM
    } else {
      setStartHour(9);  // 9 AM
      setEndHour(19);   // 7 PM
    }
  }, [isSchoolDay]);

  // Handle window resize for mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowScheduleSettings(true);
        setShowBreakSettings(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const recalculateSchedule = (currentTasks: Omit<Task, 'startTime' | 'endTime'>[]) => {
    const actualTasks = currentTasks.filter(t => t.priority !== 'break');
    const tasksWithBreaks: Omit<Task, 'startTime' | 'endTime'>[] = [];
    const breakEmojis = ['☕', '🎮', '🍎', '🧃', '⚽', '🎨'];
    
    // Fixed break insertion logic - only add breaks after completing FULL sets
    actualTasks.forEach((task, index) => {
      tasksWithBreaks.push(task);
      
      // Only add break if:
      // 1. We have breaks enabled
      // 2. This is not the last task
      // 3. We've completed exactly 'tasksPerBreak' number of tasks
      // 4. There are more tasks remaining after this break
      const tasksCompleted = index + 1;
      const isFullSet = tasksCompleted % Number(tasksPerBreak) === 0;
      const isNotLastTask = index < actualTasks.length - 1;
      
      if (includeBreaks && isFullSet && isNotLastTask) {
        const breakIndex = Math.floor(tasksCompleted / Number(tasksPerBreak)) - 1;
        const breakEmoji = breakEmojis[breakIndex % breakEmojis.length];
        tasksWithBreaks.push({ 
          id: Date.now() + Math.random() * 1000 + index,
          text: 'Break Time', 
          completed: false, 
          priority: 'break',
          breakEmoji: breakEmoji
        });
      }
    });

    // Calculate schedule starting from startHour
    let currentTime = new Date();
    currentTime.setHours(Number(startHour), 0, 0, 0);

    const finalTasks = tasksWithBreaks.map((task) => {
      // Ensure we're using the correct duration values with proper Number conversion
      const duration = task.priority === 'break' ? Number(breakDuration) : Number(taskDuration);
      const startTime = new Date(currentTime);
      const endTime = new Date(currentTime.getTime() + duration * 60000);

      currentTime = endTime;

      return {
        ...task,
        startTime: formatTime(startTime),
        endTime: formatTime(endTime),
      };
    });
    
    return finalTasks;
  };

  // Recalculate schedule whenever settings change (but not when tasks change to avoid infinite loop)
  useEffect(() => {
    const actualTasks = tasks.filter(t => t.priority !== 'break');
    if (actualTasks.length > 0) {
      const tasksWithBreaks: Omit<Task, 'startTime' | 'endTime'>[] = [];
      const breakEmojis = ['☕', '🎮', '🍎', '🧃', '⚽', '🎨'];
      
      // Fixed break insertion logic - only add breaks after completing FULL sets
      actualTasks.forEach((task, index) => {
        tasksWithBreaks.push(task);
        
        // Only add break if:
        // 1. We have breaks enabled
        // 2. This is not the last task
        // 3. We've completed exactly 'tasksPerBreak' number of tasks
        // 4. There are more tasks remaining after this break
        const tasksCompleted = index + 1;
        const isFullSet = tasksCompleted % Number(tasksPerBreak) === 0;
        const isNotLastTask = index < actualTasks.length - 1;
        
        if (includeBreaks && isFullSet && isNotLastTask) {
          const breakIndex = Math.floor(tasksCompleted / Number(tasksPerBreak)) - 1;
          const breakEmoji = breakEmojis[breakIndex % breakEmojis.length];
          tasksWithBreaks.push({ 
            id: Date.now() + Math.random() * 1000 + index,
            text: 'Break Time', 
            completed: false, 
            priority: 'break',
            breakEmoji: breakEmoji
          });
        }
      });

      // Calculate schedule starting from startHour
      let currentTime = new Date();
      currentTime.setHours(Number(startHour), 0, 0, 0);

      const finalTasks = tasksWithBreaks.map((task) => {
        // Ensure we're using the correct duration values with proper Number conversion
        const duration = task.priority === 'break' ? Number(breakDuration) : Number(taskDuration);
        const startTime = new Date(currentTime);
        const endTime = new Date(currentTime.getTime() + duration * 60000);

        currentTime = endTime;

        return {
          ...task,
          startTime: formatTime(startTime),
          endTime: formatTime(endTime),
        };
      });
      
      setTasks(finalTasks);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskDuration, breakDuration, tasksPerBreak, includeBreaks, startHour, endHour]);

  // Check time constraints whenever tasks or settings change
  useEffect(() => {
    const actualTasks = tasks.filter(t => t.priority !== 'break');
    if (actualTasks.length > 0) {
      const numTasks = actualTasks.length;
      const availableMinutes = (Number(endHour) - Number(startHour)) * 60;
      const numBreaks = includeBreaks ? Math.floor((numTasks - 1) / Number(tasksPerBreak)) : 0;
      const totalMinutes = (numTasks * Number(taskDuration)) + (numBreaks * Number(breakDuration));
      
      const fits = totalMinutes <= availableMinutes;
      const suggestedDuration = numTasks > 0 ? roundToNearest10((availableMinutes - (numBreaks * Number(breakDuration))) / numTasks) : Number(taskDuration);
      
      setShowTimeWarning(!fits);
      setSuggestedTaskDuration(suggestedDuration);
    } else {
      setShowTimeWarning(false);
    }
  }, [tasks, taskDuration, breakDuration, tasksPerBreak, includeBreaks, startHour, endHour]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim() === '') return;

    const newTask: Omit<Task, 'startTime' | 'endTime'> = {
      id: Date.now(),
      text: newTaskText,
      completed: false,
      priority: newTaskPriority,
      emoji: getEmojiForTask(newTaskText),
    };

    const currentTasksWithoutBreaks = tasks.filter((task) => task.priority !== 'break');
    
    // Never auto-rearrange - always append new tasks to the end
    const finalTasks = [...currentTasksWithoutBreaks, newTask];

    setTasks(recalculateSchedule(finalTasks));
    setNewTaskText('');
    setNewTaskPriority('medium');
    
    // Show task added confirmation bubble
    const bubbleId = Date.now();
    setTaskAddedBubbles(prev => [...prev, { id: bubbleId, text: 'Task added!' }]);
    setTimeout(() => {
      setTaskAddedBubbles(prev => prev.filter(bubble => bubble.id !== bubbleId));
    }, 2000);
  };

  const handleTaskComplete = (taskId: number) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleDeleteTask = (taskId: number) => {
    const currentTasksWithoutBreaks = tasks.filter((task) => task.priority !== 'break' && task.id !== taskId);
    setTasks(recalculateSchedule(currentTasksWithoutBreaks));
  };

  const handleOpenEditDialog = (task: Task, event?: React.MouseEvent) => {
    setSelectedTask(task);
    setSelectedTaskPriority(task.priority as 'high' | 'medium' | 'low');
    setEditTaskText(task.text);
    
    // Only use bubble positioning on desktop, not mobile
    if (event && !isMobile) {
      // Get the position of the edit button for bubble positioning
      const rect = event.currentTarget.getBoundingClientRect();
      setBubbleEditPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height + 8
      });
    } else {
      setBubbleEditPosition(null);
    }
    
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedTask(null);
    setEditTaskText('');
    setBubbleEditPosition(null);
  };

  const handleUpdateTask = () => {
    if (selectedTask) {
      const updatedTasks = tasks.map((task) =>
        task.id === selectedTask.id ? { 
          ...task, 
          priority: selectedTaskPriority,
          text: editTaskText.trim() || task.text,
          emoji: getEmojiForTask(editTaskText.trim() || task.text)
        } : task
      );

      const tasksWithoutBreaks = updatedTasks.filter(t => t.priority !== 'break');

      setTasks(recalculateSchedule(tasksWithoutBreaks));
      handleCloseEditDialog();
    }
  };



  const handleAcceptSuggestedDuration = () => {
    setTaskDuration(suggestedTaskDuration);
    setShowTimeWarning(false);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeTask = tasks.find(task => task.id === active.id);
    if (!activeTask || activeTask.priority === 'break') return;

    const actualTasks = tasks.filter(task => task.priority !== 'break');
    const oldIndex = actualTasks.findIndex((task) => task.id === active.id);
    const overTask = tasks.find(task => task.id === over.id);
    
    if (!overTask) return;

    let newIndex;
    if (overTask.priority === 'break') {
      const overTaskIndex = tasks.findIndex(task => task.id === over.id);
      const nextTask = tasks[overTaskIndex + 1];
      if (nextTask && nextTask.priority !== 'break') {
        newIndex = actualTasks.findIndex(task => task.id === nextTask.id);
      } else {
        newIndex = actualTasks.length - 1;
      }
    } else {
      newIndex = actualTasks.findIndex((task) => task.id === over.id);
    }

    if (oldIndex !== newIndex) {
      const reorderedTasks = arrayMove(actualTasks, oldIndex, newIndex);
      setTasks(recalculateSchedule(reorderedTasks));
    }
  };

  // Inline styles
  const containerStyle = {
    minHeight: window.innerWidth < 768 ? '100dvh' : '100vh', // Dynamic viewport height for mobile
    background: 'linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%)',
    fontFamily: "'Poppins', 'Comic Sans MS', cursive, sans-serif",
    color: '#334155',
    padding: window.innerWidth < 768 ? '8px' : '16px',
    paddingTop: window.innerWidth < 768 ? 'max(8px, env(safe-area-inset-top))' : '16px',
    paddingBottom: window.innerWidth < 768 ? 'max(8px, env(safe-area-inset-bottom))' : '16px'
  };

  const mainCardStyle = {
    background: 'white',
    borderRadius: window.innerWidth < 768 ? '16px' : '24px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    padding: window.innerWidth < 768 ? '16px' : '32px',
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const headerStyle = {
    textAlign: 'center' as const,
    marginBottom: '32px'
  };

  const titleStyle = {
    fontSize: window.innerWidth < 768 ? '2rem' : '3rem',
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: '8px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
  };

  const subtitleStyle = {
    fontSize: window.innerWidth < 768 ? '1rem' : '1.25rem',
    color: '#64748b'
  };

  const inputStyle = {
    padding: '12px',
    border: '2px solid #bfdbfe',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    transition: 'all 0.3s ease',
    width: '100%'
  };

  const buttonStyle = {
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '8px',
    fontWeight: 'bold',
    fontSize: '16px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    width: '100%'
  };

  const columnStyle = {
    background: '#f8fafc',
    padding: window.innerWidth < 768 ? '16px' : '24px',
    borderRadius: '12px',
    height: 'fit-content'
  };

  const warningStyle = {
    background: '#fef3c7',
    border: '2px solid #f59e0b',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    color: '#92400e'
  };

  return (
    <div style={containerStyle} className="min-h-screen bg-gradient-to-br from-sky-100 to-blue-200 font-poppins text-slate-700 p-4">
      <div style={mainCardStyle} className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-6xl mx-auto">
        <header style={headerStyle} className="text-center mb-8">
          <h1 style={titleStyle} className="text-5xl font-bold text-blue-600 mb-2">
            {isMobile ? '🌟 My Day Planner 🌟' : '🌟 My Super Cool Day Planner 🌟'}
          </h1>
          <p style={subtitleStyle} className="text-xl text-slate-600">
            {isMobile ? 'Plan your awesome day!' : 'Let\'s make today absolutely amazing together!'}
          </p>
        </header>

        {/* Time Warning */}
        {showTimeWarning && (
          <div style={warningStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <AlertTriangle size={20} />
              <strong>Oops! Too many activities for today!</strong>
            </div>
            <p style={{ margin: '8px 0' }}>
              Your activities won't fit between {startHour}:00 and {endHour}:00. 
              How about {suggestedTaskDuration} minutes per activity?
            </p>
            <button
              onClick={handleAcceptSuggestedDuration}
              style={{
                background: '#f59e0b',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Yes, adjust my activities!
            </button>
          </div>
        )}

        {/* Mobile Tab Navigation */}
        {isMobile && (
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '16px',
            gap: '4px'
          }}>
            <button
              onClick={() => setCurrentView('tasks')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: currentView === 'tasks' ? '#3b82f6' : 'transparent',
                color: currentView === 'tasks' ? 'white' : '#64748b',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              📅 My Tasks
            </button>
            <button
              onClick={() => setCurrentView('settings')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: currentView === 'settings' ? '#3b82f6' : 'transparent',
                color: currentView === 'settings' ? 'white' : '#64748b',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              ⚙️ Settings
            </button>
          </div>
        )}

        {/* Task Added Confirmation Bubbles */}
        {taskAddedBubbles.map((bubble, index) => (
          <div key={bubble.id} style={{
            position: 'fixed',
            top: `${20 + (index * 60)}px`, // Stack bubbles vertically
            right: '20px',
            background: '#10b981',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '25px',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
            zIndex: 1000,
            animation: 'slideInRight 0.3s ease-out',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ✅ {bubble.text}
          </div>
        ))}

        {/* Two Column Layout / Mobile Tab Content */}
        <div style={{ 
          display: isMobile ? 'block' : 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
          gap: isMobile ? '16px' : '32px' 
        }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Task Input / Settings Tab */}
          <div style={{
            ...columnStyle,
            display: isMobile ? (currentView === 'settings' ? 'block' : 'none') : 'block'
          }} className="bg-slate-50 p-6 rounded-lg">
            {/* Desktop Task Input Form */}
            {!isMobile && (
              <>
                <h2 style={{ fontSize: '1.875rem', fontWeight: '600', marginBottom: '16px', color: '#1e293b' }} className="text-3xl font-semibold mb-4">
                  ✨ What Cool Thing Will You Do?
                </h2>
                
                <form onSubmit={handleAddTask} style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
              <input
                type="text"
                placeholder={isMobile ? "What will you do? 🤔" : "What awesome thing will you do? 🤔"}
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                style={inputStyle}
                className="p-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300"
              />
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as 'high' | 'medium' | 'low')}
                style={inputStyle}
                className="p-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300"
              >
                <option value="medium">{isMobile ? '🟡 Important' : '🟡 Pretty Important'}</option>
                <option value="high">{isMobile ? '🔴 Very Important' : '🔴 Super Important'}</option>
                <option value="low">{isMobile ? '🟢 Later' : '🟢 When I Have Time'}</option>
              </select>
              <button
                type="submit"
                style={buttonStyle}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-lg font-bold text-lg flex items-center justify-center space-x-2 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
                }}
              >
                <PlusCircle size={24} />
                <span>{isMobile ? 'Add Activity!' : 'Add to My Awesome Day!'}</span>
              </button>
            </form>
              </>
            )}

            {/* Mobile Settings Header */}
            {isMobile && currentView === 'settings' && (
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '16px', color: '#1e293b' }}>
                ⚙️ Settings
              </h2>
            )}

            {/* Day Schedule Settings */}
            <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '24px', marginBottom: '24px' }}>
              <h3 
                style={{ 
                  fontSize: isMobile ? '1.25rem' : '1.5rem', 
                  fontWeight: '600', 
                  marginBottom: '16px', 
                  color: '#1e293b', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  cursor: isMobile ? 'pointer' : 'default'
                }}
                onClick={() => isMobile && setShowScheduleSettings(!showScheduleSettings)}
              >
                <Clock size={isMobile ? 20 : 24} />
                {isMobile ? 'Schedule' : 'My Day Schedule'}
                {isMobile && (
                  <span style={{ marginLeft: 'auto', fontSize: '1rem' }}>
                    {showScheduleSettings ? '🔽' : '▶️'}
                  </span>
                )}
              </h3>
              
              {/* School Day Toggle */}
              {showScheduleSettings && (
                <>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: isMobile ? '1rem' : '1.125rem', fontWeight: '500', marginBottom: '16px' }}>
                    <input
                      type="checkbox"
                      checked={isSchoolDay}
                      onChange={(e) => setIsSchoolDay(e.target.checked)}
                      style={{ width: '20px', height: '20px', accentColor: '#3b82f6' }}
                    />
                    <GraduationCap size={isMobile ? 20 : 24} />
                    {isMobile ? 'School day?' : 'Is this a school day?'}
                  </label>
                  <div style={{ 
                    background: '#dbeafe', 
                    padding: isMobile ? '8px' : '12px', 
                    borderRadius: '8px', 
                    fontSize: isMobile ? '0.75rem' : '0.875rem', 
                    color: '#1e40af',
                    border: '1px solid #93c5fd',
                    marginBottom: '16px'
                  }}>
                    {isMobile ? (
                      <>📚 School: 3:00 PM - 7:00 PM<br />🏠 Free: 9:00 AM - 7:00 PM</>
                    ) : (
                      <>
                        📚 <strong>School day:</strong> Plan activities from 3:00 PM to 7:00 PM (after school!)
                        <br />
                        🏠 <strong>Free day:</strong> Plan activities from 9:00 AM to 7:00 PM (whole day fun!)
                      </>
                    )}
                  </div>
              
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: isMobile ? '0.875rem' : '1rem', fontWeight: '500', color: '#334155', marginBottom: '8px' }}>
                        {isMobile ? 'Start' : 'Start my day at'}
                      </label>
                  <select
                    value={startHour}
                    onChange={(e) => setStartHour(Number(e.target.value))}
                    style={inputStyle}
                    disabled={isSchoolDay}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 6).map(hour => (
                      <option key={hour} value={hour}>
                        {hour}:00 {hour < 12 ? 'AM' : 'PM'}
                      </option>
                    ))}
                  </select>
                </div>

                    <div>
                      <label style={{ display: 'block', fontSize: isMobile ? '0.875rem' : '1rem', fontWeight: '500', color: '#334155', marginBottom: '8px' }}>
                        {isMobile ? 'End' : 'Finish my day at'}
                      </label>
                  <select
                    value={endHour}
                    onChange={(e) => setEndHour(Number(e.target.value))}
                    style={inputStyle}
                    disabled={isSchoolDay}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 12).map(hour => (
                      <option key={hour} value={hour}>
                        {hour > 12 ? hour - 12 : hour}:00 {hour < 12 ? 'AM' : 'PM'}
                      </option>
                    ))}
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Break Time Settings */}
            <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '24px' }}>
              <h3 
                style={{ 
                  fontSize: isMobile ? '1.25rem' : '1.5rem', 
                  fontWeight: '600', 
                  marginBottom: '16px', 
                  color: '#1e293b', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  cursor: isMobile ? 'pointer' : 'default'
                }}
                onClick={() => isMobile && setShowBreakSettings(!showBreakSettings)}
              >
                <Settings size={isMobile ? 20 : 24} />
                {isMobile ? 'Breaks' : 'Fun Break Settings'}
                {isMobile && (
                  <span style={{ marginLeft: 'auto', fontSize: '1rem' }}>
                    {showBreakSettings ? '🔽' : '▶️'}
                  </span>
                )}
              </h3>
              
              {showBreakSettings && (
                <div style={{ display: 'grid', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: isMobile ? '1rem' : '1.125rem', fontWeight: '500' }}>
                    <input
                      type="checkbox"
                      checked={includeBreaks}
                      onChange={(e) => setIncludeBreaks(e.target.checked)}
                      style={{ width: '20px', height: '20px', accentColor: '#3b82f6' }}
                    />
                    {isMobile ? 'Want breaks?' : 'I want fun breaks!'}
                  </label>

                {includeBreaks && (
                  <>
                      <div>
                        <label style={{ display: 'block', fontSize: isMobile ? '0.875rem' : '1rem', fontWeight: '500', color: '#334155', marginBottom: '8px' }}>
                          {isMobile ? 'Activities per break' : 'Activities before each break'}
                        </label>
                      <select
                        value={tasksPerBreak}
                        onChange={(e) => setTasksPerBreak(Number(e.target.value))}
                        style={inputStyle}
                      >
                        <option value={1}>After every 1 activity</option>
                        <option value={2}>After every 2 activities</option>
                        <option value={3}>After every 3 activities</option>
                        <option value={4}>After every 4 activities</option>
                        <option value={5}>After every 5 activities</option>
                      </select>
                    </div>

                      <div>
                        <label style={{ display: 'block', fontSize: isMobile ? '0.875rem' : '1rem', fontWeight: '500', color: '#334155', marginBottom: '8px' }}>
                          {isMobile ? 'Break length' : 'How long should breaks be?'}
                        </label>
                      <select
                        value={breakDuration}
                        onChange={(e) => setBreakDuration(Number(e.target.value))}
                        style={inputStyle}
                      >
                        <option value={5}>5 minutes</option>
                        <option value={10}>10 minutes</option>
                        <option value={15}>15 minutes</option>
                        <option value={20}>20 minutes</option>
                        <option value={30}>30 minutes</option>
                      </select>
                    </div>

                      <div>
                        <label style={{ display: 'block', fontSize: isMobile ? '0.875rem' : '1rem', fontWeight: '500', color: '#334155', marginBottom: '8px' }}>
                          {isMobile ? 'Activity length' : 'How long for each activity?'}
                        </label>
                      <select
                        value={taskDuration}
                        onChange={(e) => setTaskDuration(Number(e.target.value))}
                        style={inputStyle}
                      >
                        <option value={10}>10 minutes</option>
                        <option value={15}>15 minutes</option>
                        <option value={20}>20 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>60 minutes</option>
                      </select>
                    </div>
                  </>
                )}

                  <div style={{ 
                    background: '#dbeafe', 
                    padding: isMobile ? '8px' : '12px', 
                    borderRadius: '8px', 
                    fontSize: isMobile ? '0.75rem' : '0.875rem', 
                    color: '#1e40af',
                    border: '1px solid #93c5fd'
                  }}>
                    {isMobile ? (
                      `🎉 Break after ${tasksPerBreak} activit${tasksPerBreak > 1 ? 'ies' : 'y'}!`
                    ) : (
                      `🎉 Cool! You'll get a fun break after every ${tasksPerBreak} activit${tasksPerBreak > 1 ? 'ies' : 'y'} to recharge and have fun!`
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Timetable / Tasks Tab */}
          <div style={{
            ...columnStyle,
            display: isMobile ? (currentView === 'tasks' ? 'block' : 'none') : 'block'
          }} className="bg-slate-50 p-6 rounded-lg">
            {/* Mobile Task Input Form */}
            {isMobile && currentView === 'tasks' && (
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '16px', color: '#1e293b' }}>
                  ✨ Add Activity
                </h2>
                
                <form onSubmit={handleAddTask} style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
                  <input
                    type="text"
                    placeholder="What will you do? 🤔"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    style={{
                      ...inputStyle,
                      fontSize: '16px',
                      padding: '14px'
                    }}
                  />
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as 'high' | 'medium' | 'low')}
                    style={{
                      ...inputStyle,
                      fontSize: '16px',
                      padding: '14px'
                    }}
                  >
                    <option value="medium">🟡 Important</option>
                    <option value="high">🔴 Very Important</option>
                    <option value="low">🟢 Later</option>
                  </select>
                  <button
                    type="submit"
                    style={{
                      ...buttonStyle,
                      padding: '14px 24px',
                      fontSize: '16px',
                      minHeight: '50px'
                    }}
                  >
                    <PlusCircle size={20} />
                    <span>Add Activity!</span>
                  </button>
                </form>
                
                <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '16px', marginBottom: '16px' }} />
              </div>
            )}

            <h2 style={{ fontSize: isMobile ? '1.5rem' : '1.875rem', fontWeight: '600', marginBottom: '16px', color: '#1e293b' }} className="text-3xl font-semibold mb-4">
              {isMobile ? '📅 My Schedule' : '📅 My Super Cool Schedule'}
            </h2>
            
            {tasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎯</div>
                <p style={{ fontSize: isMobile ? '1rem' : '1.125rem' }}>
                  {isMobile ? 'Add your first activity!' : 'Ready to make today amazing? Add your first cool activity!'}
                </p>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  <div>
                    {tasks.map((task, index) => (
                      <SortableTaskItem 
                        key={task.id} 
                        task={task} 
                        handleOpenEditDialog={handleOpenEditDialog} 
                        handleTaskComplete={handleTaskComplete}
                        handleDeleteTask={handleDeleteTask}
                        index={index} 
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

        {/* Edit Dialog - Bubble for Desktop, Modal for Mobile */}
        {editDialogOpen && selectedTask && (
          <>
            {/* Backdrop */}
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: isMobile ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
                zIndex: 40
              }}
              onClick={handleCloseEditDialog}
            />
            
            {/* Dialog */}
            <div style={{
              position: 'fixed',
              ...(isMobile ? {
                // Mobile: Position in upper half to avoid virtual keyboard
                top: '25%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '90%',
                maxWidth: '400px'
              } : bubbleEditPosition ? {
                // Desktop: Bubble positioning
                left: `${bubbleEditPosition.x}px`,
                top: `${bubbleEditPosition.y}px`,
                transform: 'translateX(-50%)',
                width: '320px'
              } : {
                // Fallback: Center modal
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '320px'
              }),
              background: 'white',
              padding: '20px',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              zIndex: 50,
              border: '2px solid #e2e8f0',
              animation: 'bubbleIn 0.2s ease-out'
            }}>
              {/* Arrow pointing up - only for desktop bubble */}
              {!isMobile && bubbleEditPosition && (
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '50%',
                  width: '16px',
                  height: '16px',
                  background: 'white',
                  border: '2px solid #e2e8f0',
                  borderBottom: 'none',
                  borderRight: 'none',
                  transform: 'translateX(-50%) rotate(45deg)'
                }} />
              )}
              
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '16px', color: '#1e293b' }}>
                ✏️ Edit Activity
              </h3>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#64748b', marginBottom: '4px' }}>
                  Activity Name
                </label>
                <input
                  type="text"
                  value={editTaskText}
                  onChange={(e) => setEditTaskText(e.target.value)}
                  style={{
                    ...inputStyle,
                    fontSize: '14px',
                    padding: '8px 12px'
                  }}
                  placeholder="What will you do?"
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#64748b', marginBottom: '4px' }}>
                  How Important?
                </label>
                <select
                  value={selectedTaskPriority}
                  onChange={(e) => setSelectedTaskPriority(e.target.value as 'high' | 'medium' | 'low')}
                  style={{
                    ...inputStyle,
                    fontSize: '14px',
                    padding: '8px 12px'
                  }}
                >
                  <option value="high">{isMobile ? '🔴 Very Important' : '🔴 Super Important'}</option>
                  <option value="medium">{isMobile ? '🟡 Important' : '🟡 Pretty Important'}</option>
                  <option value="low">{isMobile ? '🟢 Later' : '🟢 When I Have Time'}</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  onClick={handleCloseEditDialog}
                  style={{
                    background: '#f1f5f9',
                    color: '#64748b',
                    padding: isMobile ? '12px 20px' : '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: 'none',
                    cursor: 'pointer',
                    minHeight: isMobile ? '44px' : 'auto'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateTask}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    padding: isMobile ? '12px 20px' : '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: 'none',
                    cursor: 'pointer',
                    minHeight: isMobile ? '44px' : 'auto'
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <footer style={{
          marginTop: '40px',
          paddingTop: '24px',
          borderTop: '2px solid #e2e8f0',
          textAlign: 'center' as const,
          color: '#64748b',
          fontSize: isMobile ? '0.875rem' : '1rem'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '8px' }}>🌟</span>
            <strong style={{ color: '#3b82f6' }}>My Day Planner</strong>
            <span style={{ fontSize: '1.5rem', marginLeft: '8px' }}>🌟</span>
          </div>
          <p style={{ margin: '8px 0', fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
            Plan your day, achieve your dreams! 🚀
          </p>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '16px', 
            marginTop: '12px',
            fontSize: isMobile ? '0.75rem' : '0.875rem'
          }}>
            <span>📚 Study Smart</span>
            <span>⏰ Manage Time</span>
            <span>🎯 Reach Goals</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;