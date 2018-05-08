import React from 'react';
import {renderToString} from 'react-dom/server';
import HTML from '@shopify/react-html';

import App from '../app/App';

export default (ctx) => {
  const markup = renderToString(
    <HTML>
      <App />
    </HTML>,
  );

  ctx.body = markup;
};
