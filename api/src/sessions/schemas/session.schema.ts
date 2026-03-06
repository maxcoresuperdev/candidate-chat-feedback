import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { FeedbackResult } from '../../scoring/scoring.service';

export type SessionDocument = HydratedDocument<Session>;

@Schema({ timestamps: true })
export class Session {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: [String], required: true })
  questions!: string[];

  @Prop({ type: [String], required: true })
  answers!: string[];

  @Prop({ type: String, required: true, enum: ['in_progress', 'submitted'], default: 'in_progress' })
  status!: 'in_progress' | 'submitted';

  @Prop({ type: Object, required: false })
  feedback?: FeedbackResult;

  @Prop({ type: Date, required: false })
  submittedAt?: Date;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
SessionSchema.index({ userId: 1, createdAt: -1 });
