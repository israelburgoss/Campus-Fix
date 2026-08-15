import 'dotenv/config';

const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    database: process.env.MYSQL_DATABASE || 'campusfix',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/campusfix',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'campusfix_dev_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
  defaultPassword: process.env.DEFAULT_PASSWORD || 'Campus123!',
};

export default env;