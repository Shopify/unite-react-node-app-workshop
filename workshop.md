# Building a Shopify App

_with React and Koa_

### Workshop overview

Together we will be building a Shopify app that creates products from a list of hot board games. To do so we'll need to write a Koa server which knows how retrieve an access token from Shopify, build a React front-end that knows how to fetch boardgames, and create products from those boardgames using Shopify's admin GraphQL API.

### Goals

* Give attendees a running start at building a modern web-app using Shopify’s tools for the Node and React ecosystems.
* Raise awareness with attendees about what libraries we have available for building apps.
* Level up attendees' skills with modern Javascript libraries.

#### Structure

* Introduction
* Babel and ES6
* Set up
* Intro to Koa
* Let’s build an app!
  * Step 1: Authenticating with Shopify
  * Step 2: Serving HTML with React
  * Step 3: React in the Browser
  * Step 4: Fetching some games
  * Step 5: Creating Products with GraphQL
  * Step 6: Routing with React
  * Step 7: Getting our URL bar to update
* What's next
* Additional Resources

### Set up

If you have not done so already, follow the setup steps in the [README](./README.md).

In the root of this project, there are a number of configuration files and a few Javascript files to get us started.

Open up `index.js`, this is the entry point of our application which imports the server and mounts it on port 3000.

If you open `server/index.js` you will see our "Hello Unite!" logic. We've also set a few things up so that we can use our `SHOPIFY_SECRET` and `SHOPIFY_API_KEY` using a library called `dotenv`, but more on that later.

### Intro to Koa

