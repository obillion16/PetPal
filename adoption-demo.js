/**
 * ============================================
 * PET ADOPTION SYSTEM - DEMO IMPLEMENTATION
 * ============================================
 */

(function() {
    'use strict';

    // ============================================
    // CONFIGURATION & STATE
    // ============================================
    
    const config = {
        apiEndpoint: '/api/pets', // Demo endpoint
    };

    const state = {
        pets: [],
        filteredPets: [],
        selectedPet: null,
        currentStep: 1,
        totalSteps: 3,
        selectedPaymentMethod: null,
        adoptionFormData: {}
    };

    // Demo Pets Data
    const demoPets = [
        {
            id: 1,
            name: "Max",
            species: "Dog",
            breed: "Golden Retriever",
            age: "2 years",
            ageCategory: "young",
            gender: "Male",
            size: "Large",
            weight: "70 lbs",
            color: "Golden",
            description: "Max is a friendly and energetic Golden Retriever who loves to play fetch and go on long walks. He's great with kids and other dogs. Max is house-trained and knows basic commands. He would do best in a home with a yard where he can run and play.",
            image: "https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=500&h=400&fit=crop",
            adoption_fee: 250,
            vaccinated: true,
            spayed_neutered: true,
            microchipped: true,
            house_trained: true,
            good_with_kids: true,
            good_with_dogs: true,
            good_with_cats: false,
            energy_level: "High",
            featured: true,
            tags: ["Friendly", "Active", "Family Dog"]
        },
        {
            id: 2,
            name: "Luna",
            species: "Cat",
            breed: "Persian",
            age: "3 years",
            ageCategory: "adult",
            gender: "Female",
            size: "Medium",
            weight: "10 lbs",
            color: "White",
            description: "Luna is a beautiful Persian cat with a calm and affectionate personality. She loves to cuddle and be pampered. Luna is litter-trained and gets along well with other cats. She would thrive in a quiet home where she can be the center of attention.",
            image: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=500&h=400&fit=crop",
            adoption_fee: 150,
            vaccinated: true,
            spayed_neutered: true,
            microchipped: true,
            house_trained: true,
            good_with_kids: true,
            good_with_dogs: false,
            good_with_cats: true,
            energy_level: "Low",
            featured: false,
            tags: ["Calm", "Affectionate", "Indoor"]
        },
        {
            id: 3,
            name: "Buddy",
            species: "Dog",
            breed: "Labrador Mix",
            age: "5 years",
            ageCategory: "adult",
            gender: "Male",
            size: "Large",
            weight: "65 lbs",
            color: "Black",
            description: "Buddy is a loyal and gentle Labrador mix who's looking for his forever home. He's well-behaved, loves walks, and is great with children. Buddy knows basic commands and is eager to please. He would be perfect for an active family.",
            image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=500&h=400&fit=crop",
            adoption_fee: 200,
            vaccinated: true,
            spayed_neutered: true,
            microchipped: true,
            house_trained: true,
            good_with_kids: true,
            good_with_dogs: true,
            good_with_cats: true,
            energy_level: "Medium",
            featured: true,
            tags: ["Gentle", "Loyal", "Well-Trained"]
        },
        {
            id: 4,
            name: "Whiskers",
            species: "Cat",
            breed: "Tabby",
            age: "1 year",
            ageCategory: "young",
            gender: "Male",
            size: "Small",
            weight: "8 lbs",
            color: "Orange",
            description: "Whiskers is a playful young tabby cat with lots of personality. He's curious, adventurous, and loves to explore. Whiskers is litter-trained and enjoys interactive play. He would do well in a home where he can get plenty of attention and playtime.",
            image: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=500&h=400&fit=crop",
            adoption_fee: 120,
            vaccinated: true,
            spayed_neutered: true,
            microchipped: true,
            house_trained: true,
            good_with_kids: true,
            good_with_dogs: false,
            good_with_cats: true,
            energy_level: "High",
            featured: false,
            tags: ["Playful", "Curious", "Young"]
        },
        {
            id: 5,
            name: "Bella",
            species: "Dog",
            breed: "Beagle",
            age: "4 years",
            ageCategory: "adult",
            gender: "Female",
            size: "Medium",
            weight: "25 lbs",
            color: "Tri-color",
            description: "Bella is a sweet Beagle with a gentle disposition. She loves sniffing around the yard and going on leisurely walks. Bella is good with children and other pets. She's looking for a loving family who will give her the attention she deserves.",
            image: "https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=500&h=400&fit=crop",
            adoption_fee: 180,
            vaccinated: true,
            spayed_neutered: true,
            microchipped: true,
            house_trained: true,
            good_with_kids: true,
            good_with_dogs: true,
            good_with_cats: true,
            energy_level: "Medium",
            featured: false,
            tags: ["Sweet", "Gentle", "Family-Friendly"]
        },
        {
            id: 6,
            name: "Charlie",
            species: "Dog",
            breed: "Husky",
            age: "6 months",
            ageCategory: "puppy",
            gender: "Male",
            size: "Large",
            weight: "35 lbs",
            color: "Gray & White",
            description: "Charlie is an adorable Husky puppy with beautiful blue eyes. He's full of energy and loves to play. Charlie is being crate-trained and is learning basic commands. He needs an active family who can provide plenty of exercise and training.",
            image: "https://images.unsplash.com/photo-1568572933382-74d440642117?w=500&h=400&fit=crop",
            adoption_fee: 300,
            vaccinated: true,
            spayed_neutered: false,
            microchipped: true,
            house_trained: false,
            good_with_kids: true,
            good_with_dogs: true,
            good_with_cats: false,
            energy_level: "Very High",
            featured: true,
            tags: ["Puppy", "Energetic", "Beautiful"]
        },
        {
            id: 7,
            name: "Mittens",
            species: "Cat",
            breed: "Siamese",
            age: "8 years",
            ageCategory: "senior",
            gender: "Female",
            size: "Small",
            weight: "9 lbs",
            color: "Cream & Brown",
            description: "Mittens is a dignified senior Siamese cat looking for a quiet retirement home. She's calm, affectionate, and loves to nap in sunny spots. Mittens would prefer to be the only pet and would do best in a peaceful environment.",
            image: "https://images.unsplash.com/photo-1513245543132-31f507417b26?w=500&h=400&fit=crop",
            adoption_fee: 50,
            vaccinated: true,
            spayed_neutered: true,
            microchipped: true,
            house_trained: true,
            good_with_kids: false,
            good_with_dogs: false,
            good_with_cats: false,
            energy_level: "Low",
            featured: false,
            tags: ["Senior", "Calm", "Independent"]
        },
        {
            id: 8,
            name: "Rocky",
            species: "Dog",
            breed: "German Shepherd",
            age: "3 years",
            ageCategory: "adult",
            gender: "Male",
            size: "Large",
            weight: "80 lbs",
            color: "Black & Tan",
            description: "Rocky is an intelligent and loyal German Shepherd. He's well-trained and knows many commands. Rocky would make an excellent companion for someone looking for a protective and devoted friend. He needs an experienced owner who can provide structure and exercise.",
            image: "https://images.unsplash.com/photo-1568393691622-c7ba131d63b4?w=500&h=400&fit=crop",
            adoption_fee: 280,
            vaccinated: true,
            spayed_neutered: true,
            microchipped: true,
            house_trained: true,
            good_with_kids: true,
            good_with_dogs: false,
            good_with_cats: false,
            energy_level: "High",
            featured: false,
            tags: ["Intelligent", "Loyal", "Protective"]
        }
    ];

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

    // ============================================
    // INITIALIZATION
    // ============================================

    function init() {
        loadPets();
        setupEventListeners();
    }

    // ============================================
    // PET MANAGEMENT
    // ============================================

    function loadPets() {
        showLoading();
        
        // Simulate API call delay
        setTimeout(() => {
            state.pets = demoPets;
            state.filteredPets = demoPets;
            renderPets();
            hideLoading();
        }, 1000);
    }

    function renderPets() {
        const grid = document.getElementById('petsGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (!grid) return;

        if (state.filteredPets.length === 0) {
            grid.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        grid.innerHTML = state.filteredPets.map(pet => `
            <div class="pet-card" onclick="showPetDetails(${pet.id})">
                <div style="position: relative;">
                    <img src="${pet.image}" alt="${pet.name}" class="pet-image">
                    ${pet.featured ? '<div class="pet-featured-badge">Featured</div>' : ''}
                </div>
                <div class="pet-details">
                    <h3 class="pet-name">${pet.name}</h3>
                    <p class="pet-breed">${pet.breed} • ${pet.species}</p>
                    
                    <div class="pet-info-row">
                        <div class="pet-info-item">
                            <i class="bi bi-calendar"></i>
                            <span>${pet.age}</span>
                        </div>
                        <div class="pet-info-item">
                            <i class="bi bi-gender-${pet.gender.toLowerCase() === 'male' ? 'male' : 'female'}"></i>
                            <span>${pet.gender}</span>
                        </div>
                        <div class="pet-info-item">
                            <i class="bi bi-rulers"></i>
                            <span>${pet.size}</span>
                        </div>
                    </div>

                    <p class="pet-description">${pet.description}</p>

                    <div class="pet-tags">
                        ${pet.tags.map(tag => `<span class="pet-tag">${tag}</span>`).join('')}
                    </div>

                    <div class="pet-footer">
                        <div class="pet-price">$${pet.adoption_fee}</div>
                        <button class="btn-adopt" onclick="event.stopPropagation(); showPetDetails(${pet.id})">
                            <i class="bi bi-heart"></i> Adopt Me
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // ============================================
    // FILTERING
    // ============================================

    window.filterPets = function() {
        const species = document.getElementById('filterSpecies').value;
        const size = document.getElementById('filterSize').value;
        const age = document.getElementById('filterAge').value;
        const gender = document.getElementById('filterGender').value;

        state.filteredPets = state.pets.filter(pet => {
            if (species && pet.species !== species) return false;
            if (size && pet.size !== size) return false;
            if (age && pet.ageCategory !== age) return false;
            if (gender && pet.gender !== gender) return false;
            return true;
        });

        renderPets();
    };

    window.clearFilters = function() {
        document.getElementById('filterSpecies').value = '';
        document.getElementById('filterSize').value = '';
        document.getElementById('filterAge').value = '';
        document.getElementById('filterGender').value = '';
        
        state.filteredPets = state.pets;
        renderPets();
    };

    // ============================================
    // PET DETAILS
    // ============================================

    window.showPetDetails = function(petId) {
        const pet = state.pets.find(p => p.id === petId);
        if (!pet) return;

        state.selectedPet = pet;

        const modalBody = document.getElementById('petDetailBody');
        if (!modalBody) return;

        modalBody.innerHTML = `
            <img src="${pet.image}" alt="${pet.name}" class="modal-pet-image">
            
            <div class="detail-section">
                <h5>About ${pet.name}</h5>
                <p>${pet.description}</p>
            </div>

            <div class="detail-section">
                <h5>Basic Information</h5>
                <div class="info-grid">
                    <div class="info-item">
                        <i class="bi bi-tag"></i>
                        <div>
                            <div class="info-label">Species</div>
                            <div class="info-value">${pet.species}</div>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="bi bi-heart-pulse"></i>
                        <div>
                            <div class="info-label">Breed</div>
                            <div class="info-value">${pet.breed}</div>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="bi bi-calendar"></i>
                        <div>
                            <div class="info-label">Age</div>
                            <div class="info-value">${pet.age}</div>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="bi bi-gender-${pet.gender.toLowerCase() === 'male' ? 'male' : 'female'}"></i>
                        <div>
                            <div class="info-label">Gender</div>
                            <div class="info-value">${pet.gender}</div>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="bi bi-rulers"></i>
                        <div>
                            <div class="info-label">Size</div>
                            <div class="info-value">${pet.size}</div>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="bi bi-speedometer2"></i>
                        <div>
                            <div class="info-label">Weight</div>
                            <div class="info-value">${pet.weight}</div>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="bi bi-palette"></i>
                        <div>
                            <div class="info-label">Color</div>
                            <div class="info-value">${pet.color}</div>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="bi bi-lightning"></i>
                        <div>
                            <div class="info-label">Energy Level</div>
                            <div class="info-value">${pet.energy_level}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h5>Health & Training</h5>
                <div class="info-grid">
                    <div class="info-item">
                        <i class="bi bi-${pet.vaccinated ? 'check-circle-fill text-success' : 'x-circle-fill text-danger'}"></i>
                        <div>
                            <div class="info-label">Vaccinated</div>
                            <div class="info-value">${pet.vaccinated ? 'Yes' : 'No'}</div>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="bi bi-${pet.spayed_neutered ? 'check-circle-fill text-success' : 'x-circle-fill text-danger'}"></i>
                        <div>
                            <div class="info-label">Spayed/Neutered</div>
                            <div class="info-value">${pet.spayed_neutered ? 'Yes' : 'No'}</div>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="bi bi-${pet.microchipped ? 'check-circle-fill text-success' : 'x-circle-fill text-danger'}"></i>
                        <div>
                            <div class="info-label">Microchipped</div>
                            <div class="info-value">${pet.microchipped ? 'Yes' : 'No'}</div>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="bi bi-${pet.house_trained ? 'check-circle-fill text-success' : 'x-circle-fill text-danger'}"></i>
                        <div>
                            <div class="info-label">House Trained</div>
                            <div class="info-value">${pet.house_trained ? 'Yes' : 'No'}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h5>Compatibility</h5>
                <div class="info-grid">
                    <div class="info-item">
                        <i class="bi bi-${pet.good_with_kids ? 'check-circle-fill text-success' : 'x-circle-fill text-danger'}"></i>
                        <div>
                            <div class="info-label">Good with Kids</div>
                            <div class="info-value">${pet.good_with_kids ? 'Yes' : 'No'}</div>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="bi bi-${pet.good_with_dogs ? 'check-circle-fill text-success' : 'x-circle-fill text-danger'}"></i>
                        <div>
                            <div class="info-label">Good with Dogs</div>
                            <div class="info-value">${pet.good_with_dogs ? 'Yes' : 'No'}</div>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="bi bi-${pet.good_with_cats ? 'check-circle-fill text-success' : 'x-circle-fill text-danger'}"></i>
                        <div>
                            <div class="info-label">Good with Cats</div>
                            <div class="info-value">${pet.good_with_cats ? 'Yes' : 'No'}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="alert alert-info">
                <i class="bi bi-info-circle"></i>
                <strong>Adoption Fee: $${pet.adoption_fee}</strong> - This fee helps cover veterinary care, food, and shelter costs.
            </div>
        `;

        const modal = new bootstrap.Modal(document.getElementById('petDetailModal'));
        modal.show();
    };

    // ============================================
    // ADOPTION PROCESS
    // ============================================

    window.startAdoptionProcess = function() {
        if (!state.selectedPet) return;

        // Close detail modal
        const detailModal = bootstrap.Modal.getInstance(document.getElementById('petDetailModal'));
        if (detailModal) detailModal.hide();

        // Reset form
        state.currentStep = 1;
        state.adoptionFormData = {};
        document.getElementById('adoptionForm').reset();
        document.getElementById('selectedPetId').value = state.selectedPet.id;

        // Render payment methods
        renderPaymentMethods();

        // Update UI
        updateAdoptionSteps();
        updateAdoptionNavigation();

        // Show adoption modal
        const adoptionModal = new bootstrap.Modal(document.getElementById('adoptionFormModal'));
        adoptionModal.show();
    };

    function renderPaymentMethods() {
        const container = document.getElementById('paymentMethodsContainer');
        if (!container) return;

        container.innerHTML = demoPaymentMethods.map(method => `
            <div class="payment-method" data-method="${method.type}" onclick="selectPaymentMethod('${method.type}')">
                <i class="${method.icon}"></i>
                <div class="method-name">${method.name}</div>
            </div>
        `).join('');
    }

    window.selectPaymentMethod = function(method) {
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
        hideAllPaymentForms();

        if (method === 'credit_card') {
            document.getElementById('creditCardForm').style.display = 'block';
        } else if (method === 'paypal') {
            showPayPalInfo();
        } else if (method === 'bank_transfer') {
            showBankTransferInfo();
        } else if (method === 'crypto') {
            showCryptoInfo();
        }
    };

    function hideAllPaymentForms() {
        document.getElementById('creditCardForm').style.display = 'none';
        document.getElementById('paypalContainer').style.display = 'none';
        document.getElementById('wireTransferDetails').style.display = 'none';
        document.getElementById('cryptoDetails').style.display = 'none';
    }

    function showPayPalInfo() {
        const container = document.getElementById('paypalContainer');
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="fab fa-paypal"></i>
                You will be redirected to PayPal to complete the payment securely.
            </div>
            <div id="paypalButtonContainer" style="min-height: 150px; display: flex; align-items: center; justify-content: center; background: #f8f9fa; border-radius: 8px;">
                <div style="text-align: center;">
                    <i class="fab fa-paypal" style="font-size: 48px; color: #0070ba; margin-bottom: 10px;"></i>
                    <p style="color: #666; margin: 0;">PayPal integration would appear here</p>
                </div>
            </div>
        `;
        container.style.display = 'block';
    }

    function showBankTransferInfo() {
        const container = document.getElementById('wireTransferDetails');
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-university"></i>
                <strong>Bank Transfer Instructions</strong>
            </div>
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0;">
                <p><strong>Bank Name:</strong> Global PetPal Community Bank</p>
                <p><strong>Account Name:</strong> Global PetPal Foundation</p>
                <p><strong>Account Number:</strong> 1234567890</p>
                <p><strong>Routing Number:</strong> 021000021</p>
                <p><strong>SWIFT Code:</strong> GPPCUS33</p>
                <p><strong>Reference:</strong> ADOPTION-${state.selectedPet?.id || ''}-${Date.now()}</p>
            </div>
            <div class="alert alert-warning mt-3">
                <i class="fas fa-exclamation-triangle"></i>
                Please include the reference number in your transfer.
            </div>
        `;
        container.style.display = 'block';
    }

    function showCryptoInfo() {
        const container = document.getElementById('cryptoDetails');
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="fab fa-bitcoin"></i>
                <strong>Cryptocurrency Payment</strong>
            </div>
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0; text-align: center;">
                <h5>Bitcoin (BTC)</h5>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa" alt="QR Code" style="max-width: 200px; margin: 15px auto; border: 2px solid #e0e0e0; border-radius: 8px; padding: 10px;">
                <div class="wallet-address">1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa</div>
                <button type="button" class="btn btn-sm btn-primary" onclick="copyToClipboard('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')">
                    <i class="fas fa-copy"></i> Copy Address
                </button>
            </div>
        `;
        container.style.display = 'block';
    }

    window.copyToClipboard = function(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('Address copied to clipboard!');
        });
    };

    // ============================================
    // STEP NAVIGATION
    // ============================================

    function setupEventListeners() {
        const nextBtn = document.getElementById('adoptionNextBtn');
        const prevBtn = document.getElementById('adoptionPrevBtn');
        const submitBtn = document.getElementById('adoptionSubmitBtn');

        if (nextBtn) {
            nextBtn.addEventListener('click', nextAdoptionStep);
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', prevAdoptionStep);
        }

        if (submitBtn) {
            submitBtn.addEventListener('click', submitAdoptionForm);
        }

        // Setup card formatting
        setupCardFormatting();
    }

    function nextAdoptionStep() {
        if (!validateAdoptionStep()) {
            return;
        }

        if (state.currentStep < state.totalSteps) {
            state.currentStep++;
            updateAdoptionSteps();
            updateAdoptionNavigation();

            if (state.currentStep === 3) {
                updateReviewSummary();
            }
        }
    }

    function prevAdoptionStep() {
        if (state.currentStep > 1) {
            state.currentStep--;
            updateAdoptionSteps();
            updateAdoptionNavigation();
        }
    }

    function updateAdoptionSteps() {
        // Hide all steps
        document.querySelectorAll('.adoption-form-step').forEach(step => {
            step.classList.remove('active');
        });

        // Show current step
        const currentStepElement = document.querySelector(`.adoption-form-step[data-step="${state.currentStep}"]`);
        if (currentStepElement) {
            currentStepElement.classList.add('active');
        }

        // Update progress indicators
        document.querySelectorAll('.adoption-step').forEach(step => {
            const stepNumber = parseInt(step.dataset.step);
            step.classList.remove('active', 'completed');

            if (stepNumber === state.currentStep) {
                step.classList.add('active');
            } else if (stepNumber < state.currentStep) {
                step.classList.add('completed');
            }
        });
    }

    function updateAdoptionNavigation() {
        const prevBtn = document.getElementById('adoptionPrevBtn');
        const nextBtn = document.getElementById('adoptionNextBtn');
        const submitBtn = document.getElementById('adoptionSubmitBtn');

        if (prevBtn) {
            prevBtn.style.display = state.currentStep > 1 ? 'block' : 'none';
        }

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

    function validateAdoptionStep() {
        switch(state.currentStep) {
            case 1:
                return validatePersonalInfo();
            case 2:
                return validatePaymentInfo();
            default:
                return true;
        }
    }

    function validatePersonalInfo() {
        const name = document.getElementById('adopterName').value.trim();
        const email = document.getElementById('adopterEmail').value.trim();
        const phone = document.getElementById('adopterPhone').value.trim();
        const homeType = document.getElementById('homeType').value;
        const address = document.getElementById('adopterAddress').value.trim();
        const experience = document.getElementById('experienceLevel').value;
        const reason = document.getElementById('reasonForAdoption').value.trim();

        if (!name || !email || !phone || !homeType || !address || !experience || !reason) {
            showError('Please fill in all required fields');
            return false;
        }

        if (!isValidEmail(email)) {
            showError('Please enter a valid email address');
            return false;
        }

        return true;
    }

    function validatePaymentInfo() {
        if (!state.selectedPaymentMethod) {
            showError('Please select a payment method');
            return false;
        }

        if (state.selectedPaymentMethod === 'credit_card') {
            return validateCreditCard();
        }

        return true;
    }

    function validateCreditCard() {
        const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
        const cardName = document.getElementById('cardName').value.trim();
        const cardExpiry = document.getElementById('cardExpiry').value;
        const cardCVV = document.getElementById('cardCVV').value;

        if (cardNumber.length < 13) {
            showError('Please enter a valid card number');
            return false;
        }

        if (!cardName) {
            showError('Please enter the cardholder name');
            return false;
        }

        if (cardExpiry.length !== 5) {
            showError('Please enter a valid expiry date');
            return false;
        }

        if (cardCVV.length < 3) {
            showError('Please enter a valid CVV');
            return false;
        }

        return true;
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // ============================================
    // CREDIT CARD FORMATTING
    // ============================================

    function setupCardFormatting() {
        const cardNumberInput = document.getElementById('cardNumber');
        const cardExpiryInput = document.getElementById('cardExpiry');
        const cardCVVInput = document.getElementById('cardCVV');

        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\s/g, '');
                let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
                e.target.value = formattedValue;

                const cardType = detectCardType(value);
                updateCardIcon(cardType);

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
            });
        }

        if (cardCVVInput) {
            cardCVVInput.addEventListener('input', function(e) {
                e.target.value = e.target.value.replace(/\D/g, '');
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

    function updateCardIcon(cardType) {
        const iconElement = document.getElementById('cardTypeIcon');
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
    // REVIEW SUMMARY
    // ============================================

    function updateReviewSummary() {
        if (!state.selectedPet) return;

        document.getElementById('reviewPetName').textContent = `${state.selectedPet.name} (${state.selectedPet.breed})`;
        document.getElementById('reviewAdoptionFee').textContent = `$${state.selectedPet.adoption_fee}`;
        document.getElementById('reviewName').textContent = document.getElementById('adopterName').value;
        document.getElementById('reviewEmail').textContent = document.getElementById('adopterEmail').value;
        document.getElementById('reviewPhone').textContent = document.getElementById('adopterPhone').value;

        const paymentMethodName = demoPaymentMethods.find(pm => pm.type === state.selectedPaymentMethod)?.name || '-';
        document.getElementById('reviewPaymentMethod').textContent = paymentMethodName;
    }

    // ============================================
    // FORM SUBMISSION
    // ============================================

    function submitAdoptionForm() {
        const formData = {
            pet_id: state.selectedPet.id,
            pet_name: state.selectedPet.name,
            adoption_fee: state.selectedPet.adoption_fee,
            adopter_name: document.getElementById('adopterName').value,
            adopter_email: document.getElementById('adopterEmail').value,
            adopter_phone: document.getElementById('adopterPhone').value,
            home_type: document.getElementById('homeType').value,
            address: document.getElementById('adopterAddress').value,
            has_other_pets: document.getElementById('hasOtherPets').checked,
            has_children: document.getElementById('hasChildren').checked,
            has_yard: document.getElementById('hasYard').checked,
            experience_level: document.getElementById('experienceLevel').value,
            reason_for_adoption: document.getElementById('reasonForAdoption').value,
            payment_method: state.selectedPaymentMethod,
            timestamp: new Date().toISOString()
        };

        console.log('Submitting adoption application:', formData);

        // Simulate submission
        setTimeout(() => {
            showSuccess();
            
            // Close adoption modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('adoptionFormModal'));
            if (modal) modal.hide();
        }, 1500);
    }

    // ============================================
    // UI FEEDBACK
    // ============================================

    function showLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.style.display = 'block';
    }

    function hideLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.style.display = 'none';
    }

    function showSuccess() {
        const modal = new bootstrap.Modal(document.getElementById('successModal'));
        const message = document.getElementById('successMessage');
        
        if (message && state.selectedPet) {
            message.textContent = `Your adoption application for ${state.selectedPet.name} has been received! We'll review it and contact you within 24-48 hours at ${document.getElementById('adopterEmail').value}.`;
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

    // ============================================
    // AUTO-INITIALIZE
    // ============================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();