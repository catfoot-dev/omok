import Image from 'next/image';

import { GameClient } from '@/components/game/GameClient';

import styles from './page.module.css';

export default function HomePage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <Image
          alt="오목 로고"
          className={styles.logo}
          height={74}
          src="/imgs/logo.png"
          width={74}
        />
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Modern Omok</p>
          <h1>오목 대전</h1>
          <p>로컬 2인 대전 또는 AI와 대전을 즐겨보세요.</p>
        </div>
      </section>
      <GameClient />
    </main>
  );
}
