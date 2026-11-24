import {authorize,json,fail} from '@/lib/http';
export async function GET(){try{return json(await authorize());}catch(e){return fail(e);}}
