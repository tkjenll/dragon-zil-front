import React from 'react';
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import { useStore } from 'effector-react';
import styled from 'styled-components';
import { isMobile } from 'react-device-detect';

import Loader from "react-loader-spinner";
import { MobileNavigate } from 'components/mobile/navigate';
import { AccountModal } from 'components/modals/account';
import { Text } from 'components/text';

import { StyleFonts } from 'config/fonts';
import { Colors } from 'config/colors';
import { ZilPayBase } from 'mixin/zilpay-base';
import { trim } from 'lib/trim';
import { $wallet, updateAddress, Wallet } from 'store/wallet';
import { $transactions, updateTxList, clearTxList, writeNewList } from 'store/transactions';
import { updateNet } from 'store/wallet-netwrok';
import { Block, Net } from '@/types/zil-pay';

const ConnectZIlPayButton = styled.button`
  cursor: pointer;
  color: ${Colors.White};
  font-family: ${StyleFonts.FiraSansSemiBold};
  display: flex;
  align-items: center;

  padding: 10px 22px;
  border-radius: 16px;
  border: 1px solid ${Colors.Darker};
  background: ${Colors.Darker};
  user-select: none;
  min-width: 100px;
  text-align: center;

  :hover {
    border: 1px solid ${Colors.Muted};
  }
`;

let observer: any = null;
let observerNet: any = null;
let observerBlock: any = null;
export const ConnectZIlPay: React.FC = () => {
  const address = useStore($wallet);
  const transactions = useStore($transactions);
  const [loading, setLoading] = React.useState(true);
  const [showModal, setShowModal] = React.useState(false);

  const hanldeObserverState = React.useCallback((zp) => {
    if (observerNet) {
      observerNet.unsubscribe();
    }
    if (observer) {
      observer.unsubscribe();
    }
    if (observerBlock) {
      observerBlock.unsubscribe();
    }

    observerNet = zp.wallet.observableNetwork().subscribe((net: Net) => {
      updateNet(net);
    });

    observer = zp.wallet.observableAccount().subscribe((acc: Wallet) => {
      const address = $wallet.getState();

      if (address?.base16 !== acc.base16) {
        updateAddress(acc);
      }

      clearTxList();

      const cache = window.localStorage.getItem(String(zp.wallet.defaultAccount?.base16));

      if (cache) {
        updateTxList(JSON.parse(cache));
      }
    });

    observerBlock = zp.wallet.observableBlock().subscribe(async(block: Block) => {
      let list = $transactions.getState();
      for (let index = 0; index < block.TxHashes.length; index++) {
        const element = block.TxHashes[index];

        for (let i = 0; i < list.length; i++) {
          const tx = list[i];

          if (tx.confirmed) {
            continue;
          }

          if (element.includes(tx.hash)) {
            list[i].confirmed = true;
          }
        }
      }
      const listOrPromises = list.map(async(tx) => {
        if (tx.confirmed) {
          return tx;
        }

        try {
          const res = await zp.blockchain.getTransaction(tx.hash);
          
          if (res && res.receipt && res.receipt.errors) {
            tx.error = true;
          }

          tx.confirmed = true;
          return tx;
        } catch {
          return tx;
        }
      });

      list = await Promise.all(listOrPromises);
      writeNewList(list);
    });

    if (zp.wallet.defaultAccount) {
      updateAddress(zp.wallet.defaultAccount);
    }

    const cache = window.localStorage.getItem(String(zp.wallet.defaultAccount?.base16));

    if (cache) {
      updateTxList(JSON.parse(cache));
    }
  }, [transactions]);
  const handleConnect = React.useCallback(async() => {
    setLoading(true);
    try {
      const wallet = new ZilPayBase();
      const zp = await wallet.zilpay;
      const connected = await zp.wallet.connect();

      if (connected && zp.wallet.defaultAccount) {
        updateAddress(zp.wallet.defaultAccount);
      }

      updateNet(zp.wallet.net);

      const cache = window.localStorage.getItem(String(zp.wallet.defaultAccount?.base16));

      if (cache) {
        updateTxList(JSON.parse(cache));
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    try {
      const wallet = new ZilPayBase();

      wallet
        .zilpay
        .then((zp) => {
          hanldeObserverState(zp);
          setLoading(false);
        })
        .catch((err) => setLoading(false));
    } catch (err) {
      setLoading(false);
    }

    return () => {
      if (observer) {
        observer.unsubscribe();
      }
      if (observerNet) {
        observerNet.unsubscribe();
      }
      if (observerBlock) {
        observerBlock.unsubscribe();
      }
    }
  }, []);

  if (address && isMobile) {
    return (
      <>
        <div onClick={() => setShowModal(true)}>
          <svg
            width="32"
            height="26"
            viewBox="0 0 32 26"
            fill="none"
          >
            <path
              d="M0 1H32M0 13H32M0 25H32"
              stroke={Colors.White}
              strokeWidth="2"
            />
          </svg>
        </div>
        <MobileNavigate
          show={showModal}
          loading={loading}
          address={address.bech32}
          onConnect={handleConnect}
          onClose={() => setShowModal(false)}
        />
      </>
    );
  }

  return (
    <>
      {address ? (
        <ConnectZIlPayButton onClick={() => setShowModal(true)}>
          {transactions.length === 0 ? trim(address.bech32) : (
            <>
              <Loader
                type="Puff"
                color={Colors.White}
                height={10}
                width={10}
              />
              <Text
                size="16px"
                css="text-indent: 5px;margin: 0;"
              >
                Pending...
              </Text>
            </>
          )}
        </ConnectZIlPayButton>
      ) : (
        <ConnectZIlPayButton onClick={handleConnect}>
          {loading ? (
            <Loader
              type="ThreeDots"
              color="#fff"
              height={10}
              width={20}
            />
          ) : 'Connect'}
        </ConnectZIlPayButton>
      )}
      <AccountModal
        show={showModal}
        address={address?.bech32}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};
