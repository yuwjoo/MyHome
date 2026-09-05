import { Module } from '@nestjs/common';
import { HttpResponseInterceptor } from './common/interceptors/httpResponse.interceptor';
import { HttpExceptionFilter } from './common/filters/httpException.filter';
import { initConfigModule } from './config';
import { initDatabaseModule } from './database';
import { CloudDiskModule } from './module/cloudDisk/cloudDisk.module';
import { ExpressModule } from './module/express/express.module';
import { SystemModule } from './module/system/system.module';
import { WeatherModule } from './module/weather/weather.module';
import { HttpAuthGuard } from './common/guards/httpAuth.guard';
import { OssModule } from './module/oss/oss.module';
import { MomentsModule } from './module/moments/moments.module';
import { RecipeModule } from './module/recipe/recipe.module';

@Module({
  imports: [
    initConfigModule(),
    initDatabaseModule(),
    SystemModule,
    WeatherModule,
    ExpressModule,
    CloudDiskModule,
    OssModule,
    MomentsModule,
    RecipeModule,
  ],
  providers: [
    {
      provide: 'APP_GUARD',
      useClass: HttpAuthGuard,
    },
    {
      provide: 'APP_INTERCEPTOR',
      useClass: HttpResponseInterceptor,
    },
    {
      provide: 'APP_FILTER',
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
