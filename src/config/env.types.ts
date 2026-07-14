export type NodeEnvironment = 'dev' | 'test' | 'prod';

export interface AppConfig {
  app: {
    environment: NodeEnvironment;
    host: string;
    port: number;
    apiPrefix: string;
    corsOrigins: string[];
  };
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    ssl: boolean;
    logging: boolean;
    poolSize: number;
    migrationsRun: false;
    synchronize: false;
    testName: string;
  };
  compose: {
    postgres: {
      image: string;
      containerName: string;
      hostPort: number;
      containerPort: number;
      database: string;
      user: string;
      password: string;
      volumeName: string;
    };
    testPostgres: {
      containerName: string;
      hostPort: number;
      database: string;
      user: string;
      password: string;
      volumeName: string;
    };
    pgAdmin: {
      image: string;
      containerName: string;
      hostPort: number;
      defaultEmail: string;
      defaultPassword: string;
      volumeName: string;
    };
  };
  seed: {
    randomSeed: number;
    batchSize: number;
    allowDemoData: boolean;
  };
}
