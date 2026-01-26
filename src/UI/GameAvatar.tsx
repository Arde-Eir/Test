import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

interface Props { state: 'idle' | 'success' | 'error'; }

export const GameAvatar: React.FC<Props> = ({ state }) => {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: '100%',
      height: 150,
      parent: 'phaser-root',
      transparent: true,
      scene: {
        create: function (this: Phaser.Scene) {
          const text = this.add.text(100, 75, '🤖', { fontSize: '60px' }).setOrigin(0.5).setName('avatar');
          this.tweens.add({ targets: text, y: 85, yoyo: true, repeat: -1, duration: 1000 });
        }
      }
    };
    gameRef.current = new Phaser.Game(config);
    return () => { gameRef.current?.destroy(true); };
  }, []);

  useEffect(() => {
    const scene = gameRef.current?.scene.scenes[0];
    const avatar = scene?.children.getByName('avatar') as Phaser.GameObjects.Text;
    if (avatar) {
      if (state === 'error') { avatar.setText('😵'); }
      else if (state === 'success') { avatar.setText('😎'); }
      else { avatar.setText('🤖'); }
    }
  }, [state]);

  return <div id="phaser-root" style={{ width: '100%', height: '150px' }} />;
};