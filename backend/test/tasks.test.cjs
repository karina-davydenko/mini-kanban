require('reflect-metadata');

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { BadRequestException, NotFoundException, ValidationPipe } = require('@nestjs/common');
const { CreateTaskDto } = require('../dist/create-task.dto');
const { UpdateTaskDto } = require('../dist/update-task.dto');
const { TasksController } = require('../dist/tasks.controller');
const { TasksService } = require('../dist/tasks.service');

const validation = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });
const body = (value, metatype) => validation.transform(value, { type: 'body', metatype });

test('creation rejects a title containing only whitespace', async () => {
  await assert.rejects(body({ title: '   ' }, CreateTaskDto), BadRequestException);
});

test('creation rejects an invalid priority and update rejects an invalid status', async () => {
  await assert.rejects(body({ title: 'Task', priority: 'urgent' }, CreateTaskDto), BadRequestException);
  await assert.rejects(body({ status: 'blocked' }, UpdateTaskDto), BadRequestException);
});

test('creation leaves status and omitted priority to database defaults', async () => {
  let data;
  const prisma = { task: { create: async (query) => {
    data = query.data;
    return { id: 1, ...data };
  } } };
  const service = new TasksService(prisma);
  const input = await body({ title: '  First task  ' }, CreateTaskDto);
  await service.create(input);

  assert.equal(data.title, 'First task');
  assert.equal(data.status, undefined);
  assert.equal(data.priority, undefined);
});

test('status update sends the chosen status to storage', async () => {
  let updateQuery;
  const prisma = { task: {
    findUnique: async () => ({ id: 3, status: 'new' }),
    update: async (query) => { updateQuery = query; return { id: 3, status: query.data.status }; },
  } };
  const service = new TasksService(prisma);
  const input = await body({ status: 'in_progress' }, UpdateTaskDto);
  const updated = await service.update(3, input);

  assert.deepEqual(updateQuery, { where: { id: 3 }, data: { status: 'in_progress' } });
  assert.equal(updated.status, 'in_progress');
});

test('missing task returns 404 for read and update', async () => {
  const service = new TasksService({ task: { findUnique: async () => null } });
  await assert.rejects(service.get(999), NotFoundException);
  await assert.rejects(service.update(999, { status: 'done' }), NotFoundException);
});

test('empty update and unknown fields are rejected', async () => {
  const controller = new TasksController({ update: () => assert.fail('should not update') });
  assert.throws(() => controller.update(1, {}), BadRequestException);
  await assert.rejects(body({ status: 'done', surprise: true }, UpdateTaskDto), BadRequestException);
});
