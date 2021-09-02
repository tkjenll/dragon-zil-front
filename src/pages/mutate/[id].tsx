import React from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/router';
import { useStore } from 'effector-react';
import { BrowserView, MobileView } from 'react-device-detect';
import { GetServerSidePropsContext, NextPage } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';

import { Container } from 'components/pages/container';
import { Navbar } from 'components/nav-bar';
import { ActionBarTitle } from 'components/dragon/action-bar-title';
import { UpgradeGenModal } from 'components/modals/upgrade-gen';

import { $dragonCache } from 'store/cache-dragon';
import { DragonAPI, DragonObject } from '@/lib/api';
import { getRarity } from '@/lib/rarity';
import { $wallet } from '@/store/wallet';
import { GenLab } from 'mixin/gen-lab';

const UpgradeGens = dynamic(import('components/dragon/upgrade-gens'));
const MobileUpgradeGens = dynamic(import('components/mobile/upgrade-gens'));
const RarityImage = dynamic(import('components/rarity-image'));

type Prop = {
  dragon: DragonObject;
}

const Wrapper = styled.div`
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  padding-top: 30px;

  width: 100%;
  max-width: 1224px;

  @media (max-width: 947px) {
    align-items: center;
    justify-content: center;
  }
`;
const TitleWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  max-width: 943px;
  align-items: self-start;
  width: 100%;
`;

const backend = new DragonAPI();
const genLab = new GenLab();
export const GenLabPage: NextPage<Prop> = ({ dragon }) => {
  const router = useRouter();
  const address = useStore($wallet);
  const [price, setPrice] = React.useState<string | null>('0');
  const [showModal, setShowModal] = React.useState(false);
  const [genToUpgrade, setGenToUpgrade] = React.useState({
    gen: 0,
    value: 0,
    name: ''
  });

  const rarity = React.useMemo(() => {
    if (!dragon) {
      return null;
    }
    return getRarity(dragon.rarity, dragon.gen_image);
  }, [dragon]);

  const isOwner = React.useMemo(() => {
    if (!dragon) return false; 
    return dragon.owner.toLowerCase() === address?.base16.toLowerCase();
  }, [address, dragon]);

  const handleUpgrade = React.useCallback((gen: number, value: number, name: string) => {
    setGenToUpgrade({
      gen,
      value,
      name
    });
    setShowModal(true);
  }, []);

  React.useEffect(() => {
    genLab
      .getPrice(String(router.query.id))
      .then(([price]) => setPrice(price))
      .catch(console.error);
  }, [router.query.id]);

  React.useEffect(() => {
    if (dragon && address &&  dragon.owner.toLowerCase() !== address.base16.toLowerCase()) {
      router.push(`/dragon/${router.query.id}`);
    }
  }, [dragon, address]);

  return (
    <Container>
      <Head>
        <title>
          Mutate a dragon #{dragon.id}
        </title>
        <meta
          property="og:title"
          content={`Mutate a dragon #${dragon.id}`}
          key="title"
        />
      </Head>
      <Navbar />
      {dragon && rarity ? (
        <TitleWrapper>
          <ActionBarTitle
            dragon={dragon}
            isOwner={isOwner}
            color={rarity.color}
            price={`${price} ZLP`}
          />
        </TitleWrapper>
      ) : null}
      {rarity && dragon ? (
        <Wrapper>
          <RarityImage
            width={500}
            height={500}
            id={dragon.id}
            rarity={dragon.rarity}
            url={dragon.url}
          />
          <BrowserView>
            <UpgradeGens
              color={rarity.color}
              gens={dragon.gen_fight}
              onSelect={handleUpgrade}
            />
          </BrowserView>
          <MobileView>
            <MobileUpgradeGens
              color={rarity.color}
              gens={dragon.gen_fight}
              onSelect={handleUpgrade}
            />
          </MobileView>
        </Wrapper>
      ) : null}
      <UpgradeGenModal
        gen={genToUpgrade}
        show={showModal}
        id={dragon?.id || ''}
        price={price ? price : 0}
        onClose={() => setShowModal(false)}
      />
    </Container>
  );
}

export const getStaticProps = async (props: GetServerSidePropsContext) => {
  const dragonId = String(props.params && props.params.id);
  const dragon = await backend.getDragon(String(dragonId));

  return {
    props: {
      dragon
    }
  };
};

export async function getStaticPaths() {
  return {
    paths: [
      '/mutate/id',
    ],
    fallback: true
  }
}

export default GenLabPage;
