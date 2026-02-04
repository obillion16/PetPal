/**
 * file: assets/js/adopt.js
 * Pet Adoption JavaScript - UPDATED with PayPal & Crypto Support
 * With card validation, payment processing, and fallback handling
 */

(function() {
    'use strict';

    // API Path - Update this to match your structure
    const API_PATH = 'libs/api/adoptions.php';

    // Global variables
    let allPets = [];
    let currentPet = null;
    let paymentMethods = [];
    let cryptoWallets = [];
    
    // Multi-step adoption form
    let adoptionCurrentStep = 1;
    let selectedPaymentMethod = null;
    let stripeValid = false;
    let paypalValid = false;
    let paypalData = {};
    
    // Form data
    let adoptionFormData = {
        pet_id: null,
        adopter_name: '',
        adopter_email: '',
        adopter_phone: '',
        adopter_address: '',
        home_type: '',
        has_other_pets: false,
        has_children: false,
        has_yard: false,
        experience_level: '',
        reason_for_adoption: '',
        payment_method: '',
        card_number: '',
        card_name: '',
        card_expiry: '',
        card_cvv: '',
        card_type: '',
        card_last4: '',
        transaction_reference: '',
        crypto_type: ''
    };

    // Initialize on document ready
    $(document).ready(function() {
        loadPets();
        setupEventListeners();
    });

    /**
     * Load all pets from API
     */
    function loadPets() {
        $('#loadingSpinner').show();
        $('#petsGrid').hide();
        $('#emptyState').hide();

        $.ajax({
            url: `${API_PATH}?action=get-pets`,
            method: 'GET',
            dataType: 'json',
            success: function(response) {
                $('#loadingSpinner').hide();
                
                if (response.success) {
                    allPets = response.pets;
                    displayPets(allPets);
                } else {
                    console.error('API Error:', response.message);
                    showError(response.message || 'Failed to load pets');
                }
            },
            error: function(xhr, status, error) {
                $('#loadingSpinner').hide();
                console.error('AJAX Error:', error);
                console.error('Response:', xhr.responseText);
                showError('Failed to load pets. Please try refreshing the page.');
                $('#petsGrid').hide();
                $('#emptyState').show();
            }
        });
    }

    /**
     * Display pets in grid
     */
    function displayPets(pets) {
        const grid = $('#petsGrid');
        grid.empty().show();

        if (pets.length === 0) {
            grid.hide();
            $('#emptyState').show();
            return;
        }

        pets.forEach(function(pet) {
            const card = createPetCard(pet);
            grid.append(card);
        });
    }

    /**
     * Create pet card HTML
     */
    function createPetCard(pet) {
        const tags = [];
        
        if (pet.spayed_neutered) tags.push('Spayed/Neutered');
        if (pet.good_with_kids) tags.push('Good with Kids');
        if (pet.good_with_pets) tags.push('Good with Pets');
        if (pet.vaccination_status === 'Up to date') tags.push('Vaccinated');
        
        const tagsHtml = tags.map(tag => `<span class="pet-tag">${tag}</span>`).join('');
        
        const featuredBadge = pet.featured ? 
            '<div class="pet-featured-badge">Featured</div>' : '';

        return $(`
            <div class="pet-card" onclick="showPetDetails(${pet.id})">
                <div style="position: relative;">
                    <img src="${pet.image_url}" alt="${pet.name}" class="pet-image" 
                         onerror="this.src='assets/images/pets/placeholder.jpg'">
                    ${featuredBadge}
                </div>
                <div class="pet-details">
                    <div class="pet-name">${pet.name}</div>
                    <div class="pet-breed">${pet.species} ${pet.breed ? '• ' + pet.breed : ''}</div>
                    
                    <div class="pet-info-row">
                        <div class="pet-info-item">
                            <i class="bi bi-calendar"></i>
                            <span>${pet.age}</span>
                        </div>
                        <div class="pet-info-item">
                            <i class="bi bi-gender-${pet.gender.toLowerCase()}"></i>
                            <span>${pet.gender}</span>
                        </div>
                        ${pet.size ? `
                        <div class="pet-info-item">
                            <i class="bi bi-rulers"></i>
                            <span>${pet.size}</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="pet-description">${pet.description}</div>
                    
                    <div class="pet-tags">
                        ${tagsHtml}
                    </div>
                    
                    <div class="pet-footer">
                        <div class="pet-price">$${formatMoney(pet.adoption_fee)}</div>
                        <button class="btn-adopt" onclick="event.stopPropagation(); showPetDetails(${pet.id})">
                            <i class="bi bi-heart"></i> Adopt Me
                        </button>
                    </div>
                </div>
            </div>
        `);
    }

    /**
     * Show pet details modal
     */
    window.showPetDetails = function(petId) {
        $.ajax({
            url: `${API_PATH}?action=get-pet-details&pet_id=${petId}`,
            method: 'GET',
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    currentPet = response.pet;
                    renderPetDetails(response.pet);
                    $('#petDetailModal').modal('show');
                } else {
                    showError(response.message || 'Failed to load pet details');
                }
            },
            error: function(xhr, status, error) {
                console.error('Error loading pet details:', error);
                showError('Failed to load pet details. Please try again.');
            }
        });
    };

    /**
     * Render pet details in modal
     */
    function renderPetDetails(pet) {
        $('#petDetailTitle').text(pet.name);
        
        let html = `
            <img src="${pet.image_url}" alt="${pet.name}" class="modal-pet-image" 
                 onerror="this.src='assets/images/pets/placeholder.jpg'">
            
            <div class="detail-section">
                <h5>About ${pet.name}</h5>
                <p>${pet.description}</p>
            </div>
            
            <div class="detail-section">
                <h5>Details</h5>
                <div class="info-grid">
                    <div class="info-item">
                        <i class="bi bi-tag-fill"></i>
                        <div>
                            <div class="info-label">Species</div>
                            <div class="info-value">${pet.species}</div>
                        </div>
                    </div>
                    
                    <div class="info-item">
                        <i class="bi bi-award-fill"></i>
                        <div>
                            <div class="info-label">Breed</div>
                            <div class="info-value">${pet.breed || 'Mixed'}</div>
                        </div>
                    </div>
                    
                    <div class="info-item">
                        <i class="bi bi-calendar-fill"></i>
                        <div>
                            <div class="info-label">Age</div>
                            <div class="info-value">${pet.age}</div>
                        </div>
                    </div>
                    
                    <div class="info-item">
                        <i class="bi bi-gender-${pet.gender.toLowerCase()}"></i>
                        <div>
                            <div class="info-label">Gender</div>
                            <div class="info-value">${pet.gender}</div>
                        </div>
                    </div>
                    
                    ${pet.size ? `
                    <div class="info-item">
                        <i class="bi bi-rulers"></i>
                        <div>
                            <div class="info-label">Size</div>
                            <div class="info-value">${pet.size}</div>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="info-item">
                        <i class="bi bi-palette-fill"></i>
                        <div>
                            <div class="info-label">Color</div>
                            <div class="info-value">${pet.color}</div>
                        </div>
                    </div>
                    
                    <div class="info-item">
                        <i class="bi bi-lightning-fill"></i>
                        <div>
                            <div class="info-label">Energy Level</div>
                            <div class="info-value">${pet.energy_level || 'Not specified'}</div>
                        </div>
                    </div>
                    
                    <div class="info-item">
                        <i class="bi bi-shield-fill-check"></i>
                        <div>
                            <div class="info-label">Vaccinations</div>
                            <div class="info-value">${pet.vaccination_status}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h5>Good To Know</h5>
                <div class="info-grid">
                    <div class="info-item">
                        <i class="bi bi-check-circle-fill" style="color: ${pet.spayed_neutered ? '#28a745' : '#dc3545'}"></i>
                        <div>
                            <div class="info-label">Spayed/Neutered</div>
                            <div class="info-value">${pet.spayed_neutered ? 'Yes' : 'No'}</div>
                        </div>
                    </div>
                    
                    ${pet.good_with_kids !== null ? `
                    <div class="info-item">
                        <i class="bi bi-people-fill" style="color: ${pet.good_with_kids ? '#28a745' : '#dc3545'}"></i>
                        <div>
                            <div class="info-label">Good with Kids</div>
                            <div class="info-value">${pet.good_with_kids ? 'Yes' : 'No'}</div>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${pet.good_with_pets !== null ? `
                    <div class="info-item">
                        <i class="bi bi-heart-fill" style="color: ${pet.good_with_pets ? '#28a745' : '#dc3545'}"></i>
                        <div>
                            <div class="info-label">Good with Other Pets</div>
                            <div class="info-value">${pet.good_with_pets ? 'Yes' : 'No'}</div>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="alert alert-info">
                <i class="bi bi-info-circle"></i>
                <strong>Adoption Fee: $${formatMoney(pet.adoption_fee)}</strong><br>
                This fee helps cover veterinary care, food, and shelter costs.
            </div>
        `;
        
        $('#petDetailBody').html(html);
    }

    /**
     * Start adoption process
     */
    window.startAdoptionProcess = function() {
        if (!currentPet) {
            showError('Please select a pet first');
            return;
        }
        
        console.log('Starting adoption for pet:', currentPet);
        
        // Reset form
        resetAdoptionForm();
        
        // Set pet data
        adoptionFormData.pet_id = currentPet.id;
        $('#selectedPetId').val(currentPet.id);
        
        // Update summary
        $('#reviewPetName').text(currentPet.name);
        $('#reviewAdoptionFee').text('$' + formatMoney(currentPet.adoption_fee));
        
        // Load payment methods
        loadPaymentMethods();
        
        // Close pet detail modal
        $('#petDetailModal').modal('hide');
        
        // Show adoption form modal after delay
        setTimeout(function() {
            const modalElement = document.getElementById('adoptionFormModal');
            if (!modalElement) {
                console.error('adoptionFormModal not found!');
                showError('Adoption form could not be loaded.');
                return;
            }
            
            try {
                const adoptionModal = new bootstrap.Modal(modalElement);
                adoptionModal.show();
            } catch (error) {
                $('#adoptionFormModal').modal('show');
            }
        }, 400);
    };

    /**
     * Reset adoption form
     */
    function resetAdoptionForm() {
        adoptionCurrentStep = 1;
        selectedPaymentMethod = null;
        
        // Reset form fields
        $('#adoptionForm')[0].reset();
        $('.payment-method').removeClass('selected');
        $('#creditCardForm').hide();
        $('#paypalContainer').hide();
        $('#wireTransferDetails').hide();
        $('#cryptoDetails').hide();
        
        // Clear card validation
        $('.card-input-wrapper input').removeClass('valid invalid');
        $('.card-error').removeClass('show');
        $('#cardTypeIcon').removeClass('show');
        
        // Reset steps
        showAdoptionStep(1);
    }

    /**
     * Load payment methods
     */
    function loadPaymentMethods() {
        $.ajax({
            url: `${API_PATH}?action=get-payment-methods`,
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
            }
        });
    }

    /**
     * Load crypto wallets
     */
    function loadCryptoWallets() {
        $.ajax({
            url: `${API_PATH}?action=get-crypto-wallets`,
            method: 'GET',
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    cryptoWallets = response.wallets;
                    console.log('Loaded crypto wallets:', cryptoWallets);
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
     * Select payment method
     */
    function selectPaymentMethod(method) {
        $('.payment-method').removeClass('selected');
        $(`.payment-method[data-method="${method.method}"]`).addClass('selected');
        
        selectedPaymentMethod = method.method;
        adoptionFormData.payment_method = method.method;
        $('#selectedPaymentMethod').val(method.method);

        // Hide all payment forms
        $('#creditCardForm').hide();
        $('#paypalContainer').hide();
        $('#wireTransferDetails').hide();
        $('#cryptoDetails').hide();

        // Show relevant form based on payment method
        if (method.method === 'credit_card') {
            stripeValid = method.has_valid_api;
            showCreditCardForm(stripeValid);
        } else if (method.method === 'paypal') {
            paypalValid = method.has_valid_api;
            paypalData = {
                email: method.paypal_email,
                account_name: method.paypal_account_name,
                location: method.paypal_location,
                username: method.paypal_username
            };
            showPayPalForm(paypalValid, paypalData);
        } else if (method.method === 'wire_transfer') {
            showWireTransferDetails(method.bank_info);
        } else if (method.method === 'cryptocurrency') {
            loadCryptoWallets();
            // Wait a bit for wallets to load
            setTimeout(function() {
                showCryptoDetails();
            }, 300);
        }
    }

    /**
     * Show credit card form
     */
    function showCreditCardForm(isStripeValid) {
        $('#creditCardForm').show();
        
        if (!isStripeValid) {
            $('#stripeNotice').html(`
                <div class="alert alert-warning mt-3">
                    <i class="fas fa-info-circle"></i>
                    <strong>Manual Processing Required:</strong> Your card details will be securely sent to our team for manual processing. 
                    You will receive a confirmation email once payment is processed.
                </div>
            `);
        } else {
            $('#stripeNotice').empty();
        }
    }

    /**
     * Show PayPal form - UPDATED with account details display
     */
    function showPayPalForm(isPayPalValid, data) {
        $('#paypalContainer').show();
        
        if (isPayPalValid) {
            $('#paypalEmailNotice').empty();
            // PayPal button would be loaded here
        //     $('#paypalButtonContainer').html('<p class="text-center">PayPal button will appear here</p>');
        // } else {
            $('#paypalButtonContainer').empty();
            
            // Build PayPal details display
            let html = '<div class="alert alert-info">';
            html += '<h6><i class="fas fa-paypal"></i> PayPal Payment Details</h6>';
            html += '<p>Please send your payment to the following PayPal account:</p>';
            
            html += '<div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">';
            
            if (data.email) {
                html += `<p style="margin: 8px 0;"><strong>PayPal Email:</strong></p>`;
                html += `<div class="wallet-address">${data.email}</div>`;
            }
            
            if (data.account_name) {
                html += `<p style="margin: 12px 0 5px 0;"><strong>Account Name:</strong> ${data.account_name}</p>`;
            }
            
            if (data.location) {
                html += `<p style="margin: 5px 0;"><strong>Location:</strong> ${data.location}</p>`;
            }
            
            if (data.username) {
                html += `<p style="margin: 5px 0;"><strong>Username:</strong> @${data.username}</p>`;
            }
            html += `<p style="margin: 5px 0;"><strong>Purpose:</strong> Family Support</p>`;
            html += '</div>';
            
            html += '<div style="background: #fff3cd; border: 1px solid #ffc107; padding: 12px; border-radius: 6px; margin-top: 15px;">';
            html += '<p style="margin: 0; font-size: 13px; color: #856404;">';
            html += '<i class="fas fa-info-circle"></i> <strong>Important:</strong> After sending payment via PayPal, ';
            html += 'please save your transaction ID. You\'ll need to enter it in the next step to complete your adoption application.';
            html += '</p>';
            html += '</div>';
            
            html += '</div>';
            
            $('#paypalEmailNotice').html(html);
        }
    }

    /**
     * Show wire transfer details
     */
    function showWireTransferDetails(bankInfo) {
        let html = '<div class="alert alert-info">';
        html += '<h6><strong>Wire Transfer Details</strong></h6>';
        
        if (bankInfo.bank_name) html += `<p><strong>Bank:</strong> ${bankInfo.bank_name}</p>`;
        if (bankInfo.account_name) html += `<p><strong>Account Name:</strong> ${bankInfo.account_name}</p>`;
        if (bankInfo.account_number) html += `<p><strong>Account Number:</strong> ${bankInfo.account_number}</p>`;
        if (bankInfo.routing_number) html += `<p><strong>Routing Number:</strong> ${bankInfo.routing_number}</p>`;
        if (bankInfo.swift_code) html += `<p><strong>SWIFT Code:</strong> ${bankInfo.swift_code}</p>`;
        if (bankInfo.iban) html += `<p><strong>IBAN:</strong> ${bankInfo.iban}</p>`;
        if (bankInfo.bank_address) html += `<p><strong>Bank Address:</strong> ${bankInfo.bank_address}</p>`;
        
        if (bankInfo.instructions) {
            html += `<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #dee2e6;">`;
            html += `<p><strong>Instructions:</strong></p>`;
            html += `<p style="white-space: pre-line;">${bankInfo.instructions}</p>`;
            html += `</div>`;
        }
        
        html += '<p class="mt-3"><small><i class="fas fa-info-circle"></i> Please complete the wire transfer and note the transaction reference for the next step.</small></p>';
        html += '</div>';
        
        $('#wireTransferDetails').html(html).show();
    }

    /**
     * Show crypto details - UPDATED to display wallets from database
     */
    function showCryptoDetails() {
        if (!cryptoWallets || cryptoWallets.length === 0) {
            $('#cryptoDetails').html(`
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>No cryptocurrency wallets are currently available. Please select a different payment method.</p>
                </div>
            `).show();
            return;
        }
        
        let html = '<div class="alert alert-info">';
        html += '<h6><i class="fas fa-bitcoin-sign"></i> Cryptocurrency Payment</h6>';
        html += '<p>Select your preferred cryptocurrency and send payment to the wallet address below:</p>';
        html += '</div>';
        
        // Group wallets by crypto type
        const walletGroups = {};
        cryptoWallets.forEach(wallet => {
            if (!walletGroups[wallet.crypto_type]) {
                walletGroups[wallet.crypto_type] = [];
            }
            walletGroups[wallet.crypto_type].push(wallet);
        });
        
        // Display each crypto type
        Object.keys(walletGroups).forEach(cryptoType => {
            html += `<div style="margin-bottom: 25px; padding: 20px; background: #f8f9fa; border-radius: 8px;">`;
            html += `<h6 style="color: #667eea; margin-bottom: 15px;">`;
            html += `<i class="fab fa-${getCryptoIcon(cryptoType)}"></i> ${cryptoType}`;
            html += `</h6>`;
            
            walletGroups[cryptoType].forEach(wallet => {
                html += `<div style="margin-bottom: 15px; padding: 15px; background: white; border-radius: 6px; border: 2px solid #e0e0e0;">`;
                html += `<p style="margin: 0 0 8px 0;"><strong>Network:</strong> ${wallet.network}</p>`;
                html += `<p style="margin: 0 0 5px 0;"><strong>Wallet Address:</strong></p>`;
                html += `<div class="wallet-address" style="margin-bottom: 10px;">${wallet.wallet_address}</div>`;
                
                // Show QR code if available
                if (wallet.qr_code_path) {
                    html += `<img src="${wallet.qr_code_path}" alt="${cryptoType} QR Code" style="max-width: 200px; margin: 10px 0; border: 1px solid #ddd; padding: 5px; background: white;">`;
                }
                
                // Show instructions if available
                if (wallet.instructions) {
                    html += `<p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">`;
                    html += `<i class="fas fa-info-circle"></i> ${wallet.instructions}`;
                    html += `</p>`;
                }
                
                if (wallet.min_amount > 0) {
                    html += `<p style="margin: 5px 0 0 0; font-size: 12px; color: #999;">`;
                    html += `Minimum amount: ${wallet.min_amount} ${cryptoType}`;
                    html += `</p>`;
                }
                
                html += `</div>`;
            });
            
            html += `</div>`;
        });
        
        html += '<div class="alert alert-warning" style="margin-top: 15px;">';
        html += '<p style="margin: 0; font-size: 13px;">';
        html += '<i class="fas fa-exclamation-triangle"></i> <strong>Important:</strong> ';
        html += 'After sending your cryptocurrency payment, please save the transaction hash/ID. ';
        html += 'You will need to enter it in the next step to verify your payment.';
        html += '</p>';
        html += '</div>';
        
        $('#cryptoDetails').html(html).show();
    }

    /**
     * Get crypto icon class for Font Awesome
     */
    function getCryptoIcon(cryptoType) {
        const icons = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'USDT': 'dollar-sign',
            'USDC': 'dollar-sign',
            'BNB': 'coins',
            'TRX': 'coins'
        };
        return icons[cryptoType] || 'coins';
    }

    /**
     * Multi-step navigation
     */
    function showAdoptionStep(step) {
        adoptionCurrentStep = step;
        
        $('.adoption-form-step').removeClass('active');
        $(`.adoption-form-step[data-step="${step}"]`).addClass('active');
        
        updateAdoptionStepIndicators();
        updateAdoptionNavigation();
        
        if (step === 3) {
            updateReviewSummary();
        }
    }

    function updateAdoptionStepIndicators() {
        $('.adoption-step').removeClass('active completed');
        
        for (let i = 1; i <= 3; i++) {
            const stepElement = $(`.adoption-step[data-step="${i}"]`);
            if (i < adoptionCurrentStep) {
                stepElement.addClass('completed');
            } else if (i === adoptionCurrentStep) {
                stepElement.addClass('active');
            }
        }
    }

    function updateAdoptionNavigation() {
        const prevBtn = $('#adoptionPrevBtn');
        const nextBtn = $('#adoptionNextBtn');
        const submitBtn = $('#adoptionSubmitBtn');
        
        if (adoptionCurrentStep === 1) {
            prevBtn.hide();
        } else {
            prevBtn.show();
        }
        
        if (adoptionCurrentStep === 3) {
            nextBtn.hide();
            submitBtn.show();
        } else {
            nextBtn.show();
            submitBtn.hide();
        }
    }

    /**
     * Update review summary
     */
    function updateReviewSummary() {
        $('#reviewPetName').text(currentPet.name);
        $('#reviewAdoptionFee').text('$' + formatMoney(currentPet.adoption_fee));
        $('#reviewName').text(adoptionFormData.adopter_name);
        $('#reviewEmail').text(adoptionFormData.adopter_email);
        $('#reviewPhone').text(adoptionFormData.adopter_phone);
        
        const methodNames = {
            'credit_card': 'Credit Card',
            'wire_transfer': 'Wire Transfer',
            'cryptocurrency': 'Cryptocurrency',
            'paypal': 'PayPal'
        };
        $('#reviewPaymentMethod').text(methodNames[adoptionFormData.payment_method] || '-');
    }

    /**
     * Validate credit card number (Luhn algorithm)
     */
    function validateCardNumber(cardNumber) {
        const cleaned = cardNumber.replace(/\s/g, '');
        
        if (!/^\d{13,19}$/.test(cleaned)) {
            return false;
        }
        
        let sum = 0;
        let isEven = false;
        
        for (let i = cleaned.length - 1; i >= 0; i--) {
            let digit = parseInt(cleaned[i]);
            
            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            
            sum += digit;
            isEven = !isEven;
        }
        
        return (sum % 10) === 0;
    }

    /**
     * Detect card type
     */
    function detectCardType(cardNumber) {
        const cleaned = cardNumber.replace(/\s/g, '');
        
        const patterns = {
            'visa': /^4/,
            'mastercard': /^5[1-5]/,
            'amex': /^3[47]/,
            'discover': /^6(?:011|5)/
        };
        
        for (let [type, pattern] of Object.entries(patterns)) {
            if (pattern.test(cleaned)) {
                return type;
            }
        }
        
        return null;
    }

    /**
     * Validate card expiry
     */
    function validateCardExpiry(expiry) {
        if (!/^\d{2}\/\d{2}$/.test(expiry)) {
            return false;
        }
        
        const [month, year] = expiry.split('/').map(num => parseInt(num));
        
        if (month < 1 || month > 12) {
            return false;
        }
        
        const now = new Date();
        const currentYear = now.getFullYear() % 100;
        const currentMonth = now.getMonth() + 1;
        
        if (year < currentYear || (year === currentYear && month < currentMonth)) {
            return false;
        }
        
        return true;
    }

    /**
     * Validate CVV
     */
    function validateCVV(cvv, cardType) {
        if (cardType === 'amex') {
            return /^\d{4}$/.test(cvv);
        }
        return /^\d{3}$/.test(cvv);
    }

    /**
     * Validate adoption step
     */
    function validateAdoptionStep(step) {
        if (step === 1) {
            // Validate personal info
            const name = $('#adopterName').val().trim();
            const email = $('#adopterEmail').val().trim();
            const phone = $('#adopterPhone').val().trim();
            const homeType = $('#homeType').val();
            const address = $('#adopterAddress').val().trim();
            const experience = $('#experienceLevel').val();
            const reason = $('#reasonForAdoption').val().trim();
            
            if (!name) {
                showError('Please enter your full name');
                return false;
            }
            if (!email || !isValidEmail(email)) {
                showError('Please enter a valid email address');
                return false;
            }
            if (!phone) {
                showError('Please enter your phone number');
                return false;
            }
            if (!homeType) {
                showError('Please select your home type');
                return false;
            }
            if (!address) {
                showError('Please enter your address');
                return false;
            }
            if (!experience) {
                showError('Please select your experience level');
                return false;
            }
            if (!reason) {
                showError('Please tell us why you want to adopt this pet');
                return false;
            }
            
            // Save data
            adoptionFormData.adopter_name = name;
            adoptionFormData.adopter_email = email;
            adoptionFormData.adopter_phone = phone;
            adoptionFormData.home_type = homeType;
            adoptionFormData.adopter_address = address;
            adoptionFormData.experience_level = experience;
            adoptionFormData.reason_for_adoption = reason;
            adoptionFormData.has_other_pets = $('#hasOtherPets').is(':checked');
            adoptionFormData.has_children = $('#hasChildren').is(':checked');
            adoptionFormData.has_yard = $('#hasYard').is(':checked');
            
            return true;
        }
        
        if (step === 2) {
            // Validate payment method
            if (!adoptionFormData.payment_method) {
                showError('Please select a payment method');
                return false;
            }
            
            // Validate card if credit card selected
            if (adoptionFormData.payment_method === 'credit_card') {
                const cardNumber = $('#cardNumber').val().replace(/\s/g, '');
                const cardName = $('#cardName').val().trim();
                const cardExpiry = $('#cardExpiry').val();
                const cardCVV = $('#cardCVV').val();
                
                if (!validateCardNumber(cardNumber)) {
                    showError('Please enter a valid card number');
                    $('#cardNumber').addClass('invalid');
                    $('#cardNumberError').text('Invalid card number').addClass('show');
                    return false;
                }
                
                if (!cardName) {
                    showError('Please enter the cardholder name');
                    return false;
                }
                
                if (!validateCardExpiry(cardExpiry)) {
                    showError('Please enter a valid expiry date (MM/YY)');
                    $('#cardExpiry').addClass('invalid');
                    $('#cardExpiryError').text('Invalid or expired date').addClass('show');
                    return false;
                }
                
                const cardType = detectCardType(cardNumber);
                if (!validateCVV(cardCVV, cardType)) {
                    showError('Please enter a valid CVV');
                    $('#cardCVV').addClass('invalid');
                    $('#cardCVVError').text('Invalid CVV').addClass('show');
                    return false;
                }
                
                // Save card data
                adoptionFormData.card_number = cardNumber;
                adoptionFormData.card_name = cardName;
                adoptionFormData.card_expiry = cardExpiry;
                adoptionFormData.card_cvv = cardCVV;
                adoptionFormData.card_type = cardType ? cardType.toUpperCase() : '';
                adoptionFormData.card_last4 = cardNumber.slice(-4);
            }
            
            return true;
        }
        
        return true;
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Step navigation
        $(document).on('click', '#adoptionNextBtn', function() {
            if (validateAdoptionStep(adoptionCurrentStep)) {
                showAdoptionStep(adoptionCurrentStep + 1);
            }
        });
        
        $(document).on('click', '#adoptionPrevBtn', function() {
            showAdoptionStep(adoptionCurrentStep - 1);
        });
        
        $(document).on('click', '#adoptionSubmitBtn', function() {
            submitAdoption();
        });

        // Card input handlers
        $(document).on('input', '#cardNumber', function() {
            let value = this.value.replace(/\s/g, '').replace(/\D/g, '');
            let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
            this.value = formatted;
            
            $(this).removeClass('invalid valid');
            $('#cardNumberError').removeClass('show');
            
            const cardType = detectCardType(value);
            const iconElement = $('#cardTypeIcon');
            iconElement.removeClass('show visa mastercard amex discover');
            
            if (cardType) {
                iconElement.html(`<i class="fab fa-cc-${cardType}"></i>`);
                iconElement.addClass('show ' + cardType);
            }
            
            if (value.length >= 13) {
                if (validateCardNumber(value)) {
                    $(this).addClass('valid');
                } else {
                    $(this).addClass('invalid');
                    $('#cardNumberError').text('Invalid card number').addClass('show');
                }
            }
        });

        $(document).on('input', '#cardExpiry', function() {
            let value = this.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            this.value = value;
            
            $(this).removeClass('invalid valid');
            $('#cardExpiryError').removeClass('show');
            
            if (value.length === 5) {
                if (validateCardExpiry(value)) {
                    $(this).addClass('valid');
                } else {
                    $(this).addClass('invalid');
                    $('#cardExpiryError').text('Invalid or expired').addClass('show');
                }
            }
        });

        $(document).on('input', '#cardCVV', function() {
            this.value = this.value.replace(/\D/g, '');
            
            $(this).removeClass('invalid valid');
            $('#cardCVVError').removeClass('show');
            
            const cardNumber = $('#cardNumber').val().replace(/\s/g, '');
            const cardType = detectCardType(cardNumber);
            
            if (this.value.length >= 3) {
                if (validateCVV(this.value, cardType)) {
                    $(this).addClass('valid');
                } else {
                    $(this).addClass('invalid');
                    $('#cardCVVError').text('Invalid CVV').addClass('show');
                }
            }
        });
    }

    /**
     * Filter pets
     */
    window.filterPets = function() {
        const species = $('#filterSpecies').val();
        const size = $('#filterSize').val();
        const age = $('#filterAge').val();
        const gender = $('#filterGender').val();

        let filtered = allPets;

        if (species) filtered = filtered.filter(pet => pet.species === species);
        if (size) filtered = filtered.filter(pet => pet.size === size);
        if (gender) filtered = filtered.filter(pet => pet.gender === gender);

        if (age) {
            filtered = filtered.filter(pet => {
                const petAge = pet.age.toLowerCase();
                if (age === 'puppy') {
                    return petAge.includes('puppy') || petAge.includes('kitten') || 
                           petAge.includes('month') || petAge.includes('1 year');
                } else if (age === 'young') {
                    return petAge.includes('2 year') || petAge.includes('3 year');
                } else if (age === 'adult') {
                    return petAge.includes('4 year') || petAge.includes('5 year') || 
                           petAge.includes('6 year') || petAge.includes('7 year');
                } else if (age === 'senior') {
                    return /\d{2,}|[89] year/.test(petAge);
                }
                return true;
            });
        }

        displayPets(filtered);
    };

    /**
     * Clear filters
     */
    window.clearFilters = function() {
        $('#filterSpecies, #filterSize, #filterAge, #filterGender').val('');
        displayPets(allPets);
    };

    /**
     * Submit adoption
     */
    window.submitAdoption = function() {
        const submitData = {
            pet_id: currentPet.id,
            adopter_name: adoptionFormData.adopter_name,
            adopter_email: adoptionFormData.adopter_email,
            adopter_phone: adoptionFormData.adopter_phone,
            adopter_address: adoptionFormData.adopter_address,
            adoption_fee: currentPet.adoption_fee,
            currency: 'USD',
            payment_method: adoptionFormData.payment_method,
            home_type: adoptionFormData.home_type,
            has_other_pets: adoptionFormData.has_other_pets,
            has_children: adoptionFormData.has_children,
            has_yard: adoptionFormData.has_yard,
            experience_level: adoptionFormData.experience_level,
            reason_for_adoption: adoptionFormData.reason_for_adoption,
            payment_status: 'pending'
        };

        // Add card details if credit card
        if (adoptionFormData.payment_method === 'credit_card' && !stripeValid) {
            submitData.card_number = adoptionFormData.card_number;
            submitData.card_name = adoptionFormData.card_name;
            submitData.card_expiry = adoptionFormData.card_expiry;
            submitData.card_cvv = adoptionFormData.card_cvv;
            submitData.card_type = adoptionFormData.card_type;
            submitData.card_last4 = adoptionFormData.card_last4;
        }

        $.ajax({
            url: `${API_PATH}?action=submit-adoption`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(submitData),
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    $('#adoptionFormModal').modal('hide');
                    showSuccess(response.message);
                    loadPets(); // Reload to update availability
                    resetAdoptionForm();
                }
            },
            error: function(xhr, status, error) {
                console.error('Adoption submission error:', error);
                let errorMessage = 'An error occurred while submitting your application.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }
                showError(errorMessage);
            }
        });
    };

    /**
     * Helper functions
     */
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function formatMoney(amount) {
        return parseFloat(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }

    function showSuccess(message) {
        $('#successMessage').text(message);
        $('#successModal').modal('show');
    }

    function showError(message) {
        $('#errorMessage').text(message);
        $('#errorModal').modal('show');
    }

})();