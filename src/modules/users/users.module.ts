import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../../common/common.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { User } from '../../entities/user.entity';
import { SensitiveChangeCode } from '../../entities/sensitive-change-code.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, SensitiveChangeCode]),
    CommonModule,
    ApiKeysModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
