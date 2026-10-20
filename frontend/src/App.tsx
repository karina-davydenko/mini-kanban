import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

type Priority = 'low' | 'medium' | 'high';
type Status = 'new' | 'in_progress' | 'done';
type DialogMode = 'view' | 'edit' | 'delete';

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
const statusLabels: Record<Status, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  done: 'Готово',
};
const priorityLabels: Record<Priority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
};

export function App() {
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>('view');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('medium');
  const [editStatus, setEditStatus] = useState<Status>('new');
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;

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
      const created = (await response.json()) as Task;
      setTasks((current) => [created, ...current]);
      setTitle('');
      setDescription('');
      setPriority('medium');
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  function openTask(task: Task) {
    setSelectedTaskId(task.id);
    setDialogMode('view');
    setActionError(false);
  }

  function startEditing(task: Task) {
    setEditTitle(task.title);
    setEditDescription(task.description ?? '');
    setEditPriority(task.priority);
    setEditStatus(task.status);
    setDialogMode('edit');
    setActionError(false);
  }

  async function updateTask(id: number, changes: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'status'>>) {
    if (busyTaskId !== null) return false;
    setBusyTaskId(id);
    setActionError(false);
    try {
      const response = await fetch(`${apiUrl}/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
      if (!response.ok) throw new Error('Could not update task');
      const updated = (await response.json()) as Task;
      setTasks((current) => current.map((task) => task.id === id ? updated : task));
      return true;
    } catch {
      setActionError(true);
      return false;
    } finally {
      setBusyTaskId(null);
    }
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTask || !editTitle.trim()) return;
    const updated = await updateTask(selectedTask.id, {
      title: editTitle,
      description: editDescription,
      priority: editPriority,
      status: editStatus,
    });
    if (updated) setDialogMode('view');
  }

  async function deleteTask() {
    if (!selectedTask || busyTaskId !== null) return;
    const id = selectedTask.id;
    setBusyTaskId(id);
    setActionError(false);
    try {
      const response = await fetch(`${apiUrl}/tasks/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Could not delete task');
      setTasks((current) => current.filter((task) => task.id !== id));
      setSelectedTaskId(null);
    } catch {
      setActionError(true);
    } finally {
      setBusyTaskId(null);
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
            inputRef={titleInputRef}
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

      {actionError && !selectedTask && (
        <Alert severity="error" sx={{ mb: 2 }}>Не удалось изменить задачу. Попробуйте ещё раз.</Alert>
      )}
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
        <>
          {tasks.length === 0 && (
            <Stack spacing={1} alignItems="flex-start" sx={{ mb: 2 }}>
              <Typography>Задач пока нет. Создайте первую задачу, чтобы начать.</Typography>
              <Button variant="outlined" onClick={() => titleInputRef.current?.focus()}>
                Добавить задачу
              </Button>
            </Stack>
          )}
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
                        <TextField select size="small" label={`Колонка задачи «${task.title}»`} value={task.status}
                          onChange={(event) => void updateTask(task.id, { status: event.target.value as Status })}
                          disabled={busyTaskId !== null} fullWidth sx={{ mt: 2 }}>
                          {columns.map((option) => (
                            <MenuItem key={option.status} value={option.status}>{option.title}</MenuItem>
                          ))}
                        </TextField>
                      </CardContent>
                      <CardActions>
                        <Button size="small" onClick={() => openTask(task)}>Открыть</Button>
                      </CardActions>
                    </Card>
                  ))}
                </Stack>
              </Box>
            );
          })}
          </Box>
        </>
      )}

      <Dialog open={selectedTask !== null} onClose={() => busyTaskId === null && setSelectedTaskId(null)}
        fullWidth maxWidth="sm">
        {selectedTask && (
          <>
            <DialogTitle>
              {dialogMode === 'delete' ? 'Удалить задачу?' : dialogMode === 'edit' ? 'Редактировать задачу' : selectedTask.title}
            </DialogTitle>
            {dialogMode === 'edit' ? (
              <Box component="form" onSubmit={saveEdit}>
                <DialogContent>
                  <Stack spacing={2} sx={{ pt: 1 }}>
                    <TextField label="Название" value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)} required
                      inputProps={{ maxLength: 160 }} fullWidth />
                    <TextField label="Описание" value={editDescription}
                      onChange={(event) => setEditDescription(event.target.value)} multiline minRows={3}
                      inputProps={{ maxLength: 4000 }} fullWidth />
                    <TextField select label="Приоритет" value={editPriority}
                      onChange={(event) => setEditPriority(event.target.value as Priority)} fullWidth>
                      {Object.entries(priorityLabels).map(([value, label]) => (
                        <MenuItem key={value} value={value}>{label}</MenuItem>
                      ))}
                    </TextField>
                    <TextField select label="Колонка" value={editStatus}
                      onChange={(event) => setEditStatus(event.target.value as Status)} fullWidth>
                      {columns.map((option) => (
                        <MenuItem key={option.status} value={option.status}>{option.title}</MenuItem>
                      ))}
                    </TextField>
                    {actionError && <Alert severity="error">Не удалось сохранить изменения.</Alert>}
                  </Stack>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setDialogMode('view')} disabled={busyTaskId !== null}>Отмена</Button>
                  <Button type="submit" variant="contained" disabled={busyTaskId !== null || !editTitle.trim()}>
                    Сохранить
                  </Button>
                </DialogActions>
              </Box>
            ) : dialogMode === 'delete' ? (
              <>
                <DialogContent>
                  <Typography>Задача «{selectedTask.title}» будет удалена.</Typography>
                  {actionError && <Alert severity="error" sx={{ mt: 2 }}>Не удалось удалить задачу.</Alert>}
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setDialogMode('view')} disabled={busyTaskId !== null}>Отмена</Button>
                  <Button color="error" variant="contained" onClick={() => void deleteTask()}
                    disabled={busyTaskId !== null}>Удалить</Button>
                </DialogActions>
              </>
            ) : (
              <>
                <DialogContent>
                  <Stack spacing={1}>
                    <Typography>Приоритет: {priorityLabels[selectedTask.priority]}</Typography>
                    <Typography>Колонка: {statusLabels[selectedTask.status]}</Typography>
                    <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                      {selectedTask.description || 'Описание не указано'}
                    </Typography>
                  </Stack>
                </DialogContent>
                <DialogActions>
                  <Button color="error" onClick={() => { setActionError(false); setDialogMode('delete'); }}>Удалить</Button>
                  <Button onClick={() => startEditing(selectedTask)}>Редактировать</Button>
                  <Button onClick={() => setSelectedTaskId(null)}>Закрыть</Button>
                </DialogActions>
              </>
            )}
          </>
        )}
      </Dialog>
    </Container>
  );
}
