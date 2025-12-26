import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const app = express();
const port = process.env.PORT || 3565;

// PostgreSQL Pool
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Get all tasks
app.get('/api/tasks', async (req: Request, res: Response) => {
  try {
    const active = req.query.active === 'true';
    let query = 'SELECT * FROM public.maintenance_tasks';
    
    if (active) {
      query += ' WHERE is_active = true';
    }
    
    query += ' ORDER BY next_due_date ASC';
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get logs
app.get('/api/logs', async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        ml.*,
        mt.title as task_title
      FROM public.maintenance_logs ml
      JOIN public.maintenance_tasks mt ON ml.task_id = mt.id
      ORDER BY ml.completed_at DESC
      LIMIT 100
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Create task
app.post('/api/tasks', async (req: Request, res: Response) => {
  try {
    const { title, description, frequency_days, next_due_date, is_active } = req.body;
    
    const query = `
      INSERT INTO public.maintenance_tasks 
      (title, description, frequency_days, next_due_date, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      title,
      description || null,
      frequency_days || 7,
      next_due_date || new Date().toISOString().split('T')[0],
      is_active !== false
    ]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
app.put('/api/tasks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const allowedFields = ['title', 'description', 'frequency_days', 'next_due_date', 'is_active'];
    const fields = Object.keys(updates).filter(key => allowedFields.includes(key));
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
    const values = fields.map(field => updates[field]);
    values.push(id);
    
    const query = `
      UPDATE public.maintenance_tasks
      SET ${setClause}, updated_at = now()
      WHERE id = $${values.length}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Complete task
app.post('/api/tasks/complete', async (req: Request, res: Response) => {
  try {
    const { taskId, completedBy, notes, newDueDate } = req.body;
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert log entry
      await client.query(
        `INSERT INTO public.maintenance_logs 
         (task_id, completed_by, notes)
         VALUES ($1, $2, $3)`,
        [taskId, completedBy, notes || null]
      );
      
      // Update task
      const result = await client.query(
        `UPDATE public.maintenance_tasks
         SET next_due_date = $1, updated_at = now()
         WHERE id = $2
         RETURNING *`,
        [newDueDate, taskId]
      );
      
      await client.query('COMMIT');
      
      res.json({ task: result.rows[0] });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

// Delete task
app.delete('/api/tasks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const query = 'DELETE FROM public.maintenance_tasks WHERE id = $1';
    
    const result = await pool.query(query, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Error handling
app.use((err: any, req: Request, res: Response) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
