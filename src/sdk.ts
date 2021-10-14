import { ethers, Signer, BigNumber } from "ethers";
import { keccak_256 } from 'js-sha3';
import { Buffer as Buffer } from "buffer/";
import { Provider as AbstractWeb3Provider } from "@ethersproject/abstract-provider"
import { Signer as Web3Signer } from "@ethersproject/abstract-signer"

export type HexAddress = string;

export type DomainString = string;

export interface ContentType {
  value: string;
  contentType: string;
}

declare abstract class Web3Provider extends AbstractWeb3Provider {
  abstract getSigner(): Promise<Web3Signer>;
}

export type DomainDetails = {
  name: string;
  label: string;
  labelhash: string;
  owner: string;
  ttl: string;
  nameResolver: string;

  content: string;
  contentType?: string;

  addrs: {
    key: string;
    value: string;
  }[];
  textRecords: {
    key: string;
    value: string;
  }[];
};

export const formatEther = ethers.utils.formatEther


let provider: Web3Provider;
let signer: Web3Signer;
let account: string;
let networkId: number;

let ens: any;
let resolver: any;
let registrar: any;

let ensAddr: string;
let resolverAddr: string;
let registrarAddr: string;

let coinTypes: any = {
  BTC: 0,
  ETH: 60,
  DOT: 354,
  KSM: 434,
};

const TEXT_RECORD_KEYS = ["email", "url", "avatar", "description", "notice", "keywords", "com.twitter", "com.github"];

const emptyAddress = "0x0000000000000000000000000000000000000000";
const emptyNode = "0x0000000000000000000000000000000000000000000000000000000000000000";

const tld = "dot";
const DAYS = 24 * 60 * 60;
const INFURA_URL = "https://rinkeby.infura.io/v3/75e0d27975114086be0463cf2597549e";


