'use server';
import {Stage} from '@wdk-account-abstraction-ton/ui-core';
import {Cell} from '@ton/core';
import {bigintToAsciiString, clGetUint} from '@layerzerolabs/lz-ton-sdk-v2';
import {parseTonAddress} from './utils';
import {trimStart} from 'lodash';

const STAGE_URLS: Record<Stage, string> = {
  [Stage.SANDBOX]: 'https://testnet.toncenter.com/api/v3',
  [Stage.TESTNET]: 'https://testnet.toncenter.com/api/v3',
  [Stage.MAINNET]:
    'https://ton-mainnet.core.chainstack.com/8d84e91390521b3e86defd93cb74f934/api/v3',
};

interface TraceItem {
  tx_hash: string;
  in_msg_hash: string;
  children: TraceItem[];
}

interface MessageItem {
  hash: string;
  source: string; // Address in the form of 0:<hash>
  destination: string;
  message_content: {
    hash: string;
    body: string;
  };
}

interface TransactionItem {
  hash: string;
  in_msg: MessageItem;
  out_msgs: MessageItem[];
  description: {
    compute_ph: {
      skipped: boolean;
      reason?: string;
    };
  };
}

interface TraceResponse {
  trace_id: string;
  trace: TraceItem;
  is_incomplete: boolean;
  trace_info: {
    trace_state: string;
    messages: number;
    transactions: number;
    pending_messages: number;
    classification_state: string;
  };
  transactions_order: string[];
  transactions: Record<string, TransactionItem>; // Key is b64 hash
}

interface TracesResponse {
  traces: TraceResponse[];
}

interface TraceNode {
  tx_hash: string;
  children: TraceNode[];
}

interface TraceItem {
  trace: TraceItem;
  transactions: Record<string, any>;
}

const transformToTransactionTrace = (
  traceItem: TraceItem,
  node: TraceNode = traceItem.trace,
): any => {
  return {
    transaction: traceItem.transactions[node.tx_hash],
    children: node.children.map((child) => transformToTransactionTrace(traceItem, child)),
  };
};

export class TransactionTrace {
  loading = false;
  data?: TraceResponse;
  error?: Error;

  constructor(
    public readonly txHash: string,
    protected readonly apiKey: string,
    public readonly stage: Stage,
  ) {}

  async waitForComplete(timeoutInMs: number): Promise<void> {
    while (!this.isCompleted) {
      await this.update();
    }
  }

  async update() {
    if (this.isCompleted) {
      return;
    }

    this.loading = true;

    const tonAddress = parseTonAddress(this.txHash);

    return fetch(
      `${STAGE_URLS[this.stage]}/events?tx_hash=${trimStart(tonAddress.toRawString(), '0:')}`,
    )
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          this.data = data.events[0];
        }
      })
      .catch((error) => {
        console.log({error});
      })
      .finally(() => (this.loading = false));
  }

  get isCompleted() {
    return !!this.error || this.data?.trace_info.trace_state === 'complete';
  }

  get successful() {
    let foundEmitEvent = false;
    Object.values(this.data?.transactions ?? {}).forEach((transaction) => {
      // If it's skipped and no gas, it's possible that this is an event emitted.
      if (
        transaction.description.compute_ph.skipped &&
        transaction.description.compute_ph.reason === 'no_gas'
      ) {
        const cell = Cell.fromBase64(transaction.in_msg.message_content.body);
        const subtopic = bigintToAsciiString(clGetUint(cell.refs[0]!, 0, 256));
        if (subtopic === 'Channel::event::PACKET_SENT') {
          foundEmitEvent = true;
        }
      }
    });

    return foundEmitEvent;
  }
}
