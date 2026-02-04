// FILE: assets/js/donate.js

$(document).ready(function() {
    let currentStep = 1;
    const totalSteps = 4;
    let paypalLoaded = false;
    let paypalClientId = null;
    let selectedWalletData = null;

    // Load payment methods on page load
    loadPaymentMethods();

    // Amount selection
    $('.amount-option').click(function() {
        $('.amount-option').removeClass('selected');
        $(this).addClass('selected');

        const amount = $(this).data('amount');

        if (amount === 'custom') {
            $('.custom-amount').slideDown();
            $('#selectedAmount').val('');
            $('#customAmount').focus();
        } else {
            $('.custom-amount').slideUp();
            $('#selectedAmount').val(amount);
        }
    });

    $('#customAmount').on('input', function() {
        $('#selectedAmount').val($(this).val());
    });

    // Load payment methods from database
    function loadPaymentMethods() {
        $.ajax({
            url: 'libs/get-payment-settings.php?action=all',
            type: 'GET',
            dataType: 'json',
            success: function(response) {
                if (response.success && response.payment_methods) {
                    renderPaymentMethods(response.payment_methods);
                } else {
                    console.error('Invalid response from payment settings API');
                    // Fallback to default payment methods if API fails
                    renderDefaultPaymentMethods();
                }
            },
            error: function(xhr, status, error) {
                console.error('Failed to load payment methods:', error);
                console.error('Status:', status);
                console.error('Response:', xhr.responseText);
                // Fallback to default payment methods
                renderDefaultPaymentMethods();
            }
        });
    }

    // Fallback method to render default payment methods
    function renderDefaultPaymentMethods() {
        const defaultMethods = [
            { payment_method: 'credit_card' },
            { payment_method: 'paypal' },
            { payment_method: 'wire_transfer' },
            { payment_method: 'cryptocurrency' }
        ];
        renderPaymentMethods(defaultMethods);
    }

    // Render payment methods
    function renderPaymentMethods(methods) {
        const container = $('#paymentMethodsContainer');
        container.empty();

        const icons = {
            credit_card: 'bi-credit-card',
            paypal: 'bi-paypal',
            wire_transfer: 'bi-bank',
            cryptocurrency: 'bi-currency-bitcoin'
        };

        const names = {
            credit_card: 'Credit Card',
            paypal: 'PayPal',
            wire_transfer: 'Wire Transfer',
            cryptocurrency: 'Cryptocurrency'
        };

        methods.forEach(method => {
            const html = `
                <div class="payment-method" data-method="${method.payment_method}">
                    <i class="bi ${icons[method.payment_method]}"></i>
                    <div class="method-name">${names[method.payment_method]}</div>
                </div>
            `;
            container.append(html);
        });

        // Attach click handlers
        $('.payment-method').click(function() {
            selectPaymentMethod($(this).data('method'));
        });
    }

    // Select payment method
    function selectPaymentMethod(method) {
        $('.payment-method').removeClass('selected');
        $(`.payment-method[data-method="${method}"]`).addClass('selected');
        $('#selectedPaymentMethod').val(method);

        // Hide all payment forms
        $('#creditCardForm').removeClass('show');
        $('#cryptoOptions').removeClass('show');

        // Show relevant form
        if (method === 'credit_card') {
            $('#creditCardForm').addClass('show');
        } else if (method === 'cryptocurrency') {
            $('#cryptoOptions').addClass('show');
            loadCryptoWallets();
        } else if (method === 'paypal') {
            loadPayPalSettings();
        }
    }

    // Load cryptocurrency wallets
    function loadCryptoWallets() {
        $.ajax({
            url: 'libs/get-payment-settings.php?action=crypto',
            type: 'GET',
            success: function(response) {
                if (response.success && response.wallets) {
                    renderCryptoWallets(response.wallets);
                }
            },
            error: function() {
                console.error('Failed to load crypto wallets');
            }
        });
    }

    // Render crypto wallets
    function renderCryptoWallets(wallets) {
        const container = $('#cryptoWalletsList');
        container.empty();

        wallets.forEach(wallet => {
            const id = `crypto_${wallet.crypto_type}_${wallet.network}`.replace(/\s+/g, '_');
            const html = `
                <div class="crypto-option" data-crypto="${wallet.crypto_type}" data-network="${wallet.network}" data-wallet='${JSON.stringify(wallet)}'>
                    <input type="radio" name="crypto_selection" value="${wallet.crypto_type}" id="${id}">
                    <div class="crypto-info">
                        <div class="crypto-name">${wallet.crypto_type}</div>
                        <div class="crypto-network">${wallet.network}</div>
                    </div>
                </div>
            `;
            container.append(html);
        });

        // Attach click handlers
        $('.crypto-option').click(function() {
            $('.crypto-option').removeClass('selected');
            $(this).addClass('selected');
            $(this).find('input[type="radio"]').prop('checked', true);
            
            const cryptoType = $(this).data('crypto');
            const network = $(this).data('network');
            selectedWalletData = $(this).data('wallet');
            
            $('#selectedCryptoType').val(cryptoType);
            $('#selectedCryptoNetwork').val(network);
        });
    }

    // Load PayPal settings
    function loadPayPalSettings() {
        if (!paypalLoaded) {
            $.ajax({
                url: 'libs/get-payment-settings.php?action=paypal',
                type: 'GET',
                success: function(response) {
                    if (response.success && response.settings) {
                        paypalClientId = response.settings.paypal_client_id;
                        loadPayPalSDK(paypalClientId, response.settings.paypal_mode);
                    }
                },
                error: function() {
                    console.error('Failed to load PayPal settings');
                }
            });
        }
    }

    // Load PayPal SDK
    function loadPayPalSDK(clientId, mode) {
        if (!clientId) {
            showError('PayPal is not configured. Please contact support.');
            return;
        }

        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
        script.onload = function() {
            paypalLoaded = true;
            console.log('PayPal SDK loaded successfully');
        };
        script.onerror = function() {
            showError('Failed to load PayPal. Please try another payment method.');
        };
        document.head.appendChild(script);
    }

    // Credit Card Validation
    const cardNumber = $('#cardNumber');
    const cardTypeIcon = $('#cardTypeIcon');

    // Format card number with spaces
    cardNumber.on('input', function() {
        let value = $(this).val().replace(/\s+/g, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        $(this).val(formattedValue);

        // Detect card type
        const cardType = detectCardType(value);
        updateCardTypeIcon(cardType);

        // Validate card number
        if (value.length >= 13) {
            if (validateCardNumber(value)) {
                $(this).addClass('valid').removeClass('invalid');
            } else {
                $(this).addClass('invalid').removeClass('valid');
            }
        } else {
            $(this).removeClass('valid invalid');
        }
    });

    // Detect card type
    function detectCardType(number) {
        const patterns = {
            visa: /^4/,
            mastercard: /^5[1-5]|^2[2-7]/,
            amex: /^3[47]/,
            discover: /^6(?:011|5)/
        };

        for (let type in patterns) {
            if (patterns[type].test(number)) {
                return type;
            }
        }
        return null;
    }

    // Update card type icon
    function updateCardTypeIcon(type) {
        cardTypeIcon.removeClass('show visa mastercard amex discover');
        
        if (type) {
            const icons = {
                visa: 'fab fa-cc-visa',
                mastercard: 'fab fa-cc-mastercard',
                amex: 'fab fa-cc-amex',
                discover: 'fab fa-cc-discover'
            };

            cardTypeIcon.html(`<i class="${icons[type]}"></i>`);
            cardTypeIcon.addClass('show ' + type);
        }
    }

    // Luhn algorithm for card validation
    function validateCardNumber(number) {
        number = number.replace(/\s+/g, '');
        
        if (!/^\d+$/.test(number)) return false;
        
        let sum = 0;
        let isEven = false;

        for (let i = number.length - 1; i >= 0; i--) {
            let digit = parseInt(number[i]);

            if (isEven) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }

            sum += digit;
            isEven = !isEven;
        }

        return sum % 10 === 0;
    }

    // Format expiry date
    $('#cardExpiry').on('input', function() {
        let value = $(this).val().replace(/\s+/g, '').replace(/[^0-9]/g, '');
        
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        
        $(this).val(value);

        // Validate expiry
        if (value.length === 5) {
            if (validateExpiry(value)) {
                $(this).addClass('valid').removeClass('invalid');
            } else {
                $(this).addClass('invalid').removeClass('valid');
            }
        } else {
            $(this).removeClass('valid invalid');
        }
    });

    // Validate expiry date
    function validateExpiry(expiry) {
        const parts = expiry.split('/');
        if (parts.length !== 2) return false;

        const month = parseInt(parts[0]);
        const year = parseInt('20' + parts[1]);

        if (month < 1 || month > 12) return false;

        const now = new Date();
        const expiryDate = new Date(year, month - 1);
        
        return expiryDate > now;
    }

    // CVV validation
    $('#cardCVV').on('input', function() {
        let value = $(this).val().replace(/\D/g, '');
        $(this).val(value);

        const cardType = detectCardType(cardNumber.val().replace(/\s+/g, ''));
        const expectedLength = cardType === 'amex' ? 4 : 3;

        if (value.length === expectedLength) {
            $(this).addClass('valid').removeClass('invalid');
        } else if (value.length > 0) {
            $(this).addClass('invalid').removeClass('valid');
        } else {
            $(this).removeClass('valid invalid');
        }
    });

    // Navigation
    $('#nextBtn').click(function() {
        if (validateStep(currentStep)) {
            if (currentStep < totalSteps) {
                currentStep++;
                showStep(currentStep);
            }
        }
    });

    $('#prevBtn').click(function() {
        if (currentStep > 1) {
            currentStep--;
            showStep(currentStep);
        }
    });

    function showStep(step) {
        // Update steps
        $('.form-step').removeClass('active');
        $(`.form-step[data-step="${step}"]`).addClass('active');

        // Update progress
        $('.step').removeClass('active completed');
        for (let i = 1; i < step; i++) {
            $(`.step[data-step="${i}"]`).addClass('completed');
        }
        $(`.step[data-step="${step}"]`).addClass('active');

        // Update buttons
        if (step === 1) {
            $('#prevBtn').hide();
        } else {
            $('#prevBtn').show();
        }

        if (step === totalSteps) {
            $('#nextBtn').hide();
            $('#submitBtn').show();
            updateSummary();
        } else {
            $('#nextBtn').show();
            $('#submitBtn').hide();
        }

        // Scroll to top
        $('.donation-card').get(0).scrollIntoView({ behavior: 'smooth' });
    }

    function validateStep(step) {
        switch (step) {
            case 1:
                const amount = $('#selectedAmount').val();
                if (!amount || parseFloat(amount) <= 0) {
                    showError('Please select or enter a donation amount.');
                    return false;
                }
                return true;

            case 2:
                const method = $('#selectedPaymentMethod').val();
                if (!method) {
                    showError('Please select a payment method.');
                    return false;
                }

                if (method === 'cryptocurrency' && !$('input[name="crypto_selection"]:checked').val()) {
                    showError('Please select a cryptocurrency.');
                    return false;
                }

                if (method === 'credit_card') {
                    if (!validateCreditCardForm()) {
                        return false;
                    }
                }
                return true;

            case 3:
                const name = $('#donorName').val().trim();
                const email = $('#donorEmail').val().trim();

                if (!name) {
                    showError('Please enter your name.');
                    return false;
                }
                if (!email || !isValidEmail(email)) {
                    showError('Please enter a valid email address.');
                    return false;
                }
                return true;

            default:
                return true;
        }
    }

    function validateCreditCardForm() {
        const number = $('#cardNumber').val().replace(/\s+/g, '');
        const name = $('#cardName').val().trim();
        const expiry = $('#cardExpiry').val();
        const cvv = $('#cardCVV').val();

        if (!validateCardNumber(number)) {
            showError('Please enter a valid card number.');
            return false;
        }

        if (!name) {
            showError('Please enter the cardholder name.');
            return false;
        }

        if (!validateExpiry(expiry)) {
            showError('Please enter a valid expiry date (MM/YY).');
            return false;
        }

        const cardType = detectCardType(number);
        const expectedCVVLength = cardType === 'amex' ? 4 : 3;
        
        if (cvv.length !== expectedCVVLength) {
            showError(`Please enter a valid ${expectedCVVLength}-digit CVV.`);
            return false;
        }

        return true;
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function updateSummary() {
        const amount = parseFloat($('#selectedAmount').val());
        const method = $('#selectedPaymentMethod').val();
        const name = $('#donorName').val();
        const email = $('#donorEmail').val();
        const isAnonymous = $('#isAnonymous').is(':checked');

        $('#summaryAmount').text('$' + amount.toFixed(2));
        $('#summaryTotal').text('$' + amount.toFixed(2));
        $('#summaryName').text(isAnonymous ? 'Anonymous' : name);
        $('#summaryEmail').text(email);

        // Payment method display
        let methodText = method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        if (method === 'cryptocurrency') {
            const cryptoType = $('#selectedCryptoType').val();
            const network = $('#selectedCryptoNetwork').val();
            if (cryptoType) {
                methodText += ` (${cryptoType} - ${network})`;
            }
        }

        if (method === 'credit_card') {
            const cardType = detectCardType($('#cardNumber').val().replace(/\s+/g, ''));
            if (cardType) {
                methodText += ` (${cardType.toUpperCase()})`;
            }
        }

        $('#summaryPaymentMethod').text(methodText);

        // Show payment instructions
        showPaymentInstructions(method);
    }

    function showPaymentInstructions(method) {
        const container = $('#paymentInstructions');
        container.empty();

        if (method === 'wire_transfer') {
            loadWireTransferInstructions(container);
        } else if (method === 'cryptocurrency') {
            loadCryptoInstructions(container);
        } else if (method === 'paypal') {
            $('#paypal-button-container').show();
            $('#transactionRefGroup').hide();
            $('#submitBtn').hide();
            renderPayPalButton();
        } else if (method === 'credit_card') {
            container.html(`
                <div class="payment-info">
                    <strong>Credit Card Payment</strong>
                    <p>Your payment will be processed securely when you click "Complete Donation".</p>
                </div>
            `).addClass('show');
        }
    }

    function loadWireTransferInstructions(container) {
        $.ajax({
            url: 'libs/get-payment-settings.php?action=wire_transfer',
            type: 'GET',
            success: function(response) {
                if (response.success && response.settings) {
                    const s = response.settings;
                    let html = `
                        <div class="payment-info">
                            <strong>Wire Transfer Details</strong>
                            ${s.bank_name ? `<p><strong>Bank Name:</strong> ${s.bank_name}</p>` : ''}
                            ${s.account_name ? `<p><strong>Account Name:</strong> ${s.account_name}</p>` : ''}
                            ${s.account_number ? `<p><strong>Account Number:</strong> ${s.account_number}</p>` : ''}
                            ${s.routing_number ? `<p><strong>Routing Number:</strong> ${s.routing_number}</p>` : ''}
                            ${s.swift_code ? `<p><strong>SWIFT Code:</strong> ${s.swift_code}</p>` : ''}
                            ${s.iban ? `<p><strong>IBAN:</strong> ${s.iban}</p>` : ''}
                            ${s.bank_address ? `<p><strong>Bank Address:</strong> ${s.bank_address}</p>` : ''}
                            ${s.wire_instructions ? `<p class="mt-3"><em>${s.wire_instructions}</em></p>` : ''}
                        </div>
                    `;
                    container.html(html).addClass('show');
                }
            }
        });
    }

    function loadCryptoInstructions(container) {
        if (selectedWalletData) {
            const wallet = selectedWalletData;
            
            // Generate QR code URL
            const qrCodeUrl = wallet.qr_code_path || 
                `https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=${encodeURIComponent(wallet.wallet_address)}&choe=UTF-8`;

            let html = `
                <div class="payment-info">
                    <strong>${wallet.crypto_type} (${wallet.network}) Payment</strong>
                    ${wallet.instructions ? `<p>${wallet.instructions}</p>` : ''}
                    
                    <div class="qr-code-display">
                        <h5>Scan QR Code or Copy Address</h5>
                        <img src="${qrCodeUrl}" alt="${wallet.crypto_type} QR Code">
                        <div class="wallet-address">${wallet.wallet_address}</div>
                        <button type="button" class="copy-address-btn" onclick="copyWalletAddress('${wallet.wallet_address}')">
                            <i class="fas fa-copy"></i> Copy Address
                        </button>
                    </div>
                    
                    <p class="mt-3"><em>After sending, please enter the transaction ID below.</em></p>
                </div>
            `;
            container.html(html).addClass('show');
        }
    }

    // Copy wallet address function
    window.copyWalletAddress = function(address) {
        navigator.clipboard.writeText(address).then(function() {
            const btn = $('.copy-address-btn');
            btn.html('<i class="fas fa-check"></i> Copied!').addClass('copied');
            setTimeout(function() {
                btn.html('<i class="fas fa-copy"></i> Copy Address').removeClass('copied');
            }, 2000);
        });
    };

    // Render PayPal button
    function renderPayPalButton() {
        if (!paypalLoaded || !window.paypal) {
            setTimeout(renderPayPalButton, 500);
            return;
        }

        const amount = $('#selectedAmount').val();

        $('#paypal-button-container').empty();

        paypal.Buttons({
            createOrder: function(data, actions) {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: amount
                        },
                        description: 'Donation to Organization'
                    }]
                });
            },
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(details) {
                    // Process donation with PayPal details
                    processDonationWithPayPal(details, data.orderID);
                });
            },
            onError: function(err) {
                console.error('PayPal Error:', err);
                showError('PayPal payment failed. Please try again or use another payment method.');
            }
        }).render('#paypal-button-container');
    }

    function processDonationWithPayPal(details, orderId) {
        $('#loadingSpinner').show();

        const formData = new FormData($('#donationForm')[0]);
        formData.set('paypal_order_id', orderId);
        formData.set('paypal_payer_id', details.payer.payer_id);
        formData.set('payment_status', 'completed');

        $.ajax({
            url: 'libs/ajax/process-donation.php',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                $('#loadingSpinner').hide();
                if (response.success) {
                    $('#successMessage').text('Thank you for your donation via PayPal! Transaction ID: ' + orderId);
                    $('#successModal').modal('show');
                    setTimeout(function() {
                        window.location.href = 'index.php';
                    }, 3000);
                } else {
                    showError(response.message || 'Failed to record donation.');
                }
            },
            error: function() {
                $('#loadingSpinner').hide();
                showError('A server error occurred. Please contact support with order ID: ' + orderId);
            }
        });
    }

    // Form submission (for non-PayPal methods)
    $('#donationForm').submit(function(e) {
        e.preventDefault();

        const method = $('#selectedPaymentMethod').val();
        
        // PayPal is handled separately
        if (method === 'paypal') {
            return false;
        }

        $('#loadingSpinner').show();
        $('#submitBtn').prop('disabled', true);

        const formData = new FormData(this);

        // Add credit card info if applicable
        if (method === 'credit_card') {
            const cardType = detectCardType($('#cardNumber').val().replace(/\s+/g, ''));
            const cardLast4 = $('#cardNumber').val().replace(/\s+/g, '').slice(-4);
            
            formData.set('card_type', cardType);
            formData.set('card_last4', cardLast4);
            // Note: Never send full card details to your server
            // This should go to a payment processor like Stripe
        }

        $.ajax({
            url: 'libs/ajax/process-donation.php',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                $('#loadingSpinner').hide();
                $('#submitBtn').prop('disabled', false);

                if (response.success) {
                    $('#successModal').modal('show');
                    setTimeout(function() {
                        window.location.href = 'index.php';
                    }, 3000);
                } else {
                    showError(response.message || 'An error occurred while processing your donation.');
                }
            },
            error: function() {
                $('#loadingSpinner').hide();
                $('#submitBtn').prop('disabled', false);
                showError('A server error occurred. Please try again later.');
            }
        });
    });

    function showError(message) {
        $('#errorMessage').text(message);
        $('#errorModal').modal('show');
    }
});