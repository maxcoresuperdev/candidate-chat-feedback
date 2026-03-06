import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwt: JwtService,
  ) {}

  async register(emailRaw: string, password: string) {
    const email = emailRaw.toLowerCase().trim();
    const existing = await this.userModel.findOne({ email }).lean();
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.userModel.create({ email, passwordHash });

    const token = await this.signToken(user.id, user.email);
    return { token };
  }

  async login(emailRaw: string, password: string) {
    const email = emailRaw.toLowerCase().trim();
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.signToken(user.id, user.email);
    return { token };
  }

  async me(userId: string) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }
    return { id: user._id.toString(), email: user.email };
  }

  private async signToken(userId: string, email: string) {
    return this.jwt.signAsync({ sub: userId, email });
  }
}
