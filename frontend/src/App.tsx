import React, { useState, useMemo } from 'react';
import {
  AppBar,
  Box,
  Button,
  Container,
  createTheme,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  ThemeProvider,
  Toolbar,
  Typography,
} from '@mui/material';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableTaskItem } from './SortableTaskItem';

// A simple interface to define the shape of a task object
export interface Task {
  id: number;
  text: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low' | 'break';
  startTime: string;
  endTime: string;
}

// A kid-friendly theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#ff9800', // Orange
    },
    secondary: {
      main: '#2196f3', // Blue
    },
    background: {
      default: '#f5f5f5', // Light grey
    },
  },
  typography: {
    fontFamily: 'Comic Sans MS, cursive, sans-serif',
    h1: {
      fontSize: '3rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
  },
});

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

  const scheduledTasks = useMemo(() => {
    let currentTime = new Date();
    currentTime.setHours(9, 0, 0, 0); // Start at 9:00 AM

    return tasks.map((task) => {
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
  }, [tasks]);

  // Handle form submission to add a new task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page reload
    if (newTaskText.trim() === '') return; // Ignore empty tasks

    const newTask: Omit<Task, 'startTime' | 'endTime'> = {
      id: Date.now(), // Use timestamp for a unique ID
      text: newTaskText,
      completed: false,
      priority: newTaskPriority,
    };

    const currentTasks = tasks.filter((task) => task.priority !== 'break');
    const sortedTasks = [...currentTasks, newTask].sort((a, b) => {
      const priorityOrder = { high: 1, medium: 2, low: 3, break: 4 }; // Added break to priorityOrder
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    const tasksWithBreaks: Omit<Task, 'startTime' | 'endTime'>[] = [];
    sortedTasks.forEach((task, index) => {
      tasksWithBreaks.push(task);
      if (index < sortedTasks.length - 1) {
        tasksWithBreaks.push({ id: Date.now() + index, text: 'Break Time', completed: false, priority: 'break' });
      }
    });

    setTasks(tasksWithBreaks as Task[]);
    setNewTaskText(''); // Clear the input field
    setNewTaskPriority('medium'); // Reset the priority dropdown
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

      const tasksWithBreaks: Omit<Task, 'startTime' | 'endTime'>[] = [];
      sortedTasks.forEach((task, index) => {
        tasksWithBreaks.push(task);
        if (index < sortedTasks.length - 1) {
          tasksWithBreaks.push({ id: Date.now() + index, text: 'Break Time', completed: false, priority: 'break' });
        }
      });

      setTasks(tasksWithBreaks as Task[]);
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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h1" component="div" sx={{ flexGrow: 1 }}>
            Daily Task Planner
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h2" component="p" gutterBottom>
          Helping kids organise their day!
        </Typography>
        <Box component="form" onSubmit={handleAddTask} sx={{ mb: 4 }}>
          <TextField
            label="What do you need to do?"
            variant="outlined"
            fullWidth
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="priority-select-label">Priority</InputLabel>
            <Select
              labelId="priority-select-label"
              id="priority-select"
              value={newTaskPriority}
              label="Priority"
              onChange={(e) => setNewTaskPriority(e.target.value as 'high' | 'medium' | 'low')}
            >
              <MenuItem value={'high'}>High</MenuItem>
              <MenuItem value={'medium'}>Medium</MenuItem>
              <MenuItem value={'low'}>Low</MenuItem>
            </Select>
          </FormControl>
          <Button type="submit" variant="contained" size="large">
            Add Task
          </Button>
        </Box>
        <Typography variant="h2" component="h2" gutterBottom>
          My Timetable
        </Typography>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <Box>
              {scheduledTasks.map((task) => (
                <SortableTaskItem key={task.id} task={task} handleOpenEditDialog={handleOpenEditDialog} />
              ))}
            </Box>
          </SortableContext>
        </DndContext>
        <Dialog open={editDialogOpen} onClose={handleCloseEditDialog}>
          <DialogTitle>Edit Task Priority</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id="edit-priority-select-label">Priority</InputLabel>
              <Select
                labelId="edit-priority-select-label"
                id="edit-priority-select"
                value={selectedTaskPriority}
                label="Priority"
                onChange={(e) => setSelectedTaskPriority(e.target.value as 'high' | 'medium' | 'low')}
              >
                <MenuItem value={'high'}>High</MenuItem>
                <MenuItem value={'medium'}>Medium</MenuItem>
                <MenuItem value={'low'}>Low</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditDialog}>Cancel</Button>
            <Button onClick={handleUpdateTaskPriority}>Save</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </ThemeProvider>
  );
}

export default App;
// Dummy comment to trigger CI/CD