const ResolverAbi: any = [{"inputs":[{"internalType":"contract ENS","name":"_ens","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"node","type":"bytes32"},{"indexed":false,"internalType":"uint256","name":"coinType","type":"uint256"},{"indexed":false,"internalType":"bytes","name":"newAddress","type":"bytes"}],"name":"AddressChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"node","type":"bytes32"},{"indexed":false,"internalType":"bytes","name":"hash","type":"bytes"}],"name":"ContenthashChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"node","type":"bytes32"},{"indexed":true,"internalType":"string","name":"indexedKey","type":"string"},{"indexed":false,"internalType":"string","name":"key","type":"string"}],"name":"TextChanged","type":"event"},{"inputs":[{"internalType":"bytes32","name":"node","type":"bytes32"},{"internalType":"uint256","name":"coinType","type":"uint256"}],"name":"addr","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"node","type":"bytes32"}],"name":"contenthash","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"node","type":"bytes32"},{"internalType":"uint256","name":"coinType","type":"uint256"},{"internalType":"bytes","name":"a","type":"bytes"}],"name":"setAddr","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"node","type":"bytes32"},{"internalType":"bytes","name":"hash","type":"bytes"}],"name":"setContenthash","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"node","type":"bytes32"},{"internalType":"string","name":"key","type":"string"},{"internalType":"string","name":"value","type":"string"}],"name":"setText","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"node","type":"bytes32"},{"internalType":"string","name":"key","type":"string"}],"name":"text","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}]
const RegistrarAbi: any = [{"inputs":[{"internalType":"contract ENS","name":"_ens","type":"address"},{"internalType":"bytes32","name":"_baseNode","type":"bytes32"},{"internalType":"uint256[]","name":"_rentPrices","type":"uint256[]"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"controller","type":"address"}],"name":"ControllerAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"controller","type":"address"}],"name":"ControllerRemoved","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"string","name":"name","type":"string"},{"indexed":true,"internalType":"bytes32","name":"label","type":"bytes32"},{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":false,"internalType":"uint256","name":"cost","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"expires","type":"uint256"}],"name":"NameRegistered","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"string","name":"name","type":"string"},{"indexed":true,"internalType":"bytes32","name":"label","type":"bytes32"},{"indexed":false,"internalType":"uint256","name":"cost","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"expires","type":"uint256"}],"name":"NameRenewed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256[]","name":"prices","type":"uint256[]"}],"name":"RentPriceChanged","type":"event"},{"inputs":[],"name":"GRACE_PERIOD","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MIN_REGISTRATION_DURATION","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"controller","type":"address"}],"name":"addController","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"available","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"baseNode","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"commitment","type":"bytes32"}],"name":"commit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"controllers","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"ens","outputs":[{"internalType":"contract ENS","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"maxCommitmentAge","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"minCommitmentAge","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"nameExpires","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"name","type":"string"},{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"duration","type":"uint256"},{"internalType":"bytes","name":"code","type":"bytes"}],"name":"nameRedeem","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"string","name":"name","type":"string"},{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"duration","type":"uint256"}],"name":"nameRegister","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"name","type":"string"},{"internalType":"uint256","name":"expires","type":"uint256"},{"internalType":"uint256","name":"duration","type":"uint256"}],"name":"price","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"name","type":"string"},{"internalType":"uint256","name":"duration","type":"uint256"},{"internalType":"bytes","name":"code","type":"bytes"}],"name":"recoverKey","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"name","type":"string"},{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"duration","type":"uint256"}],"name":"register","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"controller","type":"address"}],"name":"removeController","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"name","type":"string"},{"internalType":"uint256","name":"duration","type":"uint256"}],"name":"renew","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"name","type":"string"},{"internalType":"uint256","name":"duration","type":"uint256"}],"name":"rentPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"rentPrices","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256[]","name":"_rentPrices","type":"uint256[]"}],"name":"setPrices","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"name","type":"string"}],"name":"valid","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"}]
const EnsAbi: any = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"node","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"label","type":"bytes32"},{"indexed":false,"internalType":"address","name":"owner","type":"address"}],"name":"NewOwner","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"node","type":"bytes32"},{"indexed":false,"internalType":"address","name":"resolver","type":"address"}],"name":"NewResolver","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"node","type":"bytes32"},{"indexed":false,"internalType":"string","name":"label","type":"string"},{"indexed":false,"internalType":"address","name":"owner","type":"address"}],"name":"NewSubnameOwner","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"node","type":"bytes32"},{"indexed":false,"internalType":"uint64","name":"ttl","type":"uint64"}],"name":"NewTTL","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"node","type":"bytes32"},{"indexed":false,"internalType":"address","name":"owner","type":"address"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"node","type":"bytes32"}],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"node","type":"bytes32"}],"name":"recordExists","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"node","type":"bytes32"}],"name":"resolver","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"node","type":"bytes32"},{"internalType":"address","name":"owner","type":"address"}],"name":"setOwner","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"node","type":"bytes32"},{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"resolver","type":"address"},{"internalType":"uint64","name":"ttl","type":"uint64"}],"name":"setRecord","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"node","type":"bytes32"},{"internalType":"address","name":"resolver","type":"address"}],"name":"setResolver","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"node","type":"bytes32"},{"internalType":"string","name":"name","type":"string"},{"internalType":"address","name":"owner","type":"address"}],"name":"setSubnameOwner","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"node","type":"bytes32"},{"internalType":"string","name":"name","type":"string"},{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"resolver","type":"address"},{"internalType":"uint64","name":"ttl","type":"uint64"}],"name":"setSubnameRecord","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"node","type":"bytes32"},{"internalType":"bytes32","name":"label","type":"bytes32"},{"internalType":"address","name":"owner","type":"address"}],"name":"setSubnodeOwner","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"node","type":"bytes32"},{"internalType":"bytes32","name":"label","type":"bytes32"},{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"resolver","type":"address"},{"internalType":"uint64","name":"ttl","type":"uint64"}],"name":"setSubnodeRecord","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"node","type":"bytes32"},{"internalType":"uint64","name":"ttl","type":"uint64"}],"name":"setTTL","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"node","type":"bytes32"}],"name":"ttl","outputs":[{"internalType":"uint64","name":"","type":"uint64"}],"stateMutability":"view","type":"function"}]

interface IContractAddrs {
  ens: string;
  resolver: string;
  registrar: string;
}

interface IContractAddrsMap {
  [index: number]: IContractAddrs;
}

export const ContractAddrMap: IContractAddrsMap = {
  1281: {
    ens: "0x3ed62137c5DB927cb137c26455969116BF0c23Cb",
    resolver: "0x962c0940d72E7Db6c9a5F81f1cA87D8DB2B82A23",
    registrar: "0x5CC307268a1393AB9A764A20DACE848AB8275c46"
  },
  4: {
    ens: "0x54CF46151d90b0a7880E4cBA8528dFBBeB718546",
    resolver: "0xFD1d96e2F2a039F7b41Bf09a9793E558D474e537",
    registrar: "0x3a2c8F8e6c7095B59EA18A34f009887B6B9bfCbb"
  }
}


