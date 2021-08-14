import React from 'react';
import { useRouter } from 'next/router';
import { BrowserView, MobileView } from 'react-device-detect';
import { useStore } from 'effector-react';

import styled from 'styled-components';
import Link from 'next/link';

import { ConnectZIlPay } from 'components/connect-zilpay';
import { Modal } from 'components/modal';
import { ModalItem } from 'components/mobile/modal-item';

import { Text } from 'components/text';
import { StyleFonts } from 'config/fonts';
import { Colors } from 'config/colors';
import { trim } from 'lib/trim';
import { $wallet } from 'store/wallet';

const Container = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  max-width: 1200px;
  width: 90%;
  margin-top: 40px;

  @media (max-width: 500px) {
    margin-top: 10px;
  }
`;
const Logo = styled.div`
  display: flex;
  margin-left: 40px;
  cursor: pointer;

  @media (max-width: 835px) {
    margin: 0;
  }
`;
const Ul = styled.ul`
  display: flex;
`;
const Li = styled.li`
  margin-left: 40px;
  margin-right: 40px;
  color: ${Colors.White};
  font-family: ${StyleFonts.FiraSansRegular};
  line-height: 30px;

  border-bottom: 2px solid
    ${(props: { selected: boolean }) =>
      props.selected ? Colors.Info : Colors.Black};

  @media (max-width: 1056px) {
    margin-left: 20px;
    margin-right: 20px;
  }

  @media (max-width: 835px) {
    margin-left: 10px;
    margin-right: 10px;
  }
`;

const links = [
  {
    path: '/buy',
    name: 'Store',
  },
  {
    path: '/mydragons',
    name: 'My dragons',
  },
  {
    path: '/fights',
    name: 'Fights',
  },
  {
    path: '/breed',
    name: 'Breed',
  },
  {
    path: '/trade',
    name: 'Trade',
  },
];

export const Navbar: React.FC = () => {
  const router = useRouter();
  const address = useStore($wallet);

  const [modalShow, setModalShow] = React.useState(false);

  return (
    <Container>
      <Link href="/">
        <Logo>
          <img
            src="/icons/logo.png"
            alt="Logo"
            height="40"
          />
          <Text
            fontVariant={StyleFonts.FiraSansBold}
            css="margin-left: 5px;"
          >
            DragonZIL
          </Text>
        </Logo>
      </Link>
      <BrowserView>
        <Ul>
          {links.map((link, index) => (
            <Li
              key={index}
              selected={router.pathname === link.path}
            >
              <Link href={link.path}>{link.name}</Link>
            </Li>
          ))}
        </Ul>
      </BrowserView>
      <ConnectZIlPay onModal={() => setModalShow(true)}/>
      <MobileView style={{
        display: 'contents'
      }}>
        <Modal
          show={modalShow}
          title={
            <ModalItem
              fontVariant={StyleFonts.FiraSansBold}
              last
            >
              {trim(address?.bech32 || '')}
            </ModalItem>
          }
          onClose={() => setModalShow(false)}
        >
          <ul>
            {links.map((link, index) => (
              <Link
                key={index}
                href={link.path}
              >
                <ModalItem>
                  {link.name}
                </ModalItem>
              </Link>
            ))}
            <ModalItem
              last
              onClick={() => setModalShow(false)}
            >
              Cancel
            </ModalItem>
          </ul>
        </Modal>
      </MobileView>
    </Container>
  );
};
