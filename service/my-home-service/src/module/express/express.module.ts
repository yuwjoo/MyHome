import { Module } from '@nestjs/common';
import { ExpressService } from './express.service';
import { ExpressController } from './express.controller';

@Module({
  controllers: [ExpressController],
  providers: [ExpressService],
})
export class ExpressModule {}
