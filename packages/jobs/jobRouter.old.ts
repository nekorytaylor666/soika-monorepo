import amqp, { Channel, Connection, ConsumeMessage } from "amqplib";
import { z } from "zod";

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
  connectionString: string,
  jobDefinitions: T
) {
  let connection: Connection;
  let channel: Channel;

  const initializeConnection = async () => {
    connection = await amqp.connect(connectionString);
    channel = await connection.createChannel();
    await channel.assertQueue(queueName, { durable: true });

    // Set up error handlers
    connection.on("error", handleConnectionError);
    channel.on("error", handleChannelError);
    channel.on("close", handleChannelClose);
  };

  const handleConnectionError = (error: any) => {
    console.error("RabbitMQ connection error:", error);
    // Attempt to reconnect
    setTimeout(initializeConnection, 5000);
  };

  const handleChannelError = (error: any) => {
    console.error("RabbitMQ channel error:", error);
  };

  const handleChannelClose = () => {
    console.warn("RabbitMQ channel closed");
    // Attempt to reopen the channel
    setTimeout(initializeConnection, 5000);
  };

  const router = Object.entries(jobDefinitions).reduce(
    (acc, [jobName, jobDef]) => {
      acc[jobName] = {
        emit: async (input: InferJobInput<typeof jobDef>) => {
          if (!channel || channel.closed) {
            await initializeConnection();
          }
          const validatedInput = jobDef.input.parse(input);
          await channel.sendToQueue(
            queueName,
            Buffer.from(JSON.stringify({ jobName, data: validatedInput }))
          );
        },
      };
      return acc;
    },
    {} as {
      [K in keyof T]: {
        emit: (input: InferJobInput<T[K]>) => Promise<void>;
      };
    }
  );

  const buildWorkers = async () => {
    const processMessage = async (msg: amqp.ConsumeMessage | null) => {
      if (!msg) return;

      try {
        const { jobName, data } = JSON.parse(msg.content.toString());
        const jobDef = jobDefinitions[jobName as keyof T];
        if (!jobDef) {
          console.error(`Unsupported job type: ${jobName}`);
          await safeNack(msg);
          return;
        }

        const parsedInput = jobDef.input.parse(data);
        await jobDef.handler(parsedInput);
        await safeAck(msg);
      } catch (error) {
        console.error(`Error processing job:`, error);
        await safeNack(msg);
      }
    };

    const safeAck = async (msg: amqp.ConsumeMessage) => {
      try {
        if (channel && !channel.closed) {
          await channel.ack(msg);
        }
      } catch (error) {
        console.error("Error acknowledging message:", error);
      }
    };

    const safeNack = async (msg: amqp.ConsumeMessage) => {
      try {
        if (channel && !channel.closed) {
          await channel.nack(msg);
        }
      } catch (error) {
        console.error("Error rejecting message:", error);
      }
    };

    const startConsuming = async () => {
      try {
        if (!channel || channel.closed) {
          await initializeConnection();
        }

        await channel.consume(queueName, processMessage);
      } catch (error) {
        console.error("Error starting consumer:", error);
        setTimeout(startConsuming, 5000);
      }
    };

    await startConsuming();
  };

  return {
    router,
    buildWorkers,
  };
}

// Usage example:
// const { router, buildWorkers } = createJobRouter('myQueue', 'amqp://localhost', {
//   processContract: defineJob(z.object({ contractId: z.string() }))
//     .handler(async (input) => {
//       console.log('Processing contract:', input.contractId);
//     }),
// });
//
// buildWorkers();
// router.processContract.emit({ contractId: '123' });
