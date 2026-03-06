import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ScoringService } from '../scoring/scoring.service';
import { Session, SessionDocument } from './schemas/session.schema';

const DEFAULT_QUESTIONS: string[] = [
  'Tell me about yourself and what you are looking for in your next role.',
  'Describe a challenging technical problem you solved recently. What was your approach?',
  'How do you handle disagreement in a team when discussing architecture or priorities?',
  'Explain a time you improved an existing system without breaking users. What did you change?',
  'What does good communication look like in a remote team?'
];

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(Session.name) private readonly sessionModel: Model<SessionDocument>,
    private readonly scoring: ScoringService,
  ) {}

  async createSession(userId: string) {
    const uid = new Types.ObjectId(userId);
    const answers = DEFAULT_QUESTIONS.map(() => '');
    const created = await this.sessionModel.create({
      userId: uid,
      questions: DEFAULT_QUESTIONS,
      answers,
      status: 'in_progress',
    });

    return this.toDto(created);
  }

  async listSessions(userId: string) {
    const uid = new Types.ObjectId(userId);
    const sessions = await this.sessionModel
      .find({ userId: uid })
      .sort({ createdAt: -1 })
      .lean();

    return sessions.map((s) => ({
      id: s._id.toString(),
      status: s.status,
      createdAt: s.createdAt,
      submittedAt: s.submittedAt ?? null,
      hasFeedback: Boolean(s.feedback),
    }));
  }

  async getSession(userId: string, sessionId: string) {
    const s = await this.sessionModel.findById(sessionId).lean();
    if (!s) throw new NotFoundException('Session not found');
    if (s.userId.toString() !== userId) throw new ForbiddenException();

    return {
      id: s._id.toString(),
      status: s.status,
      questions: s.questions,
      answers: s.answers,
      feedback: s.feedback ?? null,
      createdAt: s.createdAt,
      submittedAt: s.submittedAt ?? null,
    };
  }

  async updateAnswers(userId: string, sessionId: string, answers: string[]) {
    const session = await this.sessionModel.findById(sessionId);
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId.toString() !== userId) throw new ForbiddenException();
    if (session.status === 'submitted') throw new BadRequestException('Session already submitted');
    if (answers.length !== session.questions.length) throw new BadRequestException('Answers must match question count');

    session.answers = answers.map((a) => (a ?? '').toString());
    await session.save();
    return this.toDto(session);
  }

  async submit(userId: string, sessionId: string) {
    const session = await this.sessionModel.findById(sessionId);
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId.toString() !== userId) throw new ForbiddenException();
    if (session.status === 'submitted') return this.toDto(session);

    const cleaned = session.answers.map((a) => a.trim());
    const missing = cleaned.some((a) => a.length === 0);
    if (missing) {
      throw new BadRequestException('Please answer all questions before submitting');
    }

    const feedback = this.scoring.analyze(session.questions, cleaned);

    session.status = 'submitted';
    session.submittedAt = new Date();
    session.feedback = feedback;
    session.answers = cleaned;

    await session.save();
    return this.toDto(session);
  }

  private toDto(session: SessionDocument) {
    return {
      id: session._id.toString(),
      status: session.status,
      questions: session.questions,
      answers: session.answers,
      feedback: session.feedback ?? null,
      createdAt: (session as any).createdAt,
      submittedAt: session.submittedAt ?? null,
    };
  }
}
