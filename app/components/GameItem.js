import React from 'react';

export default function GameItem({onAddGame, game: {name}}) {
  return (
    <li>
      <p>{name}</p>
      <button
        onClick={() => {
          onAddGame(name);
        }}
      >
        Create product
      </button>
    </li>
  );
}
