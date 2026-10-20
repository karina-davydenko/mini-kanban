import { useEffect, useState, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

type Priority = 'low' | 'medium' | 'high';
type Status = 'new' | 'in_progress' | 'done';

type Task = {
  id: number;
  title: string;
  description: string | null;
  priority: Priority;
  status: Status;
};

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const columns: { status: Status; title: string }[] = [
  { status: 'new', title: 'Новая' },
  { status: 'in_progress', title: 'В работе' },
  { status: 'done', title: 'Готово' },
];
const priorityLabels: Record<Priority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
};

export function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');

  async function loadTasks() {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await fetch(`${apiUrl}/tasks`);
      if (!response.ok) throw new Error('Could not load tasks');
      setTasks((await response.json()) as Task[]);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTasks();
  }, []);

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || saving) return;

    setSaving(true);
    setSaveError(false);
    try {
      const response = await fetch(`${apiUrl}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, priority }),
      });
      if (!response.ok) throw new Error('Could not save task');
      setTitle('');
      setDescription('');
      setPriority('medium');
      await loadTasks();
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Мини-канбан
      </Typography>

      <Box component="form" onSubmit={createTask} sx={{ mb: 4 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Новая задача
        </Typography>
        <Stack spacing={2} sx={{ maxWidth: 560 }}>
          <TextField
            label="Название"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            inputProps={{ maxLength: 160 }}
            fullWidth
          />
          <TextField
            label="Описание"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            multiline
            minRows={2}
            inputProps={{ maxLength: 4000 }}
            fullWidth
          />
          <TextField
            select
            label="Приоритет"
            value={priority}
            onChange={(event) => setPriority(event.target.value as Priority)}
            fullWidth
          >
            {Object.entries(priorityLabels).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </TextField>
          {saveError && (
            <Alert severity="error">Не удалось сохранить задачу. Попробуйте ещё раз.</Alert>
          )}
          <Button type="submit" variant="contained" disabled={saving || !title.trim()}>
            {saving ? 'Сохраняем…' : 'Создать задачу'}
          </Button>
        </Stack>
      </Box>

      {loading ? (
        <Stack direction="row" spacing={2} alignItems="center">
          <CircularProgress size={24} />
          <Typography>Загружаем задачи…</Typography>
        </Stack>
      ) : loadError ? (
        <Alert severity="error" action={<Button onClick={() => void loadTasks()}>Повторить</Button>}>
          Не удалось загрузить задачи.
        </Alert>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
            gap: 2,
          }}
        >
          {columns.map((column) => {
            const columnTasks = tasks.filter((task) => task.status === column.status);
            return (
              <Box key={column.status} sx={{ minWidth: 0, p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  {column.title} · {columnTasks.length}
                </Typography>
                <Stack spacing={2}>
                  {columnTasks.length === 0 && (
                    <Typography color="text.secondary">Задач пока нет</Typography>
                  )}
                  {columnTasks.map((task) => (
                    <Card key={task.id} variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
                          {task.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Приоритет: {priorityLabels[task.priority]}
                        </Typography>
                        {task.description && (
                          <Typography sx={{ mt: 1, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                            {task.description}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
            );
          })}
        </Box>
      )}
    </Container>
  );
}
