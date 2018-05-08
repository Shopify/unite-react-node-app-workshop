import dotenv from 'dotenv';
import Koa from 'koa';
import session from 'koa-session';
import createShopifyAuth, {
  createVerifyRequest,
} from '@shopify/koa-shopify-auth';

dotenv.config();
const {SHOPIFY_SECRET, SHOPIFY_API_KEY} = process.env;

const app = new Koa();
app.use(session(app));

app.keys = [SHOPIFY_SECRET];

console.log(SHOPIFY_SECRET, SHOPIFY_API_KEY);

app.use(
  createShopifyAuth({
    apiKey: SHOPIFY_API_KEY,
    secret: SHOPIFY_SECRET,
    scopes: ['write_products'],
    afterAuth(ctx) {
      const {shop, accessToken} = ctx.session;

      console.log('We did it!', shop, accessToken);

      ctx.redirect('/');
    },
  }),
);

app.use(createVerifyRequest());

app.use(function index(ctx) {
  console.log('Hello Unite 👋');
  ctx.body = 'Hello Unite 👋';
});

export default app;
