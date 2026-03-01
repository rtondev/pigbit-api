import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../../entities/user.entity';
import { FailedLoginAttempt } from '../../entities/failed-login-attempt.entity';
import { PasswordResetCode } from '../../entities/password-reset-code.entity';
import { PendingRegistration } from '../../entities/pending-registration.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { CnpjLookupService } from './cnpj-lookup.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      FailedLoginAttempt,
      PasswordResetCode,
      PendingRegistration,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('jwt.secret'),
        signOptions: { expiresIn: config.get('jwt.expiresIn') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, CnpjLookupService],
  exports: [AuthService],
})
export class AuthModule {}