export function sha3 (data: string) {
  return "0x" + keccak_256(data)
}

export function getNamehash (name: string) {
  let node = '0000000000000000000000000000000000000000000000000000000000000000'

  if (name) {
    let labels = name.split('.')

    for(let i = labels.length - 1; i >= 0; i--) {
      let labelSha = keccak_256(labels[i])
      node = keccak_256(Buffer.from(node + labelSha, 'hex'))
    }
  }

  return '0x' + node
}

export async function setProvider(providerOpt?: Web3Provider) {
  if (!!providerOpt) {
    provider = providerOpt
    signer = await provider.getSigner();
    account = await signer.getAddress();
  } else if (provider && account) {
    return
  } else if (!!(window as any) && typeof (window as any).ethereum !== "undefined") {
    // 调用窗口, 登录账户
    await (window as any).ethereum.request({ method: "eth_requestAccounts" });
    provider = (new ethers.providers.Web3Provider((window as any).ethereum) as unknown) as Web3Provider;
    signer = await provider.getSigner();
    account = await signer.getAddress();
  } else {
    console.log("cannot find a global `ethereum` object");
    provider = (new ethers.providers.JsonRpcProvider(INFURA_URL) as unknown) as Web3Provider;
    account = "0x0";
  }

  networkId = (await provider.getNetwork()).chainId;
  console.log("network", networkId);
  return;
}


export async function setup(ensAddress?: string, resolverAddress?: string, registrarAddress?: string, providerOpt?: Web3Provider) {
  if (provider && ens && !providerOpt) {
    return {
      provider,
      signer,
      ens,
      resolver,
      registrar,
    };
  }

  await setProvider(providerOpt);
  console.log("set provider");

  let addrMap = ContractAddrMap[networkId]

  console.log('addrs', addrMap)

  ensAddress = ensAddress || addrMap.ens;
  resolverAddress = resolverAddress || addrMap.resolver;
  registrarAddress = registrarAddress || addrMap.registrar;

  if (signer) {
    ens = new ethers.Contract(ensAddress, EnsAbi, signer);
    resolver = new ethers.Contract(resolverAddress, ResolverAbi, signer);
    registrar = new ethers.Contract(registrarAddress, RegistrarAbi, signer);
  } else {
    ens = new ethers.Contract(ensAddress, EnsAbi, provider);
    resolver = new ethers.Contract(resolverAddress, ResolverAbi, provider);
    registrar = new ethers.Contract(registrarAddress, RegistrarAbi, provider);
  }

  ensAddr = ensAddress;
  resolverAddr = resolverAddress;

  return {
    provider,
    signer,
    ens,
    resolver,
    registrar,
  };
}

export async function setupByContract(ensContract: any, resolverContract: any, registrarContract: string, providerOpt: Web3Provider) {
  await setProvider(providerOpt);
  console.log("set provider");

  ens = ensContract
  resolver = resolverContract
  registrar = registrarContract

  ensAddr = ens.address;
  resolverAddr = resolver.address;

  return {
    provider,
    signer,
    ens,
    resolver,
    registrar,
  };
}

export function getProvider(): Web3Provider {
  return provider;
}

export function getSigner(): Web3Signer {
  return signer;
}

export function getAccount(): string {
  return account;
}

/** 获取域名的当前所有者 */
export async function getOwner(name: DomainString): Promise<HexAddress> {
  let namehash = getNamehash(name);
  return ens.owner(namehash);
}

/** 获取域名的解析器合约 */
export function getResolver(name: DomainString): Promise<HexAddress> {
  let namehash = getNamehash(name);
  return ens.resolver(namehash);
}

export function getTTL(name: DomainString): Promise<number> {
  let namehash = getNamehash(name);
  return ens.ttl(namehash);
}

/** 获取域名的解析地址 */
export async function getAddr(name: DomainString, key: string): Promise<HexAddress> {
  const namehash = getNamehash(name);

  try {
    let coinType = coinTypes[key];
    const addr = await resolver.addr(namehash, coinType);
    if (addr === "0x") return emptyAddress;

    // return encoder(Buffer.from(addr.slice(2), 'hex'))
    return addr;
  } catch (e) {
    console.log(e);
    console.warn("Error getting addr on the resolver contract, are you sure the resolver address is a resolver contract?");
    return emptyAddress;
  }
}

/** 获得域名 ttl 参数，由用户设置，表示域名可以在本地缓存的时间
 * function getTTL(bytes32 name) returns (uint64)
 * getTTL('hero.eth') */
 export function getText(name: DomainString, key: string): Promise<number> {
  let namehash = getNamehash(name);
  return resolver.text(namehash, key);
}

