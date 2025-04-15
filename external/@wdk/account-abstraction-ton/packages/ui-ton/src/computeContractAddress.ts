import {toBigIntBE} from 'bigint-buffer';
import {beginCell, Cell} from '@ton/core';
import {
  AddressTypeLike,
  baseBuildClass,
  buildClass,
  emptyCell,
  emptyMap,
  emptyPOOO,
  nullObject,
} from '@layerzerolabs/lz-ton-sdk-v2';
import UlnArtifact from '@layerzerolabs/lz-ton-sdk-v2/artifacts/Uln.compiled.json';
import EndpointArtifact from '@layerzerolabs/lz-ton-sdk-v2/artifacts/Endpoint.compiled.json';
import UlnConnectionArtifact from '@layerzerolabs/lz-ton-sdk-v2/artifacts/UlnConnection.compiled.json';
import ChannelArtifact from '@layerzerolabs/lz-ton-sdk-v2/artifacts/Channel.compiled.json';

const TON_EID = 30343;
const ulnCode = Cell.fromHex(UlnArtifact.hex);
const endpointCode = Cell.fromHex(EndpointArtifact.hex);
const ulnConnectionCode = Cell.fromHex(UlnConnectionArtifact.hex);
const channelCode = Cell.fromHex(ChannelArtifact.hex);

export function computeContractAddress(code: Cell, storage: Cell): bigint {
  return toBigIntBE(beginCell().storeUint(6, 5).storeRef(code).storeRef(storage).endCell().hash());
}

export const initBaseStorage = (owner: AddressTypeLike) => {
  return baseBuildClass('BaseStorage', {
    owner,
    authenticated: false,
    initialized: false,
    initialStorage: emptyCell(),
  });
};

export const getUlnReceiveConfigDefault = () => {
  return buildClass('UlnReceiveConfig', {
    minCommitPacketGasNull: true,
    minCommitPacketGas: 0,
    confirmationsNull: true,
    confirmations: 0,
    requiredDVNsNull: true,
    requiredDVNs: emptyCell(),
    optionalDVNsNull: true,
    optionalDVNs: emptyCell(),
    optionalDVNThreshold: 0,
  });
};

export const getUlnSendConfigDefault = () => {
  return buildClass('UlnSendConfig', {
    workerQuoteGasLimit: 0,
    maxMessageBytes: 0,
    executorNull: true,
    executor: 0n,
    requiredDVNsNull: true,
    requiredDVNs: emptyCell(),
    optionalDVNsNull: true,
    optionalDVNs: emptyCell(),
    confirmationsNull: true,
    confirmations: 0,
  });
};

/**
 * Gets the UlnAddress from the UlnManager address
 * @param owner UlnManager address
 * @param dstEid
 */
export function computeTonUlnAddress(owner: bigint, dstEid: bigint): bigint {
  return computeContractAddress(
    ulnCode,
    buildClass('Uln', {
      baseStorage: initBaseStorage(owner),
      eid: TON_EID,
      dstEid: dstEid,
      defaultUlnReceiveConfig: getUlnReceiveConfigDefault(),
      defaultUlnSendConfig: getUlnSendConfigDefault(),
      connectionCode: emptyCell(),
      workerFeelibInfos: emptyMap(),
      treasuryFeeBps: 0,
      remainingWorkerSlots: 0,
      remainingAdminWorkerSlots: 0,
    }),
  );
}

export function computeTonEndpointAddress(owner: bigint, dstEid: bigint): bigint {
  return computeContractAddress(
    endpointCode,
    buildClass('Endpoint', {
      baseStorage: initBaseStorage(owner),
      eid: TON_EID,
      dstEid,
      msglibs: emptyMap(),
      numMsglibs: 0,
      channelCode: emptyCell(),
      channelStorageInit: nullObject(),
      defaultSendLibInfo: nullObject(),
      defaultReceiveLibInfo: nullObject(),
      defaultTimeoutReceiveLibInfo: nullObject(),
      defaultSendMsglibManager: 0n,
      defaultExpiry: 0,
    }),
  );
}

/**
 *
 * @param owner src OApp address
 * @param dstEid
 * @param dstOApp
 * @param ulnManagerAddress
 * @param ulnAddress Can be derived via computeTonUlnAddress
 */
export function computeTonUlnConnectionAddress(
  owner: bigint,
  dstEid: bigint,
  dstOApp: bigint,
  ulnManagerAddress: bigint,
  ulnAddress: bigint,
): bigint {
  return computeContractAddress(
    ulnConnectionCode,
    buildClass('UlnConnection', {
      baseStorage: initBaseStorage(ulnManagerAddress),
      path: {
        srcEid: TON_EID,
        dstEid,
        srcOApp: owner,
        dstOApp,
      },
      endpointAddress: 0n,
      channelAddress: 0n,
      ulnAddress: ulnAddress,
      UlnSendConfigOApp: getUlnSendConfigDefault(),
      UlnReceiveConfigOApp: getUlnReceiveConfigDefault(),
      hashLookups: emptyMap(),
      firstUnexecutedNonce: 1,
      commitPOOO: emptyCell(),
    }),
  );
}

/**
 *
 * @param owner The source OApp address
 * @param dstEid
 * @param dstOApp
 * @param controllerAddress
 * @param endpointAddress endpoint address. Can be derived via computeTonEndpointAddress
 */
export function computeTonChannelAddress(
  owner: bigint,
  dstEid: bigint,
  dstOApp: bigint,
  controllerAddress: bigint,
  endpointAddress: bigint,
): bigint {
  return computeContractAddress(
    channelCode,
    buildClass('Channel', {
      baseStorage: initBaseStorage(controllerAddress),
      path: {
        srcEid: TON_EID,
        dstEid,
        srcOApp: owner,
        dstOApp,
      },
      endpointAddress: endpointAddress,
      epConfigOApp: {
        isNull: true,
        sendMsglib: 0n,
        sendMsglibConnection: 0n,
        sendMsglibManager: 0n,
        receiveMsglib: 0n,
        receiveMsglibConnection: 0n,
        timeoutReceiveMsglib: 0n,
        timeoutReceiveMsglibConnection: 0n,
        timeoutReceiveMsglibExpiry: 0,
      },
      outboundNonce: 0,
      sendRequestQueue: emptyCell(),
      lastSendRequestId: 0,
      commitPOOO: emptyPOOO(),
      executePOOO: emptyPOOO(),
      executionQueue: emptyCell(),
      zroBalance: 0,
    }),
  );
}
