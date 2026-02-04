/**
 * ============================================
 * MULTI-STEP DONATION FORM - DEMO IMPLEMENTATION
 * ============================================
 */

(function() {
    'use strict';

    // ============================================
    // CONFIGURATION & STATE
    // ============================================
    
    const config = {
        apiEndpoint: '/api/donations', // Demo endpoint (not real)
        stripePublicKey: 'pk_test_demo_key', // Demo key
        paypalClientId: 'demo_paypal_client_id', // Demo key
    };

    const state = {
        currentStep: 1,
        totalSteps: 4,
        selectedAmount: null,
        selectedPaymentMethod: null,
        selectedCryptoType: null,
        selectedCryptoNetwork: null,
        formData: {},
        paymentMethods: [],
        cryptoWallets: []
    };

    // Demo Payment Methods
    const demoPaymentMethods = [
        {
            id: 1,
            name: 'Credit Card',
            type: 'credit_card',
            icon: 'fas fa-credit-card',
            enabled: true
        },
        {
            id: 2,
            name: 'PayPal',
            type: 'paypal',
            icon: 'fab fa-paypal',
            enabled: true
        },
        {
            id: 3,
            name: 'Bank Transfer',
            type: 'bank_transfer',
            icon: 'fas fa-university',
            enabled: true
        },
        {
            id: 4,
            name: 'Cryptocurrency',
            type: 'crypto',
            icon: 'fab fa-bitcoin',
            enabled: true
        }
    ];

    // Demo Crypto Wallets
    const demoCryptoWallets = [
        {
            id: 1,
            name: 'Bitcoin',
            symbol: 'BTC',
            network: 'Bitcoin Mainnet',
            address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
            qr_code: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
        },
        {
            id: 2,
            name: 'Ethereum',
            symbol: 'ETH',
            network: 'Ethereum Mainnet',
            address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            qr_code: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=ethereum:0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
        },
        {
            id: 3,
            name: 'USDT',
            symbol: 'USDT',
            network: 'TRC20 (Tron)',
            address: 'TYASr5UV6HEcXatwdFQfmLVUqQQQMUxHLS',
            qr_code: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=tron:TYASr5UV6HEcXatwdFQfmLVUqQQQMUxHLS'
        },
        {
            id: 4,
            name: 'USDC',
            symbol: 'USDC',
            network: 'ERC20 (Ethereum)',
            address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            qr_code: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=ethereum:0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
        }
    ];

    // Demo Bank Transfer Details
    const demoBankDetails = {
        bank_name: 'Global PetPal Community Bank',
        account_name: 'Global PetPal Foundation',
        account_number: '1234567890',
        routing_number: '021000021',
        swift_code: 'GPPCUS33',
        reference: 'DONATION-' + Date.now()
    };

    // ============================================
    // INITIALIZATION
    // ============================================

    function init() {
        loadPaymentMethods();
        setupEventListeners();
        updateProgressSteps();
        updateNavigationButtons();
    }

    // ============================================
    // PAYMENT METHODS
    // ============================================

    function loadPaymentMethods() {
        state.paymentMethods = demoPaymentMethods;
        state.cryptoWallets = demoCryptoWallets;
        renderPaymentMethods();
        renderCryptoWallets();
    }

    function renderPaymentMethods() {
        const container = document.getElementById('paymentMethodsContainer');
        if (!container) return;

        container.innerHTML = state.paymentMethods.map(method => `
            <div class="payment-method" data-method="${method.type}">
                <i class="${method.icon}"></i>
                <div class="method-name">${method.name}</div>
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.payment-method').forEach(element => {
            element.addEventListener('click', function() {
                selectPaymentMethod(this.dataset.method);
            });
        });
    }

    function renderCryptoWallets() {
        const container = document.getElementById('cryptoWalletsList');
        if (!container) return;

        container.innerHTML = state.cryptoWallets.map(wallet => `
            <div class="crypto-option" data-crypto="${wallet.symbol}" data-network="${wallet.network}">
                <input type="radio" name="crypto_selection" id="crypto_${wallet.id}">
                <div class="crypto-info">
                    <div class="crypto-name">${wallet.name} (${wallet.symbol})</div>
                    <div class="crypto-network">${wallet.network}</div>
                </div>
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.crypto-option').forEach(element => {
            element.addEventListener('click', function() {
                selectCryptoWallet(this.dataset.crypto, this.dataset.network);
            });
        });
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================

    function setupEventListeners() {
        // Amount selection
        document.querySelectorAll('.amount-option').forEach(option => {
            option.addEventListener('click', function() {
                selectAmount(this.dataset.amount);
            });
        });

        // Custom amount input
        const customAmountInput = document.getElementById('customAmount');
        if (customAmountInput) {
            customAmountInput.addEventListener('input', function() {
                if (this.value) {
                    selectAmount('custom', parseFloat(this.value));
                }
            });
        }

        // Navigation buttons
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');
        const submitBtn = document.getElementById('submitBtn');

        if (nextBtn) {
            nextBtn.addEventListener('click', nextStep);
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', prevStep);
        }

        // Form submission
        const form = document.getElementById('donationForm');
        if (form) {
            form.addEventListener('submit', handleFormSubmit);
        }

        // Credit card input formatting
        setupCreditCardFormatting();
    }

    // ============================================
    // AMOUNT SELECTION
    // ============================================

    function selectAmount(amount, customValue = null) {
        // Remove previous selection
        document.querySelectorAll('.amount-option').forEach(opt => {
            opt.classList.remove('selected');
        });

        // Set new selection
        const selectedOption = document.querySelector(`[data-amount="${amount}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }

        // Handle custom amount
        const customAmountDiv = document.querySelector('.custom-amount');
        const customAmountInput = document.getElementById('customAmount');

        if (amount === 'custom') {
            customAmountDiv.style.display = 'block';
            state.selectedAmount = customValue || parseFloat(customAmountInput.value) || 0;
        } else {
            customAmountDiv.style.display = 'none';
            state.selectedAmount = parseFloat(amount);
        }

        // Update hidden input
        document.getElementById('selectedAmount').value = state.selectedAmount;

        console.log('Selected amount:', state.selectedAmount);
    }

    // ============================================
    // PAYMENT METHOD SELECTION
    // ============================================

    function selectPaymentMethod(method) {
        // Remove previous selection
        document.querySelectorAll('.payment-method').forEach(pm => {
            pm.classList.remove('selected');
        });

        // Set new selection
        const selectedMethod = document.querySelector(`[data-method="${method}"]`);
        if (selectedMethod) {
            selectedMethod.classList.add('selected');
        }

        state.selectedPaymentMethod = method;
        document.getElementById('selectedPaymentMethod').value = method;

        // Show/hide relevant forms
        const creditCardForm = document.getElementById('creditCardForm');
        const cryptoOptions = document.getElementById('cryptoOptions');

        creditCardForm.classList.remove('show');
        cryptoOptions.classList.remove('show');

        if (method === 'credit_card') {
            creditCardForm.classList.add('show');
        } else if (method === 'crypto') {
            cryptoOptions.classList.add('show');
        }

        console.log('Selected payment method:', method);
    }

    function selectCryptoWallet(crypto, network) {
        // Remove previous selection
        document.querySelectorAll('.crypto-option').forEach(opt => {
            opt.classList.remove('selected');
            opt.querySelector('input[type="radio"]').checked = false;
        });

        // Set new selection
        const selectedOption = document.querySelector(`[data-crypto="${crypto}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
            selectedOption.querySelector('input[type="radio"]').checked = true;
        }

        state.selectedCryptoType = crypto;
        state.selectedCryptoNetwork = network;

        document.getElementById('selectedCryptoType').value = crypto;
        document.getElementById('selectedCryptoNetwork').value = network;

        console.log('Selected crypto:', crypto, network);
    }

    // ============================================
    // CREDIT CARD FORMATTING
    // ============================================

    function setupCreditCardFormatting() {
        const cardNumberInput = document.getElementById('cardNumber');
        const cardExpiryInput = document.getElementById('cardExpiry');
        const cardCVVInput = document.getElementById('cardCVV');
        const cardTypeIcon = document.getElementById('cardTypeIcon');

        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\s/g, '');
                let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
                e.target.value = formattedValue;

                // Detect card type
                const cardType = detectCardType(value);
                updateCardTypeIcon(cardType, cardTypeIcon);

                // Validation
                if (value.length >= 13) {
                    e.target.classList.add('valid');
                    e.target.classList.remove('invalid');
                } else if (value.length > 0) {
                    e.target.classList.add('invalid');
                    e.target.classList.remove('valid');
                }
            });
        }

        if (cardExpiryInput) {
            cardExpiryInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.slice(0, 2) + '/' + value.slice(2, 4);
                }
                e.target.value = value;

                // Validation
                if (value.length === 5) {
                    const [month, year] = value.split('/');
                    const currentYear = new Date().getFullYear() % 100;
                    const currentMonth = new Date().getMonth() + 1;

                    if (parseInt(month) >= 1 && parseInt(month) <= 12 &&
                        (parseInt(year) > currentYear || 
                         (parseInt(year) === currentYear && parseInt(month) >= currentMonth))) {
                        e.target.classList.add('valid');
                        e.target.classList.remove('invalid');
                    } else {
                        e.target.classList.add('invalid');
                        e.target.classList.remove('valid');
                    }
                }
            });
        }

        if (cardCVVInput) {
            cardCVVInput.addEventListener('input', function(e) {
                e.target.value = e.target.value.replace(/\D/g, '');

                if (e.target.value.length >= 3) {
                    e.target.classList.add('valid');
                    e.target.classList.remove('invalid');
                } else if (e.target.value.length > 0) {
                    e.target.classList.add('invalid');
                    e.target.classList.remove('valid');
                }
            });
        }
    }

    function detectCardType(number) {
        const patterns = {
            visa: /^4/,
            mastercard: /^5[1-5]/,
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

    function updateCardTypeIcon(cardType, iconElement) {
        if (!iconElement) return;

        iconElement.className = 'card-type-icon';
        iconElement.innerHTML = '';

        if (cardType) {
            iconElement.classList.add('show', cardType);
            const icons = {
                visa: '<i class="fab fa-cc-visa"></i>',
                mastercard: '<i class="fab fa-cc-mastercard"></i>',
                amex: '<i class="fab fa-cc-amex"></i>',
                discover: '<i class="fab fa-cc-discover"></i>'
            };
            iconElement.innerHTML = icons[cardType] || '';
        }
    }

    // ============================================
    // STEP NAVIGATION
    // ============================================

    function nextStep() {
        if (!validateCurrentStep()) {
            return;
        }

        if (state.currentStep < state.totalSteps) {
            state.currentStep++;
            updateSteps();
        }
    }

    function prevStep() {
        if (state.currentStep > 1) {
            state.currentStep--;
            updateSteps();
        }
    }

    function updateSteps() {
        // Hide all steps
        document.querySelectorAll('.form-step').forEach(step => {
            step.classList.remove('active');
        });

        // Show current step
        const currentStepElement = document.querySelector(`.form-step[data-step="${state.currentStep}"]`);
        if (currentStepElement) {
            currentStepElement.classList.add('active');
        }

        // Update progress indicators
        updateProgressSteps();
        updateNavigationButtons();

        // Update summary if on last step
        if (state.currentStep === 4) {
            updateSummary();
        }

        // Scroll to top of form
        document.querySelector('.donation-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function updateProgressSteps() {
        document.querySelectorAll('.step').forEach(step => {
            const stepNumber = parseInt(step.dataset.step);
            step.classList.remove('active', 'completed');

            if (stepNumber === state.currentStep) {
                step.classList.add('active');
            } else if (stepNumber < state.currentStep) {
                step.classList.add('completed');
            }
        });
    }

    function updateNavigationButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');

        // Show/hide previous button
        if (prevBtn) {
            prevBtn.style.display = state.currentStep > 1 ? 'block' : 'none';
        }

        // Show/hide next vs submit button
        if (state.currentStep === state.totalSteps) {
            if (nextBtn) nextBtn.style.display = 'none';
            if (submitBtn) submitBtn.style.display = 'block';
        } else {
            if (nextBtn) nextBtn.style.display = 'block';
            if (submitBtn) submitBtn.style.display = 'none';
        }
    }

    // ============================================
    // VALIDATION
    // ============================================

    function validateCurrentStep() {
        switch(state.currentStep) {
            case 1:
                return validateStep1();
            case 2:
                return validateStep2();
            case 3:
                return validateStep3();
            default:
                return true;
        }
    }

    function validateStep1() {
        if (!state.selectedAmount || state.selectedAmount <= 0) {
            showError('Please select or enter a donation amount');
            return false;
        }
        return true;
    }

    function validateStep2() {
        if (!state.selectedPaymentMethod) {
            showError('Please select a payment method');
            return false;
        }

        if (state.selectedPaymentMethod === 'credit_card') {
            return validateCreditCard();
        } else if (state.selectedPaymentMethod === 'crypto') {
            if (!state.selectedCryptoType) {
                showError('Please select a cryptocurrency');
                return false;
            }
        }

        return true;
    }

    function validateCreditCard() {
        const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
        const cardName = document.getElementById('cardName').value.trim();
        const cardExpiry = document.getElementById('cardExpiry').value;
        const cardCVV = document.getElementById('cardCVV').value;

        if (cardNumber.length < 13 || cardNumber.length > 19) {
            showError('Please enter a valid card number');
            return false;
        }

        if (!cardName) {
            showError('Please enter the cardholder name');
            return false;
        }

        if (cardExpiry.length !== 5) {
            showError('Please enter a valid expiry date (MM/YY)');
            return false;
        }

        if (cardCVV.length < 3 || cardCVV.length > 4) {
            showError('Please enter a valid CVV');
            return false;
        }

        return true;
    }

    function validateStep3() {
        const donorName = document.getElementById('donorName').value.trim();
        const donorEmail = document.getElementById('donorEmail').value.trim();

        if (!donorName) {
            showError('Please enter your name');
            return false;
        }

        if (!donorEmail || !isValidEmail(donorEmail)) {
            showError('Please enter a valid email address');
            return false;
        }

        return true;
    }

    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // ============================================
    // SUMMARY UPDATE
    // ============================================

    function updateSummary() {
        // Amount
        document.getElementById('summaryAmount').textContent = `$${state.selectedAmount.toFixed(2)}`;
        document.getElementById('summaryTotal').textContent = `$${state.selectedAmount.toFixed(2)}`;

        // Payment Method
        const paymentMethodName = state.paymentMethods.find(pm => pm.type === state.selectedPaymentMethod)?.name || '-';
        let paymentDisplay = paymentMethodName;
        
        if (state.selectedPaymentMethod === 'crypto' && state.selectedCryptoType) {
            paymentDisplay += ` (${state.selectedCryptoType})`;
        }
        
        document.getElementById('summaryPaymentMethod').textContent = paymentDisplay;

        // Personal Info
        document.getElementById('summaryName').textContent = document.getElementById('donorName').value || '-';
        document.getElementById('summaryEmail').textContent = document.getElementById('donorEmail').value || '-';

        // Payment Instructions
        displayPaymentInstructions();
    }

    function displayPaymentInstructions() {
        const container = document.getElementById('paymentInstructions');
        const transactionRefGroup = document.getElementById('transactionRefGroup');
        
        if (!container) return;

        container.innerHTML = '';
        container.style.display = 'none';
        
        if (transactionRefGroup) {
            transactionRefGroup.style.display = 'none';
        }

        if (state.selectedPaymentMethod === 'bank_transfer') {
            container.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    <strong>Bank Transfer Instructions</strong>
                </div>
                <div class="payment-info">
                    <strong>Bank Details:</strong>
                    <p><strong>Bank Name:</strong> ${demoBankDetails.bank_name}</p>
                    <p><strong>Account Name:</strong> ${demoBankDetails.account_name}</p>
                    <p><strong>Account Number:</strong> ${demoBankDetails.account_number}</p>
                    <p><strong>Routing Number:</strong> ${demoBankDetails.routing_number}</p>
                    <p><strong>SWIFT Code:</strong> ${demoBankDetails.swift_code}</p>
                    <p><strong>Reference:</strong> ${demoBankDetails.reference}</p>
                </div>
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    Please include the reference number in your transfer to ensure proper processing.
                </div>
            `;
            container.style.display = 'block';
            
            if (transactionRefGroup) {
                transactionRefGroup.style.display = 'block';
            }
        } else if (state.selectedPaymentMethod === 'crypto' && state.selectedCryptoType) {
            const wallet = state.cryptoWallets.find(w => w.symbol === state.selectedCryptoType);
            
            if (wallet) {
                container.innerHTML = `
                    <div class="alert alert-info">
                        <i class="fab fa-bitcoin"></i>
                        <strong>Cryptocurrency Payment Instructions</strong>
                    </div>
                    <div class="qr-code-display">
                        <h5>${wallet.name} (${wallet.symbol})</h5>
                        <p class="text-muted">${wallet.network}</p>
                        <img src="${wallet.qr_code}" alt="QR Code">
                        <p><strong>Wallet Address:</strong></p>
                        <div class="wallet-address" id="walletAddress">${wallet.address}</div>
                        <button type="button" class="copy-address-btn" onclick="copyWalletAddress()">
                            <i class="fas fa-copy"></i> Copy Address
                        </button>
                    </div>
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        Please ensure you're sending on the correct network: <strong>${wallet.network}</strong>
                    </div>
                `;
                container.style.display = 'block';
                
                if (transactionRefGroup) {
                    transactionRefGroup.style.display = 'block';
                }
            }
        } else if (state.selectedPaymentMethod === 'paypal') {
            container.innerHTML = `
                <div class="alert alert-info">
                    <i class="fab fa-paypal"></i>
                    <strong>PayPal Payment</strong>
                </div>
                <p>You will be redirected to PayPal to complete your donation securely.</p>
            `;
            container.style.display = 'block';
            
            // In a real implementation, you would initialize PayPal buttons here
            initializePayPalDemo();
        }
    }

    function initializePayPalDemo() {
        const paypalContainer = document.getElementById('paypal-button-container');
        if (!paypalContainer) return;

        paypalContainer.style.display = 'block';
        paypalContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                <i class="fab fa-paypal" style="font-size: 48px; color: #0070ba; margin-bottom: 15px;"></i>
                <p style="margin: 0; color: #666;">PayPal integration would appear here</p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #999;">Demo mode - Click "Complete Donation" to simulate payment</p>
            </div>
        `;
    }

    // ============================================
    // FORM SUBMISSION
    // ============================================

    function handleFormSubmit(e) {
        e.preventDefault();

        if (!validateCurrentStep()) {
            return;
        }

        // Collect form data
        const formData = collectFormData();

        // Show loading
        showLoading();

        // Simulate API call
        setTimeout(() => {
            processPayment(formData);
        }, 2000);
    }

    function collectFormData() {
        const data = {
            amount: state.selectedAmount,
            payment_method: state.selectedPaymentMethod,
            donor_name: document.getElementById('donorName').value,
            donor_email: document.getElementById('donorEmail').value,
            message: document.getElementById('message').value,
            is_anonymous: document.getElementById('isAnonymous').checked,
            allow_updates: document.getElementById('allowUpdates').checked,
            transaction_reference: document.getElementById('transactionRef').value,
            timestamp: new Date().toISOString()
        };

        if (state.selectedPaymentMethod === 'credit_card') {
            data.card_details = {
                number: document.getElementById('cardNumber').value,
                name: document.getElementById('cardName').value,
                expiry: document.getElementById('cardExpiry').value,
                cvv: document.getElementById('cardCVV').value
            };
        } else if (state.selectedPaymentMethod === 'crypto') {
            data.crypto_details = {
                type: state.selectedCryptoType,
                network: state.selectedCryptoNetwork
            };
        }

        return data;
    }

    function processPayment(formData) {
        console.log('Processing donation:', formData);

        // Simulate successful payment
        hideLoading();
        
        if (state.selectedPaymentMethod === 'credit_card') {
            showSuccessCreditCard(formData);
        } else {
            showSuccess(formData);
        }

        // Reset form after success
        setTimeout(() => {
            resetForm();
        }, 3000);
    }

    // ============================================
    // UI FEEDBACK
    // ============================================

    function showLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = 'block';
        }

        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
        }
    }

    function hideLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = 'none';
        }

        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.disabled = false;
        }
    }

    function showSuccess(formData) {
        const modal = new bootstrap.Modal(document.getElementById('successModal'));
        const message = document.getElementById('successMessage');
        
        if (message) {
            message.textContent = `Thank you for your generous donation of $${formData.amount.toFixed(2)}! A confirmation email will be sent to ${formData.donor_email}.`;
        }
        
        modal.show();
    }

    function showSuccessCreditCard(formData) {
        const modal = new bootstrap.Modal(document.getElementById('successModalCreditCard'));
        const message = document.getElementById('successMessageCreditCard');
        
        if (message) {
            message.textContent = `Thank you for your credit card donation of $${formData.amount.toFixed(2)}! Your payment has been processed successfully. A confirmation email will be sent to ${formData.donor_email}.`;
        }
        
        modal.show();
    }

    function showError(message) {
        const modal = new bootstrap.Modal(document.getElementById('errorModal'));
        const errorMessage = document.getElementById('errorMessage');
        
        if (errorMessage) {
            errorMessage.textContent = message;
        }
        
        modal.show();
    }

    function resetForm() {
        state.currentStep = 1;
        state.selectedAmount = null;
        state.selectedPaymentMethod = null;
        state.selectedCryptoType = null;
        
        document.getElementById('donationForm').reset();
        document.querySelectorAll('.amount-option').forEach(opt => opt.classList.remove('selected'));
        document.querySelectorAll('.payment-method').forEach(pm => pm.classList.remove('selected'));
        document.querySelectorAll('.crypto-option').forEach(co => co.classList.remove('selected'));
        
        updateSteps();
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    window.copyWalletAddress = function() {
        const addressElement = document.getElementById('walletAddress');
        const copyBtn = document.querySelector('.copy-address-btn');
        
        if (addressElement && copyBtn) {
            const address = addressElement.textContent;
            
            navigator.clipboard.writeText(address).then(() => {
                copyBtn.classList.add('copied');
                copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                
                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy Address';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy:', err);
                showError('Failed to copy address. Please copy manually.');
            });
        }
    };

    // ============================================
    // AUTO-INITIALIZE
    // ============================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();