export const handleGetAccessLogic = (slug: string, user: any, toast: any) => {
    if (import.meta.env.VITE_CHECKOUT_ENABLED !== 'true') {
        window.location.href = "/contact";
        return;
    }

    if (!user) {
        toast({
            title: "Authentication Required",
            description: "Please sign in or create an account to get access to this tool.",
            variant: "destructive"
        });
        setTimeout(() => {
            window.location.href = "/auth";
        }, 1500);
        return;
    }

    const existingCartStr = localStorage.getItem('cart');
    let cart = existingCartStr ? JSON.parse(existingCartStr) : [];
    if (!cart.includes(slug)) {
        cart.push(slug);
    }
    localStorage.setItem('cart', JSON.stringify(cart));

    window.location.href = "/cart";
};
