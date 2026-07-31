/* =========================================
   APPOINTMENT BOOKING SYSTEM - FIXED
   ========================================= */

class AppointmentBooking {
    constructor() {
        this.currentStep = 1;
        this.bookingData = {};
        this.init();
    }

    init() {
        this.attachEvents();
    }

    attachEvents() {
        // Step navigation
        document.querySelectorAll('.next-step').forEach(btn => {
            btn.addEventListener('click', () => {
                const nextStep = parseInt(btn.dataset.next);
                if (this.validateStep(this.currentStep)) {
                    this.goToStep(nextStep);
                }
            });
        });

        document.querySelectorAll('.prev-step').forEach(btn => {
            btn.addEventListener('click', () => {
                this.goToStep(parseInt(btn.dataset.prev));
            });
        });

        // Form submission
        const form = document.getElementById('bookingForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitBooking();
            });
        }
    }

    goToStep(step) {
        document.querySelectorAll('.booking-step').forEach(s => s.classList.add('hidden'));
        document.getElementById(`step${step}`).classList.remove('hidden');
        
        document.querySelectorAll('.step').forEach(s => {
            const stepNum = parseInt(s.dataset.step);
            s.classList.remove('active', 'completed');
            if (stepNum < step) s.classList.add('completed');
            if (stepNum === step) s.classList.add('active');
        });

        this.currentStep = step;

        if (step === 4) this.renderSummary();
    }

    validateStep(step) {
        if (step === 1) {
            const service = document.querySelector('input[name="service"]:checked');
            if (!service) {
                alert('Please select a service');
                return false;
            }
            this.bookingData.service = service.value;
            return true;
        }
        
        if (step === 2) {
            const dateInput = document.querySelector('input[name="appointmentDate"]');
            const timeSelect = document.querySelector('select[name="appointmentTime"]');
            
            if (!dateInput || !dateInput.value) {
                alert('Please select a date');
                return false;
            }
            
            if (!timeSelect || !timeSelect.value) {
                alert('Please select a time');
                return false;
            }
            
            this.bookingData.date = dateInput.value;
            this.bookingData.time = timeSelect.value;
            return true;
        }
        
        if (step === 3) {
            const form = document.getElementById('step3');
            const required = form.querySelectorAll('[required]');
            for (let field of required) {
                if (!field.value) {
                    alert('Please fill in all required fields');
                    return false;
                }
            }
            this.bookingData.patient = {
                fullName: form.querySelector('[name="fullName"]').value,
                phone: form.querySelector('[name="phone"]').value,
                email: form.querySelector('[name="email"]').value,
                dob: form.querySelector('[name="dob"]').value,
                address: form.querySelector('[name="address"]').value,
                doctor: form.querySelector('[name="doctor"]').value,
                notes: form.querySelector('[name="notes"]').value
            };
            return true;
        }
        return true;
    }

    renderSummary() {
        const summary = document.getElementById('bookingSummary');
        if (!summary) return;

        const serviceNames = {
            'prenatal': 'Prenatal Checkup',
            'normal-delivery': 'Normal Delivery',
            'cesarean': 'Cesarean Section',
            'pediatric': 'Pediatric Care',
            'obgyn': 'OB-GYN Consultation',
            'postpartum': 'Postpartum Care'
        };

        const doctorNames = {
            'any': 'Any Available',
            'castillo': 'Dr. Evalyn Rivera-Castillo',
            'sinsay': 'Dr. Elli Sinsay'
        };

        // Format date nicely
        const dateObj = new Date(this.bookingData.date);
        const dateStr = dateObj.toLocaleDateString('en-US', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        });

        // Format time nicely
        const timeStr = this.bookingData.time;

        summary.innerHTML = `
            <div class="summary-item"><strong>Service:</strong> <span>${serviceNames[this.bookingData.service]}</span></div>
            <div class="summary-item"><strong>Date:</strong> <span>${dateStr}</span></div>
            <div class="summary-item"><strong>Time:</strong> <span>${timeStr}</span></div>
            <div class="summary-item"><strong>Patient:</strong> <span>${this.bookingData.patient.fullName}</span></div>
            <div class="summary-item"><strong>Phone:</strong> <span>${this.bookingData.patient.phone}</span></div>
            <div class="summary-item"><strong>Doctor:</strong> <span>${doctorNames[this.bookingData.patient.doctor]}</span></div>
            ${this.bookingData.patient.notes ? `<div class="summary-item"><strong>Notes:</strong> <span>${this.bookingData.patient.notes}</span></div>` : ''}
        `;
    }

    async submitBooking() {
        try {
            // In production: await fetch('/api/appointments', { method: 'POST', body: JSON.stringify(this.bookingData) });
            console.log('Booking submitted:', this.bookingData);
            
            alert('✓ Appointment booked successfully!\n\nYou will receive a confirmation via SMS/email within 24 hours.\n\nReference: ERS-' + Date.now().toString().slice(-6));
            
            // Redirect to home after 3 seconds
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
        } catch (error) {
            console.error('Booking failed:', error);
            alert('Booking failed. Please try again or call us at +63 970 471 6507.');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('bookingForm')) {
        window.booking = new AppointmentBooking();
    }
});
