import { Queue, Worker, type Job, type JobsOptions } from "bullmq";
import type { z } from "zod";

type JobHandler<T> = (input: T) => Promise<void>;

type JobDefinition<T extends z.ZodType> = {
  input: T;
  handler: JobHandler<z.infer<T>>;
};

type InferJobInput<T> = T extends JobDefinition<infer U> ? z.infer<U> : never;

type JobRouterDefinition = {
  [K: string]: JobDefinition<any>;
};

export function defineJob<T extends z.ZodType>(input: T) {
  return {
    handler: (handler: JobHandler<z.infer<T>>): JobDefinition<T> => ({
      input,
      handler,
    }),
  };
}

export function createJobRouter<T extends JobRouterDefinition>(
  queueName: string,
  connection: any,
  jobDefinitions: T
) {
  const queue = new Queue(queueName, { connection });

  const router = Object.entries(jobDefinitions).reduce(
    (acc, [jobName, jobDef]) => {
      acc[jobName] = {
        emit: async (
          input: InferJobInput<typeof jobDef>,
          options?: JobsOptions
        ) => {
          const validatedInput = jobDef.input.parse(input);
          await queue.add(jobName, validatedInput, options);
        },
      };
      return acc;
    },
    {} as {
      [K in keyof T]: {
        emit: (
          input: InferJobInput<T[K]>,
          options?: JobsOptions
        ) => Promise<void>;
      };
    }
  );

  const buildWorkers = () => {
    return new Worker(
      queueName,
      async (job: Job) => {
        const jobDef = jobDefinitions[job.name as keyof T];
        if (!jobDef) {
          throw new Error(`Unsupported job type: ${job.name}`);
        }
        const parsedInput = jobDef.input.parse(job.data);
        await jobDef.handler(parsedInput);
      },
      { connection, concurrency: 10 }
    );
  };

  return {
    router,
    buildWorkers,
    queue,
  };
}

// These would cause TypeScript errors:
// router.processContract.emit({ wrongField: '123' });
// router.createLot.emit({ lot: 123 });
// router.sendWelcomeEmail.emit({ email: 'not-an-email' });
// router.processContract.emit({ contractId: '123' }, { wrongOption: true });
