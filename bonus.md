#### Step 7: Routing with react (Matt)

You are most likely going to need some routes in your Shopify app, so let's do that here. We are going to use React Router 4. It lets us describe our routes declaratively using react components.

Let’s install the libraries we need:

```bash
npm add react-router react-router-dom
```

Now in App.js lets wrap our application in a a `Switch`, and a `Route`.

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

And because we are using server side rendering, we need to add the `StaticRouter` component from react-router to our `server/render-react-app.js` middleware.

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

So nothing much has changed… but let’s add another route to our Switch.

```
<Route exact path="/settings">
   <div>
     <h1>Settings</h1>
   </div>
</Route>
```

Now if you navigate to `/settings` you should see the Setting heading on the page.

#### Excercise

Lets take a few minutes for a quick independent excercise.

1.  See if you can add a few routes to your own application, including a NotFound route and component.

Our App.js file is getting pretty large and eventually will get unmanageable. Let’s pull our pages into their own component files.

#### Step 8: Getting our url bar to update (Mal)

We've built a package to make synchronizing Shopify embedded app's client side routing with the outer iframe host. Let's install that package and use it in our app.

```bash
npm add @shopify/react-shopify-app-route-propagator
```

This component is trivially easy to use. We just need to mount the `RoutePropagator` component at the top level of your app and give it access to our router by using the `withRouter` higher order function from `react-router`.

```diff
import * as React from 'react';
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

You should now see the url change as you navigate to different areas of your embedded app.