[Koa](https://koajs.com/) is a minimalistic node framework for modern Javascript apps that we will be using for our server in this workshop. It is built around the ES2016 `async` and `await` keywords. (Quick refresher [here](https://medium.com/@bluepnume/learn-about-promises-before-you-start-using-async-await-eb148164a9c8).)

In Koa, you express your application logic as a series of asynchronous functions called **middleware**, which is just a fancy word for functions that all operate on a `context` or `ctx` object, and await on a `next` function to yield flow back into the rest of the app. Before we actually start building out our app, let's just write some code to better explain this concept.

We are going to add another middleware function to `server/index.js` just _before_ the existing "Hello Unite" one:

```js
app.use(async function(ctx, next) {
  console.log('Middleware 1');
  await next();
});
```

This is an `async` function with a second `next` parameter. The `next` parameter is a function that resolves to a promise that we can `await` on, telling Koa to pause this current middleware and move on to the next one in the chain.

If you refresh the browser where you are running the app it should still look the same, but you should see `Middleware 1` printed in the console.

Let's add another middleware, but this time _after_ our initial middleware. So our entire middleware chain looks like this:

```js
app.use(async function(ctx, next) {
  // log 'Middleware 1'
  console.log('Middleware 1');
  // then pause and wait for the next middleware
  await next();
});

app.use(function(ctx) {
  // then log 'Middleware 2'
  console.log(`Middleware 2`);
  // and set the body of our response to 'Hello Unite'
  ctx.body = 'Hello Unite 👋';
});

app.use(async function(ctx, next) {
  // the app will never get here
  console.log('Middleware 3');
  await next();
});
```

If you refresh the browser, you should see `Middleware 1` and `Middleware 2` printed in the console, but not `Middleware 3`. That’s because Koa ends the request once the middleware Promise chain is resolved. That means the response was sent to the client before we got to our third middleware.

We can solve this by changing our original middleware function into an `async` function that has `await next()` like our other middleware does. Try it out to confirm that all three console messages are logged.

We said Koa "pauses" the execution of the function, so let's log some messages after our `next()` calls to get a better idea of what is meant by this:

```js
app.use(async function(ctx, next) {
  // log 'middleware 1'
  console.log('middleware 1');
  // then pause and wait for the next middleware
  await next();
  // then log 'back to middleware 1'
  console.log('back to middleware 1');
});

app.use(async function(ctx, next) {
  // log 'middleware 2'
  console.log(`middleware 2`);
  // then set the body to 'Hello Unite :)'
  ctx.body = 'Hello Unite 👋';
  // then pause and wait for the next middleware
  await next();
  // then log 'back to middleware 2'
  console.log('back to middleware 2');
});

app.use(async function(ctx, next) {
  // first log middleware 3
  console.log('middleware 3');
  // then wait for any further downstream middleware
  await next();
  // then log back to middleware 3;
  console.log('back to middleware 3');
});
```

This time in the console, we see this:

```bash
Middleware 1
Middleware 2
Middleware 3
Back to Middleware 3
Back to Middleware 2
Back to Middleware 1
```

As you can see, Koa made its way up the middleware chain pausing each function when we `await` on `next()` before passing the flow to the next middleware in the chain. It does this until there are no more middleware functions left and then it resumes each middleware in the reverse order they were added.

Hopefully these examples gave you a good primer on Koa and how it works. We will be installing and using some Koa middleware packages from npm as well as writing our own middleware throughout this workshop.

### Let’s build an app!

#### Step 1: Authenticating with Shopify

The first middleware we are going to install will be used to get our app to show up in our Shopify store. We'll use the Koa auth package that Shopify provides. Install it by running:

```bash
npm add koa-session @shopify/koa-shopify-auth
```

In `server/index.js` add the following lines to import it into our app:

```js
import session from 'koa-session';
import createShopifyAuth from '@shopify/koa-shopify-auth';
```

We can mount our middleware by adding the following lines after we initialize our new Koa app:

```js
app.use(session(app));
```

We are mounting the session middleware and passing our Koa app instance into it.

Next we need to use the Shopify Auth middleware. To configure it we'll need to pass the API key and our secret. We can grab both our `SHOPIFY_SECRET` and `SHOPIFY_API_KEY` from the environment:

```js
const {SHOPIFY_API_KEY, SHOPIFY_SECRET} = process.env;
```

Then we'll add the middleware to the app and pass in some configuration:

```js
app.use(
  createShopifyAuth({
    // your shopify app's api key
    apiKey: SHOPIFY_API_KEY,
    // your shopify app's api secret
    secret: SHOPIFY_SECRET,
    // our app's permissions
    // we need to write products to the user's store
    scopes: ['write_products'],
    // our own custom logic after authentication has completed
    afterAuth(ctx) {
      const {shop, accessToken} = ctx.session;

      console.log('We did it!', shop, accessToken);

      ctx.redirect('/');
    },
  }),
);
```

`afterAuth` tells our app what to do when an authentication successfully completes. We will just print a message and redirect to the root of our app.

We'll also need to add `app.keys` to let us use `session` securely. Set it to your Shopify secret before you mount your session middleware:

```js
app.keys = [SHOPIFY_SECRET];
```

If you don't already have a Shopify store that you're willing to use for this workshop, go ahead and create one using the Partners dashboard:
* Click on **Development Stores** in the menu on the left sidebar
* Click on the **Create Store** button
* Complete the required forms

To try out the authentication flow (note: it won't work _yet_, see more below), visit `YOUR_HTTPS_NGROK_URL/auth?shop=YOUR_SHOP_DOMAIN`.

For example, your URL might be<br/>
https://f7d2c41b.ngrok.io/auth?shop=test-store.myshopify.com

You should see an error screen that looks something like this:
![Ngrok screenshot](public/images/oauth-error-screenshot.png)

To solve this error, we need to login to our [partners dashboard](https://partners.shopify.com/organizations), go to our **App Info** and add `YOUR_HTTPS_NGROK_URL/auth/callback` to the "Whitelisted redirection URL(s)" textarea.

Now if you try to authenticate again, (`YOUR_HTTPS_NGROK_URL/auth?shop=YOUR_SHOP_DOMAIN`) it should take you to install the app in the Shopify admin. Once it's installed you can verify it shows up by going to `YOUR_SHOPIFY_URL/admin/apps`. You should see your app in the list of **Installed apps**.

You can also click on your app to see it running inside of a frame within the Shopify admin. Note the URL is now `YOUR_SHOPIFY_URL/admin/apps/YOUR_APP_NAME`. For the rest of the workshop, you can verify your changes to your app and see it running by visiting either of the following URLs:
* `YOUR_HTTPS_NGROK_URL`
* `YOUR_SHOPIFY_URL/admin/apps/YOUR_APP_NAME`

We now have an authentication route, but users can still go straight to our index without logging in. You can verify this by clearing your cookies or loading your ngrok url in an incognito tab. The next step will protect our `Hello Unite` message with a verification middleware.

The `@shopify/koa-shopify-auth` package exports a middleware for this exact purpose. Let's import it into our `server/index.js`:

```js
import createShopifyAuth, {
  createVerifyRequest,
} from '@shopify/koa-shopify-auth';
```

Now we can add the following between our Auth and `Hello Unite` middlewares:

```js
// secure all middleware after this line
app.use(createVerifyRequest());
```

Everything below this middleware will require authentication, everything above will not. Try it out to confirm.

Congratulations! You have just built an app that will render in the Shopify admin and knows how to authenticate with Shopify. Now let's work on making our app do something!

#### Step 2: Serving HTML with React

Up to this point, our server has just been rendering a simple string, but we actually want to serve up an HTML page. In the past, this might have been done with templating or string interpolation, but we will use React on the server to generate our app markup. This will let us reuse our code on the server and client and have one source of truth for the resulting UI.

As the quickest of introductions, React is a component based library for declaratively building user interfaces. Components are expressed as either functions of their inputs (props) or as subclasses of `React.Component`. For our purposes today, we will be using entirely **stateless** functional components, meaning that their outputs are simply functions of their inputs (no additional state is kept per component).

Here is an example React component with explanations embedded:

```js
function Button(props) {
  /*
    The html-esque syntax below is called JSX
    JSX is a simple syntactic sugar on top of calls to
    React.createElement. For example, this JSX function
    translates to:

    React.createElement(
      'button',
      {
        onClick: props.onClick,
        style: myCoolButtonStyles,
      },
      props.children
    )
    babel lets us use this syntax freely ✨
  */

  return (
    <button
      /*
        curly braces inside JSX allow for interpolation
        very similar to handlebars
       */
      style={myCoolButtonStyles}
      /*
        React knows how to handle binding and unbinding
        listeners for you, so you can simply use the
        following props syntax instead:
      */
      onClick={props.onClick}
    >
      {props.children}
    </button>;
  );
}

/*
  we need to use React's render methods to
  transform our components into HTML
*/
ReactDOM.renderToString(<Button></Button>) // => html string
```

So how are we going to actually use this component in our server? Well, with a middleware of course. This middleware will generate markup that can run our React code. Let's install a few things to help do this:

```bash
npm add react react-dom @shopify/react-html
```

Since this middleware will be a bit meatier than the others, let's devote a new file to it. Create a new file in the `server/` directory called `render-react-app.js` and add the following code:

```js
import React from 'react';
import {renderToString} from 'react-dom/server';
import HTML from '@shopify/react-html';

export default (ctx) => {
  const markup = renderToString(
    <HTML>
      <div>Hello React</div>
    </HTML>,
  );

  ctx.body = markup;
};
```

Now we need to tell our Koa app to use this middleware, so back in `server/index.js` import the file:

```
// after other imports
import renderReactApp from './render-react-app';
```

We are also going to replace the last middleware in our chain with our custom one:
```diff
// after other middleware
- app.use(function index(ctx) {
-   ctx.body = 'Hello Unite :)';
- });
+ app.use(renderReactApp);
```

You should now see "Hello React", which is great but we actually want to render our app, not just a simple HTML string. To do this we need to start thinking in components.

We are going to create our main App component and render that on the server. Create a new file inside of `/app` called `App.js`. This is where we will define our first component, a simple component that renders a title for our page:

```js
import React from 'react';

export default function() {
  return (
    <div>
      <h1>Board game loader</h1>
    </div>
  );
}
```

Now we can use this component in our middleware within `server/render-react-app.js`. First import the component from the file, and then use the component's name as an HTML-esque tag:

```diff
import React from 'react';
import {renderToString} from 'react-dom/server';
import HTML from '@shopify/react-html';

+ import App from '../app/App';

export default (ctx) => {
  const markup = renderToString(
    <HTML>
-      <div>Hello React</div>
+      <App />
    </HTML>
  );

  ctx.body = markup;
}
```

In your browser, if you **View Source** or use the **Inspect** panel on your page, you should now see a full HTML document with an `app` `<div>` and our App component's `<h1>`.

This App component will come to represent our entire tree of components, which can be as deep as it needs to be without ever changing this tag.

For demonstration purposes, next we'll add a hover handler onto our title, that logs a message to the console. In `app/App.js`, modify your JSX to look like this:

```js
import React from 'react';

export default function() {
  return (
    <div onHover={() => console.log('Hi!')}>
      <h1>Board game loader</h1>
    </div>
  );
}
```

Unfortunately, this code won't actually work yet.

This is due to the fact that we are missing one crucial piece of a modern web app: client side Javascript. We will need to be able run our React code in the browser to rectify this.

#### Step 3: React in the Browser

Much like we have a server folder for server code, let's create a client folder for client code. We should strive to end up with very little code in this folder as the bulk of our logic should be universal between both the server and client, and this universal code should live in the `app/` folder. The client-specific code will live in its own folder. Go ahead and create a `client/` folder in the root folder and a file called `index.js` inside of it.

Next we are going to mount our same React application on the client side (in the browser). This is called "hydrating" the DOM. We'll query for an element with the id `app` and we'll use that element as the place to mount our client-side React app. Our client-side script will need to include React, ReactDOM, our app component, and anything else we add in the future.

Let's add that code to the client's `index.js`:

```js
import React from 'react';
import ReactDOM from 'react-dom';

import App from '../app/App';

console.log('hello from the client');

ReactDOM.hydrate(<App />, document.getElementById('app'));
```

But where does this element with the `app` id come from? Well, the HTML component we imported from `@shopify/react-html` automatically wraps our contents in a div with an id of `app`. Conveniently it will also add our client-side script to the markup, if we tell it to.

We’ll use **Webpack 4** for this. Webpack is an open-source Javascript module bundler. It consumes your client side code, traverses its dependencies, and generates static assets representing those modules.

Again, first step is to install the packages we need:

```bash
npm add webpack koa-webpack
```

We also need to import the `koa-webpack` middleware, and add it to the bottom of our middleware chain (but before we render our app) in `server/index.js`:

```js
import webpack from 'koa-webpack';
...
app.use(webpack());
```

This middleware will look for a `webpack.config.js` in the project root and that will tell Webpack how to compile our code. For our app, we want to run our `js` files through the `babel-loader`, and we've pre-configured Webpack to do this for you in this repo.

Now that this middleware is installed you should see a `Compiled Successfully` message in your console.

The final step is to tell our App component to include the compiled script bundle. This is done with a prop to the `<HTML />` component called `deferedScripts`. We can add that now to `server/render-react-app.js_`:

```js
<HTML
  deferedScripts={[{path: 'bundle.js'}]}
>
```

Now if you refresh the browser, you should see a log in our console that says `Hello from the client`. This is coming from the client-side Javascript.

#### Step 4: Fetching some games

Now we are finally ready to get our app doing all the things we said it would. Let's fetch some board games so that we can show the user what they can choose from.

The repo has a few small, pre-built components inside of the `app/` folder. One of these is a `<GameList />` component that will be responsible for rendering a list of games.

Let's import that component into our App (`app/App.js`):

```js
import GameList from './components/GameList';
```

Our games are going to be coming from [https://boardgameslist.herokuapp.com](https://boardgameslist.herokuapp.com) and we need to write some logic to fetch them. We will also want logic to handle errors and loading while we wait for a response. This would be quite verbose to do manually so let's add a component will help us do this in a clean and easy way:

```bash
npm add react-fetch-component
```

Import the `<Fetch />` component from this package inside of our `app/App.js`:

```js
import Fetch from 'react-fetch-component';
```

This component uses a `renderProp`, a pattern whereby we pass a function as the `children` prop to a component. That function will be called with the derived state needed to render without having to worry where the state comes from.

In the case of the `<Fetch />` component, we will trust it to handle the details of getting the games from the API and passing in everything we need to render.

Let's start by just rendering the component with the URL to our API, and using the `as` prop to tell it to parse the response as `json`.

```js
<Fetch url="https://boardgameslist.herokuapp.com" as="json" />
```

`<Fetch />` will pass the state of our request as a single object with a boolean `loading` property that we can use to check if the request is in process, an `error` property that is undefined unless there is an error in our request, and finally the resulting `data` from our request.

Now let's add logic to handle each of these properties and render content based on the state of the request.

```js
<Fetch url="https://boardgameslist.herokuapp.com" as="json">
  {(fetchResults) => {
    if (fetchResults.loading) {
      return <p>Loading</p>
    }

    if (fetchResults.error) {
      return <p>failed to fetch games</p>
    }

    return <GameList games={fetchResults.data} />
  }}

</Fetch>
```

If we refresh our page we should now see a list of games.

#### Step 5: Creating Products with GraphQL

Now that we have a list of games, we can now create products from them. To do this we are going to use Shopify's [GraphQL Admin API](https://help.shopify.com/api/graphql-admin-api).

Using a GraphQL API allows us to `query` data and make changes to data with `mutations`. In this workshop, we won't have time to go too deep into _how_ this works, but we will get to use a GraphQL API to perform a simple mutation.

##### Installing the GraphQL Client
The first thing we need to do to work with a GraphQL API is to install a GraphQL client. We will use a library called **Apollo** for this. Similar to  how the `<Fetch />` handled the details of getting the games from the API and passing everything in to render, Apollo's component will handle the complexity of working with the GraphQL API, such as low-level networking details and maintaining a local cache.

Let's start by installing the Apollo dependencies, `react-apollo` and `apollo-boost`:

```bash
npm add apollo-boost react-apollo
```

We also have a Shopify middleware that we are going to add in order to securely proxy GraphQL requests from our app to Shopify:

```bash
npm add @shopify/koa-shopify-graphql-proxy
```

Let's begin by importing and adding the `koa-shopify-graphql-proxy` to our middleware chain in `server/index.js`, just before the server-rendered React app middleware:

```js
import graphQLProxy from '@shopify/koa-shopify-graphql-proxy';

//... later on
app.use(graphQLProxy);
```

Now on the client side, let's configure our Apollo client. We are going to do this at the top-level of our application in `app/App.js`. This is a very basic configuration for Apollo where we just need to include our cookies so that the server can match the session to our browser session.

```js
import ApolloClient from 'apollo-boost';
import {ApolloProvider} from 'react-apollo';

const client = new ApolloClient({
  fetchOptions: {
    credentials: 'include',
  },
});
```

By default the server will make requests to `/graphql`.

We now need to wrap our `<App />` in the `<ApolloProvider />`, passing it the `client` we just created. This gives components further down in our tree access to the Apollo Client.

```diff
export default function() {
  return (
+   <ApolloProvider client={client}>
      <h1>Board game list</h1>
      <Fetch url="https://boardgameslist.herokuapp.com" as="json">
        {({loading, error, data}) => {
          if (loading) {
            return <p>loading</p>;
          }
          if (error) {
            return <p>failed to fetch games</p>;
          }

          return <GameList games={data} />;
        }}
      </Fetch>
+   </ApolloProvider>
  );
}
```

Now with our Apollo client configured, we can use Apollo's `<Mutation />` component anywhere inside this provider.

##### Writing the GraphQL mutation
The next step is to write the GraphQL mutation. We'd like to write a mutation that allows us to create a new product in our Shopify store.

`apollo-boost` exports a template literal tag that parses GraphQL queries called `gql`. We'll need to import it into our App by modifying our previous import statement for `apollo-boost`:

```js
import ApolloClient, {gql} from 'apollo-boost';
```

Now let's create a constant in our App for the `gql`-wrapped mutation we want to perform:

```js
const CREATE_PRODUCT = gql`
  mutation CreateProduct($product: ProductInput!) {
    productCreate(input: $product) {
      product {
        id
        title
      }
    }
  }
`;
```

The constant we defined allows us to use the GraphQL code in a `<Mutation />` component. Let's start by importing that component into our App:

```js
import {Mutation} from 'react-apollo';
```

This component receives our mutation in the `mutation` prop, and handles all the details of performing this mutation and holding the state of the result.

How this component renders is expressed using the same `renderProp` pattern we saw in our `Fetch` component, in that it is also passed an object with similar `loading`, `error` and `data` properties. However, the first argument of the `children` prop is a function that triggers the mutation when called, we will call this `createProduct`.

This ends up making the children of our `Mutation` function look pretty similar to that of our `Fetch` component:

```js
<Mutation mutation={CREATE_PRODUCT}>
  {(createProduct, mutationResults) => {
    return <GameList games={fetchResults.data} />;
  }}
</Mutation>
```

We want to call our mutation when a game's `Create Product` button is clicked. We can do this by passing a function into the `onAddGame` prop of our `<GameList />` component. Our `<GameList />`'s `onAddGame` callback is passed the name of the clicked game.

We can pass this along to our `createProduct` mutation function as the `title`, along with a `productType` of "board game":

```js
<Mutation mutation={CREATE_PRODUCT}>
  {(createProduct, mutationResults) => {
    return (
      <GameList
        games={fetchResults.data}
        onAddGame={(title) => {
          const productInput = {
            title: title,
            productType: 'board game',
          };

          createProduct({
            variables: {product: productInput},
          });
        }}
      />
    );
  }}
</Mutation>
```

We can also use the `loading`, `data` and `error` properties from our `mutationResults` to show some user feedback.

The final code for the `<Mutation />` component should look like this and will go in the `return` statement of the `Fetch` component:

```js
<Mutation mutation={CREATE_PRODUCT}>
  {(createProduct, mutationResults) => {
    const loading = mutationResults.loading && <p>loading... </p>;

    const error = mutationResults.error && <p>error creating product</p>;

    const success = mutationResults.data && (
      <p>
        successfully created &nbsp;
        {mutationResults.data.productCreate.product.title}
      </p>
    );

    return (
      <React.Fragment>
        <GameList
          games={fetchResults.data}
          onAddGame={(title) => {
            const productInput = {
              title: title,
              productType: 'board game',
            };

            createProduct({
              variables: {product: productInput},
            });
          }}
        />
        {loading}
        {error}
        {success}
      </React.Fragment>
    );
  }}
</Mutation>
```

#### Step 6: Routing with React

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

##### Exercise

Let's take a few minutes for a quick independent exercise:

1. Try adding a few routes to your own application.
1. Let's try adding a NotFound route and a corresponding component. You'll be able to use a shorthand when you declare the `Route`:
```
<Route exact path="/notfound" component={NotFound}/>
```
1. Our `App.js` file is getting pretty large and eventually will get unmanageable. Let’s pull each of our pages into their own component files.

#### Step 7: Getting our URL bar to update

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

### Closing thoughts

We covered a lot of different topics in this workshop, but hopefully this has given you a headstart on building web-apps using Shopify’s tools for Node and React.

### Additional Resources

Here are some additional resources and official documentation about the technologies and patterns we touched on.

#### Core Libraries
* [React](https://reactjs.org/docs/hello-world.html)
* [Babel](https://babeljs.io/)
* [Webpack](https://webpack.js.org/)
* [Koa](https://koajs.com/)
* [Apollo](https://www.apollographql.com/docs/react/essentials/get-started.html)

#### Concepts
* [Render-props](https://reactjs.org/docs/render-props.html)
* [GraphQL](https://www.howtographql.com/)

#### Components
* [Koa Shopify auth](https://github.com/Shopify/quilt/tree/master/packages/koa-shopify-auth)
* [React HTML component](https://github.com/Shopify/quilt/tree/master/packages/react-html)
* [Shopify GraphQL proxy](https://github.com/Shopify/quilt/tree/master/packages/koa-shopify-graphql-proxy)
* [Prettier](https://prettier.io/)
* [React fetch](https://www.npmjs.com/package/react-fetch)
