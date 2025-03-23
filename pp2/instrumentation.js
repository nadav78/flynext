export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { getInitialData } = await import('@/utils/get-afs.js');
        const status = await getInitialData();
        console.log(status);
    }
}