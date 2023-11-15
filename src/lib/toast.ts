import { toast } from '@zerodevx/svelte-toast';
import type { SvelteToastOptions } from '@zerodevx/svelte-toast/stores';

export const error = (m: string | SvelteToastOptions) =>
    toast.push(m, {
        theme: {
            '--toastBackground': 'red',
            '--toastColor': 'white',
            '--toastBarBackground': 'white'
        }
    });

export const success = (m: string | SvelteToastOptions) =>
    toast.push(m, {
        theme: {
            '--toastColor': 'mintcream',
            '--toastBackground': 'rgba(72,187,120,0.9)',
            '--toastBarBackground': '#2F855A'
        }
    });
