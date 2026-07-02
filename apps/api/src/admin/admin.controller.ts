import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AdminService } from './admin.service';
import type { QuestionInput } from './admin.service';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin', 'program_sponsor')
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('overview')
  overview(@Query('days') days?: string) {
    return this.admin.overview(Number(days) || 30);
  }

  @Get('questions')
  questions(@Query('moduleId') moduleId?: string) {
    return this.admin.listQuestions(moduleId);
  }

  @Post('questions')
  createQuestion(@Body() body: QuestionInput) {
    return this.admin.createQuestion(body);
  }

  @Post('questions/import')
  importQuestions(@Body() body: { questions: QuestionInput[] }) {
    return this.admin.importQuestions(body.questions);
  }

  @Delete('questions/:id')
  deleteQuestion(@Param('id') id: string) {
    return this.admin.deleteQuestion(id);
  }
}
