import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateTaskDto } from './create-task.dto';
import { TasksService } from './tasks.service';
import { UpdateTaskDto } from './update-task.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  list() {
    return this.tasks.list();
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    if (id < 1) throw new BadRequestException('Invalid task id');
    return this.tasks.get(id);
  }

  @Post()
  create(@Body() input: CreateTaskDto) {
    return this.tasks.create(input);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() input: UpdateTaskDto) {
    if (id < 1) throw new BadRequestException('Invalid task id');
    if (
      input.title === undefined &&
      input.description === undefined &&
      input.priority === undefined &&
      input.status === undefined
    ) {
      throw new BadRequestException('No fields to update');
    }
    return this.tasks.update(id, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    if (id < 1) throw new BadRequestException('Invalid task id');
    await this.tasks.remove(id);
  }
}
