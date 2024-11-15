import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const PORT = process.env.PORT ?? 3000

  app.use(cookieParser());

  // Set global prefix
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe()) //  global validations for all @Body()

  await app.listen(PORT);
  console.log(`process running on PORT ${PORT} ==================================== `)
}
bootstrap();
