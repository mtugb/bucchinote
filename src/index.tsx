import { Hono } from 'hono'
import { renderer } from './renderer'
import { drizzle } from 'drizzle-orm/d1' 
import { users } from './db/schema'
import type { D1Database } from '@cloudflare/workers-types'
import { sql } from 'drizzle-orm' 
import { authHandler, initAuthConfig, verifyAuth } from '@hono/auth-js'
import Google from '@auth/core/providers/google'
type Bindings = {
  bn: D1Database 
}
const app = new Hono<{ Bindings: Bindings }>()
app.use(renderer)

app.use(
  '*',
  initAuthConfig((c) => ({
    secret: c.env.AUTH_SECRET,
    providers: [
      Google({
        clientId: c.env.GOOGLE_ID,
        clientSecret: c.env.GOOGLE_SECRET,
      }),
    ],
  }))
)

app.use('/api/auth/*', authHandler())
app.get('/api/auth/hello', e=>e.text("hello auth"))

app.use('/admin/*', verifyAuth())
app.get('/admin/hello', e=>e.text("hello admin"))

app.get('/', (c) => {
  return c.render(<h1>Hello, bucchinote!</h1>)
})
app.get('/test', async (c) => {
  
  const d1 = c.env.bn
  if (!d1) {
    console.error("D1 database (binding: 'bn') is not available in environment.");
    return c.body("D1 database not found.", 500);
  }
  
  const db = drizzle(d1);
  try {
    const result = await db.insert(users).values({ 
        sub: "test_sub_" + Date.now(), 
    }).returning().get();
    
    console.log(`User inserted: ${JSON.stringify(result)}`);
    return c.body("User inserted successfully", 201);
  } catch (e) {
    if (e instanceof Error) {
      console.error({ message: "Drizzle Insert Error", errorMessage: e.message, stack: e.stack });
      
      return c.body("Database operation failed: " + e.message, 500);    
    }
    console.error({ message: "Unknown Database Error" });
    return c.body("Unknown error occurred during DB operation.", 500);
  }
})
app.get('/users', async (c) => {
    const db = drizzle(c.env.bn);
    const allUsers = await db.select().from(users).all();
    return c.json(allUsers);
})

app.get('/my/:id', async(c)=>{
  const id = c.req.param('id');
  c.text('my' + id);
})



export default app
