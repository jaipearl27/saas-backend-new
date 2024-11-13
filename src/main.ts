import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const PORT = process.env.PORT ?? 3000


  // Set global prefix
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(new ValidationPipe()) //  global validations for body

  await app.listen(PORT);
  console.log(`process running on PORT ${PORT} ==================================== `)
}
bootstrap();
