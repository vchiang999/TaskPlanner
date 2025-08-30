import React, { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableTaskItem } from './SortableTaskItem';
import { PlusCircle, Sparkles, Edit, XCircle } from 'lucide-react';

// A simple interface to define the shape of a task object
export interface Task {
  id: number;
  text: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low' | 'break';
  startTime: string;
  endTime: string;
  emoji?: string; // Optional emoji for the task
}

// Helper function to format time
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-GB', { hour: 'numeric', minute: 'numeric', hour12: true });
};

function App() {
  // State to hold the list of tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  // State to hold the text of the new task being entered
  const [newTaskText, setNewTaskText] = useState('');
  // State to hold the priority of the new task
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  // State to hold the emoji for the new task
  const [newTaskEmoji, setNewTaskEmoji] = useState('');
  // State for the edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskPriority, setSelectedTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const recalculateSchedule = (currentTasks: Omit<Task, 'startTime' | 'endTime'>[]) => {
    const tasksWithBreaks: Omit<Task, 'startTime' | 'endTime'>[] = [];
    currentTasks.forEach((task, index) => {
      tasksWithBreaks.push(task);
      if (index < currentTasks.length - 1) {
        tasksWithBreaks.push({ id: Date.now() + index, text: 'Break Time', completed: false, priority: 'break' });
      }
    });

    let currentTime = new Date();
    currentTime.setHours(9, 0, 0, 0); // Start at 9:00 AM

    const finalTasks = tasksWithBreaks.map((task) => {
      const taskDuration = task.priority === 'break' ? 15 : 30;
      const startTime = new Date(currentTime);
      const endTime = new Date(currentTime.getTime() + taskDuration * 60000);

      currentTime = endTime;

      return {
        ...task,
        startTime: formatTime(startTime),
        endTime: formatTime(endTime),
      };
    });
    return finalTasks;
  };

  // Handle form submission to add a new task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page reload
    if (newTaskText.trim() === '') return; // Ignore empty tasks

    const newTask: Omit<Task, 'startTime' | 'endTime'> = {
      id: Date.now(), // Use timestamp for a unique ID
      text: newTaskText,
      completed: false,
      priority: newTaskPriority,
      emoji: newTaskEmoji,
    };

    const currentTasksWithoutBreaks = tasks.filter((task) => task.priority !== 'break');
    const sortedTasks = [...currentTasksWithoutBreaks, newTask].sort((a, b) => {
      const priorityOrder = { high: 1, medium: 2, low: 3, break: 4 }; // Added break to priorityOrder
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    setTasks(recalculateSchedule(sortedTasks));
    setNewTaskText(''); // Clear the input field
    setNewTaskPriority('medium'); // Reset the priority dropdown
    setNewTaskEmoji(''); // Clear the emoji input
  };

  const handleOpenEditDialog = (task: Task) => {
    setSelectedTask(task);
    setSelectedTaskPriority(task.priority as 'high' | 'medium' | 'low');
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedTask(null);
  };

  const handleUpdateTaskPriority = () => {
    if (selectedTask) {
      const updatedTasks = tasks.map((task) =>
        task.id === selectedTask.id ? { ...task, priority: selectedTaskPriority } : task
      );

      const sortedTasks = updatedTasks.filter(t => t.priority !== 'break').sort((a, b) => {
        const priorityOrder = { high: 1, medium: 2, low: 3, break: 4 }; // Added break to priorityOrder
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      setTasks(recalculateSchedule(sortedTasks));
      handleCloseEditDialog();
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id);
      const newIndex = tasks.findIndex((task) => task.id === over.id);

      setTasks((tasks) => {
        return arrayMove(tasks, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="min-h-screen bg-sky-50 font-poppins text-slate-700 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-2xl">
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold text-blue-600 mb-2">Daily Task Planner</h1>
          <p className="text-xl text-slate-600">Helping kids organise their day!</p>
        </header>

        <section className="mb-8">
          <h2 className="text-3xl font-semibold mb-4">Add a New Task</h2>
          <form onSubmit={handleAddTask} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="What do you need to do?"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              className="p-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300"
            />
            <input
              type="text"
              placeholder="Choose an Emoji ✏️"
              value={newTaskEmoji}
              onChange={(e) => setNewTaskEmoji(e.target.value)}
              className="p-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300"
            />
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value as 'high' | 'medium' | 'low')}
              className="p-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300"
            >
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <button
              type="submit"
              className="bg-blue-500 text-white p-3 rounded-lg font-bold text-lg flex items-center justify-center space-x-2 hover:bg-blue-600 transition-all duration-300"
            >
              <PlusCircle size={24} />
              <span>Add Task</span>
            </button>
          </form>
        </section>

        <section className="bg-slate-50 p-6 rounded-lg">
          <h2 className="text-3xl font-semibold mb-4">My Timetable</h2>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <div>
                {tasks.map((task) => (
                  <SortableTaskItem key={task.id} task={task} handleOpenEditDialog={handleOpenEditDialog} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>

        {editDialogOpen && selectedTask && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-2xl font-semibold mb-4">Edit Task Priority</h3>
              <div className="mb-4">
                <label htmlFor="edit-priority-select" className="block text-lg font-medium text-slate-700 mb-2">Priority</label>
                <select
                  id="edit-priority-select"
                  value={selectedTaskPriority}
                  onChange={(e) => setSelectedTaskPriority(e.target.value as 'high' | 'medium' | 'low')}
                  className="p-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300 w-full"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={handleCloseEditDialog}
                  className="bg-gray-300 text-slate-700 p-3 rounded-lg font-bold text-lg hover:bg-gray-400 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateTaskPriority}
                  className="bg-blue-500 text-white p-3 rounded-lg font-bold text-lg hover:bg-blue-600 transition-all duration-300"
                >
                  Save
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
