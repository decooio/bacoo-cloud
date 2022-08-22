import {Keyring} from "@polkadot/keyring";
import {ChainAccount} from "../type/chain";
import {cryptoWaitReady, mnemonicGenerate} from "@polkadot/util-crypto";
import {stringToU8a, u8aToHex} from "@polkadot/util";

const keyring = new Keyring({
    ss58Format: 66,
    type: 'sr25519',
});
keyring.setSS58Format(66);

export async function generateChainAccount(): Promise<ChainAccount> {
    const seed = mnemonicGenerate();
    await cryptoWaitReady();
    const pair = keyring.addFromUri(seed);
    const address = pair.address;
    const signature = Buffer.from(`substrate-${address}:${u8aToHex(pair.sign(stringToU8a(address)))}`).toString('base64');
    return {
        seed,
        address,
        signature
    }
}


