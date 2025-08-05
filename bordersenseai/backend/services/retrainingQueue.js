// This is a placeholder. In production, hook into RabbitMQ / BullMQ / Kafka / etc.

export const enqueueRetrainingJob = async (feedbackId) => {
  // e.g., publish to Redis queue, Kafka topic, or mark flag for batch worker to pick up.
  // For now, just log; real implementation should be idempotent and durable.
  console.log(`Enqueueing feedback ${feedbackId} for retraining processing`);
  // Example: await someQueue.add('retrain', { feedbackId });
};
