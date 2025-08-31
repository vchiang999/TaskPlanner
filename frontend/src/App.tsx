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

// Helper function to format time
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-GB', { hour: 'numeric', minute: 'numeric', hour12: true });
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
  
  // Break time and schedule settings
  const [includeBreaks, setIncludeBreaks] = useState(true);
  const [breakDuration, setBreakDuration] = useState(10);
  const [taskDuration, setTaskDuration] = useState(30);
  const [tasksPerBreak, setTasksPerBreak] = useState(2);
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(16);
  const [isSchoolDay, setIsSchoolDay] = useState(false);
  
  // Warning states
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [suggestedTaskDuration, setSuggestedTaskDuration] = useState(30);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle school day toggle
  useEffect(() => {
    if (isSchoolDay) {
      setStartHour(16); // 4 PM
      setEndHour(18);   // 6 PM
    } else {
      setStartHour(9);  // 9 AM
      setEndHour(16);   // 4 PM
    }
  }, [isSchoolDay]);

  const recalculateSchedule = (currentTasks: Omit<Task, 'startTime' | 'endTime'>[]) => {
    const actualTasks = currentTasks.filter(t => t.priority !== 'break');
    const tasksWithBreaks: Omit<Task, 'startTime' | 'endTime'>[] = [];
    const breakEmojis = ['☕', '🎮', '🍎', '🧃', '⚽', '🎨'];
    
    // Fixed break insertion logic
    actualTasks.forEach((task, index) => {
      tasksWithBreaks.push(task);
      
      // Add break after every 'tasksPerBreak' tasks (but not after the last task)
      if (includeBreaks && 
          index < actualTasks.length - 1 && 
          (index + 1) % tasksPerBreak === 0) {
        const breakIndex = Math.floor(index / tasksPerBreak);
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
    currentTime.setHours(startHour, 0, 0, 0);

    const finalTasks = tasksWithBreaks.map((task) => {
      const duration = task.priority === 'break' ? breakDuration : taskDuration;
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

  // Check time constraints whenever tasks or settings change
  useEffect(() => {
    const actualTasks = tasks.filter(t => t.priority !== 'break');
    if (actualTasks.length > 0) {
      const numTasks = actualTasks.length;
      const availableMinutes = (endHour - startHour) * 60;
      const numBreaks = includeBreaks ? Math.floor((numTasks - 1) / tasksPerBreak) : 0;
      const totalMinutes = (numTasks * taskDuration) + (numBreaks * breakDuration);
      
      const fits = totalMinutes <= availableMinutes;
      const suggestedDuration = numTasks > 0 ? roundToNearest10((availableMinutes - (numBreaks * breakDuration)) / numTasks) : taskDuration;
      
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
    const sortedTasks = [...currentTasksWithoutBreaks, newTask].sort((a, b) => {
      const priorityOrder = { high: 1, medium: 2, low: 3, break: 4 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    setTasks(recalculateSchedule(sortedTasks));
    setNewTaskText('');
    setNewTaskPriority('medium');
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

  const handleOpenEditDialog = (task: Task) => {
    setSelectedTask(task);
    setSelectedTaskPriority(task.priority as 'high' | 'medium' | 'low');
    setEditTaskText(task.text);
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedTask(null);
    setEditTaskText('');
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

      const sortedTasks = updatedTasks.filter(t => t.priority !== 'break').sort((a, b) => {
        const priorityOrder = { high: 1, medium: 2, low: 3, break: 4 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      setTasks(recalculateSchedule(sortedTasks));
      handleCloseEditDialog();
    }
  };

  const handleSettingsChange = () => {
    const currentTasksWithoutBreaks = tasks.filter((task) => task.priority !== 'break');
    if (currentTasksWithoutBreaks.length > 0) {
      setTasks(recalculateSchedule(currentTasksWithoutBreaks));
    }
  };

  const handleAcceptSuggestedDuration = () => {
    setTaskDuration(suggestedTaskDuration);
    setShowTimeWarning(false);
    setTimeout(handleSettingsChange, 0);
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
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%)',
    fontFamily: "'Poppins', 'Comic Sans MS', cursive, sans-serif",
    color: '#334155',
    padding: '16px'
  };

  const mainCardStyle = {
    background: 'white',
    borderRadius: '24px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    padding: '32px',
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const headerStyle = {
    textAlign: 'center' as const,
    marginBottom: '32px'
  };

  const titleStyle = {
    fontSize: '3rem',
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: '8px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
  };

  const subtitleStyle = {
    fontSize: '1.25rem',
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
    padding: '24px',
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
            🌟 My Daily Adventure Planner 🌟
          </h1>
          <p style={subtitleStyle} className="text-xl text-slate-600">
            Plan your awesome day and make it amazing!
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

        {/* Two Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Task Input */}
          <div style={columnStyle} className="bg-slate-50 p-6 rounded-lg">
            <h2 style={{ fontSize: '1.875rem', fontWeight: '600', marginBottom: '16px', color: '#1e293b' }} className="text-3xl font-semibold mb-4">
              ✨ What's Your Next Adventure?
            </h2>
            
            <form onSubmit={handleAddTask} style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
              <input
                type="text"
                placeholder="What fun thing will you do? 🤔"
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
                <option value="medium">🟡 Pretty Important</option>
                <option value="high">🔴 Super Important</option>
                <option value="low">🟢 When I Have Time</option>
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
                <span>Add to My Day!</span>
              </button>
            </form>

            {/* School Day Toggle */}
            <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '24px', marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.125rem', fontWeight: '500', marginBottom: '16px' }}>
                <input
                  type="checkbox"
                  checked={isSchoolDay}
                  onChange={(e) => setIsSchoolDay(e.target.checked)}
                  style={{ width: '20px', height: '20px', accentColor: '#3b82f6' }}
                />
                <GraduationCap size={24} />
                Is this a school day?
              </label>
              <div style={{ 
                background: '#dbeafe', 
                padding: '12px', 
                borderRadius: '8px', 
                fontSize: '0.875rem', 
                color: '#1e40af',
                border: '1px solid #93c5fd'
              }}>
                📚 <strong>School day:</strong> Plan activities from 4 PM to 6 PM (after school!)
                <br />
                🏠 <strong>Free day:</strong> Plan activities from 9 AM to 4 PM (whole day fun!)
              </div>
            </div>

            {/* Day Schedule Settings */}
            <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '24px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '16px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={24} />
                My Day Schedule
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '1rem', fontWeight: '500', color: '#334155', marginBottom: '8px' }}>
                    Start my day at
                  </label>
                  <select
                    value={startHour}
                    onChange={(e) => {
                      setStartHour(Number(e.target.value));
                      setTimeout(handleSettingsChange, 0);
                    }}
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
                  <label style={{ display: 'block', fontSize: '1rem', fontWeight: '500', color: '#334155', marginBottom: '8px' }}>
                    Finish my day at
                  </label>
                  <select
                    value={endHour}
                    onChange={(e) => {
                      setEndHour(Number(e.target.value));
                      setTimeout(handleSettingsChange, 0);
                    }}
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
            </div>

            {/* Break Time Settings */}
            <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '24px' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '16px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={24} />
                Fun Break Settings
              </h3>
              
              <div style={{ display: 'grid', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.125rem', fontWeight: '500' }}>
                  <input
                    type="checkbox"
                    checked={includeBreaks}
                    onChange={(e) => {
                      setIncludeBreaks(e.target.checked);
                      setTimeout(handleSettingsChange, 0);
                    }}
                    style={{ width: '20px', height: '20px', accentColor: '#3b82f6' }}
                  />
                  I want fun breaks!
                </label>

                {includeBreaks && (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '1rem', fontWeight: '500', color: '#334155', marginBottom: '8px' }}>
                        Activities before each break
                      </label>
                      <select
                        value={tasksPerBreak}
                        onChange={(e) => {
                          setTasksPerBreak(Number(e.target.value));
                          setTimeout(handleSettingsChange, 0);
                        }}
                        style={inputStyle}
                      >
                        <option value={1}>1 activity</option>
                        <option value={2}>2 activities</option>
                        <option value={3}>3 activities</option>
                        <option value={4}>4 activities</option>
                        <option value={5}>5 activities</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '1rem', fontWeight: '500', color: '#334155', marginBottom: '8px' }}>
                        How long should breaks be?
                      </label>
                      <select
                        value={breakDuration}
                        onChange={(e) => {
                          setBreakDuration(Number(e.target.value));
                          setTimeout(handleSettingsChange, 0);
                        }}
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
                      <label style={{ display: 'block', fontSize: '1rem', fontWeight: '500', color: '#334155', marginBottom: '8px' }}>
                        How long for each activity?
                      </label>
                      <select
                        value={taskDuration}
                        onChange={(e) => {
                          setTaskDuration(Number(e.target.value));
                          setTimeout(handleSettingsChange, 0);
                        }}
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
                  padding: '12px', 
                  borderRadius: '8px', 
                  fontSize: '0.875rem', 
                  color: '#1e40af',
                  border: '1px solid #93c5fd'
                }}>
                  🎉 <strong>Fun fact:</strong> You'll get a break after every {tasksPerBreak} activit{tasksPerBreak > 1 ? 'ies' : 'y'} to recharge!
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Timetable */}
          <div style={columnStyle} className="bg-slate-50 p-6 rounded-lg">
            <h2 style={{ fontSize: '1.875rem', fontWeight: '600', marginBottom: '16px', color: '#1e293b' }} className="text-3xl font-semibold mb-4">
              📅 My Awesome Day Plan
            </h2>
            
            {tasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎯</div>
                <p style={{ fontSize: '1.125rem' }}>Ready to plan something awesome? Add your first activity!</p>
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

        {/* Inline Edit Dialog */}
        {editDialogOpen && selectedTask && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 50
          }} className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              width: '100%',
              maxWidth: '400px'
            }} className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '16px' }} className="text-2xl font-semibold mb-4">
                ✏️ Edit My Activity
              </h3>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '1.125rem', fontWeight: '500', color: '#334155', marginBottom: '8px' }}>
                  Activity Name
                </label>
                <input
                  type="text"
                  value={editTaskText}
                  onChange={(e) => setEditTaskText(e.target.value)}
                  style={inputStyle}
                  placeholder="What will you do?"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '1.125rem', fontWeight: '500', color: '#334155', marginBottom: '8px' }}>
                  How Important?
                </label>
                <select
                  value={selectedTaskPriority}
                  onChange={(e) => setSelectedTaskPriority(e.target.value as 'high' | 'medium' | 'low')}
                  style={inputStyle}
                  className="p-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300 w-full"
                >
                  <option value="high">🔴 Super Important</option>
                  <option value="medium">🟡 Pretty Important</option>
                  <option value="low">🟢 When I Have Time</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                <button
                  onClick={handleCloseEditDialog}
                  style={{
                    background: '#e2e8f0',
                    color: '#334155',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  className="bg-gray-300 text-slate-700 p-3 rounded-lg font-bold text-lg hover:bg-gray-400 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateTask}
                  style={buttonStyle}
                  className="bg-blue-500 text-white p-3 rounded-lg font-bold text-lg hover:bg-blue-600 transition-all duration-300"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;