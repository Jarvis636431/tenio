import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { AgentStreamEnvelope } from "./agent.types.js";

@Injectable()
export class AgentStreamService {
  private readonly streams = new Map<string, AgentStreamEnvelope[]>();

  createStream(events: AgentStreamEnvelope[]): string {
    const streamId = randomUUID();
    this.streams.set(streamId, events);
    return streamId;
  }

  getStream(streamId: string): AgentStreamEnvelope[] {
    return this.streams.get(streamId) ?? [];
  }

  deleteStream(streamId: string): void {
    this.streams.delete(streamId);
  }
}