/** 获得域名的IPFS内容地址 */
export async function getContent(name: DomainString): Promise<ContentType> {
  try {
    const namehash = getNamehash(name);
    const encoded = await resolver.contenthash(namehash);
    // todo
    return {
      value: `ipfs://${ethers.utils.base58.encode(encoded)}`,
      contentType: "contenthash",
    };
  } catch (e) {
    const message = "Error getting content on the resolver contract, are you sure the resolver address is a resolver contract?";
    console.warn(message, e);
    return { value: "", contentType: "error" };
  }
}

function buildKeyValueObjects(keys: any, values: any) {
  return values.map((record: any, i: any) => ({
    key: keys[i],
    value: record,
  }));
}

export function getLabelhash(rawlabel: string): HexAddress {
  if (rawlabel === "[root]") {
    return "";
  }

  return rawlabel.startsWith("[") && rawlabel.endsWith("]") && rawlabel.length === 66 ? "0x" + rawlabel.slice(1, -1) : "0x" + keccak_256(rawlabel);
}

function decodeLabelhash(hash: string): string {
  if (!(hash.startsWith("[") && hash.endsWith("]") && hash.length === 66)) {
    throw Error("Expected encoded labelhash in [hash] form");
  }
  return `${hash.slice(1, -1)}`;
}

/** 获得域名详细信息 */
export async function getDomainDetails(name: DomainString): Promise<DomainDetails> {
  const nameArray = name.split(".");
  const label = nameArray[0];
  const labelhash = getLabelhash(label);
  const nameResolver = await getResolver(name);
  const ttl = (await getTTL(name)).toString();
  const owner = await getOwner(name);

  const promises = TEXT_RECORD_KEYS.map((key) => getText(name, key));
  const records = await Promise.all(promises);
  let textRecords = buildKeyValueObjects(TEXT_RECORD_KEYS, records);

  const node = {
    name,
    label,
    labelhash,
    owner,
    nameResolver,
    ttl,
    textRecords,
  };

  const content = await getContent(name);
  // todo: render addr correctly
  // todo: batch read
  // todo: subgraph
  return {
    ...node,
    addrs: [
      { key: "BTC", value: await getAddr(name, "BTC") },
      { key: "ETH", value: await getAddr(name, "ETH") },
      { key: "DOT", value: await getAddr(name, "DOT") },
      { key: "KSM", value: await getAddr(name, "KSM") },
    ],
    content: content.value,
    contentType: "ipfs",
  };
}

export async function getRentPrice(name: DomainString, duration: number): Promise<BigNumber> {
  let result: BigNumber = await registrar.rentPrice(name, duration);
  return result;
}

export async function nameExpires(label: DomainString): Promise<BigNumber> {
  label = "0x" + keccak_256(label) || "0x0";
  return registrar.nameExpires(label);
}

export async function available(label: DomainString): Promise<boolean> {
  label = "0x" + keccak_256(label) || "0x0";
  return registrar.available(label);
}


/** 域名注册 */
export async function register(
  label: DomainString,
  account: string,
  duration: number
): Promise<{
  /** 额外的等待请求 */
  wait: () => Promise<void>;
}> {
  const price = await getRentPrice(label, duration);

  return registrar.register(label, account, duration, { value: price, gasLimit: 500000 });
}

export async function renew(label: DomainString, duration: number): Promise<void> {
  const price = await getRentPrice(label, duration);

  return registrar.renew(label, duration, { value: price, gasLimit: 500000 });
}

/** 设置域名 resolver 参数，表示域名的解析器
 * function setResolver(bytes32 name, address resolver)
 * setResolver('hero.eth', '0x123456789') */
export function setResolver(name: DomainString, resolver?: HexAddress): Promise<any> {
  let namehash = getNamehash(name);
  resolver = resolver || resolverAddr
  return ens.setResolver(namehash, resolver);
}

/** 设置域名的所有者
 * function setOwner(bytes32 name, address owner)
 * setOwner('hero.eth', '0x123456789') */
export function setOwner(
  name: DomainString,
  newOwner: HexAddress
): Promise<{
  wait: () => Promise<void>;
}> {
  let namehash = getNamehash(name);
  return ens.setOwner(namehash, newOwner);
}


/** 设置域名 ttl 参数，表示域名可以在本地缓存的时间
 * function setTTL(bytes32 name, uint64 ttl)
 * setTTL('hero.eth', 3600) */
 export function setTTL(name: DomainString, ttl: number): Promise<void> {
  let namehash = getNamehash(name);
  return ens.setTTL(namehash, ttl);
}

