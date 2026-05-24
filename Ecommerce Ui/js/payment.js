// Mock payment UI handler and simulated email service

function getCartItems(){
    return JSON.parse(localStorage.getItem('cart')) || [];
}

function openPaymentModal(){
    const amountEl = document.getElementById('payment-amount');
    const totalEl = document.getElementById('total-amount');
    const amt = parseFloat(totalEl ? totalEl.innerText : '0') || 0;
    const cartItems = getCartItems();
    if(!cartItems || cartItems.length === 0 || amt <= 0){
        alert('Your cart is empty. Add items before proceeding to payment.');
        return;
    }
    amountEl.innerText = amt.toFixed(2);

    // reset form
    const form = document.getElementById('payment-form');
    form.reset();

    // show/hide card fields based on selected method
    toggleCardFields();

    const modalEl = document.getElementById('paymentModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

function toggleCardFields(){
    const method = document.querySelector('input[name="paymentMethod"]:checked').value;
    const cardFields = document.getElementById('card-fields');
    if(method === 'card') cardFields.style.display = '';
    else cardFields.style.display = 'none';
}

// Listen for payment method changes
document.addEventListener('change', (e) => {
    if(e.target && e.target.name === 'paymentMethod') toggleCardFields();
});

// Payment form submit
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('payment-form');
    if(!form) return;

    form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        processMockPayment();
    });
});

function processMockPayment(){
    const payBtn = document.getElementById('pay-button');
    const name = document.getElementById('payer-name').value.trim();
    const email = document.getElementById('payer-email').value.trim();
    const amount = parseFloat(document.getElementById('payment-amount').innerText) || 0;

    const cartItems = getCartItems();
    if(!cartItems || cartItems.length === 0 || amount <= 0){
        alert('No items in cart to pay for.');
        return;
    }

    if(!email || !validateEmail(email)){
        alert('Please enter a valid email.');
        return;
    }

    payBtn.disabled = true;
    const originalText = payBtn.innerHTML;
    payBtn.innerHTML = 'Processing...';

    // simulate network/payment delay
    setTimeout(() => {
        // simulate success
        const cartItems = getCartItems();
        sendPaymentEmail(email, {name, amount, items: cartItems});

        // clear cart on successful payment
        localStorage.removeItem('cart');
        // update UI
        try{ loadCart(); updateCartCounter(); }catch(e){console.warn(e)}

        // hide modal
        const modalEl = document.getElementById('paymentModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if(modal) modal.hide();

        // show toast
        const toastEl = document.getElementById('payment-toast');
        const toast = new bootstrap.Toast(toastEl);
        toast.show();

        // restore button
        payBtn.disabled = false;
        payBtn.innerHTML = originalText;
    }, 1200);
}

function sendPaymentEmail(email, details){
    // This is a simulated email send. In production, call real email API/server.
    const payments = JSON.parse(localStorage.getItem('payments')) || [];
    const record = {
        email,
        name: details.name || '',
        amount: details.amount || 0,
        items: details.items || [],
        timestamp: new Date().toISOString()
    };
    payments.push(record);
    localStorage.setItem('payments', JSON.stringify(payments));
    console.log('Simulated payment email saved:', record);
}

function validateEmail(email){
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}
