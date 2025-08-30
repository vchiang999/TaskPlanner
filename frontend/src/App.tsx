import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  createTheme,
  CssBaseline,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  ThemeProvider,
  Toolbar,
  Typography,
} from '@mui/material';

// A simple interface to define the shape of a task object
interface Task {
  id: number;
  text: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
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
      default: '#f5f5f5', // Light gray
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
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
};

function App() {
  // State to hold the list of tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  // State to hold the text of the new task being entered
  const [newTaskText, setNewTaskText] = useState('');
  // State to hold the priority of the new task
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');

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

    const updatedTasks = [...tasks, newTask]
      .sort((a, b) => {
        const priorityOrder = { high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .map((task, index) => {
        const startTime = new Date();
        startTime.setHours(9, 0, 0, 0); // Start at 9:00 AM
        startTime.setMinutes(startTime.getMinutes() + index * 30); // Each task takes 30 minutes

        const endTime = new Date(startTime.getTime());
        endTime.setMinutes(endTime.getMinutes() + 30);

        return { ...task, startTime: formatTime(startTime), endTime: formatTime(endTime) };
      });

    setTasks(updatedTasks as Task[]); // Add the new task and sort the list
    setNewTaskText(''); // Clear the input field
    setNewTaskPriority('medium'); // Reset the priority dropdown
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
          Helping kids organize their day!
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
        <Box>
          {tasks.map((task) => (
            <Card key={task.id} sx={{ mb: 2, backgroundColor: task.priority === 'high' ? '#ffcdd2' : task.priority === 'medium' ? '#fff9c4' : '#c8e6c9' }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1">{task.text}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {task.startTime} - {task.endTime}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