/** 设置域名的解析地址 */
export async function setAddr(name: DomainString, key: string, value: string): Promise<HexAddress> {
  const namehash = getNamehash(name);
  // const resolverAddr = await ensContract.resolver(namehash)

  try {
    let coinType = coinTypes[key];
    const addr = await resolver.setAddr(namehash, coinType, value);
    if (addr === "0x") return emptyAddress;
    return addr;
  } catch (e) {
    console.log(e);
    console.warn("Error getting addr on the resolver contract, are you sure the resolver address is a resolver contract?");
    return emptyAddress;
  }
}

export function setText(name: DomainString, key: string, value: string): Promise<void> {
  let namehash = getNamehash(name);
  return resolver.setText(namehash, key, value);
}

export function setContent(name: DomainString, value: string): Promise<void> {
  let namehash = getNamehash(name);
  return resolver.setContenthash(namehash, value);
}

/** 一次性设置域名信息
 * function setRecord(bytes32 name, address owner, address resolver, uint64 ttl)
 * setRecord('hero.eth', 'sub', '0x123456789', '0x123456789', 86400) */
export function setRecord(name: DomainString, newOwner: HexAddress, resolver: HexAddress, ttl: number): Promise<any> {
  let namehash = getNamehash(name);
  return ens.setRecord(namehash, newOwner, resolver, ttl);
}

/** 设置子域名的所有者
 * function setSubnodeOwner(bytes32 name, bytes32 label, address owner)
 * setSubnodeOwner('hero.eth', 'sub', '0x123456789') */
export function setSubnodeOwner(name: DomainString, label: string, newOwner: HexAddress): Promise<any> {
  let namehash = getNamehash(name);
  label = "0x" + keccak_256(label) || "0x0";
  return ens.setSubnodeOwner(namehash, label, newOwner);
}

/** 一次性设置域名信息
 * function setSubnodeRecord(bytes32 name, bytes32 label, address owner, address resolver, uint64 ttl)
 * setSubnodeRecord('hero.eth', 'sub', '0x123456789', '0x123456789', 86400) */
export function setSubnodeRecord(name: DomainString, label: string, newOwner: HexAddress, resolver: HexAddress, ttl: number): Promise<any> {
  let namehash = getNamehash(name);
  label = "0x" + keccak_256(label) || "0x0";
  return ens.setSubnodeRecord(namehash, label, newOwner, resolver, ttl);
}

/** 根据名字设置子域名的所有者
 * function setSubnodeOwner(bytes32 name, string subname, address owner)
 * setSubnodeOwner('hero.eth', 'sub', '0x123456789') */
export function setSubnameOwner(name: DomainString, subname: string, newOwner: HexAddress): Promise<any> {
  let namehash = getNamehash(name);
  return ens.setSubnameOwner(namehash, subname, newOwner);
}

/** 根据名字一次性设置域名信息
 * function setSubnameRecord(bytes32 name, string subname, address owner, address resolver, uint64 ttl)
 * setSubnameRecord('hero.eth', 'sub', '0x123456789', '0x123456789', 86400) */
export function setSubnameRecord(name: DomainString, subname: string, newOwner: HexAddress, resolver: HexAddress, ttl: number): Promise<any> {
  let namehash = getNamehash(name);
  return ens.setSubnameRecord(namehash, subname, newOwner, resolver, ttl);
}

export function matchProtocol(text: string): RegExpMatchArray | null {
  return text.match(/^(ipfs|sia|ipns|bzz|onion|onion3):\/\/(.*)/) || text.match(/\/(ipfs)\/(.*)/) || text.match(/\/(ipns)\/(.*)/);
}

export function getProtocolType(encoded: string): {
  protocolType: string;
  decoded: string;
} {
  let protocolType: string = 'ipfs://', decoded: string = '';
  try {
    let matched = matchProtocol(encoded);
    if (matched) {
      protocolType = matched[1];
      decoded = matched[2];
    }
    return {
      protocolType,
      decoded,
    };
  } catch (e) {
    console.log(e);
    return {
      protocolType,
      decoded,
    };
  }
}

/** 解析IPFS地址 */
export function decodeIpfsUrl(url: string): string {
  let data = getProtocolType(url);
  return "0x" + Buffer.from(ethers.utils.base58.decode(data.decoded)).toString("hex");
}

