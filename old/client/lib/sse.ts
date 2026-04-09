type CountStreamOptions = {
  signal: AbortSignal;
  intervalMs?: number;
  getCount: () => Promise<number>;
};

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const timeout = setTimeout(resolve, ms);
    const handleAbort = () => {
      clearTimeout(timeout);
      resolve();
    };
    signal.addEventListener("abort", handleAbort, { once: true });
  });

export const createCountSseStream = ({ signal, intervalMs = 5000, getCount }: CountStreamOptions) => {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({ type: "connected" });

      let lastCount: number | null = null;
      try {
        while (!signal.aborted) {
          const count = await getCount();
          if (count !== lastCount) {
            lastCount = count;
            send({ type: "count", count });
          }
          await wait(intervalMs, signal);
        }
      } catch (error) {
        if (!signal.aborted) {
          controller.error(error);
          return;
        }
      }

      controller.close();
    },
    cancel() {
      return;
    },
  });
};
