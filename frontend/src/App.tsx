import React, { useState } from 'react';

// A simple interface to define the shape of a task object
interface Task {
  id: number;
  text: string;
  completed: boolean;
}

function App() {
  // State to hold the list of tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  // State to hold the text of the new task being entered
  const [newTaskText, setNewTaskText] = useState('');

  // Handle form submission to add a new task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page reload
    if (newTaskText.trim() === '') return; // Ignore empty tasks

    const newTask: Task = {
      id: Date.now(), // Use timestamp for a unique ID
      text: newTaskText,
      completed: false,
    };

    setTasks([...tasks, newTask]); // Add the new task to the list
    setNewTaskText(''); // Clear the input field
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Daily Task Planner</h1>
        <p>Helping kids organize their day!</p>
      </header>

      <main>
        <form onSubmit={handleAddTask} className="task-form">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="What do you need to do?"
            className="task-input"
          />
          <button type="submit" className="add-task-btn">Add Task</button>
        </form>

        <div className="task-list-container">
          <h2>My Tasks</h2>
          <ul className="task-list">
            {tasks.map(task => (
              <li key={task.id} className="task-item">
                {task.text}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}

export default App;