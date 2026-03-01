import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApiKey } from '../../entities/api-key.entity';
import { User } from '../../entities/user.entity';
import { ApiKeysService } from './api-keys.service';
import { ApiKeysController } from './api-keys.controller';
import { AuthModule } from '../auth/auth.module';
import { JwtOrApiKeyGuard } from '../../common/guards/jwt-or-apikey.guard';

const jwtModule = JwtModule.registerAsync({
  imports: [ConfigModule],
  useFactory: (config: ConfigService) => ({
    secret: config.get('jwt.secret'),
    signOptions: { expiresIn: config.get('jwt.expiresIn') },
  }),
  inject: [ConfigService],
});

@Module({
  imports: [
    TypeOrmModule.forFeature([ApiKey, User]),
    AuthModule,
    jwtModule,
  ],
  controllers: [ApiKeysController],
  providers: [ApiKeysService, JwtOrApiKeyGuard],
  exports: [ApiKeysService, JwtOrApiKeyGuard, jwtModule, AuthModule],
})
export class ApiKeysModule {}
