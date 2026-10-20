import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './create-task.dto';
import { PrismaService } from './prisma.service';

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
}
