import { serve } from './serve';

serve(process.argv[2], Number(process.argv[3]) || 3000);
