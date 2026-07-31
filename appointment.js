/* =========================================
   ONLINE APPOINTMENT BOOKING SYSTEM
   ========================================= */

class AppointmentBooking {
    constructor() {
        this.currentStep = 1;
        this.bookingData = {};
        this.selectedDate = null;
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.init();
    }

    init() {
        this.attachEvents();
        this.renderCalendar();
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

        // Calendar navigation
        const prevMonth = document.getElementById('prevMonth');
        const nextMonth = document.getElementById('nextMonth');
        if (prevMonth) prevMonth.addEventListener('click', () => this.changeMonth(-1));
        if (nextMonth) nextMonth.addEventListener('click', () => this.changeMonth(1));

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
            if (!this.selectedDate) {
                alert('Please select a date');
                return false;
            }
            const time = document.querySelector('input[name="time"]:checked');
            if (!time) {
                alert('Please select a time slot');
                return false;
            }
            this.bookingData.date = this.selectedDate;
            this.bookingData.time = time.value;
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

    changeMonth(direction) {
        this.currentMonth += direction;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        } else if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.renderCalendar();
    }

    renderCalendar() {
        const grid = document.getElementById('calendarGrid');
        if (!grid) return;

        const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        document.getElementById('currentMonth').textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;

        const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        const today = new Date();

        let html = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => 
            `<div class="calendar-day-header">${d}</div>`
        ).join('');

        for (let i = 0; i < firstDay; i++) {
            html += '<div class="calendar-day"></div>';
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(this.currentYear, this.currentMonth, day);
            const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const isSunday = date.getDay() === 0;
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = this.selectedDate && date.toDateString() === this.selectedDate.toDateString();
            
            const classes = ['calendar-day'];
            if (isPast || isSunday) classes.push('disabled');
            if (isToday) classes.push('today');
            if (isSelected) classes.push('selected');

            html += `<div class="${classes.join(' ')}" data-date="${date.toISOString()}">${day}</div>`;
        }

        grid.innerHTML = html;

        grid.querySelectorAll('.calendar-day:not(.disabled)').forEach(day => {
            day.addEventListener('click', () => {
                grid.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                day.classList.add('selected');
                this.selectedDate = new Date(day.dataset.date);
            });
        });
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

        const dateStr = this.selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        });

        const timeStr = new Date(`2000-01-01T${this.bookingData.time}`).toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit', hour12: true
        });

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