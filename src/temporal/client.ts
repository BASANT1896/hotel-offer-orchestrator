import { randomUUID } from 'node:crypto';
import { ApplicationFailure } from '@temporalio/common';
import { Client, Connection, WorkflowFailedError } from '@temporalio/client';
import { config } from '../config';
import { HttpError } from '../errors';
import type { HotelOffer } from '../domain/types';
import { retry } from '../utils/async';
import type { hotelOffersWorkflow } from './workflows';

export class WorkflowRunner {
  constructor(private readonly client: Client) {}

  async collectOffers(city: string): Promise<HotelOffer[]> {
    try {
      return await this.client.workflow.execute<typeof hotelOffersWorkflow>('hotelOffersWorkflow', {
        taskQueue: config.taskQueue,
        workflowId: `hotel-offers-${city}-${randomUUID()}`,
        workflowExecutionTimeout: '30 seconds',
        args: [city],
      });
    } catch (err) {
      if (
        err instanceof WorkflowFailedError &&
        err.cause instanceof ApplicationFailure &&
        err.cause.type === 'SuppliersUnavailable'
      ) {
        throw new HttpError(502, 'Both suppliers are unavailable');
      }
      throw err;
    }
  }

  ping() {
    return this.client.connection.workflowService.getSystemInfo({});
  }
}

export async function createWorkflowRunner(): Promise<WorkflowRunner> {
  const connection = await retry('temporal', () => Connection.connect({ address: config.temporalAddress }));
  return new WorkflowRunner(new Client({ connection, namespace: config.temporalNamespace }));
}