export async function setDomainDetails(name: string, textRecords: any, addrs: any, content: string) {
  await Promise.all(
    textRecords.map(async (item: any) => {
      if (item.value && item.value !== "") {
        await setText(name, item.key, item.value);
      }
    })
  );

  await Promise.all(
    addrs.map(async (item: any) => {
      if (item.value && item.value !== "") {
        await setAddr(name, item.key, item.value);
      }
    })
  );

  if (content && content !== "") {
    await setContent(name, content);
  }
}

/** 目前使用的都都是基于 eth 的域名, 后续扩展再拆分函数 */
export function isValidDomain(rawName: string): boolean {
  let name = rawName.endsWith("." + tld) ? rawName : `${rawName}.${tld}`;
  return name.length > 3 && name.length < 64 && checkDomain(name, { allowUnicode: false, subdomain: false });
}

//////////////////////

export function getTld() {
  return "dot";
}

export function suffixTld(label: string): DomainString {
  return label.replace(".dot", "") + ".dot";
}

export function removeTld(label: string): DomainString {
  return label.replace(".dot", "")
}

/** 设置域名的默认 resolver 参数，表示域名的解析器 */
export function setDefaultResolver(name: DomainString): Promise<any> {
  let namehash = getNamehash(name);
  return ens.setResolver(namehash, resolverAddr);
}

export async function tryLogin(): Promise<void> {
  await setup();
}

const hasuraUrl = "https://trusted-quagga-17.hasura.app/v1/graphql"

/** 列出用户的域名列表 */
export async function getDomains(account: string) {
  let query = "{\"query\":\"{domains(order_by: {name: asc}, where: {owner: {_eq: \\\""+account+"\\\"}}, distinct_on: name) {id name owner expires } }\",\"variables\":null}"
  let resp = await fetch(hasuraUrl, {
    "headers": {
      "content-type": "application/json",
    },
    "body": query,
    "method": "POST",
  })
  resp = await resp.json()
  return (resp as any).data.domains
}

/** 列出域名的子域名列表 */
export async function getSubdomains(domain: string) {
  let query = "{\"query\":\"{subdomains(order_by: {label: asc}, where: {node: {_eq: \\\""+domain+"\\\"}}, distinct_on: label) {id node label owner } }\",\"variables\":null}"
  let resp = await fetch(hasuraUrl, {
    "headers": {
      "content-type": "application/json",
    },
    "body": query,
    "method": "POST",
  })
  resp = await resp.json()
  return (resp as any).data.subdomains
}

//// valid domain

const sldMap: any = {
  "ac.cn": true,
  "com.cn": true,
  "edu.cn": true,
  "gov.cn": true,
  "mil.cn": true,
  "net.cn": true,
  "org.cn": true,
}

function checkDomain (value: string, opts: any) {
  if (typeof value !== 'string') return false
  if (!(opts instanceof Object)) opts = {}
  value = value.toLowerCase()

  if (value.endsWith('.')) {
    value = value.slice(0, value.length - 1)
  }

  if (value.length > 253) {
    return false
  }

  const validChars = /^([a-z0-9-._*]+)$/g
  if (!validChars.test(value)) {
    return false
  }

  const sldRegex = /(.*)\.(([a-z0-9]+)(\.[a-z0-9]+))/
  const matches = value.match(sldRegex)
  var tld = null
  var labels = null
  if (matches && matches.length > 2) {
    if (sldMap[matches[2]]) {
      tld = matches[2]
      labels = matches[1].split('.')
    }
  }

  if (!labels) {
    labels = value.split('.')
    if (labels.length <= 1) return false

    tld = labels.pop()
    const tldRegex = /^(?:xn--)?(?!^\d+$)[a-z0-9]+$/gi

  }

  if (opts.subdomain === false && labels.length > 1) return false

  const isValid = labels.every(function (label: string, index: number) {
    if (opts.wildcard && index === 0 && label === '*' && labels.length > 1) {
      return true
    }

    let validLabelChars = /^([a-zA-Z0-9-_]+)$/g
    if (index === labels.length - 1) {
      validLabelChars = /^([a-zA-Z0-9-]+)$/g
    }

    const doubleDashCount = (label.match(/--/g) || []).length
    const xnDashCount = (label.match(/xn--/g) || []).length
    if (doubleDashCount !== xnDashCount) {
      return false
    }

    const isValid = (
      validLabelChars.test(label) &&
      label.length < 64 &&
      !label.startsWith('-') &&
      !label.endsWith('-')
    )

    return isValid
  })

  return isValid
}
