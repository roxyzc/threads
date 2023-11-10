import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config({ path: './.development.env' });

export default new DataSource({
  type: 'mysql',
  host: process.env.HOST_DATABASE,
  port: parseInt(process.env.PORT_DATABASE),
  username: process.env.USERNAME_DATABASE,
  password: process.env.PASSWORD_DATABASE,
  database: process.env.NAME_DATABASE,
  logging: true,
  migrations: [__dirname + '/src/app/migrations/*{.ts,.js}'],
  entities: [__dirname + '/src/app/entities/*.entity{.ts,.js}'],
});
