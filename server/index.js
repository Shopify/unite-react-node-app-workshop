import dotenv from 'dotenv';
import Koa from 'koa';
import session from 'koa-session';
import createShopifyAuth, {
  createVerifyRequest,
} from '@shopify/koa-shopify-auth';
import renderReactApp from './render-react-app';
import webpack from 'koa-webpack';
import graphQLProxy from '@shopify/koa-shopify-graphql-proxy';

dotenv.config();

const {SHOPIFY_API_KEY, SHOPIFY_SECRET} = process.env;
const app = new Koa();

app.use(session(app));

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

app.keys = [SHOPIFY_SECRET];



// secure all middleware after this line
app.use(createVerifyRequest());

app.use(async function(ctx, next) {
  // log 'middleware 1'
  console.log('middleware 1');
  // then pause and wait for the next middleware
  await next();
  // then log 'back to middleware 1'
  console.log('back to middleware 1');
});

app.use(webpack());
app.use(graphQLProxy);
app.use(renderReactApp);





export default app;
