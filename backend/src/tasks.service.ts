import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './create-task.dto';
import { PrismaService } from './prisma.service';
import { UpdateTaskDto } from './update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.task.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  async get(id: number) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  create(input: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        title: input.title,
        description: input.description,
        priority: input.priority,
      },
    });
  }

  async update(id: number, input: UpdateTaskDto) {
    await this.get(id);
    return this.prisma.task.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.status !== undefined && { status: input.status }),
      },
    });
  }

  async remove(id: number) {
    await this.get(id);
    await this.prisma.task.delete({ where: { id } });
  }
}
