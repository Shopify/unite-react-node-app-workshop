#### Step 7: Routing with react (Matt)

You are most likely going to need some routes in your Shopify app, so let's do that here. We are going to use **React Router 4**. It lets us describe our routes declaratively using React components.

Let’s install the libraries we need:

```bash
npm add react-router react-router-dom
```

Because we are using server-side rendering, we need to add the `StaticRouter` component from `react-router` to our `server/render-react-app.js` middleware:

```diff
import * as React from 'react';
import {renderToString} from 'react-dom/server';
import HTML from '@shopify/react-html';
+ import {StaticRouter} from 'react-router';

import App from '../app/App';

export default (ctx) => {
  const markup = renderToString(
    <HTML deferedScripts={[{path: 'bundle.js'}]}>
+       <StaticRouter location={ctx.url} context={{}}>
          <App />
+       </StaticRouter>
    </HTML>,
  );

  ctx.body = markup;
};
```

We also need to add the client-side `BrowserRouter` component from `react-router-dom` to our `client/index.js`:

```diff
import React from 'react';
import ReactDOM from 'react-dom';
+ import {BrowserRouter} from 'react-router-dom';

import App from '../app/App';

- ReactDOM.hydrate(<App />, document.getElementById('app'));
+ ReactDOM.hydrate(<BrowserRouter><App /></BrowserRouter>, document.getElementById('app'));
```

Now in `app/App.js` let's wrap our application in a `Switch` and a `Route`:

```diff
import * as React from 'react';
+ import { Switch, Route } from 'react-router'

export default function({children}) {
 return (
+   <Switch>
+     <Route exact path="/">
        <div>
          <h1>Board game loader</h1>
          // ...
        </div>
+     </Route>
+   </Switch>
 );
};
```

When you refresh your app, you'll find that nothing much has changed. This is because the route we've established (`/`) is identical to our main app path.

So let’s add another route to our `Switch`:

```
<Route exact path="/settings">
   <div>
     <h1>Settings</h1>
   </div>
</Route>
```

Now if you navigate to `/settings` you should see the "Settings" heading on the page.

#### Exercise

Let's take a few minutes for a quick independent exercise:

1. Try adding a few routes to your own application.
1. Let's try adding a NotFound route and a corresponding component. You'll be able to use a shorthand when you declare the `Route`:
```
<Route exact path="/notfound" component={NotFound}/>
```
1. Our `App.js` file is getting pretty large and eventually will get unmanageable. Let’s pull each of our pages into their own component files.

#### Step 8: Getting our URL bar to update (Mal)

We've built a package to synchronize the client-side routing of Shopify embedded apps with the outer iframe host in the Shopify Admin. Let's install that package and use it in our app:

```bash
npm add @shopify/react-shopify-app-route-propagator
```

This component is trivially easy to use. We just need to import the `RoutePropagator` component at the top level of your app and give it access to our router by using the `withRouter` higher order function from `react-router`. Let's go ahead and make the changes in `App.js`:

```diff
import * as React from 'react';
- import {Switch, Route} from 'react-router';
+ import {Switch, Route, withRouter} from 'react-router';
+ import RoutePropagator from '@shopify/react-shopify-app-route-propagator';

import Settings from './Settings';
import NotFound from './NotFound';
import Home from './Home';

+ const Propagator = withRouter(RoutePropagator);

export default function() {
  return (
    <React.Fragment>
+     <Propagator />
      <Switch>
        <Route exact path="/" component={Home} />
        <Route exact path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </React.Fragment>
  );
}
```

If your app is wrapped an `ApolloProvider`, you may get an error that says this:
```
Warning: Failed prop type: Invalid prop `children` of type `array` supplied to `ApolloProvider`, expected a single ReactElement.
```

It's because the `ApolloProvider` is only expecting one child inside of it. To fix the error, wrap your `Propagator` and `Switch` tags in a `React.Fragment` tag.

You should now see the URL change as you navigate to different areas of your embedded app.
