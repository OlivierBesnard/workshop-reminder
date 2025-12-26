import express from 'express';
import cors from 'cors';
import pool from './db';
import { MaintenanceTask, MaintenanceLog } from '../src/types/maintenance';

const app = express();

app.use(cors());
app.use(express.json());

// GET all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM maintenance_tasks ORDER BY next_due_date ASC'
    );
    res.json(result.rows as MaintenanceTask[]);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET active tasks
app.get('/api/tasks/active', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM maintenance_tasks WHERE is_active = true ORDER BY next_due_date ASC'
    );
    res.json(result.rows as MaintenanceTask[]);
  } catch (error) {
    console.error('Error fetching active tasks:', error);
    res.status(500).json({ error: 'Failed to fetch active tasks' });
  }
});

// GET maintenance logs
app.get('/api/logs', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        ml.id,
        ml.task_id,
        ml.completed_by,
        ml.notes,
        ml.completed_at,
        json_build_object(
          'id', mt.id,
          'title', mt.title,
          'description', mt.description,
          'frequency_days', mt.frequency_days,
          'is_active', mt.is_active,
          'next_due_date', mt.next_due_date,
          'created_at', mt.created_at,
          'updated_at', mt.updated_at
        ) as maintenance_tasks
      FROM maintenance_logs ml
      LEFT JOIN maintenance_tasks mt ON ml.task_id = mt.id
      ORDER BY ml.completed_at DESC
      LIMIT 100`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// POST complete task
app.post('/api/tasks/:id/complete', async (req, res) => {
  const { id } = req.params;
  const { completedBy, notes } = req.body;

  try {
    // Get the task
    const taskResult = await pool.query(
      'SELECT * FROM maintenance_tasks WHERE id = $1',
      [id]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskResult.rows[0] as MaintenanceTask;

    // Create log entry
    await pool.query(
      'INSERT INTO maintenance_logs (task_id, completed_by, notes) VALUES ($1, $2, $3)',
      [id, completedBy, notes || null]
    );

    // Calculate new due date
    const today = new Date();
    const newDueDate = new Date(today);
    newDueDate.setDate(newDueDate.getDate() + task.frequency_days);
    const dueDateStr = newDueDate.toISOString().split('T')[0];

    // Update task
    await pool.query(
      'UPDATE maintenance_tasks SET next_due_date = $1 WHERE id = $2',
      [dueDateStr, id]
    );

    res.json({ success: true, newDueDate: dueDateStr });
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

// POST create task
app.post('/api/tasks', async (req, res) => {
  const { title, description, frequency_days, is_active, next_due_date } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO maintenance_tasks (title, description, frequency_days, is_active, next_due_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description, frequency_days, is_active, next_due_date]
    );

    res.json(result.rows[0] as MaintenanceTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT update task
app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, frequency_days, is_active, next_due_date } = req.body;

  try {
    const result = await pool.query(
      `UPDATE maintenance_tasks 
       SET title = $1, description = $2, frequency_days = $3, is_active = $4, next_due_date = $5
       WHERE id = $6
       RETURNING *`,
      [title, description, frequency_days, is_active, next_due_date, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result.rows[0] as MaintenanceTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE task
app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Delete associated logs first
    await pool.query('DELETE FROM maintenance_logs WHERE task_id = $1', [id]);
    
    // Delete the task
    const result = await pool.query(
      'DELETE FROM maintenance_tasks WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

const PORT = process.env.API_PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
