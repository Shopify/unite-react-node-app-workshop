import React from 'react';
import {renderToString} from 'react-dom/server';
import HTML from '@shopify/react-html';
import App from '../app/App';
import {StaticRouter} from 'react-router';


export default (ctx) => {
  const markup = renderToString(
    <HTML deferedScripts={[{path: 'bundle.js'}]}>
      <StaticRouter location={ctx.url} context={{}}>
        <App />
      </StaticRouter>
    </HTML>,
  );

  ctx.body = markup;
};