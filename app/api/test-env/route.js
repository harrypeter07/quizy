export async function GET() {
  const envVars = {
    MONGODB_URI: !!process.env.MONGODB_URI,
    ADMIN_TOKEN: !!process.env.ADMIN_TOKEN,
    NODE_ENV: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('MONGODB') || key.includes('ADMIN'))
  };
  
  return new Response(JSON.stringify(envVars), { 
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
} 