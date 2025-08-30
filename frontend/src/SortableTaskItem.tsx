import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, IconButton, Typography, Box } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { Task } from './App';

interface SortableTaskItemProps {
  task: Task;
  handleOpenEditDialog: (task: Task) => void;
}

export function SortableTaskItem({ task, handleOpenEditDialog }: SortableTaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card sx={{ mb: 2, backgroundColor: task.priority === 'high' ? '#ffcdd2' : task.priority === 'medium' ? '#fff9c4' : task.priority === 'low' ? '#c8e6c9' : '#e0e0e0' }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body1">{task.text}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
              {task.startTime} - {task.endTime}
            </Typography>
            {task.priority !== 'break' && (
              <IconButton onClick={() => handleOpenEditDialog(task)}>
                <EditIcon />
              </IconButton>
            )}
          </Box>
        </CardContent>
      </Card>
    </div>
  );
}
