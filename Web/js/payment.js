// Payment Page JavaScript
(function () {
    'use strict';
    /* global paypal */

    const API_URL = '';

    // Plan configuration
    const plans = {
        creator: {
            name: 'Creator',
            price: 10,
            duration: '30 Days',
            type: 'subscription'
        },
        studio: {
            name: 'Studio',
            price: 20,
            duration: '30 Days',
            type: 'subscription'
        },
        lifetime: {
            name: 'Lifetime',
            price: 99,
            duration: 'Forever',
            type: 'one-time'
        }
    };

    let selectedPlan = null;
    let paypalButtonsRendered = false;

    // Initialize page
    document.addEventListener('DOMContentLoaded', function () {
        checkAuthentication();
        setupPlanSelection();
        initPayPalButtons();
    });

    // Check if user is logged in
    async function checkAuthentication() {
        const token = localStorage.getItem('sessionToken');
        if (!token) {
            alert('Please login first to purchase a plan.');
            window.location.href = 'login.html';
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/session`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                alert('Session expired. Please login again.');
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Auth check error:', error);
        }
    }

    // Setup plan card selection
    function setupPlanSelection() {
        const planCards = document.querySelectorAll('.plan-card');

        planCards.forEach(card => {
            card.addEventListener('click', function () {
                // Remove selected from all cards
                planCards.forEach(c => c.classList.remove('selected'));

                // Add selected to clicked card
                this.classList.add('selected');

                // Get plan data
                const planId = this.dataset.plan;
                selectedPlan = plans[planId];
                selectedPlan.id = planId;

                // Update order summary
                updateOrderSummary();

                // Enable PayPal button
                const paypalContainer = document.querySelector('.paypal-container');
                paypalContainer.classList.remove('disabled');
            });
        });
    }

    // Update the order summary section
    function updateOrderSummary() {
        if (!selectedPlan) return;

        document.getElementById('selected-plan-name').textContent = selectedPlan.name;
        document.getElementById('selected-plan-duration').textContent = selectedPlan.duration;
        document.getElementById('selected-plan-price').textContent = `$${selectedPlan.price.toFixed(2)}`;
    }

    // Initialize PayPal Smart Buttons
    function initPayPalButtons() {
        if (paypalButtonsRendered) return;

        const paypalContainer = document.querySelector('.paypal-container');
        paypalContainer.classList.add('disabled');

        paypal.Buttons({
            style: {
                layout: 'vertical',
                color: 'blue',
                shape: 'rect',
                label: 'pay',
                height: 55
            },

            // Create order
            createOrder: function (data, actions) {
                if (!selectedPlan) {
                    alert('Please select a plan first!');
                    return;
                }

                return actions.order.create({
                    purchase_units: [{
                        description: `FastPast ${selectedPlan.name} Plan`,
                        amount: {
                            currency_code: 'USD',
                            value: selectedPlan.price.toFixed(2)
                        }
                    }]
                });
            },

            // On approval
            onApprove: async function (data, actions) {
                try {
                    // Capture the payment
                    const order = await actions.order.capture();
                    console.log('Payment captured:', order);

                    // Send to our server to upgrade user
                    const result = await processPayment({
                        orderId: order.id,
                        payerId: order.payer.payer_id,
                        planId: selectedPlan.id,
                        amount: selectedPlan.price,
                        payerEmail: order.payer.email_address
                    });

                    if (result.success) {
                        // Update local storage with new user info
                        if (result.user) {
                            localStorage.setItem('currentUser', JSON.stringify(result.user));
                        }

                        // Redirect to success page
                        window.location.href = 'payment-success.html?plan=' + selectedPlan.id;
                    } else {
                        alert('Payment was received but there was an error upgrading your account. Please contact support.');
                    }
                } catch (error) {
                    console.error('Payment error:', error);
                    alert('Payment failed. Please try again.');
                }
            },

            // On cancel
            onCancel: function (data) {
                console.log('Payment cancelled:', data);
            },

            // On error
            onError: function (err) {
                console.error('PayPal error:', err);
                alert('Payment error. Please try again.');
            }
        }).render('#paypal-button-container');

        paypalButtonsRendered = true;
    }

    // Process payment on our server
    async function processPayment(paymentData) {
        const token = localStorage.getItem('sessionToken');

        try {
            const response = await fetch(`${API_URL}/payment/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(paymentData)
            });

            const result = await response.json();

            if (response.ok) {
                return { success: true, user: result.data.user };
            } else {
                console.error('Server error:', result.error);
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Process payment error:', error);
            return { success: false, error: error.message };
        }
    }

})();
