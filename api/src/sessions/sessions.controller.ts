import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SessionsService } from './sessions.service';
import { UpdateAnswersDto } from './dto/update-answers.dto';

@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Post()
  create(@CurrentUser() user: { userId: string }) {
    return this.sessions.createSession(user.userId);
  }

  @Get()
  list(@CurrentUser() user: { userId: string }) {
    return this.sessions.listSessions(user.userId);
  }

  @Get(':id')
  get(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.sessions.getSession(user.userId, id);
  }

  @Put(':id/answers')
  updateAnswers(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateAnswersDto,
  ) {
    return this.sessions.updateAnswers(user.userId, id, dto.answers);
  }

  @Post(':id/submit')
  submit(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.sessions.submit(user.userId, id);
  }
}
