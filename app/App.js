import React from 'react';
import GameList from './components/GameList';
import Fetch from 'react-fetch-component';

export default function() {
  return (
    <div onMouseOver={() => console.log('Hi')}>
      <h1>Board game loader</h1>
      <Fetch url="https://boardgameslist.herokuapp.com" as="json">
        {(fetchResults) => {
          if (fetchResults.loading) {
            return <p>Loading</p>
          }

          if (fetchResults.error) {
            return <p>fialed to fetch games</p>
          }

          return <GameList games={fetchResults.data} />
        }}
      </Fetch>
    </div>
  );
}
